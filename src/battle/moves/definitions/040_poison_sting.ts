// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawPoisonStingEffect } from "../../../renderers/moves/gen1/move037_040.js";

/**
 * 040: 독침 (Poison Sting)
 * 
 * Concept:
 * - 길어진 단일 직선 독침 1발 사출 (길이 ~86px 날카로운 직선 바늘)
 * - 극소형 핀포인트 찌르기 타격 (r=7.5px 미세 스파크)
 * - 피격 직후 대상 포켓몬 전신 보라색화 진행 (0.35 ➔ 0.75 ➔ 1.0 ➔ 0.4 ➔ 0)
 * - 대상 포켓몬 주변에 영롱한 하이라이트의 보라색 비눗방울 군집 발생 및 공중 부유
 */
export const poisonStingMove: BattleMoveAnimation = {
  num: 40,
  key: "poison-sting",
  nameKo: "독침",
  nameEn: "Poison Sting",
  type: "poison",
  category: "physical",
  camera: { type: "target", zoom: 1.25 },
  drawEffect: drawPoisonStingEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    return [
      // 1. 발사 준비 (웅크림 & 독침 장전)
      {
        delay: 110,
        pOffset: isP ? { x: -10, y: 4 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 10, y: -4 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.14, y: 0.86 } : undefined,
        eScale: !isP ? { x: 1.14, y: 0.86 } : undefined,
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 1,
        targetPurpleLevel: 0,
        phaseId: "poisonsting-aim",
        phaseName: "1. 독침 조준 & 장전",
      },
      // 2. 발사 1: 장전된 긴 직선 독침 고속 사출 (38% 비행)
      {
        delay: 90,
        pOffset: isP ? { x: 18, y: -6 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -18, y: 6 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.90, y: 1.12 } : undefined,
        eScale: !isP ? { x: 0.90, y: 1.12 } : undefined,
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 2,
        effectProgress: 0.38,
        targetPurpleLevel: 0,
        phaseId: "poisonsting-fly1",
        phaseName: "2. 긴 직선 독침 고속 사출 (38% 비행)",
      },
      // 3. 발사 2: 긴 직선 독침 목표 쇄도 (82% 비행)
      {
        delay: 90,
        pOffset: isP ? { x: 8, y: -3 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -8, y: 3 } : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 2,
        effectProgress: 0.82,
        targetPurpleLevel: 0,
        phaseId: "poisonsting-fly2",
        phaseName: "3. 긴 직선 독침 목표 쇄도 (82% 비행)",
      },
      // 4. 극소형 핀포인트 찌르기 타격 (타격 이펙트 크기 존나작게: r=7.5px)
      {
        delay: 130,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: -10, y: 4 } : { x: 10, y: -4 }) : { x: 0, y: 0 },
        showEffect: isHit,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 3,
        effectProgress: 1.0,
        targetPurpleLevel: isHit ? 0.35 : 0,
        phaseId: "poisonsting-impact",
        phaseName: "4. 극소형 핀포인트 독침 타격",
      },
      // 5. 타격 후: 대상 포켓몬 보라색화 진행 & 1차 보라색 비눗방울 발생
      {
        delay: 140,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: 6, y: -2 } : { x: -6, y: 2 }) : { x: 0, y: 0 },
        showEffect: isHit,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 4,
        targetPurpleLevel: isHit ? 0.75 : 0,
        phaseId: "poisonsting-bubble1",
        phaseName: "5. 보라색화 진행 & 보라색 비눗방울 발생",
      },
      // 6. 전신 중독 보라색화 피크 & 2차 비눗방울 군집 상승
      {
        delay: 140,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: -3, y: 1 } : { x: 3, y: -1 }) : { x: 0, y: 0 },
        showEffect: isHit,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 5,
        targetPurpleLevel: isHit ? 1.0 : 0,
        phaseId: "poisonsting-bubble2",
        phaseName: "6. 전신 중독 보라색화 & 비눗방울 상승",
      },
      // 7. 독기 분산 & 비눗방울 페이드아웃
      {
        delay: 120,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: isHit,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 6,
        targetPurpleLevel: isHit ? 0.40 : 0,
        phaseId: "poisonsting-bubble3",
        phaseName: "7. 독기 분산 & 비눗방울 페이드아웃",
      },
      // 8. 복귀 완료
      {
        delay: 90,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        enemyHp,
        playerHp,
        textLineIdx,
        moveEffect: a,
        moveStep: 1,
        targetPurpleLevel: 0,
        phaseId: "poisonsting-finish",
        phaseName: "8. 복귀 완료",
      },
    ];
  }
};
