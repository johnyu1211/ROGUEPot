// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawPinMissileEffect } from "../../../renderers/moves/gen1/move041_044.js";

/**
 * 042: 바늘미사일 (Pin Missile / 미사일침)
 * 
 * Concept:
 * - 마구찌르기(Fury Attack)의 공식 아이보리 뿔 에셋 재사용 (Slender Ivory Horn Missile)
 * - 시전 포켓몬이 앞으로 살짝 돌진하며(단계별 전진 대시) 4발 연속 발사
 * - 1발째 발사 ➔ 1발째 타격 & 2발째 발사 ➔ 2발째 타격 & 3발째 발사 ➔ 3발째 타격 & 4발째 발사 ➔ 4발째 피니시 격돌!
 */
export const pinMissileMove: BattleMoveAnimation = {
  num: 42,
  key: "pin-missile",
  nameKo: "바늘미사일",
  nameEn: "Pin Missile",
  type: "bug",
  category: "physical",
  camera: { type: "target", zoom: 1.25 },
  drawEffect: drawPinMissileEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    return [
      // 1. 1발째 발사 (머즐 플래시 & 22% 비행) - 시전자 돌진 시작
      {
        delay: 85,
        pOffset: isP ? { x: 10, y: -4 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -10, y: 4 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 1,
        phaseId: "pin-missile-1-fire",
        phaseName: "1. 1발째 바늘미사일 발사 (머즐 플래시)",
      },
      // 2. 1발째 고속 쇄도 비행 (82% 비행)
      {
        delay: 85,
        pOffset: isP ? { x: 14, y: -5 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -14, y: 5 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 2,
        phaseId: "pin-missile-1-fly",
        phaseName: "2. 1발째 고속 쇄도 비행",
      },
      // 3. 1발째 타격 & 2발째 발사
      {
        delay: 95,
        pOffset: isP ? { x: 18, y: -7 } : (isHit ? { x: -5, y: 2 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -18, y: 7 } : (isHit ? { x: 5, y: -2 } : { x: 0, y: 0 }),
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 3,
        phaseId: "pin-missile-2-fire",
        phaseName: "3. 1발째 타격 & 2발째 발사",
      },
      // 4. 2발째 고속 쇄도 비행 (82% 비행)
      {
        delay: 85,
        pOffset: isP ? { x: 21, y: -8 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -21, y: 8 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 4,
        phaseId: "pin-missile-2-fly",
        phaseName: "4. 2발째 고속 쇄도 비행",
      },
      // 5. 2발째 타격 & 3발째 발사
      {
        delay: 95,
        pOffset: isP ? { x: 24, y: -9 } : (isHit ? { x: 6, y: -3 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -24, y: 9 } : (isHit ? { x: -6, y: 3 } : { x: 0, y: 0 }),
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 5,
        phaseId: "pin-missile-3-fire",
        phaseName: "5. 2발째 타격 & 3발째 발사",
      },
      // 6. 3발째 고속 쇄도 비행 (82% 비행)
      {
        delay: 85,
        pOffset: isP ? { x: 27, y: -10 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -27, y: 10 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 6,
        phaseId: "pin-missile-3-fly",
        phaseName: "6. 3발째 고속 쇄도 비행",
      },
      // 7. 3발째 타격 & 4발째 피니시 발사
      {
        delay: 95,
        pOffset: isP ? { x: 30, y: -12 } : (isHit ? { x: -7, y: 4 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -30, y: 12 } : (isHit ? { x: 7, y: -4 } : { x: 0, y: 0 }),
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 7,
        phaseId: "pin-missile-4-fire",
        phaseName: "7. 3발째 타격 & 4발째 피니시 발사",
      },
      // 8. 4발째 피니시 고속 쇄도 비행 (85% 비행)
      {
        delay: 85,
        pOffset: isP ? { x: 28, y: -11 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -28, y: 11 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 8,
        phaseId: "pin-missile-4-fly",
        phaseName: "8. 4발째 피니시 고속 쇄도 비행",
      },
      // 9. 4발째 피니시 관통 격돌! (피격 플래시 & 강력한 피격 반동)
      {
        delay: 150,
        pOffset: isP ? { x: 25, y: -9 } : (isHit ? { x: 12, y: -6 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -25, y: 9 } : (isHit ? { x: -12, y: 6 } : { x: 0, y: 0 }),
        showEffect: true,
        hitFlash: isHit,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpAfter ?? playerHp) : playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 9,
        phaseId: "pin-missile-5-hit",
        phaseName: "9. 4발째 피니시 관통 격돌 (4연타 완료)",
      },
      // 10. 복귀 완료
      {
        delay: 110,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpAfter ?? playerHp) : playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 10,
        phaseId: "pin-missile-finish",
        phaseName: "10. 복귀 완료",
      },
    ];
  }
};
