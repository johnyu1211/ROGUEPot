// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawHyperFangEffect } from "../../../renderers/moves/gen1/move157_160.js";

/**
 * 158: 필살앞니 (Hyper Fang) - 노말 타입 물리 접촉기
 *
 * 연출 구성 (5세대 B/W 5개 프레임 완벽 고증):
 * 1. [Image 1: 앞니 대각 대치] 시전자 후방 웅크림 힘 축적 ➔ 상대방 주위 좌상단 2개 & 우하단 2개의 순백 캡슐(슬레이트 음영 코어) 앞니 대각 대치
 * 2. [Image 2: 대각 교합 & 만화풍 적색 폭발] 시전자 전방 돌진 ➔ 백색 스피드 트레일과 함께 초고속 교합 ➔ 격돌 순간 우상단 & 좌하단에 적색 테두리 만화풍 충격 폭발 구름 폭발 (hitFlash)
 * 3. [Image 3: 알갱이 분출 & 연막 생성] 맞물린 앞니 중심 ➔ 우상단 & 좌하단 방향으로 적색 테두리의 노란 원형 알갱이 파티클 폭발적 분출 & 중앙 크림색 연막 구름 생성
 * 4. [Image 4: 알갱이 원거리 확산 & 연막 팽창] 앞니 소멸 ➔ 적색 테두리 알갱이 원거리 확산 ➔ 타겟 주변 크림색 연막 구름 팽창
 * 5. [Image 5: 알갱이 및 연막 소산] 알갱이 및 연막 구름 서서히 페이드아웃 ➔ 피격자 탄성 복귀
 * 6. [피날레 복귀] 시전자 착지 복귀 및 카메라 글라이드아웃
 */
export const hyperFangMove: BattleMoveAnimation = {
  num: 158,
  key: "hyper-fang",
  nameKo: "필살앞니",
  nameEn: "Hyper Fang",
  type: "normal",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos, isHit } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawHyperFangEffect(targetCtx, attackerPos, targetPos, step, prog, isHit);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.35,
      pRot: 0,
      eRot: 0,
    };

    // 절대 규칙 2 준수: 시전자 전용 오프셋 및 탄성 스케일 (수비자는 {0, 0} 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const cScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    // 피격자(수비자) 전용 리액션 오프셋 및 찌그러짐 탄성
    const defOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x, y } : { x: 0, y: 0 },
    });

    const defScale = (x: number, y: number) => ({
      pScale: !isP ? { x, y } : undefined,
      eScale: isP ? { x, y } : undefined,
    });

    return [
      // =======================================================================
      // Phase 1: 시동 & 앞니 대각 대치 (Image 1, Step 1)
      // =======================================================================
      // 1. 시전자 힘 축적 & 상대 주위 좌상단/우하단 대형 앞니 캡슐 출현
      {
        ...baseFrame,
        delay: 85,
        ...cOff(-8, 3),
        ...cScale(1.08, 0.92),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.35,
        phaseId: "hyper-fang-spawn",
        phaseName: "1. 앞니 캡슐 대각 출현",
      },
      // 2. 앞니 캡슐 선명화 & 대치 대기
      {
        ...baseFrame,
        delay: 75,
        ...cOff(-10, 4),
        ...cScale(1.12, 0.88),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.85,
        phaseId: "hyper-fang-ready",
        phaseName: "2. 대각 대치 및 조준",
      },

      // =======================================================================
      // Phase 2: 대각 교합 쇄도 & 단일 격돌 교합 (Image 2, Step 2 & 3)
      // =======================================================================
      // 3. 시전자 전방 돌진 & 백색 트레일과 함께 초고속 교합
      {
        ...baseFrame,
        delay: 45,
        ...cOff(20, -7),
        ...cScale(0.95, 1.05),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.40,
        phaseId: "hyper-fang-snap-rush",
        phaseName: "3. 대각 교합 고속 쇄도",
      },
      // 4. 격돌 순간 쾅!! 만화풍 폭발 구름과 알갱이 동시 분출 (단일 깨물기 프레임)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(32, -10),
        ...defOff(0, 6),
        ...defScale(1.22, 0.78),
        showEffect: true,
        hitFlash: isHit,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 3,
        effectProgress: 0.35,
        phaseId: "hyper-fang-bite-burst",
        phaseName: "4. 격돌 교합 & 알갱이 분출",
      },
      // 6. 알갱이 분출 가속 & 연막 확대
      {
        ...baseFrame,
        delay: 85,
        ...cOff(26, -8),
        ...defOff(isHit ? 3 : 0, isHit ? -2 : 0),
        ...defScale(0.94, 1.06),
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 3,
        effectProgress: 0.85,
        phaseId: "hyper-fang-particle-burst-2",
        phaseName: "6. 알갱이 분출 가속",
      },

      // =======================================================================
      // Phase 4: 이빨 소멸 & 알갱이 원거리 확산 & 연막 팽창 (Image 4, Step 4)
      // =======================================================================
      // 7. 앞니 소멸 & 알갱이 원거리 확산 ➔ 타겟 주변 연막 팽창 (#6)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(18, -5),
        ...defOff(isHit ? -1 : 0, 0),
        ...defScale(0.98, 1.02),
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 4,
        effectProgress: 0.65,
        phaseId: "hyper-fang-particle-fly-1",
        phaseName: "7. 알갱이 원거리 확산",
      },
      // 8. 알갱이 끝자락 도달 & 연막 지속 (#7)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(12, -3),
        ...defOff(0, 0),
        ...defScale(1.0, 1.0),
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 4,
        effectProgress: 0.95,
        phaseId: "hyper-fang-particle-fly-2",
        phaseName: "8. 알갱이 비산 및 연막 팽창",
      },

      // =======================================================================
      // Phase 5: 알갱이 및 연막 소산 (Image 5, Step 5)
      // =======================================================================
      // 9. 알갱이 페이드아웃 & 연막 서서히 감쇄
      {
        ...baseFrame,
        delay: 85,
        ...cOff(8, -2),
        ...defOff(0, 0),
        ...defScale(1.0, 1.0),
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 5,
        effectProgress: 0.45,
        phaseId: "hyper-fang-fade-1",
        phaseName: "9. 알갱이 소산 및 연막 감쇄",
      },
      // 10. 연막 완전 소멸 & 피격자 안정화
      {
        ...baseFrame,
        delay: 80,
        ...cOff(4, -1),
        ...defOff(0, 0),
        ...defScale(1.0, 1.0),
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 5,
        effectProgress: 0.90,
        phaseId: "hyper-fang-fade-2",
        phaseName: "10. 연막 소멸 및 피격자 복귀",
      },

      // =======================================================================
      // Phase 6: 피날레 복귀 (Step 6)
      // =======================================================================
      // 11. 시전자 정위치 복귀 & 카메라 글라이드아웃 (moveStep: 6 명시)
      {
        ...baseFrame,
        delay: 75,
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 6,
        effectProgress: 1.0,
        phaseId: "hyper-fang-recover",
        phaseName: "11. 시전자 복귀 및 피날레",
      },
    ];
  },
};
