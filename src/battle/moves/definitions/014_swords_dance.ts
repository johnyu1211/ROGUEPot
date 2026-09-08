import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawSwordsDanceEffect } from "../../../renderers/moves/gen1/move013_016.js";

export const swordsDanceMove: BattleMoveAnimation = {
  num: 14,
  key: "swords-dance",
  nameKo: "칼춤",
  nameEn: "Swords Dance",
  type: "normal",
  category: "status",
  camera: { type: "self", zoom: 1.20 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;
    return [
      // 1. Low 3D Orbit around Waist (120ms)
      {
        delay: 120,
        pOffset: isP ? { x: 0, y: -2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -2 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 1,
        phaseId: "3-swords-orbit-1",
        phaseName: "3. 하단 3D 칼 회전",
      },
      // 2. Ascending 3D Orbit - 1st Spin (120ms)
      {
        delay: 120,
        pOffset: isP ? { x: 0, y: -4 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -4 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 2,
        phaseId: "3-swords-orbit-2",
        phaseName: "3. 중단 3D 나선 상승",
      },
      // 3. Mid-High 3D Orbit - 2nd Spin (120ms)
      {
        delay: 120,
        pOffset: isP ? { x: 0, y: -6 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -6 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 3,
        phaseId: "3-swords-orbit-3",
        phaseName: "3. 상단 3D 나선 상승",
      },
      // 4. High 3D Orbit & Inward Tilt toward Apex (130ms)
      {
        delay: 130,
        pOffset: isP ? { x: 0, y: -7 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -7 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 4,
        phaseId: "3-swords-orbit-4",
        phaseName: "3. 정점 궤도 진입",
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
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 5,
        phaseId: "4-swords-clash",
        phaseName: "4. 정점 검극 격돌 (Clash)",
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
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 6,
        phaseId: "5-swords-dispersal",
        phaseName: "5. 오라 확산 & 잔상",
      }
    ];
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (frame.showEffect && drawCtx.attackerPos) {
      drawSwordsDanceEffect(targetCtx, drawCtx.attackerPos, frame.moveStep ?? 1);
    }
  }
};
