// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawTwisterBehindEffect,
  drawTwisterEffect,
} from "../../../renderers/moves/gen1/move237_240.js";

/**
 * 239: 회오리 (Twister / たつまき) - 드래곤 타입 특수 기술
 *
 * 위력: 40 / 명중: 100 / PP: 20 / 20% 풀죽음 / 비접촉
 * 설명: 회오리를 일으켜 상대를 끌어들여 공격한다. 상대를 풀죽게 만들 때가 있다.
 *       공중날기, 뛰어오르다 상태의 상대에게 2배의 위력으로 적중한다.
 */
export const twisterMove: BattleMoveAnimation = {
  num: 239,
  key: "twister",
  nameKo: "회오리",
  nameEn: "Twister",
  type: "dragon",
  category: "special",
  camera: {
    type: "target",
    zoom: 1.2,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawTwisterBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawTwisterEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      cameraZoom: 1.2,
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
    let globalFrameIdx = 0;

    // [Step 1: 상대 발밑 바닥 흙먼지 소용돌이 전개 & 기둥 솟구침] (7프레임, 45ms)
    const gatherSteps = 7;
    for (let i = 0; i < gatherSteps; i++) {
      const prog = i / (gatherSteps - 1);
      const rot = globalFrameIdx * 0.62;
      const isRising = i >= 3;
      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(i % 2 === 0 ? 1 : 0, 0),
        moveStep: 1,
        phaseId: `twister-gather-${i + 1}`,
        phaseName: isRising
          ? "#1. 흙먼지 속에서 회오리 기둥 바닥에서 솟구침"
          : "#1. 상대 발밑 바닥 흙먼지 소용돌이 발생",
        effectProgress: prog,
        twisterRot: rot,
        showEffect: true,
        showBehindEffect: true,
      });
      globalFrameIdx++;
    }

    // [Step 2: 3D 모래시계형 드래곤 토네이도 맹렬한 회전 & 공중 요동] (10프레임, 45ms)
    const cycloneSteps = 10;
    for (let i = 0; i < cycloneSteps; i++) {
      const prog = i / (cycloneSteps - 1);
      const rot = globalFrameIdx * 0.62;
      // 회오리에 휘말려 공중으로 살짝 떴다가 좌우로 격렬히 요동
      const liftY = isHit ? -Math.round(Math.sin(prog * Math.PI) * 14) : 0;
      const shakeX = isHit ? (i % 2 === 0 ? 4 : -4) : 0;
      const hitFlash = isHit && (i === 2 || i === 6);

      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        ...tOff(shakeX, liftY),
        hitFlash,
        moveStep: 2,
        phaseId: `twister-vortex-${i + 1}`,
        phaseName: "#2. 3D 드래곤 토네이도 맹렬한 회전 & 공중 요동",
        effectProgress: prog,
        hitProgress: prog,
        twisterRot: rot,
        showEffect: true,
        showBehindEffect: true,
      });
      globalFrameIdx++;
    }

    // [Step 3: 회오리 소산 & 바람 칼날/흙먼지 잔향 비산] (6프레임, 50ms)
    const burstSteps = 6;
    for (let i = 0; i < burstSteps; i++) {
      const prog = i / (burstSteps - 1);
      const rot = globalFrameIdx * 0.62;
      const settleY = isHit ? Math.round(-6 * (1 - prog)) : 0;

      frames.push({
        ...baseFrame,
        delay: 50,
        ...cOff(0, 0),
        ...tOff(0, settleY),
        moveStep: 3,
        phaseId: `twister-burst-${i + 1}`,
        phaseName: "#3. 회오리 소산 및 바람 칼날/흙먼지 잔향 비산",
        effectProgress: prog,
        twisterRot: rot,
        showEffect: true,
        showBehindEffect: true,
      });
      globalFrameIdx++;
    }

    // [Step 4: 착지 및 정위치 복귀] (2프레임, 45ms)
    for (let i = 0; i < 2; i++) {
      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        ...tOff(0, 0),
        moveStep: 4,
        phaseId: `twister-settle-${i + 1}`,
        phaseName: "#4. 정위치 착지 복귀",
        effectProgress: 1.0,
        showEffect: false,
        showBehindEffect: false,
      });
    }

    return frames;
  },
};
