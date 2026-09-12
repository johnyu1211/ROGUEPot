// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawGrowthEffect } from "../../../renderers/moves/gen1/move073_076.js";

/**
 * 074: 성장 (Growth)
 *
 * Concept:
 * - 자기 강화(self-buff): 시전자에게 카메라 고정
 * - 시전자 발밑에서 초록 생명 에너지가 솟구치며, 몸 주위로 새싹/잎사귀가
 *   회오리처럼 감돌아 공격력과 특수공격력이 동시에 상승하는 연출.
 * - drawGrowthEffect가 moveStep 기반 진행도(0→1)를 받아 지면 상승기류, 회오리 잎사귀,
 *   정점 초록 오라, 발밑 새싹을 순차적으로 그린다.
 * - 성장 연출(1~4프레임)에는 statProgress를 넣지 않아 기본 랭크업 파티클과 겹치지 않게 하고,
 *   마지막 자세 복귀 프레임(5)에서만 statProgress를 넣어 랭크업 파티클을 재생한다.
 */
export const growthMove: BattleMoveAnimation = {
  num: 74,
  key: "growth",
  nameKo: "성장",
  nameEn: "Growth",
  type: "normal",
  category: "status",
  camera: { type: "self", zoom: 1.20 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      showEffect: true,
      hitFlash: false,
      cameraZoom: 1.20,
      pRot: 0,
      eRot: 0,
    };

    return [
      // 1. 발밑 응축 & 웅크림 (성장 준비)
      {
        ...baseFrame,
        delay: 110,
        pOffset: isP ? { x: 0, y: 2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: 2 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.06, y: 0.94 } : undefined,
        eScale: !isP ? { x: 1.06, y: 0.94 } : undefined,
        moveStep: 1,
        phaseId: "growth-crouch",
        phaseName: "1. 발밑 응축 & 웅크림",
      },
      // 2. 지면 상승 기류 & 발밑 새싹 발아
      {
        ...baseFrame,
        delay: 130,
        pOffset: isP ? { x: 0, y: -4 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -4 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.94, y: 1.08 } : undefined,
        eScale: !isP ? { x: 0.94, y: 1.08 } : undefined,
        moveStep: 2,
        phaseId: "growth-rise1",
        phaseName: "2. 지면 상승 기류 & 새싹 발아",
      },
      // 3. 회오리 잎사귀 상승 & 오라 개화
      {
        ...baseFrame,
        delay: 150,
        pOffset: isP ? { x: 0, y: -7 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -7 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.90, y: 1.14 } : undefined,
        eScale: !isP ? { x: 0.90, y: 1.14 } : undefined,
        moveStep: 3,
        phaseId: "growth-rise2",
        phaseName: "3. 회오리 잎사귀 상승",
      },
      // 4. 정점 초록 오라 & 반짝임 (성장 연출 정점)
      {
        ...baseFrame,
        delay: 160,
        pOffset: isP ? { x: 0, y: -8 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -8 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.05, y: 1.02 } : undefined,
        eScale: !isP ? { x: 1.05, y: 1.02 } : undefined,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 4,
        phaseId: "growth-bloom",
        phaseName: "4. 정점 초록 오라 개화",
      },
      // 5. 잔향 광채 & 자세 복귀 + 랭크업 파티클 트리거
      //    (성장 연출이 끝난 뒤 statProgress를 넣어 기본 랭크업 파티클을 재생한다)
      {
        ...baseFrame,
        delay: 130,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: true,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        statProgress: 0.4,
        moveStep: 5,
        phaseId: "growth-finish",
        phaseName: "5. 잔향 광채 & 자세 복귀",
      },
      // 6. 랭크업 파티클 상승 (기본 상승 기류 재생)
      {
        ...baseFrame,
        delay: 140,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        statProgress: 0.85,
        moveStep: 5,
        phaseId: "growth-statrise",
        phaseName: "6. 랭크업 파티클 상승",
      },
      // 7. 랭크업 파티클 정점 & 마무리
      {
        ...baseFrame,
        delay: 120,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        statProgress: 1.0,
        moveStep: 5,
        phaseId: "growth-statrise2",
        phaseName: "7. 랭크업 파티클 정점",
      },
    ];
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    // 성장 커스텀 연출은 moveStep 기반 진행도로 그린다 (1~4프레임).
    if (frame.showEffect && drawCtx.attackerPos) {
      const step = frame.moveStep ?? 1;
      const progress = Math.min(1.0, Math.max(0, step / 4));
      drawGrowthEffect(targetCtx, drawCtx.attackerPos, progress);
    }
  },
};