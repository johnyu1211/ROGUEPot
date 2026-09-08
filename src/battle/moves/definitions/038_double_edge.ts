// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawDoubleEdgeEffect } from "../../../renderers/moves/gen1/move037_040.js";

/**
 * 038: 이판사판태클 (Double-Edge)
 * 
 * Concept:
 * - Ultimate high-velocity reckless tackle with extreme momentum!
 * - Deep backward crouch windup with golden light charge
 * - Supersonic forward dash into massive dual-shockwave collision
 * - Camera glides back to neutral, followed by recoil damage blink (2 flashes)
 */
export const doubleEdgeMove: BattleMoveAnimation = {
  num: 38,
  key: "double-edge",
  nameKo: "이판사판태클",
  nameEn: "Double-Edge",
  type: "normal",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  drawEffect: drawDoubleEdgeEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    return [
      // 1. 깊은 후방 크라우칭 도움닫기 (최대 출력 축적)
      {
        delay: 130,
        pOffset: isP ? { x: -22, y: 9 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 22, y: -9 } : { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        casterYellowAura: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 1,
        phaseId: "doubleedge-charge",
        phaseName: "1. 초돌진 도움닫기 후진",
      },
      // 2. 이펙트 전 시전 포켓몬 상대 앞까지 초고속 근접 접근!
      {
        delay: 80,
        pOffset: isP ? { x: 56, y: -22 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -56, y: 22 } : { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        casterYellowAura: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 1,
        phaseId: "doubleedge-dash-approach",
        phaseName: "2. 초고속 돌진 근접 접근",
      },
      // 3. 초고속 격돌 접촉 (이펙트 빠른 페이드인 & 시전 포켓몬 황금빛 오라 감싸짐)
      {
        delay: 70,
        pOffset: isP ? { x: 68, y: -26 } : (isHit ? { x: -8, y: 3 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -68, y: 26 } : (isHit ? { x: 8, y: -3 } : { x: 0, y: 0 }),
        showEffect: isHit,
        hitFlash: false,
        casterYellowAura: isHit,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 2,
        phaseId: "doubleedge-impact-fadein",
        phaseName: "3. 격돌 접촉 (빠른 페이드인 & 황금빛 오라)",
      },
      // 4. 초대형 황금 폭발 격돌 피크! (최대 충격량 & 넉백)
      {
        delay: 150,
        pOffset: isP ? { x: 65, y: -25 } : (isHit ? { x: -16, y: 6 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -65, y: 25 } : (isHit ? { x: 16, y: -6 } : { x: 0, y: 0 }),
        showEffect: isHit,
        hitFlash: isHit,
        casterYellowAura: isHit,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 3,
        phaseId: "doubleedge-impact-peak",
        phaseName: "4. 이판사판태클 격돌 피크 (황금빛 폭발)",
      },
      // 5. 충격파 확산 페이드아웃 (반동 시작)
      {
        delay: 80,
        pOffset: isP ? { x: 42, y: -16 } : (isHit ? { x: -8, y: 3 } : { x: 0, y: 0 }),
        eOffset: !isP ? { x: -42, y: 16 } : (isHit ? { x: 8, y: -3 } : { x: 0, y: 0 }),
        showEffect: isHit,
        hitFlash: false,
        casterYellowAura: isHit,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 4,
        phaseId: "doubleedge-impact-fadeout",
        phaseName: "5. 충격파 확산 페이드아웃",
      },
      // 6. 반동 튕겨남 (이펙트 종료 -> 노란빛 오라 완전 해제 / 풀림!)
      {
        delay: 110,
        pOffset: isP ? { x: 16, y: -4 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -16, y: 4 } : { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        casterYellowAura: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 5,
        phaseId: "doubleedge-recoil",
        phaseName: "6. 반동 튕김 (오라 해제)",
      },
      // 7. 제자리 복귀
      {
        delay: 90,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        casterYellowAura: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 1,
        phaseId: "doubleedge-finish",
        phaseName: "7. 복귀 완료",
      },

      // 8. 카메라 원상태 복귀 후 시전 포켓몬 반동 데미지 깜빡임 1
      {
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        pAlpha: isP ? 0.20 : 1.0,
        eAlpha: !isP ? 0.20 : 1.0,
        afterCameraReturn: true,
        cameraZoom: 1.0,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 1,
        phaseId: "doubleedge-recoil-blink1",
        phaseName: "8. 반동 데미지 깜빡임 1",
      },
      // 9. 정상 표시
      {
        delay: 70,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        pAlpha: 1.0,
        eAlpha: 1.0,
        afterCameraReturn: true,
        cameraZoom: 1.0,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 1,
        phaseId: "doubleedge-recoil-solid",
        phaseName: "9. 반동 정상",
      },
      // 10. 반동 데미지 깜빡임 2
      {
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        pAlpha: isP ? 0.20 : 1.0,
        eAlpha: !isP ? 0.20 : 1.0,
        afterCameraReturn: true,
        cameraZoom: 1.0,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 1,
        phaseId: "doubleedge-recoil-blink2",
        phaseName: "10. 반동 데미지 깜빡임 2",
      },
      // 11. 완전 회복
      {
        delay: 130,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        pAlpha: 1.0,
        eAlpha: 1.0,
        afterCameraReturn: true,
        cameraZoom: 1.0,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        textLineIdx,
        moveEffect: a,
        moveStep: 1,
        phaseId: "doubleedge-complete",
        phaseName: "11. 반동 완료",
      },
    ];
  }
};
