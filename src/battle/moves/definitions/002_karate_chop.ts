import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawKarateChopEffect } from "../../../renderers/moves/gen1/move001_004.js";

export const karateChopMove: BattleMoveAnimation = {
  num: 2,
  key: "karate-chop",
  nameKo: "태권당수",
  nameEn: "Karate Chop",
  type: "fighting",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;
    return [
      // 1A: Hand appears hovering above target head (130ms)
      {
        delay: 130,
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
      // 1B: Minor pre-drop positioning (140ms)
      {
        delay: 140,
        pOffset: isP ? { x: 16, y: -6 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -16, y: 6 } : { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 2,
      },
      // 1C: Windup raise and hold (150ms)
      {
        delay: 150,
        pOffset: isP ? { x: 18, y: -8 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -18, y: 8 } : { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 3,
      },
      // 1D: Downward chop impact (머리 타격 찍음! 180ms)
      {
        delay: 180,
        pOffset: isP ? { x: 20, y: -10 } : { x: -8, y: 4 },
        eOffset: isP ? { x: 0, y: 0 } : { x: -20, y: 10 },
        showEffect: true,
        hitFlash: true,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 4,
      },
      // 1E: 머리 찍고 나서 손 서서히 투명해짐 1단계 (60% 불투명도, 110ms)
      {
        delay: 110,
        pOffset: isP ? { x: 14, y: -6 } : { x: -4, y: 2 },
        eOffset: isP ? { x: 0, y: 0 } : { x: -14, y: 6 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 5,
      },
      // 1F: 손 서서히 더 투명해짐 2단계 (25% 불투명도 잔상, 110ms)
      {
        delay: 110,
        pOffset: isP ? { x: 8, y: -3 } : { x: 0, y: 0 },
        eOffset: isP ? { x: 0, y: 0 } : { x: -8, y: 3 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 6,
      },
      // 1G: 손 완전히 사라지고 원래 위치 복귀 (100ms)
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
        moveStep: 7,
      }
    ];
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (drawCtx.targetPos && (frame.showEffect || (frame.moveStep && frame.moveStep >= 1))) {
      drawKarateChopEffect(targetCtx, drawCtx.targetPos, frame.moveStep ?? 4);
    }
  }
};
