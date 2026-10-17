// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawRockSmashBehindEffect,
  drawRockSmashEffect,
} from "../../../renderers/moves/gen1/move249_252.js";

/**
 * 249: 바위깨기 (Rock Smash / いわくだき) - 격투 타입 물리 기술
 *
 * 위력: 40 / 명중: 100 / PP: 15 / 50% 확률로 상대 방어 1랭크 하락 / 접촉: O
 * 설명: 바위를 부수는 주먹으로 공격한다. 상대의 방어를 떨어뜨릴 때가 있다.
 *
 * [연출 플로우]:
 * 1. Step 1: 시전자 전진 및 정권 돌진 도약 (4프레임)
 * 2. Step 2: 작은 타격 이펙트 (정권 직격 & 콤팩트한 8각 스타버스트 & 섬광 플래시 & 미세 분진) (3프레임)
 * 3. Step 3: 바위 파쇄 & 3D 물리 돌파편 포물선 비산 (위로 살짝 튀었다가 포물선 낙하, 3D 다각도 텀블링) (12프레임)
 * 4. Step 4: 시전자 원위치 복귀 및 잔여 분진 안정화 (4프레임)
 */
export const rockSmashMove: BattleMoveAnimation = {
  num: 249,
  key: "rock-smash",
  nameKo: "바위깨기",
  nameEn: "Rock Smash",
  type: "fighting",
  category: "physical",
  camera: {
    type: "target",
    zoom: 1.25,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showBehindEffect) return;
    drawRockSmashBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawRockSmashEffect(targetCtx, frame, drawCtx);
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

    // ------------------------------------------------------------------------
    // [Step 1: 시전자 전진 및 정권 돌진 도약] (4프레임, 40ms)
    // ------------------------------------------------------------------------
    const dashOffsets = [
      { cx: -4, cy: 1 },
      { cx: 8, cy: -2 },
      { cx: 20, cy: -4 },
      { cx: 28, cy: -2 },
    ];

    for (let i = 0; i < 4; i++) {
      const prog = i / 3;
      frames.push({
        ...baseFrame,
        delay: 40,
        ...cOff(dashOffsets[i].cx, dashOffsets[i].cy),
        moveStep: 1,
        phaseId: `rock-smash-charge-${i + 1}`,
        phaseName: `#1. 정권 돌진 도약 (${i + 1}/4)`,
        effectProgress: prog,
        showEffect: false,
        showBehindEffect: false,
      });
    }

    // ------------------------------------------------------------------------
    // [Step 2: 정권 직격 & 작은 타격 이펙트 순간] (3프레임, 35ms)
    // ------------------------------------------------------------------------
    const hitImpactOffsets = [
      { cx: 32, cy: 0, tx: -6, hitFlash: true },
      { cx: 30, cy: 0, tx: 5, hitFlash: false },
      { cx: 26, cy: 0, tx: -3, hitFlash: false },
    ];

    for (let i = 0; i < 3; i++) {
      const prog = i / 2;
      const off = hitImpactOffsets[i];
      frames.push({
        ...baseFrame,
        delay: 35,
        ...cOff(off.cx, off.cy),
        ...tOff(isHit ? off.tx : 0, 0),
        hitFlash: isHit && off.hitFlash,
        moveStep: 2,
        phaseId: `rock-smash-impact-${i + 1}`,
        phaseName: `#2. 타격 직격 및 8각 스타버스트 섬광 (${i + 1}/3)`,
        effectProgress: prog,
        hitProgress: prog,
        showEffect: isHit,
        showBehindEffect: false,
      });
    }

    // ------------------------------------------------------------------------
    // [Step 3: 바위 파쇄 & 3D 물리 돌파편 포물선 비산] (12프레임, 40ms)
    // ------------------------------------------------------------------------
    const debrisFrameCount = 12;
    for (let i = 0; i < debrisFrameCount; i++) {
      const prog = i / (debrisFrameCount - 1);

      // 시전자 반동 감속 복귀
      const casterReturnX = Math.max(0, 20 - i * 1.8);

      // 피격자 반응 (초반 진동 후 정위치 수렴)
      let targetShakeX = 0;
      if (isHit && i < 6) {
        targetShakeX = (i % 2 === 0 ? 1 : -1) * Math.max(0, 4 - i * 0.7);
      }

      frames.push({
        ...baseFrame,
        delay: 40,
        ...cOff(casterReturnX, 0),
        ...tOff(targetShakeX, 0),
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 3,
        phaseId: `rock-smash-debris-${i + 1}`,
        phaseName: `#3. 3D 다각도 암석 파편 포물선 비산 (${i + 1}/${debrisFrameCount})`,
        effectProgress: prog,
        hitProgress: 1.0,
        showEffect: isHit,
        showBehindEffect: isHit,
      });
    }

    // ------------------------------------------------------------------------
    // [Step 4: 안정화 및 시전자 원위치 복귀] (4프레임, 45ms)
    // ------------------------------------------------------------------------
    for (let i = 0; i < 4; i++) {
      const prog = i / 3;
      const settleX = Math.max(0, 3 - i);

      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(settleX, 0),
        ...tOff(0, 0),
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        moveStep: 4,
        phaseId: `rock-smash-settle-${i + 1}`,
        phaseName: `#4. 정위치 복귀 및 잔여 분진 안정화 (${i + 1}/4)`,
        effectProgress: prog,
        showEffect: true,
        showBehindEffect: false,
      });
    }

    return frames;
  },
};
