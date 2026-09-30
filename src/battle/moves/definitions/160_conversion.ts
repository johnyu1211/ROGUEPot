// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawConversionEffect } from "../../../renderers/moves/gen1/move157_160.js";

/**
 * 160: 텍스처 (Conversion) - 노말 타입 변화기
 *
 * 연출 구성 (유저 지시 사항):
 * 1. [Step 1: 상승 & 미세 색변화] 서로 다른 크기의 흰색 사각형들이 아래에서 위로 솟아오름
 *    -> 올라오면서 미세하게 노란색, 파란색, 빨간색으로 살짝 변함 (여전히 흰색에 가까움)
 * 2. [Step 2: 순차 축소] 사각형들이 우측상단부터 좌측하단순으로 순차적으로 작아지며 소멸
 * 3. [Step 3: 랭크업 오라] 사각형 소멸 직후 스탯 부스트 랭크업 오라 분출
 * 4. [Step 4: 안정화 및 복귀] 오라 소산 및 시전자 원래 자세로 탄성 복귀
 */
export const conversionMove: BattleMoveAnimation = {
  num: 160,
  key: "conversion",
  nameKo: "텍스처",
  nameEn: "Conversion",
  type: "normal",
  category: "status",
  customStatParticles: true,
  camera: { type: "self", zoom: 1.34 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawConversionEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.34,
      pRot: 0,
      eRot: 0,
    };

    // 절대 규칙 2 준수: 시전자 전용 오프셋 및 탄성 스케일 (수비자는 {0, 0} 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const cScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    return [
      // =======================================================================
      // Step 1: 흰색 사각형 상승 & 미세 노랑/파랑/빨강 색변화
      // =======================================================================
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 2),
        ...cScale(1.02, 0.98),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.20,
        phaseId: "conversion-rise-1",
        phaseName: "1. 사각형 상승 개시 (순백)",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...cScale(1.00, 1.00),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.55,
        phaseId: "conversion-rise-2",
        phaseName: "1. 사각형 상승 중 & 미세 색변화",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, -2),
        ...cScale(0.98, 1.02),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.85,
        phaseId: "conversion-rise-3",
        phaseName: "1. 사각형 위치 안착 (파스텔 틴트)",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, -1),
        ...cScale(1.00, 1.00),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 1.00,
        phaseId: "conversion-rise-4",
        phaseName: "1. 사각형 전개 완료",
      },

      // =======================================================================
      // Step 2: 사각형 순차 축소 (우측상단부터 좌측하단순)
      // =======================================================================
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...cScale(1.00, 1.00),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.15,
        phaseId: "conversion-shrink-1",
        phaseName: "2. 우측상단 사각형 축소 시작",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...cScale(1.00, 1.00),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.40,
        phaseId: "conversion-shrink-2",
        phaseName: "2. 우측상단 소멸 & 중앙 축소",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...cScale(1.00, 1.00),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.65,
        phaseId: "conversion-shrink-3",
        phaseName: "2. 중앙 소멸 & 좌측하단 축소",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...cScale(1.00, 1.00),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.90,
        phaseId: "conversion-shrink-4",
        phaseName: "2. 좌측하단 사각형 소멸 직전",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...cScale(1.02, 0.98),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 1.00,
        phaseId: "conversion-shrink-finish",
        phaseName: "2. 모든 사각형 소멸 완료",
      },

      // =======================================================================
      // Step 3: 이후 랭크업 오라 분출!
      // =======================================================================
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, -2),
        ...cScale(1.04, 0.96),
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.20,
        phaseId: "conversion-boost-1",
        phaseName: "3. 랭크업 오라 개시",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, -3),
        ...cScale(1.02, 0.98),
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.50,
        phaseId: "conversion-boost-2",
        phaseName: "3. 랭크업 구체 오라 솟구침",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, -2),
        ...cScale(1.00, 1.00),
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.80,
        phaseId: "conversion-boost-3",
        phaseName: "3. 스탯 부스트 에너지 승화",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, -1),
        ...cScale(1.00, 1.00),
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 1.00,
        phaseId: "conversion-boost-4",
        phaseName: "3. 랭크업 절정",
      },

      // =======================================================================
      // Step 4: 안정화 및 복귀
      // =======================================================================
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.35,
        phaseId: "conversion-settle-1",
        phaseName: "4. 잔여 오라 소산",
      },
      {
        ...baseFrame,
        delay: 100,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.75,
        phaseId: "conversion-settle-2",
        phaseName: "4. 시전자 탄성 복귀",
      },
      {
        ...baseFrame,
        delay: 100,
        ...cOff(0, 0),
        showEffect: false,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 1.00,
        fadeEffectOnCameraReturn: true,
        phaseId: "conversion-finish",
        phaseName: "4. 피날레 복귀",
      },
    ];
  },
};
