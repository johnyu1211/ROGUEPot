import { BattleFrame, BattleMoveAnimation, MoveContext } from "../types.js";
import {
  drawLeechLifeBehindEffect,
  drawLeechLifeEffect,
} from "../../../renderers/moves/gen1/move141_144.js";

/**
 * 141: 흡혈 (Leech Life)
 * 
 * 타입: 벌레 (Bug)
 * 분류: 물리 (Physical)
 * 위력: 80 / 명중: 100 / PP: 10
 * 
 * [유저 요청 사항]:
 * - 침같은 거 직선으로 날리고
 * - 노란색깔 흡수 이펙트 (기술 흡수 참고)
 * 
 * [타임라인 연출]:
 * Phase 1: 시전자 찌르기 모션 & 날카로운 금빛/호박색 침 직선 초고속 사출 (Frames 1~2, 135ms)
 * Phase 2: 대상 피격 섬광 & 관통 충격파 및 스파크 폭발 (Frames 3~4, 165ms)
 * Phase 3: 화면 은은한 암전 & 대상에게서 노란색 발광 에너지 점들이 외곽 곡선을 그리며 시전자에게 쇄도 (Frames 5~6, 190ms)
 * Phase 4: 시전자 체내로 생명력 흡수 & 발밑 골드 펄스 링 및 상승 치유 별빛 전개 후 복귀 (Frames 7~9, 270ms)
 */
