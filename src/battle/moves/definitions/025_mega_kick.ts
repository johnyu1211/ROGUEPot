import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawMegaKickEffect } from "../../../renderers/moves/gen1/move025_028.js";

export const megaKickMove: BattleMoveAnimation = {
  num: 25,
  key: "mega-kick",
  nameKo: "메가톤킥",
  nameEn: "Mega Kick",
  type: "normal",
  category: "physical",
  camera: { type: "target", zoom: 1.45 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, isMiss, action: a, enemyHp, playerHp, textLineIdx } = ctx;
    return [
      // 1. Concentric Golden Ring & Nearly Transparent Foot (110ms)
      {
        delay: 110,
        pOffset: isP ? { x: 45, y: -22 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -45, y: 22 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.12, y: 0.90 } : undefined,
        eScale: !isP ? { x: 1.12, y: 0.90 } : undefined,
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 1,
      },
      // 2. Ring Shrinks Rapidly & Foot Reaches 60% Opacity (110ms)
      {
        delay: 110,
        pOffset: isP ? { x: 155, y: -78 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -155, y: 78 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.28, y: 0.74 } : undefined,
        eScale: !isP ? { x: 1.28, y: 0.74 } : undefined,
        pRot: isP ? -0.15 : undefined,
        eRot: !isP ? 0.15 : undefined,
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 2,
      },
      // 3. Dead-Stop Sudden Impact: 100% Fully Opaque Foot + Golden Star Impact (200ms)
      {
        delay: 200,
        pOffset: isP ? { x: 185, y: -90 } : (isMiss ? { x: 20, y: 4 } : { x: -10, y: 4 }),
        eOffset: isP ? (isMiss ? { x: 20, y: -4 } : { x: 14, y: -5 }) : { x: -185, y: 90 },
        pScale: isP ? { x: 1.25, y: 0.80 } : undefined,
        eScale: !isP ? { x: 1.25, y: 0.80 } : undefined,
        showEffect: true,
        hitFlash: isHit,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 3,
      },
      // 4. Recoil & Foot Enlarges with Fadeout (140ms)
      {
        delay: 140,
        pOffset: isP ? { x: 90, y: -45 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -90, y: 45 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.10, y: 0.90 } : undefined,
        eScale: !isP ? { x: 1.10, y: 0.90 } : undefined,
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 4,
      },
      // 5. Clean Return Landing (100ms) - Return back to original platform
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
      drawMegaKickEffect(targetCtx, drawCtx.targetPos, frame.moveStep ?? 2);
    }
  }
};
