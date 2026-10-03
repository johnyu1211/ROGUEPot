// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawFrostBreathBehindEffect,
  drawFrostBreathEffect,
} from "../../../renderers/moves/gen1/move521_524.js";

/**
 * 524: 얼음숨결 (Frost Breath) - 얼음 타입 특수 공격기 (위력 60 / 명중 90 / PP 10 / 반드시 급소)
 *
 * 연출 메커니즘:
 * 1. [냉기 들이쉬기] 시전자 깊은 들이쉬기/웅크림 & 입가 서리 연무/얼음 결정 응축 (1단계)
 * 2. [얼음숨결 제트 사출] 입에서 전방으로 점점 굵어지며 쇄도하는 고속 연속 얼음숨결 제트 스트림 (2단계)
 * 3. [상대 전신 차폐 & 지속 맹렬 분사] 숨결이 상대를 덮치고 Z축 뒤로 관통하며 지속 분사 + 급소 타격 섬광 & 한기 전율 (3단계)
 * 4. [분사 클라이맥스 & 스트림 후미 쇄도] 전신 차폐 완성 & 스트림 꼬리가 상대를 통과하며 얼음 조각 비산 (4단계)
 * 5. [상공 분산 & 복귀] 차가운 숨결이 상공으로 피어오르며 소멸 & 대상 오한 해소 후 정위치 복귀 (5단계)
 */
