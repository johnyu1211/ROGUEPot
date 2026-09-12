import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawSubmissionBehindEffect, drawSubmissionEffect } from "../../../renderers/moves/gen1/move065_068.js";

/**
 * 066: 지옥바퀴 (Submission)
 * - 사용자 요구사항:
 *   1. "상대포켓몬에게 붙음." (돌진 후 코앞 밀착 붙잡음)
 *   2. "다음 컷씬. 주황색 배경 중간부분만 살짝 흰" (주황 배경 + 중앙 순백 그라디언트 컷씬 전환)
 *   3. "상대포켓몬과 내 포켓몬이 붙어서 빙글빙글 돎 (바퀴의 모션블러가 생김)" (맞물린 360도 고속 회전 & 바퀴 모션블러)
 *   4. "상대 포켓몬과 함께 상대필드에 내리꽂기." (상대 플랫폼으로 급강하 수직 내리꽂기 대격돌 + 지면 충격파/먼지/스타버스트)
 *   5. "제자리로 돌아옴" (반동 공중 튀어오름 후 포물선 복귀 착지)
 */
export const submissionMove: BattleMoveAnimation = {
  num: 66,
  key: "submission",
  nameKo: "지옥바퀴",
  nameEn: "Submission",
  type: "fighting",
  category: "physical",
  camera: { type: "none" }, // 560x380 전체 전장 및 컷씬을 안정적으로 조망하며, 내리꽂기 시 cameraPan 셰이크 부여
  drawEffect: drawSubmissionEffect,
  drawBehindEffect: drawSubmissionBehindEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    // 빗맞았을 때 (Miss 처리)
    if (!isHit) {
      return [
        {
          ...baseFrame,
          delay: 110,
          pOffset: isP ? { x: 120, y: -70 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: -120, y: 35 } : { x: 0, y: 0 },
          pRot: isP ? -0.15 : undefined,
          eRot: !isP ? 0.15 : undefined,
          showEffect: false,
          phaseId: "submission-miss-rush",
          phaseName: "1. 돌진 빗나감",
        },
        {
          ...baseFrame,
          delay: 140,
          pOffset: isP ? { x: 170, y: -30 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: -170, y: 15 } : { x: 0, y: 0 },
          pRot: isP ? 0.25 : undefined,
          eRot: !isP ? -0.25 : undefined,
          showEffect: false,
          phaseId: "submission-miss-tumble",
          phaseName: "2. 허공 관통 헛스윙",
        },
        {
          ...baseFrame,
          delay: 100,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          pRot: 0,
          eRot: 0,
          showEffect: false,
          phaseId: "submission-miss-recover",
          phaseName: "3. 정위치 복귀",
        },
      ];
    }

    // 명중 시: 12프레임 완벽 구성
    return [
      // ----------------------------------------------------------------------
      // Phase 1: 상대 포켓몬에게 붙음 (Cling / Grapple Rush)
      // ----------------------------------------------------------------------
      // 1. [맹렬한 돌진 접근]: 시전자가 상대방을 향해 초고속 돌진 (90ms)
      {
        ...baseFrame,
        delay: 90,
        pOffset: isP ? { x: 130, y: -70 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -130, y: 35 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.10, y: 0.90 } : undefined,
        eScale: !isP ? { x: 1.10, y: 0.90 } : undefined,
        pRot: isP ? -0.15 : undefined,
        eRot: !isP ? 0.15 : undefined,
        showEffect: false,
        moveStep: 1,
        phaseId: "submission-rush",
        phaseName: "1. 상대 포켓몬을 향해 돌진 (90ms)",
      },

      // 2. [상대 포켓몬 밀착 (붙음)]: 상대 포켓몬 몸체에 착 달라붙어 꽉 붙잡음! (90ms)
      {
        ...baseFrame,
        delay: 90,
        pOffset: isP ? { x: 238, y: -128 } : (isHit ? { x: -6, y: 2 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -238, y: 128 } : (isHit ? { x: 6, y: -2 } : { x: 0, y: 0 }),
        pScale: isP ? { x: 0.95, y: 1.05 } : { x: 0.95, y: 1.05 },
        eScale: !isP ? { x: 0.95, y: 1.05 } : { x: 0.95, y: 1.05 },
        pRot: isP ? 0.08 : undefined,
        eRot: !isP ? -0.08 : undefined,
        showEffect: false,
        moveStep: 2,
        phaseId: "submission-cling",
        phaseName: "2. 상대 포켓몬 밀착 결착 (90ms)",
      },

      // ----------------------------------------------------------------------
      // Phase 2: 지옥바퀴 컷씬 (주황색 배경 중간 살짝 흰색 & 바퀴 모션블러 회전)
      // ----------------------------------------------------------------------
      // 3. [컷씬 진입 & 바퀴 회전 1단계 - 0도]:
      //    주황 배경(중간 흰색) 전개, 화면 중앙(280, 190)에서 두 포켓몬 맞물림 & 바퀴 모션블러 가동 (90ms)
      {
        ...baseFrame,
        delay: 90,
        submissionCutscene: true,
        wheelSpinAngle: 0,
        hideUI: true,
        hideHud: true,
        hideDialogue: true,
        hidePShadow: true,
        hideEShadow: true,
        pOffset: isP ? { x: 164, y: -90 } : { x: 96, y: -90 },
        eOffset: !isP ? { x: -104, y: 38 } : { x: -172, y: 38 },
        pRot: isP ? Math.PI * 0.5 : -Math.PI * 0.5,
        eRot: !isP ? Math.PI * 0.5 : -Math.PI * 0.5,
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: true,
        moveStep: 3,
        phaseId: "submission-wheel-spin-1",
        phaseName: "3. 컷씬 진입 [주황 배경] 바퀴 회전 0° (90ms)",
      },

      // 4. [바퀴 고속 회전 2단계 - 72도]: 회전 가속 및 바퀴 외곽 림 모션블러 호선 전개 (85ms)
      {
        ...baseFrame,
        delay: 85,
        submissionCutscene: true,
        wheelSpinAngle: Math.PI * 0.4,
        hideUI: true,
        hideHud: true,
        hideDialogue: true,
        hidePShadow: true,
        hideEShadow: true,
        pOffset: isP ? { x: 141, y: -58 } : { x: 119, y: -122 },
        eOffset: !isP ? { x: -127, y: 70 } : { x: -149, y: 6 },
        pRot: (isP ? Math.PI * 0.5 : -Math.PI * 0.5) + Math.PI * 0.4,
        eRot: (!isP ? Math.PI * 0.5 : -Math.PI * 0.5) + Math.PI * 0.4,
        showEffect: true,
        moveStep: 4,
        phaseId: "submission-wheel-spin-2",
        phaseName: "4. 바퀴 텀블링 회전 72° (85ms)",
      },

      // 5. [바퀴 최고속 회전 3단계 - 144도]: 맹렬한 스핀 & 바퀴 모션블러 잔상 극대화 (80ms)
      {
        ...baseFrame,
        delay: 80,
        submissionCutscene: true,
        wheelSpinAngle: Math.PI * 0.8,
        hideUI: true,
        hideHud: true,
        hideDialogue: true,
        hidePShadow: true,
        hideEShadow: true,
        pOffset: isP ? { x: 102, y: -70 } : { x: 158, y: -110 },
        eOffset: !isP ? { x: -166, y: 58 } : { x: -110, y: 18 },
        pRot: (isP ? Math.PI * 0.5 : -Math.PI * 0.5) + Math.PI * 0.8,
        eRot: (!isP ? Math.PI * 0.5 : -Math.PI * 0.5) + Math.PI * 0.8,
        showEffect: true,
        moveStep: 5,
        phaseId: "submission-wheel-spin-3",
        phaseName: "5. 바퀴 최고속 회전 144° (80ms)",
      },

      // 6. [바퀴 역동 회전 4단계 - 216도]: 반전 스핀 & 원심력 스파크 비산 (80ms)
      {
        ...baseFrame,
        delay: 80,
        submissionCutscene: true,
        wheelSpinAngle: Math.PI * 1.2,
        hideUI: true,
        hideHud: true,
        hideDialogue: true,
        hidePShadow: true,
        hideEShadow: true,
        pOffset: isP ? { x: 102, y: -110 } : { x: 158, y: -70 },
        eOffset: !isP ? { x: -166, y: 18 } : { x: -110, y: 58 },
        pRot: (isP ? Math.PI * 0.5 : -Math.PI * 0.5) + Math.PI * 1.2,
        eRot: (!isP ? Math.PI * 0.5 : -Math.PI * 0.5) + Math.PI * 1.2,
        showEffect: true,
        moveStep: 6,
        phaseId: "submission-wheel-spin-4",
        phaseName: "6. 바퀴 반전 회전 216° (80ms)",
      },

      // 7. [바퀴 원심력 폭발 5단계 - 288도]: 최고 원심력 도달 (85ms)
      {
        ...baseFrame,
        delay: 85,
        submissionCutscene: true,
        wheelSpinAngle: Math.PI * 1.6,
        hideUI: true,
        hideHud: true,
        hideDialogue: true,
        hidePShadow: true,
        hideEShadow: true,
        pOffset: isP ? { x: 141, y: -122 } : { x: 119, y: -58 },
        eOffset: !isP ? { x: -127, y: 6 } : { x: -149, y: 70 },
        pRot: (isP ? Math.PI * 0.5 : -Math.PI * 0.5) + Math.PI * 1.6,
        eRot: (!isP ? Math.PI * 0.5 : -Math.PI * 0.5) + Math.PI * 1.6,
        showEffect: true,
        moveStep: 7,
        phaseId: "submission-wheel-spin-5",
        phaseName: "7. 바퀴 원심력 폭발 288° (85ms)",
      },

      // 8. [바퀴 1회전 완성 6단계 - 360도]: 완벽한 360도 바퀴 회전 완성 & 내리꽂기 준비 (90ms)
      {
        ...baseFrame,
        delay: 90,
        submissionCutscene: true,
        wheelSpinAngle: Math.PI * 2.0,
        hideUI: true,
        hideHud: true,
        hideDialogue: true,
        hidePShadow: true,
        hideEShadow: true,
        pOffset: isP ? { x: 164, y: -90 } : { x: 96, y: -90 },
        eOffset: !isP ? { x: -104, y: 38 } : { x: -172, y: 38 },
        pRot: (isP ? Math.PI * 0.5 : -Math.PI * 0.5) + Math.PI * 2.0,
        eRot: (!isP ? Math.PI * 0.5 : -Math.PI * 0.5) + Math.PI * 2.0,
        showEffect: true,
        moveStep: 8,
        phaseId: "submission-wheel-spin-6",
        phaseName: "8. 바퀴 360° 회전 완성 (90ms)",
      },

      // ----------------------------------------------------------------------
      // Phase 3: 상대 포켓몬과 함께 상대필드에 내리꽂기
      // ----------------------------------------------------------------------
      // 9. [상대 필드 상공 급강하 (Dive)]: 배틀필드 복귀 & 상대 필드로 수직 곤두박질 급강하! (75ms)
      {
        ...baseFrame,
        delay: 75,
        submissionCutscene: false,
        hideUI: false,
        hideHud: false,
        hideDialogue: false,
        hidePShadow: false,
        hideEShadow: false,
        pOffset: isP ? { x: 268, y: -208 } : { x: 0, y: -80 },
        eOffset: !isP ? { x: -268, y: 48 } : { x: 0, y: -80 },
        pScale: { x: 0.85, y: 1.20 },
        eScale: { x: 0.85, y: 1.20 },
        pRot: isP ? 0.35 : -0.35,
        eRot: !isP ? 0.35 : -0.35,
        showEffect: true,
        moveStep: 9,
        phaseId: "submission-dive",
        phaseName: "9. 상대 필드 상공 수직 급강하 (75ms)",
      },

      // 10. [상대 필드 대격돌 내리꽂기 (Slam Impact!)]:
      //     상대 플랫폼에 쾅! 내리꽂힘! 지면 충격파 + 흙먼지 + 스타버스트 + 지진 셰이크 작렬 (160ms)
      {
        ...baseFrame,
        delay: 160,
        submissionCutscene: false,
        cameraPan: { x: 0, y: 10 }, // 묵직한 수직 지진 셰이크
        hitFlash: true,             // 1프레임 강력 타격 섬광
        pOffset: isP ? { x: 268, y: -128 } : { x: 0, y: 12 },
        eOffset: !isP ? { x: -268, y: 128 } : { x: 0, y: 12 },
        pScale: isP ? { x: 1.05, y: 0.95 } : { x: 1.35, y: 0.60 }, // 피격자는 바닥에 찌그러짐
        eScale: !isP ? { x: 1.05, y: 0.95 } : { x: 1.35, y: 0.60 }, // 피격자는 바닥에 찌그러짐
        pRot: 0,
        eRot: 0,
        showEffect: true,
        moveStep: 10,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        phaseId: "submission-slam-impact",
        phaseName: "10. 상대 필드 대격돌 내리꽂기 강타 (160ms)",
      },

      // ----------------------------------------------------------------------
      // Phase 4: 제자리로 돌아옴 (Rebound & Landing)
      // ----------------------------------------------------------------------
      // 11. [반동 공중 튀어오름]: 내리꽂은 반동으로 시전자가 공중으로 솟구쳐 오름 (100ms)
      {
        ...baseFrame,
        delay: 100,
        cameraPan: { x: 0, y: -3 },
        pOffset: isP ? { x: 160, y: -90 } : { x: -6, y: 4 },
        eOffset: !isP ? { x: -160, y: 70 } : { x: 6, y: 4 },
        pScale: isP ? { x: 0.95, y: 1.05 } : { x: 1.10, y: 0.90 },
        eScale: !isP ? { x: 0.95, y: 1.05 } : { x: 1.10, y: 0.90 },
        pRot: isP ? -0.20 : 0,
        eRot: !isP ? 0.20 : 0,
        showEffect: true,
        moveStep: 11,
        phaseId: "submission-rebound",
        phaseName: "11. 반동 공중 튀어오름 (100ms)",
      },

      // 12. [정위치 착지 및 복귀 완료]: 안정적 착지 스쿼시 및 정위치 안착 (95ms)
      {
        ...baseFrame,
        delay: 95,
        cameraPan: undefined,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: isP ? { x: 1.10, y: 0.90 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 1.10, y: 0.90 } : { x: 1.0, y: 1.0 },
        pRot: 0,
        eRot: 0,
        showEffect: false,
        moveStep: 12,
        phaseId: "submission-recover",
        phaseName: "12. 정위치 착지 복귀 (95ms)",
      },
    ];
  },
};
