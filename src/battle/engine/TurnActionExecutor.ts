import { BattlePokemon, BattleState } from "./types.js";
import { MoveData, MOVES_DATA, getMoveData } from "../../data/movesKo.js";
import { validateAction } from "../mechanics/actionValidator.js";
import { checkMoveHit } from "../mechanics/accuracyEngine.js";
import { calculateDamage } from "../mechanics/damageCalculator.js";
import { isSelfTargetStatusMove, executeStatusMove } from "../moves/traits/specialStatusRegistry.js";
import { applySecondaryAttackEffects } from "../mechanics/secondaryEffects.js";
import { getMoveTrait } from "../moves/traits/moveTraits.js";
import { checkSemiInvulnerableVulnerability } from "../mechanics/vulnerabilityRules.js";

export interface SingleActionResult {
  log: string;
  damage: number;
  typeMod?: number;
  hitCount?: number;
  isSuperEffective?: boolean;
  canAct?: boolean;
  copiedMoveKey?: string;
  isHeal?: boolean;
  presentOutcome?: "heal" | "damage";
}

function hasConfusionImmunity(pokemon: BattlePokemon): boolean {
  const ab = pokemon.ability?.toLowerCase().replace(/[\s_-]+/g, "");
  const pass = pokemon.passiveAbility?.toLowerCase().replace(/[\s_-]+/g, "");
  return ab === "owntempo" || pass === "owntempo";
}

/**
 * Executes a single combat action (attack or status move) for one actor against a target.
 */
