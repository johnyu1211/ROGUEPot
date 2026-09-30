// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import {
  drawFlameWheelBehindEffect,
  drawFlameWheelEffect,
} from "../../../renderers/moves/gen1/move169_172.js";

/**
 * 172: 화염바퀴 (Flame Wheel / かえんぐるま)
 * 
 * 타입: 불꽃 (Fire) | 분류: 물리 (Physical)
 * 위력: 60 | 명중률: 100% | 부가 효과: 10% 확률로 화상 (자신의 얼음 상태 해제)
 * 
 * 연출 시퀀스 (유저 요구사항 & 첨부 이미지 100% 반영):
 * 1. [시동 & 반시계 회전 & 화염바퀴 완성]:
 *    - 카메라 1.0x 전장 조망 (delayUntilStep: 2)
 *    - 시전 포켓몬이 2D 기준 반시계방향(음수 각도)으로 회전 시작
 *    - 회전하면서 화염 잔상이 발생하고 속도가 붙으며 완벽한 바퀴 모양 화염바퀴(Flame Wheel) 완성
 * 2. [화염바퀴 돌진 (회전 지속)]:
 *    - 카메라 1.35x 타겟 스무스 글라이드인 포커싱
 *    - 반시계방향 초고속 회전을 유지한 채, 지면에 타오르는 화염 궤적을 새기며 상대방을 향해 쇄도 돌진
 * 3. [상대방 격돌 직격 & 화염 폭발]:
 *    - 1프레임 백색 섬광(hitFlash) + 다이아몬드 섬광 + 충격파 링
 *    - 첨부 이미지 1(Drifloon 피격) 고증: 상대 전신에 화염 덩어리(Flame Puffs)가 튀어 붙고 스파크가 사방으로 비산
 * 4. [반동 착지 & 제자리 복귀]:
 *    - 충돌 반동으로 튕겨 착지하며 회전 감속, 잔여 불티가 소멸하며 제자리 복귀
 */
