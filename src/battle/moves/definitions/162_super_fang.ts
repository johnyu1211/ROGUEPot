// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawSuperFangEffect } from "../../../renderers/moves/gen1/move161_164.js";

/**
 * 162: 분노의앞니 (Super Fang) - 노말 타입 물리 접촉기 (HP 50% 고정 절삭)
 *
 * [유저 요구사항 100% 반영 연출 시퀀스]:
 * 1. [시전 포켓몬 좌우 흔들림 & 붉게 변함]:
 *    - 시전 포켓몬이 분노로 가늘고 빠르게 좌우로 진동하면서 체온이 급상승해 붉게 발열
 * 2. [상대방 포커싱]:
 *    - 카메라가 시전자 클로즈업에서 상대방(피격자)으로 글라이드 이동하여 타겟을 조준 록온
 * 3. [필살앞니 기반 붉고 빠른 버전]:
 *    - "무는것만 빠르고": 앞니가 나타나자마자 번개처럼 빠른 속도(35ms -> 30ms)로 콱! 교합 쇄도
 *    - "이펙트는 그대로 단 색상은 빨갛게":
 *      * 5세대 필살앞니 1:1 고증 3D 유선형 앞니 2쌍 (크림슨 레드 & 화이트 림)
 *      * 붉은 스피드 트레일 잔상
 *      * 우상단 & 좌하단 붉은 만화풍 충격 폭발 구름 (Crimson Comic Impact Puff)
 *      * 사방으로 뿜어져 나가는 14방향 붉은 루비 알갱이 탄환 (Shrinking Red Pellets)
 *      * 타겟 주변을 감싸는 붉은 연막 구름 (Red Steam Haze)
 */
