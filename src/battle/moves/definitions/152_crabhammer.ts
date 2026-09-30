// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawCrabhammerEffect } from "../../../renderers/moves/gen1/move149_152.js";

/**
 * 152: 집게해머 (Crabhammer)
 *
 * 타입: 물 (Water)
 * 분류: 물리 (Physical)
 * 위력: 100 / 명중: 90 / PP: 10
 * 효과: 큰 집게를 상대에게 내리쳐서 공격한다. 급소에 맞기 쉽다.
 *
 * 연출 흐름:
 * 1. [기합 & 수압 응축]: 시전자가 뒤로 웅크려 힘을 모음 (moveStep: 1, 1.0x 전체 전장 조망)
 * 2. [도약 & 집게해머 치켜들기]: 시전자가 상공으로 도약하며 대상 포커싱 줌인 (1.34x),
 *    대상 상공에 거대한 붉은 갑각 집게발이 아쿠아 소용돌이를 두른 채 쩍 벌어짐 (moveStep: 2)
 * 3. [벼락같은 해머 스윙]: 집게발이 사선 아래로 맹렬하게 내리찍으며 궤적 격류 생성 (moveStep: 3)
 * 4. [쾅!! 타격 & 집게 맞물림]: 1프레임 백색 섬광, 피격 대상 납작 짓눌림, 집게가 "딱!" 맞물림
 * 5. [물보라 대폭발 & 비산]: 지면 충격파 + 거대한 물보라 왕관 기둥(Water Crown Geyser) 분출
 *    + 사방으로 튀는 13개 포물선 물방울 + 급소 보정 특유의 다이아몬드 크로스 스파크 (moveStep: 4)
 * 6. [피격자 탄성 넉백 & 착지 복귀]: 피격자 탄성 튕김 후 회복, 시전자 착지 복귀 (moveStep: 5)
 */
