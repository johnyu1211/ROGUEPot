// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawRoarEffect } from "../../../renderers/moves/gen1/move045_048.js";

/**
 * 046: 울부짖기 (Roar)
 * 
 * Concept (유저 요구사항 100% 반영):
 * - 울음소리와 유사한 에셋(3겹의 붉은 원 + 5방향 ⚡ 번개) 사용
 * - 울음소리는 시전 포켓몬 중심 제자리 확산이지만,
 *   울부짖기는 해당 이펙트가 대상 포켓몬 방향(앞쪽)으로 전진하며 거대하게 퍼져나가는 전방 지향성 음파 폭풍!
 * - 대상 포켓몬 포커싱 (`camera: { type: "target", zoom: 1.32 }`)
 * - 대상 포켓몬이 거센 포효 풍압에 직격당해 화면 밖으로 밀려나감 (Blow-back 넉백)
 */
export const roarMove: BattleMoveAnimation = {
  num: 46,
  key: "roar",
  nameKo: "울부짖기",
  nameEn: "Roar",
  type: "normal",
  category: "status",
  camera: { type: "target", zoom: 1.32 },
  drawEffect: drawRoarEffect,
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
      // 1. 시전자 포효 준비 (도약 전진 모으기 & 입 앞쪽 미세 음파 구)
      {
        ...baseFrame,
        delay: 120,
        pOffset: isP ? { x: -8, y: 3 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 8, y: -3 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.95, y: 1.05 } : undefined,
        eScale: !isP ? { x: 0.95, y: 1.05 } : undefined,
        showEffect: true,
        moveStep: 1,
        phaseId: "roar-ready",
        phaseName: "1. 포효 준비 (호흡 모으기)",
      },
      // 2. 시전자 전방 포효 사출 & 3겹 붉은 원 + 5방향 번개 1차 전진
      {
        ...baseFrame,
        delay: 110,
        pOffset: isP ? { x: 12, y: -4 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -12, y: 4 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.10, y: 0.90 } : undefined,
        eScale: !isP ? { x: 1.10, y: 0.90 } : undefined,
        showEffect: true,
        moveStep: 2,
        phaseId: "roar-burst",
        phaseName: "2. 전방 음파 폭풍 사출",
      },
      // 3. 음파 폭풍 급속 전진 & 대상 포켓몬 1차 밀려남 (풍압 충격)
      {
        ...baseFrame,
        delay: 120,
        pOffset: isP ? { x: 8, y: -2 } : { x: -32, y: 10 },
        eOffset: !isP ? { x: -8, y: 2 } : { x: 32, y: -10 },
        showEffect: true,
        hitFlash: true,
        moveStep: 3,
        phaseId: "roar-impact-1",
        phaseName: "3. 음파 접근 & 대상 1차 밀림",
      },
      // 4. 거대 음파 직격 & 대상 포켓몬 강한 밀려남 (Blow-back 진행)
      {
        ...baseFrame,
        delay: 130,
        pOffset: isP ? { x: 4, y: -1 } : { x: -85, y: 26 },
        eOffset: !isP ? { x: -4, y: 1 } : { x: 85, y: -26 },
        showEffect: true,
        hitFlash: true,
        moveStep: 4,
        phaseId: "roar-impact-2",
        phaseName: "4. 음파 직격 & 대상 거센 밀림",
      },
      // 5. 최대 풍압 작렬 & 대상 포켓몬 화면 바깥쪽으로 날려보냄
      {
        ...baseFrame,
        delay: 140,
        pOffset: isP ? { x: 0, y: 0 } : { x: -150, y: 48 },
        eOffset: !isP ? { x: 0, y: 0 } : { x: 150, y: -48 },
        pAlpha: !isP ? 0.40 : 1.0,
        eAlpha: isP ? 0.40 : 1.0,
        showEffect: true,
        moveStep: 5,
        phaseId: "roar-blowback",
        phaseName: "5. 화면 밖 밀려남 (넉백 이탈)",
      },
      // 6. 음파 소멸 & 대상 포켓몬 화면 밖 이탈 유지
      {
        ...baseFrame,
        delay: 120,
        pOffset: isP ? { x: 0, y: 0 } : { x: -190, y: 60 },
        eOffset: !isP ? { x: 0, y: 0 } : { x: 190, y: -60 },
        pAlpha: !isP ? 0.10 : 1.0,
        eAlpha: isP ? 0.10 : 1.0,
        showEffect: false,
        phaseId: "roar-offscreen",
        phaseName: "6. 대상 화면 밖 이탈",
      },
      // 7. 대상 포켓몬 전장으로 슬라이드 복귀
      {
        ...baseFrame,
        delay: 130,
        pOffset: isP ? { x: 0, y: 0 } : { x: -50, y: 16 },
        eOffset: !isP ? { x: 0, y: 0 } : { x: 50, y: -16 },
        pAlpha: !isP ? 0.75 : 1.0,
        eAlpha: isP ? 0.75 : 1.0,
        showEffect: false,
        phaseId: "roar-recovering",
        phaseName: "7. 전장 복귀",
      },
      // 8. 양측 정위치 복귀 완료
      {
        ...baseFrame,
        delay: 100,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pAlpha: 1.0,
        eAlpha: 1.0,
        showEffect: false,
        phaseId: "roar-finish",
        phaseName: "8. 복귀 완료",
      },
    ];
  },
};
