import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawPoundEffect } from "../../../renderers/moves/gen1/move001_004.js";

export const poundMove: BattleMoveAnimation = {
  num: 1,
  key: "pound",
  nameKo: "막치기",
  nameEn: "Pound",
  type: "normal",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;
    return [
      // 1. Windup: Attacker steps forward into range (80ms)
      {
        delay: 80,
        pOffset: isP ? { x: 14, y: -7 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -14, y: 7 } : { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
      },
      // 2. Impact: Heavy slap on defender, star burst, hit flash (120ms)
      {
        delay: 120,
        pOffset: isP ? { x: 26, y: -13 } : (isHit ? { x: -10, y: 5 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -26, y: 13 } : (isHit ? { x: 10, y: -5 } : { x: 0, y: 0 }),
        showEffect: true,
        hitFlash: isHit,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
      },
      // 3. Reaction: Defender flinches (100ms)
      {
        delay: 100,
        pOffset: isP ? { x: 16, y: -8 } : (isHit ? { x: -6, y: 3 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -16, y: 8 } : (isHit ? { x: 6, y: -3 } : { x: 0, y: 0 }),
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
      },
      // 4. Recovery: Return to home position (80ms)
      {
        delay: 80,
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
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (frame.showEffect && drawCtx.targetPos) {
      drawPoundEffect(targetCtx, drawCtx.targetPos, frame.moveStep ?? 1);
    }
  }
};
