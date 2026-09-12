import { BattleFrame, BattleMoveAnimation, MoveContext } from "../types.js";
import {
  drawMegaDrainBehindEffect,
  drawMegaDrainEffect,
} from "../../../renderers/moves/gen1/move069_072.js";

/**
 * 072: 메가드레인 (Mega Drain)
 * 
 * 타입: 풀 (Grass)
 * 분류: 특수 (Special)
 * 위력: 40 / 명중: 100 / PP: 15
 * 
 * [연출 특징]:
 * - 흡수(Absorb)의 상위 호환으로, 보다 묵직한 암전 연출
 * - 8개의 에메랄드/라임 발광 에너지 모트가 대상 스프라이트 z축 아래에서 시전자에게로 큰 곡선 호를 그리며 쇄도
 * - 시전자 체내 도달 시 발밑 2중 팽창 펄스 링과 함께 회전하며 솟구치는 7개의 십자 별빛 치유 이펙트
 */
export const megaDrainMove: BattleMoveAnimation = {
  num: 72,
  key: "mega-drain",
  nameKo: "메가드레인",
  nameEn: "Mega Drain",
  type: "grass",
  category: "special",
  camera: { type: "none" },
  drawBehindEffect: drawMegaDrainBehindEffect,
  drawEffect: drawMegaDrainEffect,

  buildFrames: (context: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = context;
    const dir = isP ? 1 : -1;

    // 절대 기준 좌표 (560x380 기준)
    const pm = { x: 150, y: 280 };
    const em = { x: 418, y: 152 };

    const casterBase = isP ? pm : em;
    const targetBase = isP ? em : pm;

    const pos = (casterPos: { x: number; y: number }, targetPos: { x: number; y: number }) => {
      if (isP) {
        return {
          pOffset: { x: Math.round(casterPos.x - pm.x), y: Math.round(casterPos.y - pm.y) },
          eOffset: { x: Math.round(targetPos.x - em.x), y: Math.round(targetPos.y - em.y) },
        };
      } else {
        return {
          pOffset: { x: Math.round(targetPos.x - pm.x), y: Math.round(targetPos.y - pm.y) },
          eOffset: { x: Math.round(casterPos.x - em.x), y: Math.round(casterPos.y - em.y) },
        };
      }
    };

    const scl = (casterScale?: { x: number; y: number }, targetScale?: { x: number; y: number }) => ({
      pScale: isP ? casterScale : targetScale,
      eScale: !isP ? casterScale : targetScale,
    });

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
      pScale: { x: 1, y: 1 },
      eScale: { x: 1, y: 1 },
      pRot: 0,
      eRot: 0,
      hidePShadow: false,
      hideEShadow: false,
      showEffect: true,
      pRedTint: false,
      eRedTint: false,
    };

    // 빗맞았을 때 (Miss)
    if (!isHit) {
      return [
        {
          ...baseFrame,
          delay: 85,
          moveStep: 1,
          ...pos(casterBase, targetBase),
          dimAlpha: 0.08,
          drainProgress: 0.10,
          drainAlpha: 0.75,
          healAlpha: 0,
          phaseId: "mega-drain-miss-1",
          phaseName: "1. 메가 에너지 추출 시도 (85ms)",
        },
        {
          ...baseFrame,
          delay: 90,
          moveStep: 2,
          ...pos(
            casterBase,
            { x: targetBase.x, y: targetBase.y - 18 }
          ),
          dimAlpha: 0.15,
          drainProgress: 0.32,
          drainAlpha: 0.65,
          healAlpha: 0,
          phaseId: "mega-drain-miss-2",
          phaseName: "2. 대상 회피 (90ms)",
        },
        {
          ...baseFrame,
          delay: 90,
          moveStep: 3,
          ...pos(
            casterBase,
            { x: targetBase.x, y: targetBase.y - 4 }
          ),
          dimAlpha: 0.06,
          drainProgress: 0.50,
          drainAlpha: 0.25,
          healAlpha: 0,
          phaseId: "mega-drain-miss-3",
          phaseName: "3. 에너지 소산 (90ms)",
        },
        {
          ...baseFrame,
          delay: 80,
          moveStep: 4,
          ...pos(casterBase, targetBase),
          dimAlpha: 0,
          drainProgress: 0,
          drainAlpha: 0,
          healAlpha: 0,
          phaseId: "mega-drain-miss-4",
          phaseName: "4. 복귀 (80ms)",
        },
      ];
    }

    // 명중 시 정규 연출 (총 9프레임, 약 820ms)
    return [
      // 1. [Phase 1: 화면 묵직한 암전 & 거대 생명력 응축 시작]
      {
        ...baseFrame,
        delay: 85,
        moveStep: 1,
        ...pos(
          casterBase,
          { x: targetBase.x + dir * 2, y: targetBase.y }
        ),
        ...scl({ x: 1.0, y: 1.0 }, { x: 0.97, y: 1.03 }),
        dimAlpha: 0.12,
        drainProgress: 0.08,
        drainAlpha: 0.90,
        healAlpha: 0,
        phaseId: "mega-drain-gather",
        phaseName: "1. 묵직한 암전 & 대상 생명력 추출 태동 (85ms)",
      },

      // 2. [Phase 2: 대상 피격 진동 & 선두 에메랄드 모트 사출]
      {
        ...baseFrame,
        delay: 90,
        moveStep: 2,
        ...pos(
          { x: casterBase.x - dir * 2, y: casterBase.y },
          { x: targetBase.x - dir * 4, y: targetBase.y + 2 }
        ),
        ...scl({ x: 1.0, y: 1.0 }, { x: 1.05, y: 0.93 }),
        hitFlash: true,
        dimAlpha: 0.22,
        drainProgress: 0.26,
        drainAlpha: 1.0,
        healAlpha: 0,
        phaseId: "mega-drain-launch-1",
        phaseName: "2. 대상 강타 피격 & 1차 궤도 사출 (90ms)",
      },

      // 3. [Phase 2: 8개 에메랄드 모트 전개 및 폭넓은 나선 비행]
      {
        ...baseFrame,
        delay: 95,
        moveStep: 2,
        ...pos(
          { x: casterBase.x - dir * 1, y: casterBase.y },
          { x: targetBase.x + dir * 2, y: targetBase.y - 1 }
        ),
        ...scl({ x: 1.01, y: 1.0 }, { x: 0.98, y: 1.02 }),
        dimAlpha: 0.28,
        drainProgress: 0.48,
        drainAlpha: 1.0,
        healAlpha: 0,
        phaseId: "mega-drain-arc-flight",
        phaseName: "3. 8개 에메랄드 모트 광폭 곡선 쇄도 (95ms)",
      },

      // 4. [Phase 2: 전장 가로질러 시전자 전방 도달]
      {
        ...baseFrame,
        delay: 95,
        moveStep: 2,
        ...pos(
          casterBase,
          { x: targetBase.x - dir * 1, y: targetBase.y }
        ),
        ...scl({ x: 1.02, y: 1.01 }, { x: 1.0, y: 1.0 }),
        dimAlpha: 0.28,
        drainProgress: 0.70,
        drainAlpha: 1.0,
        healAlpha: 0.20,
        healProgress: 0.20,
        phaseId: "mega-drain-approach",
        phaseName: "4. 시전자 면전 도달 & 흡수 시작 (95ms)",
      },

      // 5. [Phase 3: 시전자 체내 쇄도 흡수 & 1차 펄스 링 팽창]
      {
        ...baseFrame,
        delay: 95,
        moveStep: 3,
        ...pos(
          { x: casterBase.x, y: casterBase.y - 3 },
          targetBase
        ),
        ...scl({ x: 1.05, y: 1.03 }, { x: 1.0, y: 1.0 }),
        dimAlpha: 0.24,
        drainProgress: 0.90,
        drainAlpha: 1.0,
        healAlpha: 0.65,
        healProgress: 0.50,
        phaseId: "mega-drain-pulse-1",
        phaseName: "5. 시전자 체내 전면 흡수 & 1차 펄스 링 (95ms)",
      },

      // 6. [Phase 3: 거대 생명력 체내 결착 & 2차 펄스 링 및 별빛 솟구침]
      {
        ...baseFrame,
        delay: 100,
        moveStep: 3,
        ...pos(
          { x: casterBase.x, y: casterBase.y - 5 },
          targetBase
        ),
        ...scl({ x: 1.08, y: 1.06 }, { x: 1.0, y: 1.0 }),
        dimAlpha: 0.18,
        drainProgress: 1.0,
        drainAlpha: 0.60,
        healAlpha: 1.0,
        healProgress: 0.85,
        phaseId: "mega-drain-pulse-2",
        phaseName: "6. 2차 외곽 펄스 링 팽창 & 십자 별빛 상승 (100ms)",
      },

      // 7. [Phase 3: 치유 정점 & 7개 에메랄드 스파클 만개]
      {
        ...baseFrame,
        delay: 95,
        moveStep: 3,
        ...pos(
          { x: casterBase.x, y: casterBase.y - 3 },
          targetBase
        ),
        ...scl({ x: 1.05, y: 1.04 }, { x: 1.0, y: 1.0 }),
        dimAlpha: 0.12,
        drainProgress: 1.0,
        drainAlpha: 0.0,
        healAlpha: 0.90,
        healProgress: 1.15,
        phaseId: "mega-drain-sparkle-burst",
        phaseName: "7. 치유 정점 별빛 만개 (95ms)",
      },

      // 8. [Phase 4: 치유 잔향 & 암전 서서히 해제]
      {
        ...baseFrame,
        delay: 85,
        moveStep: 4,
        ...pos(
          { x: casterBase.x, y: casterBase.y - 1 },
          targetBase
        ),
        ...scl({ x: 1.02, y: 1.01 }, { x: 1.0, y: 1.0 }),
        dimAlpha: 0.05,
        drainProgress: 1.0,
        drainAlpha: 0.0,
        healAlpha: 0.40,
        healProgress: 1.40,
        phaseId: "mega-drain-fade",
        phaseName: "8. 치유 잔향 & 암전 페이드아웃 (85ms)",
      },

      // 9. [Phase 4: 중립 자세 완전 복귀]
      {
        ...baseFrame,
        delay: 80,
        moveStep: 4,
        ...pos(casterBase, targetBase),
        ...scl({ x: 1.0, y: 1.0 }, { x: 1.0, y: 1.0 }),
        dimAlpha: 0.0,
        drainProgress: 0,
        drainAlpha: 0.0,
        healAlpha: 0.0,
        healProgress: 0.0,
        phaseId: "mega-drain-return",
        phaseName: "9. 중립 복귀 완료 (80ms)",
      },
    ];
  },
};