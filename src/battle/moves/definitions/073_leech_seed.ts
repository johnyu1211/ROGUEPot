import { BattleFrame, BattleMoveAnimation, MoveContext } from "../types.js";
import {
  drawLeechSeedBehindEffect,
  drawLeechSeedEffect,
} from "../../../renderers/moves/gen1/move073_076.js";

/**
 * 073: 씨뿌리기 (Leech Seed)
 * 
 * 타입: 풀 (Grass)
 * 분류: 변화 (Status)
 * 위력: - / 명중: 90 / PP: 10
 * 
 * [연출 타임라인]:
 * Phase 1: 시전자 준비 및 3개의 갈색 콩 씨앗 포물선 순차 발사 (Frames 1~3, 약 270ms)
 * Phase 2: 적 몸체에 씨앗 3개 콕! 콕! 콕! 착탄 & 대상 가벼운 피격 진동 (Frame 4, 90ms)
 * Phase 3: 착탄된 씨앗에서 푸른 가시 덩굴이 몸체를 나선으로 휘감으며 급성장 (Frames 5~6, 200ms)
 * Phase 4: 덩굴 끝에서 에메랄드 새싹 잎사귀 만개 & 생명력 기생 오라 펄스 (Frames 7~8, 190ms)
 * Phase 5: 자세 원위치 복귀 (Frame 9, 80ms)
 */
