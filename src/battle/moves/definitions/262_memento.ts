// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawMementoBehindEffect,
  drawMementoEffect,
} from "../../../renderers/moves/gen1/move261_264.js";

/**
 * 262: 추억의선물 (Memento / おきみやげ) - 악 타입 변화 기술
 *
 * 위력: - / 명중: 100 / PP: 10 / 상대 공격·특수공격 2랭크 하락 (-2) & 시전자 기절
 * 설명: 자신은 기절하게 되지만 그 대신 상대의 공격과 특수공격을 크게 떨어뜨린다.
 *
 * [유저 지정 연출]:
 * 1. 시전 포켓몬에게서 거대한 타원형 보라 색깔 반투명한, 외곽은 투명한 무언가가 발사돼. 위로, 카메라 위로.
 * 2. 시전 포켓몬의 포켓몬 스프라이트 형태의 게 위로 올라가.
 * 3. 그다음에 적 포켓몬 위에서 적 포켓몬 스프라이트 형태의 보라 색깔 반투명 무언가가 적 포켓몬 스프라이트 안으로 들어가. 서서히.
 */
export const mementoMove: BattleMoveAnimation = {
  num: 262,
  key: "memento",
  nameKo: "추억의선물",
  nameEn: "Memento",
  type: "dark",
  category: "status",
  camera: {
    type: "caster_to_target",
    zoom: 1.32,
    delayUntilStep: 2, // Step 1: 시전자 앞 거대 타원 및 영혼 상공 발사, Step 2: 상대방으로 글라이드인 포커싱 & 영혼 침투
    inlineGlideInFrames: 2,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !(frame.dimAlpha && frame.dimAlpha > 0)) return;
    drawMementoBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawMementoEffect(targetCtx, frame, drawCtx);
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

    // 대상 보라빛 저주 틴트 헬퍼
    const targetPurpleHelper = (lvl: number) => {
      const active = lvl > 0.01;
      const alpha = Math.max(0, Math.min(0.85, lvl * 0.85));
      const color = active ? `rgba(147, 51, 234, ${alpha.toFixed(2)})` : null;
      return {
        pTintColor: !isP ? color : undefined,
        eTintColor: isP ? color : undefined,
      };
    };

    // 시전자 투명도 헬퍼 (영혼 이탈 시 본체 희미해짐)
    const casterAlphaHelper = (alpha: number) => ({
      pAlpha: isP ? alpha : undefined,
      eAlpha: !isP ? alpha : undefined,
    });

    // ========================================================================
    // 빗맞았을 때 (Miss 처리)
    // ========================================================================
    if (isHit === false) {
      return [
        // Step 1: 시전자 보라빛 영혼 형태 상공 쇄도 (구체/글로우 제외)
        {
          ...baseFrame,
          delay: 110,
          dimAlpha: 0.22,
          casterAscendProg: 0.0,
          soulAlpha: 0.70,
          ...cOff(0, 2),
          ...cScale(1.03, 0.97),
          phaseId: "memento-miss-prep",
          phaseName: "#1. 시전자 영혼 실루엣 응축",
        },
        {
          ...baseFrame,
          delay: 100,
          dimAlpha: 0.38,
          casterAscendProg: 0.30,
          soulAlpha: 0.85,
          ...cOff(0, 4),
          ...casterAlphaHelper(0.75),
          phaseId: "memento-miss-launch",
          phaseName: "#2. 시전자 영혼 실루엣 상공 발사",
        },
        {
          ...baseFrame,
          delay: 95,
          dimAlpha: 0.32,
          casterAscendProg: 0.85,
          soulAlpha: 0.50,
          ...casterAlphaHelper(0.45),
          phaseId: "memento-miss-ascend",
          phaseName: "#3. 카메라 위로 사출",
        },
        // Step 2: 상대방 상공에서 하강하나 빗겨나감
        {
          ...baseFrame,
          delay: 110,
          moveStep: 2,
          dimAlpha: 0.25,
          targetDescendProg: 0.35,
          targetSoulAlpha: 0.70,
          ...casterAlphaHelper(0.30),
          phaseId: "memento-miss-descend",
          phaseName: "#4. 상대 상공 출현 및 빗나감",
        },
        {
          ...baseFrame,
          delay: 120,
          moveStep: 2,
          dimAlpha: 0.12,
          targetDescendProg: 0.90,
          targetSoulAlpha: 0.30,
          ...casterAlphaHelper(0.20),
          phaseId: "memento-miss-drift",
          phaseName: "#5. 허공으로 흩어짐",
        },
        // Step 3: 피날레 복귀
        {
          ...baseFrame,
          delay: 130,
          moveStep: 3,
          dimAlpha: 0,
          showEffect: false,
          ...casterAlphaHelper(1.0),
          phaseId: "memento-miss-finish",
          phaseName: "#6. 피날레 복귀",
        },
      ];
    }

    // ========================================================================
    // 명중했을 때 (Hit 처리)
    // ========================================================================
    return [
      // ----------------------------------------------------------------------
      // [Step 1]: 시전 포켓몬의 포켓몬 스프라이트 형태의 게 위로, 카메라 위로 올라감
      //           (보라색 구체 및 글로우 제거 - 순수 보라빛 반투명 실루엣만 쇄도)
      // ----------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 110,
        dimAlpha: 0.22,
        casterAscendProg: 0.0,
        soulAlpha: 0.65,
        ...cOff(0, 2),
        ...cScale(1.03, 0.97),
        phaseId: "memento-gather-energy",
        phaseName: "#1. 시전자 보라빛 영혼 에너지 응축",
      },
      {
        ...baseFrame,
        delay: 115,
        dimAlpha: 0.35,
        casterAscendProg: 0.08,
        soulAlpha: 0.82,
        ...cOff(0, 1),
        ...cScale(1.0, 1.0),
        phaseId: "memento-soul-emerge",
        phaseName: "#2. 시전자 영혼 형태 출현",
      },
      {
        ...baseFrame,
        delay: 95,
        dimAlpha: 0.44,
        casterAscendProg: 0.32,
        soulAlpha: 0.92,
        ...cOff(0, 3),
        ...casterAlphaHelper(0.70),
        phaseId: "memento-launch-surge",
        phaseName: "#3. 시전자 영혼 상공 급속 사출",
      },
      {
        ...baseFrame,
        delay: 90,
        dimAlpha: 0.40,
        casterAscendProg: 0.68,
        soulAlpha: 0.78,
        ...cOff(0, 5),
        ...casterAlphaHelper(0.45),
        phaseId: "memento-sky-pierce",
        phaseName: "#4. 시전자 영혼 형태 상공 쇄도",
      },
      {
        ...baseFrame,
        delay: 95,
        dimAlpha: 0.32,
        casterAscendProg: 1.15,
        soulAlpha: 0.35,
        ...cOff(0, 6),
        ...casterAlphaHelper(0.25),
        phaseId: "memento-ascend-exit",
        phaseName: "#5. 카메라 위로 완전 발사 및 승화",
      },

      // ----------------------------------------------------------------------
      // [Step 2]: 적 포켓몬 위에서 적 포켓몬 스프라이트 형태의 보라 색깔 반투명 무언가가
      //           적 포켓몬 스프라이트 안으로 '서서히' 들어감
      // ----------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 110,
        moveStep: 2,
        dimAlpha: 0.30,
        targetDescendProg: 0.05, // 상공 Y: -142 에서 시작
        targetSoulAlpha: 0.75,
        ...cOff(0, 6),
        ...casterAlphaHelper(0.20),
        ...tOff(0, 0),
        phaseId: "memento-target-appear",
        phaseName: "#6. 적 포켓몬 상공에 보라빛 영혼체 출현",
      },
      {
        ...baseFrame,
        delay: 120,
        moveStep: 2,
        dimAlpha: 0.35,
        targetDescendProg: 0.25, // 서서히 하강 Y: -112
        targetSoulAlpha: 0.80,
        ...cOff(0, 6),
        ...casterAlphaHelper(0.20),
        ...tOff(0, 0),
        phaseId: "memento-target-descend-1",
        phaseName: "#7. 적 포켓몬을 향해 서서히 하강 (1)",
      },
      {
        ...baseFrame,
        delay: 120,
        moveStep: 2,
        dimAlpha: 0.38,
        targetDescendProg: 0.50, // 서서히 하강 Y: -75
        targetSoulAlpha: 0.85,
        ...cOff(0, 6),
        ...casterAlphaHelper(0.20),
        ...tOff(0, 0),
        phaseId: "memento-target-descend-2",
        phaseName: "#8. 적 포켓몬 머리 위 근접 (2)",
      },
      {
        ...baseFrame,
        delay: 125,
        moveStep: 2,
        dimAlpha: 0.40,
        targetDescendProg: 0.75, // 접촉 개시 Y: -37
        targetSoulAlpha: 0.90,
        ...cOff(0, 6),
        ...casterAlphaHelper(0.20),
        ...tOff(0, 0),
        ...targetPurpleHelper(0.30),
        phaseId: "memento-target-descend-3",
        phaseName: "#9. 적 포켓몬 스프라이트 접촉 개시 (3)",
      },
      {
        ...baseFrame,
        delay: 130,
        moveStep: 2,
        dimAlpha: 0.42,
        targetDescendProg: 0.95, // 거의 일치 Y: -7
        targetSoulAlpha: 0.95,
        ...cOff(0, 6),
        ...casterAlphaHelper(0.15),
        ...tOff(0, 1),
        ...targetPurpleHelper(0.55),
        phaseId: "memento-target-enter",
        phaseName: "#10. 적 포켓몬 스프라이트 안으로 침투",
      },
      {
        ...baseFrame,
        delay: 140,
        moveStep: 2,
        dimAlpha: 0.46,
        targetDescendProg: 1.0, // 완전 일치 Y: 0 (적 포켓몬 스프라이트 안으로 완전 들어감!)
        targetSoulAlpha: 0.98,
        ...cOff(0, 6),
        ...casterAlphaHelper(0.10),
        ...tOff(isP ? 2 : -2, 0),
        ...targetPurpleHelper(0.85),
        phaseId: "memento-curse-bind",
        phaseName: "#11. 영혼체 완전 융합 및 저주 각인",
      },

      // ----------------------------------------------------------------------
      // [Step 3]: 저주 각인 완료, 공격/특수공격 2랭크 하락 디버프 (-2) & 시전자 기절 확정
      // ----------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 130,
        moveStep: 3,
        dimAlpha: 0.36,
        statProgress: 0.25,
        statDirection: "down",
        curseFadeProg: 0.25,
        ...cOff(0, 6),
        ...casterAlphaHelper(0.0),
        ...tOff(0, 2),
        ...targetPurpleHelper(0.60),
        // 시전자 HP 0 (쓰러짐)
        playerHp: isP ? 0 : playerHp,
        enemyHp: !isP ? 0 : enemyHp,
        phaseId: "memento-stat-down-1",
        phaseName: "#12. 공격·특수공격 2랭크 급락 (-2)",
      },
      {
        ...baseFrame,
        delay: 130,
        moveStep: 3,
        dimAlpha: 0.25,
        statProgress: 0.60,
        statDirection: "down",
        curseFadeProg: 0.60,
        ...cOff(0, 6),
        ...casterAlphaHelper(0.0),
        ...tOff(0, 1),
        ...targetPurpleHelper(0.35),
        playerHp: isP ? 0 : playerHp,
        enemyHp: !isP ? 0 : enemyHp,
        phaseId: "memento-stat-down-2",
        phaseName: "#13. 저주 침식 안정화",
      },
      {
        ...baseFrame,
        delay: 130,
        moveStep: 3,
        dimAlpha: 0.12,
        statProgress: 0.95,
        statDirection: "down",
        curseFadeProg: 0.90,
        ...cOff(0, 6),
        ...casterAlphaHelper(0.0),
        ...tOff(0, 0),
        ...targetPurpleHelper(0.15),
        playerHp: isP ? 0 : playerHp,
        enemyHp: !isP ? 0 : enemyHp,
        phaseId: "memento-stat-down-3",
        phaseName: "#14. 스탯 하락 마무리",
      },
      {
        ...baseFrame,
        delay: 140,
        moveStep: 3,
        dimAlpha: 0,
        statProgress: undefined,
        showEffect: false,
        ...cOff(0, 6),
        ...casterAlphaHelper(0.0),
        ...tOff(0, 0),
        playerHp: isP ? 0 : playerHp,
        enemyHp: !isP ? 0 : enemyHp,
        phaseId: "memento-finish",
        phaseName: "#15. 피날레 복귀 및 시전자 쓰러짐",
      },
    ];
  },
};
