// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawExtremeSpeedBehindEffect,
  drawExtremeSpeedEffect,
} from "../../../renderers/moves/gen1/move245_248.js";

/**
 * 245: 신속 (Extreme Speed / しんそく) - 노말 타입 물리 기술
 *
 * 위력: 80 / 명중: 100 / PP: 5 / 우선도: +2 / 접촉: O
 * 설명: 눈에 보이지 않을 정도의 엄청난 스피드로 상대에게 돌진하여 공격한다. 반드시 선제공격할 수 있다.
 *
 * [연출 플로우]:
 * 1. 배경 필터 페이드인 (상하 파란색, 중간 하늘색) & 오른쪽 -> 왼쪽 초고속 하늘색 스피드 라인
 * 2. 시전 포켓몬 가로로 얇아지면서 완벽히 얇아져서 소멸
 * 3. 원래 위치에 흰색 연기 퐁! 나타나서 소산
 * 4. 적 뒤로 가서 전면을 보이는 채로 3프레임 동안 보임
 * 5. 사라지면서 타격 이펙트 (강렬한 타격 충격파 & 섬광 + 적 넉백 피격)
 * 6. 제자리로 복귀 및 착지 안착 (배경 필터 페이드아웃)
 */
export const extremeSpeedMove: BattleMoveAnimation = {
  num: 245,
  key: "extreme-speed",
  nameKo: "신속",
  nameEn: "Extreme Speed",
  type: "normal",
  category: "physical",
  camera: {
    type: "none",
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawExtremeSpeedBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawExtremeSpeedEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      cameraZoom: 1.0,
      showBehindEffect: true,
      showEffect: true,
    };

    const posOff = (casterX = 0, casterY = 0, targetX = 0, targetY = 0) => ({
      pOffset: isP ? { x: casterX, y: casterY } : { x: targetX, y: targetY },
      eOffset: isP ? { x: targetX, y: targetY } : { x: casterX, y: casterY },
    });

    const cScale = (x = 1.0, y = 1.0) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    const cAlpha = (alpha = 1.0) => ({
      pAlpha: isP ? alpha : undefined,
      eAlpha: !isP ? alpha : undefined,
    });

    const frames: BattleFrame[] = [];
    const totalFramesCount = 25;
    let globalFrameIdx = 0;

    // ------------------------------------------------------------------------
    // [Step 1: 배경 필터 페이드인 & 초고속 하늘색 스피드 라인 전개] (5프레임, 45ms)
    // ------------------------------------------------------------------------
    const step1Count = 5;
    for (let i = 0; i < step1Count; i++) {
      const prog = i / (step1Count - 1);
      const bgProg = globalFrameIdx / totalFramesCount;

      const chargeX = (isP ? 1 : -1) * (-prog * 4);
      const chargeY = prog * 2;

      frames.push({
        ...baseFrame,
        delay: 45,
        ...posOff(chargeX, chargeY, 0, 0),
        ...cScale(1.0, 1.0),
        ...cAlpha(1.0),
        moveStep: 1,
        phaseId: `extreme-speed-bg-${i + 1}`,
        phaseName: `#1. 배경 필터 페이드인 및 고속 스피드 라인 (${i + 1}/${step1Count})`,
        effectProgress: prog,
        bgProgress: bgProg,
        showEffect: false,
      } as any);

      globalFrameIdx++;
    }

    // ------------------------------------------------------------------------
    // [Step 2: 시전 포켓몬 가로로 얇아지면서 완벽히 얇아짐 (소멸)] (4프레임, 38ms)
    // ------------------------------------------------------------------------
    const shrinkScales = [
      { sx: 0.70, sy: 1.04, alpha: 1.00 },
      { sx: 0.40, sy: 1.08, alpha: 1.00 },
      { sx: 0.15, sy: 1.14, alpha: 0.85 },
      { sx: 0.00, sy: 1.20, alpha: 0.00 }, // 완벽히 얇아짐!
    ];

    for (let i = 0; i < shrinkScales.length; i++) {
      const { sx, sy, alpha } = shrinkScales[i];
      const prog = i / (shrinkScales.length - 1);
      const bgProg = globalFrameIdx / totalFramesCount;
      const isCompletelyThin = sx <= 0.001;

      frames.push({
        ...baseFrame,
        delay: 38,
        ...posOff((isP ? 1 : -1) * -4, 2, 0, 0),
        ...cScale(sx, sy),
        ...cAlpha(alpha),
        hidePlayer: isCompletelyThin && isP,
        hideEnemy: isCompletelyThin && !isP,
        hidePShadow: isCompletelyThin && isP,
        hideEShadow: isCompletelyThin && !isP,
        moveStep: 2,
        phaseId: `extreme-speed-shrink-${i + 1}`,
        phaseName: `#2. 시전 포켓몬 가로 압축 소멸 (${i + 1}/${shrinkScales.length})`,
        effectProgress: prog,
        bgProgress: bgProg,
        smokeProgress: isCompletelyThin ? 0.0 : undefined,
        showEffect: isCompletelyThin,
      } as any);

      globalFrameIdx++;
    }

    // ------------------------------------------------------------------------
    // [Step 3: 시전 포켓몬 원래 위치에 흰색 연기 발생 및 소산] (5프레임, 40ms)
    // ------------------------------------------------------------------------
    const step3Count = 5;
    for (let i = 0; i < step3Count; i++) {
      const prog = i / (step3Count - 1);
      const bgProg = globalFrameIdx / totalFramesCount;
      const smokeProg = 0.15 + prog * 0.85;

      frames.push({
        ...baseFrame,
        delay: 40,
        ...posOff(0, 0, 0, 0),
        ...cScale(0.0, 0.0),
        ...cAlpha(0.0),
        hidePlayer: isP,
        hideEnemy: !isP,
        hidePShadow: isP,
        hideEShadow: !isP,
        moveStep: 3,
        phaseId: `extreme-speed-smoke-${i + 1}`,
        phaseName: `#3. 원래 위치 흰색 연기 소산 (${i + 1}/${step3Count})`,
        effectProgress: prog,
        bgProgress: bgProg,
        smokeProgress: smokeProg,
        showEffect: true,
      } as any);

      globalFrameIdx++;
    }

    // ------------------------------------------------------------------------
    // [Step 4: 적 뒤에 선다 = 적 뒤로 가서 전면을 보이는 채로 3프레임 보임] (3프레임, 45ms)
    // ------------------------------------------------------------------------
    const behindOffX = isP ? 285 : -285;
    const behindOffY = isP ? -140 : 140;

    // 원근감 스케일 비율 (Perspective Scale):
    // - 플레이어(135px)가 적(95px) 뒤(원경)로 이동 시: 95 / 135 ≈ 0.70 축소
    // - 적(95px)이 플레이어(135px) 뒤(근경)로 이동 시: 135 / 95 ≈ 1.42 확대
    const pScaleFactor = isP ? 0.70 : 1.42;

    for (let i = 0; i < 3; i++) {
      const bgProg = globalFrameIdx / totalFramesCount;

      frames.push({
        ...baseFrame,
        delay: 45,
        ...posOff(behindOffX, behindOffY, 0, 0),
        ...cScale(pScaleFactor, pScaleFactor),
        ...cAlpha(1.0),
        usePlayerFront: isP,  // 아군 포켓몬: 적 등 뒤에서 전면(앞모습)을 보임!
        useEnemyBack: !isP,   // 적 포켓몬: 아군 등 뒤에서 전면(대상을 향한 등모습)을 보임!
        drawEnemyOnTop: true, // Z축 보정: 플레이어가 적 뒤로 갈 때는 적이 앞을 가리고, 적이 플레이어 뒤(화면 앞쪽)로 올 때는 적이 Z축 위에 위치!
        moveStep: 4,
        phaseId: `extreme-speed-behind-${i + 1}`,
        phaseName: `#4. 적 뒤에서 전면 대치 (${i + 1}/3)`,
        effectProgress: i / 2,
        bgProgress: bgProg,
        showEffect: false,
      } as any);

      globalFrameIdx++;
    }

    // ------------------------------------------------------------------------
    // [Step 5: 사라지면서 타격 이펙트] (4프레임, 40ms)
    // ------------------------------------------------------------------------
    const strikeScales = [
      { sx: pScaleFactor * 0.35, sy: pScaleFactor * 1.15, alpha: 0.65 },
      { sx: 0.00, sy: pScaleFactor * 1.20, alpha: 0.00 },
      { sx: 0.00, sy: pScaleFactor * 1.20, alpha: 0.00 },
      { sx: 0.00, sy: pScaleFactor * 1.20, alpha: 0.00 },
    ];

    const knockbacks = isP
      ? [
          { tx: -14, ty: 4 },
          { tx: -10, ty: -3 },
          { tx: -5, ty: 2 },
          { tx: 0, ty: 0 },
        ]
      : [
          { tx: 14, ty: -4 },
          { tx: 10, ty: 3 },
          { tx: 5, ty: -2 },
          { tx: 0, ty: 0 },
        ];

    for (let i = 0; i < strikeScales.length; i++) {
      const { sx, sy, alpha } = strikeScales[i];
      const { tx, ty } = knockbacks[i];
      const prog = i / (strikeScales.length - 1);
      const bgProg = globalFrameIdx / totalFramesCount;
      const isCompletelyGone = sx <= 0.001;

      frames.push({
        ...baseFrame,
        delay: 40,
        ...posOff(behindOffX, behindOffY, tx, ty),
        ...cScale(sx, sy),
        ...cAlpha(alpha),
        usePlayerFront: isP,
        useEnemyBack: !isP,
        drawEnemyOnTop: true, // Z축 유지: 타격 순간에도 적이 Z축 위에 위치
        hidePlayer: isCompletelyGone && isP,
        hideEnemy: isCompletelyGone && !isP,
        hidePShadow: isCompletelyGone && isP,
        hideEShadow: isCompletelyGone && !isP,
        hitFlash: isHit && i === 0,
        moveStep: 5,
        phaseId: `extreme-speed-hit-${i + 1}`,
        phaseName: `#5. 사라지면서 타격 이펙트 작렬 (${i + 1}/${strikeScales.length})`,
        effectProgress: prog,
        bgProgress: bgProg,
        hitProgress: isHit ? prog : undefined,
        showEffect: isHit,
      } as any);

      globalFrameIdx++;
    }

    // ------------------------------------------------------------------------
    // [Step 6: 제자리로 복귀 및 착지 안착 (배경 필터 페이드아웃)] (4프레임, 45ms)
    // ------------------------------------------------------------------------
    const landConfigs = [
      { y: -14, sx: 0.45, sy: 1.25, alpha: 0.85 },
      { y: 2, sx: 1.15, sy: 0.88, alpha: 1.00 },
      { y: -2, sx: 0.96, sy: 1.04, alpha: 1.00 },
      { y: 0, sx: 1.00, sy: 1.00, alpha: 1.00 },
    ];

    for (let i = 0; i < landConfigs.length; i++) {
      const { y, sx, sy, alpha } = landConfigs[i];
      const prog = i / (landConfigs.length - 1);
      const bgProg = globalFrameIdx / totalFramesCount;

      frames.push({
        ...baseFrame,
        delay: 45,
        ...posOff(0, y, 0, 0),
        ...cScale(sx, sy),
        ...cAlpha(alpha),
        usePlayerFront: false, // 원래 기본 배틀 자세로 복귀
        useEnemyBack: false,
        drawEnemyOnTop: false,
        moveStep: 6,
        phaseId: `extreme-speed-land-${i + 1}`,
        phaseName: `#6. 원래 제자리 착지 복귀 (${i + 1}/${landConfigs.length})`,
        effectProgress: prog,
        bgProgress: bgProg,
        showEffect: false,
      } as any);

      globalFrameIdx++;
    }

    return frames;
  },
};
