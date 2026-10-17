// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawCrossChopBehindEffect,
  drawCrossChopEffect,
} from "../../../renderers/moves/gen1/move237_240.js";

/**
 * 238: 크로스촙 (Cross Chop / クロスチョップ) - 격투 타입 물리 기술
 *
 * 위력: 100 / 명중: 80 / PP: 5 / 급소율 높음 (+1) / 접촉: O
 * 설명: 양손으로 당수를 상대에게 X자로 힘껏 교차시켜 공격한다. 급소에 맞기 쉽다.
 */
export const crossChopMove: BattleMoveAnimation = {
  num: 238,
  key: "cross-chop",
  nameKo: "크로스촙",
  nameEn: "Cross Chop",
  type: "fighting",
  category: "physical",
  camera: {
    type: "target",
    zoom: 1.25,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawCrossChopBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawCrossChopEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      cameraZoom: 1.25,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
    };

    const cOff = (x = 0, y = 0) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y } : { x: 0, y: 0 },
    });

    const tOff = (x = 0, y = 0) => ({
      pOffset: !isP ? { x: -x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x, y } : { x: 0, y: 0 },
    });

    const frames: BattleFrame[] = [];

    // [Step 1: 시전자 전방 도약 및 양손 수도 교차 준비] (4프레임, 45ms)
    const jumpOffsets = [
      { x: -4, y: 2 },
      { x: 12, y: -10 },
      { x: 26, y: -16 },
      { x: 38, y: -8 },
    ];
    for (let i = 0; i < jumpOffsets.length; i++) {
      const off = jumpOffsets[i];
      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(off.x, off.y),
        moveStep: 1,
        phaseId: `cross-chop-jump-${i + 1}`,
        phaseName: "#1. 시전자 전방 급속 도약",
        effectProgress: i / (jumpOffsets.length - 1),
        showEffect: false,
        showBehindEffect: true,
      });
    }

    // [Step 2: 대형 X자 교차 참격 (Twin Slashes)] (6프레임, 38ms)
    const slashSteps = 6;
    for (let i = 0; i < slashSteps; i++) {
      const prog = i / (slashSteps - 1);
      frames.push({
        ...baseFrame,
        delay: 38,
        ...cOff(42, -4),
        moveStep: 2,
        phaseId: `cross-chop-slash-${i + 1}`,
        phaseName: "#2. 양손 수도 대형 X자 교차 참격",
        effectProgress: prog,
        showEffect: isHit,
        showBehindEffect: false,
      });
    }

    // [Step 3: 교차점 중심 십자 폭발 & 방사형 스파크 타격] (7프레임, 50ms)
    const hitSteps = 7;
    for (let i = 0; i < hitSteps; i++) {
      const prog = i / (hitSteps - 1);
      const hitFlash = isHit && (i === 0 || i === 1);
      const knockX = isHit ? (i === 0 ? 10 : i === 1 ? -5 : i === 2 ? 3 : 0) : 0;
      const cReturnX = Math.round(30 * (1 - prog));

      frames.push({
        ...baseFrame,
        delay: 50,
        ...cOff(cReturnX, 0),
        ...tOff(knockX, 0),
        hitFlash,
        moveStep: 3,
        phaseId: `cross-chop-hit-${i + 1}`,
        phaseName: "#3. 교차점 중심 십자 대폭발 & 스파크",
        effectProgress: prog,
        hitProgress: prog,
        showEffect: isHit,
        showBehindEffect: false,
      });
    }

    // [Step 4: 착지 및 정위치] (2프레임, 45ms)
    for (let i = 0; i < 2; i++) {
      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        ...tOff(0, 0),
        moveStep: 4,
        phaseId: `cross-chop-settle-${i + 1}`,
        phaseName: "#4. 정위치 착지 복귀",
        effectProgress: 1.0,
        showEffect: false,
        showBehindEffect: false,
      });
    }

    return frames;
  },
};
