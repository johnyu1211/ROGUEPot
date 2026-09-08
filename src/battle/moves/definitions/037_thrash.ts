// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawThrashEffect } from "../../../renderers/moves/gen1/move037_040.js";

/**
 * 037: 난동부리기 (Thrash)
 * 
 * Concept:
 * - Furious 3-hit continuous wild rampage!
 * - Step 2: Strike 1 (diagonal red slash)
 * - Step 3: Strike 2 (crossing amber slash)
 * - Step 4: Strike 3 (devastating double smash with shockwaves)
 */
export const thrashMove: BattleMoveAnimation = {
  num: 37,
  key: "thrash",
  nameKo: "난동부리기",
  nameEn: "Thrash",
  type: "normal",
  category: "physical",
  camera: { type: "target", zoom: 1.32 },
  drawEffect: drawThrashEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    return [
      // 1. 시전 포켓몬 힘차게 도약 전진
      {
        delay: 90,
        pOffset: isP ? { x: 20, y: -8 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -20, y: 8 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.15, y: 0.88 } : undefined,
        eScale: !isP ? { x: 1.15, y: 0.88 } : undefined,
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 1,
        phaseId: "thrash-windup",
        phaseName: "1. 난동부리기 도약",
      },
      // 2. 1타: 왼주먹 복부 맹타 적중! (회색 주먹 + 복부 접촉면 코믹 버스트)
      {
        delay: 120,
        pOffset: isP ? { x: 26, y: -6 } : (isHit ? { x: -12, y: 2 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -26, y: 6 } : (isHit ? { x: 12, y: -2 } : { x: 0, y: 0 }),
        showEffect: isHit,
        hitFlash: isHit,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 2,
        phaseId: "thrash-hit1-fist",
        phaseName: "2. 1타 - 왼주먹 맹타",
      },
      // 3. 2타: 오른주먹 상단 안면 강타! (반대편 주먹 쇄도)
      {
        delay: 120,
        pOffset: isP ? { x: 24, y: -8 } : (isHit ? { x: 12, y: -2 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -24, y: 8 } : (isHit ? { x: -12, y: 2 } : { x: 0, y: 0 }),
        showEffect: isHit,
        hitFlash: isHit,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 3,
        phaseId: "thrash-hit2-fist",
        phaseName: "3. 2타 - 오른주먹 강타",
      },
      // 4. 3타: 날아차기 하이킥! (대각선 초승달 궤적 & 안면 강타)
      {
        delay: 130,
        pOffset: isP ? { x: 30, y: -12 } : (isHit ? { x: -16, y: 6 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -30, y: 12 } : (isHit ? { x: 16, y: -6 } : { x: 0, y: 0 }),
        showEffect: isHit,
        hitFlash: isHit,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 4,
        phaseId: "thrash-hit3-kick",
        phaseName: "4. 3타 - 날아차기 발",
      },
      // 5. 4타: 수직 강하 거대 짓밟기 피니시! (머리 위에서 쾅! 내리찍음)
      {
        delay: 160,
        pOffset: isP ? { x: 34, y: -6 } : (isHit ? { x: 0, y: -12 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -34, y: 6 } : (isHit ? { x: 0, y: 14 } : { x: 0, y: 0 }),
        eScale: isHit ? (isP ? { x: 1.30, y: 0.72 } : undefined) : undefined,
        pScale: isHit ? (!isP ? { x: 1.30, y: 0.72 } : undefined) : undefined,
        showEffect: isHit,
        hitFlash: isHit,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 5,
        phaseId: "thrash-hit4-stomp",
        phaseName: "5. 4타 - 수직 강하 거대 짓밟기 피니시",
      },
      // 6. 피격자 넉백 진동 & 별빛 비산
      {
        delay: 100,
        pOffset: isP ? { x: 14, y: -3 } : { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: 6, y: -2 } : { x: -6, y: 2 }) : { x: 0, y: 0 },
        showEffect: isHit,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 6,
        phaseId: "thrash-flinch",
        phaseName: "6. 피격자 넉백 진동 & 별빛 비산",
      },
      // 7. 복귀 완료
      {
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 1,
        phaseId: "thrash-finish",
        phaseName: "7. 복귀 완료",
      },
    ];
  }
};
