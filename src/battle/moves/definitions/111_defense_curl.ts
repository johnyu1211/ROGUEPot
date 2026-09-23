// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawDefenseCurlEffect } from "../../../renderers/moves/gen1/move109_112.js";

/**
 * 111: 웅크리기 (Defense Curl) - 노말 타입 변화 기술 (자신의 방어 1랭크 상승, 구르기 위력 2배 연계)
 *
 * 연출 구성:
 * #1. 시전자 수축 웅크림 & 조금 큰 파란 공 빠른 수축 페이드인
 * #2. 파란 공 완전 응축 및 최고 선명도 도달
 * #3. 파란 공이 짙은 파랑으로 변색 & 2겹 흰색 회전선 출현 (안쪽 좌회전, 바깥쪽 우회전, 앞쪽 반투명/뒤쪽 투명)
 * #4. 짙은 파랑 페이드아웃 & 2겹 회전선이 구체 앞면을 가로지르며 교차 회전
 * #5. 공 및 회전선 최종 승화 소멸 & 시전자 서서히 전개
 * #6. 시전자 완전 복귀 완료
 */
export const defenseCurlMove: BattleMoveAnimation = {
  num: 111,
  key: "defense-curl",
  nameKo: "웅크리기",
  nameEn: "Defense Curl",
  type: "normal",
  category: "status",
  camera: { type: "self", zoom: 1.35 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawDefenseCurlEffect(targetCtx, attackerPos, targetPos, step, prog);
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
      // #1. 시전자 웅크림 수축 시작 & 파란 공 빠른 수축 페이드인
      {
        ...baseFrame,
        delay: 90,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: isP ? { x: 0.88, y: 0.88 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 0.88, y: 0.88 } : { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.40,
        phaseId: "defense-curl-shrink-in",
        phaseName: "#1. 웅크림 & 파란 공 빠른 수축 페이드인",
      },
      // #2. 파란 공 완전 응축 및 최고 선명화 & 상/하단 회전선 출현
      {
        ...baseFrame,
        delay: 110,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: isP ? { x: 0.84, y: 0.84 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 0.84, y: 0.84 } : { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.10,
        phaseId: "defense-curl-orbit-start",
        phaseName: "#2. 파란 공 응축 & 회전선 좌/우 출현 및 1바퀴 회전 시작",
      },
      // #3. 짙은 파랑 전환 & 1바퀴 회전 전반부 통과 (반 바퀴 교차)
      {
        ...baseFrame,
        delay: 130,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: isP ? { x: 0.84, y: 0.84 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 0.84, y: 0.84 } : { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.50,
        phaseId: "defense-curl-orbit-cross",
        phaseName: "#3. 짙은 파랑 전환 & 1바퀴 전반부 교차 통과 (반 바퀴)",
      },
      // #4. 돌기 후반즈음: 회전선과 공이 커지면서 페이드아웃 시작!
      {
        ...baseFrame,
        delay: 140,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: isP ? { x: 0.84, y: 0.84 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 0.84, y: 0.84 } : { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.85,
        phaseId: "defense-curl-orbit-expand",
        phaseName: "#4. 1바퀴 돌기 후반즈음 커지면서 페이드아웃",
      },
      // #5. 1바퀴 회전 완료 & 최대 팽창하며 완전 소멸 & 시전자 기상 전개
      {
        ...baseFrame,
        delay: 110,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: isP ? { x: 0.94, y: 0.94 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 0.94, y: 0.94 } : { x: 1.0, y: 1.0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.60,
        phaseId: "defense-curl-fade",
        phaseName: "#5. 1바퀴 완료 & 커지며 완전 승화 소멸 및 시전자 기상",
      },
      // #6. 시전자 완전 복귀 완료
      {
        ...baseFrame,
        delay: 110,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        showEffect: false,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 1.0,
        phaseId: "defense-curl-complete",
        phaseName: "#6. 시전자 복귀 완료",
      },
    ];
  },
};