export const leechLifeMove: BattleMoveAnimation = {
  num: 141,
  key: "leech-life",
  nameKo: "흡혈",
  nameEn: "Leech Life",
  type: "bug",
  category: "physical",
  camera: { type: "none" },
  drawBehindEffect: drawLeechLifeBehindEffect,
  drawEffect: drawLeechLifeEffect,

  buildFrames: (context: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = context;

    // 시전자만 움직이고 수비자는 {0, 0} 고정 헬퍼
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 피격자만 흔들리는 리액션 헬퍼
    const tOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const scl = (casterScale?: { x: number; y: number }, targetScale?: { x: number; y: number }) => ({
      pScale: isP ? casterScale : targetScale,
      eScale: !isP ? casterScale : targetScale,
    });

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
      pScale: { x: 1, y: 1 },
      eScale: { x: 1, y: 1 },
      pRot: 0,
      eRot: 0,
      hidePShadow: false,
      hideEShadow: false,
      showEffect: true,
      pRedTint: false,
      eRedTint: false,
    };

    // 빗맞았을 때 (Miss 처리)
    if (!isHit) {
      return [
        {
          ...baseFrame,
          delay: 70,
          moveStep: 1,
          ...cOff(12, -4),
          needleProgress: 0.35,
          needleAlpha: 0.9,
          phaseId: "leech-life-miss-1",
          phaseName: "1. 침 발사 (70ms)",
        },
        {
          ...baseFrame,
          delay: 80,
          moveStep: 2,
          ...cOff(4, -1),
          ...tOff(0, -18), // 대상 회피 도약
          needleProgress: 1.25,
          needleAlpha: 0.8,
          phaseId: "leech-life-miss-2",
          phaseName: "2. 대상 회피 (80ms)",
        },
        {
          ...baseFrame,
          delay: 70,
          moveStep: 3,
          ...cOff(0, 0),
          ...tOff(0, -4),
          needleProgress: 0,
          needleAlpha: 0,
          phaseId: "leech-life-miss-3",
          phaseName: "3. 빗나감 (70ms)",
        },
        {
          ...baseFrame,
          delay: 60,
          moveStep: 4,
          ...cOff(0, 0),
          ...tOff(0, 0),
          phaseId: "leech-life-miss-4",
          phaseName: "4. 복귀 (60ms)",
        },
      ];
    }

    // 명중 시 정규 애니메이션 (총 9프레임, 약 760ms)
    return [
      // 1. [Phase 1: 시전자 찌르기 모션 & 침 생성 사출]
      {
        ...baseFrame,
        delay: 70,
        moveStep: 1,
        ...cOff(14, -6),
        ...scl({ x: 1.05, y: 0.95 }, { x: 1.0, y: 1.0 }),
        dimAlpha: 0.15,
        needleProgress: 0.20,
        needleAlpha: 0.95,
        phaseId: "leech-life-shoot",
        phaseName: "1. 찌르기 & 침 발사 (70ms)",
      },

      // 2. [Phase 1: 직선 초고속 비행]
      {
        ...baseFrame,
        delay: 65,
        moveStep: 1,
        ...cOff(6, -2),
        ...scl({ x: 1.02, y: 0.98 }, { x: 1.0, y: 1.0 }),
        dimAlpha: 0.30,
        needleProgress: 0.70,
        needleAlpha: 1.0,
        phaseId: "leech-life-fly",
        phaseName: "2. 침 직선 비행 (65ms)",
      },

      // 3. [Phase 2: 대상 피격 관통]
      {
        ...baseFrame,
        delay: 80,
        moveStep: 2,
        ...cOff(0, 0),
        ...tOff(-6, -2),
        ...scl({ x: 1.0, y: 1.0 }, { x: 1.05, y: 0.95 }),
        dimAlpha: 0.38,
        needleProgress: 1.0,
        needleAlpha: 0.9,
        phaseId: "leech-life-hit",
        phaseName: "3. 대상 피격 침 도달 (80ms)",
      },

      // 4. [Phase 2~3: 피격 반동 및 화면 암전, 생명력 추출 개시]
      {
        ...baseFrame,
        delay: 85,
        moveStep: 2,
        ...cOff(0, 0),
        ...tOff(4, 2),
        ...scl({ x: 1.0, y: 1.0 }, { x: 0.96, y: 1.04 }),
        dimAlpha: 0.42,
        needleProgress: 0,
        needleAlpha: 0,
        drainProgress: 0.12,
        drainAlpha: 0.85,
        phaseId: "leech-life-extract",
        phaseName: "4. 피격 반동 & 생명력 추출 태동 (85ms)",
      },

      // 5. [Phase 3: 깊은 암전 & 대상에게서 노란색 흡수 스트림 사출]
      {
        ...baseFrame,
        delay: 95,
        moveStep: 3,
        ...cOff(0, 0),
        ...tOff(0, 0),
        ...scl({ x: 1.0, y: 1.0 }, { x: 0.98, y: 1.02 }),
        dimAlpha: 0.42,
        drainProgress: 0.48,
        drainAlpha: 1.0,
        phaseId: "leech-life-stream-flight",
        phaseName: "5. 노란색 에너지 곡선 스트림 비행 (95ms)",
      },

      // 6. [Phase 3~4: 시전자 도달 & 생명력 흡수 개시]
      {
        ...baseFrame,
        delay: 95,
        moveStep: 3,
        ...cOff(0, -2),
        ...tOff(0, 0),
        ...scl({ x: 1.03, y: 1.02 }, { x: 1.0, y: 1.0 }),
        dimAlpha: 0.35,
        drainProgress: 0.78,
        drainAlpha: 1.0,
        healAlpha: 0.45,
        healProgress: 0.35,
        phaseId: "leech-life-absorb-start",
        phaseName: "6. 시전자 도달 & 흡수 시작 (95ms)",
      },

      // 7. [Phase 4: 전 에너지 흡수 완료 & 치유 골드 펄스 링 팽창]
      {
        ...baseFrame,
        delay: 100,
        moveStep: 3,
        ...cOff(0, -4),
        ...tOff(0, 0),
        ...scl({ x: 1.06, y: 1.05 }, { x: 1.0, y: 1.0 }),
        dimAlpha: 0.25,
        drainProgress: 1.0,
        drainAlpha: 0.4,
        healAlpha: 0.95,
        healProgress: 0.70,
        phaseId: "leech-life-heal-pulse",
        phaseName: "7. 골드 치유 펄스 팽창 (100ms)",
      },

      // 8. [Phase 4: 치유 별빛 스파클 상승 & 암전 점진 해제]
      {
        ...baseFrame,
        delay: 90,
        moveStep: 4,
        ...cOff(0, -2),
        ...tOff(0, 0),
        ...scl({ x: 1.02, y: 1.01 }, { x: 1.0, y: 1.0 }),
        dimAlpha: 0.10,
        drainProgress: 1.0,
        drainAlpha: 0,
        healAlpha: 0.50,
        healProgress: 1.15,
        phaseId: "leech-life-sparkle",
        phaseName: "8. 치유 별빛 비산 & 암전 해제 (90ms)",
      },

      // 9. [Phase 4: 원위치 중립 복귀]
      {
        ...baseFrame,
        delay: 80,
        moveStep: 4,
        ...cOff(0, 0),
        ...tOff(0, 0),
        ...scl({ x: 1.0, y: 1.0 }, { x: 1.0, y: 1.0 }),
        dimAlpha: 0,
        drainProgress: 0,
        drainAlpha: 0,
        healAlpha: 0,
        healProgress: 0,
        phaseId: "leech-life-return",
        phaseName: "9. 중립 복귀 (80ms)",
      },
    ];
  },
};
