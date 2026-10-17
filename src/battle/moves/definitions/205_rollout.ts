// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawRolloutEffect } from "../../../renderers/moves/gen1/move205_208.js";

/**
 * 205: 구르기 (Rollout) - 바위 타입 물리 기술
 *
 * [유저 지정 연출]:
 * - 시전 포켓몬 살짝 납작해지고(Squash)
 * - 세로도 줄어서 작아진 상태로 웅크림(Curl)
 * - 앞으로 z축 회전 (앞면 뒷면 앞면 뒷면)
 * - 이 상태로 동그란 형상과 함께 앞으로 돌진해서
 * - 대상 스프라이트 타격하고 지나가고
 * - 굴러서 왼쪽 아래 카메라 밖에서 제자리로 복귀
 */
export const rolloutMove: BattleMoveAnimation = {
  num: 205,
  key: "rollout",
  nameKo: "구르기",
  nameEn: "Rollout",
  type: "rock",
  category: "physical",
  camera: {
    type: "target",
    zoom: 1.25,
    delayUntilStep: 2, // 시전 준비(웅크리기 & 제자리 회전)는 중립(1.0x) 조망 후 돌진 시 포커싱
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && frame.showRolloutSphere === false) return;
    drawRolloutEffect(targetCtx, frame, drawCtx);
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
      drawEnemyOnTop: !isP, // 적이 시전할 때는 적이 돌진하므로 위에 그려짐
    };

    // 시전자 및 피격자 오프셋 (절대 혼선 방지 완벽 격리)
    const battlerOffsets = (
      casterX: number,
      casterY: number,
      targetX: number = 0,
      targetY: number = 0
    ) => ({
      pOffset: isP ? { x: casterX, y: casterY } : { x: targetX, y: targetY },
      eOffset: isP ? { x: targetX, y: targetY } : { x: -casterX, y: -casterY },
    });

    // 전면 vs 후면 스프라이트 전환 (앞면 뒷면 롤링 회전)
    // showFront: true => 전면(카메라 방향), false => 후면(등 뒤 방향)
    const cSpriteFace = (showFront: boolean) => ({
      usePlayerFront: isP ? showFront : false,
      useEnemyBack: !isP ? !showFront : false,
    });

    // 시전자 및 피격자 스케일 탄성 (시전자 웅크림 및 피격자 납작해짐)
    const cScale = (x: number, y: number, targetSx: number = 1.0, targetSy: number = 1.0) => ({
      pScale: isP ? { x, y } : { x: targetSx, y: targetSy },
      eScale: isP ? { x: targetSx, y: targetSy } : { x, y },
    });

    // 전방 Z축 구르기 회전 (앞으로 덤블링 롤링)
    const cRot = (rot: number) => ({
      pRot: isP ? rot : 0,
      eRot: !isP ? -rot : 0,
      pRotCenter: true,
      eRotCenter: true,
      rotateFromCenter: true,
      pRotPivotY: 36,
      eRotPivotY: 26,
    });

    return [
      // ======================================================================
      // 1. [웅크리기 준비]: 살짝 납작해지고(Squash) -> 세로도 줄어 작아진 구체로 웅크림
      // ======================================================================
      {
        ...baseFrame,
        delay: 85,
        ...battlerOffsets(-5, 4),
        ...cScale(1.18, 0.82),
        ...cRot(0),
        ...cSpriteFace(false),
        showRolloutSphere: false,
        rolloutDustIntensity: 0.2,
        phaseId: "rollout-squash",
        phaseName: "1. 시전자 납작해짐 (Squash)",
      },
      {
        ...baseFrame,
        delay: 85,
        ...battlerOffsets(-10, 8),
        ...cScale(0.72, 0.68),
        ...cRot(0),
        ...cSpriteFace(false),
        showRolloutSphere: true,
        rolloutSphereRadius: isP ? 36 : 28,
        rolloutSpinAngle: 0,
        rolloutDustIntensity: 0.5,
        phaseId: "rollout-curl",
        phaseName: "2. 작아진 구체로 웅크림 (Curl)",
      },

      // ======================================================================
      // 2. [제자리 Z축 회전]: 앞으로 z축 회전 (앞면 뒷면 앞면 뒷면)
      // ======================================================================
      {
        ...baseFrame,
        delay: 65,
        ...battlerOffsets(-8, 6),
        ...cScale(0.72, 0.68),
        ...cRot(Math.PI * 0.5),
        ...cSpriteFace(true), // 앞면
        showRolloutSphere: true,
        rolloutSphereRadius: isP ? 36 : 28,
        rolloutSpinAngle: Math.PI * 0.5,
        rolloutDustIntensity: 0.7,
        phaseId: "rollout-spin-1-front",
        phaseName: "3. Z축 회전 1차 [앞면]",
      },
      {
        ...baseFrame,
        delay: 65,
        ...battlerOffsets(-4, 3),
        ...cScale(0.72, 0.68),
        ...cRot(Math.PI * 1.0),
        ...cSpriteFace(false), // 뒷면
        showRolloutSphere: true,
        rolloutSphereRadius: isP ? 36 : 28,
        rolloutSpinAngle: Math.PI * 1.0,
        rolloutDustIntensity: 0.8,
        phaseId: "rollout-spin-2-back",
        phaseName: "4. Z축 회전 2차 [뒷면]",
      },
      {
        ...baseFrame,
        delay: 65,
        ...battlerOffsets(4, 0),
        ...cScale(0.72, 0.68),
        ...cRot(Math.PI * 1.5),
        ...cSpriteFace(true), // 앞면
        showRolloutSphere: true,
        rolloutSphereRadius: isP ? 36 : 28,
        rolloutSpinAngle: Math.PI * 1.5,
        rolloutDustIntensity: 0.9,
        phaseId: "rollout-spin-3-front",
        phaseName: "5. Z축 회전 3차 [앞면]",
      },
      {
        ...baseFrame,
        delay: 60,
        ...battlerOffsets(18, -8),
        ...cScale(0.72, 0.68),
        ...cRot(Math.PI * 2.0),
        ...cSpriteFace(false), // 뒷면
        showRolloutSphere: true,
        rolloutSphereRadius: isP ? 36 : 28,
        rolloutSpinAngle: Math.PI * 2.0,
        rolloutDustIntensity: 1.0,
        phaseId: "rollout-spin-4-back",
        phaseName: "6. Z축 회전 4차 [뒷면] & 돌진 시동",
      },

      // ======================================================================
      // 3. [전방 돌진 & 타격]: 동그란 형상과 함께 앞으로 돌진해서 대상 스프라이트 타격
      // ======================================================================
      {
        ...baseFrame,
        delay: 50,
        moveStep: 2,
        ...battlerOffsets(95, -45),
        ...cScale(0.72, 0.68),
        ...cRot(Math.PI * 2.8),
        ...cSpriteFace(true), // 앞면
        showRolloutSphere: true,
        rolloutSphereRadius: isP ? 37 : 29,
        rolloutSpinAngle: Math.PI * 2.8,
        rolloutTrail: true,
        rolloutTrailOffset: { x: -35, y: 16 },
        rolloutDustIntensity: 1.0,
        phaseId: "rollout-dash-1",
        phaseName: "7. 전방 고속 돌진 1 [앞면]",
      },
      {
        ...baseFrame,
        delay: 50,
        moveStep: 2,
        ...battlerOffsets(185, -88),
        ...cScale(0.72, 0.68),
        ...cRot(Math.PI * 3.6),
        ...cSpriteFace(false), // 뒷면
        showRolloutSphere: true,
        rolloutSphereRadius: isP ? 38 : 30,
        rolloutSpinAngle: Math.PI * 3.6,
        rolloutTrail: true,
        rolloutTrailOffset: { x: -35, y: 16 },
        rolloutDustIntensity: 1.0,
        phaseId: "rollout-dash-2",
        phaseName: "8. 전방 고속 돌진 2 [뒷면]",
      },
      {
        ...baseFrame,
        delay: 75,
        moveStep: 2,
        ...battlerOffsets(245, -116, isHit ? 14 : 0, isHit ? -6 : 0),
        ...cScale(0.76, 0.64, isHit ? 1.22 : 1.0, isHit ? 0.78 : 1.0),
        ...cRot(Math.PI * 4.4),
        ...cSpriteFace(true), // 앞면
        showRolloutSphere: true,
        rolloutSphereRadius: isP ? 38 : 30,
        rolloutSpinAngle: Math.PI * 4.4,
        hitFlash: false,
        hitProgress: isHit ? 0.35 : 0,
        targetTopDarkGradient: isHit,
        targetTopDarkAlpha: 0.85,
        phaseId: "rollout-impact-hit",
        phaseName: "9. 대상 스프라이트 직격 타격 & 피격자 납작해짐",
      },
      {
        ...baseFrame,
        delay: 70,
        moveStep: 2,
        ...battlerOffsets(268, -127, isHit ? 20 : 0, isHit ? -9 : 0),
        ...cScale(0.72, 0.68, isHit ? 1.25 : 1.0, isHit ? 0.75 : 1.0),
        ...cRot(Math.PI * 5.0),
        ...cSpriteFace(false), // 뒷면
        showRolloutSphere: true,
        rolloutSphereRadius: isP ? 38 : 30,
        rolloutSpinAngle: Math.PI * 5.0,
        hitProgress: isHit ? 0.75 : 0,
        targetTopDarkGradient: isHit,
        targetTopDarkAlpha: 0.95,
        phaseId: "rollout-impact-blast",
        phaseName: "10. 임팩트 최대 넉백 & 납작 압축",
      },

      // ======================================================================
      // 4. [관통 돌파]: 대상을 지나치고 화면 우상단 밖으로 돌파
      // ======================================================================
      {
        ...baseFrame,
        delay: 55,
        moveStep: 2,
        ...battlerOffsets(320, -150, isHit ? 10 : 0, isHit ? -4 : 0),
        ...cScale(0.72, 0.68, isHit ? 1.18 : 1.0, isHit ? 0.84 : 1.0),
        ...cRot(Math.PI * 5.8),
        ...cSpriteFace(true), // 앞면
        showRolloutSphere: true,
        rolloutSphereRadius: isP ? 38 : 30,
        rolloutSpinAngle: Math.PI * 5.8,
        rolloutTrail: true,
        rolloutTrailOffset: { x: -35, y: 16 },
        hitProgress: isHit ? 1.0 : 0,
        targetTopDarkGradient: isHit,
        targetTopDarkAlpha: 0.70,
        phaseId: "rollout-pass-through",
        phaseName: "11. 대상 관통 돌파 (지나가고) [앞면]",
      },
      {
        ...baseFrame,
        delay: 55,
        moveStep: 2,
        ...battlerOffsets(395, -185, isHit ? 4 : 0, isHit ? -2 : 0),
        ...cScale(0.72, 0.68, isHit ? 1.08 : 1.0, isHit ? 0.94 : 1.0),
        ...cRot(Math.PI * 6.6),
        ...cSpriteFace(false), // 뒷면
        showRolloutSphere: true,
        rolloutSphereRadius: isP ? 37 : 29,
        rolloutSpinAngle: Math.PI * 6.6,
        rolloutTrail: true,
        targetTopDarkGradient: isHit,
        targetTopDarkAlpha: 0.35,
        phaseId: "rollout-exit-screen",
        phaseName: "12. 화면 우상단 밖으로 돌파 [뒷면]",
      },
      {
        ...baseFrame,
        delay: 50,
        moveStep: 3,
        ...battlerOffsets(480, -225, 0, 0),
        ...cScale(0.72, 0.68),
        ...cRot(Math.PI * 7.4),
        ...cSpriteFace(true),
        showRolloutSphere: true,
        rolloutSpinAngle: Math.PI * 7.4,
        phaseId: "rollout-offscreen-loop",
        phaseName: "13. 화면 밖 선회 루프",
      },

      // ======================================================================
      // 5. [선회 복귀]: 굴러서 왼쪽 아래 카메라 밖에서 제자리로
      // ======================================================================
      {
        ...baseFrame,
        delay: 60,
        moveStep: 3,
        ...battlerOffsets(-190, 88, 0, 0),
        ...cScale(0.72, 0.68),
        ...cRot(Math.PI * 8.2),
        ...cSpriteFace(false), // 뒷면
        showRolloutSphere: true,
        rolloutSphereRadius: isP ? 36 : 28,
        rolloutSpinAngle: Math.PI * 8.2,
        rolloutTrail: true,
        rolloutTrailOffset: { x: -30, y: 14 },
        rolloutDustIntensity: 0.9,
        phaseId: "rollout-reenter-left-1",
        phaseName: "14. 왼쪽 아래 카메라 밖 재진입 [뒷면]",
      },
      {
        ...baseFrame,
        delay: 60,
        moveStep: 3,
        ...battlerOffsets(-125, 58, 0, 0),
        ...cScale(0.72, 0.68),
        ...cRot(Math.PI * 9.0),
        ...cSpriteFace(true), // 앞면
        showRolloutSphere: true,
        rolloutSphereRadius: isP ? 36 : 28,
        rolloutSpinAngle: Math.PI * 9.0,
        rolloutTrail: true,
        rolloutTrailOffset: { x: -28, y: 13 },
        rolloutDustIntensity: 0.8,
        phaseId: "rollout-reenter-left-2",
        phaseName: "15. 왼쪽 발판 진입 회전 [앞면]",
      },
      {
        ...baseFrame,
        delay: 65,
        moveStep: 3,
        ...battlerOffsets(-65, 30, 0, 0),
        ...cScale(0.72, 0.68),
        ...cRot(Math.PI * 9.8),
        ...cSpriteFace(false), // 뒷면
        showRolloutSphere: true,
        rolloutSphereRadius: isP ? 36 : 28,
        rolloutSpinAngle: Math.PI * 9.8,
        rolloutDustIntensity: 0.7,
        phaseId: "rollout-reenter-left-3",
        phaseName: "16. 발판 안착 감속 [뒷면]",
      },
      {
        ...baseFrame,
        delay: 70,
        moveStep: 3,
        ...battlerOffsets(-18, 8, 0, 0),
        ...cScale(0.75, 0.70),
        ...cRot(Math.PI * 10.4),
        ...cSpriteFace(true), // 앞면
        showRolloutSphere: true,
        rolloutSphereRadius: isP ? 36 : 28,
        rolloutSpinAngle: Math.PI * 10.4,
        rolloutDustIntensity: 0.5,
        phaseId: "rollout-reenter-stop",
        phaseName: "17. 제자리 정지 [앞면]",
      },

      // ======================================================================
      // 6. [복귀 완료 & 웅크림 해제]: 제자리로 복귀 후 웅크림 풀고 안정화
      // ======================================================================
      {
        ...baseFrame,
        delay: 85,
        moveStep: 4,
        ...battlerOffsets(0, -6, 0, 0),
        ...cScale(0.90, 1.15),
        ...cRot(0),
        ...cSpriteFace(false), // 기본 후면 복귀
        showRolloutSphere: true,
        uncurlProgress: 0.45,
        phaseId: "rollout-uncurl-pop",
        phaseName: "18. 제자리 복귀 웅크림 해제 (Uncurl)",
      },
      {
        ...baseFrame,
        delay: 85,
        moveStep: 4,
        ...battlerOffsets(0, 2, 0, 0),
        ...cScale(1.05, 0.96),
        ...cRot(0),
        ...cSpriteFace(false),
        showRolloutSphere: true,
        uncurlProgress: 0.85,
        phaseId: "rollout-settle",
        phaseName: "19. 지면 안착 & 구체 소멸",
      },
      {
        ...baseFrame,
        delay: 100,
        moveStep: 4,
        ...battlerOffsets(0, 0, 0, 0),
        ...cScale(1.0, 1.0),
        ...cRot(0),
        ...cSpriteFace(false),
        showRolloutSphere: false,
        showEffect: false,
        phaseId: "rollout-finish",
        phaseName: "20. 정위치 복귀 완료",
      },
    ];
  },
};
