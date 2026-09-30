// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawTripleKickEffect } from "../../../renderers/moves/gen1/move165_168.js";

/**
 * 167: 트리플킥 (Triple Kick) - 격투 타입 3연속 물리 공격기
 *
 * 위력: 1타 10 / 2타 20 / 3타 30 (명중할 때마다 위력 증가, 최대 총 위력 60)
 * 명중: 90 / PP: 10 / 접촉 판정: O
 * 설명: 3회 연속으로 킥을 날려 공격한다. 기술이 맞을 때마다 위력이 올라간다.
 *
 * [카포에라 / 격투 모션 연출 기승전결 시퀀스]:
 * 1. [Step 1: 시동 모으기] (80ms)
 *    - 시전 포켓몬 뒤로 웅크려 탄성 축적 (스쿼시 & 스트레치)
 * 2. [Step 2: 1타 - 로우/스냅 킥] (180ms)
 *    - 전방 도약하며 날렵한 1차 킥 쇄도 ➔ 상대 하단 경쾌한 1타 킥 아크 & 골드 십자 섬광 직격
 * 3. [Step 3: 2타 - 하이 스핀 킥] (275ms)
 *    - 공중 180도 피벗 회전 ➔ 반대 방향에서 상단으로 깊숙이 파고드는 2차 킥 직격!
 *    - 1타보다 커진 킥 아크, 다이아몬드 스타버스트 & 1프레임 섬광 (hitFlash: true), 상대 더 큰 넉백
 * 4. [Step 4: 극대 360도 서머솔트 회전] (95ms)
 *    - 2타 반동으로 최고점으로 솟구치며 서머솔트 회전으로 피니시 힘 극한 응축
 * 5. [Step 5: 3타 - 피니시 풀파워 드롭 킥] (340ms)
 *    - 최고점에서 급강하 쇄도 ➔ 상대 중앙을 맹타하는 초대형 초승달 킥 충격파 호 & 8방향 플레어 빔 작렬!
 *    - 2중 충격파 링 전개 & 사방으로 터져 나오는 파이팅 파티클 & 스파클 폭발, 상대 최대 넉백 & HP 감소
 * 6. [Step 6: 공중제비 착지 & 안정 복귀] (215ms)
 *    - 공중제비 후 바닥 쿵 착지 스쿼시 ➔ 잔여 스파클 소산 및 정위치 안착
 */
