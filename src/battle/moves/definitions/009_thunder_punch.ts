import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawThunderPunchEffect } from "../../../renderers/moves/gen1/move009_012.js";

export const thunderPunchMove: BattleMoveAnimation = {
  num: 9,
  key: "thunder-punch",
  nameKo: "번개펀치",
  nameEn: "Thunder Punch",
  type: "electric",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;
    return [
      {
        delay: 140,
        pOffset: isP ? { x: -10, y: 4 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 10, y: -4 } : { x: 0, y: 0 },
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
        pOffset: isP ? { x: -16, y: 6 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 16, y: -6 } : { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 2,
      },
      {
        delay: 240,
        pOffset: isP ? { x: 32, y: -12 } : { x: -10, y: 5 },
        eOffset: isP ? { x: 0, y: 0 } : { x: -32, y: 12 },
        showEffect: true,
        hitFlash: true,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 3,
      },
      {
        delay: 160,
        pOffset: isP ? { x: 20, y: -8 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -20, y: 8 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 4,
      },
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
      drawThunderPunchEffect(targetCtx, drawCtx.targetPos, frame.moveStep ?? 3);
    }
  }
};
