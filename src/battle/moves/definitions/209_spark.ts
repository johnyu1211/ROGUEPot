// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawSparkEffect } from "../../../renderers/moves/gen1/move209_212.js";

/**
 * 209: 스파크 (Spark) - 전기 타입 물리 기술
 *
 * 위력: 65 / 명중: 100 / PP: 20 / 30% 마비
 * 설명: 전기를 둘러 상대에게 돌진하여 공격한다. 마비 상태로 만들 때가 있다.
 *
 * [유저 지정 연출 규격]:
 * 1. 화면 노랗게 암전
 * 2. 바깥에는 노란색 안쪽은 흰색 (외곽 그라데이션, border 없음) 전기 구체
 *    점점 서서히 커짐 (커지면서 전기를 뿜어냄)
 *    (검정 외곽 투명이 좀 많은 연기 그림자)
 *    (전기는 끝이 뾰족한 찌지직을 뿜어냄)
 * 3. 그리고 돌진 박치기
 * 4. 대상 포켓몬에게도 동일한 찌지직 뿜어냄
 */
export const sparkMove: BattleMoveAnimation = {
  num: 209,
  key: "spark",
  nameKo: "스파크",
  nameEn: "Spark",
  type: "electric",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && (!frame.sparkDarkness || frame.sparkDarkness <= 0.001)) return;
    drawSparkEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      cameraZoom: 1.35,
      drawEnemyOnTop: !isP, // 시전포켓몬이 항상 대상포켓몬 Z축 위에 오도록 보장
    };

    // 시전자 및 피격자 오프셋 (절대 혼선 방지 완벽 격리)
    const battlerOffsets = (
      casterX: number,
      casterY: number,
      targetX: number = 0,
      targetY: number = 0
    ) => ({
      pOffset: isP ? { x: casterX, y: casterY } : { x: -targetX, y: targetY },
      eOffset: isP ? { x: targetX, y: targetY } : { x: -casterX, y: -casterY },
    });

    // 시전자 및 피격자 스케일 탄성
    const cScale = (
      casterSx: number,
      casterSy: number,
      targetSx: number = 1.0,
      targetSy: number = 1.0
    ) => ({
      pScale: isP ? { x: casterSx, y: casterSy } : { x: targetSx, y: targetSy },
      eScale: isP ? { x: targetSx, y: targetSy } : { x: casterSx, y: casterSy },
    });

    // 시전자 회전 틸트
    const cRot = (rot: number) => ({
      pRot: isP ? rot : 0,
      eRot: !isP ? -rot : 0,
    });

    // =========================================================================
    // 1. Miss (!isHit) 시퀀스: 대상이 위로 껑충 회피 도약하고, 시전자는 허공 돌파 빗나감!
    // =========================================================================
    if (!isHit) {
      return [
        {
          ...baseFrame,
          delay: 80,
          ...battlerOffsets(-8, 3, 0, 0),
          ...cScale(1.10, 0.90),
          ...cRot(-0.04),
          showEffect: true,
          moveStep: 1,
          sparkDarkness: 0.35,
          sparkSphereRadius: 22,
          sparkCrackleCount: 3,
          effectProgress: 0.30,
          phaseId: "spark-miss-charge-1",
          phaseName: "1. 노란 암전 & 구체 형성",
        },
        {
          ...baseFrame,
          delay: 80,
          ...battlerOffsets(-14, 5, 0, 0),
          ...cScale(1.15, 0.85),
          ...cRot(-0.07),
          showEffect: true,
          moveStep: 1,
          sparkDarkness: 0.50,
          sparkSphereRadius: 38,
          sparkCrackleCount: 5,
          effectProgress: 0.70,
          phaseId: "spark-miss-charge-2",
          phaseName: "2. 구체 성장 & 찌지직 뿜어냄",
        },
        {
          ...baseFrame,
          delay: 75,
          ...battlerOffsets(-18, 6, 0, 0),
          ...cScale(1.18, 0.82),
          ...cRot(-0.09),
          showEffect: true,
          moveStep: 1,
          sparkDarkness: 0.60,
          sparkSphereRadius: 52,
          sparkCrackleCount: 7,
          effectProgress: 1.00,
          phaseId: "spark-miss-charge-3",
          phaseName: "3. 최대 충전",
        },
        {
          ...baseFrame,
          delay: 60,
          ...battlerOffsets(65, -38, 0, 0),
          ...cScale(0.86, 1.15),
          ...cRot(0.10),
          showEffect: true,
          moveStep: 2,
          sparkDarkness: 0.60,
          sparkSphereRadius: 66,
          effectProgress: 0.35,
          phaseId: "spark-miss-dash-1",
          phaseName: "4. 돌진 발진 (스파크 팽창)",
        },
        {
          ...baseFrame,
          delay: 60,
          ...battlerOffsets(150, -88, 0, 0),
          ...cScale(0.82, 1.20),
          ...cRot(0.12),
          showEffect: true,
          moveStep: 2,
          sparkDarkness: 0.60,
          sparkSphereRadius: 32,
          effectProgress: 0.70,
          phaseId: "spark-miss-dash-2",
          phaseName: "5. 마하 질주 (스파크 수축)",
        },
        {
          ...baseFrame,
          delay: 60,
          ...battlerOffsets(215, -128, 0, 0),
          ...cScale(0.80, 1.22),
          ...cRot(0.14),
          showEffect: true,
          moveStep: 2,
          sparkDarkness: 0.60,
          sparkSphereRadius: 62,
          effectProgress: 1.00,
          phaseId: "spark-miss-dash-3",
          phaseName: "6. 돌진 쇄도 (스파크 재팽창)",
        },
        // ★ [빗나감]: 대상이 공중으로 회피 도약하고 시전자는 대상 아래 허공을 그대로 돌파!
        {
          ...baseFrame,
          delay: 90,
          ...battlerOffsets(295, -155, 0, -36),
          ...cScale(0.78, 1.25, 0.88, 1.18),
          ...cRot(0.16),
          showEffect: true,
          moveStep: 2,
          sparkDarkness: 0.35,
          sparkSphereRadius: 36,
          effectProgress: 0.30,
          phaseId: "spark-miss-overtake",
          phaseName: "7. 대상 회피 도약 & 빗나감",
        },
        // ★ [급제동]: 대상 착지, 시전자 감속 미끄러짐
        {
          ...baseFrame,
          delay: 85,
          ...battlerOffsets(140, -80, 0, 0),
          ...cScale(1.15, 0.88, 1.0, 1.0),
          ...cRot(0.00),
          showEffect: true,
          moveStep: 4,
          sparkDarkness: 0.15,
          effectProgress: 0.60,
          phaseId: "spark-miss-skid",
          phaseName: "8. 급제동 감속 & 스파크 소멸",
        },
        {
          ...baseFrame,
          delay: 90,
          ...battlerOffsets(0, 0, 0, 0),
          ...cScale(1.0, 1.0),
          ...cRot(0.00),
          showEffect: true,
          moveStep: 4,
          sparkDarkness: 0.00,
          effectProgress: 1.00,
          fadeEffectOnCameraReturn: true,
          phaseId: "spark-miss-complete",
          phaseName: "9. 복귀 완료",
        },
      ];
    }

    // =========================================================================
    // 2. Hit (isHit) 메인 시퀀스
    // =========================================================================
    return [
      // 1. 노란 암전 시작 & 구체 형성 & 연기 그림자 & 찌지직 방출
      {
        ...baseFrame,
        delay: 80,
        ...battlerOffsets(-8, 3, 0, 0),
        ...cScale(1.10, 0.90),
        ...cRot(-0.04),
        showEffect: true,
        moveStep: 1,
        sparkDarkness: 0.35,
        sparkSphereRadius: 22,
        sparkCrackleCount: 3,
        effectProgress: 0.30,
        phaseId: "spark-charge-1",
        phaseName: "1. 노란 암전 & 전기 구체 형성",
      },
      // 2. 구체 성장 & 연기 그림자 & 찌지직 뿜어냄
      {
        ...baseFrame,
        delay: 80,
        ...battlerOffsets(-14, 5, 0, 0),
        ...cScale(1.15, 0.85),
        ...cRot(-0.07),
        showEffect: true,
        moveStep: 1,
        sparkDarkness: 0.50,
        sparkSphereRadius: 38,
        sparkCrackleCount: 5,
        effectProgress: 0.70,
        phaseId: "spark-charge-2",
        phaseName: "2. 구체 성장 & 찌지직 뿜어냄",
      },
      // 3. 최대 크기 도달 & 완전 충전
      {
        ...baseFrame,
        delay: 75,
        ...battlerOffsets(-18, 6, 0, 0),
        ...cScale(1.18, 0.82),
        ...cRot(-0.09),
        showEffect: true,
        moveStep: 1,
        sparkDarkness: 0.60,
        sparkSphereRadius: 52,
        sparkCrackleCount: 7,
        effectProgress: 1.00,
        phaseId: "spark-charge-3",
        phaseName: "3. 구체 최대 크기 & 완전 충전",
      },
      // 4. 돌진 발진 & 스파크 팽창
      {
        ...baseFrame,
        delay: 60,
        ...battlerOffsets(65, -38, 0, 0),
        ...cScale(0.86, 1.15),
        ...cRot(0.10),
        showEffect: true,
        moveStep: 2,
        sparkDarkness: 0.60,
        sparkSphereRadius: 66,
        effectProgress: 0.35,
        phaseId: "spark-dash-1",
        phaseName: "4. 돌진 발진 (스파크 팽창)",
      },
      // 5. 마하 질주 & 스파크 압축 수축 (커졌다가 작아짐)
      {
        ...baseFrame,
        delay: 60,
        ...battlerOffsets(150, -88, 0, 0),
        ...cScale(0.82, 1.20),
        ...cRot(0.12),
        showEffect: true,
        moveStep: 2,
        sparkDarkness: 0.60,
        sparkSphereRadius: 32,
        effectProgress: 0.70,
        phaseId: "spark-dash-2",
        phaseName: "5. 마하 질주 (스파크 수축)",
      },
      // 6. 돌진 쇄도 & 스파크 재팽창
      {
        ...baseFrame,
        delay: 60,
        ...battlerOffsets(215, -128, 0, 0),
        ...cScale(0.80, 1.22),
        ...cRot(0.14),
        showEffect: true,
        moveStep: 2,
        sparkDarkness: 0.60,
        sparkSphereRadius: 62,
        effectProgress: 1.00,
        phaseId: "spark-dash-3",
        phaseName: "6. 돌진 쇄도 (스파크 재팽창)",
      },
      // 7. 돌진 박치기 격돌 & 팍! 하고 터지는 고에너지 파열 폭발 & 암전 1차 섬광 깜빡! & 화면 흔들림
      // ★ [유저 요청] 시전포켓몬이 완전히 대상포켓몬 Z축 중앙 위로 올라옴 (250, -150)
      {
        ...baseFrame,
        delay: 80,
        ...battlerOffsets(250, -150, 24, -8),
        ...cScale(1.26, 0.80, 0.84, 1.18),
        ...cRot(0.02),
        cameraPan: isP ? { x: 5, y: -3 } : { x: -5, y: -3 },
        showEffect: true,
        hitFlash: true,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 3,
        sparkDarkness: 0.16,
        effectProgress: 0.20,
        phaseId: "spark-impact-1",
        phaseName: "7. 박치기 격돌 & 파열 폭발 (팍!)",
      },
      // 8. 감전 지속 & 대상에게 동일한 찌지직 작렬 & 암전 복귀 & 역방향 쉐이크!
      {
        ...baseFrame,
        delay: 80,
        ...battlerOffsets(235, -142, -14, 5),
        ...cScale(1.14, 0.88, 1.12, 0.90),
        ...cRot(0.00),
        cameraPan: isP ? { x: -3, y: 2 } : { x: 3, y: 2 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 3,
        sparkDarkness: 0.65,
        effectProgress: 0.60,
        phaseId: "spark-impact-2",
        phaseName: "8. 대상 전신 찌지직 작렬 & 암전 복귀",
      },
      // 9. 피격자 탄성 반동 & 충격파 확산 & 암전 2차 섬광 깜빡!
      {
        ...baseFrame,
        delay: 80,
        ...battlerOffsets(190, -115, 8, -2),
        ...cScale(1.05, 0.95, 0.95, 1.05),
        ...cRot(0.00),
        cameraPan: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 3,
        sparkDarkness: 0.22,
        effectProgress: 1.00,
        phaseId: "spark-impact-3",
        phaseName: "9. 충격파 확산 & 암전 2차 깜빡임",
      },
      // 10. 반동 착지 & 대상 잔여 찌지직 & 암전 서서히 페이드
      {
        ...baseFrame,
        delay: 90,
        ...battlerOffsets(70, -42, 0, 0),
        ...cScale(1.0, 1.0, 1.0, 1.0),
        ...cRot(0.00),
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 4,
        sparkDarkness: 0.35,
        effectProgress: 0.50,
        phaseId: "spark-recoil",
        phaseName: "10. 착지 & 잔여 찌지직 페이드",
      },
      // 11. 정위치 복귀 완료 & 암전 해제
      {
        ...baseFrame,
        delay: 90,
        ...battlerOffsets(0, 0, 0, 0),
        ...cScale(1.0, 1.0, 1.0, 1.0),
        ...cRot(0.00),
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 4,
        sparkDarkness: 0.05,
        effectProgress: 1.00,
        fadeEffectOnCameraReturn: true,
        phaseId: "spark-complete",
        phaseName: "11. 정위치 복귀 완료",
      },
    ];
  },
};
