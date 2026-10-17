// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawBatonPassBehindEffect,
  drawBatonPassEffect,
} from "../../../renderers/moves/gen1/move225_228.js";

/**
 * 226: 배턴터치 (Baton Pass / バトンタッチ) - 노말 타입 변화 기술
 *
 * 위력: — / 명중: — / PP: 40 / 대상: 자신 / 접촉: X
 * 설명: 교대 포켓몬과 바뀐다. 능력 변화 및 일부 상태이상은 바뀐 포켓몬이 그대로 이어받는다.
 */
export const batonPassMove: BattleMoveAnimation = {
  num: 226,
  key: "baton-pass",
  nameKo: "배턴터치",
  nameEn: "Baton Pass",
  type: "normal",
  category: "status",
  camera: {
    type: "self",
    zoom: 1.20,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    // 링/파티클 제거
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawBatonPassEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

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
      eOffset: !isP ? { x, y } : { x: 0, y: 0 },
    });

    const frames: BattleFrame[] = [];
    let totalFrameIdx = 0;

    // [Step 1: 기(起) - 바톤을 공중으로 던짐] (6프레임, 40ms)
    for (let i = 0; i < 6; i++) {
      const prog = i / 5;
      const tossY = -Math.sin(prog * Math.PI) * 7;

      frames.push({
        ...baseFrame,
        delay: 40,
        ...cOff(0, tossY),
        pScale: isP ? { x: 1.02 - prog * 0.02, y: 0.98 + prog * 0.04 } : undefined,
        eScale: !isP ? { x: 1.02 - prog * 0.02, y: 0.98 + prog * 0.04 } : undefined,
        moveStep: 1,
        effectProgress: prog,
        animFrame: totalFrameIdx++,
        phaseId: `baton-toss-${i + 1}`,
        phaseName: `1. 바톤 공중으로 힘차게 던짐 (${i + 1}/6)`,
        showEffect: true,
        showBehindEffect: false,
      });
    }

    // [Step 2: 승(承) - 바톤 고속 회전하며 상공 높이 상승] (8프레임, 40ms)
    for (let i = 0; i < 8; i++) {
      const prog = i / 7;

      frames.push({
        ...baseFrame,
        delay: 40,
        ...cOff(0, 0),
        moveStep: 2,
        effectProgress: prog,
        animFrame: totalFrameIdx++,
        phaseId: `baton-rise-spin-${i + 1}`,
        phaseName: `2. 바톤 고속 회전하며 상공으로 상승 (${i + 1}/8)`,
        showEffect: true,
        showBehindEffect: false,
      });
    }

    // [Step 3: 전(轉) - 최고 정점 통과 후 회전하며 하강 시작] (7프레임, 40ms)
    for (let i = 0; i < 7; i++) {
      const prog = i / 6;

      frames.push({
        ...baseFrame,
        delay: 40,
        ...cOff(0, 0),
        moveStep: 3,
        effectProgress: prog,
        animFrame: totalFrameIdx++,
        phaseId: `baton-fall-spin-${i + 1}`,
        phaseName: `3. 최고 정점 도달 후 회전하며 하강 (${i + 1}/7)`,
        showEffect: true,
        showBehindEffect: false,
      });
    }

    // [Step 4: 결(結) - 회전 하강 & 부드러운 페이드 아웃] (7프레임, 40ms)
    for (let i = 0; i < 7; i++) {
      const prog = i / 6;
      const slideBack = -prog * 14;

      frames.push({
        ...baseFrame,
        delay: 40,
        ...cOff(slideBack, 0),
        pAlpha: isP ? Math.max(0.35, 1.0 - prog * 0.5) : undefined,
        eAlpha: !isP ? Math.max(0.35, 1.0 - prog * 0.5) : undefined,
        moveStep: 4,
        effectProgress: prog,
        animFrame: totalFrameIdx++,
        phaseId: `baton-fadeout-${i + 1}`,
        phaseName: `4. 바톤 회전 하강 및 페이드 아웃 (${i + 1}/7)`,
        showEffect: true,
        showBehindEffect: false,
      });
    }

    return frames;
  },
};
