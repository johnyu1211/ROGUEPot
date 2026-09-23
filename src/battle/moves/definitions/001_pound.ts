import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawPoundEffect } from "../../../renderers/moves/gen1/move001_004.js";

export const poundMove: BattleMoveAnimation = {
  num: 1,
  key: "pound",
  nameKo: "막치기",
  nameEn: "Pound",
  type: "normal",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;
    const cOff = (x: number, y: number) =>
      isP ? { pOffset: { x, y } } : { eOffset: { x: -x, y: -y } };

    const cTargetOff = (x: number, y: number) =>
      isP ? { eOffset: { x, y } } : { pOffset: { x: -x, y: -y } };

    const cTransform = (scaleX: number, scaleY: number, rot: number) => ({
      pScale: isP ? { x: scaleX, y: scaleY } : undefined,
      eScale: !isP ? { x: scaleX, y: scaleY } : undefined,
      pRot: isP ? rot : 0,
      eRot: !isP ? -rot : 0,
    });

    return [
      // 1. 전진 접근 및 타격 준비 (80ms)
      {
        delay: 80,
        ...cOff(16, -8),
        ...cTargetOff(0, 0),
        ...cTransform(1.08, 0.92, -0.05),
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
      },
      // 2. 강한 막치기 직격 (75ms, prog: 0.20) - 순백 스타버스트 섬광 작렬
      {
        delay: 75,
        ...cOff(34, -15),
        ...(isHit ? cTargetOff(10, -4) : cTargetOff(0, 0)),
        ...cTransform(1.15, 0.88, 0.04),
        showEffect: isHit,
        hitFlash: isHit,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 2,
        effectProgress: 0.20,
      },
      // 3. 충격 폭발 및 넉백 (85ms, prog: 0.70) - 충격파 링 확산 & 별빛 스파크 비산
      {
        delay: 85,
        ...cOff(36, -16),
        ...(isHit ? cTargetOff(16, -6) : cTargetOff(0, 0)),
        ...cTransform(1.10, 0.92, 0.02),
        showEffect: isHit,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 2,
        effectProgress: 0.70,
      },
      // 4. 타격 반동 및 수습 (95ms, prog: 1.0)
      {
        delay: 95,
        ...cOff(18, -8),
        ...(isHit ? cTargetOff(6, -2) : cTargetOff(0, 0)),
        ...cTransform(0.96, 1.04, 0),
        showEffect: isHit,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 3,
        effectProgress: 1.0,
      },
      // 5. 정위치 복귀 (80ms)
      {
        delay: 80,
        ...cOff(0, 0),
        ...cTargetOff(0, 0),
        ...cTransform(1.0, 1.0, 0),
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
    if (frame.showEffect && drawCtx.targetPos) {
      drawPoundEffect(targetCtx, drawCtx.targetPos, frame.moveStep ?? 1, frame.effectProgress ?? 0.5);
    }
  }
};
