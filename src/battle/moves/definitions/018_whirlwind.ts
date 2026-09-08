import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawWhirlwindEffect } from "../../../renderers/moves/gen1/move017_020.js";

export const whirlwindMove: BattleMoveAnimation = {
  num: 18,
  key: "whirlwind",
  nameKo: "날려버리기",
  nameEn: "Whirlwind",
  type: "normal",
  category: "status",
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;
    const isSuccess = isHit && !a.log?.includes("통하지 않았다") && !a.log?.includes("실패했다");

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
        delay: 240,
        pOffset: isP ? { x: 16, y: -6 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -16, y: 6 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 2,
      },
      {
        delay: 280,
        pOffset: isP ? { x: 16, y: -6 } : (isSuccess ? { x: -40, y: -20 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -16, y: 6 } : (isSuccess ? { x: 40, y: -20 } : { x: 0, y: 0 }),
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 3,
      },
      {
        delay: 200,
        pOffset: isP ? { x: 0, y: 0 } : (isSuccess ? { x: -100, y: -40 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: 0, y: 0 } : (isSuccess ? { x: 100, y: -40 } : { x: 0, y: 0 }),
        hideEnemy: isP && isSuccess,
        hidePlayer: !isP && isSuccess,
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
      drawWhirlwindEffect(targetCtx, drawCtx.targetPos, frame.moveStep ?? 2);
    }
  }
};
