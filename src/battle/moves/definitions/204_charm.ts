// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawCharmEffect } from "../../../renderers/moves/gen1/move201_204.js";

/**
 * 204: 애교부리기 (Charm) - 페어리 타입 변화 기술
 *
 * [유저 지정 연출]:
 * - 시전 포켓몬이 좌 우로 천천히 기울임 (3번)
 * - 움직이는 동안 총 5개의 하트가 불규칙하게 위로 올라오면서 페이드아웃
 */
export const charmMove: BattleMoveAnimation = {
  num: 204,
  key: "charm",
  nameKo: "애교부리기",
  nameEn: "Charm",
  type: "fairy",
  category: "status",
  camera: {
    type: "self",
    zoom: 1.25,
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawCharmEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      cameraZoom: 1.25,
      showEffect: true,
      moveStep: 1,
    };

    // 시전자 오프셋 (수비자는 {0, 0} 완전 고정!)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 시전자 회전 (좌/우 기울임)
    const cRot = (rot: number) => ({
      pRot: isP ? rot : 0,
      eRot: !isP ? -rot : 0,
    });

    // 시전자 살짝 탄성 스케일
    const cScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : { x: 1.0, y: 1.0 },
      eScale: !isP ? { x, y } : { x: 1.0, y: 1.0 },
    });

    // 빗맞았을 때 (Miss 처리)
    if (ctx.isHit === false) {
      return [
        {
          ...baseFrame,
          delay: 200,
          ...cRot(-0.12),
          ...cOff(-2, 0),
          charmProgress: 0.35,
          phaseId: "charm-miss-1",
          phaseName: "1. 시전자 애교",
        },
        {
          ...baseFrame,
          delay: 200,
          ...cRot(0.12),
          ...cOff(2, 0),
          charmProgress: 0.85,
          phaseId: "charm-miss-2",
          phaseName: "2. 하트 흩어짐",
        },
        {
          ...baseFrame,
          delay: 120,
          ...cRot(0),
          ...cOff(0, 0),
          charmProgress: 1.0,
          showEffect: false,
          moveStep: 2,
          phaseId: "charm-miss-finish",
          phaseName: "3. 복귀",
        },
      ];
    }

    return [
      // ======================================================================
      // 1회차: 좌 우 길고 천천히 기울임
      // ======================================================================
      // #1. 1회차 좌 기울임
      {
        ...baseFrame,
        delay: 220,
        ...cRot(-0.16),
        ...cOff(-3, 0),
        ...cScale(1.04, 0.96),
        charmProgress: 0.15,
        phaseId: "charm-tilt-1-left",
        phaseName: "#1. 1회차 좌 기울임",
      },
      // #2. 1회차 우 기울임
      {
        ...baseFrame,
        delay: 220,
        ...cRot(0.16),
        ...cOff(3, 0),
        ...cScale(0.96, 1.04),
        charmProgress: 0.42,
        phaseId: "charm-tilt-1-right",
        phaseName: "#2. 1회차 우 기울임",
      },

      // ======================================================================
      // 2회차: 좌 우 길고 천천히 기울임
      // ======================================================================
      // #3. 2회차 좌 기울임
      {
        ...baseFrame,
        delay: 220,
        ...cRot(-0.16),
        ...cOff(-3, 0),
        ...cScale(1.04, 0.96),
        charmProgress: 0.68,
        phaseId: "charm-tilt-2-left",
        phaseName: "#3. 2회차 좌 기울임",
      },
      // #4. 2회차 우 기울임
      {
        ...baseFrame,
        delay: 220,
        ...cRot(0.16),
        ...cOff(3, 0),
        ...cScale(0.96, 1.04),
        charmProgress: 0.90,
        phaseId: "charm-tilt-2-right",
        phaseName: "#4. 2회차 우 기울임",
      },

      // ======================================================================
      // 복귀: 중앙 원위치 안정 복귀
      // ======================================================================
      {
        ...baseFrame,
        delay: 130,
        ...cRot(0),
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        charmProgress: 1.0,
        moveStep: 2,
        phaseId: "charm-tilt-finish",
        phaseName: "#5. 중앙 복귀 완료",
      },
    ];
  },
};
