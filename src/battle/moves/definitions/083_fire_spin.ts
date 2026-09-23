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
  camera: { type: "target", zoom: 1.35, delayUntilStep: 3 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos, isPlayer } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawBehindFireSpinEffect(targetCtx, attackerPos, targetPos, step, prog, isPlayer);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos, isPlayer } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawFireSpinEffect(targetCtx, attackerPos, targetPos, step, prog, isPlayer);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.0,
      pRot: 0,
      eRot: 0,
    };

    return [
      // #1. 불꽃 탄환 사출
      {
        ...baseFrame,
        delay: 85,
        pOffset: isP ? { x: 3, y: -1 } : { x: -3, y: 1 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.35,
        phaseId: "fire-spin-shoot",
        phaseName: "#1. 불꽃 탄환 사출",
      },
      // #2. 불꽃 비행 쇄도
      {
        ...baseFrame,
        delay: 85,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.85,
        phaseId: "fire-spin-flight",
        phaseName: "#2. 불꽃 비행 쇄도",
      },
      // #3. 지면 착탄 및 바닥 착화
      {
        ...baseFrame,
        delay: 90,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: -1, y: 0 } : { x: 1, y: 0 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.70,
        phaseId: "fire-spin-impact",
        phaseName: "#3. 지면 착탄 및 바닥 착화",
      },
      // #4. 바닥부터 올라오는 불 회오리 (1단)
      {
        ...baseFrame,
        delay: 95,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: 1, y: -1 } : { x: -1, y: 1 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.50,
        phaseId: "fire-spin-rising-1",
        phaseName: "#4. 바닥부터 올라오는 불 회오리 (1단)",
      },
      // #5. 불 회오리 전신 포위 및 솟구침
      {
        ...baseFrame,
        delay: 100,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: -3, y: 2 } : { x: 3, y: -2 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: isHit,
        targetRedTint: isHit,
        moveStep: 4,
        effectProgress: 0.70,
        phaseId: "fire-spin-engulf",
        phaseName: "#5. 불 회오리 전신 포위 및 솟구침",
      },
      // #6. 3D 불 회오리 구속 (1)
      {
        ...baseFrame,
        delay: 105,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: 2, y: -1 } : { x: -2, y: 1 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        targetRedTint: isHit,
        moveStep: 5,
        effectProgress: 0.50,
        phaseId: "fire-spin-bind-1",
        phaseName: "#6. 3D 불 회오리 구속 (1)",
      },
      // #7. 3D 불 회오리 구속 (2) - 데미지
      {
        ...baseFrame,
        delay: 105,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: -3, y: 2 } : { x: 3, y: -2 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        targetRedTint: isHit,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 6,
        effectProgress: 0.70,
        phaseId: "fire-spin-bind-2",
        phaseName: "#7. 3D 불 회오리 구속 (2) - 데미지",
      },
      // #8. 3D 불 회오리 구속 (3)
      {
        ...baseFrame,
        delay: 105,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: 2, y: -1 } : { x: -2, y: 1 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        targetRedTint: isHit,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 7,
        effectProgress: 0.90,
        phaseId: "fire-spin-bind-3",
        phaseName: "#8. 3D 불 회오리 구속 (3)",
      },
      // #9. 회오리 상공 분산 및 소멸
      {
        ...baseFrame,
        delay: 100,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 8,
        effectProgress: 0.70,
        phaseId: "fire-spin-dissolve",
        phaseName: "#9. 회오리 상공 분산 및 소멸",
      },
      // #10. 완료 및 복귀
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 9,
        phaseId: "fire-spin-complete",
        phaseName: "#10. 완료 및 복귀",
      },
    ];
  },
};
