// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawFurySwipesEffect } from "../../../renderers/moves/gen1/move153_156.js";

/**
 * 154: 마구할퀴기 (Fury Swipes)
 *
 * 타입: 노말 (Normal)
 * 분류: 물리 (Physical)
 * 위력: 18 / 명중: 80 / PP: 15
 * 효과: 날카로운 발톱이나 손톱 등으로 상대를 마구 할퀴어서 공격한다. 2~5회 연속으로 쓴다.
 *
 * 연출 시퀀스 (유저 요구사항 100% 반영):
 * - 반짝거리는 노란 별 & 흰색 구형 타격 이펙트 완전 배제 (010 할퀴기 본연의 순수 참격)
 * - 한쪽 방향 할퀴기 ➔ 참격이 그대로 해당 방향 아래로 살짝 슬라이드 ➔ 페이드아웃 (완전히 사라진 후) ➔ 반대 방향 할퀴기
 * - 리드미컬한 좌우 교대 연타 ➔ 피니시 타격
 */
export const furySwipesMove: BattleMoveAnimation = {
  num: 154,
  key: "fury-swipes",
  nameKo: "마구할퀴기",
  nameEn: "Fury Swipes",
  type: "normal",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (frame.showEffect && drawCtx.targetPos) {
      drawFurySwipesEffect(targetCtx, drawCtx.targetPos, frame.moveStep ?? 1, drawCtx);
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

    // 피격 대상 오프셋
    const tOff = (x: number, y: number) =>
      isP
        ? (isHit ? { eOffset: { x, y } } : { eOffset: { x: 0, y: 0 } })
        : (isHit ? { pOffset: { x: -x, y: -y } } : { pOffset: { x: 0, y: 0 } });

    // -------------------------------------------------------------
    // Miss인 경우 (!isHit)
    // -------------------------------------------------------------
    if (!isHit) {
      return [
        {
          ...baseFrame,
          delay: 90,
          ...cOff(12, -4),
          ...tOff(0, 0),
          showEffect: false,
          moveStep: 1,
          phaseId: "fury-swipes-miss-prep",
          phaseName: "1. 전방 도약 및 발톱 준비",
        },
        {
          ...baseFrame,
          delay: 95,
          ...cOff(24, -8),
          ...tOff(0, 0),
          showEffect: true,
          moveStep: 2,
          phaseId: "fury-swipes-miss-swing1",
          phaseName: "2. 1타 우측 사선 헛치기",
        },
        {
          ...baseFrame,
          delay: 85,
          ...cOff(26, -9),
          ...tOff(0, 0),
          showEffect: true,
          moveStep: 3,
          phaseId: "fury-swipes-miss-slide1",
          phaseName: "3. 1타 슬라이드 페이드",
        },
        {
          ...baseFrame,
          delay: 70,
          ...cOff(16, -5),
          // 상대방이 뒤로 회피 (백스텝)
          ...(isP ? { eOffset: { x: 12, y: -4 } } : { pOffset: { x: -12, y: 4 } }),
          showEffect: false,
          moveStep: 4,
          phaseId: "fury-swipes-miss-dodge",
          phaseName: "4. 상대 회피 및 1타 소멸",
        },
        {
          ...baseFrame,
          delay: 95,
          ...cOff(26, -9),
          ...(isP ? { eOffset: { x: 14, y: -5 } } : { pOffset: { x: -14, y: 5 } }),
          showEffect: true,
          moveStep: 5,
          phaseId: "fury-swipes-miss-swing2",
          phaseName: "5. 2타 반대방향 헛치기",
        },
        {
          ...baseFrame,
          delay: 85,
          ...cOff(28, -10),
          ...(isP ? { eOffset: { x: 14, y: -5 } } : { pOffset: { x: -14, y: 5 } }),
          showEffect: true,
          moveStep: 6,
          phaseId: "fury-swipes-miss-slide2",
          phaseName: "6. 2타 슬라이드 페이드",
        },
        {
          ...baseFrame,
          delay: 100,
          ...cOff(14, -5),
          ...tOff(0, 0),
          showEffect: false,
          moveStep: 7,
          phaseId: "fury-swipes-miss-stumble",
          phaseName: "7. 시전자 헛스윙 후 멈칫",
        },
        {
          ...baseFrame,
          delay: 110,
          ...cOff(0, 0),
          ...tOff(0, 0),
          showEffect: false,
          moveStep: 8,
          phaseId: "fury-swipes-miss-return",
          phaseName: "8. 정위치 복귀",
        },
      ];
    }

    // -------------------------------------------------------------
    // Hit인 경우 (isHit) - 4연타 연속 교대 할퀴기 시퀀스
    // [한쪽 방향 할퀴기 > 아래로 슬라이드 & 페이드아웃 > (완전히 사라진 후) > 반대방향 할퀴기]
    // -------------------------------------------------------------
    return [
      // 1. 도약 & 발톱 시동
      {
        ...baseFrame,
        delay: 90,
        ...cOff(12, -4),
        ...tOff(0, 0),
        showEffect: false,
        moveStep: 1,
        phaseId: "fury-swipes-prep",
        phaseName: "1. 전방 도약 및 발톱 준비",
      },

      // === [1타: 우측 사선 할퀴기] ===
      // 2. 1타 출현
      {
        ...baseFrame,
        delay: 95,
        ...cOff(24, -8),
        ...tOff(6, -2),
        showEffect: true,
        moveStep: 2,
        phaseId: "fury-swipes-hit-1-strike",
        phaseName: "2. 1타 우측 할퀴기 출현",
      },
      // 3. 1타 해당방향 아래로 슬라이드 & 페이드아웃
      {
        ...baseFrame,
        delay: 85,
        ...cOff(26, -9),
        ...tOff(8, -3),
        showEffect: true,
        moveStep: 3,
        phaseId: "fury-swipes-hit-1-slide",
        phaseName: "3. 1타 아래로 슬라이드 & 페이드아웃",
      },
      // 4. 1타 완전 소멸 (완전히 사라진 상태)
      {
        ...baseFrame,
        delay: 60,
        ...cOff(18, -6),
        ...tOff(3, -1),
        showEffect: false,
        moveStep: 4,
        phaseId: "fury-swipes-hit-1-clear",
        phaseName: "4. 1타 완전 소멸 (대기)",
      },

      // === [2타: 반대방향 좌측 사선 할퀴기] ===
      // 5. 2타 출현 (반대방향)
      {
        ...baseFrame,
        delay: 95,
        ...cOff(26, -8),
        ...tOff(-6, 2),
        showEffect: true,
        moveStep: 5,
        phaseId: "fury-swipes-hit-2-strike",
        phaseName: "5. 2타 반대방향(좌측) 할퀴기 출현",
      },
      // 6. 2타 해당방향 아래로 슬라이드 & 페이드아웃
      {
        ...baseFrame,
        delay: 85,
        ...cOff(28, -9),
        ...tOff(-8, 3),
        showEffect: true,
        moveStep: 6,
        phaseId: "fury-swipes-hit-2-slide",
        phaseName: "6. 2타 아래로 슬라이드 & 페이드아웃",
      },
      // 7. 2타 완전 소멸 (완전히 사라진 상태)
      {
        ...baseFrame,
        delay: 60,
        ...cOff(20, -6),
        ...tOff(-3, 1),
        showEffect: false,
        moveStep: 7,
        phaseId: "fury-swipes-hit-2-clear",
        phaseName: "7. 2타 완전 소멸 (대기)",
      },

      // === [3타: 우측 사선 할퀴기] ===
      // 8. 3타 출현
      {
        ...baseFrame,
        delay: 95,
        ...cOff(28, -10),
        ...tOff(6, -2),
        showEffect: true,
        moveStep: 8,
        phaseId: "fury-swipes-hit-3-strike",
        phaseName: "8. 3타 우측 할퀴기 출현",
      },
      // 9. 3타 해당방향 아래로 슬라이드 & 페이드아웃
      {
        ...baseFrame,
        delay: 85,
        ...cOff(30, -11),
        ...tOff(8, -3),
        showEffect: true,
        moveStep: 9,
        phaseId: "fury-swipes-hit-3-slide",
        phaseName: "9. 3타 아래로 슬라이드 & 페이드아웃",
      },
      // 10. 3타 완전 소멸 (완전히 사라진 상태)
      {
        ...baseFrame,
        delay: 60,
        ...cOff(22, -7),
        ...tOff(3, -1),
        showEffect: false,
        moveStep: 10,
        phaseId: "fury-swipes-hit-3-clear",
        phaseName: "10. 3타 완전 소멸 (대기)",
      },

      // === [4타: 반대방향 좌측 사선 할퀴기 피니시] ===
      // 11. 4타 피니시 출현 (섬광 & 데미지 적용)
      {
        ...baseFrame,
        delay: 110,
        ...cOff(34, -12),
        ...tOff(-14, 6),
        showEffect: true,
        hitFlash: isHit,
        enemyHp: a?.enemyHpAfter ?? enemyHp,
        playerHp: a?.playerHpAfter ?? playerHp,
        moveStep: 11,
        phaseId: "fury-swipes-hit-4-strike",
        phaseName: "11. 4타 반대방향 할퀴기 피니시",
      },
      // 12. 4타 해당방향 아래로 슬라이드 & 페이드아웃
      {
        ...baseFrame,
        delay: 90,
        ...cOff(30, -10),
        ...tOff(-16, 7),
        showEffect: true,
        enemyHp: a?.enemyHpAfter ?? enemyHp,
        playerHp: a?.playerHpAfter ?? playerHp,
        moveStep: 12,
        phaseId: "fury-swipes-hit-4-slide",
        phaseName: "12. 4타 아래로 슬라이드 & 페이드아웃",
      },
      // 13. 4타 완전 소멸 및 반동 복귀
      {
        ...baseFrame,
        delay: 80,
        ...cOff(14, -5),
        ...tOff(-6, 2),
        showEffect: false,
        enemyHp: a?.enemyHpAfter ?? enemyHp,
        playerHp: a?.playerHpAfter ?? playerHp,
        moveStep: 13,
        phaseId: "fury-swipes-decay",
        phaseName: "13. 완전 소멸 및 반동 회복",
      },
      // 14. 정위치 착지 복귀
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, 0),
        ...tOff(0, 0),
        showEffect: false,
        enemyHp: a?.enemyHpAfter ?? enemyHp,
        playerHp: a?.playerHpAfter ?? playerHp,
        moveStep: 14,
        phaseId: "fury-swipes-finish",
        phaseName: "14. 정위치 착지 복귀",
      },
    ];
  },
};
