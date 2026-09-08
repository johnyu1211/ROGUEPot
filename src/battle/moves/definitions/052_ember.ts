// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawEmberEffect } from "../../../renderers/moves/gen1/move049_052.js";

/**
 * 052: 불꽃세례 (Ember)
 * 
 * Concept (유저 요구사항 100% 반영):
 * 1. 작은 불 알갱이 3개를 날림 (나란히가 아닌 시차와 높낮이가 다른 비대칭 궤적)
 * 2. 도달했을 때 약한 불꽃이 바닥에 스르륵 왼쪽에서 오른쪽으로 나타나고 사라짐
 * 3. 이때 상대 포켓몬에 붉은색 필터가 살짝 빠르게 적용됨
 */
export const emberMove: BattleMoveAnimation = {
  num: 52,
  key: "ember",
  nameKo: "불꽃세례",
  nameEn: "Ember",
  type: "fire",
  category: "special",
  camera: { type: "target", zoom: 1.25 },
  drawEffect: drawEmberEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    const targetShake = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x, y } : { x: 0, y: 0 },
    });

    const attackerShake = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x, y } : { x: 0, y: 0 },
    });

    return [
      // 1. 불씨 점화 및 발사 준비
      {
        ...baseFrame,
        delay: 75,
        ...attackerShake(3, 1),
        showEffect: true,
        moveStep: 1,
        emberProgress: 0.05,
        phaseId: "ember-charge",
        phaseName: "1. 불씨 점화 및 발사 준비",
      },
      // 2. 선두 1번 불 알갱이 사출 & 2번 불씨 형성
      {
        ...baseFrame,
        delay: 80,
        ...attackerShake(1, -1),
        showEffect: true,
        moveStep: 2,
        emberProgress: 0.22,
        phaseId: "ember-launch-1",
        phaseName: "2. 선두 불 알갱이 사출",
      },
      // 3. 후속 불 알갱이 순차 사출 및 초반 비행 전개
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        moveStep: 3,
        emberProgress: 0.40,
        phaseId: "ember-launch-2",
        phaseName: "3. 후속 불 알갱이 순차 사출",
      },
      // 4. 3개의 불 알갱이 중반 비대칭 비행 (나란히 아님, 높낮이 차이 전개)
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        moveStep: 4,
        emberProgress: 0.58,
        phaseId: "ember-flight-mid",
        phaseName: "4. 3개 불 알갱이 비대칭 비행",
      },
      // 5. 비대칭 궤적 분산 및 타겟 진입 (상단 포물선 & 하단 직선)
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        moveStep: 5,
        emberProgress: 0.76,
        phaseId: "ember-flight-spread",
        phaseName: "5. 비대칭 궤적 분산 및 타겟 진입",
      },
      // 6. 상대 발밑 바닥 육박 및 착탄 직전
      {
        ...baseFrame,
        delay: 75,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        moveStep: 6,
        emberProgress: 0.94,
        phaseId: "ember-approach",
        phaseName: "6. 상대 발밑 바닥 육박",
      },
      // 7. 바닥 착탄 & 좌측 불꽃 점화 시작 (스르륵 전개 시작)
      {
        ...baseFrame,
        delay: 85,
        ...targetShake(2, 0),
        showEffect: true,
        moveStep: 7,
        emberProgress: 1.05,
        sweepProgress: 0.18,
        sweepAlpha: 0.85,
        phaseId: "ember-land",
        phaseName: "7. 바닥 착탄 및 좌측 불꽃 점화 시작",
      },
      // 8. [타격 피크!] 바닥 불꽃 중앙 이동 & 상대 포켓몬 붉은색 필터 ON!
      {
        ...baseFrame,
        delay: 85,
        ...targetShake(-4, 1),
        targetRedTint: isHit,
        hitFlash: isHit,
        showEffect: true,
        moveStep: 8,
        sweepProgress: 0.42,
        sweepAlpha: 1.0,
        phaseId: "ember-hit",
        phaseName: "8. 바닥 불꽃 중앙 이동 및 상대 붉은 필터",
      },
      // 9. 바닥 불꽃 중앙-우측 통과 (붉은 필터 유지)
      {
        ...baseFrame,
        delay: 85,
        ...targetShake(3, 0),
        targetRedTint: isHit,
        showEffect: true,
        moveStep: 9,
        sweepProgress: 0.68,
        sweepAlpha: 1.0,
        phaseId: "ember-sweep-midright",
        phaseName: "9. 바닥 불꽃 중앙-우측 통과",
      },
      // 10. 바닥 불꽃 우측 전개 (필터 OFF 및 서서히 페이드)
      {
        ...baseFrame,
        delay: 80,
        ...targetShake(-1, 0),
        showEffect: true,
        moveStep: 10,
        sweepProgress: 0.92,
        sweepAlpha: 0.75,
        phaseId: "ember-sweep-right",
        phaseName: "10. 바닥 불꽃 우측 전개 및 페이드",
      },
      // 11. 우측 불꽃 스르륵 소멸 & 미세 불씨 잔향
      {
        ...baseFrame,
        delay: 75,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        moveStep: 11,
        sweepProgress: 1.15,
        sweepAlpha: 0.35,
        phaseId: "ember-fade",
        phaseName: "11. 우측 불꽃 스르륵 소멸 및 불씨 잔향",
      },
      // 12. 기술 종료 및 스탠스 원복
      {
        ...baseFrame,
        delay: 60,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        moveStep: 12,
        phaseId: "ember-end",
        phaseName: "12. 기술 종료 및 스탠스 원복",
      },
    ];
  },
};