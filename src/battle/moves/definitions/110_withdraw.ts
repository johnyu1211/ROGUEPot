// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawWithdrawEffect } from "../../../renderers/moves/gen1/move109_112.js";

/**
 * 110: 껍질에숨기 (Withdraw) - 물 타입 변화 기술 (자신의 방어 1랭크 상승)
 *
 * 연출 구성:
 * #1. 시전자 하향 수축 웅크림 & 양쪽 조개 껍질 출현 (Open)
 * #2. 조개 껍질이 안쪽으로 빠르게 좁혀오며 급속 닫힘 (Closing)
 * #3. [딱! 맞물려 닫힘] 중앙 접합선 맞물림 & 세로 섬광 & 서로 다른 높이의 상단 3개 물방울 출현
 * #4. [경질화 클라이맥스] 단단한 경질화 반짝임 (칭! Tink!) & 3개 물방울 상승 및 반투명화
 * #5. 조개 껍질 살짝 열리며 물빛 승화 해제, 물방울 상공 부유 투명 소멸 & 시전자 기상
 * #6. 시전자 제자리 복귀 완료
 */
export const withdrawMove: BattleMoveAnimation = {
  num: 110,
  key: "withdraw",
  nameKo: "껍질에숨기",
  nameEn: "Withdraw",
  type: "water",
  category: "status",
  camera: { type: "self", zoom: 1.35 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawWithdrawEffect(targetCtx, attackerPos, targetPos, step, prog);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.35,
      cameraTrackAttacker: true,
      isAttackerPlayer: isP,
      pRot: 0,
      eRot: 0,
    };

    return [
      // #1. 시전자 수축 시작 & 양쪽 조개 껍질 출현 (Open)
      {
        ...baseFrame,
        delay: 85,
        pOffset: isP ? { x: 0, y: 5 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: 5 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.12, y: 0.88 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 1.12, y: 0.88 } : { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.35,
        phaseId: "withdraw-shell-appear",
        phaseName: "#1. 양쪽 조개 껍질 출현",
      },
      // #2. 시전자 완전 웅크림 & 조개 껍질 안쪽으로 급속 닫힘
      {
        ...baseFrame,
        delay: 80,
        pOffset: isP ? { x: 0, y: 8 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: 8 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.20, y: 0.78 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 1.20, y: 0.78 } : { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.75,
        phaseId: "withdraw-shell-closing",
        phaseName: "#2. 조개 껍질 급속 닫힘",
      },
      // #3. [딱! 닫힘] 양쪽 껍질 맞물림 & 접합선 섬광 & 서로 다른 높이의 3개 물방울 출현
      {
        ...baseFrame,
        delay: 115,
        pOffset: isP ? { x: 0, y: 8 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: 8 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.20, y: 0.78 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 1.20, y: 0.78 } : { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.25,
        phaseId: "withdraw-shell-shut",
        phaseName: "#3. 조개 껍질 맞물려 닫힘",
      },
      // #4. [경질화 클라이맥스] 단단한 경질화 반짝임 (칭! Tink!) & 물방울 상승 및 반투명화
      {
        ...baseFrame,
        delay: 125,
        pOffset: isP ? { x: 0, y: 8 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: 8 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.18, y: 0.82 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 1.18, y: 0.82 } : { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.85,
        phaseId: "withdraw-shell-harden",
        phaseName: "#4. 껍질 경질화 반짝임 & 물방울 상승",
      },
      // #5. 조개 껍질 서서히 열리며 페이드아웃 & 물방울 투명 소멸 & 시전자 기상
      {
        ...baseFrame,
        delay: 95,
        pOffset: isP ? { x: 0, y: 3 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: 3 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.08, y: 0.94 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 1.08, y: 0.94 } : { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.50,
        phaseId: "withdraw-shell-open-emerge",
        phaseName: "#5. 껍질 열림 & 시전자 기상",
      },
      // #6. 시전자 제자리 복귀 완료
      {
        ...baseFrame,
        delay: 110,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: false,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 1.0,
        phaseId: "withdraw-complete",
        phaseName: "#6. 시전자 복귀 완료",
      },
    ];
  },
};
