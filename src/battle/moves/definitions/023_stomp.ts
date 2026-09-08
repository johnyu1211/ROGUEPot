import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawStompEffect } from "../../../renderers/moves/gen1/move021_024.js";

export const stompMove: BattleMoveAnimation = {
  num: 23,
  key: "stomp",
  nameKo: "짓밟기",
  nameEn: "Stomp",
  type: "normal",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, isMiss, action: a, enemyHp, playerHp, textLineIdx } = ctx;
    return [
      // 1. 적의 좌상단으로 접근 & 앞쪽으로 살짝 기울임 (원근법 축소/확대 적용 - 110ms)
      {
        delay: 110,
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
        enemyHp,
        playerHp,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 1,
      },
      // 2. 거대 발 도장 쿵! 찍힘 + 상대 가로로 뻗어지며 납작해짐 (원근감 비례 짓누르기 - 130ms)
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
        hitFlash: isHit,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
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
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 3,
      },
      // 4. 원위치 복귀 (Recovery Leap Back - 100ms)
      {
        delay: 100,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: isP ? undefined : (isMiss ? undefined : { x: 0.97, y: 1.05 }),
        eScale: isP ? (isMiss ? undefined : { x: 0.97, y: 1.05 }) : undefined,
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
      drawStompEffect(targetCtx, drawCtx.targetPos, frame.moveStep ?? 3);
    }
  }
};
