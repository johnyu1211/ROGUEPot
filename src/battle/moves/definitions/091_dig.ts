// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawDigEffect, drawBehindDigEffect } from "../../../renderers/moves/gen1/move089_092.js";

/**
 * 091: 구멍파기 (Dig) - 땅 타입 물리 2턴 기술 (위력 80)
 *
 * 연출 구성:
 * 1턴 (잠복): 시전자 발밑 굴착 ➔ 흙먼지 비산 ➔ 구멍 속으로 하향 침강 (하단 클리핑으로 지면 아래 노출 방지) ➔ 지하 잠복
 * 2턴 (기습 타격): 대상 발밑 지하 진동 ➔ 지반 대폭발 솟구침 ➔ 어퍼컷 강타 ➔ 착지 복귀
 */
export const digMove: BattleMoveAnimation = {
  num: 91,
  key: "dig",
  nameKo: "구멍파기",
  nameEn: "Dig",
  type: "ground",
  category: "physical",
  camera: { type: "target", zoom: 1.30 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    const isCharging = Boolean(frame.isDigCharging);
    drawBehindDigEffect(targetCtx, attackerPos, targetPos, step, prog, isCharging, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    const isCharging = Boolean(frame.isDigCharging);
    drawDigEffect(targetCtx, attackerPos, targetPos, step, prog, isCharging, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const isCharging = Boolean(
      (a as any).isTurn1Launch ||
      (a as any).chargingMove === "dig" ||
      a.log?.includes("땅속으로") ||
      a.log?.includes("dug a hole") ||
      (!a.wasDescentFromAir && (a.damage ?? 0) === 0 && !a.log?.includes("빗나갔다") && !a.log?.includes("missed") && !a.log?.includes("닿지 않았다"))
    );

    // =========================================================================
    // 1턴: 땅속으로 파고들어 잠복 (Charging)
    // =========================================================================
    if (isCharging) {
      const casterGroundY = isP ? 280 : 152;
      const baseChargeFrame = {
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        cameraZoom: 1.30,
        cameraTrackAttacker: true,
        isAttackerPlayer: isP,
        pRot: 0,
        eRot: 0,
        isDigCharging: true,
      };

      return [
        // =====================================================================
        // 1회차: 세로로 살짝 길어졌다가 -> 살짝 납작해지면서 1단계 아래로 내려감
        // =====================================================================
        // #1. 1차 세로 신장 (세로로 살짝 길어짐)
        {
          ...baseChargeFrame,
          delay: 85,
          pOffset: isP ? { x: 0, y: -2 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: 0, y: -2 } : { x: 0, y: 0 },
          pScale: isP ? { x: 0.93, y: 1.09 } : { x: 1.0, y: 1.0 },
          eScale: !isP ? { x: 0.93, y: 1.09 } : { x: 1.0, y: 1.0 },
          pClipBottomY: isP ? casterGroundY : undefined,
          eClipBottomY: !isP ? casterGroundY : undefined,
          showEffect: true,
          hitFlash: false,
          moveStep: 1,
          effectProgress: 0.12,
          phaseId: "dig-1a-stretch",
          phaseName: "#1. 굴착 1회차: 세로 신장",
        },
        // #2. 1차 납작 침강 (살짝 납작해지면서 1단계 내려감)
        {
          ...baseChargeFrame,
          delay: 90,
          pOffset: isP ? { x: 0, y: 12 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: 0, y: 12 } : { x: 0, y: 0 },
          pScale: isP ? { x: 1.10, y: 0.90 } : { x: 1.0, y: 1.0 },
          eScale: !isP ? { x: 1.10, y: 0.90 } : { x: 1.0, y: 1.0 },
          pClipBottomY: isP ? casterGroundY : undefined,
          eClipBottomY: !isP ? casterGroundY : undefined,
          hidePShadow: isP,
          hideEShadow: !isP,
          showEffect: true,
          hitFlash: false,
          moveStep: 1,
          effectProgress: 0.28,
          phaseId: "dig-1b-squash",
          phaseName: "#2. 굴착 1회차: 납작 침강",
        },

        // =====================================================================
        // 2회차: 세로로 살짝 길어졌다가 -> 살짝 납작해지면서 2단계 아래로 내려감
        // =====================================================================
        // #3. 2차 세로 신장 (세로로 살짝 길어짐)
        {
          ...baseChargeFrame,
          delay: 85,
          pOffset: isP ? { x: 0, y: 8 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: 0, y: 8 } : { x: 0, y: 0 },
          pScale: isP ? { x: 0.91, y: 1.11 } : { x: 1.0, y: 1.0 },
          eScale: !isP ? { x: 0.91, y: 1.11 } : { x: 1.0, y: 1.0 },
          pClipBottomY: isP ? casterGroundY : undefined,
          eClipBottomY: !isP ? casterGroundY : undefined,
          hidePShadow: isP,
          hideEShadow: !isP,
          showEffect: true,
          hitFlash: false,
          moveStep: 1,
          effectProgress: 0.48,
          phaseId: "dig-2a-stretch",
          phaseName: "#3. 굴착 2회차: 세로 신장",
        },
        // #4. 2차 납작 침강 (살짝 납작해지면서 2단계 더 깊이 내려감)
        {
          ...baseChargeFrame,
          delay: 90,
          pOffset: isP ? { x: 0, y: 26 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: 0, y: 26 } : { x: 0, y: 0 },
          pScale: isP ? { x: 1.12, y: 0.88 } : { x: 1.0, y: 1.0 },
          eScale: !isP ? { x: 1.12, y: 0.88 } : { x: 1.0, y: 1.0 },
          pClipBottomY: isP ? casterGroundY : undefined,
          eClipBottomY: !isP ? casterGroundY : undefined,
          hidePShadow: isP,
          hideEShadow: !isP,
          showEffect: true,
          hitFlash: false,
          moveStep: 1,
          effectProgress: 0.68,
          phaseId: "dig-2b-squash",
          phaseName: "#4. 굴착 2회차: 납작 침강",
        },

        // =====================================================================
        // 3회차: 세로로 늘어나며 -> 3번째에 완전히 땅속으로 쏙 들어가기!
        // =====================================================================
        // #5. 3차 최종 신장 (세로로 길어지며 마지막으로 파고들 준비)
        {
          ...baseChargeFrame,
          delay: 85,
          pOffset: isP ? { x: 0, y: 44 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: 0, y: 44 } : { x: 0, y: 0 },
          pScale: isP ? { x: 0.88, y: 1.14 } : { x: 1.0, y: 1.0 },
          eScale: !isP ? { x: 0.88, y: 1.14 } : { x: 1.0, y: 1.0 },
          pClipBottomY: isP ? casterGroundY : undefined,
          eClipBottomY: !isP ? casterGroundY : undefined,
          hidePShadow: isP,
          hideEShadow: !isP,
          showEffect: true,
          hitFlash: false,
          moveStep: 1,
          effectProgress: 0.86,
          phaseId: "dig-3a-stretch",
          phaseName: "#5. 굴착 3회차: 세로 신장",
        },
        // #6. 3차 완전 잠복 (땅속으로 완전히 들어가기!)
        {
          ...baseChargeFrame,
          delay: 110,
          pOffset: isP ? { x: 0, y: 65 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: 0, y: 65 } : { x: 0, y: 0 },
          pAlpha: isP ? 0.0 : 1.0,
          eAlpha: !isP ? 0.0 : 1.0,
          pClipBottomY: isP ? casterGroundY : undefined,
          eClipBottomY: !isP ? casterGroundY : undefined,
          hidePShadow: isP,
          hideEShadow: !isP,
          showEffect: true,
          hitFlash: false,
          moveStep: 1,
          effectProgress: 1.0,
          phaseId: "dig-submerged",
          phaseName: "#6. 굴착 3회차: 지하 완전 잠복",
        },
      ];
    }

    // =========================================================================
    // 2턴: 지하에서 솟구치며 기습 타격 (Attack)
    // =========================================================================
    const baseAttackFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.30,
      pRot: 0,
      eRot: 0,
      isDigCharging: false,
    };

    // 상대 위치로 순간 이동하여 아래에서 솟구치는 상대 오프셋 계산
    const burstRelX = isP ? 70 : -70;

    return [
      // #1. 대상 발밑 지하 진동 (두구두구 전조 - 시전자는 지하 잠복 유지)
      {
        ...baseAttackFrame,
        delay: 80,
        pOffset: isP ? { x: 0, y: 40 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: 40 } : { x: 0, y: 0 },
        pAlpha: isP ? 0.0 : 1.0,
        eAlpha: !isP ? 0.0 : 1.0,
        hidePShadow: isP,
        hideEShadow: !isP,
        cameraPan: { x: -1, y: 2 },
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.35,
        phaseId: "dig-tremor-1",
        phaseName: "#1. 지하 접근 진동",
      },
      // #2. 지면 부풀어오름 & 직전 돌파 (시전자는 지하 잠복 유지)
      {
        ...baseAttackFrame,
        delay: 75,
        pOffset: isP ? { x: burstRelX * 0.8, y: 25 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: burstRelX * 0.8, y: 25 } : { x: 0, y: 0 },
        pAlpha: isP ? 0.0 : 1.0,
        eAlpha: !isP ? 0.0 : 1.0,
        hidePShadow: isP,
        hideEShadow: !isP,
        cameraPan: { x: 2, y: -2 },
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.85,
        phaseId: "dig-tremor-2",
        phaseName: "#2. 지반 돌파 직전",
      },
      // #3. [기습 대폭발] 지반 뚫고 솟구쳐 오르는 어퍼컷 강타!
      {
        ...baseAttackFrame,
        delay: 110,
        // 시전자가 지하에서 상대 바로 앞 상공으로 치솟음
        pOffset: isP ? { x: burstRelX, y: -18 } : { x: -5, y: -14 },
        eOffset: !isP ? { x: burstRelX, y: -18 } : { x: 5, y: -14 },
        pScale: isP ? { x: 0.90, y: 1.18 } : { x: 1.15, y: 0.85 },
        eScale: !isP ? { x: 0.90, y: 1.18 } : { x: 1.15, y: 0.85 },
        pAlpha: 1.0,
        eAlpha: 1.0,
        cameraPan: { x: -4, y: 5 },
        showEffect: true,
        hitFlash: isHit,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 2,
        effectProgress: 0.45,
        phaseId: "dig-burst-impact",
        phaseName: "#3. 지하 기습 분출 강타",
      },
      // #4. 상대 피격 넉백 & 거대 흙기둥과 암석 파편 비산
      {
        ...baseAttackFrame,
        delay: 95,
        pOffset: isP ? { x: burstRelX * 0.6, y: -26 } : { x: -8, y: 8 },
        eOffset: !isP ? { x: burstRelX * 0.6, y: -26 } : { x: 8, y: 8 },
        pScale: isP ? { x: 1.05, y: 0.95 } : { x: 0.92, y: 1.08 },
        eScale: !isP ? { x: 1.05, y: 0.95 } : { x: 0.92, y: 1.08 },
        cameraPan: { x: 4, y: -3 },
        showEffect: true,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 2,
        effectProgress: 0.85,
        phaseId: "dig-airborne",
        phaseName: "#4. 상공 체공 및 토사 비산",
      },
      // #5. 시전자 지면 복귀 착지 충격파
      {
        ...baseAttackFrame,
        delay: 90,
        pOffset: isP ? { x: 0, y: 6 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: 6 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.10, y: 0.90 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 1.10, y: 0.90 } : { x: 1.0, y: 1.0 },
        cameraPan: { x: 0, y: 1 },
        showEffect: true,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 3,
        effectProgress: 0.40,
        phaseId: "dig-land",
        phaseName: "#5. 시전자 착지 및 안착",
      },
      // #6. 흙먼지 소멸 및 원위치 복귀
      {
        ...baseAttackFrame,
        delay: 110,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        cameraPan: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 3,
        effectProgress: 0.90,
        phaseId: "dig-return",
        phaseName: "#6. 구멍파기 종료 및 복귀",
      },
    ];
  },
};
