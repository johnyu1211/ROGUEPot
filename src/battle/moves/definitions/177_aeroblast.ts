// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawAeroblastBehindEffect,
  drawAeroblastEffect,
} from "../../../renderers/moves/gen1/move177_180.js";

/**
 * 177: 에어로블라스트 (Aeroblast) - 비행 타입 특수 공격기 (루기아 전용기)
 *
 * 위력: 100 / 명중: 95 / PP: 5 / 접촉 판정: X
 * 부가효과: 급소율 1랭크 증가 (High Critical Hit Ratio)
 * 설명: 소용돌이치는 공기 덩어리를 상대에게 날려서 공격한다. 급소에 맞기 쉽다.
 *
 * [연출 기승전결 시퀀스]:
 * 1. Step 1: 풍압 집약 & 대기압 왜곡 차징 (Atmospheric Intake)
 *    - 화면 전체 대기압 강하 암전 & 시전자 웅크림
 *    - 사방 백색 기체가 시전자 앞 초고압 에어로 볼텍스 구체로 맹렬히 수렴
 * 2. Step 2: 겹쳐진 회오리바람 연쇄 폭풍 사출 (Connected Overlapping Cyclones Launch - 255ms)
 *    - 시전자 전방 방출 반동 & 각기 다른 크기와 회전이 적용된 회오리바람들이 여러 개 겹쳐서 이어진 거대 폭풍
 *    - 10개의 독립 회오리 노드(크기 15~34px, CW/CCW 회전) + 나선 결합 브릿지 기류선
 * 3. Step 3: 상대 직격 착탄 & 관통 연결 폭풍 작렬 (Target Impact & Full Power Cyclones - 270ms)
 *    - 카메라 타겟 스무스 줌인 & 대상 정면 관통 폭풍 최고 출력 유지
 *    - 피격자 전신을 칭칭 동여매는 14가닥 3D 볼텍스 고속 회전 폭발
 * 4. Step 4: 대기 안착 및 체력 감쇠 (Atmospheric Settling - 270ms)
 *    - 상대방 체력(HP) 감소 반영 & 회오리바람 연쇄 회전 유지
 * 5. Step 5: 폭풍 소멸 & 대기 안정화 (Cyclone Dissipation & Recovery - 180ms)
 *    - 필터 종료까지 볼텍스 회전 유지 후 대기 안정화
 *    - 시전자 및 피격자 안정 스탠스 복귀 & 카메라 중립 글라이드아웃
 */