export const tripleKickMove: BattleMoveAnimation = {
  num: 167,
  key: "triple-kick",
  nameKo: "트리플킥",
  nameEn: "Triple Kick",
  type: "fighting",
  category: "physical",
  camera: {
    type: "target",
    zoom: 1.35,
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawTripleKickEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    // 시전자 오프셋 (시전자만 정확히 이동, 수비자는 완벽하게 {0, 0} 고정)
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

    // 수비자(피격자) 오프셋
    const defOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    return [
      // =======================================================================
      // Step 1: 시동 모으기 (Windup - 80ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 80,
        ...cOff(-6, 3),
        ...cScale(0.92, 1.08),
        ...cRot(-0.08),
        ...defOff(0, 0),
        showEffect: false,
        moveStep: 1,
        effectProgress: 0.1,
        phaseId: "triple-kick-windup",
        phaseName: "1. 킥 와인드업 힘 축적",
      },

      // =======================================================================
      // Step 2: 1타 - 로우/스냅 킥 (First Kick - 180ms)
      // =======================================================================
      // 1-1. 전방 도약 돌진
      {
        ...baseFrame,
        delay: 70,
        ...cOff(18, -8),
        ...cScale(1.10, 0.94),
        ...cRot(0.12),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 2,
        hitIndex: 1,
        effectProgress: 0.25,
        phaseId: "triple-kick-lunge-1",
        phaseName: "2. 1타 도약 쇄도",
      },
      // 1-2. 1타 하단 직격 임팩트 (스냅 킥 타격)
      {
        ...baseFrame,
        delay: 110,
        ...cOff(26, -5),
        ...cScale(1.05, 0.95),
        ...cRot(0.18),
        ...defOff(8, -2),
        showEffect: true,
        moveStep: 2,
        hitIndex: 1,
        effectProgress: 0.75,
        phaseId: "triple-kick-hit-1",
        phaseName: "3. 1타 하단 스냅킥 직격",
      },

      // =======================================================================
      // Step 3: 2타 - 하이 스핀 킥 (Second Kick - 275ms)
      // =======================================================================
      // 2-1. 공중 180도 회전 피벗
      {
        ...baseFrame,
        delay: 85,
        ...cOff(22, -14),
        ...cScale(0.96, 1.04),
        ...cRot(-0.25),
        ...defOff(3, 0),
        showEffect: false,
        moveStep: 3,
        hitIndex: 2,
        effectProgress: 0.1,
        phaseId: "triple-kick-pivot-1",
        phaseName: "4. 공중 피벗 다리 전환",
      },
      // 2-2. 2타 상단 쇄도 돌진
      {
        ...baseFrame,
        delay: 70,
        ...cOff(34, -14),
        ...cScale(1.12, 0.92),
        ...cRot(0.24),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 3,
        hitIndex: 2,
        effectProgress: 0.35,
        phaseId: "triple-kick-lunge-2",
        phaseName: "5. 2타 상단 쇄도",
      },
      // 2-3. 2타 상단 직격 & 섬광 (더 강한 2차 타격)
      {
        ...baseFrame,
        delay: 120,
        ...cOff(38, -10),
        ...cScale(1.04, 0.96),
        ...cRot(0.30),
        ...defOff(14, -4),
        hitFlash: true,
        showEffect: true,
        moveStep: 3,
        hitIndex: 2,
        effectProgress: 0.85,
        phaseId: "triple-kick-hit-2",
        phaseName: "6. 2타 하이스핀킥 직격 & 섬광",
      },

      // =======================================================================
      // Step 4: 극대 360도 서머솔트 회전 가속 (Super Spin Prep - 95ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 95,
        ...cOff(24, -26),
        ...cScale(1.08, 0.94),
        ...cRot(-0.50),
        ...defOff(6, -1),
        showEffect: false,
        moveStep: 4,
        hitIndex: 3,
        effectProgress: 0.2,
        phaseId: "triple-kick-spin-prep",
        phaseName: "7. 서머솔트 극대 회전 가속",
      },

      // =======================================================================
      // Step 5: 3타 - 피니시 풀파워 드롭 킥 (Third Kick Finish - 340ms)
      // =======================================================================
      // 3-1. 최고점 급강하 쇄도
      {
        ...baseFrame,
        delay: 70,
        ...cOff(42, -14),
        ...cScale(1.18, 0.88),
        ...cRot(-0.28),
        ...defOff(2, 0),
        showEffect: true,
        moveStep: 5,
        hitIndex: 3,
        effectProgress: 0.30,
        phaseId: "triple-kick-dive-3",
        phaseName: "8. 피니시 급강하 쇄도",
      },
      // 3-2. 3타 피니시 초강력 직격 쾅!! (순백 섬광 & 최대 넉백 & HP 감소)
      {
        ...baseFrame,
        delay: 150,
        ...cOff(46, -8),
        ...cScale(1.15, 0.90),
        ...cRot(-0.16),
        ...defOff(22, 6),
        hitFlash: true,
        showEffect: true,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 5,
        hitIndex: 3,
        effectProgress: 0.75,
        phaseId: "triple-kick-hit-3",
        phaseName: "9. 피니시 드롭킥 작렬 & 대폭발",
      },
      // 3-3. 충격파 전개 & 넉백 바운스
      {
        ...baseFrame,
        delay: 120,
        ...cOff(34, -4),
        ...cScale(1.04, 0.96),
        ...cRot(0.08),
        ...defOff(12, 2),
        showEffect: true,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 5,
        hitIndex: 3,
        effectProgress: 1.0,
        phaseId: "triple-kick-aftershock",
        phaseName: "10. 충격파 전개 & 넉백 바운스",
      },

      // =======================================================================
      // Step 6: 공중제비 착지 & 안정 복귀 (Landing & Recovery - 215ms)
      // =======================================================================
      // 4-1. 지면 착지 스쿼시
      {
        ...baseFrame,
        delay: 95,
        ...cOff(12, 4),
        ...cScale(1.12, 0.88),
        ...cRot(0),
        ...defOff(0, 0),
        showEffect: true,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 6,
        effectProgress: 0.5,
        phaseId: "triple-kick-land",
        phaseName: "11. 공중제비 지면 착지",
      },
      // 4-2. 피날레 안정 복귀
      {
        ...baseFrame,
        delay: 120,
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...cRot(0),
        ...defOff(0, 0),
        showEffect: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 6,
        phaseId: "triple-kick-recover",
        phaseName: "12. 피날레 정위치 복귀",
      },
    ];
  },
};
