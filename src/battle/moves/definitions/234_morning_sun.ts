// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawMorningSunBehindEffect,
  drawMorningSunEffect,
} from "../../../renderers/moves/gen1/move233_236.js";

/**
 * 234: 아침햇살 (Morning Sun / あさのひざし) - 노말 타입 변화 기술
 *
 * 위력: — / 명중: — / PP: 5 / 대상: 자신 / 접촉: X
 * 설명: 자신의 HP를 회복한다. 맑은 날씨에는 2/3, 비/모래/눈 날씨에는 1/4, 기본 1/2을 회복한다.
 *
 * [유저 연출 요구사항 100% 반영]:
 * 1. 시전 포켓몬 포커싱 (camera: type: "self", zoom: 1.25)
 * 2. 화면 전체에 흰 색깔 필터 25% (White screen filter 25%)
 * 3. 빛줄기 여러 갈래:
 *    - 왼쪽 상단(Top-Left)에서 시작
 *    - 왼쪽 상단에 가까운 부분은 흰 색깔 50%
 *    - 바깥쪽, 우측 아래(Bottom-Right)로 내려올수록 투명해지게 그라데이션
 */
export const morningSunMove: BattleMoveAnimation = {
  num: 234,
  key: "morning-sun",
  nameKo: "아침햇살",
  nameEn: "Morning Sun",
  type: "normal",
  category: "status",
  camera: {
    type: "self",
    zoom: 1.25,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawMorningSunBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawMorningSunEffect(targetCtx, frame, drawCtx);
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
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
    };

    const cOff = (x = 0, y = 0) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x, y } : { x: 0, y: 0 },
    });

    const frames: BattleFrame[] = [];
    const totalFrames = 11;

    for (let i = 0; i < totalFrames; i++) {
      const prog = i / (totalFrames - 1);
      const bobY = -Math.sin(prog * Math.PI) * 4;
      const pulse = 1.0 + Math.sin(prog * Math.PI) * 0.035;

      let moveStep = 2;
      let phaseId = `morning-sun-beam-${i + 1}`;
      let phaseName = "#2. 아침햇살 - 25% 흰색 필터 및 좌상단 5갈래 굵은 광선 조사";

      if (i < 3) {
        moveStep = 1;
        phaseId = `morning-sun-focus-${i + 1}`;
        phaseName = "#1. 아침햇살 - 시전자 포커싱 및 햇살 강림";
      } else if (i >= 8) {
        moveStep = 3;
        phaseId = `morning-sun-absorb-${i + 1}`;
        phaseName = "#3. 아침햇살 - 온화한 햇빛 흡수 및 회복 안정화";
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
