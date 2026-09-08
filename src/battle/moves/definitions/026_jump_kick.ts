import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawJumpKickEffect } from "../../../renderers/moves/gen1/move025_028.js";

export const jumpKickMove: BattleMoveAnimation = {
  num: 26,
  key: "jump-kick",
  nameKo: "점프킥",
  nameEn: "Jump Kick",
  type: "fighting",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, isMiss, action: a, enemyHp, playerHp, textLineIdx } = ctx;
    return [
      // 1. High Jump Leap (80ms) - 빠른 상공 도약
      {
        delay: 80,
        pOffset: isP ? { x: 45, y: -70 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -45, y: 70 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.90, y: 1.15 } : undefined,
        eScale: !isP ? { x: 0.90, y: 1.15 } : undefined,
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 1,
        phaseId: "jump-kick-leap",
        phaseName: "1. 빠른 상공 도약",
      },
      // 2. Rapid Aerial Dive (70ms) - 상대를 향한 빠른 급강하 돌진
      {
        delay: 70,
        pOffset: isP ? { x: 155, y: -80 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -155, y: 80 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.35, y: 0.60 } : undefined,
        eScale: !isP ? { x: 1.35, y: 0.60 } : undefined,
        pRot: isP ? -0.22 : undefined,
        eRot: !isP ? 0.22 : undefined,
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 1,
        phaseId: "jump-kick-dive",
        phaseName: "2. 급강하 돌진",
      },
      // 3. Direct Contact Strike on Target - 통! (110ms) - [유저 요구사항] 관통 통과하지 않고 적 포켓몬에 직격 타격!
      {
        delay: 110,
        pOffset: isP ? { x: 230, y: -95 } : (isHit ? { x: -12, y: 5 } : { x: 0, y: 0 }),
        eOffset: isP ? (isHit ? { x: 22, y: -8 } : { x: 0, y: 0 }) : { x: -230, y: 95 },
        pScale: isP ? { x: 1.20, y: 0.80 } : undefined,
        eScale: !isP ? { x: 1.20, y: 0.80 } : undefined,
        pRot: isP ? -0.16 : undefined,
        eRot: !isP ? 0.16 : undefined,
        showEffect: true,
        hitFlash: isHit,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 2,
        phaseId: "jump-kick-hit",
        phaseName: "3. 적 포켓몬 타격 (통!)",
      },
      // 4. Rebound Arc Off Target (100ms) - [유저 요구사항] 적 포켓몬 치고 1회 튕겨져서 공중 반동
      {
        delay: 100,
        pOffset: isP ? { x: 95, y: -45 } : (isHit ? { x: 10, y: -3 } : { x: 0, y: 0 }),
        eOffset: isP ? (isHit ? { x: 10, y: -3 } : { x: 0, y: 0 }) : { x: -95, y: 45 },
        pScale: isP ? { x: 0.95, y: 1.10 } : undefined,
        eScale: !isP ? { x: 0.95, y: 1.10 } : undefined,
        pRot: isP ? 0.12 : undefined,
        eRot: !isP ? -0.12 : undefined,
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 3,
        phaseId: "jump-kick-rebound",
        phaseName: "4. 1회 반동 튕겨짐",
      },
      // 5. Clean Touchdown on Platform (80ms) - 제자리 착지
      {
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: isP ? { x: 1.12, y: 0.88 } : undefined,
        eScale: !isP ? { x: 1.12, y: 0.88 } : undefined,
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        phaseId: "jump-kick-land",
        phaseName: "5. 제자리 착지",
      },
      // 6. Return to Neutral Stance (100ms) - 정위치 복귀
      {
        delay: 100,
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
        phaseName: "6. 정위치 복귀",
      }
    ];
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (frame.showEffect && drawCtx.targetPos) {
      drawJumpKickEffect(targetCtx, drawCtx.targetPos, frame.moveStep ?? 2, drawCtx.isPlayer);
    }
  }
};
