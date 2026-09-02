/**
 * Battle Move Animation Registry
 *
 * Objectified move animations with explicit camera rules and phased frame generators.
 * All offsets, timings, and frames are preserved with 100% loss-free precision.
 */

import { BattleMoveAnimation, MoveContext, BattleFrame } from './types.js';

export const statusAnimation: BattleMoveAnimation = {
  key: 'status',
  camera: { type: "self" },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, isMiss, action: a, enemyHp, playerHp, textLineIdx, usePlayerFront, useEnemyBack } = ctx;
    const isTurn1Launch = (a as any).isTurn1Launch || ((a.damage ?? 0) === 0 && ((a as any).chargingMove === 'fly' || a.moveKey === 'fly'));
    const hits = (a as any).hits || 2;
    return [
      // 1. Caster gathers energy on home platform (66ms x 2 = 132ms)
      {
        delay: 66,
        pOffset: isP ? { x: 0, y: -4 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -4 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.06, y: 0.94 } : undefined,
        eScale: !isP ? { x: 1.06, y: 0.94 } : undefined,
        showEffect: false,
        hitFlash: false,
        enemyHp: enemyHp,
        playerHp: playerHp,
        textLineIdx: textLineIdx,
        isBlur: false,
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
        enemyHp: enemyHp,
        playerHp: playerHp,
        textLineIdx: textLineIdx,
        isBlur: false,
        moveEffect: a,
      },
      // 2. Status pulse & settle on home platform (66ms x 2 = 132ms)
      {
        delay: 66,
        pOffset: isP ? { x: 0, y: -4 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -4 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.96, y: 1.06 } : undefined,
        eScale: !isP ? { x: 0.96, y: 1.06 } : undefined,
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx: textLineIdx,
        isBlur: false,
        moveEffect: a,
      },
      {
        delay: 66,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx: textLineIdx,
        isBlur: false,
        moveEffect: a,
      }
    ];
  }
};

export const karateChopAnimation: BattleMoveAnimation = {
  key: 'karate-chop',
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, isMiss, action: a, enemyHp, playerHp, textLineIdx, usePlayerFront, useEnemyBack } = ctx;
    const isTurn1Launch = (a as any).isTurn1Launch || ((a.damage ?? 0) === 0 && ((a as any).chargingMove === 'fly' || a.moveKey === 'fly'));
    const hits = (a as any).hits || 2;
    return [
        // 1A: Hand appears hovering above target head (130ms)
        {
          delay: 130,
          pOffset: isP ? { x: 12, y: -5 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: -12, y: 5 } : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 1,
        },
        // 1B: 살짝 아래로 틱 내려감 (140ms)
        {
          delay: 140,
          pOffset: isP ? { x: 16, y: -6 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: -16, y: 6 } : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 2,
        },
        // 1C: 위로 살짝 올라갔다가 멈칫 장전 (150ms)
        {
          delay: 150,
          pOffset: isP ? { x: 18, y: -8 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: -18, y: 8 } : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 3,
        },
        // 1D: 팍! 하고 내려침 (240ms)
        {
          delay: 240,
          pOffset: isP ? { x: 20, y: -10 } : { x: -8, y: 4 },
          eOffset: isP ? { x: 8, y: -2 } : { x: -20, y: 10 },
          showEffect: true,
          hitFlash: true,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a,
          moveStep: 4,
        }
      ];
  }
};

export const doubleSlapAnimation: BattleMoveAnimation = {
  key: 'double-slap',
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, isMiss, action: a, enemyHp, playerHp, textLineIdx, usePlayerFront, useEnemyBack } = ctx;
    const isTurn1Launch = (a as any).isTurn1Launch || ((a.damage ?? 0) === 0 && ((a as any).chargingMove === 'fly' || a.moveKey === 'fly'));
    const hits = (a as any).hits || 2;
    return [
        // Windup lunge
        {
          delay: 150,
          pOffset: isP ? { x: 14, y: -6 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: -14, y: 6 } : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 1,
        },
        // Alternating Left / Right Cheek Slaps (Strike Impact -> Follow-through Fade Out)
        ...Array.from({ length: hits }).flatMap((_, idx) => [
          // Sub-frame A: Strike Impact (Full Opacity + Hit Flash)
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
            textLineIdx: textLineIdx,
            statProgress: undefined,
            isBlur: false,
            moveEffect: a,
            moveStep: idx * 2 + 1,
          },
          // Sub-frame B: Follow-through Fade Out (Gradual Transparency)
          {
            delay: 130,
            pOffset: isP ? { x: 16, y: -6 } : { x: -3, y: 1 },
            eOffset: isP
              ? { x: (idx % 2 === 0 ? 4 : -4), y: 0 }
              : { x: -16, y: 6 },
            showEffect: true,
            hitFlash: false,
            enemyHp: a.enemyHpAfter,
            playerHp: a.playerHpAfter,
            textLineIdx: textLineIdx,
            statProgress: undefined,
            isBlur: false,
            moveEffect: a,
            moveStep: idx * 2 + 2,
          }
        ])
      ];
  }
};

export const cometPunchAnimation: BattleMoveAnimation = {
  key: 'comet-punch',
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, isMiss, action: a, enemyHp, playerHp, textLineIdx, usePlayerFront, useEnemyBack } = ctx;
    const isTurn1Launch = (a as any).isTurn1Launch || ((a.damage ?? 0) === 0 && ((a as any).chargingMove === 'fly' || a.moveKey === 'fly'));
    const hits = (a as any).hits || 2;
    return [
        // Windup dash lunge
        {
          delay: 150,
          pOffset: isP ? { x: 16, y: -8 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: -16, y: 8 } : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 1,
        },
        // 3-Punch Barrage (Strike Impact -> Follow-through Fade Out)
        ...Array.from({ length: hits }).flatMap((_, idx) => [
          // Sub-frame A: Strike Impact (Full Opacity + Hit Flash)
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
            textLineIdx: textLineIdx,
            statProgress: undefined,
            isBlur: false,
            moveEffect: a,
            moveStep: idx * 2 + 1,
          },
          // Sub-frame B: Follow-through Fade Out (Gradual Transparency)
          {
            delay: 130,
            pOffset: isP ? { x: 16, y: -6 } : { x: -3, y: 1 },
            eOffset: isP
              ? { x: (idx % 2 === 0 ? 4 : -4), y: 0 }
              : { x: -16, y: 6 },
            showEffect: true,
            hitFlash: false,
            enemyHp: a.enemyHpAfter,
            playerHp: a.playerHpAfter,
            textLineIdx: textLineIdx,
            statProgress: undefined,
            isBlur: false,
            moveEffect: a,
            moveStep: idx * 2 + 2,
          }
        ])
      ];
  }
};

