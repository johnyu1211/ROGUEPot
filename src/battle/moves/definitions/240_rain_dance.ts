// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawRainDanceBehindEffect,
  drawRainDanceEffect,
} from "../../../renderers/moves/gen1/move237_240.js";

/**
 * 240: 비바라기 (Rain Dance / あまごい) - 물 타입 변화 기술 (날씨)
 *
 * 위력: — / 명중: — / PP: 5 / 5턴간 비 날씨 조성
 * 설명: 5턴 동안 비를 내리게 하여 물타입 기술의 위력을 올린다. (불꽃 0.5배, 물 1.5배)
 */
export const rainDanceMove: BattleMoveAnimation = {
  num: 240,
  key: "rain-dance",
  nameKo: "비바라기",
  nameEn: "Rain Dance",
  type: "water",
  category: "status",
  camera: {
    type: "none",
    zoom: 1.0,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawRainDanceBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawRainDanceEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      cameraZoom: 1.0,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
    };

    const cOff = (x = 0, y = 0) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y } : { x: 0, y: 0 },
    });

    const frames: BattleFrame[] = [];

    // [Step 1: 시전자 기원 점프] (4프레임, 50ms)
    for (let i = 0; i < 4; i++) {
      const prog = i / 3;
      const bobY = i % 2 === 0 ? -3 : 1;
      frames.push({
        ...baseFrame,
        delay: 50,
        ...cOff(0, bobY),
        moveStep: 1,
        phaseId: `rain-dance-gather-${i + 1}`,
        phaseName: "#1. 시전자 기원 점프",
        effectProgress: prog,
        showEffect: false,
        showBehindEffect: false,
      });
    }

    // [Step 2: 빗방울 시작 ➔ 사선 빗줄기 확산] (8프레임, 50ms)
    for (let i = 0; i < 8; i++) {
      const prog = i / 7;
      frames.push({
        ...baseFrame,
        delay: 50,
        ...cOff(0, 0),
        moveStep: 2,
        phaseId: `rain-dance-fall-${i + 1}`,
        phaseName: "#2. 빗방울 시작 ➔ 사선 빗줄기 확산",
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // [Step 3: 지면 물결 링 & 튀어오르는 빗방울 물보라] (7프레임, 50ms)
    for (let i = 0; i < 7; i++) {
      const prog = i / 6;
      frames.push({
        ...baseFrame,
        delay: 50,
        ...cOff(0, 0),
        moveStep: 3,
        phaseId: `rain-dance-ripple-${i + 1}`,
        phaseName: "#3. 지면 물결 리플 & 빗방울 물보라",
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // [Step 4: 필드 정착 및 복귀] (2프레임, 45ms)
    for (let i = 0; i < 2; i++) {
      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        moveStep: 4,
        phaseId: `rain-dance-settle-${i + 1}`,
        phaseName: "#4. 비 날씨 정착 및 원위치",
        effectProgress: 1.0,
        showEffect: false,
        showBehindEffect: true,
      });
    }

    return frames;
  },
};