export const leechSeedMove: BattleMoveAnimation = {
  num: 73,
  key: "leech-seed",
  nameKo: "씨뿌리기",
  nameEn: "Leech Seed",
  type: "grass",
  category: "status",
  camera: { type: "target", zoom: 1.30 },
  drawBehindEffect: drawLeechSeedBehindEffect,
  drawEffect: drawLeechSeedEffect,

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
          ...scl({ x: 1.05, y: 0.95 }, { x: 1.0, y: 1.0 }),
          seedFlightProgress: 0.20,
          seedAlpha: 1.0,
          vineProgress: 0,
          phaseId: "leech-seed-miss-1",
          phaseName: "1. 씨앗 발사 (85ms)",
        },
        {
          ...baseFrame,
          delay: 90,
          moveStep: 2,
          ...pos(
            casterBase,
            { x: targetBase.x, y: targetBase.y - 18 } // 대상 회피
          ),
          seedFlightProgress: 0.65,
          seedAlpha: 1.0,
          vineProgress: 0,
          phaseId: "leech-seed-miss-2",
          phaseName: "2. 대상 회피 (90ms)",
        },
        {
          ...baseFrame,
          delay: 85,
          moveStep: 3,
          ...pos(
            casterBase,
            { x: targetBase.x, y: targetBase.y - 4 }
          ),
          seedFlightProgress: 1.10,
          seedAlpha: 0.40,
          vineProgress: 0,
          phaseId: "leech-seed-miss-3",
          phaseName: "3. 씨앗 빗나감 (85ms)",
        },
        {
          ...baseFrame,
          delay: 80,
          moveStep: 4,
          ...pos(casterBase, targetBase),
          seedFlightProgress: 0,
          seedAlpha: 0,
          vineProgress: 0,
          phaseId: "leech-seed-miss-4",
          phaseName: "4. 복귀 (80ms)",
        },
      ];
    }

    // 명중 시 정규 연출 (총 9프레임, 약 810ms)
    return [
      // 1. [Phase 1: 시전자 기동 & 첫 번째 콩 씨앗 포물선 발사]
      {
        ...baseFrame,
        delay: 85,
        moveStep: 1,
        ...pos(
          { x: casterBase.x + dir * 6, y: casterBase.y - 2 },
          targetBase
        ),
        ...scl({ x: 1.06, y: 0.94 }, { x: 1.0, y: 1.0 }),
        dimAlpha: 0.05,
        seedFlightProgress: 0.22,
        seedAlpha: 1.0,
        vineProgress: 0,
        phaseId: "leech-seed-launch-1",
        phaseName: "1. 콩 씨앗 1차 사출 (85ms)",
      },

      // 2. [Phase 1: 2차/3차 콩 씨앗 연속 사출 & 상공 비행]
      {
        ...baseFrame,
        delay: 90,
        moveStep: 1,
        ...pos(
          { x: casterBase.x + dir * 4, y: casterBase.y - 1 },
          targetBase
        ),
        ...scl({ x: 1.03, y: 0.97 }, { x: 1.0, y: 1.0 }),
        dimAlpha: 0.08,
        seedFlightProgress: 0.52,
        seedAlpha: 1.0,
        vineProgress: 0,
        phaseId: "leech-seed-launch-2",
        phaseName: "2. 3개 콩 씨앗 포물선 비행 (90ms)",
      },

      // 3. [Phase 1: 대상 앞 쇄도]
      {
        ...baseFrame,
        delay: 90,
        moveStep: 2,
        ...pos(
          casterBase,
          { x: targetBase.x - dir * 1, y: targetBase.y }
        ),
        ...scl({ x: 1.0, y: 1.0 }, { x: 0.98, y: 1.02 }),
        dimAlpha: 0.08,
        seedFlightProgress: 0.82,
        seedAlpha: 1.0,
        vineProgress: 0,
        phaseId: "leech-seed-approach",
        phaseName: "3. 대상 면전 쇄도 (90ms)",
      },

      // 4. [Phase 2: 적 몸체에 3개 씨앗 콕! 착탄 & 피격 진동]
      {
        ...baseFrame,
        delay: 90,
        moveStep: 2,
        ...pos(
          casterBase,
          { x: targetBase.x - dir * 3, y: targetBase.y + 1 }
        ),
        ...scl({ x: 1.0, y: 1.0 }, { x: 1.04, y: 0.95 }),
        hitFlash: true,
        dimAlpha: 0.10,
        seedFlightProgress: 1.05,
        seedAlpha: 0.30,
        vineProgress: 0.12,
        vineAlpha: 1.0,
        phaseId: "leech-seed-plant",
        phaseName: "4. 씨앗 몸체 착탄 & 발아 시작 (90ms)",
      },

      // 5. [Phase 3: 착탄된 씨앗에서 덩굴 줄기 뻗어나옴]
      {
        ...baseFrame,
        delay: 95,
        moveStep: 3,
        ...pos(
          casterBase,
          { x: targetBase.x + dir * 1, y: targetBase.y - 1 }
        ),
        ...scl({ x: 1.0, y: 1.0 }, { x: 0.99, y: 1.01 }),
        dimAlpha: 0.10,
        seedFlightProgress: 0,
        seedAlpha: 0,
        vineProgress: 0.38,
        vineAlpha: 1.0,
        phaseId: "leech-seed-vines-1",
        phaseName: "5. 몸통 나선 덩굴 급성장 (95ms)",
      },

      // 6. [Phase 3: 덩굴이 몸통을 감싸며 잎사귀 분기 전개]
      {
        ...baseFrame,
        delay: 100,
        moveStep: 3,
        ...pos(casterBase, targetBase),
        ...scl({ x: 1.0, y: 1.0 }, { x: 1.0, y: 1.0 }),
        dimAlpha: 0.08,
        vineProgress: 0.68,
        vineAlpha: 1.0,
        phaseId: "leech-seed-vines-2",
        phaseName: "6. 전신 포위 덩굴 결착 (100ms)",
      },

      // 7. [Phase 4: 덩굴 끝에서 에메랄드 새싹 잎사귀 만개 & 기생 펄스]
      {
        ...baseFrame,
        delay: 100,
        moveStep: 3,
        ...pos(casterBase, targetBase),
        ...scl({ x: 1.0, y: 1.0 }, { x: 1.02, y: 0.98 }),
        dimAlpha: 0.06,
        vineProgress: 0.92,
        vineAlpha: 1.0,
        phaseId: "leech-seed-sprout",
        phaseName: "7. 새싹 잎사귀 만개 & 기생 펄스 (100ms)",
      },

      // 8. [Phase 4: 기생 완료 오라 잔향 & 페이드아웃]
      {
        ...baseFrame,
        delay: 90,
        moveStep: 4,
        ...pos(casterBase, targetBase),
        ...scl({ x: 1.0, y: 1.0 }, { x: 1.0, y: 1.0 }),
        dimAlpha: 0.02,
        vineProgress: 1.0,
        vineAlpha: 0.50,
        phaseId: "leech-seed-fade",
        phaseName: "8. 씨뿌리기 기생 완료 잔향 (90ms)",
      },

      // 9. [Phase 5: 원위치 중립 복귀]
      {
        ...baseFrame,
        delay: 80,
        moveStep: 4,
        ...pos(casterBase, targetBase),
        ...scl({ x: 1.0, y: 1.0 }, { x: 1.0, y: 1.0 }),
        dimAlpha: 0,
        vineProgress: 0,
        vineAlpha: 0,
        phaseId: "leech-seed-return",
        phaseName: "9. 중립 복귀 (80ms)",
      },
    ];
  },
};