export const megaPunchAnimation: BattleMoveAnimation = {
  key: 'mega-punch',
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, isMiss, action: a, enemyHp, playerHp, textLineIdx, usePlayerFront, useEnemyBack } = ctx;
    const isTurn1Launch = (a as any).isTurn1Launch || ((a.damage ?? 0) === 0 && ((a as any).chargingMove === 'fly' || a.moveKey === 'fly'));
    const hits = (a as any).hits || 2;
    return [
        // Step 1: Big Yellow Ring appears around target (130ms)
        {
          delay: 130,
          pOffset: isP ? { x: 12, y: -5 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: -12, y: 5 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 1,
        },
        // Step 2: Yellow Ring rapidly contracts/shrinks towards target (130ms)
        {
          delay: 130,
          pOffset: isP ? { x: 16, y: -7 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: -16, y: 7 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 2,
        },
        // Step 3: Ring shrunk tiny + Heavy Punch Strikes + Hit Flash (220ms)
        {
          delay: 220,
          pOffset: isP ? { x: 22, y: -9 } : { x: -6, y: 3 },
          eOffset: isP ? { x: 10, y: -3 } : { x: -22, y: 9 },
          showEffect: true,
          hitFlash: true,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a,
          moveStep: 3,
        },
        // Step 4: Ring expands outward like a ripple wave (130ms)
        {
          delay: 130,
          pOffset: isP ? { x: 16, y: -6 } : { x: -3, y: 1 },
          eOffset: isP ? { x: 5, y: -1 } : { x: -16, y: 6 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a,
          moveStep: 4,
        },
        // Step 5: Wave expands further and dissipates (120ms)
        {
          delay: 120,
          pOffset: isP ? { x: 10, y: -3 } : { x: 0, y: 0 },
          eOffset: isP ? { x: 2, y: 0 } : { x: -10, y: 3 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a,
          moveStep: 5,
        }
      ];
  }
};

export const payDayAnimation: BattleMoveAnimation = {
  key: 'pay-day',
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, isMiss, action: a, enemyHp, playerHp, textLineIdx, usePlayerFront, useEnemyBack } = ctx;
    const isTurn1Launch = (a as any).isTurn1Launch || ((a.damage ?? 0) === 0 && ((a as any).chargingMove === 'fly' || a.moveKey === 'fly'));
    const hits = (a as any).hits || 2;
    return [
        // 1. Windup lunge (150ms)
        {
          delay: 150,
          pOffset: isP ? { x: 16, y: -8 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: -16, y: 8 } : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
        },
        // 2. Step 1: Coins impact cluster + Hit Flash (200ms)
        {
          delay: 200,
          pOffset: isP ? { x: 22, y: -9 } : { x: -6, y: 3 },
          eOffset: isP ? { x: 10, y: -3 } : { x: -22, y: 9 },
          showEffect: true,
          hitFlash: true,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a,
          moveStep: 1,
        },
        // 3. Step 2: Coins scatter outward (140ms)
        {
          delay: 140,
          pOffset: isP ? { x: 16, y: -6 } : { x: -3, y: 1 },
          eOffset: isP ? { x: 5, y: -1 } : { x: -16, y: 6 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a,
          moveStep: 2,
        },
        // 4. Step 3: Coins disperse far & fade transparently (130ms)
        {
          delay: 130,
          pOffset: isP ? { x: 10, y: -3 } : { x: 0, y: 0 },
          eOffset: isP ? { x: 2, y: 0 } : { x: -10, y: 3 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a,
          moveStep: 3,
        }
      ];
  }
};

export const firePunchAnimation: BattleMoveAnimation = {
  key: 'fire-punch',
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, isMiss, action: a, enemyHp, playerHp, textLineIdx, usePlayerFront, useEnemyBack } = ctx;
    const isTurn1Launch = (a as any).isTurn1Launch || ((a.damage ?? 0) === 0 && ((a as any).chargingMove === 'fly' || a.moveKey === 'fly'));
    const hits = (a as any).hits || 2;
    return [
        // 1. Windup lunge (150ms)
        {
          delay: 150,
          pOffset: isP ? { x: 16, y: -8 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: -16, y: 8 } : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
        },
        // 2. Step 1: Direct Fire Punch Impact (200ms) with Hit Flash
        {
          delay: 200,
          pOffset: isP ? { x: 22, y: -9 } : { x: -6, y: 3 },
          eOffset: isP ? { x: 10, y: -3 } : { x: -22, y: 9 },
          showEffect: true,
          hitFlash: true,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a,
          moveStep: 1,
        },
        // 3. Step 2: Flames Burst & Scatter Outward (140ms)
        {
          delay: 140,
          pOffset: isP ? { x: 16, y: -6 } : { x: -3, y: 1 },
          eOffset: isP ? { x: 5, y: -1 } : { x: -16, y: 6 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a,
          moveStep: 2,
        },
        // 4. Step 3: Flames Disperse Far & Dissipate (130ms)
        {
          delay: 130,
          pOffset: isP ? { x: 10, y: -3 } : { x: 0, y: 0 },
          eOffset: isP ? { x: 2, y: 0 } : { x: -10, y: 3 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a,
          moveStep: 3,
        }
      ];
  }
};

export const icePunchAnimation: BattleMoveAnimation = {
  key: 'ice-punch',
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, isMiss, action: a, enemyHp, playerHp, textLineIdx, usePlayerFront, useEnemyBack } = ctx;
    const isTurn1Launch = (a as any).isTurn1Launch || ((a.damage ?? 0) === 0 && ((a as any).chargingMove === 'fly' || a.moveKey === 'fly'));
    const hits = (a as any).hits || 2;
    return [
        // 1. Windup lunge (150ms)
        {
          delay: 150,
          pOffset: isP ? { x: 16, y: -8 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: -16, y: 8 } : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
        },
        // 2. Step 1: Direct Glacial Strike + 6 Ice Crystals Form + Hit Flash (200ms)
        {
          delay: 200,
          pOffset: isP ? { x: 22, y: -9 } : { x: -6, y: 3 },
          eOffset: isP ? { x: 10, y: -3 } : { x: -22, y: 9 },
          showEffect: true,
          hitFlash: true,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a,
          moveStep: 1,
        },
        // 3. Step 2: Ice Crystals Shatter & Expand Radially (140ms)
        {
          delay: 140,
          pOffset: isP ? { x: 16, y: -6 } : { x: -3, y: 1 },
          eOffset: isP ? { x: 5, y: -1 } : { x: -16, y: 6 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a,
          moveStep: 2,
        },
        // 4. Step 3: Crystals Disperse Far & Dissipate (130ms)
        {
          delay: 130,
          pOffset: isP ? { x: 10, y: -3 } : { x: 0, y: 0 },
          eOffset: isP ? { x: 2, y: 0 } : { x: -10, y: 3 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a,
          moveStep: 3,
        }
      ];
  }
};

export const guillotineAnimation: BattleMoveAnimation = {
  key: 'guillotine',
  camera: { type: "target", zoom: 1.38 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, isMiss, action: a, enemyHp, playerHp, textLineIdx, usePlayerFront, useEnemyBack } = ctx;
    const isTurn1Launch = (a as any).isTurn1Launch || ((a.damage ?? 0) === 0 && ((a as any).chargingMove === 'fly' || a.moveKey === 'fly'));
    const hits = (a as any).hits || 2;
    return [
        // 1. Windup stance - In place (120ms)
        {
          delay: 120,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
        },
        // 2. Step 1: First Diagonal Slash [/] (160ms)
        {
          delay: 160,
          pOffset: isP ? { x: 0, y: 0 } : (isMiss ? { x: 26, y: 4 } : { x: -4, y: 2 }),
          eOffset: isP ? (isMiss ? { x: 26, y: -4 } : { x: 6, y: -2 }) : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          usePlayerFront: isP,
          useEnemyBack: !isP,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a,
          moveStep: 1,
        },
        // 3. Step 2: Second Diagonal Slash [\] (160ms)
        {
          delay: 160,
          pOffset: isP ? { x: 0, y: 0 } : (isMiss ? { x: 24, y: 3 } : { x: -6, y: 3 }),
          eOffset: isP ? (isMiss ? { x: 24, y: -3 } : { x: 8, y: -3 }) : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          usePlayerFront: isP,
          useEnemyBack: !isP,
          enemyHp: isHit ? enemyHp : a.enemyHpAfter,
          playerHp: isHit ? playerHp : a.playerHpAfter,
          textLineIdx: textLineIdx,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a,
          moveStep: 2,
        },
        ...(isHit ? [
          // 4. Step 3: FATAL FULL [X] SCISSOR EXECUTION CRASH (260ms)
          {
            delay: 260,
            pOffset: isP ? { x: 0, y: 0 } : { x: -12, y: 4 },
            eOffset: isP ? { x: 12, y: -4 } : { x: 0, y: 0 },
            showEffect: true,
            hitFlash: true,
            usePlayerFront: isP,
            useEnemyBack: !isP,
            enemyHp: a.enemyHpAfter,
            playerHp: a.playerHpAfter,
            textLineIdx: textLineIdx,
            statProgress: undefined,
            isBlur: false,
            moveEffect: a,
            moveStep: 3,
          },
          // 5. Step 4: Red [X] Dissipation (140ms)
          {
            delay: 140,
            pOffset: isP ? { x: 0, y: 0 } : { x: -4, y: 1 },
            eOffset: isP ? { x: 4, y: 0 } : { x: 0, y: 0 },
            showEffect: true,
            hitFlash: false,
            usePlayerFront: isP,
            useEnemyBack: !isP,
            enemyHp: a.enemyHpAfter,
            playerHp: a.playerHpAfter,
            textLineIdx: textLineIdx,
            statProgress: undefined,
            isBlur: false,
            moveEffect: a,
            moveStep: 4,
          }
        ] : [
          // On Miss: Defender slides smoothly back to center (180ms)
          {
            delay: 180,
            pOffset: !isP ? { x: 8, y: 1 } : { x: 0, y: 0 },
            eOffset: isP ? { x: 8, y: -1 } : { x: 0, y: 0 },
            showEffect: false,
            hitFlash: false,
            usePlayerFront: isP,
            useEnemyBack: !isP,
            enemyHp: a.enemyHpAfter,
            playerHp: a.playerHpAfter,
            textLineIdx: textLineIdx,
            statProgress: undefined,
            isBlur: false,
            moveEffect: a,
          }
        ])
      ];
  }
};

export const swordsDanceAnimation: BattleMoveAnimation = {
  key: 'swords-dance',
  camera: { type: "self" },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, isMiss, action: a, enemyHp, playerHp, textLineIdx, usePlayerFront, useEnemyBack } = ctx;
    const isTurn1Launch = (a as any).isTurn1Launch || ((a.damage ?? 0) === 0 && ((a as any).chargingMove === 'fly' || a.moveKey === 'fly'));
    const hits = (a as any).hits || 2;
    return [
        // 1. Low 3D Orbit around Waist (120ms)
        {
          delay: 120,
          pOffset: isP ? { x: 0, y: -2 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: 0, y: -2 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 1,
        },
        // 2. Ascending 3D Orbit - 1st Spin (120ms)
        {
          delay: 120,
          pOffset: isP ? { x: 0, y: -4 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: 0, y: -4 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 2,
        },
        // 3. Mid-High 3D Orbit - 2nd Spin (120ms)
        {
          delay: 120,
          pOffset: isP ? { x: 0, y: -6 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: 0, y: -6 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 3,
        },
        // 4. High 3D Orbit & Inward Tilt toward Apex (130ms)
        {
          delay: 130,
          pOffset: isP ? { x: 0, y: -7 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: 0, y: -7 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 4,
        },
        // 5. Swords Clash & Tips Touch at ONE Point above Head (240ms)
        {
          delay: 240,
          pOffset: isP ? { x: 0, y: -8 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: 0, y: -8 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a,
          moveStep: 5,
        },
        // 6. Power Dispersal & Aura Rise (140ms)
        {
          delay: 140,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          statProgress: undefined,
          isBlur: false,
          moveEffect: a,
          moveStep: 6,
        }
      ];
  }
};

export const flyAnimation: BattleMoveAnimation = {
  key: 'fly',
  camera: { type: "sky" },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, isMiss, action: a, enemyHp, playerHp, textLineIdx, usePlayerFront, useEnemyBack } = ctx;
    const isTurn1Launch = (a as any).isTurn1Launch || ((a.damage ?? 0) === 0 && ((a as any).chargingMove === 'fly' || a.moveKey === 'fly'));
    const hits = (a as any).hits || 2;
    if (isTurn1Launch) {
        // Turn 1: 15 FPS Cinematic Launch (Zoom-in close-up -> Rocket Liftoff -> Stratosphere Ascent -> Vanish)
        return [
          // 1. Dynamic Close-Up on Attacker & Deep Crouch Preparation (66ms x 3 = 200ms)
          {
            delay: 66,
            pOffset: isP ? { x: 0, y: 2 } : { x: 0, y: 0 },
            eOffset: !isP ? { x: 0, y: 2 } : { x: 0, y: 0 },
            pScale: isP ? { x: 1.10, y: 0.92 } : undefined,
            eScale: !isP ? { x: 1.10, y: 0.92 } : undefined,
            cameraZoom: 1.45,
            cameraTrackAttacker: true,
            isAttackerPlayer: isP,
            pWhite: false,
            eWhite: false,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemyHp,
            playerHp: playerHp,
            textLineIdx: textLineIdx,
            isBlur: false,
            moveEffect: a,
          },
          {
            delay: 66,
            pOffset: isP ? { x: 0, y: 6 } : { x: 0, y: 0 },
            eOffset: !isP ? { x: 0, y: 6 } : { x: 0, y: 0 },
            pScale: isP ? { x: 1.25, y: 0.80 } : undefined,
            eScale: !isP ? { x: 1.25, y: 0.80 } : undefined,
            cameraZoom: 1.60,
            cameraTrackAttacker: true,
            isAttackerPlayer: isP,
            pWhite: false,
            eWhite: false,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemyHp,
            playerHp: playerHp,
            textLineIdx: textLineIdx,
            isBlur: false,
            moveEffect: a,
          },
          {
            delay: 66,
            pOffset: isP ? { x: 0, y: 8 } : { x: 0, y: 0 },
            eOffset: !isP ? { x: 0, y: 8 } : { x: 0, y: 0 },
            pScale: isP ? { x: 1.30, y: 0.75 } : undefined,
            eScale: !isP ? { x: 1.30, y: 0.75 } : undefined,
            cameraZoom: 1.70,
            cameraTrackAttacker: true,
            isAttackerPlayer: isP,
            pWhite: false,
            eWhite: false,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemyHp,
            playerHp: playerHp,
            textLineIdx: textLineIdx,
            isBlur: false,
            moveEffect: a,
          },
          // 2. Rocket Sky Launch & Camera Dynamic Tracking Upward into Stratosphere! (66ms x 4 = 264ms)
          {
            delay: 66,
            pOffset: isP ? { x: 0, y: -60 } : { x: 0, y: 0 },
            eOffset: !isP ? { x: 0, y: -60 } : { x: 0, y: 0 },
            pScale: isP ? { x: 0.65, y: 1.45 } : undefined,
            eScale: !isP ? { x: 0.65, y: 1.45 } : undefined,
            cameraZoom: 1.60,
            cameraTrackAttacker: true,
            isAttackerPlayer: isP,
            pWhite: isP,
            eWhite: !isP,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemyHp,
            playerHp: playerHp,
            textLineIdx: textLineIdx,
            isBlur: false,
            moveEffect: a,
          },
          {
            delay: 66,
            pOffset: isP ? { x: 0, y: -140 } : { x: 0, y: 0 },
            eOffset: !isP ? { x: 0, y: -140 } : { x: 0, y: 0 },
            pScale: isP ? { x: 0.45, y: 1.85 } : undefined,
            eScale: !isP ? { x: 0.45, y: 1.85 } : undefined,
            cameraZoom: 1.50,
            cameraTrackAttacker: true,
            isAttackerPlayer: isP,
            pWhite: isP,
            eWhite: !isP,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemyHp,
            playerHp: playerHp,
            textLineIdx: textLineIdx,
            isBlur: false,
            moveEffect: a,
          },
          {
            delay: 66,
            pOffset: isP ? { x: 0, y: -240 } : { x: 0, y: 0 },
            eOffset: !isP ? { x: 0, y: -240 } : { x: 0, y: 0 },
            pScale: isP ? { x: 0.35, y: 2.10 } : undefined,
            eScale: !isP ? { x: 0.35, y: 2.10 } : undefined,
            cameraZoom: 1.38,
            cameraTrackAttacker: true,
            isAttackerPlayer: isP,
            pWhite: isP,
            eWhite: !isP,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemyHp,
            playerHp: playerHp,
            textLineIdx: textLineIdx,
            isBlur: false,
            moveEffect: a,
          },
          {
            delay: 66,
            pOffset: isP ? { x: 0, y: -360 } : { x: 0, y: 0 },
            eOffset: !isP ? { x: 0, y: -360 } : { x: 0, y: 0 },
            pScale: isP ? { x: 0.28, y: 2.30 } : undefined,
            eScale: !isP ? { x: 0.28, y: 2.30 } : undefined,
            cameraZoom: 1.25,
            cameraTrackAttacker: true,
            isAttackerPlayer: isP,
            pWhite: isP,
            eWhite: !isP,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemyHp,
            playerHp: playerHp,
            textLineIdx: textLineIdx,
            isBlur: false,
            moveEffect: a,
          },
          // 3. Stratosphere Piercing & Neutral Reset (66ms x 2 = 132ms)
          {
            delay: 66,
            pOffset: isP ? { x: 0, y: -520 } : { x: 0, y: 0 },
            eOffset: !isP ? { x: 0, y: -520 } : { x: 0, y: 0 },
            pScale: isP ? { x: 0.20, y: 2.50 } : undefined,
            eScale: !isP ? { x: 0.20, y: 2.50 } : undefined,
            cameraZoom: 1.10,
            cameraTrackAttacker: true,
            isAttackerPlayer: isP,
            pWhite: isP,
            eWhite: !isP,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemyHp,
            playerHp: playerHp,
            textLineIdx: textLineIdx,
            isBlur: false,
            moveEffect: a,
          },
          {
            delay: 66,
            pOffset: isP ? { x: 0, y: -9999 } : { x: 0, y: 0 },
            eOffset: !isP ? { x: 0, y: -9999 } : { x: 0, y: 0 },
            showEffect: false,
            hitFlash: false,
            enemyHp: enemyHp,
            playerHp: playerHp,
            textLineIdx: textLineIdx,
            isBlur: false,
            moveEffect: a,
          }
        ];
      } else {
        // Turn 2: Straight-Line Soar -> Diagonal Camera Bank -> Field Vertical Plunge & Slam
        return [
          // 1. High Sky Straight-Line Soar (위/아래 명확한 대기 색구분 직선 활공 66ms x 3 = 200ms)
          {
            delay: 66,
            diveStep: 1,
            skyCameraTilt: 0.0,
            pOffset: { x: -20, y: -10 },
            eOffset: { x: -20, y: -10 },
            pScale: isP ? { x: 1.05, y: 0.95 } : undefined,
            eScale: !isP ? { x: 1.05, y: 0.95 } : undefined,
            pRot: 0,
            eRot: 0,
            isHighSkyCutscene: true,
            isAttackerPlayer: isP,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemyHp,
            playerHp: playerHp,
            textLineIdx: textLineIdx,
            isBlur: false,
            moveEffect: a,
          },
          {
            delay: 66,
            diveStep: 2,
            skyCameraTilt: 0.0,
            pOffset: { x: 0, y: -12 },
            eOffset: { x: 0, y: -12 },
            pScale: isP ? { x: 1.08, y: 0.92 } : undefined,
            eScale: !isP ? { x: 1.08, y: 0.92 } : undefined,
            pRot: isP ? -0.02 : 0,
            eRot: !isP ? -0.02 : 0,
            isHighSkyCutscene: true,
            isAttackerPlayer: isP,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemyHp,
            playerHp: playerHp,
            textLineIdx: textLineIdx,
            isBlur: false,
            moveEffect: a,
          },
          {
            delay: 66,
            diveStep: 3,
            skyCameraTilt: 0.0,
            pOffset: { x: 20, y: -8 },
            eOffset: { x: 20, y: -8 },
            pScale: isP ? { x: 1.12, y: 0.90 } : undefined,
            eScale: !isP ? { x: 1.12, y: 0.90 } : undefined,
            pRot: isP ? 0.01 : 0,
            eRot: !isP ? 0.01 : 0,
            isHighSkyCutscene: true,
            isAttackerPlayer: isP,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemyHp,
            playerHp: playerHp,
            textLineIdx: textLineIdx,
            isBlur: false,
            moveEffect: a,
          },

          // 2. Dynamic Diagonal Camera Bank (대각선으로 기울어지는 카메라 뱅킹 전환 66ms x 3 = 200ms)
          {
            delay: 66,
            diveStep: 4,
            skyCameraTilt: isP ? 0.32 : -0.32,
            pOffset: { x: 10, y: 5 },
            eOffset: { x: 10, y: 5 },
            pScale: isP ? { x: 0.95, y: 1.10 } : undefined,
            eScale: !isP ? { x: 0.95, y: 1.10 } : undefined,
            pRot: isP ? 0.18 : -0.18,
            eRot: !isP ? 0.18 : -0.18,
            isHighSkyCutscene: true,
            isAttackerPlayer: isP,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemyHp,
            playerHp: playerHp,
            textLineIdx: textLineIdx,
            isBlur: false,
            moveEffect: a,
          },
          {
            delay: 66,
            diveStep: 5,
            skyCameraTilt: isP ? 0.60 : -0.60,
            pOffset: { x: 0, y: 15 },
            eOffset: { x: 0, y: 15 },
            pScale: isP ? { x: 0.80, y: 1.30 } : undefined,
            eScale: !isP ? { x: 0.80, y: 1.30 } : undefined,
            pRot: isP ? 0.38 : -0.38,
            eRot: !isP ? 0.38 : -0.38,
            isHighSkyCutscene: true,
            isAttackerPlayer: isP,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemyHp,
            playerHp: playerHp,
            textLineIdx: textLineIdx,
            isBlur: false,
            moveEffect: a,
          },
          {
            delay: 66,
            diveStep: 6,
            skyCameraTilt: isP ? 0.88 : -0.88,
            pOffset: { x: -10, y: 30 },
            eOffset: { x: -10, y: 30 },
            pScale: isP ? { x: 0.65, y: 1.60 } : undefined,
            eScale: !isP ? { x: 0.65, y: 1.60 } : undefined,
            pRot: isP ? 0.58 : -0.58,
            eRot: !isP ? 0.58 : -0.58,
            isHighSkyCutscene: true,
            isAttackerPlayer: isP,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemyHp,
            playerHp: playerHp,
            textLineIdx: textLineIdx,
            isBlur: false,
            moveEffect: a,
          },

          // 3. Battlefield Arena Vertical Plunge (필드 수직낙하 66ms x 2 = 132ms)
          {
            delay: 66,
            pOffset: isP ? { x: 268, y: -360 } : { x: 0, y: 0 },
            eOffset: !isP ? { x: -268, y: -160 } : { x: 0, y: 0 },
            pScale: isP ? { x: 0.40, y: 2.00 } : undefined,
            eScale: !isP ? { x: 0.40, y: 2.00 } : undefined,
            pRot: 0,
            eRot: 0,
            loomingShadow: { offsetY: 0, w: 28, h: 9, alpha: 0.85 },
            isHighSkyCutscene: false,
            isAttackerPlayer: isP,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemyHp,
            playerHp: playerHp,
            textLineIdx: textLineIdx,
            isBlur: false,
            moveEffect: a,
          },
          {
            delay: 66,
            pOffset: isP ? { x: 268, y: -180 } : { x: 0, y: 0 },
            eOffset: !isP ? { x: -268, y: 40 } : { x: 0, y: 0 },
            pScale: isP ? { x: 0.30, y: 2.40 } : undefined,
            eScale: !isP ? { x: 0.30, y: 2.40 } : undefined,
            pRot: 0,
            eRot: 0,
            loomingShadow: { offsetY: 0, w: 34, h: 11, alpha: 1.0 },
            isHighSkyCutscene: false,
            isAttackerPlayer: isP,
            showEffect: false,
            hitFlash: false,
            enemyHp: enemyHp,
            playerHp: playerHp,
            textLineIdx: textLineIdx,
            isBlur: false,
            moveEffect: a,
          },

          // 4. Ground Arena Vertical Dive-Bomb Impact Slam (66ms x 3 = 200ms)
          {
            delay: 66,
            pOffset: isP ? { x: 268, y: -139 } : (isMiss ? { x: 20, y: 4 } : { x: -8, y: 4 }),
            eOffset: isP ? (isMiss ? { x: 20, y: -4 } : { x: 8, y: -4 }) : { x: -268, y: 149 },
            pScale: isP ? { x: 1.35, y: 0.65 } : undefined,
            eScale: !isP ? { x: 1.35, y: 0.65 } : undefined,
            pRot: 0,
            eRot: 0,
            pWhite: false,
            eWhite: false,
            isHighSkyCutscene: false,
            showEffect: true,
            hitFlash: isHit,
            enemyHp: a.enemyHpAfter,
            playerHp: a.playerHpAfter,
            textLineIdx: textLineIdx,
            isBlur: false,
            moveEffect: a,
            moveStep: 3,
          },
          {
            delay: 66,
            pOffset: isP ? { x: 134, y: -30 } : { x: 0, y: 0 },
            eOffset: !isP ? { x: -134, y: 30 } : { x: 0, y: 0 },
            pScale: isP ? { x: 1.10, y: 0.92 } : undefined,
            eScale: !isP ? { x: 1.10, y: 0.92 } : undefined,
            isHighSkyCutscene: false,
            showEffect: true,
            hitFlash: false,
            enemyHp: a.enemyHpAfter,
            playerHp: a.playerHpAfter,
            textLineIdx: textLineIdx,
            isBlur: false,
            moveEffect: a,
            moveStep: 4,
          },
          {
            delay: 66,
            pOffset: { x: 0, y: 0 },
            eOffset: { x: 0, y: 0 },
            isHighSkyCutscene: false,
            showEffect: false,
            hitFlash: false,
            enemyHp: a.enemyHpAfter,
            playerHp: a.playerHpAfter,
            textLineIdx: textLineIdx,
            isBlur: false,
            moveEffect: a,
          }
        ];
    }
  }
};

export const razorWindAnimation: BattleMoveAnimation = {
  key: 'razor-wind',
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, isMiss, action: a, enemyHp, playerHp, textLineIdx, usePlayerFront, useEnemyBack } = ctx;
    const isTurn1Launch = (a as any).isTurn1Launch || ((a.damage ?? 0) === 0 && ((a as any).chargingMove === 'fly' || a.moveKey === 'fly'));
    const hits = (a as any).hits || 2;
    return [
        // 1. Helical Spiral Orbit around Attacker (150ms)
        {
          delay: 150,
          pOffset: isP ? { x: 4, y: -2 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: -4, y: 2 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 1,
        },
        // 2. Swirl Dissolving & Fading Out at Attacker (150ms)
        {
          delay: 150,
          pOffset: isP ? { x: 6, y: -3 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: -6, y: 3 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 2,
        },
        // 3. Faint Translucent Opposite Pairs Spawning at Defender (150ms)
        {
          delay: 150,
          pOffset: isP ? { x: 8, y: -4 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: -8, y: 4 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 3,
        },
        // 4. Blades Closing In & Becoming Denser from All Opposing Sides (170ms)
        {
          delay: 170,
          pOffset: isP ? { x: 12, y: -6 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: -12, y: 6 } : { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 4,
        },
        // 5. Full Omnidirectional 8-Way Cleave Storm Impact (240ms)
        {
          delay: 240,
          pOffset: isP ? { x: 14, y: -7 } : (isMiss ? { x: 26, y: 4 } : { x: -6, y: 3 }),
          eOffset: isP ? (isMiss ? { x: 26, y: -4 } : { x: 10, y: -3 }) : { x: -14, y: 7 },
          showEffect: true,
          hitFlash: isHit,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 5,
        },
        // 6. Gentle Shard Fade-Out Dispersal (140ms)
        {
          delay: 140,
          pOffset: isP ? { x: 4, y: -2 } : { x: 0, y: 0 },
          eOffset: isP ? { x: 2, y: 0 } : { x: -4, y: 2 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 6,
        }
      ];
  }
};

export const wingAttackAnimation: BattleMoveAnimation = {
  key: 'wing-attack',
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, isMiss, action: a, enemyHp, playerHp, textLineIdx, usePlayerFront, useEnemyBack } = ctx;
    const isTurn1Launch = (a as any).isTurn1Launch || ((a.damage ?? 0) === 0 && ((a as any).chargingMove === 'fly' || a.moveKey === 'fly'));
    const hits = (a as any).hits || 2;
    return [
        // 1. Dive Lunge (100ms)
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
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 1,
        },
        // 2. Direct Contact Strike & Feather Burst (100ms)
        {
          delay: 100,
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
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 2,
        },
        // 3. Piercing Fly-Through Off-Screen (100ms)
        {
          delay: 100,
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
          textLineIdx: textLineIdx,
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
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 4,
        },
        // 5. Clean Landing Touchdown (100ms)
        {
          delay: 100,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 4,
        }
      ];
  }
};

export const whirlwindAnimation: BattleMoveAnimation = {
  key: 'whirlwind',
  camera: { type: "target", zoom: 1.30 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, isMiss, action: a, enemyHp, playerHp, textLineIdx, usePlayerFront, useEnemyBack } = ctx;
    const isTurn1Launch = (a as any).isTurn1Launch || ((a.damage ?? 0) === 0 && ((a as any).chargingMove === 'fly' || a.moveKey === 'fly'));
    const hits = (a as any).hits || 2;
    return [
        // 1. Cyclone Inception & Initial Lift (90ms)
        {
          delay: 90,
          pOffset: isP ? { x: 12, y: -4 } : (isMiss ? { x: -26, y: 4 } : { x: 0, y: -25 }),
          eOffset: isP ? (isMiss ? { x: 26, y: -4 } : { x: 0, y: -25 }) : { x: -12, y: 4 },
          pRot: isP ? undefined : (isMiss ? undefined : -0.50),
          eRot: isP ? (isMiss ? undefined : 0.50) : undefined,
          pScale: isP ? undefined : (isMiss ? undefined : { x: 0.95, y: 1.05 }),
          eScale: isP ? (isMiss ? undefined : { x: 0.95, y: 1.05 }) : undefined,
          showEffect: true,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 1,
        },
        // 2. Towering Cyclone Surge & Mid-Air Rapid Spin (90ms)
        {
          delay: 90,
          pOffset: isP ? { x: 16, y: -6 } : (isMiss ? { x: -26, y: 4 } : { x: 8, y: -90 }),
          eOffset: isP ? (isMiss ? { x: 26, y: -4 } : { x: -8, y: -90 }) : { x: -16, y: 6 },
          pRot: isP ? undefined : (isMiss ? undefined : -2.5),
          eRot: isP ? (isMiss ? undefined : 2.5) : undefined,
          pScale: isP ? undefined : (isMiss ? undefined : { x: 0.78, y: 0.78 }),
          eScale: isP ? (isMiss ? undefined : { x: 0.78, y: 0.78 }) : undefined,
          showEffect: true,
          hitFlash: isHit,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 2,
        },
        // 3. High Vortex Ascent & Shrinking (90ms)
        {
          delay: 90,
          pOffset: isP ? { x: 10, y: -3 } : (isMiss ? { x: -16, y: 2 } : { x: -15, y: -180 }),
          eOffset: isP ? (isMiss ? { x: 16, y: -2 } : { x: 15, y: -180 }) : { x: -10, y: 3 },
          pRot: isP ? undefined : (isMiss ? undefined : -5.8),
          eRot: isP ? (isMiss ? undefined : 5.8) : undefined,
          pScale: isP ? undefined : (isMiss ? undefined : { x: 0.52, y: 0.52 }),
          eScale: isP ? (isMiss ? undefined : { x: 0.52, y: 0.52 }) : undefined,
          showEffect: true,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 3,
        },
        // 4. Supersonic Ejection Launch into Deep Sky (90ms)
        {
          delay: 90,
          pOffset: isP ? { x: 6, y: -2 } : (isMiss ? { x: -8, y: 1 } : { x: -75, y: -260 }),
          eOffset: isP ? (isMiss ? { x: 8, y: -1 } : { x: 75, y: -260 }) : { x: -6, y: 2 },
          pRot: isP ? undefined : (isMiss ? undefined : -9.5),
          eRot: isP ? (isMiss ? undefined : 9.5) : undefined,
          pScale: isP ? undefined : (isMiss ? undefined : { x: 0.28, y: 0.28 }),
          eScale: isP ? (isMiss ? undefined : { x: 0.28, y: 0.28 }) : undefined,
          pAlpha: isP ? 1.0 : (isMiss ? 1.0 : 0.90),
          eAlpha: isP ? (isMiss ? 1.0 : 0.90) : 1.0,
          showEffect: true,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 4,
        },
        // 5. Far Horizon Tiny Speck with Star Twinkle Sparkle (110ms)
        {
          delay: 110,
          pOffset: isP ? { x: 2, y: 0 } : (isMiss ? { x: 0, y: 0 } : { x: -140, y: -340 }),
          eOffset: isP ? (isMiss ? { x: 0, y: 0 } : { x: 140, y: -340 }) : { x: -2, y: 0 },
          pRot: isP ? undefined : (isMiss ? undefined : -14.0),
          eRot: isP ? (isMiss ? undefined : 14.0) : undefined,
          pScale: isP ? undefined : (isMiss ? undefined : { x: 0.08, y: 0.08 }),
          eScale: isP ? (isMiss ? undefined : { x: 0.08, y: 0.08 }) : undefined,
          pAlpha: isP ? 1.0 : (isMiss ? 1.0 : 0.50),
          eAlpha: isP ? (isMiss ? 1.0 : 0.50) : 1.0,
          showEffect: true,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 5,
        },
        // 6. Vanished Beyond Horizon & Lingering Breeze (100ms)
        {
          delay: 100,
          pOffset: isP ? { x: 0, y: 0 } : (isMiss ? { x: 0, y: 0 } : { x: 0, y: -9999 }),
          eOffset: isP ? (isMiss ? { x: 0, y: 0 } : { x: 0, y: -9999 }) : { x: 0, y: 0 },
          pAlpha: isP ? 1.0 : (isMiss ? 1.0 : 0.0),
          eAlpha: isP ? (isMiss ? 1.0 : 0.0) : 1.0,
          hidePlayer: isP ? false : (isMiss ? false : true),
          hidePShadow: isP ? false : (isMiss ? false : true),
          hideEnemy: isP ? (isMiss ? false : true) : false,
          hideEShadow: isP ? (isMiss ? false : true) : false,
          showEffect: true,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 6,
        },
        // 7. Clean Final Settle on Arena (100ms)
        {
          delay: 100,
          pOffset: { x: 0, y: 0 },
          eOffset: isP ? (isMiss ? { x: 0, y: 0 } : { x: 0, y: -9999 }) : { x: 0, y: 0 },
          pAlpha: isP ? 1.0 : (isMiss ? 1.0 : 0.0),
          eAlpha: isP ? (isMiss ? 1.0 : 0.0) : 1.0,
          hidePlayer: isP ? false : (isMiss ? false : true),
          hidePShadow: isP ? false : (isMiss ? false : true),
          hideEnemy: isP ? (isMiss ? false : true) : false,
          hideEShadow: isP ? (isMiss ? false : true) : false,
          showEffect: false,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 6,
        }
      ];
  }
};

export const bindAnimation: BattleMoveAnimation = {
  key: 'bind',
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, isMiss, action: a, enemyHp, playerHp, textLineIdx, usePlayerFront, useEnemyBack } = ctx;
    const isTurn1Launch = (a as any).isTurn1Launch || ((a.damage ?? 0) === 0 && ((a as any).chargingMove === 'fly' || a.moveKey === 'fly'));
    const hits = (a as any).hits || 2;
    return [
        // 1. Enter Left Foot (9 o'clock) (60ms)
        {
          delay: 60,
          pOffset: isP ? { x: 195, y: -62 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: -195, y: 114 } : { x: 0, y: 0 },
          pScale: isP ? { x: 0.74, y: 0.74 } : undefined,
          eScale: !isP ? { x: 1.36, y: 1.36 } : undefined,
          pRot: isP ? -0.12 : undefined,
          eRot: !isP ? 0.12 : undefined,
          usePlayerFront: isP,
          useEnemyBack: !isP,
          drawEnemyOnTop: !isP,
          showEffect: true,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 1,
        },
        // 2. Glide Front Bottom Foot (6 o'clock) (60ms)
        {
          delay: 60,
          pOffset: isP ? { x: 230, y: -54 } : (isMiss ? { x: 14, y: 3 } : { x: -5, y: 3 }),
          eOffset: isP ? (isMiss ? { x: 14, y: -3 } : { x: 5, y: -3 }) : { x: -230, y: 118 },
          pScale: isP ? { x: 0.74, y: 0.74 } : undefined,
          eScale: !isP ? { x: 1.36, y: 1.36 } : undefined,
          pRot: isP ? -0.06 : undefined,
          eRot: !isP ? 0.06 : undefined,
          usePlayerFront: isP,
          useEnemyBack: !isP,
          drawEnemyOnTop: !isP,
          showEffect: true,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 2,
        },
        // 3. Curve Bottom-Right Ankle (4 o'clock) (60ms)
        {
          delay: 60,
          pOffset: isP ? { x: 272, y: -62 } : (isMiss ? { x: 18, y: 4 } : { x: -7, y: 4 }),
          eOffset: isP ? (isMiss ? { x: 18, y: -4 } : { x: 7, y: -4 }) : { x: -272, y: 110 },
          pScale: isP ? { x: 0.74, y: 0.74 } : undefined,
          eScale: !isP ? { x: 1.36, y: 1.36 } : undefined,
          pRot: isP ? 0.06 : undefined,
          eRot: !isP ? -0.06 : undefined,
          usePlayerFront: !isP,
          useEnemyBack: isP,
          drawEnemyOnTop: !isP,
          showEffect: true,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 2,
        },
        // 4. Ascend Right Flank Behind (3 o'clock) (60ms)
        {
          delay: 60,
          pOffset: isP ? { x: 290, y: -76 } : (isMiss ? { x: 20, y: 4 } : { x: -8, y: 4 }),
          eOffset: isP ? (isMiss ? { x: 20, y: -4 } : { x: 8, y: -4 }) : { x: -290, y: 96 },
          pScale: isP ? { x: 0.74, y: 0.74 } : undefined,
          eScale: !isP ? { x: 1.36, y: 1.36 } : undefined,
          pRot: isP ? 0.12 : undefined,
          eRot: !isP ? -0.12 : undefined,
          usePlayerFront: !isP,
          useEnemyBack: isP,
          drawEnemyOnTop: isP, // Behind defender
          showEffect: true,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 3,
        },
        // 5. Wrap Waist Behind (12 o'clock) (60ms)
        {
          delay: 60,
          pOffset: isP ? { x: 260, y: -94 } : (isMiss ? { x: 22, y: 4 } : { x: -8, y: 4 }),
          eOffset: isP ? (isMiss ? { x: 22, y: -4 } : { x: 8, y: -4 }) : { x: -260, y: 78 },
          pScale: isP ? { x: 0.74, y: 0.74 } : undefined,
          eScale: !isP ? { x: 1.36, y: 1.36 } : undefined,
          pRot: isP ? 0.08 : undefined,
          eRot: !isP ? -0.08 : undefined,
          usePlayerFront: !isP,
          useEnemyBack: isP,
          drawEnemyOnTop: isP, // Behind defender
          showEffect: true,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 4,
        },
        // 6. Emerge Upper Left Chest (9 o'clock) (60ms)
        {
          delay: 60,
          pOffset: isP ? { x: 215, y: -102 } : (isMiss ? { x: 24, y: 4 } : { x: -9, y: 4 }),
          eOffset: isP ? (isMiss ? { x: 24, y: -4 } : { x: 9, y: -4 }) : { x: -215, y: 70 },
          pScale: isP ? { x: 0.74, y: 0.74 } : undefined,
          eScale: !isP ? { x: 1.36, y: 1.36 } : undefined,
          pRot: isP ? -0.08 : undefined,
          eRot: !isP ? 0.08 : undefined,
          usePlayerFront: isP,
          useEnemyBack: !isP,
          drawEnemyOnTop: !isP, // In front of upper chest
          showEffect: true,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 5,
        },
        // 7. Lock Upper Front Torso (60ms)
        {
          delay: 60,
          pOffset: isP ? { x: 235, y: -104 } : (isMiss ? { x: 25, y: 4 } : { x: -9, y: 4 }),
          eOffset: isP ? (isMiss ? { x: 25, y: -4 } : { x: 9, y: -4 }) : { x: -235, y: 68 },
          pScale: isP ? { x: 0.74, y: 0.74 } : undefined,
          eScale: !isP ? { x: 1.36, y: 1.36 } : undefined,
          pRot: isP ? -0.04 : undefined,
          eRot: !isP ? 0.04 : undefined,
          usePlayerFront: isP,
          useEnemyBack: !isP,
          drawEnemyOnTop: !isP,
          showEffect: true,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 6,
        },
        // 8. Full Constriction Squeeze Clamp & Impact Burst (160ms)
        {
          delay: 160,
          pOffset: isP ? { x: 245, y: -86 } : (isMiss ? { x: 26, y: 4 } : { x: -10, y: 4 }),
          eOffset: isP ? (isMiss ? { x: 26, y: -4 } : { x: 10, y: -4 }) : { x: -245, y: 86 },
          pScale: isP ? { x: 0.76, y: 0.76 } : { x: 0.65, y: 1.40 },
          eScale: isP ? { x: 0.65, y: 1.40 } : { x: 1.40, y: 1.40 },
          pRot: 0,
          eRot: 0,
          usePlayerFront: !isP,
          useEnemyBack: isP,
          drawEnemyOnTop: !isP,
          showEffect: true,
          hitFlash: isHit,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 7, // Max Squeeze Clamp
        },
        // 9. Pulse Squeeze Lock (90ms)
        {
          delay: 90,
          pOffset: isP ? { x: 245, y: -86 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: -245, y: 86 } : { x: 0, y: 0 },
          pScale: isP ? { x: 0.74, y: 0.74 } : { x: 0.80, y: 1.20 },
          eScale: isP ? { x: 0.80, y: 1.20 } : { x: 1.36, y: 1.36 },
          usePlayerFront: isP,
          useEnemyBack: !isP,
          drawEnemyOnTop: !isP,
          showEffect: true,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 8, // Pulse
        },
        // 10. Smooth Spring Back Leap 1 (55ms)
        {
          delay: 55,
          pOffset: isP ? { x: 155, y: -65 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: -155, y: 65 } : { x: 0, y: 0 },
          pScale: isP ? { x: 0.84, y: 0.84 } : { x: 0.92, y: 1.08 },
          eScale: isP ? { x: 0.92, y: 1.08 } : { x: 1.26, y: 1.26 },
          drawEnemyOnTop: !isP,
          showEffect: true,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 9,
        },
        // 11. Smooth Spring Back Leap 2 (55ms)
        {
          delay: 55,
          pOffset: isP ? { x: 75, y: -32 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: -75, y: 32 } : { x: 0, y: 0 },
          pScale: isP ? { x: 0.92, y: 0.92 } : { x: 0.98, y: 1.02 },
          eScale: isP ? { x: 0.98, y: 1.02 } : { x: 1.12, y: 1.12 },
          drawEnemyOnTop: !isP,
          showEffect: true,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 9,
        },
        // 12. Touchdown Landing (60ms)
        {
          delay: 60,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          pScale: undefined,
          eScale: undefined,
          showEffect: false,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
        }
      ];
  }
};

