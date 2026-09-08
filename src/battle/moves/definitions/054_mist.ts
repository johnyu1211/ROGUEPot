// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawMistEffect, drawMistBehindEffect } from "../../../renderers/moves/gen1/move053_056.js";

/**
 * 054: 흰안개 (Mist)
 * 
 * Concept:
 * 1. 시전 포켓몬 앞쪽 필드로 은은하게 피어오르는 순백/빙청색 안개 구름 장막 (Behind & Front 레이어)
 * 2. 전장 전체에 서서히 스며들었다가 걷히는 쿨 블루 필터 효과
 * 3. 안개 속에서 반짝이며 하늘로 피어오르는 다이아몬드 얼음 결정 (✦)
 * 4. 상공으로 떠오르며 공기 중으로 우아하게 기화 분산
 */
export const mistMove: BattleMoveAnimation = {
  num: 54,
  key: "mist",
  nameKo: "흰안개",
  nameEn: "Mist",
  type: "ice",
  category: "status",
  camera: { type: "none" },
  drawBehindEffect: drawMistBehindEffect,
  drawEffect: drawMistEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    const casterOffset = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x, y } : { x: 0, y: 0 },
    });

    const casterScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    return [
      // 1. 앞쪽 필드 냉기 유입 및 은은한 안개 발생 시작
      {
        ...baseFrame,
        delay: 85,
        ...casterScale(1.04, 0.96),
        showEffect: true,
        moveStep: 1,
        mistProgress: 0.16,
        mistAlpha: 0.45,
        phaseId: "mist-gather",
        phaseName: "1. 앞쪽 필드 냉기 유입 및 안개 발생",
      },
      // 2. 냉기 안개 싹 피어오름 & 미세 결정 발생
      {
        ...baseFrame,
        delay: 85,
        ...casterScale(0.98, 1.02),
        showEffect: true,
        moveStep: 2,
        mistProgress: 0.35,
        mistAlpha: 0.80,
        sparkleAlpha: 0.70,
        phaseId: "mist-sprout",
        phaseName: "2. 순백 안개 피어오름 및 결정 발생",
      },
      // 3. 순백 안개 구름 본격 회전 상승 & 얼음 결정 비산
      {
        ...baseFrame,
        delay: 95,
        ...casterOffset(0, -2),
        showEffect: true,
        moveStep: 3,
        mistProgress: 0.60,
        mistAlpha: 0.95,
        sparkleAlpha: 0.95,
        phaseId: "mist-rise",
        phaseName: "3. 순백 안개 구름 회전 상승",
      },
      // 4. 안개가 앞쪽 필드를 몽환적으로 메움
      {
        ...baseFrame,
        delay: 100,
        ...casterOffset(0, -3),
        showEffect: true,
        moveStep: 4,
        mistProgress: 0.85,
        mistAlpha: 1.0,
        sparkleAlpha: 1.0,
        phaseId: "mist-envelop",
        phaseName: "4. 앞쪽 필드 안개 장막 전개",
      },
      // 5. [클라이맥스] 앞쪽 필드 안개 만개 및 얼음 결정 최대 방출
      {
        ...baseFrame,
        delay: 110,
        ...casterOffset(0, -2),
        showEffect: true,
        moveStep: 5,
        mistProgress: 1.0,
        mistAlpha: 1.0,
        sparkleAlpha: 1.0,
        phaseId: "mist-climax",
        phaseName: "5. 앞쪽 필드 흰안개 만개 및 냉기 방출",
      },
      // 6. 안개 부드러운 롤링 및 필드 확산
      {
        ...baseFrame,
        delay: 100,
        ...casterOffset(0, -1),
        showEffect: true,
        moveStep: 6,
        mistProgress: 1.08,
        mistAlpha: 0.95,
        sparkleAlpha: 0.85,
        phaseId: "mist-sustain",
        phaseName: "6. 안개 필드 확산 및 공전",
      },
      // 7. 안개가 상공으로 떠오르며 서서히 투명화 확산
      {
        ...baseFrame,
        delay: 95,
        ...casterOffset(0, 0),
        showEffect: true,
        moveStep: 7,
        mistProgress: 1.18,
        mistAlpha: 0.75,
        sparkleAlpha: 0.70,
        phaseId: "mist-drift-1",
        phaseName: "7. 안개 상공 부유 및 기화 시작",
      },
      // 8. 안개 확산 분산 & 하늘로 흩날리는 얼음 결정 (메시지창 복귀 시작)
      {
        ...baseFrame,
        delay: 90,
        ...casterOffset(0, 0),
        showEffect: true,
        moveStep: 8,
        mistProgress: 1.28,
        mistAlpha: 0.45,
        sparkleAlpha: 0.50,
        hideUI: false,
        afterCameraReturn: true,
        phaseId: "mist-drift-2",
        phaseName: "8. 안개 분산 및 결정 비산 (메시지창 복귀)",
      },
      // 9. 미세한 냉기 증기 잔향 페이드아웃
      {
        ...baseFrame,
        delay: 80,
        ...casterOffset(0, 0),
        showEffect: true,
        moveStep: 9,
        mistProgress: 1.38,
        mistAlpha: 0.20,
        sparkleAlpha: 0.25,
        hideUI: false,
        afterCameraReturn: true,
        phaseId: "mist-fade",
        phaseName: "9. 잔여 냉기 안개 페이드아웃",
      },
      // 10. 스탠스 안정 복귀 및 기술 종료
      {
        ...baseFrame,
        delay: 80,
        ...casterOffset(0, 0),
        showEffect: false,
        moveStep: 10,
        hideUI: false,
        afterCameraReturn: true,
        phaseId: "mist-recover",
        phaseName: "10. 스탠스 복귀 및 기술 종료",
      },
      // 11. 흰안개 장막 형성 완료 및 메시지창 안착 (안정적 대기)
      {
        ...baseFrame,
        delay: 260,
        ...casterOffset(0, 0),
        showEffect: false,
        moveStep: 11,
        hideUI: false,
        afterCameraReturn: true,
        phaseId: "mist-settle",
        phaseName: "11. 흰안개 장막 형성 완료 & 메시지창 안착",
      },
    ];
  },
};