export const aeroblastMove: BattleMoveAnimation = {
  num: 177,
  key: "aeroblast",
  nameKo: "에어로블라스트",
  nameEn: "Aeroblast",
  type: "flying",
  category: "special",
  camera: {
    type: "caster_to_target",
    zoom: 1.55, // 시전자에게 깊은 줌인 후 발포 직후 대상으로 전환
    focalRatio: 0.85,
    delayUntilStep: 2, // Step 1: 시전자 집중 차징 -> Step 2(발포 직후): 바로 대상 포커싱 및 푸른 필터 회전선 배경 전개
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawAeroblastBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawAeroblastEffect(targetCtx, frame, drawCtx);
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

    const dir = isP ? 1 : -1;

    // 시전자 오프셋
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 시전자 스케일
    const cScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    // 수비자(피격자) 오프셋
    const defOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    return [
      // =======================================================================
      // Step 1: [1단계] 공기 모으기 (사방 기체 수렴 & 순백 구체 페이드인 - 5프레임)
      // =======================================================================
      {
        ...baseFrame,
        delay: 90,
        ...cOff(-dir * 2, 1),
        ...cScale(1.02, 0.98),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 1,
        effectProgress: 0.20,
        chargeProgress: 0.20,
        dimAlpha: 0.18,
        phaseId: "aeroblast-charge-1",
        phaseName: "1. [공기 모으기] 기류 집약 태동 & 미세한 백색 기체 유입",
      },
      {
        ...baseFrame,
        delay: 95,
        ...cOff(-dir * 4, 1),
        ...cScale(1.04, 0.96),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 1,
        effectProgress: 0.40,
        chargeProgress: 0.40,
        dimAlpha: 0.32,
        phaseId: "aeroblast-charge-2",
        phaseName: "1. [공기 모으기] 사방 백색 기체 수렴 & 암전 심화",
      },
      {
        ...baseFrame,
        delay: 95,
        ...cOff(-dir * 6, 2),
        ...cScale(1.07, 0.93),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 1,
        effectProgress: 0.60,
        chargeProgress: 0.60,
        dimAlpha: 0.48,
        phaseId: "aeroblast-charge-3",
        phaseName: "1. [공기 모으기] 순백 구체 선명화 & 기압 급강하 암전",
      },
      {
        ...baseFrame,
        delay: 100,
        ...cOff(-dir * 7, 2),
        ...cScale(1.09, 0.91),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 1,
        effectProgress: 0.80,
        chargeProgress: 0.80,
        dimAlpha: 0.62,
        phaseId: "aeroblast-charge-4",
        phaseName: "1. [공기 모으기] 깊은 어둠 속 백색 기체선 입체 휘감기",
      },
      {
        ...baseFrame,
        delay: 100,
        ...cOff(-dir * 8, 3),
        ...cScale(1.11, 0.89),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 1,
        effectProgress: 0.95,
        chargeProgress: 0.95,
        dimAlpha: 0.74,
        phaseId: "aeroblast-charge-5",
        phaseName: "1. [공기 모으기] 전장 짙은 암전 & 기체 마지막 흡입",
      },

      // =======================================================================
      // Step 1: [2단계] 기체가 다 모인 후 (완성된 구체 머금기 & 발포 직전 긴장감 - 3프레임)
      // =======================================================================
      {
        ...baseFrame,
        delay: 110,
        ...cOff(-dir * 9, 3),
        ...cScale(1.13, 0.87),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 1,
        effectProgress: 1.00,
        chargeProgress: 1.00,
        isFullyCharged: true,
        holdProgress: 0.33,
        dimAlpha: 0.82,
        phaseId: "aeroblast-hold-1",
        phaseName: "1. [기체 다 모임] 칠흑 같은 암전 속 순백 구체 완성 & 초고압 맥동",
      },
      {
        ...baseFrame,
        delay: 110,
        ...cOff(-dir * 10, 4), // 시전자 최대 웅크림 & 팽팽한 떨림
        ...cScale(1.14, 0.86),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 1,
        effectProgress: 1.00,
        chargeProgress: 1.00,
        isFullyCharged: true,
        holdProgress: 0.66,
        dimAlpha: 0.88,
        phaseId: "aeroblast-hold-2",
        phaseName: "1. [기체 다 모임] 극한의 대기압 암전 & 볼텍스 기체선 초고속 회전",
      },
      {
        ...baseFrame,
        delay: 115,
        ...cOff(-dir * 9, 3),
        ...cScale(1.12, 0.88),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 1,
        effectProgress: 1.00,
        chargeProgress: 1.00,
        isFullyCharged: true,
        holdProgress: 1.00,
        dimAlpha: 0.92,
        phaseId: "aeroblast-hold-3",
        phaseName: "1. [발포 직전] 92% 완전 암전! 기체 응축 임계점 도달",
      },

      // =======================================================================
      // Step 2: 겹쳐진 회오리바람 연쇄 폭풍 사출 (3프레임 - 255ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 80,
        ...cOff(dir * 6, -3), // 시전자 전방 방출 강한 반동
        ...cScale(0.90, 1.10),
        ...defOff(0, 0),
        targetBlueTint: true,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 2,
        effectProgress: 0.35,
        beamProgress: 0.40,
        dimAlpha: 0.20,
        phaseId: "aeroblast-launch-1",
        phaseName: "2. [사출] 각기 다른 크기·회전의 회오리바람 연쇄 폭풍 사출",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(dir * 4, -2),
        ...cScale(0.95, 1.05),
        ...defOff(0, 0),
        targetBlueTint: true,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 2,
        effectProgress: 0.70,
        beamProgress: 0.75,
        dimAlpha: 0.18,
        phaseId: "aeroblast-launch-2",
        phaseName: "2. [쇄도] 10개 회오리 노드 겹침 회전 & 48가닥 회전선 배경 폭풍",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(dir * 2, -1),
        ...cScale(0.98, 1.02),
        ...defOff(0, 0),
        targetBlueTint: true,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 2,
        effectProgress: 1.00,
        beamProgress: 1.45,
        dimAlpha: 0.15,
        phaseId: "aeroblast-launch-3",
        phaseName: "2. [관통] 대상 정면 관통 도달 & 등 뒤로 뻗어나가는 소용돌이",
      },

      // =======================================================================
      // Step 3: 상대 직격 착탄 & 관통 볼텍스 빔 폭풍 작렬 (270ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 90,
        ...cOff(dir * 1, 0),
        ...cScale(1.0, 1.0),
        ...defOff(dir * 7, -2), // 피격자 강타 넉백
        hitFlash: true,
        targetBlueTint: true,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 3,
        effectProgress: 0.35,
        tornadoProgress: 0.35,
        dimAlpha: 0.18,
        phaseId: "aeroblast-impact-1",
        phaseName: "3. [직격] 대상 정면 빔 관통 & 14가닥 볼텍스 폭풍 작렬",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...defOff(-dir * 5, 2),
        hitFlash: false,
        targetBlueTint: true,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 3,
        effectProgress: 0.70,
        tornadoProgress: 0.70,
        dimAlpha: 0.16,
        phaseId: "aeroblast-impact-2",
        phaseName: "3. [관통] 바람의 볼텍스 빔 대기 파열 & 14가닥 볼텍스 폭풍",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...defOff(dir * 4, -1),
        hitFlash: false,
        targetBlueTint: true,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 3,
        effectProgress: 1.00,
        tornadoProgress: 1.00,
        dimAlpha: 0.14,
        phaseId: "aeroblast-impact-3",
        phaseName: "3. [유지] 선 끝까지 빔 관통 유지 & 맹렬한 볼텍스 회전",
      },

      // =======================================================================
      // Step 4: 대기 안착 및 체력 감쇠 (선끝까지 빔 유지 - 270ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...defOff(-dir * 4, 1),
        hitFlash: true,
        enemyHp: a.enemyHpAfter, // 체력 감소 실시간 반영
        playerHp: a.playerHpAfter,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 4,
        effectProgress: 0.35,
        burstProgress: 0.35,
        dimAlpha: 0.12,
        phaseId: "aeroblast-rupture-1",
        phaseName: "4. [안착] 체력 감쇠 & 선 끝까지 관통 빔 회전 유지",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...defOff(dir * 2, 0),
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 4,
        effectProgress: 0.70,
        burstProgress: 0.70,
        dimAlpha: 0.08,
        phaseId: "aeroblast-rupture-2",
        phaseName: "4. [안착] 볼텍스 회전 지속 & 대기 진동",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...defOff(0, 0),
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 4,
        effectProgress: 1.00,
        burstProgress: 1.00,
        dimAlpha: 0.04,
        phaseId: "aeroblast-rupture-3",
        phaseName: "4. 폭풍 파편 확산 & 기압 정상화",
      },

      // =======================================================================
      // Step 5: 폭풍 소멸 & 대기 안정화 (180ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...defOff(0, 0),
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 5,
        effectProgress: 0.50,
        dissipationProgress: 0.50,
        phaseId: "aeroblast-recover-1",
        phaseName: "5. 회오리 상공 소산 & 은은한 기류 잔향",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...defOff(0, 0),
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 5,
        effectProgress: 1.00,
        dissipationProgress: 1.00,
        fadeEffectOnCameraReturn: true,
        phaseId: "aeroblast-recover-2",
        phaseName: "5. 기류 소멸 및 원위치 안정 복귀",
      },
    ];
  },
};