export const crabhammerMove: BattleMoveAnimation = {
  num: 152,
  key: "crabhammer",
  nameKo: "집게해머",
  nameEn: "Crabhammer",
  type: "water",
  category: "physical",
  camera: { type: "target", zoom: 1.34, delayUntilStep: 2 },
  drawEffect: drawCrabhammerEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.0,
      hitFlash: false,
    };

    // 시전자(c) 및 피격자(t) 위치/스케일 통합 헬퍼 (동기화 버그 100% 원천 차단)
    const makePos = (
      c: { x?: number; y?: number; sx?: number; sy?: number } = {},
      t: { x?: number; y?: number; sx?: number; sy?: number } = {}
    ) => {
      const cx = c.x ?? 0;
      const cy = c.y ?? 0;
      const csx = c.sx ?? 1.0;
      const csy = c.sy ?? 1.0;
      const tx = t.x ?? 0;
      const ty = t.y ?? 0;
      const tsx = t.sx ?? 1.0;
      const tsy = t.sy ?? 1.0;

      return {
        pOffset: isP ? { x: cx, y: cy } : { x: -tx, y: ty },
        eOffset: isP ? { x: tx, y: ty } : { x: -cx, y: -cy },
        pScale: isP
          ? (csx !== 1.0 || csy !== 1.0 ? { x: csx, y: csy } : undefined)
          : (tsx !== 1.0 || tsy !== 1.0 ? { x: tsx, y: tsy } : undefined),
        eScale: isP
          ? (tsx !== 1.0 || tsy !== 1.0 ? { x: tsx, y: tsy } : undefined)
          : (csx !== 1.0 || csy !== 1.0 ? { x: csx, y: csy } : undefined),
      };
    };

    // -------------------------------------------------------------
    // Miss인 경우 (!isHit):
    // 도약 -> 집게해머 치켜들기 -> 빗맞음 (상대 백스텝 회피) -> 바닥 물보라 -> 복귀
    // -------------------------------------------------------------
    if (!isHit) {
      return [
        // 1. 힘 모으기
        {
          ...baseFrame,
          delay: 75,
          ...makePos({ x: -6, y: 3, sx: 1.08, sy: 0.92 }, { x: 0, y: 0 }),
          showEffect: false,
          moveStep: 1,
          phaseId: "crabhammer-miss-ready",
          phaseName: "1. 기합 및 힘 모으기",
        },
        // 2. 도약 & 집게 치켜들기
        {
          ...baseFrame,
          delay: 80,
          ...makePos({ x: 18, y: -18, sx: 0.92, sy: 1.14 }, { x: 0, y: 0 }),
          showEffect: true,
          moveStep: 2,
          clawAlpha: 0.85,
          clawScale: 1.25,
          clawOpenAngle: 0.55,
          clawOffsetX: -16,
          clawOffsetY: -60,
          clawAngle: -0.55,
          phaseId: "crabhammer-miss-leap",
          phaseName: "2. 전방 도약 및 집게해머 준비",
        },
        // 3. 상대 백스텝 회피 & 빗나간 내리찍기
        {
          ...baseFrame,
          delay: 75,
          ...makePos({ x: 30, y: -4, sx: 1.15, sy: 0.88 }, { x: 16, y: -3, sx: 0.95, sy: 1.05 }),
          showEffect: true,
          moveStep: 3,
          clawAlpha: 0.85,
          clawScale: 1.35,
          clawOpenAngle: 0.0,
          clawOffsetX: -6,
          clawOffsetY: 8,
          clawAngle: 0.35,
          slamArcProgress: 0.85,
          slamArcAlpha: 0.80,
          impactProgress: 0.25,
          impactAlpha: 0.60,
          phaseId: "crabhammer-miss-dodge",
          phaseName: "3. 상대 회피 (빗나감)",
        },
        // 4. 바닥 텀벙 소산
        {
          ...baseFrame,
          delay: 80,
          ...makePos({ x: 14, y: 0, sx: 1.0, sy: 1.0 }, { x: 8, y: 0, sx: 1.0, sy: 1.0 }),
          showEffect: true,
          moveStep: 4,
          clawAlpha: 0.30,
          clawScale: 1.20,
          clawOpenAngle: 0.0,
          clawOffsetX: -6,
          clawOffsetY: 12,
          clawAngle: 0.35,
          impactProgress: 0.65,
          impactAlpha: 0.40,
          phaseId: "crabhammer-miss-splash",
          phaseName: "4. 바닥 헛치기 소산",
        },
        // 5. 정위치 복귀
        {
          ...baseFrame,
          delay: 60,
          ...makePos({ x: 0, y: 0 }, { x: 0, y: 0 }),
          showEffect: false,
          moveStep: 5,
          phaseId: "crabhammer-miss-complete",
          phaseName: "5. 원위치 복귀",
        },
      ];
    }

    // -------------------------------------------------------------
    // Hit인 경우 (isHit === true):
    // -------------------------------------------------------------
    return [
      // Frame 1: 기합 & 수압 축적 (시전 준비)
      {
        ...baseFrame,
        delay: 70,
        ...makePos({ x: -4, y: 2, sx: 1.05, sy: 0.95 }, { x: 0, y: 0 }),
        showEffect: false,
        moveStep: 1,
        phaseId: "crabhammer-charge-1",
        phaseName: "#1. 시전자 기합 및 수압 축적",
      },

      // Frame 2: 깊은 웅크림 (도약 추진력 축적)
      {
        ...baseFrame,
        delay: 75,
        ...makePos({ x: -8, y: 5, sx: 1.12, sy: 0.88 }, { x: 0, y: 0 }),
        showEffect: false,
        moveStep: 1,
        phaseId: "crabhammer-charge-2",
        phaseName: "#2. 추진력 축적 (웅크림)",
      },

      // Frame 3: 전방 고공 도약! (카메라 1.34x 줌인 글라이드인 개시)
      // 상공에 거대한 집게발 소환 페이드인 시작
      {
        ...baseFrame,
        delay: 80,
        ...makePos({ x: 16, y: -14, sx: 0.94, sy: 1.12 }, { x: 0, y: 0 }),
        showEffect: true,
        moveStep: 2,
        clawAlpha: 0.70,
        clawScale: 1.15,
        clawOpenAngle: 0.35,
        clawOffsetX: -22,
        clawOffsetY: -55,
        clawAngle: -0.45,
        phaseId: "crabhammer-leap-1",
        phaseName: "#3. 전방 도약 & 집게해머 페이드인",
      },

      // Frame 4: 도약 정점 & 집게해머 개방 (상공 치켜들기)
      // 집게발이 물의 소용돌이를 두르며 쩍 벌어짐 (openAngle: 0.70)
      {
        ...baseFrame,
        delay: 85,
        ...makePos({ x: 26, y: -22, sx: 0.90, sy: 1.16 }, { x: 0, y: 0 }),
        showEffect: true,
        moveStep: 2,
        clawAlpha: 1.0,
        clawScale: 1.35,
        clawOpenAngle: 0.70,
        clawOffsetX: -14,
        clawOffsetY: -68,
        clawAngle: -0.65,
        phaseId: "crabhammer-raise-peak",
        phaseName: "#4. 거대 집게해머 상공 치켜들기 (최대 개방)",
      },

      // Frame 5: 최고점 상공 (내리찍기 시작)
      {
        ...baseFrame,
        delay: 75,
        ...makePos({ x: 30, y: -18, sx: 0.92, sy: 1.12 }, { x: 0, y: 0 }),
        showEffect: true,
        moveStep: 2,
        slamArcProgress: 0.35,
        slamArcAlpha: 0.85,
        phaseId: "crabhammer-aim",
        phaseName: "#5. 상공에서 내리찍기 시작",
      },

      // Frame 6: 벼락같은 수직 내리찍기 강타! (SLAM!)
      {
        ...baseFrame,
        delay: 60,
        ...makePos({ x: 34, y: -6, sx: 1.15, sy: 0.88 }, { x: 0, y: 0 }),
        showEffect: true,
        moveStep: 3,
        slamArcProgress: 0.80,
        slamArcAlpha: 1.0,
        phaseId: "crabhammer-swing",
        phaseName: "#6. 위에서 아래로 내리찍는 강타",
      },

      // Frame 7: 💥 쾅!! 타격 직격 & 지면 물보라 분출 시작 (찌그러짐 유지 1/4)
      {
        ...baseFrame,
        delay: 75,
        ...makePos({ x: 36, y: -2, sx: 1.18, sy: 0.85 }, { x: 0, y: 8, sx: 1.50, sy: 0.52 }),
        hitFlash: true,
        showEffect: true,
        moveStep: 3,
        slamArcProgress: 1.0,
        slamArcAlpha: 0.70,
        impactProgress: 0.30,
        impactAlpha: 1.0,
        enemyHp: isP ? a.enemyHpAfter : enemyHp,
        playerHp: !isP ? a.playerHpAfter : playerHp,
        phaseId: "crabhammer-impact",
        phaseName: "#7. 쾅!! 지면 내리찍기 직격 & 찌그러짐 유지 1/4",
      },

      // Frame 8: 물보라 날개 확장 (찌그러짐 유지 2/4)
      {
        ...baseFrame,
        delay: 90,
        ...makePos({ x: 30, y: 0, sx: 1.08, sy: 0.94 }, { x: 0, y: 8, sx: 1.48, sy: 0.54 }),
        showEffect: true,
        moveStep: 4,
        slamArcProgress: 1.0,
        slamArcAlpha: 0.20,
        impactProgress: 0.65,
        impactAlpha: 1.0,
        enemyHp: isP ? a.enemyHpAfter : enemyHp,
        playerHp: !isP ? a.playerHpAfter : playerHp,
        phaseId: "crabhammer-geyser",
        phaseName: "#8. 물보라 확장 & 찌그러짐 유지 2/4",
      },

      // Frame 9: 💦 물보라 정점 (찌그러짐 유지 3/4)
      {
        ...baseFrame,
        delay: 95,
        ...makePos({ x: 18, y: 0, sx: 1.02, sy: 0.98 }, { x: -1, y: 8, sx: 1.45, sy: 0.56 }),
        showEffect: true,
        moveStep: 4,
        impactProgress: 0.85,
        impactAlpha: 0.85,
        enemyHp: isP ? a.enemyHpAfter : enemyHp,
        playerHp: !isP ? a.playerHpAfter : playerHp,
        phaseId: "crabhammer-plume-peak",
        phaseName: "#9. 물보라 정점 & 찌그러짐 유지 3/4",
      },

      // Frame 10: 🌧️ 물방울 낙하 & 수증기 확산 (찌그러짐 지속 4/4)
      {
        ...baseFrame,
        delay: 90,
        ...makePos({ x: 12, y: 0, sx: 1.0, sy: 1.0 }, { x: 0, y: 7, sx: 1.38, sy: 0.62 }),
        showEffect: true,
        moveStep: 4,
        impactProgress: 0.95,
        impactAlpha: 0.60,
        enemyHp: isP ? a.enemyHpAfter : enemyHp,
        playerHp: !isP ? a.playerHpAfter : playerHp,
        phaseId: "crabhammer-droplets-fall",
        phaseName: "#10. 수증기 확산 & 찌그러짐 유지 4/4",
      },

      // Frame 11: 🌊 피격자 탄성 반동 튕김 복귀
      {
        ...baseFrame,
        delay: 80,
        ...makePos({ x: 6, y: 0, sx: 1.0, sy: 1.0 }, { x: -2, y: -4, sx: 0.94, sy: 1.10 }),
        showEffect: true,
        moveStep: 4,
        impactProgress: 1.0,
        impactAlpha: 0.35,
        enemyHp: isP ? a.enemyHpAfter : enemyHp,
        playerHp: !isP ? a.playerHpAfter : playerHp,
        phaseId: "crabhammer-rebound",
        phaseName: "#11. 피격자 탄성 반동 튕김",
      },

      // Frame 12: 🌊 수면 파문 & 피격자 착지 안정화
      {
        ...baseFrame,
        delay: 75,
        ...makePos({ x: 2, y: 0, sx: 1.0, sy: 1.0 }, { x: 0, y: 0, sx: 1.0, sy: 1.0 }),
        showEffect: true,
        moveStep: 4,
        impactProgress: 1.0,
        impactAlpha: 0.20,
        enemyHp: isP ? a.enemyHpAfter : enemyHp,
        playerHp: !isP ? a.playerHpAfter : playerHp,
        phaseId: "crabhammer-ripple-fade",
        phaseName: "#12. 수면 파문 및 피격자 원위치 안정화",
      },

      // Frame 13: 🏁 시전자 착지 복귀 & 완료
      {
        ...baseFrame,
        delay: 65,
        ...makePos({ x: 0, y: 0, sx: 1.0, sy: 1.0 }, { x: 0, y: 0, sx: 1.0, sy: 1.0 }),
        showEffect: false,
        moveStep: 5,
        enemyHp: isP ? a.enemyHpAfter : enemyHp,
        playerHp: !isP ? a.playerHpAfter : playerHp,
        phaseId: "crabhammer-complete",
        phaseName: "#13. 시전자 착지 복귀 완료",
      },
    ];
  },
};
