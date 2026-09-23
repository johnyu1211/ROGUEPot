// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawMinimizeEffect, drawMinimizeBehindEffect } from "../../../renderers/moves/gen1/move105_108.js";

/**
 * 107: 작아지기 (Minimize) - 노말 타입 변화기 (자신의 회피율 2랭크 상승)
 *
 * 연출 구성:
 * - 유저 요청: "작아질 때 투명한 잔상 (5개의 투명한) 남기면서 작아지기"
 * - 번잡한 외부 이펙트(연기 링, 별, 바람선 등) 완전 배제.
 * - 시전자 포켓몬이 제자리에서 2회 연속 축소 ➔ 원상 복귀하며,
 *   작아질 때 뒤편에 단계별 5개의 투명한 잔상(Afterimages)을 남김.
 */

// 최소화 상태 시 뒤편에 남겨지는 5개의 투명한 단계별 잔상 정의 (100% ~ 44%)
const FIVE_MINIMIZE_AFTERIMAGES = [
  { scale: 1.00, alpha: 0.12 }, // 1. 원본 100% 최외곽 투명 잔상
  { scale: 0.85, alpha: 0.18 }, // 2. 85% 크기 투명 잔상
  { scale: 0.70, alpha: 0.25 }, // 3. 70% 크기 투명 잔상
  { scale: 0.56, alpha: 0.34 }, // 4. 56% 크기 투명 잔상
  { scale: 0.44, alpha: 0.45 }, // 5. 44% 본체 직전 투명 잔상
];

