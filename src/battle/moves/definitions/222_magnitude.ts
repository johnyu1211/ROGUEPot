// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawMagnitudeBehindEffect,
  drawMagnitudeEffect,
} from "../../../renderers/moves/gen1/move221_224.js";

/**
 * 222: 매그니튜드 (Magnitude / マグニチュード) - 땅 타입 물리 기술
 *
 * 위력: 10~150 (변동) / 명중: 100 / PP: 30 / 접촉: X
 * 설명: 땅을 흔들어서 공격한다. 4~10의 매그니튜드 수치에 따라 위력이 바뀐다. 구멍파기 상태 상대에게 2배.
 */
export const magnitudeMove: BattleMoveAnimation = {
  num: 222,
  key: "magnitude",
  nameKo: "매그니튜드",
  nameEn: "Magnitude",
  type: "ground",
  category: "physical",
  camera: {
    type: "none",
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawMagnitudeBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawMagnitudeEffect(targetCtx, frame, drawCtx);
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

    // [Step 1: 기(起) - 발구르기 점프 및 착지 충격파] (7프레임, 45ms)
    for (let i = 0; i < 7; i++) {
      const prog = i / 6;
      const jumpY = -Math.sin(prog * Math.PI) * 16;
      const squashX = i === 6 ? 1.15 : 1.0;
      const squashY = i === 6 ? 0.85 : 1.0;

      frames.push({
        ...baseFrame,
        delay: 45,
        ...posOff(0, jumpY, 0, 0),
        pScale: isP ? { x: squashX, y: squashY } : undefined,
        eScale: !isP ? { x: squashX, y: squashY } : undefined,
        moveStep: 1,
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: false,
      });
    }

    // [Step 2: 승(承) - 전장 지진 진동 및 흙먼지 요동] (8프레임, 40ms)
    for (let i = 0; i < 8; i++) {
      const prog = i / 7;
      // 전장 전체를 흔드는 지진 진동 오프셋
      const quakeY = (i % 2 === 0 ? 1 : -1) * (3 + prog * 4);
      const quakeX = ((i * 3) % 4 - 2);

      frames.push({
        ...baseFrame,
        delay: 40,
        ...posOff(quakeX * 0.5, quakeY * 0.5, quakeX, quakeY),
        moveStep: 2,
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: false,
      });
    }

    // [Step 3: 전(轉) - 바위 기둥 상공 솟구침 & 격렬한 피격] (10프레임, 42ms)
    for (let i = 0; i < 10; i++) {
      const prog = i / 9;
      const hitFlash = isHit && (i === 0 || i === 2);
      const knockbackY = isHit ? -Math.sin((1.0 - prog) * Math.PI * 0.5) * 14 : 0;
      const shakeX = isHit && i < 6 ? ((i % 2 === 0 ? 1 : -1) * 6 * (1.0 - i / 6)) : 0;

      frames.push({
        ...baseFrame,
        delay: 42,
        ...posOff(0, 0, shakeX, knockbackY),
        hitFlash,
        moveStep: 3,
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: false,
      });
    }

    // [Step 4: 결(結) - 바위가 사방으로 퍼지면서 낙하 & 착지 침강] (10프레임, 45ms)
    for (let i = 0; i < 10; i++) {
      const prog = i / 9;
      frames.push({
        ...baseFrame,
        delay: 45,
        ...posOff(0, 0, 0, 0),
        moveStep: 4,
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: false,
      });
    }

    return frames;
  },
};
