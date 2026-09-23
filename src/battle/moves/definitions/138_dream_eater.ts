// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawDreamEaterEffect } from "../../../renderers/moves/gen1/move137_140.js";

/**
 * 138: 꿈먹기 (Dream Eater) - 에스퍼 타입 특수 공격기 (위력 100, 피해의 50% HP 흡수 회복)
 *
 * 연출 시퀀스:
 * 1. 몽환적 딥 인디고 전장 암전 진입
 * 2. 잠들어 있는 대상 몸체에서 유백색-연보라빛 꿈의 영혼 구체(Dream Spirit Orbs) 추출
 * 3. 꿈의 정기가 우아한 S자 나선 궤적으로 날아가며 시전자 몸체로 흡수 (대상 악몽 왜곡 타격)
 * 4. 시전자 전신에 꿈 에너지가 스며들며 찬란한 에메랄드 치유 광채 & HP 흡수 회복
 * 5. 치유 십자별 상승 & 몽환 암전 페이드아웃 복귀
 */
export const dreamEaterMove: BattleMoveAnimation = {
  num: 138,
  key: "dream-eater",
  nameKo: "꿈먹기",
  nameEn: "Dream Eater",
  type: "psychic",
  category: "special",
  camera: { type: "target", zoom: 1.25 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (frame.showEffect) {
      drawDreamEaterEffect(targetCtx, frame, drawCtx);
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

    // 피격자 오프셋
    const tOff = (x: number, y: number) =>
      isP
        ? (isHit ? { eOffset: { x, y } } : { eOffset: { x: 0, y: 0 } })
        : (isHit ? { pOffset: { x: -x, y: -y } } : { pOffset: { x: 0, y: 0 } });

    return [
      // 1. 몽환적 암전 진입 & 상대 잠든 기운 포커스
      {
        ...baseFrame,
        delay: 100,
        ...cOff(-2, 1),
        ...tOff(0, 3), // 잠든 상태 침강
        showEffect: true,
        moveStep: 1,
        phaseId: "dream-intro",
        phaseName: "1. 몽환적 암전 진입 & 꿈 추출 전조",
      },
      // 2. 대상 몸체에서 꿈 영혼 구체 추출
      {
        ...baseFrame,
        delay: 130,
        ...cOff(-4, 2),
        ...tOff(0, 4),
        showEffect: true,
        moveStep: 2,
        phaseId: "dream-extract",
        phaseName: "2. 대상 몸체에서 꿈의 정기 추출",
      },
      // 3. 꿈 구체 나선 비행 & 대상 악몽 타격 (피격 플래시 & 넉백)
      {
        ...baseFrame,
        delay: 140,
        ...cOff(-2, 0),
        ...tOff(10, -4),
        showEffect: true,
        hitFlash: isHit,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpAfter ?? playerHp) : playerHp,
        moveStep: 3,
        phaseId: "dream-drain-fly",
        phaseName: "3. 꿈의 정기 흡수 비행 & 악몽 타격",
      },
      // 4. 시전자 꿈 에너지 흡수 & 에메랄드 치유 광채
      {
        ...baseFrame,
        delay: 140,
        ...cOff(2, -4), // 치유의 기쁨 도약
        ...tOff(2, 0),
        showEffect: true,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpAfter ?? playerHp) : playerHp,
        moveStep: 4,
        phaseId: "dream-heal-glow",
        phaseName: "4. 시전자 꿈 에너지 융합 & 치유 광채",
      },
      // 5. 치유 십자별 상승 & 페이드아웃
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, 0),
        ...tOff(0, 0),
        showEffect: true,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpAfter ?? playerHp) : playerHp,
        moveStep: 5,
        phaseId: "dream-fade",
        phaseName: "5. 치유 십자별 비상 & 암전 페이드아웃",
      },
      // 6. 정위치 복귀
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...tOff(0, 0),
        showEffect: false,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpAfter ?? playerHp) : playerHp,
        moveStep: 6,
        phaseId: "dream-finish",
        phaseName: "6. 정위치 복귀 완료",
      },
    ];
  },
};
