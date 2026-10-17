// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawWillOWispBehindEffect,
  drawWillOWispEffect,
} from "../../../renderers/moves/gen1/move261_264.js";

/**
 * 261: 도깨비불 (Will-O-Wisp / おにび) - 불꽃 타입 변화 기술
 *
 * 위력: - / 명중: 85 / PP: 15 / 상대 100% 화상 (불꽃 타입 면역)
 * 설명: 으스스하고 괴상한 불꽃을 쏘아 상대를 화상 상태로 만든다.
 *
 * [연출 기승전결 시퀀스]:
 * 1. 기(起): 시전자 주변에 으스스한 3개의 푸른 영혼 도깨비불(Ghostly Cyan-Blue Wisps) 점화 및 부유
 * 2. 승(承): 상대를 향해 물결치듯 유려한 사인파 궤적을 그리며 3개의 도깨비불이 쇄도 비행
 * 3. 전(轉): 대상 포켓몬 둘레를 3D 입체 궤도로 휘감으며 나선 수렴 (Behind ↔ Front 교차)
 * 4. 결(結): 대상 중심에서 도깨비불이 합쳐지며 강렬한 청색·주황 화염 대폭발 & 화상(Burn) 상태 부여
 */
export const willOWispMove: BattleMoveAnimation = {
  num: 261,
  key: "will-o-wisp",
  nameKo: "도깨비불",
  nameEn: "Will-O-Wisp",
  type: "fire",
  category: "status",
  camera: {
    type: "caster_to_target",
    zoom: 1.32,
    delayUntilStep: 2, // Step 1: 시전자 앞 점화 및 회전, Step 2: 상대방으로 글라이드인 포커싱 & 발사
    inlineGlideInFrames: 2,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !(frame.dimAlpha && frame.dimAlpha > 0)) return;
    drawWillOWispBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawWillOWispEffect(targetCtx, frame, drawCtx);
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

    // 시전자 오프셋 & 스케일 (수비자는 {0, 0} 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const cScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    // 대상 오프셋 (시전자는 {0, 0} 고정)
    const tOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x, y } : { x: 0, y: 0 },
    });

    // 피격 대상 붉은 화염 틴트 헬퍼
    const targetRedHelper = (lvl: number) => {
      const active = lvl > 0.01;
      const alpha = Math.max(0, Math.min(0.85, lvl * 0.85));
      const color = active ? `rgba(239, 68, 68, ${alpha.toFixed(2)})` : null;
      return {
        pTintColor: !isP ? color : undefined,
        eTintColor: isP ? color : undefined,
      };
    };

    // ========================================================================
    // 빗맞았을 때 (Miss 처리)
    // ========================================================================
    if (isHit === false) {
      return [
        // Step 1: 시전자 앞 도깨비불 점화
        {
          ...baseFrame,
          delay: 100,
          dimAlpha: 0.18,
          wispScale: 0.5,
          wispAlpha: 0.75,
          wispOrbitProg: 0.1,
          wispTime: 0.1,
          ...cOff(-2, 1),
          ...cScale(1.02, 0.98),
          phaseId: "will-o-wisp-miss-ignite-1",
          phaseName: "#1. 시전자 앞 도깨비불 점화",
        },
        {
          ...baseFrame,
          delay: 110,
          dimAlpha: 0.32,
          wispScale: 1.0,
          wispAlpha: 1.0,
          wispOrbitProg: 0.50,
          wispTime: 0.3,
          ...cOff(-5, 2),
          ...cScale(1.05, 0.95),
          phaseId: "will-o-wisp-miss-ignite-2",
          phaseName: "#2. 도깨비불 팽창",
        },
        // Step 2: 빗나가며 빗겨 지나감
        {
          ...baseFrame,
          delay: 85,
          moveStep: 2,
          dimAlpha: 0.25,
          wispFlyProg: 0.35,
          ...cOff(12, -4),
          phaseId: "will-o-wisp-miss-fly-1",
          phaseName: "#3. 발사",
        },
        {
          ...baseFrame,
          delay: 85,
          moveStep: 2,
          dimAlpha: 0.18,
          wispFlyProg: 0.80,
          ...cOff(4, -1),
          phaseId: "will-o-wisp-miss-fly-2",
          phaseName: "#4. 빗맞고 빗겨감",
        },
        {
          ...baseFrame,
          delay: 95,
          moveStep: 2,
          dimAlpha: 0.08,
          wispFlyProg: 1.35,
          ...cOff(0, 0),
          phaseId: "will-o-wisp-miss-fly-3",
          phaseName: "#5. 관통 빗나감",
        },
        // Step 3: 피날레 복귀
        {
          ...baseFrame,
          delay: 90,
          moveStep: 3,
          dimAlpha: 0,
          showEffect: false,
          ...cOff(0, 0),
          phaseId: "will-o-wisp-miss-finish",
          phaseName: "#6. 피날레 복귀",
        },
      ];
    }

    // ========================================================================
    // 명중했을 때 (Hit 처리 - 대상을 관통하며 화상 부여)
    // ========================================================================
    return [
      // ----------------------------------------------------------------------
      // [Step 1]: 시전자 앞 도깨비불 점화 및 부유
      // ----------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 100,
        dimAlpha: 0.18,
        wispScale: 0.45,
        wispAlpha: 0.75,
        wispOrbitProg: 0.08,
        wispTime: 0.1,
        ...cOff(-2, 1),
        ...cScale(1.02, 0.98),
        phaseId: "will-o-wisp-ignite-start",
        phaseName: "#1. 도깨비불 3구 시동 점화",
      },
      {
        ...baseFrame,
        delay: 110,
        dimAlpha: 0.32,
        wispScale: 0.85,
        wispAlpha: 0.95,
        wispOrbitProg: 0.40,
        wispTime: 0.25,
        ...cOff(-6, 2),
        ...cScale(1.05, 0.95),
        phaseId: "will-o-wisp-ignite-swell",
        phaseName: "#2. 보라 불꽃 팽창 및 회전",
      },
      {
        ...baseFrame,
        delay: 110,
        dimAlpha: 0.35,
        wispScale: 1.0,
        wispAlpha: 1.0,
        wispOrbitProg: 0.75,
        wispTime: 0.45,
        ...cOff(-4, 1),
        ...cScale(1.0, 1.0),
        phaseId: "will-o-wisp-ignite-ready",
        phaseName: "#3. 발사 준비 완료",
      },

      // ----------------------------------------------------------------------
      // [Step 2]: 상대를 향해 쇄도하며 관통 통과 (Pass Through & Burn)
      // ----------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 85,
        moveStep: 2,
        dimAlpha: 0.32,
        wispFlyProg: 0.30,
        ...cOff(14, -5),
        phaseId: "will-o-wisp-launch",
        phaseName: "#4. 상대를 향해 도깨비불 사출",
      },
      {
        ...baseFrame,
        delay: 85,
        moveStep: 2,
        dimAlpha: 0.26,
        wispFlyProg: 0.65,
        ...cOff(6, -2),
        phaseId: "will-o-wisp-approach",
        phaseName: "#5. 대상 전방 고속 쇄도",
      },
      {
        // ★ 대상 도달 및 화상 부여
        ...baseFrame,
        delay: 95,
        moveStep: 2,
        hitFlash: false,
        dimAlpha: 0.18,
        wispFlyProg: 0.90,
        ...cOff(0, 0),
        ...tOff(0, 0),
        ...targetRedHelper(0.65),
        enemyStatus: isP ? "brn" : undefined,
        playerStatus: !isP ? "brn" : undefined,
        phaseId: "will-o-wisp-envelop",
        phaseName: "#6. 대상 통과 및 화상 부여",
      },
      {
        // ★ 대상을 관통하여 통과하며 산란
        ...baseFrame,
        delay: 90,
        moveStep: 2,
        hitFlash: false,
        dimAlpha: 0.12,
        wispFlyProg: 1.18,
        ...tOff(0, 0),
        ...targetRedHelper(0.85),
        enemyStatus: isP ? "brn" : undefined,
        playerStatus: !isP ? "brn" : undefined,
        phaseId: "will-o-wisp-pass-through",
        phaseName: "#7. 대상 통과 후 산란",
      },
      {
        // ★ 대상 뒤편으로 빠져나가며 페이드아웃 (Disperse & Fade)
        ...baseFrame,
        delay: 95,
        moveStep: 2,
        dimAlpha: 0.05,
        wispFlyProg: 1.48,
        ...tOff(0, 0),
        ...targetRedHelper(0.55),
        enemyStatus: isP ? "brn" : undefined,
        playerStatus: !isP ? "brn" : undefined,
        phaseId: "will-o-wisp-fly-past",
        phaseName: "#8. 관통 후 허공으로 소멸",
      },

      // ----------------------------------------------------------------------
      // [Step 3]: 대상 잔여 화상 불씨 및 피날레 복귀
      // ----------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 100,
        moveStep: 3,
        dimAlpha: 0,
        wispFadeProg: 0.50,
        ...tOff(0, 0),
        ...targetRedHelper(0.25),
        enemyStatus: isP ? "brn" : undefined,
        playerStatus: !isP ? "brn" : undefined,
        phaseId: "will-o-wisp-afterglow",
        phaseName: "#9. 대상 화상 불씨 안정",
      },
      {
        ...baseFrame,
        delay: 110,
        moveStep: 3,
        dimAlpha: 0,
        wispFadeProg: 1.0,
        ...tOff(0, 0),
        enemyStatus: isP ? "brn" : undefined,
        playerStatus: !isP ? "brn" : undefined,
        phaseId: "will-o-wisp-finish",
        phaseName: "#10. 피날레 복귀",
      },
    ];
  },
};
