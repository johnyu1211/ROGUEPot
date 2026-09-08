// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawWrapEffect } from "../../../renderers/moves/gen1/move033_036.js";

/**
 * 035: 김밥말이 (Wrap)
 * 
 * Concept:
 * - Caster coils and rolls around the target pokemon
 * - Target pokemon spins (flips front/back) as it gets rolled up in coils (돌돌 마는 연출)
 * - Tight constriction squeeze clamp followed by recoil
 */
export const wrapMove: BattleMoveAnimation = {
  num: 35,
  key: "wrap",
  nameKo: "김밥말이",
  nameEn: "Wrap",
  type: "normal",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, isMiss, action: a, enemyHp, playerHp, textLineIdx } = ctx;
    const miss = isMiss || !isHit;

    return [
      // 1. 접근 및 똬리 진입 (90ms)
      {
        delay: 90,
        pOffset: isP ? { x: 180, y: -65 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -180, y: 65 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.85, y: 0.85 } : undefined,
        eScale: !isP ? { x: 1.20, y: 1.20 } : undefined,
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 1,
        phaseId: "wrap-approach",
        phaseName: "1. 접근 및 똬리 진입",
      },
      // 2. 전면 회전 감기 (80ms)
      {
        delay: 80,
        pOffset: isP ? { x: 230, y: -75 } : (miss ? { x: 10, y: 2 } : { x: -5, y: 2 }),
        eOffset: !isP ? { x: -230, y: 75 } : (miss ? { x: 10, y: -2 } : { x: 5, y: -2 }),
        pScale: isP ? { x: 0.80, y: 0.80 } : undefined,
        eScale: !isP ? { x: 1.25, y: 1.25 } : undefined,
        pRot: isP ? -0.10 : undefined,
        eRot: !isP ? 0.10 : undefined,
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 2,
        phaseId: "wrap-roll-front",
        phaseName: "2. 전면 회전 감기",
      },
      // 3. 후면 회전 (80ms) - [유저 의도 반영: 돌돌 마는 기술이므로 피격자 뒤집힘]
      {
        delay: 80,
        pOffset: isP ? { x: 260, y: -90 } : (miss ? { x: 15, y: 3 } : { x: -8, y: 3 }),
        eOffset: !isP ? { x: -260, y: 90 } : (miss ? { x: 15, y: -3 } : { x: 8, y: -3 }),
        pScale: isP ? { x: 0.80, y: 0.80 } : undefined,
        eScale: !isP ? { x: 1.25, y: 1.25 } : undefined,
        pRot: isP ? 0.12 : undefined,
        eRot: !isP ? -0.12 : undefined,
        useEnemyBack: isP,       // 플레이어가 시전 시 적이 뒤로 돌아감!
        usePlayerFront: !isP,    // 적이 시전 시 플레이어가 뒤로 돌아감!
        drawEnemyOnTop: isP,
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 3,
        phaseId: "wrap-roll-back",
        phaseName: "3. 후면 회전 (돌돌 말림)",
      },
      // 4. 전신 압박 작렬 (160ms) - 강력한 압축 클램프 및 타격 이펙트
      {
        delay: 160,
        pOffset: isP ? { x: 240, y: -80 } : (miss ? { x: 20, y: 4 } : { x: -10, y: 4 }),
        eOffset: !isP ? { x: -240, y: 80 } : (miss ? { x: 20, y: -4 } : { x: 10, y: -4 }),
        pScale: isP ? { x: 0.85, y: 0.85 } : { x: 0.70, y: 1.35 },
        eScale: isP ? { x: 0.70, y: 1.35 } : { x: 1.30, y: 1.30 },
        pRot: 0,
        eRot: 0,
        useEnemyBack: false,
        usePlayerFront: false,
        drawEnemyOnTop: !isP,
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 4,
        phaseId: "wrap-constrict",
        phaseName: "4. 김밥말이 조이기 압박 작렬",
      },
      // 5. 펄스 조임 유지 (90ms)
      {
        delay: 90,
        pOffset: isP ? { x: 240, y: -80 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -240, y: 80 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.82, y: 0.82 } : { x: 0.85, y: 1.15 },
        eScale: isP ? { x: 0.85, y: 1.15 } : { x: 1.25, y: 1.25 },
        drawEnemyOnTop: !isP,
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 5,
        phaseId: "wrap-pulse",
        phaseName: "5. 펄스 압박 유지",
      },
      // 6. 반동 도약 복귀 (60ms)
      {
        delay: 60,
        pOffset: isP ? { x: 120, y: -50 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -120, y: 50 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 6,
        phaseId: "wrap-rebound",
        phaseName: "6. 반동 도약",
      },
      // 7. 제자리 착지 (80ms)
      {
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        phaseId: "recovery",
        phaseName: "7. 제자리 복귀",
      }
    ];
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (frame.showEffect && drawCtx.targetPos) {
      drawWrapEffect(targetCtx, drawCtx.targetPos, frame.moveStep ?? 1);
    }
  }
};
