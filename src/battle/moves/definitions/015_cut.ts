import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawCutEffect } from "../../../renderers/moves/gen1/move013_016.js";

export const cutMove: BattleMoveAnimation = {
  num: 15,
  key: "cut",
  nameKo: "풀베기",
  nameEn: "Cut",
  type: "normal",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;
    return [
      {
        delay: 130,
        pOffset: isP ? { x: 12, y: -5 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -12, y: 5 } : { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
      },
      {
        delay: 240,
        pOffset: isP ? { x: 26, y: -10 } : { x: -8, y: 4 },
        eOffset: isP ? { x: 0, y: 0 } : { x: -26, y: 10 },
        showEffect: true,
        hitFlash: true,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
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
      drawCutEffect(targetCtx, drawCtx.targetPos, frame.moveStep ?? 1);
    }
  }
};