export const slamAnimation: BattleMoveAnimation = {
  key: 'slam',
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, isMiss, action: a, enemyHp, playerHp, textLineIdx, usePlayerFront, useEnemyBack } = ctx;
    const isTurn1Launch = (a as any).isTurn1Launch || ((a.damage ?? 0) === 0 && ((a as any).chargingMove === 'fly' || a.moveKey === 'fly'));
    const hits = (a as any).hits || 2;
    return [
        // 1. 가만히 정지 (Still pause - 80ms)
        {
          delay: 80,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 1,
        },
        // 2. 스프라이트 살짝 뒤로 빠지며 힘 모으기 (Pull back / coil windup - 90ms)
        {
          delay: 90,
          pOffset: isP ? { x: -22, y: 4 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: 22, y: -4 } : { x: 0, y: 0 },
          pScale: isP ? { x: 0.92, y: 1.08 } : undefined,
          eScale: !isP ? { x: 0.92, y: 1.08 } : undefined,
          pRot: isP ? -0.08 : undefined,
          eRot: !isP ? 0.08 : undefined,
          showEffect: false,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 1,
        },
        // 3. 팍! 전방 급발진 돌진 강타 & 이펙트 폭발! (BAM! Explosive Forward Slam - 100ms)
        {
          delay: 100,
          pOffset: isP ? { x: 38, y: -12 } : (isMiss ? { x: 26, y: 4 } : { x: -14, y: 4 }),
          eOffset: isP ? (isMiss ? { x: 26, y: -4 } : { x: 22, y: -8 }) : { x: -38, y: 12 },
          pScale: isP ? { x: 1.25, y: 0.82 } : undefined,
          eScale: isP ? { x: 0.85, y: 1.15 } : { x: 1.25, y: 0.82 },
          pRot: isP ? 0.12 : undefined,
          eRot: !isP ? -0.12 : undefined,
          showEffect: true,
          hitFlash: isHit,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 2,
        },
        // 4. 강타 반동 & 충격파 여파 (Recoil shake - 90ms)
        {
          delay: 90,
          pOffset: isP ? { x: 16, y: -4 } : (isMiss ? { x: 12, y: 2 } : { x: -6, y: 2 }),
          eOffset: isP ? (isMiss ? { x: 12, y: -2 } : { x: 12, y: -2 }) : { x: -16, y: 4 },
          pScale: isP ? { x: 1.05, y: 0.95 } : undefined,
          eScale: !isP ? { x: 1.05, y: 0.95 } : undefined,
          showEffect: true,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 3,
        },
        // 5. 복귀 원위치 (Recovery - 80ms)
        {
          delay: 80,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
        }
      ];
  }
};

