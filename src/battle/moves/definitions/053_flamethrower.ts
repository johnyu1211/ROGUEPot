// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawFlamethrowerEffect, drawFlamethrowerBehindEffect } from "../../../renderers/moves/gen1/move053_056.js";

/**
 * 053: 화염방사 (Flamethrower)
 * 
 * Concept:
 * 1. 시전자 입/앞쪽에서 초고열 불씨 응축 및 발사 준비
 * 2. 원추형으로 굵어지는 고압 연속 화염 제트 기류(White Hot Core -> Orange -> Crimson) 맹렬한 쇄도
 * 3. 대상 격돌 시 전신을 집어삼키는 거대한 화염 폭풍(Inferno Vortex) 전개 & 상대 붉은 필터(targetRedTint)
 * 4. 화염 스트림 후미 타격 후 고열 불티와 함께 잔향 페이드아웃
 */
export const flamethrowerMove: BattleMoveAnimation = {
  num: 53,
  key: "flamethrower",
  nameKo: "화염방사",
  nameEn: "Flamethrower",
  type: "fire",
  category: "special",
  camera: { type: "target", zoom: 1.30, inlineGlideInFrames: 5 },
  drawBehindEffect: drawFlamethrowerBehindEffect,
  drawEffect: drawFlamethrowerEffect,
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
      // 1. 시전자 후퇴 호흡 및 입가 초고열 불씨 점화
      {
        ...baseFrame,
        delay: 80,
        ...attackerShake(-2, 1),
        showEffect: true,
        moveStep: 1,
        chargeIntensity: 0.5,
        chargeAlpha: 0.85,
        phaseId: "flame-charge-1",
        phaseName: "1. 초고열 불씨 점화 준비",
      },
      // 2. 입가 초고열 백열 플레어 폭발 및 분사 직전
      {
        ...baseFrame,
        delay: 80,
        ...attackerShake(-3, 1),
        showEffect: true,
        moveStep: 2,
        chargeIntensity: 1.0,
        chargeAlpha: 1.0,
        phaseId: "flame-charge-2",
        phaseName: "2. 고열 플레어 폭발 및 분사 시작",
      },
      // 3. 고압 화염 제트 기류 사출 (원추형 팽창 시작, 42% 전진)
      {
        ...baseFrame,
        delay: 75,
        ...attackerShake(-1, 0),
        showEffect: true,
        moveStep: 3,
        streamHead: 0.42,
        streamTail: 0.0,
        streamAlpha: 1.0,
        phaseId: "flame-jet-start",
        phaseName: "3. 고압 화염 제트 기류 사출",
      },
      // 4. 화염 스트림 맹렬한 팽창 및 가속 (84% 전진)
      {
        ...baseFrame,
        delay: 75,
        ...attackerShake(1, 0),
        showEffect: true,
        moveStep: 4,
        streamHead: 0.84,
        streamTail: 0.0,
        streamAlpha: 1.0,
        phaseId: "flame-jet-travel",
        phaseName: "4. 화염 스트림 팽창 및 가속 쇄도",
      },
      // 5. 화염 스트림 대상 정면 격돌 육박
      {
        ...baseFrame,
        delay: 80,
        ...targetShake(2, 1),
        showEffect: true,
        moveStep: 5,
        streamHead: 1.05,
        streamTail: 0.0,
        streamAlpha: 1.0,
        impactIntensity: 0.40,
        impactAlpha: 0.85,
        phaseId: "flame-jet-reach",
        phaseName: "5. 화염 스트림 대상 정면 격돌",
      },
      // 6. [지속 분사 1] 화염 스트림 직격 & 상대 붉은 필터 ON!
      {
        ...baseFrame,
        delay: 90,
        ...targetShake(-5, 2),
        ...attackerShake(2, -1),
        targetRedTint: isHit,
        hitFlash: isHit,
        showEffect: true,
        moveStep: 6,
        streamHead: 1.12,
        streamTail: 0.0,
        streamAlpha: 1.0,
        impactIntensity: 1.0,
        impactAlpha: 1.0,
        phaseId: "flame-blast-1",
        phaseName: "6. 고압 화염 방사 지속 (1)",
      },
      // 7. [지속 분사 2] 맹렬한 불뿜기 유지 (붉은 필터 유지)
      {
        ...baseFrame,
        delay: 90,
        ...targetShake(4, -2),
        ...attackerShake(-2, 1),
        targetRedTint: isHit,
        showEffect: true,
        moveStep: 7,
        streamHead: 1.12,
        streamTail: 0.0,
        streamAlpha: 1.0,
        impactIntensity: 1.0,
        impactAlpha: 1.0,
        phaseId: "flame-blast-2",
        phaseName: "7. 고압 화염 방사 지속 (2)",
      },
      // 8. [지속 분사 3] 맹렬한 불뿜기 클라이맥스 (붉은 필터 유지)
      {
        ...baseFrame,
        delay: 90,
        ...targetShake(-4, 1),
        ...attackerShake(2, 0),
        targetRedTint: isHit,
        showEffect: true,
        moveStep: 8,
        streamHead: 1.12,
        streamTail: 0.0,
        streamAlpha: 1.0,
        impactIntensity: 1.0,
        impactAlpha: 1.0,
        phaseId: "flame-blast-3",
        phaseName: "8. 고압 화염 방사 지속 (3)",
      },
      // 9. [지속 분사 4] 최대 출력 분사 마무리 (붉은 필터 유지)
      {
        ...baseFrame,
        delay: 90,
        ...targetShake(3, -1),
        ...attackerShake(1, -1),
        targetRedTint: isHit,
        showEffect: true,
        moveStep: 9,
        streamHead: 1.12,
        streamTail: 0.0,
        streamAlpha: 1.0,
        impactIntensity: 0.95,
        impactAlpha: 1.0,
        phaseId: "flame-blast-4",
        phaseName: "9. 고압 화염 방사 지속 (4)",
      },
      // 10. 시전자 분사 중단, 화염 스트림 후미 분리 및 타겟 쇄도
      {
        ...baseFrame,
        delay: 85,
        ...targetShake(-2, 1),
        targetRedTint: isHit,
        showEffect: true,
        moveStep: 10,
        streamHead: 1.12,
        streamTail: 0.38,
        streamAlpha: 0.95,
        impactIntensity: 0.85,
        impactAlpha: 0.95,
        phaseId: "flame-stream-cutoff",
        phaseName: "10. 분사 중단 및 스트림 후미 쇄도",
      },
      // 11. 화염 스트림 끝단 대상 완전 격돌
      {
        ...baseFrame,
        delay: 80,
        ...targetShake(1, 0),
        showEffect: true,
        moveStep: 11,
        streamHead: 1.12,
        streamTail: 0.80,
        streamAlpha: 0.80,
        impactIntensity: 0.60,
        impactAlpha: 0.80,
        phaseId: "flame-tail-impact",
        phaseName: "11. 스트림 후미 격돌",
      },
      // 12. 화염 스트림 소멸 및 타격 열기 잔향
      {
        ...baseFrame,
        delay: 75,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        moveStep: 12,
        streamHead: 1.12,
        streamTail: 1.05,
        streamAlpha: 0.40,
        impactIntensity: 0.30,
        impactAlpha: 0.50,
        phaseId: "flame-fade",
        phaseName: "12. 화염 스트림 소멸 및 잔향",
      },
      // 13. 잔여 불티 상승 및 냉각
      {
        ...baseFrame,
        delay: 70,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        moveStep: 13,
        impactIntensity: 0.10,
        impactAlpha: 0.25,
        phaseId: "flame-cool",
        phaseName: "13. 잔여 불티 상승",
      },
      // 14. 기술 종료 및 스탠스 원복
      {
        ...baseFrame,
        delay: 65,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        moveStep: 14,
        phaseId: "flame-end",
        phaseName: "14. 기술 종료 및 스탠스 원복",
      },
    ];
  },
};
