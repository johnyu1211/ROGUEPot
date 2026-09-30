import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawScratchEffect } from "../../../renderers/moves/gen1/move009_012.js";

export const scratchMove: BattleMoveAnimation = {
  num: 10,
  key: "scratch",
  nameKo: "할퀴기",
  nameEn: "Scratch",
  type: "normal",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    const cOff = (x: number, y: number) =>
      isP ? { pOffset: { x, y } } : { eOffset: { x: -x, y: -y } };

    const tOff = (x: number, y: number) =>
      isP
        ? (isHit ? { eOffset: { x, y } } : { eOffset: { x: 0, y: 0 } })
        : (isHit ? { pOffset: { x: -x, y: -y } } : { pOffset: { x: 0, y: 0 } });

    if (!isHit) {
      return [
        {
          ...baseFrame,
          delay: 90,
          ...cOff(12, -4),
          ...tOff(0, 0),
          showEffect: false,
          moveStep: 0,
          phaseId: "scratch-miss-prep",
          phaseName: "1. 전방 도약 준비",
        },
        {
          ...baseFrame,
          delay: 100,
          ...cOff(24, -8),
          ...tOff(0, 0),
          showEffect: true,
          moveStep: 1,
          phaseId: "scratch-miss-swing",
          phaseName: "2. 할퀴기 헛스윙 출현",
        },
        {
          ...baseFrame,
          delay: 90,
          ...cOff(26, -9),
          ...(isP ? { eOffset: { x: 12, y: -4 } } : { pOffset: { x: -12, y: 4 } }),
          showEffect: true,
          moveStep: 2,
          phaseId: "scratch-miss-slide",
          phaseName: "3. 상대 회피 및 슬라이드 페이드",
        },
        {
          ...baseFrame,
          delay: 100,
          ...cOff(14, -5),
          ...tOff(0, 0),
          showEffect: false,
          moveStep: 3,
          phaseId: "scratch-miss-stumble",
          phaseName: "4. 완전 소멸 및 멈칫",
        },
        {
          ...baseFrame,
          delay: 110,
          ...cOff(0, 0),
          ...tOff(0, 0),
          showEffect: false,
          moveStep: 3,
          phaseId: "scratch-miss-return",
          phaseName: "5. 정위치 복귀",
        },
      ];
    }

    return [
      // 1. 도약 준비
      {
        ...baseFrame,
        delay: 90,
        ...cOff(12, -4),
        ...tOff(0, 0),
        showEffect: false,
        moveStep: 0,
        phaseId: "scratch-prep",
        phaseName: "1. 전방 도약 준비",
      },
      // 2. 예리한 3단 곡선 발톱 출현 (타격)
      {
        ...baseFrame,
        delay: 100,
        ...cOff(26, -9),
        ...tOff(8, -3),
        showEffect: true,
        hitFlash: isHit,
        enemyHp: a?.enemyHpAfter ?? enemyHp,
        playerHp: a?.playerHpAfter ?? playerHp,
        moveStep: 1,
        phaseId: "scratch-strike",
        phaseName: "2. 예리한 할퀴기 출현",
      },
      // 3. 해당 방향 아래로 살짝 슬라이드하며 페이드아웃
      {
        ...baseFrame,
        delay: 90,
        ...cOff(28, -10),
        ...tOff(10, -4),
        showEffect: true,
        enemyHp: a?.enemyHpAfter ?? enemyHp,
        playerHp: a?.playerHpAfter ?? playerHp,
        moveStep: 2,
        phaseId: "scratch-slide",
        phaseName: "3. 아래로 슬라이드 & 페이드아웃",
      },
      // 4. 완전 소멸 및 반동 복귀
      {
        ...baseFrame,
        delay: 80,
        ...cOff(14, -5),
        ...tOff(4, -2),
        showEffect: false,
        enemyHp: a?.enemyHpAfter ?? enemyHp,
        playerHp: a?.playerHpAfter ?? playerHp,
        moveStep: 3,
        phaseId: "scratch-decay",
        phaseName: "4. 완전 소멸 및 반동 회복",
      },
      // 5. 정위치 복귀 완료
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, 0),
        ...tOff(0, 0),
        showEffect: false,
        enemyHp: a?.enemyHpAfter ?? enemyHp,
        playerHp: a?.playerHpAfter ?? playerHp,
        moveStep: 3,
        phaseId: "scratch-finish",
        phaseName: "5. 정위치 복귀 완료",
      },
    ];
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (frame.showEffect && drawCtx.targetPos) {
      drawScratchEffect(targetCtx, drawCtx.targetPos, frame.moveStep ?? 1);
    }
  }
};

