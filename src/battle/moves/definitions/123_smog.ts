// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawSmogBehindEffect,
  drawSmogEffect,
} from "../../../renderers/moves/gen1/move121_124.js";

/**
 * 123: 스모그 (Smog) - 독 타입 특수 기술 (위력 30, 명중 70%, 40% 독)
 *
 * 연출 구성 (마치 화염방사처럼 가스를 지속 분사 뿜어내듯이!):
 * 1. [들이쉬기] 시전자 깊은 들이쉬기/웅크림 & 입가 유독 가스 연무 응축 (2단계)
 * 2. [가스 제트 사출] 입에서 전방으로 점점 굵어지며 쇄도하는 고압 연속 독가스 제트 스트림 (3단계)
 * 3. [직격 착탄 & 입에서 지속 맹렬 분사!] 화염방사처럼 상대 정면을 타격하면서도 입에서 가스를 계속해서 뿜어냄 (4단계)
 * 4. [분사 클라이맥스 & 스트림 후미 분리] 전신 차폐 완성 ➔ 분사 중단 및 스트림 꼬리가 상대를 향해 빨려 들어감 (3단계)
 * 5. [FIFO 상공 분산] 먼저 도달한 가스부터 순차적으로 상공으로 피어오르며 소멸 및 복귀 (4단계)
 */
