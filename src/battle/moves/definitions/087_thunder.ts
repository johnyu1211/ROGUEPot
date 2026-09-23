// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawThunderEffect, drawThunderBehindEffect } from "../../../renderers/moves/gen1/move085_088.js";

/**
 * 087: 번개 (Thunder) - 전기 타입 최고위력 특수기 (30% 확률 마비)
 *
 * 연출:
 * - 하늘에 짙은 먹구름 뇌운 집결 & 대기 경고 섬광
 * - 하늘 최상단에서 수직 강하하는 초대형 거대 벼락 기둥 (Trunk Bolt & 분기 낙뢰)
 * - 지면 대격돌 1프레임 순백 히트 플래시 & 지면 타원 충격파 링 2중 전개
 * - 지면에서 솟구치는 역류 뇌격 방전 & 대지 관통
 * - 16방향 초특대 뇌격 스타버스트 & 뇌격 파편 비산
 * - 지면 그을림 잔류 스파크 & 뇌운 소멸 및 복귀
 */
export const thunderMove: BattleMoveAnimation = {
  num: 87,
  key: "thunder",
  nameKo: "번개",
  nameEn: "Thunder",
  type: "electric",
  category: "special",
  camera: { type: "sky_pan_down", zoom: 1.36 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawThunderBehindEffect(targetCtx, targetPos, step, prog, frame);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawThunderEffect(targetCtx, attackerPos, targetPos, step, prog, frame);
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

    // [절대 규칙 준수] 시전자 전용 오프셋 (수비자는 절대 {0,0} 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // [절대 규칙 준수] 피격자 전용 오프셋 (시전자는 절대 {0,0} 고정)
    const cTargetOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x, y } : { x: 0, y: 0 },
    });

    return [
      // ----------------------------------------------------------------------
      // Phase 0: [피드백 반영] 필드에서 시작하여 상공으로 카메라 틸트업 & 암전 개시
      // ----------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 60,
        ...cOff(-1, 0),
        skyPanProgress: 1.0, // 필드 표적 중심 (필드에서 시작)
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.15,
        moveStep: 0,
        effectProgress: 0.0,
        phaseId: "thunder-field-start",
        phaseName: "#0-1. 필드 시점 & 암전 전조",
      },
      {
        ...baseFrame,
        delay: 60,
        ...cOff(-2, 1),
        skyPanProgress: 0.72, // 필드에서 위로 틸트업 시작
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.38,
        moveStep: 0,
        effectProgress: 0.28,
        phaseId: "thunder-tilt-up-1",
        phaseName: "#0-2. 상공을 향해 카메라 틸트업 (1)",
      },
      {
        ...baseFrame,
        delay: 55,
        ...cOff(-2, 1),
        skyPanProgress: 0.42, // 중간 상공
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.65,
        moveStep: 0,
        effectProgress: 0.58,
        phaseId: "thunder-tilt-up-2",
        phaseName: "#0-3. 상공을 향해 카메라 틸트업 (2)",
      },
      {
        ...baseFrame,
        delay: 50,
        ...cOff(-3, 2),
        skyPanProgress: 0.12, // 상공 도달 직전 (먹구름 시야 진입)
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.85,
        moveStep: 0,
        effectProgress: 0.88,
        phaseId: "thunder-tilt-up-3",
        phaseName: "#0-4. 상공 뇌운 진입",
      },

      // ----------------------------------------------------------------------
      // Phase 1: 카메라 상공 지향 & 최상단 백색 반투명 수증기 응축 구름 & 화면 암전
      // ----------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 70,
        ...cOff(-3, 2),
        pScale: isP ? { x: 1.05, y: 0.95 } : undefined,
        eScale: !isP ? { x: 1.05, y: 0.95 } : undefined,
        skyPanProgress: 0.0,
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.92,
        moveStep: 1,
        effectProgress: 0.20,
        phaseId: "thunder-sky-dimming",
        phaseName: "#1. 상공 지향 & 화면 암전 (하단 회색/상단 검은)",
      },
      {
        ...baseFrame,
        delay: 70,
        ...cOff(-2, 1),
        skyPanProgress: 0.0,
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.95,
        moveStep: 1,
        effectProgress: 0.45,
        phaseId: "thunder-vapor-condense-1",
        phaseName: "#2. 최상단 백색 반투명 수증기 응축",
      },
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 0),
        skyPanProgress: 0.0,
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.96,
        moveStep: 1,
        effectProgress: 0.70,
        phaseId: "thunder-vapor-condense-2",
        phaseName: "#3. 수증기 구름 속 전기 이온화",
      },
      {
        ...baseFrame,
        delay: 60,
        ...cOff(2, -1),
        skyPanProgress: 0.0,
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.96,
        moveStep: 1,
        effectProgress: 0.95,
        phaseId: "thunder-vapor-critical",
        phaseName: "#4. 뇌격 에너지 임계점 도달",
      },

      // ----------------------------------------------------------------------
      // Phase 2: 수증기 구름에서 강력한 전격 발생 및 하방 급강하 개시
      // ----------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 50,
        ...cOff(3, -1),
        skyPanProgress: 0.06,
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.95,
        moveStep: 2,
        effectProgress: 0.25,
        phaseId: "thunder-bolt-ignite",
        phaseName: "#5. 강력한 벼락 점화 & 선단 분출",
      },
      {
        ...baseFrame,
        delay: 50,
        ...cOff(1, 0),
        skyPanProgress: 0.14,
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.94,
        moveStep: 2,
        effectProgress: 0.55,
        phaseId: "thunder-bolt-plunge-1",
        phaseName: "#6. 대기 관통 벼락 급강하",
      },
      {
        ...baseFrame,
        delay: 50,
        ...cOff(0, 0),
        skyPanProgress: 0.25,
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.92,
        moveStep: 2,
        effectProgress: 0.85,
        phaseId: "thunder-bolt-plunge-2",
        phaseName: "#7. 하방 쇄도 뇌격 선단",
      },

      // ----------------------------------------------------------------------
      // Phase 3: 카메라 수직 하강 (적 포켓몬 머리 위 ➔ 아래로만 내리기만 함)
      // ----------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        skyPanProgress: 0.48,
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.90,
        moveStep: 3,
        effectProgress: 0.40,
        phaseId: "thunder-cam-drop-1",
        phaseName: "#8. 카메라 수직 급강하 (1)",
      },
      {
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        skyPanProgress: 0.72,
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.88,
        moveStep: 3,
        effectProgress: 0.65,
        phaseId: "thunder-cam-drop-2",
        phaseName: "#9. 카메라 수직 급강하 (2)",
      },
      {
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        skyPanProgress: 0.88,
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.85,
        moveStep: 3,
        effectProgress: 0.88,
        phaseId: "thunder-cam-drop-3",
        phaseName: "#10. 적 포켓몬 시야 포착",
      },
      {
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        skyPanProgress: 1.00,
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.85,
        moveStep: 3,
        effectProgress: 1.00,
        phaseId: "thunder-cam-arrive",
        phaseName: "#11. 적 머리 위 도달",
      },

      // ----------------------------------------------------------------------
      // Phase 4: 도착 직후 정수리 대격돌 직격! (순백 플래시 & 화면 강타)
      // ----------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, 0),
        skyPanProgress: 1.00,
        ...(isHit ? cTargetOff(-14, 8) : cTargetOff(0, 0)),
        cameraPan: isHit ? { x: 0, y: -16 } : undefined,
        showEffect: true,
        hitFlash: isHit,
        whiteoutAlpha: isHit ? 0.75 : 0,
        dimAlpha: 0.40,
        moveStep: 4,
        effectProgress: 0.40,
        phaseId: "thunder-impact-flash",
        phaseName: "#12. 도착 직후 정수리 직격 & 순백 플래시",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        skyPanProgress: 1.00,
        ...(isHit ? cTargetOff(12, -6) : cTargetOff(0, 0)),
        cameraPan: isHit ? { x: 0, y: 12 } : undefined,
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.60,
        moveStep: 4,
        effectProgress: 0.85,
        phaseId: "thunder-impact-slam",
        phaseName: "#13. 벼락 관통 & 지면 플라즈마 장판",
      },

      // ----------------------------------------------------------------------
      // Phase 5: 맹렬한 지속 뇌격 방전 & 대지 충격파 플라즈마 장판 확산
      // ----------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        skyPanProgress: 1.00,
        ...(isHit ? cTargetOff(-10, 4) : cTargetOff(0, 0)),
        cameraPan: isHit ? { x: 0, y: -8 } : undefined,
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.60,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 5,
        effectProgress: 0.30,
        phaseId: "thunder-discharge-1",
        phaseName: "#14. 24px 초대형 기둥 지속 방전",
      },
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        skyPanProgress: 1.00,
        ...(isHit ? cTargetOff(8, -3) : cTargetOff(0, 0)),
        cameraPan: isHit ? { x: 0, y: 6 } : undefined,
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.60,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 5,
        effectProgress: 0.60,
        phaseId: "thunder-discharge-2",
        phaseName: "#15. 대지 플라즈마 충격파 장판 확산",
      },
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        skyPanProgress: 1.00,
        ...(isHit ? cTargetOff(-4, 2) : cTargetOff(0, 0)),
        cameraPan: isHit ? { x: 0, y: -3 } : undefined,
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.55,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 5,
        effectProgress: 0.90,
        phaseId: "thunder-discharge-3",
        phaseName: "#16. 대지 전격 크랙 질주",
      },

      // ----------------------------------------------------------------------
      // Phase 6: 10방향 지그재그 분기 벼락 대폭발 & 고에너지 스파크 비산
      // ----------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        skyPanProgress: 1.00,
        ...(isHit ? cTargetOff(4, -1) : cTargetOff(0, 0)),
        cameraPan: isHit ? { x: 4, y: -3 } : undefined,
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.40,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 6,
        effectProgress: 0.30,
        phaseId: "thunder-burst-1",
        phaseName: "#17. 10방향 지그재그 분기 대폭발",
      },
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        skyPanProgress: 1.00,
        ...cTargetOff(0, 0),
        cameraPan: isHit ? { x: -3, y: 2 } : undefined,
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.35,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 6,
        effectProgress: 0.65,
        phaseId: "thunder-burst-2",
        phaseName: "#18. 고에너지 스파크 비산",
      },
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        skyPanProgress: 1.00,
        ...cTargetOff(0, 0),
        cameraPan: isHit ? { x: 1, y: -1 } : undefined,
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.30,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 6,
        effectProgress: 1.00,
        phaseId: "thunder-burst-3",
        phaseName: "#19. 분기 뇌격 전장 확산",
      },

      // ----------------------------------------------------------------------
      // Phase 7: 지면 그을림 크레이터 & 잔류 아크 페이드아웃
      // ----------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        skyPanProgress: 1.00,
        ...cTargetOff(0, 0),
        cameraPan: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.18,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 7,
        effectProgress: 0.40,
        phaseId: "thunder-scorch-1",
        phaseName: "#20. 지면 그을림 크레이터",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        skyPanProgress: 1.00,
        ...cTargetOff(0, 0),
        cameraPan: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        dimAlpha: 0.10,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 7,
        effectProgress: 0.85,
        phaseId: "thunder-scorch-2",
        phaseName: "#21. 잔류 스파크 페이드아웃",
      },

      // ----------------------------------------------------------------------
      // Phase 8: 피날레 & 카메라 글라이드 복귀
      // ----------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 50,
        ...cOff(0, 0),
        skyPanProgress: 1.00,
        ...cTargetOff(0, 0),
        cameraPan: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        dimAlpha: 0.0,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 8,
        effectProgress: 1.0,
        phaseId: "thunder-finish",
        phaseName: "#22. 뇌운 소멸 & 복귀",
      },
    ];
  },
};
