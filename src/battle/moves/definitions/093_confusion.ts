// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawConfusionMoveEffect, drawConfusionBehindEffect } from "../../../renderers/moves/gen1/move093_096.js";

/**
 * 093: 염동력 (Confusion) - 에스퍼 타입 특수 공격기 (위력 50, 10% 혼란)
 *
 * 연출:
 * - 포켓몬 뒷면 배경 암전 (#1~#4 동안 전장/발판만 암전, 대상 포켓몬은 암전 영향 없음)
 * - 대상 포켓몬 4세대 스타일 순백 오라 & 미세 팽창 + 고주파 진동 결박
 * - #5 염동력 파열: 타격 순간 암전 완전 제거, 8방향 사이킥 스타버스트 & 충격파
 * - #6, #7 전장 복구 및 완전 복귀 (이펙트 잔여물 없음)
 */
export const confusionMove: BattleMoveAnimation = {
  num: 93,
  key: "confusion",
  nameKo: "염동력",
  nameEn: "Confusion",
  type: "psychic",
  category: "special",
  camera: { type: "target", zoom: 1.25 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawConfusionBehindEffect(targetCtx, step, prog);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos, isPlayer } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawConfusionMoveEffect(targetCtx, attackerPos, targetPos, step, prog, isPlayer);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.25,
      pRot: 0,
      eRot: 0,
    };

    return [
      // #1. 암전 & 사이코키네틱 포커스 개시 (반투명 대상 외곽선 및 필터 적용 시작, 미세 부유 개시)
      {
        ...baseFrame,
        delay: 105,
        pOffset: isP ? { x: -2, y: 1 } : (isHit ? { x: 0, y: -2 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: 2, y: -1 } : (isHit ? { x: 0, y: -2 } : { x: 0, y: 0 }),
        pScale: isP ? { x: 1.04, y: 0.96 } : (isHit ? { x: 1.02, y: 1.02 } : undefined),
        eScale: !isP ? { x: 1.04, y: 0.96 } : (isHit ? { x: 1.02, y: 1.02 } : undefined),
        targetWhiteAura: isHit,
        targetWhiteOpacity: 0.38,
        targetWhiteBorderAlpha: 0.75,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.45,
        phaseId: "confusion-prep",
        phaseName: "#1. 암전 & 사이코키네틱 포커스 개시",
      },
      // #2. 텔레키네틱 포커스 & 화이트 오라 & 진동 개시 (4세대 스타일)
      {
        ...baseFrame,
        delay: 105,
        pOffset: !isP && isHit ? { x: -1, y: -4 } : { x: 0, y: 0 },
        eOffset: isP && isHit ? { x: -1, y: -4 } : { x: 0, y: 0 },
        pScale: !isP && isHit ? { x: 1.03, y: 1.03 } : undefined,
        eScale: isP && isHit ? { x: 1.03, y: 1.03 } : undefined,
        targetWhiteAura: isHit,
        targetWhiteOpacity: 0.46,
        targetWhiteBorderAlpha: 0.85,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.35,
        phaseId: "confusion-focus",
        phaseName: "#2. 텔레키네틱 포커스 & 화이트 오라",
      },
      // #3. 사이코키네틱 고주파 진동 & 극대 팽창 (미세 진동 + 크기 변화)
      {
        ...baseFrame,
        delay: 105,
        pOffset: !isP && isHit ? { x: 1, y: -5 } : { x: 0, y: 0 },
        eOffset: isP && isHit ? { x: 1, y: -5 } : { x: 0, y: 0 },
        pScale: !isP && isHit ? { x: 1.05, y: 1.05 } : undefined,
        eScale: isP && isHit ? { x: 1.05, y: 1.05 } : undefined,
        targetWhiteAura: isHit,
        targetWhiteOpacity: 0.50,
        targetWhiteBorderAlpha: 0.85,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.70,
        phaseId: "confusion-vibrate",
        phaseName: "#3. 사이코키네틱 고주파 진동 & 팽창",
      },
      // #4. 사이코키네틱 극대 진동 & 임팩트 직전 (고속 떨림)
      {
        ...baseFrame,
        delay: 105,
        pOffset: !isP && isHit ? { x: -1, y: -4 } : { x: 0, y: 0 },
        eOffset: isP && isHit ? { x: -1, y: -4 } : { x: 0, y: 0 },
        pScale: !isP && isHit ? { x: 1.04, y: 1.04 } : undefined,
        eScale: isP && isHit ? { x: 1.04, y: 1.04 } : undefined,
        targetWhiteAura: isHit,
        targetWhiteOpacity: 0.48,
        targetWhiteBorderAlpha: 0.85,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.95,
        phaseId: "confusion-jitter",
        phaseName: "#4. 사이코키네틱 극대 진동",
      },
      // #5. 염동력 파열 & 사이킥 에너지 타격 (타격 순간)
      {
        ...baseFrame,
        delay: 120,
        pOffset: !isP && isHit ? { x: 5, y: -2 } : { x: 0, y: 0 },
        eOffset: isP && isHit ? { x: -5, y: 2 } : { x: 0, y: 0 },
        pScale: !isP && isHit ? { x: 0.96, y: 1.04 } : undefined,
        eScale: isP && isHit ? { x: 0.96, y: 1.04 } : undefined,
        pWhiteTint: isHit && !isP,
        eWhiteTint: isHit && isP,
        whiteTintRadius: 2.0,
        targetWhiteAura: false,
        showEffect: false,
        hitFlash: isHit,
        moveStep: 3,
        effectProgress: 0.65,
        phaseId: "confusion-impact",
        phaseName: "#5. 염동력 파열 & 사이킥 타격",
      },
      // #6. 전장 복구 & 진동 감쇠 (이펙트 제거, 잔여 진동 복구)
      {
        ...baseFrame,
        delay: 95,
        pOffset: !isP && isHit ? { x: 1, y: 0 } : { x: 0, y: 0 },
        eOffset: isP && isHit ? { x: -1, y: 0 } : { x: 0, y: 0 },
        targetWhiteAura: false,
        showEffect: false,
        hitFlash: false,
        phaseId: "confusion-recover",
        phaseName: "#6. 전장 복구 & 진동 감쇠",
      },
      // #7. 완료 및 복귀 (완전 복귀)
      {
        ...baseFrame,
        delay: 75,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        targetWhiteAura: false,
        showEffect: false,
        hitFlash: false,
        phaseId: "confusion-complete",
        phaseName: "#7. 완료 및 복귀",
      },
    ];
  },
};
