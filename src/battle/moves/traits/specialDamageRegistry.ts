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
  let effectiveTargetTypes = (target.isForesight || target.isIdentified) &&
    (move.type.toLowerCase() === "normal" || move.type.toLowerCase() === "fighting")
      ? target.types.filter(t => t.toLowerCase() !== "ghost")
      : target.types;
  if (target.isIngrained && move.type.toLowerCase() === "ground") {
    effectiveTargetTypes = effectiveTargetTypes.filter(t => t.toLowerCase() !== "flying");
  }

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
    const typeMod = getTypeEffectiveness(move.type, effectiveTargetTypes);
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
    const typeMod = getTypeEffectiveness(move.type, effectiveTargetTypes);
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
    const typeMod = getTypeEffectiveness(move.type, effectiveTargetTypes);
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
    const typeMod = getTypeEffectiveness(move.type, effectiveTargetTypes);
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
    const typeMod = getTypeEffectiveness(move.type, effectiveTargetTypes);
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

  // 6. Match Target's HP with User's HP (Endeavor / 죽기살기)
  if (moveKey === "endeavor" || moveKey === "283" || move.id === 283 || move.nameKo === "죽기살기") {
    const typeMod = getTypeEffectiveness(move.type, effectiveTargetTypes);
    if (typeMod === 0) {
      return {
        handled: true,
        damage: 0,
        log: isKo
          ? `${actorName}의 ${moveName}! 하지만 ${targetName}에게는 효과가 없는 것 같다...`
          : `${actorName}'s ${moveName}! It doesn't affect ${targetName}...`,
      };
    }
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
  if (moveKey === "counter" || moveKey === "68" || move.nameKo === "카운터") {
    const typeMod = getTypeEffectiveness(move.type, effectiveTargetTypes);
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

  // 7-1. Special Damage Counter (Mirror Coat / 미러코트)
  if (["mirror-coat", "mirror_coat", "mirrorcoat", "243", "미러코트"].includes(moveKey) || move.id === 243 || move.nameKo === "미러코트") {
    const typeMod = getTypeEffectiveness(move.type, effectiveTargetTypes);
    if (typeMod === 0) {
      return {
        handled: true,
        damage: 0,
        log: isKo ? `${actorName}의 ${moveName}! 하지만 ${targetName}에게는 효과가 없는 것 같다...` : `${actorName}'s ${moveName}! It doesn't affect ${targetName}...`,
      };
    }
    const specDmg = actor.lastSpecialDamageTakenThisTurn || 0;
    if (specDmg > 0) {
      const damage = specDmg * 2;
      return {
        handled: true,
        damage,
        log: isKo
          ? `${actorName}의 미러코트!\n받은 특수 데미지를 2배로 되돌려주었다! (-${damage})`
          : `${actorName}'s Mirror Coat!\nDealt double the special damage back! (-${damage})`,
      };
    }
    return {
      handled: true,
      damage: 0,
      log: isKo ? `${actorName}의 미러코트! 하지만 기술은 실패했다!` : `${actorName}'s Mirror Coat! But it failed!`,
    };
  }

  // 8. Bide (참기)
  if (moveKey === "bide" || moveKey === "bide-charge") {
    const typeMod = getTypeEffectiveness(move.type, effectiveTargetTypes);
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

  // 10. Psywave (사이코웨이브) - Variable damage based on user level: level * (50 ~ 150) / 100, min 1 HP
  if (moveKey === "psywave") {
    const typeMod = getTypeEffectiveness(move.type, effectiveTargetTypes);
    if (typeMod === 0) {
      return {
        handled: true,
        damage: 0,
        log: isKo
          ? `${actorName}의 ${moveName}! 하지만 ${targetName}에게는 효과가 없는 것 같다...`
          : `${actorName}'s ${moveName}! It doesn't affect ${targetName}...`,
      };
    }
    const randMultiplier = (Math.floor(Math.random() * 101) + 50) / 100; // 0.5 ~ 1.5
    const damage = Math.max(1, Math.floor(actor.level * randMultiplier));
    return {
      handled: true,
      damage,
      log: isKo
        ? `${actorName}의 ${moveName}! ${targetName}에게 ${damage}의 데미지!`
        : `${actorName}'s ${moveName}! Dealt ${damage} damage!`,
    };
  }

  // 11. Snore (코골기) - Fails if user is not asleep
  if (moveKey === "snore" || moveKey === "173" || move.nameKo === "코골기") {
    const isActorAsleep = actor.status === "slp";
    if (!isActorAsleep) {
      return {
        handled: true,
        damage: 0,
        log: isKo
          ? `${actorName}의 ${moveName}!\n하지만 잠들어 있지 않아 실패했다!`
          : `${actorName}'s ${moveName}!\nBut it failed because ${actorName} is not asleep!`,
      };
    }
  }

  // 12. Present (프레젠트) - 40% BP 40, 30% BP 80, 10% BP 120, 20% Heal 25% max HP
  if (moveKey === "present" || moveKey === "217" || move.nameKo === "프레젠트" || moveKey === "선물") {
    let roll: number;
    if ((actor as any).forcedPresentRoll !== undefined) {
      roll = (actor as any).forcedPresentRoll;
    } else if ((actor as any).forcedPresentMode === "heal") {
      roll = 90;
    } else if ((actor as any).forcedPresentMode === "damage40") {
      roll = 10;
    } else if ((actor as any).forcedPresentMode === "damage80") {
      roll = 50;
    } else if ((actor as any).forcedPresentMode === "damage120") {
      roll = 75;
    } else {
      roll = Math.floor(Math.random() * 100);
    }

    if (roll >= 80) {
      // 20% chance: Heal target for 25% of target's max HP
      const healAmount = Math.max(1, Math.floor(target.maxHp / 4));
      const prevHp = target.hp;
      target.hp = Math.min(target.maxHp, target.hp + healAmount);
      const actualHealed = target.hp - prevHp;
      (actor as any).lastPresentOutcome = "heal";
      (actor as any).lastPresentPower = 0;
      (actor as any).lastPresentHeal = actualHealed;
      return {
        handled: true,
        damage: 0,
        log: isKo
          ? `${actorName}의 ${moveName}!\n상자에서 상냥한 빛이 쏟아져 ${targetName}의 체력이 회복되었다! (+${actualHealed})`
          : `${actorName}'s ${moveName}!\nThe present gave off a soothing light, restoring ${targetName}'s HP! (+${actualHealed})`,
      };
    }

    // Damage cases: 40 (40%), 80 (30%), 120 (10%)
    let bp = 40;
    if (roll < 40) {
      bp = 40;
    } else if (roll < 70) {
      bp = 80;
    } else {
      bp = 120;
    }
    (actor as any).lastPresentOutcome = "damage";
    (actor as any).lastPresentPower = bp;
  }

  // 17. Spit Up (토해내기): 비축 카운트가 0이면 실패! 성공 시 비축 카운트 초기화 및 랭크 복구
  if (["spit-up", "spitup", "255", "토해내기"].includes(moveKey)) {
    const count = actor.stockpileCount || 0;
    if (count <= 0) {
      return {
        handled: true,
        damage: 0,
        log: isKo ? `하지만 기술은 실패했다!` : `But it failed!`,
      };
    }
    // 토해내기로 소진된 비축 카운트 기록
    (actor as any).lastSpitUpCount = count;
    actor.stockpileCount = 0;

    // 공식 고증: 비축하기로 올렸던 방어/특수방어 랭크를 비축 수만큼 하락(원상 복구)
    if (actor.stages) {
      actor.stages.def = Math.max(-6, (actor.stages.def || 0) - count);
      actor.stages.spd = Math.max(-6, (actor.stages.spd || 0) - count);
    }

    return { handled: false };
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
  if (["eruption", "284", "분화", "water-spout", "dragon-energy"].includes(cleanKey)) {
    return Math.max(1, Math.floor((150 * Math.max(1, actor.hp)) / Math.max(1, actor.maxHp)));
  }

  // Knock Off (탁쳐서떨구기): Base 65, 1.5x (97) if target holds a removable item
  if (["knock-off", "knockoff", "282", "탁쳐서떨구기", "탁쳐서-떨구기"].includes(cleanKey)) {
    const hasItem = Boolean(target.heldItem || (target.heldItems && target.heldItems.length > 0));
    return hasItem ? Math.floor(65 * 1.5) : 65;
  }

  // Rollout & Ice Ball: base 30, doubles each hit (30 -> 60 -> 120 -> 240 -> 480).
  // If Defense Curl was used, power is doubled across all hits (60 -> 120 -> 240 -> 480 -> 960).
  if (["rollout", "205", "구르기", "ice-ball", "301", "아이스볼"].includes(cleanKey)) {
    const hitCount = actor.rolloutState?.hitCount ?? 1;
    let p = 30 * Math.pow(2, Math.min(4, Math.max(0, hitCount - 1)));
    if (actor.hasUsedDefenseCurl || (actor as any).defenseCurlUsed || actor.rolloutState?.defenseCurlMultiplier) {
      p *= 2;
    }
    return p;
  }

  // Fury Cutter (연속자르기): Base 40, doubles each consecutive successful hit (40 -> 80 -> 160, max 160)
  if (["fury-cutter", "210", "연속자르기", "furycutter"].includes(cleanKey)) {
    const streak = actor.furyCutterStreak ?? 0;
    return Math.min(160, 40 * Math.pow(2, Math.max(0, streak)));
  }

  // Low HP High Power Moves (Reversal, Flail)
  // Gen 5+ official formula: P = floor(48 * CurrentHP / MaxHP)
  // P: 0..1 => 200, 2..4 => 150, 5..9 => 100, 10..16 => 80, 17..32 => 40, >= 33 => 20
  if (["reversal", "flail", "179", "175", "기사회생", "바둥바둥", "버둥거리기"].includes(cleanKey)) {
    const maxHp = Math.max(1, actor.maxHp);
    const p = Math.floor((48 * Math.max(1, actor.hp)) / maxHp);
    if (p <= 1) return 200;
    if (p <= 4) return 150;
    if (p <= 9) return 100;
    if (p <= 16) return 80;
    if (p <= 32) return 40;
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

  // Return & Frustration (은혜갚기 & 화풀이): 친밀도 비례 위력 (최대 위력 102)
  // 공식: Math.max(1, Math.floor(친밀도 * 2 / 5))
  if (["return", "216", "은혜갚기"].includes(cleanKey)) {
    const friendship = (actor as any).friendship ?? (actor as any).happiness ?? 255;
    return Math.max(1, Math.floor((friendship * 2) / 5));
  }
  if (["frustration", "218", "화풀이"].includes(cleanKey)) {
    const friendship = (actor as any).friendship ?? (actor as any).happiness ?? 0;
    return Math.max(1, Math.floor(((255 - friendship) * 2) / 5));
  }

  // Present (프레젠트): 40, 80, 120 위력
  if (["present", "217", "프레젠트", "선물"].includes(cleanKey)) {
    return (actor as any).lastPresentPower ?? 40;
  }

  // Magnitude (매그니튜드): Base Power varies by Magnitude level 4 ~ 10
  // Level 4: 10 (5%), Level 5: 30 (10%), Level 6: 50 (20%), Level 7: 70 (30%),
  // Level 8: 90 (20%), Level 9: 110 (10%), Level 10: 150 (5%)
  if (["magnitude", "222", "매그니튜드"].includes(cleanKey)) {
    let mag = (actor as any).selectedMagnitude;
    if (!mag) {
      const roll = Math.random();
      if (roll < 0.05) mag = 4;
      else if (roll < 0.15) mag = 5;
      else if (roll < 0.35) mag = 6;
      else if (roll < 0.65) mag = 7;
      else if (roll < 0.85) mag = 8;
      else if (roll < 0.95) mag = 9;
      else mag = 10;
    }
    actor.lastMagnitude = mag;
    (actor as any).lastMagnitude = mag;
    const magPowerMap: Record<number, number> = {
      4: 10,
      5: 30,
      6: 50,
      7: 70,
      8: 90,
      9: 110,
      10: 150,
    };
    return magPowerMap[mag] ?? 70;
  }

  // Pursuit (따라가때리기): Base 40, doubles to 80 if target is switching out or using a fleeing/switching move
  if (["pursuit", "228", "따라가때리기", "따라가-때리기", "따라가 때리기"].includes(cleanKey)) {
    const isTargetSwitching = Boolean(
      (target as any).isSwitchingOut ||
      (target as any).switchingOut ||
      (target as any).isTeleporting ||
      (target as any).isSwitchingMove ||
      (target as any).chargingMove === "teleport"
    );
    return isTargetSwitching ? 80 : 40;
  }

  // Beat Up (집단구타): Gen 5+ 공식 기본 위력 = (Base Attack / 10) + 5
  if (["beat-up", "beatup", "251", "집단구타"].includes(cleanKey)) {
    const atk = actor.atk || 100;
    return Math.max(10, Math.floor(atk / 10) + 5);
  }

  // Spit Up (토해내기): 비축 카운트 비례 위력 (100 * stockpileCount, 최대 300)
  if (["spit-up", "spitup", "255", "토해내기"].includes(cleanKey)) {
    const count = (actor as any).lastSpitUpCount ?? actor.stockpileCount ?? 1;
    return Math.max(100, Math.min(300, count * 100));
  }

  // Facade (객기): Base 70, doubles to 140 if actor is poisoned, badly poisoned, paralyzed, or burned
  if (["facade", "263", "객기"].includes(cleanKey)) {
    const hasStatus = actor.status === "psn" || actor.status === "tox" || actor.status === "par" || actor.status === "brn";
    return hasStatus ? 140 : 70;
  }

  // Smelling Salts (정신차리기): Base 70, doubles to 140 if target is paralyzed
  if (["smelling-salts", "smellingsalts", "265", "정신차리기"].includes(cleanKey)) {
    return target.status === "par" ? 140 : 70;
  }

  // Revenge (리벤지): Base 60, doubles to 120 if actor took damage from target this turn
  if (["revenge", "279", "리벤지"].includes(cleanKey)) {
    const tookDamageThisTurn =
      (actor.lastPhysicalDamageTakenThisTurn || 0) + (actor.lastSpecialDamageTakenThisTurn || 0) > 0 ||
      Boolean((actor as any).damagedThisTurn);
    return tookDamageThisTurn ? 120 : 60;
  }

  return null;
}

/**
 * Calculates Hidden Power's elemental type based on IVs.
 * Uses official Gen 2-7 algorithm. Default with all 31 IVs is 'dark'.
 */
export function getHiddenPowerType(actor: BattlePokemon): string {
  const ivs = actor.ivs || {};
  const hp = (ivs.hp ?? 31) & 1;
  const atk = (ivs.atk ?? 31) & 1;
  const def = (ivs.def ?? 31) & 1;
  const spe = (ivs.spe ?? ivs.speed ?? 31) & 1;
  const spa = (ivs.spa ?? ivs.spAtk ?? 31) & 1;
  const spd = (ivs.spd ?? ivs.spDef ?? 31) & 1;

  const types = [
    "fighting", "flying", "poison", "ground",
    "rock", "bug", "ghost", "steel",
    "fire", "water", "grass", "electric",
    "psychic", "ice", "dragon", "dark"
  ];
  const val = Math.floor(((hp + 2 * atk + 4 * def + 8 * spe + 16 * spa + 32 * spd) * 15) / 63);
  return types[Math.min(15, Math.max(0, val))] || "dark";
}
