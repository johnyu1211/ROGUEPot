// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawSubstituteEffect } from "../../../renderers/moves/gen1/move161_164.js";

/**
 * 164: 대타출동 (Substitute) - 노말 타입 변화기
 * 
 * [유저 지정 연출]:
 * 1. 기술 사용 시 시전 포켓몬은 화면 밖으로 빠짐
 *    - 아군 시전: 화면 좌측 밖으로 미끄러져 빠짐
 *    - 상대 시전: 화면 우측 밖으로 미끄러져 빠짐
 * 2. 시전 포켓몬이 빠진 자리에 펑! (카툰풍 연기구름 폭발)과 함께 대타출동 인형 등장
 *    - 아군: 뒷모습 인형 (Back Doll)
 *    - 상대: 앞모습 인형 (Front Doll)
 * 3. 인형이 가볍게 도약 후 착지 바운스(스쿼시 & 스트레치) 안착
 */
export const substituteMove: BattleMoveAnimation = {
  num: 164,
  key: "substitute",
  nameKo: "대타출동",
  nameEn: "Substitute",
  type: "normal",
  category: "status",
  camera: { type: "self", zoom: 1.25 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawSubstituteEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame: BattleFrame = {
      delay: 80,
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.25,
      pRot: 0,
      eRot: 0,
      showEffect: true,
      hitFlash: false,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
      pAlpha: 1.0,
      eAlpha: 1.0,
      hidePShadow: false,
      hideEShadow: false,
      hidePlayer: false,
      hideEnemy: false,
    };

    return [
      // ======================================================================
      // Phase 1: 시전 포켓몬 후퇴 준비 & 미끄러져 빠짐 (Slide Out)
      // - 아군은 화면 좌측(-X) 밖으로, 상대는 화면 우측(+X) 밖으로 가속 퇴장
      // ======================================================================
      {
        ...baseFrame,
        delay: 70,
        moveStep: 1,
        effectProgress: 0.1,
        pOffset: isP ? { x: -12, y: 2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 12, y: 2 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.05, y: 0.95 } : undefined,
        eScale: !isP ? { x: 1.05, y: 0.95 } : undefined,
        pAlpha: 1.0,
        eAlpha: 1.0,
        phaseId: "substitute-prep",
        phaseName: "1. 후퇴 준비",
      },
      {
        ...baseFrame,
        delay: 80,
        moveStep: 1,
        effectProgress: 0.35,
        pOffset: isP ? { x: -65, y: 0 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 65, y: 0 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.08, y: 0.92 } : undefined,
        eScale: !isP ? { x: 1.08, y: 0.92 } : undefined,
        pAlpha: isP ? 0.92 : 1.0,
        eAlpha: !isP ? 0.92 : 1.0,
        phaseId: "substitute-slide-1",
        phaseName: "2. 미끄러짐 1",
      },
      {
        ...baseFrame,
        delay: 80,
        moveStep: 1,
        effectProgress: 0.65,
        pOffset: isP ? { x: -150, y: 0 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 150, y: 0 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.15, y: 0.85 } : undefined,
        eScale: !isP ? { x: 1.15, y: 0.85 } : undefined,
        pAlpha: isP ? 0.65 : 1.0,
        eAlpha: !isP ? 0.65 : 1.0,
        phaseId: "substitute-slide-2",
        phaseName: "3. 고속 후퇴 2",
      },
      {
        ...baseFrame,
        delay: 80,
        moveStep: 1,
        effectProgress: 0.95,
        pOffset: isP ? { x: -270, y: 0 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 270, y: 0 } : { x: 0, y: 0 },
        pAlpha: isP ? 0.15 : 1.0,
        eAlpha: !isP ? 0.15 : 1.0,
        phaseId: "substitute-slide-3",
        phaseName: "4. 화면 밖 퇴장",
      },
      {
        ...baseFrame,
        delay: 60,
        moveStep: 1,
        effectProgress: 1.0,
        pOffset: isP ? { x: -480, y: 0 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 480, y: 0 } : { x: 0, y: 0 },
        pAlpha: isP ? 0.0 : 1.0,
        eAlpha: !isP ? 0.0 : 1.0,
        hidePlayer: isP,
        hideEnemy: !isP,
        hidePShadow: isP,
        hideEShadow: !isP,
        phaseId: "substitute-offscreen",
        phaseName: "5. 완전 퇴장",
      },

      // ======================================================================
      // Phase 2: 펑!! (Puff 연기구름 폭발 & 대타출동 인형 스폰)
      // - useSubstituteSprite 활성화!
      // ======================================================================
      {
        ...baseFrame,
        delay: 90,
        moveStep: 2,
        effectProgress: 0.2,
        useSubstituteSprite: true,
        substituteWho: isP ? "player" : "enemy",
        pOffset: isP ? { x: 0, y: 8 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: 8 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.35, y: 0.35 } : undefined,
        eScale: !isP ? { x: 0.35, y: 0.35 } : undefined,
        pAlpha: isP ? 0.9 : 1.0,
        eAlpha: !isP ? 0.9 : 1.0,
        phaseId: "substitute-poof-spawn",
        phaseName: "6. 연기 폭발 & 인형 스폰",
      },
      {
        ...baseFrame,
        delay: 100,
        moveStep: 2,
        effectProgress: 0.6,
        useSubstituteSprite: true,
        substituteWho: isP ? "player" : "enemy",
        pOffset: isP ? { x: 0, y: -4 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -4 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.78, y: 0.88 } : undefined,
        eScale: !isP ? { x: 0.78, y: 0.88 } : undefined,
        pAlpha: 1.0,
        eAlpha: 1.0,
        phaseId: "substitute-poof-expand",
        phaseName: "7. 인형 팽창 & 스파클",
      },
      {
        ...baseFrame,
        delay: 100,
        moveStep: 2,
        effectProgress: 0.95,
        useSubstituteSprite: true,
        substituteWho: isP ? "player" : "enemy",
        pOffset: isP ? { x: 0, y: -16 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -16 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.94, y: 1.10 } : undefined,
        eScale: !isP ? { x: 0.94, y: 1.10 } : undefined,
        pAlpha: 1.0,
        eAlpha: 1.0,
        phaseId: "substitute-poof-hop",
        phaseName: "8. 인형 공중 도약",
      },

      // ======================================================================
      // Phase 3: 인형 착지 바운스 & 지면 미니 퍼프 (Squash & Stretch)
      // ======================================================================
      {
        ...baseFrame,
        delay: 90,
        moveStep: 3,
        effectProgress: 0.35,
        useSubstituteSprite: true,
        substituteWho: isP ? "player" : "enemy",
        pOffset: isP ? { x: 0, y: 4 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: 4 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.16, y: 0.84 } : undefined,
        eScale: !isP ? { x: 1.16, y: 0.84 } : undefined,
        pAlpha: 1.0,
        eAlpha: 1.0,
        phaseId: "substitute-bounce-squash",
        phaseName: "9. 착지 스쿼시",
      },
      {
        ...baseFrame,
        delay: 90,
        moveStep: 3,
        effectProgress: 0.75,
        useSubstituteSprite: true,
        substituteWho: isP ? "player" : "enemy",
        pOffset: isP ? { x: 0, y: -5 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -5 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.96, y: 1.04 } : undefined,
        eScale: !isP ? { x: 0.96, y: 1.04 } : undefined,
        pAlpha: 1.0,
        eAlpha: 1.0,
        phaseId: "substitute-bounce-rebound",
        phaseName: "10. 반동 리바운드",
      },

      // ======================================================================
      // Phase 4: 대타출동 완료 및 안정화 (Settle & Return)
      // ======================================================================
      {
        ...baseFrame,
        delay: 100,
        moveStep: 4,
        effectProgress: 0.5,
        cameraZoom: 1.12,
        useSubstituteSprite: true,
        substituteWho: isP ? "player" : "enemy",
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: isP ? { x: 1.0, y: 1.0 } : undefined,
        eScale: !isP ? { x: 1.0, y: 1.0 } : undefined,
        pAlpha: 1.0,
        eAlpha: 1.0,
        phaseId: "substitute-settle-1",
        phaseName: "11. 안정화 1",
      },
      {
        ...baseFrame,
        delay: 130,
        moveStep: 4,
        effectProgress: 1.0,
        cameraZoom: 1.0,
        useSubstituteSprite: true,
        substituteWho: isP ? "player" : "enemy",
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: isP ? { x: 1.0, y: 1.0 } : undefined,
        eScale: !isP ? { x: 1.0, y: 1.0 } : undefined,
        pAlpha: 1.0,
        eAlpha: 1.0,
        phaseId: "substitute-complete",
        phaseName: "12. 대타출동 안착 완료",
      },
    ];
  },
};
