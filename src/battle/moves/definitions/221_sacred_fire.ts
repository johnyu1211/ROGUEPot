// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawSacredFireBehindEffect,
  drawSacredFireEffect,
} from "../../../renderers/moves/gen1/move221_224.js";

/**
 * 221: 성스러운불꽃 (Sacred Fire / せいなるほのお) - 칠색조 상징기
 *
 * 위력: 100 / 명중: 95 / PP: 5 / 화상 확률: 50% / 접촉: X
 * 설명: 신비한 불꽃으로 상대를 태워서 공격한다. 50% 확률로 화상을 입힌다.
 */
export const sacredFireMove: BattleMoveAnimation = {
  num: 221,
  key: "sacred-fire",
  nameKo: "성스러운불꽃",
  nameEn: "Sacred Fire",
  type: "fire",
  category: "physical",
  camera: {
    type: "target",
    zoom: 1.35,
    focalRatio: 1.0,
    inlineGlideInFrames: 3,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawSacredFireBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawSacredFireEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
    };

    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const cTargetOff = (x: number, y: number) => ({
      pOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
      eOffset: isP ? { x, y } : { x: 0, y: 0 },
    });

    const frames: BattleFrame[] = [];
    let frameIdx = 0;

    // [Step 1: 기(起) - 신성한 화염 응축 및 시전자 상승 부유] (8프레임, 45ms)
    for (let i = 0; i < 8; i++) {
      const prog = i / 7;
      const recoilX = -Math.sin(prog * Math.PI) * 8;
      const floatY = -Math.sin(prog * Math.PI) * 12;

      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(recoilX, floatY),
        pScale: isP ? { x: 1.0 - Math.sin(prog * Math.PI) * 0.05, y: 1.0 + Math.sin(prog * Math.PI) * 0.08 } : undefined,
        eScale: !isP ? { x: 1.0 - Math.sin(prog * Math.PI) * 0.05, y: 1.0 + Math.sin(prog * Math.PI) * 0.08 } : undefined,
        moveStep: 1,
        effectProgress: prog,
        flameProg: frameIdx / 55,
        flameTime: frameIdx * 0.42,
        showEffect: true,
        showBehindEffect: true,
      });
      frameIdx++;
    }

    // [Step 2: 승(承) - 네거티브 충격파 확산 및 원 완성] (12프레임, 40ms)
    for (let i = 0; i < 12; i++) {
      const prog = i / 11;
      const groundTremble = Math.sin(prog * Math.PI * 6) * 1.5;

      frames.push({
        ...baseFrame,
        delay: 40,
        ...cOff(0, 0),
        ...cTargetOff(groundTremble, 0),
        moveStep: 2,
        effectProgress: prog,
        flameProg: frameIdx / 55,
        flameTime: frameIdx * 0.42,
        showEffect: true,
        showBehindEffect: true,
      });
      frameIdx++;
    }

    // [Step 3: 전(轉) - 원에서 다방면으로 뿜어져 나오는 용의 분노풍 연기 화염 분출 & 타격 피격] (16프레임, 40ms)
    for (let i = 0; i < 16; i++) {
      const prog = i / 15;
      const hitFlash = isHit && (i === 0 || i === 2);
      const knockback = isHit ? Math.sin((1.0 - prog) * Math.PI * 0.5) * 16 : 0;
      const shakeY = isHit && i < 8 ? ((i % 2 === 0 ? 1 : -1) * 5 * (1.0 - i / 8)) : 0;

      frames.push({
        ...baseFrame,
        delay: 40,
        ...cOff(0, 0),
        ...cTargetOff(knockback, shakeY),
        hitFlash,
        targetRedTint: isHit && i < 10,
        moveStep: 3,
        effectProgress: prog,
        flameProg: frameIdx / 55,
        flameTime: frameIdx * 0.42,
        showEffect: true,
        showBehindEffect: true,
      });
      frameIdx++;
    }

    // [Step 4: 결(結) - 구체 페이드아웃 & 핵 중심부 다방면 연기 분출 소산 및 복귀] (20프레임, 40ms)
    for (let i = 0; i < 20; i++) {
      const prog = i / 19;
      frames.push({
        ...baseFrame,
        delay: 40,
        ...cOff(0, 0),
        ...cTargetOff(0, 0),
        moveStep: 4,
        effectProgress: prog,
        flameProg: frameIdx / 55,
        flameTime: frameIdx * 0.42,
        showEffect: true,
        showBehindEffect: true,
      });
      frameIdx++;
    }

    return frames;
  },
};