export const frostBreathMove: BattleMoveAnimation = {
  num: 524,
  key: "frost-breath",
  nameKo: "얼음숨결",
  nameEn: "Frost Breath",
  type: "ice",
  category: "special",
  camera: { type: "target", zoom: 1.28, delayUntilStep: 3 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawFrostBreathBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawFrostBreathEffect(targetCtx, frame, drawCtx);
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

    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const targetReact = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x, y } : { x: 0, y: 0 },
    });

    const tintBlue = (active: boolean) => ({
      targetBlueTint: active,
      pBlueTint: !isP ? active : false,
      eBlueTint: isP ? active : false,
    });

    return [
      // 1. 시전자 들이쉬기 시작 & 입가 서리 연무 피어오름
      {
        ...baseFrame,
        delay: 80,
        ...cOff(-4, 2),
        pScale: isP ? { x: 1.05, y: 0.95 } : undefined,
        eScale: !isP ? { x: 1.05, y: 0.95 } : undefined,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.35,
        phaseId: "frost-breath-inhale-1",
        phaseName: "1. 들이쉬기 시작 & 입가 서리 연무",
      },
      // 2. 깊은 웅크림 & 입가 차가운 냉기 응축 극대화
      {
        ...baseFrame,
        delay: 85,
        ...cOff(-7, 3),
        pScale: isP ? { x: 1.10, y: 0.90 } : undefined,
        eScale: !isP ? { x: 1.10, y: 0.90 } : undefined,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.85,
        phaseId: "frost-breath-inhale-2",
        phaseName: "2. 깊은 웅크림 & 냉기 응축",
      },
      // 3. 얼음숨결 제트 분출 개시
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
        phaseId: "frost-breath-exhale-1",
        phaseName: "3. 얼음숨결 제트 분출 개시",
      },
      // 4. 연속 얼음숨결 제트 팽창 전진
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
        phaseId: "frost-breath-exhale-2",
        phaseName: "4. 연속 얼음숨결 제트 팽창 전진",
      },
      // 5. 거대 얼음숨결 제트 상대 전방 쇄도 & 관통 시작
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
        phaseId: "frost-breath-exhale-3",
        phaseName: "5. 거대 얼음숨결 제트 상대 전방 쇄도 & 관통 시작",
      },
      // 6. [지속 분사 1] 대상 직격 관통 & Z축 뒤로 숨결 뿜어나감! (급소 직격 섬광)
      {
        ...baseFrame,
        delay: 90,
        ...targetReact(isHit ? -5 : 0, -2),
        ...cOff(-2, 1),
        ...tintBlue(isHit),
        hitFlash: isHit,
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.20,
        streamHead: 1.48,
        streamTail: 0.0,
        streamAlpha: 1.0,
        phaseId: "frost-breath-engulf-1",
        phaseName: "6. 대상 직격 관통 & Z축 뒤로 숨결 분출",
      },
      // 7. [지속 분사 2] 지속 관통 분사 2 & 대상 한기 전율
      {
        ...baseFrame,
        delay: 95,
        ...targetReact(isHit ? 4 : 0, 1),
        ...cOff(1, -1),
        ...tintBlue(isHit),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.48,
        streamHead: 1.50,
        streamTail: 0.0,
        streamAlpha: 1.0,
        phaseId: "frost-breath-engulf-2",
        phaseName: "7. 지속 관통 분사 2 & 대상 한기 전율",
      },
      // 8. [지속 분사 3] 지속 관통 분사 3 & Z축 후방 설연 전개
      {
        ...baseFrame,
        delay: 100,
        ...targetReact(isHit ? -3 : 0, 0),
        ...cOff(-1, 1),
        ...tintBlue(isHit),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.75,
        streamHead: 1.50,
        streamTail: 0.0,
        streamAlpha: 1.0,
        phaseId: "frost-breath-engulf-3",
        phaseName: "8. 지속 관통 분사 3 & Z축 후방 설연 전개",
      },
      // 9. [지속 분사 4] 지속 관통 분사 4 & 얼음 결정 비산
      {
        ...baseFrame,
        delay: 105,
        ...targetReact(isHit ? 2 : 0, 0),
        ...cOff(1, 0),
        ...tintBlue(isHit),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.98,
        streamHead: 1.50,
        streamTail: 0.0,
        streamAlpha: 1.0,
        phaseId: "frost-breath-engulf-4",
        phaseName: "9. 지속 관통 분사 4 & 얼음 결정 비산",
      },
      // 10. [클라이맥스 분사] 최대 출력 관통 방사 & 후미 이동
      {
        ...baseFrame,
        delay: 110,
        ...targetReact(isHit ? -2 : 0, 0),
        ...cOff(0, 0),
        ...tintBlue(isHit),
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.25,
        streamHead: 1.50,
        streamTail: 0.18,
        streamAlpha: 1.0,
        phaseId: "frost-breath-swirl-1",
        phaseName: "10. 최대 출력 관통 방사 & 후미 이동",
      },
      // 11. 시전자 분사 중단! 스트림 후미 관통 쇄도
      {
        ...baseFrame,
        delay: 110,
        ...targetReact(isHit ? 1 : 0, 0),
        ...cOff(0, 0),
        ...tintBlue(isHit),
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.60,
        streamHead: 1.50,
        streamTail: 0.60,
        streamAlpha: 0.88,
        phaseId: "frost-breath-swirl-2",
        phaseName: "11. 분사 중단 & 스트림 후미 관통 쇄도",
      },
      // 12. 스트림 후미 상대 관통 후 Z축 뒤로 통과 완료
      {
        ...baseFrame,
        delay: 110,
        ...targetReact(0, 0),
        ...cOff(0, 0),
        ...tintBlue(false),
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.88,
        streamHead: 1.50,
        streamTail: 1.15,
        streamAlpha: 0.40,
        phaseId: "frost-breath-swirl-3",
        phaseName: "12. 스트림 후미 Z축 뒤로 관통 완료",
      },
      // 13. 얼음숨결 상공 분산 & 서리 결정 승화
      {
        ...baseFrame,
        delay: 100,
        ...targetReact(0, 0),
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 5,
        effectProgress: 0.40,
        streamAlpha: 0.0,
        phaseId: "frost-breath-disperse-1",
        phaseName: "13. 얼음숨결 상공 분산 & 서리 결정 승화",
      },
      // 14. 완전 소멸 & 정위치 복귀
      {
        ...baseFrame,
        delay: 90,
        ...targetReact(0, 0),
        ...cOff(0, 0),
        showEffect: false,
        moveStep: 5,
        effectProgress: 0.90,
        phaseId: "frost-breath-end",
        phaseName: "14. 완전 소멸 & 정위치 복귀",
      },
    ];
  },
};
