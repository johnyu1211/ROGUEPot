// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawReturnEffect } from "../../../renderers/moves/gen1/move213_216.js";

/**
 * 216: 은혜갚기 (Return / おんがえし) - 노말 타입 물리 공격기 (위력 친밀도 비례, 명중 100)
 *
 * [유저 연출 지시]:
 * 1. 시전포켓몬 납작 2회
 * 2. > 타격 > 속여때리기 참고
 * 3. 속여때리기랑 비슷한 타격이지만 암전 없고 회전하는 파티클이 아니라 퍼지는 파티클임
 * 4. 파티클 형태는 속여때리기랑 같은거긴 함
 */
export const returnMove: BattleMoveAnimation = {
  num: 216,
  key: "return",
  nameKo: "은혜갚기",
  nameEn: "Return",
  type: "normal",
  category: "physical",
  camera: {
    type: "caster_to_target",
    zoom: 1.35,
    focalRatio: 1.0, // 대상 포켓몬 정중앙 100% 록온
    delayUntilStep: 2, // Step 1: 시전자 납작 2회 모션, Step 2부터 적 포커싱 & 타격
    inlineGlideInFrames: 2,
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawReturnEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    // 시전자 납작(Squash & Stretch) 헬퍼 - 수비자는 완벽하게 { 0, 0 } 고정!
    const cSquash = (sx: number, sy: number, oy: number) => ({
      pOffset: isP ? { x: 0, y: oy } : { x: 0, y: 0 },
      eOffset: !isP ? { x: 0, y: oy } : { x: 0, y: 0 },
      pScale: isP ? { x: sx, y: sy } : { x: 1.0, y: 1.0 },
      eScale: !isP ? { x: sx, y: sy } : { x: 1.0, y: 1.0 },
    });

    // 피격자 위치 오프셋 - 시전자는 완벽하게 { 0, 0 } 고정!
    const tOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    return [
      // ======================================================================
      // Phase 1. 시전포켓몬 납작 2회 (Squash & Stretch 탄성 바운스 2회) (Step 1)
      // ======================================================================
      // [1회차 납작 & 탄성 바운스]
      {
        ...baseFrame,
        delay: 80,
        ...cSquash(1.15, 0.88, 2),
        showEffect: false,
        moveStep: 1,
        phaseId: "return-squash-1-enter",
        phaseName: "#1. 시전자 1차 웅크림 시작",
      },
      {
        ...baseFrame,
        delay: 130,
        ...cSquash(1.25, 0.75, 4),
        showEffect: false,
        moveStep: 1,
        phaseId: "return-squash-1-peak",
        phaseName: "#1. 시전자 1차 최대 납작 유지",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cSquash(0.94, 1.06, -2),
        showEffect: false,
        moveStep: 1,
        phaseId: "return-rebound-1",
        phaseName: "#1. 시전자 1차 탄성 반등",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cSquash(1.0, 1.0, 0),
        showEffect: false,
        moveStep: 1,
        phaseId: "return-settle-1",
        phaseName: "#1. 1차 바운스 정돈",
      },
      // [2회차 납작 & 탄성 바운스]
      {
        ...baseFrame,
        delay: 80,
        ...cSquash(1.18, 0.85, 2),
        showEffect: false,
        moveStep: 1,
        phaseId: "return-squash-2-enter",
        phaseName: "#1. 시전자 2차 웅크림 시작",
      },
      {
        ...baseFrame,
        delay: 140,
        ...cSquash(1.30, 0.70, 5),
        showEffect: false,
        moveStep: 1,
        phaseId: "return-squash-2-peak",
        phaseName: "#1. 시전자 2차 최대 납작 유지",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cSquash(0.92, 1.08, -3),
        showEffect: false,
        moveStep: 1,
        phaseId: "return-rebound-2",
        phaseName: "#1. 시전자 2차 탄성 반등",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cSquash(1.0, 1.0, 0),
        showEffect: false,
        moveStep: 1,
        phaseId: "return-settle-2",
        phaseName: "#1. 2차 바운스 정돈 및 타격 준비",
      },

      // ======================================================================
      // Phase 2. 타격이펙트: 작은 마하펀치 타격(주먹없이) & 사방으로 퍼지는 순백 발광 알갱이들 (Step 2)
      // ======================================================================
      {
        ...baseFrame,
        delay: 65,
        hitFlash: isHit,
        ...(isHit ? tOff(10, -4) : tOff(0, 0)),
        showEffect: isHit,
        moveStep: 2,
        hitProgress: 0.10,
        phaseId: "return-impact-1",
        phaseName: "#2. 작은 순백 섬광 & 타격 직격 (알갱이 방출 시동)",
      },
      {
        ...baseFrame,
        delay: 65,
        ...(isHit ? tOff(-7, 3) : tOff(0, 0)),
        showEffect: isHit,
        moveStep: 2,
        hitProgress: 0.28,
        phaseId: "return-impact-2",
        phaseName: "#2. 순백 알갱이들 사방 확산 1단계",
      },
      {
        ...baseFrame,
        delay: 65,
        ...(isHit ? tOff(-4, 2) : tOff(0, 0)),
        showEffect: isHit,
        moveStep: 2,
        hitProgress: 0.48,
        phaseId: "return-impact-3",
        phaseName: "#2. 순백 알갱이들 사방 확산 2단계",
      },
      {
        ...baseFrame,
        delay: 65,
        ...(isHit ? tOff(4, -1) : tOff(0, 0)),
        showEffect: isHit,
        moveStep: 2,
        hitProgress: 0.68,
        phaseId: "return-impact-4",
        phaseName: "#2. 순백 알갱이들 최대 확산 및 감속",
      },
      {
        ...baseFrame,
        delay: 65,
        ...(isHit ? tOff(2, -1) : tOff(0, 0)),
        showEffect: isHit,
        moveStep: 2,
        hitProgress: 0.85,
        phaseId: "return-impact-5",
        phaseName: "#2. 순백 알갱이들 축소 소산",
      },
      {
        ...baseFrame,
        delay: 70,
        ...tOff(0, 0),
        showEffect: isHit,
        moveStep: 2,
        hitProgress: 0.98,
        phaseId: "return-impact-6",
        phaseName: "#2. 타격 잔향 종료",
      },

      // ======================================================================
      // Phase 3. 복귀 및 원위치 안정화 (Step 3)
      // ======================================================================
      {
        ...baseFrame,
        delay: 85,
        ...cSquash(1.0, 1.0, 0),
        ...tOff(0, 0),
        showEffect: false,
        moveStep: 3,
        phaseId: "return-finish",
        phaseName: "#3. 원위치 복귀 및 안정화 완료",
      },
    ];
  },
};
