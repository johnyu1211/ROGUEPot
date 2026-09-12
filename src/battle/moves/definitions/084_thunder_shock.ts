// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawThunderShockEffect } from "../../../renderers/moves/gen1/move081_084.js";

/**
 * 084: 전기쇼크 (Thunder Shock) - 전기 타입 특수기 (10% 확률 마비)
 *
 * 연출:
 * - 시전자 정전기 스파크 응축
 * - 3중 레이어 지그재그 분기 뇌격 사출
 * - 정면 직격 1프레임 히트 플래시
 * - 전신 감전 아크 방전 케이지 & 8방향 전기 스파크 비산
 */
export const thunderShockMove: BattleMoveAnimation = {
  num: 84,
  key: "thunder-shock",
  nameKo: "전기쇼크",
  nameEn: "Thunder Shock",
  type: "electric",
  category: "special",
  camera: { type: "target", zoom: 1.35 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawThunderShockEffect(targetCtx, attackerPos, targetPos, step, prog);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.35,
      pRot: 0,
      eRot: 0,
    };

    return [
      // #1. 정전기 스파크 충전
      {
        ...baseFrame,
        delay: 90,
        pOffset: isP ? { x: -2, y: 1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 2, y: -1 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.05, y: 0.95 } : undefined,
        eScale: !isP ? { x: 1.05, y: 0.95 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.50,
        phaseId: "thunder-shock-charge",
        phaseName: "#1. 정전기 스파크 충전",
      },
      // #2. 지그재그 뇌격 사출
      {
        ...baseFrame,
        delay: 85,
        pOffset: isP ? { x: 4, y: -1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -4, y: 1 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.85,
        phaseId: "thunder-shock-discharge",
        phaseName: "#2. 지그재그 뇌격 사출",
      },
      // #3. 전격 정면 직격 섬광
      {
        ...baseFrame,
        delay: 95,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: -5, y: 2 } : { x: 5, y: -2 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: isHit,
        pWhiteTint: isHit && !isP,
        eWhiteTint: isHit && isP,
        moveStep: 3,
        effectProgress: 0.50,
        phaseId: "thunder-shock-strike",
        phaseName: "#3. 전격 정면 직격",
      },
      // #4. 감전 아크 방전 케이지
      {
        ...baseFrame,
        delay: 100,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: 4, y: -1 } : { x: -4, y: 1 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.60,
        phaseId: "thunder-shock-arc",
        phaseName: "#4. 감전 아크 방전",
      },
      // #5. 뇌격 스파크 비산
      {
        ...baseFrame,
        delay: 95,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: -3, y: 1 } : { x: 3, y: -1 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 5,
        effectProgress: 0.70,
        phaseId: "thunder-shock-burst",
        phaseName: "#5. 뇌격 스파크 비산",
      },
      // #6. 잔류 전류 페이드
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 6,
        effectProgress: 0.60,
        phaseId: "thunder-shock-fade",
        phaseName: "#6. 잔류 전류 페이드",
      },
      // #7. 완료 및 복귀
      {
        ...baseFrame,
        delay: 75,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "thunder-shock-complete",
        phaseName: "#7. 완료 및 복귀",
      },
    ];
  },
};
