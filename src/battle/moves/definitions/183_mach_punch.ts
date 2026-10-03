// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawMachPunchBehindEffect,
  drawMachPunchEffect,
} from "../../../renderers/moves/gen1/move181_184.js";

/**
 * 183: 마하펀치 (Mach Punch) - 격투 타입 물리 선제 공격기 (위력 40, 우선도 +1)
 *
 * [유저 연출 지시]:
 * 1. 시전포켓몬이 잔상을 남기며 앞으로 이동함
 * 2. > 적 포커싱
 * 3. > 주먹 작아짐 (작아지기처럼 잔상을 남기며) + 주먹 작아질 때 카메라에 짧은 속도선
 * 4. > 최소크기에서 타격이펙트 발생
 * 5. > 흰색타격 및 파티클이 터져나옴
 */
export const machPunchMove: BattleMoveAnimation = {
  num: 183,
  key: "mach-punch",
  nameKo: "마하펀치",
  nameEn: "Mach Punch",
  type: "fighting",
  category: "physical",
  camera: {
    type: "caster_to_target",
    zoom: 1.35,
    focalRatio: 1.0, // 대상 포켓몬 정중앙 100% 록온 (적 포커싱 시 대상이 화면 정중앙에 위치)
    delayUntilStep: 2, // Step 1: 시전자 대시 포커싱, Step 2부터 적 포커싱
    inlineGlideInFrames: 2,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawMachPunchBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawMachPunchEffect(targetCtx, frame, drawCtx);
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

    // 시전자 위치 오프셋
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 피격자 위치 오프셋
    const tOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    return [
      // ======================================================================
      // Phase 1. 시전 포켓몬이 잔상을 남기며 앞으로 이동 (Step 1)
      // ======================================================================
      {
        ...baseFrame,
        delay: 70,
        ...cOff(14, -5),
        pScale: isP ? { x: 1.08, y: 0.94 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 1.08, y: 0.94 } : { x: 1.0, y: 1.0 },
        showEffect: false,
        showBehindEffect: true,
        moveStep: 1,
        casterAfterimages: [
          { dx: 0, dy: 0, alpha: 0.35 },
        ],
        phaseId: "mach-dash-1",
        phaseName: "#1. 시전자 고속 대시 시작 (잔상 1)",
      },
      {
        ...baseFrame,
        delay: 75,
        ...cOff(30, -10),
        pScale: isP ? { x: 1.12, y: 0.92 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 1.12, y: 0.92 } : { x: 1.0, y: 1.0 },
        showEffect: false,
        showBehindEffect: true,
        moveStep: 1,
        casterAfterimages: [
          { dx: 18, dy: -6, alpha: 0.45 },
          { dx: 4, dy: -1, alpha: 0.28 },
          { dx: -8, dy: 2, alpha: 0.15 },
        ],
        phaseId: "mach-dash-2",
        phaseName: "#1. 초고속 전진 돌파 (다중 잔상)",
      },
      {
        ...baseFrame,
        delay: 70,
        ...cOff(36, -12),
        pScale: isP ? { x: 1.10, y: 0.93 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 1.10, y: 0.93 } : { x: 1.0, y: 1.0 },
        showEffect: false,
        showBehindEffect: true,
        moveStep: 1,
        casterAfterimages: [
          { dx: 24, dy: -8, alpha: 0.38 },
          { dx: 10, dy: -3, alpha: 0.20 },
        ],
        phaseId: "mach-dash-3",
        phaseName: "#1. 펀치 직전 정권 장전",
      },

      // ======================================================================
      // Phase 2. 적 포커싱 > 주먹 작아짐 (작아지기처럼 잔상) + 카메라 짧은 속도선 (Step 2)
      // ======================================================================
      {
        ...baseFrame,
        delay: 70,
        ...cOff(34, -11),
        showEffect: true,
        moveStep: 2,
        fistProg: 0.20,
        phaseId: "mach-shrink-1",
        phaseName: "#2. 적 포커싱 & 주먹 축소 1단계 (속도선)",
      },
      {
        ...baseFrame,
        delay: 70,
        ...cOff(34, -11),
        showEffect: true,
        moveStep: 2,
        fistProg: 0.55,
        phaseId: "mach-shrink-2",
        phaseName: "#2. 주먹 고속 축소 2단계 (다중 잔상)",
      },
      {
        ...baseFrame,
        delay: 65,
        ...cOff(34, -11),
        showEffect: true,
        moveStep: 2,
        fistProg: 0.90,
        phaseId: "mach-shrink-3",
        phaseName: "#2. 주먹 극소화 3단계 (최소 크기 직전)",
      },

      // ======================================================================
      // Phase 3. 최소 크기에서 타격 발생 > 퍼지며 감속 > 작아지며 사라짐 (Step 3)
      // ======================================================================
      {
        ...baseFrame,
        delay: 80,
        ...cOff(32, -10),
        ...(isHit ? tOff(isP ? 10 : -10, -4) : tOff(0, 0)),
        hitFlash: isHit,
        showEffect: isHit,
        moveStep: 3,
        hitProgress: 0.10,
        phaseId: "mach-impact-peak",
        phaseName: "#3. 최소 크기 정권 직격 & 백색 타격 섬광 (알갱이 급속 분출)",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(26, -8),
        ...(isHit ? tOff(isP ? -6 : 6, 2) : tOff(0, 0)),
        showEffect: isHit,
        moveStep: 3,
        hitProgress: 0.48,
        phaseId: "mach-impact-burst",
        phaseName: "#3. 알갱이 퍼지며 감속 (최대 크기 유지)",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(20, -6),
        ...(isHit ? tOff(isP ? 3 : -3, -1) : tOff(0, 0)),
        showEffect: isHit,
        moveStep: 3,
        hitProgress: 0.76,
        phaseId: "mach-impact-shrink",
        phaseName: "#3. 알갱이 정지 후 축소 진행",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(14, -4),
        ...tOff(0, 0),
        showEffect: isHit,
        moveStep: 3,
        hitProgress: 0.98,
        phaseId: "mach-impact-dissipate",
        phaseName: "#3. 극소화 및 완전 소산",
      },

      // ======================================================================
      // Phase 4. 복귀 및 안정화 (Step 4)
      // ======================================================================
      {
        ...baseFrame,
        delay: 85,
        ...cOff(8, -2),
        ...tOff(0, 0),
        showEffect: false,
        moveStep: 4,
        phaseId: "mach-return-1",
        phaseName: "#4. 시전자 복귀 1",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...tOff(0, 0),
        showEffect: false,
        moveStep: 4,
        phaseId: "mach-return-2",
        phaseName: "#4. 원위치 복귀 완료",
      },
    ];
  },
};