export const flameWheelMove: BattleMoveAnimation = {
  num: 172,
  key: "flame-wheel",
  nameKo: "화염바퀴",
  nameEn: "Flame Wheel",
  type: "fire",
  category: "physical",
  camera: { type: "target", zoom: 1.35, delayUntilStep: 2 },
  drawBehindEffect: drawFlameWheelBehindEffect,
  drawEffect: drawFlameWheelEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      cameraZoom: 1.0, // delayUntilStep: 2 표준 사전 줌인 방지
    };

    // 시전자 오프셋 (시전자만 정확히 이동, 수비자는 완벽하게 {0, 0} 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 시전자 스케일
    const cScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    // 시전자 회전 각도 (2D 기준 반시계방향 = 음수 라디안, 스프라이트 중심축 기준 회전)
    const cRot = (rot: number) => ({
      pRot: isP ? rot : 0,
      eRot: !isP ? rot : 0,
      rotateFromCenter: true,
    });

    // 시전자 투명도 (유저 요청: 왼쪽으로 돌면서 페이드아웃)
    const cAlpha = (alpha: number) => ({
      pAlpha: isP ? alpha : 1.0,
      eAlpha: !isP ? alpha : 1.0,
    });

    // 수비자(피격자) 오프셋 (수비자만 넉백 흔들림)
    const defOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    return [
      // =======================================================================
      // Step 1: 회전 전 불 필터 적용 ➔ 제자리 반시계 회전하며 페이드아웃 ➔ 화염바퀴 완성
      // =======================================================================
      // 1-0. [유저 요청] 회전 전 시전포켓몬 불 필터 적용 & 불꽃 점화 (90ms)
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...cRot(0),
        ...cAlpha(1.0),
        casterRedTint: true,
        casterRedLevel: 1.0,
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 1,
        effectProgress: 0.05,
        phaseId: "flame-wheel-pre-fire",
        phaseName: "1-0. 회전 전 시전포켓몬 불 필터 적용",
      },
      // 1-1. 제자리 반시계 회전 시동 & 불꽃 점화 (75ms, alpha: 1.0, 불 필터)
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...cRot(-0.6 * Math.PI),
        ...cAlpha(1.0),
        casterRedTint: true,
        casterRedLevel: 1.0,
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 1,
        effectProgress: 0.20,
        phaseId: "flame-wheel-spin-1",
        phaseName: "1-1. 제자리 회전 시동 & 불꽃 점화",
      },
      // 1-2. 제자리 회전 가속 & 화염 잔상 발생 & 서서히 페이드 (75ms, alpha: 0.65, 불 필터)
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...cRot(-1.5 * Math.PI),
        ...cAlpha(0.65),
        casterRedTint: true,
        casterRedLevel: 1.0,
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 1,
        effectProgress: 0.45,
        phaseId: "flame-wheel-spin-2",
        phaseName: "1-2. 제자리 회전 가속 & 화염 잔상 발생 & 페이드",
      },
      // 1-3. 제자리 2회전 도달 & 바퀴 림 형성 & 깊은 페이드 (75ms, alpha: 0.30, 불 필터)
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...cRot(-2.6 * Math.PI),
        ...cAlpha(0.30),
        casterRedTint: true,
        casterRedLevel: 1.0,
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 1,
        effectProgress: 0.70,
        phaseId: "flame-wheel-spin-3",
        phaseName: "1-3. 제자리 회전 도달 & 화염바퀴 형성 & 페이드",
      },
      // 1-4. 완전 페이드아웃 & 화염바퀴 완성 (80ms, alpha: 0.0)
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...cRot(-3.8 * Math.PI),
        ...cAlpha(0.0),
        casterRedTint: false,
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 1,
        effectProgress: 0.95,
        phaseId: "flame-wheel-spin-4",
        phaseName: "1-4. 제자리 완전 페이드아웃 & 화염바퀴 완성",
      },

      // =======================================================================
      // Step 2: 화염바퀴 상태로 상대 포켓몬에게 돌진 (회전은 화염바퀴만! 포켓몬은 페이드 상태)
      // =======================================================================
      // 2-1. 지면을 박차고 화염바퀴 발진 쇄도 (65ms)
      {
        ...baseFrame,
        delay: 65,
        ...cOff(42, -18),
        ...cScale(1.05, 0.88),
        ...cRot(0),
        ...cAlpha(0.0),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 2,
        effectProgress: 0.25,
        phaseId: "flame-wheel-dash-1",
        phaseName: "2. 화염바퀴 발진 쇄도",
      },
      // 2-2. 초고속 화염 돌진 & 지면 궤적/후방 화염 잔상 (65ms)
      {
        ...baseFrame,
        delay: 65,
        ...cOff(110, -50),
        ...cScale(1.10, 0.86),
        ...cRot(0),
        ...cAlpha(0.0),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 2,
        effectProgress: 0.60,
        phaseId: "flame-wheel-dash-2",
        phaseName: "2. 초고속 화염 돌진",
      },
      // 2-3. 상대방 코앞 면전 쇄도 (65ms)
      {
        ...baseFrame,
        delay: 65,
        ...cOff(165, -76),
        ...cScale(1.12, 0.85),
        ...cRot(0),
        ...cAlpha(0.0),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 2,
        effectProgress: 0.90,
        phaseId: "flame-wheel-dash-3",
        phaseName: "2. 상대방 면전 쇄도",
      },

      // =======================================================================
      // Step 3: 상대방 격돌 직격 & 화염 폭발 (3프레임)
      // =======================================================================
      // 3-1. 정면 격돌 직격 & 1프레임 섬광 + 충격파 링 (90ms)
      {
        ...baseFrame,
        delay: 90,
        ...cOff(185, -84),
        ...cScale(1.15, 0.85),
        ...cRot(0),
        ...cAlpha(0.0),
        ...(isHit ? defOff(14, -6) : defOff(0, 0)),
        hitFlash: isHit,
        showEffect: isHit,
        showBehindEffect: true,
        targetRedTint: isHit,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 3,
        effectProgress: 0.20,
        phaseId: "flame-wheel-hit-1",
        phaseName: "3. 화염바퀴 격돌 직격 & 섬광",
      },
      // 3-2. 화염 쇄도 & 사방 비산 불꽃 파편 (90ms, 첨부 이미지 1 고증)
      {
        ...baseFrame,
        delay: 90,
        ...cOff(190, -86),
        ...cScale(1.18, 0.84),
        ...cRot(0),
        ...cAlpha(0.0),
        ...(isHit ? defOff(20, -8) : defOff(0, 0)),
        showEffect: isHit,
        showBehindEffect: true,
        targetRedTint: isHit,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 3,
        effectProgress: 0.55,
        phaseId: "flame-wheel-hit-2",
        phaseName: "3. 화염 쇄도 & 불꽃 비산",
      },
      // 3-3. 충돌 반동 튕김 & 폭발 확산 (80ms)
      {
        ...baseFrame,
        delay: 80,
        ...cOff(170, -75),
        ...cScale(1.05, 0.92),
        ...cRot(0),
        ...cAlpha(0.0),
        ...(isHit ? defOff(10, -4) : defOff(0, 0)),
        showEffect: isHit,
        showBehindEffect: true,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 3,
        effectProgress: 0.85,
        phaseId: "flame-wheel-hit-3",
        phaseName: "3. 충돌 반동 & 폭발 확산",
      },

      // =======================================================================
      // Step 4: 복귀 및 잔여 화염 페이드아웃 & 포켓몬 페이드인 (3프레임)
      // =======================================================================
      // 4-1. 반동 착지 & 서서히 페이드인 (75ms, alpha: 0.35)
      {
        ...baseFrame,
        delay: 75,
        ...cOff(90, -40),
        ...cScale(1.0, 1.0),
        ...cRot(0),
        ...cAlpha(0.35),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 4,
        effectProgress: 0.35,
        phaseId: "flame-wheel-recover-1",
        phaseName: "4. 반동 착지 & 페이드인",
      },
      // 4-2. 지면 안착 & 페이드인 심화 (75ms, alpha: 0.70)
      {
        ...baseFrame,
        delay: 75,
        ...cOff(30, -12),
        ...cScale(0.98, 1.02),
        ...cRot(0),
        ...cAlpha(0.70),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 4,
        effectProgress: 0.70,
        phaseId: "flame-wheel-recover-2",
        phaseName: "4. 지면 안착 감속 & 페이드인",
      },
      // 4-3. 완벽한 제자리 복귀 & 화염 소멸 (90ms, alpha: 1.0)
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...cRot(0),
        ...cAlpha(1.0),
        ...defOff(0, 0),
        showEffect: false,
        showBehindEffect: false,
        moveStep: 4,
        effectProgress: 1.0,
        phaseId: "flame-wheel-recover-3",
        phaseName: "4. 제자리 복귀 & 화염 소멸",
      },
    ];
  },
};
