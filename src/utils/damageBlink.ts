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
  const initEnemyHp = action.enemyHpBefore !== undefined ? action.enemyHpBefore : (frames[0]?.enemyHp ?? action.enemyHpAfter);
  const initPlayerHp = action.playerHpBefore !== undefined ? action.playerHpBefore : (frames[0]?.playerHp ?? action.playerHpAfter);
  const afterEnemyHp = action.enemyHpAfter ?? initEnemyHp;
  const afterPlayerHp = action.playerHpAfter ?? initPlayerHp;

  let targetInitialHp = isAttackerPlayer ? initEnemyHp : initPlayerHp;
  const targetFinalHp = isAttackerPlayer ? afterEnemyHp : afterPlayerHp;
  let hpLoss = targetInitialHp - targetFinalHp;

  const damage = action.damage ?? (hpLoss > 0 ? hpLoss : 0);
  const typeMod = action.typeMod !== undefined ? action.typeMod : (action.isSuperEffective ? 2.0 : 1.0);

  // Fallback: If targetInitialHp was equal to targetFinalHp but damage was dealt,
  // reconstruct targetInitialHp from targetFinalHp + damage so HP drain ALWAYS renders!
  if (hpLoss <= 0 && damage > 0 && isHit) {
    targetInitialHp = targetFinalHp + damage;
    hpLoss = damage;
  }

  const initEnemyStatus = action.enemyStatusBefore !== undefined ? action.enemyStatusBefore : null;
  const initPlayerStatus = action.playerStatusBefore !== undefined ? action.playerStatusBefore : null;
  const afterEnemyStatus = action.enemyStatusAfter !== undefined ? action.enemyStatusAfter : initEnemyStatus;
  const afterPlayerStatus = action.playerStatusAfter !== undefined ? action.playerStatusAfter : initPlayerStatus;

  let insertIdx = frames.findIndex(f => f.afterCameraReturn);
  if (insertIdx === -1) {
    insertIdx = frames.length;
  }

  // 상태이상 부여/변화 타이밍: afterCameraReturn이 없는 변화기 등의 경우 타격/절정 시점부터 상태이상 필터 적용
  let statusChangeIdx = insertIdx;
  if (statusChangeIdx === frames.length && isHit && (afterEnemyStatus !== initEnemyStatus || afterPlayerStatus !== initPlayerStatus)) {
    const foundIdx = frames.findIndex(f =>
      f.hitFlash ||
      (f.moveStep && f.moveStep >= 3) ||
      f.phaseId?.includes("strike") ||
      f.phaseId?.includes("hit") ||
      f.phaseId?.includes("impact") ||
      f.phaseId?.includes("open") ||
      f.phaseId?.includes("climax") ||
      f.showEffect === false
    );
    statusChangeIdx = foundIdx !== -1 ? foundIdx : Math.max(1, Math.floor(frames.length * 0.5));
  }

  // 효과가 없는 경우 (0x / 무효 / 미스 / 데미지 0): 깜빡임 및 체력 변동 X (단, 기술 정의에서 오염된 HP 값은 시작 체력으로 완전 복구)
  if (!isHit || damage <= 0 || typeMod === 0 || hpLoss <= 0) {
    for (let i = 0; i < frames.length; i++) {
      if (frames[i].enemyHp !== undefined) frames[i].enemyHp = initEnemyHp;
      if (frames[i].playerHp !== undefined) frames[i].playerHp = initPlayerHp;
      if (frames[i].enemyStatus === undefined) {
        frames[i].enemyStatus = (i < statusChangeIdx ? initEnemyStatus : afterEnemyStatus);
      }
      if (frames[i].playerStatus === undefined) {
        frames[i].playerStatus = (i < statusChangeIdx ? initPlayerStatus : afterPlayerStatus);
      }
    }
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

  // 3. [유저 요구사항] 기술 진행 & 카메라 복귀 동안에는 체력바를 이전 체력(피격 전)으로 엄격히 유지!
  // 기술 진행 및 카메라 복귀 프레임은 양쪽 모두 아직 데미지가 체력바에 반영되지 않은 시작 상태로 강제 고정
  for (let i = 0; i < insertIdx; i++) {
    frames[i].enemyHp = initEnemyHp;
    frames[i].playerHp = initPlayerHp;
    frames[i].enemyStatus = initEnemyStatus;
    frames[i].playerStatus = initPlayerStatus;
  }

  // 기술 애니메이션이 끝난 정위치/복귀 상태의 프레임을 베이스로 사용
  const lastActionFrame = frames[insertIdx - 1] || frames[frames.length - 1];

  // 4. 깜빡거림(점멸) 프레임: 데미지 피격으로 인한 스프라이트 점멸
  // ⚠️ [유저 요구사항] 깜빡거리는 동안에는 체력바가 절대 줄어들지 않고 양쪽 시작 체력을 100% 그대로 유지!
  const blinkFrames: BattleFrame[] = [];

  const isAttackerEvading = isAttackerPlayer
    ? Boolean(lastActionFrame.pOffset && lastActionFrame.pOffset.y <= -500)
    : Boolean(lastActionFrame.eOffset && lastActionFrame.eOffset.y <= -500);
  const isDefenderEvading = !isAttackerPlayer
    ? Boolean(lastActionFrame.pOffset && lastActionFrame.pOffset.y <= -500)
    : Boolean(lastActionFrame.eOffset && lastActionFrame.eOffset.y <= -500);

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
      hidePlayer: isAttackerPlayer ? false : isDefenderEvading,
      hideEnemy: !isAttackerPlayer ? false : isDefenderEvading,
      pAlpha: isAttackerPlayer ? 1.0 : undefined,
      eAlpha: !isAttackerPlayer ? 1.0 : undefined,
      enemyHp: initEnemyHp,
      playerHp: initPlayerHp,
      enemyStatus: afterEnemyStatus,
      playerStatus: afterPlayerStatus,
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
      hidePlayer: isAttackerPlayer ? false : isDefenderEvading,
      hideEnemy: !isAttackerPlayer ? false : isDefenderEvading,
      pAlpha: isAttackerPlayer ? 1.0 : undefined,
      eAlpha: !isAttackerPlayer ? 1.0 : undefined,
      enemyHp: initEnemyHp,
      playerHp: initPlayerHp,
      enemyStatus: afterEnemyStatus,
      playerStatus: afterPlayerStatus,
      eOffset: { x: 0, y: 0 },
      pOffset: { x: 0, y: 0 },
      phaseId: `damage-blink-${c + 1}-on`,
      phaseName: `피격 깜빡임 ${c + 1} (불투명 점멸)`,
    });
  }

  // 5. [유저 요구사항 - 핵심] 깜빡거림(점멸)이 완전히 끝난 직후, 체력 게이지 감소 애니메이션(HP Drain) 재생!
  // 눈으로 체력 게이지가 부드럽게 깎이는 것을 확실히 볼 수 있도록 감속 4단계(스텝당 90ms, 마지막 안착 220ms, 총 490ms)로 여유롭게 진행
  const hpDrainFrames: BattleFrame[] = [];
  const drainSteps = 4;

  for (let s = 1; s <= drainSteps; s++) {
    const progress = s / drainSteps;
    // Ease-out 감속 곡선: 실시간 체력 게이지 바가 스르륵 자연스럽게 감소
    const t = Math.sin((progress * Math.PI) / 2);
    const curHp = Math.max(targetFinalHp, Math.round(targetInitialHp - hpLoss * t));
    const isLast = (s === drainSteps);

    hpDrainFrames.push({
      ...lastActionFrame,
      delay: isLast ? 220 : 90, // 단계당 90ms, 마지막 안착 220ms로 편안하게 인지
      showEffect: false,
      hitFlash: false,
      afterCameraReturn: true,
      hideUI: false, // 체력 게이지 감소 애니메이션 재생 중 체력바 및 메시지창 표시
      targetAlpha: 1.0,
      hidePlayer: isAttackerPlayer ? false : isDefenderEvading,
      hideEnemy: !isAttackerPlayer ? false : isDefenderEvading,
      pAlpha: isAttackerPlayer ? 1.0 : undefined,
      eAlpha: !isAttackerPlayer ? 1.0 : undefined,
      enemyHp: isAttackerPlayer ? curHp : initEnemyHp,
      playerHp: !isAttackerPlayer ? curHp : initPlayerHp,
      enemyStatus: afterEnemyStatus,
      playerStatus: afterPlayerStatus,
      eOffset: { x: 0, y: 0 },
      pOffset: { x: 0, y: 0 },
      phaseId: `hp-drain-${s}`,
      phaseName: `체력 게이지 감소 (${Math.round(progress * 100)}%)`,
    });
  }

  // 6. 깜빡임 및 체력 감소 이후의 후속 프레임(예: 돌진 반동 프레임 등)은 대상은 최종 HP, 시전자는 초기 HP(반동 전) 유지
  for (let i = insertIdx; i < frames.length; i++) {
    if (frames[i].enemyStatus === undefined) {
      frames[i].enemyStatus = afterEnemyStatus;
    }
    if (frames[i].playerStatus === undefined) {
      frames[i].playerStatus = afterPlayerStatus;
    }
    if (isAttackerPlayer) {
      frames[i].enemyHp = targetFinalHp;
      if (frames[i].playerHp === undefined) {
        frames[i].playerHp = initPlayerHp;
      }
    } else {
      frames[i].playerHp = targetFinalHp;
      if (frames[i].enemyHp === undefined) {
        frames[i].enemyHp = initEnemyHp;
      }
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
