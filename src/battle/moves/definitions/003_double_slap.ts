import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawDoubleSlapEffect } from "../../../renderers/moves/gen1/move001_004.js";

export const doubleSlapMove: BattleMoveAnimation = {
  num: 3,
  key: "double-slap",
  nameKo: "연속뺨치기",
  nameEn: "Double Slap",
  type: "normal",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;
    const hits = (a as any).hits || 2;
    return [
      // Windup lunge
      {
        delay: 150,
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
      ...Array.from({ length: hits }).flatMap((_, idx) => [
        {
          delay: 140,
          pOffset: isP ? { x: 22, y: -8 } : { x: -6, y: 3 },
          eOffset: isP
            ? { x: (idx % 2 === 0 ? 10 : -8), y: (idx % 2 === 0 ? -3 : 3) }
            : { x: -22, y: 8 },
          showEffect: true,
          hitFlash: true,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx,
          moveEffect: a,
          moveStep: idx % 2 === 0 ? 2 : 3,
        },
        {
          delay: 110,
          pOffset: isP ? { x: 16, y: -5 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: -16, y: 5 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx,
          moveEffect: a,
          moveStep: idx % 2 === 0 ? 4 : 5,
        }
      ]),
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
      drawDoubleSlapEffect(targetCtx, drawCtx.targetPos, frame.moveStep ?? 2);
    }
  }
};
