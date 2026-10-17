// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawDetectEffect } from "../../../renderers/moves/gen1/move197_200.js";

/**
 * 197: 판별 (Detect) - 격투 타입 변화 기술 (자신을 상대의 공격으로부터 완전히 보호)
 *
 * 위력: — / 명중: — / PP: 5 / 우선도: +4 / 접촉 판정: X
 * 설명: 상대의 공격을 전혀 받지 않는다. 연속으로 쓰면 실패하기 쉽다.
 *
 * [유저 지정 심플 연출]:
 * 1. 암전 & 시전 포켓몬 포커싱 (zoom: 1.35)
 * 2. 시전 포켓몬 흰색 필터 적용 + 눈가에서 십자별 빤짝!
 * 3. 십자별과 백색 필터 부드러운 페이드아웃 및 암전 해제 전장 복귀
 */
export const detectMove: BattleMoveAnimation = {
  num: 197,
  key: "detect",
  nameKo: "판별",
  nameEn: "Detect",
  type: "fighting",
  category: "status",
  camera: { type: "self", zoom: 1.35 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawDetectEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.35,
      cameraTrackAttacker: true,
      isAttackerPlayer: isP,
      drawCasterAboveFade: true,
      pRot: 0,
      eRot: 0,
      hitFlash: false,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
    };

    // 시전자 흰색 필터 헬퍼 (플레이어/상대방 시전자 완벽 대응)
    const casterWhiteHelper = (val: number) => ({
      whiteFilterAlpha: val,
      pWhiteAlpha: isP ? val : 0,
      eWhiteAlpha: !isP ? val : 0,
      pWhite: isP && val >= 0.99,
      eWhite: !isP && val >= 0.99,
    });

    return [
      // #1. 시전자 포커싱 & 전장 암전 시작 (Step 1)
      {
        ...baseFrame,
        delay: 95,
        blackFadeAlpha: 0.40,
        ...casterWhiteHelper(0.25),
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.20,
        phaseId: "detect-dark-in",
        phaseName: "#1. 시전자 포커싱 & 암전 시작",
      },
      // #2. 암전 심화 & 십자별 발현 (Step 1)
      {
        ...baseFrame,
        delay: 100,
        blackFadeAlpha: 0.65,
        ...casterWhiteHelper(0.60),
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.75,
        phaseId: "detect-star-grow",
        phaseName: "#2. 암전 심화 & 십자별 발현",
      },
      // #3. 십자별 빤짝! 플래시 피크 & 시전자 백색 필터 (Step 2)
      {
        ...baseFrame,
        delay: 110,
        blackFadeAlpha: 0.70,
        ...casterWhiteHelper(0.90),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.40,
        phaseId: "detect-star-flash-1",
        phaseName: "#3. 시전자 백색 필터 & 십자별 빤짝! (1)",
      },
      // #4. 십자별 반짝임 피크 유지 & 미니 스파클 (Step 2)
      {
        ...baseFrame,
        delay: 110,
        blackFadeAlpha: 0.70,
        ...casterWhiteHelper(0.85),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.85,
        phaseId: "detect-star-flash-2",
        phaseName: "#4. 십자별 반짝임 피크 유지",
      },
      // #5. 십자별 및 백색 필터 부드러운 페이드아웃 (Step 3)
      {
        ...baseFrame,
        delay: 100,
        blackFadeAlpha: 0.48,
        ...casterWhiteHelper(0.45),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.40,
        phaseId: "detect-fade-out",
        phaseName: "#5. 십자별 및 백색 필터 페이드아웃",
      },
      // #6. 암전 해제 & 전장 서서히 복귀 (Step 3)
      {
        ...baseFrame,
        delay: 95,
        blackFadeAlpha: 0.20,
        ...casterWhiteHelper(0.15),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.80,
        phaseId: "detect-recover",
        phaseName: "#6. 암전 해제 & 전장 복귀",
      },
      // #7. 전장 정상화 & 시전자 기본 자세 안정 복귀 (Step 3)
      {
        ...baseFrame,
        delay: 90,
        blackFadeAlpha: 0.0,
        ...casterWhiteHelper(0.0),
        showEffect: false,
        moveStep: 3,
        effectProgress: 1.0,
        phaseId: "detect-settle",
        phaseName: "#7. 시전자 기본 자세 안정 복귀",
      },
    ];
  },
};
