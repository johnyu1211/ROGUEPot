import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawRollingKickEffect } from "../../../renderers/moves/gen1/move025_028.js";

export const rollingKickMove: BattleMoveAnimation = {
  num: 27,
  key: "rolling-kick",
  nameKo: "돌려차기",
  nameEn: "Rolling Kick",
  type: "fighting",
  category: "physical",
  camera: { type: "target", zoom: 1.40 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, isMiss, action: a, enemyHp, playerHp, textLineIdx } = ctx;
    return [
      // 1. Rapid Dash to Target Proximity (90ms) - Quick rush close to defender
      {
        delay: 90,
        pOffset: isP ? { x: 135, y: -65 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -135, y: 65 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.0, y: 1.0 } : undefined,
        eScale: !isP ? { x: 1.0, y: 1.0 } : undefined,
        usePlayerFront: false,
        useEnemyBack: false,
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 1,
      },
      // 2. 3D Spin 90° Turn (80ms) - Edge-on compression (후면이 측면으로 얇아짐)
      {
        delay: 80,
        pOffset: isP ? { x: 155, y: -76 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -155, y: 76 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.28, y: 1.05 } : undefined,
        eScale: !isP ? { x: 0.28, y: 1.05 } : undefined,
        usePlayerFront: false,
        useEnemyBack: false,
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 1,
      },
      // 3. 3D Spin 180° Halfway (90ms) - Facing camera! (전면 보여주기 / 상대는 후면)
      {
        delay: 90,
        pOffset: isP ? { x: 175, y: -84 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -175, y: 84 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.95, y: 1.0 } : undefined,
        eScale: !isP ? { x: 0.95, y: 1.0 } : undefined,
        usePlayerFront: isP ? true : false,
        useEnemyBack: !isP ? true : false,
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 1,
      },
      // 4. 3D Spin 270° Turn (80ms) - Edge-on compression turning away (전면이 측면으로 얇아짐)
      {
        delay: 80,
        pOffset: isP ? { x: 185, y: -88 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -185, y: 88 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.28, y: 1.05 } : undefined,
        eScale: !isP ? { x: 0.28, y: 1.05 } : undefined,
        usePlayerFront: isP ? true : false,
        useEnemyBack: !isP ? true : false,
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 1,
      },
      // 5. 360° Full Spin Strike (120ms) - Roundhouse Kick impacts with footprint stamp!
      {
        delay: 120,
        pOffset: isP ? { x: 195, y: -92 } : (isMiss ? { x: 20, y: 4 } : { x: -8, y: 4 }),
        eOffset: isP ? (isMiss ? { x: 20, y: -4 } : { x: 12, y: -5 }) : { x: -195, y: 92 },
        pScale: isP ? { x: 1.15, y: 0.92 } : undefined,
        eScale: !isP ? { x: 1.15, y: 0.92 } : undefined,
        usePlayerFront: false,
        useEnemyBack: false,
        showEffect: true,
        hitFlash: isHit,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 2,
      },
      // 6. Spin Momentum Landing (100ms) - Touchdown absorption
      {
        delay: 100,
        pOffset: isP ? { x: 75, y: -38 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -75, y: 38 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.0, y: 1.0 } : undefined,
        eScale: !isP ? { x: 1.0, y: 1.0 } : undefined,
        usePlayerFront: false,
        useEnemyBack: false,
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 3,
      },
      // 7. Return to Stance (90ms) - Clean neutral recovery
      {
        delay: 90,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        usePlayerFront: false,
        useEnemyBack: false,
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
      drawRollingKickEffect(targetCtx, drawCtx.targetPos, frame.moveStep ?? 2);
    }
  }
};
