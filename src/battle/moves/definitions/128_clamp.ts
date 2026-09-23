// ============================================================================
// 128: 껍질에끼우기 (Clamp / からではさむ) - 물 타입 물리 기술 (위력 35, 명중 85%, 4~5턴 구속)
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import {
  drawClampBehindEffect,
  drawClampEffect,
} from "../../../renderers/moves/gen1/move125_128.js";

/**
 * 128: 껍질에끼우기 (Clamp)
 *
 * 연출 구성:
 * 1. [Phase 1: 껍질 소환 & 개방 포위] 대상 포켓몬 전후로 웅장한 바이올렛-코발트 조개 껍질 2짝이 소환되며 활짝 벌어짐
 * 2. [Phase 2: 1차 쾅! 조이기 직격 (SNAP!)] 초고속으로 껍질이 닫히며 쾅! 직격, 피격자 가로 스쿼시 및 수압 충격파/물보라 분출
 * 3. [Phase 3: 2단 연속 압박 조이기 (SQUEEZE)] 닫힌 껍질로 2회 연속 꽉! 짓누르며 틈새에서 아쿠아 수포 및 충격 진동
 * 4. [Phase 4: 껍질 개방 & 기화 소멸] 껍질이 딸깍 열리며 반짝이는 물방울과 함께 페이드아웃, 피격자 안정화 복귀
 */
export const clampMove: BattleMoveAnimation = {
  num: 128,
  key: "clamp",
  nameKo: "껍질에끼우기",
  nameEn: "Clamp",
  type: "water",
  category: "physical",
  camera: { type: "target", zoom: 1.25, delayUntilStep: 1 },
  drawBehindEffect: drawClampBehindEffect,
  drawEffect: drawClampEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.25,
      pRot: 0,
      eRot: 0,
    };

    // 시전자 오프셋 & 스케일 헬퍼
    const cOff = (x: number, y: number, sx: number = 1.0, sy: number = 1.0) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
      pScale: isP && (sx !== 1.0 || sy !== 1.0) ? { x: sx, y: sy } : undefined,
      eScale: !isP && (sx !== 1.0 || sy !== 1.0) ? { x: sx, y: sy } : undefined,
    });

    // 피격자 오프셋 & 스케일 헬퍼 (스쿼시: 껍질에 조여질 때 가로 압축 / 세로 팽창)
    const targetOff = (offX: number, offY: number, sx: number = 1.0, sy: number = 1.0) => ({
      pOffset: !isP ? { x: -offX, y: offY } : { x: 0, y: 0 },
      eOffset: isP ? { x: offX, y: offY } : { x: 0, y: 0 },
      pScale: !isP && (sx !== 1.0 || sy !== 1.0) ? { x: sx, y: sy } : undefined,
      eScale: isP && (sx !== 1.0 || sy !== 1.0) ? { x: sx, y: sy } : undefined,
    });

    return [
      // ======================================================================
      // Phase 1: 껍질 소환 및 개방 포위 (Step 1 - 2프레임)
      // ======================================================================
      // 1. 껍질 페이드인 & 포위 시작
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...targetOff(0, -1, 0.98, 1.02),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.35,
        phaseId: "clamp-summon-1",
        phaseName: "1. 조개 껍질 소환 개방",
      },
      // 2. 껍질 활짝 벌어지며 대상 완전 포위
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...targetOff(0, 0, 1.00, 1.00),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.95,
        phaseId: "clamp-summon-2",
        phaseName: "2. 조개 껍질 완전 포위",
      },

      // ======================================================================
      // Phase 2: 1차 쾅! 조이기 강타 (SNAP!) (Step 2 - 3프레임)
      // ======================================================================
      // 3. 껍질 초고속 닫힘 돌진
      {
        ...baseFrame,
        delay: 60,
        ...cOff(0, 0),
        ...targetOff(0, 0, 0.95, 1.05),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.30,
        phaseId: "clamp-snap-closing",
        phaseName: "3. 껍질 초고속 닫힘",
      },
      // 4. 쾅! 완벽 맞물림 직격 & 피격자 스쿼시 (가로 찌그러짐) & 충격파 분출
      {
        ...baseFrame,
        delay: 130,
        ...cOff(0, 0),
        ...targetOff(0, 0, 0.80, 1.20), // 껍질에 조여져 가로로 강하게 압축
        showEffect: true,
        hitFlash: Boolean(isHit),
        moveStep: 2,
        effectProgress: 0.85,
        phaseId: "clamp-snap-impact",
        phaseName: "4. 껍질 쾅! 1차 조이기 직격",
      },
      // 5. 꽉 물린 상태 유지 및 진동 & 잔여 비산 수적
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        ...targetOff(1, 0, 0.84, 1.16),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 1.00,
        phaseId: "clamp-snap-sustain",
        phaseName: "5. 1차 조이기 유지",
      },

      // ======================================================================
      // Phase 3: 2단 연속 압박 조이기 (SQUEEZE GRIND) (Step 3 - 4프레임)
      // ======================================================================
      // 6. 1차 추가 압박 조이기 펄스
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...targetOff(-1, 0, 0.78, 1.22),
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.25,
        phaseId: "clamp-squeeze-1",
        phaseName: "6. 연속 압박 1차 조이기",
      },
      // 7. 틈새 아쿠아 수포 분출 & 흔들림
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...targetOff(1, 0, 0.82, 1.18),
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.50,
        phaseId: "clamp-squeeze-bubbles",
        phaseName: "7. 틈새 수포 분출",
      },
      // 8. 2차 초강력 짓누르기 펄스
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        ...targetOff(-1, 0, 0.76, 1.24),
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.75,
        phaseId: "clamp-squeeze-2",
        phaseName: "8. 연속 압박 2차 조이기",
      },
      // 9. 조이기 마무리 지속
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...targetOff(0, 0, 0.82, 1.18),
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 1.00,
        phaseId: "clamp-squeeze-end",
        phaseName: "9. 조이기 압박 마무리",
      },

      // ======================================================================
      // Phase 4: 껍질 개방 및 물방울 기화 소멸 (Step 4 - 3프레임)
      // ======================================================================
      // 10. 껍질 딸깍 개방 & 피격자 복원 시작
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...targetOff(0, 0, 0.92, 1.08),
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.35,
        phaseId: "clamp-release-open",
        phaseName: "10. 조개 껍질 개방",
      },
      // 11. 껍질 반투명 페이드아웃 & 반짝이는 물방울 비산
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...targetOff(0, 0, 0.98, 1.02),
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.75,
        phaseId: "clamp-release-fade",
        phaseName: "11. 껍질 물보라 기화",
      },
      // 12. 소멸 완료 & 배틀 복귀 안정화
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...targetOff(0, 0, 1.00, 1.00),
        showEffect: false,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 1.00,
        phaseId: "clamp-recover",
        phaseName: "12. 배틀 복귀 안정화",
      },
    ];
  },
};
