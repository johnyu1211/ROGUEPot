// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawAncientPowerBehindEffect,
  drawAncientPowerEffect,
} from "../../../renderers/moves/gen1/move245_248.js";

/**
 * 246: 원시의 힘 (Ancient Power / げんしのちから) - 바위 타입 특수 기술
 *
 * 위력: 60 / 명중: 100 / PP: 5 / 접촉: X
 * 설명: 원시의 힘으로 공격한다. 자신의 모든 능력이 오를 때가 있다. (10% 확률로 공격/방어/특수공격/특수방어/스피드 +1)
 *
 * [연출 시퀀스]:
 * 1. 기(起): 시전자 고대 힘 집중 & 지면 파란색/보라색 파장 공명 링 확산
 * 2. 승(承): 지면에서 다각형 돌무더기들이 공중으로 솟구쳐 끌어올려짐 (매그니튜드 입체 다면체 + 얇은 파란/보라 파장 글로우 감싸기)
 * 3. 전(轉): 공중에 부유한 돌무더기들이 대상(적)을 향해 순차적/맹렬하게 고속 발사! 연쇄 격돌 폭쇄 & 넉백 피격
 * 4. 결(結): 파쇄된 돌 조각들이 흩어져 낙하하고, 신비로운 파란/보라 에너지 입자가 공중으로 소산
 */
export const ancientPowerMove: BattleMoveAnimation = {
  num: 246,
  key: "ancient-power",
  nameKo: "원시의힘",
  nameEn: "Ancient Power",
  type: "rock",
  category: "special",
  camera: {
    type: "none",
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawAncientPowerBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawAncientPowerEffect(targetCtx, frame, drawCtx);
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
    const totalFrames = 33;
    let globalIdx = 0;

    // ------------------------------------------------------------------------
    // [Step 1: 기(起) - 고대 힘 집중 모으기] (6프레임, 45ms)
    // ------------------------------------------------------------------------
    const step1Count = 6;
    for (let i = 0; i < step1Count; i++) {
      const prog = i / (step1Count - 1);
      // 시전자가 살짝 뒤로 물러서며 위로 살짝 뜨는 집중 모션
      const floatY = -Math.sin(prog * Math.PI) * 5;
      const recoilX = (isP ? -1 : 1) * Math.sin(prog * Math.PI) * 3;

      frames.push({
        ...baseFrame,
        delay: 45,
        ...posOff(recoilX, floatY, 0, 0),
        moveStep: 1,
        phaseId: `ancient-power-awaken-${i + 1}`,
        phaseName: `#1. 고대 힘 집중 모으기 (${i + 1}/${step1Count})`,
        effectProgress: prog,
        wavelengthPhase: (globalIdx / totalFrames) * Math.PI * 4,
        showEffect: false,
        showBehindEffect: false,
      } as any);

      globalIdx++;
    }

    // ------------------------------------------------------------------------
    // [Step 2: 승(承) - 돌무더기를 지면에서 공중으로 끌어올림] (9프레임, 42ms)
    // ------------------------------------------------------------------------
    const step2Count = 9;
    for (let i = 0; i < step2Count; i++) {
      const prog = i / (step2Count - 1);
      // 시전 포켓몬 힘을 유지하며 가벼운 호버링
      const hoverY = -4 + Math.sin(prog * Math.PI * 2) * 1.5;

      frames.push({
        ...baseFrame,
        delay: 42,
        ...posOff(0, hoverY, 0, 0),
        moveStep: 2,
        phaseId: `ancient-power-levitate-${i + 1}`,
        phaseName: `#2. 돌무더기 솟구침 및 공중 부유 (${i + 1}/${step2Count})`,
        effectProgress: prog,
        wavelengthPhase: (globalIdx / totalFrames) * Math.PI * 4,
        showEffect: true,
        showBehindEffect: false,
      } as any);

      globalIdx++;
    }

    // ------------------------------------------------------------------------
    // [Step 3: 전(轉) - 공중 돌무더기 고속 발사 & 대상 연속 격돌 폭쇄] (11프레임, 38ms)
    // ------------------------------------------------------------------------
    const step3Count = 11;
    for (let i = 0; i < step3Count; i++) {
      const prog = i / (step3Count - 1);

      // 시전자 발사 반동 (초반 발사 시 앞뒤 미세 반동)
      const casterKickX = (isP ? 1 : -1) * (i < 4 ? -2 : (i < 8 ? 1 : 0));

      // 피격자 반응: 바위들이 순차적으로 도달하는 후반(i >= 3)부터 격렬한 타격 플래시 & 넉백 진동
      const isImpactPhase = isHit && i >= 3;
      const hitFlash = isHit && (i === 3 || i === 5 || i === 8);
      const knockbackY = isImpactPhase ? -Math.sin(((i - 3) / 7) * Math.PI * 0.7) * 8 : 0;
      const shakeX = isImpactPhase ? ((i % 2 === 0 ? 1 : -1) * (5 - (i - 3) * 0.5)) : 0;

      frames.push({
        ...baseFrame,
        delay: 38,
        ...posOff(casterKickX, 0, shakeX, knockbackY),
        hitFlash,
        moveStep: 3,
        phaseId: `ancient-power-strike-${i + 1}`,
        phaseName: `#3. 돌무더기 고속 발사 및 연쇄 격돌 폭쇄 (${i + 1}/${step3Count})`,
        effectProgress: prog,
        wavelengthPhase: (globalIdx / totalFrames) * Math.PI * 4,
        showEffect: true,
        showBehindEffect: false,
      } as any);

      globalIdx++;
    }

    // ------------------------------------------------------------------------
    // [Step 4: 결(結) - 바위 파편 낙하 및 신비로운 에너지 잔향 소산] (7프레임, 45ms)
    // ------------------------------------------------------------------------
    const step4Count = 7;
    for (let i = 0; i < step4Count; i++) {
      const prog = i / (step4Count - 1);
      // 피격자 복귀 및 안정화
      const settleShakeX = isHit ? ((i % 2 === 0 ? 1 : -1) * Math.max(0, 2 - i * 0.6)) : 0;

      frames.push({
        ...baseFrame,
        delay: 45,
        ...posOff(0, 0, settleShakeX, 0),
        moveStep: 4,
        phaseId: `ancient-power-settle-${i + 1}`,
        phaseName: `#4. 잔여 파편 낙하 및 파장 잔향 소산 (${i + 1}/${step4Count})`,
        effectProgress: prog,
        wavelengthPhase: (globalIdx / totalFrames) * Math.PI * 4,
        showEffect: true,
        showBehindEffect: false,
      } as any);

      globalIdx++;
    }

    return frames;
  },
};
