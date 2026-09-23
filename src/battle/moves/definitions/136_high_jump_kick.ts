// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawHighJumpKickEffect, drawHighJumpKickBehindEffect } from "../../../renderers/moves/gen1/move133_136.js";

/**
 * 136: 무릎차기 (High Jump Kick) - 격투 타입 물리 공격기 (위력 130)
 *
 * 연출 구성:
 * 1. 지면을 강하게 박차고 상공 초고도로 솟구쳐 오르는 초고도 도약 (High Jump Leap)
 * 2. 상공 정점에서 무릎을 앞으로 팍 내지르고 후방으로 끝쪽이 투명한 주황색 잔상을 두른 45도 급강하 쇄도
 * 3. 상대방 포켓몬에 무릎 직격 폭쇄 강타 (1프레임 섬광, 2중 충격파 링, 크런치 스파이크)
 * 4. 타격 반동으로 공중으로 붕 떠오르며 멋진 백플립(공중제비) 회전 반동
 * 5. 지면에 사뿐하게 착지하며 먼지 분출 및 파이팅 포즈 복귀
 */
export const highJumpKickMove: BattleMoveAnimation = {
  num: 136,
  key: "high-jump-kick",
  nameKo: "무릎차기",
  nameEn: "High Jump Kick",
  type: "fighting",
  category: "physical",
  camera: { type: "target", zoom: 1.36 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawHighJumpKickBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawHighJumpKickEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.36,
      pRot: 0,
      eRot: 0,
    };

    // 시전자/피격자 전용 오프셋 헬퍼 (플레이어와 상대방의 화면 물리적 배치에 최적화된 독립 좌표계)
    const cOff = (px: number, py: number, ex: number, ey: number) => ({
      pOffset: isP ? { x: px, y: py } : { x: 0, y: 0 },
      eOffset: !isP ? { x: ex, y: ey } : { x: 0, y: 0 },
    });

    // 피격자(상대방) 전용 흔들림 헬퍼
    const tOff = (px: number, py: number, ex: number, ey: number) => ({
      pOffset: !isP && isHit ? { x: px, y: py } : (isP ? { x: 0, y: 0 } : undefined),
      eOffset: isP && isHit ? { x: ex, y: ey } : (!isP ? { x: 0, y: 0 } : undefined),
    });

    return [
      // 1. 도약 준비 압축 웅크림 (70ms)
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 5, 0, 5),
        pScale: isP ? { x: 1.16, y: 0.84 } : undefined,
        eScale: !isP ? { x: 1.16, y: 0.84 } : undefined,
        showEffect: false,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.1,
        phaseId: "hjk-crouch",
        phaseName: "1. 도약 준비 웅크림",
      },

      // 2. 초고도 수직 도약 개시 & 지면 먼지 분출 (70ms)
      {
        ...baseFrame,
        delay: 70,
        ...cOff(30, -75, -25, -65),
        pScale: isP ? { x: 0.85, y: 1.25 } : undefined,
        eScale: !isP ? { x: 0.85, y: 1.25 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.5,
        phaseId: "hjk-leap-1",
        phaseName: "2. 상공 고속 도약",
      },

      // 3. 상공 최정점 도달 (화면 상단 치솟음) (75ms)
      {
        ...baseFrame,
        delay: 75,
        ...cOff(90, -160, -65, -120),
        pScale: isP ? { x: 0.92, y: 1.15 } : undefined,
        eScale: !isP ? { x: 0.92, y: 1.15 } : undefined,
        showEffect: true,
        showBehindEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.9,
        phaseId: "hjk-leap-2",
        phaseName: "3. 상공 최정점 & 주황 잔상",
      },

      // 4. 무릎을 내지른 45도 급강하 돌진 (65ms)
      // 시전자(상대) 기준: 우상단 상공에서 좌하단 플레이어를 향해 대각선 아래로 쇄도
      {
        ...baseFrame,
        delay: 65,
        ...cOff(175, -105, -140, -30),
        pScale: isP ? { x: 1.30, y: 0.70 } : undefined,
        eScale: !isP ? { x: 1.30, y: 0.70 } : undefined,
        pRot: isP ? 0.28 : undefined,
        eRot: !isP ? -0.28 : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.4,
        phaseId: "hjk-dive-1",
        phaseName: "4. 급강하 마하 니킥 돌진",
      },

      // 5. 상대 코앞 초고속 쇄도 (65ms)
      {
        ...baseFrame,
        delay: 65,
        ...cOff(230, -65, -205, 45),
        pScale: isP ? { x: 1.35, y: 0.65 } : undefined,
        eScale: !isP ? { x: 1.35, y: 0.65 } : undefined,
        pRot: isP ? 0.22 : undefined,
        eRot: !isP ? -0.22 : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.8,
        phaseId: "hjk-dive-2",
        phaseName: "5. 타겟 코앞 쇄도",
      },

      // 6. 상대방 무릎 직격 폭쇄 강타! 쾅! (110ms)
      {
        ...baseFrame,
        delay: 110,
        ...cOff(260, -45, -255, 115),
        ...tOff(-18, 8, 18, -8),
        pScale: isP ? { x: 1.25, y: 0.75 } : undefined,
        eScale: !isP ? { x: 1.25, y: 0.75 } : undefined,
        pRot: isP ? 0.15 : undefined,
        eRot: !isP ? -0.15 : undefined,
        showEffect: true,
        hitFlash: isHit,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 3,
        effectProgress: 0.30,
        phaseId: "hjk-hit",
        phaseName: "6. 무릎 직격 폭쇄 강타 (쾅!)",
      },

      // 7. 타격 반동 공중 백플립 회전 1차 (90ms)
      {
        ...baseFrame,
        delay: 90,
        ...cOff(140, -80, -150, 40),
        ...tOff(-8, 3, 8, -3),
        pScale: isP ? { x: 0.95, y: 1.10 } : undefined,
        eScale: !isP ? { x: 0.95, y: 1.10 } : undefined,
        pRot: isP ? -0.45 : undefined,
        eRot: !isP ? 0.45 : undefined,
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 4,
        effectProgress: 0.72,
        phaseId: "hjk-hit",
        phaseName: "7. 공중 반동 백플립",
      },

      // 8. 공중 회전 완료 및 하강 & 붉은 알갱이 비산 페이드아웃 (85ms)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(60, -35, -65, -35),
        ...tOff(0, 0, 0, 0),
        pScale: isP ? { x: 1.0, y: 1.0 } : undefined,
        eScale: !isP ? { x: 1.0, y: 1.0 } : undefined,
        pRot: isP ? -0.15 : undefined,
        eRot: !isP ? 0.15 : undefined,
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 4,
        effectProgress: 0.98,
        phaseId: "hjk-hit-rebound",
        phaseName: "8. 공중 회전 완료 하강",
      },

      // 9. 지면 착지 및 스쿼시 충격 흡수 (85ms)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0, 0, 0),
        pScale: isP ? { x: 1.15, y: 0.85 } : undefined,
        eScale: !isP ? { x: 1.15, y: 0.85 } : undefined,
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 5,
        effectProgress: 0.60,
        phaseId: "hjk-land",
        phaseName: "9. 지면 착지 & 충격 흡수",
      },

      // 10. 파이팅 포즈 최종 정위치 복귀 (100ms)
      {
        ...baseFrame,
        delay: 100,
        ...cOff(0, 0, 0, 0),
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showEffect: false,
        hitFlash: false,
        moveStep: 9,
        phaseId: "recovery",
        phaseName: "10. 정위치 복귀",
      },
    ];
  },
};
