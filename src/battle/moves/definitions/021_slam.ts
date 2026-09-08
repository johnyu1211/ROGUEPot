import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawSlamEffect } from "../../../renderers/moves/gen1/move021_024.js";

export const slamMove: BattleMoveAnimation = {
  num: 21,
  key: "slam",
  nameKo: "힘껏치기",
  nameEn: "Slam",
  type: "normal",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;
    return [
      {
        delay: 150,
        pOffset: isP ? { x: -16, y: 6 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 16, y: -6 } : { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 1,
      },
      {
        delay: 260,
        pOffset: isP ? { x: 38, y: -14 } : { x: -12, y: 5 },
        eOffset: isP ? { x: 0, y: 0 } : { x: -38, y: 14 },
        showEffect: true,
        hitFlash: true,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 2,
      },
      {
        delay: 180,
        pOffset: isP ? { x: 24, y: -8 } : { x: -6, y: 3 },
        eOffset: isP ? { x: 0, y: 0 } : { x: -24, y: 8 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 3,
      },
      {
        delay: 150,
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
      drawSlamEffect(targetCtx, drawCtx.attackerPos || { x: 135, y: 285 }, drawCtx.targetPos, frame.moveStep ?? 2);
    }
  }
};
