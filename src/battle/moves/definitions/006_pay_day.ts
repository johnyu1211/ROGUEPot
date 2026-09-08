import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawPayDayEffect } from "../../../renderers/moves/gen1/move005_008.js";

export const payDayMove: BattleMoveAnimation = {
  num: 6,
  key: "pay-day",
  nameKo: "고양이돈받기",
  nameEn: "Pay Day",
  type: "normal",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;
    return [
      {
        delay: 150,
        pOffset: isP ? { x: 8, y: -4 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -8, y: 4 } : { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 1,
      },
      {
        delay: 180,
        pOffset: isP ? { x: 16, y: -6 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -16, y: 6 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: true,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 2,
      },
      {
        delay: 200,
        pOffset: isP ? { x: 20, y: -8 } : { x: -6, y: 3 },
        eOffset: isP ? { x: 0, y: 0 } : { x: -20, y: 8 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 3,
      },
      {
        delay: 160,
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
      drawPayDayEffect(targetCtx, drawCtx.targetPos, frame.moveStep ?? 2);
    }
  }
};
