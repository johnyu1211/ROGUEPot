// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawSandstormBehindEffect,
  drawSandstormEffect,
} from "../../../renderers/moves/gen1/move201_204.js";

/**
 * 201: 모래바람 (Sandstorm) - 바위 타입 변화 기술 (5턴 날씨 변화)
 *
 * 연출 구성 (5세대 BW 풍 날씨 연출 + ROGUEPot 2.5D 입체 필드 폭풍):
 * 1. [기 모으기 & 발구르기]: 시전자가 몸을 웅크리며 발밑에서 모래먼지 솟구침 (1단계)
 * 2. [모래 소용돌이 기둥 폭발]: 시전자가 도약/포효하며 나선형 샌드 볼텍스 기둥 분출 (2단계)
 * 3. [모래폭풍 전장 쇄도]: 전장 전체로 거센 사선 모래바람 제트 스트림 & 흙먼지 연무 급습 (3단계)
 * 4. [모래폭풍 절정]: 전신을 휩쓰는 고속 모래알갱이, 회전 암석 파편 폭격, 황토빛 대기 (4단계)
 * 5. [필드 안착 & 안정화]: 지속적인 모래바람 날씨 효과로 정착되며 시전자 복귀 (5단계)
 */
export const sandstormMove: BattleMoveAnimation = {
  num: 201,
  key: "sandstorm",
  nameKo: "모래바람",
  nameEn: "Sandstorm",
  type: "rock",
  category: "status",
  camera: {
    type: "none",
    zoom: 1.0,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showBehindEffect && !frame.showEffect) return;
    drawSandstormBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawSandstormEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.0,
      pRot: 0,
      eRot: 0,
      hitFlash: false,
    };

    // 시전자 전용 오프셋 헬퍼 (수비자는 절대 {0,0} 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 상대방 리액션 오프셋 헬퍼 (시전자는 {0,0} 고정)
    const targetReact = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    return [
      // ======================================================================
      // 1. [기 모으기 & 발구르기] (1단계)
      // ======================================================================
      {
        ...baseFrame,
        delay: 85,
        ...cOff(-3, 2),
        pScale: isP ? { x: 1.06, y: 0.94 } : undefined,
        eScale: !isP ? { x: 1.06, y: 0.94 } : undefined,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 1,
        effectProgress: 0.35,
        phaseId: "sandstorm-gather-1",
        phaseName: "1. 시전자 기 모으기 & 웅크림",
      },
      {
        ...baseFrame,
        delay: 95,
        ...cOff(-5, 4),
        pScale: isP ? { x: 1.10, y: 0.90 } : undefined,
        eScale: !isP ? { x: 1.10, y: 0.90 } : undefined,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 1,
        effectProgress: 0.85,
        phaseId: "sandstorm-gather-2",
        phaseName: "2. 발구르기 및 모래먼지 솟구침",
      },

      // ======================================================================
      // 2. [모래 소용돌이 기둥 분출] (2단계)
      // ======================================================================
      {
        ...baseFrame,
        delay: 85,
        ...cOff(8, -5),
        pScale: isP ? { x: 0.94, y: 1.08 } : undefined,
        eScale: !isP ? { x: 0.94, y: 1.08 } : undefined,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 2,
        effectProgress: 0.25,
        phaseId: "sandstorm-vortex-1",
        phaseName: "3. 도약 포효 및 소용돌이 시동",
      },
      {
        ...baseFrame,
        delay: 95,
        ...cOff(12, -7),
        pScale: isP ? { x: 0.92, y: 1.10 } : undefined,
        eScale: !isP ? { x: 0.92, y: 1.10 } : undefined,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 2,
        effectProgress: 0.65,
        phaseId: "sandstorm-vortex-2",
        phaseName: "4. 나선형 소용돌이 기둥 폭발 & 암석 솟구침",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(6, -3),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 2,
        effectProgress: 0.95,
        phaseId: "sandstorm-vortex-3",
        phaseName: "5. 소용돌이 확산 및 전장 전개",
      },

      // ======================================================================
      // 3. [모래폭풍 전장 쇄도] (3단계)
      // ======================================================================
      {
        ...baseFrame,
        delay: 80,
        ...cOff(2, 0),
        ...targetReact(-3, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 3,
        effectProgress: 0.30,
        phaseId: "sandstorm-gale-1",
        phaseName: "6. 전장 사선 모래바람 제트 스트림 돌입",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...targetReact(-5, -1),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 3,
        effectProgress: 0.65,
        phaseId: "sandstorm-gale-2",
        phaseName: "7. 흙먼지 연무 급습 & 수비자 리액션",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...targetReact(-3, 1),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 3,
        effectProgress: 0.95,
        phaseId: "sandstorm-gale-3",
        phaseName: "8. 전장 모래먼지 장악",
      },

      // ======================================================================
      // 4. [모래폭풍 절정 - 전장 폭풍우] (4단계)
      // ======================================================================
      {
        ...baseFrame,
        delay: 85,
        ...cOff(-1, 0),
        ...targetReact(-6, -1),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 4,
        effectProgress: 0.25,
        phaseId: "sandstorm-tempest-1",
        phaseName: "9. 격렬한 모래폭풍 절정 1 & 암석 파편 폭격",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(1, 0),
        ...targetReact(-4, 2),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 4,
        effectProgress: 0.55,
        phaseId: "sandstorm-tempest-2",
        phaseName: "10. 암석 파편 회전 관통 & 고속 모래알 비산",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...targetReact(-5, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 4,
        effectProgress: 0.85,
        phaseId: "sandstorm-tempest-3",
        phaseName: "11. 황토빛 사막 대기 틴트 & 거친 돌풍",
      },

      // ======================================================================
      // 5. [필드 안착 & 잔향 소산] (5단계)
      // ======================================================================
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...targetReact(-2, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 5,
        effectProgress: 0.30,
        phaseId: "sandstorm-settle-1",
        phaseName: "12. 폭풍 안정화 및 날씨 필드 안착",
      },
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        ...targetReact(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 5,
        effectProgress: 0.70,
        phaseId: "sandstorm-settle-2",
        phaseName: "13. 지속 모래바람 기류 유지 & 시전자 복귀",
      },
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        ...targetReact(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 5,
        effectProgress: 1.0,
        phaseId: "sandstorm-settle-3",
        phaseName: "14. 피날레 및 날씨 효과 적용 완료",
      },
    ];
  },
};
