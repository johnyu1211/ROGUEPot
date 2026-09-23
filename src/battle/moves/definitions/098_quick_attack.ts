// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawQuickAttackEffect, drawQuickAttackBehindEffect } from "../../../renderers/moves/gen1/move097_100.js";

/**
 * 098: 전광석화 (Quick Attack) - 노말 타입 우선도 +1 초고속 선공 물리 기술
 *
 * 연출:
 * 1. 시전자 순간 낮게 도약 발진 (출발점 순백 소닉 블러 섬광 링)
 * 2. 초광속 직진 돌파 (적을 향해 번개처럼 직선 쇄도 & 순백 스피드 스트림)
 * 3. 정면 대격돌 충돌! (Collision Impact: 충돌 압축 스쿼시, 일반 몸통박치기 타격 이펙트, 피격자 넉백, 110ms 히트스탑)
 * 4. 적 배후 스키드 착지 마크 & 흙먼지 퍼프
 * 5. 정위치 쾌속 복귀
 */
export const quickAttackMove: BattleMoveAnimation = {
  num: 98,
  key: "quick-attack",
  nameKo: "전광석화",
  nameEn: "Quick Attack",
  type: "normal",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawQuickAttackBehindEffect(targetCtx, attackerPos, targetPos, step, prog, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawQuickAttackEffect(targetCtx, attackerPos, targetPos, step, prog, frame, drawCtx);
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

    // [절대 규칙 준수] 시전자 전용 오프셋 (수비자는 건드리지 않음)
    const cOff = (x: number, y: number) =>
      isP ? { pOffset: { x, y } } : { eOffset: { x: -x, y: -y } };

    // [절대 규칙 준수] 피격자 전용 오프셋 (시전자는 건드리지 않음, 대칭 넉백 적용)
    const cTargetOff = (x: number, y: number) =>
      isP ? { eOffset: { x, y } } : { pOffset: { x: -x, y: -y } };

    // 시전자 전용 스케일 & 회전 틸트 변환
    const cCasterTransform = (scaleX: number, scaleY: number, rot: number) => ({
      pScale: isP ? { x: scaleX, y: scaleY } : undefined,
      eScale: !isP ? { x: scaleX, y: scaleY } : undefined,
      pRot: isP ? rot : 0,
      eRot: !isP ? -rot : 0,
    });

    return [
      // #1. 도약 발진 (낮게 파고들며 순백 소닉 블러 링)
      {
        ...baseFrame,
        delay: 55,
        ...cOff(25, -10),
        ...cCasterTransform(1.15, 0.90, -0.08),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.40,
        phaseId: "quick-attack-launch",
        phaseName: "#1. 순간 가속 발진",
      },
      // #2. 초광속 직진 돌파 (직선 쇄도 & 순백 스피드 스트림)
      {
        ...baseFrame,
        delay: 65,
        ...cOff(115, -42),
        ...cCasterTransform(1.25, 0.82, -0.12),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.85,
        phaseId: "quick-attack-dash",
        phaseName: "#2. 초광속 직진 돌파",
      },
      // #3. 정면 대격돌 충돌 (Collision Impact: 일반 몸통박치기 타격 이펙트, 피격자 넉백, 110ms 프리즈)
      {
        ...baseFrame,
        delay: 110,
        ...cOff(175, -62),
        ...(isHit ? cTargetOff(18, -8) : cTargetOff(0, 0)),
        ...cCasterTransform(0.90, 1.12, 0.05),
        showEffect: true,
        hitFlash: isHit,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 3,
        effectProgress: 0.80,
        phaseId: "quick-attack-collision",
        phaseName: "#3. 정면 대격돌 충돌 (몸통박치기 타격)",
      },
      // #4. 적 뒤편 브레이크 스키드 착지 먼지
      {
        ...baseFrame,
        delay: 75,
        ...cOff(210, -70),
        ...cTargetOff(0, 0),
        ...cCasterTransform(1.05, 0.95, 0),
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 5,
        effectProgress: 0.60,
        phaseId: "quick-attack-skid",
        phaseName: "#4. 스키드 착지 마크 & 먼지",
      },
      // #5. 안정 복귀
      {
        ...baseFrame,
        delay: 60,
        ...cOff(0, 0),
        ...cTargetOff(0, 0),
        ...cCasterTransform(1.0, 1.0, 0),
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 6,
        effectProgress: 1.0,
        phaseId: "quick-attack-finish",
        phaseName: "#5. 정위치 쾌속 복귀",
      },
    ];
  },
};
