// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawBideChargeEffect,
  drawBideAttackEffect,
  drawBideAttackBehindEffect,
} from "../../../renderers/moves/gen1/move117_120.js";

/**
 * 117: 참기 (Bide) - 1턴 충전 전용 정의
 * - 시전자 정중앙 록온 줌 (zoom: 1.25)
 * - 시전자 포켓몬이 붉게 물들며(Red tint) 힘을 주고 버팀
 * - 머리 위에서 3개의 순백 증기 퍼프(White Steam Puffs)가 순차적으로 "칙- 칙- 칙-" 피어오름
 */
export const bideChargeMove: BattleMoveAnimation = {
  num: 117,
  key: "bide-charge",
  nameKo: "참기 (참기)",
  nameEn: "Bide (Biding)",
  type: "normal",
  category: "physical",
  camera: { type: "self", zoom: 1.25 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const casterPos = drawCtx?.casterPos || drawCtx?.attackerPos;
    if (!casterPos) return;
    const prog = frame.effectProgress ?? 0.5;
    drawBideChargeEffect(targetCtx, casterPos, prog, drawCtx.isPlayer);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.25,
      pRot: 0,
      eRot: 0,
      showEffect: true,
      hitFlash: false,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
      pRedTint: isP,
      eRedTint: !isP,
    };

    // 시전자 전용 웅크림/호흡 스케일
    const cScale = (sx: number, sy: number) => ({
      pScale: isP ? { x: sx, y: sy } : undefined,
      eScale: !isP ? { x: sx, y: sy } : undefined,
    });

    const cOff = (x: number, y: number) =>
      isP ? { pOffset: { x, y } } : { eOffset: { x: -x, y: -y } };

    return [
      // #1. 참기 돌입 & 호흡 축적 (붉은빛 시작 & 미세 웅크림)
      {
        ...baseFrame,
        delay: 85,
        ...cScale(1.06, 0.94),
        ...cOff(-2, 1),
        moveStep: 1,
        effectProgress: 0.05,
        phaseId: "bide-c-intro",
        phaseName: "#1. 참기 돌입 & 붉은빛 호흡 축적",
      },
      // #2. 1차 증기 분출 시작 (좌상단 칙-)
      {
        ...baseFrame,
        delay: 75,
        ...cScale(1.08, 0.92),
        ...cOff(-3, 2),
        moveStep: 1,
        effectProgress: 0.18,
        phaseId: "bide-c-puff-1-start",
        phaseName: "#2. 1차 증기 분출 시작 (좌상단)",
      },
      // #3. 1차 증기 상승 피어오름
      {
        ...baseFrame,
        delay: 75,
        ...cScale(1.05, 0.95),
        ...cOff(-2, 1),
        moveStep: 1,
        effectProgress: 0.32,
        phaseId: "bide-c-puff-1-rise",
        phaseName: "#3. 1차 증기 상승 & 피어오름",
      },
      // #4. 2차 증기 분출 시작 (중앙 상단 칙-)
      {
        ...baseFrame,
        delay: 75,
        ...cScale(1.10, 0.90),
        ...cOff(0, 2),
        moveStep: 2,
        effectProgress: 0.45,
        phaseId: "bide-c-puff-2-start",
        phaseName: "#4. 2차 증기 분출 시작 (중앙 상단)",
      },
      // #5. 2차 증기 대형 만개 & 붉은 텐션 고조
      {
        ...baseFrame,
        delay: 75,
        ...cScale(1.06, 0.94),
        ...cOff(0, 1),
        moveStep: 2,
        effectProgress: 0.58,
        phaseId: "bide-c-puff-2-rise",
        phaseName: "#5. 2차 증기 만개 & 텐션 고조",
      },
      // #6. 3차 증기 분출 시작 (우상단 칙-)
      {
        ...baseFrame,
        delay: 75,
        ...cScale(1.08, 0.92),
        ...cOff(2, 2),
        moveStep: 3,
        effectProgress: 0.70,
        phaseId: "bide-c-puff-3-start",
        phaseName: "#6. 3차 증기 분출 시작 (우상단)",
      },
      // #7. 3차 증기 상승 피어오름
      {
        ...baseFrame,
        delay: 75,
        ...cScale(1.05, 0.95),
        ...cOff(1, 1),
        moveStep: 3,
        effectProgress: 0.85,
        phaseId: "bide-c-puff-3-rise",
        phaseName: "#7. 3차 증기 상승 & 피어오름",
      },
      // #8. 증기 승화 & 붉은 참기 충전 완료 유지
      {
        ...baseFrame,
        delay: 85,
        ...cScale(1.02, 0.98),
        ...cOff(0, 0),
        moveStep: 3,
        effectProgress: 0.98,
        phaseId: "bide-c-ready",
        phaseName: "#8. 증기 승화 & 참기 충전 완료",
      },
    ];
  },
};

/**
 * 117: 참기 (Bide) - 메인 기술 정의 (1턴 충전 및 2턴 몸통박치기 타격 통합)
 */