export function executeSingleAction(
  actor: BattlePokemon,
  target: BattlePokemon,
  move: MoveData,
  isActorPlayer: boolean,
  isKo: boolean,
  battle?: BattleState
): SingleActionResult {
  const actualMove: MoveData = typeof move === "string"
    ? (getMoveData(move) || MOVES_DATA[move] || MOVES_DATA["tackle"])
    : move;
  const actorName = isKo ? (actor.nameKo || actor.name) : (actor.name || actor.nameKo);
  const targetName = isKo ? (target.nameKo || target.name) : (target.name || target.nameKo);
  const moveName = isKo ? (actualMove.nameKo || actualMove.name) : actualMove.name.toUpperCase();
  const moveKey = actualMove.name.toLowerCase().replace(/[\s_]+/g, "-");
  move = actualMove;

  // 1. Action Validation (Recharge, Flinch, Sleep, Freeze, Paralysis, Attract, Confusion, Taunt, Disable)
  const validation = validateAction(actor, move, actorName, moveName, isKo);
  if (!validation.canAct) {
    if (actor.chargingMove) {
      actor.chargingMove = null;
      actor.isSemiInvulnerable = false;
      actor.semiInvulnerableState = null;
      actor.bideDamageTaken = 0;
    }
    if (actor.rampageState) {
      actor.rampageState = null;
      if (!actor.isConfused && !hasConfusionImmunity(actor)) {
        actor.isConfused = true;
        actor.confusionTurns = Math.floor(Math.random() * 4) + 2;
      }
    }
    if (actor.rolloutState) {
      actor.rolloutState = null;
    }
    if (actor.furyCutterStreak) {
      actor.furyCutterStreak = 0;
    }
    return { log: validation.log || "", damage: 0, canAct: false };
  }
  const validationPrefix = validation.log ? `${validation.log}\n` : "";

  // If the actor had Destiny Bond active from a previous turn, starting a new action removes the effect
  if (actor.isDestinyBond) {
    actor.isDestinyBond = false;
  }

  // First-turn-only moves restriction (속이기 Fake Out, 만나자마자 First Impression)
  const isFirstTurnMove = [
    "fake-out", "fakeout", "fake_out", "252", "속이기",
    "first-impression", "firstimpression", "만나자마자"
  ].includes(moveKey) || move.id === 252 || move.nameKo === "속이기";

  if (isFirstTurnMove && (actor.turnsOnField ?? 0) > 0) {
    return {
      log: isKo
        ? `${validationPrefix}${actorName}의 ${moveName}!\n하지만 기술은 실패했다!`
        : `${validationPrefix}${actorName}'s ${moveName}!\nBut it failed!`,
      damage: 0,
      canAct: false,
    };
  }

  // 2. Dynamic Move Callers & Delegations
  let activeMove = move;
  let metronomePrefix = "";
  let metronomeMoveKey: string | undefined = undefined;
  let copiedMoveKey: string | undefined = undefined;
  let mimicPrefix = "";
  let mirrorPrefix = "";
  let sleepTalkPrefix = "";
  let sleepTalkMoveKey: string | undefined = undefined;
  let naturePowerPrefix = "";
  let naturePowerMoveKey: string | undefined = undefined;
  let assistPrefix = "";
  let assistMoveKey: string | undefined = undefined;
  const isSleepTalkMove = (
    moveKey === "sleep-talk" ||
    moveKey === "sleeptalk" ||
    moveKey === "214" ||
    move.nameKo === "잠꼬대"
  );

  const withPrefix = (res: SingleActionResult): SingleActionResult => {
    actor.lastMoveUsed = moveKey;
    const isMindReaderMove = [
      "mind-reader", "mindreader", "lock-on", "lockon", "170", "199", "마음의눈", "록온"
    ].includes(moveKey) || ["마음의눈", "록온"].includes(activeMove.nameKo || "");
    if (!isMindReaderMove && actor.mindReaderTargetId) {
      actor.mindReaderTargetId = null;
      actor.mindReaderTurnsLeft = 0;
    }
    // If called via Sleep Talk, Rampage and Rollout lock states do not persist
    if (isSleepTalkMove) {
      if (actor.rampageState) actor.rampageState = null;
      if (actor.rolloutState) actor.rolloutState = null;
    }
    return {
      ...res,
      log: `${validationPrefix}${metronomePrefix}${mimicPrefix}${mirrorPrefix}${sleepTalkPrefix}${naturePowerPrefix}${assistPrefix}${res.log}`,
      copiedMoveKey: res.copiedMoveKey ?? assistMoveKey ?? sleepTalkMoveKey ?? naturePowerMoveKey ?? metronomeMoveKey ?? copiedMoveKey,
    };
  };

  // 2-1. Metronome (손가락흔들기) resolution
  const isMetronomeMove = (
    moveKey === "metronome" ||
    moveKey === "118" ||
    move.nameKo === "손가락흔들기"
  );

  if (isMetronomeMove) {
    const bannedKeys = new Set(["metronome", "struggle", "118", "165", "sleep-talk", "sleeptalk", "214", "잠꼬대", "assist", "274", "조수"]);
    const allCandidateKeys = Object.keys(MOVES_DATA).filter(k => !bannedKeys.has(k.toLowerCase()));
    const randomKey = allCandidateKeys[Math.floor(Math.random() * allCandidateKeys.length)] || "tackle";
    const selectedMoveData = MOVES_DATA[randomKey] || MOVES_DATA["tackle"];
    if (selectedMoveData) {
      metronomeMoveKey = selectedMoveData.name.toLowerCase().replace(/[\s_]+/g, "-");
      activeMove = selectedMoveData;
      const selectedKo = selectedMoveData.nameKo || metronomeMoveKey;
      const selectedEn = (selectedMoveData.name || metronomeMoveKey).toUpperCase();
      metronomePrefix = isKo
        ? `${actorName}의 손가락흔들기!\n손가락을 흔들어 ${selectedKo}(이)가 튀어나왔다!\n`
        : `${actorName} used METRONOME!\nWagging a finger stimulated its brain to unleash ${selectedEn}!\n`;
    }
  }

  // 2-2. Mimic / Copycat (흉내쟁이 / 흉내내기) resolution
  const isMimicMove = (
    moveKey === "mimic" ||
    moveKey === "copycat" ||
    moveKey === "102" ||
    moveKey === "383" ||
    move.nameKo === "흉내쟁이" ||
    move.nameKo === "흉내내기"
  );

  if (isMimicMove) {
    let candidateKey = target.lastMoveUsed || battle?.lastMoveEffect?.moveKey;
    if (!candidateKey || candidateKey === "mimic" || candidateKey === "copycat") {
      if (target.moves && target.moves.length > 0) {
        candidateKey = target.moves.find(m => m !== "mimic" && m !== "copycat") || "tackle";
      } else {
        candidateKey = "tackle";
      }
    }

    const copiedMoveData = getMoveData(candidateKey) || MOVES_DATA[candidateKey] || MOVES_DATA["tackle"];
    if (copiedMoveData) {
      copiedMoveKey = candidateKey.toLowerCase().replace(/[\s_]+/g, "-");
      activeMove = copiedMoveData;
      const copiedKo = copiedMoveData.nameKo || copiedMoveKey;
      const copiedEn = (copiedMoveData.name || copiedMoveKey).toUpperCase();
      mimicPrefix = isKo
        ? `${actorName}의 흉내쟁이!\n${actorName}(은)는 상대의 ${copiedKo}(을)를 따라했다!\n`
        : `${actorName}'s COPYCAT!\n${actorName} mimicked ${targetName}'s ${copiedEn}!\n`;
    }
  }

  // 2-3. Mirror Move (따라하기) resolution
  const isMirrorMove = (
    moveKey === "mirror-move" ||
    moveKey === "mirrormove" ||
    moveKey === "119" ||
    move.nameKo === "따라하기"
  );

  if (isMirrorMove) {
    let candidateKey = target.lastMoveUsed || battle?.lastMoveEffect?.moveKey;
    if (!candidateKey || candidateKey === "mirror-move" || candidateKey === "mirrormove") {
      if (target.moves && target.moves.length > 0) {
        candidateKey = target.moves.find(m => m !== "mirror-move" && m !== "mirrormove") || "flamethrower";
      } else {
        candidateKey = "flamethrower";
      }
    }

    const copiedMoveData = getMoveData(candidateKey) || MOVES_DATA[candidateKey] || MOVES_DATA["flamethrower"] || MOVES_DATA["tackle"];
    if (copiedMoveData) {
      copiedMoveKey = candidateKey.toLowerCase().replace(/[\s_]+/g, "-");
      activeMove = copiedMoveData;
      const copiedKo = copiedMoveData.nameKo || copiedMoveKey;
      const copiedEn = (copiedMoveData.name || copiedMoveKey).toUpperCase();
      mirrorPrefix = isKo
        ? `${actorName}의 따라하기!\n${actorName}(은)는 상대의 ${copiedKo}(을)를 흉내 냈다!\n`
        : `${actorName} used MIRROR MOVE!\n${actorName} mirrored ${targetName}'s ${copiedEn}!\n`;
    }
  }

  // 2-4. Sleep Talk (잠꼬대) resolution
  if (isSleepTalkMove) {
    if (actor.status !== "slp") {
      return withPrefix({
        log: isKo
          ? `${actorName}의 잠꼬대!\n하지만 잠들어 있지 않아 실패했다!`
          : `${actorName} used SLEEP TALK!\nBut it failed because ${actorName} is not asleep!`,
        damage: 0,
      });
    }

    const BANNED_SLEEP_TALK_KEYS = new Set([
      "sleep-talk", "sleeptalk", "214", "잠꼬대",
      "assist", "274", "조수",
      "bide", "117", "참기",
      "metronome", "118", "손가락흔들기",
      "mimic", "102", "흉내내기",
      "mirror-move", "mirrormove", "119", "따라하기",
      "copycat", "383", "흉내쟁이",
      "nature-power", "naturepower", "267", "자연의힘",
      "sketch", "166", "스케치",
      "struggle", "165", "발버둥",
      "focus-punch", "focuspunch", "264", "힘껏펀치",
      "uproar", "253", "소란피우기",
      "belch", "chatter", "celebrate", "hold-hands", "me-first", "shell-trap", "beak-blast", "dynamax-cannon",
      "blazing-torque", "combat-torque", "magical-torque", "noxious-torque", "wicked-torque",
      "solar-beam", "solarbeam", "76", "솔라빔",
      "solar-blade", "solarblade", "솔라블레이드",
      "fly", "19", "공중날기",
      "dig", "91", "구멍파기",
      "dive", "291", "다이빙",
      "bounce", "340", "뛰어오르다",
      "skull-bash", "skullbash", "130", "로켓박치기",
      "razor-wind", "razorwind", "13", "바람일으키기",
      "sky-attack", "skyattack", "143", "불새",
      "shadow-force", "shadowforce", "467", "섀도다이브",
      "phantom-force", "phantomforce", "566", "고스트다이브",
      "freeze-shock", "freezeshock", "프리즈볼트",
      "ice-burn", "iceburn", "콜드플레어",
      "geomancy", "지오컨트롤",
      "meteor-beam", "meteorbeam", "메테오빔",
      "electro-shot", "electroshot", "일렉트로빔",
    ]);

    const knownMoves = actor.moves || [];
    const eligibleMoves: MoveData[] = [];

    for (const m of knownMoves) {
      if (!m) continue;
      const mData = getMoveData(m);
      if (!mData) continue;
      const mKey = mData.name.toLowerCase().replace(/[\s_]+/g, "-");
      if (
        BANNED_SLEEP_TALK_KEYS.has(mKey) ||
        BANNED_SLEEP_TALK_KEYS.has(String(mData.id)) ||
        (mData.nameKo && BANNED_SLEEP_TALK_KEYS.has(mData.nameKo))
      ) {
        continue;
      }
      const mTrait = getMoveTrait(mKey);
      if (mTrait?.chargeTrait) {
        continue;
      }
      eligibleMoves.push(mData);
    }

    if (eligibleMoves.length === 0) {
      return withPrefix({
        log: isKo
          ? `${actorName}의 잠꼬대!\n하지만 기술은 실패했다!`
          : `${actorName} used SLEEP TALK!\nBut it failed!`,
        damage: 0,
      });
    }

    const selectedMoveData = eligibleMoves[Math.floor(Math.random() * eligibleMoves.length)];
    sleepTalkMoveKey = selectedMoveData.name.toLowerCase().replace(/[\s_]+/g, "-");
    activeMove = selectedMoveData;

    const selectedKo = selectedMoveData.nameKo || sleepTalkMoveKey;
    const selectedEn = (selectedMoveData.name || sleepTalkMoveKey).toUpperCase();
    sleepTalkPrefix = isKo
      ? `${actorName}의 잠꼬대!\n${actorName}(은)는 잠꼬대로 ${selectedKo}(을)를 썼다!\n`
      : `${actorName} used SLEEP TALK!\n${actorName} used ${selectedEn} in its sleep!\n`;
  }

  // 2-5. Nature Power (자연의힘) resolution (통신 배틀 표준 규격: 트라이어택으로 변환)
  const isNaturePowerMove = (
    moveKey === "nature-power" ||
    moveKey === "naturepower" ||
    moveKey === "nature_power" ||
    moveKey === "267" ||
    move.id === 267 ||
    move.nameKo === "자연의힘"
  );

  if (isNaturePowerMove) {
    const triMove = MOVES_DATA["tri-attack"];
    if (triMove) {
      naturePowerMoveKey = "tri-attack";
      activeMove = triMove;
      naturePowerPrefix = isKo
        ? `${actorName}의 자연의힘!\n자연의힘이 트라이어택으로 변했다!\n`
        : `${actorName}'s NATURE POWER!\nNature Power turned into TRI ATTACK!\n`;
    }
  }

  // 2-6. Assist (조수) resolution (동료 포켓몬의 기술을 랜덤으로 빌려 사용)
  const isAssistMove = (
    moveKey === "assist" ||
    moveKey === "274" ||
    move.id === 274 ||
    move.nameKo === "조수"
  );

  if (isAssistMove) {
    const BANNED_ASSIST_KEYS = new Set([
      "assist", "274", "조수",
      "baneful-bunker", "beak-blast", "belch", "bestow",
      "blazing-torque", "combat-torque", "magical-torque", "noxious-torque", "wicked-torque",
      "bounce", "celebrate", "chatter", "circle-throw", "copycat", "counter", "covet",
      "destiny-bond", "destinybond", "194", "길동무",
      "detect", "197", "판별",
      "dig", "91", "구멍파기",
      "dive", "291", "다이빙",
      "dragon-tail",
      "endure", "203", "버티기",
      "feint",
      "fly", "19", "공중날기",
      "focus-punch", "focuspunch", "264", "힘껏펀치",
      "follow-me", "followme", "266", "날따름",
      "helping-hand", "helpinghand", "270", "도우미",
      "hold-hands",
      "kings-shield", "mat-block",
      "magic-coat", "magiccoat", "277", "매직코트",
      "me-first",
      "metronome", "118", "손가락흔들기",
      "mimic", "102", "흉내내기",
      "mirror-coat", "mirrorcoat", "243", "미러코트",
      "mirror-move", "mirrormove", "119", "따라하기",
      "nature-power", "naturepower", "267", "자연의힘",
      "phantom-force",
      "protect", "182", "방어",
      "rage-powder", "roar", "shadow-force", "shell-trap",
      "sketch", "166", "스케치",
      "sky-drop",
      "sleep-talk", "sleeptalk", "214", "잠꼬대",
      "snatch", "spiky-shield", "spotlight",
      "struggle", "165", "발버둥",
      "switcheroo", "thief", "transform", "trick", "271", "트릭",
      "whirlwind", "18", "날려버리기"
    ]);

    // Collect candidate moves from party members
    let candidateMoveNames: string[] = [];
    if (battle?.playerParty && (actor === battle.playerBattleMon || actor === battle.playerParty[battle.playerActiveIndex])) {
      const otherMembers = battle.playerParty.filter((_, idx) => idx !== battle.playerActiveIndex);
      for (const member of otherMembers) {
        if (member.moves) {
          candidateMoveNames.push(...member.moves);
        }
      }
    } else {
      // Enemy / solo actor fallback: draw from other known moves or candidate pool
      if (actor.moves && actor.moves.length > 1) {
        candidateMoveNames.push(...actor.moves.filter(m => m !== "assist" && m !== "274" && m !== "조수"));
      }
    }

    const eligibleMoves: MoveData[] = [];
    for (const m of candidateMoveNames) {
      if (!m) continue;
      const mData = getMoveData(m);
      if (!mData) continue;
      const mKey = mData.name.toLowerCase().replace(/[\s_]+/g, "-");
      if (
        BANNED_ASSIST_KEYS.has(mKey) ||
        BANNED_ASSIST_KEYS.has(String(mData.id)) ||
        (mData.nameKo && BANNED_ASSIST_KEYS.has(mData.nameKo))
      ) {
        continue;
      }
      eligibleMoves.push(mData);
    }

    if (eligibleMoves.length === 0) {
      return withPrefix({
        log: isKo
          ? `${actorName}의 조수!\n하지만 기술은 실패했다!`
          : `${actorName} used ASSIST!\nBut it failed!`,
        damage: 0,
      });
    }

    const selectedMoveData = eligibleMoves[Math.floor(Math.random() * eligibleMoves.length)];
    assistMoveKey = selectedMoveData.name.toLowerCase().replace(/[\s_]+/g, "-");
    activeMove = selectedMoveData;

    const selectedKo = selectedMoveData.nameKo || assistMoveKey;
    const selectedEn = (selectedMoveData.name || assistMoveKey).toUpperCase();
    assistPrefix = isKo
      ? `${actorName}의 조수!\n동료의 힘을 빌려 ${selectedKo}(을)를 썼다!\n`
      : `${actorName} used ASSIST!\n${actorName} borrowed an ally's move and used ${selectedEn}!\n`;
  }

  // Rage state tracking: Using Rage enters rage, choosing another move cancels it
  if (moveKey === "rage") {
    actor.isRaging = true;
  } else {
    actor.isRaging = false;
  }

  // Protect counter tracking: Using a non-protect move resets consecutive protect count
  const isProtectFamily = [
    "protect", "detect", "endure", "spiky-shield", "baneful-bunker", "burning-bulwark", "182", "197", "203", "방어", "판별", "버티기"
  ].includes(moveKey) || [
    "protect", "detect", "endure", "spiky-shield", "baneful-bunker", "burning-bulwark", "182", "197", "203", "방어", "판별", "버티기"
  ].includes(activeMove.nameKo || "") || activeMove.id === 182 || activeMove.id === 197 || activeMove.id === 203;
  if (!isProtectFamily) {
    actor.protectCounter = 0;
  }

  // Fury Cutter streak tracking: Using a non-fury-cutter move resets consecutive streak
  const activeMoveKey = activeMove.name.toLowerCase().replace(/[\s_]+/g, "-");
  const isFuryCutter = [
    "fury-cutter", "fury_cutter", "furycutter", "210", "연속자르기"
  ].includes(moveKey) || [
    "fury-cutter", "fury_cutter", "furycutter", "210", "연속자르기"
  ].includes(activeMoveKey) || activeMove.id === 210 || activeMove.nameKo === "연속자르기";
  if (!isFuryCutter && actor.furyCutterStreak) {
    actor.furyCutterStreak = 0;
  }

  // Rollout state tracking: Using a non-rollout move cancels rollout
  const isRollout = Boolean(getMoveTrait(activeMoveKey)?.rolloutMove) || [
    "rollout", "205", "구르기", "ice-ball", "iceball", "301", "아이스볼"
  ].includes(moveKey) || [
    "rollout", "205", "구르기", "ice-ball", "iceball", "301", "아이스볼"
  ].includes(activeMoveKey) || activeMove.id === 205 || activeMove.id === 301 || activeMove.nameKo === "구르기" || activeMove.nameKo === "아이스볼";
  if (!isRollout && actor.rolloutState) {
    actor.rolloutState = null;
  }

  // 3. Status Moves Pipeline
  if (activeMove.category === "status") {
    const activeMoveKeyStatus = activeMove.name.toLowerCase().replace(/[\s_]+/g, "-");
    const isCurseMove = ["curse", "curse-ghost", "curse-normal", "174", "저주"].includes(activeMoveKeyStatus);
    const isGhostUser = Boolean(actor.types?.some((t) => t.toLowerCase() === "ghost")) || activeMoveKeyStatus === "curse-ghost";
    const isGhostCurse = isCurseMove && isGhostUser;
    const isPsychUp = ["psych-up", "psych_up", "psychup", "244", "자기암시"].includes(activeMoveKeyStatus) || activeMove.id === 244 || activeMove.nameKo === "자기암시";
    const isRolePlay = ["role-play", "role_play", "roleplay", "272", "역할놀이"].includes(activeMoveKeyStatus) || activeMove.id === 272 || activeMove.nameKo === "역할놀이";
    const bypassProtectAndSub = isPsychUp || isRolePlay;
    const isNonReflectableStatus = [
      "memento", "262", "추억의선물",
      "pain-split", "painsplit", "220", "아픔나누기",
      "trick", "271", "트릭",
      "switcheroo", "바꿔치기",
      "transform", "144", "변신",
      "mimic", "102", "흉내내기",
      "sketch", "166", "스케치",
    ].includes(activeMoveKeyStatus) || [262, 220, 271, 144, 102, 166].includes(activeMove.id);

    const isSelfTarget = isSelfTargetStatusMove(activeMove.name, actor);

    // Magic Coat (매직코트): Reflects non-self-target status moves back at the user!
    if (!isSelfTarget && !isGhostCurse && !bypassProtectAndSub && !isNonReflectableStatus && target.isMagicCoat) {
      const reflectHeader = isKo
        ? `${actorName}의 ${activeMove.nameKo}!\n${targetName}의 매직코트가 ${activeMove.nameKo}(을)를 되받아쳤다!`
        : `${actorName} used ${activeMove.name.toUpperCase()}!\n${targetName}'s Magic Coat bounced the ${activeMove.name.toUpperCase()} back!`;
      const reflectedStatLog = executeStatusMove({
        actor: target,
        target: actor,
        move: activeMove,
        actorName: targetName,
        targetName: actorName,
        isKo,
        battle,
      });
      return withPrefix({ log: `${reflectHeader}\n${reflectedStatLog}`, damage: 0 });
    }

    if (!isSelfTarget && !isGhostCurse && !bypassProtectAndSub && target.isProtected) {
      return withPrefix({
        log: isKo ? `${targetName}(은)는 공격을 막아냈다!` : `${targetName} protected itself!`,
        damage: 0,
      });
    }

    if (!isSelfTarget && !isGhostCurse && !bypassProtectAndSub && target.substituteHp && target.substituteHp > 0) {
      return withPrefix({
        log: isKo
          ? `${actorName}의 ${activeMove.nameKo}!\n하지만 대타출동 분신에게는 통하지 않았다!`
          : `${actorName}'s ${activeMove.name.toUpperCase()}!\nBut the substitute protected ${targetName}!`,
        damage: 0,
      });
    }

    if (!isSelfTarget && !isGhostCurse && target.isSemiInvulnerable) {
      const hasNoGuard = actor.ability?.toLowerCase() === "no-guard";
      const isPoisonToxic = (activeMove.name.toLowerCase().replace(/[\s_]+/g, "-") === "toxic") && actor.types.includes("poison");
      const targetId = (target as any).id || target.speciesId || "target";
      const hasMindReader = Boolean(
        actor.mindReaderTargetId &&
        (actor.mindReaderTargetId === targetId || actor.mindReaderTargetId === "target")
      );
      if (!hasNoGuard && !isPoisonToxic && !hasMindReader) {
        return withPrefix({
          log: isKo
            ? `${actorName}의 ${activeMove.nameKo}!\n하지만 ${targetName}에게는 닿지 않았다!`
            : `${actorName}'s ${activeMove.name.toUpperCase()}!\nBut it couldn't reach ${targetName}!`,
          damage: 0,
        });
      }
    }

    if (!isSelfTarget && !isGhostCurse) {
      const hitResult = checkMoveHit({
        actor,
        target,
        move: activeMove,
        weather: battle?.weather,
        hasClearEyePerk: isActorPlayer && battle?.pendingBallPerk === "clear_eye",
      });
      if (!hitResult.isHit) {
        return withPrefix({
          log: isKo
            ? `${actorName}의 ${activeMove.nameKo}!\n하지만 ${targetName}에게 맞지 않았다!`
            : `${actorName}'s ${activeMove.name.toUpperCase()}!\nBut it missed ${targetName}!`,
          damage: 0,
        });
      }
    }

    const statLog = executeStatusMove({
      actor,
      target,
      move: activeMove,
      actorName,
      targetName,
      isKo,
      battle,
    });
    const statusHeader = isKo ? `${actorName}의 ${activeMove.nameKo}!` : `${actorName} used ${activeMove.name.toUpperCase()}!`;
    return withPrefix({ log: `${statusHeader}\n${statLog}`, damage: 0 });
  }

  // 4. Two-Turn Charging Moves Pipeline
  if (actor.chargingMove && actor.chargingMove !== activeMoveKey) {
    actor.chargingMove = null;
    actor.isSemiInvulnerable = false;
    actor.semiInvulnerableState = null;
  }

  const trait = getMoveTrait(activeMoveKey);
  if (trait?.chargeTrait) {
    const chargeInfo = trait.chargeTrait;
    const isInstantByWeather = chargeInfo.instantUnderWeather && battle?.weather === chargeInfo.instantUnderWeather;

    if (!isInstantByWeather) {
      if (actor.chargingMove !== activeMoveKey) {
        actor.chargingMove = activeMoveKey;
        if (chargeInfo.semiInvulnerable) {
          actor.isSemiInvulnerable = true;
          actor.semiInvulnerableState = chargeInfo.semiInvulnerable;
        }
        if (chargeInfo.chargeStatBoost) {
          const sKey = chargeInfo.chargeStatBoost.stat;
          actor.stages[sKey] = Math.min(6, actor.stages[sKey] + chargeInfo.chargeStatBoost.stage);
        }
        const moveHeader = isKo ? `${actorName}의 ${moveName}!` : `${actorName} used ${moveName}!`;
        const chargeLog = isKo
          ? `${moveHeader}\n${actorName}(은)는 ${chargeInfo.chargeTextKo}`
          : `${moveHeader}\n${actorName} ${chargeInfo.chargeTextEn}`;
        return withPrefix({ log: chargeLog, damage: 0 });
      }
      // Turn 2: Unleash attack
      actor.chargingMove = null;
      actor.isSemiInvulnerable = false;
      actor.semiInvulnerableState = null;
      actor.bideDamageTaken = 0;
    }
  }

  // Focus Punch (힘껏펀치) - 이번 턴에 상대 공격으로 데미지를 입었으면 집중이 흐트러져 실패
  const isFocusPunch = ["focus-punch", "focuspunch", "264", "힘껏펀치"].includes(activeMoveKey);
  if (isFocusPunch) {
    const damageTaken = (actor.lastPhysicalDamageTakenThisTurn || 0) + (actor.lastSpecialDamageTakenThisTurn || 0);
    if (damageTaken > 0) {
      const moveHeader = isKo ? `${actorName}의 ${moveName}!` : `${actorName} used ${moveName}!`;
      const failLog = isKo
        ? `${moveHeader}\n${actorName}(은)는 집중이 흐트러져 기술을 쓸 수 없었다!`
        : `${moveHeader}\n${actorName} lost its focus and couldn't move!`;
      return withPrefix({
        log: failLog,
        damage: 0,
        canAct: false,
      });
    }
  }

  // Future Sight (미래예지) - 2턴 뒤에 공격이 떨어지는 지연 공격 메커니즘
  const isFutureSight = ["future-sight", "future_sight", "futuresight", "248", "미래예지"].includes(activeMoveKey);
  if (isFutureSight) {
    if (target.futureSight) {
      return withPrefix({
        log: isKo
          ? `${actorName}의 미래예지!\n하지만 이미 미래가 예지되어 있어 실패했다!`
          : `${actorName} used Future Sight!\nBut it failed!`,
        damage: 0,
      });
    }

    target.futureSight = {
      turnsLeft: 2,
      userLevel: actor.level || 50,
      userSpa: actor.spAtk || 100,
      userSpaStage: actor.stages?.spa || 0,
      userTypes: [...(actor.types || ["psychic"])],
      isUserPlayer: isActorPlayer,
      userName: actorName,
    };

    return withPrefix({
      log: isKo
        ? `${actorName}(은)는 미래를 예지했다!`
        : `${actorName} foresaw an attack!`,
      damage: 0,
    });
  }

  // Damp Ability Check (습기 특성은 자폭/대폭발 등의 기술을 무효화하고 시전자도 자폭하지 않음)
  if (trait?.isSelfDestruct) {
    const actorHasDamp = actor.ability?.toLowerCase() === "damp" || actor.passiveAbility?.toLowerCase() === "damp";
    const targetHasDamp = target.ability?.toLowerCase() === "damp" || target.passiveAbility?.toLowerCase() === "damp";
    if (actorHasDamp || targetHasDamp) {
      const dampMonName = actorHasDamp ? actorName : targetName;
      return withPrefix({
        log: isKo
          ? `${dampMonName}의 습기 특성으로 인해 ${moveName}(을)를 쓸 수 없다!`
          : `${actorName} cannot use ${moveName} because of ${dampMonName}'s Damp!`,
        damage: 0,
      });
    }
  }

  // Semi-Invulnerable Check for Damaging Moves (공중날기, 구멍파기 등 회피 상태 판정)
  if (target.isSemiInvulnerable) {
    const semiCheck = checkSemiInvulnerableVulnerability(target, activeMoveKey, actor.ability);
    const hasNoGuard = actor.ability?.toLowerCase() === "no-guard" || actor.passiveAbility?.toLowerCase() === "no-guard";
    const targetId = (target as any).id || target.speciesId || "target";
    const hasMindReader = Boolean(
      actor.mindReaderTargetId &&
      (actor.mindReaderTargetId === targetId || actor.mindReaderTargetId === "target")
    );
    if (!semiCheck.canHit && !hasNoGuard && !hasMindReader) {
      return withPrefix({
        log: isKo
          ? `${actorName}의 ${moveName}!\n하지만 ${targetName}에게는 닿지 않았다!`
          : `${actorName}'s ${moveName}!\nBut it couldn't reach ${targetName}!`,
        damage: 0,
      });
    }
  }

  // 5. Accuracy & Evasiveness Check
  const isJumpKick = ["jump-kick", "high-jump-kick", "26", "136"].includes(activeMoveKey);
  const hitResult = checkMoveHit({
    actor,
    target,
    move: activeMove,
    weather: battle?.weather,
    hasClearEyePerk: isActorPlayer && battle?.pendingBallPerk === "clear_eye",
  });

  if (!isActorPlayer && battle?.pendingBallPerk === "dodge") {
    const isNeverMiss = hitResult.reason === "never_miss";
    if (!isNeverMiss) {
      battle.pendingBallPerk = null;
      let selfDestructLog = "";
      if (trait?.isSelfDestruct) {
        actor.hp = 0;
        selfDestructLog = isKo ? `\n${actorName}(은)는 폭발하여 스스로 쓰러졌다!` : `\n${actorName} self-destructed and fainted!`;
      }
      if (isJumpKick && actor.hp > 0) {
        const crashDmg = Math.max(1, Math.floor(actor.maxHp * 0.5));
        actor.hp = Math.max(0, actor.hp - crashDmg);
        selfDestructLog += isKo ? `\n${actorName}(은)는 빗나가 땅에 부딪혀 큰 상처를 입었다! (-${crashDmg})` : `\n${actorName} kept going and crashed! (-${crashDmg})`;
        if (actor.hp === 0) {
          actor.chargingMove = null;
          actor.rampageState = null;
          selfDestructLog += isKo ? `\n${actorName}(은)는 쓰러졌다!` : `\n${actorName} fainted!`;
        }
      }
      if (actor.rampageState) {
        actor.rampageState = null;
        if (!actor.isConfused && !hasConfusionImmunity(actor)) {
          actor.isConfused = true;
          actor.confusionTurns = Math.floor(Math.random() * 4) + 2;
          selfDestructLog += isKo ? `\n${actorName}(은)는 난동이 끊겨 피로로 혼란에 빠졌다!` : `\n${actorName} became confused due to fatigue!`;
        }
      }
      if (actor.rolloutState) {
        actor.rolloutState = null;
        selfDestructLog += isKo ? `\n${actorName}의 구르기가 멈추었다!` : `\n${actorName}'s rollout stopped!`;
      }
      if (actor.furyCutterStreak) {
        actor.furyCutterStreak = 0;
      }
      if (actor.isCharged && activeMove.type.toLowerCase() === "electric" && !["charge", "268", "충전"].includes(activeMoveKey)) {
        actor.isCharged = false;
      }
      return withPrefix({
        log: isKo
          ? `${actorName}의 ${moveName}!\n[PERK:dodge] ${targetName}(은)는 회피기동으로 적의 공격을 완벽히 피했다!${selfDestructLog}`
          : `${actorName}'s ${moveName}!\n[PERK:dodge] ${targetName} skillfully dodged the attack!${selfDestructLog}`,
        damage: 0,
      });
    }
  }

  if (!hitResult.isHit) {
    let selfDestructLog = "";
    if (trait?.isSelfDestruct) {
      actor.hp = 0;
      selfDestructLog = isKo ? `\n${actorName}(은)는 폭발하여 스스로 쓰러졌다!` : `\n${actorName} self-destructed and fainted!`;
    }
    if (isJumpKick && actor.hp > 0) {
      const crashDmg = Math.max(1, Math.floor(actor.maxHp * 0.5));
      actor.hp = Math.max(0, actor.hp - crashDmg);
      selfDestructLog += isKo ? `\n${actorName}(은)는 빗나가 땅에 부딪혀 큰 상처를 입었다! (-${crashDmg})` : `\n${actorName} kept going and crashed! (-${crashDmg})`;
      if (actor.hp === 0) {
        actor.chargingMove = null;
        actor.rampageState = null;
        actor.rolloutState = null;
        selfDestructLog += isKo ? `\n${actorName}(은)는 쓰러졌다!` : `\n${actorName} fainted!`;
      }
    }
    if (actor.rampageState) {
      actor.rampageState = null;
      if (!actor.isConfused && !hasConfusionImmunity(actor)) {
        actor.isConfused = true;
        actor.confusionTurns = Math.floor(Math.random() * 4) + 2;
        selfDestructLog += isKo ? `\n${actorName}(은)는 난동이 끊겨 피로로 혼란에 빠졌다!` : `\n${actorName} became confused due to fatigue!`;
      }
    }
    if (actor.rolloutState) {
      actor.rolloutState = null;
      selfDestructLog += isKo ? `\n${actorName}의 구르기가 멈추었다!` : `\n${actorName}'s rollout stopped!`;
    }
    if (actor.furyCutterStreak) {
      actor.furyCutterStreak = 0;
    }
    if (actor.isCharged && activeMove.type.toLowerCase() === "electric" && !["charge", "268", "충전"].includes(activeMoveKey)) {
      actor.isCharged = false;
    }
    return withPrefix({
      log: isKo ? `${actorName}의 ${moveName}! 하지만 공격은 빗나갔다!${selfDestructLog}` : `${actorName}'s ${moveName}! But the attack missed!${selfDestructLog}`,
      damage: 0,
    });
  }

  // 6. Protect Shield
  if (target.isProtected) {
    let selfDestructLog = "";
    if (trait?.isSelfDestruct) {
      actor.hp = 0;
      selfDestructLog = isKo ? `\n${actorName}(은)는 폭발하여 스스로 쓰러졌다!` : `\n${actorName} self-destructed and fainted!`;
    }
    if (isJumpKick && actor.hp > 0) {
      const crashDmg = Math.max(1, Math.floor(actor.maxHp * 0.5));
      actor.hp = Math.max(0, actor.hp - crashDmg);
      selfDestructLog += isKo ? `\n${actorName}(은)는 빗나가 땅에 부딪혀 큰 상처를 입었다! (-${crashDmg})` : `\n${actorName} kept going and crashed! (-${crashDmg})`;
      if (actor.hp === 0) {
        actor.chargingMove = null;
        actor.rampageState = null;
        actor.rolloutState = null;
        selfDestructLog += isKo ? `\n${actorName}(은)는 쓰러졌다!` : `\n${actorName} fainted!`;
      }
    }
    if (actor.rampageState) {
      actor.rampageState = null;
      if (!actor.isConfused && !hasConfusionImmunity(actor)) {
        actor.isConfused = true;
        actor.confusionTurns = Math.floor(Math.random() * 4) + 2;
        selfDestructLog += isKo ? `\n${actorName}(은)는 난동이 끊겨 피로로 혼란에 빠졌다!` : `\n${actorName} became confused due to fatigue!`;
      }
    }
    if (actor.rolloutState) {
      actor.rolloutState = null;
    }
    if (actor.furyCutterStreak) {
      actor.furyCutterStreak = 0;
    }
    if (actor.isCharged && activeMove.type.toLowerCase() === "electric" && !["charge", "268", "충전"].includes(activeMoveKey)) {
      actor.isCharged = false;
    }
    return withPrefix({
      log: isKo ? `${actorName}의 ${moveName}! 하지만 ${targetName}(은)는 공격을 막아냈다!${selfDestructLog}` : `${actorName}'s ${moveName}! But ${targetName} protected itself!${selfDestructLog}`,
      damage: 0,
    });
  }

  // 7. Damage Calculation
  const dmgResult = calculateDamage(actor, target, activeMove, isActorPlayer, isKo, battle);
  const damage = dmgResult.damage;

  // Consume charge state on successful electric attack execution
  if (actor.isCharged && activeMove.type.toLowerCase() === "electric" && !["charge", "268", "충전"].includes(activeMoveKey)) {
    actor.isCharged = false;
  }

  // Consume Helping Hand boost on damaging move execution
  if (actor.isHelpingHandBoosted) {
    actor.isHelpingHandBoosted = false;
  }

  // 8. Water perk surge absorption
  let perkText = "";
  if (isActorPlayer && activeMove.type.toLowerCase() === "water" && damage > 0) {
    if (battle?.pendingBallPerk === "wave" || battle?.activeBallPerk === "wave") {
      const heal = Math.min(actor.maxHp - actor.hp, damage);
      if (heal > 0) {
        actor.hp += heal;
        perkText += isKo
          ? `\n[PERK:wave] 파도의 힘으로 입힌 피해만큼 체력을 흡수했다! (+${heal} HP)`
          : `\n[PERK:wave] Surging Wave absorbed ${heal} HP!`;
      }
    }
  }

  // 9. Target HP Modification & Safeguards
  let damageLog = "";
  if (!isActorPlayer && battle?.rockSolidTurns && battle.rockSolidTurns > 0) {
    damageLog += isKo ? "\n[PERK:rock_solid] 돌멩이 효과로 받는 피해를 50% 경감했다!" : "\n[PERK:rock_solid] Pebble reduced damage by 50%!";
  }

  if (target.substituteHp && target.substituteHp > 0) {
    target.substituteHp = Math.max(0, target.substituteHp - damage);
    if (target.substituteHp === 0) {
      damageLog += isKo ? ` 대타출동 분신이 대신 맞고 부서졌다!` : ` The substitute broke!`;
    } else {
      damageLog += isKo ? ` 대타출동 분신이 데미지를 흡수했다! (${damage})` : ` The substitute took ${damage} damage!`;
    }
  } else {
    if (target.hasIllusion) {
      target.hasIllusion = false;
      target.illusionTarget = null;
      damageLog += isKo ? `\n일루전이 깨져 본래의 ${isActorPlayer ? target.name : target.nameKo} 모습이 드러났다!` : `\nThe illusion broke!`;
    }

    if (target.isEnduring && damage >= target.hp) {
      target.hp = 1;
      damageLog += isKo
        ? `\n${targetName}(은)는 버티기로 공격을 견뎌냈다!`
        : `\n${targetName} endured the hit!`;
    } else if (!isActorPlayer && target.hasEndurePerk && damage >= target.hp) {
      target.hp = 1;
      target.hasEndurePerk = false;
      damageLog += isKo
        ? `\n[PERK:willpower] ${targetName}(은)는 의지의 힘으로 HP 1로 공격을 견뎌냈다!`
        : `\n[PERK:willpower] ${targetName} held on with 1 HP by Willpower!`;
    } else if (
      (target.ability?.toLowerCase() === "sturdy" || target.passiveAbility?.toLowerCase() === "sturdy") &&
      target.hp === target.maxHp &&
      damage >= target.hp
    ) {
      target.hp = 1;
    } else if (
      target.hp === target.maxHp &&
      damage >= target.hp &&
      (() => {
        const curItem = target.heldItem || (target.heldItems && target.heldItems.length > 0 ? target.heldItems[0] : null);
        const norm = (curItem || "").toLowerCase().trim().replace(/[\s_]+/g, "-");
        return norm === "기합의띠" || norm === "focus-sash" || norm === "focussash";
      })()
    ) {
      const sashItem = target.heldItem || target.heldItems![0];
      target.hp = 1;
      target.heldItem = null;
      if (target.heldItems && target.heldItems.length > 0) {
        target.heldItems.shift();
      }
      target.lastConsumedItem = sashItem;
      damageLog += isKo
        ? `\n${targetName}(은)는 [${sashItem}] 덕분에 HP 1로 버텨냈다!`
        : `\n${targetName} hung on using its ${sashItem}!`;
    } else if (
      ["false-swipe", "206", "칼등치기", "falseswipe", "false_swipe"].includes(moveKey) &&
      damage > 0 &&
      damage >= target.hp
    ) {
      target.hp = 1;
    } else {
      target.hp = Math.max(0, target.hp - damage);
    }

    // 자뭉열매(Sitrus Berry) / 오랭열매(Oran Berry) 자동 섭취 및 lastConsumedItem 기록 (리사이클 연계)
    // 단, 탁쳐서떨구기(Knock Off) 피격 시에는 열매가 먼저 떨어져 나가므로 섭취 불가
    const isKnockOffHit =
      ["knock-off", "knock_off", "knockoff", "282", "탁쳐서떨구기"].includes(activeMoveKey) ||
      activeMove.id === 282 ||
      activeMove.nameKo === "탁쳐서떨구기";
    if (!isKnockOffHit && target.hp > 0 && target.hp <= Math.floor(target.maxHp / 2)) {
      const curItem = target.heldItem || (target.heldItems && target.heldItems.length > 0 ? target.heldItems[0] : null);
      const norm = (curItem || "").toLowerCase().trim().replace(/[\s_]+/g, "-");
      if (norm === "자뭉열매" || norm === "sitrus-berry" || norm === "sitrusberry") {
        const berryHeal = Math.max(1, Math.floor(target.maxHp / 4));
        const actualHeal = Math.min(target.maxHp - target.hp, berryHeal);
        target.hp += actualHeal;
        target.heldItem = null;
        if (target.heldItems && target.heldItems.length > 0) target.heldItems.shift();
        target.lastConsumedItem = curItem!;
        damageLog += isKo
          ? `\n${targetName}(은)는 [${curItem}]을(를) 먹고 체력을 ${actualHeal} 회복했다!`
          : `\n${targetName} restored ${actualHeal} HP using its ${curItem}!`;
      } else if (norm === "오랭열매" || norm === "oran-berry" || norm === "oranberry") {
        const actualHeal = Math.min(target.maxHp - target.hp, 10);
        target.hp += actualHeal;
        target.heldItem = null;
        if (target.heldItems && target.heldItems.length > 0) target.heldItems.shift();
        target.lastConsumedItem = curItem!;
        damageLog += isKo
          ? `\n${targetName}(은)는 [${curItem}]을(를) 먹고 체력을 ${actualHeal} 회복했다!`
          : `\n${targetName} restored ${actualHeal} HP using its ${curItem}!`;
      }
    }

    if (target.hp === 0) {
      target.chargingMove = null;
      target.isSemiInvulnerable = false;
      target.semiInvulnerableState = null;
      target.isRaging = false;
      target.bideDamageTaken = 0;
      target.rampageState = null;
      target.rolloutState = null;
      actor.rolloutState = null;
      target.cannotEscape = false;
      actor.cannotEscape = false;

      // Destiny Bond (길동무) 효과: 상대의 직접 공격 데미지로 쓰러졌을 때, 공격자도 함께 쓰러뜨림
      if (target.isDestinyBond && actor.hp > 0 && damage > 0) {
        actor.hp = 0;
        actor.chargingMove = null;
        actor.rampageState = null;
        actor.rolloutState = null;
        actor.cannotEscape = false;
        target.cannotEscape = false;
        damageLog += isKo
          ? `\n${targetName}(은)는 ${actorName}(을)를 길동무로 삼았다!`
          : `\n${targetName} took ${actorName} down with it!`;
      }
    }

    if (activeMove.category === "physical" && damage > 0) {
      target.lastPhysicalDamageTakenThisTurn = (target.lastPhysicalDamageTakenThisTurn || 0) + damage;
    }
    if (activeMove.category === "special" && damage > 0) {
      target.lastSpecialDamageTakenThisTurn = (target.lastSpecialDamageTakenThisTurn || 0) + damage;
    }

    // Pursuit doubled power message when striking a switching target
    if (["pursuit", "228", "따라가때리기", "따라가-때리기", "따라가 때리기"].includes(moveKey) && (target as any).isSwitchingOut && damage > 0) {
      damageLog += isKo
        ? `\n[따라가때리기!] 교체하려는 상대를 가로채 2배의 위력으로 공격했다!`
        : `\n[Pursuit!] Struck the retreating target with double power!`;
    }

    // Fury Cutter consecutive hit streak progression
    if (isFuryCutter && damage > 0 && (dmgResult.typeMod ?? 1) > 0) {
      const prevStreak = actor.furyCutterStreak ?? 0;
      actor.furyCutterStreak = Math.min(2, prevStreak + 1);
      if (prevStreak > 0) {
        damageLog += isKo
          ? `\n연속으로 공격을 명중시켜 위력이 올랐다!`
          : `\nConsecutive hits boosted the move's power!`;
      }
    }

    // Rollout & Ice Ball consecutive hit progression (up to 5 hits)
    if (isRollout && damage > 0 && (dmgResult.typeMod ?? 1) > 0 && actor.hp > 0) {
      if (target.hp > 0) {
        if (!actor.rolloutState) {
          actor.rolloutState = {
            moveKey,
            hitCount: 2,
            defenseCurlMultiplier: Boolean(actor.hasUsedDefenseCurl || (actor as any).defenseCurlUsed),
          };
          damageLog += isKo
            ? `\n${actorName}(은)는 기세를 몰아 구르기를 계속한다!`
            : `\n${actorName} kept rolling!`;
        } else {
          const currentHit = actor.rolloutState.hitCount;
          if (currentHit >= 5) {
            actor.rolloutState = null;
            damageLog += isKo
              ? `\n${actorName}의 구르기가 끝났다!`
              : `\n${actorName}'s rollout ended!`;
          } else {
            actor.rolloutState.hitCount = currentHit + 1;
            damageLog += isKo
              ? `\n구르기의 기세가 더욱 강력해졌다! (${actor.rolloutState.hitCount}/5)`
              : `\nRollout's momentum grew stronger! (${actor.rolloutState.hitCount}/5)`;
          }
        }
      } else {
        actor.rolloutState = null;
      }
    }

    // Bide effect: accumulate damage taken while biding
    if (target.chargingMove === "bide" && target.hp > 0 && damage > 0) {
      target.bideDamageTaken = (target.bideDamageTaken || 0) + damage;
    }

    // Rage effect: User's Attack is raised by 1 stage every time it takes damage while raging
    if (target.isRaging && target.hp > 0 && damage > 0) {
      if (target.stages.atk < 6) {
        target.stages.atk = Math.min(6, target.stages.atk + 1);
        damageLog += isKo
          ? `\n[분노 효과!] ${targetName}의 분노가 끓어오른다! 공격이 올랐다! (+1)`
          : `\n[Rage!] ${targetName}'s rage is building! Attack rose! (+1)`;
        if (battle?.lastMoveEffect) {
          const isTargetPlayer = target === battle.playerBattleMon || target === battle.playerParty?.[battle.playerActiveIndex];
          battle.lastMoveEffect.statChanges = battle.lastMoveEffect.statChanges || [];
          battle.lastMoveEffect.statChanges.push({
            target: isTargetPlayer ? "player" : "enemy",
            direction: "up",
          });
        }
      }
    }
  }

  // 10. Self-Destruct execution
  if (dmgResult.isSelfDestruct) {
    actor.hp = 0;
    damageLog += isKo ? `\n${actorName}(은)는 폭발하여 스스로 쓰러졌다!` : `\n${actorName} self-destructed and fainted!`;
  }

  // Crash damage on immune target (e.g. Ghost type)
  if (isJumpKick && dmgResult.typeMod === 0 && actor.hp > 0) {
    const crashDmg = Math.max(1, Math.floor(actor.maxHp * 0.5));
    actor.hp = Math.max(0, actor.hp - crashDmg);
    damageLog += isKo
      ? `\n${actorName}(은)는 빗나가 땅에 부딪혀 큰 상처를 입었다! (-${crashDmg})`
      : `\n${actorName} kept going and crashed! (-${crashDmg})`;
    if (actor.hp === 0) {
      actor.chargingMove = null;
      actor.rampageState = null;
      actor.rolloutState = null;
      actor.cannotEscape = false;
      target.cannotEscape = false;
      damageLog += isKo ? `\n${actorName}(은)는 쓰러졌다!` : `\n${actorName} fainted!`;
    }
  }

  // Rampage interruption on type immunity (e.g. Dragon Outrage vs Fairy type, Normal Thrash vs Ghost type)
  if (dmgResult.typeMod === 0 && actor.rampageState) {
    actor.rampageState = null;
    if (!actor.isConfused && !hasConfusionImmunity(actor)) {
      actor.isConfused = true;
      actor.confusionTurns = Math.floor(Math.random() * 4) + 2;
      damageLog += isKo
        ? `\n${actorName}(은)는 난동이 끊겨 피로로 혼란에 빠졌다!`
        : `\n${actorName} became confused due to fatigue!`;
    }
  }

  // Rollout interruption on type immunity
  if (dmgResult.typeMod === 0 && actor.rolloutState) {
    actor.rolloutState = null;
    damageLog += isKo ? `\n${actorName}의 구르기가 멈추었다!` : `\n${actorName}'s rollout stopped!`;
  }

  // Fury Cutter interruption on type immunity or 0 damage
  if ((dmgResult.typeMod === 0 || damage === 0) && actor.furyCutterStreak) {
    actor.furyCutterStreak = 0;
  }

  // 11. Secondary Effects
  const extraEffects = (dmgResult.typeMod > 0 && damage > 0)
    ? applySecondaryAttackEffects(actor, target, activeMove, damage, isKo, battle)
    : "";

  // 12. Must recharge setup
  if (dmgResult.mustRecharge) {
    actor.mustRecharge = true;
  }

  if (actor.hp === 0) {
    actor.chargingMove = null;
    actor.rampageState = null;
    actor.rolloutState = null;
    actor.cannotEscape = false;
    target.cannotEscape = false;
  }

  const finalLog = `${dmgResult.log}${perkText}${damageLog}${extraEffects}`;
  const isHealOutcome = (actor as any).lastPresentOutcome === "heal";
  return withPrefix({
    log: finalLog,
    damage,
    typeMod: dmgResult.typeMod,
    hitCount: dmgResult.hitCount,
    isSuperEffective: dmgResult.isSuperEffective,
    isHeal: isHealOutcome ? true : undefined,
    presentOutcome: (actor as any).lastPresentOutcome,
  });
}
