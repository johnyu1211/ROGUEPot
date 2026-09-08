// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawIceBeamEffect, drawIceBeamBehindEffect } from "../../../renderers/moves/gen1/move057_060.js";

/**
 * 058: 냉동빔 (Ice Beam) - 5세대 블랙/화이트 공식 배틀 연출 완벽 재현
 * 
 * Concept (유저 지침 & 5세대 공식 배틀 영상 완벽 반영):
 * 1. 시전자 냉기 집중 준비 (Frame 1)
 *    - 시전 포켓몬이 뒤로 물러서며 호흡하듯 서리 안개(mistAlpha)를 머금음 (인위적인 동그라미 & 찌지직 완전 제거)
 * 2. 5세대 고유 직선 톱니형 차가운 냉동광선 사출 및 쇄도 (Frames 2~4)
 *    - 5세대 블랙/화이트 원작의 직선 다이아몬드/톱니 물결 외곽선 + 순백 레이저 심선 (#72FFFB)
 *    - 시전자에게서 곧바로 매끄럽게 뿜어져 나와 적을 향해 직선 쇄도
 * 3. 대상 직격 & 극저온 서리 폭발 (Frames 5~7, 클라이맥스)
 *    - 1프레임 순백 섬광(hitFlash), 피격 넉백 진동(targetShake), 서리 블루 필터(targetBlueTint)
 *    - 극저온 냉기 수증기 안개 분출 (인위적인 PPT 뾰족 얼음 및 바닥 효과 완전 배제)
 * 4. 극저온 냉기 비산 & 다이아몬드 더스트 잔향 (Frames 8~11)
 *    - 영롱한 다이아몬드 크리스탈 결정 파편 탄도 비산 & 반짝이는 다이아몬드 더스트
 *    - 공중으로 피어오르는 서리 수증기 페이드아웃
 * 5. 기술 종료 및 스탠스 원복 (Frames 12~13)
 */
