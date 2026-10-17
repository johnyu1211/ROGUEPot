// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawMetalClawBehindEffect,
  drawMetalClawEffect,
} from "../../../renderers/moves/gen1/move229_232.js";

/**
 * 232: 메탈클로 (Metal Claw / メタルクロー) - 강철 타입 물리 기술
 *
 * 위력: 50 / 명중: 95 / PP: 35 / 접촉: O
 * 설명: 강철의 발톱으로 상대를 베어 갈라 공격한다. 10% 확률로 자신의 공격이 1랭크 올라간다.
 */
export const metalClawMove: BattleMoveAnimation = {
  num: 232,
  key: "metal-claw",
  nameKo: "메탈클로",
  nameEn: "Metal Claw",
  type: "steel",
  category: "physical",
  camera: {
    type: "caster_to_target",
    zoom: 1.30,
    focalRatio: 1.0,
    delayUntilStep: 2,
    inlineGlideInFrames: 2,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawMetalClawBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawMetalClawEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
      drawEnemyOnTop: !isP, // 적 시전 시 적 스프라이트가 아군 전경에 렌더링
    };

    const targetDistX = isP ? 180 : -180;
    const targetDistY = isP ? -75 : 60;

    const battlerOffsets = (
      casterX: number,
      casterY: number,
      targetX: number = 0,
      targetY: number = 0
    ) => ({
      pOffset: isP ? { x: casterX, y: casterY } : { x: targetX, y: targetY },
      eOffset: isP ? { x: targetX, y: targetY } : { x: casterX, y: casterY },
    });

    const frames: BattleFrame[] = [];

    // =========================================================================
    // [Step 1: 기(起) - 단단해지기(Harden) 경화 & 강철 발톱 충전] (6프레임, 45ms)
    // =========================================================================
    for (let i = 0; i < 6; i++) {
      const prog = i / 5;
      const crouchY = prog * 4;

      frames.push({
        ...baseFrame,
        delay: 45,
        ...battlerOffsets(0, crouchY),
        pScale: isP ? { x: 1.06, y: 0.94 } : undefined,
        eScale: !isP ? { x: 1.06, y: 0.94 } : undefined,
        pGreyTint: isP,
        eGreyTint: !isP,
        moveStep: 1,
        phaseId: `metal-claw-harden-${i + 1}`,
        phaseName: "#1. 단단해지기(Harden) 경화 및 강철 발톱 충전",
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // =========================================================================
    // [Step 2: 승(承) - 전방 고속 도약 쇄도 & 발톱 조준] (6프레임, 40ms)
    // =========================================================================
    for (let i = 0; i < 6; i++) {
      const prog = i / 5;
      const leapY = -Math.sin(prog * Math.PI) * 16;
      const curX = targetDistX * prog;
      const curY = targetDistY * prog + leapY;

      frames.push({
        ...baseFrame,
        delay: 40,
        ...battlerOffsets(curX, curY),
        pScale: isP ? { x: 1.10, y: 0.92 } : undefined,
        eScale: !isP ? { x: 1.10, y: 0.92 } : undefined,
        pGreyTint: isP,
        eGreyTint: !isP,
        moveStep: 2,
        phaseId: `metal-claw-dash-${i + 1}`,
        phaseName: "#2. 전방 고속 도약 쇄도 및 발톱 조준",
        effectProgress: prog,
        showEffect: false,
        showBehindEffect: false,
      });
    }

    // =========================================================================
    // [Step 3: 전(轉) - 3단 금속할퀴기(Metallic Claw) 참격 및 스파크 폭발] (7프레임, 48ms)
    // =========================================================================
    for (let i = 0; i < 7; i++) {
      const prog = i / 6;
      const hitFlash = isHit && i === 0;
      const knockbackX = isHit ? Math.sin((1.0 - prog) * Math.PI) * 16 * (isP ? 1 : -1) : 0;
      const shakeY = isHit && i < 5 ? ((i % 2 === 0 ? 1 : -1) * 3) : 0;

      frames.push({
        ...baseFrame,
        delay: 48,
        ...battlerOffsets(targetDistX, targetDistY, knockbackX, shakeY),
        hitFlash,
        pGreyTint: isP,
        eGreyTint: !isP,
        moveStep: 3,
        phaseId: `metal-claw-slash-${i + 1}`,
        phaseName: "#3. 3단 금속할퀴기(Metallic Claw) 참격 및 스파크 폭발",
        effectProgress: prog,
        hitProgress: prog,
        showEffect: isHit,
        showBehindEffect: true,
      });
    }

    // =========================================================================
    // [Step 4: 결(結) - 반동 복귀 착지 및 공격력 상승 연출] (6프레임, 45ms)
    // =========================================================================
    for (let i = 0; i < 6; i++) {
      const prog = i / 5;
      const returnProg = 1.0 - prog;
      const curX = targetDistX * returnProg;
      const curY = targetDistY * returnProg;
      const isLanded = i >= 4;

      frames.push({
        ...baseFrame,
        delay: 45,
        ...battlerOffsets(curX, curY),
        pScale: isP && isLanded ? { x: 1.05, y: 0.95 } : undefined,
        eScale: !isP && isLanded ? { x: 1.05, y: 0.95 } : undefined,
        pGreyTint: false,
        eGreyTint: false,
        moveStep: 4,
        phaseId: `metal-claw-boost-${i + 1}`,
        phaseName: "#4. 반동 복귀 착지 및 공격력 상승 연출",
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: false,
      });
    }

    return frames;
  },
};
