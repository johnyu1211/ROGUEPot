// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawLeerEffect } from "../../../renderers/moves/gen1/move041_044.js";

/**
 * 043: 째려보기 (Leer)
 * 
 * Concept (유저 요청 100% 반영):
 * - 기존 레이저 빔 형태 완전 제거
 * - 주변이 어두워지는 반투명 검정 오버레이 (잘림 없이 전체 화면 완전 커버)
 * - 시전자 앞쪽에 십자모양 별이 일시적으로 번뜩임 (안광 섬광)
 * - 상대방이 위압감에 질려 떨림 & 방어력 1랭크 하락 디버프 (파란색 하강 화살표)
 */
export const leerMove: BattleMoveAnimation = {
  num: 43,
  key: "leer",
  nameKo: "째려보기",
  nameEn: "Leer",
  type: "normal",
  category: "status",
  camera: { type: "none" },
  drawEffect: drawLeerEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    return [
      // 1. 시전자 시선 집중 & 주변 어두워짐 (암전 선행)
      {
        ...baseFrame,
        delay: 120,
        pOffset: isP ? { x: 6, y: -2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -6, y: 2 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.04, y: 0.96 } : undefined,
        eScale: !isP ? { x: 1.04, y: 0.96 } : undefined,
        showEffect: true,
        moveStep: 1,
        phaseId: "leer-dim",
        phaseName: "1. 주변 암전 (어두워짐)",
      },
      // 2. 어두워진 속에서 시전자 눈 앞 십자모양 별 번뜩임! (Glint Flash)
      {
        ...baseFrame,
        delay: 160,
        pOffset: isP ? { x: 10, y: -4 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -10, y: 4 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.08, y: 0.94 } : undefined,
        eScale: !isP ? { x: 1.08, y: 0.94 } : undefined,
        showEffect: true,
        moveStep: 2,
        phaseId: "leer-star-flash",
        phaseName: "2. 암전 속 십자모양 별 반짝임",
      },
      // 3. 십자모양 별 소멸 & 암전 빠르게 복구
      {
        ...baseFrame,
        delay: 110,
        pOffset: isP ? { x: 6, y: -2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -6, y: 2 } : { x: 0, y: 0 },
        showEffect: true,
        moveStep: 3,
        phaseId: "leer-star-fade",
        phaseName: "3. 별 소멸 & 암전 복구",
      },
      // 4. 상대방 위압감에 움찔 떨림 (1차 진동) & 방어력 하락 개시 (statProgress: 0.22)
      {
        ...baseFrame,
        delay: 95,
        pOffset: !isP ? { x: -5, y: 2 } : { x: 0, y: 0 },
        eOffset: isP ? { x: 5, y: -2 } : { x: 0, y: 0 },
        showEffect: true,
        moveStep: 4,
        statProgress: 0.22,
        afterCameraReturn: true,
        phaseId: "leer-debuff-start",
        phaseName: "4. 상대방 위압 떨림 & 방어력 하락 개시",
      },
      // 5. 상대방 2차 반대 방향 떨림 & 방어력 하락 화살표 가속 (statProgress: 0.50)
      {
        ...baseFrame,
        delay: 95,
        pOffset: !isP ? { x: 4, y: -1 } : { x: 0, y: 0 },
        eOffset: isP ? { x: -4, y: 1 } : { x: 0, y: 0 },
        showEffect: false,
        statProgress: 0.50,
        afterCameraReturn: true,
        phaseId: "leer-debuff-mid",
        phaseName: "5. 상대방 방어력 하락 가속 (화살표 중앙 통과)",
      },
      // 6. 방어력 하락 화살표 연쇄 파동 (statProgress: 0.78)
      {
        ...baseFrame,
        delay: 95,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        statProgress: 0.78,
        afterCameraReturn: true,
        phaseId: "leer-debuff-cascade",
        phaseName: "6. 상대방 방어력 하락 연쇄 파동",
      },
      // 7. 방어력 하락 완료 (statProgress: 0.98)
      {
        ...baseFrame,
        delay: 100,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        statProgress: 0.98,
        afterCameraReturn: true,
        phaseId: "leer-debuff-finish",
        phaseName: "7. 방어력 하락 완료 (발밑 소멸)",
      },
      // 8. 제자리 복귀 완료
      {
        ...baseFrame,
        delay: 90,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        afterCameraReturn: true,
        phaseId: "leer-finish",
        phaseName: "8. 복귀 완료",
      },
    ];
  }
};
