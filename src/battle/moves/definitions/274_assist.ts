// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawAssistBehindEffect,
  drawAssistEffect,
} from "../../../renderers/moves/gen1/move273_276.js";

function getSubAnim(key: string): BattleMoveAnimation | undefined {
  if (typeof (globalThis as any).__getMoveAnimation === "function") {
    return (globalThis as any).__getMoveAnimation(key);
  }
  return undefined;
}

/**
 * 🐾 274: 조수 (Assist / ねこのて) - 노말 타입 변화 기술
 *
 * 위력: — / 명중: — / PP: 20 / 대상: 자신 / 접촉: X
 * 설명: 서둘러 동료의 도움을 받아 파티 멤버가 기억하고 있는 기술 중 하나를 랜덤으로 쓴다.
 *
 * [연출 시퀀스 - 정통 고양이의 손(ねこのて) 젤리 발바닥 스탬프 난무]:
 * 1. [Step 1: 총총 호출 도약 & 첫 고양이 발바닥 도장]:
 *    - 시전자가 좌우로 바쁘게 총총거리며 통통 도약
 *    - 시전자 주변 허공에 복슬복슬한 크림색 고양이 앞발과 분홍 젤리 육구 스탬프가 팡! 팡! 찍히기 시작
 * 2. [Step 2: 동료 고양이 발바닥 스탬프 릴레이 난무]:
 *    - 상하좌우 사방에서 통통한 고양이 발바닥 도장들이 경쾌한 탄성(오버슈트 스쿼시)으로 연달아 찍힘
 *    - 각 발바닥이 찍힐 때마다 폭신한 만화풍 타격 퍼프 구름과 크림/코랄 스파클 비산
 * 3. [Step 3: 대단원 왕발바닥 도장 & 기술 발동 태세]:
 *    - 머리 위 정중앙에 큼직한 피날레 발바닥 스탬프가 찍히며 모든 발바닥이 반짝이고 사르르 페이드아웃
 *    - 추첨된 동료 기술(copiedMoveKey)이 지정된 경우 해당 기술 애니메이션으로 자연스럽게 연계
 */
