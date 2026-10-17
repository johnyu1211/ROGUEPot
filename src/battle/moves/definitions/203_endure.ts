// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawEndureEffect } from "../../../renderers/moves/gen1/move201_204.js";

/**
 * 203: 버티기 (Endure) - 노말 타입 변화 기술 (우선도 +4)
 *
 * 위력: — / 명중: — / PP: 10 / 우선도: +4 / 접촉 판정: X
 * 설명: 공격을 받아도 HP를 반드시 1만큼은 남긴다. 연속으로 쓰면 실패하기 쉽다.
 *
 * [유저 지정 연출]:
 * 사용 시 페이드인 페이드아웃으로 시전 포켓몬 빨갛게 필터 적용 2회
 */
export const endureMove: BattleMoveAnimation = {
  num: 203,
  key: "endure",
  nameKo: "버티기",
  nameEn: "Endure",
  type: "normal",
  category: "status",
  camera: { type: "self", zoom: 1.25 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawEndureEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.25,
      cameraTrackAttacker: true,
      isAttackerPlayer: isP,
      drawCasterAboveFade: false,
      pRot: 0,
      eRot: 0,
      hitFlash: false,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
    };

    // 시전자 전용 오프셋 헬퍼 (수비자는 절대 {0,0} 고정, 시전자는 좌우 떨림 및 살짝 웅크림)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y } : { x: 0, y: 0 },
    });

    // 시전자 전용 스케일 헬퍼 (납작하게 힘주기)
    const cScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    // 시전자 순수 붉은색 염색 헬퍼 (불꽃/주황색 왜곡 없이 포켓몬 본체를 순수 붉은색으로 물들임)
    const casterRedHelper = (lvl: number) => {
      const active = lvl > 0.01;
      const alpha = Math.max(0, Math.min(0.85, lvl * 0.85));
      const color = active ? `rgba(220, 20, 40, ${alpha.toFixed(2)})` : null;
      return {
        pTintColor: isP ? color : undefined,
        eTintColor: !isP ? color : undefined,
        casterRedTint: false,
        casterRedLevel: 0,
        pRedTint: false,
        eRedTint: false,
        targetRedTint: false,
      };
    };

    return [
      // =======================================================================
      // [1회차]: 납작하게 웅크리고 좌우로 바들바들 떨며 1차 붉은 물들기
      // =======================================================================
      // #1. 1차 버티기 시동: 납작 웅크림 & 좌측 떨림 & 붉은 기운 페이드인 (1/2)
      {
        ...baseFrame,
        delay: 50,
        ...cOff(-2, 2),
        ...cScale(1.07, 0.93),
        ...casterRedHelper(0.30),
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.20,
        endureProgress: 0.08,
        phaseId: "endure-pulse-1-in-1",
        phaseName: "#1. 1차 버티기 시동 (페이드인 1/2)",
      },
      // #2. 1차 버티기 심화: 우측 떨림 & 붉은빛 고조 (2/2)
      {
        ...baseFrame,
        delay: 50,
        ...cOff(2, 2),
        ...cScale(1.08, 0.92),
        ...casterRedHelper(0.70),
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.60,
        endureProgress: 0.16,
        phaseId: "endure-pulse-1-in-2",
        phaseName: "#2. 1차 버티기 심화 (페이드인 2/2)",
      },
      // #3. 1차 버티기 피크: 좌측 떨림 & 전신 강렬한 진홍빛 물들기 극대화!
      {
        ...baseFrame,
        delay: 60,
        ...cOff(-3, 2),
        ...cScale(1.08, 0.92),
        ...casterRedHelper(1.0),
        showEffect: true,
        moveStep: 1,
        effectProgress: 1.0,
        endureProgress: 0.25,
        phaseId: "endure-pulse-1-peak",
        phaseName: "#3. 1차 붉은 필터 피크",
      },
      // #4. 1차 버티기 페이드아웃 (1/2): 우측 떨림 & 붉은빛 감쇄
      {
        ...baseFrame,
        delay: 50,
        ...cOff(2, 2),
        ...cScale(1.08, 0.92),
        ...casterRedHelper(0.70),
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.80,
        endureProgress: 0.34,
        phaseId: "endure-pulse-1-out-1",
        phaseName: "#4. 1차 붉은 필터 페이드아웃 (1/2)",
      },
      // #5. 1차 버티기 페이드아웃 (2/2): 좌측 떨림 & 미세 잔광
      {
        ...baseFrame,
        delay: 50,
        ...cOff(-2, 2),
        ...cScale(1.08, 0.92),
        ...casterRedHelper(0.30),
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.40,
        endureProgress: 0.42,
        phaseId: "endure-pulse-1-out-2",
        phaseName: "#5. 1차 붉은 필터 페이드아웃 (2/2)",
      },
      // #6. 1차 완료 ➔ 2차 연결 구간: 우측 떨림 & 납작한 버티기 긴장 유지!
      {
        ...baseFrame,
        delay: 50,
        ...cOff(2, 2),
        ...cScale(1.08, 0.92),
        ...casterRedHelper(0.0),
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.0,
        endureProgress: 0.50,
        phaseId: "endure-pulse-1-clear",
        phaseName: "#6. 1차 필터 해제 (긴장 유지)",
      },

      // =======================================================================
      // [2회차]: 납작 웅크림과 좌우 떨림 지속 상태에서 2차 붉은 물들기
      // =======================================================================
      // #7. 2차 버티기 재돌입: 좌측 떨림 & 붉은빛 재점화 (1/2)
      {
        ...baseFrame,
        delay: 50,
        ...cOff(-2, 2),
        ...cScale(1.08, 0.92),
        ...casterRedHelper(0.35),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.25,
        endureProgress: 0.58,
        phaseId: "endure-pulse-2-in-1",
        phaseName: "#7. 2차 버티기 재돌입 (페이드인 1/2)",
      },
      // #8. 2차 버티기 심화: 우측 떨림 & 극한의 힘 축적으로 붉은빛 확산 (2/2)
      {
        ...baseFrame,
        delay: 50,
        ...cOff(3, 2),
        ...cScale(1.08, 0.92),
        ...casterRedHelper(0.75),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.65,
        endureProgress: 0.67,
        phaseId: "endure-pulse-2-in-2",
        phaseName: "#8. 2차 버티기 심화 (페이드인 2/2)",
      },
      // #9. 2차 버티기 피크: 좌측 떨림 & 버티기 의지 폭발! 전신 붉은빛 극대화!
      {
        ...baseFrame,
        delay: 60,
        ...cOff(-3, 2),
        ...cScale(1.08, 0.92),
        ...casterRedHelper(1.0),
        showEffect: true,
        moveStep: 2,
        effectProgress: 1.0,
        endureProgress: 0.76,
        phaseId: "endure-pulse-2-peak",
        phaseName: "#9. 2차 붉은 필터 피크",
      },
      // #10. 2차 버티기 페이드아웃 (1/2): 우측 떨림 & 완화 시작
      {
        ...baseFrame,
        delay: 50,
        ...cOff(2, 2),
        ...cScale(1.08, 0.92),
        ...casterRedHelper(0.70),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.70,
        endureProgress: 0.85,
        phaseId: "endure-pulse-2-out-1",
        phaseName: "#10. 2차 붉은 필터 페이드아웃 (1/2)",
      },
      // #11. 2차 버티기 페이드아웃 (2/2): 좌측 미세 떨림 & 은은한 마무리 잔광
      {
        ...baseFrame,
        delay: 50,
        ...cOff(-1, 1),
        ...cScale(1.05, 0.95),
        ...casterRedHelper(0.30),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.30,
        endureProgress: 0.94,
        phaseId: "endure-pulse-2-out-2",
        phaseName: "#11. 2차 붉은 필터 페이드아웃 (2/2)",
      },
      // #12. 버티기 태세 완비 & 정착 복귀 (Glide-Out 연결)
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...casterRedHelper(0.0),
        showEffect: false,
        moveStep: 2,
        effectProgress: 0.0,
        endureProgress: 1.0,
        phaseId: "endure-settle",
        phaseName: "#12. 버티기 태세 완료 & 복귀",
      },
    ];
  },
};
