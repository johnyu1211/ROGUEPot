import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawCometPunchEffect } from "../../../renderers/moves/gen1/move001_004.js";

export const cometPunchMove: BattleMoveAnimation = {
  num: 4,
  key: "comet-punch",
  nameKo: "연속펀치",
  nameEn: "Comet Punch",
  type: "normal",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;
    const hits = (a as any).hits || 2;
    return [
      {
        delay: 150,
        pOffset: isP ? { x: 12, y: -5 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -12, y: 5 } : { x: 0, y: 0 },
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
          delay: 130,
          pOffset: isP ? { x: 24, y: -9 } : { x: -6, y: 3 },
          eOffset: isP
            ? { x: (idx % 2 === 0 ? 9 : -7), y: (idx % 2 === 0 ? -4 : 4) }
            : { x: -24, y: 9 },
          showEffect: true,
          hitFlash: true,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx,
          moveEffect: a,
          moveStep: 1 + idx * 2,
        },
        {
          delay: 100,
          pOffset: isP ? { x: 18, y: -6 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: -18, y: 6 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx,
          moveEffect: a,
          moveStep: 2 + idx * 2,
        }
      ]),
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
      drawCometPunchEffect(targetCtx, drawCtx.targetPos, frame.moveStep ?? 2);
    }
  }
};
