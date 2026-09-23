// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawToxicEffect } from "../../../renderers/moves/gen1/move089_092.js";

/**
 * 092: 맹독 (Toxic) - 독 타입 변화 기술 (상태이상 맹독)
 *
 * 연출 구성:
 * #1. 시전자 입가/코어에 짙은 암자색 맹독 액포 응축
 * #2. 3발의 끈적한 맹독 슬러지 탄환이 궤적을 그리며 대상에게 고속 투척
 * #3. 대상 몸체에 독액 철퍽 스플래터 & 부식성 독 웅덩이 착탄
 * #4. 피어오르는 맹독 해골 기화 & 보라 독기운 속 맹독 상태이상 각인
 */
export const toxicMove: BattleMoveAnimation = {
  num: 92,
  key: "toxic",
  nameKo: "맹독",
  nameEn: "Toxic",
  type: "poison",
  category: "status",
  camera: { type: "target", zoom: 1.30 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawToxicEffect(targetCtx, attackerPos, targetPos, step, prog);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.30,
      pRot: 0,
      eRot: 0,
    };

    return [
      // #1. 시전자 웅크림 및 독액 응축 준비
      {
        ...baseFrame,
        delay: 85,
        pOffset: isP ? { x: -3, y: 3 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 3, y: -3 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.08, y: 0.92 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 1.08, y: 0.92 } : { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.30,
        phaseId: "toxic-condense-1",
        phaseName: "#1. 맹독액 응축 준비",
      },
      // #2. 맹독 액포 팽창 및 기포 부글거림
      {
        ...baseFrame,
        delay: 90,
        pOffset: isP ? { x: -4, y: 2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 4, y: -2 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.04, y: 0.96 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 1.04, y: 0.96 } : { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.85,
        phaseId: "toxic-condense-2",
        phaseName: "#2. 맹독 구체 팽창",
      },
      // #3. 대형 맹독 구체 투척 및 포물선 비행 1
      {
        ...baseFrame,
        delay: 80,
        pOffset: isP ? { x: 4, y: -2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -4, y: 2 } : { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.35,
        phaseId: "toxic-launch-1",
        phaseName: "#3. 대형 맹독 구체 투척",
      },
      // #4. 대형 맹독 구체 비행 및 대상 접근
      {
        ...baseFrame,
        delay: 85,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.85,
        phaseId: "toxic-launch-2",
        phaseName: "#4. 대형 맹독 구체 비행",
      },
      // #5. [독액 착탄] 대상 몸체에 독액 철퍽 스플래터 & 보라빛 피격 충격
      {
        ...baseFrame,
        delay: 110,
        pOffset: isP ? { x: 0, y: 0 } : { x: -3, y: 4 },
        eOffset: isP ? { x: 3, y: 4 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.0, y: 1.0 } : { x: 1.08, y: 0.92 },
        eScale: isP ? { x: 1.08, y: 0.92 } : { x: 1.0, y: 1.0 },
        targetPurpleLevel: 1,
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.40,
        phaseId: "toxic-splatter-1",
        phaseName: "#5. 독액 스플래터 착탄",
      },
      // #6. 바닥 부식 웅덩이 확장 및 독 거품 솟구침
      {
        ...baseFrame,
        delay: 100,
        pOffset: isP ? { x: 0, y: 0 } : { x: 2, y: -2 },
        eOffset: isP ? { x: -2, y: 2 } : { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        targetPurpleLevel: 2,
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.85,
        phaseId: "toxic-splatter-2",
        phaseName: "#6. 부식 독 웅덩이 확장",
      },
      // #7. [맹독 각인] 피어오르는 맹독 해골 기화 & 독가스 확산
      {
        ...baseFrame,
        delay: 120,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        targetPurpleLevel: 2,
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.45,
        phaseId: "toxic-skull-rise",
        phaseName: "#7. 맹독 해골 기화 및 독기운 확산",
      },
      // #8. 맹독 상태이상 착색 완료 및 잔여 독연기 페이드아웃
      {
        ...baseFrame,
        delay: 110,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        targetPurpleLevel: 1,
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.90,
        phaseId: "toxic-fade",
        phaseName: "#8. 맹독 부여 완료 및 종료",
      },
    ];
  },
};
