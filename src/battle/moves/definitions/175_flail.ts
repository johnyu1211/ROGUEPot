// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawFlailEffect } from "../../../renderers/moves/gen1/move173_176.js";

/**
 * 175: 바둥바둥 (Flail) - 노말 타입 물리 공격기
 *
 * 위력: -- (자신의 현재 남은 HP가 적을수록 최대 200까지 위력 상승) / 명중: 100 / PP: 15
 * 설명: 바둥바둥 몸을 휘둘러 공격한다. 자신의 HP가 적을수록 위력이 올라간다.
 *
 * [유저 요구사항 100% 반영 연출 시퀀스]:
 * 1. [바둥바둥은 발버둥 그대로 가져오되]:
 *    - 카메라 시전자 포커싱 상태에서 좌우 흔들흔들 각도 틸트 진동 (pRot / eRot)
 *    - Step 2 이후 상대방 서로 다른 3곳 위치에 순차적으로 몸통박치기 타격 이펙트 직격 (좌상단 -> 우하단 -> 중앙 피니시)
 * 2. [튀어오르기의 효과도 같이 적용]:
 *    - 발버둥 칠 때 지면 착지 납작(스쿼시)과 상공 도약 세로길쭉(스트레치) 바운스가 맞물려 팔딱팔딱 뜀
 *    - 착지 순간 지면에 미세 물방울 파티클 비산
 * 3. [추가로 땀방울 튀기기]:
 *    - 공중 도약 및 격렬한 바둥바둥 시 몸통/머리 주변에서 사방으로 솟구치는 땀방울 파티클 분출
 */
export const flailMove: BattleMoveAnimation = {
  num: 175,
  key: "flail",
  nameKo: "바둥바둥",
  nameEn: "Flail",
  type: "normal",
  category: "physical",
  camera: {
    type: "caster_to_target",
    zoom: 1.35,
    delayUntilStep: 2, // Step 1: 시전자 몸부림 포커싱, Step 2부터 상대방 포커싱
    inlineGlideInFrames: 2,
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawFlailEffect(targetCtx, frame, drawCtx);
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
      eOffset: !isP ? { x: -x, y } : { x: 0, y: 0 },
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
      // Step 1: 바둥바둥 + 튀어오르기(스쿼시/스트레치 도약) + 땀방울 튀기기
      // =======================================================================
      // 1. 시작 준비
      {
        ...baseFrame,
        delay: 50,
        ...cRot(0),
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...defOff(0, 0),
        showEffect: false,
        moveStep: 1,
        effectProgress: 0.05,
        phaseId: "flail-prep",
        phaseName: "1. 바둥바둥 시작 준비",
      },
      // 2. 1차 발버둥: 좌측 틸트 & 착지 납작(스쿼시) + 물방울 비산
      {
        ...baseFrame,
        delay: 65,
        ...cRot(-0.18),
        ...cOff(-2, 0),
        ...cScale(1.26, 0.76),
        ...defOff(0, 0),
        showEffect: true,
        splashProgress: 0.30,
        splashCycle: 1,
        moveStep: 1,
        effectProgress: 0.20,
        phaseId: "flail-squash-1",
        phaseName: "2. 1차 납작 착지 (물방울)",
      },
      // 3. 1차 도약: 우측 틸트 & 상공 세로길쭉 도약 + 땀방울 튀기기!
      {
        ...baseFrame,
        delay: 75,
        ...cRot(0.20),
        ...cOff(3, -12),
        ...cScale(0.80, 1.28),
        ...defOff(0, 0),
        showEffect: true,
        sweatProgress: 0.40,
        sweatAirOffsetY: -12,
        splashCycle: 1,
        moveStep: 1,
        effectProgress: 0.38,
        phaseId: "flail-jump-1",
        phaseName: "3. 1차 상공 도약 (땀방울 튀기기)",
      },
      // 4. 2차 발버둥: 좌측 격렬 틸트 & 착지 납작(스쿼시) + 물방울 비산
      {
        ...baseFrame,
        delay: 65,
        ...cRot(-0.25),
        ...cOff(-3, 0),
        ...cScale(1.32, 0.70),
        ...defOff(0, 0),
        showEffect: true,
        splashProgress: 0.60,
        splashCycle: 2,
        moveStep: 1,
        effectProgress: 0.55,
        phaseId: "flail-squash-2",
        phaseName: "4. 2차 격렬 납작 (물방울)",
      },
      // 5. 2차 도약: 우측 격렬 틸트 & 상공 최고점 도약 + 폭발적 땀방울 튀기기!
      {
        ...baseFrame,
        delay: 80,
        ...cRot(0.25),
        ...cOff(3, -18),
        ...cScale(0.72, 1.36),
        ...defOff(0, 0),
        showEffect: true,
        sweatProgress: 0.75,
        sweatAirOffsetY: -18,
        splashCycle: 2,
        moveStep: 1,
        effectProgress: 0.72,
        phaseId: "flail-jump-2",
        phaseName: "5. 2차 최고점 도약 (땀방울 폭발)",
      },
      // 6. 3차 착지: 좌측 틸트 & 탄성 안착 (스쿼시 리바운드)
      {
        ...baseFrame,
        delay: 65,
        ...cRot(-0.14),
        ...cOff(-1, 0),
        ...cScale(1.18, 0.84),
        ...defOff(0, 0),
        showEffect: true,
        sweatProgress: 0.95,
        sweatAirOffsetY: -4,
        splashProgress: 0.88,
        moveStep: 1,
        effectProgress: 0.88,
        phaseId: "flail-squash-3",
        phaseName: "6. 3차 착지 탄성 안착",
      },
      // 7. 발버둥 중심 복귀 및 타격 와인드업
      {
        ...baseFrame,
        delay: 60,
        ...cRot(0),
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...defOff(0, 0),
        showEffect: false,
        moveStep: 1,
        effectProgress: 1.0,
        phaseId: "flail-center",
        phaseName: "7. 타격 준비 중심 복귀",
      },

      // =======================================================================
      // Step 2: 1차 몸통박치기 타격 (좌상단: -20, -16) - 발버둥 그대로
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
        phaseId: "flail-hit1-impact",
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
        phaseId: "flail-hit1-burst",
        phaseName: "9. 1차 충격파 확산",
      },

      // =======================================================================
      // Step 3: 2차 몸통박치기 타격 (우하단: +22, +14) - 발버둥 그대로
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
        phaseId: "flail-hit2-impact",
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
        phaseId: "flail-hit2-burst",
        phaseName: "11. 2차 충격파 확산",
      },

      // =======================================================================
      // Step 4: 3차 몸통박치기 피니시 타격 (중앙: -2, -6) & 피격자 피해 적용
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
        phaseId: "flail-hit3-impact",
        phaseName: "12. 3차 몸통박치기 피니시 직격 (중앙)",
      },
      // 13. 3차 충격파 대폭발 & 타겟 피해 반영
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
        playerHp: playerHp,
        moveStep: 4,
        hitIndex: 3,
        effectProgress: 0.65,
        phaseId: "flail-hit3-burst",
        phaseName: "13. 3차 충격파 폭발 & 피해 적용",
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
        playerHp: playerHp,
        moveStep: 5,
        hitIndex: 3,
        effectProgress: 0.95,
        phaseId: "flail-rebound",
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
        playerHp: playerHp,
        moveStep: 6,
        effectProgress: 1.0,
        phaseId: "flail-finish",
        phaseName: "15. 정위치 원복",
      },
    ];
  },
};
