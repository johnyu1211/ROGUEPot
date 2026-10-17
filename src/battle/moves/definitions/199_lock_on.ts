// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawLockOnBehindEffect,
  drawLockOnEffect,
} from "../../../renderers/moves/gen1/move197_200.js";

/**
 * 199: 록온 (Lock-On) - 노말 타입 변화 기술
 *
 * 위력: — / 명중: — (필중) / PP: 5 / 접촉 판정: X
 * 설명: 조준을 잘 맞춰 다음 공격이 반드시 상대에게 명중하도록 한다.
 *
 * [유저 지정 연출]:
 * - 조준경 전체 흰색 & 움직일 때 하늘색 투명해지는 잔상을 남김
 * - 꿰뚫어보기랑 동일한 움직임이나 대상은 상대
 * 1. 대상 포켓몬 좌측 순백 조준경 출현 & 좌 ➔ 우 ➔ 좌 부드럽게 스캔 (하늘색 투명 잔상 방출) (Step 1)
 * 2. 대상 포켓몬 좌측에서 중심(몸체)에게로 조준경이 슥 이동함 (하늘색 투명 잔상 방출 ➔ 정중앙 스냅) (Step 2)
 * 3. 조준경 페이드아웃 & 대상 포켓몬 살짝 백색/하늘색 록온 페이드 적용 (Step 3 & 4)
 */
export const lockOnMove: BattleMoveAnimation = {
  num: 199,
  key: "lock-on",
  nameKo: "록온",
  nameEn: "Lock-On",
  type: "normal",
  category: "status",
  camera: {
    type: "target",
    zoom: 1.28,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawLockOnBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawLockOnEffect(targetCtx, frame, drawCtx);
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

    // 시전자 오프셋 헬퍼
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 수비자(피격 대상) 스케일 헬퍼 (록온 확정 시 살짝 강조 펄스)
    const tScale = (x: number, y: number) => ({
      eScale: isP ? { x, y } : undefined,
      pScale: !isP ? { x, y } : undefined,
    });

    return [
      // ======================================================================
      // 1. Step 1: [대상 포켓몬의 좌 ➔ 우 ➔ 좌 부드러운 스캔]
      // ======================================================================
      {
        ...baseFrame,
        delay: 95,
        ...cOff(-1, 1),
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.15,
        phaseId: "lock-on-scan-left-1",
        phaseName: "1. 대상 포켓몬 좌측 조준경 출현",
      },
      {
        ...baseFrame,
        delay: 100,
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.50,
        phaseId: "lock-on-scan-right",
        phaseName: "2. 대상 포켓몬 우측으로 스캔 이동",
      },
      {
        ...baseFrame,
        delay: 95,
        ...cOff(-1, 1),
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.85,
        phaseId: "lock-on-scan-left-2",
        phaseName: "3. 대상 포켓몬 좌측으로 반전 복귀 스캔",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(-1, 0),
        showEffect: true,
        moveStep: 1,
        effectProgress: 1.00,
        phaseId: "lock-on-scan-finish",
        phaseName: "4. 좌측 도달 및 스캔 완료",
      },

      // ======================================================================
      // 2. Step 2: [좌측에서 대상 포켓몬 중심(몸체)에게로 조준경이 슥 이동]
      // ======================================================================
      {
        ...baseFrame,
        delay: 85,
        ...cOff(-1, 0),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.35,
        phaseId: "lock-on-center-move-1",
        phaseName: "5. 조준경 대상 중심 향해 이동 시작",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.75,
        phaseId: "lock-on-center-move-2",
        phaseName: "6. 조준경 대상 몸체 접근",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 2,
        effectProgress: 1.00,
        phaseId: "lock-on-center-move-3",
        phaseName: "7. 조준경 대상 정중앙 안착 (LOCK-ON)",
      },

      // ======================================================================
      // 3. Step 3: [조준경 페이드 아웃 & 대상 포켓몬 살짝 붉은/백색 페이드 적용]
      // ======================================================================
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        ...tScale(1.04, 0.96),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.30,
        phaseId: "lock-on-fade-start",
        phaseName: "8. 조준경 페이드아웃 & 대상 록온 페이드인",
      },
      {
        ...baseFrame,
        delay: 100,
        ...cOff(0, 0),
        ...tScale(1.06, 0.94),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.65,
        phaseId: "lock-on-fade-peak",
        phaseName: "9. 대상 포켓몬 록온 각인 피크",
      },
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 3,
        effectProgress: 1.00,
        phaseId: "lock-on-fade-out",
        phaseName: "10. 조준경 소멸 & 록온 페이드 서서히 소산",
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
        phaseId: "lock-on-settle",
        phaseName: "11. 록온 완료 및 안정 복귀",
      },
    ];
  },
};
