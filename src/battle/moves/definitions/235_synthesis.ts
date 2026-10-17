// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawSynthesisBehindEffect,
  drawSynthesisEffect,
} from "../../../renderers/moves/gen1/move233_236.js";

/**
 * 235: 광합성 (Synthesis / こうごうせい) - 풀 타입 변화 기술
 *
 * 위력: — / 명중: — / PP: 5 / 대상: 자신 / 접촉: X
 * 설명: 빛을 흡수하여 자신의 HP를 회복한다. 날씨에 따라 회복량이 변한다.
 */
export const synthesisMove: BattleMoveAnimation = {
  num: 235,
  key: "synthesis",
  nameKo: "광합성",
  nameEn: "Synthesis",
  type: "grass",
  category: "status",
  camera: {
    type: "self",
    zoom: 1.25,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawSynthesisBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawSynthesisEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
    };

    const cOff = (x = 0, y = 0) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x, y } : { x: 0, y: 0 },
    });

    const frames: BattleFrame[] = [];

    // [Step 1: 시전 포켓몬 중앙 순백의 원 생성 & 불규칙 빛줄기 다방면 방사 분출 (밖으로 나가며 페이드아웃)] (13프레임, 60ms)
    for (let i = 0; i < 13; i++) {
      const prog = i / 12;
      const pulseScale = 1.0 + Math.sin(prog * Math.PI) * 0.05;

      frames.push({
        ...baseFrame,
        delay: 60,
        ...cOff(0, 0),
        pScale: isP ? { x: pulseScale, y: pulseScale } : undefined,
        eScale: !isP ? { x: pulseScale, y: pulseScale } : undefined,
        moveStep: 1,
        phaseId: `synthesis-ray-burst-${i + 1}`,
        phaseName: `#1. 순백의 원 생성 및 다방면 불규칙 빛줄기 분출 (${Math.round(prog * 100)}%)`,
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // [Step 2: HP 회복 기술 회복 애니메이션 (나선 회복별 엠블럼 승화 및 체력 회복)] (6프레임)
    frames.push(
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.10,
        phaseId: "synthesis-recover-stars-1",
        phaseName: "#2-1. 회복별 1번 출현 & 치유 나선 상승",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, -1),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.28,
        phaseId: "synthesis-recover-stars-2",
        phaseName: "#2-2. 회복별 2번 출현 & 1번 별 나선 선회",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, -1),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.48,
        phaseId: "synthesis-recover-stars-3",
        phaseName: "#2-3. 회복별 3번 출현 & 순차 나선 비상",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, -1),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.68,
        phaseId: "synthesis-recover-stars-4",
        phaseName: "#2-4. 회복별 4번 출현 & 선행 별 상공 페이드",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.88,
        phaseId: "synthesis-recover-stars-fading",
        phaseName: "#2-5. 잔여 회복별들 순차적 승화 소멸",
      },
      {
        ...baseFrame,
        delay: 60,
        ...cOff(0, 0),
        showEffect: false,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 1.0,
        phaseId: "synthesis-recover-end",
        phaseName: "#2-6. HP 회복 완료 및 기본자세 복귀",
      }
    );

    return frames;
  },
};
