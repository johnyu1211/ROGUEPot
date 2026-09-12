// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawFireSpinEffect, drawBehindFireSpinEffect } from "../../../renderers/moves/gen1/move081_084.js";

/**
 * 083: 회오리불꽃 (Fire Spin) - 불꽃 타입 특수기 (구속/바인드 지속 데미지)
 *
 * 연출:
 * - 포물선으로 날아가는 회전 불씨 탄환 사출
 * - 지면 착탄 후 대상을 360도 에워싸며 솟구쳐 오르는 3D 화염 토네이도 기둥 (전후 레이어링)
 * - 상대를 완전히 가두는 맹렬한 회전 화염 소용돌이 감옥
 */
export const fireSpinMove: BattleMoveAnimation = {
  num: 83,
  key: "fire-spin",
  nameKo: "회오리불꽃",
  nameEn: "Fire Spin",
  type: "fire",
  category: "special",
  camera: { type: "target", zoom: 1.35 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawBehindFireSpinEffect(targetCtx, attackerPos, targetPos, step, prog);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawFireSpinEffect(targetCtx, attackerPos, targetPos, step, prog);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.35,
      pRot: 0,
      eRot: 0,
    };

    return [
      // #1. 회전 불씨 사출
      {
        ...baseFrame,
        delay: 85,
        pOffset: isP ? { x: 3, y: -1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -3, y: 1 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.55,
        phaseId: "fire-spin-eject",
        phaseName: "#1. 회전 불씨 사출",
      },
      // #2. 지면 착탄 및 바닥 화염 링 점화
      {
        ...baseFrame,
        delay: 90,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.70,
        phaseId: "fire-spin-ignite",
        phaseName: "#2. 바닥 화염 링 점화",
      },
      // #3. 불꽃 회오리 기둥 솟구침
      {
        ...baseFrame,
        delay: 100,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: -2, y: 1 } : { x: 2, y: -1 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: isHit,
        targetRedTint: isHit,
        moveStep: 3,
        effectProgress: 0.65,
        phaseId: "fire-spin-rise",
        phaseName: "#3. 불꽃 회오리 기둥 솟구침",
      },
      // #4. 맹렬한 화염 소용돌이 감옥 (1)
      {
        ...baseFrame,
        delay: 100,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: -3, y: 1 } : { x: 3, y: -1 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        targetRedTint: isHit,
        moveStep: 4,
        effectProgress: 0.50,
        phaseId: "fire-spin-trap1",
        phaseName: "#4. 맹렬한 화염 소용돌이 감옥 (1)",
      },
      // #5. 맹렬한 화염 소용돌이 감옥 (2)
      {
        ...baseFrame,
        delay: 100,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: 3, y: -1 } : { x: -3, y: 1 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        targetRedTint: isHit,
        moveStep: 5,
        effectProgress: 0.50,
        phaseId: "fire-spin-trap2",
        phaseName: "#5. 맹렬한 화염 소용돌이 감옥 (2)",
      },
      // #6. 맹렬한 화염 소용돌이 감옥 (3)
      {
        ...baseFrame,
        delay: 100,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: -2, y: 1 } : { x: 2, y: -1 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        targetRedTint: isHit,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 6,
        effectProgress: 0.50,
        phaseId: "fire-spin-trap3",
        phaseName: "#6. 맹렬한 화염 소용돌이 감옥 (3)",
      },
      // #7. 회오리 분산 및 불티 상승
      {
        ...baseFrame,
        delay: 95,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        targetRedTint: isHit,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 7,
        effectProgress: 0.60,
        phaseId: "fire-spin-dissolve",
        phaseName: "#7. 회오리 분산 및 불티 상승",
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
        phaseId: "fire-spin-complete",
        phaseName: "#8. 완료 및 복귀",
      },
    ];
  },
};
