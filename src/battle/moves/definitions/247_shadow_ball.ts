// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawShadowBallBehindEffect,
  drawShadowBallEffect,
} from "../../../renderers/moves/gen1/move245_248.js";

/**
 * 247: 섀도볼 / 쉐도우볼 (Shadow Ball / シャドーボール) - 고스트 타입 특수 기술
 *
 * 위력: 80 / 명중: 100 / PP: 15 / 접촉: X
 * 설명: 그림자 덩어리를 내던져서 공격한다. 상대의 특수방어를 떨어뜨릴 때가 있다. (20% 확률 특방 -1)
 *
 * [유저 요구사항 연출 시퀀스]:
 * 1. 기(起): 반투명한 작은 구체에서 빙글빙글 회전 시작 & 사방에서 보라색 빛 에너지를 흡수 개시
 * 2. 승(承): 회전하면서 계속 흡수하고 점점 커져서 칠흑의 검정 색깔 구체로 완성! (외곽 보라 오라 림)
 * 3. 전(轉): 완성된 검은 구체를 목표를 향해 맹렬하게 고속 발포! (비행 및 잔상 트레일)
 * 4. 결(結): 묵직하고 파괴적인 고품질 타격 이펙트 (암흑 왜곡 충격파, 바이올렛 플래시, 사방 비산 암흑 탄환 & 잔향)
 * 5. 여운: 잔여 고스트 기운 소산 및 전장 안정화
 */
