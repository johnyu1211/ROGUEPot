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

    const cOff = (x: number, y: number) =>
      isP ? { pOffset: { x, y } } : { eOffset: { x: -x, y: -y } };

    const cTargetOff = (x: number, y: number) =>
      isP ? { eOffset: { x, y } } : { pOffset: { x: -x, y: -y } };

    const cTransform = (scaleX: number, scaleY: number, rot: number) => ({
      pScale: isP ? { x: scaleX, y: scaleY } : undefined,
      eScale: !isP ? { x: scaleX, y: scaleY } : undefined,
      pRot: isP ? rot : 0,
      eRot: !isP ? -rot : 0,
    });

    return [
      // 1. 시전 포켓몬 후방 크라우칭 도움닫기 (최대 탄성 축적)
      {
        delay: 110,
        ...cOff(-16, 6),
        ...cTargetOff(0, 0),
        ...cTransform(1.14, 0.86, -0.08),
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
      // 2. 전방 고속 돌진 쇄도 (가속 스트레치)
      {
        delay: 80,
        ...cOff(48, -18),
        ...cTargetOff(0, 0),
        ...cTransform(0.86, 1.18, 0.12),
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 1,
        phaseId: "takedown-dash",
        phaseName: "2. 전방 고속 돌진 쇄도",
      },
      // 3. 정면 대격돌 직격 (오렌지 스타버스트 섬광 & 피격 플래시)
      {
        delay: 75,
        ...cOff(68, -25),
        ...(isHit ? cTargetOff(10, -4) : cTargetOff(0, 0)),
        ...cTransform(1.20, 0.84, 0.04),
        showEffect: isHit,
        hitFlash: isHit,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 2,
        effectProgress: 0.20,
        phaseId: "takedown-impact-hit",
        phaseName: "3. 돌진 대격돌 직격 (오렌지 스타버스트)",
      },
      // 4. 충격 폭발 & 최대 넉백 (오렌지 충격파 링 확산 & 별빛 스파크 비산)
      {
        delay: 85,
        ...cOff(72, -26),
        ...(isHit ? cTargetOff(18, -7) : cTargetOff(0, 0)),
        ...cTransform(1.16, 0.86, 0.02),
        showEffect: isHit,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 2,
        effectProgress: 0.70,
        phaseId: "takedown-impact-burst",
        phaseName: "4. 충격 폭발 & 넉백 전개",
      },
      // 5. 충돌 반동 및 잔향 (반작용으로 튕겨 나오며 충격파 소멸)
      {
        delay: 95,
        ...cOff(24, -9),
        ...(isHit ? cTargetOff(6, -2) : cTargetOff(0, 0)),
        ...cTransform(0.95, 1.05, 0),
        showEffect: isHit,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 3,
        effectProgress: 1.0,
        phaseId: "takedown-recoil",
        phaseName: "5. 반동 반출",
      },
      // 6. 원래 위치로 복귀
      {
        delay: 80,
        ...cOff(0, 0),
        ...cTargetOff(0, 0),
        ...cTransform(1.0, 1.0, 0),
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 4,
        phaseId: "takedown-finish",
        phaseName: "6. 복귀 완료",
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
