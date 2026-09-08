import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";

/**
 * Special Perk Hug Move Animation Definition
 * Camera is explicitly set to { type: "none" } so there is ZERO camera movement during hug motion.
 */
export const hugMove: BattleMoveAnimation = {
  key: "perk-hug",
  nameKo: "포옹",
  nameEn: "Hug",
  type: "normal",
  category: "status",
  camera: { type: "none" },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    return [
      {
        delay: 150,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: ctx.enemyHp,
        playerHp: ctx.playerHp,
        textLineIdx: ctx.textLineIdx,
        cameraZoom: 1.0,
      }
    ];
  }
};
