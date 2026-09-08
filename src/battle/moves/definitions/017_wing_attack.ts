import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawWingAttackEffect } from "../../../renderers/moves/gen1/move017_020.js";

export const wingAttackMove: BattleMoveAnimation = {
  num: 17,
  key: "wing-attack",
  nameKo: "날개치기",
  nameEn: "Wing Attack",
  type: "flying",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, isMiss, action: a, enemyHp, playerHp, textLineIdx } = ctx;
    return [
      // 1. Dive Lunge (100ms) - Supersonic high-speed charge!
      {
        delay: 100,
        pOffset: isP ? { x: 180, y: -90 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -180, y: 90 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.40, y: 0.45 } : undefined,
        eScale: !isP ? { x: 1.40, y: 0.45 } : undefined,
        pRot: isP ? -0.22 : undefined,
        eRot: !isP ? 0.22 : undefined,
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 1,
      },
      // 2. Direct Contact Strike & Feather Burst (110ms)
      {
        delay: 110,
        pOffset: isP ? { x: 260, y: -138 } : (isMiss ? { x: 26, y: 4 } : { x: -8, y: 4 }),
        eOffset: isP ? (isMiss ? { x: 26, y: -4 } : { x: 12, y: -4 }) : { x: -260, y: 138 },
        pScale: isP ? { x: 1.35, y: 0.48 } : undefined,
        eScale: !isP ? { x: 1.35, y: 0.48 } : undefined,
        pRot: isP ? -0.22 : undefined,
        eRot: !isP ? 0.22 : undefined,
        showEffect: true,
        hitFlash: isHit,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 2,
      },
      // 3. Piercing Fly-Through Off-Screen (110ms)
      {
        delay: 110,
        pOffset: isP ? { x: 450, y: -245 } : (isMiss ? { x: 16, y: 2 } : { x: -4, y: 2 }),
        eOffset: isP ? (isMiss ? { x: 16, y: -2 } : { x: 6, y: -2 }) : { x: -450, y: 245 },
        pScale: isP ? { x: 1.45, y: 0.38 } : undefined,
        eScale: !isP ? { x: 1.45, y: 0.38 } : undefined,
        pRot: isP ? -0.25 : undefined,
        eRot: !isP ? 0.25 : undefined,
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 3,
      },
      // 4. Swooping Re-entry from Bottom-Left (100ms)
      {
        delay: 100,
        pOffset: isP ? { x: -50, y: 24 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 50, y: -24 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.20, y: 0.70 } : undefined,
        eScale: !isP ? { x: 1.20, y: 0.70 } : undefined,
        pRot: isP ? -0.12 : undefined,
        eRot: !isP ? 0.12 : undefined,
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 4,
      },
      // 5. Clean Landing Touchdown (100ms)
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
      drawWingAttackEffect(targetCtx, drawCtx.targetPos, frame.moveStep ?? 2);
    }
  }
};
