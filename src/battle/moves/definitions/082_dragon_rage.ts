// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawDragonRageEffect } from "../../../renderers/moves/gen1/move081_084.js";

/**
 * 082: 용의분노 (Dragon Rage) - 드래곤 타입 특수기 (40 고정 데미지)
 *
 * 연출:
 * - 시전자 분노 축적 & 청자색 드래곤 코어 응축
 * - 꼬리 불꽃 파동을 남기며 쇄도하는 거대한 용의 구체
 * - 직격 1프레임 히트 플래시 & 8방향 드래곤 충격파 대폭발
 */
export const dragonRageMove: BattleMoveAnimation = {
  num: 82,
  key: "dragon-rage",
  nameKo: "용의분노",
  nameEn: "Dragon Rage",
  type: "dragon",
  category: "special",
  camera: { type: "target", zoom: 1.35 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos, isPlayer } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawDragonRageEffect(targetCtx, attackerPos, targetPos, step, prog, isPlayer);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.35,
      pRot: 0,
      eRot: 0,
    };

    return [
      // #1. 분노 불꽃 응축 (시전자 입가 노란빛 + 보라빛 푸른 불꽃 플레어)
      {
        ...baseFrame,
        delay: 95,
        pOffset: isP ? { x: -4, y: 2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 4, y: -2 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.06, y: 0.94 } : undefined,
        eScale: !isP ? { x: 1.06, y: 0.94 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.50,
        phaseId: "dragon-rage-charge",
        phaseName: "#1. 분노 불꽃 응축",
      },
      // #2. 용의 화염 방사 시작 (노란 코어 + 보라빛 푸른불꽃 롤링 화염 사출)
      {
        ...baseFrame,
        delay: 85,
        pOffset: isP ? { x: 6, y: -2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -6, y: 2 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.50,
        phaseId: "dragon-rage-launch",
        phaseName: "#2. 용의 화염 방사 시작",
      },
      // #3. 거대한 불꽃 스트림 쇄도 (화면을 가로지르는 연속 화염 줄기)
      {
        ...baseFrame,
        delay: 90,
        pOffset: isP ? { x: 3, y: -1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -3, y: 1 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.85,
        phaseId: "dragon-rage-stream",
        phaseName: "#3. 불꽃 스트림 쇄도",
      },
      // #4. 용의 화염 직격 및 지속 방사 (1) - 시전자에서 대상까지 이어진 화염포 & 착탄
      {
        ...baseFrame,
        delay: 125,
        pOffset: isP ? { x: 2, y: 0 } : { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: -3, y: 1 } : { x: 3, y: -1 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.70,
        phaseId: "dragon-rage-contact",
        phaseName: "#4. 화염 직격 및 지속 방사 (1)",
      },
      // #5. 맹렬한 용의 화염 지속 방사 (2) - 연속 화염 줄기 맹타
      {
        ...baseFrame,
        delay: 130,
        pOffset: isP ? { x: 2, y: 0 } : { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: 4, y: -2 } : { x: -4, y: 2 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: isHit,
        targetRedTint: isHit,
        moveStep: 5,
        effectProgress: 0.85,
        phaseId: "dragon-rage-burn1",
        phaseName: "#5. 맹렬한 화염 지속 방사 (2)",
      },
      // #6. 맹렬한 용의 화염 지속 방사 (3) - 연속 화염 줄기 맹타
      {
        ...baseFrame,
        delay: 130,
        pOffset: isP ? { x: 1, y: 0 } : { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: -5, y: 2 } : { x: 5, y: -2 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        targetRedTint: isHit,
        moveStep: 6,
        effectProgress: 0.95,
        phaseId: "dragon-rage-burn2",
        phaseName: "#6. 맹렬한 화염 지속 방사 (3)",
      },
      // #7. 맹렬한 용의 화염 지속 방사 (4) - 최대 화염 방사
      {
        ...baseFrame,
        delay: 130,
        pOffset: isP ? { x: 1, y: 0 } : { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: 5, y: -2 } : { x: -5, y: 2 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        targetRedTint: isHit,
        moveStep: 7,
        effectProgress: 0.95,
        phaseId: "dragon-rage-burn3",
        phaseName: "#7. 맹렬한 화염 지속 방사 (4)",
      },
      // #8. 화염 관통 & 넉백 (화염 스트림 본체가 적을 꿰뚫고 지나감)
      {
        ...baseFrame,
        delay: 130,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: 7, y: -3 } : { x: -7, y: 3 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        targetRedTint: isHit,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 8,
        effectProgress: 0.75,
        phaseId: "dragon-rage-penetrate",
        phaseName: "#8. 화염 관통 & 넉백",
      },
      // #9. 관통 화염 페이드아웃 (화염이 적을 완전히 지나쳐 후방으로 소멸)
      {
        ...baseFrame,
        delay: 125,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: 2, y: -1 } : { x: -2, y: 1 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 9,
        effectProgress: 0.65,
        phaseId: "dragon-rage-fadeout",
        phaseName: "#9. 관통 화염 페이드아웃",
      },
      // #10. 완료 및 복귀
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "dragon-rage-complete",
        phaseName: "#10. 완료 및 복귀",
      },
    ];
  },
};
