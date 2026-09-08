import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawPhysicalImpactEffect } from "../../../renderers/moves/common/genericTypeEffects.js";

export const headbuttMove: BattleMoveAnimation = {
  num: 29,
  key: "headbutt",
  nameKo: "박치기",
  nameEn: "Headbutt",
  type: "normal",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;
    // 몸통박치기와 100% 완전히 동일한 박력있는 모션
    return [
      {
        delay: 100,
        pOffset: isP ? { x: -8, y: 3 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 8, y: -3 } : { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
      },
      {
        delay: 140,
        pOffset: isP ? { x: 26, y: -10 } : (isHit ? { x: -8, y: 4 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -26, y: 10 } : (isHit ? { x: 8, y: -4 } : { x: 0, y: 0 }),
        showEffect: true,
        hitFlash: isHit,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
      },
      {
        delay: 120,
        pOffset: isP ? { x: 14, y: -5 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -14, y: 5 } : { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
      },
      {
        delay: 100,
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
    drawPhysicalImpactEffect(targetCtx, drawCtx.targetPos);
  }
};
