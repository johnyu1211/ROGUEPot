import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawDoubleKickEffect } from "../../../renderers/moves/gen1/move021_024.js";

export const doubleKickMove: BattleMoveAnimation = {
  num: 24,
  key: "double-kick",
  nameKo: "두번치기",
  nameEn: "Double Kick",
  type: "fighting",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;
    return [
      // Windup lunge
      {
        delay: 140,
        pOffset: isP ? { x: 14, y: -6 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -14, y: 6 } : { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 1,
      },
      // Kick 1: Impact & star burst
      {
        delay: 150,
        pOffset: isP ? { x: 26, y: -10 } : { x: -6, y: 3 },
        eOffset: isP ? { x: 0, y: 0 } : { x: -26, y: 10 },
        showEffect: true,
        hitFlash: true,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 2,
      },
      // Pivot transition between kicks
      {
        delay: 120,
        pOffset: isP ? { x: 18, y: -7 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -18, y: 7 } : { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 3,
      },
      // Kick 2: Impact & star burst
      {
        delay: 160,
        pOffset: isP ? { x: 30, y: -12 } : { x: -8, y: 4 },
        eOffset: isP ? { x: 0, y: 0 } : { x: -30, y: 12 },
        showEffect: true,
        hitFlash: true,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 4,
      },
      // Recovery
      {
        delay: 140,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
      }
    ];
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (frame.showEffect && drawCtx.targetPos) {
      drawDoubleKickEffect(targetCtx, drawCtx.attackerPos || { x: 135, y: 285 }, drawCtx.targetPos, frame.moveStep ?? 2);
    }
  }
};
