// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawRockThrowEffect } from "../../../renderers/moves/gen1/move085_088.js";

/**
 * 088: 돌떨구기 (Rock Throw) - 바위 타입 물리 비접촉기
 *
 * 연출:
 * - 시전자 발밑 지면 균열 & 다각형 각진 바위 3개 융기 및 공중 부유
 * - 바위들이 포물선 궤적을 그리며 고속 회전 투척 & 흙먼지 궤적
 * - 표적 정면 대충돌 직격 (1프레임 히트 플래시 + 스타버스트 임팩트)
 * - 바위 산산조각 분쇄 (10개 파편 사방 비산 & 지면 충격파)
 * - 파편 지면 안착 및 자욱한 흙먼지 연무 확산
 * - 잔여 먼지 페이드아웃 및 복귀
 */
export const rockThrowMove: BattleMoveAnimation = {
  num: 88,
  key: "rock-throw",
  nameKo: "돌떨구기",
  nameEn: "Rock Throw",
  type: "rock",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawRockThrowEffect(targetCtx, attackerPos, targetPos, step, prog);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.35,
      pRot: 0,
      eRot: 0,
    };

    return [
      // #1. 지면 균열 및 바위 융기
      {
        ...baseFrame,
        delay: 100,
        pOffset: isP ? { x: -4, y: 2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 4, y: -2 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.06, y: 0.94 } : undefined,
        eScale: !isP ? { x: 1.06, y: 0.94 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.50,
        phaseId: "rock-throw-rise",
        phaseName: "#1. 바위 융기 및 부유",
      },
      // #2. 포물선 회전 투척 비행
      {
        ...baseFrame,
        delay: 90,
        pOffset: isP ? { x: 5, y: -2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -5, y: 2 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.85,
        phaseId: "rock-throw-hurl",
        phaseName: "#2. 포물선 회전 투척",
      },
      // #3. 표적 정면 대충돌 직격
      {
        ...baseFrame,
        delay: 100,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: -6, y: 3 } : { x: 6, y: -3 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: isHit,
        pWhiteTint: isHit && !isP,
        eWhiteTint: isHit && isP,
        moveStep: 3,
        effectProgress: 0.50,
        phaseId: "rock-throw-smash",
        phaseName: "#3. 표적 정면 대충돌",
      },
      // #4. 바위 산산조각 분쇄
      {
        ...baseFrame,
        delay: 100,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: -3, y: 1 } : { x: 3, y: -1 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 4,
        effectProgress: 0.65,
        phaseId: "rock-throw-shatter",
        phaseName: "#4. 바위 산산조각 분쇄",
      },
      // #5. 파편 안착 및 흙먼지 연무
      {
        ...baseFrame,
        delay: 90,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 5,
        effectProgress: 0.70,
        phaseId: "rock-throw-dust",
        phaseName: "#5. 흙먼지 연무 확산",
      },
      // #6. 잔여 먼지 페이드
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 6,
        effectProgress: 0.60,
        phaseId: "rock-throw-fade",
        phaseName: "#6. 잔여 먼지 페이드",
      },
      // #7. 완료 및 복귀
      {
        ...baseFrame,
        delay: 75,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "rock-throw-complete",
        phaseName: "#7. 완료 및 복귀",
      },
    ];
  },
};
