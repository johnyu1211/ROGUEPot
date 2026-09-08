// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawSonicBoomEffect } from "../../../renderers/moves/gen1/move049_052.js";

/**
 * 049: 소닉붐 (Sonic Boom)
 * 
 * Concept (유저 요구사항 100% 반영):
 * 1. 두꺼운 초승달 형태의 흰색 충격파 ) ) ) ) ) ) 가 적 방향을 향해 발사됨
 * 2. 색은 흰색 (앞은 100% 불투명, 뒤는 70% 반투명)
 * 3. 충격파 가로 폭 크기의 짧은 직선 잔상 (뒤쪽 투명 0%, 앞쪽 50% 반투명)
 * 4. 타격 지점에 아주 짧고 경쾌한 중심 투명 순백 확산 충격파
 */
export const sonicBoomMove: BattleMoveAnimation = {
  num: 49,
  key: "sonic-boom",
  nameKo: "소닉붐",
  nameEn: "Sonic Boom",
  type: "normal",
  category: "special",
  camera: { type: "target", zoom: 1.30 },
  drawEffect: drawSonicBoomEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    return [
      // 1. 시전자 순간 압축 모으기 & 1차 초승달 충격파 발사
      {
        ...baseFrame,
        delay: 70,
        pOffset: isP ? { x: -2, y: 1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 2, y: -1 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.04, y: 0.96 } : undefined,
        eScale: !isP ? { x: 1.04, y: 0.96 } : undefined,
        showEffect: true,
        moveStep: 1,
        leaderT: 0.25,
        phaseId: "sonic-boom-start",
        phaseName: "1. 소닉붐 발사 개시",
      },
      // 2. 2, 3차 초승달 충격파 넓은 간격 사출
      {
        ...baseFrame,
        delay: 70,
        pOffset: isP ? { x: 3, y: -2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -3, y: 2 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.96, y: 1.04 } : undefined,
        eScale: !isP ? { x: 0.96, y: 1.04 } : undefined,
        showEffect: true,
        moveStep: 2,
        leaderT: 0.50,
        phaseId: "sonic-boom-stream-1",
        phaseName: "2. 초음속 파동 연속 사출 1",
      },
      // 3. 4, 5차 초승달 충격파 사출 & 전장 쇄도
      {
        ...baseFrame,
        delay: 70,
        pOffset: isP ? { x: 1, y: -1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -1, y: 1 } : { x: 0, y: 0 },
        showEffect: true,
        moveStep: 3,
        leaderT: 0.75,
        phaseId: "sonic-boom-stream-2",
        phaseName: "3. 초음속 파동 연속 사출 2",
      },
      // 4. 1차 충격파 대상 도달 직격 & 6차 충격파 출발 (화면 가득 넓은 간격 대열)
      {
        ...baseFrame,
        delay: 70,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: 3, y: -1 } : { x: -3, y: 1 },
        showEffect: true,
        moveStep: 4,
        leaderT: 1.00,
        hitFlash: isHit,
        phaseId: "sonic-boom-impact-1",
        phaseName: "4. 선두 초승달 파동 직격",
      },
      // 5. 2차 충격파 대상 직격 & 흔들림
      {
        ...baseFrame,
        delay: 70,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: -3, y: 2 } : { x: 3, y: -2 },
        showEffect: true,
        moveStep: 5,
        leaderT: 1.25,
        phaseId: "sonic-boom-impact-2",
        phaseName: "5. 2차 파동 직격",
      },
      // 6. 3차 충격파 대상 직격 & 피격 히트플래시
      {
        ...baseFrame,
        delay: 70,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: 4, y: -1 } : { x: -4, y: 1 },
        showEffect: true,
        moveStep: 6,
        leaderT: 1.50,
        hitFlash: isHit,
        phaseId: "sonic-boom-impact-3",
        phaseName: "6. 3차 파동 연타",
      },
      // 7. 4차 충격파 대상 직격
      {
        ...baseFrame,
        delay: 70,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: -4, y: 1 } : { x: 4, y: -1 },
        showEffect: true,
        moveStep: 7,
        leaderT: 1.75,
        phaseId: "sonic-boom-impact-4",
        phaseName: "7. 4차 파동 연타",
      },
      // 8. 5차 충격파 대상 직격 & 진동
      {
        ...baseFrame,
        delay: 70,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: 3, y: -2 } : { x: -3, y: 2 },
        showEffect: true,
        moveStep: 8,
        leaderT: 2.00,
        phaseId: "sonic-boom-impact-5",
        phaseName: "8. 5차 파동 연타",
      },
      // 9. 6차(마지막) 초승달 충격파 강력 관통 직격
      {
        ...baseFrame,
        delay: 75,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: -4, y: 2 } : { x: 4, y: -2 },
        showEffect: true,
        moveStep: 9,
        leaderT: 2.22,
        hitFlash: isHit,
        phaseId: "sonic-boom-impact-final",
        phaseName: "9. 최종 초승달 파동 직격",
      },
      // 10. [타격 지점]: 아주 짧은 중심 투명 순백 확산 충격파 발생
      {
        ...baseFrame,
        delay: 65,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: 2, y: -1 } : { x: -2, y: 1 },
        showEffect: true,
        moveStep: 10,
        leaderT: 2.45,
        hollowShockwaveR: 24,
        shockwaveAlpha: 0.90,
        phaseId: "sonic-boom-burst-1",
        phaseName: "10. 중심 투명 순백 확산 충격파 발생",
      },
      // 11. 충격파 급속 팽창 (중심부 피격 포켓몬 투명 투영)
      {
        ...baseFrame,
        delay: 65,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: -1, y: 0 } : { x: 1, y: 0 },
        showEffect: true,
        moveStep: 11,
        leaderT: 2.60,
        hollowShockwaveR: 50,
        shockwaveAlpha: 0.60,
        phaseId: "sonic-boom-burst-2",
        phaseName: "11. 충격파 급속 팽창",
      },
      // 12. 충격파 소멸 (아주 짧게 소멸 완료)
      {
        ...baseFrame,
        delay: 60,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        moveStep: 12,
        hollowShockwaveR: 68,
        shockwaveAlpha: 0.15,
        phaseId: "sonic-boom-burst-fade",
        phaseName: "12. 충격파 순식간 소멸",
      },
      // 13. 정상 스탠스 안착 및 기술 완료
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        moveStep: 13,
        phaseId: "sonic-boom-end",
        phaseName: "13. 기술 완료",
      },
    ];
  },
};
