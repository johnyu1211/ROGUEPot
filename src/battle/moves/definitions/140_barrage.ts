// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawBarrageEffect } from "../../../renderers/moves/gen1/move137_140.js";

/**
 * 140: 구슬던지기 (Barrage) - 노말 타입 2~5회 연속 물리 공격기 (위력 15)
 *
 * 연출 시퀀스:
 * 1. 둥근 3D 입체 구슬을 차례대로 4연속 포물선 아크 투척
 * 2. 1~3타: '탁! 탁! 탁!' 경쾌한 2D 타격 링 및 구슬 파편 비산
 * 3. 4타 피니시: 강력한 스쿼시 충돌과 함께 구슬 산산조각 파쇄 & 넉백 피니시
 */
export const barrageMove: BattleMoveAnimation = {
  num: 140,
  key: "barrage",
  nameKo: "구슬던지기",
  nameEn: "Barrage",
  type: "normal",
  category: "physical",
  camera: { type: "target", zoom: 1.25 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (frame.showEffect) {
      drawBarrageEffect(targetCtx, frame, drawCtx);
    }
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

    // 시전자 오프셋
    const cOff = (x: number, y: number) =>
      isP ? { pOffset: { x, y } } : { eOffset: { x: -x, y: -y } };

    // 대상 피격 넉백
    const tOff = (x: number, y: number) =>
      isP
        ? (isHit ? { eOffset: { x, y } } : { eOffset: { x: 0, y: 0 } })
        : (isHit ? { pOffset: { x: -x, y: -y } } : { pOffset: { x: 0, y: 0 } });

    return [
      // 1. 1발째 투척 시작
      {
        ...baseFrame,
        delay: 75,
        ...cOff(6, -2),
        ...tOff(0, 0),
        showEffect: true,
        moveStep: 1,
        phaseId: "barrage-1-throw",
        phaseName: "1. 1발째 구슬 투척",
      },
      // 2. 1발째 포물선 비행
      {
        ...baseFrame,
        delay: 75,
        ...cOff(8, -3),
        ...tOff(0, 0),
        showEffect: true,
        moveStep: 2,
        phaseId: "barrage-1-fly",
        phaseName: "2. 1발째 구슬 비행",
      },

      // 3. 1발째 타격 & 2발째 투척
      {
        ...baseFrame,
        delay: 85,
        ...cOff(12, -4),
        ...tOff(4, -1),
        showEffect: true,
        moveStep: 3,
        phaseId: "barrage-2-throw",
        phaseName: "3. 1발째 타격 & 2발째 투척",
      },
      // 4. 2발째 포물선 비행
      {
        ...baseFrame,
        delay: 75,
        ...cOff(14, -5),
        ...tOff(0, 0),
        showEffect: true,
        moveStep: 4,
        phaseId: "barrage-2-fly",
        phaseName: "4. 2발째 구슬 비행",
      },

      // 5. 2발째 타격 & 3발째 투척
      {
        ...baseFrame,
        delay: 85,
        ...cOff(16, -6),
        ...tOff(-4, 2),
        showEffect: true,
        moveStep: 5,
        phaseId: "barrage-3-throw",
        phaseName: "5. 2발째 타격 & 3발째 투척",
      },
      // 6. 3발째 포물선 비행
      {
        ...baseFrame,
        delay: 75,
        ...cOff(18, -6),
        ...tOff(0, 0),
        showEffect: true,
        moveStep: 6,
        phaseId: "barrage-3-fly",
        phaseName: "6. 3발째 구슬 비행",
      },

      // 7. 3발째 타격 & 4발째 피니시 투척
      {
        ...baseFrame,
        delay: 85,
        ...cOff(20, -7),
        ...tOff(5, -2),
        showEffect: true,
        moveStep: 7,
        phaseId: "barrage-4-throw",
        phaseName: "7. 3발째 타격 & 4발째 피니시 투척",
      },
      // 8. 4발째 피니시 고속 포물선 쇄도
      {
        ...baseFrame,
        delay: 80,
        ...cOff(18, -6),
        ...tOff(0, 0),
        showEffect: true,
        moveStep: 8,
        phaseId: "barrage-4-fly",
        phaseName: "8. 4발째 피니시 구슬 비행",
      },

      // 9. 4발째 피니시 파쇄 강타 (피격 플래시 & 넉백)
      {
        ...baseFrame,
        delay: 130,
        ...cOff(12, -4),
        ...tOff(14, -6),
        showEffect: true,
        hitFlash: isHit,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpAfter ?? playerHp) : playerHp,
        moveStep: 9,
        phaseId: "barrage-finish-hit",
        phaseName: "9. 4발째 피니시 파쇄 대격돌 (4연타 완료)",
      },

      // 10. 반동 복귀 완료
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...tOff(0, 0),
        showEffect: false,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpAfter ?? playerHp) : playerHp,
        moveStep: 10,
        phaseId: "barrage-finish",
        phaseName: "10. 정위치 복귀 완료",
      },
    ];
  },
};
