// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawYawnBehindEffect,
  drawYawnEffect,
} from "../../../renderers/moves/gen1/move281_284.js";

/**
 * 🥱 281: 하품 (Yawn / あくび) - 노말 타입 변화 기술
 *
 * 위력: - / 명중: - (필중급) / PP: 10 / 접촉: X
 * 설명: 큰 하품을 해서 졸음을 유도한다. 다음 턴에 상대가 잠든다.
 *
 * [연출 시퀀스]:
 * 1. [기지개 & 하품 김 방출 (0.00 ~ 0.40)]: 시전자가 세로로 크게 기지개를 켜며 입가에서 뽀얀 하품 김(뭉게 연기 뭉치)을 내뿜음
 * 2. [뭉게 연기 뭉치 두둥실 유영 (0.18 ~ 0.68)]: 카메라가 상대로 전환되며 뭉게 연기 뭉치들이 부드러운 상하 부유 파동으로 두둥실 떠서 상대를 향해 날아감
 * 3. [연기 확산 & 꾸벅꾸벅 졸음 유도 (0.62 ~ 1.00)]: 연기 뭉치가 상대에게 닿아 김처럼 스르륵 피어올라 흩어지며 상대가 꾸벅꾸벅 졸기 시작함
 */
export const yawnMove: BattleMoveAnimation = {
  num: 281,
  key: "yawn",
  nameKo: "하품",
  nameEn: "Yawn",
  type: "normal",
  category: "status",
  camera: {
    type: "caster_to_target",
    zoom: 1.32,
    delayUntilStep: 0.40,
    inlineGlideInFrames: 3,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showBehindEffect && !frame.showEffect) return;
    drawYawnBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawYawnEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      showEffect: true,
      showBehindEffect: true,
    };

    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const cScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    const defOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const defScale = (x: number, y: number, rot: number = 0) => ({
      pScale: !isP ? { x, y } : undefined,
      eScale: isP ? { x, y } : undefined,
      pRot: !isP && rot !== 0 ? rot : undefined,
      eRot: isP && rot !== 0 ? -rot : undefined,
    });

    if (!isHit) {
      return [
        {
          ...baseFrame,
          delay: 90,
          moveStep: 0.15,
          ...cOff(0, -6),
          ...cScale(0.94, 1.10),
        },
        {
          ...baseFrame,
          delay: 110,
          moveStep: 1.0,
          showEffect: false,
          showBehindEffect: false,
          ...cOff(0, 0),
        },
      ];
    }

    const frames: BattleFrame[] = [];
    const totalFrames = 24;

    for (let i = 0; i < totalFrames; i++) {
      const step = Number((i / (totalFrames - 1)).toFixed(3));

      if (step < 0.40) {
        // Phase 1: 시전자가 크게 기지개를 켜며 하품 김(뭉게 연기 뭉치)을 후~ 내뿜음
        const p = step / 0.40;
        const stretch = Math.sin(p * Math.PI);
        const dy = -stretch * 8;
        const sx = 1.0 - stretch * 0.08;
        const sy = 1.0 + stretch * 0.14;
        frames.push({
          ...baseFrame,
          delay: 48,
          moveStep: step,
          ...cOff(0, dy),
          ...cScale(sx, sy),
          phaseId: `yawn-exhale-${i + 1}`,
          phaseName: `#1. 하품 기지개 및 뭉게 연기 방출`,
        });
      } else if (step < 0.62) {
        // Phase 2: 뭉게 연기 뭉치가 두둥실 상대를 향해 유영
        frames.push({
          ...baseFrame,
          delay: 46,
          moveStep: step,
          ...cOff(0, 0),
          phaseId: `yawn-float-${i + 1}`,
          phaseName: `#2. 뭉게 연기 뭉치 두둥실 이동`,
        });
      } else {
        // Phase 3: 연기 뭉치가 상대에게 스며들며 상대가 꾸벅꾸벅 2회 졸음
        const p = (step - 0.62) / 0.38;
        const nod = Math.abs(Math.sin(p * Math.PI * 2));
        const dy = nod * 7 * (1 - p * 0.25);
        const sx = 1.0 + nod * 0.08 * (1 - p * 0.3);
        const sy = 1.0 - nod * 0.10 * (1 - p * 0.3);
        const rot = Math.sin(p * Math.PI * 2) * 0.08 * (1 - p * 0.3);

        frames.push({
          ...baseFrame,
          delay: 52,
          moveStep: step,
          ...defOff(0, dy),
          ...defScale(sx, sy, rot),
          phaseId: `yawn-drowsy-${i + 1}`,
          phaseName: `#3. 연기 확산 & 꾸벅꾸벅 졸음 유도`,
        });
      }
    }

    // 마지막 안정화 프레임 (명시적 moveStep: 1.0 유지!)
    frames.push({
      ...baseFrame,
      delay: 60,
      moveStep: 1.0,
      showEffect: false,
      showBehindEffect: false,
      ...cOff(0, 0),
      ...defOff(0, 0),
      phaseId: "yawn-finish",
      phaseName: "#4. 하품 완료",
    });

    return frames;
  },
};
