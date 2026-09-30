// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawSnoreEffect, drawSnoreBehindEffect } from "../../../renderers/moves/gen1/move173_176.js";

/**
 * 173: 코골기 (Snore) - 노말 타입 특수 공격기 (잠듦 상태 전용, 30% 확률로 풀죽음)
 *
 * 위력: 50 / 명중: 100 / PP: 15 / 접촉 판정: X
 * 설명: 잠자고 있을 때만 쓸 수 있다. 시끄러운 소리로 공격한다. 상대를 풀죽게 만들 때가 있다.
 *
 * [연출 기승전결 시퀀스]:
 * 1. Step 1: 수면 들숨 & 파란빛 암전 시작 (Inhale & Blue Dimming - 240ms)
 *    - 화면이 살짝 파란빛어두운 나이트 분위기로 잦아들며 시전자가 들숨을 들이쉼 (사전 소리 없음)
 * 2. Step 2: 3D 원추형 반투명 파장 초고속 전진 사출 (3D Conical Wave Launch - 240ms)
 *    - 시전자 전방으로 반투명 3D 파장(네온 블루 림 / 바이올렛 바디 / 투명 중심) 사출
 * 3. Step 3: 상대방 면전 3D 파장 관통 직격 (Target Concussion Impact - 255ms)
 *    - 상대 면전에서 순수 3D 원추형 파장이 감싸며 관통 (타격 플래시 없음)
 * 4. Step 4: 소산 및 전방 관통 (Wave Dissipation - 255ms)
 *    - 잔여 3D 파장이 전방 너머로 관통 소산되며 암전이 서서히 걷힘
 * 5. Step 5: 시전자 태평한 단잠 복귀 & 페이드아웃 (Peaceful Snooze Return - 170ms)
 *    - 암전이 완전히 걷히고, 시전자는 평온한 단잠에 복귀하며 카메라 원위치 복귀
 */
export const snoreMove: BattleMoveAnimation = {
  num: 173,
  key: "snore",
  nameKo: "코골기",
  nameEn: "Snore",
  type: "normal",
  category: "special",
  camera: {
    type: "caster_to_target",
    zoom: 1.30,
    delayUntilStep: 2, // Step 1: 시전자 수면 포커싱, Step 2부터 상대방 포커싱
    inlineGlideInFrames: 2,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawSnoreBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawSnoreEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      pRot: 0,
      eRot: 0,
    };

    // 시전자 오프셋 (시전자만 정확히 이동, 수비자는 절대적으로 {0, 0} 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 시전자 스케일
    const cScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    // 시전자 회전 (수면 중 갸웃거림)
    const cRot = (rad: number) => ({
      pRot: isP ? rad : 0,
      eRot: !isP ? -rad : 0,
    });

    // 수비자(피격자) 오프셋
    const defOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    return [
      // =======================================================================
      // Step 1: 수면 들숨 & 살짝 파란빛어두운 암전 시작 (240ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 2),
        ...cScale(1.04, 0.96),
        ...cRot(0.04),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 1,
        effectProgress: 0.35,
        phaseId: "snore-inhale-1",
        phaseName: "1. 수면 들숨 & 파란빛 암전 시작",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(-2, 3),
        ...cScale(1.08, 0.92),
        ...cRot(0.07),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 1,
        effectProgress: 0.70,
        phaseId: "snore-inhale-2",
        phaseName: "1. 깊은 수면 호흡 & 암전 심화",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(-3, 4),
        ...cScale(1.12, 0.88),
        ...cRot(0.09),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 1,
        effectProgress: 1.00,
        phaseId: "snore-inhale-3",
        phaseName: "1. 가슴 팽창 및 코골이 전조",
      },

      // =======================================================================
      // Step 2: 3D 반투명 파장 초고속 전진 사출 (240ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 80,
        ...cOff(5, -2),
        ...cScale(0.92, 1.08),
        ...cRot(-0.04),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.35,
        phaseId: "snore-launch-1",
        phaseName: "2. 3D 반투명 파장 사출",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(3, -1),
        ...cScale(0.96, 1.04),
        ...cRot(-0.02),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.70,
        phaseId: "snore-launch-2",
        phaseName: "2. 3D 원추형 링 쇄도",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(1, 0),
        ...cScale(1.0, 1.0),
        ...cRot(0),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 2,
        effectProgress: 1.00,
        phaseId: "snore-launch-3",
        phaseName: "2. 3D 파장 폭풍 표적 쇄도",
      },

      // =======================================================================
      // Step 3: 상대방 면전 3D 파장 관통 직격 (255ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 85,
        hitFlash: false,
        ...cOff(0, 0),
        ...defOff(4, -1),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.30,
        phaseId: "snore-impact-1",
        phaseName: "3. 상대 면전 3D 반투명 파장 관통",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...defOff(-3, 2),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.65,
        phaseId: "snore-impact-2",
        phaseName: "3. 3D 원추형 파장 세례",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...defOff(2, -1),
        showEffect: true,
        moveStep: 3,
        effectProgress: 1.00,
        phaseId: "snore-impact-3",
        phaseName: "3. 3D 파장 폭풍 대상 포위",
      },

      // =======================================================================
      // Step 4: 대상을 통과하여 전방으로 소산 (255ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...defOff(-2, 1),
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.30,
        phaseId: "snore-flinch-1",
        phaseName: "4. 3D 파장 전방 관통",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...defOff(1, 0),
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.65,
        phaseId: "snore-flinch-2",
        phaseName: "4. 3D 파장 전방 너머로 이동",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 4,
        effectProgress: 1.00,
        phaseId: "snore-flinch-3",
        phaseName: "4. 3D 파장 부드러운 소산",
      },

      // =======================================================================
      // Step 5: 시전자 태평한 단잠 복귀 & 페이드아웃 (170ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 1),
        ...cScale(1.02, 0.98),
        ...cRot(0.03),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 5,
        effectProgress: 0.45,
        phaseId: "snore-snooze-1",
        phaseName: "5. 시전자 평화로운 단잠 안착",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...cRot(0.04),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 5,
        effectProgress: 0.95,
        fadeEffectOnCameraReturn: true,
        phaseId: "snore-snooze-2",
        phaseName: "5. 평온한 수면 안착 & 카메라 복귀",
      },
    ];
  },
};
