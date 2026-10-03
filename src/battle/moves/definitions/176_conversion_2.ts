// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawConversion2Effect } from "../../../renderers/moves/gen1/move173_176.js";

/**
 * 176: 텍스처2 (Conversion 2) - 노말 타입 변화기
 *
 * 연출 구성 (유저 지시 사항):
 * 1. [Step 1: 대상 포커싱 & 사각형 상승]: 기술 시전 시 대상포켓몬 포커싱 (1.34x)
 *    -> 대상포켓몬에게서 흰색 사각형들이 바닥에서 위로 솟아오름 (텍스처1과 동일한 미세 색변화)
 * 2. [Step 2: 줌아웃]: 줌아웃해서 전장의 둘 다 보이게 (1.0x 와이드 뷰, 대상 주변 사각형 부유)
 * 3. [Step 3: 시전자 줌인]: 시전포켓몬에게로 줌인 (1.34x 시전자 포커싱)
 * 4. [Step 4: 비행 이동]: 대상포켓몬에게서 사각형들이 시전포켓몬에게로 포물선 궤적으로 이동
 * 5. [Step 5: 중심 수렴 & 축소 흡수]: 시전자 중앙으로 몰리며 작아지고 페이드아웃 (흡수되는 연출)
 * 6. [Step 6: 안정화 및 복귀]: 잔여 디지털 오라 소산 및 시전자 원래 자세 복귀
 */
