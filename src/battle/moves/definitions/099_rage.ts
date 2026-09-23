// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawRageEffect, drawRageBehindEffect } from "../../../renderers/moves/gen1/move097_100.js";

/**
 * 099: 분노 (Rage) - 노말 타입 격노 물리 기술
 *
 * 연출:
 * 1. 시전자 붉은 분노 오라 점화 & 머리 위 💢 분노 핏줄 마크 고동
 * 2. 끓어오르는 붉은 증기 방출 & 저돌적 쿵쿵 돌진
 * 3. 분노 1타 강타: 붉은 타격 스타버스트 & 붉은 에너지 충격파
 * 4. 분노 2타 연타: 맹렬한 2연타 피니시 & 사방으로 튀는 핏빛 스파크
 * 5. 거친 분노 증기 방출 및 안정 복귀
 */
export const rageMove: BattleMoveAnimation = {
  num: 99,
  key: "rage",
  nameKo: "분노",
  nameEn: "Rage",
  type: "normal",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawRageBehindEffect(targetCtx, attackerPos, targetPos, step, prog, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawRageEffect(targetCtx, attackerPos, targetPos, step, prog, frame, drawCtx);
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

    // [절대 규칙 준수] 피격자 전용 오프셋 (시전자는 건드리지 않음)
    const cTargetOff = (x: number, y: number) =>
      isP ? { eOffset: { x, y } } : { pOffset: { x: -x, y: -y } };

    // 시전자 전용 스케일 & 회전 변환
    const cCasterTransform = (scaleX: number, scaleY: number, rot: number) => ({
      pScale: isP ? { x: scaleX, y: scaleY } : undefined,
      eScale: !isP ? { x: scaleX, y: scaleY } : undefined,
      pRot: isP ? rot : 0,
      eRot: !isP ? -rot : 0,
    });

    // 시전자 전용 붉은 분노 틴트 (두 번 붉게 변했다가 원래대로 복귀)
    const cCasterRedTint = (active: boolean) => ({
      pRedTint: isP ? active : false,
      eRedTint: !isP ? active : false,
    });

    return [
      // #1. 1차 분노 붉어짐 (💢 분노 핏줄 마크 고동 & 붉은 오라)
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 4),
        ...cCasterTransform(1.12, 0.88, 0),
        ...cCasterRedTint(true),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.35,
        phaseId: "rage-red-1",
        phaseName: "#1. 1차 분노 붉어짐",
      },
      // #2. 원래대로 돌아옴 (원래 색상 복귀 & 숨고르기)
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...cCasterTransform(1.0, 1.0, 0),
        ...cCasterRedTint(false),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.55,
        phaseId: "rage-normal",
        phaseName: "#2. 원래대로 복귀 (숨고르기)",
      },
      // #3. 다시 2차 분노 붉어짐 (극대 격노 폭발 & 콧김 증기)
      {
        ...baseFrame,
        delay: 95,
        ...cOff(4, -4),
        ...cCasterTransform(1.16, 0.84, -0.04),
        ...cCasterRedTint(true),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.90,
        phaseId: "rage-red-2",
        phaseName: "#3. 2차 분노 붉어짐 (격노 폭발)",
      },
      // #4. 돌진 도움닫기 후진 (폭발적 반동 모으기)
      {
        ...baseFrame,
        delay: 80,
        ...cOff(-14, 4),
        ...cCasterTransform(0.92, 1.08, 0.04),
        ...cCasterRedTint(true),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.25,
        phaseId: "rage-windup",
        phaseName: "#4. 돌진 도움닫기 후진",
      },
      // #5. 전방 맹렬한 초고속 돌진 쇄도
      {
        ...baseFrame,
        delay: 75,
        ...cOff(65, -22),
        ...cCasterTransform(1.24, 0.80, -0.08),
        ...cCasterRedTint(true),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.75,
        phaseId: "rage-charge",
        phaseName: "#5. 전방 맹렬한 돌진",
      },
      // #6. 정면 대격돌 충돌! (돌진 타격 이펙트 작렬 & 피격자 넉백)
      {
        ...baseFrame,
        delay: 120,
        ...cOff(115, -38),
        ...(isHit ? cTargetOff(16, -6) : cTargetOff(0, 0)),
        ...cCasterTransform(0.88, 1.15, 0.04),
        ...cCasterRedTint(true),
        showEffect: isHit,
        hitFlash: isHit,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 3,
        effectProgress: 0.85,
        phaseId: "rage-impact",
        phaseName: "#6. 정면 대격돌 충돌 (돌진 타격 이펙트)",
      },
      // #7. 충돌 반동 바운스 (착지 안정화)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(55, -18),
        ...cTargetOff(0, 0),
        ...cCasterTransform(1.06, 0.94, 0),
        ...cCasterRedTint(true),
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 4,
        effectProgress: 0.50,
        phaseId: "rage-recoil",
        phaseName: "#7. 충돌 반동 바운스",
      },
      // #8. 정위치 복귀 (분노 진정 & 원래 상태 복귀)
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...cTargetOff(0, 0),
        ...cCasterTransform(1.0, 1.0, 0),
        ...cCasterRedTint(false),
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 5,
        effectProgress: 1.0,
        phaseId: "rage-finish",
        phaseName: "#8. 안정 복귀",
      },
    ];
  },
};
