import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawCounterBehindEffect, drawCounterEffect } from "../../../renderers/moves/gen1/move065_068.js";

/**
 * 068: 카운터 (Counter)
 * 
 * 사용자 요구사항:
 * - "내가 의도한건 살짝 뒤로 움직임 (색깔같은거 없이 넣는다면 살짝 희게변했다가)"
 * - "뒤로돈다는건 (후면 전면 후면) 하면서 살짝 우측 혹은 좌측으로 움직이고 적을 타격"
 * - "화면 백색 그리고 페이드아웃"
 * 
 * 구현 상세:
 * 1. [살짝 뒤로 물러남 & 살짝 희게 변함]: 시전자가 뒤로 살짝 물러나며 순간 백색 틴트(80ms)
 * 2. [3D 회전 시작 & 우측 위빙]: 후면 ➔ 측면(scaleX: 0.28)으로 압축되며 우측으로 살짝 이동(70ms)
 * 3. [전면 노출 & 적을 향해 가속 쇄도]: 전면(usePlayerFront: true)을 보이며 적 방향으로 쇄도(75ms)
 * 4. [전면 ➔ 측면 압축 회전]: 전면에서 다시 측면으로 돌아서는 중간 회전(70ms)
 * 5. [후면 복귀 & 적 타격 & 화면 백색]: 후면(usePlayerFront: false)으로 복귀하며 적 직격 강타 & 화면 100% 백색 폭발!(95ms)
 * 6. [백색 페이드아웃 1단계]: 적 넉백 & 화면 백색 0.50 페이드아웃(90ms)
 * 7. [백색 페이드아웃 2단계]: 시전자 복귀 & 화면 백색 0.18 페이드아웃(80ms)
 * 8. [기본 자세 완전 복귀]: 백색 소멸 및 원위치 착지(75ms)
 */
export const counterMove: BattleMoveAnimation = {
  num: 68,
  key: "counter",
  nameKo: "카운터",
  nameEn: "Counter",
  type: "fighting",
  category: "physical",
  camera: { type: "target", zoom: 1.25 },
  drawBehindEffect: drawCounterBehindEffect,
  drawEffect: drawCounterEffect,
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
      // 1. [살짝 뒤로 물러남]: 시전자가 뒤로 살짝 물러나며 살짝 희게 변함 (80ms)
      {
        ...baseFrame,
        delay: 80,
        pOffset: isP ? { x: -14, y: 6 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 14, y: -6 } : { x: 0, y: 0 },
        pWhiteTint: isP ? true : undefined,
        eWhiteTint: !isP ? true : undefined,
        usePlayerFront: false,
        useEnemyBack: false,
        showEffect: false,
        moveStep: 1,
        phaseId: "counter-step-back",
        phaseName: "1. 살짝 뒤로 물러남 (살짝 희게, 80ms)",
      },
      // 2. [3D 회전 시작 & 우측 위빙]: 후면 ➔ 측면 압축 (70ms)
      {
        ...baseFrame,
        delay: 70,
        pOffset: isP ? { x: 10, y: 8 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -10, y: -8 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.28, y: 1.05 } : undefined,
        eScale: !isP ? { x: 0.28, y: 1.05 } : undefined,
        usePlayerFront: false,
        useEnemyBack: false,
        showEffect: false,
        moveStep: 2,
        phaseId: "counter-spin-start",
        phaseName: "2. 3D 회전 시작 & 우측 위빙 (70ms)",
      },
      // 3. [전면 노출 & 적을 향해 가속 쇄도]: (후면 ➔ '전면' ➔ 후면) (75ms)
      {
        ...baseFrame,
        delay: 75,
        pOffset: isP ? { x: 34, y: -4 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -34, y: 4 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.95, y: 1.0 } : undefined,
        eScale: !isP ? { x: 0.95, y: 1.0 } : undefined,
        usePlayerFront: isP ? true : false,
        useEnemyBack: !isP ? true : false,
        showEffect: false,
        moveStep: 3,
        phaseId: "counter-spin-front",
        phaseName: "3. 전면 노출 & 쇄도 (75ms)",
      },
      // 4. [전면 ➔ 측면 압축 회전]: 돌아서며 적 코앞 도달 (70ms)
      {
        ...baseFrame,
        delay: 70,
        pOffset: isP ? { x: 48, y: -10 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -48, y: 10 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.28, y: 1.05 } : undefined,
        eScale: !isP ? { x: 0.28, y: 1.05 } : undefined,
        usePlayerFront: isP ? true : false,
        useEnemyBack: !isP ? true : false,
        showEffect: false,
        moveStep: 4,
        phaseId: "counter-spin-turn",
        phaseName: "4. 전면에서 후면으로 회전 (70ms)",
      },
      // 5. [후면 복귀 완료 & 적 타격 & 화면 백색 폭발]: 적 직격 강타 & 100% 백색 플래시 (95ms)
      {
        ...baseFrame,
        delay: 95,
        pOffset: isP ? { x: 58, y: -14 } : (isHit ? { x: -24, y: 10 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -58, y: 14 } : (isHit ? { x: 24, y: -10 } : { x: 0, y: 0 }),
        pScale: isP ? { x: 1.12, y: 0.92 } : (isHit ? { x: 0.92, y: 1.08 } : undefined),
        eScale: !isP ? { x: 1.12, y: 0.92 } : (isHit ? { x: 0.92, y: 1.08 } : undefined),
        usePlayerFront: false,
        useEnemyBack: false,
        showEffect: true,
        showSlash: true,
        isHit,
        hitFlash: isHit,
        bgWhiteAlpha: 1.0,
        whiteAlpha: 0.92,
        moveStep: 5,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "counter-strike-whiteout",
        phaseName: "5. 후면 복귀 & 적 타격 & 화면 백색 (95ms)",
      },
      // 6. [백색 페이드아웃 1단계]: 적 넉백 피격 & 백색 서서히 감소 (90ms)
      {
        ...baseFrame,
        delay: 90,
        pOffset: isP ? { x: 38, y: -9 } : (isHit ? { x: -16, y: 6 } : { x: 0, y: 0 }),
        eOffset: isP ? (isHit ? { x: 16, y: -6 } : { x: 0, y: 0 }) : { x: -38, y: 9 },
        usePlayerFront: false,
        useEnemyBack: false,
        showEffect: true,
        bgWhiteAlpha: 0.65,
        whiteAlpha: 0.50,
        moveStep: 6,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "counter-fadeout-1",
        phaseName: "6. 백색 페이드아웃 1단계 (90ms)",
      },
      // 7. [백색 페이드아웃 2단계 & 시전자 복귀 착지]: (80ms)
      {
        ...baseFrame,
        delay: 80,
        pOffset: isP ? { x: 14, y: -3 } : (isHit ? { x: -6, y: 2 } : { x: 0, y: 0 }),
        eOffset: isP ? (isHit ? { x: 6, y: -2 } : { x: 0, y: 0 }) : { x: -14, y: 3 },
        usePlayerFront: false,
        useEnemyBack: false,
        showEffect: true,
        bgWhiteAlpha: 0.25,
        whiteAlpha: 0.18,
        moveStep: 7,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "counter-fadeout-2",
        phaseName: "7. 백색 페이드아웃 2단계 & 복귀 (80ms)",
      },
      // 8. [기본 자세 완전 복귀]: (75ms)
      {
        ...baseFrame,
        delay: 75,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        usePlayerFront: false,
        useEnemyBack: false,
        showEffect: false,
        moveStep: 8,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "counter-recover",
        phaseName: "8. 기본 자세 완전 복귀 (75ms)",
      },
    ];
  },
};