export const minimizeMove: BattleMoveAnimation = {
  num: 107,
  key: "minimize",
  nameKo: "작아지기",
  nameEn: "Minimize",
  type: "normal",
  category: "status",
  camera: { type: "self", zoom: 1.25 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawMinimizeBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawMinimizeEffect(targetCtx, frame, drawCtx);
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
      showEffect: false,
      hitFlash: false,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
    };

    // 시전자 전용 스케일 헬퍼 (수비자는 항상 1.0 고정)
    const cScale = (s: number) => ({
      pScale: isP ? { x: s, y: s } : undefined,
      eScale: !isP ? { x: s, y: s } : undefined,
    });

    return [
      // ==========================================
      // 1차 축소 사이클 (투명 잔상 5개 ➔ 순차 축소 흡수)
      // ==========================================
      // 1. 1차 축소 준비 (원본 100%)
      {
        ...baseFrame,
        delay: 70,
        ...cScale(1.00),
        moveStep: 1,
        effectProgress: 0.0,
        afterimages: [],
        phaseId: "minimize-c1-ready",
        phaseName: "1. 1차 축소 준비",
      },
      // 2. 1차 축소 시작 (72%) - 초기 잔상 발생
      {
        ...baseFrame,
        delay: 50,
        ...cScale(0.72),
        moveStep: 1,
        effectProgress: 0.35,
        afterimages: [
          { scale: 1.00, alpha: 0.28 },
          { scale: 0.86, alpha: 0.40 },
        ],
        phaseId: "minimize-c1-shrink-1",
        phaseName: "2. 1차 축소 시작 (72% & 잔상 생성)",
      },
      // 3. 1차 축소 심화 (50%) - 누적 잔상 전개
      {
        ...baseFrame,
        delay: 50,
        ...cScale(0.50),
        moveStep: 1,
        effectProgress: 0.70,
        afterimages: [
          { scale: 1.00, alpha: 0.18 },
          { scale: 0.85, alpha: 0.26 },
          { scale: 0.70, alpha: 0.36 },
          { scale: 0.60, alpha: 0.46 },
        ],
        phaseId: "minimize-c1-shrink-2",
        phaseName: "3. 1차 축소 심화 (50% & 4단 잔상)",
      },
      // 4. 1차 최소화 도달 (35%) - 5개 투명 잔상 만개
      {
        ...baseFrame,
        delay: 65,
        ...cScale(0.35),
        moveStep: 2,
        effectProgress: 1.0,
        afterimages: FIVE_MINIMIZE_AFTERIMAGES,
        phaseId: "minimize-c1-tiny-5ghosts",
        phaseName: "4. 1차 최소화 (35% & 5개 잔상 만개)",
      },
      // 5. 1차 잔상 순차 축소 1단계 (1.00 ➔ 0.88 수축)
      {
        ...baseFrame,
        delay: 45,
        ...cScale(0.35),
        moveStep: 2,
        effectProgress: 0.80,
        afterimages: [
          { scale: 0.88, alpha: 0.16 },
          { scale: 0.85, alpha: 0.18 },
          { scale: 0.70, alpha: 0.25 },
          { scale: 0.56, alpha: 0.34 },
          { scale: 0.44, alpha: 0.45 },
        ],
        phaseId: "minimize-c1-ghost-shrink-1",
        phaseName: "5. 1차 잔상 순차 축소 (1.00 ➔ 0.88)",
      },
      // 6. 1차 잔상 순차 축소 2단계 (0.85 ➔ 0.74 수축)
      {
        ...baseFrame,
        delay: 45,
        ...cScale(0.35),
        moveStep: 2,
        effectProgress: 0.65,
        afterimages: [
          { scale: 0.74, alpha: 0.22 },
          { scale: 0.70, alpha: 0.25 },
          { scale: 0.56, alpha: 0.34 },
          { scale: 0.44, alpha: 0.45 },
        ],
        phaseId: "minimize-c1-ghost-shrink-2",
        phaseName: "6. 1차 잔상 순차 축소 (0.85 ➔ 0.74)",
      },
      // 7. 1차 잔상 순차 축소 3단계 (0.70 ➔ 0.60 수축)
      {
        ...baseFrame,
        delay: 45,
        ...cScale(0.35),
        moveStep: 2,
        effectProgress: 0.50,
        afterimages: [
          { scale: 0.60, alpha: 0.28 },
          { scale: 0.56, alpha: 0.34 },
          { scale: 0.44, alpha: 0.45 },
        ],
        phaseId: "minimize-c1-ghost-shrink-3",
        phaseName: "7. 1차 잔상 순차 축소 (0.70 ➔ 0.60)",
      },
      // 8. 1차 잔상 순차 축소 4단계 (0.56 ➔ 0.48 수축)
      {
        ...baseFrame,
        delay: 45,
        ...cScale(0.35),
        moveStep: 2,
        effectProgress: 0.35,
        afterimages: [
          { scale: 0.48, alpha: 0.38 },
          { scale: 0.44, alpha: 0.45 },
        ],
        phaseId: "minimize-c1-ghost-shrink-4",
        phaseName: "8. 1차 잔상 순차 축소 (0.56 ➔ 0.48)",
      },
      // 9. 1차 잔상 순차 축소 5단계 (0.44 ➔ 0.38 최종 수축)
      {
        ...baseFrame,
        delay: 45,
        ...cScale(0.35),
        moveStep: 2,
        effectProgress: 0.20,
        afterimages: [
          { scale: 0.38, alpha: 0.42 },
        ],
        phaseId: "minimize-c1-ghost-shrink-5",
        phaseName: "9. 1차 잔상 순차 축소 (0.44 ➔ 0.38)",
      },
      // 10. 1차 잔상 완전 흡수 & 초소형 본체 단독 유지
      {
        ...baseFrame,
        delay: 60,
        ...cScale(0.35),
        moveStep: 2,
        effectProgress: 0.0,
        afterimages: [],
        phaseId: "minimize-c1-solo-tiny",
        phaseName: "10. 1차 잔상 완전 흡수 & 초소형 본체",
      },
      // 11. 1차 원상복귀 완료 (100% 정상 크기 복귀)
      {
        ...baseFrame,
        delay: 75,
        ...cScale(1.00),
        moveStep: 2,
        effectProgress: 1.0,
        afterimages: [],
        phaseId: "minimize-c1-restored",
        phaseName: "11. 1차 복귀 완료 (100%)",
      },

      // ==========================================
      // 2차 축소 사이클 (투명 잔상 5개 ➔ 순차 축소 흡수)
      // ==========================================
      // 12. 2차 축소 시작 (72%) - 초기 잔상 발생
      {
        ...baseFrame,
        delay: 50,
        ...cScale(0.72),
        moveStep: 3,
        effectProgress: 0.35,
        afterimages: [
          { scale: 1.00, alpha: 0.28 },
          { scale: 0.86, alpha: 0.40 },
        ],
        phaseId: "minimize-c2-shrink-1",
        phaseName: "12. 2차 축소 시작 (72% & 잔상 생성)",
      },
      // 13. 2차 축소 심화 (50%) - 누적 잔상 전개
      {
        ...baseFrame,
        delay: 50,
        ...cScale(0.50),
        moveStep: 3,
        effectProgress: 0.70,
        afterimages: [
          { scale: 1.00, alpha: 0.18 },
          { scale: 0.85, alpha: 0.26 },
          { scale: 0.70, alpha: 0.36 },
          { scale: 0.60, alpha: 0.46 },
        ],
        phaseId: "minimize-c2-shrink-2",
        phaseName: "13. 2차 축소 심화 (50% & 4단 잔상)",
      },
      // 14. 2차 최소화 도달 (35%) - 5개 투명 잔상 만개
      {
        ...baseFrame,
        delay: 65,
        ...cScale(0.35),
        moveStep: 3,
        effectProgress: 1.0,
        afterimages: FIVE_MINIMIZE_AFTERIMAGES,
        phaseId: "minimize-c2-tiny-5ghosts",
        phaseName: "14. 2차 최소화 (35% & 5개 잔상 만개)",
      },
      // 15. 2차 잔상 순차 축소 1단계 (1.00 ➔ 0.88 수축)
      {
        ...baseFrame,
        delay: 45,
        ...cScale(0.35),
        moveStep: 3,
        effectProgress: 0.80,
        afterimages: [
          { scale: 0.88, alpha: 0.16 },
          { scale: 0.85, alpha: 0.18 },
          { scale: 0.70, alpha: 0.25 },
          { scale: 0.56, alpha: 0.34 },
          { scale: 0.44, alpha: 0.45 },
        ],
        phaseId: "minimize-c2-ghost-shrink-1",
        phaseName: "15. 2차 잔상 순차 축소 (1.00 ➔ 0.88)",
      },
      // 16. 2차 잔상 순차 축소 2단계 (0.85 ➔ 0.74 수축)
      {
        ...baseFrame,
        delay: 45,
        ...cScale(0.35),
        moveStep: 3,
        effectProgress: 0.65,
        afterimages: [
          { scale: 0.74, alpha: 0.22 },
          { scale: 0.70, alpha: 0.25 },
          { scale: 0.56, alpha: 0.34 },
          { scale: 0.44, alpha: 0.45 },
        ],
        phaseId: "minimize-c2-ghost-shrink-2",
        phaseName: "16. 2차 잔상 순차 축소 (0.85 ➔ 0.74)",
      },
      // 17. 2차 잔상 순차 축소 3단계 (0.70 ➔ 0.60 수축)
      {
        ...baseFrame,
        delay: 45,
        ...cScale(0.35),
        moveStep: 3,
        effectProgress: 0.50,
        afterimages: [
          { scale: 0.60, alpha: 0.28 },
          { scale: 0.56, alpha: 0.34 },
          { scale: 0.44, alpha: 0.45 },
        ],
        phaseId: "minimize-c2-ghost-shrink-3",
        phaseName: "17. 2차 잔상 순차 축소 (0.70 ➔ 0.60)",
      },
      // 18. 2차 잔상 순차 축소 4단계 (0.56 ➔ 0.48 수축)
      {
        ...baseFrame,
        delay: 45,
        ...cScale(0.35),
        moveStep: 3,
        effectProgress: 0.35,
        afterimages: [
          { scale: 0.48, alpha: 0.38 },
          { scale: 0.44, alpha: 0.45 },
        ],
        phaseId: "minimize-c2-ghost-shrink-4",
        phaseName: "18. 2차 잔상 순차 축소 (0.56 ➔ 0.48)",
      },
      // 19. 2차 잔상 순차 축소 5단계 (0.44 ➔ 0.38 최종 수축)
      {
        ...baseFrame,
        delay: 45,
        ...cScale(0.35),
        moveStep: 3,
        effectProgress: 0.20,
        afterimages: [
          { scale: 0.38, alpha: 0.42 },
        ],
        phaseId: "minimize-c2-ghost-shrink-5",
        phaseName: "19. 2차 잔상 순차 축소 (0.44 ➔ 0.38)",
      },
      // 20. 2차 잔상 완전 흡수 & 초소형 본체 단독 유지
      {
        ...baseFrame,
        delay: 70,
        ...cScale(0.35),
        moveStep: 4,
        effectProgress: 0.0,
        afterimages: [],
        phaseId: "minimize-c2-solo-tiny",
        phaseName: "20. 2차 잔상 완전 흡수 & 초소형 본체",
      },
      // 21. 최종 2차 복귀 및 완료
      {
        ...baseFrame,
        delay: 90,
        ...cScale(1.00),
        moveStep: 4,
        effectProgress: 1.0,
        afterimages: [],
        phaseId: "minimize-complete",
        phaseName: "21. 최종 복귀 및 완료",
      },
    ];
  },
};
