// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawPsychUpBehindEffect,
  drawPsychUpEffect,
} from "../../../renderers/moves/gen1/move241_244.js";

/**
 * 244: 자기암시 (Psych Up / じこあんじ) - 노말 타입 변화 기술
 *
 * 위력: — / 명중: — (필중) / PP: 10 / 비접촉
 * 설명: 자신에게 암시를 걸어서 상대의 모든 능력치 랭크 변화 상태를 자신에게 똑같이 복사한다.
 * 연출: 시전 포켓몬 위에서 노란색 안쪽 말림 나선 회전선이 반투명하게 360도 1회전
 */
export const psychUpMove: BattleMoveAnimation = {
  num: 244,
  key: "psych-up",
  nameKo: "자기암시",
  nameEn: "Psych Up",
  type: "normal",
  category: "status",
  camera: {
    type: "self",
    zoom: 1.25,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawPsychUpBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawPsychUpEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      cameraZoom: 1.25,
      showBehindEffect: false,
    };

    const cOff = (x = 0, y = 0) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y } : { x: 0, y: 0 },
    });

    const cScale = (x = 1.0, y = 1.0) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    const frames: BattleFrame[] = [];

    // [1단계: 시전 포켓몬 위에서 노란색 안쪽 말림 나선 회전선이 반투명하게 360도 1회전] (12프레임, 45ms)
    const spinSteps = 12;
    for (let i = 0; i < spinSteps; i++) {
      const prog = i / (spinSteps - 1);
      // 시전자 미세 집중 호흡 모션 (초반 살짝 웅크림 -> 중반 살짝 뜸 -> 후반 안착)
      const bobY = Math.sin(prog * Math.PI) * -3;
      const sy = 1.0 - Math.sin(prog * Math.PI) * 0.04;
      const sx = 1.0 + Math.sin(prog * Math.PI) * 0.04;

      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(0, bobY),
        ...cScale(sx, sy),
        moveStep: 1,
        phaseId: `psych-up-spin-${i + 1}`,
        phaseName: `#1. 노란색 나선 회전선 360도 1회전 (${i + 1}/${spinSteps})`,
        effectProgress: prog,
        showEffect: true,
      });
    }

    // [2단계: 연출 완료 및 정위치 복귀] (2프레임, 45ms)
    for (let i = 0; i < 2; i++) {
      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        moveStep: 2,
        phaseId: `psych-up-settle-${i + 1}`,
        phaseName: `#2. 정위치 복귀 (${i + 1}/2)`,
        effectProgress: 1.0,
        showEffect: false,
      });
    }

    return frames;
  },
};
