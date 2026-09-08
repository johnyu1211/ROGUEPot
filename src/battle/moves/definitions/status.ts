import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";

export const statusMove: BattleMoveAnimation = {
  key: "status",
  nameKo: "변화기",
  nameEn: "Status Move",
  type: "normal",
  category: "status",
  camera: { type: "self", zoom: 1.20 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;
    return [
      {
        delay: 66,
        pOffset: isP ? { x: 0, y: -4 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -4 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.06, y: 0.94 } : undefined,
        eScale: !isP ? { x: 1.06, y: 0.94 } : undefined,
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
      },
      {
        delay: 66,
        pOffset: isP ? { x: 0, y: -8 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -8 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.12, y: 0.90 } : undefined,
        eScale: !isP ? { x: 1.12, y: 0.90 } : undefined,
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
      },
      {
        delay: 66,
        pOffset: isP ? { x: 0, y: -4 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -4 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.96, y: 1.06 } : undefined,
        eScale: !isP ? { x: 0.96, y: 1.06 } : undefined,
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
      },
      {
        delay: 66,
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
};
