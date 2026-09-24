import { BattlePokemon } from "../../engine/types.js";
import { MoveData } from "../../../data/movesKo.js";
import { getTypeEffectiveness } from "../../mechanics/typeChart.js";

export interface SpecialDamageContext {
  actor: BattlePokemon;
  target: BattlePokemon;
  move: MoveData;
  isActorPlayer: boolean;
  isKo: boolean;
}

export interface SpecialDamageResult {
  handled: boolean;
  damage?: number;
  log?: string;
  isOHKO?: boolean;
}

/**
 * Registry for non-standard damage calculations.
 * Returns handled: false if standard damage formula should be used.
 */
export function checkSpecialDamage(ctx: SpecialDamageContext): SpecialDamageResult {
  const { actor, target, move, isActorPlayer, isKo } = ctx;
  const moveKey = move.name.toLowerCase().replace(/[\s_]+/g, "-");
  const actorName = isKo ? (actor.nameKo || actor.name) : (actor.name || actor.nameKo);
  const targetName = isKo ? (target.nameKo || target.name) : (target.name || target.nameKo);
  const moveName = isKo ? move.nameKo : move.name.toUpperCase();

  // 1. One-Hit KO Moves (Horn Drill, Guillotine, Fissure, Sheer Cold)
  if (["horn-drill", "guillotine", "fissure", "sheer-cold"].includes(moveKey)) {
    // Fails if user is lower level than target
    if (actor.level < target.level) {
      return {
        handled: true,
        damage: 0,
        log: isKo
          ? `${actorName}의 ${moveName}! 하지만 레벨이 낮아 상대에게 통하지 않았다!`
          : `${actorName}'s ${moveName}! But it didn't affect ${targetName} due to lower level!`,
      };
    }

    // Type immunity check (e.g. Ground on Flying, Normal on Ghost)
    const typeMod = getTypeEffectiveness(move.type, target.types);
    const isSheerColdOnIce = moveKey === "sheer-cold" && target.types.map(t => t.toLowerCase()).includes("ice");
    if (typeMod === 0 || isSheerColdOnIce) {
      return {
        handled: true,
        damage: 0,
        log: isKo
          ? `${actorName}의 ${moveName}! 하지만 ${targetName}에게는 효과가 없는 것 같다...`
          : `${actorName}'s ${moveName}! It doesn't affect ${targetName}...`,
      };
    }

    // OHKO Accuracy formula: 30 + (user level - target level)
    const ohkoAcc = Math.min(100, Math.max(0, 30 + (actor.level - target.level)));
    if (Math.random() * 100 > ohkoAcc) {
      return {
        handled: true,
        damage: 0,
        log: isKo ? `${actorName}의 ${moveName}! 하지만 공격은 빗나갔다!` : `${actorName}'s ${moveName}! But it missed!`,
      };
    }

    // Target protected
    if (target.isProtected) {
      return {
        handled: true,
        damage: 0,
        log: isKo ? `${actorName}의 ${moveName}! 하지만 ${targetName}(은)는 공격을 막아냈다!` : `${actorName}'s ${moveName}! But ${targetName} protected itself!`,
      };
    }

    // Sturdy immunity
    const isSturdy = target.ability?.toLowerCase() === "sturdy" || target.passiveAbility?.toLowerCase() === "sturdy";
    if (isSturdy) {
      return {
        handled: true,
        damage: 0,
        log: isKo
          ? `${actorName}의 ${moveName}!\n[특성 옹골참!] 일격필살 공격을 무효화했다!`
          : `${actorName}'s ${moveName}!\n[Sturdy!] It was immune to the One-Hit KO!`,
      };
    }

    const damage = target.hp;
    return {
      handled: true,
      damage,
      isOHKO: true,
      log: isKo
        ? `${actorName}의 ${moveName}!\n일격필살! ${targetName}(은)는 쓰러졌다!`
        : `${actorName}'s ${moveName}!\nIt's a One-Hit KO! ${targetName} fainted!`,
    };
  }

  // 2. Fixed Damage based on Level (Seismic Toss, Night Shade)
  if (moveKey === "seismic-toss" || moveKey === "night-shade") {
    const typeMod = getTypeEffectiveness(move.type, target.types);
    if (typeMod === 0) {
      return {
        handled: true,
        damage: 0,
        log: isKo ? `${actorName}의 ${moveName}! 하지만 ${targetName}에게는 효과가 없는 것 같다...` : `${actorName}'s ${moveName}! It doesn't affect ${targetName}...`,
      };
    }
    const damage = actor.level;
    return {
      handled: true,
      damage,
      log: isKo ? `${actorName}의 ${moveName}! ${targetName}에게 ${damage}의 고정 데미지!` : `${actorName}'s ${moveName}! Dealt ${damage} fixed damage!`,
    };
  }

  // 3. Constant 40 Damage (Dragon Rage)
  if (moveKey === "dragon-rage") {
    const typeMod = getTypeEffectiveness(move.type, target.types);
    if (typeMod === 0) {
      return {
        handled: true,
        damage: 0,
        log: isKo ? `${actorName}의 ${moveName}! 하지만 ${targetName}에게는 효과가 없는 것 같다...` : `${actorName}'s ${moveName}! It doesn't affect ${targetName}...`,
      };
    }
    const damage = 40;
    return {
      handled: true,
      damage,
      log: isKo ? `${actorName}의 ${moveName}! ${targetName}에게 40의 고정 데미지!` : `${actorName}'s ${moveName}! Dealt 40 fixed damage!`,
    };
  }

  // 4. Constant 20 Damage (Sonic Boom)
  if (moveKey === "sonic-boom") {
    const typeMod = getTypeEffectiveness(move.type, target.types);
    if (typeMod === 0) {
      return {
        handled: true,
        damage: 0,
        log: isKo ? `${actorName}의 ${moveName}! 하지만 ${targetName}에게는 효과가 없는 것 같다...` : `${actorName}'s ${moveName}! It doesn't affect ${targetName}...`,
      };
    }
    const damage = 20;
    return {
      handled: true,
      damage,
      log: isKo ? `${actorName}의 ${moveName}! ${targetName}에게 20의 고정 데미지!` : `${actorName}'s ${moveName}! Dealt 20 fixed damage!`,
    };
  }

  // 5. Half of Current HP (Super Fang, Nature's Madness)
  if (moveKey === "super-fang" || moveKey === "natures-madness") {
    const typeMod = getTypeEffectiveness(move.type, target.types);
    if (typeMod === 0) {
      return {
        handled: true,
        damage: 0,
        log: isKo ? `${actorName}의 ${moveName}! 하지만 ${targetName}에게는 효과가 없는 것 같다...` : `${actorName}'s ${moveName}! It doesn't affect ${targetName}...`,
      };
    }
    const damage = Math.max(1, Math.floor(target.hp / 2));
    return {
      handled: true,
      damage,
      log: isKo ? `${actorName}의 ${moveName}! ${targetName}의 현재 HP를 절반으로 깎았다! (-${damage})` : `${actorName}'s ${moveName}! Cut ${targetName}'s HP in half! (-${damage})`,
    };
  }

  // 6. Match Target's HP with User's HP (Endeavor)
  if (moveKey === "endeavor") {
    if (actor.hp >= target.hp) {
      return {
        handled: true,
        damage: 0,
        log: isKo ? `${actorName}의 ${moveName}! 하지만 아무 일도 일어나지 않았다!` : `${actorName}'s ${moveName}! But nothing happened!`,
      };
    }
    const damage = target.hp - actor.hp;
    return {
      handled: true,
      damage,
      log: isKo ? `${actorName}의 ${moveName}! ${targetName}의 HP를 자신의 HP와 같게 맞췄다! (-${damage})` : `${actorName}'s ${moveName}! Matched ${targetName}'s HP! (-${damage})`,
    };
  }

  // 7. Physical Damage Counter (Counter)
  if (moveKey === "counter") {
    const typeMod = getTypeEffectiveness(move.type, target.types);
    if (typeMod === 0) {
      return {
        handled: true,
        damage: 0,
        log: isKo ? `${actorName}의 ${moveName}! 하지만 ${targetName}에게는 효과가 없는 것 같다...` : `${actorName}'s ${moveName}! It doesn't affect ${targetName}...`,
      };
    }
    const physDmg = actor.lastPhysicalDamageTakenThisTurn || 0;
    if (physDmg > 0) {
      const damage = physDmg * 2;
      return {
        handled: true,
        damage,
        log: isKo
          ? `${actorName}의 카운터!\n받은 물리 데미지를 2배로 되돌려주었다! (-${damage})`
          : `${actorName}'s Counter!\nDealt double the physical damage back! (-${damage})`,
      };
    }
    return {
      handled: true,
      damage: 0,
      log: isKo ? `${actorName}의 카운터! 하지만 기술은 실패했다!` : `${actorName}'s Counter! But it failed!`,
    };
  }

  // 8. Bide (참기)
  if (moveKey === "bide" || moveKey === "bide-charge") {
    const typeMod = getTypeEffectiveness(move.type, target.types);
    if (typeMod === 0) {
      return {
        handled: true,
        damage: 0,
        log: isKo ? `${actorName}의 ${moveName}! 하지만 ${targetName}에게는 효과가 없는 것 같다...` : `${actorName}'s ${moveName}! It doesn't affect ${targetName}...`,
      };
    }
    const damage = Math.max(1, (actor.bideDamageTaken ?? 25) * 2);
    return {
      handled: true,
      damage,
      log: isKo
        ? `${actorName}(은)는 참아낸 데미지를 방출했다! 2배의 피해를 주었다! (-${damage})`
        : `${actorName} unleashed energy! Dealt 2x stored damage! (-${damage})`,
    };
  }

  // 9. Dream Eater (꿈먹기) - Fails if target is not asleep
  if (moveKey === "dream-eater") {
    const isTargetAsleep = target.status === "slp" || ((target.sleepTurns ?? 0) > 0);
    if (!isTargetAsleep) {
      return {
        handled: true,
        damage: 0,
        log: isKo
          ? `${actorName}의 ${moveName}!\n하지만 ${targetName}(은)는 잠들어 있지 않다!`
          : `${actorName}'s ${moveName}!\nBut ${targetName} is not asleep!`,
      };
    }
  }

  // Standard damage formula should proceed
  return { handled: false };
}

