// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawGrowlEffect } from "../../../renderers/moves/gen1/move045_048.js";

/**
 * 045: 울음소리 (Growl) - 5세대 공식 배틀 연출
 * 
 * Concept (5세대 블랙/화이트 완벽 재현):
 * - 시전자 입 전면에서 3중 동심원 음파 링이 차례로 방사
 * - 음파 사이사이에 5세대 특유의 귀여운 8분음표(♪) 파티클이 부유
 * - 상대방에 음파가 도달하면 시끄러운 소음에 진동(( )) 피격
 * - 이후 공격력 1랭크 하락 디버프(파란색 하강 화살표) 진행
 */
export const growlMove: BattleMoveAnimation = {
  num: 45,
  key: "growl",
  nameKo: "울음소리",
  nameEn: "Growl",
  type: "normal",
  category: "status",
  camera: { type: "self", zoom: 1.25 },
  drawEffect: drawGrowlEffect,
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
      // 1. 시전자 포효 준비 (숨 들이쉬기 & 초기 중심부 미세 주황/붉은 원 + 번개 씨앗)
      {
        ...baseFrame,
        delay: 110,
        pOffset: isP ? { x: -6, y: 2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 6, y: -2 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.96, y: 1.04 } : undefined,
        eScale: !isP ? { x: 0.96, y: 1.04 } : undefined,
        showEffect: true,
        moveStep: 1,
        phaseId: "growl-ready",
        phaseName: "1. 포효 준비 (숨 들이쉬기)",
      },
      // 2. 3겹 붉은 원 & 5방향 번개 사출 시작
      {
        ...baseFrame,
        delay: 100,
        pOffset: isP ? { x: 8, y: -3 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -8, y: 3 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.10, y: 0.90 } : undefined,
        eScale: !isP ? { x: 1.10, y: 0.90 } : undefined,
        showEffect: true,
        moveStep: 2,
        phaseId: "growl-wave1",
        phaseName: "2. 3겹 붉은 원 & 5방향 번개 사출 시작",
      },
      // 3. 3겹 붉은 원 대형 확산 & 번개 뻗음
      {
        ...baseFrame,
        delay: 110,
        pOffset: isP ? { x: 6, y: -2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -6, y: 2 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.06, y: 0.94 } : undefined,
        eScale: !isP ? { x: 1.06, y: 0.94 } : undefined,
        showEffect: true,
        moveStep: 3,
        phaseId: "growl-wave2",
        phaseName: "3. 3겹 붉은 원 대형 확산 & 번개 뻗음",
      },
      // 4. 3겹 원 최대 확장 (어느정도 큰 원) & 번개 최고조
      {
        ...baseFrame,
        delay: 120,
        pOffset: isP ? { x: 4, y: -1 } : { x: 0, y: 0 },
        eOffset: isP ? { x: 4, y: -2 } : { x: -4, y: 2 },
        showEffect: true,
        moveStep: 4,
        phaseId: "growl-impact1",
        phaseName: "4. 3겹 원 최대 확장 & 번개 최고조",
      },
      // 5. 원/번개 잔향 소멸 (퍼지면서 투명해지는 페이드아웃 시작)
      {
        ...baseFrame,
        delay: 120,
        pOffset: isP ? { x: 2, y: 0 } : { x: 0, y: 0 },
        eOffset: isP ? { x: -4, y: 1 } : { x: 4, y: -1 },
        showEffect: true,
        moveStep: 5,
        effectProgress: 0.0,
        fadeEffectOnCameraReturn: true,
        phaseId: "growl-fadeout",
        phaseName: "5. 포효 음파 확산 소멸 (페이드아웃 개시)",
      },
      // --- 상대방 공격력 1랭크 하락 디버프 연출 (카메라 중립 복귀 후 재생!) ---
      // 6. 공격력 하락 1단계: 상단에서 파란색 하강 화살표(v) 발생 및 낙하 시작
      {
        ...baseFrame,
        delay: 90,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        statProgress: 0.20,
        afterCameraReturn: true,
        phaseId: "growl-debuff-start",
        phaseName: "6. 공격력 하락 개시 (1차 화살표 낙하)",
      },
      // 7. 공격력 하락 2단계: 1차 화살표 중앙 통과 & 2차 화살표 연쇄 낙하
      {
        ...baseFrame,
        delay: 95,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        statProgress: 0.50,
        afterCameraReturn: true,
        phaseId: "growl-debuff-mid",
        phaseName: "7. 공격력 하락 가속 (중앙 통과)",
      },
      // 8. 공격력 하락 3단계: 화살표 하단 도달 및 2차 파동 통과
      {
        ...baseFrame,
        delay: 95,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        statProgress: 0.78,
        afterCameraReturn: true,
        phaseId: "growl-debuff-cascade",
        phaseName: "8. 공격력 하락 연쇄 (2차 파동)",
      },
      // 9. 공격력 하락 4단계: 화살표 하단 안착 및 소멸
      {
        ...baseFrame,
        delay: 100,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        statProgress: 0.98,
        afterCameraReturn: true,
        phaseId: "growl-debuff-finish",
        phaseName: "9. 공격력 하락 완료 (발밑 소멸)",
      },
      // 10. 복귀 완료
      {
        ...baseFrame,
        delay: 90,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        afterCameraReturn: true,
        phaseId: "growl-finish",
        phaseName: "10. 복귀 완료",
      },
    ];
  },
};
