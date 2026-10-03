// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawIcyWindBehindEffect,
  drawIcyWindEffect,
} from "../../../renderers/moves/gen1/move193_196.js";

/**
 * 196: 얼어붙은바람 (Icy Wind) - 얼음 타입 특수 공격기 (위력 55 / 명중 95 / PP 15 / 상대 스피드 1랭크 하락)
 *
 * 연출 특징:
 * 1. 얼음숨결 기반 기승전결
 * 2. 연기 뜨문뜨문 비어있게 (넓은 간격 & 빈 공간으로 차가운 바람결 표현)
 * 3. 암전효과 어둡게 20% (blackFadeAlpha: 0.20)
 * 4. 눈꽃 대신 그냥 흰색 동그라미 입자
 */
export const icyWindMove: BattleMoveAnimation = {
  num: 196,
  key: "icy-wind",
  nameKo: "얼어붙은바람",
  nameEn: "Icy Wind",
  type: "ice",
  category: "special",
  camera: { type: "target", zoom: 1.28, delayUntilStep: 3 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawIcyWindBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawIcyWindEffect(targetCtx, frame, drawCtx);
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

    const tintBlue = (_active: boolean) => ({
      targetBlueTint: false,
      pBlueTint: false,
      eBlueTint: false,
    });

    return [
      // 1. 시전자 냉기 모으기 & 입가 서리 (암전 시작)
      {
        ...baseFrame,
        delay: 80,
        ...cOff(-4, 2),
        pScale: isP ? { x: 1.05, y: 0.95 } : undefined,
        eScale: !isP ? { x: 1.05, y: 0.95 } : undefined,
        blackFadeAlpha: 0.12,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.35,
        phaseId: "icy-wind-windup-1",
        phaseName: "1. 냉기 모으기 & 입가 서리",
      },
      // 2. 웅크림 & 냉기 바람 축적 (암전 20% 도달)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(-7, 3),
        pScale: isP ? { x: 1.10, y: 0.90 } : undefined,
        eScale: !isP ? { x: 1.10, y: 0.90 } : undefined,
        blackFadeAlpha: 0.20,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.85,
        phaseId: "icy-wind-windup-2",
        phaseName: "2. 웅크림 & 냉기 바람 축적",
      },
      // 3. 얼어붙은 바람 방출 개시
      {
        ...baseFrame,
        delay: 70,
        ...cOff(-3, 1),
        pScale: isP ? { x: 0.96, y: 1.04 } : undefined,
        eScale: !isP ? { x: 0.96, y: 1.04 } : undefined,
        blackFadeAlpha: 0.20,
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.30,
        streamHead: 0.40,
        streamTail: 0.0,
        streamAlpha: 1.0,
        phaseId: "icy-wind-blast-1",
        phaseName: "3. 얼어붙은 바람 방출 개시",
      },
      // 4. 얼어붙은 바람 기류 전진
      {
        ...baseFrame,
        delay: 70,
        ...cOff(-1, 0),
        blackFadeAlpha: 0.20,
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.65,
        streamHead: 0.78,
        streamTail: 0.0,
        streamAlpha: 1.0,
        phaseId: "icy-wind-blast-2",
        phaseName: "4. 얼어붙은 바람 기류 전진",
      },
      // 5. 차가운 바람 상대 전방 쇄도
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        blackFadeAlpha: 0.20,
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.95,
        streamHead: 1.15,
        streamTail: 0.0,
        streamAlpha: 1.0,
        phaseId: "icy-wind-blast-3",
        phaseName: "5. 바람 상대 전방 쇄도",
      },
      // 6. [지속 바람 1] 대상 직격 & 차가운 바람 강타 (섬광 & 한기 전율)
      {
        ...baseFrame,
        delay: 90,
        ...targetReact(isHit ? -5 : 0, -2),
        ...cOff(-2, 1),
        ...tintBlue(isHit),
        hitFlash: isHit,
        blackFadeAlpha: 0.20,
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.20,
        streamHead: 1.48,
        streamTail: 0.0,
        streamAlpha: 1.0,
        phaseId: "icy-wind-hit-1",
        phaseName: "6. 대상 직격 & 차가운 바람 강타",
      },
      // 7. [지속 바람 2] 한기 전율 & 냉기 강타 지속
      {
        ...baseFrame,
        delay: 95,
        ...targetReact(isHit ? 4 : 0, 1),
        ...cOff(1, -1),
        ...tintBlue(isHit),
        blackFadeAlpha: 0.20,
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.48,
        streamHead: 1.50,
        streamTail: 0.0,
        streamAlpha: 1.0,
        phaseId: "icy-wind-hit-2",
        phaseName: "7. 한기 전율 & 냉기 강타 지속",
      },
      // 8. [지속 바람 3] 냉기 바람 지속 & 흰색 동그라미 입자 비산
      {
        ...baseFrame,
        delay: 100,
        ...targetReact(isHit ? -3 : 0, 0),
        ...cOff(-1, 1),
        ...tintBlue(isHit),
        blackFadeAlpha: 0.20,
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.75,
        streamHead: 1.50,
        streamTail: 0.0,
        streamAlpha: 1.0,
        phaseId: "icy-wind-hit-3",
        phaseName: "8. 냉기 바람 지속 & 흰색 동그라미 비산",
      },
      // 9. [지속 바람 4] 지속 강타 4 & 동그라미 흩날림
      {
        ...baseFrame,
        delay: 105,
        ...targetReact(isHit ? 2 : 0, 0),
        ...cOff(1, 0),
        ...tintBlue(isHit),
        blackFadeAlpha: 0.20,
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.98,
        streamHead: 1.50,
        streamTail: 0.0,
        streamAlpha: 1.0,
        phaseId: "icy-wind-hit-4",
        phaseName: "9. 지속 강타 4 & 동그라미 흩날림",
      },
      // 10. 바람 꼬리 이동 & 통과 시작
      {
        ...baseFrame,
        delay: 110,
        ...targetReact(isHit ? -2 : 0, 0),
        ...cOff(0, 0),
        ...tintBlue(isHit),
        blackFadeAlpha: 0.20,
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.25,
        streamHead: 1.50,
        streamTail: 0.18,
        streamAlpha: 1.0,
        phaseId: "icy-wind-tail-1",
        phaseName: "10. 바람 꼬리 이동 & 통과 시작",
      },
      // 11. 시전자 방출 완료 & 바람 꼬리 쇄도
      {
        ...baseFrame,
        delay: 110,
        ...targetReact(isHit ? 1 : 0, 0),
        ...cOff(0, 0),
        ...tintBlue(isHit),
        blackFadeAlpha: 0.20,
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.60,
        streamHead: 1.50,
        streamTail: 0.60,
        streamAlpha: 0.88,
        phaseId: "icy-wind-tail-2",
        phaseName: "11. 방출 완료 & 바람 꼬리 쇄도",
      },
      // 12. 바람 꼬리 관통 완료
      {
        ...baseFrame,
        delay: 110,
        ...targetReact(0, 0),
        ...cOff(0, 0),
        ...tintBlue(false),
        blackFadeAlpha: 0.15,
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.88,
        streamHead: 1.50,
        streamTail: 1.15,
        streamAlpha: 0.40,
        phaseId: "icy-wind-tail-3",
        phaseName: "12. 바람 꼬리 관통 완료",
      },
      // 13. 냉기 상공 분산 & 바람 소멸
      {
        ...baseFrame,
        delay: 100,
        ...targetReact(0, 0),
        ...cOff(0, 0),
        blackFadeAlpha: 0.08,
        showEffect: true,
        moveStep: 5,
        effectProgress: 0.40,
        streamAlpha: 0.0,
        phaseId: "icy-wind-disperse",
        phaseName: "13. 냉기 상공 분산 & 바람 소멸",
      },
      // 14~17. 타격 후 상대방 스피드 1랭크 하락 (디버프 파티클)
      ...(isHit ? [
        {
          ...baseFrame,
          delay: 95,
          ...targetReact(isP ? 3 : -3, 0),
          blackFadeAlpha: 0.00,
          showEffect: false,
          statProgress: 0.22,
          statDirection: "down" as const,
          moveStep: 5,
          phaseId: "icy-wind-debuff-1",
          phaseName: "14. 상대방 스피드 하락 개시",
        },
        {
          ...baseFrame,
          delay: 95,
          ...targetReact(isP ? -2 : 2, 0),
          blackFadeAlpha: 0.00,
          showEffect: false,
          statProgress: 0.50,
          statDirection: "down" as const,
          moveStep: 5,
          phaseId: "icy-wind-debuff-2",
          phaseName: "15. 스피드 하락 가속",
        },
        {
          ...baseFrame,
          delay: 95,
          ...targetReact(0, 0),
          blackFadeAlpha: 0.00,
          showEffect: false,
          statProgress: 0.78,
          statDirection: "down" as const,
          moveStep: 5,
          phaseId: "icy-wind-debuff-3",
          phaseName: "16. 스피드 하락 연쇄 파동",
        },
        {
          ...baseFrame,
          delay: 100,
          ...targetReact(0, 0),
          blackFadeAlpha: 0.00,
          showEffect: false,
          statProgress: 0.98,
          statDirection: "down" as const,
          moveStep: 5,
          phaseId: "icy-wind-debuff-finish",
          phaseName: "17. 스피드 하락 완료",
        },
      ] : []),
      // 18. 완전 소멸 & 정위치 복귀 (암전 0%)
      {
        ...baseFrame,
        delay: 90,
        ...targetReact(0, 0),
        ...cOff(0, 0),
        blackFadeAlpha: 0.00,
        showEffect: false,
        moveStep: 5,
        effectProgress: 0.90,
        phaseId: "icy-wind-end",
        phaseName: "18. 완전 소멸 & 정위치 복귀",
      },
    ];
  },
};
