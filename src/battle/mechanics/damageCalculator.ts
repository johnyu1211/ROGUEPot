import { BattlePokemon, BattleState } from "../engine/types.js";
import { MoveData } from "../../data/movesKo.js";
import { getTypeEffectiveness } from "./typeChart.js";
import { getStageMultiplier } from "./statModifier.js";
import { checkSemiInvulnerableVulnerability } from "./vulnerabilityRules.js";
import { checkSpecialDamage, getDynamicMovePower } from "../moves/traits/specialDamageRegistry.js";
import { getMoveTrait, calculateMultiHitCount } from "../moves/traits/moveTraits.js";

export interface DamageCalculationResult {
  damage: number;
  typeMod: number;
  isCrit: boolean;
  hitCount: number;
  isSuperEffective: boolean;
  isOHKO?: boolean;
  log: string;
  isUndergroundHit?: boolean;
  isSelfDestruct?: boolean;
  mustRecharge?: boolean;
}

/**
 * Full Gen 8/9 Damage Calculation Pipeline.
 */
export function calculateDamage(
  actor: BattlePokemon,
  target: BattlePokemon,
  move: MoveData,
  isActorPlayer: boolean,
  isKo: boolean,
  battle?: BattleState
): DamageCalculationResult {
  const actorName = isKo ? (actor.nameKo || actor.name) : (actor.name || actor.nameKo);
  const targetName = isKo ? (target.nameKo || target.name) : (target.name || target.nameKo);
  const moveName = isKo ? move.nameKo : move.name.toUpperCase();
  const moveKey = move.name.toLowerCase().replace(/[\s_]+/g, "-");

  // 1. Semi-Invulnerable state hit & damage multiplier (e.g. Earthquake hits Dig for 2x)
  const semiCheck = checkSemiInvulnerableVulnerability(target, moveKey, actor.ability);
  if (!semiCheck.canHit) {
    return {
      damage: 0,
      typeMod: 1.0,
      isCrit: false,
      hitCount: 1,
      isSuperEffective: false,
      log: isKo
        ? `${actorName}의 ${moveName}! 하지만 ${targetName}에게는 닿지 않았다!`
        : `${actorName}'s ${moveName}! But it couldn't hit ${targetName}!`,
    };
  }

  // 2. Check Special Damage Registry (OHKO, fixed damage, counter, endeavor)
  const specialResult = checkSpecialDamage({ actor, target, move, isActorPlayer, isKo });
  if (specialResult.handled) {
    const isFixedOrOHKO = specialResult.isOHKO || ["seismic-toss", "night-shade", "dragon-rage", "sonic-boom", "super-fang", "natures-madness", "endeavor", "counter", "mirror-coat", "psywave", "bide"].includes(moveKey);
    const rawTypeMod = getTypeEffectiveness(move.type, target.types);
    const typeMod = isFixedOrOHKO ? (rawTypeMod === 0 || specialResult.damage === 0 ? 0 : 1.0) : rawTypeMod;
    return {
      damage: specialResult.damage ?? 0,
      typeMod,
      isCrit: false,
      hitCount: 1,
      isSuperEffective: isFixedOrOHKO ? false : typeMod >= 2.0,
      isOHKO: specialResult.isOHKO,
      log: specialResult.log || "",
    };
  }

  // 3. Stats and Stage Multipliers
  const isSpecial = move.category === "special";
  const atkStat = isSpecial
    ? actor.spAtk * getStageMultiplier(actor.stages.spa)
    : actor.atk * getStageMultiplier(actor.stages.atk) * (actor.status === "brn" ? 0.5 : 1.0);

  let defStat = isSpecial
    ? target.spDef * getStageMultiplier(target.stages.spd)
    : target.def * getStageMultiplier(target.stages.def);

  // Weather defensive bonuses (Sandstorm Rock SpDef 1.5x, Snow Ice Def 1.5x)
  if (battle?.weather === "sand" && target.types.map(t => t.toLowerCase()).includes("rock") && isSpecial) {
    defStat = Math.floor(defStat * 1.5);
  }
  if (battle?.weather === "snow" && target.types.map(t => t.toLowerCase()).includes("ice") && !isSpecial) {
    defStat = Math.floor(defStat * 1.5);
  }

  // 4. Base Power Determination
  let power = getDynamicMovePower(moveKey, actor, target) ?? (move.power || 40);

  // Vulnerability double power (e.g. Earthquake against underground target)
  const isUndergroundHit = semiCheck.powerMultiplier > 1.0;
  if (isUndergroundHit) {
    power *= semiCheck.powerMultiplier;
  }

  // Self-destruct moves power overrides
  const trait = getMoveTrait(moveKey);
  if (trait?.isSelfDestruct) {
    power = moveKey === "explosion" ? 250 : (moveKey === "self-destruct" ? 200 : 100);
  }

  // 5. Weather Modifiers
  let weatherMod = 1.0;
  if (battle?.weather === "sun") {
    if (move.type.toLowerCase() === "fire") weatherMod = 1.5;
    else if (move.type.toLowerCase() === "water") weatherMod = 0.5;
  } else if (battle?.weather === "rain") {
    if (move.type.toLowerCase() === "water") weatherMod = 1.5;
    else if (move.type.toLowerCase() === "fire") weatherMod = 0.5;
    if (moveKey === "solar-beam" || moveKey === "solar-blade") weatherMod = 0.5;
  } else if (battle?.weather === "sand" || battle?.weather === "snow") {
    if (moveKey === "solar-beam" || moveKey === "solar-blade") weatherMod = 0.5;
  }

  // 6. STAB and Type Effectiveness
  const isStab = actor.types.map(t => t.toLowerCase()).includes(move.type.toLowerCase());
  const stabMod = isStab ? 1.5 : 1.0;
  const typeMod = getTypeEffectiveness(move.type, target.types);

  // 7. Critical Hit
  const isHighCrit = Boolean(trait?.critBonus);
  const hasFocusEnergy = Boolean(actor.hasFocusEnergy);
  let critChance = 0.08;
  if (hasFocusEnergy && isHighCrit) {
    critChance = 1.0; // Focus Energy + High Crit move = Guaranteed 100% Critical Hit!
  } else if (hasFocusEnergy) {
    critChance = 0.50; // Focus Energy alone = 50% Critical Hit!
  } else if (isHighCrit) {
    critChance = 0.25;
  }
  let isCrit = Math.random() < critChance;
  let critPerkLog = "";
  if (isActorPlayer && battle?.pendingBallPerk === "crit") {
    isCrit = true;
    critPerkLog = isKo ? "\n[PERK:crit] 집중 효과로 급소에 작렬했다!" : "\n[PERK:crit] Critical hit by Focus!";
    battle.pendingBallPerk = null;
  }
  const critMod = isCrit ? 1.5 : 1.0;

  // 8. Random Factor (0.85 ~ 1.00)
  const randomMod = 0.85 + Math.random() * 0.15;

  // 9. Standard Gen 8/9 Damage Formula
  let singleHitDamage = Math.floor(
    (((2 * actor.level / 5 + 2) * power * (atkStat / Math.max(1, defStat))) / 50 + 2) *
    stabMod * typeMod * critMod * randomMod * weatherMod
  );
  singleHitDamage = Math.max(typeMod > 0 ? 1 : 0, singleHitDamage);

  // 10. Multi-Hit Calculation
  const hitCount = calculateMultiHitCount(moveKey);
  const totalDamage = singleHitDamage * hitCount;

  // 11. Perks: Firmament (sky_flight) 1.5x boost
  let finalDamage = totalDamage;
  if (isActorPlayer && (battle?.pendingBallPerk === "sky_flight" || battle?.activeBallPerk === "sky_flight")) {
    const wasInAir = (actor as any).semiInvulnerableState === "air" ||
      (actor as any).chargingMove === "fly" ||
      battle?.lastMoveEffect?.wasDescentFromAir;
    if (wasInAir) {
      finalDamage = Math.floor(finalDamage * 1.5);
      critPerkLog += isKo
        ? "\n[PERK:sky_flight] 창공의 힘으로 활공 공격 위력이 1.5배 상승했다!"
        : "\n[PERK:sky_flight] Firmament boosted flight attack power by 1.5x!";
    }
  }

  // Perks: Dinosaur non-dragon move weakening (0.7x)
  if (battle?.dinosaurTurns && battle.dinosaurTurns > 0) {
    if (move.type.toLowerCase() !== "dragon") {
      finalDamage = Math.max(1, Math.floor(finalDamage * 0.7));
    }
  }

  // Perks: Rock Solid damage reduction (0.5x)
  if (!isActorPlayer && battle?.rockSolidTurns && battle.rockSolidTurns > 0) {
    finalDamage = Math.max(1, Math.floor(finalDamage * 0.5));
  }

  // 12. Build Log Text
  let effLog = "";
  if (typeMod >= 2.0) effLog = isKo ? " 효과가 굉장했다!" : " It's super effective!";
  else if (typeMod === 0) effLog = isKo ? " 효과가 없는 것 같다..." : " It had no effect...";
  else if (typeMod <= 0.5) effLog = isKo ? " 효과가 별로인 듯하다..." : " It's not very effective...";

  if (isUndergroundHit && typeMod > 0) {
    effLog += isKo ? "\n(땅속에 숨은 상대에게 2배의 지진 피해!)" : "\n(Dealt double damage to underground target!)";
  }

  if (isCrit && typeMod > 0) {
    effLog += critPerkLog ? critPerkLog : (isKo ? " 급소에 맞았다!" : " A critical hit!");
  }
  if (hitCount > 1) {
    effLog += isKo ? ` (${hitCount}회 명중!)` : ` (Hit ${hitCount} times!)`;
  }

  const mainLog = isKo
    ? `${actorName}의 ${moveName}! ${finalDamage > 0 ? `${finalDamage} 데미지!` : ""}${effLog}`
    : `${actorName}'s ${moveName}! ${finalDamage > 0 ? `${finalDamage} damage!` : ""}${effLog}`;

  return {
    damage: finalDamage,
    typeMod,
    isCrit,
    hitCount,
    isSuperEffective: typeMod >= 2.0,
    log: mainLog,
    isUndergroundHit,
    isSelfDestruct: Boolean(trait?.isSelfDestruct),
    mustRecharge: Boolean(trait?.rechargeRequired),
  };
}
