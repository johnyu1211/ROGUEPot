// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import {
  drawSpikeCannonBehindEffect,
  drawSpikeCannonEffect,
} from "../../../renderers/moves/gen1/move129_132.js";

/**
 * 131: 가시대포 (Spike Cannon) - 노말 타입 2~5회 연속 물리 공격기
 *
 * 연출 시퀀스 (유저 요구사항 100% 반영):
 * 1. 바늘미사일의 내추럴 아이보리 뿔 콘 바늘 기반 4발 연속 발사 유형
 * 2. 바늘 뒷부분에 고출력 로켓 엔진 추진 화염(Rocket Jet Flame) 및 스파크 분출
 * 3. 매 발 타격 시 로켓박치기의 눈부신 코어 섬광 + 초승달 칼날 폭발 & 뭉게구름 연기 솟구침
 * 4. 4타 피니시 격돌 시 피격 플래시와 함께 거대한 대폭발 & 풍성한 연기 구름 대확산
 * 5. 아군/적군 시점 완벽 대응 (아군 시전 시 연기는 상대 뒤, 적 시전 시 연기는 아군 앞 좌하단)
 */
export const spikeCannonMove: BattleMoveAnimation = {
  num: 131,
  key: "spike-cannon",
  nameKo: "가시대포",
  nameEn: "Spike Cannon",
  type: "normal",
  category: "physical",
  camera: { type: "target", zoom: 1.25 },
  drawBehindEffect: drawSpikeCannonBehindEffect,
  drawEffect: drawSpikeCannonEffect,
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

    // 피격자 오프셋 (타격 방향으로 넉백)
    const cTargetOff = (x: number, y: number) =>
      isP
        ? (isHit ? { eOffset: { x, y } } : { eOffset: { x: 0, y: 0 } })
        : (isHit ? { pOffset: { x: -x, y: -y } } : { pOffset: { x: 0, y: 0 } });

    return [
      // ======================================================================
      // 1. 1발째 발사 (포구 머즐 화염 & 추진 비행 시작)
      // ======================================================================
      {
        ...baseFrame,
        delay: 80,
        ...cOff(10, -4),
        ...cTargetOff(0, 0),
        showEffect: true,
        showBehindEffect: false,
        moveStep: 1,
        phaseId: "spike-cannon-1-fire",
        phaseName: "1. 1발째 로켓 가시대포 발사 (포구 화염)",
      },
      // 2. 1발째 고속 쇄도 비행
      {
        ...baseFrame,
        delay: 80,
        ...cOff(14, -5),
        ...cTargetOff(0, 0),
        showEffect: true,
        showBehindEffect: false,
        moveStep: 2,
        phaseId: "spike-cannon-1-fly",
        phaseName: "2. 1발째 가시대포 고속 쇄도 비행",
      },

      // ======================================================================
      // 3. 1발째 타격 (로켓박치기 폭발/연기) & 2발째 발사
      // ======================================================================
      {
        ...baseFrame,
        delay: 90,
        ...cOff(18, -7),
        ...cTargetOff(6, -2),
        showEffect: true,
        showBehindEffect: isHit,
        moveStep: 3,
        phaseId: "spike-cannon-2-fire",
        phaseName: "3. 1발째 격돌 폭발/연기 & 2발째 발사",
      },
      // 4. 2발째 고속 쇄도 비행
      {
        ...baseFrame,
        delay: 80,
        ...cOff(22, -8),
        ...cTargetOff(0, 0),
        showEffect: true,
        showBehindEffect: isHit,
        moveStep: 4,
        phaseId: "spike-cannon-2-fly",
        phaseName: "4. 2발째 가시대포 고속 쇄도 비행",
      },

      // ======================================================================
      // 5. 2발째 타격 (작은 폭발/연기) & 3발째 발사
      // ======================================================================
      {
        ...baseFrame,
        delay: 90,
        ...cOff(25, -9),
        ...cTargetOff(-6, 3),
        showEffect: true,
        showBehindEffect: isHit,
        moveStep: 5,
        phaseId: "spike-cannon-3-fire",
        phaseName: "5. 2발째 격돌 폭발/연기 & 3발째 발사",
      },
      // 6. 3발째 고속 쇄도 비행
      {
        ...baseFrame,
        delay: 80,
        ...cOff(28, -10),
        ...cTargetOff(0, 0),
        showEffect: true,
        showBehindEffect: isHit,
        moveStep: 6,
        phaseId: "spike-cannon-3-fly",
        phaseName: "6. 3발째 가시대포 고속 쇄도 비행",
      },

      // ======================================================================
      // 7. 3발째 타격 (작은 폭발/연기) & 4발째 피니시 발사
      // ======================================================================
      {
        ...baseFrame,
        delay: 90,
        ...cOff(32, -12),
        ...cTargetOff(8, -3),
        showEffect: true,
        showBehindEffect: isHit,
        moveStep: 7,
        phaseId: "spike-cannon-4-fire",
        phaseName: "7. 3발째 격돌 폭발/연기 & 4발째 피니시 발사",
      },
      // 8. 4발째 피니시 고속 쇄도 비행
      {
        ...baseFrame,
        delay: 85,
        ...cOff(30, -11),
        ...cTargetOff(0, 0),
        showEffect: true,
        showBehindEffect: isHit,
        moveStep: 8,
        phaseId: "spike-cannon-4-fly",
        phaseName: "8. 4발째 피니시 가시대포 고속 쇄도 비행",
      },

      // ======================================================================
      // 9. 4발째 피니시 관통 대격돌! (피격 플래시 & 작은 폭발/연기 분출)
      // ======================================================================
      {
        ...baseFrame,
        delay: 120,
        ...cOff(26, -9),
        ...cTargetOff(18, -8),
        showEffect: true,
        showBehindEffect: isHit,
        hitFlash: isHit,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpAfter ?? playerHp) : playerHp,
        moveStep: 9,
        phaseId: "spike-cannon-finish-hit",
        phaseName: "9. 4발째 피니시 대격돌 & 작은 폭발/연기 (4연타 완료)",
      },

      // ======================================================================
      // 10. [폭발 후 연기]: 폭발 불꽃 종료, 뭉게구름 연기 솟구침 및 팽창
      // ======================================================================
      {
        ...baseFrame,
        delay: 110,
        ...cOff(16, -6),
        ...cTargetOff(10, -4),
        showEffect: true,
        showBehindEffect: isHit,
        hitFlash: false,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpAfter ?? playerHp) : playerHp,
        moveStep: 10,
        phaseId: "spike-cannon-smoke-billow",
        phaseName: "10. 폭발 후 연기 솟구침 및 팽창",
      },

      // ======================================================================
      // 11. [폭발 후 연기]: 연기 페이드아웃 및 반동 복귀
      // ======================================================================
      {
        ...baseFrame,
        delay: 110,
        ...cOff(8, -3),
        ...cTargetOff(4, -1),
        showEffect: true,
        showBehindEffect: isHit,
        hitFlash: false,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpAfter ?? playerHp) : playerHp,
        moveStep: 11,
        phaseId: "spike-cannon-smoke-fade",
        phaseName: "11. 폭발 후 연기 페이드아웃 및 복귀",
      },

      // ======================================================================
      // 12. 정위치 복귀 완료
      // ======================================================================
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...cTargetOff(0, 0),
        showEffect: false,
        showBehindEffect: false,
        hitFlash: false,
        enemyHp: isHit ? (a?.enemyHpAfter ?? enemyHp) : enemyHp,
        playerHp: isHit ? (a?.playerHpAfter ?? playerHp) : playerHp,
        moveStep: 12,
        phaseId: "spike-cannon-finish",
        phaseName: "12. 정위치 복귀 완료",
      },
    ];
  },
};
