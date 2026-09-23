// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawRockThrowEffect } from "../../../renderers/moves/gen1/move085_088.js";

/**
 * 088: 돌떨구기 (Rock Throw) - 바위 타입 물리 비접촉기
 *
 * 연출:
 * 1. 시전 포켓몬 웅크림(살짝 아래로) -> 위로 도약할 때 돌멩이가 시전자 스프라이트에서 상공으로 발사됨
 * 2. 시전 포켓몬 포커싱 -> 대상 머리 위로 돌이 떨어짐
 * 3. 기존 스타버스트 타격 이펙트 완전 제거 -> #8에서 모래먼지와 돌이 여러 개로 쪼개지는 파쇄 효과 (동시에 대상 찌그러짐)
 * 4. 쪼개진 돌들이 바닥으로 뿌려지며 떨어짐 (동시에 대상 탄성 펴짐)
 * 5. 바닥 파편 안착 및 모래먼지 페이드아웃 후 복귀
 */
export const rockThrowMove: BattleMoveAnimation = {
  num: 88,
  key: "rock-throw",
  nameKo: "돌떨구기",
  nameEn: "Rock Throw",
  type: "rock",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawRockThrowEffect(targetCtx, attackerPos, targetPos, step, prog);
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
      // #1. 시전자 웅크림 (아래로 움직임, 상대 포커싱)
      {
        ...baseFrame,
        delay: 85,
        pOffset: isP ? { x: 0, y: 7 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: 7 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.08, y: 0.92 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 1.08, y: 0.92 } : { x: 1.0, y: 1.0 },
        showEffect: false,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.30,
        phaseId: "rock-throw-crouch",
        phaseName: "#1. 시전자 웅크림",
      },
      // #2. 시전자 도약
      {
        ...baseFrame,
        delay: 75,
        pOffset: isP ? { x: 0, y: -10 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -10 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.92, y: 1.08 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 0.92, y: 1.08 } : { x: 1.0, y: 1.0 },
        showEffect: false,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.80,
        phaseId: "rock-throw-leap",
        phaseName: "#2. 시전자 도약",
      },
      // #3. [중간프레임 1] 상대 머리 위 높은 상공에서 돌 출현
      {
        ...baseFrame,
        delay: 65,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.25,
        phaseId: "rock-throw-spawn",
        phaseName: "#3. 상공 돌 출현",
      },
      // #4. [중간프레임 2] 중력 가속도로 1차 급강하
      {
        ...baseFrame,
        delay: 60,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.70,
        phaseId: "rock-throw-fall-accel",
        phaseName: "#4. 1차 가속 낙하",
      },
      // #5. [중간프레임 3] 모션 트레일과 함께 머리 바로 위까지 맹렬히 쇄도
      {
        ...baseFrame,
        delay: 55,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.90,
        phaseId: "rock-throw-plunge",
        phaseName: "#5. 머리 위 급강하 쇄도",
      },
      // #6. 머리 강타 내려침 (Strike! 타격 충격 먼지)
      {
        ...baseFrame,
        delay: 65,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.50,
        phaseId: "rock-throw-strike",
        phaseName: "#6. 머리 강타 내려침",
      },
      // #7. [중간프레임 4] 타격 반동으로 머리에서 위로 솟구치기 시작 (1차 상승 & 투명화 시작)
      {
        ...baseFrame,
        delay: 60,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 5,
        effectProgress: 0.40,
        phaseId: "rock-throw-bounce-rise",
        phaseName: "#7. 반동 상승 솟구침 (투명화 시작)",
      },
      // #8. [중간프레임 5] 정점(36px) 도달 & 반투명화 및 표면 크랙 발생
      {
        ...baseFrame,
        delay: 65,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 5,
        effectProgress: 0.95,
        phaseId: "rock-throw-bounce-peak",
        phaseName: "#8. 바운스 정점 도달 (크랙 발생)",
      },
      // #9. [중간프레임 6] 공중 정점에서 1차 산산조각 파쇄 & 모래먼지 폭발
      {
        ...baseFrame,
        delay: 70,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 6,
        effectProgress: 0.40,
        phaseId: "rock-throw-shatter-init",
        phaseName: "#9. 공중 정점 파쇄 폭발",
      },
      // #10. [중간프레임 7] 파편 전방위 비산 & 모래먼지 대형 확산
      {
        ...baseFrame,
        delay: 75,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 6,
        effectProgress: 0.85,
        phaseId: "rock-throw-shatter-spread",
        phaseName: "#10. 파편 & 모래알갱이 사방 비산",
      },
      // #11. [중간프레임 8] 쪼개진 돌들이 중력을 받아 공중에서 바닥으로 쏟아져 내림 (낙하 중간)
      {
        ...baseFrame,
        delay: 70,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 7,
        effectProgress: 0.45,
        phaseId: "rock-throw-fall-mid",
        phaseName: "#11. 파편 바닥 쏟아짐 (공중 낙하)",
      },
      // #12. [중간프레임 9] 파편들이 바닥 지면에 촤라락 충돌 (미니 먼지 튐 & 바닥 먼지 확산)
      {
        ...baseFrame,
        delay: 75,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 7,
        effectProgress: 0.90,
        phaseId: "rock-throw-ground-impact",
        phaseName: "#12. 파편 바닥 지면 착지",
      },
      // #13. 쪼개진 돌들이 바닥에 안착 & 모래먼지 부드럽게 페이드아웃
      {
        ...baseFrame,
        delay: 85,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 8,
        effectProgress: 0.65,
        phaseId: "rock-throw-settle",
        phaseName: "#13. 파편 바닥 안착 & 먼지 페이드",
      },
      // #14. 완료 및 복귀
      {
        ...baseFrame,
        delay: 70,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 9,
        phaseId: "rock-throw-complete",
        phaseName: "#14. 완료 및 복귀",
      },
    ];
  },
};

