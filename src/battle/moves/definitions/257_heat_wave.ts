// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawHeatWaveBehindEffect,
  drawHeatWaveEffect,
} from "../../../renderers/moves/gen1/move257_260.js";

/**
 * 257: 열풍 (Heat Wave / ねっぷう) - 불꽃 타입 특수 기술 (위력 95 / 명중 90 / PP 10 / 10% 화상)
 *
 * [유저 요구사항 100% 반영]:
 * 1. 배경 필터: 약간 붉은 색깔, 주황 색깔로 섞여 있는 스트라이프로 된 필터 적용
 * 2. 스트라이프 사이를 투명 반투명 그라데이션 적용
 * 3. 스트라이프가 약간 비스듬하게 되어 있음 (-20도 경사각)
 * 4. 이 스트라이프가 위로 올라가는 애니메이션을 빠르게 적용
 */
export const heatWaveMove: BattleMoveAnimation = {
  num: 257,
  key: "heat-wave",
  nameKo: "열풍",
  nameEn: "Heat Wave",
  type: "fire",
  category: "special",
  camera: { type: "target", zoom: 1.25 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawHeatWaveBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawHeatWaveEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      cameraZoom: 1.25,
      pRot: 0,
      eRot: 0,
    };

    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const targetReact = (x: number, y: number, scaleX: number = 1.0, scaleY: number = 1.0) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x, y } : { x: 0, y: 0 },
      pScale: !isP && (scaleX !== 1.0 || scaleY !== 1.0) ? { x: scaleX, y: scaleY } : undefined,
      eScale: isP && (scaleX !== 1.0 || scaleY !== 1.0) ? { x: scaleX, y: scaleY } : undefined,
    });

    // ------------------------------------------------------------------------
    // 빗나감(Miss) 시퀀스
    // ------------------------------------------------------------------------
    if (!isHit) {
      return [
        {
          ...baseFrame,
          delay: 80,
          ...cOff(-6, 3),
          showBehindEffect: true,
          showEffect: true,
          moveStep: 1,
          effectProgress: 0.15,
          heatWaveTime: 0.2,
          filterIntensity: 0.6,
          phaseId: "heat-wave-miss-prep",
          phaseName: "1. 열기 모으기 (빗나감)",
        },
        {
          ...baseFrame,
          delay: 75,
          ...cOff(12, -4),
          showBehindEffect: true,
          showEffect: true,
          moveStep: 2,
          effectProgress: 0.40,
          heatWaveTime: 0.7,
          filterIntensity: 1.0,
          phaseId: "heat-wave-miss-fire",
          phaseName: "2. 열풍 사출 (빗나감)",
        },
        {
          ...baseFrame,
          delay: 85,
          ...cOff(6, -2),
          ...targetReact(24, 0), // 대상 회피
          showBehindEffect: true,
          showEffect: true,
          moveStep: 3,
          effectProgress: 0.75,
          heatWaveTime: 1.3,
          filterIntensity: 0.7,
          phaseId: "heat-wave-miss-dodge",
          phaseName: "3. 대상의 열풍 회피",
        },
        {
          ...baseFrame,
          delay: 70,
          ...cOff(0, 0),
          showBehindEffect: false,
          showEffect: false,
          moveStep: 5,
          effectProgress: 1.0,
          heatWaveTime: 1.8,
          filterIntensity: 0.0,
          phaseId: "heat-wave-miss-end",
          phaseName: "4. 공격 빗나감",
        },
      ];
    }

    // ------------------------------------------------------------------------
    // 적중(Hit) 시퀀스 (총 16프레임, 45~65ms의 속도감 넘치는 30 FPS 규격)
    // ------------------------------------------------------------------------
    const frames: BattleFrame[] = [];
    let timeAcc = 0;

    // Phase 1: 시전자 열기 호흡 및 준비 (스트라이프 배경 필터 페이드인 시작) [2프레임]
    frames.push({
      ...baseFrame,
      delay: 70,
      ...cOff(-5, 2),
      pScale: isP ? { x: 1.04, y: 0.96 } : undefined,
      eScale: !isP ? { x: 1.04, y: 0.96 } : undefined,
      showBehindEffect: true,
      showEffect: true,
      moveStep: 1,
      effectProgress: 0.08,
      heatWaveTime: (timeAcc += 0.25),
      filterIntensity: 0.45,
      phaseId: "heat-wave-prep-1",
      phaseName: "0. 열기 들이쉬기 & 배경 붉은/주황 스트라이프 필터 시작",
    });

    frames.push({
      ...baseFrame,
      delay: 60,
      ...cOff(-8, 4),
      pScale: isP ? { x: 1.08, y: 0.92 } : undefined,
      eScale: !isP ? { x: 1.08, y: 0.92 } : undefined,
      showBehindEffect: true,
      showEffect: true,
      moveStep: 1,
      effectProgress: 0.16,
      heatWaveTime: (timeAcc += 0.30),
      filterIntensity: 0.75,
      phaseId: "heat-wave-prep-2",
      phaseName: "1. 웅크림 & 비스듬한 스트라이프 위로 빠르게 상승",
    });

    // Phase 2: 열풍 사출 & 전장 쇄도 (스트라이프 필터 최대 출력, 초고속 상승) [4프레임]
    frames.push({
      ...baseFrame,
      delay: 50,
      ...cOff(12, -4),
      pScale: isP ? { x: 1.10, y: 0.90 } : undefined,
      eScale: !isP ? { x: 1.10, y: 0.90 } : undefined,
      showBehindEffect: true,
      showEffect: true,
      moveStep: 2,
      effectProgress: 0.28,
      heatWaveTime: (timeAcc += 0.35),
      filterIntensity: 1.0,
      phaseId: "heat-wave-fire-1",
      phaseName: "2. 열풍 전방 분사 & 스트라이프 초고속 상승",
    });

    frames.push({
      ...baseFrame,
      delay: 48,
      ...cOff(10, -3),
      showBehindEffect: true,
      showEffect: true,
      moveStep: 2,
      effectProgress: 0.40,
      heatWaveTime: (timeAcc += 0.35),
      filterIntensity: 1.0,
      phaseId: "heat-wave-fire-2",
      phaseName: "3. 열풍 바람 줄기 쇄도 & 불티 비산",
    });

    frames.push({
      ...baseFrame,
      delay: 48,
      ...cOff(8, -2),
      showBehindEffect: true,
      showEffect: true,
      moveStep: 2,
      effectProgress: 0.50,
      heatWaveTime: (timeAcc += 0.35),
      filterIntensity: 1.0,
      phaseId: "heat-wave-fire-3",
      phaseName: "4. 전장 열풍으로 가득참",
    });

    frames.push({
      ...baseFrame,
      delay: 50,
      ...cOff(6, -1),
      showBehindEffect: true,
      showEffect: true,
      moveStep: 2,
      effectProgress: 0.58,
      heatWaveTime: (timeAcc += 0.35),
      filterIntensity: 1.0,
      phaseId: "heat-wave-fire-4",
      phaseName: "5. 적 면전 도달 직전",
    });

    // Phase 3: 적 피격 구간 [6프레임]
    frames.push({
      ...baseFrame,
      delay: 50,
      ...cOff(4, -1),
      ...targetReact(4, -2, 0.96, 1.04),
      hitFlash: false,
      showBehindEffect: true,
      showEffect: true,
      moveStep: 3,
      effectProgress: 0.65,
      heatWaveTime: (timeAcc += 0.35),
      filterIntensity: 1.0,
      phaseId: "heat-wave-hit-1",
      phaseName: "6. 대상 도달 & 열풍 휘감김",
    });

    frames.push({
      ...baseFrame,
      delay: 48,
      ...cOff(2, 0),
      ...targetReact(-4, 2, 1.04, 0.96),
      hitFlash: false,
      showBehindEffect: true,
      showEffect: true,
      moveStep: 3,
      effectProgress: 0.72,
      heatWaveTime: (timeAcc += 0.35),
      filterIntensity: 1.0,
      phaseId: "heat-wave-hit-2",
      phaseName: "7. 열풍 지속 & 스트라이프 고속 상승",
    });

    frames.push({
      ...baseFrame,
      delay: 48,
      ...cOff(0, 0),
      ...targetReact(3, -1),
      hitFlash: false,
      showBehindEffect: true,
      showEffect: true,
      moveStep: 3,
      effectProgress: 0.78,
      heatWaveTime: (timeAcc += 0.35),
      filterIntensity: 1.0,
      phaseId: "heat-wave-hit-3",
      phaseName: "8. 열풍 지속 2",
    });

    frames.push({
      ...baseFrame,
      delay: 50,
      ...targetReact(-4, 2, 1.04, 0.96),
      showBehindEffect: true,
      showEffect: true,
      moveStep: 4,
      effectProgress: 0.83,
      heatWaveTime: (timeAcc += 0.35),
      filterIntensity: 0.95,
      phaseId: "heat-wave-hit-4",
      phaseName: "9. 피격 흔들림 감쇄",
    });

    frames.push({
      ...baseFrame,
      delay: 55,
      ...targetReact(2, -1),
      showBehindEffect: true,
      showEffect: true,
      moveStep: 4,
      effectProgress: 0.88,
      heatWaveTime: (timeAcc += 0.35),
      filterIntensity: 0.85,
      phaseId: "heat-wave-hit-5",
      phaseName: "10. 불꽃 비산 & 열기 지속",
    });

    frames.push({
      ...baseFrame,
      delay: 60,
      ...targetReact(0, 0),
      showBehindEffect: true,
      showEffect: true,
      moveStep: 4,
      effectProgress: 0.92,
      heatWaveTime: (timeAcc += 0.30),
      filterIntensity: 0.70,
      phaseId: "heat-wave-hit-6",
      phaseName: "11. 대상 진정",
    });

    // Phase 4: 열풍 소산 및 페이드아웃 복귀 [4프레임]
    frames.push({
      ...baseFrame,
      delay: 60,
      showBehindEffect: true,
      showEffect: true,
      moveStep: 4,
      effectProgress: 0.95,
      heatWaveTime: (timeAcc += 0.25),
      filterIntensity: 0.50,
      phaseId: "heat-wave-dissipate-1",
      phaseName: "12. 열풍 스트라이프 상공 소산",
    });

    frames.push({
      ...baseFrame,
      delay: 65,
      showBehindEffect: true,
      showEffect: true,
      moveStep: 5,
      effectProgress: 0.98,
      heatWaveTime: (timeAcc += 0.20),
      filterIntensity: 0.30,
      phaseId: "heat-wave-dissipate-2",
      phaseName: "13. 배경 필터 페이드아웃",
    });

    frames.push({
      ...baseFrame,
      delay: 70,
      showBehindEffect: true,
      showEffect: false,
      moveStep: 5,
      effectProgress: 1.0,
      heatWaveTime: (timeAcc += 0.15),
      filterIntensity: 0.12,
      phaseId: "heat-wave-dissipate-3",
      phaseName: "14. 미세 잔열 페이드아웃",
    });

    frames.push({
      ...baseFrame,
      delay: 60,
      showBehindEffect: false,
      showEffect: false,
      moveStep: 5,
      effectProgress: 1.0,
      heatWaveTime: (timeAcc += 0.10),
      filterIntensity: 0.0,
      phaseId: "heat-wave-end",
      phaseName: "15. 시전 완료 및 정상 복귀",
    });

    return frames;
  },
};