export const iceBeamMove: BattleMoveAnimation = {
  num: 58,
  key: "ice-beam",
  nameKo: "냉동빔",
  nameEn: "Ice Beam",
  type: "ice",
  category: "special",
  camera: { type: "target", zoom: 1.30 },
  drawBehindEffect: drawIceBeamBehindEffect,
  drawEffect: drawIceBeamEffect,
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
      // 1. [유저 요청 엄수]: 시전자 냉기 집중 준비 (동그라미 & 찌지직 완전 제거)
      {
        ...baseFrame,
        delay: 65,
        ...attackerShake(-dir * 3, 1),
        showEffect: true,
        moveStep: 1,
        mistAlpha: 0.35,
        phaseId: "ice-charge-ready",
        phaseName: "1. 시전자 냉기 집중 준비",
      },
      // 2. [유저 요청 엄수]: 5세대 직선 냉동광선 사출 (38% 전진)
      {
        ...baseFrame,
        delay: 75,
        ...attackerShake(dir * 2, -1),
        showEffect: true,
        moveStep: 2,
        streamHead: 0.38,
        streamTail: 0.0,
        streamAlpha: 1.0,
        mistAlpha: 0.60,
        bgFilterAlpha: 0.45,
        phaseId: "ice-beam-launch",
        phaseName: "2. 5세대 직선 냉동광선 사출 (38% 전진)",
      },
      // 3. 직선 톱니 냉동광선 맹렬한 가속 (75% 전진)
      {
        ...baseFrame,
        delay: 75,
        ...attackerShake(dir * 1, 0),
        showEffect: true,
        moveStep: 3,
        streamHead: 0.75,
        streamTail: 0.0,
        streamAlpha: 1.0,
        mistAlpha: 0.50,
        bgFilterAlpha: 0.58,
        phaseId: "ice-beam-travel",
        phaseName: "3. 직선 톱니 냉동광선 가속 (75% 전진)",
      },
      // 4. 냉동광선 대상 정면 격돌 직전 육박 (105% 전진)
      {
        ...baseFrame,
        delay: 75,
        ...attackerShake(0, 0),
        ...(isHit ? targetShake(dir * 2, -1) : {}),
        showEffect: true,
        moveStep: 4,
        streamHead: 1.05,
        streamTail: 0.0,
        streamAlpha: 1.0,
        impactIntensity: 0.45,
        bgFilterAlpha: 0.68,
        phaseId: "ice-beam-reach",
        phaseName: "4. 대상 정면 격돌 육박 (105% 전진)",
      },
      // 5. [클라이맥스 1] 대상 직격! 순백 섬광, 블루 틴트 & 극저온 서리 작렬
      {
        ...baseFrame,
        delay: 85,
        ...attackerShake(dir * 1, 0),
        ...(isHit ? targetShake(dir * 6, -3) : {}),
        hitFlash: isHit,
        targetBlueTint: isHit,
        showEffect: true,
        moveStep: 5,
        streamHead: 1.10,
        streamTail: 0.0,
        streamAlpha: 1.0,
        mistAlpha: 0.75,
        impactIntensity: 1.0,
        bgFilterAlpha: 0.75,
        phaseId: "ice-impact-1",
        phaseName: "5. 대상 직격! 순백 섬광, 블루 틴트 & 극저온 서리 작렬",
      },
      // 6. [클라이맥스 2] 냉동광선 지속 직격 & 극저온 냉기 확산
      {
        ...baseFrame,
        delay: 85,
        ...attackerShake(-dir * 1, 0),
        ...(isHit ? targetShake(-dir * 4, 2) : {}),
        targetBlueTint: isHit,
        showEffect: true,
        moveStep: 6,
        streamHead: 1.10,
        streamTail: 0.15,
        streamAlpha: 0.95,
        mistAlpha: 0.85,
        impactIntensity: 1.0,
        bgFilterAlpha: 0.70,
        phaseId: "ice-impact-2",
        phaseName: "6. 냉동광선 지속 직격 & 극저온 냉기 확산",
      },
      // 7. [클라이맥스 3] 광선 분사 후미 쇄도 & 극저온 서리 농축
      {
        ...baseFrame,
        delay: 85,
        ...attackerShake(0, 0),
        ...(isHit ? targetShake(dir * 3, -1) : {}),
        targetBlueTint: isHit,
        showEffect: true,
        moveStep: 7,
        streamHead: 1.10,
        streamTail: 0.55,
        streamAlpha: 0.70,
        mistAlpha: 0.80,
        impactIntensity: 0.85,
        bgFilterAlpha: 0.42,
        phaseId: "ice-impact-3",
        phaseName: "7. 극저온 서리 농축 & 광선 종료",
      },
      // 8. [빙결 파열 1] 극저온 냉기 파열 & 다이아몬드 결정 비산 시작
      {
        ...baseFrame,
        delay: 80,
        ...attackerShake(0, 0),
        ...(isHit ? targetShake(-dir * 2, 1) : {}),
        targetBlueTint: isHit,
        showEffect: true,
        moveStep: 8,
        shatterProgress: 0.28,
        shatterAlpha: 1.0,
        mistAlpha: 0.80,
        bgFilterAlpha: 0.18,
        phaseId: "ice-shatter-1",
        phaseName: "8. 극저온 냉기 파열 & 다이아몬드 결정 비산",
      },
      // 9. [빙결 파열 2] 결정 파편 탄도 비산 & 다이아몬드 더스트 반짝임
      {
        ...baseFrame,
        delay: 80,
        ...attackerShake(0, 0),
        targetBlueTint: false,
        showEffect: true,
        moveStep: 9,
        shatterProgress: 0.60,
        shatterAlpha: 0.90,
        mistAlpha: 0.95,
        phaseId: "ice-shatter-2",
        phaseName: "9. 결정 파편 탄도 비산 & 다이아몬드 더스트",
      },
      // 10. [빙결 폭발 3] 파편 원거리 확산 & 서리 수증기 상승
      {
        ...baseFrame,
        delay: 80,
        ...attackerShake(0, 0),
        showEffect: true,
        moveStep: 10,
        shatterProgress: 0.88,
        shatterAlpha: 0.60,
        mistAlpha: 0.75,
        phaseId: "ice-shatter-3",
        phaseName: "10. 파편 원거리 확산 & 서리 수증기 상승",
      },
      // 11. 파편 소멸 & 잔여 서리 안개 기화 페이드아웃
      {
        ...baseFrame,
        delay: 75,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        moveStep: 11,
        shatterProgress: 1.0,
        shatterAlpha: 0.25,
        mistAlpha: 0.45,
        phaseId: "ice-mist-dissipate",
        phaseName: "11. 잔여 서리 안개 기화 페이드아웃",
      },
      // 12. 미세 서리 입자 소멸 및 피격자 자세 안정화
      {
        ...baseFrame,
        delay: 70,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        moveStep: 12,
        mistAlpha: 0.15,
        phaseId: "ice-recover",
        phaseName: "12. 미세 서리 입자 소멸 및 자세 안정화",
      },
      // 13. 기술 종료 및 기본 스탠스 복귀
      {
        ...baseFrame,
        delay: 65,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        moveStep: 13,
        phaseId: "ice-end",
        phaseName: "13. 기술 종료 및 기본 스탠스 복귀",
      },
    ];
  },
};