export const smogMove: BattleMoveAnimation = {
  num: 123,
  key: "smog",
  nameKo: "스모그",
  nameEn: "Smog",
  type: "poison",
  category: "special",
  camera: { type: "target", zoom: 1.28, delayUntilStep: 3 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawSmogBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawSmogEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.28,
      pRot: 0,
      eRot: 0,
    };

    // 시전자 전용 오프셋 헬퍼 (수비자는 절대 {0,0} 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 피격자(수비자) 전용 리액션 오프셋 헬퍼 (시전자는 절대 {0,0} 고정)
    const targetReact = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x, y } : { x: 0, y: 0 },
    });

    return [
      // 1. 시전자 들이쉬기 시작 & 입가 연무 피어오름
      {
        ...baseFrame,
        delay: 80,
        ...cOff(-4, 2),
        pScale: isP ? { x: 1.05, y: 0.95 } : undefined,
        eScale: !isP ? { x: 1.05, y: 0.95 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.35,
        phaseId: "smog-inhale-1",
        phaseName: "1. 들이쉬기 시작 & 입가 연무",
      },
      // 2. 깊은 웅크림 & 입가 유독 가스 응축 극대화
      {
        ...baseFrame,
        delay: 85,
        ...cOff(-7, 3),
        pScale: isP ? { x: 1.10, y: 0.90 } : undefined,
        eScale: !isP ? { x: 1.10, y: 0.90 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.85,
        phaseId: "smog-inhale-2",
        phaseName: "2. 깊은 웅크림 & 유독 가스 응축",
      },
      // 3. 독가스 제트 분출 개시 (화염방사처럼 고압 사출)
      {
        ...baseFrame,
        delay: 70,
        ...cOff(-3, 1),
        pScale: isP ? { x: 0.96, y: 1.04 } : undefined,
        eScale: !isP ? { x: 0.96, y: 1.04 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.30,
        streamHead: 0.40,
        streamTail: 0.0,
        streamAlpha: 1.0,
        phaseId: "smog-exhale-1",
        phaseName: "3. 독가스 제트 분출 개시",
      },
      // 4. 연속 가스 제트 팽창 전진
      {
        ...baseFrame,
        delay: 70,
        ...cOff(-1, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.65,
        streamHead: 0.78,
        streamTail: 0.0,
        streamAlpha: 1.0,
        phaseId: "smog-exhale-2",
        phaseName: "4. 연속 가스 제트 팽창 전진",
      },
      // 5. 거대 독가스 제트 상대 전방 육박
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.95,
        streamHead: 1.05,
        streamTail: 0.0,
        streamAlpha: 1.0,
        phaseId: "smog-exhale-3",
        phaseName: "5. 거대 독가스 제트 상대 전방 쇄도",
      },
      // 6. [지속 분사 1] 대상 직격 착탄 충격파 & 입에서 계속해서 뿜어냄!
      {
        ...baseFrame,
        delay: 90,
        ...targetReact(-5, -2),
        ...cOff(-2, 1),
        targetDarkLevel: 0.25,
        targetPurpleLevel: 0.35,
        showEffect: true,
        hitFlash: isHit,
        moveStep: 3,
        effectProgress: 0.20,
        streamHead: 1.10,
        streamTail: 0.0,
        streamAlpha: 1.0,
        phaseId: "smog-impact",
        phaseName: "6. 직격 충격파 & 독가스 지속 분사 1",
      },
      // 7. [지속 분사 2] 1차 가스 팽창 & 맹렬한 가스 방사 지속
      {
        ...baseFrame,
        delay: 95,
        ...targetReact(3, 1),
        ...cOff(1, -1),
        targetDarkLevel: 0.45,
        targetPurpleLevel: 0.55,
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.48,
        streamHead: 1.10,
        streamTail: 0.0,
        streamAlpha: 1.0,
        phaseId: "smog-engulf-1",
        phaseName: "7. 1차 가스 팽창 & 독가스 지속 분사 2",
      },
      // 8. [지속 분사 3] 2차 가스 전개 & 맹렬한 가스 방사 지속
      {
        ...baseFrame,
        delay: 100,
        ...targetReact(-3, 0),
        ...cOff(-1, 1),
        targetDarkLevel: 0.65,
        targetPurpleLevel: 0.75,
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.75,
        streamHead: 1.10,
        streamTail: 0.0,
        streamAlpha: 1.0,
        phaseId: "smog-engulf-2",
        phaseName: "8. 2차 가스 전개 & 독가스 지속 분사 3",
      },
      // 9. [지속 분사 4] 3차 독가스 발생 & 가스 지속 방출
      {
        ...baseFrame,
        delay: 105,
        ...targetReact(-1, 0),
        ...cOff(1, 0),
        targetDarkLevel: 0.80,
        targetPurpleLevel: 0.90,
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.98,
        streamHead: 1.10,
        streamTail: 0.0,
        streamAlpha: 1.0,
        phaseId: "smog-engulf-3",
        phaseName: "9. 가스 지속 방출 & 전신 차폐 전개",
      },
      // 10. [클라이맥스 분사] 최대 출력 방사 & 롤링 소용돌이
      {
        ...baseFrame,
        delay: 110,
        ...targetReact(-3, 0),
        ...cOff(0, 0),
        targetDarkLevel: 0.80,
        targetPurpleLevel: 0.90,
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.25,
        streamHead: 1.10,
        streamTail: 0.0,
        streamAlpha: 1.0,
        phaseId: "smog-swirl-1",
        phaseName: "10. 최대 출력 방사 & 롤링 소용돌이",
      },
      // 11. 시전자 분사 중단! 스트림 꼬리가 입을 떠나 상대로 쇄도
      {
        ...baseFrame,
        delay: 110,
        ...targetReact(2, 0),
        ...cOff(0, 0),
        targetDarkLevel: 0.75,
        targetPurpleLevel: 0.80,
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.60,
        streamHead: 1.10,
        streamTail: 0.45,
        streamAlpha: 0.88,
        phaseId: "smog-swirl-2",
        phaseName: "11. 분사 중단 & 스트림 후미 쇄도",
      },
      // 12. 스트림 후미 완전 격돌 & 전신 완전 차폐 소용돌이
      {
        ...baseFrame,
        delay: 110,
        ...targetReact(-1, 0),
        ...cOff(0, 0),
        targetDarkLevel: 0.65,
        targetPurpleLevel: 0.65,
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.88,
        streamHead: 1.10,
        streamTail: 0.90,
        streamAlpha: 0.65,
        phaseId: "smog-swirl-3",
        phaseName: "12. 스트림 후미 격돌 & 차폐 완성",
      },
      // 13. [스트림 종료] 상공 분산 시작 (1차 가스 소멸)
      {
        ...baseFrame,
        delay: 90,
        ...targetReact(0, 0),
        targetDarkLevel: 0.45,
        targetPurpleLevel: 0.45,
        showEffect: true,
        hitFlash: false,
        moveStep: 5,
        effectProgress: 0.30,
        streamHead: 0.0,
        streamTail: 0.0,
        streamAlpha: 0.0,
        phaseId: "smog-dissipate-1",
        phaseName: "13. 상공 분산 시작 (1차 가스 소멸)",
      },
      // 14. 2차 가스 소멸 & 3차 가스 상공 승화
      {
        ...baseFrame,
        delay: 85,
        ...targetReact(0, 0),
        targetDarkLevel: 0.25,
        targetPurpleLevel: 0.25,
        showEffect: true,
        hitFlash: false,
        moveStep: 5,
        effectProgress: 0.65,
        streamHead: 0.0,
        streamTail: 0.0,
        streamAlpha: 0.0,
        phaseId: "smog-dissipate-2",
        phaseName: "14. 2차 가스 소멸 & 3차 가스 상공 승화",
      },
      // 15. 잔여 가스 소산 & 시야 회복
      {
        ...baseFrame,
        delay: 75,
        ...targetReact(0, 0),
        targetDarkLevel: 0.08,
        targetPurpleLevel: 0.08,
        showEffect: true,
        hitFlash: false,
        moveStep: 5,
        effectProgress: 0.90,
        streamHead: 0.0,
        streamTail: 0.0,
        streamAlpha: 0.0,
        phaseId: "smog-dissipate-3",
        phaseName: "15. 잔여 가스 소산 & 시야 회복",
      },
      // 16. 완료 및 복귀
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 0),
        targetDarkLevel: 0.0,
        targetPurpleLevel: 0.0,
        showEffect: false,
        hitFlash: false,
        moveStep: 5,
        effectProgress: 1.0,
        streamHead: 0.0,
        streamTail: 0.0,
        streamAlpha: 0.0,
        phaseId: "smog-finish",
        phaseName: "16. 완료 및 복귀",
      },
    ];
  },
};
