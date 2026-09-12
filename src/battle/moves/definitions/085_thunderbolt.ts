// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawThunderboltEffect } from "../../../renderers/moves/gen1/move085_088.js";

/**
 * 085: 10만볼트 (Thunderbolt) - 전기 타입 특수기 (10% 확률 마비)
 *
 * 연출:
 * - 시전자 주변 고압 전력/스파크 충전 & 노드 응축
 * - 4중 레이어 지그재그 대전류 볼트 쇄도 (외곽 앰버 + 레몬 바디 + 순백 코어)
 * - 표적 정면 대격돌 1프레임 히트 플래시 + 스타버스트 임팩트 & 2중 충격파 링
 * - 지속 고전압 방전 & 감전 케이지 루프
 * - 12방향 번개 스파크 버스트 & 뇌격 파편 비산
 * - 잔류 전류 페이드아웃 및 복귀
 */
export const thunderboltMove: BattleMoveAnimation = {
  num: 85,
  key: "thunderbolt",
  nameKo: "10만볼트",
  nameEn: "Thunderbolt",
  type: "electric",
  category: "special",
  camera: { type: "target", zoom: 1.35 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos, isPlayer } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawThunderboltEffect(targetCtx, attackerPos, targetPos, step, prog, isPlayer);
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
      // #1. 암전 속 고압 충전 & 플라즈마 응축
      {
        ...baseFrame,
        delay: 105,
        pOffset: isP ? { x: -3, y: 1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 3, y: -1 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.05, y: 0.95 } : undefined,
        eScale: !isP ? { x: 1.05, y: 0.95 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.50,
        phaseId: "thunderbolt-charge",
        phaseName: "#1. 암전 속 고압 충전",
      },
      // #2. 전기 가닥 고속 발사 (0% -> 50% 도달)
      {
        ...baseFrame,
        delay: 90,
        pOffset: isP ? { x: 6, y: -2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -6, y: 2 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.50,
        phaseId: "thunderbolt-launch",
        phaseName: "#2. 전기 가닥 고속 발사",
      },
      // #3. 전광석화 쇄도 & 표적 전방 도달 (50% -> 100% 관통)
      {
        ...baseFrame,
        delay: 85,
        pOffset: isP ? { x: 4, y: -1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -4, y: 1 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.85,
        phaseId: "thunderbolt-surge",
        phaseName: "#3. 대전류 전장 쇄도",
      },
      // #4. 표적 정면 직격 & 암전 -> 찬란한 황금빛 대전환
      {
        ...baseFrame,
        delay: 120,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: -8, y: 3 } : { x: 8, y: -3 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: isHit,
        pWhiteTint: isHit && !isP,
        eWhiteTint: isHit && isP,
        moveStep: 4,
        effectProgress: 0.50,
        phaseId: "thunderbolt-impact",
        phaseName: "#4. 직격 타격 & 황금빛 대전환",
      },
      // #5. 전격 플라즈마 방전 확장 & 전신 감전 루프 (황금빛 1차 페이드)
      {
        ...baseFrame,
        delay: 110,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: 5, y: -2 } : { x: -5, y: 2 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 5,
        effectProgress: 0.65,
        phaseId: "thunderbolt-discharge",
        phaseName: "#5. 플라즈마 방전 & 감전 루프",
      },
      // #6. 18방향 뇌격 스파크 버스트 비산 (황금빛 2차 페이드 & 피격 반영)
      {
        ...baseFrame,
        delay: 100,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: -3, y: 1 } : { x: 3, y: -1 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 6,
        effectProgress: 0.70,
        phaseId: "thunderbolt-burst",
        phaseName: "#6. 뇌격 스파크 비산",
      },
      // #7. 잔류 전격 냉각 & 전장 조명 완전 복귀
      {
        ...baseFrame,
        delay: 85,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 7,
        effectProgress: 0.50,
        phaseId: "thunderbolt-cool",
        phaseName: "#7. 잔류 전류 냉각",
      },
      // #8. 완료 및 복귀
      {
        ...baseFrame,
        delay: 70,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "thunderbolt-complete",
        phaseName: "#8. 완료 및 복귀",
      },
    ];
  },
};