export const vineWhipAnimation: BattleMoveAnimation = {
  key: 'vine-whip',
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, isMiss, action: a, enemyHp, playerHp, textLineIdx, usePlayerFront, useEnemyBack } = ctx;
    const isTurn1Launch = (a as any).isTurn1Launch || ((a.damage ?? 0) === 0 && ((a as any).chargingMove === 'fly' || a.moveKey === 'fly'));
    const hits = (a as any).hits || 2;
    return [
        // 1A. 1차 덩굴 발사 진입 (Vine 1 Shoots - 75ms)
        {
          delay: 75,
          pOffset: isP ? { x: 6, y: -2 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: -6, y: 2 } : { x: 0, y: 0 },
          pRot: isP ? 0.03 : undefined,
          eRot: !isP ? -0.03 : undefined,
          showEffect: true,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 1,
        },
        // 1B. 1타: 왼쪽에서 오른쪽으로 채찍 강타! (Left-to-Right Lash - 95ms)
        {
          delay: 95,
          pOffset: isP ? { x: 14, y: -4 } : { x: 0, y: 0 },
          eOffset: isP ? (isMiss ? { x: 14, y: -2 } : { x: 14, y: -4 }) : { x: -14, y: 4 },
          pRot: isP ? 0.05 : undefined,
          eRot: !isP ? -0.05 : undefined,
          showEffect: true,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 1,
        },
        // 1C. 1차 채찍 잔상 지속 & 2차 덩굴 준비 (Trail Holds & 2nd Vine Ready - 80ms)
        {
          delay: 80,
          pOffset: isP ? { x: 10, y: -3 } : { x: 0, y: 0 },
          eOffset: isP ? (isMiss ? { x: 10, y: -2 } : { x: 10, y: -3 }) : { x: -10, y: 3 },
          pRot: isP ? -0.01 : undefined,
          eRot: !isP ? 0.01 : undefined,
          showEffect: true,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 1,
        },
        // 2A. 2차 덩굴 진입 휘두르기 (Vine 2 Swings - 75ms)
        {
          delay: 75,
          pOffset: isP ? { x: 12, y: -5 } : (isMiss ? { x: 16, y: 2 } : { x: -8, y: 2 }),
          eOffset: isP ? (isMiss ? { x: 16, y: -2 } : { x: 16, y: -5 }) : { x: -12, y: 5 },
          pRot: isP ? -0.03 : undefined,
          eRot: !isP ? 0.03 : undefined,
          showEffect: true,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 2,
        },
        // 2B. 2타: 오른쪽에서 왼쪽으로 교차 참격 강타! ('X' Cross Strike - 105ms)
        {
          delay: 105,
          pOffset: isP ? { x: 18, y: -6 } : (isMiss ? { x: 20, y: 4 } : { x: -12, y: 4 }),
          eOffset: isP ? (isMiss ? { x: 20, y: -4 } : { x: 22, y: -8 }) : { x: -18, y: 6 },
          pRot: isP ? -0.06 : undefined,
          eRot: !isP ? 0.06 : undefined,
          showEffect: true,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 2,
        },
        // 3A. 채찍 듀얼 잔상 및 흩날리는 잎새 (Trails Fade & Leaves Scatter - 85ms)
        {
          delay: 85,
          pOffset: isP ? { x: 10, y: -3 } : (isMiss ? { x: 12, y: 2 } : { x: -6, y: 2 }),
          eOffset: isP ? (isMiss ? { x: 12, y: -2 } : { x: 12, y: -4 }) : { x: -10, y: 3 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 3,
        },
        // 3B. 덩굴 회수 (Vines Retract - 80ms)
        {
          delay: 80,
          pOffset: isP ? { x: 4, y: -1 } : { x: 0, y: 0 },
          eOffset: isP ? (isMiss ? { x: 4, y: 0 } : { x: 4, y: -1 }) : { x: -4, y: 1 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 3,
        },
        // 4. 완전 복귀 (Neutral - 75ms)
        {
          delay: 75,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
        }
      ];
  }
};

