// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawProtectEffect } from "../../../renderers/moves/gen1/move181_184.js";

/**
 * 182: 방어 (Protect) - 노말 타입 변화 기술 (자신을 상대의 공격으로부터 완전히 보호)
 *
 * 연출 구성 (유저 지시 고증):
 * - 사각형 형태의 보호막이 우에서 좌로 뻗어나옴
 * - 내부는 단단한 박스가 아니라 부드러운 블러 빛(초록, 파랑, 청록, 순백)으로 구성
 * #1. 시전자 기동 & 우측 선단 점화
 * #2. 사각형 보호막 우에서 좌로 전개 (1단계)
 * #3. 사각형 보호막 우에서 좌로 전개 (2단계)
 * #4. 사각형 보호막 완전 전개 및 결합
 * #5. 보호막 활성화 유지 & 은은한 쉬머 펄스
 * #6. 보호막 유지 및 안정화
 * #7. 보호막 부드러운 페이드아웃 해제 & 시전자 복귀 완료
 */
export const protectMove: BattleMoveAnimation = {
  num: 182,
  key: "protect",
  nameKo: "방어",
  nameEn: "Protect",
  type: "normal",
  category: "status",
  camera: { type: "self", zoom: 1.35 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawProtectEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.35,
      cameraTrackAttacker: true,
      isAttackerPlayer: isP,
      pRot: 0,
      eRot: 0,
      hitFlash: false,
    };

    // 시전자 전용 오프셋 헬퍼 (수비자는 완벽히 {0,0} 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    return [
      // #1. 시전자 기동 & 우측 선단 점화 (1열)
      {
        ...baseFrame,
        delay: 95,
        ...cOff(-2, 1),
        pScale: isP ? { x: 1.04, y: 0.96 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 1.04, y: 0.96 } : { x: 1.0, y: 1.0 },
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.18,
        phaseId: "protect-spark",
        phaseName: "#1. 우측 선단 점화 (1열)",
      },
      // #2. 사각형 보호막 우에서 좌로 전개 1단계 (2열)
      {
        ...baseFrame,
        delay: 95,
        ...cOff(-3, 2),
        pScale: isP ? { x: 1.06, y: 0.94 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 1.06, y: 0.94 } : { x: 1.0, y: 1.0 },
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.38,
        phaseId: "protect-unfold-1",
        phaseName: "#2. 우에서 좌로 전개 1단계 (2열)",
      },
      // #3. 사각형 보호막 우에서 좌로 전개 2단계 (3~4열)
      {
        ...baseFrame,
        delay: 95,
        ...cOff(-3, 2),
        pScale: isP ? { x: 1.05, y: 0.95 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 1.05, y: 0.95 } : { x: 1.0, y: 1.0 },
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.68,
        phaseId: "protect-unfold-2",
        phaseName: "#3. 우에서 좌로 전개 2단계 (3~4열)",
      },
      // #4. 사각형 보호막 우에서 좌로 전개 3단계 (5~6열)
      {
        ...baseFrame,
        delay: 100,
        ...cOff(-2, 1),
        pScale: isP ? { x: 1.03, y: 0.97 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 1.03, y: 0.97 } : { x: 1.0, y: 1.0 },
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.98,
        phaseId: "protect-unfold-3",
        phaseName: "#4. 우에서 좌로 전개 3단계 (5~6열)",
      },
      // #5. 사각형 보호막 완전 전개 및 결합
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, 0),
        pScale: isP ? { x: 1.0, y: 1.0 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 1.0, y: 1.0 } : { x: 1.0, y: 1.0 },
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.20,
        phaseId: "protect-complete",
        phaseName: "#5. 사각형 보호막 결합 완성",
      },
      // #6. 보호막 활성화 유지 & 은은한 쉬머 펄스
      {
        ...baseFrame,
        delay: 125,
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 5,
        effectProgress: 0.50,
        phaseId: "protect-active-1",
        phaseName: "#6. 보호막 활성화 유지 1",
      },
      // #7. 보호막 유지 및 안정화
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 5,
        effectProgress: 0.85,
        phaseId: "protect-active-2",
        phaseName: "#7. 보호막 활성화 유지 2",
      },
      // #8. 보호막 부드러운 페이드아웃 해제 & 복귀 완료
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: true,
        moveStep: 6,
        effectProgress: 0.80,
        phaseId: "protect-dissolve",
        phaseName: "#8. 보호막 해제 & 복귀 완료",
      },
    ];
  },
};
