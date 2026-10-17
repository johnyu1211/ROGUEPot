// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawDynamicPunchBehindEffect,
  drawDynamicPunchEffect,
} from "../../../renderers/moves/gen1/move221_224.js";

/**
 * 223: 폭발펀치 (Dynamic Punch / ばくだんパンチ) - 격투 타입 물리 기술
 *
 * 위력: 100 / 명중: 50 / PP: 5 / 혼란: 100% 확정 / 접촉: O
 * 설명: 혼신의 힘으로 펀치를 날려서 공격한다. 맞은 상대를 반드시 혼란에 빠뜨린다.
 */
export const dynamicPunchMove: BattleMoveAnimation = {
  num: 223,
  key: "dynamic-punch",
  nameKo: "폭발펀치",
  nameEn: "Dynamic Punch",
  type: "fighting",
  category: "physical",
  camera: {
    type: "caster_to_target",
    zoom: 1.35,
    focalRatio: 1.0,
    delayUntilStep: 1,
    inlineGlideInFrames: 2,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawDynamicPunchBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawDynamicPunchEffect(targetCtx, frame, drawCtx);
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

    const posOff = (casterX = 0, casterY = 0, targetX = 0, targetY = 0) => ({
      pOffset: isP ? { x: casterX, y: casterY } : { x: targetX, y: targetY },
      eOffset: isP ? { x: targetX, y: targetY } : { x: -casterX, y: -casterY },
    });

    const frames: BattleFrame[] = [];

    // [Step 1: 기(起) - 상대 면전으로 초고속 돌진 쇄도] (차징 단계 생략, 3프레임, 35ms)
    for (let i = 0; i < 3; i++) {
      const prog = (i + 1) / 3;
      const dashX = prog * 42;

      frames.push({
        ...baseFrame,
        delay: 35,
        ...posOff(dashX, 0, 0, 0),
        pRot: isP ? 0.15 : undefined,
        eRot: !isP ? -0.15 : undefined,
        moveStep: 1,
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: false,
      });
    }

    // [Step 2: 승(承) - 주먹 발사 & 직격 단독 연출] (유저 요청 엄수: 주먹 확실히 보이도록 발사 ➔ 직격 후 1프레임 뒤 폭발)
    // 2-1. 주먹 발사 (시전자에서 상대 쪽으로 정권 사출)
    frames.push({
      ...baseFrame,
      delay: 50,
      ...posOff(38, 0, 0, 0),
      hitFlash: false,
      targetRedTint: false,
      moveStep: 2,
      effectProgress: 0.45,
      fistProg: 0.45,
      showEffect: true,
      showBehindEffect: false,
      phaseId: "dynamic-punch-launch",
      phaseName: "#2. 주먹 발사 (정권 사출)",
    });

    // 2-2. 주먹 정면 직격 강타 (주먹이 상대에게 100% 선명하게 꽂힘, 폭발 없음)
    frames.push({
      ...baseFrame,
      delay: 90,
      ...posOff(38, 0, isHit ? 14 : 0, 0),
      hitFlash: false,
      targetRedTint: isHit,
      moveStep: 2,
      effectProgress: 1.0,
      fistProg: 1.0,
      showEffect: true,
      showBehindEffect: false,
      phaseId: "dynamic-punch-impact",
      phaseName: "#3. 주먹 직격 (선명한 정권 타격)",
    });

    // [Step 3: 전(轉) - 주먹 꽂힌 후 1프레임 뒤 타격점 연쇄 폭발! 총 5번에 나누어 펑! 펑! 펑! 펑! 펑!] (15프레임, 40ms)
    const step3Frames = 15;
    for (let i = 0; i < step3Frames; i++) {
      const prog = i / (step3Frames - 1);
      // 5연속 폭발 기폭 타이밍 (i = 0, 2, 4, 6, 8)
      const isBurstHit = i === 0 || i === 2 || i === 4 || i === 6 || i === 8;
      const hitFlash = isHit && isBurstHit;

      // 폭발 회차가 거듭될수록 넉백과 피격 셰이크가 점진적으로 고조
      const knockbackProgress = Math.min(1.0, i / 9);
      const knockbackX = isHit ? Math.sin(knockbackProgress * Math.PI * 0.5) * 25 : 0;

      let shakeY = 0;
      if (isHit && isBurstHit) {
        const shakeMag = 5 + (i / 8) * 7; // 5px -> 12px 피날레 대폭발까지 점진적 확대
        shakeY = (i % 4 === 0 ? -1 : 1) * shakeMag;
      } else if (isHit && i === 9) {
        shakeY = 4; // 피날레 대폭발 직후 여진
      }

      // 시전자는 타격 후 반동으로 서서히 복귀
      const casterX = 38 * Math.max(0, 1.0 - (i / 11));

      frames.push({
        ...baseFrame,
        delay: 40,
        ...posOff(casterX, 0, knockbackX, shakeY),
        hitFlash,
        targetRedTint: isHit && i <= 10,
        moveStep: 3,
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // [Step 4: 결(結) - 100% 혼란 기존 공용 애니메이션 별무리 회전 & 대상 비틀거림] (8프레임, 65ms)
    if (isHit) {
      const confFrameCount = 8;
      for (let i = 0; i < confFrameCount; i++) {
        const prog = i / (confFrameCount - 1);
        const confProg = 0.15 + prog * 0.95; // 0.15 ~ 1.10 (기존 공용 혼란 애니메이션 페이드인->공전->페이드아웃 규격)
        // 대상이 혼란에 빠져 좌우로 비틀비틀 흔들림 (Wobble)
        const wobbleRot = Math.sin(prog * Math.PI * 4) * 0.12;
        const wobbleX = Math.sin(prog * Math.PI * 4) * 3;

        frames.push({
          ...baseFrame,
          delay: 65,
          ...posOff(0, 0, wobbleX, 0),
          pRot: !isP ? wobbleRot : undefined,
          eRot: isP ? wobbleRot : undefined,
          moveStep: 4,
          effectProgress: prog,
          confusionProgress: confProg,
          showEffect: true,
          showBehindEffect: false,
        });
      }
    }

    // 자세 복귀 안정화 (2프레임, 50ms)
    for (let i = 0; i < 2; i++) {
      frames.push({
        ...baseFrame,
        delay: 50,
        ...posOff(0, 0, 0, 0),
        moveStep: 4,
        effectProgress: 1.0,
        confusionProgress: 0,
        showEffect: false,
        showBehindEffect: false,
      });
    }

    return frames;
  },
};
