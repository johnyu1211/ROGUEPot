// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawMindReaderEffect } from "../../../renderers/moves/gen1/move169_172.js";

/**
 * 170: 마음의눈 (Mind Reader) - 노말 타입 변화기 (다음 턴 공격 필중)
 *
 * 위력: — / 명중: — (필중) / PP: 5 / 접촉 판정: X
 * 설명: 상대의 움직임을 마음으로 읽고 다음 공격이 반드시 상대에게 명중되게 한다.
 *
 * [유저 명시 연출 시퀀스]:
 * 1. 암전 (Step 1: 전장 전체 암전 & 정신 집중)
 * 2. 상대방 포켓몬 포커싱 & 구체가 생김 (Step 2: 카메라 타겟 줌 1.35x & 반투명 역장 구체 형성)
 * 3. 역장 구체 안정화 & 정신 집중 (Step 3: 구체 호흡 펄스 & 에너지 공명)
 * 4. 눈을 뜸 (Step 4: 이미지 1:1 고증 안구 흰자 + 적갈색 홍채 + 칠흑 동공 개안)
 * 5. 상대 궤적 완전 파악 및 각인 & 잔향 페이드아웃 (Step 5)
 */
export const mindReaderMove: BattleMoveAnimation = {
  num: 170,
  key: "mind-reader",
  nameKo: "마음의눈",
  nameEn: "Mind Reader",
  type: "normal",
  category: "status",
  camera: {
    type: "target",
    zoom: 1.35,
    delayUntilStep: 2, // Step 1: 중립 1.0x 화면 암전 -> Step 2부터 부드러운 타겟 포커싱
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawMindReaderEffect(targetCtx, frame, drawCtx);
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

    // 시전자 오프셋
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 시전자 스케일
    const cScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    // 수비자(피격자) 오프셋 - 마음의눈은 피격자 넉백 없이 완벽 고정
    const defOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    return [
      // =======================================================================
      // Step 1: 암전 (전장 전체 암전 & 정신 집중 - 170ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 85,
        ...cOff(-2, 1),
        ...cScale(0.97, 1.03),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.40,
        phaseId: "mind-reader-darken-1",
        phaseName: "1. 전장 암전 & 정신 집중 (어두워짐)",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(-4, 2),
        ...cScale(0.95, 1.05),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.90,
        phaseId: "mind-reader-darken-2",
        phaseName: "1. 암전 심화 & 표적 탐지",
      },

      // =======================================================================
      // Step 2: 상대방 포켓몬 포커싱 & 구체가 생김 (240ms)
      // (delayUntilStep: 2에 의해 카메라가 타겟으로 부드럽게 줌인 완료)
      // =======================================================================
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.35,
        phaseId: "mind-reader-sphere-1",
        phaseName: "2. 상대방 포켓몬 포커싱 & 구체 발현",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.75,
        phaseId: "mind-reader-sphere-2",
        phaseName: "2. 역장 구체 팽창 & 대상 감싸기",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 2,
        effectProgress: 1.00,
        phaseId: "mind-reader-sphere-3",
        phaseName: "2. 구체 전개 완료 & 안정화",
      },

      // =======================================================================
      // Step 3: 역장 구체 안정화 & 정신 집중 (240ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.35,
        phaseId: "mind-reader-focus-1",
        phaseName: "3. 역장 구체 안정화 & 대상 조준",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.70,
        phaseId: "mind-reader-focus-2",
        phaseName: "3. 정신 에너지 공명 & 시각 동조",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 3,
        effectProgress: 1.00,
        phaseId: "mind-reader-focus-3",
        phaseName: "3. 구체 내부 수렴 & 개안 준비 완료",
      },

      // =======================================================================
      // Step 4: 눈을 뜸 (이미지참고 고증 개안 - 355ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.20,
        phaseId: "mind-reader-eye-open-1",
        phaseName: "4. 마음의 눈 실눈 개안 시작",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.60,
        phaseId: "mind-reader-eye-open-2",
        phaseName: "4. 눈꺼풀 열림 & 적갈색 홍채 노출",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.90,
        phaseId: "mind-reader-eye-open-3",
        phaseName: "4. 마음의 눈 완전 개안 (동공 응시)",
      },
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 4,
        effectProgress: 1.00,
        phaseId: "mind-reader-eye-open-4",
        phaseName: "4. 표적 움직임 완벽 간파 & 응시",
      },

      // =======================================================================
      // Step 5: 각인 완료 & 페이드아웃 (160ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 5,
        effectProgress: 0.45,
        phaseId: "mind-reader-fade-1",
        phaseName: "5. 필중 각인 완료 & 잔향 소멸",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 5,
        effectProgress: 0.90,
        fadeEffectOnCameraReturn: true,
        phaseId: "mind-reader-fade-2",
        phaseName: "5. 페이드아웃 & 기본 화면 복귀",
      },
    ];
  },
};
