import { StatStages } from "../engine/types.js";

/**
 * Calculates multiplier for primary combat stats (Atk, Def, SpA, SpD, Spe).
 * Stage ranges from -6 to +6.
 */
export function getStageMultiplier(stage: number): number {
  const s = Math.max(-6, Math.min(6, stage));
  if (s >= 0) return (2 + s) / 2;
  return 2 / (2 - s);
}

/**
 * Calculates multiplier for accuracy and evasiveness.
 * Stage ranges from -6 to +6.
 */
export function getAccuracyMultiplier(stage: number): number {
  const s = Math.max(-6, Math.min(6, stage));
  if (s >= 0) return (3 + s) / 3;
  return 3 / (3 - s);
}

export interface StatChangeResult {
  success: boolean;
  actualDelta: number;
  logKo: string;
  logEn: string;
}

function getSubjectParticle(word: string): string {
  if (!word) return "이";
  const lastCode = word.charCodeAt(word.length - 1);
  if (lastCode < 0xac00 || lastCode > 0xd7a3) return "이";
  return (lastCode - 0xac00) % 28 > 0 ? "이" : "가";
}

/**
 * Applies a stat change (-6 to +6 bounded) to a Pokémon.
 */
export function applyStatChange(
  stages: StatStages,
  statKey: keyof StatStages,
  delta: number,
  monNameKo: string,
  monNameEn: string,
  statNameKo: string,
  statNameEn: string
): StatChangeResult {
  const current = stages[statKey] || 0;
  const josa = getSubjectParticle(statNameKo);

  if (delta > 0) {
    if (current >= 6) {
      return {
        success: false,
        actualDelta: 0,
        logKo: `${monNameKo}의 ${statNameKo}(은)는 더 이상 올라가지 않는다!`,
        logEn: `${monNameEn}'s ${statNameEn} won't go any higher!`,
      };
    }
    const actualDelta = Math.min(6 - current, delta);
    stages[statKey] = current + actualDelta;
    const sharply = actualDelta >= 2 ? " 크게" : "";
    const sharplyEn = actualDelta >= 2 ? " sharply" : "";
    return {
      success: true,
      actualDelta,
      logKo: `${monNameKo}의 ${statNameKo}${josa}${sharply} 올랐다! (+${actualDelta})`,
      logEn: `${monNameEn}'s ${statNameEn}${sharplyEn} rose! (+${actualDelta})`,
    };
  } else {
    if (current <= -6) {
      return {
        success: false,
        actualDelta: 0,
        logKo: `${monNameKo}의 ${statNameKo}(은)는 더 이상 떨어지지 않는다!`,
        logEn: `${monNameEn}'s ${statNameEn} won't go any lower!`,
      };
    }
    const actualDelta = Math.max(-6 - current, delta);
    stages[statKey] = current + actualDelta;
    const harshly = Math.abs(actualDelta) >= 2 ? " 크게" : "";
    const harshlyEn = Math.abs(actualDelta) >= 2 ? " harshly" : "";
    return {
      success: true,
      actualDelta,
      logKo: `${monNameKo}의 ${statNameKo}${josa}${harshly} 떨어졌다! (${actualDelta})`,
      logEn: `${monNameEn}'s ${statNameEn}${harshlyEn} fell! (${actualDelta})`,
    };
  }
}
