// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawDreamEaterEffect } from "../../../renderers/moves/gen1/move137_140.js";

/**
 * 138: 꿈먹기 (Dream Eater) - 에스퍼 타입 특수 공격기 (위력 100, 피해의 50% HP 흡수 회복)
 *
 * 연출 시퀀스:
 * 1. 몽환적 딥 인디고 전장 암전 진입
 * 2. 잠들어 있는 대상 몸체에서 유백색-연보라빛 꿈의 영혼 구체(Dream Spirit Orbs) 추출
 * 3. 꿈의 정기가 우아한 S자 나선 궤적으로 날아가며 시전자 몸체로 흡수 (대상 악몽 왜곡 타격)
 * 4. 시전자 전신에 꿈 에너지가 스며들며 찬란한 에메랄드 치유 광채 & HP 흡수 회복
 * 5. 치유 십자별 상승 & 몽환 암전 페이드아웃 복귀
 */
export const dreamEaterMove: BattleMoveAnimation = {
  num: 138,
  key: "dream-eater",
  nameKo: "꿈먹기",
  nameEn: "Dream Eater",
  type: "psychic",
  category: "special",
  camera: { type: "custom" },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (frame.showEffect) {
      drawDreamEaterEffect(targetCtx, frame, drawCtx);
    }
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

    // 시전자 오프셋
    const cOff = (x: number, y: number) =>
      isP ? { pOffset: { x, y } } : { eOffset: { x: -x, y: -y } };

    // 피격자 오프셋
    const tOff = (x: number, y: number) =>
      isP
        ? (isHit ? { eOffset: { x, y } } : { eOffset: { x: 0, y: 0 } })
        : (isHit ? { pOffset: { x: -x, y: -y } } : { pOffset: { x: 0, y: 0 } });

    // 포커싱 좌표 계산
    const neutralCenter = { x: 280, y: 190 };
    const targetFocal = isP ? { x: 346, y: 154 } : { x: 150, y: 244 };
    const attackerFocal = isP ? { x: 150, y: 244 } : { x: 346, y: 154 };

    return [
      // ------------------------------------------------------------------------
      // 1. 카메라 타깃 포커싱 진입 (Glide-In to Target)
      // ------------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 50,
        ...cOff(0, 0),
        ...tOff(0, 0),
        showEffect: true,
        moveStep: 1,
        drainProgress: 0.04,
        healProgress: 0,
        cameraZoom: 1.10,
        cameraFocal: {
          x: Math.round(neutralCenter.x + (targetFocal.x - neutralCenter.x) * 0.40),
          y: Math.round(neutralCenter.y + (targetFocal.y - neutralCenter.y) * 0.40),
        },
        _gen5Camera: true,
        phaseId: "camera-target-glide-1",
        phaseName: "1. 타깃 줌인 진입 (1/2)",
      },
      {
        ...baseFrame,
        delay: 50,
        ...cOff(0, 0),
        ...tOff(0, 0),
        showEffect: true,
        moveStep: 1,
        drainProgress: 0.08,
        healProgress: 0,
        cameraZoom: 1.25,
        cameraFocal: targetFocal,
        _gen5Camera: true,
        phaseId: "camera-target-glide-2",
        phaseName: "1. 타깃 줌인 안착 (2/2)",
      },

      // ------------------------------------------------------------------------
      // 2. 대상에서 꿈의 정기 추출 및 집결 (타깃 포커싱 유지)
      // ------------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 85,
        ...cOff(-2, 1),
        ...tOff(0, 3),
        showEffect: true,
        moveStep: 1,
        drainProgress: 0.14,
        healProgress: 0,
        cameraZoom: 1.25,
        cameraFocal: targetFocal,
        _gen5Camera: true,
        phaseId: "dream-intro",
        phaseName: "2. 몽환적 암전 진입 & 꿈 추출 태동",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(-3, 2),
        ...tOff(0, 4),
        showEffect: true,
        moveStep: 2,
        drainProgress: 0.26,
        healProgress: 0,
        cameraZoom: 1.25,
        cameraFocal: targetFocal,
        _gen5Camera: true,
        phaseId: "dream-extract-gather",
        phaseName: "3. 대상 몸체에서 꿈의 정기 추출",
      },

      // ------------------------------------------------------------------------
      // 3. 대상 악몽 타격 및 1차 궤도 사출 (피격 플래시 & 넉백)
      // ------------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 95,
        ...cOff(-2, 0),
        ...tOff(8, -4),
        showEffect: true,
        hitFlash: isHit,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpBefore ?? playerHp) : playerHp,
        moveStep: 3,
        drainProgress: 0.40,
        healProgress: 0,
        cameraZoom: 1.25,
        cameraFocal: targetFocal,
        _gen5Camera: true,
        phaseId: "dream-hit-launch",
        phaseName: "4. 대상 악몽 타격 & 1차 궤도 사출",
      },

      // ------------------------------------------------------------------------
      // 4. 메가드레인 방식 곡선 아크 비행 (프레임 수 확장: 5단계 넉넉한 전개)
      // ------------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 90,
        ...cOff(-1, 0),
        ...tOff(4, -2),
        showEffect: true,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpBefore ?? playerHp) : playerHp,
        moveStep: 3,
        drainProgress: 0.55,
        healProgress: 0,
        cameraZoom: 1.25,
        cameraFocal: targetFocal,
        _gen5Camera: true,
        phaseId: "dream-arc-flight-1",
        phaseName: "5. 8개 꿈 모트 광폭 곡선 아크 비행 (1)",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...tOff(2, -1),
        showEffect: true,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpBefore ?? playerHp) : playerHp,
        moveStep: 3,
        drainProgress: 0.70,
        healProgress: 0,
        cameraZoom: 1.25,
        cameraFocal: targetFocal,
        _gen5Camera: true,
        phaseId: "dream-arc-flight-2",
        phaseName: "6. 8개 꿈 모트 전장 중앙 쇄도 (2)",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...tOff(1, 0),
        showEffect: true,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpBefore ?? playerHp) : playerHp,
        moveStep: 4,
        drainProgress: 0.84,
        healProgress: 0,
        cameraZoom: 1.25,
        cameraFocal: targetFocal,
        _gen5Camera: true,
        phaseId: "dream-approach",
        phaseName: "7. 시전자 전방 접근",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(-1, 0),
        ...tOff(0, 0),
        showEffect: true,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpBefore ?? playerHp) : playerHp,
        moveStep: 4,
        drainProgress: 0.94,
        healProgress: 0,
        cameraZoom: 1.25,
        cameraFocal: targetFocal,
        _gen5Camera: true,
        phaseId: "dream-arrival",
        phaseName: "8. 시전자 면전 도달",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(-2, 0),
        ...tOff(0, 0),
        showEffect: true,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpBefore ?? playerHp) : playerHp,
        moveStep: 4,
        drainProgress: 1.00,
        healProgress: 0,
        cameraZoom: 1.25,
        cameraFocal: targetFocal,
        _gen5Camera: true,
        phaseId: "dream-absorbed",
        phaseName: "9. 시전자 체내 완전 흡수 완료",
      },

      // ------------------------------------------------------------------------
      // 5. 시전포켓몬 포커싱 전환 & 안착 (Camera Glide to Caster)
      // ------------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 50,
        ...cOff(0, 0),
        ...tOff(0, 0),
        showEffect: true,
        drainProgress: 0,
        healProgress: 0,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpBefore ?? playerHp) : playerHp,
        cameraZoom: 1.25,
        cameraFocal: {
          x: Math.round(targetFocal.x + (attackerFocal.x - targetFocal.x) * 0.50),
          y: Math.round(targetFocal.y + (attackerFocal.y - targetFocal.y) * 0.50),
        },
        _gen5Camera: true,
        phaseId: "camera-to-caster-1",
        phaseName: "10. 시전자 포커싱 전환 (글라이드 1/2)",
      },
      {
        ...baseFrame,
        delay: 50,
        ...cOff(0, 0),
        ...tOff(0, 0),
        showEffect: true,
        drainProgress: 0,
        healProgress: 0,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpBefore ?? playerHp) : playerHp,
        cameraZoom: 1.25,
        cameraFocal: attackerFocal,
        _gen5Camera: true,
        phaseId: "camera-to-caster-2",
        phaseName: "10. 시전자 포커싱 완료 안착 (2/2)",
      },
      // [요청 사항 반영]: 카메라 포커싱 완료 후 정확히 1프레임 뒤에 회복 시작!
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...tOff(0, 0),
        showEffect: true,
        drainProgress: 0,
        healProgress: 0,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpBefore ?? playerHp) : playerHp,
        cameraZoom: 1.25,
        cameraFocal: attackerFocal,
        _gen5Camera: true,
        phaseId: "camera-to-caster-settle",
        phaseName: "10. 시전자 포커싱 완료 후 호흡 (1프레임 대기)",
      },

      // ------------------------------------------------------------------------
      // 6. 시전포켓몬 포커싱 하에서 보랏빛 나선 회복별 진행 (HP회복 고증)
      // ------------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, -2), // 치유 기쁨 도약
        ...tOff(0, 0),
        showEffect: true,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpAfter ?? playerHp) : playerHp, // HP 회복 반영!
        moveStep: 5,
        drainProgress: 0,
        healProgress: 0.18,
        cameraZoom: 1.25,
        cameraFocal: attackerFocal,
        _gen5Camera: true,
        phaseId: "dream-recover-star-1",
        phaseName: "11. HP회복 1번 회복별 발밑 출현 & 시계방향 상승",
      },
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, -3),
        ...tOff(0, 0),
        showEffect: true,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpAfter ?? playerHp) : playerHp,
        moveStep: 5,
        drainProgress: 0,
        healProgress: 0.48,
        cameraZoom: 1.25,
        cameraFocal: attackerFocal,
        _gen5Camera: true,
        phaseId: "dream-recover-star-2",
        phaseName: "12. HP회복 2~3번 회복별 나선 비상",
      },
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, -2),
        ...tOff(0, 0),
        showEffect: true,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpAfter ?? playerHp) : playerHp,
        moveStep: 5,
        drainProgress: 0,
        healProgress: 0.76,
        cameraZoom: 1.25,
        cameraFocal: attackerFocal,
        _gen5Camera: true,
        phaseId: "dream-recover-star-3",
        phaseName: "13. HP회복 4번 회복별 상공 승화",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, -1),
        ...tOff(0, 0),
        showEffect: true,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpAfter ?? playerHp) : playerHp,
        moveStep: 5,
        drainProgress: 0,
        healProgress: 0.92,
        cameraZoom: 1.25,
        cameraFocal: attackerFocal,
        _gen5Camera: true,
        phaseId: "dream-recover-star-4",
        phaseName: "14. HP회복 4번 회복별 승화 & 체표면 잔여 치유",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...tOff(0, 0),
        showEffect: true,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpAfter ?? playerHp) : playerHp,
        moveStep: 6,
        drainProgress: 0,
        healProgress: 1.0,
        cameraZoom: 1.25,
        cameraFocal: attackerFocal,
        _gen5Camera: true,
        phaseId: "dream-recover-fade",
        phaseName: "15. 치유 잔향 & 암전 페이드아웃",
      },

      // ------------------------------------------------------------------------
      // 7. 카메라 원상태 복귀 (Camera Return to Neutral Arena)
      // ------------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 50,
        ...cOff(0, 0),
        ...tOff(0, 0),
        showEffect: false,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpAfter ?? playerHp) : playerHp,
        cameraZoom: 1.15,
        cameraFocal: {
          x: Math.round(neutralCenter.x + (attackerFocal.x - neutralCenter.x) * 0.50),
          y: Math.round(neutralCenter.y + (attackerFocal.y - neutralCenter.y) * 0.50),
        },
        _gen5Camera: true,
        phaseId: "camera-return-1",
        phaseName: "16. 카메라 복귀 (1/3)",
      },
      {
        ...baseFrame,
        delay: 50,
        ...cOff(0, 0),
        ...tOff(0, 0),
        showEffect: false,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpAfter ?? playerHp) : playerHp,
        cameraZoom: 1.06,
        cameraFocal: {
          x: Math.round(neutralCenter.x + (attackerFocal.x - neutralCenter.x) * 0.20),
          y: Math.round(neutralCenter.y + (attackerFocal.y - neutralCenter.y) * 0.20),
        },
        _gen5Camera: true,
        phaseId: "camera-return-2",
        phaseName: "16. 카메라 복귀 (2/3)",
      },
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...tOff(0, 0),
        showEffect: false,
        afterCameraReturn: true,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpAfter ?? playerHp) : playerHp,
        cameraZoom: 1.0,
        cameraFocal: null,
        _gen5Camera: false,
        phaseId: "dream-finish",
        phaseName: "17. 카메라 복귀 및 정위치 안착",
      },
    ];
  },
};
