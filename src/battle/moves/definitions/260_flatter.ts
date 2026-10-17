// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawFlatterBehindEffect, drawFlatterEffect } from "../../../renderers/moves/gen1/move257_260.js";

/**
 * 260: 부추기기 (Flatter / おだてる) - 악 타입 변화 기술
 *
 * 위력: - / 명중: 100 / PP: 15
 * 설명: 상대를 부추겨서 혼란시킨다. 동시에 상대의 특수공격도 올라가 버린다.
 *
 * [유저 지정 연출 시퀀스]:
 * 1. [시전포켓몬 세로로 2번 길어졌다 돌아오기]:
 *    - 시전자 포켓몬이 상하로 길쭉하게 늘어났다 정위치로 돌아오는 모션 2회 반복
 * 2. [대상포켓몬 스포트라이트 이후 혼란]:
 *    - 카메라가 대상 포켓몬으로 전환 (caster_to_target) & 암전 배경(blackFadeAlpha 0.40)
 *    - 상공에서 대상에게 내리쬐는 극장식 스포트라이트 조명 (바닥 조명풀 + 광선 기둥 + 빛가루)
 *    - 이후 대상 머리 위 3D 궤도 회전 별무리(★ ★ ★) 공전 & 비틀거리며 혼란 돌입
 */
