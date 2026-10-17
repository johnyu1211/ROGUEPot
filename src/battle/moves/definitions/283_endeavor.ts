// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawEndeavorBehindEffect,
  drawEndeavorEffect,
} from "../../../renderers/moves/gen1/move281_284.js";

/**
 * 💦 283: 죽기살기 (Endeavor / がむしゃら) - 노말 타입 물리 공격 기술
 *
 * 위력: - (고정 데미지: 상대 HP - 자신 HP) / 명중: 100 / PP: 5 / 접촉: O
 * 설명: 상대의 HP가 자신의 HP와 같아지도록 데미지를 준다. 자신의 HP가 상대보다 많거나 같으면 실패한다.
 *
 * [연출 시퀀스 (객기 263 기반)]:
 * 1. 아래로 납작 / 세로로 길어졌다를 반복(2회 스쿼시&스트레치) 및 최대 도움닫기 웅크림
 *    (이때 시전자에게서 3D 포물선 궤적의 타원형 땀방울이 사방으로 튐)
 * 2. 전방 고속 쇄도 및 스피드 스트림
 * 3. 몸통박치기 정면 격돌 (순백 섬광 코어 + 8각 스타버스트 + 충격파 링 + 레트로 별 스파크)
 */
export const endeavorMove: BattleMoveAnimation = {
  num: 283,
  key: "endeavor",
  nameKo: "죽기살기",
  nameEn: "Endeavor",
  type: "normal",
  category: "physical",
  camera: {
    type: "caster_to_target",
    zoom: 1.30,
    delayUntilStep: 2, // Step 1: 시전자 웅크림/늘어남 반복 포커싱, Step 2+: 적 포켓몬으로 글라이드인 타격
    inlineGlideInFrames: 1,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawEndeavorBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawEndeavorEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const startEnemyHp = a.enemyHpBefore ?? enemyHp;
    const startPlayerHp = a.playerHpBefore ?? playerHp;
    const endEnemyHp = a.enemyHpAfter ?? enemyHp;
    const endPlayerHp = a.playerHpAfter ?? playerHp;

    const baseFrame = {
      enemyHp: startEnemyHp,
      playerHp: startPlayerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      cameraZoom: 1.30,
      showEffect: true,
      showBehindEffect: true,
    };

    // 시전자 전용 오프셋
    const cOff = (x: number, y: number) =>
      isP ? { pOffset: { x, y } } : { eOffset: { x: -x, y: -y } };

    // 피격자 전용 오프셋
    const cTargetOff = (x: number, y: number) =>
      isP ? { eOffset: { x, y } } : { pOffset: { x: -x, y: -y } };

    // 시전자 스케일 및 틸트 (스쿼시 & 스트레치)
    const cTransform = (scaleX: number, scaleY: number, rot: number = 0) => ({
      pScale: isP ? { x: scaleX, y: scaleY } : undefined,
      eScale: !isP ? { x: scaleX, y: scaleY } : undefined,
      pRot: isP ? rot : 0,
      eRot: !isP ? -rot : 0,
    });

    // ========================================================================
    // 빗맞았을 때 / 실패 시 (Miss 처리)
    // ========================================================================
    if (isHit === false) {
      return [
        // [1차 찌그러지기 & 1차 땀방울 웨이브]
        {
          ...baseFrame,
          delay: 80,
          ...cOff(0, 5),
          ...cTargetOff(0, 0),
          ...cTransform(1.28, 0.72, 0),
          moveStep: 1,
          sweatWave: 1,
          sweatIntensity: 1.0,
          sweatT: 0.16,
          phaseId: "endeavor-w1-squash-1",
          phaseName: "1. [1차] 아래로 납작 (1회차 웅크림)",
        },
        {
          ...baseFrame,
          delay: 80,
          ...cOff(0, -9),
          ...cTargetOff(0, 0),
          ...cTransform(0.74, 1.28, 0),
          moveStep: 1,
          sweatWave: 1,
          sweatIntensity: 1.0,
          sweatT: 0.45,
          phaseId: "endeavor-w1-stretch-1",
          phaseName: "2. [1차] 세로로 길어짐 (1회차 긴장)",
        },
        {
          ...baseFrame,
          delay: 80,
          ...cOff(-2, 7),
          ...cTargetOff(0, 0),
          ...cTransform(1.32, 0.68, 0),
          moveStep: 1,
          sweatWave: 1,
          sweatIntensity: 1.0,
          sweatT: 0.75,
          phaseId: "endeavor-w1-squash-2",
          phaseName: "3. [1차] 아래로 납작 (2회차 웅크림)",
        },
        {
          ...baseFrame,
          delay: 80,
          ...cOff(-1, -11),
          ...cTargetOff(0, 0),
          ...cTransform(0.70, 1.32, 0),
          moveStep: 1,
          sweatWave: 1,
          sweatIntensity: 1.0,
          sweatT: 0.96,
          phaseId: "endeavor-w1-stretch-2",
          phaseName: "4. [1차] 세로로 길어짐 (2회차 긴장)",
        },
        // [2차 더 격한 찌그러지기 & 2차 맹렬한 땀방울 웨이브]
        {
          ...baseFrame,
          delay: 75,
          ...cOff(-3, 10),
          ...cTargetOff(0, 0),
          ...cTransform(1.48, 0.54, -0.03),
          moveStep: 1,
          sweatWave: 2,
          sweatIntensity: 1.40,
          sweatT: 0.15,
          phaseId: "endeavor-w2-squash-1",
          phaseName: "5. [2차 격렬] 아래로 강하게 납작",
        },
        {
          ...baseFrame,
          delay: 75,
          ...cOff(-1, -16),
          ...cTargetOff(0, 0),
          ...cTransform(0.58, 1.46, 0.03),
          moveStep: 1,
          sweatWave: 2,
          sweatIntensity: 1.40,
          sweatT: 0.40,
          phaseId: "endeavor-w2-stretch-1",
          phaseName: "6. [2차 격렬] 세로로 강하게 길어짐",
        },
        {
          ...baseFrame,
          delay: 75,
          ...cOff(-5, 13),
          ...cTargetOff(0, 0),
          ...cTransform(1.56, 0.48, -0.04),
          moveStep: 1,
          sweatWave: 2,
          sweatIntensity: 1.40,
          sweatT: 0.66,
          phaseId: "endeavor-w2-squash-2",
          phaseName: "7. [2차 격렬] 아래로 극한 납작",
        },
        {
          ...baseFrame,
          delay: 75,
          ...cOff(-2, -19),
          ...cTargetOff(0, 0),
          ...cTransform(0.54, 1.54, 0.04),
          moveStep: 1,
          sweatWave: 2,
          sweatIntensity: 1.40,
          sweatT: 0.86,
          phaseId: "endeavor-w2-stretch-2",
          phaseName: "8. [2차 격렬] 세로로 극한 길어짐",
        },
        {
          ...baseFrame,
          delay: 85,
          ...cOff(-16, 10),
          ...cTargetOff(0, 0),
          ...cTransform(1.50, 0.52, -0.06),
          moveStep: 1,
          sweatWave: 2,
          sweatIntensity: 1.40,
          sweatT: 0.98,
          phaseId: "endeavor-windup-crouch",
          phaseName: "9. 최대 도움닫기 웅크림",
        },
        // 전방 고속 쇄도
        {
          ...baseFrame,
          delay: 75,
          ...cOff(46, -17),
          ...cTargetOff(0, 0),
          ...cTransform(0.85, 1.18, 0.12),
          moveStep: 2,
          effectProgress: 0.50,
          phaseId: "endeavor-dash",
          phaseName: "10. 전방 고속 쇄도",
        },
        // 빗나감 (상대 회피 및 헛침)
        {
          ...baseFrame,
          delay: 90,
          ...cOff(76, -26),
          ...cTargetOff(0, -18),
          ...cTransform(1.10, 0.90, 0.08),
          showEffect: false,
          moveStep: 3,
          phaseId: "endeavor-miss-overshoot",
          phaseName: "11. 공격 빗나감 & 허공 돌파",
        },
        // 제자리 복귀
        {
          ...baseFrame,
          delay: 95,
          ...cOff(0, 0),
          ...cTargetOff(0, 0),
          ...cTransform(1.0, 1.0, 0),
          showEffect: false,
          showBehindEffect: false,
          moveStep: 4,
          phaseId: "endeavor-recover",
          phaseName: "12. 착지 및 자세 회복",
        },
      ];
    }

    // ========================================================================
    // 명중 시 (Hit 처리)
    // ========================================================================
    return [
      // ----------------------------------------------------------------------
      // [1차 찌그러지기 & 1차 땀방울 웨이브]
      // ----------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 5),
        ...cTargetOff(0, 0),
        ...cTransform(1.28, 0.72, 0),
        moveStep: 1,
        sweatWave: 1,
        sweatIntensity: 1.0,
        sweatT: 0.16,
        phaseId: "endeavor-w1-squash-1",
        phaseName: "1. [1차] 아래로 납작 (1회차 웅크림)",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, -9),
        ...cTargetOff(0, 0),
        ...cTransform(0.74, 1.28, 0),
        moveStep: 1,
        sweatWave: 1,
        sweatIntensity: 1.0,
        sweatT: 0.45,
        phaseId: "endeavor-w1-stretch-1",
        phaseName: "2. [1차] 세로로 길어짐 (1회차 긴장)",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(-2, 7),
        ...cTargetOff(0, 0),
        ...cTransform(1.32, 0.68, 0),
        moveStep: 1,
        sweatWave: 1,
        sweatIntensity: 1.0,
        sweatT: 0.75,
        phaseId: "endeavor-w1-squash-2",
        phaseName: "3. [1차] 아래로 납작 (2회차 웅크림)",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(-1, -11),
        ...cTargetOff(0, 0),
        ...cTransform(0.70, 1.32, 0),
        moveStep: 1,
        sweatWave: 1,
        sweatIntensity: 1.0,
        sweatT: 0.96,
        phaseId: "endeavor-w1-stretch-2",
        phaseName: "4. [1차] 세로로 길어짐 (2회차 긴장)",
      },
      // ----------------------------------------------------------------------
      // [2차 더 격한 찌그러지기 & 2차 맹렬한 땀방울 웨이브]
      // ----------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 75,
        ...cOff(-3, 10),
        ...cTargetOff(0, 0),
        ...cTransform(1.48, 0.54, -0.03),
        moveStep: 1,
        sweatWave: 2,
        sweatIntensity: 1.40,
        sweatT: 0.15,
        phaseId: "endeavor-w2-squash-1",
        phaseName: "5. [2차 격렬] 아래로 강하게 납작 (1회차)",
      },
      {
        ...baseFrame,
        delay: 75,
        ...cOff(-1, -16),
        ...cTargetOff(0, 0),
        ...cTransform(0.58, 1.46, 0.03),
        moveStep: 1,
        sweatWave: 2,
        sweatIntensity: 1.40,
        sweatT: 0.40,
        phaseId: "endeavor-w2-stretch-1",
        phaseName: "6. [2차 격렬] 세로로 강하게 길어짐 (1회차)",
      },
      {
        ...baseFrame,
        delay: 75,
        ...cOff(-5, 13),
        ...cTargetOff(0, 0),
        ...cTransform(1.56, 0.48, -0.04),
        moveStep: 1,
        sweatWave: 2,
        sweatIntensity: 1.40,
        sweatT: 0.66,
        phaseId: "endeavor-w2-squash-2",
        phaseName: "7. [2차 격렬] 아래로 극한 납작 (2회차)",
      },
      {
        ...baseFrame,
        delay: 75,
        ...cOff(-2, -19),
        ...cTargetOff(0, 0),
        ...cTransform(0.54, 1.54, 0.04),
        moveStep: 1,
        sweatWave: 2,
        sweatIntensity: 1.40,
        sweatT: 0.86,
        phaseId: "endeavor-w2-stretch-2",
        phaseName: "8. [2차 격렬] 세로로 극한 길어짐 (2회차)",
      },
      // 9. 최대 도움닫기 웅크림 (발밑 흙먼지 팍! 일며 전방 발사 준비)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(-16, 10),
        ...cTargetOff(0, 0),
        ...cTransform(1.50, 0.52, -0.06),
        moveStep: 1,
        sweatWave: 2,
        sweatIntensity: 1.40,
        sweatT: 0.98,
        phaseId: "endeavor-windup-crouch",
        phaseName: "9. 최대 도움닫기 웅크림 & 지면 마찰 먼지",
      },
      // 10. 전방 고속 쇄도 (목표를 향해 마하의 속도로 돌진)
      {
        ...baseFrame,
        delay: 75,
        ...cOff(46, -17),
        ...cTargetOff(0, 0),
        ...cTransform(0.85, 1.18, 0.12),
        moveStep: 2,
        effectProgress: 0.50,
        phaseId: "endeavor-dash",
        phaseName: "10. 전방 고속 쇄도 & 스피드 스트림",
      },
      // ----------------------------------------------------------------------
      // [1타]: 1차 정면 격돌 & 충격파 전개 💥
      // ----------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 65,
        ...cOff(66, -23),
        ...cTargetOff(10, -4),
        ...cTransform(1.20, 0.84, 0.02),
        hitFlash: true,
        enemyHp: Math.round(startEnemyHp + (endEnemyHp - startEnemyHp) * (1 / 3)),
        playerHp: Math.round(startPlayerHp + (endPlayerHp - startPlayerHp) * (1 / 3)),
        moveStep: 3,
        hitIndex: 1,
        effectProgress: 0.20,
        phaseId: "endeavor-hit1-impact",
        phaseName: "7. 1타 몸통박치기 격돌 & 순백 섬광",
      },
      {
        ...baseFrame,
        delay: 70,
        ...cOff(56, -20),
        ...cTargetOff(15, -6),
        ...cTransform(1.08, 0.92, 0.01),
        hitFlash: false,
        enemyHp: Math.round(startEnemyHp + (endEnemyHp - startEnemyHp) * (1 / 3)),
        playerHp: Math.round(startPlayerHp + (endPlayerHp - startPlayerHp) * (1 / 3)),
        moveStep: 3,
        hitIndex: 1,
        effectProgress: 0.68,
        phaseId: "endeavor-hit1-burst",
        phaseName: "8. 1타 충돌 폭발 & 2타 도약",
      },
      // ----------------------------------------------------------------------
      // [2타]: 2차 정면 격돌 & 충격파 전개 💥
      // ----------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 65,
        ...cOff(69, -24),
        ...cTargetOff(12, -5),
        ...cTransform(1.22, 0.82, 0.03),
        hitFlash: true,
        enemyHp: Math.round(startEnemyHp + (endEnemyHp - startEnemyHp) * (2 / 3)),
        playerHp: Math.round(startPlayerHp + (endPlayerHp - startPlayerHp) * (2 / 3)),
        moveStep: 3,
        hitIndex: 2,
        effectProgress: 0.20,
        phaseId: "endeavor-hit2-impact",
        phaseName: "9. 2타 몸통박치기 격돌 & 순백 섬광",
      },
      {
        ...baseFrame,
        delay: 70,
        ...cOff(58, -20),
        ...cTargetOff(17, -6),
        ...cTransform(1.08, 0.92, 0.01),
        hitFlash: false,
        enemyHp: Math.round(startEnemyHp + (endEnemyHp - startEnemyHp) * (2 / 3)),
        playerHp: Math.round(startPlayerHp + (endPlayerHp - startPlayerHp) * (2 / 3)),
        moveStep: 3,
        hitIndex: 2,
        effectProgress: 0.68,
        phaseId: "endeavor-hit2-burst",
        phaseName: "10. 2타 충돌 폭발 & 3타 도약",
      },
      // ----------------------------------------------------------------------
      // [3타]: 3차 피니시 정면 격돌 & 충격파 확산 & 반동 💥
      // ----------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 75,
        ...cOff(72, -26),
        ...cTargetOff(14, -5),
        ...cTransform(1.24, 0.80, 0.02),
        hitFlash: true,
        enemyHp: endEnemyHp,
        playerHp: endPlayerHp,
        moveStep: 3,
        hitIndex: 3,
        effectProgress: 0.20,
        phaseId: "endeavor-hit3-impact",
        phaseName: "11. 3타 피니시 격돌 & 순백 섬광",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(70, -25),
        ...cTargetOff(20, -8),
        ...cTransform(1.16, 0.85, 0.02),
        hitFlash: false,
        enemyHp: endEnemyHp,
        playerHp: endPlayerHp,
        moveStep: 3,
        hitIndex: 3,
        effectProgress: 0.65,
        phaseId: "endeavor-hit3-burst",
        phaseName: "12. 3타 충돌 폭발 & 충격파 링 전개",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(42, -15),
        ...cTargetOff(10, -3),
        ...cTransform(0.96, 1.04, -0.03),
        hitFlash: false,
        enemyHp: endEnemyHp,
        playerHp: endPlayerHp,
        moveStep: 3,
        hitIndex: 3,
        effectProgress: 0.95,
        phaseId: "endeavor-recoil",
        phaseName: "13. 충돌 반동 & 충격파 소산",
      },
      // 14. 착지 및 자세 회복
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        ...cTargetOff(0, 0),
        ...cTransform(1.0, 1.0, 0),
        showEffect: false,
        showBehindEffect: false,
        enemyHp: endEnemyHp,
        playerHp: endPlayerHp,
        moveStep: 4,
        phaseId: "endeavor-recover",
        phaseName: "14. 착지 및 자세 회복",
      },
    ];
  },
};