export const assistMove: BattleMoveAnimation = {
  num: 274,
  key: "assist",
  nameKo: "조수",
  nameEn: "Assist",
  type: "normal",
  category: "status",
  camera: {
    type: "self",
    zoom: 1.30,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showBehindEffect && !frame.showEffect) return;
    if (frame.isMetronomeSubmove) {
      const subKey = (frame.copiedMoveKey || "tackle").toLowerCase().replace(/[\s_]+/g, "-");
      const subAnim = getSubAnim(subKey);
      if (subAnim?.drawBehindEffect) {
        subAnim.drawBehindEffect(targetCtx, frame, drawCtx);
      }
      return;
    }
    drawAssistBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    if (frame.isMetronomeSubmove) {
      const subKey = (frame.copiedMoveKey || "tackle").toLowerCase().replace(/[\s_]+/g, "-");
      const subAnim = getSubAnim(subKey);
      if (subAnim?.drawEffect) {
        subAnim.drawEffect(targetCtx, frame, drawCtx);
      }
      return;
    }
    drawAssistEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      cameraZoom: 1.30,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
    };

    // 시전자 변형 헬퍼
    const cTransform = (x = 0, y = 0, scaleX = 1.0, scaleY = 1.0, rot = 0) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
      pScale: isP && (scaleX !== 1.0 || scaleY !== 1.0) ? { x: scaleX, y: scaleY } : undefined,
      eScale: !isP && (scaleX !== 1.0 || scaleY !== 1.0) ? { x: scaleX, y: scaleY } : undefined,
      pRot: isP && rot !== 0 ? rot : undefined,
      eRot: !isP && rot !== 0 ? -rot : undefined,
    });

    const frames: BattleFrame[] = [];

    // ========================================================================
    // [Step 1: 총총 호출 도약 & 첫 고양이 발바닥 도장] (9프레임, 42ms)
    // ========================================================================
    const step1Count = 9;
    for (let i = 0; i < step1Count; i++) {
      const prog = i / (step1Count - 1);
      // 좌우로 바쁘게 총총거리며 통통 2회 도약
      const hop = Math.abs(Math.sin(prog * Math.PI * 2));
      const sway = Math.sin(prog * Math.PI * 2) * 5;
      const dy = -hop * 6;
      const sx = 1.0 - hop * 0.06 + (1.0 - hop) * 0.04;
      const sy = 1.0 + hop * 0.08 - (1.0 - hop) * 0.04;
      const rot = Math.sin(prog * Math.PI * 2) * 0.07;

      frames.push({
        ...baseFrame,
        delay: 42,
        ...cTransform(sway, dy, sx, sy, rot),
        moveStep: 1,
        effectProgress: prog,
        phaseId: `assist-calling-${i + 1}`,
        phaseName: `#1. 고양이 발바닥 호출 도약 (${i + 1}/${step1Count})`,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // ========================================================================
    // [Step 2: 동료 고양이 발바닥 스탬프 릴레이 난무] (10프레임, 40ms)
    // ========================================================================
    const step2Count = 10;
    for (let i = 0; i < step2Count; i++) {
      const prog = i / (step2Count - 1);
      // 사방에서 발바닥 도장이 팡팡 찍히는 리듬에 맞춰 신나게 바운스
      const bounce = Math.sin(prog * Math.PI * 3);
      const dx = Math.cos(prog * Math.PI * 2) * 4;
      const dy = -Math.abs(bounce) * 4 + 2;
      const sx = 1.0 + 0.06 * Math.cos(prog * Math.PI * 3);
      const sy = 1.0 - 0.06 * Math.cos(prog * Math.PI * 3);
      const rot = bounce * 0.05;

      frames.push({
        ...baseFrame,
        delay: 40,
        ...cTransform(dx, dy, sx, sy, rot),
        moveStep: 2,
        effectProgress: prog,
        phaseId: `assist-gathering-${i + 1}`,
        phaseName: `#2. 핑크 젤리 발바닥 스탬프 난무 (${i + 1}/${step2Count})`,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // ========================================================================
    // [Step 3: 대단원 왕발바닥 도장 & 기술 발동 태세] (8프레임, 45ms)
    // ========================================================================
    const step3Count = 8;
    for (let i = 0; i < step3Count; i++) {
      const prog = i / (step3Count - 1);
      // 피날레 발바닥이 찍히며 자신만만하게 솟구쳤다가 정자세 안착
      let dy = 0;
      let sx = 1.0;
      let sy = 1.0;
      if (prog < 0.4) {
        const u = prog / 0.4;
        dy = -6 * u;
        sx = 0.94 + 0.16 * u;
        sy = 1.06 - 0.12 * u;
      } else {
        const u = (prog - 0.4) / 0.6;
        dy = -6 * (1.0 - u);
        sx = 1.10 - 0.10 * u;
        sy = 0.94 + 0.06 * u;
      }

      frames.push({
        ...baseFrame,
        delay: 45,
        ...cTransform(0, dy, sx, sy, 0),
        moveStep: 3,
        effectProgress: prog,
        phaseId: `assist-burst-${i + 1}`,
        phaseName: `#3. 피날레 발바닥 도장 & 준비 완료 (${i + 1}/${step3Count})`,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // 연계 기술 (Submove) 확인 - copiedMoveKey 지정 시 해당 기술 애니메이션 연계
    const rawSubKey = (a?.copiedMoveKey || (a as any)?.subMoveKey || "").toLowerCase().replace(/[\s_]+/g, "-");
    const isOnlyMode = rawSubKey === "none" || rawSubKey === "only" || rawSubKey === "solo";

    if (isOnlyMode || !rawSubKey) {
      return frames;
    }

    const subAnim = getSubAnim(rawSubKey);
    if (!subAnim) {
      return frames;
    }

    const subAction = {
      ...a,
      moveKey: rawSubKey,
      moveName: subAnim.nameKo || rawSubKey,
    };
    const subCtx: MoveContext = {
      ...ctx,
      action: subAction,
    };

    const rawSubFrames = subAnim.buildFrames(subCtx);
    const taggedSubFrames = rawSubFrames.map((sf, idx) => ({
      ...sf,
      isMetronomeSubmove: true,
      copiedMoveKey: rawSubKey,
      phaseName: `[${subAnim.nameKo}] ${sf.phaseName || `프레임 #${idx + 1}`}`,
    }));

    return [...frames, ...taggedSubFrames];
  },
};
