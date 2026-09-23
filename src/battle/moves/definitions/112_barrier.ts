// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawBarrierEffect } from "../../../renderers/moves/gen1/move109_112.js";

/**
 * 112: 배리어 (Barrier) - 에스퍼 타입 변화 기술 (자신의 방어 2랭크 대폭 상승)
 *
 * 연출 구성 (유저 맞춤 기획):
 * #1. 스프라이트 위쪽에서 단색 순백 십자별 번쩍임
 * #2. 십자별 위치에서 가로로 넓어지는 선 형성 (좌우 동시 확장)
 * #3. 가로선 양 끝에서 아래로 수직 하강하는 세로선 형성 (양쪽 동시)
 * #4. 양 하단에서 안쪽(중앙)으로 가로선이 뻗어오며 완벽한 사각형 형성 & 결합 번쩍
 * #5. 사각형 중간에 반투명 색상 채움 + 사선 반사 하이라이트 번쩍 (단단해지기 참고)
 * #6~13. 반투명 배경색 전환 (보라빛 2프레임 ➔ 다시 푸른빛 2프레임) & 왼쪽 꼭짓점부터 시계방향 순회 반짝임 (2프레임씩)
 * #14~15. 배리어 페이드아웃 및 시전자 복귀 완료
 */
export const barrierMove: BattleMoveAnimation = {
  num: 112,
  key: "barrier",
  nameKo: "배리어",
  nameEn: "Barrier",
  type: "psychic",
  category: "status",
  camera: { type: "self", zoom: 1.35 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawBarrierEffect(targetCtx, attackerPos, targetPos, step, prog);
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
    };

    return [
      // #1. 스프라이트 위쪽에서 단색 순백 십자별 번쩍임
      {
        ...baseFrame,
        delay: 95,
        pOffset: isP ? { x: 2, y: 1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -2, y: -1 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.02, y: 0.98 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 1.02, y: 0.98 } : { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.50,
        phaseId: "barrier-star",
        phaseName: "#1. 상단 십자별 번쩍임",
      },
      // #2. 십자별 위치에서 가로로 넓어지는 선 형성 (가로로 길어짐)
      {
        ...baseFrame,
        delay: 110,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.85,
        phaseId: "barrier-horiz-line",
        phaseName: "#2. 가로선 좌우 확장",
      },
      // #3. 가로선 양 끝에서 아래로 수직 하강하는 세로선 (양쪽 동시)
      {
        ...baseFrame,
        delay: 110,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.85,
        phaseId: "barrier-vert-descent",
        phaseName: "#3. 좌우 세로선 하강",
      },
      // #4. 양 하단에서 안쪽으로 길어지면서 사각형 결합 완성
      {
        ...baseFrame,
        delay: 120,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.95,
        phaseId: "barrier-close-rect",
        phaseName: "#4. 하단선 수렴 & 사각형 완성",
      },
      // #5. 사각형 중간에 반투명 색상 + 반사 하이라이트 번쩍 (단단해지기 참고)
      {
        ...baseFrame,
        delay: 130,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: isP ? { x: 0.98, y: 1.02 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 0.98, y: 1.02 } : { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 5,
        effectProgress: 0.50,
        phaseId: "barrier-reflect-glint",
        phaseName: "#5. 반투명 채움 & 반사 하이라이트 번쩍",
      },
      // #6. [보라빛 배경 1/2] 좌상단 꼭짓점 발현 (왼쪽 꼭짓점부터 시작)
      {
        ...baseFrame,
        delay: 85,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 6,
        effectProgress: 0.08,
        phaseId: "barrier-corner-tl-1",
        phaseName: "#6. 보라빛 배경 & 좌상단 반짝 (1/2)",
      },
      // #7. [보라빛 배경 2/2] 좌상단 꼭짓점 피크 번쩍
      {
        ...baseFrame,
        delay: 85,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 6,
        effectProgress: 0.18,
        phaseId: "barrier-corner-tl-2",
        phaseName: "#7. 보라빛 배경 & 좌상단 반짝 (2/2)",
      },
      // #8. [다시 푸른빛 배경 1/2] 우상단 꼭짓점 발현
      {
        ...baseFrame,
        delay: 85,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 6,
        effectProgress: 0.33,
        phaseId: "barrier-corner-tr-1",
        phaseName: "#8. 푸른빛 배경 & 우상단 반짝 (1/2)",
      },
      // #9. [다시 푸른빛 배경 2/2] 우상단 꼭짓점 피크 번쩍
      {
        ...baseFrame,
        delay: 85,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 6,
        effectProgress: 0.43,
        phaseId: "barrier-corner-tr-2",
        phaseName: "#9. 푸른빛 배경 & 우상단 반짝 (2/2)",
      },
      // #10. [다시 보라빛 배경 1/2] 우하단 꼭짓점 발현
      {
        ...baseFrame,
        delay: 85,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 6,
        effectProgress: 0.58,
        phaseId: "barrier-corner-br-1",
        phaseName: "#10. 보라빛 배경 & 우하단 반짝 (1/2)",
      },
      // #11. [다시 보라빛 배경 2/2] 우하단 꼭짓점 피크 번쩍
      {
        ...baseFrame,
        delay: 85,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 6,
        effectProgress: 0.68,
        phaseId: "barrier-corner-br-2",
        phaseName: "#11. 보라빛 배경 & 우하단 반짝 (2/2)",
      },
      // #12. [다시 푸른빛 배경 1/2] 좌하단 꼭짓점 발현
      {
        ...baseFrame,
        delay: 85,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 6,
        effectProgress: 0.83,
        phaseId: "barrier-corner-bl-1",
        phaseName: "#12. 푸른빛 배경 & 좌하단 반짝 (1/2)",
      },
      // #13. [다시 푸른빛 배경 2/2] 좌하단 꼭짓점 피크 번쩍
      {
        ...baseFrame,
        delay: 85,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 6,
        effectProgress: 0.93,
        phaseId: "barrier-corner-bl-2",
        phaseName: "#13. 푸른빛 배경 & 좌하단 반짝 (2/2)",
      },
      // #14. 배리어 페이드아웃
      {
        ...baseFrame,
        delay: 110,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 7,
        effectProgress: 0.70,
        phaseId: "barrier-fade",
        phaseName: "#14. 배리어 페이드아웃",
      },
      // #15. 시전자 복귀 완료
      {
        ...baseFrame,
        delay: 90,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: false,
        hitFlash: false,
        moveStep: 7,
        effectProgress: 1.0,
        phaseId: "barrier-complete",
        phaseName: "#15. 복귀 완료",
      },
    ];
  },
};
