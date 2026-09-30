// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawSharpenEffect } from "../../../renderers/moves/gen1/move157_160.js";

/**
 * 159: 각지기 (Sharpen) - 노말 타입 변화기 (자신의 공격 1랭크 상승)
 *
 * 연출 구성 (5세대 B/W 풍 기하학 폴리곤 각화 & 공격력 상승):
 * 1. [Phase 1: 기 모으기 & 3D 폴리곤 격자 수축] 시전자 웅크림 힘 축적 ➔ 몸체 주변 3D 회전 기하학 다면체(폴리곤) 와이어프레임 및 반투명 패싯 출현 후 밀착 수축
 * 2. [Phase 2: 모서리 각화 & 정점 글린트 & 슬라이스 섬광] 시전자 전신 긴장 팽창 ➔ 다각 버텍스에서 강렬한 순백/시안 십자 글린트(칭! 칭!) 폭발 & 사선 슬라이스 섬광 작렬
 * 3. [Phase 3: 공격력 랭크업 폭발] 각화 완료 ➔ 붉은색/주황색의 날카로운 상승 셰브론(▲) 오라와 스탯 부스트 에너지 폭발적 상승
 * 4. [Phase 4: 안정화 및 소산] 폴리곤 격자 승화 소산 ➔ 시전자 원래 자세로 탄성 복귀 및 카메라 글라이드아웃
 */
export const sharpenMove: BattleMoveAnimation = {
  num: 159,
  key: "sharpen",
  nameKo: "각지기",
  nameEn: "Sharpen",
  type: "normal",
  category: "status",
  customStatParticles: true,
  camera: { type: "self", zoom: 1.34 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawSharpenEffect(targetCtx, frame, drawCtx);
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
      // Phase 1: 기 모으기 & 3D 기하학 다면체 와이어프레임 수축 (Step 1)
      // =======================================================================
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 2),
        ...cScale(1.05, 0.95),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.25,
        phaseId: "sharpen-charge-1",
        phaseName: "1. 기 모으기 & 폴리곤 격자 출현",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 4),
        ...cScale(1.10, 0.90),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.65,
        phaseId: "sharpen-charge-2",
        phaseName: "1. 전신 웅크림 & 격자 수축",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 5),
        ...cScale(1.14, 0.86),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 1.00,
        phaseId: "sharpen-charge-3",
        phaseName: "1. 폴리곤 격자 밀착 완비",
      },

      // =======================================================================
      // Phase 2: 예리한 모서리 각화 & 정점 글린트 & 슬라이스 섬광 (Step 2)
      // =======================================================================
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, -2),
        ...cScale(0.95, 1.08),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.15,
        phaseId: "sharpen-tink-1",
        phaseName: "2. 전신 긴장 & 1차 정점 글린트",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, -4),
        ...cScale(0.92, 1.12),
        showEffect: true,
        hitFlash: true,
        moveStep: 2,
        effectProgress: 0.45,
        phaseId: "sharpen-slash-1",
        phaseName: "2. 예리한 각화 슬라이스 섬광",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, -3),
        ...cScale(0.94, 1.10),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.75,
        phaseId: "sharpen-slash-2",
        phaseName: "2. 2차 슬라이스 & 연쇄 십자 글린트",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, -1),
        ...cScale(0.98, 1.04),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 1.00,
        phaseId: "sharpen-tink-finish",
        phaseName: "2. 모서리 각화 완성",
      },

      // =======================================================================
      // Phase 3: 각화 완료! 공격력 랭크업 폭발 (Step 3)
      // =======================================================================
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...cScale(1.04, 0.96),
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.15,
        phaseId: "sharpen-boost-1",
        phaseName: "3. 공격력 상승 오라 개시",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, -1),
        ...cScale(1.02, 0.98),
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.40,
        phaseId: "sharpen-boost-2",
        phaseName: "3. 붉은 셰브론 ▲ 솟구침",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, -2),
        ...cScale(1.00, 1.00),
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.70,
        phaseId: "sharpen-boost-3",
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
        phaseId: "sharpen-boost-4",
        phaseName: "3. 공격력 1랭크 상승 절정",
      },

      // =======================================================================
      // Phase 4: 안정화 및 탄성 복귀 (Step 4)
      // =======================================================================
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.35,
        phaseId: "sharpen-settle-1",
        phaseName: "4. 잔여 에너지 소산",
      },
      {
        ...baseFrame,
        delay: 100,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.75,
        phaseId: "sharpen-settle-2",
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
        phaseId: "sharpen-finish",
        phaseName: "4. 피날레 복귀",
      },
    ];
  },
};
