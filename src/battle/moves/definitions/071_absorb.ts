import { BattleFrame, BattleMoveAnimation, MoveContext } from "../types.js";
import {
  drawAbsorbBehindEffect,
  drawAbsorbEffect,
} from "../../../renderers/moves/gen1/move069_072.js";

/**
 * 071: 흡수 (Absorb)
 * 
 * 타입: 풀 (Grass)
 * 분류: 특수 (Special)
 * 위력: 20 / 명중: 100 / PP: 25
 * 
 * [유저 요청 사항]:
 * - 화면 살짝 어두워지고 (이때 필터 안잘리게 주의)
 * - 초록색 빛나는 점 몇 개가 대상 스프라이트 z축 아래에서 내 포켓몬에게로 이동 (약간 바깥쪽으로 곡선으로 이동함)
 * 
 * [타임라인 연출]:
 * Phase 1: 화면 은은한 암전 & 대상체 내부에서 생명력 에너지 추출 태동 (Frame 1, 85ms)
 * Phase 2: 대상체 피격 진동 & z축 아래에서 초록빛 발광 점들이 바깥쪽 완만한 호를 그리며 시전자에게 쇄도 (Frames 2~4, 280ms)
 * Phase 3: 시전자 체내로 생명력 흡수 & 발밑 치유 펄스 링 및 상승 에메랄드 스파클 전개 (Frames 5~6, 195ms)
 * Phase 4: 암전 해제 및 중립 기본 스탠스 복귀 (Frames 7~8, 170ms)
 */
