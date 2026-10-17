import { BattlePokemon, BattleState, StatStages } from "../../engine/types.js";
import { MoveData, getMoveData, getMoveKey, MOVES_DATA } from "../../../data/movesKo.js";
import { applyStatChange } from "../../mechanics/statModifier.js";
import { createPlayerBattleMon, getPokemonGender } from "../../entities/pokemonFactory.js";
import { getTypeEffectiveness } from "../../mechanics/typeChart.js";

export interface StatusMoveContext {
  actor: BattlePokemon;
  target: BattlePokemon;
  move: MoveData;
  actorName: string;
  targetName: string;
  isKo: boolean;
  battle?: BattleState;
}

/**
 * Checks whether a status move targets self (rather than opponent).
 */
export function isSelfTargetStatusMove(moveName: string, actor?: BattlePokemon): boolean {
  const rawKey = moveName.toLowerCase().replace(/[\s_]+/g, "-");
  const k = getMoveKey(rawKey) || rawKey;
  if (k === "curse-ghost") return false;
  if (k === "curse-normal") return true;
  if (k === "curse" || k === "174" || k === "저주") {
    if (actor?.types) {
      return !actor.types.some((t) => t.toLowerCase() === "ghost");
    }
    return true;
  }
  const selfMoves = new Set([
    "swords-dance", "dragon-dance", "calm-mind", "nasty-plot", "bulk-up", "quiver-dance",
    "agility", "rock-polish", "iron-defense", "amnesia", "acid-armor", "barrier", "growth",
    "tail-glow", "belly-drum", "shell-smash", "shift-gear", "coil", "hone-claws", "work-up",
    "charge", "268", "충전", "autotomize", "sharpen", "meditate", "harden", "withdraw", "defense-curl",
    "minimize", "double-team", "protect", "detect", "spiky-shield", "baneful-bunker", "197", "판별",
    "substitute", "endure", "quick-guard", "wide-guard", "recover", "roost", "soft-boiled",
    "slack-off", "milk-drink", "milk_drink", "milkdrink", "208", "우유마시기",
    "synthesis", "235", "광합성",
    "moonlight", "236", "달빛", "달의불빛",
    "morning-sun", "morning_sun", "morningsun", "234", "아침햇살",
    "heal-order",
    "shore-up", "life-dew", "wish", "273", "희망사항", "assist", "274", "조수", "rest", "swallow", "stockpile", "254", "비축하기", "비축", "ingrain", "275", "뿌리박기", "aqua-ring",
    "rain-dance", "sunny-day", "sandstorm", "snowscape", "hail", "electric-terrain",
    "grassy-terrain", "misty-terrain", "psychic-terrain", "tailwind", "trick-room",
    "reflect", "light-screen", "aurora-veil", "safeguard", "mist", "haze", "refresh",
    "heal-bell", "heal_bell", "healbell", "215", "치료방울", "aromatherapy", "splash", "teleport", "focus-energy", "conversion", "conversion-2", "conversion2",
    "destiny-bond", "destinybond", "194", "길동무",
    "perish-song", "perish_song", "perishsong", "195", "멸망의노래", "멸망의 노래",
    "sleep-talk", "sleeptalk", "214", "잠꼬대",
    "baton-pass", "baton_pass", "batonpass", "226", "배턴터치", "바톤터치",
    "follow-me", "follow_me", "followme", "266", "날따름",
    "helping-hand", "helping_hand", "helpinghand", "270", "도우미",
    "magic-coat", "magic_coat", "magiccoat", "277", "매직코트",
    "recycle", "278", "리사이클"
  ]);
  return selfMoves.has(k);
}

/**
 * Handles transform logic (Ditto, Mew).
 */
export function applyTransform(user: BattlePokemon, target: BattlePokemon) {
  user.isTransformed = true;
  user.transformedSpeciesId = target.speciesId;
  user.types = [...target.types];
  user.atk = target.atk;
  user.def = target.def;
  user.spAtk = target.spAtk;
  user.spDef = target.spDef;
  user.speed = target.speed;
  user.stages = { ...target.stages };
  user.moves = [...target.moves];
  user.movePps = target.moves.map(() => 5);
}

/**
 * Comprehensive Status Move Execution Handler
 */
