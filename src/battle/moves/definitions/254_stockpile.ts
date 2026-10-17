// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawStockpileBehindEffect,
  drawStockpileEffect,
} from "../../../renderers/moves/gen1/move253_256.js";

/**
 * 254: 비축하기 (Stockpile / たくわえる) - 노말 타입 변화 기술
 *
 * 위력: — / 명중: — / PP: 20 / 대상: 자신 / 접촉: X
 * 설명: 힘을 비축한다. 최대 3회까지 비축하여 방어와 특수방어를 1랭크씩 올릴 수 있다.
 *
 * [유저 요구사항 100% 반영]:
 * 1. E4D249 타원과 살짝 작은 EA9C63 타원이 시전 포켓몬보다 살짝 떨어진 곳에서 페이드 인으로 나타나서 안으로 들어감
 * 2. 하이라이트 없이 순수한 고유 색상 및 뒤쪽일수록 투명한 잔상 유지
 * 3. 첫 번째 타원이 시전 포켓몬에게 닿자마자:
 *    - 아래로 납작 ➔ 세로로 길어졌다가 ➔ 아래로 납작 ➔ 세로로 길어졌다가 2회 스쿼시&스트레치
 *    - 약간 흰 색깔이 섞여 있는 밝은 노란 색깔(rgba(255, 252, 192, ...))로 물들기 시작 (페이드 인으로 적용)
 */
