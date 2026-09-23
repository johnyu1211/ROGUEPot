import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawTackleEffect, drawTackleBehindEffect } from "../../../renderers/moves/gen1/move033_036.js";

export const tackleMove: BattleMoveAnimation = {
  num: 33,
  key: "tackle",
  nameKo: "몸통박치기",
  nameEn: "Tackle",
  type: "normal",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.35,
    };

    // 시전자 전용 오프셋 (수비수 오프셋을 덮어쓰지 않도록 해당 주체만 반환)
    const cOff = (x: number, y: number) =>
      isP ? { pOffset: { x, y } } : { eOffset: { x: -x, y: -y } };

    // 피격자 전용 오프셋 (시전자 오프셋을 덮어쓰지 않도록 해당 주체만 반환)
    const cTargetOff = (x: number, y: number) =>
      isP ? { eOffset: { x, y } } : { pOffset: { x: -x, y: -y } };

    // 시전자 스케일 및 틸트
    const cTransform = (scaleX: number, scaleY: number, rot: number) => ({
      pScale: isP ? { x: scaleX, y: scaleY } : undefined,
      eScale: !isP ? { x: scaleX, y: scaleY } : undefined,
      pRot: isP ? rot : 0,
      eRot: !isP ? -rot : 0,
    });

    return [
      // 1. 도움닫기 웅크림 (뒤로 살짝 물러서며 탄성 축적 & 발밑 흙먼지)
      {
        ...baseFrame,
        delay: 90,
        ...cOff(-16, 6),
        ...cTargetOff(0, 0),
        ...cTransform(1.14, 0.86, -0.06),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.20,
        phaseId: "tackle-windup",
        phaseName: "1. 도움닫기 웅크림",
      },
      // 2. 전방 고속 쇄도 (목표를 향해 강력히 돌진 & 스피드 스트림)
      {
        ...baseFrame,
        delay: 80,
        ...cOff(46, -17),
        ...cTargetOff(0, 0),
        ...cTransform(0.86, 1.16, 0.10),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.50,
        phaseId: "tackle-dash",
        phaseName: "2. 전방 고속 쇄도",
      },
      // 3. 정면 격돌 직격 (순백 스타버스트 섬광 작렬 & 피격 플래시)
      {
        ...baseFrame,
        delay: 75,
        ...cOff(66, -24),
        ...(isHit ? cTargetOff(10, -4) : cTargetOff(0, 0)),
        ...cTransform(1.20, 0.84, 0.02),
        showEffect: isHit,
        hitFlash: isHit,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 3,
        effectProgress: 0.20,
        phaseId: "tackle-impact-hit",
        phaseName: "3. 정면 격돌 직격 & 스타버스트",
      },
      // 4. 충돌 폭발 & 최대 넉백 (충격파 링 확산 & 별빛 스파크 비산 & 관통 속도선)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(70, -26),
        ...(isHit ? cTargetOff(18, -7) : cTargetOff(0, 0)),
        ...cTransform(1.16, 0.86, 0.02),
        showEffect: isHit,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 3,
        effectProgress: 0.70,
        phaseId: "tackle-impact-burst",
        phaseName: "4. 충돌 폭발 & 넉백 전개",
      },
      // 5. 충돌 반동 및 잔향 (반작용으로 튕겨 나오며 충격파 소멸)
      {
        ...baseFrame,
        delay: 95,
        ...cOff(24, -9),
        ...(isHit ? cTargetOff(6, -2) : cTargetOff(0, 0)),
        ...cTransform(0.95, 1.05, 0),
        showEffect: isHit,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 4,
        effectProgress: 1.0,
        phaseId: "tackle-rebound",
        phaseName: "5. 충돌 반동 & 잔향",
      },
      // 5. 정위치 복귀
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...cTargetOff(0, 0),
        ...cTransform(1.0, 1.0, 0),
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 5,
        effectProgress: 1.0,
        phaseId: "tackle-finish",
        phaseName: "5. 정위치 복귀",
      },
    ];
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos, isPlayer } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    const actOff = isPlayer ? (frame.pOffset ?? { x: 0, y: 0 }) : (frame.eOffset ?? { x: 0, y: 0 });
    const curAttackerPos = { x: attackerPos.x + actOff.x, y: attackerPos.y + actOff.y };
    drawTackleBehindEffect(targetCtx, curAttackerPos, targetPos, step, prog, isPlayer);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect || !drawCtx.targetPos) return;
    const { attackerPos, targetPos, isPlayer } = drawCtx;
    const step = frame.moveStep ?? 3;
    const prog = frame.effectProgress ?? 0.65;
    const actOff = isPlayer ? (frame.pOffset ?? { x: 0, y: 0 }) : (frame.eOffset ?? { x: 0, y: 0 });
    const curAttackerPos = { x: attackerPos.x + actOff.x, y: attackerPos.y + actOff.y };
    drawTackleEffect(targetCtx, targetPos, curAttackerPos, step, prog, isPlayer);
  }
};