export const stompAnimation: BattleMoveAnimation = {
  key: 'stomp',
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, isMiss, action: a, enemyHp, playerHp, textLineIdx, usePlayerFront, useEnemyBack } = ctx;
    const isTurn1Launch = (a as any).isTurn1Launch || ((a.damage ?? 0) === 0 && ((a as any).chargingMove === 'fly' || a.moveKey === 'fly'));
    const hits = (a as any).hits || 2;
    return [
        // 1. 적의 좌상단으로 접근 & 앞쪽으로 살짝 기울임 (원근법 축소/확대 적용 - 100ms)
        {
          delay: 100,
          pOffset: isP ? { x: 217, y: -86 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: -217, y: 50 } : { x: 0, y: 0 },
          pRot: isP ? 0.18 : undefined,
          eRot: !isP ? -0.18 : undefined,
          pScale: isP ? { x: 0.82, y: 0.82 } : undefined,
          eScale: !isP ? { x: 1.25, y: 1.25 } : undefined,
          hidePShadow: isP,
          hideEShadow: !isP,
          drawEnemyOnTop: !isP,
          showEffect: true,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 1,
        },
        // 2. 검은 타원 쿵! 누름 + 상대 가로로 넓어지며 납작해짐 (원근감 비례 짓누르기 - 130ms)
        {
          delay: 130,
          pOffset: isP ? { x: 219, y: -78 } : (isMiss ? { x: 20, y: 0 } : { x: 0, y: 8 }),
          eOffset: isP ? (isMiss ? { x: 20, y: 0 } : { x: 0, y: 8 }) : { x: -219, y: 58 },
          pRot: isP ? 0.22 : undefined,
          eRot: !isP ? -0.22 : undefined,
          pScale: isP ? { x: 0.92, y: 0.70 } : (isMiss ? undefined : { x: 1.25, y: 0.70 }),
          eScale: isP ? (isMiss ? undefined : { x: 1.25, y: 0.70 }) : { x: 1.40, y: 1.05 },
          hidePShadow: isP,
          hideEShadow: !isP,
          drawEnemyOnTop: !isP,
          showEffect: true,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 2,
        },
        // 3. 꾹 누르고 버티기 & 지면 먼지 (원근감 비례 유지 - 110ms)
        {
          delay: 110,
          pOffset: isP ? { x: 219, y: -78 } : (isMiss ? { x: 20, y: 0 } : { x: 0, y: 6 }),
          eOffset: isP ? (isMiss ? { x: 20, y: 0 } : { x: 0, y: 6 }) : { x: -219, y: 58 },
          pRot: isP ? 0.20 : undefined,
          eRot: !isP ? -0.20 : undefined,
          pScale: isP ? { x: 0.86, y: 0.74 } : (isMiss ? undefined : { x: 1.20, y: 0.75 }),
          eScale: isP ? (isMiss ? undefined : { x: 1.20, y: 0.75 }) : { x: 1.32, y: 1.12 },
          hidePShadow: isP,
          hideEShadow: !isP,
          drawEnemyOnTop: !isP,
          showEffect: true,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 3,
        },
        // 4. 원위치 복귀 (Recovery Leap Back - 90ms)
        {
          delay: 90,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          pScale: isP ? undefined : (isMiss ? undefined : { x: 0.97, y: 1.05 }),
          eScale: isP ? (isMiss ? undefined : { x: 0.97, y: 1.05 }) : undefined,
          showEffect: false,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
        }
      ];
  }
};

