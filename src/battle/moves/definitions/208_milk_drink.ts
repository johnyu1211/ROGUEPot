// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawMilkDrinkEffect } from "../../../renderers/moves/gen1/move205_208.js";

/**
 * 208: 우유마시기 (Milk Drink) - 노말 타입 변화기 (최대 HP의 50% 회복)
 *
 * [유저 지정 연출 시퀀스]:
 * 1. [우유 마시기 & 모션]:
 *    - 시전 포켓몬이 납작해졌다가 길쭉해졌다가 2번 반복 (꿀꺽꿀꺽 모션)
 *    - 흰색 필터 (80% 불투명)가 물들고 위에서부터 흰색 필터가 사라지면서 아래로 내려감
 * 2. [회복 애니메이션 재생]:
 *    - 기술 '회복(Recover)'의 회복 연출 재생 (빛나는 회복 엠블럼 나선 상승 & 체표면 치유 광채)
 */
export const milkDrinkMove: BattleMoveAnimation = {
  num: 208,
  key: "milk-drink",
  nameKo: "우유마시기",
  nameEn: "Milk Drink",
  type: "normal",
  category: "status",
  camera: { type: "self", zoom: 1.25 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && frame.moveStep !== 1 && frame.moveStep !== 2) return;
    drawMilkDrinkEffect(targetCtx, frame, drawCtx);
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
      showEffect: true,
      hitFlash: false,
    };

    // 시전자 전용 오프셋 헬퍼 (수비자는 절대 {0,0} 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y } : { x: 0, y: 0 },
    });

    // 시전자 전용 스케일 헬퍼 (수비자는 undefined 고정)
    const cScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    return [
      // ----------------------------------------------------------------------
      // Step 1: 꿀꺽꿀꺽 2회 음용 모션 & 흰색 필터 80% 착색 후 위에서부터 아래로 하강 소산
      // ----------------------------------------------------------------------
      // [페이드 인 & 착색]: 흰색 필터 부드러운 페이드 인 (0% ➔ 28% ➔ 58% ➔ 80%)
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 1),
        ...cScale(1.06, 0.94),
        whiteFilterAlpha: 0.28,
        whiteFilterClipTopRatio: 0.00,
        moveStep: 1,
        effectProgress: 0.03,
        phaseId: "milk-drink-fadein-1",
        phaseName: "1. 1차 납작 시동 & 흰색 필터 페이드인 (28%)",
      },
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 2),
        ...cScale(1.16, 0.85),
        whiteFilterAlpha: 0.58,
        whiteFilterClipTopRatio: 0.00,
        moveStep: 1,
        effectProgress: 0.07,
        phaseId: "milk-drink-fadein-2",
        phaseName: "2. 1차 납작 진행 & 흰색 필터 페이드인 (58%)",
      },
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 3),
        ...cScale(1.28, 0.74),
        whiteFilterAlpha: 0.80,
        whiteFilterClipTopRatio: 0.00,
        moveStep: 1,
        effectProgress: 0.12,
        phaseId: "milk-drink-squash-1",
        phaseName: "3. 1차 납작 정점 & 우유빛 필터(80%) 완전 착색",
      },

      // ----------------------------------------------------------------------
      // [Cycle 1]: 1차 꿀꺽 (납작 ➔ 길쭉 반동) & 상반신 우유 매끄러운 하강 (0% ➔ 52%)
      // ----------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 3),
        ...cScale(1.28, 0.74),
        whiteFilterAlpha: 0.80,
        whiteFilterClipTopRatio: 0.08,
        moveStep: 1,
        effectProgress: 0.18,
        phaseId: "milk-drink-c1-1",
        phaseName: "4. 우유 삼킴 시동 & 머리 하강 (8%)",
      },
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 1),
        ...cScale(1.15, 0.86),
        whiteFilterAlpha: 0.80,
        whiteFilterClipTopRatio: 0.16,
        moveStep: 1,
        effectProgress: 0.24,
        phaseId: "milk-drink-c1-2",
        phaseName: "5. 목 부근 통과 (16%)",
      },
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, -2),
        ...cScale(0.95, 1.08),
        whiteFilterAlpha: 0.80,
        whiteFilterClipTopRatio: 0.25,
        moveStep: 1,
        effectProgress: 0.30,
        phaseId: "milk-drink-c1-3",
        phaseName: "6. 어깨 통과 & 길쭉 신장 시작 (25%)",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, -4),
        ...cScale(0.80, 1.25),
        whiteFilterAlpha: 0.80,
        whiteFilterClipTopRatio: 0.35,
        moveStep: 1,
        effectProgress: 0.37,
        phaseId: "milk-drink-c1-4",
        phaseName: "7. 1차 길쭉 정점 (꿀꺽 1) & 가슴 상단 (35%)",
      },
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, -2),
        ...cScale(0.90, 1.14),
        whiteFilterAlpha: 0.80,
        whiteFilterClipTopRatio: 0.44,
        moveStep: 1,
        effectProgress: 0.43,
        phaseId: "milk-drink-c1-5",
        phaseName: "8. 1차 길쭉 수축 & 명치 통과 (44%)",
      },
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...cScale(1.02, 0.98),
        whiteFilterAlpha: 0.80,
        whiteFilterClipTopRatio: 0.52,
        moveStep: 1,
        effectProgress: 0.50,
        phaseId: "milk-drink-c1-6",
        phaseName: "9. 1차 꿀꺽 완료 & 중앙 안착 (52%)",
      },

      // ----------------------------------------------------------------------
      // [Cycle 2]: 2차 꿀꺽 (2차 납작 ➔ 2차 길쭉) & 하반신 우유 매끄러운 하강 (52% ➔ 100%)
      // ----------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 1),
        ...cScale(1.14, 0.88),
        whiteFilterAlpha: 0.80,
        whiteFilterClipTopRatio: 0.60,
        moveStep: 1,
        effectProgress: 0.57,
        phaseId: "milk-drink-c2-1",
        phaseName: "10. 2차 납작 시동 & 상복부 통과 (60%)",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 3),
        ...cScale(1.24, 0.76),
        whiteFilterAlpha: 0.80,
        whiteFilterClipTopRatio: 0.69,
        moveStep: 1,
        effectProgress: 0.65,
        phaseId: "milk-drink-c2-2",
        phaseName: "11. 2차 납작 정점 & 배꼽 통과 (69%)",
      },
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 1),
        ...cScale(1.12, 0.90),
        whiteFilterAlpha: 0.80,
        whiteFilterClipTopRatio: 0.78,
        moveStep: 1,
        effectProgress: 0.72,
        phaseId: "milk-drink-c2-3",
        phaseName: "12. 2차 납작 복귀 & 하복부 통과 (78%)",
      },
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, -2),
        ...cScale(0.94, 1.08),
        whiteFilterAlpha: 0.80,
        whiteFilterClipTopRatio: 0.85,
        moveStep: 1,
        effectProgress: 0.79,
        phaseId: "milk-drink-c2-4",
        phaseName: "13. 2차 길쭉 시동 & 골반 통과 (85%)",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, -3),
        ...cScale(0.85, 1.18),
        whiteFilterAlpha: 0.80,
        whiteFilterClipTopRatio: 0.92,
        moveStep: 1,
        effectProgress: 0.87,
        phaseId: "milk-drink-c2-5",
        phaseName: "14. 2차 길쭉 정점 (꿀꺽 2) & 무릎 통과 (92%)",
      },
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, -1),
        ...cScale(0.94, 1.06),
        whiteFilterAlpha: 0.80,
        whiteFilterClipTopRatio: 0.97,
        moveStep: 1,
        effectProgress: 0.94,
        phaseId: "milk-drink-c2-6",
        phaseName: "15. 발목 잔여 통과 (97%)",
      },

      // [복귀]: 정위치 복귀 & 흰색 필터 100% 완전 소산 완료
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 0),
        ...cScale(1.00, 1.00),
        whiteFilterAlpha: 0.80,
        whiteFilterClipTopRatio: 1.00,
        moveStep: 1,
        effectProgress: 1.00,
        phaseId: "milk-drink-swallowed",
        phaseName: "16. 우유 음용 완료 & 정위치 복귀 (흰색 필터 100% 완전 소산)",
      },

      // ----------------------------------------------------------------------
      // Step 2: 회복 애니메이션 재생 (기술 '회복(Recover)' 연출과 동일)
      // ----------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        moveStep: 2,
        effectProgress: 0.10,
        phaseId: "milk-recover-stars-1",
        phaseName: "8. 회복별 1번 출현 & 치유 나선 상승",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, -1),
        moveStep: 2,
        effectProgress: 0.28,
        phaseId: "milk-recover-stars-2",
        phaseName: "9. 회복별 2번 출현 & 1번 별 나선 선회",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, -1),
        moveStep: 2,
        effectProgress: 0.48,
        phaseId: "milk-recover-stars-3",
        phaseName: "10. 회복별 3번 출현 & 순차 나선 비상",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, -1),
        moveStep: 2,
        effectProgress: 0.68,
        phaseId: "milk-recover-stars-4",
        phaseName: "11. 회복별 4번 출현 & 선행 별 상공 페이드",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        moveStep: 2,
        effectProgress: 0.88,
        phaseId: "milk-recover-stars-fading",
        phaseName: "12. 잔여 회복별 순차적 승화 소멸",
      },
      {
        ...baseFrame,
        delay: 60,
        ...cOff(0, 0),
        showEffect: false,
        moveStep: 2,
        effectProgress: 1.00,
        phaseId: "milk-recover-end",
        phaseName: "13. HP 회복 완료 및 기본자세 복귀",
      },
    ];
  },
};