export const superFangMove: BattleMoveAnimation = {
  num: 162,
  key: "super-fang",
  nameKo: "분노의앞니",
  nameEn: "Super Fang",
  type: "normal",
  category: "physical",
  camera: {
    type: "caster_to_target",
    zoom: 1.35,
    delayUntilStep: 2, // Step 1: 시전자 좌우 흔들림 & 발열 (시전자 포커싱), Step 2: 상대방 포커싱
    inlineGlideInFrames: 3,
  },
  drawEffect: drawSuperFangEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    // 시전자 오프셋 & 스케일 헬퍼
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const cScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    // 피격자(수비자) 오프셋 & 스케일 헬퍼
    const defOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const defScale = (x: number, y: number) => ({
      pScale: !isP ? { x, y } : undefined,
      eScale: isP ? { x, y } : undefined,
    });

    // 시전자 붉은 발열 헬퍼
    const casterRed = (lvl: number) => ({
      casterRedTint: true,
      casterRedLevel: lvl,
      pRedLevel: isP ? lvl : undefined,
      eRedLevel: !isP ? lvl : undefined,
    });

    return [
      // =======================================================================
      // Step 1: 시전 포켓몬 좌우 흔들림 & 붉게 발열 (Rage Phase)
      // =======================================================================
      // 1. 분노 축적 & 미세 좌우 진동 시작 (체온 상승)
      {
        ...baseFrame,
        delay: 45,
        ...cOff(-4, 0),
        ...cScale(1.04, 0.96),
        ...casterRed(0.25),
        showEffect: false,
        moveStep: 1,
        effectProgress: 0.15,
        phaseId: "super-fang-rage-1",
        phaseName: "1. 분노 축적 & 미세 좌우 진동",
      },
      // 2. 좌우 진동 가속 & 발열 심화
      {
        ...baseFrame,
        delay: 45,
        ...cOff(4, 0),
        ...cScale(0.96, 1.04),
        ...casterRed(0.50),
        showEffect: false,
        moveStep: 1,
        effectProgress: 0.35,
        phaseId: "super-fang-rage-2",
        phaseName: "2. 좌우 진동 격화 & 체온 상승",
      },
      // 3. 붉은 분노 폭주 진동
      {
        ...baseFrame,
        delay: 45,
        ...cOff(-6, 0),
        ...cScale(1.06, 0.94),
        ...casterRed(0.75),
        showEffect: false,
        moveStep: 1,
        effectProgress: 0.60,
        phaseId: "super-fang-rage-3",
        phaseName: "3. 붉은 분노 폭주 진동",
      },
      // 4. 극대 분노 발열 (완전 붉은빛 발광)
      {
        ...baseFrame,
        delay: 45,
        ...cOff(6, 0),
        ...cScale(0.94, 1.06),
        ...casterRed(0.90),
        showEffect: false,
        moveStep: 1,
        effectProgress: 0.80,
        phaseId: "super-fang-rage-4",
        phaseName: "4. 극대 분노 발열",
      },
      // 5. 최고조 분노 발산
      {
        ...baseFrame,
        delay: 45,
        ...cOff(-5, 0),
        ...cScale(1.05, 0.95),
        ...casterRed(1.00),
        showEffect: false,
        moveStep: 1,
        effectProgress: 0.95,
        phaseId: "super-fang-rage-5",
        phaseName: "5. 최고조 분노 발산",
      },
      // 6. 타겟 조준 및 도약
      {
        ...baseFrame,
        delay: 45,
        ...cOff(5, 0),
        ...cScale(1.0, 1.0),
        ...casterRed(1.00),
        showEffect: false,
        moveStep: 1,
        effectProgress: 1.00,
        phaseId: "super-fang-rage-6",
        phaseName: "6. 타겟 조준 및 도약",
      },

      // =======================================================================
      // Step 2: 상대방 포커싱 (카메라 전환 글라이드)
      // =======================================================================
      // 7. 상대방 록온 포커싱
      {
        ...baseFrame,
        delay: 50,
        ...cOff(0, 0),
        ...casterRed(1.00),
        showEffect: false,
        moveStep: 2,
        effectProgress: 1.0,
        phaseId: "super-fang-target-lock",
        phaseName: "7. 상대방 록온 포커싱",
      },

      // =======================================================================
      // Step 3: 붉은 앞니 초고속 교합 ("무는것만 빠르고")
      // =======================================================================
      // 8. 붉은 앞니 초고속 출현 (35ms)
      {
        ...baseFrame,
        delay: 35,
        ...cOff(12, -4),
        ...casterRed(1.00),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.25,
        phaseId: "super-fang-spawn",
        phaseName: "8. 붉은 앞니 초고속 출현",
      },
      // 9. 붉은 스피드 트레일 고속 교합 (30ms 찰나의 교합 쇄도!)
      {
        ...baseFrame,
        delay: 30,
        ...cOff(24, -8),
        ...cScale(0.95, 1.05),
        ...casterRed(1.00),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.85,
        phaseId: "super-fang-snap-rush",
        phaseName: "9. 붉은 스피드 트레일 고속 교합",
      },

      // =======================================================================
      // Step 4: 완전 교합 & 붉은 만화풍 폭발 구름 & 붉은 알갱이 분출
      // =======================================================================
      // 10. 격돌 교합 쾅!! 붉은 만화풍 충격 폭발 구름 & 붉은 알갱이 동시 분출
      {
        ...baseFrame,
        delay: 85,
        ...cOff(32, -10),
        ...defOff(0, 6),
        ...defScale(1.22, 0.78),
        ...casterRed(1.00),
        targetRedTint: true,
        hitFlash: isHit,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.35,
        phaseId: "super-fang-bite-burst",
        phaseName: "10. 격돌 교합 & 붉은 폭발 구름 작렬",
      },
      // 11. 붉은 알갱이 분출 가속 & 붉은 연막 확대
      {
        ...baseFrame,
        delay: 85,
        ...cOff(26, -8),
        ...defOff(isHit ? 3 : 0, isHit ? -2 : 0),
        ...defScale(0.94, 1.06),
        ...casterRed(0.85),
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.85,
        phaseId: "super-fang-particle-burst",
        phaseName: "11. 붉은 알갱이 분출 가속",
      },

      // =======================================================================
      // Step 5: 앞니 소멸 & 붉은 알갱이 원거리 확산 & 붉은 연막 팽창
      // =======================================================================
      // 12. 앞니 소멸 & 붉은 알갱이 원거리 확산 ➔ 타겟 주변 붉은 연막 팽창
      {
        ...baseFrame,
        delay: 85,
        ...cOff(18, -5),
        ...defOff(isHit ? -1 : 0, 0),
        ...defScale(0.98, 1.02),
        ...casterRed(0.60),
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showEffect: true,
        moveStep: 5,
        effectProgress: 0.55,
        phaseId: "super-fang-particle-fly-1",
        phaseName: "12. 붉은 알갱이 원거리 확산",
      },
      // 13. 붉은 연막 팽창 및 알갱이 비산
      {
        ...baseFrame,
        delay: 85,
        ...cOff(12, -3),
        ...defOff(0, 0),
        ...defScale(1.0, 1.0),
        ...casterRed(0.35),
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showEffect: true,
        moveStep: 5,
        effectProgress: 0.90,
        phaseId: "super-fang-particle-fly-2",
        phaseName: "13. 붉은 연막 팽창 및 알갱이 비산",
      },

      // =======================================================================
      // Step 6: 붉은 알갱이 및 연막 소산
      // =======================================================================
      // 14. 붉은 알갱이 소산 및 연막 서서히 감쇄
      {
        ...baseFrame,
        delay: 80,
        ...cOff(6, -1),
        ...defOff(0, 0),
        ...defScale(1.0, 1.0),
        casterRedTint: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showEffect: true,
        moveStep: 6,
        effectProgress: 0.45,
        phaseId: "super-fang-fade-1",
        phaseName: "14. 붉은 알갱이 소산 및 연막 감쇄",
      },
      // 15. 연막 소멸 및 피격자 복귀
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...defOff(0, 0),
        ...defScale(1.0, 1.0),
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showEffect: true,
        moveStep: 6,
        effectProgress: 0.90,
        phaseId: "super-fang-fade-2",
        phaseName: "15. 연막 소멸 및 피격자 복귀",
      },

      // =======================================================================
      // Step 7: 피날레 복귀
      // =======================================================================
      // 16. 시전자 정위치 복귀 및 피날레
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...defOff(0, 0),
        ...defScale(1.0, 1.0),
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showEffect: false,
        moveStep: 7,
        effectProgress: 1.0,
        phaseId: "super-fang-recover",
        phaseName: "16. 피날레 복귀",
      },
    ];
  },
};