export const flatterMove: BattleMoveAnimation = {
  num: 260,
  key: "flatter",
  nameKo: "부추기기",
  nameEn: "Flatter",
  type: "dark",
  category: "status",
  camera: {
    type: "caster_to_target",
    zoom: 1.25,
    delayUntilStep: 2, // Step 1: 시전자 세로 연신 모션, Step 2: 대상 스포트라이트 및 혼란
    inlineGlideInFrames: 2,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawFlatterBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawFlatterEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      cameraZoom: 1.0,
      showEffect: true,
      moveStep: 1,
    };

    // 시전자 오프셋 & 스케일 (수비자는 {0, 0} 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const cScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    // 대상 오프셋, 회전 (시전자는 영향 없음)
    const tOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x, y } : { x: 0, y: 0 },
    });

    const tRot = (rot: number) => ({
      pRot: !isP ? rot : 0,
      eRot: isP ? rot : 0,
    });

    // ========================================================================
    // 빗맞았을 때 (Miss 처리)
    // ========================================================================
    if (isHit === false) {
      return [
        // 1회차 세로 늘어나기
        {
          ...baseFrame,
          delay: 80,
          ...cScale(0.96, 1.15),
          phaseId: "flatter-miss-stretch-1-up",
          phaseName: "#1. 시전자 1차 세로 늘어나기",
        },
        {
          ...baseFrame,
          delay: 110,
          ...cScale(0.88, 1.35),
          phaseId: "flatter-miss-stretch-1-peak",
          phaseName: "#2. 시전자 1차 세로 최대 연신",
        },
        {
          ...baseFrame,
          delay: 80,
          ...cScale(0.96, 1.12),
          phaseId: "flatter-miss-stretch-1-down",
          phaseName: "#3. 시전자 1차 복귀 중",
        },
        {
          ...baseFrame,
          delay: 80,
          ...cScale(1.0, 1.0),
          phaseId: "flatter-miss-stretch-1-reset",
          phaseName: "#4. 시전자 1차 원위치 복귀",
        },
        // 2회차 세로 늘어나기
        {
          ...baseFrame,
          delay: 80,
          ...cScale(0.96, 1.15),
          phaseId: "flatter-miss-stretch-2-up",
          phaseName: "#5. 시전자 2차 세로 늘어나기",
        },
        {
          ...baseFrame,
          delay: 110,
          ...cScale(0.88, 1.35),
          phaseId: "flatter-miss-stretch-2-peak",
          phaseName: "#6. 시전자 2차 세로 최대 연신",
        },
        {
          ...baseFrame,
          delay: 80,
          ...cScale(0.96, 1.12),
          phaseId: "flatter-miss-stretch-2-down",
          phaseName: "#7. 시전자 2차 복귀 중",
        },
        {
          ...baseFrame,
          delay: 90,
          ...cScale(1.0, 1.0),
          phaseId: "flatter-miss-stretch-2-reset",
          phaseName: "#8. 시전자 2차 원위치 복귀",
        },
        {
          ...baseFrame,
          delay: 100,
          moveStep: 2,
          ...cScale(1.0, 1.0),
          ...cOff(0, 0),
          phaseId: "flatter-miss-finish",
          phaseName: "#9. 빗맞음 (반응 없음)",
        },
      ];
    }

    return [
      // ======================================================================
      // Step 1: 시전포켓몬 세로로 2번 길어졌다 돌아오기
      // ======================================================================
      // --- 1회차 길어지기 ---
      {
        ...baseFrame,
        delay: 80,
        ...cScale(0.96, 1.15),
        phaseId: "flatter-stretch-1-up",
        phaseName: "#1. 시전자 1차 세로 늘어나기",
      },
      {
        ...baseFrame,
        delay: 110,
        ...cScale(0.88, 1.35),
        phaseId: "flatter-stretch-1-peak",
        phaseName: "#2. 시전자 1차 세로 최대 연신",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cScale(0.96, 1.12),
        phaseId: "flatter-stretch-1-down",
        phaseName: "#3. 시전자 1차 복귀 중",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cScale(1.0, 1.0),
        phaseId: "flatter-stretch-1-reset",
        phaseName: "#4. 시전자 1차 원위치 복귀",
      },

      // --- 2회차 길어지기 ---
      {
        ...baseFrame,
        delay: 80,
        ...cScale(0.96, 1.15),
        phaseId: "flatter-stretch-2-up",
        phaseName: "#5. 시전자 2차 세로 늘어나기",
      },
      {
        ...baseFrame,
        delay: 110,
        ...cScale(0.88, 1.35),
        phaseId: "flatter-stretch-2-peak",
        phaseName: "#6. 시전자 2차 세로 최대 연신",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cScale(0.96, 1.12),
        phaseId: "flatter-stretch-2-down",
        phaseName: "#7. 시전자 2차 복귀 중",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cScale(1.0, 1.0),
        phaseId: "flatter-stretch-2-reset",
        phaseName: "#8. 시전자 2차 원위치 복귀",
      },

      // ======================================================================
      // Step 2: 대상포켓몬 스포트라이트 ➔ 걷힌 후 혼란
      // ======================================================================
      // [Part 1: 스포트라이트 점등 & 조명 ➔ 완전히 걷힘]
      // #9. 스포트라이트 점등 & 암전 진입
      {
        ...baseFrame,
        delay: 80,
        moveStep: 2,
        blackFadeAlpha: 0.25,
        flatterSpotlight: { alpha: 0.65, time: 0.1 },
        phaseId: "flatter-spotlight-on",
        phaseName: "#9. 스포트라이트 점등",
      },
      // #10. 대상포켓몬 스포트라이트 조명 피크
      {
        ...baseFrame,
        delay: 130,
        moveStep: 2,
        blackFadeAlpha: 0.40,
        flatterSpotlight: { alpha: 1.0, time: 0.3 },
        phaseId: "flatter-spotlight-shine",
        phaseName: "#10. 대상포켓몬 스포트라이트 집중 조명",
      },
      // #11. 스포트라이트 조명 유지
      {
        ...baseFrame,
        delay: 110,
        moveStep: 2,
        blackFadeAlpha: 0.40,
        flatterSpotlight: { alpha: 0.95, time: 0.5 },
        phaseId: "flatter-spotlight-hold",
        phaseName: "#11. 스포트라이트 조명 유지",
      },
      // #12. 스포트라이트 페이드아웃
      {
        ...baseFrame,
        delay: 90,
        moveStep: 2,
        blackFadeAlpha: 0.20,
        flatterSpotlight: { alpha: 0.45, time: 0.7 },
        phaseId: "flatter-spotlight-fade",
        phaseName: "#12. 스포트라이트 페이드아웃",
      },
      // #13. 스포트라이트 완전히 걷힘 (조명 종료 & 암전 해제)
      {
        ...baseFrame,
        delay: 80,
        moveStep: 2,
        blackFadeAlpha: 0.0,
        flatterSpotlight: { alpha: 0.0, time: 0.9 },
        phaseId: "flatter-spotlight-cleared",
        phaseName: "#13. 스포트라이트 완전히 걷힘",
      },

      // [Part 2: 스포트라이트가 걷힌 후 혼란(Confusion) 돌입]
      // #14. 혼란 별무리 출현 & 우측 비틀림
      {
        ...baseFrame,
        delay: 85,
        moveStep: 2,
        confusionProgress: 0.22,
        ...tOff(3, 0),
        ...tRot(0.04),
        phaseId: "flatter-confuse-1",
        phaseName: "#14. 혼란 별무리 출현 & 우측 비틀림",
      },
      // #15. 별무리 3D 회전 & 좌측 비틀림
      {
        ...baseFrame,
        delay: 85,
        moveStep: 2,
        confusionProgress: 0.50,
        ...tOff(-3, 0),
        ...tRot(-0.04),
        phaseId: "flatter-confuse-2",
        phaseName: "#15. 별무리 3D 회전 & 좌측 비틀림",
      },
      // #16. 멍한 표정으로 비틀비틀
      {
        ...baseFrame,
        delay: 85,
        moveStep: 2,
        confusionProgress: 0.80,
        ...tOff(2, 0),
        ...tRot(0.03),
        phaseId: "flatter-confuse-3",
        phaseName: "#16. 멍한 표정으로 비틀비틀",
      },
      // #17. 별무리 2회전 통과 & 감속
      {
        ...baseFrame,
        delay: 85,
        moveStep: 2,
        confusionProgress: 1.05,
        ...tOff(-1, 0),
        ...tRot(-0.02),
        phaseId: "flatter-confuse-4",
        phaseName: "#17. 별무리 2회전 통과 & 감속",
      },
      // #18. 혼란 안착
      {
        ...baseFrame,
        delay: 90,
        moveStep: 2,
        confusionProgress: 1.22,
        ...tOff(0, 0),
        ...tRot(0),
        phaseId: "flatter-confuse-5",
        phaseName: "#18. 혼란 안착",
      },
      // #19. 연출 완료 및 원위치 복귀
      {
        ...baseFrame,
        delay: 70,
        moveStep: 2,
        confusionProgress: 0,
        ...tOff(0, 0),
        phaseId: "flatter-finish",
        phaseName: "#19. 연출 완료 및 원위치 복귀",
      },
    ];
  },
};
