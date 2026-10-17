import { BattleFrame, BattleMoveAnimation, MoveContext } from "../types.js";
import {
  drawGigaDrainBehindEffect,
  drawGigaDrainEffect,
} from "../../../renderers/moves/gen1/move201_204.js";

/**
 * 202: 기가드레인 (Giga Drain)
 * 
 * 타입: 풀 (Grass)
 * 분류: 특수 (Special)
 * 위력: 75 / 명중: 100 / PP: 10
 * 
 * [연출 특징]:
 * - 메가드레인(Mega Drain)을 한층 뛰어넘는 풀 타입 최강의 생명력 강탈 기술
 * - 묵직한 심록색 암전 연출과 함께 대상 내부에서 거대한 생명력 폭풍 추출
 * - 13개의 대형 에메랄드/라임/민트 발광 기가 모트가 대상 스프라이트 z축 아래에서 시전자에게로 광폭 나선 호를 그리며 쇄도
 * - 4중 고속 잔상 트레일 및 대상 위치의 흡수 볼텍스 링
 * - 시전자 체내 도달 시 발밑 생명력 만개 오라 + 3중 팽창 펄스 링과 함께 회전하며 치솟아오르는 12개의 대형 십자 별빛 & 크리스탈 스파클
 */
export const gigaDrainMove: BattleMoveAnimation = {
  num: 202,
  key: "giga-drain",
  nameKo: "기가드레인",
  nameEn: "Giga Drain",
  type: "grass",
  category: "special",
  camera: { type: "none" },
  drawBehindEffect: drawGigaDrainBehindEffect,
  drawEffect: drawGigaDrainEffect,

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
          dimAlpha: 0.10,
          drainProgress: 0.10,
          drainAlpha: 0.80,
          healAlpha: 0,
          phaseId: "giga-drain-miss-1",
          phaseName: "1. 기가 에너지 추출 시도 (85ms)",
        },
        {
          ...baseFrame,
          delay: 90,
          moveStep: 2,
          ...pos(
            casterBase,
            { x: targetBase.x, y: targetBase.y - 20 }
          ),
          dimAlpha: 0.18,
          drainProgress: 0.35,
          drainAlpha: 0.70,
          healAlpha: 0,
          phaseId: "giga-drain-miss-2",
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
          drainProgress: 0.55,
          drainAlpha: 0.20,
          healAlpha: 0,
          phaseId: "giga-drain-miss-3",
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
          phaseId: "giga-drain-miss-4",
          phaseName: "4. 복귀 (80ms)",
        },
      ];
    }

    // 명중 시 정규 연출 (총 12프레임, 약 1045ms)
    // 1~4: 생명력 추출 & 13개 기가 모트 사출 및 시전자 체내 전면 흡수
    // 5~6: [유저 요구사항] 흡수 완료 후 발밑 단일 두꺼운 가로 링 퍼지기 및 소멸
    // 7~11: [유저 요구사항] 가로 링 퍼지기 끝나고 나서 'HP회복' 회복부분(Step 2 나선 회복별) 재생
    // 12: HP 회복 완료 및 중립 복귀
    return [
      // 1. [Phase 1: 화면 묵직한 심록빛 암전 & 거대 생명력 응축 시작]
      {
        ...baseFrame,
        delay: 85,
        moveStep: 1,
        ...pos(
          casterBase,
          { x: targetBase.x + dir * 2, y: targetBase.y }
        ),
        ...scl({ x: 1.0, y: 1.0 }, { x: 0.96, y: 1.04 }),
        dimAlpha: 0.16,
        drainProgress: 0.10,
        drainAlpha: 0.95,
        ringAlpha: 0,
        recoverAlpha: 0,
        phaseId: "giga-drain-gather",
        phaseName: "1. 묵직한 암록색 암전 & 생명력 추출 태동 (85ms)",
      },

      // 2. [Phase 2: 대상 생명력 추출 & 선두 기가 모트 사출]
      {
        ...baseFrame,
        delay: 90,
        moveStep: 2,
        ...pos(
          { x: casterBase.x - dir * 2, y: casterBase.y },
          { x: targetBase.x - dir * 3, y: targetBase.y + 1 }
        ),
        ...scl({ x: 1.0, y: 1.0 }, { x: 1.03, y: 0.96 }),
        hitFlash: true,
        dimAlpha: 0.28,
        drainProgress: 0.35,
        drainAlpha: 1.0,
        ringAlpha: 0,
        recoverAlpha: 0,
        phaseId: "giga-drain-extract-launch",
        phaseName: "2. 대상 생명력 추출 & 1차 궤도 사출 (90ms)",
      },

      // 3. [Phase 2: 13개 기가 모트 전개 및 광폭 나선 비행]
      {
        ...baseFrame,
        delay: 95,
        moveStep: 2,
        ...pos(
          { x: casterBase.x - dir * 1, y: casterBase.y },
          { x: targetBase.x + dir * 2, y: targetBase.y - 1 }
        ),
        ...scl({ x: 1.01, y: 1.0 }, { x: 0.97, y: 1.02 }),
        dimAlpha: 0.35,
        drainProgress: 0.70,
        drainAlpha: 1.0,
        ringAlpha: 0,
        recoverAlpha: 0,
        phaseId: "giga-drain-spiral-surge",
        phaseName: "3. 13개 기가 모트 광폭 나선 궤도 쇄도 (95ms)",
      },

      // 4. [Phase 2: 전장 가로질러 시전자 면전 도달 & 체내 전면 흡수 완료]
      {
        ...baseFrame,
        delay: 90,
        moveStep: 2,
        ...pos(
          casterBase,
          { x: targetBase.x - dir * 1, y: targetBase.y }
        ),
        ...scl({ x: 1.03, y: 1.02 }, { x: 1.0, y: 1.0 }),
        dimAlpha: 0.32,
        drainProgress: 1.0,
        drainAlpha: 0.85,
        ringAlpha: 0,
        recoverAlpha: 0,
        phaseId: "giga-drain-storm-crossing",
        phaseName: "4. 시전자 체내 기가 에너지 흡수 완료 (90ms)",
      },

      // 5. [Phase 3: 가로 링 퍼지기 1단계 - 발밑 단일 대형 두꺼운 링 팽창 시작]
      {
        ...baseFrame,
        delay: 90,
        moveStep: 3,
        ...pos(
          { x: casterBase.x, y: casterBase.y - 2 },
          targetBase
        ),
        ...scl({ x: 1.04, y: 1.03 }, { x: 1.0, y: 1.0 }),
        dimAlpha: 0.28,
        drainProgress: 1.0,
        drainAlpha: 0.0,
        ringProgress: 0.40,
        ringAlpha: 1.0,
        recoverProgress: 0,
        recoverAlpha: 0,
        phaseId: "giga-drain-ring-spread-1",
        phaseName: "5. 발밑 가로 링 팽창 시작 (90ms)",
      },

      // 6. [Phase 3: 가로 링 퍼지기 2단계 - 외곽 광폭 확산 및 소멸 완료]
      {
        ...baseFrame,
        delay: 90,
        moveStep: 3,
        ...pos(
          { x: casterBase.x, y: casterBase.y - 4 },
          targetBase
        ),
        ...scl({ x: 1.07, y: 1.05 }, { x: 1.0, y: 1.0 }),
        dimAlpha: 0.22,
        drainProgress: 1.0,
        drainAlpha: 0.0,
        ringProgress: 1.0,
        ringAlpha: 0.85,
        recoverProgress: 0,
        recoverAlpha: 0,
        phaseId: "giga-drain-ring-spread-2",
        phaseName: "6. 가로 링 외곽 확산 및 소멸 (90ms)",
      },

      // 7. [Phase 3: 가로 링 퍼지기 완료 후 'HP회복' 회복부분 시작 - 1번 회복별 발밑 출현 & 상승]
      {
        ...baseFrame,
        delay: 85,
        moveStep: 3,
        ...pos(
          { x: casterBase.x, y: casterBase.y - 3 },
          targetBase
        ),
        ...scl({ x: 1.05, y: 1.04 }, { x: 1.0, y: 1.0 }),
        dimAlpha: 0.18,
        drainProgress: 1.0,
        drainAlpha: 0.0,
        ringProgress: 0,
        ringAlpha: 0,
        recoverProgress: 0.10,
        recoverAlpha: 1.0,
        phaseId: "giga-drain-recover-stars-1",
        phaseName: "7. 링 소멸 후 1번 회복별 출현 (85ms)",
      },

      // 8. [Phase 3: 2번 회복별 출현 & 1번 별 나선 선회]
      {
        ...baseFrame,
        delay: 85,
        moveStep: 3,
        ...pos(
          { x: casterBase.x, y: casterBase.y - 4 },
          targetBase
        ),
        ...scl({ x: 1.07, y: 1.05 }, { x: 1.0, y: 1.0 }),
        dimAlpha: 0.14,
        drainProgress: 1.0,
        drainAlpha: 0.0,
        ringProgress: 0,
        ringAlpha: 0,
        recoverProgress: 0.28,
        recoverAlpha: 1.0,
        phaseId: "giga-drain-recover-stars-2",
        phaseName: "8. 2번 회복별 출현 & 1번 별 나선 선회 (85ms)",
      },

      // 9. [Phase 3: 3번 회복별 출현 & 순차 나선 비상]
      {
        ...baseFrame,
        delay: 85,
        moveStep: 3,
        ...pos(
          { x: casterBase.x, y: casterBase.y - 3 },
          targetBase
        ),
        ...scl({ x: 1.05, y: 1.04 }, { x: 1.0, y: 1.0 }),
        dimAlpha: 0.10,
        drainProgress: 1.0,
        drainAlpha: 0.0,
        ringProgress: 0,
        ringAlpha: 0,
        recoverProgress: 0.48,
        recoverAlpha: 1.0,
        phaseId: "giga-drain-recover-stars-3",
        phaseName: "9. 3번 회복별 출현 & 순차 나선 비상 (85ms)",
      },

      // 10. [Phase 3: 4번 회복별 출현 & 선행 별 상공 페이드]
      {
        ...baseFrame,
        delay: 85,
        moveStep: 3,
        ...pos(
          { x: casterBase.x, y: casterBase.y - 2 },
          targetBase
        ),
        ...scl({ x: 1.03, y: 1.02 }, { x: 1.0, y: 1.0 }),
        dimAlpha: 0.06,
        drainProgress: 1.0,
        drainAlpha: 0.0,
        ringProgress: 0,
        ringAlpha: 0,
        recoverProgress: 0.68,
        recoverAlpha: 1.0,
        phaseId: "giga-drain-recover-stars-4",
        phaseName: "10. 4번 회복별 출현 & 선행 별 상공 페이드 (85ms)",
      },

      // 11. [Phase 3: 잔여 회복별들 순차적 승화 소멸]
      {
        ...baseFrame,
        delay: 85,
        moveStep: 3,
        ...pos(
          { x: casterBase.x, y: casterBase.y - 1 },
          targetBase
        ),
        ...scl({ x: 1.01, y: 1.01 }, { x: 1.0, y: 1.0 }),
        dimAlpha: 0.03,
        drainProgress: 1.0,
        drainAlpha: 0.0,
        ringProgress: 0,
        ringAlpha: 0,
        recoverProgress: 0.88,
        recoverAlpha: 0.70,
        phaseId: "giga-drain-recover-stars-fading",
        phaseName: "11. 잔여 회복별 순차 승화 소멸 (85ms)",
      },

      // 12. [Phase 4: HP 회복 완료 및 중립 자세 완전 복귀]
      {
        ...baseFrame,
        delay: 80,
        moveStep: 4,
        ...pos(casterBase, targetBase),
        ...scl({ x: 1.0, y: 1.0 }, { x: 1.0, y: 1.0 }),
        dimAlpha: 0.0,
        drainProgress: 0,
        drainAlpha: 0.0,
        ringProgress: 0,
        ringAlpha: 0,
        recoverProgress: 1.0,
        recoverAlpha: 0.0,
        phaseId: "giga-drain-return",
        phaseName: "12. HP 회복 완료 및 중립 복귀 (80ms)",
      },
    ];
  },
};
