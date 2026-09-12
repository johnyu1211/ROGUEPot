// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawStringShotEffect, drawBehindStringShotEffect } from "../../../renderers/moves/gen1/move081_084.js";

/**
 * 081: 실뿜기 (String Shot) - 벌레 타입 변화기 (스피드 2랭크 하강)
 *
 * 연출 (유저 요구사항 100% 반영):
 * 1. 암전
 * 2. 실 (약간 투명한 직선 2가닥 서로 가까운) 적에게 발사
 * 3. 적에게 닿으면 살짝 투명한 실뭉치 나타남
 * 4. 그리고 흔들리면서 가로가 줄어드는 실뭉치 결박 & 스피드 2랭크 하강
 */
export const stringShotMove: BattleMoveAnimation = {
  num: 81,
  key: "string-shot",
  nameKo: "실뿜기",
  nameEn: "String Shot",
  type: "bug",
  category: "status",
  camera: { type: "target", zoom: 1.30 },
  customStatParticles: true,
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos, isPlayer } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawBehindStringShotEffect(targetCtx, attackerPos, targetPos, step, prog, isPlayer);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos, isPlayer } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawStringShotEffect(targetCtx, attackerPos, targetPos, step, prog, isPlayer);
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
      // #1-1. 암전 페이드인 (어두워지기 시작)
      {
        ...baseFrame,
        delay: 80,
        pOffset: isP ? { x: -2, y: 1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 2, y: -1 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.03, y: 0.97 } : undefined,
        eScale: !isP ? { x: 1.03, y: 0.97 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.35,
        phaseId: "string-shot-fadein",
        phaseName: "#1. 암전 페이드인",
      },
      // #1-2. 암전 완료 & 실뿜기 준비 (시전자 입가 실크 에너지 응축)
      {
        ...baseFrame,
        delay: 95,
        pOffset: isP ? { x: -4, y: 1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 4, y: -1 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.06, y: 0.94 } : undefined,
        eScale: !isP ? { x: 1.06, y: 0.94 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.90,
        phaseId: "string-shot-darken-ready",
        phaseName: "#2. 암전 완료 & 실뿜기 준비",
      },
      // #2. 약간 투명한 2가닥 직선 실 발사 (초반 사출)
      {
        ...baseFrame,
        delay: 85,
        pOffset: isP ? { x: 4, y: -2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -4, y: 2 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.50,
        phaseId: "string-shot-fire1",
        phaseName: "#2. 2가닥 직선 실 발사",
      },
      // #3. 직선 실 표적 쇄도
      {
        ...baseFrame,
        delay: 85,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.95,
        phaseId: "string-shot-fire2",
        phaseName: "#3. 직선 실 쇄도",
      },
      // #4. 적 착탄 & 살짝 투명한 실뭉치 출현 (조임 시작: 살짝 꾸겨짐 시작)
      {
        ...baseFrame,
        delay: 105,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: -2, y: 1 } : { x: 2, y: -1 }) : { x: 0, y: 0 },
        pScale: isHit && !isP ? { x: 0.94, y: 1.03 } : undefined,
        eScale: isHit && isP ? { x: 0.94, y: 1.03 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.50,
        phaseId: "string-shot-contact",
        phaseName: "#4. 적 착탄 & 실뭉치 출현",
      },
      // #5. 흔들리며 가로가 줄어드는 실뭉치 (수축 1단계: 가로 양쪽 본격 꾸겨짐)
      {
        ...baseFrame,
        delay: 110,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: 3, y: -1 } : { x: -3, y: 1 }) : { x: 0, y: 0 },
        pScale: isHit && !isP ? { x: 0.88, y: 1.06 } : undefined,
        eScale: isHit && isP ? { x: 0.88, y: 1.06 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 5,
        effectProgress: 0.60,
        phaseId: "string-shot-shrink1",
        phaseName: "#5. 흔들리며 가로 수축 (1)",
      },
      // #6. 흔들리며 가로가 줄어드는 실뭉치 (수축 2단계 - 최대 결박: 가로 최대 꾸겨짐)
      {
        ...baseFrame,
        delay: 110,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: -3, y: 1 } : { x: 3, y: -1 }) : { x: 0, y: 0 },
        pScale: isHit && !isP ? { x: 0.83, y: 1.09 } : undefined,
        eScale: isHit && isP ? { x: 0.83, y: 1.09 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 6,
        effectProgress: 0.85,
        phaseId: "string-shot-shrink2",
        phaseName: "#6. 흔들리며 가로 수축 (2)",
      },
      // #7. 스피드 2랭크 하강 파티클 (실 풀림: 탄성으로 펴지는 반동 바운스)
      {
        ...baseFrame,
        delay: 130,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: 1, y: 0 } : { x: -1, y: 0 }) : { x: 0, y: 0 },
        pScale: isHit && !isP ? { x: 1.04, y: 0.98 } : undefined,
        eScale: isHit && isP ? { x: 1.04, y: 0.98 } : undefined,
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 7,
        effectProgress: 0.60,
        phaseId: "string-shot-debuff",
        phaseName: "#7. 스피드 2랭크 하강 & 펴짐",
      },
      // #8. 완료 및 복귀
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "string-shot-complete",
        phaseName: "#8. 완료 및 복귀",
      },
    ];
  },
};
