// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawRevengeBehindEffect,
  drawRevengeEffect,
} from "../../../renderers/moves/gen1/move277_280.js";

/**
 * 🔥 279: 리벤지 (Revenge / リベンジ) - 격투 타입 물리 공격 기술
 *
 * 위력: 60 (피격 시 120) / 명중: 100 / PP: 10 / 우선도: -4 / 접촉: O
 * 설명: 상대에게 기술을 받으면 그 상대에게 주는 데미지가 2배가 된다.
 */
export const revengeMove: BattleMoveAnimation = {
  num: 279,
  key: "revenge",
  nameKo: "리벤지",
  nameEn: "Revenge",
  type: "fighting",
  category: "physical",
  camera: {
    type: "caster_to_target",
    zoom: 1.35,
    delayUntilStep: 2,
    inlineGlideInFrames: 2,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showBehindEffect && !frame.showEffect) return;
    drawRevengeBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawRevengeEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const cScale = (x: number, y: number, rot: number = 0) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
      pRot: isP && rot !== 0 ? rot : undefined,
      eRot: !isP && rot !== 0 ? -rot : undefined,
    });

    const defOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const defScale = (x: number, y: number) => ({
      pScale: !isP ? { x, y } : undefined,
      eScale: isP ? { x, y } : undefined,
    });

    const cTint = (alpha: number) => {
      if (alpha <= 0.01) return { pTintColor: null, eTintColor: null };
      const colorStr = `rgba(220, 38, 38, ${alpha.toFixed(2)})`;
      return {
        pTintColor: isP ? colorStr : null,
        eTintColor: !isP ? colorStr : null,
      };
    };

    const frames: BattleFrame[] = [];

    // [Step 1: 암전 ➔ 붉은 외곽 & 흰색·회색빛 중간 증기 상승] (13프레임, 42ms)
    const step1Count = 13;
    for (let i = 0; i < step1Count; i++) {
      const prog = i / (step1Count - 1);
      // 암전 이후 증기가 올라올 때 낮게 웅크리며 미세 진동
      const isSteamPhase = prog >= 0.20;
      const shake = isSteamPhase ? (i % 2 === 0 ? -1 : 1) * 2 : 0;
      const cx = -8 * Math.sin(prog * Math.PI * 0.7) + shake;
      const cy = 3 * Math.sin(prog * Math.PI * 0.8);
      const sx = 1.0 + prog * 0.08;
      const sy = 1.0 - prog * 0.06;

      frames.push({
        ...baseFrame,
        delay: 42,
        ...cOff(cx, cy),
        ...cScale(sx, sy),
        moveStep: 1,
        effectProgress: prog,
        phaseId: `revenge-endure-${i + 1}`,
        phaseName: `#1. 암전 및 분노의 증기 상승 (${i + 1}/${step1Count})`,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // [Step 2: 분노의 역습 돌진] (8프레임, 38ms)
    const step2Count = 8;
    for (let i = 0; i < step2Count; i++) {
      const prog = i / (step2Count - 1);
      const easeIn = Math.pow(prog, 1.35);
      const rushX = -10 * (1.0 - prog) + easeIn * 72;
      const rushY = -Math.sin(prog * Math.PI) * 10 - easeIn * 14;
      const sx = 1.08 + Math.sin(prog * Math.PI) * 0.16;
      const sy = 0.92 - Math.sin(prog * Math.PI) * 0.10;

      frames.push({
        ...baseFrame,
        delay: 38,
        ...cOff(rushX, rushY),
        ...cScale(sx, sy, 0.12 * Math.sin(prog * Math.PI)),
        moveStep: 2,
        effectProgress: prog,
        phaseId: `revenge-rush-${i + 1}`,
        phaseName: `#2. 분노의 역습 돌진 (${i + 1}/${step2Count})`,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // [Step 3: 붉은 배경 비네트 + 위로 솟구치는 파란 굵은 선 & 원형 점 파티클 비산] (10프레임, 42ms)
    const step3Count = 10;
    for (let i = 0; i < step3Count; i++) {
      const prog = i / (step3Count - 1);
      let defX = 0;
      let defY = 0;
      let defSx = 1.0;
      let defSy = 1.0;

      if (isHit) {
        if (i <= 3) {
          const u = Math.sin((i / 3) * (Math.PI / 2));
          defX = 22 * u;
          defY = -6 * u;
          defSx = 1.0 + 0.24 * u;
          defSy = 1.0 - 0.20 * u;
        } else {
          const u = (i - 3) / (step3Count - 4);
          defX = 22 * (1.0 - u);
          defY = -6 * (1.0 - u);
        }
      }

      const easeOutRebound = 1.0 - Math.pow(prog, 0.78);
      const reboundX = 62 * easeOutRebound;
      const reboundY = -12 * easeOutRebound - Math.sin(prog * Math.PI) * 6;

      frames.push({
        ...baseFrame,
        delay: 42,
        hitFlash: i === 0 && isHit,
        ...cOff(reboundX, reboundY),
        ...cScale(1.0, 1.0),
        ...defOff(defX, defY),
        ...defScale(defSx, defSy),
        moveStep: 3,
        effectProgress: prog,
        phaseId: `revenge-impact-${i + 1}`,
        phaseName: `#3. 리벤지 카운터 일격 및 점 파티클 비산 (${i + 1}/${step3Count})`,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    return frames;
  },
};
