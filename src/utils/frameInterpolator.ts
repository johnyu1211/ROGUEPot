import { BattleFrame } from "../battle/moves/types.js";

/**
 * Clean Battle Animation Normalizer
 *
 * Preserves keyframe timing, punchy arcade weight, and hitstop pauses.
 * Normalizes delays to GIF-standard 10ms multiples to prevent browser throttling.
 */
export function interpolateBattleFramesTo30Fps(rawFrames: BattleFrame[]): BattleFrame[] {
  const result: BattleFrame[] = [];

  for (let i = 0; i < rawFrames.length; i++) {
    const cur = rawFrames[i];

    // 1. Static final hold (Discord 11-min hold frame)
    if (cur.delay >= 10000) {
      result.push({ ...cur });
      continue;
    }

    // 2. Initial loading blur frame
    if (cur.isBlur) {
      result.push({ ...cur, delay: cur.delay || 800 });
      continue;
    }

    // 3. 500ms Camera Lock Hold or between-act pause
    if (cur.delay >= 400) {
      result.push({ ...cur, delay: Math.round(cur.delay / 10) * 10 });
      continue;
    }

    // 4. Clean Action Keyframe: Ensure delay is an integer multiple of 10ms (minimum 30ms)
    const cleanDelay = Math.max(30, Math.round(cur.delay / 10) * 10);
    result.push({
      ...cur,
      delay: cleanDelay,
    });
  }

  return result;
}
