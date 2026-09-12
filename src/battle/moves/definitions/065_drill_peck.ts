// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawDrillPeckEffect, drawDrillPeckBehindEffect } from "../../../renderers/moves/gen1/move065_068.js";

/**
 * 065: 회전부리 (Drill Peck)
 * 
 * Concept & User Requirements:
 * 1. 스프라이트 위쪽(머리/부리)이 상대방을 정확히 향하도록 대각선 회전 각도 설정
 *    - 플레이어 시전: 우상단 상대를 향해 시계방향 +65도 기울임 (pRot: 1.14 rad)
 *    - 적 시전: 좌하단 상대를 향해 반시계방향 -115도 기울임 (eRot: -2.00 rad)
 * 2. 대상포켓몬에게 매우 근접해서 진행 (초근접 면전 돌진 및 깊은 관통 궤적)
 * 3. 시전포켓몬을 4회전 3D 스핀 (전면 ➔ 후면 ➔ 전면 ➔ 후면)
 * 4. 2~3개로 절제된 순백 3D 원추형 회전선 (끝이 투명하게 페이드)
 *    - 스프라이트의 실제 몸체 축(발에서 머리까지)을 빈틈없이 감싸며 완벽히 동기화되어 회전
 * 5. 매 회전마다 쪼기와 동일한 타격 이펙트 (순백 다이아몬드 섬광 & 골든 침형 스파크) 직격
 */
