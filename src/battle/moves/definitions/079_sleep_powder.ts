// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawSleepPowderEffect } from "../../../renderers/moves/gen1/move077_080.js";

/**
 * 079: 수면가루 (Sleep Powder) - 상태이상 (수면)
 *
 * 연출:
 * - 화면 상단에 하늘색 가루 구름 형성 (최신 세대 기준)
 * - 상대 머리 위에서 살랑살랑 떨어짐
 * - 몸체에 쌓이며 수면 침투 (하늘빛 틴트)
 * - 수면 상태이상 부여
 */
export const sleepPowderMove: BattleMoveAnimation = {
  num: 79,
  key: "sleep-powder",
  nameKo: "수면가루",
  nameEn: "Sleep Powder",
  type: "grass",
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
      // #1. 분말 뿌리기 준비 (살짝 흔들임)
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
        phaseId: "sleep-powder-prep1",
        phaseName: "#1. 분말 뿌리기 준비",
      },
      // #2. 상단 분말 구름 형성
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
        phaseId: "sleep-powder-prep2",
        phaseName: "#2. 상단 분말 구름 형성",
      },
      // #3. 분말 살랑살랑 낙하 시작
      {
        ...baseFrame,
        delay: 110,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.45,
        phaseId: "sleep-powder-sprinkle1",
        phaseName: "#3. 분말 살랑살랑 낙하",
      },
      // #4. 분말 낙하 지속
      {
        ...baseFrame,
        delay: 110,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.75,
        phaseId: "sleep-powder-sprinkle2",
        phaseName: "#4. 분말 낙하 지속",
      },
      // #5. 몸체에 분말 쌓임
      {
        ...baseFrame,
        delay: 100,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: 0, y: 2 } : { x: 0, y: -2 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 5,
        effectProgress: 0.60,
        phaseId: "sleep-powder-settle",
        phaseName: "#5. 몸체에 분말 쌓임",
      },
      // #6. 수면 침투 & 하늘빛 틴트
      {
        ...baseFrame,
        delay: 110,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: 0, y: 2 } : { x: 0, y: -2 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 6,
        effectProgress: 0.65,
        targetBlueTint: isHit,
        phaseId: "sleep-powder-infect",
        phaseName: "#6. 수면 침투 & 하늘빛 틴트",
      },
      // #7. 수면 잔향
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
        effectProgress: 0.75,
        targetBlueTint: isHit,
        phaseId: "sleep-powder-afterglow",
        phaseName: "#7. 수면 잔향",
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
        phaseId: "sleep-powder-complete",
        phaseName: "#8. 완료 및 복귀",
      },
    ];
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawSleepPowderEffect(targetCtx, attackerPos, targetPos, step, prog);
  },
};
