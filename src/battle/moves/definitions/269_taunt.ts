// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawTauntBehindEffect,
  drawTauntEffect,
} from "../../../renderers/moves/gen1/move269_272.js";

/**
 * 💢 269: 도발 (Taunt / ちょうはつ) - 악 타입 변화 기술
 *
 * 위력: — / 명중: 100 / PP: 20 / 대상: 상대 / 접촉: X
 * 설명: 상대를 화나게 한다. 3턴 동안 상대는 공격 기술밖에 쓸 수 없게 된다.
 *
 * [연출 시퀀스]:
 * 1. [Step 1: 시전자 앞으로 까딱까딱 2회 도발 모션] (#1 ~ #6):
 *    - 시전 포켓몬이 상대 쪽(앞쪽)으로 몸을 까딱까딱 두 번 기울이며 도발한다.
 * 2. [Step 2: 대상 포켓몬 분노 폭발 — 뽐내기(207) 피격 연출] (#7 ~ #13):
 *    - 카메라가 상대에게 포커스되며, 상대 포켓몬이 새빨갛게 달아오르고 좌우 진동한다.
 *    - 상대 이마 옆에 만화풍 분노의 핏줄(💢) 마크가 튀어나와 쾅쾅 박동한 뒤 소멸한다.
 */
export const tauntMove: BattleMoveAnimation = {
  num: 269,
  key: "taunt",
  nameKo: "도발",
  nameEn: "Taunt",
  type: "dark",
  category: "status",
  camera: {
    type: "target",
    zoom: 1.25,
    delayUntilStep: 2,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showBehindEffect && !frame.showEffect) return;
    drawTauntBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawTauntEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;
    const dir = isP ? 1 : -1;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      cameraZoom: 1.0,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
    };

    const cOff = (x: number, y: number) =>
      isP ? { pOffset: { x: x * dir, y } } : { eOffset: { x: x * dir, y } };
    const cRot = (rot: number) =>
      isP ? { pRot: rot * dir } : { eRot: rot * dir };
    const tOff = (x: number, y: number) =>
      isP ? { eOffset: { x: x * dir, y } } : { pOffset: { x: x * dir, y } };

    // 뽐내기(207)와 동일한 타겟 붉은 분노 틴트 헬퍼
    const targetRedHelper = (lvl: number) => {
      if (lvl <= 0) return {};
      const color = `rgba(220, 20, 40, ${(lvl * 0.72).toFixed(2)})`;
      return isP ? { eTintColor: color } : { pTintColor: color };
    };

    // ========================================================================
    // [Step 1: 시전 포켓몬 앞으로 까딱까딱 2회 모션]
    // ========================================================================
    const step1Frames: BattleFrame[] = [
      // 1회차 까딱 (앞으로 숙임 -> 최대 기울기 -> 원위치 복귀)
      {
        ...baseFrame,
        phaseId: "taunt-nod-1a",
        phaseName: "#1. 도발 — 앞으로 까딱 1회 (기울임)",
        delay: 65,
        showEffect: false,
        moveStep: 1,
        ...cOff(5, 2),
        ...cRot(0.14),
      },
      {
        ...baseFrame,
        phaseId: "taunt-nod-1b",
        phaseName: "#2. 도발 — 앞으로 까딱 1회 (정점)",
        delay: 75,
        showEffect: false,
        moveStep: 1,
        ...cOff(9, 4),
        ...cRot(0.24),
      },
      {
        ...baseFrame,
        phaseId: "taunt-nod-1c",
        phaseName: "#3. 도발 — 앞으로 까딱 1회 (복귀)",
        delay: 65,
        showEffect: false,
        moveStep: 1,
        ...cOff(0, 0),
        ...cRot(0),
      },
      // 2회차 까딱 (앞으로 숙임 -> 최대 기울기 -> 원위치 복귀)
      {
        ...baseFrame,
        phaseId: "taunt-nod-2a",
        phaseName: "#4. 도발 — 앞으로 까딱 2회 (기울임)",
        delay: 65,
        showEffect: false,
        moveStep: 1,
        ...cOff(5, 2),
        ...cRot(0.14),
      },
      {
        ...baseFrame,
        phaseId: "taunt-nod-2b",
        phaseName: "#5. 도발 — 앞으로 까딱 2회 (정점)",
        delay: 75,
        showEffect: false,
        moveStep: 1,
        ...cOff(9, 4),
        ...cRot(0.24),
      },
      {
        ...baseFrame,
        phaseId: "taunt-nod-2c",
        phaseName: "#6. 도발 — 앞으로 까딱 2회 (복귀)",
        delay: 80,
        showEffect: false,
        moveStep: 1,
        ...cOff(0, 0),
        ...cRot(0),
      },
    ];

    if (!isHit) {
      return [
        ...step1Frames,
        {
          ...baseFrame,
          phaseId: "taunt-miss",
          phaseName: "#7. 도발 실패 (빗나감)",
          delay: 120,
          showEffect: false,
          moveStep: 1,
        },
      ];
    }

    // ========================================================================
    // [Step 2: 대상 포켓몬 분노 폭발 — 뽐내기(207) Step 2 이펙트 동일 적용]
    // ========================================================================
    const step2Frames: BattleFrame[] = [
      {
        ...baseFrame,
        phaseId: "taunt-anger-1",
        phaseName: "#7. 상대 분노 점화 & 핏줄(💢) 팝업!",
        delay: 80,
        showEffect: true,
        moveStep: 2,
        ...targetRedHelper(0.30),
        ...tOff(-2, 0),
        swaggerVein: { scale: 1.45, alpha: 1.0, popProgress: 0.2 },
      },
      {
        ...baseFrame,
        phaseId: "taunt-anger-2",
        phaseName: "#8. 핏줄 정착 & 분노 고조",
        delay: 80,
        showEffect: true,
        moveStep: 2,
        ...targetRedHelper(0.70),
        ...tOff(3, 0),
        swaggerVein: { scale: 1.0, alpha: 1.0, popProgress: 1.0 },
      },
      {
        ...baseFrame,
        phaseId: "taunt-anger-3",
        phaseName: "#9. 분노 절정 — 새빨간 홍조 & 핏줄 1차 박동",
        delay: 90,
        showEffect: true,
        moveStep: 2,
        ...targetRedHelper(1.0),
        ...tOff(-4, 0),
        swaggerVein: { scale: 1.35, alpha: 1.0, popProgress: 1.0 },
      },
      {
        ...baseFrame,
        phaseId: "taunt-anger-4",
        phaseName: "#10. 분노 진동 & 핏줄 2차 박동",
        delay: 90,
        showEffect: true,
        moveStep: 2,
        ...targetRedHelper(0.85),
        ...tOff(3, 0),
        swaggerVein: { scale: 1.15, alpha: 1.0, popProgress: 1.0 },
      },
      {
        ...baseFrame,
        phaseId: "taunt-anger-5",
        phaseName: "#11. 분노 완화 & 핏줄 수축",
        delay: 80,
        showEffect: true,
        moveStep: 2,
        ...targetRedHelper(0.50),
        ...tOff(-2, 0),
        swaggerVein: { scale: 0.90, alpha: 0.65, popProgress: 1.0 },
      },
      {
        ...baseFrame,
        phaseId: "taunt-anger-6",
        phaseName: "#12. 분노 잔상 & 핏줄 소멸",
        delay: 70,
        showEffect: true,
        moveStep: 2,
        ...targetRedHelper(0.20),
        ...tOff(0, 0),
        swaggerVein: { scale: 0.60, alpha: 0.20, popProgress: 1.0 },
      },
      {
        ...baseFrame,
        phaseId: "taunt-end",
        phaseName: "#13. 도발 연출 종료 (원위치 복귀)",
        delay: 60,
        showEffect: false,
        moveStep: 2,
        ...targetRedHelper(0.0),
        ...tOff(0, 0),
      },
    ];

    return [...step1Frames, ...step2Frames];
  },
};

