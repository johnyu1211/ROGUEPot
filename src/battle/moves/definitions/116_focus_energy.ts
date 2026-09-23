// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawFocusEnergyEffect,
  drawFocusEnergyBehindEffect,
} from "../../../renderers/moves/gen1/move113_116.js";

/**
 * 116: 기충전 / 기에모으기 (Focus Energy) - 노말 타입 변화기 (급소율 2랭크 상승)
 *
 * 연출 구성 (신규 리메이크 1단계):
 * - 시전 포켓몬 둘레를 3D 입체로 둥글게 떠서 도는 영롱한 노란빛 에너지 구체
 * - 포켓몬 앞/뒤(Behind ↔ Front) 레이어 분리를 통한 완벽한 3D 공간 공전 연출
 */
export const focusEnergyMove: BattleMoveAnimation = {
  num: 116,
  key: "focus-energy",
  nameKo: "기충전",
  nameEn: "Focus Energy",
  type: "normal",
  category: "status",
  customStatParticles: true,
  camera: { type: "self", zoom: 1.25 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawFocusEnergyBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawFocusEnergyEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
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
    };

    // 20단계 시전 포켓몬 3D 원형 공전 궤도 (8개 노란빛 구체 45° 균등 간격 & 22.5°씩 매끄러운 연속 회전)
    // 회전 도중 1차 구체군(#1, #4, #6)에 이어 추가 구체군(#2, #5, #7)이 합류하여
    // 상공을 향해 최대 130px에 달하는 초장거리 빛줄기를 더 길게 뿜어내며 웅장하게 회전
    const orbitSteps: Array<{
      angle: number;
      delay: number;
      phaseName: string;
      orbBeams?: Array<{ orbIndex: number; height: number; intensity: number }>;
    }> = [
      { angle: 0.000 * Math.PI, delay: 65, phaseName: "#1. 8개 노란빛 구체 궤도 형성 (0.0°)" },
      { angle: 0.125 * Math.PI, delay: 60, phaseName: "#2. 8개 구체 3D 공전 회전 (22.5°)" },
      { angle: 0.250 * Math.PI, delay: 60, phaseName: "#3. 8개 구체 3D 공전 회전 (45.0°)" },
      { angle: 0.375 * Math.PI, delay: 60, phaseName: "#4. 8개 구체 3D 공전 회전 (67.5°)" },
      {
        angle: 0.500 * Math.PI,
        delay: 60,
        phaseName: "#5. 구체 #1 상공 노란빛줄기 분출 시작 (90.0°)",
        orbBeams: [{ orbIndex: 1, height: 38, intensity: 0.65 }],
      },
      {
        angle: 0.625 * Math.PI,
        delay: 60,
        phaseName: "#6. 구체 #1 빛줄기 급상승 (112.5°)",
        orbBeams: [{ orbIndex: 1, height: 68, intensity: 0.95 }],
      },
      {
        angle: 0.750 * Math.PI,
        delay: 60,
        phaseName: "#7. 구체 #1 광선 신장 & 구체 #4 빛줄기 분출 (135.0°)",
        orbBeams: [
          { orbIndex: 1, height: 85, intensity: 1.0 },
          { orbIndex: 4, height: 40, intensity: 0.65 },
        ],
      },
      {
        angle: 0.875 * Math.PI,
        delay: 60,
        phaseName: "#8. 구체 #1 광선 연장, #4 급상승 & 구체 #6 분출 (157.5°)",
        orbBeams: [
          { orbIndex: 1, height: 95, intensity: 0.90 },
          { orbIndex: 4, height: 80, intensity: 0.95 },
          { orbIndex: 6, height: 45, intensity: 0.70 },
        ],
      },
      {
        angle: 1.000 * Math.PI,
        delay: 60,
        phaseName: "#9. 빛줄기 장거리 신장 & 추가 구체 #2 분출 시작 (180.0°)",
        orbBeams: [
          { orbIndex: 1, height: 105, intensity: 0.80 },
          { orbIndex: 4, height: 105, intensity: 1.0 },
          { orbIndex: 6, height: 85, intensity: 0.95 },
          { orbIndex: 2, height: 50, intensity: 0.75 },
        ],
      },
      {
        angle: 1.125 * Math.PI,
        delay: 60,
        phaseName: "#10. 초장거리 빛줄기 상공 확장 & 추가 구체 #5 분출 (202.5°)",
        orbBeams: [
          { orbIndex: 1, height: 115, intensity: 0.60 },
          { orbIndex: 4, height: 120, intensity: 1.0 },
          { orbIndex: 6, height: 110, intensity: 1.0 },
          { orbIndex: 2, height: 90, intensity: 0.95 },
          { orbIndex: 5, height: 50, intensity: 0.75 },
        ],
      },
      {
        angle: 1.250 * Math.PI,
        delay: 60,
        phaseName: "#11. 빛줄기 최대 신장(125px) & 추가 구체 #7 분출 (225.0°)",
        orbBeams: [
          { orbIndex: 1, height: 115, intensity: 0.35 },
          { orbIndex: 4, height: 125, intensity: 0.95 },
          { orbIndex: 6, height: 125, intensity: 1.0 },
          { orbIndex: 2, height: 120, intensity: 1.0 },
          { orbIndex: 5, height: 90, intensity: 0.95 },
          { orbIndex: 7, height: 55, intensity: 0.80 },
        ],
      },
      {
        angle: 1.375 * Math.PI,
        delay: 60,
        phaseName: "#12. 5개 구체 동시 초장거리 빛기둥(130px) 상공 관통 (247.5°)",
        orbBeams: [
          { orbIndex: 4, height: 125, intensity: 0.85 },
          { orbIndex: 6, height: 130, intensity: 1.0 },
          { orbIndex: 2, height: 130, intensity: 1.0 },
          { orbIndex: 5, height: 120, intensity: 1.0 },
          { orbIndex: 7, height: 105, intensity: 0.95 },
        ],
      },
      {
        angle: 1.500 * Math.PI,
        delay: 60,
        phaseName: "#13. 초장거리 빛기둥 군집 3D 회전 지속 (270.0°)",
        orbBeams: [
          { orbIndex: 4, height: 115, intensity: 0.40 },
          { orbIndex: 6, height: 130, intensity: 0.90 },
          { orbIndex: 2, height: 130, intensity: 0.95 },
          { orbIndex: 5, height: 128, intensity: 1.0 },
          { orbIndex: 7, height: 125, intensity: 1.0 },
        ],
      },
      {
        angle: 1.625 * Math.PI,
        delay: 60,
        phaseName: "#14. 2차 구체군 초장거리 빛기둥 회전 (292.5°)",
        orbBeams: [
          { orbIndex: 6, height: 115, intensity: 0.35 },
          { orbIndex: 2, height: 125, intensity: 0.85 },
          { orbIndex: 5, height: 130, intensity: 0.90 },
          { orbIndex: 7, height: 130, intensity: 0.95 },
        ],
      },
      {
        angle: 1.750 * Math.PI,
        delay: 60,
        phaseName: "#15. 상공 빛줄기 하늘로 승화 시작 (315.0°)",
        orbBeams: [
          { orbIndex: 2, height: 115, intensity: 0.55 },
          { orbIndex: 5, height: 125, intensity: 0.75 },
          { orbIndex: 7, height: 125, intensity: 0.80 },
        ],
      },
      {
        angle: 1.875 * Math.PI,
        delay: 60,
        phaseName: "#16. 빛줄기 하늘 높이 흡수 및 페이드 (337.5°)",
        orbBeams: [
          { orbIndex: 2, height: 100, intensity: 0.25 },
          { orbIndex: 5, height: 115, intensity: 0.50 },
          { orbIndex: 7, height: 120, intensity: 0.55 },
        ],
      },
      {
        angle: 2.000 * Math.PI,
        delay: 60,
        phaseName: "#17. 잔여 빛줄기 수직 소멸 (360.0°)",
        orbBeams: [
          { orbIndex: 5, height: 95, intensity: 0.25 },
          { orbIndex: 7, height: 105, intensity: 0.30 },
        ],
      },
      {
        angle: 2.125 * Math.PI,
        delay: 60,
        phaseName: "#18. 최종 잔광 승화 및 8개 구체 안정화 (382.5°)",
        orbBeams: [
          { orbIndex: 7, height: 80, intensity: 0.15 },
        ],
      },
      { angle: 2.250 * Math.PI, delay: 60, phaseName: "#19. 8개 구체 3D 공전 안정화 (405.0°)" },
      { angle: 2.375 * Math.PI, delay: 65, phaseName: "#20. 8개 구체 3D 공전 완주 (427.5°)" },
    ];

    return orbitSteps.map((s, idx) => ({
      ...baseFrame,
      delay: s.delay,
      moveStep: 1,
      effectProgress: idx / (orbitSteps.length - 1),
      orbAngle: s.angle,
      orbBeams: s.orbBeams,
      phaseId: `focus-energy-orb-${String(idx + 1).padStart(2, "0")}`,
      phaseName: s.phaseName,
    }));
  },
};
