import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawRazorWindEffect } from "../../../renderers/moves/gen1/move013_016.js";

export const razorWindMove: BattleMoveAnimation = {
  num: 13,
  key: "razor-wind",
  nameKo: "칼바람",
  nameEn: "Razor Wind",
  type: "normal",
  category: "special",
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;
    const isCharging = (a as any).isTurn1Launch || ((a.damage ?? 0) === 0 && (a as any).chargingMove === "razor-wind");

    if (isCharging) {
      return [
        {
          delay: 240,
          pOffset: isP ? { x: -4, y: 2 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: 4, y: -2 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp,
          playerHp,
          textLineIdx,
          moveEffect: a,
          moveStep: 1,
        },
        {
          delay: 340,
          pOffset: isP ? { x: 6, y: -2 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: -6, y: 2 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp,
          playerHp,
          textLineIdx,
          moveEffect: a,
          moveStep: 2,
        },
        {
          delay: 200,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp,
          playerHp,
          textLineIdx,
          moveEffect: a,
        }
      ];
    }

    return [
      {
        delay: 140,
        pOffset: isP ? { x: 10, y: -4 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -10, y: 4 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 3,
      },
      {
        delay: 180,
        pOffset: isP ? { x: 16, y: -6 } : { x: -6, y: 3 },
        eOffset: isP ? { x: 0, y: 0 } : { x: -16, y: 6 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 4,
      },
      {
        delay: 260,
        pOffset: isP ? { x: 18, y: -6 } : { x: -8, y: 4 },
        eOffset: isP ? { x: 0, y: 0 } : { x: -18, y: 6 },
        showEffect: true,
        hitFlash: true,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 5,
      },
      {
        delay: 180,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 6,
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
      drawRazorWindEffect(targetCtx, drawCtx.attackerPos || { x: 135, y: 285 }, drawCtx.targetPos, frame.moveStep ?? 4);
    }
  }
};