export const doubleKickAnimation: BattleMoveAnimation = {
  key: 'double-kick',
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, isMiss, action: a, enemyHp, playerHp, textLineIdx, usePlayerFront, useEnemyBack } = ctx;
    const isTurn1Launch = (a as any).isTurn1Launch || ((a.damage ?? 0) === 0 && ((a as any).chargingMove === 'fly' || a.moveKey === 'fly'));
    const hits = (a as any).hits || 2;
    return [
        // 1A. 도약 전진 (Windup Leap - 75ms)
        {
          delay: 75,
          pOffset: isP ? { x: 12, y: -6 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: -12, y: 6 } : { x: 0, y: 0 },
          pRot: isP ? -0.04 : undefined,
          eRot: !isP ? 0.04 : undefined,
          showEffect: false,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
        },
        // 1B. 1타: 좌상단 대각선 강타 (Top-Left Strike - 95ms)
        {
          delay: 95,
          pOffset: isP ? { x: 22, y: -14 } : (isMiss ? { x: 24, y: 4 } : { x: -14, y: 6 }),
          eOffset: isP ? (isMiss ? { x: 24, y: -4 } : { x: 14, y: 8 }) : { x: -22, y: 14 },
          pRot: isP ? -0.07 : undefined,
          eRot: !isP ? 0.07 : undefined,
          showEffect: true,
          hitFlash: isHit,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 1,
        },
        // 1C. 1타 반동 및 공중 회전 피벗 (Recoil & Aerial Pivot - 80ms)
        {
          delay: 80,
          pOffset: isP ? { x: 16, y: -10 } : (isMiss ? { x: 20, y: 3 } : { x: -10, y: 4 }),
          eOffset: isP ? (isMiss ? { x: 20, y: -3 } : { x: 9, y: 5 }) : { x: -16, y: 10 },
          pRot: isP ? 0.01 : undefined,
          eRot: !isP ? -0.01 : undefined,
          showEffect: true,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 1,
        },
        // 2A. 2타 하향 다이브 준비 (Dive Approach - 75ms)
        {
          delay: 75,
          pOffset: isP ? { x: 22, y: -3 } : (isMiss ? { x: 24, y: 3 } : { x: -14, y: -2 }),
          eOffset: isP ? (isMiss ? { x: 24, y: -3 } : { x: 12, y: -2 }) : { x: -22, y: 3 },
          pRot: isP ? 0.05 : undefined,
          eRot: !isP ? -0.05 : undefined,
          showEffect: false,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 2,
        },
        // 2B. 2타: 우하단 대각선 강타 (Bottom-Right Strike - 105ms)
        {
          delay: 105,
          pOffset: isP ? { x: 28, y: -3 } : (isMiss ? { x: 28, y: 4 } : { x: -18, y: -4 }),
          eOffset: isP ? (isMiss ? { x: 28, y: -4 } : { x: 18, y: -6 }) : { x: -28, y: 3 },
          pRot: isP ? 0.09 : undefined,
          eRot: !isP ? -0.09 : undefined,
          showEffect: true,
          hitFlash: isHit,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 2,
        },
        // 3A. 듀얼 잔상 및 공중 반동 (Dual Afterglow - 85ms)
        {
          delay: 85,
          pOffset: isP ? { x: 14, y: -6 } : (isMiss ? { x: 14, y: 2 } : { x: -8, y: 2 }),
          eOffset: isP ? (isMiss ? { x: 14, y: -2 } : { x: 8, y: -2 }) : { x: -14, y: 6 },
          pRot: isP ? 0.04 : undefined,
          eRot: !isP ? -0.04 : undefined,
          showEffect: true,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 3,
        },
        // 3B. 착지 복귀 (Landing - 80ms)
        {
          delay: 80,
          pOffset: isP ? { x: 5, y: -1 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: -5, y: 1 } : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
        },
        // 4. 완전 원위치 (Neutral - 75ms)
        {
          delay: 75,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
        }
      ];
  }
};

