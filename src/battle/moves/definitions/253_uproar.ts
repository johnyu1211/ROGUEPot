// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawUproarEffect } from "../../../renderers/moves/gen1/move253_256.js";

/**
 * 253: 소란피우기 (Uproar)
 * 
 * Concept (유저 요구사항 100% 반영):
 * - 울부짖기(Roar / 046) 전방 지향성 음파 3D 비행 및 카메라 포커싱 참고
 * - 발사되는 원판:
 *   - 여러겹의 링(노랑, 연주황 겹겹)으로 구성된 3D 원판
 * - 함께 발사되는 음표:
 *   - 갈주황(#B84E10) 및 주황(#FF7A00) 색상으로 이루어진 단일음표(♪)와 2연음표(♫)가
 *     원판 둘레와 비행 궤도를 따라 전방으로 함께 쇄도
 * - 타격 시: 대상 직격 음파 폭발, 타격 섬광, HP 감소, 피격자 리액션, 갈주황/주황 음표 비산
 */
export const uproarMove: BattleMoveAnimation = {
  num: 253,
  key: "uproar",
  nameKo: "소란피우기",
  nameEn: "Uproar",
  type: "normal",
  category: "special",
  camera: { type: "target", zoom: 1.32 },
  drawEffect: drawUproarEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      cameraZoom: 1.32,
    };

    // 시전자 오프셋 헬퍼 (수비자는 0 고정 보장)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 피격자 반응 헬퍼
    const targetReaction = (offX = 0, offY = 0, scaleX = 1.0, scaleY = 1.0) => ({
      pOffset: !isP ? { x: -offX, y: offY } : { x: 0, y: 0 },
      eOffset: isP ? { x: offX, y: offY } : { x: 0, y: 0 },
      pScale: !isP && (scaleX !== 1.0 || scaleY !== 1.0) ? { x: scaleX, y: scaleY } : undefined,
      eScale: isP && (scaleX !== 1.0 || scaleY !== 1.0) ? { x: scaleX, y: scaleY } : undefined,
    });

    // 빗나감 연출
    if (!isHit) {
      return [
        {
          ...baseFrame,
          delay: 110,
          ...cOff(-8, 3),
          showEffect: true,
          moveStep: 1,
          phaseId: "uproar-miss-prep",
          phaseName: "1. 소란 준비 (빗나감)",
        },
        {
          ...baseFrame,
          delay: 100,
          ...cOff(12, -4),
          showEffect: true,
          moveStep: 2,
          phaseId: "uproar-miss-fire",
          phaseName: "2. 음파 원판 사출 (빗나감)",
        },
        {
          ...baseFrame,
          delay: 120,
          ...cOff(6, -2),
          ...targetReaction(18, 0), // 대상이 회피
          showEffect: true,
          moveStep: 3,
          phaseId: "uproar-miss-dodge",
          phaseName: "3. 대상 회피",
        },
        {
          ...baseFrame,
          delay: 90,
          ...cOff(0, 0),
          showEffect: false,
          moveStep: 6,
          phaseId: "uproar-miss-end",
          phaseName: "4. 공격 빗나감",
        },
      ];
    }

    // 적중 시퀀스: 3회 발사 > 퍼지고, 중심에서 외곽으로 5색 완전 확산 (Step 1~14)
    return [
      // 0. 준비 (호흡 가다듬기)
      {
        ...baseFrame,
        delay: 70,
        ...cOff(-6, 2),
        pScale: isP ? { x: 0.96, y: 1.04 } : undefined,
        eScale: !isP ? { x: 0.96, y: 1.04 } : undefined,
        showEffect: false,
        moveStep: 1,
        phaseId: "uproar-prep",
        phaseName: "0. 소란 준비",
      },
      // === [1차 파동]: 발사 > 퍼지고 (중심에서 외곽으로 5색 확산) ===
      // 1. 1차 발사 (중심 #B3903A 생성)
      {
        ...baseFrame,
        delay: 55,
        ...cOff(10, -3),
        pScale: isP ? { x: 1.08, y: 0.92 } : undefined,
        eScale: !isP ? { x: 1.08, y: 0.92 } : undefined,
        showEffect: true,
        moveStep: 1,
        phaseId: "uproar-w1-fire",
        phaseName: "1. 1차 발사 (중심 #B3903A 생성)",
      },
      // 2. 1차 전진 1 (중심 주황 출현, #B3903A 바깥으로 확산)
      {
        ...baseFrame,
        delay: 55,
        ...cOff(8, -2),
        showEffect: true,
        moveStep: 2,
        phaseId: "uproar-w1-fly1",
        phaseName: "2. 1차 전진 1 (중심 주황 출현)",
      },
      // 3. 1차 전진 2 (중심 #D9D719 출현, 주황 중간, #B3903A 외곽)
      {
        ...baseFrame,
        delay: 60,
        ...cOff(6, -2),
        showEffect: true,
        moveStep: 3,
        phaseId: "uproar-w1-fly2",
        phaseName: "3. 1차 전진 2 (중심 #D9D719 확산)",
      },
      // 4. 1차 퍼짐 (외곽 및 음표까지 #AB8D8C 도달)
      {
        ...baseFrame,
        delay: 65,
        ...cOff(4, -1),
        ...targetReaction(3, 0),
        showEffect: true,
        moveStep: 4,
        phaseId: "uproar-w1-spread",
        phaseName: "4. 1차 퍼짐 (외곽 #AB8D8C 도달)",
      },
      // === [2차 파동]: 발사 > 퍼지고 (다시 중심에서 외곽으로 5색 확산) ===
      // 5. 2차 발사 (새로 중심 #B3903A 생성)
      {
        ...baseFrame,
        delay: 55,
        ...cOff(12, -4),
        pScale: isP ? { x: 1.10, y: 0.90 } : undefined,
        eScale: !isP ? { x: 1.10, y: 0.90 } : undefined,
        showEffect: true,
        moveStep: 5,
        phaseId: "uproar-w2-fire",
        phaseName: "5. 2차 발사 (새로 중심 #B3903A 생성)",
      },
      // 6. 2차 전진 1 (중심 주황 출현)
      {
        ...baseFrame,
        delay: 55,
        ...cOff(10, -3),
        showEffect: true,
        moveStep: 6,
        phaseId: "uproar-w2-fly1",
        phaseName: "6. 2차 전진 1 (중심 주황 출현)",
      },
      // 7. 2차 전진 2 (중심 #D9D719 확산)
      {
        ...baseFrame,
        delay: 60,
        ...cOff(7, -2),
        showEffect: true,
        moveStep: 7,
        phaseId: "uproar-w2-fly2",
        phaseName: "7. 2차 전진 2 (중심 #D9D719 확산)",
      },
      // 8. 2차 퍼짐 (외곽 및 음표까지 #AB8D8C 도달)
      {
        ...baseFrame,
        delay: 65,
        ...cOff(5, -2),
        ...targetReaction(-4, 0),
        showEffect: true,
        moveStep: 8,
        phaseId: "uproar-w2-spread",
        phaseName: "8. 2차 퍼짐 (외곽 #AB8D8C 도달)",
      },
      // === [3차 파동]: 발사 > 최대로 퍼지게 (5색 중간에서 바깥으로 완전 확산 & 직격) ===
      // 9. 3차 발사 (새로 중심 #B3903A 생성)
      {
        ...baseFrame,
        delay: 55,
        ...cOff(14, -5),
        pScale: isP ? { x: 1.12, y: 0.88 } : undefined,
        eScale: !isP ? { x: 1.12, y: 0.88 } : undefined,
        showEffect: true,
        moveStep: 9,
        phaseId: "uproar-w3-fire",
        phaseName: "9. 3차 발사 (새로 중심 #B3903A 생성)",
      },
      // 10. 3차 전진 1 (중심 주황 출현)
      {
        ...baseFrame,
        delay: 55,
        ...cOff(12, -4),
        showEffect: true,
        moveStep: 10,
        phaseId: "uproar-w3-fly1",
        phaseName: "10. 3차 전진 1 (중심 주황 출현)",
      },
      // 11. 3차 전진 2 (중심 #D9D719 확산)
      {
        ...baseFrame,
        delay: 60,
        ...cOff(9, -3),
        showEffect: true,
        moveStep: 11,
        phaseId: "uproar-w3-fly2",
        phaseName: "11. 3차 전진 2 (중심 #D9D719 확산)",
      },
      // 12. 3차 퍼짐 1 (중심 노랑 확산)
      {
        ...baseFrame,
        delay: 60,
        ...cOff(7, -2),
        showEffect: true,
        moveStep: 12,
        phaseId: "uproar-w3-spread1",
        phaseName: "12. 3차 퍼짐 1 (중심 노랑 확산)",
      },
      // 13. 3차 최대 완전 퍼짐 (직격 타격 & 외곽/음표까지 #AB8D8C 완전 확산)
      {
        ...baseFrame,
        delay: 80,
        ...cOff(5, -2),
        ...targetReaction(8, 0, 1.12, 0.88),
        showEffect: true,
        moveStep: 13,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "uproar-w3-spread-max",
        phaseName: "13. 3차 최대 완전 퍼짐 (#AB8D8C 직격)",
      },
      // 14. 3차 관통 소산 (#AB8D8C)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(2, -1),
        ...targetReaction(-3, 0, 0.96, 1.04),
        showEffect: true,
        moveStep: 14,
        effectProgress: 0.8,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "uproar-w3-fade",
        phaseName: "14. 3차 음파 소산 (#AB8D8C)",
      },
      // 15. 복귀 완료
      {
        ...baseFrame,
        delay: 70,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        moveStep: 14,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "uproar-finish",
        phaseName: "15. 복귀 완료",
      },
    ];
  },
};
