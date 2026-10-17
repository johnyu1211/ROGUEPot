// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawTormentEffect } from "../../../renderers/moves/gen1/move257_260.js";

/**
 * 259: 트집 (Torment / いちゃもん) - 악 타입 변화 기술
 *
 * 위력: - / 명중: 100 / PP: 15
 * 설명: 상대에게 트집을 잡아서 똑같은 기술을 2회 연속으로 쓸 수 없게 한다.
 *
 * [유저 지정 연출 시퀀스]:
 * 1. [시전 포켓몬 앞에 말풍선 생김]:
 *    - 시전자 입/머리 앞에 만화 말풍선이 팝인 (scale: 0.35 ➔ 1.10 ➔ 1.0)
 * 2. [말풍선 안에 꼬임선 동그랗게 생김]:
 *    - 말풍선 중심에서부터 엉킨 검은 꼬임선이 동그랗게 뭉쳐지며 차오름 (욕설/투덜거림 묘사)
 * 3. [대상포켓몬 빨갛게 변하면서 뽐내기 당했을 때 연출]:
 *    - 카메라가 대상 포켓몬으로 전환/포커싱 (caster_to_target)
 *    - 대상 포켓몬이 분노로 빨갛게 물듦 (30% ➔ 70% ➔ 100% 피크 ➔ 페이드아웃)
 *    - 대상 머리에 화난 빠직(💢) 마크 팝인 & 팽창 맥동 (뽐내기 고증)
 *    - 대상 포켓몬이 분노로 부들부들 좌우 진동
 */
