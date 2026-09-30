// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawStruggleEffect } from "../../../renderers/moves/gen1/move165_168.js";

/**
 * 165: 발버둥 (Struggle) - 노말 타입 물리 공격기 (PP 소진 시 자동 발동, 1/4 반동 피해)
 *
 * 위력: 50 / 명중: -- / PP: 1
 * 설명: 자신의 PP가 떨어지면 발버둥 쳐 상대를 공격한다. 자신도 조금 데미지를 입는다.
 *
 * [유저 요구사항 100% 반영 연출 시퀀스]:
 * 1. [시전 포켓몬 각도 좌우로 흔들흔들]:
 *    - 카메라 시전자 포커싱 상태에서 시전 포켓몬의 회전 각도(pRot / eRot)가 좌우로 격렬하게 진동
 *    - 미세 도약 점프 및 탄성 스쿼시/스트레치가 맞물려 필사적으로 몸부림치는 '발버둥' 본연의 역동감 표현
 * 2. [카메라 타겟 글라이드]:
 *    - 시전자 몸부림 직후 카메라가 상대방으로 매끄럽게 글라이드 이동
 * 3. [서로 다른 3곳 위치에 몸통박치기 타격 이펙트 3번]:
 *    - 1타: 좌상단 (-20, -16) 몸통박치기 충돌 스타버스트 & 링 확산 (피격자 우하단 넉백)
 *    - 2타: 우하단 (+22, +14) 몸통박치기 충돌 스타버스트 & 링 확산 (피격자 좌상단 넉백, 1타 충격파 오버랩)
 *    - 3타: 중앙 피니시 (-2, -6) 최대 충격파 폭발 & 스타버스트 작렬 (피격자 최대 넉백 & 반동 피해 체력 감소 동시 반영)
 * 4. [잔향 소산 & 피격자/시전자 복귀]:
 *    - 충격파 링 소멸 및 피격자/시전자 정위치 안착
 */
