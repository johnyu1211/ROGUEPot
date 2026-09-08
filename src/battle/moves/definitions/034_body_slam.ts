// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawBodySlamEffect } from "../../../renderers/moves/gen1/move033_036.js";

/**
 * 034: 누르기 (Body Slam)
 * 
 * Concept (User Directed):
 * - 시전 포켓몬의 스프라이트가 대상 포켓몬 스프라이트 중간보다 살짝 위인 위치로 이동
 * - 이때 시전 포켓몬이 z축 위 (drawEnemyOnTop: !isP)
 * - 살짝 납작해지면서(scale: { x: 1.35, y: 0.65 }) 아래로 밀기(짓누르기 압박)
 * - 반동으로 튕겨 제자리 착지
 */
export const bodySlamMove: BattleMoveAnimation = {
  num: 34,
  key: "body-slam",
  nameKo: "누르기",
  nameEn: "Body Slam",
  type: "normal",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    return [
      // 1. 공중 도약 상승 (140ms) - 천천히 포물선을 그리며 도약
      {
        delay: 140,
        pOffset: isP ? { x: 130, y: -120 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -130, y: 120 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.90, y: 1.15 } : undefined,
        eScale: !isP ? { x: 0.90, y: 1.15 } : undefined,
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 1,
        phaseId: "bodyslam-ascend",
        phaseName: "1. 공중 도약 상승",
      },
      // 2. [유저 요구사항] 대상 머리 위 포지셔닝 (시전 포켓몬이 z축 위) (110ms)
      {
        delay: 110,
        pOffset: isP ? { x: 255, y: -155 } : (isHit ? { x: -6, y: 2 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -255, y: 115 } : (isHit ? { x: 6, y: -2 } : { x: 0, y: 0 }),
        pScale: isP ? { x: 1.10, y: 0.90 } : undefined,
        eScale: !isP ? { x: 1.10, y: 0.90 } : undefined,
        drawEnemyOnTop: !isP, // 시전 포켓몬이 항상 Z축 위!
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 1,
        phaseId: "bodyslam-hover",
        phaseName: "2. 대상 머리 위 포지셔닝",
      },
      // 3. [유저 요구사항] 하강 접촉 & 1차 짓누르기 (180ms) - 과한 플래시 제거
      {
        delay: 180,
        pOffset: isP ? { x: 255, y: -128 } : (isHit ? { x: -6, y: 12 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -255, y: 138 } : (isHit ? { x: 6, y: 12 } : { x: 0, y: 0 }),
        pScale: isP ? { x: 1.30, y: 0.70 } : { x: 1.20, y: 0.75 },
        eScale: isP ? { x: 1.20, y: 0.75 } : { x: 1.30, y: 0.70 },
        drawEnemyOnTop: !isP,
        showEffect: isHit,
        hitFlash: false, // [유저 요구사항] 과한 화면 번쩍임 완전 제거!
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 2,
        phaseId: "bodyslam-press-contact",
        phaseName: "3. 짓누르기 접촉",
      },
      // 4. [유저 요구사항 - 핵심] '지긋이' 온몸으로 꽉 누르고 버티기 (300ms)
      {
        delay: 300,
        pOffset: isP ? { x: 255, y: -123 } : (isHit ? { x: -6, y: 16 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -255, y: 142 } : (isHit ? { x: 6, y: 16 } : { x: 0, y: 0 }),
        pScale: isP ? { x: 1.38, y: 0.62 } : { x: 1.28, y: 0.65 }, // 최대 납작 상태로 묵직하게 버팀
        eScale: isP ? { x: 1.28, y: 0.65 } : { x: 1.38, y: 0.62 },
        drawEnemyOnTop: !isP,
        showEffect: isHit,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 2,
        phaseId: "bodyslam-steady-hold",
        phaseName: "4. 지긋이 누르기 (체중 압박 유지)",
      },
      // 5. 반동 도약 공중 튕겨짐 (130ms)
      {
        delay: 130,
        pOffset: isP ? { x: 130, y: -75 } : (isHit ? { x: -2, y: 4 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -130, y: 75 } : (isHit ? { x: 2, y: -4 } : { x: 0, y: 0 }),
        pScale: isP ? { x: 0.95, y: 1.05 } : undefined,
        eScale: !isP ? { x: 0.95, y: 1.05 } : undefined,
        showEffect: false,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        moveStep: 3,
        phaseId: "bodyslam-rebound",
        phaseName: "5. 반동 공중 튕겨짐",
      },
      // 6. 제자리 착지 (100ms)
      {
        delay: 100,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: isP ? { x: 1.10, y: 0.90 } : undefined,
        eScale: !isP ? { x: 1.10, y: 0.90 } : undefined,
        showEffect: false,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        phaseId: "bodyslam-land",
        phaseName: "6. 제자리 착지",
      },
      // 7. 정위치 복귀 (120ms)
      {
        delay: 120,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        textLineIdx,
        isBlur: false,
        moveEffect: a,
        phaseId: "recovery",
        phaseName: "7. 정위치 복귀",
      }
    ];
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (frame.showEffect && drawCtx.targetPos) {
      drawBodySlamEffect(targetCtx, drawCtx.targetPos, frame.moveStep ?? 1);
    }
  }
};
