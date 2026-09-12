// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawSolarBeamChargeBehindEffect,
  drawSolarBeamChargeEffect,
  drawSolarBeamFireEffect,
  drawSolarBeamFireBehindEffect,
} from "../../../renderers/moves/gen1/move073_076.js";

/**
 * 076: 솔라빔 (1턴: 빛 모으기 / Solar Beam - Charge)
 *
 * 1턴 차징 연출:
 * - 시전자 포커스 카메라 줌 (camera: "self")
 * - 전장 배경 암전(Dimming)
 * - 사방에서 시전자 중심으로 빠르게 수렴하며 빨려들어가는 황금빛/순백 광선 스트릭
 * - 중심 코어 응축 및 피크 펄스 링/스파크
 */
export const solarBeamChargeMove: BattleMoveAnimation = {
  num: 76,
  key: "solar-beam-charge",
  nameKo: "솔라빔 (충전)",
  nameEn: "Solar Beam (Charge)",
  type: "grass",
  category: "special",
  camera: { type: "self", zoom: 1.34 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.34,
      pRot: 0,
      eRot: 0,
    };

    return [
      // #1. 호흡 축적 & 암전 시작
      {
        ...baseFrame,
        delay: 110,
        pOffset: isP ? { x: -4, y: 2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 4, y: -2 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.08, y: 0.92 } : undefined,
        eScale: !isP ? { x: 1.08, y: 0.92 } : undefined,
        showEffect: true,
        dimAlpha: 0.25,
        moveStep: 1,
        effectProgress: 0.15,
        phaseId: "solarbeam-charge-inhale",
        phaseName: "#1. 호흡 축적 & 암전 시작",
      },
      // #2. 사방에서 빛 광선 유입 시작
      {
        ...baseFrame,
        delay: 120,
        pOffset: isP ? { x: -2, y: 1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 2, y: -1 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.04, y: 0.96 } : undefined,
        eScale: !isP ? { x: 1.04, y: 0.96 } : undefined,
        showEffect: true,
        dimAlpha: 0.50,
        moveStep: 2,
        effectProgress: 0.35,
        phaseId: "solarbeam-charge-influx1",
        phaseName: "#2. 사방 빛 유입 시작",
      },
      // #3. 광선 유입 가속 및 에너지 코어 형성
      {
        ...baseFrame,
        delay: 120,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        dimAlpha: 0.65,
        moveStep: 3,
        effectProgress: 0.65,
        phaseId: "solarbeam-charge-influx2",
        phaseName: "#3. 광선 유입 가속 & 코어 형성",
      },
      // #4. 중심 태양광 에너지 초밀도 응축
      {
        ...baseFrame,
        delay: 130,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: isP ? { x: 0.96, y: 1.06 } : undefined,
        eScale: !isP ? { x: 0.96, y: 1.06 } : undefined,
        showEffect: true,
        dimAlpha: 0.70,
        moveStep: 4,
        effectProgress: 0.95,
        phaseId: "solarbeam-charge-dense",
        phaseName: "#4. 초밀도 에너지 응축",
      },
      // #5. 충전 피크: 펄스 링 & 개화 스파크 방출
      {
        ...baseFrame,
        delay: 140,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: isP ? { x: 1.10, y: 0.92 } : undefined,
        eScale: !isP ? { x: 1.10, y: 0.92 } : undefined,
        showEffect: true,
        dimAlpha: 0.40,
        moveStep: 5,
        effectProgress: 0.40,
        phaseId: "solarbeam-charge-peak",
        phaseName: "#5. 충전 피크 & 펄스 링 개화",
      },
      // #6. 충전 완료 및 발사 준비 완료
      {
        ...baseFrame,
        delay: 100,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        dimAlpha: 0.15,
        moveStep: 6,
        effectProgress: 0.90,
        phaseId: "solarbeam-charge-ready",
        phaseName: "#6. 충전 완료 대기",
      },
      // #7. 암전 해제 및 다음 턴 대기
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        dimAlpha: 0,
        phaseId: "solarbeam-charge-end",
        phaseName: "#7. 충전 대기 완료",
      },
    ];
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame) => {
    drawSolarBeamChargeBehindEffect(targetCtx, frame);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawSolarBeamChargeEffect(targetCtx, attackerPos, step, prog);
  },
};

