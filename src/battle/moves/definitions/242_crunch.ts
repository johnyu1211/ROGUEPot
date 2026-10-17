// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawCrunchBehindEffect,
  drawCrunchEffect,
} from "../../../renderers/moves/gen1/move241_244.js";

/**
 * 242: 깨물어부수기 (Crunch / かみくだく) - 악 타입 물리 기술
 *
 * 위력: 80 / 명중: 100 / PP: 15 / 20% 방어 1랭크 하락 / 접촉: O
 * 설명: 날카로운 이빨로 상대를 깨물어 부숴서 공격한다. 상대의 방어를 떨어뜨릴 때가 있다.
 */
export const crunchMove: BattleMoveAnimation = {
  num: 242,
  key: "crunch",
  nameKo: "깨물어부수기",
  nameEn: "Crunch",
  type: "dark",
  category: "physical",
  camera: {
    type: "target",
    zoom: 1.25,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawCrunchBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawCrunchEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      cameraZoom: 1.25,
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

    // [Step 1: 암전 효과 & 상대 상하에 물기 이빨 출현 (턱 벌림)] (4프레임, 50ms)
    const step1FadeAlphas = [0.45, 0.60, 0.72, 0.80];
    for (let i = 0; i < 4; i++) {
      const prog = i / 3;
      frames.push({
        ...baseFrame,
        delay: 50,
        ...cOff(i < 2 ? 3 : 0, 0),
        blackFadeAlpha: step1FadeAlphas[i],
        moveStep: 1,
        phaseId: `crunch-open-${i + 1}`,
        phaseName: "#1. 암전 & 물기 상하 이빨 전개",
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // [Step 2: 콰직! 전광석화로 상대 중심을 향해 닫히는 이빨] (4프레임, 35ms)
    for (let i = 0; i < 4; i++) {
      const prog = i / 3;
      frames.push({
        ...baseFrame,
        delay: 35,
        ...cOff(0, 0),
        blackFadeAlpha: 0.82,
        moveStep: 2,
        phaseId: `crunch-bite-${i + 1}`,
        phaseName: "#2. 고속 교합 & 턱 맞물림",
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // [Step 3: 완전 교합 & 콰직! 흰색 돌조각들이 깨지듯 사방으로 폭발 비산] (8프레임, 50ms)
    const hitSteps = 8;
    const hitFadeAlphas = [0.85, 0.85, 0.75, 0.60, 0.45, 0.30, 0.15, 0.05];
    for (let i = 0; i < hitSteps; i++) {
      const prog = i / (hitSteps - 1);
      const hitFlash = isHit && (i === 0 || i === 1);
      const knockX = isHit ? (i === 0 ? 8 : i === 1 ? -5 : i === 2 ? 3 : i === 3 ? -1 : 0) : 0;

      frames.push({
        ...baseFrame,
        delay: 50,
        ...cOff(0, 0),
        ...tOff(knockX, 0),
        hitFlash,
        blackFadeAlpha: hitFadeAlphas[i],
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 3,
        phaseId: `crunch-hit-${i + 1}`,
        phaseName: "#3. 완전 교합 & 흰색 돌조각 파쇄 비산 타격",
        effectProgress: prog,
        hitProgress: prog,
        showEffect: isHit,
        showBehindEffect: true,
      });
    }

    // [Step 4: 암전 해제 및 정위치 복귀] (2프레임, 45ms)
    for (let i = 0; i < 2; i++) {
      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        ...tOff(0, 0),
        blackFadeAlpha: 0.0,
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 4,
        phaseId: `crunch-settle-${i + 1}`,
        phaseName: "#4. 암전 해제 & 정위치 복귀",
        effectProgress: 1.0,
        showEffect: false,
        showBehindEffect: false,
      });
    }

    return frames;
  },
};
