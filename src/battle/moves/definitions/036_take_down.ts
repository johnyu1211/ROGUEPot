// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawTakeDownEffect } from "../../../renderers/moves/gen1/move033_036.js";

/**
 * 036: 돌진 (Take Down)
 * 
 * Concept:
 * - Caster slightly steps backward (windup / charging momentum)
 * - Rushes forward with heavy body tackle impact (몸통박치기)
 * - Impact effect: High-energy ORANGE shockwaves and burst lines (#F97316 / #EA580C)
 * - Camera glides back to neutral view
 * - Caster blinks twice and flinches as recoil damage is applied!
 */
export const takeDownMove: BattleMoveAnimation = {
  num: 36,
  key: "take-down",
  nameKo: "돌진",
  nameEn: "Take Down",
  type: "normal",
  category: "physical",
  camera: { type: "target", zoom: 1.30 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    return [
      // 1. 시전 포켓몬 살짝 후진 (도약 / 힘 모으기 준비 동작)
      {
        delay: 130,
        pOffset: isP ? { x: -14, y: 5 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 14, y: -5 } : { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 1,
        phaseId: "takedown-windup",
        phaseName: "1. 돌진 도움닫기 후진",
      },
      // 2. 몸통박치기 초고속 돌진 & 강한 충격 (주황색 충격 이펙트 작렬!)
      {
        delay: 160,
        pOffset: isP ? { x: 32, y: -13 } : (isHit ? { x: -10, y: 4 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -32, y: 13 } : (isHit ? { x: 10, y: -4 } : { x: 0, y: 0 }),
        showEffect: isHit,
        hitFlash: isHit,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 2,
        phaseId: "takedown-impact",
        phaseName: "2. 돌진 몸통박치기 타격 (주황 이펙트)",
      },
      // 3. 반동 복귀 바운스 (돌진 반동 데미지 모멘텀)
      {
        delay: 120,
        pOffset: isP ? { x: 14, y: -5 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -14, y: 5 } : { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 3,
        phaseId: "takedown-recoil",
        phaseName: "3. 반동 반출",
      },
      // 4. 원래 위치로 복귀
      {
        delay: 100,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 4,
        phaseId: "takedown-finish",
        phaseName: "4. 복귀 완료",
      },

      // --- [유저 요구사항] 카메라 원상태 복귀 후 시전 포켓몬 반동 데미지 2회 깜빡임! ---
      // 5. 반동 데미지 발생 & 깜빡임 1 (80ms) - 시전 포켓몬 HP 감소 & 투명도 0.20
      {
        delay: 80,
        afterCameraReturn: true,
        pOffset: isP ? { x: -6, y: 2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 6, y: -2 } : { x: 0, y: 0 },
        pAlpha: isP ? 0.20 : 1.0,
        eAlpha: !isP ? 0.20 : 1.0,
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        phaseId: "takedown-recoil-blink-1",
        phaseName: "5. 반동 데미지 피격 (깜빡임 1)",
      },
      // 6. 반동 데미지 복귀 1 (80ms) - 투명도 1.0
      {
        delay: 80,
        afterCameraReturn: true,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pAlpha: 1.0,
        eAlpha: 1.0,
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        phaseId: "takedown-recoil-hold-1",
        phaseName: "6. 반동 데미지 (유지 1)",
      },
      // 7. 반동 데미지 깜빡임 2 (80ms) - 투명도 0.20
      {
        delay: 80,
        afterCameraReturn: true,
        pOffset: isP ? { x: -4, y: 1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 4, y: -1 } : { x: 0, y: 0 },
        pAlpha: isP ? 0.20 : 1.0,
        eAlpha: !isP ? 0.20 : 1.0,
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        phaseId: "takedown-recoil-blink-2",
        phaseName: "7. 반동 데미지 피격 (깜빡임 2)",
      },
      // 8. 반동 완료 및 정위치 복귀 (100ms) - 투명도 1.0 정상
      {
        delay: 100,
        afterCameraReturn: true,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pAlpha: 1.0,
        eAlpha: 1.0,
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        phaseId: "recovery",
        phaseName: "8. 정위치 복귀",
      },
    ];
  },
  drawEffect: (ctx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawTakeDownEffect(ctx, frame, drawCtx);
  },
};
