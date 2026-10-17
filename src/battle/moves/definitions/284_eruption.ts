// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawEruptionBehindEffect,
  drawEruptionEffect,
} from "../../../renderers/moves/gen1/move281_284.js";

/**
 * 🌋 284: 분화 (Eruption / ふんか) - 불꽃 타입 특수 공격 기술
 *
 * 위력: 150 (위력 = 150 × 현재HP / 최대HP, 최소 1) / 명중: 100 / PP: 5 / 접촉: X
 * 설명: 분노를 폭발시켜 마그마와 바위를 상대에게 퍼부어 공격한다. 자신의 남은 HP가 적을수록 기술의 위력이 떨어진다.
 *
 * [연출 시퀀스]:
 * 1. [화산 마그마 기둥 대분출 (0.00 ~ 0.42)]: 시전자가 강하게 웅크렸다 솟구치며 등 뒤로 거대한 마그마 화염 기둥과 화산탄들을 상공으로 쏘아 올림
 * 2. [상공 화산탄 유성우 대폭격 (0.42 ~ 0.95)]: 카메라가 상대로 전환되며 상공에서 불타는 거대 3D 화산탄 바위들이 연쇄 낙하해 대지 용암 균열과 화염 폭발을 일으킴
 */
export const eruptionMove: BattleMoveAnimation = {
  num: 284,
  key: "eruption",
  nameKo: "분화",
  nameEn: "Eruption",
  type: "fire",
  category: "special",
  camera: {
    type: "caster_to_target",
    zoom: 1.35,
    delayUntilStep: 0.42,
    inlineGlideInFrames: 3,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showBehindEffect && !frame.showEffect) return;
    drawEruptionBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawEruptionEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const startEnemyHp = a.enemyHpBefore ?? enemyHp;
    const startPlayerHp = a.playerHpBefore ?? playerHp;

    const baseFrame = {
      enemyHp: startEnemyHp,
      playerHp: startPlayerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      showEffect: true,
      showBehindEffect: true,
    };

    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y } : { x: 0, y: 0 },
    });

    const cScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    const defOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y } : { x: 0, y: 0 },
    });

    const defScale = (x: number, y: number) => ({
      pScale: !isP ? { x, y } : undefined,
      eScale: isP ? { x, y } : undefined,
    });

    const defFireTint = (alpha: number) => {
      if (alpha <= 0.01) return { pTintColor: null, eTintColor: null };
      const c = `rgba(249, 115, 22, ${alpha.toFixed(2)})`;
      return {
        pTintColor: !isP ? c : null,
        eTintColor: isP ? c : null,
      };
    };

    if (!isHit) {
      return [
        {
          ...baseFrame,
          delay: 80,
          moveStep: 0.18,
          ...cOff(0, -8),
          ...cScale(0.92, 1.12),
        },
        {
          ...baseFrame,
          delay: 100,
          moveStep: 1.0,
          showEffect: false,
          showBehindEffect: false,
          ...cOff(0, 0),
        },
      ];
    }

    const frames: BattleFrame[] = [];
    const totalFrames = 25;

    for (let i = 0; i < totalFrames; i++) {
      const step = Number((i / (totalFrames - 1)).toFixed(3));
      const isHit1 = i === 14;
      const isHit2 = i === 18;
      const afterImpact = i >= 14;

      if (step < 0.42) {
        // Phase 1: 시전자 웅크림 후 마그마 대분출 포효
        const p = step / 0.42;
        const sx = p < 0.25 ? 1.16 : 0.90 + Math.sin(p * Math.PI * 3) * 0.06;
        const sy = p < 0.25 ? 0.84 : 1.14 - Math.sin(p * Math.PI * 3) * 0.06;
        const dy = p < 0.25 ? 6 : -8;

        frames.push({
          ...baseFrame,
          delay: 44,
          moveStep: step,
          ...cOff(0, dy),
          ...cScale(sx, sy),
          phaseId: `eruption-launch-${i + 1}`,
          phaseName: `#1. 화산 마그마 기둥 대분출`,
        });
      } else {
        // Phase 2: 화산탄 유성우 대폭격 & 피격자 화염 진동
        const p = (step - 0.42) / 0.58;
        const shakeAmp = afterImpact ? (1 - Math.max(0, (step - 0.58) / 0.42)) * 13 : 0;
        const shakeX = (i % 2 === 0 ? 1 : -1) * shakeAmp;
        const shakeY = (i % 2 === 0 ? -0.6 : 0.6) * shakeAmp;
        const tintAlpha = afterImpact ? Math.sin(((step - 0.54) / 0.46) * Math.PI) * 0.65 : 0;

        frames.push({
          ...baseFrame,
          enemyHp: afterImpact ? enemyHp : startEnemyHp,
          playerHp: afterImpact ? playerHp : startPlayerHp,
          delay: 44,
          moveStep: step,
          hitFlash: isHit1 || isHit2,
          ...defOff(shakeX, shakeY),
          ...defScale(isHit1 || isHit2 ? 1.15 : 1.0, isHit1 || isHit2 ? 0.86 : 1.0),
          ...defFireTint(tintAlpha),
          phaseId: `eruption-bombard-${i + 1}`,
          phaseName: `#2. 화산탄 유성우 폭격 및 용암 폭발`,
        });
      }
    }

    frames.push({
      ...baseFrame,
      enemyHp,
      playerHp,
      delay: 60,
      moveStep: 1.0,
      showEffect: false,
      showBehindEffect: false,
      ...cOff(0, 0),
      ...defOff(0, 0),
      phaseId: "eruption-finish",
      phaseName: "#3. 분화 완료",
    });

    return frames;
  },
};
