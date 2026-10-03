// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawScaryFaceBehindEffect,
  drawScaryFaceEffect,
} from "../../../renderers/moves/gen1/move181_184.js";

/**
 * 184: 겁나는얼굴 (Scary Face) - 노말 타입 변화 기술 (상대 스피드 2랭크 하강)
 *
 * 위력: — / 명중: 100 / PP: 10 / 카테고리: 변화기
 * 설명: 무서운 얼굴로 노려보고 겁주어 상대의 스피드를 크게 떨어뜨린다.
 *
 * [5세대(BW) 원작 1:1 고증 연출 시퀀스 - 유저 지시 엄수]:
 * - 귀면(Scary Face)은 대상이 아닌 **시전 포켓몬(Caster)** 머리/얼굴 위에 나타남!
 * 1. Step 1: 시전자 위압적 포효/노려보기 (Caster Intimidation & Glare)
 *    - 시전자에게 카메라 클로즈업 포커싱 (camera: self, zoom: 1.35)
 *    - 시전자가 힘을 모아 상체를 앞으로 숙이며 위압적 포즈
 * 2. Step 2: 전장 암전 & 시전자 머리/얼굴 위에 보라색 귀면(Scary Face) 출현 (Dark Overlay & Demon Mask)
 *    - 전장이 짙은 어둠(암전)으로 가라앉음
 *    - 시전 포켓몬 머리/안면 상공에 유저 첨부 5세대 실기 1:1 고증 보라색(#A552EF) 귀면이 점멸 출현
 * 3. Step 3: 귀면의 위협적 펄스 & 전방 덮침 팽창 (Menacing Pulse & Looming Surge)
 *    - 시전자가 전방으로 포효하며 귀면이 2.38x로 급속 팽창, 보라색 외곽 충격파 잔상과 함께 번뜩임
 *    - 시전자와 귀면이 함께 위협적인 전율/진동을 일으킴
 * 4. Step 4: 귀면 소산 & 암전 페이드아웃 (Fadeout & Dissipation)
 *    - 귀면이 투명해지며 대기 중으로 흩어지고 암전 해제
 * 5. Step 5: 정위치 복귀 (Finish)
 *    - 시전자 정위치 복귀 및 카메라 리턴 (이후 상대 스피드 2랭크 급하락 기본 연출 자동 연계)
 */
