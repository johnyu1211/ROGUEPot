import { BattlePokemon, BattleState, StatStages } from "../../engine/types.js";
import { MoveData, getMoveData } from "../../../data/movesKo.js";
import { applyStatChange } from "../../mechanics/statModifier.js";
import { createPlayerBattleMon } from "../../entities/pokemonFactory.js";

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
export function isSelfTargetStatusMove(moveName: string): boolean {
  const k = moveName.toLowerCase().replace(/[\s_]+/g, "-");
  const selfMoves = new Set([
    "swords-dance", "dragon-dance", "calm-mind", "nasty-plot", "bulk-up", "quiver-dance",
    "agility", "rock-polish", "iron-defense", "amnesia", "acid-armor", "barrier", "growth",
    "tail-glow", "belly-drum", "shell-smash", "shift-gear", "coil", "hone-claws", "work-up",
    "charge", "autotomize", "sharpen", "meditate", "harden", "withdraw", "defense-curl",
    "minimize", "double-team", "protect", "detect", "spiky-shield", "baneful-bunker",
    "substitute", "endure", "quick-guard", "wide-guard", "recover", "roost", "soft-boiled",
    "slack-off", "milk-drink", "synthesis", "moonlight", "morning-sun", "heal-order",
    "shore-up", "life-dew", "wish", "rest", "swallow", "stockpile", "ingrain", "aqua-ring",
    "rain-dance", "sunny-day", "sandstorm", "snowscape", "hail", "electric-terrain",
    "grassy-terrain", "misty-terrain", "psychic-terrain", "tailwind", "trick-room",
    "reflect", "light-screen", "aurora-veil", "safeguard", "mist", "haze", "refresh",
    "heal-bell", "aromatherapy", "splash", "teleport", "focus-energy"
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

  // 4. Protect / Detect / Spiky Shield
  if (["protect", "detect", "spiky-shield"].includes(mName)) {
    actor.isProtected = true;
    return isKo ? `${actorName}(은)는 방어 자세를 취했다!` : `${actorName} protected itself!`;
  }

  // 5. Recovery Moves (50% HP)
  if (["recover", "roost", "soft-boiled", "slack-off", "milk-drink"].includes(mName)) {
    if (actor.hp >= actor.maxHp) {
      return isKo ? `하지만 HP가 이미 가득 차 있다!` : `But its HP is already full!`;
    }
    const maxHeal = Math.max(1, Math.floor(actor.maxHp * 0.5));
    const actualHeal = Math.min(maxHeal, actor.maxHp - actor.hp);
    actor.hp += actualHeal;
    return isKo ? `${actorName}의 HP가 ${actualHeal} 회복되었다!` : `${actorName} restored ${actualHeal} HP!`;
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

  // 8. Whirlwind / Roar
  if (mName === "whirlwind" || mName === "roar") {
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
  if (mName === "memento") {
    actor.hp = 0;
    target.stages.atk = Math.max(-6, target.stages.atk - 2);
    target.stages.spa = Math.max(-6, target.stages.spa - 2);
    recordStatChange("target", "down");
    return isKo
      ? `${actorName}(은)는 쓰러지고 ${targetName}의 공격과 특수공격이 크게 떨어졌다! (-2)`
      : `${actorName} fainted, and ${targetName}'s Attack and Sp. Atk harshly fell! (-2)`;
  }

  // 13. Weather Setting Moves
  if (mName === "sunny-day") {
    if (battle) { battle.weather = "sun"; battle.weatherTurns = 5; }
    return isKo ? `햇살이 아주 강해졌다! (5턴 지속)` : `The sunlight turned harsh! (5 turns)`;
  }
  if (mName === "rain-dance") {
    if (battle) { battle.weather = "rain"; battle.weatherTurns = 5; }
    return isKo ? `비가 내리기 시작했다! (5턴 지속)` : `It started to rain! (5 turns)`;
  }
  if (mName === "sandstorm") {
    if (battle) { battle.weather = "sand"; battle.weatherTurns = 5; }
    return isKo ? `모래바람이 세차게 불기 시작했다! (5턴 지속)` : `A sandstorm kicked up! (5 turns)`;
  }
  if (["snowscape", "hail", "chilly-reception"].includes(mName)) {
    if (battle) { battle.weather = "snow"; battle.weatherTurns = 5; }
    return isKo ? `눈이 내리기 시작했다! (5턴 지속)` : `Snow started to fall! (5 turns)`;
  }
  if (mName === "defog") {
    if (battle) { battle.weather = null; battle.weatherTurns = undefined; }
    target.stages.eva = Math.max(-6, target.stages.eva - 1);
    return isKo
      ? `날씨가 맑아지고 ${targetName}의 회피율이 떨어졌다! (-1)`
      : `The weather cleared and ${targetName}'s evasiveness fell! (-1)`;
  }

  // 14. Weather-scaling heals (Synthesis, Morning Sun, Moonlight)
  if (["synthesis", "morning-sun", "moonlight"].includes(mName)) {
    const healRatio = battle?.weather === "sun" ? 0.667 : (battle?.weather ? 0.25 : 0.5);
    const heal = Math.floor(actor.maxHp * healRatio);
    actor.hp = Math.min(actor.maxHp, actor.hp + heal);
    return isKo ? `${actorName}의 HP가 ${heal} 회복되었다!` : `${actorName} restored ${heal} HP!`;
  }

  // 15. Status Inflicting Moves
  if (["thunder-wave", "glare", "stun-spore", "nuzzle"].includes(mName)) {
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
    const isPowder = mName === "spore" || mName === "sleep-powder";
    if ((!isPowder || !target.types.map(t => t.toLowerCase()).includes("grass")) && !target.status) {
      target.status = "slp";
      target.sleepTurns = 0;
      target.sleepDuration = Math.floor(Math.random() * 2) + 2; // 2~3턴 수면 보장
      return isKo ? `${targetName}(은)는 깊은 잠에 빠졌다!` : `${targetName} fell fast asleep!`;
    }
    return isKo ? `하지만 효과가 없었다!` : `It had no effect!`;
  }

  if (mName === "will-o-wisp") {
    if (!target.types.includes("fire") && !target.status) {
      target.status = "brn";
      return isKo ? `${targetName}(은)는 불꽃에 휩싸여 화상을 입었다!` : `${targetName} was burned!`;
    }
    return isKo ? `하지만 효과가 없었다!` : `It had no effect!`;
  }

  if (["toxic", "poison-powder", "poison-gas"].includes(mName)) {
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
    if (target.isConfused || (target.confusionTurns && target.confusionTurns > 0)) {
      return isKo ? `${targetName}(은)는 이미 혼란에 빠져 있다!` : `${targetName} is already confused!`;
    }
    target.isConfused = true;
    target.confusionTurns = Math.floor(Math.random() * 4) + 2;
    return isKo ? `${targetName}(은)는 혼란에 빠졌다!` : `${targetName} became confused!`;
  }

  if (mName === "rest") {
    if (actor.hp === actor.maxHp) {
      return isKo ? `하지만 이미 체력이 가득 차 있다!` : `But its HP is already full!`;
    }
    actor.hp = actor.maxHp;
    actor.status = "slp";
    actor.sleepTurns = 0;
    actor.sleepDuration = 2;
    return isKo ? `${actorName}(은)는 잠을 자서 체력을 모두 회복했다!` : `${actorName} went to sleep and fully recovered!`;
  }

  if (mName === "attract") {
    if (target.isAttracted) {
      return isKo ? `${targetName}(은)는 이미 헤롱헤롱 상태다!` : `${targetName} is already in love!`;
    }
    target.isAttracted = true;
    return isKo ? `${targetName}(은)는 사랑에 빠져 헤롱헤롱해졌다!` : `${targetName} fell in love!`;
  }

  if (mName === "taunt") {
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
  if (["minimize", "double-team"].includes(mName)) return applyStage("actor", "eva", "회피율", "Evasiveness", mName === "minimize" ? 2 : 1);
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
  if (mName === "quiver-dance") {
    applyStage("actor", "spa", "특수공격", "Sp. Atk", 1);
    applyStage("actor", "spd", "특수방어", "Sp. Def", 1);
    return applyStage("actor", "spe", "스피드", "Speed", 1);
  }

  // 17. Standard Debuff Moves
  if (["growl", "play-nice"].includes(mName)) return applyStage("target", "atk", "공격", "Attack", -1);
  if (["charm", "feather-dance", "baby-doll-eyes"].includes(mName)) return applyStage("target", "atk", "공격", "Attack", mName === "baby-doll-eyes" ? -1 : -2);
  if (["tail-whip", "leer"].includes(mName)) return applyStage("target", "def", "방어", "Defense", -1);
  if (mName === "screech") return applyStage("target", "def", "방어", "Defense", -2);
  if (["fake-tears", "metal-sound"].includes(mName)) return applyStage("target", "spd", "특수방어", "Sp. Def", -2);
  if (["string-shot", "scary-face", "cotton-spore"].includes(mName)) return applyStage("target", "spe", "스피드", "Speed", -2);
  if (["flash", "sand-attack", "smokescreen", "kinesis"].includes(mName)) return applyStage("target", "acc", "명중률", "Accuracy", -1);
  if (mName === "sweet-scent") return applyStage("target", "eva", "회피율", "Evasiveness", -2);
  if (["mimic", "copycat"].includes(mName)) return isKo ? `상대의 기술을 흉내냈다!` : `Mimicked the target's move!`;
  if (mName === "light-screen") return isKo ? `빛의장막으로 특수공격에 강해졌다! (5턴)` : `Light Screen raised special defense! (5 turns)`;
  if (mName === "reflect") return isKo ? `리플렉터로 물리공격에 강해졌다! (5턴)` : `Reflect raised physical defense! (5 turns)`;
  if (mName === "focus-energy") {
    if (actor.hasFocusEnergy) {
      return isKo ? `하지만 이미 기운을 모아 더는 집중할 수 없다!` : `But it had no effect!`;
    }
    actor.hasFocusEnergy = true;
    return isKo ? `${actorName}(은)는 기운을 집중했다! 급소율이 크게 올랐다!` : `${actorName} is getting pumped! Critical hit ratio rose!`;
  }

  return isKo ? `기술의 효과가 발동했다!` : `The move took effect!`;
}
