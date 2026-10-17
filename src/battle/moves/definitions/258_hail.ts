// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawHailBehindEffect,
  drawHailEffect,
} from "../../../renderers/moves/gen1/move257_260.js";

/**
 * 258: 싸라기눈 (Hail / あられ) - 얼음 타입 변화 기술 (날씨)
 *
 * 위력: — / 명중: — / PP: 10 / 5턴간 싸라기눈 날씨 조성
 * 설명: 5턴 동안 싸라기눈을 내리게 하여 얼음 타입 이외의 포켓몬에게 매 턴 데미지를 준다.
 *
 * [유저 요구사항 100% 반영]:
 * 1. 암전: 페이드 인으로 검정 색깔 70% (blackFadeAlpha: 0.0 -> 0.70)
 * 2. 3D 돌멩이 입자:
 *    - 3D 각진 돌멩이 형태
 *    - 돌 색깔 중간 부분 투명 / 반투명 (맑은 얼음)
 *    - 외곽 부분 순백색 엣지로 얼음 결정체 질감 구현
 *    - 일부분 짙은 쿨 그레이 음영 처리로 확실한 3D 입체감
 *    - 작은 입자 크기 (3.2 ~ 6.2px)
 *    - 상공 위에서 아래로 수직 고속 낙하
 * 3. 지면 착지 & 통통 바운스:
 *    - 비바라기처럼 바닥 착지 시 충격파 링 & 튀는 얼음 파편
 *    - 바닥에 떨어지면 탄도학 통통 바운스 (1차 대형 점프 ➔ 2차 소형 점프 ➔ 안착)
 */
export const hailMove: BattleMoveAnimation = {
  num: 258,
  key: "hail",
  nameKo: "싸라기눈",
  nameEn: "Hail",
  type: "ice",
  category: "status",
  camera: {
    type: "none",
    zoom: 1.0,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawHailBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawHailEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      cameraZoom: 1.0,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
    };

    const cOff = (x = 0, y = 0) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y } : { x: 0, y: 0 },
    });

    const frames: BattleFrame[] = [];

    // =========================================================================
    // [Step 1: 기원 & 70% 암전 페이드인] (4프레임, 50ms)
    // - 시전자 웅크림 및 도약
    // - 화면 전체가 페이드 인으로 70% 암전에 도달
    // =========================================================================
    const step1Alphas = [0.18, 0.38, 0.55, 0.70];
    for (let i = 0; i < 4; i++) {
      const prog = i / 3;
      const bobY = i % 2 === 0 ? -3 : 1;
      frames.push({
        ...baseFrame,
        delay: 50,
        ...cOff(0, bobY),
        moveStep: 1,
        phaseId: `hail-gather-${i + 1}`,
        phaseName: `#1. 기원 & 암전 70% 페이드인 (${Math.round(step1Alphas[i] * 100)}%)`,
        effectProgress: prog,
        blackFadeAlpha: step1Alphas[i],
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // =========================================================================
    // [Step 2: 싸라기눈 본격 쇄도 & 바닥 통통 바운스] (9프레임, 50ms)
    // - 70% 암전 속에서 3D 투명 얼음 돌멩이들이 상공에서 고속 수직 낙하
    // - 바닥 착지 시 충격파 링 생성 및 얼음 돌멩이가 "통통" 튀어오름
    // =========================================================================
    for (let i = 0; i < 9; i++) {
      const prog = i / 8;
      frames.push({
        ...baseFrame,
        delay: 50,
        ...cOff(0, 0),
        moveStep: 2,
        phaseId: `hail-storm-${i + 1}`,
        phaseName: `#2. 싸라기눈 3D 얼음 돌멩이 낙하 & 지면 통통 바운스 (${i + 1}/9)`,
        effectProgress: prog,
        blackFadeAlpha: 0.70,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // =========================================================================
    // [Step 3: 필드 안정화 & 암전 서서히 걷힘] (6프레임, 50ms)
    // - 돌멩이들이 2차 바운스 후 안착 및 소산
    // - 암전이 자연스럽게 페이드아웃되며 날씨 정착
    // =========================================================================
    const step3Alphas = [0.70, 0.60, 0.45, 0.30, 0.15, 0.00];
    for (let i = 0; i < 6; i++) {
      const prog = i / 5;
      frames.push({
        ...baseFrame,
        delay: 50,
        ...cOff(0, 0),
        moveStep: 3,
        phaseId: `hail-settle-${i + 1}`,
        phaseName: `#3. 싸라기눈 안착 & 날씨 조성 완료 (${i + 1}/6)`,
        effectProgress: prog,
        blackFadeAlpha: step3Alphas[i],
        showEffect: true,
        showBehindEffect: true,
      });
    }

    return frames;
  },
};