export const stockpileMove: BattleMoveAnimation = {
  num: 254,
  key: "stockpile",
  nameKo: "비축하기",
  nameEn: "Stockpile",
  type: "normal",
  category: "status",
  camera: {
    type: "self",
    zoom: 1.30,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawStockpileBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawStockpileEffect(targetCtx, frame, drawCtx);
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
      cameraZoom: 1.30,
    };

    const cOff = (x = 0, y = 0) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const cScale = (scaleX: number, scaleY: number) => ({
      pScale: isP ? { x: scaleX, y: scaleY } : undefined,
      eScale: !isP ? { x: scaleX, y: scaleY } : undefined,
    });

    // 약간 흰 색깔이 섞여 있는 밝은 노란 색깔 (#FFFDC0 / rgba(255, 252, 192, alpha))
    const cTint = (alpha: number) => {
      if (alpha <= 0.01) return { pTintColor: null, eTintColor: null };
      const colorStr = `rgba(255, 252, 192, ${alpha.toFixed(2)})`;
      return {
        pTintColor: isP ? colorStr : null,
        eTintColor: !isP ? colorStr : null,
      };
    };

    const frames: BattleFrame[] = [];

    // 모션 스펙: 첫 번째 타원이 닿자마자 납작 ➔ 길어짐 ➔ 납작 ➔ 길어짐 2회 반복 & 노란 틴트 페이드인
    // 프레임별 [prog, scaleX, scaleY, offsetY, tintAlpha, phaseName]
    const FRAME_SPECS: Array<{
      prog: number;
      sx: number;
      sy: number;
      offY: number;
      tint: number;
      phaseId: string;
      phaseName: string;
      delay?: number;
    }> = [
      // [1] 타원 유입 구간 (prog 0.00 ~ 0.28): 사방에서 타원들이 페이드인으로 나타나 쇄도, 아직 닿기 전
      { prog: 0.00, sx: 1.00, sy: 1.00, offY: 0, tint: 0.00, phaseId: "stockpile-orb-spawn-1", phaseName: "사방에서 타원 출현 (0%)" },
      { prog: 0.05, sx: 1.00, sy: 1.00, offY: 0, tint: 0.00, phaseId: "stockpile-orb-spawn-2", phaseName: "사방에서 타원 출현 (5%)" },
      { prog: 0.11, sx: 1.00, sy: 1.00, offY: 0, tint: 0.00, phaseId: "stockpile-orb-approach-1", phaseName: "타원 쇄도 유입 (11%)" },
      { prog: 0.17, sx: 1.00, sy: 1.00, offY: 0, tint: 0.00, phaseId: "stockpile-orb-approach-2", phaseName: "타원 쇄도 유입 (17%)" },
      { prog: 0.23, sx: 1.00, sy: 1.00, offY: 0, tint: 0.00, phaseId: "stockpile-orb-approach-3", phaseName: "타원 쇄도 유입 (23%)" },
      { prog: 0.29, sx: 1.00, sy: 1.00, offY: 0, tint: 0.00, phaseId: "stockpile-orb-approach-4", phaseName: "첫 번째 타원 몸체 근접 (29%)" },

      // [2] 첫 번째 타원이 닿자마자 ➔ 1회차 아래로 납작 (Squash 1) & 노란빛 페이드인 시작
      { prog: 0.34, sx: 1.08, sy: 0.92, offY: 2, tint: 0.12, phaseId: "stockpile-squash1-start", phaseName: "첫 타원 도달 ➔ 아래로 납작 시작 & 노란빛 페이드인" },
      { prog: 0.39, sx: 1.16, sy: 0.84, offY: 4, tint: 0.22, phaseId: "stockpile-squash1-peak", phaseName: "1회차 최대 아래로 납작" },
      { prog: 0.44, sx: 1.08, sy: 0.92, offY: 2, tint: 0.29, phaseId: "stockpile-squash1-rebound", phaseName: "1회차 납작 반동 회복" },

      // [3] 1회차 세로로 길어짐 (Stretch 1) & 노란빛 차오름
      { prog: 0.49, sx: 0.95, sy: 1.06, offY: -2, tint: 0.35, phaseId: "stockpile-stretch1-start", phaseName: "1회차 세로로 길어짐 시작" },
      { prog: 0.54, sx: 0.88, sy: 1.16, offY: -4, tint: 0.40, phaseId: "stockpile-stretch1-peak", phaseName: "1회차 최대 세로로 길어짐" },
      { prog: 0.59, sx: 0.94, sy: 1.08, offY: -2, tint: 0.44, phaseId: "stockpile-stretch1-rebound", phaseName: "1회차 길어짐 반동 회복" },

      // [4] 2회차 아래로 납작 (Squash 2) & 밝은 노란빛 물들임
      { prog: 0.64, sx: 1.06, sy: 0.94, offY: 2, tint: 0.47, phaseId: "stockpile-squash2-start", phaseName: "2회차 아래로 납작 시작" },
      { prog: 0.69, sx: 1.12, sy: 0.88, offY: 3, tint: 0.50, phaseId: "stockpile-squash2-peak", phaseName: "2회차 최대 아래로 납작" },
      { prog: 0.74, sx: 1.05, sy: 0.95, offY: 1, tint: 0.50, phaseId: "stockpile-squash2-rebound", phaseName: "2회차 납작 반동 회복" },

      // [5] 2회차 세로로 길어짐 (Stretch 2)
      { prog: 0.79, sx: 0.96, sy: 1.05, offY: -1, tint: 0.50, phaseId: "stockpile-stretch2-start", phaseName: "2회차 세로로 길어짐 시작" },
      { prog: 0.84, sx: 0.91, sy: 1.11, offY: -3, tint: 0.50, phaseId: "stockpile-stretch2-peak", phaseName: "2회차 최대 세로로 길어짐" },
      { prog: 0.89, sx: 0.96, sy: 1.05, offY: -1, tint: 0.50, phaseId: "stockpile-stretch2-rebound", phaseName: "2회차 길어짐 반동 회복" },

      // [6] 원상태 안정화 및 비축 완료 (밝은 노란빛 물들임 유지)
      { prog: 0.94, sx: 1.00, sy: 1.00, offY: 0, tint: 0.48, phaseId: "stockpile-absorb-finish", phaseName: "타원 전체 흡수 완료 및 원형 복귀" },
      { prog: 1.00, sx: 1.00, sy: 1.00, offY: 0, tint: 0.45, phaseId: "stockpile-absorbed-glow", phaseName: "밝은 노란빛으로 물든 채 비축 완료", delay: 80 },
    ];

    for (const spec of FRAME_SPECS) {
      frames.push({
        ...baseFrame,
        delay: spec.delay ?? 46,
        ...cOff(0, spec.offY),
        ...cScale(spec.sx, spec.sy),
        ...cTint(spec.tint),
        moveStep: 1,
        phaseId: spec.phaseId,
        phaseName: spec.phaseName,
        effectProgress: spec.prog,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // [Step 2: 비축 완료 안착 프레임]
    frames.push({
      ...baseFrame,
      delay: 110,
      ...cOff(0, 0),
      ...cScale(1.0, 1.0),
      ...cTint(0.40),
      showEffect: false,
      showBehindEffect: false,
      moveStep: 2,
      phaseId: "stockpile-complete",
      phaseName: "#2. 힘 비축 완료",
    });

    return frames;
  },
};
