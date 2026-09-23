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

    // 시전자 전용 오프셋 헬퍼 (수비자는 { 0, 0 } 절대 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 피격자(대상) 전용 리액션 오프셋 헬퍼 (시전자는 { 0, 0 } 절대 고정)
    const targetReact = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x, y } : { x: 0, y: 0 },
    });

    return [
      // 1. 시전자 초음파 발생 준비 (호흡 가다듬기 & 1차 3D 링 투명 발현)
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, -2),
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
        ...cOff(0, -4),
        pScale: isP ? { x: 0.96, y: 1.04 } : undefined,
        eScale: !isP ? { x: 0.96, y: 1.04 } : undefined,
        showEffect: true,
        moveStep: 2,
        leaderT: 0.40,
        phaseId: "supersonic-rings-stream-1",
        phaseName: "2. 3D 노란 링 연속 사출 1",
      },
      // 3. 4, 5차 3D 링 사출 & 전장 유영
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, -2),
        pScale: isP ? { x: 1.02, y: 0.98 } : undefined,
        eScale: !isP ? { x: 1.02, y: 0.98 } : undefined,
        showEffect: true,
        moveStep: 3,
        leaderT: 0.65,
        phaseId: "supersonic-rings-stream-2",
        phaseName: "3. 3D 노란 링 연속 사출 2",
      },
      // 4. 6개 3D 링 완성 대열 & 전방 비행 (날아갈수록 커짐)
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 4,
        leaderT: 0.90,
        phaseId: "supersonic-approach",
        phaseName: "4. 6개 3D 링 확대 비행 및 대상 접근",
      },
      // 5. 1차 3D 링 대상 관통 & 후방 확산 시작
      {
        ...baseFrame,
        delay: 85,
        ...(isHit ? targetReact(1, 0) : cOff(0, 0)),
        showEffect: true,
        moveStep: 5,
        leaderT: 1.15,
        phaseId: "supersonic-pass-1",
        phaseName: "5. 선두 3D 링 대상 관통 및 후방 확산",
      },
      // 6. 후속 3D 링들 순차 관통 & 점진적 확대
      {
        ...baseFrame,
        delay: 85,
        ...(isHit ? targetReact(-2, 0) : cOff(0, 0)),
        showEffect: true,
        moveStep: 6,
        leaderT: 1.40,
        phaseId: "supersonic-pass-2",
        phaseName: "6. 초음파 링 연속 관통 및 후방 확대",
      },
      // 7. 3D 링들 전신 관통 통과 & 광역 투명 확산
      {
        ...baseFrame,
        delay: 85,
        ...(isHit ? targetReact(2, -1) : cOff(0, 0)),
        showEffect: true,
        moveStep: 7,
        leaderT: 1.65,
        phaseId: "supersonic-pass-3",
        phaseName: "7. 초음파 링 전신 통과 및 광역 투명 확산",
      },
      // 8. 6개 3D 링 대상 후방 완전 통과 & 페이드아웃
      {
        ...baseFrame,
        delay: 90,
        ...(isHit ? targetReact(-3, 1) : cOff(0, 0)),
        showEffect: true,
        moveStep: 8,
        leaderT: 1.85,
        phaseId: "supersonic-pass-complete",
        phaseName: "8. 초음파 링 후방 완전 통과 및 페이드아웃",
      },
      // 9. 대상 피격 직전 음파 잔향 진동
      {
        ...baseFrame,
        delay: 90,
        ...(isHit ? targetReact(3, -1) : cOff(0, 0)),
        showEffect: true,
        moveStep: 9,
        leaderT: 2.05,
        phaseId: "supersonic-resonance",
        phaseName: "9. 음파 잔향 공명 진동",
      },
      // 10. [노란색 투명 원 1차 확산]: 중심이 투명한 노란색 원이 팽창
      {
        ...baseFrame,
        delay: 95,
        ...(isHit ? targetReact(-4, 2) : cOff(0, 0)),
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
        ...(isHit ? targetReact(5, -2) : cOff(0, 0)),
        hitFlash: isHit,
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
        ...(isHit ? targetReact(2, 0) : cOff(0, 0)),
        pRot: !isP && isHit ? 0.05 : 0,
        eRot: isP && isHit ? 0.05 : 0,
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
        ...(isHit ? targetReact(-3, 1) : cOff(0, 0)),
        pRot: !isP && isHit ? -0.07 : 0,
        eRot: isP && isHit ? -0.07 : 0,
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
        ...(isHit ? targetReact(3, -1) : cOff(0, 0)),
        pRot: !isP && isHit ? 0.07 : 0,
        eRot: isP && isHit ? 0.07 : 0,
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
        ...(isHit ? targetReact(-2, 0) : cOff(0, 0)),
        pRot: !isP && isHit ? -0.05 : 0,
        eRot: isP && isHit ? -0.05 : 0,
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
        ...cOff(0, 0),
        pRot: !isP && isHit ? 0.03 : 0,
        eRot: isP && isHit ? 0.03 : 0,
        showEffect: true,
        moveStep: 16,
        confusionProgress: 1.05,
        phaseId: "supersonic-finish",
        phaseName: "16. 혼란 상태 안착 및 기술 완료",
      },
    ];
  },
};
