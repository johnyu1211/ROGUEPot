import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawMegaPunchEffect } from "../../../renderers/moves/gen1/move005_008.js";

export const megaPunchMove: BattleMoveAnimation = {
  num: 5,
  key: "mega-punch",
  nameKo: "메가톤펀치",
  nameEn: "Mega Punch",
  type: "normal",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;
    return [
      // 1. 회전 충전 1단계: 황금빛 링과 함께 비스듬히 회전하며 반투명(40%) 출현
      {
        delay: 110,
        pOffset: isP ? { x: -14, y: 5 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 14, y: -5 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 1,
        phaseId: "mega-punch-spin-1",
        phaseName: "1. 주먹 회전 진입 (35%)",
      },
      // 2. 회전 충전 2단계: 주먹이 고속 회전하며 최대 불투명도 60%로 압축
      {
        delay: 110,
        pOffset: isP ? { x: -22, y: 8 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 22, y: -8 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 2,
        phaseId: "mega-punch-spin-2",
        phaseName: "2. 주먹 고속 회전 (최대 60%)",
      },
      // 3. 메가톤 임팩트: 정면 완전 불투명(100%) 주먹으로 정면 스트레이트 강타 작렬!
      {
        delay: 240,
        pOffset: isP ? { x: 38, y: -14 } : { x: -12, y: 6 },
        eOffset: isP ? { x: 0, y: 0 } : { x: -38, y: 14 },
        showEffect: true,
        hitFlash: true,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 3,
        phaseId: "mega-punch-impact",
        phaseName: "3. 정면 메가톤 강타 작렬",
      },
      // 4. 충격파 분산 (140ms)
      {
        delay: 140,
        pOffset: isP ? { x: 28, y: -10 } : { x: -8, y: 4 },
        eOffset: isP ? { x: 0, y: 0 } : { x: -28, y: 10 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 4,
        phaseId: "mega-punch-shockwave",
        phaseName: "4. 충격파 분산",
      },
      // 5. 착지 및 복귀 (100ms)
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
        phaseId: "recovery",
        phaseName: "5. 착지 / 복귀",
      }
    ];
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (drawCtx.targetPos && (frame.showEffect || (frame.moveStep && frame.moveStep >= 1))) {
      drawMegaPunchEffect(targetCtx, drawCtx.targetPos, frame.moveStep ?? 3);
    }
  }
};