export const singleStrikeSpecialAnimation: BattleMoveAnimation = {
  key: 'single-strike-special',
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, isMiss, action: a, enemyHp, playerHp, textLineIdx, usePlayerFront, useEnemyBack } = ctx;
    const isTurn1Launch = (a as any).isTurn1Launch || ((a.damage ?? 0) === 0 && ((a as any).chargingMove === 'fly' || a.moveKey === 'fly'));
    const hits = (a as any).hits || 2;
    return [
        // 1. Windup Lunge (100ms)
        {
          delay: 100,
          pOffset: isP ? { x: 18, y: -8 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: -18, y: 8 } : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
        },
        // 2. Direct Strike Impact (100ms)
        {
          delay: 100,
          pOffset: isP ? { x: 22, y: -9 } : (isMiss ? { x: 26, y: 4 } : { x: -14, y: 4 }),
          eOffset: isP ? (isMiss ? { x: 26, y: -4 } : { x: 14, y: -4 }) : { x: -22, y: 9 },
          showEffect: true,
          hitFlash: isHit,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 1,
        },
        // 3. Effect Action (100ms)
        {
          delay: 100,
          pOffset: isP ? { x: 14, y: -5 } : (isMiss ? { x: 16, y: 2 } : { x: -8, y: 2 }),
          eOffset: isP ? (isMiss ? { x: 16, y: -2 } : { x: 8, y: -2 }) : { x: -14, y: 5 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 2,
        },
        // 4. Recovery (100ms)
        {
          delay: 100,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 3,
        }
      ];
  }
};

