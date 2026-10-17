// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawWhirlpoolBehindEffect,
  drawWhirlpoolEffect,
} from "../../../renderers/moves/gen1/move249_252.js";

/**
 * 250: 바다회오리 (Whirlpool / うずしお) - 물 타입 특수 기술
 *
 * 위력: 35 / 명중: 85 / PP: 15 / 4~5턴 구속(바인드) / 다이빙(수중) 상태 2배 위력
 * 설명: 세차게 소용돌이치는 물속에 4-5턴 동안 상대를 가두어 공격한다.
 *
 * [유저 요구사항 완벽 반영]:
 * 1. 주변이 푸른색으로 물듦:
 *    - 기술 발동과 함께 전장 전체에 깊은 해양 심해 아쿠아 블루 앰비언트가 퍼져나감
 * 2. 회오리랑 비슷하지만 거품이 포함된 회오리 발생:
 *    - 3D 모래시계형 물소용돌이 본체가 바닥에서 위로 솟구쳐 오름
 *    - 회오리 기둥 내부/표면에 3D 나선 궤도로 빠르게 회전하며 솟구쳐 오르는 입체 거품(Bubbles & Foam) 28개 포함
 * 3. 회오리 외각에 추가적인 선들이 보임 (이 선은 3D로 이루어짐 흰색 외각 투명):
 *    - 회오리 본체 외곽을 따라 3D 나선 궤도로 맹렬히 회전하는 4개의 순백색 유선 리본
 *    - 선 시작/끝점 및 외곽 글로우가 투명(0.0)으로 페이드아웃되어 부드럽게 감기는 3D 유선 연출
 *    - Z축 분리: Behind(Z < 0)와 Front(Z >= 0)로 대상을 감싸며 완벽한 3D 입체 투영
 */
export const whirlpoolMove: BattleMoveAnimation = {
  num: 250,
  key: "whirlpool",
  nameKo: "바다회오리",
  nameEn: "Whirlpool",
  type: "water",
  category: "special",
  camera: {
    type: "target",
    zoom: 1.2,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawWhirlpoolBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawWhirlpoolEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      cameraZoom: 1.2,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
    };

    const cOff = (x = 0, y = 0) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y } : { x: 0, y: 0 },
    });

    const tOff = (x = 0, y = 0) => ({
      pOffset: !isP ? { x: -x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x, y } : { x: 0, y: 0 },
    });

    const frames: BattleFrame[] = [];
    let globalFrameIdx = 0;

    // ------------------------------------------------------------------------
    // [Step 1: 주변 푸른색 물듦 & 바닥 수면 물소용돌이 전개 및 회전 시작] (5프레임, 45ms)
    // ------------------------------------------------------------------------
    const gatherSteps = 5;
    for (let i = 0; i < gatherSteps; i++) {
      const prog = i / (gatherSteps - 1);
      const rot = globalFrameIdx * 0.62;
      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(i % 2 === 0 ? 1 : 0, 0),
        moveStep: 1,
        phaseId: `whirlpool-gather-${i + 1}`,
        phaseName: "#1. 주변 푸른색 물듦 & 바닥 물소용돌이 전개",
        effectProgress: prog,
        whirlpoolRot: rot,
        showEffect: true,
        showBehindEffect: true,
      });
      globalFrameIdx++;
    }

    // ------------------------------------------------------------------------
    // [Step 2: 3D 하늘색 바다회오리 솟구침 & 거품 회전 & 외각 3D 백색 유선 회전 & 공중 요동] (10프레임, 45ms)
    // ------------------------------------------------------------------------
    const cycloneSteps = 10;
    for (let i = 0; i < cycloneSteps; i++) {
      const prog = i / (cycloneSteps - 1);
      const rot = globalFrameIdx * 0.62;
      // 회오리 급류에 휘말려 공중으로 붕 떴다가 좌우로 격렬히 요동
      const liftY = isHit ? -Math.round(Math.sin(prog * Math.PI) * 14) : 0;
      const shakeX = isHit ? (i % 2 === 0 ? 4 : -4) : 0;
      const hitFlash = isHit && (i === 2 || i === 6);

      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        ...tOff(shakeX, liftY),
        hitFlash,
        moveStep: 2,
        phaseId: `whirlpool-vortex-${i + 1}`,
        phaseName: "#2. 3D 하늘색 바다회오리 솟구침 & 거품 회전 & 외각 3D 백색 유선 회전",
        effectProgress: prog,
        hitProgress: prog,
        whirlpoolRot: rot,
        showEffect: true,
        showBehindEffect: true,
      });
      globalFrameIdx++;
    }

    // ------------------------------------------------------------------------
    // [Step 3: 바다회오리 소산 & 거품 물보라 비산 & 푸른빛 해제] (6프레임, 50ms)
    // ------------------------------------------------------------------------
    const burstSteps = 6;
    for (let i = 0; i < burstSteps; i++) {
      const prog = i / (burstSteps - 1);
      const rot = globalFrameIdx * 0.62;
      const settleY = isHit ? Math.round(-6 * (1 - prog)) : 0;

      frames.push({
        ...baseFrame,
        delay: 50,
        ...cOff(0, 0),
        ...tOff(0, settleY),
        moveStep: 3,
        phaseId: `whirlpool-burst-${i + 1}`,
        phaseName: "#3. 바다회오리 소산 & 거품 물보라 비산 & 푸른빛 해제",
        effectProgress: prog,
        whirlpoolRot: rot,
        showEffect: true,
        showBehindEffect: true,
      });
      globalFrameIdx++;
    }

    // ------------------------------------------------------------------------
    // [Step 4: 착지 및 원위치 복귀] (2프레임, 45ms)
    // ------------------------------------------------------------------------
    for (let i = 0; i < 2; i++) {
      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        ...tOff(0, 0),
        moveStep: 4,
        phaseId: `whirlpool-settle-${i + 1}`,
        phaseName: "#4. 정위치 착지 복귀",
        effectProgress: 1.0,
        showEffect: false,
        showBehindEffect: false,
      });
    }

    return frames;
  },
};