export const struggleMove: BattleMoveAnimation = {
  num: 165,
  key: "struggle",
  nameKo: "발버둥",
  nameEn: "Struggle",
  type: "normal",
  category: "physical",
  camera: {
    type: "caster_to_target",
    zoom: 1.35,
    delayUntilStep: 2, // Step 1: 시전자 각도 좌우 흔들흔들 (시전자 포커싱), Step 2부터 상대방 포커싱
    inlineGlideInFrames: 2,
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawStruggleEffect(targetCtx, frame, drawCtx);
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
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 시전자 스케일
    const cScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    // 시전자 회전 각도 (라디안)
    const cRot = (rot: number) => ({
      pRot: isP ? rot : 0,
      eRot: !isP ? rot : 0,
    });

    // 피격자(수비자) 오프셋
    const defOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    return [
      // =======================================================================
      // Step 1: 시전 포켓몬 각도 좌우로 흔들흔들 (Struggle Wobble Phase)
      // - 각도 회전(pRot/eRot) + 미세 바운스를 결합하여 격렬한 발버둥 모션 연출
      // =======================================================================
      // 1. 발버둥 시작: 좌측 틸트 1 (-10.3도)
      {
        ...baseFrame,
        delay: 85,
        ...cRot(-0.18),
        ...cOff(-3, -2),
        ...cScale(0.96, 1.04),
        ...defOff(0, 0),
        showEffect: false,
        moveStep: 1,
        effectProgress: 0.15,
        phaseId: "struggle-wobble-1",
        phaseName: "1. 발버둥 좌측 틸트 1",
      },
      // 2. 우측 틸트 1 (+11.5도)
      {
        ...baseFrame,
        delay: 85,
        ...cRot(0.20),
        ...cOff(3, 1),
        ...cScale(1.05, 0.95),
        ...defOff(0, 0),
        showEffect: false,
        moveStep: 1,
        effectProgress: 0.30,
        phaseId: "struggle-wobble-2",
        phaseName: "2. 발버둥 우측 틸트 1",
      },
      // 3. 좌측 틸트 2 (격렬: -14.3도)
      {
        ...baseFrame,
        delay: 85,
        ...cRot(-0.25),
        ...cOff(-4, -3),
        ...cScale(0.95, 1.05),
        ...defOff(0, 0),
        showEffect: false,
        moveStep: 1,
        effectProgress: 0.50,
        phaseId: "struggle-wobble-3",
        phaseName: "3. 발버둥 좌측 틸트 2 (격렬)",
      },
      // 4. 우측 틸트 2 (격렬: +14.3도)
      {
        ...baseFrame,
        delay: 85,
        ...cRot(0.25),
        ...cOff(4, 2),
        ...cScale(1.06, 0.94),
        ...defOff(0, 0),
        showEffect: false,
        moveStep: 1,
        effectProgress: 0.70,
        phaseId: "struggle-wobble-4",
        phaseName: "4. 발버둥 우측 틸트 2 (격렬)",
      },
      // 5. 좌측 틸트 3 (-9.2도)
      {
        ...baseFrame,
        delay: 80,
        ...cRot(-0.16),
        ...cOff(-2, -1),
        ...cScale(0.98, 1.02),
        ...defOff(0, 0),
        showEffect: false,
        moveStep: 1,
        effectProgress: 0.85,
        phaseId: "struggle-wobble-5",
        phaseName: "5. 발버둥 좌측 틸트 3",
      },
      // 6. 우측 틸트 3 (+9.2도)
      {
        ...baseFrame,
        delay: 80,
        ...cRot(0.16),
        ...cOff(2, 1),
        ...cScale(1.02, 0.98),
        ...defOff(0, 0),
        showEffect: false,
        moveStep: 1,
        effectProgress: 0.95,
        phaseId: "struggle-wobble-6",
        phaseName: "6. 발버둥 우측 틸트 3",
      },
      // 7. 발버둥 중심 복귀 및 타격 준비
      {
        ...baseFrame,
        delay: 65,
        ...cRot(0),
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...defOff(0, 0),
        showEffect: false,
        moveStep: 1,
        effectProgress: 1.0,
        phaseId: "struggle-wobble-center",
        phaseName: "7. 발버둥 중심 복귀",
      },

      // =======================================================================
      // Step 2: 1차 몸통박치기 타격 (좌상단: -20, -16)
      // =======================================================================
      // 8. 1차 타격 직격 & 스타버스트 섬광
      {
        ...baseFrame,
        delay: 70,
        ...cRot(0),
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...defOff(isHit ? 8 : 0, isHit ? -4 : 0),
        showEffect: true,
        hitFlash: isHit,
        moveStep: 2,
        hitIndex: 1,
        effectProgress: 0.20,
        phaseId: "struggle-hit1-impact",
        phaseName: "8. 1차 몸통박치기 직격 (좌상단)",
      },
      // 9. 1차 충격파 링 확산 & 별빛 스파크 비산
      {
        ...baseFrame,
        delay: 75,
        ...cRot(0),
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...defOff(isHit ? 4 : 0, isHit ? -2 : 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        hitIndex: 1,
        effectProgress: 0.70,
        phaseId: "struggle-hit1-burst",
        phaseName: "9. 1차 충격파 확산",
      },

      // =======================================================================
      // Step 3: 2차 몸통박치기 타격 (우하단: +22, +14)
      // =======================================================================
      // 10. 2차 타격 직격 & 스타버스트 섬광 (1타 잔향 오버랩)
      {
        ...baseFrame,
        delay: 70,
        ...cRot(0),
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...defOff(isHit ? -8 : 0, isHit ? 4 : 0),
        showEffect: true,
        hitFlash: isHit,
        moveStep: 3,
        hitIndex: 2,
        effectProgress: 0.20,
        phaseId: "struggle-hit2-impact",
        phaseName: "10. 2차 몸통박치기 직격 (우하단)",
      },
      // 11. 2차 충격파 링 확산 & 별빛 스파크 비산
      {
        ...baseFrame,
        delay: 75,
        ...cRot(0),
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...defOff(isHit ? -4 : 0, isHit ? 2 : 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        hitIndex: 2,
        effectProgress: 0.70,
        phaseId: "struggle-hit2-burst",
        phaseName: "11. 2차 충격파 확산",
      },

      // =======================================================================
      // Step 4: 3차 몸통박치기 피니시 타격 (중앙: -2, -6) & 반동 피해 반영
      // =======================================================================
      // 12. 3차 피니시 직격 & 대형 스타버스트 섬광 (2타 잔향 오버랩)
      {
        ...baseFrame,
        delay: 75,
        ...cRot(0),
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...defOff(isHit ? 14 : 0, isHit ? -6 : 0),
        showEffect: true,
        hitFlash: isHit,
        moveStep: 4,
        hitIndex: 3,
        effectProgress: 0.25,
        phaseId: "struggle-hit3-impact",
        phaseName: "12. 3차 몸통박치기 피니시 직격 (중앙)",
      },
      // 13. 3차 충격파 대폭발 & 타겟 피해 및 시전자 반동 피해 동시 적용
      {
        ...baseFrame,
        delay: 85,
        ...cRot(0),
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...defOff(isHit ? 18 : 0, isHit ? -8 : 0),
        showEffect: true,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 4,
        hitIndex: 3,
        effectProgress: 0.65,
        phaseId: "struggle-hit3-burst",
        phaseName: "13. 3차 충격파 폭발 & 반동 피해",
      },

      // =======================================================================
      // Step 5: 잔향 소산 & 피격자 탄성 반동
      // =======================================================================
      // 14. 3타 충격파 링 소멸 페이드아웃 및 피격자 탄성 반동
      {
        ...baseFrame,
        delay: 90,
        ...cRot(0),
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...defOff(isHit ? 6 : 0, isHit ? -2 : 0),
        showEffect: true,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 5,
        hitIndex: 3,
        effectProgress: 0.95,
        phaseId: "struggle-rebound",
        phaseName: "14. 충격 잔향 & 타겟 복귀",
      },

      // =======================================================================
      // Step 6: 정위치 원복 및 안정화
      // =======================================================================
      // 15. 정위치 원복 완료
      {
        ...baseFrame,
        delay: 80,
        ...cRot(0),
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...defOff(0, 0),
        showEffect: false,
        hitFlash: false,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 6,
        effectProgress: 1.0,
        phaseId: "struggle-finish",
        phaseName: "15. 정위치 원복",
      },
    ];
  },
};
