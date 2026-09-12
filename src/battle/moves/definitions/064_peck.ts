// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawPeckEffect } from "../../../renderers/moves/gen1/move061_064.js";

/**
 * 064: 쪼기 (Peck)
 * 
 * 5세대 공식 배틀 연출 기반 날렵하고 예리한 비행 타입 물리 공격:
 * 1. [전진 조준]: 시전자가 날렵하게 목표물 전방으로 돌진 접근
 * 2. [1차 쪼기 직격 (콕!)]: 날카로운 황금빛 상아 부리가 대상을 콕! 내리찍음
 *    - 핀포인트 순백 다이아몬드 섬광 & 6방향 침형 스파크 & 1차 피격 진동
 * 3. [반동 튕김 & 2차 조준]: 살짝 튕기며 2차 쪼기 장전 & 흩날리는 첫 깃털
 * 4. [2차 쪼기 극대 강타 (콕!)]: 한 번 더 강력하게 깊숙이 콕! 쪼아박음!
 *    - 8방향 방사형 침형 스파크 & 충격파 링 & 3개의 순백/스카이블루 깃털 비산
 * 5. [타격 반동 회복]: 시전자가 뒤로 물러나며 공중에 흩날리는 깃털 잔향 페이드아웃
 * 6. [원위치 복귀]: 제자리 착지 복귀
 */
export const peckMove: BattleMoveAnimation = {
  num: 64,
  key: "peck",
  nameKo: "쪼기",
  nameEn: "Peck",
  type: "flying",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  drawEffect: drawPeckEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    return [
      // 1. [전진 조준]: 시전자가 날렵하게 목표물 전방으로 돌진 접근 (90ms)
      {
        ...baseFrame,
        delay: 90,
        pOffset: isP ? { x: 80, y: -32 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -80, y: 32 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.15, y: 0.90 } : undefined,
        eScale: !isP ? { x: 1.15, y: 0.90 } : undefined,
        pRot: isP ? -0.12 : undefined,
        eRot: !isP ? 0.12 : undefined,
        showEffect: true,
        moveStep: 1,
        phaseId: "peck-aim",
        phaseName: "1. 전진 돌진 및 부리 조준 (90ms)",
      },
      // 2. [1차 쪼기 직격 (콕!)]: 첫 번째 날카로운 황금 부리 타격 직격! (100ms)
      {
        ...baseFrame,
        delay: 100,
        pOffset: isP ? { x: 125, y: -48 } : (isHit ? { x: -10, y: 4 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -125, y: 48 } : (isHit ? { x: 10, y: -4 } : { x: 0, y: 0 }),
        pScale: isP ? { x: 1.25, y: 0.82 } : undefined,
        eScale: !isP ? { x: 1.25, y: 0.82 } : undefined,
        pRot: isP ? -0.18 : undefined,
        eRot: !isP ? 0.18 : undefined,
        showEffect: true,
        hitFlash: isHit,
        moveStep: 2,
        phaseId: "peck-hit-1",
        phaseName: "2. 1차 쪼기 직격 (100ms)",
      },
      // 3. [반동 튕김 & 2차 쪼기 장전]: 살짝 튕기며 2차 타격 준비 (90ms)
      {
        ...baseFrame,
        delay: 90,
        pOffset: isP ? { x: 105, y: -40 } : (isHit ? { x: -4, y: 2 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -105, y: 40 } : (isHit ? { x: 4, y: -2 } : { x: 0, y: 0 }),
        pScale: isP ? { x: 1.05, y: 0.95 } : undefined,
        eScale: !isP ? { x: 1.05, y: 0.95 } : undefined,
        showEffect: true,
        moveStep: 3,
        phaseId: "peck-reaim",
        phaseName: "3. 반동 튕김 및 2차 조준 (90ms)",
      },
      // 4. [2차 쪼기 극대 강타 (콕!)]: 한 번 더 강력하게 깊숙이 쪼아박음! (110ms)
      {
        ...baseFrame,
        delay: 110,
        pOffset: isP ? { x: 140, y: -54 } : (isHit ? { x: -14, y: 6 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -140, y: 54 } : (isHit ? { x: 14, y: -6 } : { x: 0, y: 0 }),
        pScale: isP ? { x: 1.30, y: 0.78 } : undefined,
        eScale: !isP ? { x: 1.30, y: 0.78 } : undefined,
        pRot: isP ? -0.22 : undefined,
        eRot: !isP ? 0.22 : undefined,
        showEffect: true,
        hitFlash: isHit,
        moveStep: 4,
        phaseId: "peck-hit-2",
        phaseName: "4. 2차 쪼기 극대 강타 (110ms)",
      },
      // 5. [타격 반동 및 깃털 잔향]: 콕 찌른 후 뒤로 물러나며 깃털 흩날림 (100ms)
      {
        ...baseFrame,
        delay: 100,
        pOffset: isP ? { x: 55, y: -20 } : (isHit ? { x: -5, y: 2 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -55, y: 20 } : (isHit ? { x: 5, y: -2 } : { x: 0, y: 0 }),
        showEffect: true,
        moveStep: 5,
        phaseId: "peck-recoil",
        phaseName: "5. 타격 반동 및 깃털 비산 (100ms)",
      },
      // 6. [원위치 복귀]: 기본자세 복귀 (90ms)
      {
        ...baseFrame,
        delay: 90,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        phaseId: "peck-end",
        phaseName: "6. 기술 종료 및 복귀 (90ms)",
      },
    ];
  },
};
