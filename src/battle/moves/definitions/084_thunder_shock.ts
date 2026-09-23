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
    const { attackerPos, targetPos, isPlayer } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawThunderShockEffect(targetCtx, attackerPos, targetPos, step, prog, isPlayer);
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
      // #1. 정전기 스파크 충전 (은은한 암전 속 플라즈마 응축)
      {
        ...baseFrame,
        delay: 95,
        pOffset: isP ? { x: -2, y: 1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 2, y: -1 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.04, y: 0.96 } : undefined,
        eScale: !isP ? { x: 1.04, y: 0.96 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.50,
        phaseId: "thunder-shock-charge",
        phaseName: "#1. 정전기 스파크 충전",
      },
      // #2. 2가닥 슬림 뇌격 발사 (0% -> 50% 도달)
      {
        ...baseFrame,
        delay: 85,
        pOffset: isP ? { x: 4, y: -1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -4, y: 1 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.50,
        phaseId: "thunder-shock-launch",
        phaseName: "#2. 전기 가닥 고속 발사",
      },
      // #3. 전격 전장 쇄도 & 표적 직전 도달 (50% -> 100% 관통 격돌)
      {
        ...baseFrame,
        delay: 80,
        pOffset: isP ? { x: 3, y: -1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -3, y: 1 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.85,
        phaseId: "thunder-shock-surge",
        phaseName: "#3. 전격 전장 쇄도",
      },
      // #4. 표적 정면 직격 & 황금빛 대전환
      {
        ...baseFrame,
        delay: 105,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: -6, y: 2 } : { x: 6, y: -2 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: isHit,
        pWhiteTint: isHit && !isP,
        eWhiteTint: isHit && isP,
        moveStep: 4,
        effectProgress: 0.50,
        phaseId: "thunder-shock-impact",
        phaseName: "#4. 직격 타격 & 황금빛 대전환",
      },
      // #5. 전격 플라즈마 방전 확장 & 전신 감전 루프 (황금빛 1차 페이드)
      {
        ...baseFrame,
        delay: 95,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: 4, y: -1 } : { x: -4, y: 1 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 5,
        effectProgress: 0.65,
        phaseId: "thunder-shock-discharge",
        phaseName: "#5. 플라즈마 방전 & 감전 루프",
      },
      // #6. 뇌격 스파크 비산 (황금빛 2차 페이드 & 피격 데미지)
      {
        ...baseFrame,
        delay: 90,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: -2, y: 1 } : { x: 2, y: -1 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 6,
        effectProgress: 0.70,
        phaseId: "thunder-shock-burst",
        phaseName: "#6. 뇌격 스파크 비산",
      },
      // #7. 잔류 전격 냉각 & 전장 조명 완전 복귀
      {
        ...baseFrame,
        delay: 75,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 7,
        effectProgress: 0.50,
        phaseId: "thunder-shock-cool",
        phaseName: "#7. 잔류 전격 냉각",
      },
      // #8. 완료 및 복귀
      {
        ...baseFrame,
        delay: 65,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "thunder-shock-complete",
        phaseName: "#8. 완료 및 복귀",
      },
    ];
  },
};
