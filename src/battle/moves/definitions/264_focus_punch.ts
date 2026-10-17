// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawFocusPunchBehindEffect,
  drawFocusPunchEffect,
} from "../../../renderers/moves/gen1/move261_264.js";

/**
 * 264: 힘껏펀치 (Focus Punch / きあいパンチ) - 격투 타입 물리 기술
 *
 * 위력: 150 / 명중: 100 / PP: 20
 * 설명: 턴 시작 시 집중을 시작하여 마지막에 공격한다. 공격 전에 데미지를 입으면 집중이 풀려 실패한다.
 *
 * [유저 지정 연출]:
 * - 시전포켓몬 포커싱
 * - > 연한빨강, 연한 노랑으로 이루어진 선들이 위로 올라감.
 * - (이거 먼저 구현)
 */
export const focusPunchMove: BattleMoveAnimation = {
  num: 264,
  key: "focus-punch",
  nameKo: "힘껏펀치",
  nameEn: "Focus Punch",
  type: "fighting",
  category: "physical",
  camera: {
    type: "caster_to_target", // 1단계: 시전자 기 모으기 -> 2단계: 상대방 타겟 록온 (원작 구도)
    zoom: 1.25,
    focalRatio: 0.48,
    delayUntilStep: 2,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (frame.afterCameraReturn) return;
    if (frame.moveStep !== 1 && frame.moveStep !== 2) return;
    if (frame.phaseId && (
      frame.phaseId.includes("camera-") ||
      frame.phaseId.includes("damage-blink") ||
      frame.phaseId.includes("hp-drain") ||
      frame.phaseId.includes("hp-recovery") ||
      frame.phaseId.includes("neutral") ||
      frame.phaseId.includes("recoil")
    )) return;
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawFocusPunchBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (frame.afterCameraReturn) return;
    if (frame.moveStep !== 1 && frame.moveStep !== 2) return;
    if (frame.phaseId && (
      frame.phaseId.includes("camera-") ||
      frame.phaseId.includes("damage-blink") ||
      frame.phaseId.includes("hp-drain") ||
      frame.phaseId.includes("hp-recovery") ||
      frame.phaseId.includes("neutral") ||
      frame.phaseId.includes("recoil")
    )) return;
    if (!frame.showEffect) return;
    drawFocusPunchEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      cameraZoom: 1.30,
      showEffect: true,
      showBehindEffect: true,
    };

    // 시전자 전용 오프셋
    const cOff = (x: number, y: number) =>
      isP ? { pOffset: { x, y } } : { eOffset: { x: -x, y: -y } };

    // 시전자 스케일 및 틸트 (집중 호흡 스쿼시 & 스트레치)
    const cTransform = (scaleX: number, scaleY: number, rot: number = 0) => ({
      pScale: isP ? { x: scaleX, y: scaleY } : undefined,
      eScale: !isP ? { x: scaleX, y: scaleY } : undefined,
      pRot: isP ? rot : 0,
      eRot: !isP ? -rot : 0,
    });

    // 피격 대상 전용 스쿼시/스트레치 및 충격 넉백
    const targetReaction = (offX = 0, offY = 0, scaleX = 1.0, scaleY = 1.0) => ({
      pOffset: !isP ? { x: -offX, y: offY } : { x: 0, y: 0 },
      eOffset: isP ? { x: offX, y: offY } : { x: 0, y: 0 },
      pScale: !isP && (scaleX !== 1.0 || scaleY !== 1.0) ? { x: scaleX, y: scaleY } : undefined,
      eScale: isP && (scaleX !== 1.0 || scaleY !== 1.0) ? { x: scaleX, y: scaleY } : undefined,
    });

    return [
      // ======================================================================
      // [Step 1]: 시전포켓몬 포커싱 & 연한빨강·연한노랑 상승선 (기 모으기)
      // ======================================================================
      // 1. 기 모으기 시작 (시전자 중심 포커싱 & 초기 광선 부상)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 2),
        ...cTransform(1.04, 0.96, 0),
        moveStep: 1,
        effectProgress: 0.12,
        lineAlpha: 0.70,
        phaseId: "focus-punch-charge-1",
        phaseName: "1. 기 모으기 시작 & 초기 광선 부상",
      },
      // 2. 집중 호흡 (몸체 긴장 & 연한빨강·연한노랑 선 가속 상승)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 4),
        ...cTransform(1.08, 0.92, 0),
        moveStep: 1,
        effectProgress: 0.28,
        lineAlpha: 0.85,
        phaseId: "focus-punch-charge-2",
        phaseName: "2. 집중 호흡 & 연한빨강/연한노랑 선 상승",
      },
      // 3. 집중 심화 (위로 솟구치는 에너지 선 확장)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 1),
        ...cTransform(1.02, 0.98, 0),
        moveStep: 1,
        effectProgress: 0.44,
        lineAlpha: 0.95,
        phaseId: "focus-punch-charge-3",
        phaseName: "3. 집중 심화 & 에너지 선 상승 확장",
      },
      // 4. 기류 고조 (시전자 둘레를 3D로 감싸는 기류)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, -3),
        ...cTransform(0.96, 1.04, 0),
        moveStep: 1,
        effectProgress: 0.60,
        lineAlpha: 1.00,
        phaseId: "focus-punch-charge-4",
        phaseName: "4. 기류 고조 & 시전자 둘레 3D 광선 상승",
      },
      // 5. 에너지 응축 (상공으로 더 길게 뻗어 올라가는 빛줄기)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, -5),
        ...cTransform(0.94, 1.06, 0),
        moveStep: 1,
        effectProgress: 0.76,
        lineAlpha: 1.00,
        phaseId: "focus-punch-charge-5",
        phaseName: "5. 에너지 응축 & 고도 상승 빛줄기",
      },
      // 6. 최대 집중 (연한빨강·연한노랑 기운 폭발적 쇄도)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, -2),
        ...cTransform(0.98, 1.02, 0),
        moveStep: 1,
        effectProgress: 0.90,
        lineAlpha: 1.00,
        phaseId: "focus-punch-charge-6",
        phaseName: "6. 최대 집중 & 기운 상승 폭발",
      },
      // 7. 기 충전 완료 (투지를 불태우며 집중 완료)
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        ...cTransform(1.0, 1.0, 0),
        moveStep: 1,
        effectProgress: 1.00,
        lineAlpha: 0.90,
        phaseId: "focus-punch-charge-7",
        phaseName: "7. 기 충전 완료 (집중 자세 유지)",
      },

      // ======================================================================
      // [Step 2]: 적 포켓몬 록온 & 파란 배경 + 4겹 스타버스트 + 빨간색 필터 주먹 강타!
      // 🌟 [유저 지정 엄수]:
      //    - 화면이 파란색으로 완전히 물든 후(Frame 8~9) 스타버스트 출현(Frame 10~11)
      //    - 75도 회전된 붉은 주먹 등장 -> 수평(0도)으로 꺾이며 타격(Frame 12~15)
      // ======================================================================
      // 8. 파란 배경 페이드인 시작 (화면이 파란색으로 물들기 시작, 스타버스트 대기)
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        moveStep: 2,
        showEffect: false,
        showBehindEffect: true,
        effectProgress: 0.0,
        waveProgress: 0.0,
        blueAlpha: 0.55,
        starburstAlpha: 0.0,
        phaseId: "focus-punch-target-1",
        phaseName: "8. 화면 파란색 페이드인 시작 (스타버스트 대기)",
      },
      // 9. 화면 파란색 완전 물듦 (배틀필드가 파란색으로 100% 완전 착색, 스타버스트 출현 직전)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        moveStep: 2,
        showEffect: false,
        showBehindEffect: true,
        effectProgress: 0.0,
        waveProgress: 0.0,
        blueAlpha: 1.00,
        starburstAlpha: 0.0,
        phaseId: "focus-punch-target-2",
        phaseName: "9. 화면 파란색 완전 물듦 (100% 착색 완료)",
      },
      // 10. 파란 배경 위 4겹 스타버스트 폭발 출현!
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        moveStep: 2,
        showEffect: false,
        showBehindEffect: true,
        effectProgress: 0.40,
        waveProgress: 0.40,
        blueAlpha: 1.00,
        starburstAlpha: 1.0,
        phaseId: "focus-punch-target-3",
        phaseName: "10. 파란 배경 위 4겹 스타버스트 폭발 출현",
      },
      // 11. 4겹 스타버스트 급속 확장 & 타겟 록온 완료
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        moveStep: 2,
        showEffect: false,
        showBehindEffect: true,
        effectProgress: 0.85,
        waveProgress: 0.85,
        blueAlpha: 1.00,
        starburstAlpha: 1.0,
        phaseId: "focus-punch-target-4",
        phaseName: "11. 4겹 스타버스트 완전 확장 & 타겟 록온",
      },
      // 12. 붉은 주먹 출현 (75도 회전된 각도로 쇄도)
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        moveStep: 2,
        showEffect: true,
        showBehindEffect: true,
        effectProgress: 0.90,
        waveProgress: 1.00,
        blueAlpha: 1.00,
        starburstAlpha: 1.0,
        showPunch: true,
        punchProgress: 0.20,
        punchRot: 75,
        punchScale: 1.05,
        punchAlpha: 0.28,
        phaseId: "focus-punch-fist-1",
        phaseName: "12. 붉은 주먹 출현 (75도 회전 대형 반투명)",
      },
      // 13. 붉은 주먹 가속 스윙 (75도 -> 35도 회전, 축소 & 선명화)
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        moveStep: 2,
        showEffect: true,
        showBehindEffect: true,
        effectProgress: 0.96,
        waveProgress: 1.00,
        blueAlpha: 1.00,
        starburstAlpha: 1.0,
        showPunch: true,
        punchProgress: 0.65,
        punchRot: 35,
        punchScale: 0.72,
        punchAlpha: 0.70,
        phaseId: "focus-punch-fist-2",
        phaseName: "13. 붉은 주먹 가속 스윙 (35도 회전 & 축소 선명화)",
      },
      // 14. 붉은 주먹 수평(0도) 정권 직격 강타! (초기 직격 & 찌그러짐 시작)
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...targetReaction(14, -2, 1.25, 0.75),
        hitFlash: true,
        moveStep: 2,
        showEffect: true,
        showBehindEffect: true,
        effectProgress: 1.00,
        waveProgress: 1.00,
        blueAlpha: 1.00,
        starburstAlpha: 1.0,
        showPunch: true,
        showImpact: true,
        punchProgress: 1.00,
        punchRot: 0,
        punchScale: 0.50,
        punchAlpha: 1.00,
        impactProgress: 0.15,
        phaseId: "focus-punch-hit-strike",
        phaseName: "14. 붉은 주먹 수평(0도) 직격 강타 & 타겟 찌그러짐 시작",
      },
      // 15. 주먹 머무름 & 점파티클 사방 폭발 & 타겟 극대 찌그러짐
      // 🌟 [유저 지정 엄수]: 주먹이 대상 포켓몬 위에 머무른 채로 잠시 있고, 점파티클이 튀며 타겟은 극대로 찌그러짐
      {
        ...baseFrame,
        delay: 100,
        ...cOff(0, 0),
        ...targetReaction(20, -3, 1.34, 0.66),
        hitFlash: false,
        moveStep: 2,
        showEffect: true,
        showBehindEffect: true,
        effectProgress: 1.00,
        waveProgress: 1.00,
        blueAlpha: 1.00,
        starburstAlpha: 1.0,
        showPunch: true,
        showImpact: true,
        punchProgress: 1.02,
        punchRot: 0,
        punchScale: 0.50,
        punchAlpha: 1.00,
        impactProgress: 0.45,
        phaseId: "focus-punch-hit-squash",
        phaseName: "15. 주먹 머무름 & 점파티클 튐 & 타겟 극대 찌그러짐",
      },
      // 16. 주먹 머무름 유지 & 타겟 반동 펴짐(스트레치) & 점파티클 확산
      // 🌟 [유저 지정 엄수]: 주먹이 머무르는 동안 대상포켓몬은 찌그러졌다 "펴졌다" (탄성 반동 스트레치)
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        ...targetReaction(10, -5, 0.82, 1.20),
        moveStep: 2,
        showEffect: true,
        showBehindEffect: true,
        effectProgress: 1.00,
        waveProgress: 1.00,
        blueAlpha: 1.00,
        starburstAlpha: 1.0,
        showPunch: true,
        showImpact: true,
        punchProgress: 1.05,
        punchRot: 0,
        punchScale: 0.50,
        punchAlpha: 0.95,
        impactProgress: 0.75,
        phaseId: "focus-punch-hit-stretch",
        phaseName: "16. 주먹 머무름 유지 & 타겟 반동 펴짐(스트레치)",
      },
      // 17. 주먹 서서히 페이드 & 타겟 2차 감쇠 반동
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...targetReaction(4, -1, 1.06, 0.95),
        moveStep: 2,
        showEffect: true,
        showBehindEffect: true,
        effectProgress: 1.00,
        waveProgress: 1.00,
        blueAlpha: 1.00,
        starburstAlpha: 1.0,
        showPunch: true,
        showImpact: true,
        punchProgress: 1.08,
        punchRot: 0,
        punchScale: 0.46,
        punchAlpha: 0.45,
        impactProgress: 0.95,
        phaseId: "focus-punch-hit-rebound",
        phaseName: "17. 주먹 서서히 페이드 & 타겟 2차 감쇠 반동",
      },
      // 18. 타겟 정상 복귀 및 연출 종료
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 0),
        ...targetReaction(0, 0, 1.0, 1.0),
        moveStep: 2,
        showEffect: true,
        showBehindEffect: true,
        effectProgress: 1.00,
        waveProgress: 1.00,
        blueAlpha: 1.00,
        starburstAlpha: 1.0,
        showPunch: false,
        showImpact: false,
        phaseId: "focus-punch-hit-end",
        phaseName: "18. 타겟 정상 복귀 및 연출 종료",
      },
    ];
  },
};