export const conversion2Move: BattleMoveAnimation = {
  num: 176,
  key: "conversion-2",
  nameKo: "텍스처2",
  nameEn: "Conversion 2",
  type: "normal",
  category: "status",
  camera: { type: "custom" },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawConversion2Effect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      pRot: 0,
      eRot: 0,
    };

    // 포커싱 좌표 계산
    const neutralCenter = { x: 280, y: 190 };
    const targetFocal = isP ? { x: 346, y: 154 } : { x: 150, y: 244 };
    const attackerFocal = isP ? { x: 150, y: 244 } : { x: 346, y: 154 };

    const lerpFocal = (f1: { x: number; y: number }, f2: { x: number; y: number }, t: number) => ({
      x: Math.round(f1.x + (f2.x - f1.x) * t),
      y: Math.round(f1.y + (f2.y - f1.y) * t),
    });

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
      // Step 1: 대상포켓몬 포커싱 & 대상포켓몬에게서 사각형 상승 (1.34x)
      // =======================================================================
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 0),
        ...cScale(1.00, 1.00),
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.15,
        cameraZoom: 1.18,
        cameraFocal: lerpFocal(neutralCenter, targetFocal, 0.50),
        _gen5Camera: true,
        phaseId: "c2-focus-target-glide",
        phaseName: "1. 대상 포커싱 진입",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...cScale(1.00, 1.00),
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.35,
        cameraZoom: 1.34,
        cameraFocal: targetFocal,
        _gen5Camera: true,
        phaseId: "c2-target-rise-1",
        phaseName: "1. 대상에게서 사각형 상승 개시",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...cScale(1.00, 1.00),
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.65,
        cameraZoom: 1.34,
        cameraFocal: targetFocal,
        _gen5Camera: true,
        phaseId: "c2-target-rise-2",
        phaseName: "1. 사각형 상승 중 & 미세 색변화",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...cScale(1.00, 1.00),
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.88,
        cameraZoom: 1.34,
        cameraFocal: targetFocal,
        _gen5Camera: true,
        phaseId: "c2-target-rise-3",
        phaseName: "1. 사각형 위치 안착 (파스텔 틴트)",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...cScale(1.00, 1.00),
        showEffect: true,
        moveStep: 1,
        effectProgress: 1.00,
        cameraZoom: 1.34,
        cameraFocal: targetFocal,
        _gen5Camera: true,
        phaseId: "c2-target-rise-4",
        phaseName: "1. 대상 사각형 전개 완료",
      },

      // =======================================================================
      // Step 2: 줌아웃해서 둘다 보이게 (1.0x 와이드 뷰, 대상 주변 사각형 부유)
      // =======================================================================
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...cScale(1.00, 1.00),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.25,
        cameraZoom: 1.22,
        cameraFocal: lerpFocal(targetFocal, neutralCenter, 0.40),
        _gen5Camera: true,
        phaseId: "c2-zoomout-1",
        phaseName: "2. 줌아웃 시작 (1/3)",
      },
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...cScale(1.00, 1.00),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.65,
        cameraZoom: 1.08,
        cameraFocal: lerpFocal(targetFocal, neutralCenter, 0.80),
        _gen5Camera: true,
        phaseId: "c2-zoomout-2",
        phaseName: "2. 줌아웃 진행 (2/3)",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...cScale(1.00, 1.00),
        showEffect: true,
        moveStep: 2,
        effectProgress: 1.00,
        cameraZoom: 1.00,
        cameraFocal: neutralCenter,
        _gen5Camera: true,
        phaseId: "c2-zoomout-both",
        phaseName: "2. 둘다 보이는 와이드 뷰 안착 (3/3)",
      },

      // =======================================================================
      // Step 3: 시전포켓몬에게로 줌인 (1.34x 시전자 포커싱)
      // =======================================================================
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...cScale(1.00, 1.00),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.35,
        cameraZoom: 1.16,
        cameraFocal: lerpFocal(neutralCenter, attackerFocal, 0.45),
        _gen5Camera: true,
        phaseId: "c2-zoomin-caster-1",
        phaseName: "3. 시전자 줌인 시작 (1/3)",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...cScale(1.00, 1.00),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.75,
        cameraZoom: 1.34,
        cameraFocal: attackerFocal,
        _gen5Camera: true,
        phaseId: "c2-zoomin-caster-2",
        phaseName: "3. 시전자 줌인 도달 (2/3)",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...cScale(1.00, 1.00),
        showEffect: true,
        moveStep: 3,
        effectProgress: 1.00,
        cameraZoom: 1.34,
        cameraFocal: attackerFocal,
        _gen5Camera: true,
        phaseId: "c2-zoomin-caster-settle",
        phaseName: "3. 시전자 포커싱 완료 안착 (3/3)",
      },

      // =======================================================================
      // Step 4: 대상포켓몬에게서 사각형들이 시전포켓몬에게로 차례대로 이동함 (순차 비행)
      // =======================================================================
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...cScale(1.00, 1.00),
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.16,
        cameraZoom: 1.34,
        cameraFocal: attackerFocal,
        _gen5Camera: true,
        phaseId: "c2-travel-1",
        phaseName: "4. [순차비행] 1호 사각형 이륙",
      },
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...cScale(1.00, 1.00),
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.35,
        cameraZoom: 1.34,
        cameraFocal: attackerFocal,
        _gen5Camera: true,
        phaseId: "c2-travel-2",
        phaseName: "4. [순차비행] 2~3호 사각형 연속 이륙 & 비행 쇄도",
      },
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...cScale(1.00, 1.00),
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.54,
        cameraZoom: 1.34,
        cameraFocal: attackerFocal,
        _gen5Camera: true,
        phaseId: "c2-travel-3",
        phaseName: "4. [순차비행] 1~2호 시전자 안착 & 4~5호 이륙",
      },
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...cScale(1.00, 1.00),
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.72,
        cameraZoom: 1.34,
        cameraFocal: attackerFocal,
        _gen5Camera: true,
        phaseId: "c2-travel-4",
        phaseName: "4. [순차비행] 3~4호 안착 & 6호 비행 쇄도",
      },
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...cScale(1.00, 1.00),
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.88,
        cameraZoom: 1.34,
        cameraFocal: attackerFocal,
        _gen5Camera: true,
        phaseId: "c2-travel-5",
        phaseName: "4. [순차비행] 후발대 사각형 시전자 도달",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...cScale(1.00, 1.00),
        showEffect: true,
        moveStep: 4,
        effectProgress: 1.00,
        cameraZoom: 1.34,
        cameraFocal: attackerFocal,
        _gen5Camera: true,
        phaseId: "c2-travel-finish",
        phaseName: "4. [순차비행] 전 사각형 순차 도착 완료",
      },

      // =======================================================================
      // Step 5: 작아지면서 중앙으로 몰리면서 페이드아웃 (차례대로 순차 흡수)
      // =======================================================================
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, -1),
        ...cScale(1.02, 0.98),
        showEffect: true,
        moveStep: 5,
        effectProgress: 0.25,
        cameraZoom: 1.34,
        cameraFocal: attackerFocal,
        _gen5Camera: true,
        phaseId: "c2-absorb-1",
        phaseName: "5. [순차흡수] 선발 사각형 중심 수렴 & 축소",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, -2),
        ...cScale(1.05, 0.95),
        showEffect: true,
        moveStep: 5,
        effectProgress: 0.52,
        cameraZoom: 1.34,
        cameraFocal: attackerFocal,
        _gen5Camera: true,
        phaseId: "c2-absorb-2",
        phaseName: "5. [순차흡수] 연속 중심 흡수 & 코어 발광",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, -2),
        ...cScale(1.04, 0.96),
        showEffect: true,
        moveStep: 5,
        effectProgress: 0.78,
        cameraZoom: 1.34,
        cameraFocal: attackerFocal,
        _gen5Camera: true,
        phaseId: "c2-absorb-3",
        phaseName: "5. [순차흡수] 후발 사각형 최종 흡수 절정",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, -1),
        ...cScale(1.02, 0.98),
        showEffect: true,
        moveStep: 5,
        effectProgress: 1.00,
        cameraZoom: 1.34,
        cameraFocal: attackerFocal,
        _gen5Camera: true,
        phaseId: "c2-absorb-finish",
        phaseName: "5. [순차흡수] 모든 사각형 흡수 완료",
      },

      // =======================================================================
      // Step 6: 안정화 및 복귀
      // =======================================================================
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...cScale(1.00, 1.00),
        showEffect: true,
        moveStep: 6,
        effectProgress: 0.50,
        cameraZoom: 1.15,
        cameraFocal: lerpFocal(attackerFocal, neutralCenter, 0.50),
        _gen5Camera: true,
        phaseId: "c2-settle-1",
        phaseName: "6. 잔여 디지털 오라 소산",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...cScale(1.00, 1.00),
        showEffect: false,
        fadeEffectOnCameraReturn: true,
        moveStep: 6,
        effectProgress: 1.00,
        cameraZoom: 1.00,
        cameraFocal: null,
        _gen5Camera: false,
        phaseId: "c2-finish",
        phaseName: "6. 피날레 전장 복귀",
      },
    ];
  },
};
