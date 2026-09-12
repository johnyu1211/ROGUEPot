// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawLowKickEffect } from "../../../renderers/moves/gen1/move065_068.js";

/**
 * 067: 안다리걸기 (Low Kick)
 * 
 * 5세대 공식 배틀 연출 기반 하단 태클/스위프 물리 격투기:
 * 1. [하단 자세 준비 (80ms)]: 시전 포켓몬이 하단 무게중심을 낮추며 스위프 장전
 * 2. [하단 슬라이딩 접근 & 발바닥 출현 (70ms)]: 바닥을 스치며 접근, 적 스프라이트 아래 좌측에 검정 발바닥 아이콘 출현
 * 3. [좌에서 우로 고속 쇄도 스위프 (65ms)]: 검정 발바닥이 아래쪽 좌에서 우로 빠르게 쇄도하며, 뒤편에 끝이 투명한 격투 주황 잔상 궤적 형성
 * 4. [탁! 발목 타격 & 걸어 넘어뜨리기 (110ms)]: 적 발목을 강타("탁!")하며 적 포켓몬이 비틀거리며 걸려 넘어짐(회전/비틀림 스쿼시), 격투 스타버스트 & 흙먼지 작렬
 * 5. [스위프 완료 & 잔상 감쇄 (85ms)]: 발바닥이 우측으로 빠져나가며 잔상이 부드럽게 페이드아웃, 적 포켓몬 중심 회복
 * 6. [기립 및 기본 자세 복귀 (80ms)]: 시전자 제자리 복귀 및 스탠스 정돈
 */
export const lowKickMove: BattleMoveAnimation = {
  num: 67,
  key: "low-kick",
  nameKo: "안다리걸기",
  nameEn: "Low Kick",
  type: "fighting",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  drawEffect: drawLowKickEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    return [
      // 1. [하단 자세 준비]: 시전자가 몸을 낮추고 무게중심을 하단으로 이동 (80ms)
      {
        ...baseFrame,
        delay: 80,
        pOffset: isP ? { x: -4, y: 4 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 4, y: -4 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.10, y: 0.90 } : undefined,
        eScale: !isP ? { x: 1.10, y: 0.90 } : undefined,
        showEffect: false,
        moveStep: 1,
        phaseId: "low-kick-windup",
        phaseName: "1. 하단 자세 준비 (80ms)",
      },
      // 2. [하단 슬라이딩 접근 & 발바닥 출현]: 바닥으로 전진 슬라이딩 및 좌측 발바닥 출현 (70ms)
      {
        ...baseFrame,
        delay: 70,
        pOffset: isP ? { x: 28, y: 7 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -28, y: -7 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.18, y: 0.84 } : undefined,
        eScale: !isP ? { x: 1.18, y: 0.84 } : undefined,
        showEffect: true,
        moveStep: 2,
        sweepProgress: 0.20,
        footAlpha: 0.90,
        phaseId: "low-kick-slide",
        phaseName: "2. 하단 슬라이딩 & 발바닥 출현 (70ms)",
      },
      // 3. [좌에서 우로 고속 쇄도 스위프]: 검정 발바닥 쇄도 & 격투 잔상 궤적 형성 (65ms)
      {
        ...baseFrame,
        delay: 65,
        pOffset: isP ? { x: 44, y: 9 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -44, y: -9 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.22, y: 0.80 } : undefined,
        eScale: !isP ? { x: 1.22, y: 0.80 } : undefined,
        showEffect: true,
        moveStep: 3,
        sweepProgress: 0.58,
        footAlpha: 1.0,
        phaseId: "low-kick-sweep",
        phaseName: "3. 좌에서 우로 고속 스위프 (65ms)",
      },
      // 4. [탁! 발목 타격 & 걸어 넘어뜨리기]: 적 발목 직격 강타 & 넘어짐 반응 (110ms)
      {
        ...baseFrame,
        delay: 110,
        pOffset: isP ? { x: 50, y: 8 } : (isHit ? { x: -18, y: 5 } : { x: 0, y: 0 }),
        eOffset: isP ? (isHit ? { x: 18, y: -5 } : { x: 0, y: 0 }) : { x: -50, y: -8 },
        pRot: !isP ? (isHit ? -0.28 : undefined) : undefined,
        eRot: isP ? (isHit ? 0.28 : undefined) : undefined,
        pScale: !isP ? (isHit ? { x: 1.18, y: 0.85 } : undefined) : undefined,
        eScale: isP ? (isHit ? { x: 1.18, y: 0.85 } : undefined) : undefined,
        hitFlash: isHit,
        showEffect: true,
        moveStep: 4,
        sweepProgress: 0.88,
        footAlpha: 1.0,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "low-kick-impact",
        phaseName: "4. 탁! 발목 타격 & 걸어 넘어뜨리기 (110ms)",
      },
      // 5. [스위프 완료 & 잔상 감쇄]: 발바닥 통과 및 잔상 부드럽게 감쇄 (85ms)
      {
        ...baseFrame,
        delay: 85,
        pOffset: isP ? { x: 26, y: 4 } : (isHit ? { x: -10, y: 2 } : { x: 0, y: 0 }),
        eOffset: isP ? (isHit ? { x: 10, y: -2 } : { x: 0, y: 0 }) : { x: -26, y: -4 },
        pRot: !isP ? (isHit ? -0.16 : undefined) : undefined,
        eRot: isP ? (isHit ? 0.16 : undefined) : undefined,
        showEffect: true,
        moveStep: 5,
        sweepProgress: 1.0,
        footAlpha: 0.35,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "low-kick-follow",
        phaseName: "5. 스위프 완료 & 잔상 감쇄 (85ms)",
      },
      // 6. [기립 및 기본 자세 복귀]: 정위치 착지 복귀 및 적 기립 (80ms)
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        moveStep: 6,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "low-kick-recover",
        phaseName: "6. 기립 및 기본 자세 복귀 (80ms)",
      },
    ];
  },
};