export const shadowBallMove: BattleMoveAnimation = {
  num: 247,
  key: "shadow-ball",
  nameKo: "섀도볼",
  nameEn: "Shadow Ball",
  type: "ghost",
  category: "special",
  camera: {
    type: "target",
    zoom: 1.32,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawShadowBallBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawShadowBallEffect(targetCtx, frame, drawCtx);
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
      eOffset: isP ? { x: targetX, y: targetY } : { x: casterX, y: casterY },
    });

    const frames: BattleFrame[] = [];
    const totalFrames = 32;
    let globalIdx = 0;

    // ------------------------------------------------------------------------
    // [Step 1: 기(起) - 반투명 작은 구체 생성 및 보라색 빛 흡수 개시] (6프레임, 45ms)
    // ------------------------------------------------------------------------
    const step1Count = 6;
    for (let i = 0; i < step1Count; i++) {
      const prog = i / (step1Count - 1);
      // 시전자 포켓몬이 뒤로 살짝 물러나며 기를 모으는 준비 모션
      const recoilX = (isP ? -1 : 1) * (prog * 3.5);
      const floatY = -Math.sin(prog * Math.PI) * 3;

      frames.push({
        ...baseFrame,
        delay: 45,
        ...posOff(recoilX, floatY, 0, 0),
        moveStep: 1,
        phaseId: `shadow-ball-gather-${i + 1}`,
        phaseName: `#1. 검은색 작은 구체 회전 및 보라색 빛 흡수 (${i + 1}/${step1Count})`,
        effectProgress: prog,
        rotPhase: (globalIdx / totalFrames) * Math.PI * 8,
        showEffect: true,
        showBehindEffect: false,
      } as any);

      globalIdx++;
    }

    // ------------------------------------------------------------------------
    // [Step 2: 승(承) - 회전 가속 & 에너지 흡수 팽창 -> 칠흑의 검은 구체 완성!] (7프레임, 42ms)
    // ------------------------------------------------------------------------
    const step2Count = 7;
    for (let i = 0; i < step2Count; i++) {
      const prog = i / (step2Count - 1);
      // 에너지가 응축됨에 따라 시전자 포켓몬의 긴장감 호버링 (미세 진동)
      const chargeShakeX = (isP ? -1 : 1) * (3.5 + (i % 2 === 0 ? 0.8 : -0.8));
      const floatY = -2 + Math.sin(prog * Math.PI * 2) * 1.2;

      frames.push({
        ...baseFrame,
        delay: 42,
        ...posOff(chargeShakeX, floatY, 0, 0),
        moveStep: 2,
        phaseId: `shadow-ball-condense-${i + 1}`,
        phaseName: `#2. 회전 흡수 팽창 및 칠흑의 검은 구체 완성 (${i + 1}/${step2Count})`,
        effectProgress: prog,
        rotPhase: (globalIdx / totalFrames) * Math.PI * 10,
        showEffect: true,
        showBehindEffect: false,
      } as any);

      globalIdx++;
    }

    // ------------------------------------------------------------------------
    // [Step 3: 전(轉) - 완성된 검은 구체 고속 발포 및 쇄도] (7프레임, 36ms)
    // ------------------------------------------------------------------------
    const step3Count = 7;
    for (let i = 0; i < step3Count; i++) {
      const prog = i / (step3Count - 1);

      // 시전자 발사 반동: 초반 강한 킥백 -> 제자리 복귀
      const casterKickX = (isP ? 1 : -1) * (i < 3 ? 5 - i * 1.5 : (i < 5 ? 1 : 0));
      const casterKickY = i < 2 ? 2 : 0;

      frames.push({
        ...baseFrame,
        delay: 36,
        ...posOff(casterKickX, casterKickY, 0, 0),
        moveStep: 3,
        phaseId: `shadow-ball-fire-${i + 1}`,
        phaseName: `#3. 완성된 검은 구체 고속 발포 (${i + 1}/${step3Count})`,
        effectProgress: prog,
        rotPhase: (globalIdx / totalFrames) * Math.PI * 14,
        showEffect: true,
        showBehindEffect: false,
      } as any);

      globalIdx++;
    }

    // ------------------------------------------------------------------------
    // [Step 4: 결(結) - 묵직하고 파괴적인 고품질 타격 이펙트 작렬!] (7프레임, 38ms)
    // ------------------------------------------------------------------------
    const step4Count = 7;
    for (let i = 0; i < step4Count; i++) {
      const prog = i / (step4Count - 1);

      // 피격자 반응: 묵직한 암흑 타격 넉백 및 진동 (유저 요청: "터질 때 흰색 보이는데 검정" -> 흰색 플래시 제거)
      const isImpact = isHit;
      const hitFlash = false;
      // 타격 방향으로 밀려나는 넉백과 진동
      const knockDir = isP ? 1 : -1;
      const knockX = isImpact ? knockDir * Math.max(0, 14 - i * 2.2) : 0;
      const shakeY = isImpact ? ((i % 2 === 0 ? 1 : -1) * Math.max(0, 5 - i * 0.8)) : 0;

      // [유저 요청]: "섀도볼 피격 시 대상 어두운 색으로 필터인"
      // 피격 순간 어두운 암흑 필터가 빠르게 차오르고(Filter-in) 서서히 복귀하는 커브
      const darkCurve = [0.38, 0.72, 0.88, 0.82, 0.60, 0.38, 0.18];
      const targetDarkLevel = isImpact ? darkCurve[i] : 0;

      frames.push({
        ...baseFrame,
        delay: 38,
        ...posOff(0, 0, knockX, shakeY),
        hitFlash,
        targetDarkLevel,
        moveStep: 4,
        phaseId: `shadow-ball-impact-${i + 1}`,
        phaseName: `#4. 묵직한 암흑 왜곡 충격파 및 타격 폭쇄 (${i + 1}/${step4Count})`,
        effectProgress: prog,
        hitProgress: prog,
        rotPhase: (globalIdx / totalFrames) * Math.PI * 14,
        showEffect: isImpact,
        showBehindEffect: false,
      } as any);

      globalIdx++;
    }

    // ------------------------------------------------------------------------
    // [Step 5: 여운 - 어둠의 잔향 소산 및 자세 안정화] (5프레임, 45ms)
    // ------------------------------------------------------------------------
    const step5Count = 5;
    for (let i = 0; i < step5Count; i++) {
      const prog = i / (step5Count - 1);

      // 피격자 원래 자리로 서서히 복귀 (어두운 필터 완전 회복)
      const settleShakeX = isHit ? ((i % 2 === 0 ? 1 : -1) * Math.max(0, 2 - i * 0.5)) : 0;
      const targetDarkLevel = (isHit && i === 0) ? 0.06 : 0;

      frames.push({
        ...baseFrame,
        delay: 45,
        ...posOff(0, 0, settleShakeX, 0),
        targetDarkLevel,
        moveStep: 5,
        phaseId: `shadow-ball-settle-${i + 1}`,
        phaseName: `#5. 어둠의 잔향 소산 및 복귀 (${i + 1}/${step5Count})`,
        effectProgress: prog,
        rotPhase: (globalIdx / totalFrames) * Math.PI * 14,
        showEffect: isHit,
        showBehindEffect: false,
      } as any);

      globalIdx++;
    }

    return frames;
  },
};
