import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawSandAttackEffect } from "../../../renderers/moves/gen1/move025_028.js";

export const sandAttackMove: BattleMoveAnimation = {
  num: 28,
  key: "sand-attack",
  nameKo: "모래뿌리기",
  nameEn: "Sand Attack",
  type: "ground",
  category: "status",
  camera: { type: "target", zoom: 1.30 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;
    return [
      // 1. Kick Ground Dust (100ms) - Attacker scrapes ground, kicking up sand at feet
      {
        delay: 100,
        pOffset: isP ? { x: 16, y: 6 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -16, y: -6 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 1,
      },
      // 2. Sand Gale Mid-Flight (130ms) - Sand wave travels through mid-distance toward enemy
      {
        delay: 130,
        pOffset: isP ? { x: 24, y: -2 } : { x: -4, y: 2 },
        eOffset: isP ? { x: 0, y: 0 } : { x: -24, y: 2 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 2,
      },
      // 3. Sand Storm Hits Target (160ms) - Sand impacts and engulfs opponent
      {
        delay: 160,
        pOffset: isP ? { x: 18, y: -2 } : { x: -8, y: 4 },
        eOffset: isP ? { x: 8, y: -4 } : { x: -18, y: 2 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 3,
      },
      // 4. Sand Haze Dispersal (120ms) - Dispersing past defender
      {
        delay: 120,
        pOffset: isP ? { x: 8, y: 0 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -8, y: 0 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 4,
      },
      // 4. Return to Stance (110ms) - Clean neutral recovery
      {
        delay: 110,
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
      drawSandAttackEffect(
        targetCtx,
        drawCtx.attackerPos || { x: 135, y: 285 },
        drawCtx.targetPos,
        frame.moveStep ?? 2
      );
    }
  }
};
