// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawBiteMoveEffect } from "../../../renderers/moves/gen1/move041_044.js";

/**
 * 044: 물기 (Bite)
 * 
 * Concept (유저 요청 100% 반영):
 * - 상하 턱 이빨 모양을 가로로 길고(112px), 위아래로는 얇고 날렵하게(20px) 리디자인
 * - 1. 시전자 돌진 준비 & 상대방 상하에 넓은 이빨 출현 (턱 벌어짐)
 * - 2. 이빨이 고속으로 닫히며 쇄도
 * - 3. 완전 교합 & 깨물기 강타 작렬 (타격 진동 & 스파크)
 * - 4. 교합 유지 & 2차 피격 진동 잔향
 * - 5. 이빨 소멸 & 잔향
 * - 6. 복귀 완료
 */
export const biteMove: BattleMoveAnimation = {
  num: 44,
  key: "bite",
  nameKo: "물기",
  nameEn: "Bite",
  type: "dark",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  drawEffect: drawBiteMoveEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    return [
      // 1. 시전자 돌진 준비 & 이빨 출현 (턱 벌어짐)
      {
        ...baseFrame,
        delay: 110,
        pOffset: isP ? { x: 8, y: -3 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -8, y: 3 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.05, y: 0.95 } : undefined,
        eScale: !isP ? { x: 1.05, y: 0.95 } : undefined,
        showEffect: true,
        moveStep: 1,
        phaseId: "bite-open",
        phaseName: "1. 이빨 전개 & 턱 벌어짐",
      },
      // 2. 고속 교합 쇄도
      {
        ...baseFrame,
        delay: 90,
        pOffset: isP ? { x: 18, y: -7 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -18, y: 7 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.95, y: 1.05 } : undefined,
        eScale: !isP ? { x: 0.95, y: 1.05 } : undefined,
        showEffect: true,
        moveStep: 2,
        phaseId: "bite-snap",
        phaseName: "2. 고속 교합 쇄도",
      },
      // 3. 완전 교합 & 깨물기 강타 작렬 (타격 진동 & 스파크)
      {
        ...baseFrame,
        delay: 150,
        pOffset: isP ? { x: 22, y: -8 } : { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: -8, y: 4 } : { x: 8, y: -4 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: isHit,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 3,
        phaseId: "bite-crunch",
        phaseName: "3. 완전 교합 & 깨물기 강타 작렬",
      },
      // 4. 교합 유지 & 2차 피격 진동 잔향
      {
        ...baseFrame,
        delay: 130,
        pOffset: isP ? { x: 12, y: -4 } : { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: 6, y: -3 } : { x: -6, y: 3 }) : { x: 0, y: 0 },
        showEffect: true,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 4,
        phaseId: "bite-hold",
        phaseName: "4. 교합 유지 & 2차 피격 진동",
      },
      // 5. 이빨 소멸 & 잔향
      {
        ...baseFrame,
        delay: 100,
        pOffset: isP ? { x: 4, y: -1 } : { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 5,
        phaseId: "bite-fade",
        phaseName: "5. 이빨 소멸 & 잔향",
      },
      // 6. 복귀 완료
      {
        ...baseFrame,
        delay: 100,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "bite-finish",
        phaseName: "6. 복귀 완료",
      },
    ];
  },
};
