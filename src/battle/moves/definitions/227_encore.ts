// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawEncoreBehindEffect,
  drawEncoreEffect,
} from "../../../renderers/moves/gen1/move225_228.js";

/**
 * 227: 앙코르 (Encore / アンコール) - 노말 타입 변화 기술
 *
 * 위력: — / 명중: 100 / PP: 5 / 대상: 상대 / 접촉: X
 * 설명: 상대가 마지막으로 사용한 기술을 3턴 동안 계속 쓰게 한다.
 */
export const encoreMove: BattleMoveAnimation = {
  num: 227,
  key: "encore",
  nameKo: "앙코르",
  nameEn: "Encore",
  type: "normal",
  category: "status",
  camera: {
    type: "target",
    zoom: 1.35,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawEncoreBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawEncoreEffect(targetCtx, frame, drawCtx);
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

    const targetOff = (x = 0, y = 0) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x, y } : { x: 0, y: 0 },
    });

    const frames: BattleFrame[] = [];

    // [Step 1: 기(起) - 무대 스포트라이트 조명 점등] (8프레임, 45ms)
    for (let i = 0; i < 8; i++) {
      const prog = i / 7;
      frames.push({
        ...baseFrame,
        delay: 45,
        ...targetOff(0, 0),
        moveStep: 1,
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // [Step 2: 승/전(承/轉) - 음악 음표 & 오색 콘페티 축제 샤워] (14프레임, 45ms)
    for (let i = 0; i < 14; i++) {
      const prog = i / 13;
      // 2회의 크고 경쾌한 탄력적 점프/바운스 (유저 요청: 대상 좀 더 튀어오르게!)
      // 피크 높이 20px -> 17px로 활기차게 도약
      const maxBounce = 20 - prog * 4;
      const bounceY = -Math.round(Math.abs(Math.sin(prog * Math.PI * 2)) * maxBounce);

      // 점프 리듬에 맞춘 경쾌한 몸 살랑임 (좌우 틸트)
      const swayRot = Math.sin(prog * Math.PI * 2) * 0.09;

      frames.push({
        ...baseFrame,
        delay: 45,
        ...targetOff(0, bounceY),
        pRot: !isP ? swayRot : undefined,
        eRot: isP ? swayRot : undefined,
        moveStep: 2,
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // [Step 3: 결(結) - 앙코르 지속 결계 안착 및 조명 디밍] (8프레임, 50ms)
    for (let i = 0; i < 8; i++) {
      const prog = i / 7;
      frames.push({
        ...baseFrame,
        delay: 50,
        ...targetOff(0, 0),
        moveStep: 3,
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: false,
      });
    }

    return frames;
  },
};
