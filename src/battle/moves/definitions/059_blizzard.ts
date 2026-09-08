// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawBlizzardEffect, drawBlizzardBehindEffect } from "../../../renderers/moves/gen1/move057_060.js";

/**
 * 059: 눈보라 (Blizzard) - 5세대 화이트아웃 대기 & 좌➔우 맹렬한 세찬 설풍 쇄도
 * 
 * Concept (유저 지침 & 5세대 공식 배틀 연출 완벽 반영):
 * 1. [유저 지침] 배경 순백 화이트아웃 필터
 *    - 냉동빔의 좁은 빔 형태와 완전히 차별화되는 전장 전체의 혹한 화이트아웃 대기 효과
 * 2. [유저 지침] 좌측에서 우측으로 파아아아악 지나가는 눈과 냉기
 *    - 수평 고속 냉기 제트 스트림라인 (#72FFFB & #FFFFFF)
 *    - 고속 셔터스피드 느낌의 수평 눈줄기(Speed Streaks) & 다이아몬드 얼음 결정
 *    - 회전 각면 다이아몬드 우박 덩어리
 * 3. 대상 강타 & 피격 넉백
 *    - 눈보라 전면 돌파 시 대상 정면 섬광(hitFlash), 블루 틴트(targetBlueTint) 및 넉백 진동(targetShake)
 *    - 인위적인 PPT 뾰족 얼음/바닥 원형 데칼 및 냉동빔 스타버스트/유리파편 완전 배제
 * 4. 우측 관통 이탈 후 서서히 걷히는 화이트아웃 & 잔여 다이아몬드 더스트
 */