/**
 * Calculates dynamic move power for variable-power moves (Eruption, Flail, Gyro Ball, etc.)
 */
export function getDynamicMovePower(moveKey: string, actor: BattlePokemon, target: BattlePokemon): number | null {
  const cleanKey = moveKey.toLowerCase().replace(/[\s_]+/g, "-");

  // HP Ratio Moves (Eruption, Water Spout, Dragon Energy)
  if (["eruption", "water-spout", "dragon-energy"].includes(cleanKey)) {
    return Math.max(1, Math.floor(150 * (actor.hp / Math.max(1, actor.maxHp))));
  }

  // Low HP High Power Moves (Reversal, Flail)
  if (cleanKey === "reversal" || cleanKey === "flail") {
    const hpRatio = actor.hp / Math.max(1, actor.maxHp);
    if (hpRatio < 0.0417) return 200;
    if (hpRatio < 0.1042) return 150;
    if (hpRatio < 0.2083) return 100;
    if (hpRatio < 0.3542) return 80;
    if (hpRatio < 0.6875) return 40;
    return 20;
  }

  // Speed Difference (Gyro Ball)
  if (cleanKey === "gyro-ball") {
    return Math.min(150, Math.floor(25 * (target.speed / Math.max(1, actor.speed))) + 1);
  }

  // Speed Ratio (Electro Ball)
  if (cleanKey === "electro-ball") {
    const spdRatio = actor.speed / Math.max(1, target.speed);
    if (spdRatio >= 4) return 150;
    if (spdRatio >= 3) return 120;
    if (spdRatio >= 2) return 80;
    if (spdRatio >= 1) return 60;
    return 40;
  }

  // Weight class approximations
  if (["grass-knot", "low-kick", "heavy-slam", "heat-crash"].includes(cleanKey)) {
    return 80;
  }

  return null;
}
