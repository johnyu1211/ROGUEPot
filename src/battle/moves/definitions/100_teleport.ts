// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawTeleportEffect, drawTeleportBehindEffect } from "../../../renderers/moves/gen1/move097_100.js";

/**
 * 100: 순간이동 (Teleport) - 에스퍼 타입 차원 전이 및 이탈 기술
 *
 * 연출:
 * 1. 시전자 주변 3중 3D 사이킥 링 회전 & 살짝 부유
 * 2. 수직 차원 와핑 빔 & 시전자 수직 스트레치 입자화
 * 3. 팝 섬광과 함께 시전자 완전 소멸 (hidePlayer/hideEnemy)
 * 4. 빈 자리에 차원 파문 링 & 흩날리는 사이킥 스타더스트
 * 5. 반대편/원위치에 뿅 재출현 & 탄성 복귀
 */
export const teleportMove: BattleMoveAnimation = {
  num: 100,
  key: "teleport",
  nameKo: "순간이동",
  nameEn: "Teleport",
  type: "psychic",
  category: "status",
  camera: { type: "self", zoom: 1.25 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawTeleportBehindEffect(targetCtx, attackerPos, targetPos, step, prog, frame);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawTeleportEffect(targetCtx, attackerPos, targetPos, step, prog, frame);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.25,
      pRot: 0,
      eRot: 0,
    };

    // [절대 규칙 준수] 시전자 전용 오프셋 (수비자는 절대 {0,0} 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    return [
      // #1. 사이킥 텔레포트 차징 (3D 회전 링 & 살짝 부유)
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, -8),
        pScale: isP ? { x: 0.94, y: 1.08 } : undefined,
        eScale: !isP ? { x: 0.94, y: 1.08 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.45,
        phaseId: "teleport-charge",
        phaseName: "#1. 사이킥 차원 차징",
      },
      // #2. 수직 차원 와핑 빔 (시전자 수직 스트레치)
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, -14),
        pScale: isP ? { x: 0.35, y: 1.95 } : undefined,
        eScale: !isP ? { x: 0.35, y: 1.95 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.80,
        phaseId: "teleport-warp",
        phaseName: "#2. 수직 차원 와핑 빔",
      },
      // #3. 순간 소멸 팝 플래시 (시전자 완전 사라짐)
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, 0),
        hidePlayer: isP,
        hideEnemy: !isP,
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.50,
        phaseId: "teleport-pop",
        phaseName: "#3. 순간 소멸 팝 플래시",
      },
      // #4. 잔여 차원 파문 & 스타더스트 부유
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, 0),
        hidePlayer: isP,
        hideEnemy: !isP,
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.65,
        phaseId: "teleport-stardust",
        phaseName: "#4. 스타더스트 & 차원 파문",
      },
      // #5. 재출현 뿅 (탄성 찌그러짐 복귀)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 4),
        hidePlayer: false,
        hideEnemy: false,
        pScale: isP ? { x: 1.25, y: 0.78 } : undefined,
        eScale: !isP ? { x: 1.25, y: 0.78 } : undefined,
        showEffect: false,
        hitFlash: false,
        moveStep: 5,
        effectProgress: 0.85,
        phaseId: "teleport-reappear",
        phaseName: "#5. 재출현 및 착지",
      },
      // #6. 안정 복귀
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        hidePlayer: false,
        hideEnemy: false,
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: false,
        hitFlash: false,
        moveStep: 5,
        effectProgress: 1.0,
        phaseId: "teleport-finish",
        phaseName: "#6. 안정 복귀",
      },
    ];
  },
};