export const blizzardMove: BattleMoveAnimation = {
  num: 59,
  key: "blizzard",
  nameKo: "눈보라",
  nameEn: "Blizzard",
  type: "ice",
  category: "special",
  camera: { type: "target", zoom: 1.25 },
  drawBehindEffect: drawBlizzardBehindEffect,
  drawEffect: drawBlizzardEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    const dir = isP ? 1 : -1;

    const targetShake = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x, y } : { x: 0, y: 0 },
    });

    const attackerShake = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x, y } : { x: 0, y: 0 },
    });

    return [
      // 1. [유저 요청 엄수]: 좌측에서 차가운 설풍 시작 (대기 태동, 화면은 선명하되 좌측 바람 불기 시작)
      {
        ...baseFrame,
        delay: 75,
        ...attackerShake(-dir * 2, 1),
        cameraPan: { x: 0, y: 0 },
        showEffect: true,
        moveStep: 1,
        stormProg: 0.15,
        stormIntensity: 0.20,
        whiteoutAlpha: 0.08,
        phaseId: "blizzard-start",
        phaseName: "1. 좌측에서 차가운 설풍 시작 (바람 불기 시작)",
      },
      // 2. 세찬 설풍 돌풍 전장 진입 (좌➔우 쇄도 가속, 바람이 점점 거세짐)
      {
        ...baseFrame,
        delay: 80,
        ...attackerShake(dir * 2, -1),
        cameraPan: { x: 2, y: -1 },
        showEffect: true,
        moveStep: 2,
        stormProg: 0.40,
        stormIntensity: 0.50,
        whiteoutAlpha: 0.30,
        phaseId: "blizzard-gust",
        phaseName: "2. 세찬 설풍 돌풍 전장 진입 (바람 가속)",
      },
      // 3. 눈 폭풍 급가속 & 전장 맹렬한 쇄도 (폭풍 세력 대폭 강화 & 전장 진동)
      {
        ...baseFrame,
        delay: 80,
        ...attackerShake(dir * 2, 0),
        cameraPan: { x: -4, y: 2 },
        showEffect: true,
        moveStep: 3,
        stormProg: 0.68,
        stormIntensity: 0.78,
        whiteoutAlpha: 0.60,
        phaseId: "blizzard-surge",
        phaseName: "3. 맹렬한 눈 폭풍 쇄도 (돌풍 강화 & 진동)",
      },
      // 4. [직격 강타] 눈 폭풍 대상 정면 격돌 & 넉백 피격 (거대한 풍압 충격)
      {
        ...baseFrame,
        delay: 90,
        ...attackerShake(0, 0),
        ...(isHit ? targetShake(dir * 8, -4) : {}),
        cameraPan: { x: dir * 7, y: -4 },
        hitFlash: isHit,
        targetBlueTint: isHit,
        showEffect: true,
        moveStep: 4,
        stormProg: 0.92,
        stormIntensity: 0.95,
        whiteoutAlpha: 0.82,
        phaseId: "blizzard-impact",
        phaseName: "4. 눈 폭풍 대상 정면 격돌 & 넉백 피격",
      },
      // 5. [클라이맥스 1] 폭풍 폭주 & 전장을 집어삼키는 설풍 스톰 (화면 진동 극대화)
      {
        ...baseFrame,
        delay: 95,
        ...(isHit ? targetShake(-dir * 6, 2) : {}),
        cameraPan: { x: -dir * 6, y: 3 },
        targetBlueTint: isHit,
        showEffect: true,
        moveStep: 5,
        stormProg: 1.18,
        stormIntensity: 1.0,
        whiteoutAlpha: 0.94,
        phaseId: "blizzard-engulf-1",
        phaseName: "5. 폭풍 폭주 & 화면 집어삼킴 시작",
      },
      // 6. [클라이맥스 2 - 절정] 전 화면을 집어삼킨 눈 폭풍 최고조
      {
        ...baseFrame,
        delay: 100,
        cameraPan: { x: 4, y: -2 },
        targetBlueTint: isHit,
        showEffect: true,
        moveStep: 6,
        stormProg: 1.45,
        stormIntensity: 1.0,
        whiteoutAlpha: 0.98,
        clearProg: 0,
        phaseId: "blizzard-engulf-peak",
        phaseName: "6. [절정] 눈 폭풍에 화면 전체가 완전히 뒤덮임",
      },
      // 7. [걷힘 1단계 - 유저 요청 엄수]: 폭풍이 우측으로 빠지며 좌측부터 걷히기 시작 (시네마 검정 서서히 페이드아웃 시작)
      {
        ...baseFrame,
        delay: 95,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        cameraPan: { x: dir * 2, y: -1 },
        targetBlueTint: false,
        showEffect: true,
        moveStep: 7,
        stormProg: 1.80,
        stormIntensity: 0.75,
        whiteoutAlpha: 0.65,
        clearProg: 0.28,
        phaseId: "blizzard-clear-1",
        phaseName: "7. 눈보라가 우측으로 통과하며 좌측부터 서서히 걷힘",
      },
      // 8. [걷힘 2단계 - 유저 요청 엄수]: 눈보라 중심이 우측으로 지나감 (좌측 65% 이상 완전 클리어)
      {
        ...baseFrame,
        delay: 90,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        cameraPan: { x: 0, y: 0 },
        targetBlueTint: false,
        showEffect: true,
        moveStep: 8,
        stormProg: 2.15,
        stormIntensity: 0.45,
        whiteoutAlpha: 0.35,
        clearProg: 0.62,
        phaseId: "blizzard-clear-2",
        phaseName: "8. 눈보라가 우측으로 이동하며 중심부까지 페이드아웃",
      },
      // 9. [마지막 프레임 - 최종 걷힘 피날레]: 우측 끝으로 빠져나가는 마지막 잔여 냉기 페이드아웃 & 시네마 바 잔영
      {
        ...baseFrame,
        delay: 85,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        cameraPan: { x: 0, y: 0 },
        targetBlueTint: false,
        showEffect: true,
        moveStep: 9,
        stormProg: 2.50,
        stormIntensity: 0.20,
        whiteoutAlpha: 0.12,
        clearProg: 0.90,
        phaseId: "blizzard-clear-3",
        phaseName: "9. [마지막 프레임] 우측 끝 잔여 냉기 및 시네마 바 최종 페이드아웃",
      },
      // 10. 기술 완전 종료 및 기본 스탠스 복귀 (0으로 완전 초기화)
      {
        ...baseFrame,
        delay: 40,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        cameraPan: { x: 0, y: 0 },
        showEffect: false,
        stormProg: 0,
        stormIntensity: 0,
        whiteoutAlpha: 0,
        clearProg: 0,
        phaseId: "blizzard-end",
        phaseName: "10. 기술 종료 및 기본 스탠스 복귀",
      },
    ];
  },
};