export const tormentMove: BattleMoveAnimation = {
  num: 259,
  key: "torment",
  nameKo: "트집",
  nameEn: "Torment",
  type: "dark",
  category: "status",
  camera: {
    type: "caster_to_target",
    zoom: 1.25,
    delayUntilStep: 2, // Step 1: 시전자 앞 말풍선&꼬임선, Step 2: 대상 뽐내기 분노 연출
    inlineGlideInFrames: 2,
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawTormentEffect(targetCtx, frame, drawCtx);
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
      moveStep: 1,
    };

    // 시전자 오프셋 (수비자는 {0, 0} 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 대상 오프셋 (시전자는 {0, 0} 고정)
    const tOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x, y } : { x: 0, y: 0 },
    });

    // 대상 순수 붉은색 염색 헬퍼 (207 뽐내기 / 버티기 고증 RGBA 오버레이)
    const targetRedHelper = (lvl: number) => {
      const active = lvl > 0.01;
      const alpha = Math.max(0, Math.min(0.85, lvl * 0.85));
      const color = active ? `rgba(220, 20, 40, ${alpha.toFixed(2)})` : null;
      return {
        pTintColor: !isP ? color : undefined,
        eTintColor: isP ? color : undefined,
        targetRedTint: false,
        casterRedTint: false,
        casterRedLevel: 0,
        pRedTint: false,
        eRedTint: false,
      };
    };

    // ========================================================================
    // 빗맞았을 때 (Miss 처리)
    // ========================================================================
    if (isHit === false) {
      return [
        {
          ...baseFrame,
          delay: 80,
          ...cOff(0, -2),
          tormentBubble: { scale: 0.35, alpha: 0.6, scribble: 0.0 },
          phaseId: "torment-miss-bubble-1",
          phaseName: "#1. 시전자 앞 말풍선 출현",
        },
        {
          ...baseFrame,
          delay: 80,
          ...cOff(0, -4),
          tormentBubble: { scale: 1.10, alpha: 1.0, scribble: 0.0 },
          phaseId: "torment-miss-bubble-2",
          phaseName: "#2. 말풍선 팝인",
        },
        {
          ...baseFrame,
          delay: 70,
          ...cOff(0, -2),
          tormentBubble: { scale: 1.00, alpha: 1.0, scribble: 0.20 },
          phaseId: "torment-miss-bubble-3",
          phaseName: "#3. 말풍선 안착 & 꼬임선 시작",
        },
        {
          ...baseFrame,
          delay: 80,
          ...cOff(0, 0),
          tormentBubble: { scale: 1.00, alpha: 1.0, scribble: 0.65 },
          phaseId: "torment-miss-scribble-1",
          phaseName: "#4. 꼬임선 엉킴",
        },
        {
          ...baseFrame,
          delay: 90,
          ...cOff(0, -1),
          tormentBubble: { scale: 1.02, alpha: 1.0, scribble: 1.00 },
          phaseId: "torment-miss-scribble-2",
          phaseName: "#5. 동그란 꼬임선 완성",
        },
        {
          ...baseFrame,
          delay: 80,
          ...cOff(0, 0),
          tormentBubble: { scale: 0.85, alpha: 0.40, scribble: 1.00 },
          phaseId: "torment-miss-fade",
          phaseName: "#6. 말풍선 페이드아웃",
        },
        {
          ...baseFrame,
          delay: 90,
          moveStep: 2,
          ...tOff(0, 0),
          phaseId: "torment-miss-finish",
          phaseName: "#7. 빗맞음 (대상 무반응)",
        },
      ];
    }

    // ========================================================================
    // 명중 시 정규 연출 시퀀스
    // ========================================================================
    return [
      // ----------------------------------------------------------------------
      // Step 1: 시전 포켓몬 앞에 말풍선 생김 > 말풍선 안에 꼬임선 동그랗게 생김
      // ----------------------------------------------------------------------
      // #1. 시전자 앞 말풍선 출현 (Pop-in 시작)
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, -2),
        tormentBubble: { scale: 0.35, alpha: 0.65, scribble: 0.0 },
        phaseId: "torment-bubble-pop",
        phaseName: "#1. 시전자 앞 말풍선 출현",
      },
      // #2. 말풍선 팽창 팝인 (탄성 스케일 1.10x)
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, -4),
        tormentBubble: { scale: 1.10, alpha: 1.0, scribble: 0.0 },
        phaseId: "torment-bubble-expand",
        phaseName: "#2. 말풍선 팽창 팝인",
      },
      // #3. 말풍선 안착 (스케일 1.0) & 꼬임선 태동
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, -2),
        tormentBubble: { scale: 1.00, alpha: 1.0, scribble: 0.12 },
        phaseId: "torment-bubble-settle",
        phaseName: "#3. 말풍선 안착",
      },
      // #4. 말풍선 안에 꼬임선 차오름 (엉킨 선 35%)
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        tormentBubble: { scale: 1.00, alpha: 1.0, scribble: 0.40 },
        phaseId: "torment-scribble-grow-1",
        phaseName: "#4. 꼬임선 동그랗게 차오름 (40%)",
      },
      // #5. 꼬임선 엉킴 심화 (엉킨 선 75%)
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        tormentBubble: { scale: 1.00, alpha: 1.0, scribble: 0.75 },
        phaseId: "torment-scribble-grow-2",
        phaseName: "#5. 꼬임선 엉킴 심화 (75%)",
      },
      // #6. 동그란 꼬임선 완성 & 트집 진동 틱
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, -1),
        tormentBubble: { scale: 1.04, alpha: 1.0, scribble: 1.00 },
        phaseId: "torment-scribble-full",
        phaseName: "#6. 동그란 꼬임선 완성 & 틱",
      },
      // #7. 완성된 트집 말풍선 유지
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        tormentBubble: { scale: 1.00, alpha: 1.0, scribble: 1.00 },
        phaseId: "torment-bubble-hold",
        phaseName: "#7. 트집 말풍선 유지",
      },
      // #8. 말풍선 페이드아웃 시작
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 0),
        tormentBubble: { scale: 0.95, alpha: 0.45, scribble: 1.00 },
        phaseId: "torment-bubble-fade",
        phaseName: "#8. 말풍선 페이드아웃",
      },
      // #9. 말풍선 소산 & 대상으로 시선 전환 준비
      {
        ...baseFrame,
        delay: 60,
        ...cOff(0, 0),
        tormentBubble: { scale: 0.0, alpha: 0.0, scribble: 0.0 },
        phaseId: "torment-transition",
        phaseName: "#9. 대상으로 시선 전환",
      },

      // ----------------------------------------------------------------------
      // Step 2: 대상포켓몬 빨갛게 변하면서 뽐내기 당했을 때 연출
      // ----------------------------------------------------------------------
      // #10. 대상 붉어짐 시작 (버티기 30% 틴트) & 빠직 출현 ('빠직!' 팝인)
      {
        ...baseFrame,
        delay: 80,
        moveStep: 2,
        ...targetRedHelper(0.30),
        ...tOff(-2, 0),
        tormentVein: { scale: 1.45, alpha: 1.0, popProgress: 0.2 },
        phaseId: "torment-target-pop",
        phaseName: "#10. 대상 붉어짐 시작 (30%) & 빠직 출현",
      },
      // #11. 대상 붉어짐 심화 (버티기 70% 틴트) & 빠직 안착
      {
        ...baseFrame,
        delay: 80,
        moveStep: 2,
        ...targetRedHelper(0.70),
        ...tOff(3, 0),
        tormentVein: { scale: 1.00, alpha: 1.0, popProgress: 1.0 },
        phaseId: "torment-target-settle",
        phaseName: "#11. 대상 붉어짐 심화 (70%) & 빠직 안착",
      },
      // #12. 대상 격분 붉어짐 피크 (버티기 100% 피크 틴트) & 빠직 강한 팽창 맥동
      {
        ...baseFrame,
        delay: 90,
        moveStep: 2,
        ...targetRedHelper(1.00),
        ...tOff(-4, 0),
        tormentVein: { scale: 1.35, alpha: 1.0, popProgress: 1.0 },
        phaseId: "torment-target-peak",
        phaseName: "#12. 대상 붉어짐 피크 (100%) & 빠직 팽창 맥동",
      },
      // #13. 대상 분노 진동 (부들부들 떨림) & 빠직 2차 맥동
      {
        ...baseFrame,
        delay: 90,
        moveStep: 2,
        ...targetRedHelper(0.85),
        ...tOff(3, 0),
        tormentVein: { scale: 1.15, alpha: 1.0, popProgress: 1.0 },
        phaseId: "torment-target-pulse",
        phaseName: "#13. 대상 분노 진동 & 빠직 2차 맥동",
      },
      // #14. 분노 절정 & 붉은기 페이드아웃 시작 (버티기 50% 틴트)
      {
        ...baseFrame,
        delay: 80,
        moveStep: 2,
        ...targetRedHelper(0.50),
        ...tOff(-2, 0),
        tormentVein: { scale: 0.90, alpha: 0.65, popProgress: 1.0 },
        phaseId: "torment-target-fade",
        phaseName: "#14. 대상 붉은기 및 빠직 페이드아웃 시작",
      },
      // #15. 대상 진정 & 붉은기 및 빠직 마크 소산 (버티기 15% 틴트)
      {
        ...baseFrame,
        delay: 70,
        moveStep: 2,
        ...targetRedHelper(0.15),
        ...tOff(1, 0),
        tormentVein: { scale: 0.70, alpha: 0.25, popProgress: 1.0 },
        phaseId: "torment-target-soothe",
        phaseName: "#15. 대상 진정 및 빠직 소산",
      },
      // #16. 완전 복귀
      {
        ...baseFrame,
        delay: 70,
        moveStep: 2,
        ...targetRedHelper(0.00),
        ...tOff(0, 0),
        phaseId: "torment-finish",
        phaseName: "#16. 완전 복귀",
      },
    ];
  },
};