export const scaryFaceMove: BattleMoveAnimation = {
  num: 184,
  key: "scary-face",
  nameKo: "겁나는얼굴",
  nameEn: "Scary Face",
  type: "normal",
  category: "status",
  camera: {
    type: "self",
    zoom: 1.35,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawScaryFaceBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawScaryFaceEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      pRot: 0,
      eRot: 0,
    };

    // 공격자 오프셋 / 대상 오프셋 분기 헬퍼
    const actorOffset = (ax: number, ay: number) =>
      isP ? { pOffset: { x: ax, y: ay } } : { eOffset: { x: -ax, y: -ay } };
    const actorScale = (sx: number, sy: number) => ({
      pScale: isP ? { x: sx, y: sy } : undefined,
      eScale: !isP ? { x: sx, y: sy } : undefined,
    });

    // -------------------------------------------------------------
    // Miss인 경우: 귀면이 잠깐 깜빡이다 힘없이 소산
    // -------------------------------------------------------------
    if (!isHit) {
      return [
        {
          ...baseFrame,
          delay: 85,
          ...actorOffset(-2, 1),
          ...actorScale(1.04, 0.96),
          showEffect: false,
          showBehindEffect: false,
          moveStep: 1,
          phaseId: "scary-face-miss-windup",
          phaseName: "#1. 시전자 노려보기 준비",
        },
        {
          ...baseFrame,
          delay: 85,
          ...actorOffset(4, -1),
          ...actorScale(0.98, 1.02),
          showEffect: true,
          showBehindEffect: true,
          dimAlpha: 0.40,
          faceScale: 1.5,
          faceAlpha: 0.45,
          moveStep: 2,
          phaseId: "scary-face-miss-flicker",
          phaseName: "#2. 귀면 깜빡임 (불발)",
        },
        {
          ...baseFrame,
          delay: 75,
          ...actorOffset(0, 0),
          ...actorScale(1.0, 1.0),
          showEffect: false,
          showBehindEffect: false,
          moveStep: 5,
          phaseId: "scary-face-miss-finish",
          phaseName: "#3. 정위치 복귀",
        },
      ];
    }

    // -------------------------------------------------------------
    // Normal Hit: 시전자 머리 위 보라색 귀면 발현 + 덮침 팽창
    // -------------------------------------------------------------
    return [
      // =======================================================================
      // Step 1: 시전자 위압적 포효/노려보기 준비 (Windup - 2프레임)
      // =======================================================================
      {
        ...baseFrame,
        delay: 85,
        ...actorOffset(-4, 2),
        ...actorScale(1.05, 0.95),
        showEffect: false,
        showBehindEffect: false,
        moveStep: 1,
        phaseId: "scary-face-windup-1",
        phaseName: "#1. 시전자 노려보기 힘 축적",
      },
      {
        ...baseFrame,
        delay: 85,
        ...actorOffset(6, -2),
        ...actorScale(0.96, 1.05),
        showEffect: false,
        showBehindEffect: false,
        moveStep: 1,
        phaseId: "scary-face-windup-2",
        phaseName: "#1. 시전자 전방 기합 및 포효",
      },

      // =======================================================================
      // Step 2: 전장 암전 & 시전자 머리 위 보라색 귀면 출현 (Manifestation - 3프레임)
      // =======================================================================
      {
        ...baseFrame,
        delay: 75,
        ...actorOffset(4, -1),
        ...actorScale(0.98, 1.02),
        showEffect: true,
        showBehindEffect: true,
        dimAlpha: 0.60,
        faceScale: 1.55,
        faceAlpha: 0.65,
        faceGlow: 0.45,
        moveStep: 2,
        phaseId: "scary-face-manifest-1",
        phaseName: "#2. 전장 암전 & 시전자 위 보라색 귀면 점멸",
      },
      {
        ...baseFrame,
        delay: 80,
        ...actorOffset(2, 0),
        ...actorScale(1.0, 1.0),
        showEffect: true,
        showBehindEffect: true,
        dimAlpha: 0.85,
        faceScale: 1.82,
        faceAlpha: 0.95,
        faceGlow: 0.75,
        faceEyeOffset: -1.0,
        moveStep: 2,
        phaseId: "scary-face-manifest-2",
        phaseName: "#2. 완전 암전 & 보라색 귀면 선명히 발현",
      },
      {
        ...baseFrame,
        delay: 80,
        ...actorOffset(0, 0),
        ...actorScale(1.0, 1.0),
        showEffect: true,
        showBehindEffect: true,
        dimAlpha: 0.88,
        faceScale: 1.90,
        faceAlpha: 1.00,
        faceGlow: 0.85,
        faceEyeOffset: 0.5,
        faceMouthOffset: 1.0,
        moveStep: 2,
        phaseId: "scary-face-manifest-3",
        phaseName: "#2. 귀면의 섬뜩한 노려보기",
      },

      // =======================================================================
      // Step 3: [핵심 연출] 귀면의 전방 덮침 팽창 & 시전자 포효 (Looming & Surge - 3프레임)
      // =======================================================================
      {
        ...baseFrame,
        delay: 90,
        ...actorOffset(8, -3), // 시전자 상체 앞으로 확 숙이며 포효
        ...actorScale(1.08, 0.94),
        showEffect: true,
        showBehindEffect: true,
        dimAlpha: 0.90,
        faceScale: 2.38, // 귀면 거대 팽창 덮침!
        faceAlpha: 1.00,
        faceGlow: 1.00,
        faceEyeOffset: -2.0,
        faceMouthOffset: 3.5, // 턱이 크게 벌어짐
        faceAfterimage: true, // 보라색 외곽 충격파 잔상
        showRedPupils: true,  // [유저 지시]: 마지막에 나타나는 세로형 붉은 눈동자 개안!
        redPupilScale: 1.15,
        redPupilAlpha: 1.0,
        moveStep: 3,
        phaseId: "scary-face-looming-surge",
        phaseName: "#3. 귀면 전방 급속 팽창 덮침 & 붉은 눈동자 번뜩임",
      },
      {
        ...baseFrame,
        delay: 85,
        ...actorOffset(4, -1),
        ...actorScale(1.04, 0.96),
        showEffect: true,
        showBehindEffect: true,
        dimAlpha: 0.88,
        faceScale: 2.20,
        faceAlpha: 1.00,
        faceGlow: 0.85,
        faceJitX: 2.5,
        faceJitY: -1.5,
        faceEyeOffset: 1.0,
        faceMouthOffset: 2.0,
        showRedPupils: true,
        redPupilScale: 1.0,
        redPupilAlpha: 1.0,
        moveStep: 3,
        phaseId: "scary-face-looming-tremble-1",
        phaseName: "#3. 위협적인 포효 전율 1",
      },
      {
        ...baseFrame,
        delay: 85,
        ...actorOffset(2, 0),
        ...actorScale(1.02, 0.98),
        showEffect: true,
        showBehindEffect: true,
        dimAlpha: 0.85,
        faceScale: 2.05,
        faceAlpha: 0.95,
        faceGlow: 0.70,
        faceJitX: -2.0,
        faceJitY: 1.0,
        faceMouthOffset: 1.0,
        showRedPupils: true,
        redPupilScale: 0.95,
        redPupilAlpha: 0.95,
        moveStep: 3,
        phaseId: "scary-face-looming-tremble-2",
        phaseName: "#3. 위협적인 포효 전율 2",
      },

      // =======================================================================
      // Step 4: 귀면 소산 & 암전 페이드아웃 (Fadeout & Dissipation - 2프레임)
      // =======================================================================
      {
        ...baseFrame,
        delay: 85,
        ...actorOffset(1, 0),
        ...actorScale(1.01, 0.99),
        showEffect: true,
        showBehindEffect: true,
        dimAlpha: 0.50,
        faceScale: 1.90,
        faceAlpha: 0.55,
        faceGlow: 0.35,
        showRedPupils: true,
        redPupilScale: 0.85,
        redPupilAlpha: 0.60,
        moveStep: 4,
        phaseId: "scary-face-dissipate-1",
        phaseName: "#4. 귀면 투명화 및 소산 개시",
      },
      {
        ...baseFrame,
        delay: 80,
        ...actorOffset(0, 0),
        ...actorScale(1.0, 1.0),
        showEffect: true,
        showBehindEffect: true,
        dimAlpha: 0.20,
        faceScale: 1.75,
        faceAlpha: 0.18,
        faceGlow: 0.10,
        moveStep: 4,
        phaseId: "scary-face-dissipate-2",
        phaseName: "#4. 암전 해제 & 잔여 잔향 소멸",
      },

      // =======================================================================
      // Step 5: 정위치 복귀 (Finish - 1프레임)
      // =======================================================================
      {
        ...baseFrame,
        delay: 70,
        ...actorOffset(0, 0),
        ...actorScale(1.0, 1.0),
        showEffect: false,
        showBehindEffect: false,
        moveStep: 5,
        phaseId: "scary-face-finish",
        phaseName: "#5. 기술 연출 종료 (정위치 복귀)",
      },
    ];
  },
};
