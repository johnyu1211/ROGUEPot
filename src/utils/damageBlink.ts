// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleFrame } from "../battle/moves/types.js";

/**
 * Applies authentic Pokémon damage blinking to target sprite based on type effectiveness.
 * 
 * Rules (User Directed):
 * - 효과가 없는 경우 (typeMod === 0 or damage === 0 or miss): X (0회)
 * - 효과가 매우 별로 (typeMod <= 0.25): 50% 반투명 1회 (targetAlpha: 0.50 -> 1.0)
 * - 효과가 별로 (0.25 < typeMod <= 0.5): 1회 (targetAlpha: 0.15 -> 1.0)
 * - 일반 타격 (0.5 < typeMod <= 1.0): 2회 (targetAlpha: 0.15 -> 1.0 -> 0.15 -> 1.0)
 * - 효과가 굉장하다 (1.0 < typeMod <= 2.0): 4회
 * - 효과가 매우 굉장하다 (typeMod >= 4.0): 5회
 */
export function applyDamageBlinkFrames(
  frames: BattleFrame[],
  action: any,
  isAttackerPlayer: boolean
): BattleFrame[] {
  if (!frames || frames.length === 0) return frames;

  // 1. Check if attack hits and deals damage
  const isHit = action.isHit !== false && !action.isMiss;
  const initEnemyHp = frames[0]?.enemyHp ?? action.enemyHpAfter;
  const initPlayerHp = frames[0]?.playerHp ?? action.playerHpAfter;
  const afterEnemyHp = action.enemyHpAfter ?? initEnemyHp;
  const afterPlayerHp = action.playerHpAfter ?? initPlayerHp;

  const targetInitialHp = isAttackerPlayer ? initEnemyHp : initPlayerHp;
  const targetFinalHp = isAttackerPlayer ? afterEnemyHp : afterPlayerHp;
  const hpLoss = targetInitialHp - targetFinalHp;

  const damage = action.damage ?? (hpLoss > 0 ? hpLoss : 0);
  const typeMod = action.typeMod !== undefined ? action.typeMod : (action.isSuperEffective ? 2.0 : 1.0);

  // 효과가 없는 경우 (0x / 무효 / 미스 / 데미지 0): 깜빡임 및 체력 변동 X
  if (!isHit || damage <= 0 || typeMod === 0 || hpLoss <= 0) {
    return frames;
  }

  // 2. Determine cycle count, alpha, and duration
  let cycleCount = 0;
  let alphaLow = 0.15;
  let cycleDuration = 50;

  if (typeMod <= 0.25) {
    // 효과가 매우 별로 50% 반투명 1회
    cycleCount = 1;
    alphaLow = 0.50;
    cycleDuration = 60;
  } else if (typeMod <= 0.5) {
    // 효과가 별로 1회
    cycleCount = 1;
    alphaLow = 0.15;
    cycleDuration = 60;
  } else if (typeMod <= 1.0) {
    // 일반 타격 2회
    cycleCount = 2;
    alphaLow = 0.15;
    cycleDuration = 50;
  } else if (typeMod <= 2.0) {
    // 효과가 굉장하다 4회
    cycleCount = 4;
    alphaLow = 0.15;
    cycleDuration = 50;
  } else {
    // 효과가 매우 굉장하다 (4배 이상) 5회
    cycleCount = 5;
    alphaLow = 0.15;
    cycleDuration = 45;
  }

  if (cycleCount === 0) return frames;

  // 3. [유저 요구사항] 기술 진행 & 카메라 복귀 동안에는 체력바를 이전 체력(피격 전)으로 유지!
  let insertIdx = frames.findIndex(f => f.afterCameraReturn);
  if (insertIdx === -1) {
    insertIdx = frames.length;
  }

  // 기술 진행 및 카메라 복귀 프레임은 아직 데미지가 체력바에 반영되지 않은 이전 상태로 유지
  for (let i = 0; i < insertIdx; i++) {
    if (isAttackerPlayer) {
      frames[i].enemyHp = targetInitialHp;
    } else {
      frames[i].playerHp = targetInitialHp;
    }
  }

  // 기술 애니메이션이 끝난 정위치/복귀 상태의 프레임을 베이스로 사용
  const lastActionFrame = frames[insertIdx - 1] || frames[frames.length - 1];

  // 4. 깜빡거림(점멸) 프레임: 데미지 피격으로 인한 스프라이트 점멸
  // ⚠️ [유저 요구사항] 깜빡거리는 동안에는 체력바가 줄어들지 않고 이전 체력(targetInitialHp)을 그대로 유지!
  const blinkFrames: BattleFrame[] = [];

  for (let c = 0; c < cycleCount; c++) {
    // Off frame (반투명/투명 점멸 - 피격 충격)
    blinkFrames.push({
      ...lastActionFrame,
      delay: cycleDuration,
      showEffect: false,
      hitFlash: false,
      afterCameraReturn: true, // 카메라가 원상태로 돌아온 후에 깜빡임
      hideUI: false, // 피격 중 체력바 및 메시지창 표시
      targetAlpha: alphaLow,
      enemyHp: isAttackerPlayer ? targetInitialHp : lastActionFrame.enemyHp,
      playerHp: !isAttackerPlayer ? targetInitialHp : lastActionFrame.playerHp,
      eOffset: isAttackerPlayer ? { x: (c % 2 === 0 ? -3 : 2), y: 1 } : { x: 0, y: 0 },
      pOffset: !isAttackerPlayer ? { x: (c % 2 === 0 ? 3 : -2), y: -1 } : { x: 0, y: 0 },
      phaseId: `damage-blink-${c + 1}-off`,
      phaseName: `피격 깜빡임 ${c + 1} (투명 점멸)`,
    });

    // On frame (불투명 점멸)
    blinkFrames.push({
      ...lastActionFrame,
      delay: cycleDuration,
      showEffect: false,
      hitFlash: false,
      afterCameraReturn: true,
      hideUI: false, // 피격 중 체력바 및 메시지창 표시
      targetAlpha: 1.0,
      enemyHp: isAttackerPlayer ? targetInitialHp : lastActionFrame.enemyHp,
      playerHp: !isAttackerPlayer ? targetInitialHp : lastActionFrame.playerHp,
      eOffset: { x: 0, y: 0 },
      pOffset: { x: 0, y: 0 },
      phaseId: `damage-blink-${c + 1}-on`,
      phaseName: `피격 깜빡임 ${c + 1} (불투명 점멸)`,
    });
  }

  // 5. [유저 요구사항 - 핵심] 깜빡거림(점멸)이 완전히 끝난 직후, 체력 게이지 감소 애니메이션(HP Drain) 재생!
  const hpDrainFrames: BattleFrame[] = [];
  const drainSteps = 4; // 4단계 부드러운 체력 감소 감속 연출

  for (let s = 1; s <= drainSteps; s++) {
    const progress = s / drainSteps;
    // Ease-out 감속 곡선: 실시간 체력 게이지 바가 스르륵 자연스럽게 감소
    const t = Math.sin((progress * Math.PI) / 2);
    const curHp = Math.max(targetFinalHp, Math.round(targetInitialHp - hpLoss * t));
    const isLast = (s === drainSteps);

    hpDrainFrames.push({
      ...lastActionFrame,
      delay: isLast ? 130 : 65, // 마지막 안착 프레임은 살짝 머물러 안정감 부여
      showEffect: false,
      hitFlash: false,
      afterCameraReturn: true,
      hideUI: false, // 체력 게이지 감소 애니메이션 재생 중 체력바 및 메시지창 표시
      targetAlpha: 1.0,
      enemyHp: isAttackerPlayer ? curHp : lastActionFrame.enemyHp,
      playerHp: !isAttackerPlayer ? curHp : lastActionFrame.playerHp,
      eOffset: { x: 0, y: 0 },
      pOffset: { x: 0, y: 0 },
      phaseId: `hp-drain-${s}`,
      phaseName: `체력 게이지 감소 (${Math.round(progress * 100)}%)`,
    });
  }

  // 6. 깜빡임 및 체력 감소 이후의 후속 프레임(예: 돌진 반동 프레임 등)은 최종 감소된 HP 유지
  for (let i = insertIdx; i < frames.length; i++) {
    if (isAttackerPlayer) {
      frames[i].enemyHp = targetFinalHp;
    } else {
      frames[i].playerHp = targetFinalHp;
    }
  }

  const result: BattleFrame[] = [
    ...frames.slice(0, insertIdx),
    ...blinkFrames,
    ...hpDrainFrames,
    ...frames.slice(insertIdx),
  ];

  return result;
}
