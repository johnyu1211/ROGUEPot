// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawBrickBreakBehindEffect,
  drawBrickBreakEffect,
} from "../../../renderers/moves/gen1/move277_280.js";

/**
 * 🧱 280: 깨뜨리다 (Brick Break / かわらわり) - 격투 타입 물리 공격 기술
 *
 * 위력: 75 / 명중: 100 / PP: 15 / 접촉: O
 * 설명: 수도로 기세 좋게 내려쳐서 상대를 공격한다. 빛의장막이나 리플렉터도 파괴할 수 있다.
 */
export const brickBreakMove: BattleMoveAnimation = {
  num: 280,
  key: "brick-break",
  nameKo: "깨뜨리다",
  nameEn: "Brick Break",
  type: "fighting",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawBrickBreakBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (drawCtx.targetPos && (frame.showEffect || (frame.moveStep && frame.moveStep >= 1))) {
      drawBrickBreakEffect(targetCtx, frame, drawCtx);
    }
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;
    return [
      // 1A: Hand appears hovering above target head (130ms)
      {
        delay: 130,
        pOffset: isP ? { x: 12, y: -5 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -12, y: 5 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 1,
      },
      // 1B: Minor pre-drop positioning (140ms)
      {
        delay: 140,
        pOffset: isP ? { x: 16, y: -6 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -16, y: 6 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 2,
      },
      // 1C: Windup raise and hold (150ms)
      {
        delay: 150,
        pOffset: isP ? { x: 18, y: -8 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -18, y: 8 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 3,
      },
      // 1D: Downward chop passing through target (닿는 부분: 일시적으로 투명해짐 + 타격! 90ms)
      {
        delay: 90,
        pOffset: isP ? { x: 20, y: -10 } : { x: -8, y: 4 },
        eOffset: isP ? { x: 0, y: 0 } : { x: -20, y: 10 },
        showEffect: true,
        hitFlash: true,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 4,
      },
      // 1E: 대상 포켓몬 그라운드 아래까지 이동 완료 (불투명도 복구, 130ms)
      {
        delay: 130,
        pOffset: isP ? { x: 14, y: -6 } : { x: -4, y: 2 },
        eOffset: isP ? { x: 0, y: 0 } : { x: -14, y: 6 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 5,
      },
      // 1F: 그라운드 아래에서 손 잔상 페이드아웃 (100ms)
      {
        delay: 100,
        pOffset: isP ? { x: 8, y: -3 } : { x: 0, y: 0 },
        eOffset: isP ? { x: 0, y: 0 } : { x: -8, y: 3 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 6,
      },
      // 1G: 손 완전히 사라지고 원래 위치 복귀 (100ms)
      {
        delay: 100,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 7,
      },
    ];
  },
};

