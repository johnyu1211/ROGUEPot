// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawNightmareBehindEffect, drawNightmareEffect } from "../../../renderers/moves/gen1/move169_172.js";

/**
 * 171: 악몽 (Nightmare) - 고스트 타입 변화기 (수면 중인 적 매턴 최대 HP 1/4 감소)
 *
 * 위력: — / 명중: 100 / PP: 15 / 접촉 판정: X
 * 설명: 잠들어 있는 상대에게 악몽을 꾸게 하여 매 턴 최대 HP의 1/4씩 깎아내린다.
 *
 * [유저 명시 연출 시퀀스]:
 * 1. 암전 (Step 1~2: 어두움 100%, 대상 포켓몬 제외하고 전장 및 시전자 완전 칠흑 암전)
 * 2. 갑작스럽게 나타나는 사이코키네시스 배경필터 (Step 3~4: 비틀림 / Vortex Twist 효과가 들어간 네온 사이킥 스트라이프)
 * 3. 악몽 각인 및 잔향 페이드아웃 (Step 5)
 */
export const nightmareMove: BattleMoveAnimation = {
  num: 171,
  key: "nightmare",
  nameKo: "악몽",
  nameEn: "Nightmare",
  type: "ghost",
  category: "status",
  camera: {
    type: "target",
    zoom: 1.35,
    delayUntilStep: 1, // 처음부터 대상 포켓몬에 클로즈업 포커싱
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawNightmareBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawNightmareEffect(targetCtx, frame, drawCtx);
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
      hidePlatform: true, // 전장 발판을 암흑 속에 감춤
      hidePShadow: true,
      hideEShadow: true,
    };

    // 시전자 숨김 (어두움 100% 대상 포켓몬 제외)
    const casterHide = {
      pAlpha: isP ? 0.0 : 1.0,
      eAlpha: !isP ? 0.0 : 1.0,
      hidePlayer: isP,
      hideEnemy: !isP,
    };

    // 피격자(대상 포켓몬) 미세 떨림/쉐이크
    const defOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    return [
      // =======================================================================
      // Step 1: 암전 개시 (어두움 100% - 대상 포켓몬 제외하고 칠흑 - 180ms)
      // =======================================================================
      {
        ...baseFrame,
        ...casterHide,
        ...defOff(0, 0),
        delay: 90,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 1,
        effectProgress: 0.35,
        phaseId: "nightmare-blackout-1",
        phaseName: "1. 전장 완전 암전 (어두움 100%)",
      },
      {
        ...baseFrame,
        ...casterHide,
        ...defOff(0, 0),
        delay: 90,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 1,
        effectProgress: 0.85,
        phaseId: "nightmare-blackout-2",
        phaseName: "1. 칠흑의 정적 속 잠든 대상",
      },

      // =======================================================================
      // Step 2: 암전 속 태동 (불길한 기운이 발밑에서 태동 - 180ms)
      // =======================================================================
      {
        ...baseFrame,
        ...casterHide,
        ...defOff(0, 0),
        delay: 90,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 2,
        effectProgress: 0.40,
        phaseId: "nightmare-shadow-creep-1",
        phaseName: "2. 심연의 그림자 기운 태동",
      },
      {
        ...baseFrame,
        ...casterHide,
        ...defOff(0, 0),
        delay: 90,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 2,
        effectProgress: 0.90,
        phaseId: "nightmare-shadow-creep-2",
        phaseName: "2. 긴장 고조 & 악몽 전조",
      },

      // =======================================================================
      // Step 3: 갑작스럽게 나타나는 사이코키네시스 배경필터 (비틀림 효과 - 270ms)
      // =======================================================================
      {
        ...baseFrame,
        ...casterHide,
        ...defOff(-2, 1),
        targetPurpleLevel: 0.5,
        delay: 90,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 3,
        effectProgress: 0.25,
        phaseId: "nightmare-warp-burst-1",
        phaseName: "3. 갑작스러운 비틀림 사이킥 필터 발현",
      },
      {
        ...baseFrame,
        ...casterHide,
        ...defOff(2, -1),
        targetPurpleLevel: 0.65,
        delay: 90,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 3,
        effectProgress: 0.65,
        phaseId: "nightmare-warp-burst-2",
        phaseName: "3. 소용돌이 비틀림 물결 폭발",
      },
      {
        ...baseFrame,
        ...casterHide,
        ...defOff(-3, 1),
        targetPurpleLevel: 0.75,
        delay: 90,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 3,
        effectProgress: 1.00,
        phaseId: "nightmare-warp-burst-3",
        phaseName: "3. 비틀린 차원 전개 & 대상 요동",
      },

      // =======================================================================
      // Step 4: 비틀림 극대화 & 악몽의 옥죄임 (280ms)
      // =======================================================================
      {
        ...baseFrame,
        ...casterHide,
        ...defOff(3, 2),
        targetPurpleLevel: 0.85,
        delay: 90,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 4,
        effectProgress: 0.35,
        phaseId: "nightmare-torture-1",
        phaseName: "4. 악몽의 비틀림 극대화",
      },
      {
        ...baseFrame,
        ...casterHide,
        ...defOff(-3, -1),
        targetPurpleLevel: 0.9,
        delay: 95,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 4,
        effectProgress: 0.70,
        phaseId: "nightmare-torture-2",
        phaseName: "4. 비틀림 파동 가속 & 공간 왜곡",
      },
      {
        ...baseFrame,
        ...casterHide,
        ...defOff(2, 1),
        targetPurpleLevel: 0.85,
        delay: 95,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 4,
        effectProgress: 1.00,
        phaseId: "nightmare-torture-3",
        phaseName: "4. 악몽의 저주 완전 침식",
      },

      // =======================================================================
      // Step 5: 악몽 각인 완료 & 페이드아웃 (260ms)
      // =======================================================================
      {
        ...baseFrame,
        ...casterHide,
        ...defOff(1, 0),
        targetPurpleLevel: 0.5,
        delay: 85,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 5,
        effectProgress: 0.30,
        phaseId: "nightmare-settle-1",
        phaseName: "5. 대상 심장부로 악몽 흡수 침식",
      },
      {
        ...baseFrame,
        ...casterHide,
        ...defOff(0, 0),
        targetPurpleLevel: 0.25,
        delay: 85,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 5,
        effectProgress: 0.65,
        phaseId: "nightmare-settle-2",
        phaseName: "5. 비틀림 배경 서서히 소멸 페이드아웃",
      },
      {
        ...baseFrame,
        ...casterHide,
        ...defOff(0, 0),
        delay: 90,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 5,
        effectProgress: 1.00,
        phaseId: "nightmare-settle-3",
        phaseName: "5. 악몽 각인 완료",
      },
      {
        ...baseFrame,
        pAlpha: 1.0,
        eAlpha: 1.0,
        hidePlayer: false,
        hideEnemy: false,
        hidePShadow: false,
        hideEShadow: false,
        ...defOff(0, 0),
        delay: 80,
        showEffect: false,
        showBehindEffect: false,
        hidePlatform: false,
        afterCameraReturn: true,
        phaseId: "nightmare-return",
        phaseName: "5. 기본 화면 복귀",
      },
    ];
  },
};
