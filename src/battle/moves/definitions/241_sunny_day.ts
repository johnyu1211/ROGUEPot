// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawSunnyDayBehindEffect,
  drawSunnyDayEffect,
} from "../../../renderers/moves/gen1/move241_244.js";

/**
 * 241: 쾌청 (Sunny Day / にほんばれ) - 불꽃 타입 변화 기술 (날씨)
 *
 * 위력: — / 명중: — / PP: 5 / 5턴간 맑음 날씨 조성
 * 설명: 5턴 동안 햇살을 강하게 해서 불꽃타입 기술의 위력을 올린다. (물 0.5배, 불꽃 1.5배)
 *
 * [아침햇살 참고 연출 - 노란 햇빛 색]:
 * 1. 화면 전체 노란 햇빛 색깔 필터 25% (Yellow Sunlight Screen Filter)
 * 2. 빛줄기 여러 갈래:
 *    - 왼쪽 상단(Top-Left)에서 시작
 *    - 왼쪽 상단에 가까운 부분은 노란 햇빛 색 50%
 *    - 바깥쪽, 우측 아래(Bottom-Right)로 내려올수록 투명해지게 (그라데이션 소산)
 * 3. 왼쪽 상단 발원지 온화한 노란 햇빛 방사 코로나
 */
export const sunnyDayMove: BattleMoveAnimation = {
  num: 241,
  key: "sunny-day",
  nameKo: "쾌청",
  nameEn: "Sunny Day",
  type: "fire",
  category: "status",
  camera: {
    type: "none",
    zoom: 1.0,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawSunnyDayBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawSunnyDayEffect(targetCtx, frame, drawCtx);
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
      eOffset: !isP ? { x, y } : { x: 0, y: 0 },
    });

    const frames: BattleFrame[] = [];
    const totalFrames = 12;

    for (let i = 0; i < totalFrames; i++) {
      const prog = i / (totalFrames - 1);
      const bobY = -Math.sin(prog * Math.PI) * 4;
      const pulse = 1.0 + Math.sin(prog * Math.PI) * 0.035;

      let moveStep = 2;
      let phaseId = `sunny-day-beam-${i + 1}`;
      let phaseName = "#2. 쾌청 - 25% 노란 햇빛 필터 및 좌상단 5갈래 햇살 광선 조사";

      if (i < 3) {
        moveStep = 1;
        phaseId = `sunny-day-start-${i + 1}`;
        phaseName = "#1. 쾌청 - 맑은 하늘 조성 및 햇살 강림";
      } else if (i >= totalFrames - 3) {
        moveStep = 3;
        phaseId = `sunny-day-settle-${i + 1}`;
        phaseName = "#3. 쾌청 - 온화한 노란 햇빛 확산 및 맑음 날씨 정착";
      }

      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(0, bobY),
        pScale: isP ? { x: pulse, y: pulse } : undefined,
        eScale: !isP ? { x: pulse, y: pulse } : undefined,
        moveStep,
        phaseId,
        phaseName,
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    return frames;
  },
};
