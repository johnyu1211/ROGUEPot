import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawFuryAttackEffect } from "../../../renderers/moves/gen1/move029_032.js";

export const furyAttackMove: BattleMoveAnimation = {
  num: 31,
  key: "fury-attack",
  nameKo: "마구찌르기",
  nameEn: "Fury Attack",
  type: "normal",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    return [
      // 1. 시전 포켓몬이 살짝 앞으로 움직이고 3개 나란히 뿔 원뿔 준비
      {
        delay: 130,
        pOffset: isP ? { x: 20, y: -8 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -20, y: 8 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 1,
        phaseId: "fury-step-prep",
        phaseName: "1. 전방 스텝 & 뿔 원뿔 3개 정렬",
      },
      // 2. 1차 연사: 3개의 뿔 원뿔이 나란히 고속 비행
      {
        delay: 120,
        pOffset: isP ? { x: 20, y: -8 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -20, y: 8 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 2,
        phaseId: "fury-wave1-fly",
        phaseName: "2. 1차 3연속 뿔 비행",
      },
      // 3. 1차 뿔 3개 동시 명중 작렬
      {
        delay: 140,
        pOffset: isP ? { x: 16, y: -6 } : (isHit ? { x: -6, y: 3 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -16, y: 6 } : (isHit ? { x: 6, y: -3 } : { x: 0, y: 0 }),
        showEffect: true,
        hitFlash: isHit,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 3,
        phaseId: "fury-wave1-hit",
        phaseName: "3. 1차 3연속 관통 타격",
      },
      // 4. 2차 연사: 시전자가 한 번 더 찌르며 2차 뿔 3개 나란히 발사
      {
        delay: 120,
        pOffset: isP ? { x: 28, y: -11 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -28, y: 11 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 4,
        phaseId: "fury-wave2-fly",
        phaseName: "4. 2차 연속 뿔 원뿔 발사",
      },
      // 5. 2차 뿔 명중 & 적 반동 대미지 적용
      {
        delay: 140,
        pOffset: isP ? { x: 20, y: -8 } : (isHit ? { x: -10, y: 5 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -20, y: 8 } : (isHit ? { x: 10, y: -5 } : { x: 0, y: 0 }),
        showEffect: true,
        hitFlash: isHit,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 5,
        phaseId: "fury-wave2-hit",
        phaseName: "5. 2차 마구찌르기 피니시",
      },
      // 6. 복귀
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
        phaseId: "fury-return",
        phaseName: "6. 제자리 복귀",
      }
    ];
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawFuryAttackEffect(targetCtx, frame, drawCtx);
  }
};
