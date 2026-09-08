import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawVineWhipEffect } from "../../../renderers/moves/gen1/move021_024.js";

export const vineWhipMove: BattleMoveAnimation = {
  num: 22,
  key: "vine-whip",
  nameKo: "덩굴채찍",
  nameEn: "Vine Whip",
  type: "grass",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;
    return [
      // 1. Windup: Attacker braces and sprouts vines (140ms, no effect on target yet)
      {
        delay: 140,
        pOffset: isP ? { x: 10, y: -4 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -10, y: 4 } : { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 1,
      },
      // 2. First Whip Strike (Left Vine Lash)
      {
        delay: 150,
        pOffset: isP ? { x: 22, y: -8 } : { x: -6, y: 2 },
        eOffset: isP ? { x: 0, y: 0 } : { x: -22, y: 8 },
        showEffect: true,
        hitFlash: true,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 2,
      },
      // 3. Second Whip Strike (Right Vine Cross-Lash)
      {
        delay: 160,
        pOffset: isP ? { x: 24, y: -9 } : { x: -8, y: 3 },
        eOffset: isP ? { x: 0, y: 0 } : { x: -24, y: 9 },
        showEffect: true,
        hitFlash: true,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 3,
      },
      // 4. Vines Retract & Settle
      {
        delay: 130,
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
      drawVineWhipEffect(
        targetCtx,
        drawCtx.attackerPos || { x: 135, y: 285 },
        drawCtx.targetPos,
        frame.moveStep ?? 2,
        "all"
      );
    }
  }
};
