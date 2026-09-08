import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawGustEffect } from "../../../renderers/moves/gen1/move013_016.js";

export const gustMove: BattleMoveAnimation = {
  num: 16,
  key: "gust",
  nameKo: "바람일으키기",
  nameEn: "Gust",
  type: "flying",
  category: "special",
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;
    return [
      // 1. Windup wing flap (120ms) - Sand dust begins entering
      {
        delay: 120,
        pOffset: isP ? { x: 12, y: -5 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -12, y: 5 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 1,
      },
      // 2. Powerful gust vortex sweeping across defender (220ms)
      {
        delay: 220,
        pOffset: isP ? { x: 22, y: -9 } : { x: -8, y: 4 },
        eOffset: isP ? { x: 0, y: 0 } : { x: -22, y: 9 },
        showEffect: true,
        hitFlash: isHit,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 2,
      },
      // 3. Drifting past & fading out (140ms)
      {
        delay: 140,
        pOffset: isP ? { x: 10, y: -4 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -10, y: 4 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 3,
      },
      // 4. Return
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
      }
    ];
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (frame.showEffect && drawCtx.targetPos) {
      drawGustEffect(targetCtx, drawCtx.attackerPos || { x: 135, y: 285 }, drawCtx.targetPos, frame.moveStep ?? 2);
    }
  }
};
