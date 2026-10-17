// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawRecycleBehindEffect,
  drawRecycleEffect,
} from "../../../renderers/moves/gen1/move277_280.js";

/**
 * ♻️ 278: 리사이클 (Recycle / リサイクル) - 노말 타입 변화 기술
 *
 * 위력: — / 명중: — / PP: 10 / 대상: 자신 / 접촉: X
 * 설명: 배틀 중에 사용하여 없어진 자신의 지닌 물건을 재생시켜 사용할 수 있게 한다.
 */
export const recycleMove: BattleMoveAnimation = {
  num: 278,
  key: "recycle",
  nameKo: "리사이클",
  nameEn: "Recycle",
  type: "normal",
  category: "status",
  camera: {
    type: "self",
    zoom: 1.30,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showBehindEffect && !frame.showEffect) return;
    drawRecycleBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawRecycleEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      cameraZoom: 1.30,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
    };

    const frames: BattleFrame[] = [];

    // [리사이클: 바깥 흰색 2화살표 원 + 내부 색상변화 2화살표 원 회전] (20프레임, 42ms)
    const frameCount = 20;
    for (let i = 0; i < frameCount; i++) {
      const prog = i / (frameCount - 1);

      frames.push({
        ...baseFrame,
        delay: 42,
        moveStep: 1,
        effectProgress: prog,
        phaseId: `recycle-circle-${i + 1}`,
        phaseName: `#1. 리사이클 이중 화살표 원 회전 (${i + 1}/${frameCount})`,
        showEffect: true,
        showBehindEffect: false,
      });
    }

    return frames;
  },
};
