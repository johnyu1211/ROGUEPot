import { BattlePokemon } from "../engine/types.js";
import { MoveData } from "../../data/movesKo.js";
import { getAccuracyMultiplier } from "./statModifier.js";

const NEVER_MISS_MOVES = new Set([
  "aerial-ace", "swift", "feint-attack", "aura-sphere", "magical-leaf",
  "shock-wave", "shadow-punch", "magnet-bomb", "disarming-voice", "clear-smog"
]);

export interface AccuracyCheckContext {
  actor: BattlePokemon;
  target: BattlePokemon;
  move: MoveData;
  weather?: "sun" | "rain" | "sand" | "snow" | null;
  hasClearEyePerk?: boolean;
}

/**
 * Accuracy evaluation engine.
 * Fixes the classic bug where 100%-base-accuracy moves ignored evasion/accuracy stat stages.
 */
export function checkMoveHit(ctx: AccuracyCheckContext): { isHit: boolean; reason?: string } {
  const { actor, target, move, weather, hasClearEyePerk } = ctx;
  const moveKey = move.name.toLowerCase().replace(/[\s_]+/g, "-");

  // 1. Never-miss move detection
  const isNeverMissMove = NEVER_MISS_MOVES.has(moveKey) ||
    (move.accuracy as any) === true ||
    move.accuracy === null ||
    move.accuracy === 0;

  // 2. Poison-type Pokémon using Toxic is guaranteed to hit
  const isPoisonToxic = (moveKey === "toxic") && actor.types.map(t => t.toLowerCase()).includes("poison");

  // 3. No Guard ability guarantees hit on either side
  const hasNoGuard = actor.ability?.toLowerCase() === "no-guard" ||
    actor.passiveAbility?.toLowerCase() === "no-guard" ||
    target.ability?.toLowerCase() === "no-guard" ||
    target.passiveAbility?.toLowerCase() === "no-guard";

  if (isNeverMissMove || isPoisonToxic || hasNoGuard) {
    return { isHit: true, reason: "never_miss" };
  }

  // 4. Weather-based accuracy overrides
  let baseAcc = move.accuracy ?? 100;
  if (weather === "rain" && (moveKey === "thunder" || moveKey === "hurricane")) {
    return { isHit: true, reason: "rain_boost" };
  } else if (weather === "snow" && moveKey === "blizzard") {
    return { isHit: true, reason: "snow_boost" };
  } else if (weather === "sun" && (moveKey === "thunder" || moveKey === "hurricane")) {
    baseAcc = 50;
  }

  // 5. Ball perk boost
  if (hasClearEyePerk) {
    baseAcc = Math.min(100, baseAcc + 20);
  }

  // 6. Accuracy & Evasiveness stage modifier (-6 to +6)
  const accStage = Math.max(-6, Math.min(6, (actor.stages.acc || 0) - (target.stages.eva || 0)));
  const stageMult = getAccuracyMultiplier(accStage);
  const finalAcc = baseAcc * stageMult;

  // If final accuracy is 100% or above (and was 100% base with 0 stage difference), it hits.
  if (finalAcc >= 100) {
    return { isHit: true };
  }

  // Roll accuracy against 100
  const roll = Math.random() * 100;
  return { isHit: roll <= finalAcc };
}
