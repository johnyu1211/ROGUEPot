// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawSingEffect } from "../../../renderers/moves/gen1/move045_048.js";

/**
 * 047: 노래하기 (Sing)
 * 
 * Concept (유저 요구사항 100% 반영):
 * - 서서히 배경이 반투명 연분홍빛 20% 물듦
 * - 검정색 음표 SVG(단순 플랫 검정, 하이라이트 없음)가 대상 포켓몬 스프라이트 중간으로 들어감
 * - 이후 상대 포켓몬 잠듦 상태 (머리 숙임 + Zzz 수면 기포 피어오름)
 */
export const singMove: BattleMoveAnimation = {
  num: 47,
  key: "sing",
  nameKo: "노래하기",
  nameEn: "Sing",
  type: "normal",
  category: "status",
  camera: { type: "target", zoom: 1.30 },
  drawEffect: drawSingEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    return [
      // 1. 시전자 노래 시작 (호흡 가다듬기 & 은은한 연분홍빛 발생)
      {
        ...baseFrame,
        delay: 80,
        pOffset: isP ? { x: 0, y: -2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -2 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.98, y: 1.02 } : undefined,
        eScale: !isP ? { x: 0.98, y: 1.02 } : undefined,
        showEffect: true,
        moveStep: 1,
        leaderT: 0.16,
        pinkAlpha: 0.05,
        phaseId: "sing-start",
        phaseName: "1. 노래 시작 (멜로디 발생)",
      },
      // 2. 1번째 음표 사출 & 2번째 음표 발현 (시전자 나른한 바운스)
      {
        ...baseFrame,
        delay: 80,
        pOffset: isP ? { x: 0, y: -4 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -4 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.96, y: 1.04 } : undefined,
        eScale: !isP ? { x: 0.96, y: 1.04 } : undefined,
        showEffect: true,
        moveStep: 2,
        leaderT: 0.30,
        pinkAlpha: 0.10,
        phaseId: "sing-melody-1",
        phaseName: "2. 멜로디 1차 유영",
      },
      // 3. 3번째 음표 발현 & 일렬 대열 형성 (시전자 좌우 살랑거림)
      {
        ...baseFrame,
        delay: 85,
        pOffset: isP ? { x: 0, y: -2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -2 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.02, y: 0.98 } : undefined,
        eScale: !isP ? { x: 1.02, y: 0.98 } : undefined,
        showEffect: true,
        moveStep: 3,
        leaderT: 0.44,
        pinkAlpha: 0.14,
        phaseId: "sing-melody-2",
        phaseName: "3. 멜로디 일렬 대열 형성",
      },
      // 4. 4개 음표 완성 & 전장 가로질러 살랑살랑 유영
      {
        ...baseFrame,
        delay: 85,
        pOffset: isP ? { x: 0, y: -1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -1 } : { x: 0, y: 0 },
        showEffect: true,
        moveStep: 4,
        leaderT: 0.58,
        pinkAlpha: 0.18,
        phaseId: "sing-float-1",
        phaseName: "4. 멜로디 파동 부유",
      },
      // 5. 음표들 둥실둥실 전진 (연분홍 20% 도달)
      {
        ...baseFrame,
        delay: 85,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        moveStep: 5,
        leaderT: 0.72,
        pinkAlpha: 0.20,
        phaseId: "sing-float-2",
        phaseName: "5. 멜로디 전진 비행",
      },
      // 6. 선두 음표 대상 포켓몬 도착 & 대상 나른한 반응 시작 (미세 고개 끄덕)
      {
        ...baseFrame,
        delay: 85,
        pOffset: isP ? { x: 0, y: 0 } : { x: 0, y: 1 },
        eOffset: !isP ? { x: 0, y: 0 } : { x: 0, y: 1 },
        pRot: !isP ? -0.01 : 0,
        eRot: isP ? -0.01 : 0,
        showEffect: true,
        moveStep: 6,
        leaderT: 0.86,
        pinkAlpha: 0.20,
        phaseId: "sing-reach",
        phaseName: "6. 대상 포켓몬 도달",
      },
      // 7. 선두 음표 체내 스며듦 & 2번째 음표 도착 & 대상 고개 살짝 숙임
      {
        ...baseFrame,
        delay: 85,
        pOffset: isP ? { x: 0, y: 0 } : { x: 0, y: 2 },
        eOffset: !isP ? { x: 0, y: 0 } : { x: 0, y: 2 },
        pRot: !isP ? -0.02 : 0,
        eRot: isP ? -0.02 : 0,
        showEffect: true,
        moveStep: 7,
        leaderT: 1.00,
        pinkAlpha: 0.20,
        phaseId: "sing-seep-1",
        phaseName: "7. 1차 음표 스며듦",
      },
      // 8. 2번째 음표 스며듦 & 3번째 음표 도착 & 대상 졸음 심화
      {
        ...baseFrame,
        delay: 85,
        pOffset: isP ? { x: 0, y: 0 } : { x: 0, y: 4 },
        eOffset: !isP ? { x: 0, y: 0 } : { x: 0, y: 4 },
        pRot: !isP ? -0.03 : 0,
        eRot: isP ? -0.03 : 0,
        showEffect: true,
        moveStep: 8,
        leaderT: 1.14,
        pinkAlpha: 0.20,
        phaseId: "sing-seep-2",
        phaseName: "8. 2차 음표 스며듦",
      },
      // 9. 3번째 음표 스며듦 & 4번째 음표 도착 & 대상 몸 주저앉음
      {
        ...baseFrame,
        delay: 85,
        pOffset: isP ? { x: 0, y: 0 } : { x: 0, y: 6 },
        eOffset: !isP ? { x: 0, y: 0 } : { x: 0, y: 6 },
        pRot: !isP ? -0.04 : 0,
        eRot: isP ? -0.04 : 0,
        showEffect: true,
        moveStep: 9,
        leaderT: 1.28,
        pinkAlpha: 0.20,
        phaseId: "sing-seep-3",
        phaseName: "9. 3차 음표 스며듦",
      },
      // 10. 4번째 마지막 음표 완벽 흡수 & 전신 수면 이완
      {
        ...baseFrame,
        delay: 90,
        pOffset: isP ? { x: 0, y: 0 } : { x: 0, y: 7 },
        eOffset: !isP ? { x: 0, y: 0 } : { x: 0, y: 7 },
        pRot: !isP ? -0.05 : 0,
        eRot: isP ? -0.05 : 0,
        showEffect: true,
        moveStep: 10,
        leaderT: 1.44,
        pinkAlpha: 0.20,
        phaseId: "sing-seep-finish",
        phaseName: "10. 전체 음표 흡수 완료",
      },
      // 11. 수면 돌입 (작은 z 피어오름 시작)
      {
        ...baseFrame,
        delay: 100,
        pOffset: isP ? { x: 0, y: 0 } : { x: 0, y: 8 },
        eOffset: !isP ? { x: 0, y: 0 } : { x: 0, y: 8 },
        pRot: !isP ? -0.05 : 0,
        eRot: isP ? -0.05 : 0,
        showEffect: true,
        moveStep: 11,
        leaderT: 2.0,
        sleepProgress: 0.25,
        pinkAlpha: 0.20,
        phaseId: "sing-sleep-start",
        phaseName: "11. 수면 돌입 (z 발생)",
      },
      // 12. 수면 심화 (중간 z 피어오름)
      {
        ...baseFrame,
        delay: 110,
        pOffset: isP ? { x: 0, y: 0 } : { x: 0, y: 8 },
        eOffset: !isP ? { x: 0, y: 0 } : { x: 0, y: 8 },
        pRot: !isP ? -0.05 : 0,
        eRot: isP ? -0.05 : 0,
        showEffect: true,
        moveStep: 12,
        sleepProgress: 0.45,
        pinkAlpha: 0.20,
        phaseId: "sing-sleep-mid",
        phaseName: "12. 수면 심화 (zz 부유)",
      },
      // 13. 깊은 잠듦 클라이맥스 (3개의 z, z, Z 동시 선명 표출!)
      {
        ...baseFrame,
        delay: 130,
        pOffset: isP ? { x: 0, y: 0 } : { x: 0, y: 8 },
        eOffset: !isP ? { x: 0, y: 0 } : { x: 0, y: 8 },
        pRot: !isP ? -0.05 : 0,
        eRot: isP ? -0.05 : 0,
        showEffect: true,
        moveStep: 13,
        sleepProgress: 0.65,
        pinkAlpha: 0.20,
        phaseId: "sing-sleep-climax",
        phaseName: "13. 깊은 잠듦 (3개 Zzz 동시 표출)",
      },
      // 14. 3개의 Zzz 유지 및 나른한 부유 홀드
      {
        ...baseFrame,
        delay: 130,
        pOffset: isP ? { x: 0, y: 0 } : { x: 0, y: 8 },
        eOffset: !isP ? { x: 0, y: 0 } : { x: 0, y: 8 },
        pRot: !isP ? -0.05 : 0,
        eRot: isP ? -0.05 : 0,
        showEffect: true,
        moveStep: 14,
        sleepProgress: 0.80,
        pinkAlpha: 0.20,
        phaseId: "sing-sleep-hold",
        phaseName: "14. 수면 유지",
      },
      // 15. 수면 안착 & 상단 Z 페이드아웃
      {
        ...baseFrame,
        delay: 120,
        pOffset: isP ? { x: 0, y: 0 } : { x: 0, y: 7 },
        eOffset: !isP ? { x: 0, y: 0 } : { x: 0, y: 7 },
        pRot: !isP ? -0.04 : 0,
        eRot: isP ? -0.04 : 0,
        showEffect: true,
        moveStep: 15,
        sleepProgress: 0.95,
        pinkAlpha: 0.12,
        phaseId: "sing-sleep-settle",
        phaseName: "15. 수면 상태 안착",
      },
      // 16. 평온한 마무리
      {
        ...baseFrame,
        delay: 130,
        pOffset: isP ? { x: 0, y: 0 } : { x: 0, y: 6 },
        eOffset: !isP ? { x: 0, y: 0 } : { x: 0, y: 6 },
        pRot: !isP ? -0.04 : 0,
        eRot: isP ? -0.04 : 0,
        showEffect: false,
        phaseId: "sing-finish",
        phaseName: "16. 기술 완료",
      },
    ];
  },
};