/**
 * 076: 솔라빔 (2턴: 솔라 레이저 발사 / Solar Beam - Fire)
 *
 * 2턴 발사 연출:
 * - 대상 포커스 카메라 줌 (camera: "target")
 * - 시전자 앞 거대 태양광 코어 순간 팽창
 * - 적을 관통하는 극태 솔라 레이저 빔 방출 (순백 코어 + 라임 림)
 * - 관통 피격 지점 초대형 섬광 스파크 & 2중 충격파 링 & 강한 넉백
 */
export const solarBeamMove: BattleMoveAnimation = {
  num: 76,
  key: "solar-beam",
  nameKo: "솔라빔",
  nameEn: "Solar Beam",
  type: "grass",
  category: "special",
  camera: { type: "target", zoom: 1.34 },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.34,
      pRot: 0,
      eRot: 0,
    };

return [
      // #1. 하늘 에너지 집결 시작 (화면 서서히 어두워짐)
      {
        ...baseFrame,
        delay: 70,
        pOffset: isP ? { x: -4, y: 1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 4, y: -1 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.04, y: 0.96 } : undefined,
        eScale: !isP ? { x: 1.04, y: 0.96 } : undefined,
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.15,
        moveStep: 1,
        effectProgress: 0.15,
        phaseId: "solarbeam-fire-gather1",
        phaseName: "#1. 하늘 에너지 집결 시작",
      },
      // #2. 암전 심화 & 시전자 코어 응축
      {
        ...baseFrame,
        delay: 75,
        pOffset: isP ? { x: -6, y: 2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 6, y: -2 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.08, y: 0.92 } : undefined,
        eScale: !isP ? { x: 1.08, y: 0.92 } : undefined,
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.40,
        moveStep: 2,
        effectProgress: 0.45,
        phaseId: "solarbeam-fire-gather2",
        phaseName: "#2. 암전 심화 & 코어 응축",
      },
      // #3. 하늘 코어 응축 가속
      {
        ...baseFrame,
        delay: 80,
        pOffset: isP ? { x: -7, y: 3 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 7, y: -3 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.10, y: 0.90 } : undefined,
        eScale: !isP ? { x: 1.10, y: 0.90 } : undefined,
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.60,
        yellowCharge: 0.3,
        moveStep: 3,
        effectProgress: 0.65,
        phaseId: "solarbeam-fire-gather3",
        phaseName: "#3. 하늘 코어 응축 가속",
      },
      // #4. 최대 암전 + 하늘 코어 극대화 (발사 직전 정적)
      {
        ...baseFrame,
        delay: 90,
        pOffset: isP ? { x: -3, y: 1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 3, y: -1 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.14, y: 0.86 } : undefined,
        eScale: !isP ? { x: 1.14, y: 0.86 } : undefined,
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.78,
        yellowCharge: 0.6,
        moveStep: 4,
        effectProgress: 0.90,
        phaseId: "solarbeam-fire-gather4",
        phaseName: "#4. 최대 암전 & 하늘 코어 극대화",
      },
      // #5. 번쩍! 화면 노란 섬광 폭발 (발사 순간)
      {
        ...baseFrame,
        delay: 60,
        pOffset: isP ? { x: -6, y: 2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 6, y: -2 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.0,
        yellowFlash: 1.0,
        moveStep: 5,
        effectProgress: 0.05,
        phaseId: "solarbeam-fire-flash",
        phaseName: "#5. 번쩍! 노란 섬광",
      },
      // #6. 직선 빔 생성 시작 (하늘 → 표적 강하 초반) - 암전 유지
      {
        ...baseFrame,
        delay: 70,
        pOffset: isP ? { x: -3, y: 1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 3, y: -1 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.60,
        yellowFlash: 0.6,
        moveStep: 6,
        effectProgress: 0.15,
        phaseId: "solarbeam-fire-descend1",
        phaseName: "#6. 직선 빔 생성 시작",
      },
      // #7. 빔 강하 중반 (6각형 조각들 진동 시작) - 암전 유지
      {
        ...baseFrame,
        delay: 70,
        pOffset: isP ? { x: -1, y: 0 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 1, y: 0 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.55,
        yellowFlash: 0.4,
        moveStep: 7,
        effectProgress: 0.45,
        phaseId: "solarbeam-fire-descend2",
        phaseName: "#7. 빔 강하 중반",
      },
      // #8. 빔 도달 완료 + 구체 생성 시작 + 피격자 노란빛 시작 - 암전 유지
      {
        ...baseFrame,
        delay: 75,
        pOffset: isP ? { x: 2, y: -1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -2, y: 1 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.50,
        yellowFlash: 0.25,
        moveStep: 8,
        effectProgress: 0.25,
        eYellowAura: !isP,
        pYellowAura: isP,
        phaseId: "solarbeam-fire-impact-start",
        phaseName: "#8. 빔 도달 & 구체 생성 시작",
      },
      // #9. 구체 성장 + 노드 강약 반복 1 - 암전 유지
      {
        ...baseFrame,
        delay: 85,
        pOffset: isP ? { x: 8, y: -3 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -8, y: 3 } : (isHit ? { x: -14, y: 5 } : { x: 0, y: 0 }),
        showEffect: true,
        hitFlash: isHit,
        dimAlpha: 0.50,
        moveStep: 9,
        effectProgress: 0.40,
        eYellowAura: !isP,
        pYellowAura: isP,
        phaseId: "solarbeam-fire-pulse1",
        phaseName: "#9. 구체 성장 & 노드 강약 1",
      },
      // #10. 노드 강약 반복 2 (좌우 진동) - 암전 유지
      {
        ...baseFrame,
        delay: 80,
        pOffset: isP ? { x: 10, y: -4 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -10, y: 4 } : (isHit ? { x: 10, y: -4 } : { x: 0, y: 0 }),
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.48,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 10,
        effectProgress: 0.65,
        eYellowAura: !isP,
        pYellowAura: isP,
        phaseId: "solarbeam-fire-pulse2",
        phaseName: "#10. 노드 강약 2 (좌우)",
      },
      // #11. 구체 최대 팽창 직전 (압축) - 암전 유지
      {
        ...baseFrame,
        delay: 75,
        pOffset: isP ? { x: 6, y: -2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -6, y: 2 } : (isHit ? { x: -8, y: 3 } : { x: 0, y: 0 }),
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.45,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 11,
        effectProgress: 0.85,
        eYellowAura: !isP,
        pYellowAura: isP,
        phaseId: "solarbeam-fire-pulse3",
        phaseName: "#11. 구체 최대 팽창 직전",
      },
      // #12. 구체 대폭발 + 강한 넉백 - 암전 약간 감소
      {
        ...baseFrame,
        delay: 100,
        pOffset: isP ? { x: 4, y: -1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -4, y: 1 } : (isHit ? { x: -22, y: 9 } : { x: 0, y: 0 }),
        showEffect: true,
        hitFlash: isHit,
        dimAlpha: 0.40,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 12,
        effectProgress: 0.60,
        eYellowAura: !isP,
        pYellowAura: isP,
        phaseId: "solarbeam-fire-explosion",
        phaseName: "#12. 구체 대폭발 & 넉백",
      },
      // #13. 폭발 잔광 (충격파 확산) - 암전 서서히 감소
      {
        ...baseFrame,
        delay: 85,
        pOffset: isP ? { x: 2, y: -1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -2, y: 1 } : (isHit ? { x: -10, y: 4 } : { x: 0, y: 0 }),
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.28,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 13,
        effectProgress: 0.40,
        phaseId: "solarbeam-fire-blast",
        phaseName: "#13. 폭발 잔광 & 충격파",
      },
      // #14. 빔 꼬리 소멸 (하늘 쪽부터) - 암전 거의 해제
      {
        ...baseFrame,
        delay: 90,
        pOffset: isP ? { x: 2, y: -1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -2, y: 1 } : (isHit ? { x: -6, y: 2 } : { x: 0, y: 0 }),
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.12,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 14,
        effectProgress: 0.35,
        phaseId: "solarbeam-fire-tailfade",
        phaseName: "#14. 빔 꼬리 소멸",
      },
      // #15. 타격 잔향 스파크 소멸 - 암전 완전 해제
      {
        ...baseFrame,
        delay: 100,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: -2, y: 1 } : { x: 2, y: -1 }) : { x: 0, y: 0 },
        showEffect: isHit,
        hitFlash: false,
        dimAlpha: 0.0,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 15,
        effectProgress: 0.7,
        phaseId: "solarbeam-fire-afterglow",
        phaseName: "#15. 타격 잔향 소멸",
      },
      // #16. 완료 및 복귀
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "solarbeam-fire-complete",
        phaseName: "#16. 완료 및 복귀",
      },
    ];
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame) => {
    drawSolarBeamFireBehindEffect(targetCtx, frame);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawSolarBeamFireEffect(targetCtx, attackerPos, targetPos, step, prog);
  },
};