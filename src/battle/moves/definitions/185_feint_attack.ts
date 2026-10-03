// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawFeintAttackEffect } from "../../../renderers/moves/gen1/move185_188.js";

/**
 * 185: 속여때리기 (Feint Attack) - 악 타입 물리 공격기 (위력 60, 필중기)
 *
 * [유저 연출 지시]:
 * 1. 시전포켓몬이 빙글빙글돎 (2D 스프라이트가 X와 Y축 기준으로)
 * 2. 돌면서 투명해지면서 화면 암전 (반투명검정)
 * 3. > 타격이펙트 > (작은 마하펀치 타격(주먹없이)
 * 4. (흰색 동그라미가 퍼지는게 아닌 동그라미를 그리면서)
 */
export const feintAttackMove: BattleMoveAnimation = {
  num: 185,
  key: "feint-attack",
  nameKo: "속여때리기",
  nameEn: "Feint Attack",
  type: "dark",
  category: "physical",
  camera: {
    type: "caster_to_target",
    zoom: 1.35,
    focalRatio: 1.0, // 대상 포켓몬 정중앙 100% 록온
    delayUntilStep: 2, // Step 1: 시전자 회전 & 암전 포커싱, Step 2부터 적 포커싱
    inlineGlideInFrames: 2,
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawFeintAttackEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    // 시전자 위치 오프셋
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 시전자 스케일
    const cScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : { x: 1.0, y: 1.0 },
      eScale: !isP ? { x, y } : { x: 1.0, y: 1.0 },
    });

    // 시전자 투명도
    const cAlpha = (alpha: number) => ({
      pAlpha: isP ? alpha : 1.0,
      eAlpha: !isP ? alpha : 1.0,
    });

    // 피격자 위치 오프셋
    const tOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 시전자 숨김 플래그
    const hideAttacker = (hidden: boolean) => ({
      hidePlayer: isP ? hidden : false,
      hideEnemy: !isP ? hidden : false,
    });

    return [
      // ======================================================================
      // Phase 1. 시전포켓몬이 X/Y축을 기준으로 원을 그리며 빙글빙글 돎 & 투명해지며 화면 암전 (Step 1)
      // ======================================================================
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, -12),
        ...cAlpha(1.0),
        blackFadeAlpha: 0.10,
        showEffect: false,
        moveStep: 1,
        phaseId: "feint-orbit-1",
        phaseName: "#1. 시전자 원 궤도 선회 시동 & 서서히 암전",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(18, -6),
        ...cAlpha(0.85),
        blackFadeAlpha: 0.22,
        showEffect: false,
        moveStep: 1,
        phaseId: "feint-orbit-2",
        phaseName: "#1. 우상단 궤도 이동 & 서서히 투명화",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(18, 6),
        ...cAlpha(0.70),
        blackFadeAlpha: 0.38,
        showEffect: false,
        moveStep: 1,
        phaseId: "feint-orbit-3",
        phaseName: "#1. 우하단 궤도 이동 & 투명화",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(0, 12),
        ...cAlpha(0.55),
        blackFadeAlpha: 0.52,
        showEffect: false,
        moveStep: 1,
        phaseId: "feint-orbit-4",
        phaseName: "#1. 하단 통과 & 암전 심화",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(-18, 6),
        ...cAlpha(0.40),
        blackFadeAlpha: 0.65,
        showEffect: false,
        moveStep: 1,
        phaseId: "feint-orbit-5",
        phaseName: "#1. 좌하단 궤도 선회 가속",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(-18, -6),
        ...cAlpha(0.25),
        blackFadeAlpha: 0.65,
        showEffect: false,
        moveStep: 1,
        phaseId: "feint-orbit-6",
        phaseName: "#1. 1바퀴 선회 완료 & 깊은 투명화",
      },
      {
        ...baseFrame,
        delay: 60,
        ...cOff(0, -12),
        ...cAlpha(0.12),
        blackFadeAlpha: 0.65,
        showEffect: false,
        moveStep: 1,
        phaseId: "feint-orbit-7",
        phaseName: "#1. 최종 암전 & 소멸 직전",
      },
      {
        ...baseFrame,
        delay: 60,
        ...cOff(0, 0),
        ...cAlpha(0.0),
        ...hideAttacker(true),
        blackFadeAlpha: 0.65,
        showEffect: false,
        moveStep: 1,
        phaseId: "feint-vanish",
        phaseName: "#1. 시전자 완전 투명화 & 어둠 속 잠입",
      },

      // ======================================================================
      // Phase 2. 적 포커싱 & 암전 속 기습 록온 (Step 2)
      // ======================================================================
      {
        ...baseFrame,
        delay: 75,
        ...hideAttacker(true),
        blackFadeAlpha: 0.65,
        showEffect: false,
        moveStep: 2,
        phaseId: "feint-target-focus",
        phaseName: "#2. 암전 속 상대 포커싱 & 방심한 틈 노림",
      },

      // ======================================================================
      // Phase 3. 타격이펙트: 작은 마하펀치 타격(주먹없이) & 흰색 동그라미들이 원을 그리며 회전 (Step 3)
      // ======================================================================
      {
        ...baseFrame,
        delay: 65,
        hitFlash: isHit,
        ...(isHit ? tOff(10, -4) : tOff(0, 0)),
        showEffect: isHit,
        moveStep: 3,
        hitProgress: 0.10,
        ...hideAttacker(true),
        blackFadeAlpha: 0.65,
        phaseId: "feint-impact-1",
        phaseName: "#3. 작은 순백 섬광 & 타격 직격 (원 그리기 시동)",
      },
      {
        ...baseFrame,
        delay: 65,
        ...(isHit ? tOff(-7, 3) : tOff(0, 0)),
        showEffect: isHit,
        moveStep: 3,
        hitProgress: 0.28,
        ...hideAttacker(true),
        blackFadeAlpha: 0.65,
        phaseId: "feint-impact-2",
        phaseName: "#3. 흰색 알갱이들 원 궤도 1/4 선회",
      },
      {
        ...baseFrame,
        delay: 65,
        ...(isHit ? tOff(-4, 2) : tOff(0, 0)),
        showEffect: isHit,
        moveStep: 3,
        hitProgress: 0.48,
        ...hideAttacker(true),
        blackFadeAlpha: 0.65,
        phaseId: "feint-impact-3",
        phaseName: "#3. 흰색 알갱이들 원 궤도 절반 선회",
      },
      {
        ...baseFrame,
        delay: 65,
        ...(isHit ? tOff(4, -1) : tOff(0, 0)),
        showEffect: isHit,
        moveStep: 3,
        hitProgress: 0.68,
        ...hideAttacker(true),
        blackFadeAlpha: 0.65,
        phaseId: "feint-impact-4",
        phaseName: "#3. 흰색 알갱이들 3/4 지점 통과",
      },
      {
        ...baseFrame,
        delay: 65,
        ...(isHit ? tOff(2, -1) : tOff(0, 0)),
        showEffect: isHit,
        moveStep: 3,
        hitProgress: 0.85,
        ...hideAttacker(true),
        blackFadeAlpha: 0.65,
        phaseId: "feint-impact-5",
        phaseName: "#3. 정확히 1바퀴(360도) 완주 도달",
      },
      {
        ...baseFrame,
        delay: 70,
        ...tOff(0, 0),
        showEffect: isHit,
        moveStep: 3,
        hitProgress: 0.98,
        ...hideAttacker(true),
        blackFadeAlpha: 0.45,
        phaseId: "feint-impact-6",
        phaseName: "#3. 완주 후 축소 소산 & 암전 서서히 해제",
      },

      // ======================================================================
      // Phase 4. 복귀 및 원위치 안정화 (Step 4)
      // ======================================================================
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...cAlpha(0.70),
        ...hideAttacker(false),
        blackFadeAlpha: 0.20,
        showEffect: false,
        moveStep: 4,
        phaseId: "feint-reappear",
        phaseName: "#4. 시전자 재출현",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...cAlpha(1.0),
        ...hideAttacker(false),
        blackFadeAlpha: 0.0,
        showEffect: false,
        moveStep: 4,
        phaseId: "feint-finish",
        phaseName: "#4. 암전 완전 해제 및 원위치 안정화 완료",
      },
    ];
  },
};
