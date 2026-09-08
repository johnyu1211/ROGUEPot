// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawTwineedleEffect } from "../../../renderers/moves/gen1/move041_044.js";

/**
 * 041: 더블니들 (Twineedle)
 * 
 * Concept:
 * - 뿔찌르기(Horn Attack) 공식 검수 황금빛/아이보리 뿔 에셋 재사용
 * - 2개의 뿔이 직선 나란히(side-by-side parallel) 정렬되어 고속 쇄도
 * - 2중 뿔 동시 관통 타격 (좌우 2중 타격 스파크) ➔ 2타 연속 타격감 구현
 */
export const twineedleMove: BattleMoveAnimation = {
  num: 41,
  key: "twineedle",
  nameKo: "더블니들",
  nameEn: "Twineedle",
  type: "bug",
  category: "physical",
  camera: { type: "target", zoom: 1.25 },
  drawEffect: drawTwineedleEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    return [
      // 1. 발사 준비 (더블니들 조준 & 2중 뿔 장전)
      {
        delay: 110,
        pOffset: isP ? { x: -8, y: 3 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 8, y: -3 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.10, y: 0.90 } : undefined,
        eScale: !isP ? { x: 1.10, y: 0.90 } : undefined,
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 1,
        phaseId: "twineedle-aim",
        phaseName: "1. 더블니들 조준 & 2중 뿔 장전",
      },
      // 2. 발사 1: 장전된 2개의 뿔이 직선 나란히 고속 사출 (35% 비행)
      {
        delay: 90,
        pOffset: isP ? { x: 16, y: -6 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -16, y: 6 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.92, y: 1.08 } : undefined,
        eScale: !isP ? { x: 0.92, y: 1.08 } : undefined,
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 2,
        effectProgress: 0.35,
        phaseId: "twineedle-fly1",
        phaseName: "2. 2중 뿔 직선 나란히 고속 사출 (35% 비행)",
      },
      // 3. 발사 2: 2개의 뿔이 나란히 상대방 앞까지 직선 쇄도 (78% 비행)
      {
        delay: 90,
        pOffset: isP ? { x: 6, y: -2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -6, y: 2 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 2,
        effectProgress: 0.78,
        phaseId: "twineedle-fly2",
        phaseName: "3. 2중 뿔 목표 쇄도 (78% 비행)",
      },
      // 4. 1차 관통 타격 (1타): 2개의 뿔이 상대방 좌우에 동시 관통 격돌!
      {
        delay: 140,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: -12, y: 5 } : { x: 12, y: -5 }) : { x: 0, y: 0 },
        showEffect: isHit,
        hitFlash: isHit,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 3,
        effectProgress: 1.0,
        phaseId: "twineedle-hit1",
        phaseName: "4. 2중 뿔 동시 관통 격돌 (1타)",
      },
      // 5. 2차 연속 타격 진동 & 관통 잔향 (2타)
      {
        delay: 130,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: 6, y: -2 } : { x: -6, y: 2 }) : { x: 0, y: 0 },
        showEffect: isHit,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 4,
        phaseId: "twineedle-hit2",
        phaseName: "5. 연속 타격 진동 & 관통 잔향 (2타)",
      },
      // 6. 복귀 완료
      {
        delay: 90,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 1,
        phaseId: "twineedle-finish",
        phaseName: "6. 복귀 완료",
      },
    ];
  }
};
