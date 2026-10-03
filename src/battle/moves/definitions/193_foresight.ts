// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawForesightBehindEffect,
  drawForesightEffect,
} from "../../../renderers/moves/gen1/move193_196.js";

/**
 * 193: 꿰뚫어보기 (Foresight) - 노말 타입 변화 기술
 *
 * 위력: — / 명중: — (필중) / PP: 40 / 접촉 판정: X
 * 설명: 상대 포켓몬의 움직임을 꿰뚫어본다. 고스트타입 포켓몬에게 노말타입이나 격투타입 기술이 맞게 되며 회피율을 무시한다.
 *
 * [유저 지정 연출]:
 * 1. 시전 포켓몬의 좌 ➔ 우 ➔ 좌를 부드럽게 오가며 돋보기 스캔 (Step 1)
 * 2. 시전 포켓몬 중심(몸체)에게로 돋보기가 슥 이동함 (Step 2)
 * 3. 돋보기는 페이드 아웃, 시전 포켓몬은 살짝 흰색으로 페이드 적용 (Step 3 & 4)
 */
export const foresightMove: BattleMoveAnimation = {
  num: 193,
  key: "foresight",
  nameKo: "꿰뚫어보기",
  nameEn: "Foresight",
  type: "normal",
  category: "status",
  camera: {
    type: "self",
    zoom: 1.28,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawForesightBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawForesightEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.0,
      pRot: 0,
      eRot: 0,
      hitFlash: false,
    };

    // 시전자 전용 오프셋 헬퍼 (수비자는 절대 {0,0} 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    return [
      // ======================================================================
      // 1. Step 1: [시전 포켓몬의 좌 ➔ 우 ➔ 좌 부드러운 스캔]
      // ======================================================================
      {
        ...baseFrame,
        delay: 95,
        ...cOff(-1, 1),
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.15,
        phaseId: "foresight-scan-left-1",
        phaseName: "1. 시전 포켓몬 좌측 돋보기 출현",
      },
      {
        ...baseFrame,
        delay: 100,
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.50,
        phaseId: "foresight-scan-right",
        phaseName: "2. 시전 포켓몬 우측으로 스캔 이동",
      },
      {
        ...baseFrame,
        delay: 95,
        ...cOff(-1, 1),
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.85,
        phaseId: "foresight-scan-left-2",
        phaseName: "3. 시전 포켓몬 좌측으로 반전 복귀 스캔",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(-1, 0),
        showEffect: true,
        moveStep: 1,
        effectProgress: 1.00,
        phaseId: "foresight-scan-finish",
        phaseName: "4. 좌측 도달 및 스캔 완료",
      },

      // ======================================================================
      // 2. Step 2: [좌측에서 시전 포켓몬 중심(몸체)에게로 돋보기가 슥 이동]
      // ======================================================================
      {
        ...baseFrame,
        delay: 85,
        ...cOff(-1, 0),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.35,
        phaseId: "foresight-center-move-1",
        phaseName: "5. 돋보기 시전자 중심 향해 이동 시작",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.75,
        phaseId: "foresight-center-move-2",
        phaseName: "6. 돋보기 시전자 몸체 접근",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 2,
        effectProgress: 1.00,
        phaseId: "foresight-center-move-3",
        phaseName: "7. 돋보기 시전자 정중앙 안착",
      },

      // ======================================================================
      // 3. Step 3: [돋보기 페이드 아웃 & 시전 포켓몬 살짝 흰색 페이드 적용]
      // ======================================================================
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        pScale: isP ? { x: 1.04, y: 0.96 } : undefined,
        eScale: !isP ? { x: 1.04, y: 0.96 } : undefined,
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.30,
        phaseId: "foresight-fade-start",
        phaseName: "8. 돋보기 페이드아웃 & 시전자 백색 페이드인",
      },
      {
        ...baseFrame,
        delay: 100,
        ...cOff(0, 0),
        pScale: isP ? { x: 1.06, y: 0.94 } : undefined,
        eScale: !isP ? { x: 1.06, y: 0.94 } : undefined,
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.65,
        phaseId: "foresight-fade-peak",
        phaseName: "9. 시전 포켓몬 은은한 백색 페이드 피크",
      },
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 3,
        effectProgress: 1.00,
        phaseId: "foresight-fade-out",
        phaseName: "10. 돋보기 소멸 & 백색 페이드 서서히 소산",
      },

      // ======================================================================
      // 4. Step 4: [완료 및 안정 복귀]
      // ======================================================================
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.50,
        phaseId: "foresight-settle",
        phaseName: "11. 꿰뚫어보기 완료 및 시전자 안정 복귀",
      },
    ];
  },
};
