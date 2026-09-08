// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawSupersonicEffect } from "../../../renderers/moves/gen1/move045_048.js";

/**
 * 048: 초음파 (Supersonic)
 * 
 * Concept (유저 요구사항 100% 반영):
 * 1. 발사되는 건 동그란 링 (원형 링, 3D 왜곡 없음)
 * 2. 발사될 때 투명(0.20)하다가 전진하면서 반투명(0.75)해지며 적에게 도달 (색상은 기존 음파 색상 유지)
 * 3. 초음파 링이 적에게 차곡차곡 쌓임 (1차 -> 2차 -> 3차 적재)
 * 4. 다 쌓이면 울음소리 때 봤던 중간이 투명한 원 (대신 여기서는 노란색)이 바깥으로 거대하게 퍼짐
 * 5. 혼란(Confusion) 상태 돌입: 대상 머리 위 3D 궤도 회전 노란 별무리(★ ★ ★) + 좌우 비틀거림 모션
 */
export const supersonicMove: BattleMoveAnimation = {
  num: 48,
  key: "supersonic",
  nameKo: "초음파",
  nameEn: "Supersonic",
  type: "normal",
  category: "status",
  camera: { type: "target", zoom: 1.30 },
  drawEffect: drawSupersonicEffect,
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
      // 1. 시전자 초음파 발생 준비 (호흡 가다듬기 & 1차 3D 링 투명 발현)
      {
        ...baseFrame,
        delay: 80,
        pOffset: isP ? { x: 0, y: -2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -2 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.98, y: 1.02 } : undefined,
        eScale: !isP ? { x: 0.98, y: 1.02 } : undefined,
        showEffect: true,
        moveStep: 1,
        leaderT: 0.20,
        phaseId: "supersonic-start",
        phaseName: "1. 초음파 발생 (1차 3D 링 발사)",
      },
      // 2. 1차 링 전진 & 2, 3차 3D 링 사출
      {
        ...baseFrame,
        delay: 80,
        pOffset: isP ? { x: 0, y: -4 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -4 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.96, y: 1.04 } : undefined,
        eScale: !isP ? { x: 0.96, y: 1.04 } : undefined,
        showEffect: true,
        moveStep: 2,
        leaderT: 0.38,
        phaseId: "supersonic-rings-stream-1",
        phaseName: "2. 3D 노란 링 연속 사출 1",
      },
      // 3. 4, 5차 3D 링 사출 & 전장 유영
      {
        ...baseFrame,
        delay: 80,
        pOffset: isP ? { x: 0, y: -2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -2 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.02, y: 0.98 } : undefined,
        eScale: !isP ? { x: 1.02, y: 0.98 } : undefined,
        showEffect: true,
        moveStep: 3,
        leaderT: 0.58,
        phaseId: "supersonic-rings-stream-2",
        phaseName: "3. 3D 노란 링 연속 사출 2",
      },
      // 4. 6개 3D 링 완성 대열 & 전방 비행 (반투명 선명도 최고조)
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        moveStep: 4,
        leaderT: 0.78,
        phaseId: "supersonic-approach",
        phaseName: "4. 6개 3D 링 일렬 비행",
      },
      // 5. 1차 3D 링 대상 도착 & 대상 몸체에 3D 링 적재 시작
      {
        ...baseFrame,
        delay: 85,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        moveStep: 5,
        leaderT: 0.98,
        phaseId: "supersonic-stack-start",
        phaseName: "5. 선두 3D 링 적재 시작",
      },
      // 6. 후속 3D 링들 순차 도착 & 다중 적재 진행
      {
        ...baseFrame,
        delay: 85,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: 1, y: 0 } : { x: -1, y: 0 },
        showEffect: true,
        moveStep: 6,
        leaderT: 1.18,
        phaseId: "supersonic-stack-mid",
        phaseName: "6. 3D 링 다중 적재",
      },
      // 7. 3D 링들 대상 몸체 전신 포위 적재
      {
        ...baseFrame,
        delay: 85,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: -2, y: 0 } : { x: 2, y: 0 },
        showEffect: true,
        moveStep: 7,
        leaderT: 1.38,
        phaseId: "supersonic-stack-surround",
        phaseName: "7. 3D 링 전신 포위 적재",
      },
      // 8. 6개 3D 링 완전 적재 완료 (3D 원통 케이지 형성)
      {
        ...baseFrame,
        delay: 90,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: 2, y: -1 } : { x: -2, y: 1 },
        showEffect: true,
        moveStep: 8,
        leaderT: 1.55,
        phaseId: "supersonic-stack-complete",
        phaseName: "8. 6개 3D 링 완전 적재 (원통 케이지)",
      },
      // 9. [6개 3D 링 초음파 공명 진동]: 3D 링들이 대상 주위에서 고속 진동
      {
        ...baseFrame,
        delay: 90,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: -3, y: 1 } : { x: 3, y: -1 },
        showEffect: true,
        moveStep: 9,
        leaderT: 1.65,
        phaseId: "supersonic-resonance",
        phaseName: "9. 6개 3D 링 초음파 공명 진동",
      },
      // 10. [노란색 투명 원 1차 확산]: 중심이 투명한 노란색 원이 팽창
      {
        ...baseFrame,
        delay: 95,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: -4, y: 2 } : { x: 4, y: -2 },
        showEffect: true,
        moveStep: 10,
        yellowBurstR: 40,
        burstAlpha: 0.85,
        phaseId: "supersonic-yellow-burst-1",
        phaseName: "10. 노란색 충격파 원 1차 확산 폭발",
      },
      // 11. [노란색 투명 원 2차 확산]: 절제된 범위(70px)로 집중 확산 & 피격 충격
      {
        ...baseFrame,
        delay: 95,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: 5, y: -2 } : { x: -5, y: 2 },
        hitFlash: true,
        showEffect: true,
        moveStep: 11,
        yellowBurstR: 70,
        burstAlpha: 0.65,
        phaseId: "supersonic-yellow-burst-2",
        phaseName: "11. 노란색 충격파 적정 확산 작렬",
      },
      // 12. 노란색 원 88px 정점 페이드아웃 & 혼란 별무리 태동 시작
      {
        ...baseFrame,
        delay: 100,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: 2, y: 0 } : { x: -2, y: 0 },
        pRot: !isP ? 0.05 : 0,
        eRot: isP ? 0.05 : 0,
        showEffect: true,
        moveStep: 12,
        yellowBurstR: 88,
        burstAlpha: 0.20,
        confusionProgress: 0.25,
        phaseId: "supersonic-confuse-start",
        phaseName: "12. 혼란 상태 돌입 (별무리 발생)",
      },
      // 13. 혼란 상태: 머리 위 3D 궤도 회전 별무리 & 대상 좌측 비틀거림
      {
        ...baseFrame,
        delay: 110,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: -3, y: 1 } : { x: 3, y: -1 },
        pRot: !isP ? -0.07 : 0,
        eRot: isP ? -0.07 : 0,
        showEffect: true,
        moveStep: 13,
        confusionProgress: 0.50,
        phaseId: "supersonic-confuse-wobble-1",
        phaseName: "13. 혼란 별무리 3D 공전 & 비틀거림 1",
      },
      // 14. 혼란 심화: 별무리 고속 공전 & 대상 우측 비틀거림
      {
        ...baseFrame,
        delay: 120,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: 3, y: -1 } : { x: -3, y: 1 },
        pRot: !isP ? 0.07 : 0,
        eRot: isP ? 0.07 : 0,
        showEffect: true,
        moveStep: 14,
        confusionProgress: 0.75,
        phaseId: "supersonic-confuse-wobble-2",
        phaseName: "14. 혼란 별무리 3D 공전 & 비틀거림 2",
      },
      // 15. 혼란 최고조: 별무리 3개 선명 공전 & 대상 어지러움
      {
        ...baseFrame,
        delay: 120,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: -2, y: 0 } : { x: 2, y: 0 },
        pRot: !isP ? -0.05 : 0,
        eRot: isP ? -0.05 : 0,
        showEffect: true,
        moveStep: 15,
        confusionProgress: 0.95,
        phaseId: "supersonic-confuse-climax",
        phaseName: "15. 혼란 최고조 (3개 별무리 공전)",
      },
      // 16. 혼란 안착 & 기술 완료
      {
        ...baseFrame,
        delay: 130,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pRot: !isP ? 0.03 : 0,
        eRot: isP ? 0.03 : 0,
        showEffect: true,
        moveStep: 16,
        confusionProgress: 1.05,
        phaseId: "supersonic-finish",
        phaseName: "16. 혼란 상태 안착 및 기술 완료",
      },
    ];
  },
};