export function executeStatusMove(ctx: StatusMoveContext): string {
  const { actor, target, move, actorName, targetName, isKo, battle } = ctx;
  const mName = move.name.toLowerCase().replace(/[\s_]+/g, "-");

  // Helper for tracking stat changes for animations
  const recordStatChange = (targetWho: "actor" | "target", dir: "up" | "down") => {
    if (battle?.lastMoveEffect) {
      const isPlayerActor = actor === battle.playerBattleMon || actor === battle.playerParty?.[battle.playerActiveIndex];
      const isTargetPlayer = targetWho === "actor" ? isPlayerActor : !isPlayerActor;
      battle.lastMoveEffect.statChanges = battle.lastMoveEffect.statChanges || [];
      battle.lastMoveEffect.statChanges.push({
        target: isTargetPlayer ? "player" : "enemy",
        direction: dir,
      });
    }
  };

  const applyStage = (
    subject: "actor" | "target",
    statKey: keyof StatStages,
    statNameKo: string,
    statNameEn: string,
    delta: number
  ): string => {
    const mon = subject === "actor" ? actor : target;
    const monName = subject === "actor" ? actorName : targetName;

    // Mist protection
    if (delta < 0 && subject === "target" && (mon.mistTurns || 0) > 0) {
      return isKo
        ? `[흰안개 효과!] ${monName}의 능력치는 떨어지지 않는다!`
        : `[Mist!] ${monName}'s stats cannot be lowered!`;
    }

    // Ability protection (Clear Body, White Smoke)
    if (delta < 0 && subject === "target") {
      const monAbility = (mon.ability || "").toLowerCase().replace(/[\s_]+/g, "-");
      const monPassive = (mon.passiveAbility || "").toLowerCase().replace(/[\s_]+/g, "-");
      if (monAbility === "clear-body" || monPassive === "clear-body") {
        return isKo
          ? `[특성 클리어바디] ${monName}의 능력치는 떨어지지 않는다!`
          : `[Clear Body] ${monName}'s stats cannot be lowered!`;
      }
      if (monAbility === "white-smoke" || monPassive === "white-smoke") {
        return isKo
          ? `[특성 하얀연기] ${monName}의 능력치는 떨어지지 않는다!`
          : `[White Smoke] ${monName}'s stats cannot be lowered!`;
      }
    }

    const res = applyStatChange(
      mon.stages,
      statKey,
      delta,
      monName,
      monName,
      statNameKo,
      statNameEn
    );
    if (res.success) {
      recordStatChange(subject, delta > 0 ? "up" : "down");
    }
    return isKo ? res.logKo : res.logEn;
  };

  // 1. Leech Seed
  if (mName === "leech-seed" || move.nameKo === "씨뿌리기") {
    if (target.types.some(t => t.toLowerCase() === "grass")) {
      return isKo ? `풀타입 포켓몬에게는 씨뿌리기가 통하지 않는다!` : `Leech Seed does not affect Grass-type Pokémon!`;
    }
    if (target.isSeeded) {
      return isKo ? `${targetName}(은)는 이미 씨가 뿌려져 있다!` : `${targetName} is already seeded!`;
    }
    target.isSeeded = true;
    return isKo ? `${targetName}에게 씨를 뿌렸다!` : `${targetName} was seeded!`;
  }

  // 2. Transform
  if (mName === "transform" || move.nameKo === "변신") {
    applyTransform(actor, target);
    return isKo ? `${actorName}(은)는 ${targetName}(으)로 변신했다!` : `${actorName} transformed into ${targetName}!`;
  }

  // 3. Substitute
  if (mName === "substitute" || move.nameKo === "대타출동") {
    const cost = Math.floor(actor.maxHp * 0.25);
    if (actor.hp > cost && !actor.substituteHp) {
      actor.hp -= cost;
      actor.substituteHp = cost;
      return isKo
        ? `${actorName}(은)는 자신의 HP를 깎아 대타 분신을 만들었다!`
        : `${actorName} created a substitute with its own HP!`;
    }
    return isKo ? `하지만 기술은 실패했다!` : `But it failed!`;
  }

  // 3-1. Sketch (스케치)
  if (mName === "sketch" || move.nameKo === "스케치") {
    let candidateKey = target.lastMoveUsed || battle?.lastMoveEffect?.moveKey;
    if (!candidateKey || candidateKey === "sketch" || candidateKey === "166") {
      if (target.moves && target.moves.length > 0) {
        candidateKey = target.moves.find(m => m !== "sketch" && m !== "166") || "tackle";
      } else {
        candidateKey = "tackle";
      }
    }
    const cleanKey = candidateKey.toLowerCase().replace(/[\s_]+/g, "-");
    const copiedMoveData = getMoveData(cleanKey) || MOVES_DATA[cleanKey] || MOVES_DATA["tackle"];
    const copiedKo = copiedMoveData?.nameKo || cleanKey;
    const copiedEn = (copiedMoveData?.name || cleanKey).toUpperCase();

    // Replace sketch permanently in actor's moves
    const sIdx = actor.moves.findIndex(m => m === "sketch" || m === "166" || m === "스케치");
    if (sIdx !== -1) {
      actor.moves[sIdx] = cleanKey;
      if (actor.movePps) {
        actor.movePps[sIdx] = copiedMoveData?.pp || 5;
      }
    }

    if (battle?.lastMoveEffect) {
      battle.lastMoveEffect.copiedMoveKey = cleanKey;
    }

    return isKo
      ? `${actorName}(은)는 상대의 ${copiedKo}(을)를 스케치하여 자신의 기술로 만들었다!`
      : `${actorName} sketched ${targetName}'s ${copiedEn}!`;
  }

  // 4. Protect / Detect / Spiky Shield
  if (["protect", "detect", "spiky-shield", "baneful-bunker", "burning-bulwark", "182", "197"].includes(mName) || move.nameKo === "방어" || move.nameKo === "판별") {
    const count = actor.protectCounter || 0;
    if (count > 0) {
      // Official formula: success chance is (1/3)^count in Gen 6+
      const successChance = Math.pow(1 / 3, count);
      if (Math.random() > successChance) {
        actor.protectCounter = 0;
        actor.isProtected = false;
        return isKo ? `하지만 기술은 실패했다!` : `But it failed!`;
      }
    }
    actor.protectCounter = count + 1;
    actor.isProtected = true;
    const isDetect = mName === "detect" || mName === "197" || move.nameKo === "판별";
    return isKo
      ? (isDetect ? `${actorName}(은)는 몸을 피할 자세를 취했다!` : `${actorName}(은)는 방어 자세를 취했다!`)
      : `${actorName} protected itself!`;
  }

  // 4-B. Endure (버티기)
  if (["endure", "203"].includes(mName) || move.nameKo === "버티기") {
    const count = actor.protectCounter || 0;
    if (count > 0) {
      const successChance = Math.pow(1 / 3, count);
      if (Math.random() > successChance) {
        actor.protectCounter = 0;
        actor.isEnduring = false;
        return isKo ? `하지만 기술은 실패했다!` : `But it failed!`;
      }
    }
    actor.protectCounter = count + 1;
    actor.isEnduring = true;
    return isKo
      ? `${actorName}(은)는 버티기 태세를 갖췄다!`
      : `${actorName} braced itself!`;
  }

  // 5. Recovery Moves (50% HP)
  if (
    ["recover", "roost", "soft-boiled", "slack-off", "milk-drink", "milk_drink", "milkdrink", "208", "105", "135"].includes(mName) ||
    move.id === 208 || move.id === 105 || move.id === 135 ||
    move.nameKo === "우유마시기" || move.nameKo === "HP회복" || move.nameKo === "알낳기"
  ) {
    if (actor.hp >= actor.maxHp) {
      return isKo ? `하지만 HP가 이미 가득 차 있다!` : `But its HP is already full!`;
    }
    const maxHeal = Math.max(1, Math.floor(actor.maxHp * 0.5));
    const actualHeal = Math.min(maxHeal, actor.maxHp - actor.hp);
    actor.hp += actualHeal;
    return isKo ? `${actorName}의 HP가 ${actualHeal} 회복되었다!` : `${actorName} restored ${actualHeal} HP!`;
  }

  // 5-1. Pain Split (아픔나누기)
  if (
    ["pain-split", "pain_split", "painsplit", "220"].includes(mName) ||
    move.id === 220 ||
    move.nameKo === "아픔나누기" ||
    move.nameKo === "아픔 나누기"
  ) {
    const totalHp = actor.hp + target.hp;
    const avgHp = Math.floor(totalHp / 2);
    actor.hp = Math.max(1, Math.min(actor.maxHp, avgHp));
    target.hp = Math.max(1, Math.min(target.maxHp, avgHp));
    return isKo
      ? `서로의 체력을 나누어가졌다!`
      : `The battlers shared their pain!`;
  }

  // 6. Disable
  if (mName === "disable") {
    const lastMove = battle?.lastMoveEffect?.moveKey;
    if (lastMove && !target.disabledMove) {
      target.disabledMove = lastMove;
      target.disabledTurns = 4;
      const targetMoveData = getMoveData(lastMove);
      const lockedName = isKo ? (targetMoveData?.nameKo || lastMove) : (targetMoveData?.name || lastMove);
      return isKo
        ? `${targetName}의 ${lockedName}(을)를 사슬로 묶었다! (4턴간 사용 불가)`
        : `${targetName}'s ${lockedName} was disabled! (4 turns)`;
    }
    return isKo ? `하지만 기술은 실패했다!` : `But it failed!`;
  }

  // 6-1. Torment (트집 / 259)
  if (
    ["torment", "259", "트집"].includes(mName) ||
    move.id === 259 ||
    move.nameKo === "트집"
  ) {
    if (target.isTormented) {
      return isKo ? `하지만 기술은 실패했다!` : `But it failed!`;
    }
    target.isTormented = true;
    return isKo
      ? `${targetName}(은)는 트집이 잡혀 똑같은 기술을 2회 연속으로 쓸 수 없게 되었다!`
      : `${targetName} was subjected to torment!`;
  }

  // 7. Mist
  if (mName === "mist") {
    if ((actor.mistTurns || 0) > 0) {
      return isKo ? `이미 흰안개에 둘러싸여 있다!` : `Already protected by mist!`;
    }
    actor.mistTurns = 5;
    return isKo
      ? `${actorName}의 주변에 짙은 흰안개가 끼며 능력치 하락을 막는다! (5턴 지속)`
      : `${actorName} became shrouded in mist! (5 turns)`;
  }

  // 7-1. Safeguard (신비의부적)
  if (
    ["safeguard", "219", "신비의부적"].includes(mName) ||
    move.id === 219 ||
    move.nameKo === "신비의부적"
  ) {
    if ((actor.safeguardTurns || 0) > 0) {
      return isKo ? `하지만 이미 신비의부적의 가호를 받고 있다!` : `Safeguard is already active!`;
    }
    actor.safeguardTurns = 5;
    return isKo
      ? `${actorName} 팀은 신비의부적으로 5턴간 상태이상으로부터 보호받는다!`
      : `${actorName}'s team became cloaked in a mystical veil! (5 turns)`;
  }

  // 7-2. Baton Pass (배턴터치 / 바톤터치)
  if (
    ["baton-pass", "baton_pass", "batonpass", "226"].includes(mName) ||
    move.id === 226 ||
    move.nameKo === "배턴터치" ||
    move.nameKo === "바톤터치"
  ) {
    if (battle) {
      const isPlayerActor = actor === battle.playerBattleMon || actor === battle.playerParty?.[battle.playerActiveIndex];
      if (isPlayerActor && battle.playerParty) {
        const hasAliveTeammate = battle.playerParty.some((p, idx) => idx !== battle.playerActiveIndex && p.hp > 0);
        if (!hasAliveTeammate) {
          actor.batonPassPending = false;
          return isKo
            ? `하지만 교체할 수 있는 다른 포켓몬이 없다!`
            : `But there was no other Pokémon to switch in!`;
        }
      } else if (!isPlayerActor) {
        // 상대 야생/보스 포켓몬은 교체할 예비 파티원이 없으므로 실패
        actor.batonPassPending = false;
        return isKo
          ? `하지만 교체할 수 있는 다른 포켓몬이 없다!`
          : `But there was no other Pokémon to switch in!`;
      }
    }

    actor.batonPassPending = true;
    return isKo
      ? `${actorName}(은)는 능력 변화를 이어받을 배턴을 넘기며 교대 준비를 마쳤다!`
      : `${actorName} passed the baton and prepared to switch!`;
  }

  // 7-3. Encore (앙코르)
  if (
    ["encore", "227"].includes(mName) ||
    move.id === 227 ||
    move.nameKo === "앙코르"
  ) {
    const lastMove = target.lastMoveUsed;
    const invalidEncoreMoves = new Set([
      "encore", "227", "앙코르", "struggle", "165", "발버둥", "transform", "144", "변신",
      "metronome", "35", "손가락흔들기", "mimic", "102", "흉내내기", "sketch", "166", "스케치",
      "mirror-move", "119", "따라하기", "sleep-talk", "214", "잠꼬대"
    ]);

    // 1. 특성 면역 검증 (아로마베일 / Aroma Veil)
    const tAbility = (target.ability || "").toLowerCase().replace(/[\s_]+/g, "-");
    const tPassive = (target.passiveAbility || "").toLowerCase().replace(/[\s_]+/g, "-");
    if (tAbility === "aroma-veil" || tPassive === "aroma-veil") {
      return isKo
        ? `하지만 ${targetName}의 아로마베일로 인해 앙코르에 걸리지 않는다!`
        : `${targetName}'s Aroma Veil prevents encore!`;
    }

    // 2. 이미 앙코르 상태인 경우
    if (target.encoreTurns && target.encoreTurns > 0) {
      return isKo ? `하지만 ${targetName}(은)는 이미 앙코르 상태다!` : `But ${targetName} is already encored!`;
    }

    // 3. 마지막 사용 기술이 없거나 무효 기술인 경우
    if (!lastMove || invalidEncoreMoves.has(lastMove)) {
      return isKo ? `하지만 기술은 실패했다!` : `But it failed!`;
    }

    // 4. 대상이 현재 그 기술을 보유하고 있지 않은 경우
    if (target.moves && target.moves.length > 0) {
      const hasMove = target.moves.some(m => getMoveKey(m) === lastMove);
      if (!hasMove) {
        return isKo ? `하지만 기술은 실패했다!` : `But it failed!`;
      }
    }

    // 5. 해당 기술의 PP가 0인 경우
    if (target.moves && target.movePps) {
      const moveIdx = target.moves.findIndex(m => getMoveKey(m) === lastMove);
      if (moveIdx !== -1 && target.movePps[moveIdx] <= 0) {
        return isKo ? `하지만 기술은 실패했다!` : `But it failed!`;
      }
    }

    target.encoreMove = lastMove;
    target.encoreTurns = 3;
    const targetMoveData = getMoveData(lastMove);
    const lockedName = isKo ? (targetMoveData?.nameKo || lastMove) : (targetMoveData?.name || lastMove);
    return isKo
      ? `${targetName}(은)는 앙코르에 빠져들었다! 3턴간 ${lockedName}만 사용해야 한다!`
      : `${targetName} received an encore! Forced to repeat ${lockedName} for 3 turns!`;
  }

  // 8. Whirlwind / Roar
  if (mName === "whirlwind" || mName === "roar") {
    if (target.isIngrained) {
      return isKo
        ? `하지만 ${targetName}(은)는 대지에 뿌리를 박고 있어 날아가지 않는다!`
        : `But ${targetName} anchored itself with its roots!`;
    }
    if (target.ability === "Suction Cups" || target.passiveAbility === "Suction Cups") {
      return isKo
        ? `[특성 흡반!] ${targetName}(은)는 바닥에 단단히 고정되어 날아가지 않았다!`
        : `[Suction Cups!] ${targetName} anchored itself firmly and was not blown away!`;
    }

    const isPlayerActor = actor === battle?.playerBattleMon || actor === battle?.playerParty?.[battle?.playerActiveIndex || 0];
    if (isPlayerActor) {
      if (target.isBoss) {
        return isKo ? `하지만 거대한 보스 포켓몬에게는 통하지 않았다!` : `But it had no effect on the massive Boss Pokémon!`;
      }
      if (battle) {
        battle.phase = "VICTORY";
        battle.score += target.level * 5;
      }
      return isKo
        ? `야생 ${targetName}(은)는 거센 돌풍에 날아가버렸다!\n배틀이 종료되었습니다!`
        : `Wild ${targetName} was blown away by the whirlwind!\nThe battle ended!`;
    } else {
      if (battle && battle.playerParty && battle.playerParty.length > 0) {
        const aliveIndices = battle.playerParty
          .map((p, idx) => ({ p, idx }))
          .filter((item) => item.idx !== battle.playerActiveIndex && item.p.hp > 0);

        if (aliveIndices.length > 0) {
          const randomPick = aliveIndices[Math.floor(Math.random() * aliveIndices.length)];
          battle.playerParty[battle.playerActiveIndex].hp = target.hp;
          battle.playerActiveIndex = randomPick.idx;
          // Re-create battle mon through external caller or factory
          return isKo
            ? `${targetName}(은)는 돌풍에 날아가 볼로 돌아갔다!`
            : `${targetName} was blown away and forced to switch!`;
        }
      }
      return isKo ? `하지만 교체할 다른 포켓몬이 없어 통하지 않았다!` : `But there was no other Pokémon to switch in!`;
    }
  }

  // 8.1 Teleport (순간이동) - 야생이면 배틀종료, 플레이어 혹은 트레이너 상대면 포켓몬교체
  if (mName === "teleport" || move.nameKo === "순간이동") {
    const isPlayerActor = actor === battle?.playerBattleMon || actor === battle?.playerParty?.[battle?.playerActiveIndex || 0];
    const isTrainerOrPlayer = Boolean(
      target.isBoss ||
      actor.isBoss ||
      (target as any).isTrainer ||
      (target as any).isPlayer ||
      battle?.gameMode === "multiplayer" ||
      battle?.gameMode === "PvP"
    );

    // [규칙 1] 야생 배틀인 경우 -> 배틀 종료 (도주)
    if (!isTrainerOrPlayer) {
      if (battle) {
        battle.phase = "VICTORY";
        if (!isPlayerActor) {
          battle.score += actor.level * 5;
        }
      }
      if (!isPlayerActor) {
        return isKo
          ? `야생 ${actorName}(은)는 순간이동으로 전장을 이탈했다!\n배틀이 종료되었습니다!`
          : `Wild ${actorName} teleported away from battle!\nThe battle ended!`;
      } else {
        return isKo
          ? `${actorName}(은)는 순간이동으로 배틀에서 무사히 이탈했다!\n배틀이 종료되었습니다!`
          : `${actorName} teleported away safely!\nThe battle ended!`;
      }
    }

    // [규칙 2] 플레이어 혹은 트레이너 상대인 경우 -> 포켓몬 교체
    if (isPlayerActor) {
      if (battle && battle.playerParty && battle.playerParty.length > 0) {
        const aliveSubstitutes = battle.playerParty
          .map((p, idx) => ({ p, idx }))
          .filter((item) => item.idx !== battle.playerActiveIndex && item.p.hp > 0);

        if (aliveSubstitutes.length > 0) {
          const nextIdx = aliveSubstitutes[0].idx;
          battle.playerParty[battle.playerActiveIndex].hp = actor.hp;
          battle.playerActiveIndex = nextIdx;
          battle.playerBattleMon = createPlayerBattleMon(battle.playerParty[nextIdx], battle.playerParty);

          let abilityLog = "";
          if (battle.playerBattleMon.ability === "Intimidate" || battle.playerBattleMon.passiveAbility === "Intimidate") {
            battle.enemy.stages.atk = Math.max(-6, battle.enemy.stages.atk - 1);
            abilityLog += isKo
              ? `\n[특성 위협!] 상대 ${targetName}의 공격이 떨어졌다! (-1)`
              : `\n[Intimidate!] Foe ${targetName}'s Attack fell! (-1)`;
          }

          return isKo
            ? `${actorName}(은)는 순간이동으로 전장을 안전하게 이탈했다!\n가랏, ${battle.playerBattleMon.name}!${abilityLog}`
            : `${actorName} teleported back safely!\nGo, ${battle.playerBattleMon.name}!${abilityLog}`;
        }
      }
      return isKo
        ? `하지만 교체할 포켓몬이 없어 기술이 실패했다!`
        : `But there was no other Pokémon to switch in!`;
    } else {
      // 상대 트레이너의 포켓몬 교체 (단일 보스/트레이너인 경우 실패)
      return isKo
        ? `하지만 교체할 포켓몬이 없어 기술이 실패했다!`
        : `But there was no other Pokémon to switch in!`;
    }
  }

  // 9. Belly Drum
  if (mName === "belly-drum") {
    const halfHp = Math.floor(actor.maxHp * 0.5);
    if (actor.hp > halfHp && actor.stages.atk < 6) {
      actor.hp -= halfHp;
      actor.stages.atk = 6;
      recordStatChange("actor", "up");
      return isKo ? `자신의 HP를 깎아 공격을 최대치(+6)까지 올렸다!` : `Cut its own HP to max out Attack (+6)!`;
    }
    return isKo ? `하지만 공격은 이미 최대치이거나 HP가 부족하다!` : `But it failed!`;
  }

  // 10. Shell Smash
  if (mName === "shell-smash") {
    actor.stages.def = Math.max(-6, actor.stages.def - 1);
    actor.stages.spd = Math.max(-6, actor.stages.spd - 1);
    actor.stages.atk = Math.min(6, actor.stages.atk + 2);
    actor.stages.spa = Math.min(6, actor.stages.spa + 2);
    actor.stages.spe = Math.min(6, actor.stages.spe + 2);
    recordStatChange("actor", "down");
    recordStatChange("actor", "up");
    return isKo
      ? `방어와 특수방어가 떨어지고 공격, 특수공격, 스피드가 크게 올랐다! (+2)`
      : `Defense and Sp. Def fell, Attack, Sp. Atk, and Speed sharply rose! (+2)`;
  }

  // 11. Haze
  if (mName === "haze") {
    actor.stages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 };
    target.stages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 };
    return isKo ? `모든 포켓몬의 능력치 변화가 초기화되었다!` : `All stat changes were reset!`;
  }

  // 12. Memento
  if (mName === "memento" || mName === "262" || mName === "추억의선물" || mName === "추억의 선물") {
    actor.hp = 0;
    const l1 = applyStage("target", "atk", "공격", "Attack", -2);
    const l2 = applyStage("target", "spa", "특수공격", "Sp. Atk", -2);
    const faintLog = isKo
      ? `${actorName}(은)는 쓰러지고 ${targetName}의 공격과 특수공격이 크게 떨어졌다! (-2)`
      : `${actorName} fainted, and ${targetName}'s Attack and Sp. Atk harshly fell! (-2)`;
    // If stats were blocked (e.g. Clear Body / White Smoke / Mist), include the block log
    if (l1.includes("떨어지지 않는다") || l1.includes("cannot be lowered") || l1.includes("효과가 없었다") || l1.includes("won't go any")) {
      return `${actorName}(은)는 쓰러졌다!\n${l1}`;
    }
    return faintLog;
  }

  // 13. Weather Setting Moves
  if (["sunny-day", "sunny_day", "sunnyday", "241", "쾌청"].includes(mName) || move.id === 241 || move.nameKo === "쾌청") {
    if (battle?.weather === "sun") {
      return isKo ? `하지만 이미 햇살이 강하다!` : `But the sunlight is already harsh!`;
    }
    if (battle) { battle.weather = "sun"; battle.weatherTurns = 5; }
    return isKo ? `햇살이 아주 강해졌다! (5턴 지속)` : `The sunlight turned harsh! (5 turns)`;
  }
  if (["rain-dance", "rain_dance", "raindance", "240", "비바라기"].includes(mName) || move.id === 240 || move.nameKo === "비바라기") {
    if (battle?.weather === "rain") {
      return isKo ? `하지만 이미 비가 내리고 있다!` : `But it is already raining!`;
    }
    if (battle) { battle.weather = "rain"; battle.weatherTurns = 5; }
    return isKo ? `비가 내리기 시작했다! (5턴 지속)` : `It started to rain! (5 turns)`;
  }
  if (["psych-up", "psych_up", "psychup", "244", "자기암시"].includes(mName) || move.id === 244 || move.nameKo === "자기암시") {
    actor.stages = {
      atk: target.stages.atk,
      def: target.stages.def,
      spa: target.stages.spa,
      spd: target.stages.spd,
      spe: target.stages.spe,
      acc: target.stages.acc,
      eva: target.stages.eva,
    };
    return isKo
      ? `${actorName}(은)는 ${targetName}의 능력 변화를 복사했다!`
      : `${actorName} copied ${targetName}'s stat changes!`;
  }
  if (mName === "sandstorm") {
    if (battle?.weather === "sand") {
      return isKo ? `하지만 이미 모래바람이 불고 있다!` : `But a sandstorm is already raging!`;
    }
    if (battle) { battle.weather = "sand"; battle.weatherTurns = 5; }
    return isKo ? `모래바람이 세차게 불기 시작했다! (5턴 지속)` : `A sandstorm kicked up! (5 turns)`;
  }
  if (["snowscape", "hail", "258", "싸라기눈", "chilly-reception"].includes(mName) || move.id === 258 || move.nameKo === "싸라기눈") {
    if (battle?.weather === "snow") {
      return isKo ? `하지만 이미 싸라기눈이 내리고 있다!` : `But hail is already falling!`;
    }
    if (battle) { battle.weather = "snow"; battle.weatherTurns = 5; }
    return isKo ? `싸라기눈이 내리기 시작했다! (5턴 지속)` : `It started to hail! (5 turns)`;
  }
  if (mName === "defog") {
    if (battle) { battle.weather = null; battle.weatherTurns = undefined; }
    target.stages.eva = Math.max(-6, target.stages.eva - 1);
    return isKo
      ? `날씨가 맑아지고 ${targetName}의 회피율이 떨어졌다! (-1)`
      : `The weather cleared and ${targetName}'s evasiveness fell! (-1)`;
  }

  // 14. Weather-scaling heals (Synthesis, Morning Sun, Moonlight)
  if (
    ["synthesis", "235", "광합성", "morning-sun", "morning_sun", "morningsun", "234", "아침햇살", "moonlight", "236", "달빛", "달의불빛"].includes(mName) ||
    move.id === 234 || move.id === 235 || move.id === 236 ||
    ["아침햇살", "광합성", "달빛", "달의불빛"].includes(move.nameKo)
  ) {
    if (actor.hp >= actor.maxHp) {
      return isKo ? `하지만 HP가 이미 가득 차 있다!` : `But its HP is already full!`;
    }
    const healRatio = battle?.weather === "sun" ? (2 / 3) : (battle?.weather ? 0.25 : 0.5);
    const maxHeal = Math.max(1, Math.floor(actor.maxHp * healRatio));
    const actualHeal = Math.min(maxHeal, actor.maxHp - actor.hp);
    actor.hp += actualHeal;
    return isKo ? `${actorName}의 HP가 ${actualHeal} 회복되었다!` : `${actorName} restored ${actualHeal} HP!`;
  }

  // 15. Status Inflicting Moves
  if (["thunder-wave", "glare", "stun-spore", "nuzzle"].includes(mName)) {
    if (target.safeguardTurns && target.safeguardTurns > 0) {
      return isKo
        ? `[신비의부적] ${targetName}(은)는 신비의부적의 가호로 상태이상에 걸리지 않는다!`
        : `[Safeguard] ${targetName} is protected by Safeguard!`;
    }
    if (mName === "thunder-wave" && target.types.some(t => t.toLowerCase() === "ground")) {
      return isKo ? `하지만 ${targetName}에게는 효과가 없는 것 같다...` : `It doesn't affect ${targetName}...`;
    }
    if (!target.types.some(t => t.toLowerCase() === "electric") && !target.status) {
      target.status = "par";
      return isKo ? `${targetName}(은)는 마비에 걸렸다!` : `${targetName} is paralyzed!`;
    }
    return isKo ? `하지만 효과가 없었다!` : `It had no effect!`;
  }

  if (["spore", "sleep-powder", "hypnosis", "sing", "dark-void", "grass-whistle", "lovely-kiss"].includes(mName)) {
    if (target.safeguardTurns && target.safeguardTurns > 0) {
      return isKo
        ? `[신비의부적] ${targetName}(은)는 신비의부적의 가호로 상태이상에 걸리지 않는다!`
        : `[Safeguard] ${targetName} is protected by Safeguard!`;
    }
    const isPowder = mName === "spore" || mName === "sleep-powder";
    if ((!isPowder || !target.types.map(t => t.toLowerCase()).includes("grass")) && !target.status) {
      target.status = "slp";
      target.sleepTurns = 0;
      target.sleepDuration = Math.floor(Math.random() * 2) + 2; // 2~3턴 수면 보장
      return isKo ? `${targetName}(은)는 깊은 잠에 빠졌다!` : `${targetName} fell fast asleep!`;
    }
    return isKo ? `하지만 효과가 없었다!` : `It had no effect!`;
  }

  if (["will-o-wisp", "will_o_wisp", "261"].includes(mName) || move.nameKo === "도깨비불") {
    if (target.safeguardTurns && target.safeguardTurns > 0) {
      return isKo
        ? `[신비의부적] ${targetName}(은)는 신비의부적의 가호로 상태이상에 걸리지 않는다!`
        : `[Safeguard] ${targetName} is protected by Safeguard!`;
    }
    const targetAbility = (target.ability || "").toLowerCase().replace(/[\s_]+/g, "-");
    const targetPassive = (target.passiveAbility || "").toLowerCase().replace(/[\s_]+/g, "-");
    if (targetAbility === "water-veil" || targetPassive === "water-veil") {
      return isKo
        ? `[특성 수의베일] ${targetName}(은)는 수의베일로 인해 화상을 입지 않는다!`
        : `[Water Veil] ${targetName}'s Water Veil prevents burns!`;
    }
    if (targetAbility === "flash-fire" || targetPassive === "flash-fire") {
      return isKo
        ? `[특성 타오르는불꽃] ${targetName}(은)는 불꽃을 흡수했다!`
        : `[Flash Fire] ${targetName}'s Flash Fire absorbed the fire!`;
    }
    if (targetAbility === "water-bubble" || targetPassive === "water-bubble") {
      return isKo
        ? `[특성 수포] ${targetName}(은)는 수포로 인해 화상을 입지 않는다!`
        : `[Water Bubble] ${targetName}'s Water Bubble prevents burns!`;
    }
    if (targetAbility === "purifying-salt" || targetPassive === "purifying-salt") {
      return isKo
        ? `[특성 정화의소금] ${targetName}(은)는 정화의소금으로 인해 상태이상에 걸리지 않는다!`
        : `[Purifying Salt] ${targetName}'s Purifying Salt prevents status conditions!`;
    }
    if (targetAbility === "comatose" || targetPassive === "comatose") {
      return isKo
        ? `[특성 절대안깸] ${targetName}(은)는 다른 상태이상에 걸리지 않는다!`
        : `[Comatose] ${targetName} cannot be affected by status conditions!`;
    }
    if (!target.types.some(t => t.toLowerCase() === "fire") && !target.status) {
      target.status = "brn";
      return isKo ? `${targetName}(은)는 불꽃에 휩싸여 화상을 입었다!` : `${targetName} was burned!`;
    }
    return isKo ? `하지만 효과가 없었다!` : `It had no effect!`;
  }

  if (["toxic", "poison-powder", "poison-gas"].includes(mName)) {
    if (target.safeguardTurns && target.safeguardTurns > 0) {
      return isKo
        ? `[신비의부적] ${targetName}(은)는 신비의부적의 가호로 상태이상에 걸리지 않는다!`
        : `[Safeguard] ${targetName} is protected by Safeguard!`;
    }
    const targetAbility = target.ability?.toLowerCase();
    if (targetAbility === "immunity" || target.passiveAbility?.toLowerCase() === "immunity") {
      return isKo
        ? `[특성 면역] ${targetName}(은)는 면역으로 인해 독에 걸리지 않는다!`
        : `[Immunity] ${targetName}'s Immunity prevents poisoning!`;
    }
    if (!target.types.includes("poison") && !target.types.includes("steel") && !target.status) {
      target.status = mName === "toxic" ? "tox" : "psn";
      target.toxicCounter = 1;
      return isKo
        ? `${targetName}(은)는 ${mName === "toxic" ? "맹독에 걸렸다" : "독에 중독되었다"}!`
        : `${targetName} was ${mName === "toxic" ? "badly poisoned" : "poisoned"}!`;
    }
    return isKo ? `하지만 효과가 없었다!` : `It had no effect!`;
  }

  if (["supersonic", "confuse-ray", "sweet-kiss", "teeter-dance"].includes(mName)) {
    if (target.safeguardTurns && target.safeguardTurns > 0) {
      return isKo
        ? `[신비의부적] ${targetName}(은)는 신비의부적의 가호로 혼란에 걸리지 않는다!`
        : `[Safeguard] ${targetName} is protected by Safeguard!`;
    }
    if (target.isConfused || (target.confusionTurns && target.confusionTurns > 0)) {
      return isKo ? `${targetName}(은)는 이미 혼란에 빠져 있다!` : `${targetName} is already confused!`;
    }
    target.isConfused = true;
    target.confusionTurns = Math.floor(Math.random() * 4) + 2;
    return isKo ? `${targetName}(은)는 혼란에 빠졌다!` : `${targetName} became confused!`;
  }

  if (mName === "swagger" || move.nameKo === "뽐내기" || mName === "207") {
    const atkLog = applyStage("target", "atk", "공격", "Attack", 2);
    let confuseLog = "";
    const targetAbility = (target.ability || "").toLowerCase().replace(/[\s_]+/g, "-");
    const targetPassive = (target.passiveAbility || "").toLowerCase().replace(/[\s_]+/g, "-");
    if (target.safeguardTurns && target.safeguardTurns > 0) {
      confuseLog = isKo
        ? `[신비의부적] ${targetName}(은)는 신비의부적의 가호로 혼란에 걸리지 않는다!`
        : `[Safeguard] ${targetName} is protected by Safeguard!`;
    } else if (targetAbility === "own-tempo" || targetPassive === "own-tempo") {
      confuseLog = isKo ? `[특성 마이페이스] ${targetName}에게는 혼란이 통하지 않는다!` : `[Own Tempo] ${targetName} cannot be confused!`;
    } else if (target.isConfused || (target.confusionTurns && target.confusionTurns > 0)) {
      confuseLog = isKo ? `${targetName}(은)는 이미 혼란에 빠져 있다!` : `${targetName} is already confused!`;
    } else {
      target.isConfused = true;
      target.confusionTurns = Math.floor(Math.random() * 4) + 2;
      confuseLog = isKo ? `${targetName}(은)는 혼란에 빠졌다!` : `${targetName} became confused!`;
    }
    return `${atkLog}\n${confuseLog}`;
  }

  if (mName === "flatter" || move.nameKo === "부추기기" || mName === "260") {
    const spaLog = applyStage("target", "spa", "특수공격", "Sp. Atk", 1);
    let confuseLog = "";
    const targetAbility = (target.ability || "").toLowerCase().replace(/[\s_]+/g, "-");
    const targetPassive = (target.passiveAbility || "").toLowerCase().replace(/[\s_]+/g, "-");
    if (target.safeguardTurns && target.safeguardTurns > 0) {
      confuseLog = isKo
        ? `[신비의부적] ${targetName}(은)는 신비의부적의 가호로 혼란에 걸리지 않는다!`
        : `[Safeguard] ${targetName} is protected by Safeguard!`;
    } else if (targetAbility === "own-tempo" || targetPassive === "own-tempo") {
      confuseLog = isKo ? `[특성 마이페이스] ${targetName}에게는 혼란이 통하지 않는다!` : `[Own Tempo] ${targetName} cannot be confused!`;
    } else if (target.isConfused || (target.confusionTurns && target.confusionTurns > 0)) {
      confuseLog = isKo ? `${targetName}(은)는 이미 혼란에 빠져 있다!` : `${targetName} is already confused!`;
    } else {
      target.isConfused = true;
      target.confusionTurns = Math.floor(Math.random() * 4) + 2;
      confuseLog = isKo ? `${targetName}(은)는 혼란에 빠졌다!` : `${targetName} became confused!`;
    }
    return `${spaLog}\n${confuseLog}`;
  }

  if (mName === "rest") {
    const ability = (actor.ability || "").toLowerCase().replace(/[\s_]+/g, "-");
    const passive = (actor.passiveAbility || "").toLowerCase().replace(/[\s_]+/g, "-");
    if (ability === "insomnia" || ability === "vital-spirit" || passive === "insomnia" || passive === "vital-spirit") {
      return isKo ? `하지만 ${actorName}의 특성 때문에 잠들 수 없다!` : `But ${actorName}'s ability prevents sleep!`;
    }
    if (actor.status === "slp") {
      return isKo ? `하지만 이미 잠들어 있다!` : `But ${actorName} is already asleep!`;
    }
    if (actor.hp >= actor.maxHp) {
      return isKo ? `하지만 이미 체력이 가득 차 있다!` : `But its HP is already full!`;
    }
    actor.hp = actor.maxHp;
    actor.status = "slp";
    actor.sleepTurns = 0;
    actor.sleepDuration = 2;
    actor.toxicCounter = 0;
    return isKo ? `${actorName}(은)는 잠을 자서 체력과 상태이상을 모두 회복했다!` : `${actorName} went to sleep, fully restoring HP and curing its status!`;
  }

  // 215. 치료방울 (Heal Bell) & 아로마테라피 (Aromatherapy)
  if (
    ["heal-bell", "heal_bell", "healbell", "215", "치료방울", "aromatherapy", "아로마테라피"].includes(mName) ||
    move.nameKo === "치료방울" ||
    move.nameKo === "아로마테라피"
  ) {
    const isHealBell = !mName.includes("aroma") && move.nameKo !== "아로마테라피";
    const hadStatus = Boolean(actor.status);
    actor.status = null;
    actor.sleepTurns = 0;
    actor.sleepDuration = 0;
    actor.toxicCounter = 0;

    let partyCuredCount = 0;
    if (battle?.playerParty && (actor === battle?.playerBattleMon || !battle?.enemy || actor !== battle?.enemy)) {
      for (const mon of battle.playerParty) {
        const monStatus = (mon as any).status;
        if (monStatus) {
          // 본인 외의 파티원이 방음(Soundproof) 특성인 경우 소리 기술(치료방울)의 치료 효과를 받지 못함
          if (isHealBell) {
            const ability = (mon.ability || "").toLowerCase().replace(/[\s_]+/g, "-");
            const passive = (mon.passiveAbility || "").toLowerCase().replace(/[\s_]+/g, "-");
            if (ability === "soundproof" || passive === "soundproof") {
              continue;
            }
          }
          (mon as any).status = null;
          (mon as any).sleepTurns = 0;
          (mon as any).sleepDuration = 0;
          (mon as any).toxicCounter = 0;
          partyCuredCount++;
        }
      }
    }

    const soundChimeLog = isKo
      ? (isHealBell ? `기분 좋은 방울소리가 울려 퍼졌다!` : `상쾌한 향기가 퍼져나갔다!`)
      : (isHealBell ? `A bell chimed!` : `A soothing aroma wafted through the area!`);

    if (hadStatus || partyCuredCount > 0) {
      const cureLog = isKo
        ? `${actorName} 팀의 상태이상이 모두 치료되었다!`
        : `${actorName}'s team was cured of all status conditions!`;
      return `${soundChimeLog}\n${cureLog}`;
    }

    return soundChimeLog;
  }

  if (["attract", "213", "헤롱헤롱"].includes(mName) || move.nameKo === "헤롱헤롱") {
    const actorGender = getPokemonGender(actor);
    const targetGender = getPokemonGender(target);

    // 1. 무성 포켓몬 검증
    if (actorGender === "genderless" || targetGender === "genderless") {
      return isKo
        ? `하지만 ${targetName}에게는 효과가 없는 것 같다...`
        : `It doesn't affect ${targetName}...`;
    }

    // 2. 동성 포켓몬 검증
    if (actorGender === targetGender) {
      return isKo
        ? `하지만 ${targetName}에게는 효과가 없는 것 같다...`
        : `It doesn't affect ${targetName}...`;
    }

    // 3. 특성 면역 검증 (둔감 / Oblivious, 아로마베일 / Aroma Veil)
    const tAbility = (target.ability || "").toLowerCase();
    const tPassive = (target.passiveAbility || "").toLowerCase();
    if (tAbility === "oblivious" || tPassive === "oblivious") {
      return isKo
        ? `하지만 ${targetName}의 둔감 특성으로 인해 사랑에 빠지지 않는다!`
        : `${targetName}'s Oblivious prevents infatuation!`;
    }
    if (tAbility === "aroma-veil" || tPassive === "aroma-veil") {
      return isKo
        ? `하지만 ${targetName}의 아로마베일로 인해 사랑에 빠지지 않는다!`
        : `${targetName}'s Aroma Veil prevents infatuation!`;
    }

    // 4. 이미 헤롱헤롱 상태인 경우
    if (target.isAttracted) {
      return isKo
        ? `하지만 ${targetName}(은)는 이미 헤롱헤롱 상태다!`
        : `But ${targetName} is already in love!`;
    }

    target.isAttracted = true;
    target.attractedBy = (actor === battle?.playerBattleMon) ? "player" : "enemy";
    return isKo
      ? `${targetName}(은)는 ${actorName}에게 사랑에 빠져 헤롱헤롱해졌다!`
      : `${targetName} fell in love with ${actorName}!`;
  }

  if (["taunt", "269", "도발"].includes(mName) || move.id === 269 || move.nameKo === "도발") {
    const targetAb = target.ability?.toLowerCase().replace(/[\s_]+/g, "-");
    const targetPass = target.passiveAbility?.toLowerCase().replace(/[\s_]+/g, "-");
    if (targetAb === "oblivious" || targetPass === "oblivious" || targetAb === "aroma-veil" || targetPass === "aroma-veil") {
      return isKo ? `상대의 특성으로 인해 도발이 통하지 않았다!` : `Target's ability blocks Taunt!`;
    }
    if (target.isTaunted) {
      return isKo ? `하지만 이미 도발당해 있다!` : `But it fell for the taunt already!`;
    }
    target.isTaunted = true;
    target.tauntTurns = 3;
    return isKo ? `${targetName}(은)는 도발에 넘어가 공격 기술만 쓸 수 있게 되었다! (3턴)` : `${targetName} fell for the taunt!`;
  }

  // 16. Standard Buff Moves
  if (mName === "swords-dance") return applyStage("actor", "atk", "공격", "Attack", 2);
  if (["meditate", "sharpen", "howl"].includes(mName)) return applyStage("actor", "atk", "공격", "Attack", 1);
  if (["nasty-plot", "tail-glow"].includes(mName)) return applyStage("actor", "spa", "특수공격", "Sp. Atk", mName === "tail-glow" ? 3 : 2);
  if (["harden", "withdraw", "defense-curl"].includes(mName)) {
    if (mName === "defense-curl") {
      (actor as any).defenseCurlUsed = true;
    }
    return applyStage("actor", "def", "방어", "Defense", 1);
  }
  if (["barrier", "acid-armor", "iron-defense", "cotton-guard"].includes(mName)) {
    return applyStage("actor", "def", "방어", "Defense", mName === "cotton-guard" ? 3 : 2);
  }
  if (mName === "amnesia") return applyStage("actor", "spd", "특수방어", "Sp. Def", 2);
  if (["agility", "rock-polish", "autotomize"].includes(mName)) return applyStage("actor", "spe", "스피드", "Speed", 2);
  if (["minimize", "double-team"].includes(mName)) {
    if (mName === "minimize") {
      actor.hasMinimized = true;
    }
    return applyStage("actor", "eva", "회피율", "Evasiveness", mName === "minimize" ? 2 : 1);
  }
  if (mName === "growth") {
    applyStage("actor", "atk", "공격", "Attack", 1);
    return applyStage("actor", "spa", "특수공격", "Sp. Atk", 1);
  }
  if (mName === "dragon-dance") {
    applyStage("actor", "atk", "공격", "Attack", 1);
    return applyStage("actor", "spe", "스피드", "Speed", 1);
  }
  if (mName === "calm-mind") {
    applyStage("actor", "spa", "특수공격", "Sp. Atk", 1);
    return applyStage("actor", "spd", "특수방어", "Sp. Def", 1);
  }
  if (mName === "bulk-up") {
    applyStage("actor", "atk", "공격", "Attack", 1);
    return applyStage("actor", "def", "방어", "Defense", 1);
  }
  if (["charge", "268", "충전"].includes(mName) || move.id === 268 || move.nameKo === "충전") {
    actor.isCharged = true;
    const stageLog = applyStage("actor", "spd", "특수방어", "Sp. Def", 1);
    return isKo
      ? `${actorName}(은)는 전력을 모아 충전했다!\n${stageLog}`
      : `${actorName} began charging power!\n${stageLog}`;
  }
  if (["stockpile", "254", "비축하기", "비축"].includes(mName) || move.id === 254 || move.nameKo === "비축하기") {
    const currentCount = actor.stockpileCount || 0;
    if (currentCount >= 3) {
      return isKo
        ? `하지만 ${actorName}(은)는 더 이상 비축할 수 없다!`
        : `But ${actorName} cannot stockpile any more!`;
    }
    actor.stockpileCount = currentCount + 1;
    applyStage("actor", "def", "방어", "Defense", 1);
    applyStage("actor", "spd", "특수방어", "Sp. Def", 1);
    return isKo
      ? `${actorName}(은)는 힘을 ${actor.stockpileCount}개 비축했다!`
      : `${actorName} stockpiled ${actor.stockpileCount}!`;
  }
  if (["swallow", "256", "꿀꺽"].includes(mName) || move.id === 256 || move.nameKo === "꿀꺽") {
    const count = actor.stockpileCount || 0;
    if (count <= 0) {
      return isKo
        ? `하지만 아무것도 비축되어 있지 않아 실패했다!`
        : `But ${actorName} had nothing stockpiled!`;
    }
    const healRatio = count === 1 ? 0.25 : count === 2 ? 0.50 : 1.0;
    const healAmount = Math.max(1, Math.floor(actor.maxHp * healRatio));
    const actualHeal = Math.min(healAmount, Math.max(0, actor.maxHp - actor.hp));
    actor.hp += actualHeal;

    actor.stockpileCount = 0;

    applyStage("actor", "def", "방어", "Defense", -count);
    applyStage("actor", "spd", "특수방어", "Sp. Def", -count);

    return isKo
      ? `${actorName}(은)는 비축한 힘을 꿀꺽 삼켜 HP를 ${actualHeal} 회복했다! 비축된 힘이 사라졌다!`
      : `${actorName} swallowed its stockpile and restored ${actualHeal} HP! Its stockpiled effect wore off!`;
  }
  if (mName === "quiver-dance") {
    applyStage("actor", "spa", "특수공격", "Sp. Atk", 1);
    applyStage("actor", "spd", "특수방어", "Sp. Def", 1);
    return applyStage("actor", "spe", "스피드", "Speed", 1);
  }

  // 17. Standard Debuff Moves
  if (["growl", "play-nice"].includes(mName)) return applyStage("target", "atk", "공격", "Attack", -1);
  if (["charm", "feather-dance", "baby-doll-eyes", "204", "애교부리기"].includes(mName)) return applyStage("target", "atk", "공격", "Attack", mName === "baby-doll-eyes" ? -1 : -2);
  if (["tail-whip", "leer"].includes(mName)) return applyStage("target", "def", "방어", "Defense", -1);
  if (mName === "screech") return applyStage("target", "def", "방어", "Defense", -2);
  if (["fake-tears", "metal-sound"].includes(mName)) return applyStage("target", "spd", "특수방어", "Sp. Def", -2);
  if (["cotton-spore", "cottonspore", "178", "목화포자", "코튼포자"].includes(mName)) {
    const isGrass = target.types?.some(t => t.toLowerCase() === "grass");
    const hasOvercoat = target.ability?.toLowerCase() === "overcoat" || target.passiveAbility?.toLowerCase() === "overcoat";
    if (isGrass || hasOvercoat) {
      return isKo ? `하지만 ${targetName}에게는 효과가 없는 것 같다...` : `It doesn't affect ${targetName}...`;
    }
    return applyStage("target", "spe", "스피드", "Speed", -2);
  }
  if (["string-shot", "scary-face", "scary_face", "scaryface", "184", "겁나는얼굴"].includes(mName)) return applyStage("target", "spe", "스피드", "Speed", -2);
  if (["flash", "sand-attack", "smokescreen", "kinesis"].includes(mName)) return applyStage("target", "acc", "명중률", "Accuracy", -1);
  if (["sweet-scent", "sweet_scent", "sweetscent", "230", "달콤한향기", "달콤한 향기"].includes(mName) || move.id === 230 || move.nameKo === "달콤한향기" || move.nameKo === "달콤한 향기") return applyStage("target", "eva", "회피율", "Evasiveness", -2);
  if (["spider-web", "spiderweb", "169", "거미집", "mean-look", "meanlook", "212", "검은눈빛", "block", "블록"].includes(mName) || move.nameKo === "거미집" || move.nameKo === "검은눈빛" || move.nameKo === "블록") {
    const isGhostTarget = Boolean(target.types?.some((t) => t.toLowerCase() === "ghost"));
    if (isGhostTarget) {
      return isKo
        ? `하지만 고스트 타입인 ${targetName}에게는 통하지 않는다!`
        : `It doesn't affect ${targetName}...`;
    }
    if (target.cannotEscape) {
      return isKo ? `하지만 ${targetName}(은)는 이미 도망칠 수 없다!` : `But it failed!`;
    }
    target.cannotEscape = true;
    if (mName === "mean-look" || mName === "meanlook" || mName === "212" || move.nameKo === "검은눈빛") {
      return isKo
        ? `${targetName}(은)는 검은눈빛에 사로잡혀 도망칠 수 없게 되었다!`
        : `${targetName} can no longer escape!`;
    }
    if (mName === "block" || move.nameKo === "블록") {
      return isKo
        ? `${targetName}(은)는 길이 막혀 도망칠 수 없게 되었다!`
        : `${targetName} can no longer escape!`;
    }
    return isKo
      ? `${targetName}(은)는 거미집에 묶여 도망칠 수 없게 되었다!`
      : `${targetName} was trapped in the web and cannot escape!`;
  }
  if (["mind-reader", "lock-on", "mindreader", "lockon", "170", "199", "마음의눈", "록온"].includes(mName)) {
    const isLockOn = ["lock-on", "lockon", "199", "록온"].includes(mName);
    if (actor.mindReaderTargetId) {
      return isKo
        ? (isLockOn ? `하지만 이미 상대를 조준하고 있다!` : `하지만 이미 상대의 움직임을 읽고 있다!`)
        : `But it failed!`;
    }
    const targetId = (target as any).id || target.speciesId || "target";
    actor.mindReaderTargetId = targetId;
    actor.mindReaderTurnsLeft = 2;
    if (isLockOn) {
      return isKo
        ? `${actorName}(은)는 ${targetName}에게 조준을 맞췄다!`
        : `${actorName} took aim at ${targetName}!`;
    }
    return isKo
      ? `${actorName}(은)는 마음의 눈으로 ${targetName}의 움직임을 포착했다!`
      : `${actorName} took aim at ${targetName}!`;
  }
  if (["nightmare", "171", "악몽"].includes(mName)) {
    if (target.status !== "slp") {
      return isKo
        ? `하지만 ${targetName}(은)는 잠들어 있지 않다!`
        : `But it failed!`;
    }
    if (target.hasNightmare) {
      return isKo
        ? `하지만 ${targetName}(은)는 이미 악몽에 시달리고 있다!`
        : `But it had no effect!`;
    }
    target.hasNightmare = true;
    return isKo
      ? `${targetName}(은)는 악몽에 빠져들었다!`
      : `${targetName} began having a nightmare!`;
  }
  if (["curse", "curse-ghost", "curse-normal", "174", "저주"].includes(mName)) {
    const isGhost = mName === "curse-ghost" || Boolean(actor.types?.some((t) => t.toLowerCase() === "ghost"));

    if (isGhost) {
      if (target.isCursed) {
        return isKo
          ? `하지만 ${targetName}에게는 효과가 없었다!`
          : `But it had no effect!`;
      }
      const hpCost = Math.max(1, Math.floor(actor.maxHp / 2));
      actor.hp = Math.max(0, actor.hp - hpCost);
      target.isCursed = true;
      return isKo
        ? `${actorName}(은)는 자신의 체력을 깎아 ${targetName}에게 저주를 걸었다!`
        : `${actorName} cut its own HP and laid a curse on ${targetName}!`;
    } else {
      applyStage("actor", "spe", "스피드", "Speed", -1);
      recordStatChange("actor", "down");
      applyStage("actor", "atk", "공격", "Attack", 1);
      recordStatChange("actor", "up");
      applyStage("actor", "def", "방어", "Defense", 1);
      recordStatChange("actor", "up");
      return isKo
        ? `${actorName}의 스피드가 떨어지고 공격과 방어가 올라갔다!`
        : `${actorName}'s Speed fell! Its Attack and Defense rose!`;
    }
  }
  if (["mimic", "copycat"].includes(mName)) return isKo ? `상대의 기술을 흉내냈다!` : `Mimicked the target's move!`;
  if (mName === "light-screen") {
    if ((actor.lightScreenTurns || 0) > 0) {
      return isKo ? `하지만 이미 빛의장막이 펼쳐져 있다!` : `Light Screen is already active!`;
    }
    actor.lightScreenTurns = 5;
    return isKo ? `빛의장막으로 5턴간 특수공격 데미지가 절반이 된다!` : `Light Screen halved special damage for 5 turns!`;
  }
  if (mName === "reflect") {
    if ((actor.reflectTurns || 0) > 0) {
      return isKo ? `하지만 이미 리플렉터가 펼쳐져 있다!` : `Reflect is already active!`;
    }
    actor.reflectTurns = 5;
    return isKo ? `리플렉터로 5턴간 물리공격 데미지가 절반이 된다!` : `Reflect halved physical damage for 5 turns!`;
  }
  if (mName === "focus-energy") {
    if (actor.hasFocusEnergy) {
      return isKo ? `하지만 이미 기운을 모아 더는 집중할 수 없다!` : `But it had no effect!`;
    }
    actor.hasFocusEnergy = true;
    return isKo ? `${actorName}(은)는 기운을 집중했다! 급소율이 크게 올랐다!` : `${actorName} is getting pumped! Critical hit ratio rose!`;
  }
  if (mName === "conversion") {
    const TYPE_KO: Record<string, string> = {
      normal: "노말", fire: "불꽃", water: "물", electric: "전기", grass: "풀",
      ice: "얼음", fighting: "격투", poison: "독", ground: "땅", flying: "비행",
      psychic: "에스퍼", bug: "벌레", rock: "바위", ghost: "고스트", dragon: "드래곤",
      steel: "강철", dark: "악", fairy: "페어리"
    };

    let targetType: string | null = null;
    if (actor.moves && actor.moves.length > 0) {
      // 1순위: 0번 슬롯 기술의 타입 (원작/포켓로그 기준)
      const firstMove = getMoveData(actor.moves[0]);
      if (firstMove && firstMove.type && !actor.types.includes(firstMove.type.toLowerCase())) {
        targetType = firstMove.type.toLowerCase();
      } else {
        // 0번 슬롯이 이미 자신의 타입이라면 다른 슬롯 중 변환 가능한 첫 번째 타입 탐색
        for (let i = 1; i < actor.moves.length; i++) {
          const m = getMoveData(actor.moves[i]);
          if (m && m.type && !actor.types.includes(m.type.toLowerCase())) {
            targetType = m.type.toLowerCase();
            break;
          }
        }
      }
    }

    if (!targetType) {
      return isKo ? `하지만 아무 일도 일어나지 않았다!` : `But it failed!`;
    }

    actor.types = [targetType];
    const typeKo = TYPE_KO[targetType] || targetType;
    const typeEn = targetType.toUpperCase();
    return isKo
      ? `${actorName}(은)는 [${typeKo}] 타입으로 텍스처를 변환했다!`
      : `${actorName}'s type converted to [${typeEn}]!`;
  }

  if (mName === "conversion-2" || mName === "conversion2") {
    const TYPE_KO: Record<string, string> = {
      normal: "노말", fire: "불꽃", water: "물", electric: "전기", grass: "풀",
      ice: "얼음", fighting: "격투", poison: "독", ground: "땅", flying: "비행",
      psychic: "에스퍼", bug: "벌레", rock: "바위", ghost: "고스트", dragon: "드래곤",
      steel: "강철", dark: "악", fairy: "페어리"
    };

    // 대상이 마지막으로 사용한 기술의 타입 탐색
    const lastMoveKey = target.lastMoveUsed;
    if (!lastMoveKey) {
      return isKo ? `하지만 아무 일도 일어나지 않았다!` : `But it failed!`;
    }

    const mData = getMoveData(lastMoveKey);
    const lastMoveType = mData?.type?.toLowerCase() || "normal";

    // 상대 기술 타입에 저항(0.5배 이하: 반감 또는 무효)하는 타입들 탐색 (자신의 현재 타입 제외)
    const ALL_TYPES = Object.keys(TYPE_KO);
    const validResistTypes: string[] = [];

    for (const candidateType of ALL_TYPES) {
      if (actor.types.includes(candidateType)) continue;
      const eff = getTypeEffectiveness(lastMoveType, [candidateType]);
      if (eff < 1.0) {
        validResistTypes.push(candidateType);
      }
    }

    if (validResistTypes.length === 0) {
      return isKo ? `하지만 아무 일도 일어나지 않았다!` : `But it failed!`;
    }

    // 후보 타입 중 하나 무작위 선택
    const chosenType = validResistTypes[Math.floor(Math.random() * validResistTypes.length)];
    actor.types = [chosenType];
    const typeKo = TYPE_KO[chosenType] || chosenType;
    const typeEn = chosenType.toUpperCase();
    return isKo
      ? `${actorName}(은)는 [${typeKo}] 타입으로 텍스처를 변환했다!`
      : `${actorName}'s type converted to [${typeEn}]!`;
  }

  // 180. Spite (원한) - 상대가 마지막으로 사용한 기술의 PP를 4 감소
  if (mName === "spite" || mName === "180" || move.nameKo === "원한") {
    // 대상이 마지막으로 사용한 기술 확인
    const lastMoveKey = target.lastMoveUsed || battle?.lastMoveEffect?.moveKey;
    if (!lastMoveKey) {
      return isKo ? `하지만 아무 일도 일어나지 않았다!` : `But it failed!`;
    }

    // 대상의 기술 목록 유효성 검사
    if (!target.moves || target.moves.length === 0) {
      return isKo ? `하지만 아무 일도 일어나지 않았다!` : `But it failed!`;
    }

    // PP 배열이 없거나 크기가 다르면 기본 PP로 초기화
    if (!target.movePps || target.movePps.length !== target.moves.length) {
      target.movePps = target.moves.map((m) => getMoveData(m)?.pp || 20);
    }

    // 대상의 기술 목록에서 lastMoveKey 탐색 (정규화된 키 비교)
    const cleanLastMove = lastMoveKey.toLowerCase().replace(/[\s_]+/g, "-");
    const targetMoveIdx = target.moves.findIndex((m) => {
      const cleanM = m.toLowerCase().replace(/[\s_]+/g, "-");
      return cleanM === cleanLastMove || getMoveKey(cleanM) === getMoveKey(cleanLastMove);
    });

    // 대상이 현재 배우고 있는 기술이 아니면 실패
    if (targetMoveIdx === -1) {
      return isKo ? `하지만 아무 일도 일어나지 않았다!` : `But it failed!`;
    }

    const curPp = target.movePps[targetMoveIdx];
    // 이미 PP가 0이면 실패
    if (curPp <= 0) {
      return isKo ? `하지만 아무 일도 일어나지 않았다!` : `But it failed!`;
    }

    // PP를 최대 4만큼 감소 (남은 PP가 4 미만이면 전부 소진)
    const reduceAmount = Math.min(curPp, 4);
    target.movePps[targetMoveIdx] -= reduceAmount;

    // 대상이 플레이어 포켓몬인 경우 파티 데이터 동기화
    if (battle && battle.playerBattleMon === target && battle.playerParty?.[battle.playerActiveIndex]) {
      battle.playerParty[battle.playerActiveIndex].movePps = [...target.movePps];
    }

    const targetMoveData = getMoveData(target.moves[targetMoveIdx]) || MOVES_DATA[cleanLastMove];
    const targetMoveNameKo = targetMoveData?.nameKo || cleanLastMove;
    const targetMoveNameEn = (targetMoveData?.name || cleanLastMove).toUpperCase();

    return isKo
      ? `${targetName}의 [${targetMoveNameKo}]의 PP가 ${reduceAmount} 깎였다! (남은 PP: ${target.movePps[targetMoveIdx]})`
      : `It reduced the PP of ${targetName}'s [${targetMoveNameEn}] by ${reduceAmount}! (${target.movePps[targetMoveIdx]} PP left)`;
  }

  // 191. Spikes (압정뿌리기) - 상대 진영의 발밑에 압정 설치 (최대 3겹)
  if (mName === "spikes" || mName === "191" || move.nameKo === "압정뿌리기") {
    const isPlayerActor = actor === battle?.playerBattleMon || actor === battle?.playerParty?.[battle?.playerActiveIndex || 0];
    if (battle) {
      if (isPlayerActor) {
        if ((battle.enemySpikesLayers || 0) >= 3) {
          return isKo ? `하지만 상대 진영에는 이미 압정이 가득 뿌려져 있다!` : `Spikes are already scattered all over the opposing team's feet!`;
        }
        battle.enemySpikesLayers = (battle.enemySpikesLayers || 0) + 1;
        const layers = battle.enemySpikesLayers;
        return isKo
          ? `상대 진영의 발밑에 압정이 흩뿌려졌다! (${layers}겹)`
          : `Spikes were scattered all around the opposing team's feet! (${layers} layers)`;
      } else {
        if ((battle.playerSpikesLayers || 0) >= 3) {
          return isKo ? `하지만 우리 진영에는 이미 압정이 가득 뿌려져 있다!` : `Spikes are already scattered all over our team's feet!`;
        }
        battle.playerSpikesLayers = (battle.playerSpikesLayers || 0) + 1;
        const layers = battle.playerSpikesLayers;
        return isKo
          ? `우리 진영의 발밑에 압정이 흩뿌려졌다! (${layers}겹)`
          : `Spikes were scattered all around our team's feet! (${layers} layers)`;
      }
    }
    // Standalone unit test environment without full BattleState
    const targetObj = target as any;
    targetObj.spikesLayers = targetObj.spikesLayers || 0;
    if (targetObj.spikesLayers >= 3) {
      return isKo ? `하지만 상대 진영에는 이미 압정이 가득 뿌려져 있다!` : `Spikes are already scattered all over the opposing team's feet!`;
    }
    targetObj.spikesLayers += 1;
    return isKo
      ? `상대 진영의 발밑에 압정이 흩뿌려졌다! (${targetObj.spikesLayers}겹)`
      : `Spikes were scattered all around the opposing team's feet! (${targetObj.spikesLayers} layers)`;
  }

  // 193. Foresight (꿰뚫어보기) - 상대의 움직임을 꿰뚫어봄 (회피율 무시 및 고스트 실체화)
  if (mName === "foresight" || mName === "193" || move.nameKo === "꿰뚫어보기") {
    if (target.isForesight || target.isIdentified) {
      return isKo ? `하지만 ${targetName}에게는 이미 효과가 적용 중이다!` : `But it had no effect on ${targetName}!`;
    }
    target.isForesight = true;
    target.isIdentified = true;
    return isKo
      ? `${actorName}(은)는 ${targetName}의 움직임을 꿰뚫어보았다!`
      : `${actorName} identified ${targetName}!`;
  }

  // 194. Destiny Bond (길동무) - 시전 포켓몬에게 길동무 상태 부여
  if (mName === "destiny-bond" || mName === "destinybond" || mName === "194" || move.nameKo === "길동무") {
    actor.isDestinyBond = true;
    return isKo
      ? `${actorName}(은)는 상대를 길동무로 삼으려 한다!`
      : `${actorName} is trying to take its opponent with it!`;
  }

  // 195. Perish Song (멸망의노래) - 노래를 들은 모든 활성 포켓몬에게 멸망 카운트 부여
  if (
    mName === "perish-song" ||
    mName === "perish_song" ||
    mName === "perishsong" ||
    mName === "195" ||
    move.nameKo === "멸망의노래" ||
    move.nameKo === "멸망의 노래"
  ) {
    const isActorImmune = Boolean(
      actor.ability?.toLowerCase() === "soundproof" ||
      actor.passiveAbility?.toLowerCase() === "soundproof"
    );
    const isTargetImmune = Boolean(
      target.ability?.toLowerCase() === "soundproof" ||
      target.passiveAbility?.toLowerCase() === "soundproof"
    );

    const actorAlready = Boolean(actor.perishCount && actor.perishCount > 0);
    const targetAlready = Boolean(target.perishCount && target.perishCount > 0);

    const actorAffected = !isActorImmune && !actorAlready;
    const targetAffected = !isTargetImmune && !targetAlready;

    if (!actorAffected && !targetAffected) {
      if (isActorImmune && isTargetImmune) {
        return isKo
          ? "하지만 방음 특성으로 인해 노래가 전혀 통하지 않았다!"
          : "But Soundproof kept everyone from hearing the song!";
      }
      return isKo
        ? "하지만 이미 모든 포켓몬에게 효과가 적용 중이다!"
        : "But it had no effect on anyone!";
    }

    if (actorAffected) {
      actor.perishCount = 4;
    }
    if (targetAffected) {
      target.perishCount = 4;
    }

    const logs: string[] = [];
    logs.push(
      isKo
        ? "노래를 들은 모든 포켓몬은 3턴 뒤에 기절한다!"
        : "All Pokémon hearing the song will faint in three turns!"
    );

    if (isActorImmune) {
      logs.push(
        isKo
          ? `${actorName}(은)는 방음 특성으로 노래가 들리지 않는다!`
          : `${actorName}'s Soundproof blocks the song!`
      );
    }
    if (isTargetImmune) {
      logs.push(
        isKo
          ? `${targetName}(은)는 방음 특성으로 노래가 들리지 않는다!`
          : `${targetName}'s Soundproof blocks the song!`
      );
    }

    return logs.join("\n");
  }

  // Follow Me (날따름): 자신에게 주목시킴
  if (
    ["follow-me", "follow_me", "followme", "266", "날따름"].includes(mName) ||
    move.id === 266 ||
    move.nameKo === "날따름"
  ) {
    (actor as any).isCenterOfAttention = true;
    return isKo
      ? `${actorName}(은)는 자신에게 주목시켰다!`
      : `${actorName} became the center of attention!`;
  }

  // 270: Helping Hand (도우미)
  if (
    ["helping-hand", "helping_hand", "helpinghand", "270", "도우미"].includes(mName) ||
    move.id === 270 ||
    move.nameKo === "도우미"
  ) {
    const recipient = (target && target !== actor) ? target : actor;
    const recipientName = (target && target !== actor) ? targetName : actorName;
    recipient.isHelpingHandBoosted = true;
    return isKo
      ? `${actorName}(은)는 ${recipientName}을(를) 힘껏 도왔다!\n기술의 위력이 1.5배 증가한다!`
      : `${actorName} offered a helping hand to ${recipientName}!\nMove power boosted by 1.5x!`;
  }

  // 271: Trick (트릭)
  if (
    ["trick", "271", "트릭"].includes(mName) ||
    move.id === 271 ||
    move.nameKo === "트릭"
  ) {
    // 1. 대타출동(Substitute) 분신 뒤의 상대에게는 트릭 실패
    if (target.substituteHp && target.substituteHp > 0) {
      return isKo ? `하지만 대타가 대신 막아주어 실패했다!` : `But it failed due to the target's Substitute!`;
    }

    // 2. 점착(Sticky Hold) 및 멀티타입(Multitype)/AR시스템(RKS System) 특성 차단
    const targetAb = (target.ability || "").toLowerCase().replace(/[\s_]+/g, "-");
    const targetPass = (target.passiveAbility || "").toLowerCase().replace(/[\s_]+/g, "-");
    const actorAb = (actor.ability || "").toLowerCase().replace(/[\s_]+/g, "-");
    if (targetAb === "sticky-hold" || targetPass === "sticky-hold" || targetAb === "점착" || targetPass === "점착") {
      return isKo ? `상대의 점착 특성으로 인해 도구를 바꿀 수 없다!` : `Target's Sticky Hold prevents item swapping!`;
    }
    if (
      targetAb === "multitype" || targetAb === "rks-system" ||
      actorAb === "multitype" || actorAb === "rks-system"
    ) {
      return isKo ? `하지만 아무 일도 일어나지 않았다!` : `But nothing happened!`;
    }

    const actorItems = actor.heldItems ? [...actor.heldItems] : (actor.heldItem ? [actor.heldItem] : []);
    const targetItems = target.heldItems ? [...target.heldItems] : (target.heldItem ? [target.heldItem] : []);
    const actorHasItems = actorItems.length > 0;
    const targetHasItems = targetItems.length > 0;

    if (!actorHasItems && !targetHasItems) {
      return isKo ? `하지만 아무 일도 일어나지 않았다!` : `But nothing happened!`;
    }

    // 3. 도구 상호 교환 (배열 및 단일 필드 동기화)
    if (actor.heldItems !== undefined || target.heldItems !== undefined) {
      actor.heldItems = [...targetItems];
      target.heldItems = [...actorItems];
    }

    const tempHeldItem = actor.heldItem ?? (actorItems[0] ?? null);
    const nextActorItem = target.heldItem ?? (targetItems[0] ?? null);
    actor.heldItem = nextActorItem;
    target.heldItem = tempHeldItem;

    // 구애 시리즈 도구 변동 시 기존 구애 기술 잠금 해제
    if ((actor as any).choiceLockedMove) (actor as any).choiceLockedMove = null;
    if ((target as any).choiceLockedMove) (target as any).choiceLockedMove = null;

    if (actorHasItems && targetHasItems) {
      return isKo
        ? `${actorName}(은)는 ${targetName}과 지닌물건을 서로 교환했다!`
        : `${actorName} and ${targetName} swapped their held items!`;
    } else if (actorHasItems) {
      return isKo
        ? `${actorName}(은)는 ${targetName}에게 지닌물건을 넘겨주었다!`
        : `${actorName} passed its held item to ${targetName}!`;
    } else {
      return isKo
        ? `${actorName}(은)는 ${targetName}의 지닌물건을 가로챘다!`
        : `${actorName} stole ${targetName}'s held item!`;
    }
  }

  // 272: Role Play (역할놀이)
  if (
    ["role-play", "role_play", "roleplay", "272", "역할놀이"].includes(mName) ||
    move.id === 272 ||
    move.nameKo === "역할놀이"
  ) {
    if (!target.ability) {
      return isKo ? `하지만 실패했다!` : `But it failed!`;
    }

    // 복사 불가 대상 특성 (본가 failroleplay 규격)
    const uncopyableAbilities = new Set([
      "wonder-guard", "wonderguard", "불가사의부적",
      "trace", "트레이스",
      "forecast", "기분파",
      "flower-gift", "flowergift", "플라워기프트",
      "multitype", "멀티타입",
      "illusion", "일루전",
      "zen-mode", "zenmode", "달마모드",
      "imposter", "괴짜",
      "stance-change", "stancechange", "배틀스위치",
      "power-of-alchemy", "powerofalchemy", "과학의힘",
      "receiver", "리시버",
      "schooling", "어군",
      "comatose", "절대안깸",
      "shields-down", "shieldsdown", "리밋실드",
      "disguise", "탈",
      "rks-system", "rkssystem", "ar시스템",
      "battle-bond", "battlebond", "유대변화",
      "power-construct", "powerconstruct", "스웜체인지",
      "neutralizing-gas", "neutralizinggas", "화학변화가스",
      "ice-face", "iceface", "아이스페이스",
      "gulp-missile", "gulpmissile", "그대로꿀꺽미사일",
      "hunger-switch", "hungerswitch", "꼬르륵스위치",
      "as-one", "asone", "혼연일체",
      "zero-to-hero", "zerotohero", "마이티체인지",
      "commander", "사령탑",
      "protosynthesis", "고대활성",
      "quark-drive", "quarkdrive", "쿼크차지",
      "tera-shift", "terashift", "테라체인지",
      "tera-shell", "terashell", "테라셸",
      "teraform-zero", "teraformzero", "제로포밍",
      "poison-puppeteer", "poisonpuppeteer", "독조종",
    ]);

    // 덮어쓰기 불가 시전자 특성 (본가 cantsuppress 규격)
    const unreplaceableActorAbilities = new Set([
      "multitype", "멀티타입",
      "zen-mode", "zenmode", "달마모드",
      "stance-change", "stancechange", "배틀스위치",
      "schooling", "어군",
      "comatose", "절대안깸",
      "shields-down", "shieldsdown", "리밋실드",
      "disguise", "탈",
      "rks-system", "rkssystem", "ar시스템",
      "battle-bond", "battlebond", "유대변화",
      "power-construct", "powerconstruct", "스웜체인지",
      "ice-face", "iceface", "아이스페이스",
      "gulp-missile", "gulpmissile", "그대로꿀꺽미사일",
      "as-one", "asone", "혼연일체",
      "zero-to-hero", "zerotohero", "마이티체인지",
      "commander", "사령탑",
      "protosynthesis", "고대활성",
      "quark-drive", "quarkdrive", "쿼크차지",
      "tera-shift", "terashift", "테라체인지",
    ]);

    const targetCleanAb = target.ability.toLowerCase().trim().replace(/[\s_]+/g, "-");
    const actorCleanAb = (actor.ability || "").toLowerCase().trim().replace(/[\s_]+/g, "-");

    if (uncopyableAbilities.has(targetCleanAb) || (actorCleanAb && unreplaceableActorAbilities.has(actorCleanAb))) {
      return isKo ? `하지만 그 특성은 흉내낼 수 없다!` : `But that ability cannot be copied!`;
    }

    if (actorCleanAb && actorCleanAb === targetCleanAb) {
      return isKo ? `하지만 이미 같은 특성이다!` : `But it already has the same ability!`;
    }

    const copiedAbility = target.ability;
    actor.ability = copiedAbility;
    return isKo
      ? `${actorName}(은)는 ${targetName}의 [${copiedAbility}] 특성을 흉내냈다!`
      : `${actorName} copied ${targetName}'s ${copiedAbility}!`;
  }

  // 273: Wish (희망사항)
  if (
    ["wish", "273", "희망사항"].includes(mName) ||
    move.id === 273 ||
    move.nameKo === "희망사항"
  ) {
    const isPlayerActor = battle ? (actor === battle.playerBattleMon || actor === battle.playerParty?.[battle.playerActiveIndex]) : true;
    const existingWish = battle
      ? (isPlayerActor ? battle.playerWishState : battle.enemyWishState)
      : actor.wishState;

    if (existingWish && existingWish.turnsLeft > 0) {
      return isKo
        ? `하지만 이미 소원을 빈 상태다!`
        : `But a wish is already in the making!`;
    }

    const healAmount = Math.max(1, Math.floor(actor.maxHp / 2));
    const wishData = {
      turnsLeft: 2,
      healAmount,
      userName: actorName,
      userNameKo: isKo ? actorName : (actor.nameKo || actorName),
    };

    actor.wishState = wishData;
    if (battle) {
      if (isPlayerActor) battle.playerWishState = wishData;
      else battle.enemyWishState = wishData;
    }

    return isKo
      ? `${actorName}(은)는 소원을 빌었다!`
      : `${actorName} made a wish!`;
  }

  // 274: Assist (조수) - 기본 실행 핸들러 (상세 처리는 TurnActionExecutor에서 수행)
  if (
    ["assist", "274", "조수"].includes(mName) ||
    move.id === 274 ||
    move.nameKo === "조수"
  ) {
    return isKo
      ? `${actorName}의 조수!\n동료의 힘을 빌려 기술을 사용했다!`
      : `${actorName} used ASSIST!\nIt borrowed an ally's move!`;
  }

  // 275: Ingrain (뿌리박기)
  if (
    ["ingrain", "275", "뿌리박기"].includes(mName) ||
    move.id === 275 ||
    move.nameKo === "뿌리박기"
  ) {
    if (actor.isIngrained) {
      return isKo
        ? `하지만 ${actorName}(은)는 이미 뿌리를 박고 있다!`
        : `But ${actorName} is already rooted!`;
    }

    actor.isIngrained = true;
    actor.cannotEscape = true;

    return isKo
      ? `${actorName}(은)는 대지에 뿌리를 박았다!`
      : `${actorName} planted its roots!`;
  }

  // 277: Magic Coat (매직코트)
  if (
    ["magic-coat", "magic_coat", "magiccoat", "277", "매직코트"].includes(mName) ||
    move.id === 277 ||
    move.nameKo === "매직코트"
  ) {
    actor.isMagicCoat = true;
    return isKo
      ? `${actorName}(은)는 매직코트로 몸을 감쌌다!`
      : `${actorName} shrouded itself with Magic Coat!`;
  }

  // 278: Recycle (리사이클)
  if (
    ["recycle", "278", "리사이클"].includes(mName) ||
    move.id === 278 ||
    move.nameKo === "리사이클"
  ) {
    const hasCurrentItem =
      Boolean(actor.heldItem) ||
      Boolean(actor.heldItems && actor.heldItems.length > 0);
    if (hasCurrentItem) {
      return isKo
        ? `하지만 이미 지닌 물건이 있어 실패했다!`
        : `But it failed because it is already holding an item!`;
    }

    const consumed = actor.lastConsumedItem;
    if (!consumed) {
      return isKo
        ? `하지만 재생할 수 있는 물건이 없다!`
        : `But there is no item to recycle!`;
    }

    actor.heldItem = consumed;
    if (actor.heldItems) {
      actor.heldItems.push(consumed);
    } else {
      actor.heldItems = [consumed];
    }
    actor.lastConsumedItem = null;

    return isKo
      ? `${actorName}(은)는 [${consumed}]을(를) 리사이클하여 다시 주웠다!`
      : `${actorName} found one ${consumed} and recycled it!`;
  }

  // 281: Yawn (하품)
  if (
    ["yawn", "281", "하품"].includes(mName) ||
    move.id === 281 ||
    move.nameKo === "하품"
  ) {
    // 1. 대타출동 상태면 실패
    if (target.substituteHp && target.substituteHp > 0) {
      return isKo ? `하지만 실패했다!` : `But it failed!`;
    }
    // 2. 이미 상태이상이 걸려 있거나 이미 하품(졸음) 상태이면 실패
    if (target.status) {
      return isKo ? `하지만 ${targetName}(은)는 이미 상태이상에 걸려 있다!` : `But it failed!`;
    }
    if (target.yawnTurns && target.yawnTurns > 0) {
      return isKo ? `하지만 ${targetName}(은)는 이미 졸고 있다!` : `But ${targetName} is already drowsy!`;
    }
    // 3. 신비의부적(Safeguard) 보호 중이면 실패
    if (target.safeguardTurns && target.safeguardTurns > 0) {
      return isKo
        ? `${targetName}(은)는 신비의부적의 보호를 받고 있다!`
        : `${targetName} is protected by Safeguard!`;
    }
    // 4. 소란피우기(Uproar) 진행 중이면 실패
    const isUproarActive =
      ((actor as any).uproarTurns && (actor as any).uproarTurns > 0) ||
      ((target as any).uproarTurns && (target as any).uproarTurns > 0) ||
      ((battle?.playerBattleMon as any)?.uproarTurns && (battle?.playerBattleMon as any).uproarTurns > 0) ||
      ((battle?.enemy as any)?.uproarTurns && (battle?.enemy as any).uproarTurns > 0);
    if (isUproarActive) {
      return isKo
        ? `소란스러워서 졸음을 유도할 수 없다!`
        : `But the uproar kept ${targetName} awake!`;
    }
    // 5. 수면 면역 특성 체크 (불면, 의기양양, 절대안깸, 스위트베일, 정화의소금)
    const sleepImmuneAbilities = new Set([
      "insomnia", "불면",
      "vital-spirit", "vitalspirit", "의기양양",
      "comatose", "절대안깸",
      "sweet-veil", "sweetveil", "스위트베일",
      "purifying-salt", "purifyingsalt", "정화의소금",
    ]);
    const tAb = (target.ability || "").toLowerCase().trim().replace(/[\s_]+/g, "-");
    const tPassAb = (target.passiveAbility || "").toLowerCase().trim().replace(/[\s_]+/g, "-");
    if (sleepImmuneAbilities.has(tAb) || sleepImmuneAbilities.has(tPassAb)) {
      return isKo
        ? `[특성] ${targetName}에게는 효과가 없다!`
        : `${targetName}'s ability prevents drowsiness!`;
    }

    // 하품 카운트 2 설정 (이번 턴 종료 시 1로 감소 -> 다음 턴 종료 시 0이 되며 수면 진입)
    target.yawnTurns = 2;
    return isKo
      ? `${actorName}(은)는 ${targetName}의 졸음을 유도했다!`
      : `${actorName} made ${targetName} drowsy!`;
  }

  return isKo ? `기술의 효과가 발동했다!` : `The move took effect!`;
}
