// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawVitalThrowBehindEffect,
  drawVitalThrowEffect,
} from "../../../renderers/moves/gen1/move233_236.js";

/**
 * 233: 받아던지기 (Vital Throw / あてみなげ) - 격투 타입 물리 기술
 *
 * 위력: 70 / 명중: — (반드시 명중) / PP: 10 / 우선도: -1 / 접촉: O
 * 설명: 상대보다 나중에 공격한다. 그 대신 자신의 공격은 반드시 명중한다.
 */
export const vitalThrowMove: BattleMoveAnimation = {
  num: 233,
  key: "vital-throw",
  nameKo: "받아던지기",
  nameEn: "Vital Throw",
  type: "fighting",
  category: "physical",
  camera: {
    type: "none",
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawVitalThrowBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawVitalThrowEffect(targetCtx, frame, drawCtx);
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
    };

    const cOff = (x = 0, y = 0) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y } : { x: 0, y: 0 },
    });

    const tOff = (x = 0, y = 0) => ({
      pOffset: !isP ? { x: -x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x, y } : { x: 0, y: 0 },
    });

    const frames: BattleFrame[] = [];

    // [Step 1: 시전포켓몬 스프라이트 고정 상태로 Z축(깊이/전후)은 더 많이, Y축은 더 작게 아래로 360도 회전] (8프레임, 40ms)
    const spinSteps = 8;
    const radiusZ = 30; // Z축은 더 많이
    const radiusY = 7;  // Y축은 더 조금
    for (let i = 0; i < spinSteps; i++) {
      const angle = (i / spinSteps) * Math.PI * 2;
      const dx = Math.sin(angle) * radiusZ;
      const dy = (1 - Math.cos(angle)) * radiusY; // 아래쪽으로 회전

      frames.push({
        ...baseFrame,
        delay: 40,
        ...cOff(dx, dy),
        moveStep: 1,
        phaseId: `vital-throw-spin-${i + 1}`,
        phaseName: "#1. 시전자 아래쪽 와이드 360도 공전 회전",
        effectProgress: i / (spinSteps - 1),
        showEffect: false,
        showBehindEffect: false,
      });
    }

    // [Step 2: 타격 - 몸통박치기 작은 별 + 속여때리기 점파티클(몸통박치기 색상)] (7프레임, 45ms)
    const hitSteps = 7;
    for (let i = 0; i < hitSteps; i++) {
      const prog = i / (hitSteps - 1);
      const hitFlash = isHit && (i === 0 || i === 1);
      const knockX = isHit ? (i === 1 ? 6 : i === 2 ? -3 : 0) : 0;

      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        ...tOff(knockX, 0),
        hitFlash,
        moveStep: 2,
        phaseId: `vital-throw-hit-${i + 1}`,
        phaseName: "#2. 몸통박치기 별 & 점파티클 타격",
        effectProgress: prog,
        hitProgress: prog,
        showEffect: isHit,
        showBehindEffect: false,
      });
    }

    // [Step 3: 타격 마무리 및 정위치] (2프레임, 45ms)
    for (let i = 0; i < 2; i++) {
      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        ...tOff(0, 0),
        moveStep: 3,
        phaseId: `vital-throw-settle-${i + 1}`,
        phaseName: "#3. 정위치 복귀",
        effectProgress: 1.0,
        showEffect: false,
        showBehindEffect: false,
      });
    }

    return frames;
  },
};
