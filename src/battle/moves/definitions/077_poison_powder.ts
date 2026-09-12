// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawPoisonPowderEffect } from "../../../renderers/moves/gen1/move077_080.js";

/**
 * 077: 독가루 (Poison Powder) - 상태이상 (독)
 *
 * 연출:
 * - 시전자 코어에 보라 독가루 응축 (camera: self)
 * - 보라/연보라 독가루 구름이 상대에게 흩날려 쇄도
 * - 상대 몸체에 독가루가 덮이며 보라 틴트 + 거품 파티클
 * - 독 상태이상 부여
 */
export const poisonPowderMove: BattleMoveAnimation = {
  num: 77,
  key: "poison-powder",
  nameKo: "독가루",
  nameEn: "Poison Powder",
  type: "poison",
  category: "status",
  camera: { type: "target", zoom: 1.30 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.30,
      pRot: 0,
      eRot: 0,
    };

return [
      // #1. 시전자 살짝 흔들임 (분말 뿌리기 준비)
      {
        ...baseFrame,
        delay: 90,
        pOffset: isP ? { x: -3, y: 2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 3, y: -2 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.05, y: 0.95 } : undefined,
        eScale: !isP ? { x: 1.05, y: 0.95 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.20,
        phaseId: "poison-powder-prep1",
        phaseName: "#1. 분말 뿌리기 준비",
      },
      // #2. 화면 상단에 분말 구름 나타남 (살포 직전)
      {
        ...baseFrame,
        delay: 90,
        pOffset: isP ? { x: -2, y: 1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 2, y: -1 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.04, y: 0.96 } : undefined,
        eScale: !isP ? { x: 1.04, y: 0.96 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.55,
        phaseId: "poison-powder-prep2",
        phaseName: "#2. 상단 분말 구름 형성",
      },
      // #3. 상대 머리 위에서 분말이 살랑살랑 떨어지기 시작
      {
        ...baseFrame,
        delay: 110,
        pOffset: isP ? { x: 0, y: 0 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: 0 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.45,
        phaseId: "poison-powder-sprinkle1",
        phaseName: "#3. 분말 살랑살랑 낙하",
      },
      // #4. 분말이 계속 내려앉음
      {
        ...baseFrame,
        delay: 110,
        pOffset: isP ? { x: 0, y: 0 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: 0 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.75,
        phaseId: "poison-powder-sprinkle2",
        phaseName: "#4. 분말 낙하 지속",
      },
      // #5. 분말이 상대 몸체에 쌓임
      {
        ...baseFrame,
        delay: 100,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: 0, y: 2 } : { x: 0, y: -2 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 5,
        effectProgress: 0.60,
        phaseId: "poison-powder-settle",
        phaseName: "#5. 몸체에 분말 쌓임",
      },
      // #6. 독 침투 & 보라 틴트 + 거품
      {
        ...baseFrame,
        delay: 110,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: 0, y: 2 } : { x: 0, y: -2 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 6,
        effectProgress: 0.65,
        targetPurpleLevel: isHit ? 1.0 : 0,
        phaseId: "poison-powder-infect",
        phaseName: "#6. 독 침투 & 보라 틴트",
      },
      // #7. 독 잔향
      {
        ...baseFrame,
        delay: 100,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: -2, y: 1 } : { x: 2, y: -1 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 7,
        effectProgress: 0.70,
        targetPurpleLevel: isHit ? 0.55 : 0,
        phaseId: "poison-powder-afterglow",
        phaseName: "#7. 독 잔향",
      },
      // #8. 완료 및 복귀
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "poison-powder-complete",
        phaseName: "#8. 완료 및 복귀",
      },
    ];
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawPoisonPowderEffect(targetCtx, attackerPos, targetPos, step, prog);
  },
};