// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawPursuitBehindEffect,
  drawPursuitEffect,
} from "../../../renderers/moves/gen1/move225_228.js";

/**
 * 228: 따라가때리기 (Pursuit / おいうち) - 악 타입 물리 기술
 *
 * 위력: 40 (상대 교체 시 80) / 명중: 100 / PP: 20 / 접촉: O
 * 설명: 상대 포켓몬이 교체될 때 사용하면 2배의 위력으로 공격할 수 있다.
 */
export const pursuitMove: BattleMoveAnimation = {
  num: 228,
  key: "pursuit",
  nameKo: "따라가때리기",
  nameEn: "Pursuit",
  type: "dark",
  category: "physical",
  camera: {
    type: "caster_to_target",
    zoom: 1.35,
    focalRatio: 1.0,
    delayUntilStep: 2,
    inlineGlideInFrames: 2,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    // [유저 요청] 이펙트 제거 (움직임 및 투명도만 유지)
    return;
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawPursuitEffect(targetCtx, frame, drawCtx);
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

    const posOff = (casterX = 0, casterY = 0, targetX = 0, targetY = 0) => ({
      pOffset: isP ? { x: casterX, y: casterY } : { x: targetX, y: targetY },
      eOffset: isP ? { x: targetX, y: targetY } : { x: -casterX, y: -casterY },
    });

    const frames: BattleFrame[] = [];

    // [Step 1: 기(起) - 그림자 잠입 (Shadow Meld) & 서서히 암전 (0% -> 40%)] (6프레임, 45ms)
    for (let i = 0; i < 6; i++) {
      const prog = i / 5;
      const sinkY = prog * 10;
      const alpha = Math.max(0.15, 1.0 - prog * 0.85);
      const blackFadeAlpha = Number((prog * 0.40).toFixed(2));

      frames.push({
        ...baseFrame,
        delay: 45,
        ...posOff(0, sinkY, 0, 0),
        pAlpha: isP ? alpha : undefined,
        eAlpha: !isP ? alpha : undefined,
        pScale: isP ? { x: 1.0 + prog * 0.2, y: 1.0 - prog * 0.5 } : undefined,
        eScale: !isP ? { x: 1.0 + prog * 0.2, y: 1.0 - prog * 0.5 } : undefined,
        blackFadeAlpha,
        moveStep: 1,
        phaseId: `pursuit-meld-${i + 1}`,
        phaseName: "#1. 그림자 잠입 (Shadow Meld)",
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // [Step 2: 승(承) - 암전 유지 (40%) & 대상 포위 2겹 구불구불 원 수축 & 반동] (10프레임, 40ms)
    for (let i = 0; i < 10; i++) {
      const prog = i / 9;
      frames.push({
        ...baseFrame,
        delay: 40,
        ...posOff(0, 0, 0, 0),
        pAlpha: isP ? 0.0 : undefined, // 그림자 속 잠입 중
        eAlpha: !isP ? 0.0 : undefined,
        blackFadeAlpha: 0.40,
        moveStep: 2,
        phaseId: `pursuit-wavy-circle-${i + 1}`,
        phaseName: "#2. 대상 포위 2겹 구불구불 원 수축 & 반동",
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: false,
      });
    }

    // [Step 3: 전(轉) - 암전 유지 (40%) & 원 수축 직후 속여때리기 타격 폭발 (탁!)] (6프레임, 60ms)
    for (let i = 0; i < 6; i++) {
      const prog = i / 5;
      const hitFlash = isHit && i === 0;
      const knockbackX = isHit ? Math.sin((1.0 - prog) * Math.PI * 0.5) * 16 : 0;
      const shakeY = isHit && i < 4 ? ((i % 2 === 0 ? 1 : -1) * 5 * (1.0 - i / 4)) : 0;

      frames.push({
        ...baseFrame,
        delay: 60,
        ...posOff(0, 0, knockbackX, shakeY),
        pAlpha: isP ? 0.0 : undefined, // 암흑 속 기습 타격 중
        eAlpha: !isP ? 0.0 : undefined,
        hitFlash,
        blackFadeAlpha: 0.40,
        moveStep: 3,
        phaseId: `pursuit-impact-${i + 1}`,
        phaseName: "#3. 원 수축 직후 속여때리기 타격 폭발",
        effectProgress: prog,
        hitProgress: prog,
        showEffect: isHit,
        showBehindEffect: false,
      });
    }

    // [Step 4: 결(결) - 정위치 착지 및 암전 서서히 해제 (40% -> 0%)] (5프레임, 50ms)
    for (let i = 0; i < 5; i++) {
      const prog = i / 4;
      const jumpArcY = -16 * Math.sin(prog * Math.PI);
      const alpha = Math.min(1.0, 0.4 + prog * 0.6);
      const blackFadeAlpha = Number(((1.0 - prog) * 0.40).toFixed(2));
      frames.push({
        ...baseFrame,
        delay: 50,
        ...posOff(0, jumpArcY, 0, 0),
        pAlpha: isP ? alpha : undefined,
        eAlpha: !isP ? alpha : undefined,
        blackFadeAlpha,
        moveStep: 4,
        phaseId: `pursuit-land-${i + 1}`,
        phaseName: "#4. 정위치 착지 및 암흑 소산",
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    return frames;
  },
};