export const absorbMove: BattleMoveAnimation = {
  num: 71,
  key: "absorb",
  nameKo: "흡수",
  nameEn: "Absorb",
  type: "grass",
  category: "special",
  camera: { type: "none" },
  drawBehindEffect: drawAbsorbBehindEffect,
  drawEffect: drawAbsorbEffect,

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

    // 빗맞았을 때 (Miss 처리)
    if (!isHit) {
      return [
        {
          ...baseFrame,
          delay: 85,
          moveStep: 1,
          ...pos(casterBase, targetBase),
          dimAlpha: 0.06,
          drainProgress: 0.08,
          drainAlpha: 0.70,
          healAlpha: 0,
          phaseId: "absorb-miss-1",
          phaseName: "1. 에너지 추출 시도 (85ms)",
        },
        {
          ...baseFrame,
          delay: 90,
          moveStep: 2,
          ...pos(
            casterBase,
            { x: targetBase.x, y: targetBase.y - 16 } // 대상 회피 도약
          ),
          dimAlpha: 0.12,
          drainProgress: 0.28,
          drainAlpha: 0.60,
          healAlpha: 0,
          phaseId: "absorb-miss-2",
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
          dimAlpha: 0.05,
          drainProgress: 0.45,
          drainAlpha: 0.20, // 흩어지며 소멸
          healAlpha: 0,
          phaseId: "absorb-miss-3",
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
          phaseId: "absorb-miss-4",
          phaseName: "4. 복귀 (80ms)",
        },
      ];
    }

    // 명중 시 정규 애니메이션 (총 8프레임, 약 730ms)
    return [
      // 1. [Phase 1: 화면 암전 & 에너지 추출 태동]:
      // 화면이 은은하게 어두워지며 대상 z축 아래에서 첫 에너지 점 응축 (85ms)
      {
        ...baseFrame,
        delay: 85,
        moveStep: 1,
        ...pos(
          casterBase,
          { x: targetBase.x + dir * 2, y: targetBase.y }
        ),
        ...scl({ x: 1.0, y: 1.0 }, { x: 0.98, y: 1.02 }),
        dimAlpha: 0.08,
        drainProgress: 0.08,
        drainAlpha: 0.85,
        healAlpha: 0,
        phaseId: "absorb-start",
        phaseName: "1. 화면 암전 & 에너지 추출 태동 (85ms)",
      },

      // 2. [Phase 2: 대상 피격 & 곡선 사출 개시]:
      // 대상 피격 진동, 첫 번째/두 번째 초록빛 점이 바깥쪽 곡선으로 사출 시작 (90ms)
      {
        ...baseFrame,
        delay: 90,
        moveStep: 2,
        ...pos(
          { x: casterBase.x - dir * 2, y: casterBase.y },
          { x: targetBase.x - dir * 3, y: targetBase.y + 1 }
        ),
        ...scl({ x: 1.0, y: 1.0 }, { x: 1.04, y: 0.94 }),
        hitFlash: true,
        dimAlpha: 0.16,
        drainProgress: 0.28,
        drainAlpha: 1.0,
        healAlpha: 0,
        phaseId: "absorb-launch",
        phaseName: "2. 대상 피격 & 곡선 사출 개시 (90ms)",
      },

      // 3. [Phase 2: 유기적 외곽 곡선 비행]:
      // 5개의 초록색 빛나는 점들이 화면을 가로질러 바깥쪽으로 완만하게 휘어지며 비행 (95ms)
      {
        ...baseFrame,
        delay: 95,
        moveStep: 2,
        ...pos(
          { x: casterBase.x - dir * 1, y: casterBase.y },
          { x: targetBase.x + dir * 1, y: targetBase.y - 1 }
        ),
        ...scl({ x: 1.01, y: 1.0 }, { x: 0.99, y: 1.01 }),
        dimAlpha: 0.22,
        drainProgress: 0.52,
        drainAlpha: 1.0,
        healAlpha: 0,
        phaseId: "absorb-arc-flight",
        phaseName: "3. 외곽 곡선 궤적 비행 (95ms)",
      },

      // 4. [Phase 2~3: 시전자 접근 & 선두 점 흡수 개시]:
      // 선두 에너지 점이 시전자 몸속으로 흡수되기 시작하며 시전자 치유 반응 태동 (95ms)
      {
        ...baseFrame,
        delay: 95,
        moveStep: 3,
        ...pos(
          { x: casterBase.x, y: casterBase.y - 2 },
          targetBase
        ),
        ...scl({ x: 1.03, y: 1.02 }, { x: 1.0, y: 1.0 }),
        dimAlpha: 0.22,
        drainProgress: 0.76,
        drainAlpha: 1.0,
        healAlpha: 0.45,
        healProgress: 0.35,
        phaseId: "absorb-absorb-start",
        phaseName: "4. 시전자 도달 & 흡수 시작 (95ms)",
      },

      // 5. [Phase 3: 전 에너지 체내 흡수 & 치유 오라 전개]:
      // 후속 에너지 점들이 시전자에게 완전히 도달, 시전자 발밑 펄스 링 팽창 (95ms)
      {
        ...baseFrame,
        delay: 95,
        moveStep: 3,
        ...pos(
          { x: casterBase.x, y: casterBase.y - 4 },
          targetBase
        ),
        ...scl({ x: 1.06, y: 1.05 }, { x: 1.0, y: 1.0 }),
        dimAlpha: 0.16,
        drainProgress: 0.96,
        drainAlpha: 0.90,
        healAlpha: 0.85,
        healProgress: 0.70,
        phaseId: "absorb-pulse",
        phaseName: "5. 치유 오라 펄스 팽창 (95ms)",
      },

      // 6. [Phase 3: 치유 정점 & 에메랄드 스파클 비산]:
      // 시전자 몸 위로 반짝이는 생명력 십자 별빛들이 솟아오름 (100ms)
      {
        ...baseFrame,
        delay: 100,
        moveStep: 3,
        ...pos(
          { x: casterBase.x, y: casterBase.y - 2 },
          targetBase
        ),
        ...scl({ x: 1.04, y: 1.03 }, { x: 1.0, y: 1.0 }),
        dimAlpha: 0.10,
        drainProgress: 1.0,
        drainAlpha: 0.0,
        healAlpha: 1.0,
        healProgress: 1.0,
        phaseId: "absorb-sparkle-burst",
        phaseName: "6. 치유 별빛 스파클 비산 (100ms)",
      },

      // 7. [Phase 4: 치유 잔향 & 화면 명도 회복]:
      // 스파클이 은은하게 감쇠하며 화면 암전이 걷힘 (90ms)
      {
        ...baseFrame,
        delay: 90,
        moveStep: 4,
        ...pos(
          { x: casterBase.x, y: casterBase.y - 1 },
          targetBase
        ),
        ...scl({ x: 1.01, y: 1.0 }, { x: 1.0, y: 1.0 }),
        dimAlpha: 0.04,
        drainProgress: 1.0,
        drainAlpha: 0.0,
        healAlpha: 0.40,
        healProgress: 1.25,
        phaseId: "absorb-fade",
        phaseName: "7. 치유 잔향 & 암전 해제 (90ms)",
      },

      // 8. [Phase 4: 원위치 중립 복귀]:
      // 모든 이펙트 종료 및 완전한 평상 스탠스 복귀 (80ms)
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
        phaseId: "absorb-return",
        phaseName: "8. 중립 복귀 (80ms)",
      },
    ];
  },
};
