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
 * 1. Step 1: 풍압 집약 & 대기압 왜곡 차징 (Atmospheric Intake - 180ms)
 *    - 화면 전체 대기압 강하 암전 & 시전자 웅크림
 *    - 6가닥 나선형 기류가 시전자 앞 초고압 에어로 볼텍스 구체로 맹렬히 수렴
 * 2. Step 2: 초고속 3D 나선형 볼텍스 캐논 발사 (Supersonic Vortex Blast - 160ms)
 *    - 시전자 전방 방출 반동 & 전장을 가로지르는 거대 공기 볼텍스 빔 사출
 *    - 중심 순백 심선 + 이중 나선 회오리 리본 + 마하 압축 충격파 링 쇄도
 * 3. Step 3: 상대 직격 착탄 & 거대 회오리바람 기둥 분출 (Target Impact & Cyclone Eruption - 270ms)
 *    - 카메라 타겟 스무스 줌인(1.38x) & 피격자 정면 격돌 섬광
 *    - 상공으로 솟구치는 거대한 회오리바람 기둥 & 피격자 난타 진공 참격 칼날
 * 4. Step 4: 대기 파열 십자 섬광 & 초고압 대폭발 (Atmospheric Rupture & Mega Burst - 270ms)
 *    - 급소 타격의 위용을 알리는 거대 대기 파열 십자 섬광 & 외곽 충격파 방사
 *    - 상대방 체력(HP) 감소 반영 & 진공 참격 2차 작렬 및 전방위 스파크 비산
 * 5. Step 5: 폭풍 소멸 & 대기 안정화 (Cyclone Dissipation & Recovery - 180ms)
 *    - 회오리가 상공으로 서서히 흩어지며 기류 잔향 소멸
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
    type: "target",
    zoom: 1.38,
    delayUntilStep: 3, // Step 1·2: 중립 1.0x 와이드 뷰(풍압 집약 및 전장 가로지르는 빔 사출) -> Step 3 착탄부터 타겟 포커싱
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
      // Step 1: 풍압 집약 & 대기압 왜곡 차징 (180ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 90,
        ...cOff(-dir * 4, 2),
        ...cScale(1.05, 0.95),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 1,
        effectProgress: 0.40,
        chargeProgress: 0.40,
        dimAlpha: 0.18,
        phaseId: "aeroblast-charge-1",
        phaseName: "1. 풍압 흡입 & 기압 강하 (웅크림)",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(-dir * 7, 3),
        ...cScale(1.09, 0.91),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 1,
        effectProgress: 1.00,
        chargeProgress: 1.00,
        dimAlpha: 0.32,
        phaseId: "aeroblast-charge-2",
        phaseName: "1. 초고압 에어로 볼텍스 구체 응결",
      },

      // =======================================================================
      // Step 2: 초고속 3D 나선형 볼텍스 캐논 발사 (160ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 80,
        ...cOff(dir * 5, -2),
        ...cScale(0.92, 1.08),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 2,
        effectProgress: 0.50,
        beamProgress: 0.52,
        dimAlpha: 0.25,
        phaseId: "aeroblast-launch-1",
        phaseName: "2. 에어로 볼텍스 캐논 폭발적 사출",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(dir * 3, -1),
        ...cScale(0.97, 1.03),
        ...defOff(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 2,
        effectProgress: 1.00,
        beamProgress: 0.96,
        dimAlpha: 0.20,
        phaseId: "aeroblast-launch-2",
        phaseName: "2. 이중 나선 바람 리본 & 마하 충격파 링 쇄도",
      },

      // =======================================================================
      // Step 3: 상대 직격 착탄 & 거대 회오리바람 기둥 분출 (270ms)
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
        phaseName: "3. [직격] 상대 정면 착탄 & 회오리바람 분출",
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
        phaseName: "3. 거대 회오리바람 기둥 포효 & 진공 참격 1차 난타",
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
        phaseName: "3. 초고속 진공 회전 폭풍 타격 & 진공 참격 2차 난타",
      },

      // =======================================================================
      // Step 4: 대기 파열 십자 섬광 & 초고압 대폭발 (270ms)
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
        phaseName: "4. [급소] 대기 파열 십자 섬광 & 1차 충격파 방사",
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
        phaseName: "4. 초거대 공기 충격파 도넛 링 팽창 & 바람 스파크 비산",
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
