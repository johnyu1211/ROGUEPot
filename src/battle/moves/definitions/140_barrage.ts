// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawBarrageEffect } from "../../../renderers/moves/gen1/move137_140.js";

/**
 * 140: 구슬던지기 (Barrage) - 노말 타입 2~5회 연속 물리 공격기 (위력 15)
 *
 * 연출 시퀀스:
 * 1. 둥근 3D 입체 구슬을 차례대로 4연속 포물선 아크 투척
 * 2. 1~3타: '탁! 탁! 탁!' 경쾌한 2D 타격 링 및 구슬 파편 비산
 * 3. 4타 피니시: 강력한 스쿼시 충돌과 함께 구슬 산산조각 파쇄 & 넉백 피니시
 */
export const barrageMove: BattleMoveAnimation = {
  num: 140,
  key: "barrage",
  nameKo: "구슬던지기",
  nameEn: "Barrage",
  type: "normal",
  category: "physical",
  camera: { type: "target", zoom: 1.25 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (frame.showEffect) {
      drawBarrageEffect(targetCtx, frame, drawCtx);
    }
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

    // 시전자 오프셋
    const cOff = (x: number, y: number) =>
      isP ? { pOffset: { x, y } } : { eOffset: { x: -x, y: -y } };

    // 대상 피격 넉백
    const tOff = (x: number, y: number) =>
      isP
        ? (isHit ? { eOffset: { x, y } } : { eOffset: { x: 0, y: 0 } })
        : (isHit ? { pOffset: { x: -x, y: -y } } : { pOffset: { x: 0, y: 0 } });

    return [
      // 1. 1개 구슬 소환 및 투척 준비 (와인드업)
      {
        ...baseFrame,
        delay: 80,
        ...cOff(6, -2),
        ...tOff(0, 0),
        showEffect: true,
        moveStep: 1,
        showLaunchOrb: true,
        phaseId: "barrage-throw-ready",
        phaseName: "1. 구슬 투척 준비",
      },

      // 2. 1개 구슬 포물선 비행 (상승 구간)
      {
        ...baseFrame,
        delay: 80,
        ...cOff(8, -3),
        ...tOff(0, 0),
        showEffect: true,
        moveStep: 2,
        flyProgress: 0.30,
        phaseId: "barrage-fly-rise",
        phaseName: "2. 구슬 상공 고각 포물선 상승",
      },

      // 3. 1개 구슬 포물선 비행 (정점 구간 - 상대 머리 위 상공)
      {
        ...baseFrame,
        delay: 80,
        ...cOff(10, -3),
        ...tOff(0, 0),
        showEffect: true,
        moveStep: 2,
        flyProgress: 0.65,
        phaseId: "barrage-fly-peak",
        phaseName: "3. 상대 머리 위 상공 도달 (정점)",
      },

      // 4. 머리 위 급강하 수직 낙하
      {
        ...baseFrame,
        delay: 70,
        ...cOff(6, -1),
        ...tOff(0, 0),
        showEffect: true,
        moveStep: 2,
        flyProgress: 0.88,
        phaseId: "barrage-fly-fall",
        phaseName: "4. 머리 위 급강하 수직 낙하",
      },

      // 5. 머리 위 직격 타격 쿵! (1차 진동 시작 & 카메라 진동 & 구슬 유지)
      {
        ...baseFrame,
        delay: 55,
        ...cOff(2, 0),
        ...tOff(0, 5),
        cameraPan: isHit ? { x: 0, y: 3.5 } : undefined,
        showEffect: true,
        hitFlash: isHit,
        moveStep: 3,
        showOrbOnTarget: true,
        orbAlpha: 1.0,
        dustProgress: 0.25,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpAfter ?? playerHp) : playerHp,
        phaseId: "barrage-impact-hit",
        phaseName: "5. 머리 위 직격 타격 (1차 충격 & 쿵!)",
      },

      // 6. 충격 반동 진동 1 (위로 튕김 & 카메라 역진동 & 구슬 유지)
      {
        ...baseFrame,
        delay: 50,
        ...cOff(1, 0),
        ...tOff(-2, -3),
        cameraPan: isHit ? { x: -2.0, y: -2.5 } : undefined,
        showEffect: true,
        moveStep: 3,
        showOrbOnTarget: true,
        orbAlpha: 1.0,
        dustProgress: 0.45,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpAfter ?? playerHp) : playerHp,
        phaseId: "barrage-vibration-1",
        phaseName: "6. 타격 반동 진동 1 (구슬 유지 & 카메라 셰이크)",
      },

      // 7. 충격 반동 진동 2 (아래 떨림 & 카메라 진동 & 구슬 유지)
      {
        ...baseFrame,
        delay: 50,
        ...cOff(0, 0),
        ...tOff(2, 3),
        cameraPan: isHit ? { x: 2.0, y: 2.0 } : undefined,
        showEffect: true,
        moveStep: 3,
        showOrbOnTarget: true,
        orbAlpha: 1.0,
        dustProgress: 0.65,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpAfter ?? playerHp) : playerHp,
        phaseId: "barrage-vibration-2",
        phaseName: "7. 타격 반동 진동 2 (구슬 유지 & 카메라 셰이크)",
      },

      // 8. 진동 수렴 잔향 (구슬 유지)
      {
        ...baseFrame,
        delay: 55,
        ...cOff(0, 0),
        ...tOff(-1, -1),
        cameraPan: isHit ? { x: -1.0, y: -1.0 } : undefined,
        showEffect: true,
        moveStep: 3,
        showOrbOnTarget: true,
        orbAlpha: 1.0,
        dustProgress: 0.80,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpAfter ?? playerHp) : playerHp,
        phaseId: "barrage-vibration-3",
        phaseName: "8. 타격 진동 수렴 (구슬 유지)",
      },

      // 9. 진동 종료 후 구슬 1차 페이드아웃 (바닥 먼지 구름 피크)
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        ...tOff(0, 0),
        cameraPan: { x: 0, y: 0 },
        showEffect: true,
        moveStep: 4,
        showOrbOnTarget: true,
        orbAlpha: 0.60, // 1.0 -> 0.60 부드러운 페이드아웃 개시
        dustProgress: 0.88,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpAfter ?? playerHp) : playerHp,
        phaseId: "barrage-orb-fade-1",
        phaseName: "9. 진동 종료 및 구슬 1차 페이드아웃",
      },

      // 10. 구슬 2차 깊은 페이드아웃 (바닥 먼지 소산 진행)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...tOff(0, 0),
        cameraPan: { x: 0, y: 0 },
        showEffect: true,
        moveStep: 5,
        showOrbOnTarget: true,
        orbAlpha: 0.20, // 0.60 -> 0.20 깊은 페이드아웃
        dustProgress: 0.96,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpAfter ?? playerHp) : playerHp,
        phaseId: "barrage-orb-fade-2",
        phaseName: "10. 구슬 2차 페이드아웃",
      },

      // 11. 구슬 완전 소멸 및 바닥 먼지 최종 소산
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...tOff(0, 0),
        cameraPan: { x: 0, y: 0 },
        showEffect: true,
        moveStep: 5,
        showOrbOnTarget: false, // 구슬 완전 소멸
        dustProgress: 1.0,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpAfter ?? playerHp) : playerHp,
        phaseId: "barrage-dust-dissipate",
        phaseName: "11. 구슬 소멸 및 먼지 소산 완료",
      },

      // 12. 정위치 복귀 완료
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...tOff(0, 0),
        cameraPan: { x: 0, y: 0 },
        showEffect: false,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpAfter ?? playerHp) : playerHp,
        moveStep: 6,
        phaseId: "barrage-finish",
        phaseName: "12. 정위치 복귀 완료",
      },
    ];
  },
};
