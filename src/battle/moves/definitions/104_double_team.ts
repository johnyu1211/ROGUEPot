// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawDoubleTeamEffect, drawDoubleTeamBehindEffect } from "../../../renderers/moves/gen1/move101_104.js";

/**
 * 104: 그림자분신 (Double Team) - 노말 타입 회피율 1랭크 상승 변화기
 *
 * 연출 구성 (과한 부가 이펙트 일체 배제 & 순수 다중 잔상 확산 연출):
 * 1. 시전자 고속 미세 진동
 * 2. 시전자 중심에서 좌우로 6체의 반투명 잔상 급속 확산 전개
 * 3. 흩어진 다중 잔상들의 고속 진동 산란
 * 4. 잔상들의 부드러운 교차 위브 셔플
 * 5. 잔상들이 중앙 본체로 깔끔하게 수렴 융합
 * 6. 안정 대기 복귀
 */
export const doubleTeamMove: BattleMoveAnimation = {
  num: 104,
  key: "double-team",
  nameKo: "그림자분신",
  nameEn: "Double Team",
  type: "normal",
  category: "status",
  camera: { type: "self", zoom: 1.25 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawDoubleTeamBehindEffect(targetCtx, attackerPos, targetPos, step, prog, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawDoubleTeamEffect(targetCtx, attackerPos, targetPos, step, prog, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.25,
      pRot: 0,
      eRot: 0,
    };

    // 시전자 전용 오프셋 (수비자는 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    return [
      // #1. 고속 진동 (좌)
      {
        ...baseFrame,
        delay: 75,
        ...cOff(-3, 1),
        pScale: isP ? { x: 1.05, y: 0.95 } : undefined,
        eScale: !isP ? { x: 1.05, y: 0.95 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.25,
        phaseId: "double-team-prep-1",
        phaseName: "#1. 고속 진동 (좌)",
      },
      // #2. 고속 진동 (우)
      {
        ...baseFrame,
        delay: 75,
        ...cOff(3, -1),
        pScale: isP ? { x: 0.97, y: 1.03 } : undefined,
        eScale: !isP ? { x: 0.97, y: 1.03 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.75,
        phaseId: "double-team-prep-2",
        phaseName: "#2. 고속 진동 (우)",
      },
      // #3. 잔상 다중 확산 (전개)
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        pScale: isP ? { x: 1.02, y: 0.98 } : undefined,
        eScale: !isP ? { x: 1.02, y: 0.98 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.45,
        phaseId: "double-team-split-1",
        phaseName: "#3. 잔상 다중 확산 (전개)",
      },
      // #4. 잔상 완전 확산
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 1.0,
        phaseId: "double-team-split-2",
        phaseName: "#4. 잔상 완전 확산",
      },
      // #5. 잔상 고속 진동 1
      {
        ...baseFrame,
        delay: 90,
        ...cOff(-2, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.35,
        phaseId: "double-team-jitter-1",
        phaseName: "#5. 잔상 고속 진동 1",
      },
      // #6. 잔상 고속 진동 2
      {
        ...baseFrame,
        delay: 90,
        ...cOff(2, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.85,
        phaseId: "double-team-jitter-2",
        phaseName: "#6. 잔상 고속 진동 2",
      },
      // #7. 잔상 교차 셔플
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.50,
        phaseId: "double-team-weave",
        phaseName: "#7. 잔상 교차 셔플",
      },
      // #8. 잔상 중심 수렴 1
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 5,
        effectProgress: 0.40,
        phaseId: "double-team-converge-1",
        phaseName: "#8. 잔상 중심 수렴 1",
      },
      // #9. 잔상 본체 융합 2
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 5,
        effectProgress: 0.85,
        phaseId: "double-team-converge-2",
        phaseName: "#9. 잔상 본체 융합 2",
      },
      // #10. 안정 복귀
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: false,
        hitFlash: false,
        moveStep: 6,
        effectProgress: 1.0,
        phaseId: "double-team-finish",
        phaseName: "#10. 안정 복귀",
      },
    ];
  },
};