export const drillPeckMove: BattleMoveAnimation = {
  num: 65,
  key: "drill-peck",
  nameKo: "회전부리",
  nameEn: "Drill Peck",
  type: "flying",
  category: "physical",
  camera: { type: "target", zoom: 1.40 },
  drawEffect: drawDrillPeckEffect,
  drawBehindEffect: drawDrillPeckBehindEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    // 스프라이트 머리/위쪽이 상대방 가슴/타격점을 정면으로 향하는 회전각
    // 스프라이트 머리/위쪽이 상대방 가슴/타격점을 정면으로 향하는 회전각
    const tiltRot = isP ? 1.22 : -1.95;

    return [
      // 1. [초고속 돌진 접근]: 시전자 머리/부리가 대상을 향하도록 기울이며 상공 대각선 급가속 접근 (90ms)
      {
        ...baseFrame,
        delay: 90,
        pOffset: isP ? { x: 130, y: -95 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -140, y: 38 } : { x: 0, y: 0 },
        pRot: isP ? tiltRot : undefined,
        eRot: !isP ? tiltRot : undefined,
        pScale: isP ? { x: 1.10, y: 0.90 } : undefined,
        eScale: !isP ? { x: 1.10, y: 0.90 } : undefined,
        showEffect: true,
        moveStep: 1,
        drillIntensity: 0.65,
        drillSpinPhase: 0,
        phaseId: "drill-rush",
        phaseName: "1. 대각선 조준 및 초고속 돌진 (90ms)",
      },

      // 2. [1차 회전 직격 - 전면]: 대상 흉부 면전 초근접 1차 회전 강타! (95ms)
      //    - 시전자 전면 노출 (usePlayerFront: true / useEnemyBack: false)
      //    - 쪼기 타격 이펙트 1차 작렬 & 피격 진동
      {
        ...baseFrame,
        delay: 95,
        pOffset: isP ? { x: 188, y: -135 } : (isHit ? { x: -8, y: 3 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -202, y: 57 } : (isHit ? { x: 8, y: -3 } : { x: 0, y: 0 }),
        pRot: isP ? tiltRot : undefined,
        eRot: !isP ? tiltRot : undefined,
        pScale: isP ? { x: 0.95, y: 0.95 } : undefined,
        eScale: !isP ? { x: 0.95, y: 0.95 } : undefined,
        usePlayerFront: isP,
        useEnemyBack: false,
        showEffect: true,
        hitFlash: isHit,
        moveStep: 2,
        drillIntensity: 1.0,
        drillSpinPhase: 0, // 전면 정렬
        phaseId: "drill-hit-1-front",
        phaseName: "2. 1차 회전 직격 [전면] (95ms)",
      },

      // 3. [고속 회전 반전 - 측면]: 3D 원심력으로 회전하며 측면 통과 (70ms)
      {
        ...baseFrame,
        delay: 70,
        pOffset: isP ? { x: 191, y: -137 } : (isHit ? { x: -4, y: 1 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -205, y: 58 } : (isHit ? { x: 4, y: -1 } : { x: 0, y: 0 }),
        pRot: isP ? tiltRot : undefined,
        eRot: !isP ? tiltRot : undefined,
        pScale: isP ? { x: 0.35, y: 1.02 } : undefined,
        eScale: !isP ? { x: 0.35, y: 1.02 } : undefined,
        usePlayerFront: isP,
        useEnemyBack: false,
        showEffect: true,
        moveStep: 3,
        drillIntensity: 1.0,
        drillSpinPhase: Math.PI * 0.5, // 90도 측면 회전
        phaseId: "drill-spin-mid-1",
        phaseName: "3. 3D 회전 반전 [측면] (70ms)",
      },

      // 4. [2차 회전 관통 - 후면]: 한 단계 더 깊숙이 관통하며 후면 2차 회전 강타! (95ms)
      //    - 시전자 후면 노출 (usePlayerFront: false / useEnemyBack: true)
      //    - 쪼기 타격 이펙트 2차 작렬
      {
        ...baseFrame,
        delay: 95,
        pOffset: isP ? { x: 196, y: -140 } : (isHit ? { x: -12, y: 5 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -209, y: 59 } : (isHit ? { x: 12, y: -5 } : { x: 0, y: 0 }),
        pRot: isP ? tiltRot : undefined,
        eRot: !isP ? tiltRot : undefined,
        pScale: isP ? { x: 0.95, y: 0.95 } : undefined,
        eScale: !isP ? { x: 0.95, y: 0.95 } : undefined,
        usePlayerFront: false,
        useEnemyBack: !isP,
        showEffect: true,
        hitFlash: isHit,
        moveStep: 4,
        drillIntensity: 1.1,
        drillSpinPhase: Math.PI * 1.0, // 180도 후면 회전
        phaseId: "drill-hit-2-back",
        phaseName: "4. 2차 회전 관통 [후면] (95ms)",
      },

      // 5. [고속 회전 반전 - 측면]: 반대편 측면을 스치며 가속 (70ms)
      {
        ...baseFrame,
        delay: 70,
        pOffset: isP ? { x: 194, y: -138 } : (isHit ? { x: -6, y: 2 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -207, y: 58 } : (isHit ? { x: 6, y: -2 } : { x: 0, y: 0 }),
        pRot: isP ? tiltRot : undefined,
        eRot: !isP ? tiltRot : undefined,
        pScale: isP ? { x: 0.35, y: 1.02 } : undefined,
        eScale: !isP ? { x: 0.35, y: 1.02 } : undefined,
        usePlayerFront: false,
        useEnemyBack: !isP,
        showEffect: true,
        moveStep: 5,
        drillIntensity: 1.15,
        drillSpinPhase: Math.PI * 1.5, // 270도 측면 회전
        phaseId: "drill-spin-mid-2",
        phaseName: "5. 3D 회전 반전 [측면] (70ms)",
      },

      // 6. [3차 회전 연타 - 전면]: 다시 전면으로 돌아오며 가차없는 3차 회전 강타! (95ms)
      //    - 시전자 전면 노출 (usePlayerFront: true / useEnemyBack: false)
      //    - 쪼기 타격 이펙트 3차 작렬
      {
        ...baseFrame,
        delay: 95,
        pOffset: isP ? { x: 200, y: -142 } : (isHit ? { x: -14, y: 6 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -212, y: 60 } : (isHit ? { x: 14, y: -6 } : { x: 0, y: 0 }),
        pRot: isP ? tiltRot : undefined,
        eRot: !isP ? tiltRot : undefined,
        pScale: isP ? { x: 0.95, y: 0.95 } : undefined,
        eScale: !isP ? { x: 0.95, y: 0.95 } : undefined,
        usePlayerFront: isP,
        useEnemyBack: false,
        showEffect: true,
        hitFlash: isHit,
        moveStep: 6,
        drillIntensity: 1.25,
        drillSpinPhase: Math.PI * 2.0, // 360도 전면 복귀 회전
        phaseId: "drill-hit-3-front",
        phaseName: "6. 3차 회전 연타 [전면] (95ms)",
      },

      // 7. [고속 회전 반전 - 측면]: 마지막 피니시 직전 극대 회전 (70ms)
      {
        ...baseFrame,
        delay: 70,
        pOffset: isP ? { x: 198, y: -140 } : (isHit ? { x: -8, y: 3 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -210, y: 59 } : (isHit ? { x: 8, y: -3 } : { x: 0, y: 0 }),
        pRot: isP ? tiltRot : undefined,
        eRot: !isP ? tiltRot : undefined,
        pScale: isP ? { x: 0.35, y: 1.02 } : undefined,
        eScale: !isP ? { x: 0.35, y: 1.02 } : undefined,
        usePlayerFront: isP,
        useEnemyBack: false,
        showEffect: true,
        moveStep: 7,
        drillIntensity: 1.35,
        drillSpinPhase: Math.PI * 2.5, // 450도 측면 회전
        phaseId: "drill-spin-mid-3",
        phaseName: "7. 3D 회전 반전 [측면] (70ms)",
      },

      // 8. [4차 극대 피니시 강타 - 후면]: 최대 깊이로 적을 꿰뚫는 극대 4차 피니시 쪼아박음! (110ms)
      //    - 시전자 후면 노출 (usePlayerFront: false / useEnemyBack: true)
      //    - 극대 쪼기 타격 섬광 & 8방향 관통 스파크 & 대상 최대 넉백 진동
      {
        ...baseFrame,
        delay: 110,
        pOffset: isP ? { x: 206, y: -145 } : (isHit ? { x: -18, y: 8 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -216, y: 62 } : (isHit ? { x: 18, y: -8 } : { x: 0, y: 0 }),
        pRot: isP ? tiltRot : undefined,
        eRot: !isP ? tiltRot : undefined,
        pScale: isP ? { x: 1.05, y: 0.90 } : undefined,
        eScale: !isP ? { x: 1.05, y: 0.90 } : undefined,
        usePlayerFront: false,
        useEnemyBack: !isP,
        showEffect: true,
        hitFlash: isHit,
        moveStep: 8,
        drillIntensity: 1.45,
        drillSpinPhase: Math.PI * 3.0, // 540도 후면 피니시
        phaseId: "drill-hit-4-back-finish",
        phaseName: "8. 4차 극대 피니시 강타 [후면] (110ms)",
      },

      // 9. [타격 반동 튕김]: 강타 관성으로 튕겨나오며 회전선 잔향 소멸 (95ms)
      {
        ...baseFrame,
        delay: 95,
        pOffset: isP ? { x: 110, y: -75 } : (isHit ? { x: -6, y: 2 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -120, y: 32 } : (isHit ? { x: 6, y: -2 } : { x: 0, y: 0 }),
        pRot: isP ? tiltRot * 0.35 : undefined,
        eRot: !isP ? tiltRot * 0.35 : undefined,
        pScale: isP ? { x: 0.98, y: 1.02 } : undefined,
        eScale: !isP ? { x: 0.98, y: 1.02 } : undefined,
        usePlayerFront: false,
        useEnemyBack: false,
        showEffect: true,
        moveStep: 9,
        drillIntensity: 0.35,
        drillSpinPhase: Math.PI * 3.5,
        phaseId: "drill-recoil",
        phaseName: "9. 타격 반동 튕김 (95ms)",
      },

      // 10. [원위치 복귀]: 정위치 착지 안착 (85ms)
      {
        ...baseFrame,
        delay: 85,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pRot: 0,
        eRot: 0,
        usePlayerFront: false,
        useEnemyBack: false,
        showEffect: false,
        phaseId: "drill-recover",
        phaseName: "10. 원위치 복귀 (85ms)",
      },
    ];
  },
};
