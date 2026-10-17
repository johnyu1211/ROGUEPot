// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawMagicCoatBehindEffect,
  drawMagicCoatEffect,
} from "../../../renderers/moves/gen1/move277_280.js";

/**
 * 🪞 277: 매직코트 (Magic Coat / マジックコート) - 에스퍼 타입 변화 기술
 *
 * 위력: — / 명중: — / PP: 15 / 우선도: +4 / 대상: 자신 / 접촉: X
 * 설명: 상대가 상태 이상이 되는 기술이나 씨뿌리기 등을 썼을 때 되받아친다.
 */
export const magicCoatMove: BattleMoveAnimation = {
  num: 277,
  key: "magic-coat",
  nameKo: "매직코트",
  nameEn: "Magic Coat",
  type: "psychic",
  category: "status",
  camera: {
    type: "self",
    zoom: 1.35,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showBehindEffect && !frame.showEffect) return;
    drawMagicCoatBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawMagicCoatEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      cameraZoom: 1.35,
      cameraTrackAttacker: true,
      isAttackerPlayer: isP,
      pRot: 0,
      eRot: 0,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
      pScale: { x: 1.0, y: 1.0 },
      eScale: { x: 1.0, y: 1.0 },
    };

    const frames: BattleFrame[] = [
      // #1. 스프라이트 위쪽에서 단색 순백 십자별 번쩍임
      {
        ...baseFrame,
        delay: 90,
        pOffset: isP ? { x: 2, y: 1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -2, y: -1 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.02, y: 0.98 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 1.02, y: 0.98 } : { x: 1.0, y: 1.0 },
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.50,
        phaseId: "magic-coat-star",
        phaseName: "#1. 상단 십자별 번쩍임",
      },
      // #2~3. 십자별 위치에서 가로로 넓어지는 선 형성 (좌우 동시 확장)
      {
        ...baseFrame,
        delay: 55,
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.45,
        phaseId: "magic-coat-horiz-1",
        phaseName: "#2. 가로선 좌우 확장 (1/2)",
      },
      {
        ...baseFrame,
        delay: 55,
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.90,
        phaseId: "magic-coat-horiz-2",
        phaseName: "#3. 가로선 좌우 확장 (2/2)",
      },
      // #4~5. 가로선 양 끝에서 아래로 수직 하강하는 세로선 (양쪽 동시)
      {
        ...baseFrame,
        delay: 55,
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.45,
        phaseId: "magic-coat-vert-1",
        phaseName: "#4. 좌우 세로선 하강 (1/2)",
      },
      {
        ...baseFrame,
        delay: 55,
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.90,
        phaseId: "magic-coat-vert-2",
        phaseName: "#5. 좌우 세로선 하강 (2/2)",
      },
      // #6~7. 양 하단에서 안쪽으로 길어지면서 사각형 결합 완성
      {
        ...baseFrame,
        delay: 60,
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.50,
        phaseId: "magic-coat-close-1",
        phaseName: "#6. 하단선 수렴 (1/2)",
      },
      {
        ...baseFrame,
        delay: 60,
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.95,
        phaseId: "magic-coat-close-2",
        phaseName: "#7. 하단선 결합 & 사각형 완성 (2/2)",
      },
      // #8~9. 사각형 중간에 흰색 반투명 채움 + 사선 반사 하이라이트 번쩍
      {
        ...baseFrame,
        delay: 65,
        pScale: isP ? { x: 0.98, y: 1.02 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 0.98, y: 1.02 } : { x: 1.0, y: 1.0 },
        showEffect: true,
        moveStep: 5,
        effectProgress: 0.35,
        phaseId: "magic-coat-white-fill-1",
        phaseName: "#8. 흰색 배리어 채움 & 반사 스위프 (1/2)",
      },
      {
        ...baseFrame,
        delay: 65,
        showEffect: true,
        moveStep: 5,
        effectProgress: 0.75,
        phaseId: "magic-coat-white-fill-2",
        phaseName: "#9. 흰색 배리어 완성 (2/2)",
      },
    ];

    // #10~21. 흰색 배리어 완성 후: 별로 된 동그라미가 그려지면서 끝부분부터 순차 소멸 (12프레임)
    const circleFrameCount = 12;
    for (let i = 0; i < circleFrameCount; i++) {
      const prog = (i + 0.5) / circleFrameCount;
      frames.push({
        ...baseFrame,
        delay: 60,
        showEffect: true,
        moveStep: 6,
        effectProgress: prog,
        phaseId: `magic-coat-star-circle-${i + 1}`,
        phaseName: `#${10 + i}. 별로 된 동그라미 회전 및 끝부분 소멸 (${i + 1}/${circleFrameCount})`,
      });
    }

    // #22~23. 흰색 배리어 페이드아웃 및 복귀 완료
    frames.push({
      ...baseFrame,
      delay: 90,
      showEffect: true,
      moveStep: 7,
      effectProgress: 0.65,
      phaseId: "magic-coat-fade",
      phaseName: "#22. 흰색 배리어 페이드아웃",
    });

    frames.push({
      ...baseFrame,
      delay: 80,
      showEffect: false,
      moveStep: 7,
      effectProgress: 1.0,
      phaseId: "magic-coat-complete",
      phaseName: "#23. 복귀 완료",
    });

    return frames;
  },
};
