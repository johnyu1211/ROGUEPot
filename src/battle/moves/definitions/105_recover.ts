// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawRecoverEffect } from "../../../renderers/moves/gen1/move105_108.js";

/**
 * 105: HP회복 (Recover) - 노말 타입 변화기 (최대 HP의 50% 회복)
 *
 * 연출 구성:
 * 1. 1차 치유 노란 구체 사방 출현 & 중심으로 유입 시동
 * 2. 1차 구체 쫀득한 신장 가속 & 2차 구체 시차 출현
 * 3. 1차 구체 몸체 착탄 흡수 발광 (탱탱겔 레퍼런스 체표면 발광 패치) & 2차 신장 가속
 * 4. 2차 구체 착탄 흡수 & 3차 구체 전방위 유입
 * 5. 3차 구체 쫀득한 중심 흡수 & 체내 힐링 에너지 고밀도 응축
 * 6. 전방위 치유 에너지 완전 흡수 & 전신 충전 발광
 * 7. 힐링 펄스 방출 & + 모양 빛 십자가(Radiant Light Cross) 다중 폭발
 * 8. 빛 십자가 사방 확산 & 골든 림 전개
 * 9. 빛 십자가 스파클 승화 및 하강
 * 10. 스타더스트 페이드 & 착지 안정
 * 11. HP 회복 완료 및 기본자세 복귀
 */
export const recoverMove: BattleMoveAnimation = {
  num: 105,
  key: "recover",
  nameKo: "HP회복",
  nameEn: "Recover",
  type: "normal",
  category: "status",
  camera: { type: "self", zoom: 1.25 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawRecoverEffect(targetCtx, frame, drawCtx);
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

    // 시전자 전용 오프셋 헬퍼 (수비자는 절대 {0,0} 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    return [
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.12,
        phaseId: "recover-pair1-spawn",
        phaseName: "1. 1차 원 2개 서서히 생성",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.22,
        phaseId: "recover-pair2-spawn-pair1-absorb",
        phaseName: "2. 2차 원 2개 생성 & 1차 원 몸체로 흡수 시작",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 1),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.32,
        phaseId: "recover-pair1-absorbing",
        phaseName: "3. 1차 원 몸체 착탄 흡수 중 & 체표면 발광",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.42,
        phaseId: "recover-pair3-spawn-pair2-absorb",
        phaseName: "4. 3차 원 2개 생성 & 2차 원 몸체로 흡수 시작 (1차 흡수 완료)",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 1),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.52,
        phaseId: "recover-pair2-absorbing",
        phaseName: "5. 2차 원 몸체 착탄 흡수 중 & 체표면 발광",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.62,
        phaseId: "recover-pair4-spawn-pair3-absorb",
        phaseName: "6. 4차 원 2개 생성 & 3차 원 몸체로 흡수 시작 (2차 흡수 완료)",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 1),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.72,
        phaseId: "recover-pair3-absorbing",
        phaseName: "7. 3차 원 몸체 착탄 흡수 중 & 4차 원 안착",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.82,
        phaseId: "recover-pair4-absorb",
        phaseName: "8. 4차 원 몸체로 흡수 시작 (3차 흡수 완료)",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 1),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.92,
        phaseId: "recover-pair4-absorbing",
        phaseName: "9. 4차 원 몸체 착탄 흡수 중 & 전신 힐링 발광",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 1.0,
        phaseId: "recover-all-absorbed",
        phaseName: "10. 전방위 8개 원 흡수 완료",
      },
      // Step 2: 회복별들이 1개씩 순차 출현하여 1열 종대로 시계방향 나선 상승 후 소멸
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.10,
        phaseId: "recover-stars-1",
        phaseName: "11. 1번 회복별 발밑 출현 & 시계방향 상승",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, -1),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.28,
        phaseId: "recover-stars-2",
        phaseName: "12. 2번 회복별 출현 & 1번 별 나선 선회",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, -1),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.48,
        phaseId: "recover-stars-3",
        phaseName: "13. 3번 회복별 출현 & 순차 나선 비상",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, -1),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.68,
        phaseId: "recover-stars-4",
        phaseName: "14. 4번 회복별 출현 & 선행 별 상공 페이드",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.88,
        phaseId: "recover-stars-fading",
        phaseName: "15. 잔여 회복별들 순차적 승화 소멸",
      },
      {
        ...baseFrame,
        delay: 60,
        ...cOff(0, 0),
        showEffect: false,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 1.0,
        phaseId: "recover-end",
        phaseName: "16. HP 회복 완료 및 기본자세 복귀",
      },
    ];
  },
};
