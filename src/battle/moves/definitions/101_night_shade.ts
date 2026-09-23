// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawNightShadeEffect, drawNightShadeBehindEffect } from "../../../renderers/moves/gen1/move101_104.js";

/**
 * 101: 나이트헤드 (Night Shade) - 고스트 타입 고정 데미지 기술
 *
 * 연출 (유저 요구사항 100% 반영):
 * 1. 암전된 상태에서 암전은 점진적 페이드 인 (배경 레이어)
 * 2. 시전 포켓몬의 스프라이트는 지상 위치에 그대로 유지
 * 3. 시전자 위에 반투명 + 채도/밝기 살짝 높인 시전 포켓몬 스프라이트를 z축 위에 표시하고 크기를 커지게 연출
 * 4. 크기가 커지는 동안 적 포켓몬은 페이드인으로 검은 필터 적용
 * 5. 검은 필터 적용과 함께 적 포켓몬이 좌우로 흔들림 (공포 경련)
 * 6. 이후 자연스럽게 페이드 아웃
 * 7. 타격 이펙트 없이 (hitFlash: false, 물리적 타격 파티클 미사용)
 */
export const nightShadeMove: BattleMoveAnimation = {
  num: 101,
  key: "night-shade",
  nameKo: "나이트헤드",
  nameEn: "Night Shade",
  type: "ghost",
  category: "special",
  camera: { type: "none" }, // 전장 전체 뷰 (거대 환영 및 적 실루엣 전체 노출)
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.darkAlpha) return;
    drawNightShadeBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.phantomAlpha) return;
    drawNightShadeEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.0,
      pRot: 0,
      eRot: 0,
      hitFlash: false, // 유저 요청: 타격이펙트 없이
      pScale: { x: 1.0, y: 1.0 },
      eScale: { x: 1.0, y: 1.0 },
      hidePlayer: false,
      hideEnemy: false,
    };

    // 시전 포켓몬은 지상 위치 그대로 고정({0,0}), 적 포켓몬만 좌우 흔들림
    const tOff = (x: number, y: number) => ({
      pOffset: { x: 0, y: 0 },
      eOffset: isP ? { x, y } : { x: 0, y: 0 },
      ...(isP ? {} : { pOffset: { x, y } }),
    });

    return [
      // #1. 심연의 암전 개시 (배경 암전 페이드인 시작 & 반투명 환영 태동)
      {
        ...baseFrame,
        delay: 110,
        ...tOff(0, 0),
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.25,
        darkAlpha: 0.35,
        phantomAlpha: 0.22,
        phantomScale: 1.15,
        targetDarkLevel: 0.20,
        phaseId: "nightshade-charge",
        phaseName: "#1. 심연의 암전 개시",
      },
      // #2. 거대 환영 팽창 & 적 암흑 잠식 1 (적 좌측 흔들림)
      {
        ...baseFrame,
        delay: 100,
        ...tOff(-5, 0),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.50,
        darkAlpha: 0.70,
        phantomAlpha: 0.36,
        phantomScale: 1.55,
        targetDarkLevel: 0.55,
        phaseId: "nightshade-grow-1",
        phaseName: "#2. 거대 환영 팽창 (좌 흔들림)",
      },
      // #3. 거대 환영 포효 & 적 암흑 잠식 2 (적 우측 흔들림)
      {
        ...baseFrame,
        delay: 100,
        ...tOff(5, 0),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.75,
        darkAlpha: 0.90,
        phantomAlpha: 0.44,
        phantomScale: 2.05,
        targetDarkLevel: 0.85,
        phaseId: "nightshade-grow-2",
        phaseName: "#3. 거대 환영 포효 (우 흔들림)",
      },
      // #4. 극대화된 악몽의 환영 (최대 암전 & 환영 46% 반투명 유지 & 적 완전 흑화 실루엣 경련)
      {
        ...baseFrame,
        delay: 110,
        ...tOff(-5, 0),
        showEffect: true,
        moveStep: 4,
        effectProgress: 1.00,
        darkAlpha: 0.96,
        phantomAlpha: 0.46,
        phantomScale: 2.50,
        targetDarkLevel: 1.00,
        phaseId: "nightshade-peak",
        phaseName: "#4. 극대화된 악몽 환영 (적 흑화)",
      },
      // #5. 환영 소멸 개시 & 잔여 경련 (적 우측 흔들림)
      {
        ...baseFrame,
        delay: 100,
        ...tOff(3, 0),
        showEffect: true,
        moveStep: 5,
        effectProgress: 0.65,
        darkAlpha: 0.65,
        phantomAlpha: 0.35,
        phantomScale: 2.65,
        targetDarkLevel: 0.60,
        phaseId: "nightshade-fade-1",
        phaseName: "#5. 환영 소멸 개시 (페이드아웃)",
      },
      // #6. 암흑 잔영 페이드아웃 (암전 및 흑화 회복)
      {
        ...baseFrame,
        delay: 90,
        ...tOff(-1, 0),
        showEffect: true,
        moveStep: 6,
        effectProgress: 0.30,
        darkAlpha: 0.30,
        phantomAlpha: 0.18,
        phantomScale: 2.80,
        targetDarkLevel: 0.20,
        phaseId: "nightshade-fade-2",
        phaseName: "#6. 암흑 잔영 페이드아웃",
      },
      // #7. 안정 정상 복귀
      {
        ...baseFrame,
        delay: 80,
        ...tOff(0, 0),
        showEffect: false,
        moveStep: 7,
        effectProgress: 0.00,
        darkAlpha: 0.00,
        phantomAlpha: 0.00,
        phantomScale: 1.00,
        targetDarkLevel: 0.00,
        phaseId: "nightshade-finish",
        phaseName: "#7. 안정 정상 복귀",
      },
    ];
  },
};
