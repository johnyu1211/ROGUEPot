// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawSweetKissEffect } from "../../../renderers/moves/gen1/move185_188.js";

/**
 * 186: 천사의키스 (Sweet Kiss) - 페어리 타입 변화 기술 (상대 100% 혼란)
 *
 * 위력: — / 명중: 75 / PP: 10 / 카테고리: 변화기
 * 설명: 천사처럼 귀엽게 키스하여 상대를 혼란시킨다.
 *
 * [연출 타임라인]:
 * Step 1: 시전자 전방 갸웃 & 깡총 도약하며 천사의 날개 하트 생성
 * Step 2: 천사의 날개 하트가 파닥거리며 아크 궤적으로 비행 & 별가루 트레일 (카메라 대상 포커싱 줌인)
 * Step 3: 대상 면전에 쪽! 핑크 하트 키스 마크 착탄 + 양 볼 수줍은 홍조 + 퐁퐁 터지는 핑크 하트
 * Step 4: 혼란(Confusion) 상태 돌입: 머리 위 3D 궤도 회전 노란 별무리(★ ★ ★) + 대상 비틀거림
 * Step 5: 피날레 및 원위치 안착
 */
export const sweetKissMove: BattleMoveAnimation = {
  num: 186,
  key: "sweet-kiss",
  nameKo: "천사의키스",
  nameEn: "Sweet Kiss",
  type: "fairy",
  category: "status",
  camera: {
    type: "target",
    zoom: 1.34,
    delayUntilStep: 2,
    inlineGlideInFrames: 2,
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawSweetKissEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      cameraZoom: 1.0,
      showEffect: true,
    };

    // 시전자 전용 오프셋 헬퍼 (수비자는 { 0, 0 } 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 피격자(대상) 전용 리액션 오프셋 헬퍼 (시전자는 { 0, 0 } 고정)
    const tOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 시전자 스케일 헬퍼
    const cScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : { x: 1.0, y: 1.0 },
      eScale: !isP ? { x, y } : { x: 1.0, y: 1.0 },
    });

    // 대상 회전 헬퍼
    const tRot = (rot: number) => ({
      pRot: !isP ? rot : 0,
      eRot: isP ? rot : 0,
    });

    // 빗맞았을 때 (Miss 처리)
    if (!isHit) {
      return [
        {
          ...baseFrame,
          delay: 75,
          moveStep: 1,
          ...cOff(6, -4),
          ...cScale(1.05, 0.95),
          heartScale: 0.8,
          heartAlpha: 0.9,
          heartProgress: 0.15,
          phaseId: "sweet-kiss-miss-1",
          phaseName: "#1. 천사 하트 발사 준비",
        },
        {
          ...baseFrame,
          delay: 80,
          moveStep: 2,
          ...cOff(2, -1),
          ...tOff(0, -18), // 대상 회피 도약
          heartProgress: 1.25,
          heartAlpha: 0.75,
          phaseId: "sweet-kiss-miss-2",
          phaseName: "#2. 대상 회피 도약",
        },
        {
          ...baseFrame,
          delay: 70,
          moveStep: 2,
          ...cOff(0, 0),
          ...tOff(0, -4),
          heartProgress: 1.5,
          heartAlpha: 0.0,
          phaseId: "sweet-kiss-miss-3",
          phaseName: "#3. 빗나감",
        },
        {
          ...baseFrame,
          delay: 60,
          moveStep: 3,
          ...cOff(0, 0),
          ...tOff(0, 0),
          phaseId: "sweet-kiss-miss-4",
          phaseName: "#4. 정위치 복귀",
        },
      ];
    }

    // 명중 시 정규 애니메이션 (총 12프레임, 약 900ms)
    return [
      // ======================================================================
      // Phase 1: 시전자 귀엽게 깡총 도약 & 천사의 날개 하트 생성 (Step 1)
      // ======================================================================
      {
        ...baseFrame,
        delay: 75,
        moveStep: 1,
        ...cOff(6, -4),
        ...cScale(1.05, 0.95),
        effectProgress: 0.4,
        heartScale: 0.65,
        heartAlpha: 0.85,
        phaseId: "sweet-kiss-windup-1",
        phaseName: "#1. 시전자 갸웃 & 천사 하트 생성",
      },
      {
        ...baseFrame,
        delay: 75,
        moveStep: 1,
        ...cOff(12, -8),
        ...cScale(1.08, 0.92),
        effectProgress: 1.0,
        heartScale: 1.0,
        heartAlpha: 1.0,
        phaseId: "sweet-kiss-windup-2",
        phaseName: "#1. 시전자 깡총 도약 & 천사 하트 완연",
      },

      // ======================================================================
      // Phase 2: 천사의 날개 하트 포물선 아크 비행 & 날갯짓 (Step 2)
      // ======================================================================
      {
        ...baseFrame,
        delay: 75,
        moveStep: 2,
        ...cOff(6, -4),
        ...cScale(1.02, 0.98),
        heartProgress: 0.30,
        heartScale: 1.05,
        wingFlap: -0.40,
        phaseId: "sweet-kiss-fly-1",
        phaseName: "#2. 천사 날갯짓 파닥이며 상승 비행",
      },
      {
        ...baseFrame,
        delay: 75,
        moveStep: 2,
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        heartProgress: 0.65,
        heartScale: 1.10,
        wingFlap: 0.42,
        phaseId: "sweet-kiss-fly-2",
        phaseName: "#2. 포물선 정점 통과 & 반짝이 트레일",
      },
      {
        ...baseFrame,
        delay: 75,
        moveStep: 2,
        ...cOff(0, 0),
        heartProgress: 0.98,
        heartScale: 1.15,
        wingFlap: -0.25,
        phaseId: "sweet-kiss-fly-3",
        phaseName: "#2. 대상 면전 급강하 착탄 직전",
      },

      // ======================================================================
      // Phase 3: 대상 면전에 쪽! 키스 마크 착탄 & 하트 팝핑 (Step 3)
      // ======================================================================
      {
        ...baseFrame,
        delay: 80,
        moveStep: 3,
        ...tOff(-6, 2),
        kissMarkAlpha: 1.0,
        kissMarkScale: 1.25,
        heartsProgress: 0.25,
        phaseId: "sweet-kiss-impact-1",
        phaseName: "#3. 대상 얼굴에 쪽! 키스 마크 착탄 & 흠칫",
      },
      {
        ...baseFrame,
        delay: 80,
        moveStep: 3,
        ...tOff(-3, 1),
        kissMarkAlpha: 0.65,
        kissMarkScale: 1.15,
        heartsProgress: 0.65,
        phaseId: "sweet-kiss-impact-2",
        phaseName: "#3. 핑크 하트 퐁퐁 비산 & 양 볼 홍조",
      },
      {
        ...baseFrame,
        delay: 70,
        moveStep: 3,
        ...tOff(0, 0),
        kissMarkAlpha: 0.0,
        heartsProgress: 1.0,
        heartsAlpha: 0.0,
        phaseId: "sweet-kiss-impact-3",
        phaseName: "#3. 키스 마크 & 하트 파티클 완전 종료",
      },

      // ======================================================================
      // Phase 4: 혼란(Confusion) - 파티클 완전히 끝난 후 머리 위 3D 궤도 회전 별무리 (Step 4)
      // ======================================================================
      {
        ...baseFrame,
        delay: 80,
        moveStep: 4,
        ...tOff(4, 0),
        ...tRot(0.04),
        kissMarkAlpha: 0.0,
        heartsProgress: 0,
        confusionProgress: 0.22,
        phaseId: "sweet-kiss-confuse-1",
        phaseName: "#4. 혼란의 별무리 출현 & 우측 비틀림",
      },
      {
        ...baseFrame,
        delay: 80,
        moveStep: 4,
        ...tOff(-4, 0),
        ...tRot(-0.04),
        kissMarkAlpha: 0.0,
        heartsProgress: 0,
        confusionProgress: 0.50,
        phaseId: "sweet-kiss-confuse-2",
        phaseName: "#4. 별무리 3D 공전 가속 & 좌측 비틀림",
      },
      {
        ...baseFrame,
        delay: 80,
        moveStep: 4,
        ...tOff(3, 0),
        ...tRot(0.03),
        confusionProgress: 0.80,
        phaseId: "sweet-kiss-confuse-3",
        phaseName: "#4. 멍한 표정으로 비틀비틀",
      },
      {
        ...baseFrame,
        delay: 80,
        moveStep: 4,
        ...tOff(-2, 0),
        ...tRot(-0.02),
        confusionProgress: 1.05,
        phaseId: "sweet-kiss-confuse-4",
        phaseName: "#4. 별무리 2회전 통과 & 서서히 감속",
      },

      // ======================================================================
      // Phase 5: 혼란 안착 & 원위치 복귀 (Step 5)
      // ======================================================================
      {
        ...baseFrame,
        delay: 80,
        moveStep: 4, // 카메라 부드러운 줌아웃을 위해 step 4 유지
        ...tOff(0, 0),
        ...tRot(0),
        confusionProgress: 1.22,
        phaseId: "sweet-kiss-finish",
        phaseName: "#5. 혼란 안착 및 원위치 복귀",
      },
    ];
  },
};
