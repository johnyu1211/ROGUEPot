// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawFacadeBehindEffect,
  drawFacadeEffect,
} from "../../../renderers/moves/gen1/move261_264.js";

/**
 * 263: 객기 (Facade / からげんき) - 노말 타입 물리 기술
 *
 * 위력: 70 (독·맹독·마비·화상 상태 시 140으로 2배 증가 & 화상 물리 공격력 반감 페널티 무시)
 * 명중: 100 / PP: 20
 * 설명: 자신이 독, 마비, 화상 상태일 때 날리면 기술의 위력이 2배가 된다.
 *
 * [유저 지정 연출]:
 * 1. 아래로납작 세로로 길어졌다를 반복하고 (포켓몬 본체가 고통/투지를 불태우며 스쿼시&스트레치 반복)
 * 2. 몸통박치기 이펙트 (전방 고속 쇄도 및 강력한 정면 격돌 몸통박치기)
 * 3. (이때 땀방울이 사방으로 튐) (충돌 순간 사방 360도로 맹렬히 튀어 나가는 물방울/땀방울 파티클)
 */
export const facadeMove: BattleMoveAnimation = {
  num: 263,
  key: "facade",
  nameKo: "객기",
  nameEn: "Facade",
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
    drawFacadeBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawFacadeEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
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
    // 빗맞았을 때 (Miss 처리)
    // ========================================================================
    if (isHit === false) {
      return [
        // 1. 아래로 납작 (1회차)
        {
          ...baseFrame,
          delay: 85,
          ...cOff(0, 5),
          ...cTargetOff(0, 0),
          ...cTransform(1.30, 0.70, 0),
          moveStep: 1,
          sweatT: 0.15,
          phaseId: "facade-squash-1",
          phaseName: "1. 아래로 납작 (1회차 웅크림)",
        },
        // 2. 세로로 길어짐 (1회차)
        {
          ...baseFrame,
          delay: 85,
          ...cOff(0, -9),
          ...cTargetOff(0, 0),
          ...cTransform(0.72, 1.30, 0),
          moveStep: 1,
          sweatT: 0.35,
          phaseId: "facade-stretch-1",
          phaseName: "2. 세로로 길어짐 (1회차 긴장)",
        },
        // 3. 아래로 납작 (2회차)
        {
          ...baseFrame,
          delay: 85,
          ...cOff(-2, 7),
          ...cTargetOff(0, 0),
          ...cTransform(1.35, 0.65, 0),
          moveStep: 1,
          sweatT: 0.58,
          phaseId: "facade-squash-2",
          phaseName: "3. 아래로 납작 (2회차 웅크림)",
        },
        // 4. 세로로 길어짐 (2회차)
        {
          ...baseFrame,
          delay: 85,
          ...cOff(-1, -12),
          ...cTargetOff(0, 0),
          ...cTransform(0.68, 1.35, 0),
          moveStep: 1,
          sweatT: 0.78,
          phaseId: "facade-stretch-2",
          phaseName: "4. 세로로 길어짐 (2회차 긴장)",
        },
        // 5. 최대 도움닫기 웅크림
        {
          ...baseFrame,
          delay: 90,
          ...cOff(-14, 8),
          ...cTargetOff(0, 0),
          ...cTransform(1.38, 0.62, -0.05),
          moveStep: 1,
          sweatT: 0.95,
          phaseId: "facade-windup-crouch",
          phaseName: "5. 최대 도움닫기 웅크림",
        },
        // 6. 전방 고속 쇄도
        {
          ...baseFrame,
          delay: 75,
          ...cOff(46, -17),
          ...cTargetOff(0, 0),
          ...cTransform(0.85, 1.18, 0.12),
          moveStep: 2,
          effectProgress: 0.50,
          phaseId: "facade-dash",
          phaseName: "6. 전방 고속 쇄도",
        },
        // 7. 빗나감 (상대 회피 및 헛침)
        {
          ...baseFrame,
          delay: 90,
          ...cOff(76, -26),
          ...cTargetOff(0, -18),
          ...cTransform(1.10, 0.90, 0.08),
          showEffect: false,
          moveStep: 3,
          phaseId: "facade-miss-overshoot",
          phaseName: "7. 공격 빗나감 & 허공 돌파",
        },
        // 8. 제자리 복귀
        {
          ...baseFrame,
          delay: 95,
          ...cOff(0, 0),
          ...cTargetOff(0, 0),
          ...cTransform(1.0, 1.0, 0),
          showEffect: false,
          moveStep: 4,
          phaseId: "facade-recover",
          phaseName: "8. 착지 및 자세 회복",
        },
      ];
    }

    // ========================================================================
    // 명중 시 (Hit 처리)
    // ========================================================================
    return [
      // 1. 아래로 납작 (1회차 웅크림: 바닥으로 찌그러지며 힘 응축)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 5),
        ...cTargetOff(0, 0),
        ...cTransform(1.30, 0.70, 0),
        moveStep: 1,
        sweatT: 0.15,
        phaseId: "facade-squash-1",
        phaseName: "1. 아래로 납작 (1회차 웅크림)",
      },
      // 2. 세로로 길어짐 (1회차 긴장: 위로 솟구치며 땀방울 분출)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, -9),
        ...cTargetOff(0, 0),
        ...cTransform(0.72, 1.30, 0),
        moveStep: 1,
        sweatT: 0.35,
        phaseId: "facade-stretch-1",
        phaseName: "2. 세로로 길어짐 (1회차 긴장)",
      },
      // 3. 아래로 납작 (2회차 웅크림: 더욱 깊숙이 찌그러지며 탄성 극대화)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(-2, 7),
        ...cTargetOff(0, 0),
        ...cTransform(1.35, 0.65, 0),
        moveStep: 1,
        sweatT: 0.58,
        phaseId: "facade-squash-2",
        phaseName: "3. 아래로 납작 (2회차 웅크림)",
      },
      // 4. 세로로 길어짐 (2회차 긴장: 최대 세로 신장 및 결의)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(-1, -12),
        ...cTargetOff(0, 0),
        ...cTransform(0.68, 1.35, 0),
        moveStep: 1,
        sweatT: 0.78,
        phaseId: "facade-stretch-2",
        phaseName: "4. 세로로 길어짐 (2회차 긴장)",
      },
      // 5. 최대 도움닫기 웅크림 (발밑 흙먼지 팍! 일며 전방 발사 준비)
      {
        ...baseFrame,
        delay: 90,
        ...cOff(-14, 8),
        ...cTargetOff(0, 0),
        ...cTransform(1.38, 0.62, -0.05),
        moveStep: 1,
        sweatT: 0.95,
        phaseId: "facade-windup-crouch",
        phaseName: "5. 최대 도움닫기 웅크림 & 지면 마찰 먼지",
      },
      // 6. 전방 고속 쇄도 (목표를 향해 마하의 속도로 돌진)
      {
        ...baseFrame,
        delay: 75,
        ...cOff(46, -17),
        ...cTargetOff(0, 0),
        ...cTransform(0.85, 1.18, 0.12),
        moveStep: 2,
        effectProgress: 0.50,
        phaseId: "facade-dash",
        phaseName: "6. 전방 고속 쇄도 & 스피드 스트림",
      },
      // 7. 몸통박치기 정면 격돌 직격 & 땀방울 사방 폭발 시작! 💥💧
      {
        ...baseFrame,
        delay: 75,
        ...cOff(68, -24),
        ...cTargetOff(10, -4),
        ...cTransform(1.22, 0.82, 0.02),
        hitFlash: true,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 3,
        effectProgress: 0.20,
        phaseId: "facade-impact-hit",
        phaseName: "7. 몸통박치기 정면 격돌 & 순백 섬광",
      },
      // 8. 충돌 폭발 및 충격파 링 확산!
      {
        ...baseFrame,
        delay: 85,
        ...cOff(70, -25),
        ...cTargetOff(18, -7),
        ...cTransform(1.16, 0.85, 0.02),
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 3,
        effectProgress: 0.65,
        phaseId: "facade-impact-burst",
        phaseName: "8. 충돌 폭발 & 충격파 링 전개",
      },
      // 9. 충돌 반동 및 잔향 (뒤로 튕겨 나오며 충격파 소멸)
      {
        ...baseFrame,
        delay: 80,
        ...cOff(42, -15),
        ...cTargetOff(10, -3),
        ...cTransform(0.96, 1.04, -0.03),
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 3,
        effectProgress: 0.95,
        phaseId: "facade-recoil",
        phaseName: "9. 충돌 반동 & 충격파 소산",
      },
      // 10. 착지 및 자세 회복
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        ...cTargetOff(0, 0),
        ...cTransform(1.0, 1.0, 0),
        showEffect: false,
        showBehindEffect: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 4,
        phaseId: "facade-recover",
        phaseName: "10. 착지 및 자세 회복",
      },
    ];
  },
};