export const bideMove: BattleMoveAnimation = {
  num: 117,
  key: "bide",
  nameKo: "참기 (공격)",
  nameEn: "Bide (Attack)",
  type: "normal",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    if (frame.isBideCharging) {
      // 1턴 배후 효과 없음
      return;
    }
    const { attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 2;
    const prog = frame.effectProgress ?? 0.5;
    drawBideAttackBehindEffect(targetCtx, attackerPos, targetPos, step, prog, drawCtx.isPlayer);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    if (frame.isBideCharging) {
      const casterPos = drawCtx?.casterPos || drawCtx?.attackerPos;
      if (!casterPos) return;
      const prog = frame.effectProgress ?? 0.5;
      drawBideChargeEffect(targetCtx, casterPos, prog, drawCtx.isPlayer);
      return;
    }
    const { targetPos, attackerPos } = drawCtx;
    const step = frame.moveStep ?? 3;
    const prog = frame.effectProgress ?? 0.65;
    drawBideAttackEffect(targetCtx, targetPos, attackerPos, step, prog, drawCtx.isPlayer);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const isCharging = Boolean(
      (a as any).isTurn1Launch ||
      (a as any).chargingMove === "bide" ||
      a.log?.includes("에너지를 모으고 있다") ||
      a.log?.includes("참고 있다") ||
      a.log?.includes("storing energy") ||
      a.log?.includes("is biding") ||
      (!a.wasDescentFromAir && (a.damage ?? 0) === 0 && !a.log?.includes("빗나갔다") && !a.log?.includes("missed") && !a.log?.includes("닿지 않았다"))
    );

    // =========================================================================
    // 1턴: 붉게 변하며 머리 위로 3개의 하얀 증기 구름을 뿜어냄 (Charging)
    // =========================================================================
    if (isCharging) {
      const chargeFrames = bideChargeMove.buildFrames(ctx);
      return chargeFrames.map(f => ({
        ...f,
        isBideCharging: true,
      }));
    }

    // =========================================================================
    // 2턴: 축적된 에너지를 폭발시키며 상대방에게 정면 대격돌 (몸통박치기 이펙트)
    // =========================================================================
    const baseAttackFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.35,
      isBideCharging: false,
    };

    const cOff = (x: number, y: number) =>
      isP ? { pOffset: { x, y } } : { eOffset: { x: -x, y: -y } };

    const cTargetOff = (x: number, y: number) =>
      isP ? { eOffset: { x, y } } : { pOffset: { x: -x, y: -y } };

    const cTransform = (scaleX: number, scaleY: number, rot: number) => ({
      pScale: isP ? { x: scaleX, y: scaleY } : undefined,
      eScale: !isP ? { x: scaleX, y: scaleY } : undefined,
      pRot: isP ? rot : 0,
      eRot: !isP ? -rot : 0,
    });

    return [
      // 1. 참기 해제 & 도움닫기 웅크림 (붉은 잔광 & 탄성 축적)
      {
        ...baseAttackFrame,
        delay: 90,
        ...cOff(-18, 6),
        ...cTargetOff(0, 0),
        ...cTransform(1.15, 0.85, -0.06),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.20,
        phaseId: "bide-strike-windup",
        phaseName: "#1. 도움닫기 웅크림 (붉은 에너지 축적)",
      },
      // 2. 전방 초고속 쇄도 (상대를 향해 맹렬히 돌진 & 스피드 스트림)
      {
        ...baseAttackFrame,
        delay: 80,
        ...cOff(48, -18),
        ...cTargetOff(0, 0),
        ...cTransform(0.85, 1.15, 0.10),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.50,
        phaseId: "bide-strike-dash",
        phaseName: "#2. 전방 초고속 쇄도 돌진",
      },
      // 3. 정면 격돌 직격 (순백 스타버스트 섬광 작렬 & 피격 플래시)
      {
        ...baseAttackFrame,
        delay: 75,
        ...cOff(68, -25),
        ...(isHit ? cTargetOff(12, -4) : cTargetOff(0, 0)),
        ...cTransform(1.20, 0.82, 0.02),
        showEffect: isHit,
        hitFlash: isHit,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 3,
        effectProgress: 0.20,
        phaseId: "bide-strike-hit",
        phaseName: "#3. 몸통박치기 정면 격돌 & 스타버스트",
      },
      // 4. 충돌 폭발 & 최대 넉백 (충격파 링 확산 & 별빛 스파크 비산)
      {
        ...baseAttackFrame,
        delay: 85,
        ...cOff(72, -27),
        ...(isHit ? cTargetOff(20, -8) : cTargetOff(0, 0)),
        ...cTransform(1.15, 0.85, 0.02),
        showEffect: isHit,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 3,
        effectProgress: 0.70,
        phaseId: "bide-strike-burst",
        phaseName: "#4. 충돌 폭발 & 충격파 링 넉백",
      },
      // 5. 충돌 반동 및 잔향 (반작용 튕김)
      {
        ...baseAttackFrame,
        delay: 90,
        ...cOff(38, -14),
        ...(isHit ? cTargetOff(12, -4) : cTargetOff(0, 0)),
        ...cTransform(1.05, 0.95, -0.02),
        showEffect: isHit,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 4,
        effectProgress: 0.95,
        phaseId: "bide-strike-recoil",
        phaseName: "#5. 충돌 반동 튕김 & 잔향 소멸",
      },
      // 6. 지면 착지 및 안정 복귀
      {
        ...baseAttackFrame,
        delay: 100,
        ...cOff(0, 0),
        ...cTargetOff(0, 0),
        ...cTransform(1.0, 1.0, 0),
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 4,
        effectProgress: 1.0,
        phaseId: "bide-strike-land",
        phaseName: "#6. 안정적 착지 복귀",
      },
    ];
  },
};
