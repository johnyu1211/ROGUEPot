// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawRestBehindEffect,
  drawRestEffect,
} from "../../../renderers/moves/gen1/move153_156.js";

/**
 * 156: 잠자기 (Rest) - 에스퍼 타입 변화기 (2턴간 수면 상태에 빠지며 HP 100% 완전 회복 & 상태이상 치유)
 *
 * 연출 구성:
 * 1. [잠에 빠져들기] 시전자가 피로에 스르륵 나른하게 웅크려지며 바닥에 몽환 수면 안개 발현
 * 2. [평온한 호흡 & Zzz 비상] 들숨과 날숨 주기에 맞춰 머리 위에서 알록달록 3단계 수면 비눗방울(z -> z -> Z) 피어오름
 * 3. [완전 회복 & 정화 펄스] 찬란한 에스퍼 핑크 + 에메랄드 민트 2중 힐링 펄스 폭발 & HP 100% 완전 회복 및 치유 십자성 분수
 * 4. [깊은 숙면 안착] 정화 에너지가 맑게 스며들고, 평화롭고 안락한 단잠에 안착
 */
export const restMove: BattleMoveAnimation = {
  num: 156,
  key: "rest",
  nameKo: "잠자기",
  nameEn: "Rest",
  type: "psychic",
  category: "status",
  camera: { type: "self", zoom: 1.25 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawRestBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawRestEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.25,
      pRot: 0,
      eRot: 0,
    };

    // 절대 규칙 2 준수: 시전자 전용 오프셋 헬퍼 (수비자는 절대 {0, 0} 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 시전자 전용 탄성/호흡 스케일 헬퍼
    const cScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    return [
      // =======================================================================
      // Phase 1: 잠에 빠져들기 (Falling Asleep / Drowsiness, Step 1)
      // =======================================================================
      // 1. 피로가 몰려오며 나른한 웅크림
      {
        ...baseFrame,
        delay: 100,
        ...cOff(0, 3),
        ...cScale(1.05, 0.95),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.20,
        phaseId: "rest-drowsy-1",
        phaseName: "1. 피로가 몰려오며 나른한 웅크림",
      },
      // 2. 스르륵 깊은 잠에 빠져듦 & 바닥 수면 안개 피어오름
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, 6),
        ...cScale(1.09, 0.91),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.60,
        phaseId: "rest-drowsy-2",
        phaseName: "2. 스르륵 깊은 잠에 빠져듦",
      },
      // 3. 바닥에 편안하게 안착 & 잠기운 오라 감돌기
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, 7),
        ...cScale(1.11, 0.89),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 1.0,
        phaseId: "rest-sleep-settle",
        phaseName: "3. 바닥에 편안하게 안착",
      },

      // =======================================================================
      // Phase 2: 평온한 호흡 & Zzz 비상 (Deep Sleep & Zzz Bubbles, Step 2)
      // =======================================================================
      // 4. 깊은 들숨 & 첫 번째 z 수면방울 피어오름
      {
        ...baseFrame,
        delay: 120,
        ...cOff(0, 4),
        ...cScale(1.04, 0.98),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.25,
        phaseId: "rest-breath-in-1",
        phaseName: "4. 깊은 들숨 & 첫 번째 z 수면방울 피어오름",
      },
      // 5. 정점 호흡 & 두 번째 z 수면방울 퐁!
      {
        ...baseFrame,
        delay: 120,
        ...cOff(0, 2),
        ...cScale(0.98, 1.03),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.50,
        phaseId: "rest-breath-peak",
        phaseName: "5. 정점 호흡 & 두 번째 z 수면방울 퐁!",
      },
      // 6. 편안한 날숨 & 세 번째 큰 Z 수면방울 비상
      {
        ...baseFrame,
        delay: 130,
        ...cOff(0, 6),
        ...cScale(1.08, 0.92),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.80,
        phaseId: "rest-breath-out-1",
        phaseName: "6. 편안한 날숨 & 세 번째 큰 Z 수면방울 비상",
      },
      // 7. Zzz 방울 몽환 비상 & 체내 치유 에너지 응축
      {
        ...baseFrame,
        delay: 120,
        ...cOff(0, 7),
        ...cScale(1.10, 0.90),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 1.0,
        phaseId: "rest-sleep-energy-gather",
        phaseName: "7. 수면 중 체내 치유 에너지 응축",
      },

      // =======================================================================
      // Phase 3: 완전 회복 & 정화 펄스 확산 (Full Restore & Cleansing Pulse, Step 3)
      // =======================================================================
      // 8. 정화 펄스 기폭 직전 힐링 코어 발광
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 5),
        ...cScale(1.04, 0.96),
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.15,
        phaseId: "rest-heal-ignite",
        phaseName: "8. 정화 펄스 기폭 직전 힐링 코어 발광",
      },
      // 9. ★ 힐링 펄스 대폭발 & HP 100% 완전 회복! (HP 게이지 풀 충전 & 수면 상태)
      {
        ...baseFrame,
        delay: 130,
        ...cOff(0, 2),
        ...cScale(1.06, 0.96),
        showEffect: true,
        hitFlash: false,
        playerHp: isP ? a.playerHpAfter : playerHp,
        enemyHp: !isP ? a.enemyHpAfter : enemyHp,
        playerStatus: isP ? "slp" : undefined,
        enemyStatus: !isP ? "slp" : undefined,
        moveStep: 3,
        effectProgress: 0.45,
        phaseId: "rest-heal-pulse-full",
        phaseName: "9. 힐링 펄스 대폭발 & HP 100% 완전 회복!",
      },
      // 10. 치유 십자성 분수 & 상태이상 정화
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, 4),
        ...cScale(1.04, 0.97),
        showEffect: true,
        hitFlash: false,
        playerHp: isP ? a.playerHpAfter : playerHp,
        enemyHp: !isP ? a.enemyHpAfter : enemyHp,
        playerStatus: isP ? "slp" : undefined,
        enemyStatus: !isP ? "slp" : undefined,
        moveStep: 3,
        effectProgress: 0.75,
        phaseId: "rest-heal-cross-burst",
        phaseName: "10. 치유 십자성 분수 & 상태이상 정화",
      },
      // 11. 정화 에너지 전신 흡수 완료
      {
        ...baseFrame,
        delay: 100,
        ...cOff(0, 6),
        ...cScale(1.08, 0.92),
        showEffect: true,
        hitFlash: false,
        playerHp: isP ? a.playerHpAfter : playerHp,
        enemyHp: !isP ? a.enemyHpAfter : enemyHp,
        playerStatus: isP ? "slp" : undefined,
        enemyStatus: !isP ? "slp" : undefined,
        moveStep: 3,
        effectProgress: 1.0,
        phaseId: "rest-heal-absorb",
        phaseName: "11. 정화 에너지 전신 흡수 완료",
      },

      // =======================================================================
      // Phase 4: 깊은 숙면 안착 (Restful Slumber, Step 4)
      // =======================================================================
      // 12. 완전 회복 후 깊고 편안한 단잠 안착 (작은 z 방울 피어오름)
      {
        ...baseFrame,
        delay: 120,
        ...cOff(0, 7),
        ...cScale(1.10, 0.90),
        showEffect: true,
        hitFlash: false,
        playerHp: isP ? a.playerHpAfter : playerHp,
        enemyHp: !isP ? a.enemyHpAfter : enemyHp,
        playerStatus: isP ? "slp" : undefined,
        enemyStatus: !isP ? "slp" : undefined,
        moveStep: 4,
        effectProgress: 0.40,
        phaseId: "rest-slumber-1",
        phaseName: "12. 완전 회복 후 깊고 편안한 단잠 안착",
      },
      // 13. 평화로운 숙면 상태 확립 및 완료
      {
        ...baseFrame,
        delay: 140,
        ...cOff(0, 6),
        ...cScale(1.08, 0.92),
        showEffect: true,
        hitFlash: false,
        playerHp: isP ? a.playerHpAfter : playerHp,
        enemyHp: !isP ? a.enemyHpAfter : enemyHp,
        playerStatus: isP ? "slp" : undefined,
        enemyStatus: !isP ? "slp" : undefined,
        moveStep: 4,
        effectProgress: 0.90,
        phaseId: "rest-slumber-complete",
        phaseName: "13. 평화로운 숙면 상태 확립 및 완료",
      },
    ];
  },
};
