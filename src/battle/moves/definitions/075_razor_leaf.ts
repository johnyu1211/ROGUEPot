// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawRazorLeafEffect } from "../../../renderers/moves/gen1/move073_076.js";

/**
 * 075: 잎날가르기 (Razor Leaf) - 3세대(GBA 레트로) 스타일
 *
 * Concept (3rd Gen Retro Signature):
 * 1. 시전자 앞 칼바람 소용돌이와 함께 날카로운 잎사귀들이 회전 전개
 * 2. 잎날들이 상/하 넓은 나선형 스윙 궤적으로 화면을 가로지르며 쇄도
 * 3. 적을 스쳐 지나가며 3연속 사선 베기 슬래시 광선 작렬 & 넉백
 * 4. 잎사귀 파편이 사방으로 비산하고 자세 복귀
 */
export const razorLeafMove: BattleMoveAnimation = {
  num: 75,
  key: "razor-leaf",
  nameKo: "잎날가르기",
  nameEn: "Razor Leaf",
  type: "grass",
  category: "physical",
  camera: { type: "target", zoom: 1.32 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.32,
      pRot: 0,
      eRot: 0,
    };

    return [
      // #1. 시전 준비
      {
        ...baseFrame,
        delay: 100,
        pOffset: isP ? { x: -6, y: 2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 6, y: -2 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.06, y: 0.94 } : undefined,
        eScale: !isP ? { x: 1.06, y: 0.94 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.2,
        phaseId: "razorleaf-prepare",
        phaseName: "#1. 시전 준비",
      },
      // #2. 1/3 지점에서 나뭇잎 솟아오르기 시작
      {
        ...baseFrame,
        delay: 110,
        pOffset: isP ? { x: 2, y: -1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -2, y: 1 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.35,
        phaseId: "razorleaf-rise-1",
        phaseName: "#2. 1/3 지점 솟아오름",
      },
      // #3. 나뭇잎 체공 및 군집 전개
      {
        ...baseFrame,
        delay: 110,
        pOffset: isP ? { x: 6, y: -2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -6, y: 2 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.65,
        phaseId: "razorleaf-rise-2",
        phaseName: "#3. 나뭇잎 체공",
      },
      // #4. 정점 도달 및 대기
      {
        ...baseFrame,
        delay: 100,
        pOffset: isP ? { x: 4, y: -1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -4, y: 1 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 1.0,
        phaseId: "razorleaf-rise-peak",
        phaseName: "#4. 정점 도달",
      },
// #5. [1차 발사 준비] 1차 잎날(0,1) 고속 회전 & 2차/3차 대기
      {
        ...baseFrame,
        delay: 85,
        pOffset: isP ? { x: 10, y: -3 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -10, y: 3 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 5,
        effectProgress: 0.5,
        phaseId: "razorleaf-spin-burst1",
        phaseName: "#5. 1차 잎날 고속 회전",
      },
      // #6. [1차 발사 비행] 1차 잎날 2개 화면 횡단 쇄도
      {
        ...baseFrame,
        delay: 95,
        pOffset: isP ? { x: 14, y: -4 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -14, y: 4 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 6,
        effectProgress: 0.5,
        phaseId: "razorleaf-burst1-fly",
        phaseName: "#6. [1차 발사] 잎날 쇄도 비행",
      },
      // #7. [1차 관통 타격] 1차 잎날 적 관통 + 1차 타격 스파크 격발
      {
        ...baseFrame,
        delay: 100,
        pOffset: isP ? { x: 12, y: -3 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -12, y: 3 } : (isHit ? { x: -6, y: 2 } : { x: 0, y: 0 }),
        showEffect: true,
        hitFlash: isHit,
        moveStep: 7,
        effectProgress: 1.0,
        phaseId: "razorleaf-burst1-hit",
        phaseName: "#7. [1차 피격] 관통 직격 & 1차 타격",
      },
      // #8. [2차 발사 비행] 2차 잎날 2개 사출 및 화면 횡단 쇄도
      {
        ...baseFrame,
        delay: 95,
        pOffset: isP ? { x: 12, y: -3 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -12, y: 3 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 8,
        effectProgress: 0.5,
        phaseId: "razorleaf-burst2-fly",
        phaseName: "#8. [2차 발사] 잎날 쇄도 비행",
      },
      // #9. [2차 관통 타격] 2차 잎날 적 관통 + 2차 타격 스파크 격발
      {
        ...baseFrame,
        delay: 100,
        pOffset: isP ? { x: 10, y: -2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -10, y: 2 } : (isHit ? { x: 6, y: -2 } : { x: 0, y: 0 }),
        showEffect: true,
        hitFlash: isHit,
        moveStep: 9,
        effectProgress: 1.0,
        phaseId: "razorleaf-burst2-hit",
        phaseName: "#9. [2차 피격] 관통 직격 & 2차 타격",
      },
      // #10. [3차 발사 비행] 마지막 2개 사출 및 화면 횡단 쇄도
      {
        ...baseFrame,
        delay: 95,
        pOffset: isP ? { x: 10, y: -2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -10, y: 2 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 10,
        effectProgress: 0.5,
        phaseId: "razorleaf-burst3-fly",
        phaseName: "#10. [3차 발사] 잎날 쇄도 비행",
      },
      // #11. [3차 관통 타격] 3차 잎날 적 관통 + 3차 타격 스파크 & 넉백
      {
        ...baseFrame,
        delay: 110,
        pOffset: isP ? { x: 6, y: -1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -6, y: 1 } : (isHit ? { x: -14, y: 4 } : { x: 0, y: 0 }),
        showEffect: true,
        hitFlash: isHit,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 11,
        effectProgress: 1.0,
        phaseId: "razorleaf-burst3-hit",
        phaseName: "#11. [3차 피격] 3차 타격 & 최종 넉백",
      },
      // #12. [타격 잔향 페이드아웃] 스파크 잔광 확산 소멸 & 자세 정돈
      {
        ...baseFrame,
        delay: 90,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: -4, y: 1 } : { x: 4, y: -1 }) : { x: 0, y: 0 },
        showEffect: isHit,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 12,
        effectProgress: 0.6,
        phaseId: "razorleaf-fadeout",
        phaseName: "#12. 타격 잔향 페이드아웃",
      },
      // #13. [완료] 원상 복귀
      {
        ...baseFrame,
        delay: 70,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "razorleaf-complete",
        phaseName: "#13. 완료",
      },
    ];
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos, isPlayer } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawRazorLeafEffect(targetCtx, attackerPos, targetPos, step, prog, isPlayer);
  },
};