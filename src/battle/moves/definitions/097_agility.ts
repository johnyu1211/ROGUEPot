// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawAgilityEffect, drawAgilityBehindEffect } from "../../../renderers/moves/gen1/move097_100.js";

/**
 * 097: 고속이동 (Agility) - 에스퍼 타입 스피드 2랭크 상승 변화기
 *
 * 연출:
 * 1. 시전자 웅크림 및 가속 도약 시동 (발밑 펄스 링)
 * 2. 좌우 초고속 횡이동 잔상 분신 (3중 시안/민트/화이트 애프터이미지)
 * 3. 수평 초광속 스피드라인 스트림 & 바람 절단파 분출
 * 4. 정위치 착지 & 에메랄드 스피드 상승 쉐브론 화살표 솟구침 (+2 랭크업)
 * 5. 잔여 스파크 입자 페이드아웃 및 안정 복귀
 */
export const agilityMove: BattleMoveAnimation = {
  num: 97,
  key: "agility",
  nameKo: "고속이동",
  nameEn: "Agility",
  type: "psychic",
  category: "status",
  camera: { type: "self", zoom: 1.25 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawAgilityBehindEffect(targetCtx, attackerPos, targetPos, step, prog, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawAgilityEffect(targetCtx, attackerPos, targetPos, step, prog, frame, drawCtx);
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
      // #1. 웅크리며 가속 충전 (발밑 가속 펄스 링)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 4),
        pScale: isP ? { x: 1.10, y: 0.90 } : undefined,
        eScale: !isP ? { x: 1.10, y: 0.90 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.35,
        phaseId: "agility-crouch",
        phaseName: "#1. 가속 웅크리기 & 발밑 펄스",
      },
      // #2. 가속 도약 시동
      {
        ...baseFrame,
        delay: 85,
        ...cOff(4, -6),
        pScale: isP ? { x: 0.95, y: 1.06 } : undefined,
        eScale: !isP ? { x: 0.95, y: 1.06 } : undefined,
        showEffect: false,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.85,
        phaseId: "agility-launch",
        phaseName: "#2. 초고속 도약 시동",
      },
      // #3. 좌우 초고속 횡이동 잔상 분신 (좌측)
      {
        ...baseFrame,
        delay: 80,
        ...cOff(-18, -2),
        pScale: isP ? { x: 1.15, y: 0.88 } : undefined,
        eScale: !isP ? { x: 1.15, y: 0.88 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.35,
        phaseId: "agility-flicker-1",
        phaseName: "#3. 초고속 횡이동 잔상 (좌)",
      },
      // #4. 좌우 초고속 횡이동 잔상 분신 (우측)
      {
        ...baseFrame,
        delay: 80,
        ...cOff(18, -4),
        pScale: isP ? { x: 1.15, y: 0.88 } : undefined,
        eScale: !isP ? { x: 1.15, y: 0.88 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.75,
        phaseId: "agility-flicker-2",
        phaseName: "#4. 초고속 횡이동 잔상 (우)",
      },
      // #5. 초광속 질주 가속 잔영
      {
        ...baseFrame,
        delay: 85,
        ...cOff(6, -6),
        pScale: isP ? { x: 0.96, y: 1.05 } : undefined,
        eScale: !isP ? { x: 0.96, y: 1.05 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.45,
        phaseId: "agility-stream-1",
        phaseName: "#5. 스피드 스트림 라인 방출",
      },
      // #6. 바람 절단파 전개
      {
        ...baseFrame,
        delay: 85,
        ...cOff(-4, -2),
        pScale: isP ? { x: 1.05, y: 0.96 } : undefined,
        eScale: !isP ? { x: 1.05, y: 0.96 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.85,
        phaseId: "agility-stream-2",
        phaseName: "#6. 바람 절단파 분출",
      },
      // #7. 정위치 착지
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        pScale: isP ? { x: 1.05, y: 0.95 } : undefined,
        eScale: !isP ? { x: 1.05, y: 0.95 } : undefined,
        showEffect: false,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.5,
        phaseId: "agility-land",
        phaseName: "#7. 정위치 착지",
      },
      // #8. 모션 복귀 완료
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: false,
        hitFlash: false,
        moveStep: 5,
        effectProgress: 1.0,
        phaseId: "agility-finish",
        phaseName: "#8. 안정 복귀",
      },
    ];
  },
};
