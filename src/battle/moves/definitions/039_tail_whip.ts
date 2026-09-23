// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawTailWhipEffect } from "../../../renderers/moves/gen1/move037_040.js";

/**
 * 039: 꼬리흔들기 (Tail Whip)
 * 
 * Concept:
 * - 시전자 시선 전환: 전면 ➔ 후면, 후면 ➔ 전면으로 전환하여 상대를 향해 꼬리/뒤태 노출
 * - 살랑거리듯 돌기: 회전각(Rot) 없이 순수 위치(Offset)의 유려한 타원/원형 궤적 2회 왕복 살랑임
 * - 이펙트 없음: 공격 이펙트 일체 없이 시전자 스프라이트 모션과 방어력 하락 화살표만으로 연출
 */
export const tailWhipMove: BattleMoveAnimation = {
  num: 39,
  key: "tail-whip",
  nameKo: "꼬리흔들기",
  nameEn: "Tail Whip",
  type: "normal",
  category: "status",
  camera: { type: "none" },
  drawEffect: drawTailWhipEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const debuffLineIdx = (a?.log && a.log.includes("\n")) ? (textLineIdx + 1) : textLineIdx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      showEffect: false,
      hitFlash: false,
      cameraZoom: 1.0,
      pRot: 0,
      eRot: 0,
      afterCameraReturn: true,
      hideUI: false,
    };

    // 시전자가 전면이면 후면, 후면이면 전면으로 전환:
    // 플레이어(기본 후면) ➔ 전면(usePlayerFront: true)
    // 적(기본 전면) ➔ 후면(useEnemyBack: true)
    const activeFront = isP;
    const activeBack = !isP;

    // 살랑거리듯 도는 타원 궤적 오프셋 (회전 각도 없이 순수 위치 움직임)
    const swayOffsets = [
      { ox: 8, oy: -4, sx: 0.98, sy: 1.02, name: "우상단 살랑" },
      { ox: 14, oy: 1, sx: 1.03, sy: 0.97, name: "우측 스윙" },
      { ox: 0, oy: 5, sx: 1.05, sy: 0.95, name: "하단 딥" },
      { ox: -14, oy: 1, sx: 1.03, sy: 0.97, name: "좌측 스윙" },
      { ox: -8, oy: -4, sx: 0.98, sy: 1.02, name: "좌상단 살랑" },
      { ox: 0, oy: -3, sx: 0.97, sy: 1.03, name: "상단 리프트" },
    ];

    const frames: BattleFrame[] = [];

    // 1. 시전자 뒤돌아 자세 전환 (전면 ➔ 후면 / 후면 ➔ 전면)
    frames.push({
      ...baseFrame,
      delay: 110,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
      usePlayerFront: activeFront,
      useEnemyBack: activeBack,
      phaseId: "tailwhip-turn",
      phaseName: "1. 뒤돌아 자세 전환",
    });

    // 2. 1차 살랑 돌기 (6단계 원형 궤적 움직임)
    for (let i = 0; i < swayOffsets.length; i++) {
      const pt = swayOffsets[i];
      frames.push({
        ...baseFrame,
        delay: 75,
        pOffset: isP ? { x: pt.ox, y: pt.oy } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -pt.ox, y: pt.oy } : { x: 0, y: 0 },
        pScale: isP ? { x: pt.sx, y: pt.sy } : undefined,
        eScale: !isP ? { x: pt.sx, y: pt.sy } : undefined,
        usePlayerFront: activeFront,
        useEnemyBack: activeBack,
        phaseId: `tailwhip-sway1-${i + 1}`,
        phaseName: `2. 1차 살랑 돌기 (${pt.name})`,
      });
    }

    // 3. 2차 살랑 돌기 & 방어력 하락 화살표 표시
    const statProgSteps = [0.18, 0.38, 0.58, 0.78, 0.90, 0.96];
    for (let i = 0; i < swayOffsets.length; i++) {
      const pt = swayOffsets[i];
      frames.push({
        ...baseFrame,
        textLineIdx: debuffLineIdx,
        delay: 75,
        pOffset: isP ? { x: pt.ox, y: pt.oy } : { x: 0, y: 0 },
        eOffset: !isP ? { x: -pt.ox, y: pt.oy } : { x: 0, y: 0 },
        pScale: isP ? { x: pt.sx, y: pt.sy } : undefined,
        eScale: !isP ? { x: pt.sx, y: pt.sy } : undefined,
        usePlayerFront: activeFront,
        useEnemyBack: activeBack,
        statProgress: statProgSteps[i],
        afterCameraReturn: true,
        hideUI: false,
        phaseId: `tailwhip-sway2-${i + 1}`,
        phaseName: `3. 2차 살랑 돌기 (${pt.name})`,
      });
    }

    // 4. 중앙 안착 및 잠시 정지
    frames.push({
      ...baseFrame,
      textLineIdx: debuffLineIdx,
      delay: 90,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
      pScale: { x: 1.0, y: 1.0 },
      eScale: { x: 1.0, y: 1.0 },
      usePlayerFront: activeFront,
      useEnemyBack: activeBack,
      statProgress: 0.98,
      afterCameraReturn: true,
      hideUI: false,
      phaseId: "tailwhip-settle",
      phaseName: "4. 살랑임 정지",
    });

    // 5. 기본 정면/후면 자세 복귀 (원래 시선으로 복귀 완료)
    frames.push({
      ...baseFrame,
      textLineIdx: debuffLineIdx,
      delay: 130,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
      pScale: { x: 1.0, y: 1.0 },
      eScale: { x: 1.0, y: 1.0 },
      usePlayerFront: false,
      useEnemyBack: false,
      afterCameraReturn: true,
      hideUI: false,
      phaseId: "tailwhip-finish",
      phaseName: "5. 원래 자세 복귀",
    });

    return frames;
  }
};
