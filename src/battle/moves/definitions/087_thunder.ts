// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawThunderEffect } from "../../../renderers/moves/gen1/move085_088.js";

/**
 * 087: 번개 (Thunder) - 전기 타입 최고위력 특수기 (30% 확률 마비)
 *
 * 연출:
 * - 하늘에 짙은 먹구름 뇌운 집결 & 대기 경고 섬광
 * - 하늘 최상단에서 수직 강하하는 초대형 거대 벼락 기둥 (Trunk Bolt & 분기 낙뢰)
 * - 지면 대격돌 1프레임 순백 히트 플래시 & 지면 타원 충격파 링 2중 전개
 * - 지면에서 솟구치는 역류 뇌격 방전 & 대지 관통
 * - 16방향 초특대 뇌격 스타버스트 & 뇌격 파편 비산
 * - 지면 그을림 잔류 스파크 & 뇌운 소멸 및 복귀
 */
export const thunderMove: BattleMoveAnimation = {
  num: 87,
  key: "thunder",
  nameKo: "번개",
  nameEn: "Thunder",
  type: "electric",
  category: "special",
  camera: { type: "target", zoom: 1.40 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawThunderEffect(targetCtx, attackerPos, targetPos, step, prog);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.40,
      pRot: 0,
      eRot: 0,
    };

    return [
      // #1. 먹구름 뇌운 형성 & 대기 전조
      {
        ...baseFrame,
        delay: 100,
        pOffset: isP ? { x: -3, y: 1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 3, y: -1 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.06, y: 0.94 } : undefined,
        eScale: !isP ? { x: 1.06, y: 0.94 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.50,
        phaseId: "thunder-cloud",
        phaseName: "#1. 먹구름 뇌운 형성",
      },
      // #2. 초대형 수직 벼락 강하
      {
        ...baseFrame,
        delay: 85,
        pOffset: isP ? { x: 3, y: -1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -3, y: 1 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.85,
        phaseId: "thunder-strike-down",
        phaseName: "#2. 초대형 벼락 강하",
      },
      // #3. 지면 대격돌 순백 히트 플래시
      {
        ...baseFrame,
        delay: 105,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: -8, y: 4 } : { x: 8, y: -4 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: isHit,
        pWhiteTint: isHit && !isP,
        eWhiteTint: isHit && isP,
        moveStep: 3,
        effectProgress: 0.50,
        phaseId: "thunder-ground-blast",
        phaseName: "#3. 지면 대격돌 대폭발",
      },
      // #4. 역류 뇌격 방전 & 대지 관통
      {
        ...baseFrame,
        delay: 100,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: 5, y: -2 } : { x: -5, y: 2 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.60,
        phaseId: "thunder-upward-discharge",
        phaseName: "#4. 역류 뇌격 방전",
      },
      // #5. 16방향 초특대 스타버스트
      {
        ...baseFrame,
        delay: 100,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: -4, y: 1 } : { x: 4, y: -1 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 5,
        effectProgress: 0.70,
        phaseId: "thunder-starburst",
        phaseName: "#5. 16방향 스타버스트",
      },
      // #6. 지면 그을림 & 뇌운 소멸
      {
        ...baseFrame,
        delay: 85,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 6,
        effectProgress: 0.60,
        phaseId: "thunder-fade",
        phaseName: "#6. 지면 그을림 페이드",
      },
      // #7. 완료 및 복귀
      {
        ...baseFrame,
        delay: 75,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "thunder-complete",
        phaseName: "#7. 완료 및 복귀",
      },
    ];
  },
};
