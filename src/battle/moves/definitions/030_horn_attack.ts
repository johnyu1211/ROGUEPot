import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawHornAttackEffect } from "../../../renderers/moves/gen1/move029_032.js";

export const hornAttackMove: BattleMoveAnimation = {
  num: 30,
  key: "horn-attack",
  nameKo: "뿔찌르기",
  nameEn: "Horn Attack",
  type: "normal",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    return [
      // 1. 노란 뿔이 시전 포켓몬 앞에 나타남
      {
        delay: 140,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 1,
        phaseId: "horn-appear",
        phaseName: "1. 노란 뿔 생성",
      },
      // 2. 뿔과 함께 대상 포켓몬 앞으로 빠르게 접근
      {
        delay: 140,
        pOffset: isP ? { x: 100, y: -38 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -100, y: 38 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 2,
        phaseId: "horn-rush",
        phaseName: "2. 뿔과 함께 돌진",
      },
      // 3. 바로 정면 앞에서 멈춤! (긴장감 고조 & 뿔 끝 섬광)
      {
        delay: 150,
        pOffset: isP ? { x: 165, y: -60 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -165, y: 60 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 3,
        phaseId: "horn-pause",
        phaseName: "3. 정면 앞 일시 정지",
      },
      // 4. 그대로 빠르게 뚫고 지나감! (관통 작렬 & 적 피격)
      {
        delay: 160,
        pOffset: isP ? { x: 280, y: -105 } : (isHit ? { x: -10, y: 5 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -280, y: 105 } : (isHit ? { x: 10, y: -5 } : { x: 0, y: 0 }),
        showEffect: true,
        hitFlash: isHit,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 4,
        phaseId: "horn-pierce-through",
        phaseName: "4. 관통 돌파 작렬",
      },
      // 5. 왼쪽 아래에서 나타나서 복귀 (반대편에서 진입)
      {
        delay: 140,
        pOffset: isP ? { x: -80, y: 40 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 80, y: -40 } : { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 5,
        phaseId: "horn-reappear",
        phaseName: "5. 왼쪽 아래 재등장",
      },
      // 6. 원래 제자리로 안착 복귀 완료
      {
        delay: 120,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 6,
        phaseId: "horn-return",
        phaseName: "6. 제자리 복귀",
      }
    ];
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawHornAttackEffect(targetCtx, frame, drawCtx);
  }
};
