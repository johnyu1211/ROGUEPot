// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawPoisonGasBehindEffect,
  drawPoisonGasEffect,
} from "../../../renderers/moves/gen1/move137_140.js";

/**
 * 139: 독가스 (Poison Gas) - 독 타입 변화기 (명중 90%, 100% 독 상태이상 부여)
 *
 * 스모그(Smog) 연출 메커니즘을 100% 참고하여 계승:
 * 1. [들이쉬기] 시전자 깊은 들이쉬기/웅크림 & 입가 유독 가스 연무 응축 (2단계)
 * 2. [가스 제트 사출] 입에서 전방으로 점점 굵어지며 쇄도하는 고압 연속 독가스 제트 스트림 (3단계)
 * 3. [상대 전신 차폐 & 지속 맹렬 분사] 가스가 상대를 덮치면서도 입에서 가스를 계속해서 뿜어냄 (4단계)
 * 4. [분사 클라이맥스 & 스트림 후미 쇄도] 전신 차폐 완성 & 스트림 꼬리가 상대를 향해 날아감 (3단계)
 * 5. [상공 분산 & 기침 전율] 가스가 상공으로 피어오르며 소멸 & 대상 독 기침 전율 후 복귀 (4단계)
 */
export const poisonGasMove: BattleMoveAnimation = {
  num: 139,
  key: "poison-gas",
  nameKo: "독가스",
  nameEn: "Poison Gas",
  type: "poison",
  category: "status",
  camera: { type: "target", zoom: 1.28, delayUntilStep: 3 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawPoisonGasBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawPoisonGasEffect(targetCtx, frame, drawCtx);
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
      hitFlash: false,
    };

    // 시전자 전용 오프셋 헬퍼
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 피격자(수비자) 전용 리액션 오프셋 헬퍼 (중독 기침/전율)
    const targetReact = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x, y } : { x: 0, y: 0 },
    });

    return [
      // 1. 시전자 들이쉬기 시작 & 입가 독기 연무 피어오름
      {
        ...baseFrame,
        delay: 80,
        ...cOff(-4, 2),
        pScale: isP ? { x: 1.05, y: 0.95 } : undefined,
        eScale: !isP ? { x: 1.05, y: 0.95 } : undefined,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.35,
        phaseId: "poison-gas-inhale-1",
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
        moveStep: 1,
        effectProgress: 0.85,
        phaseId: "poison-gas-inhale-2",
        phaseName: "2. 깊은 웅크림 & 유독 가스 응축",
      },
      // 3. 독가스 제트 분출 개시
      {
        ...baseFrame,
        delay: 70,
        ...cOff(-3, 1),
        pScale: isP ? { x: 0.96, y: 1.04 } : undefined,
        eScale: !isP ? { x: 0.96, y: 1.04 } : undefined,
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.30,
        streamHead: 0.40,
        streamTail: 0.0,
        streamAlpha: 1.0,
        phaseId: "poison-gas-exhale-1",
        phaseName: "3. 독가스 제트 분출 개시",
      },
      // 4. 연속 가스 제트 팽창 전진
      {
        ...baseFrame,
        delay: 70,
        ...cOff(-1, 0),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.65,
        streamHead: 0.78,
        streamTail: 0.0,
        streamAlpha: 1.0,
        phaseId: "poison-gas-exhale-2",
        phaseName: "4. 연속 가스 제트 팽창 전진",
      },
      // 5. 거대 독가스 제트 상대 전방 쇄도 & 스프라이트 관통 시작
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.95,
        streamHead: 1.15,
        streamTail: 0.0,
        streamAlpha: 1.0,
        phaseId: "poison-gas-exhale-3",
        phaseName: "5. 거대 독가스 제트 상대 전방 쇄도 & 관통 시작",
      },
      // 6. [지속 분사 1] 대상 직선 관통 & Z축 뒤로 가스 뿜어나감!
      {
        ...baseFrame,
        delay: 90,
        ...targetReact(isHit ? -4 : 0, -1),
        ...cOff(-2, 1),
        targetDarkLevel: 0.25,
        targetPurpleLevel: 0.35,
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.20,
        streamHead: 1.48,
        streamTail: 0.0,
        streamAlpha: 1.0,
        phaseId: "poison-gas-engulf-1",
        phaseName: "6. 대상 직선 관통 & Z축 뒤로 가스 분출",
      },
      // 7. [지속 분사 2] 지속 관통 분사 2 & 대상 중독 기침 전율
      {
        ...baseFrame,
        delay: 95,
        ...targetReact(isHit ? 3 : 0, 1),
        ...cOff(1, -1),
        targetDarkLevel: 0.45,
        targetPurpleLevel: 0.55,
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.48,
        streamHead: 1.50,
        streamTail: 0.0,
        streamAlpha: 1.0,
        phaseId: "poison-gas-engulf-2",
        phaseName: "7. 지속 관통 분사 2 & 대상 중독 기침 전율",
      },
      // 8. [지속 분사 3] 지속 관통 분사 3 & Z축 후방 독무 전개
      {
        ...baseFrame,
        delay: 100,
        ...targetReact(isHit ? -3 : 0, 0),
        ...cOff(-1, 1),
        targetDarkLevel: 0.65,
        targetPurpleLevel: 0.75,
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.75,
        streamHead: 1.50,
        streamTail: 0.0,
        streamAlpha: 1.0,
        phaseId: "poison-gas-engulf-3",
        phaseName: "8. 지속 관통 분사 3 & Z축 후방 독무 전개",
      },
      // 9. [지속 분사 4] 지속 관통 분사 4 & 독 기포 비산
      {
        ...baseFrame,
        delay: 105,
        ...targetReact(isHit ? 2 : 0, 0),
        ...cOff(1, 0),
        targetDarkLevel: 0.80,
        targetPurpleLevel: 0.90,
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.98,
        streamHead: 1.50,
        streamTail: 0.0,
        streamAlpha: 1.0,
        phaseId: "poison-gas-engulf-4",
        phaseName: "9. 지속 관통 분사 4 & 독 기포 비산",
      },
      // 10. [클라이맥스 분사] 최대 출력 관통 방사 & 후미 이동
      {
        ...baseFrame,
        delay: 110,
        ...targetReact(isHit ? -2 : 0, 0),
        ...cOff(0, 0),
        targetDarkLevel: 0.80,
        targetPurpleLevel: 0.90,
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.25,
        streamHead: 1.50,
        streamTail: 0.18,
        streamAlpha: 1.0,
        phaseId: "poison-gas-swirl-1",
        phaseName: "10. 최대 출력 관통 방사 & 후미 이동",
      },
      // 11. 시전자 분사 중단! 스트림 후미 관통 쇄도
      {
        ...baseFrame,
        delay: 110,
        ...targetReact(isHit ? 1 : 0, 0),
        ...cOff(0, 0),
        targetDarkLevel: 0.75,
        targetPurpleLevel: 0.80,
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.60,
        streamHead: 1.50,
        streamTail: 0.60,
        streamAlpha: 0.88,
        phaseId: "poison-gas-swirl-2",
        phaseName: "11. 분사 중단 & 스트림 후미 관통 쇄도",
      },
      // 12. 스트림 후미 상대 관통 후 Z축 뒤로 통과 완료
      {
        ...baseFrame,
        delay: 110,
        ...targetReact(0, 0),
        ...cOff(0, 0),
        targetDarkLevel: 0.65,
        targetPurpleLevel: 0.65,
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.88,
        streamHead: 1.50,
        streamTail: 1.15,
        streamAlpha: 0.65,
        phaseId: "poison-gas-swirl-3",
        phaseName: "12. 스트림 후미 상대 관통 후 Z축 뒤로 통과 완료",
      },
      // 13. [스트림 종료] 상공 분산 시작 (1차 가스 소멸 & 독 기포 승화)
      {
        ...baseFrame,
        delay: 90,
        ...targetReact(0, 0),
        targetDarkLevel: 0.45,
        targetPurpleLevel: 0.45,
        showEffect: true,
        moveStep: 5,
        effectProgress: 0.30,
        streamHead: 0.0,
        streamTail: 0.0,
        streamAlpha: 0.0,
        phaseId: "poison-gas-dissipate-1",
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
        moveStep: 5,
        effectProgress: 0.65,
        streamHead: 0.0,
        streamTail: 0.0,
        streamAlpha: 0.0,
        phaseId: "poison-gas-dissipate-2",
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
        moveStep: 5,
        effectProgress: 0.90,
        streamHead: 0.0,
        streamTail: 0.0,
        streamAlpha: 0.0,
        phaseId: "poison-gas-dissipate-3",
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
        afterCameraReturn: true,
        moveStep: 5,
        effectProgress: 1.0,
        streamHead: 0.0,
        streamTail: 0.0,
        streamAlpha: 0.0,
        phaseId: "poison-gas-finish",
        phaseName: "16. 완료 및 복귀",
      },
    ];
  },
};