export const defaultAnimation: BattleMoveAnimation = {
  key: 'default',
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, isMiss, action: a, enemyHp, playerHp, textLineIdx, usePlayerFront, useEnemyBack } = ctx;
    const isTurn1Launch = (a as any).isTurn1Launch || ((a.damage ?? 0) === 0 && ((a as any).chargingMove === 'fly' || a.moveKey === 'fly'));
    const hits = (a as any).hits || 2;
    return [
        // 1. Standard Windup (100ms)
        {
          delay: 100,
          pOffset: isP ? (a.isSpecial ? { x: 0, y: -6 } : { x: 18, y: -8 }) : { x: 0, y: 0 },
          eOffset: !isP ? (a.isSpecial ? { x: 0, y: -6 } : { x: -18, y: 8 }) : { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: enemyHp,
          playerHp: playerHp,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 1,
        },
        // 2. Standard Strike Impact (100ms)
        {
          delay: 100,
          pOffset: isP ? { x: 22, y: -9 } : (isMiss ? { x: 26, y: 4 } : { x: -14, y: 4 }),
          eOffset: isP ? (isMiss ? { x: 26, y: -4 } : { x: 14, y: -4 }) : { x: -22, y: 9 },
          showEffect: true,
          hitFlash: isHit,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 2,
        },
        // 3. Recoil Shake (100ms)
        {
          delay: 100,
          pOffset: isP ? { x: 12, y: -4 } : (isMiss ? { x: 12, y: 2 } : { x: -6, y: 2 }),
          eOffset: isP ? (isMiss ? { x: 12, y: -2 } : { x: 6, y: -2 }) : { x: -12, y: 4 },
          showEffect: true,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
          moveStep: 3,
        },
        // 4. Recovery (100ms)
        {
          delay: 100,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          showEffect: false,
          hitFlash: false,
          enemyHp: a.enemyHpAfter,
          playerHp: a.playerHpAfter,
          textLineIdx: textLineIdx,
          isBlur: false,
          moveEffect: a,
        }
      ];
  }
};


export const MOVE_REGISTRY: Record<string, BattleMoveAnimation> = {
  'status': statusAnimation,
  'karate-chop': karateChopAnimation,
  'karatechop': karateChopAnimation,
  'double-slap': doubleSlapAnimation,
  'doubleslap': doubleSlapAnimation,
  'comet-punch': cometPunchAnimation,
  'cometpunch': cometPunchAnimation,
  'mega-punch': megaPunchAnimation,
  'megapunch': megaPunchAnimation,
  'pay-day': payDayAnimation,
  'payday': payDayAnimation,
  'fire-punch': firePunchAnimation,
  'firepunch': firePunchAnimation,
  'ice-punch': icePunchAnimation,
  'icepunch': icePunchAnimation,
  'guillotine': guillotineAnimation,
  'swords-dance': swordsDanceAnimation,
  'swordsdance': swordsDanceAnimation,
  'fly': flyAnimation,
  'razor-wind': razorWindAnimation,
  'razorwind': razorWindAnimation,
  'wing-attack': wingAttackAnimation,
  'wingattack': wingAttackAnimation,
  'whirlwind': whirlwindAnimation,
  'bind': bindAnimation,
  'wrap': bindAnimation,
  'clamp': bindAnimation,
  'sand-tomb': bindAnimation,
  'whirlpool': bindAnimation,
  'fire-spin': bindAnimation,
  'infestation': bindAnimation,
  'snap-trap': bindAnimation,
  'slam': slamAnimation,
  'vine-whip': vineWhipAnimation,
  'vinewhip': vineWhipAnimation,
  'stomp': stompAnimation,
  'double-kick': doubleKickAnimation,
  'doublekick': doubleKickAnimation,
  'thunder-punch': singleStrikeSpecialAnimation,
  'thunderpunch': singleStrikeSpecialAnimation,
  'scratch': singleStrikeSpecialAnimation,
  'vice-grip': singleStrikeSpecialAnimation,
  'vicegrip': singleStrikeSpecialAnimation,
  'cut': singleStrikeSpecialAnimation,
  'gust': singleStrikeSpecialAnimation,
  'default': defaultAnimation,
};

export function getMoveAnimation(moveKey: string, isStatus: boolean = false): BattleMoveAnimation {
  if (isStatus) return statusAnimation;
  const key = (moveKey || '').toLowerCase().replace(/[\s_]+/g, '-');
  return MOVE_REGISTRY[key] || defaultAnimation;
}
