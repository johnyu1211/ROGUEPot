// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawSweetScentBehindEffect,
  drawSweetScentEffect,
} from "../../../renderers/moves/gen1/move229_232.js";

/**
 * 230: 달콤한향기 (Sweet Scent / あまいかおり) - 노말 타입 변화 기술
 *
 * 위력: — / 명중: 100 / PP: 20 / 대상: 상대 / 접촉: X
 * 설명: 향기로 상대의 회피율을 크게(2랭크) 떨어뜨린다.
 *
 * [유저 요구사항 100% 반영]:
 * > 화면페이드로 반투명 분홍과 동시에 꽃 잎이 화면 왼쪽 에서 나타나서 오른쪽ㅇ로 페이드아웃 (상대시점 반대방향)
 */
export const sweetScentMove: BattleMoveAnimation = {
  num: 230,
  key: "sweet-scent",
  nameKo: "달콤한향기",
  nameEn: "Sweet Scent",
  type: "normal",
  category: "status",
  customStatParticles: true,
  camera: {
    type: "none", // 전체 전장 와이드 조망 (화면 전체 핑크 페이드 및 꽃잎 횡단 궤적 유지)
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawSweetScentBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawSweetScentEffect(targetCtx, frame, drawCtx);
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

    const cOff = (x = 0, y = 0) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y } : { x: 0, y: 0 },
    });

    const tOff = (x = 0, y = 0) => ({
      pOffset: !isP ? { x: -x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x, y } : { x: 0, y: 0 },
    });

    const cScale = (x = 1.0, y = 1.0) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    const tRot = (rot = 0) => ({
      pRot: !isP ? rot : undefined,
      eRot: isP ? rot : undefined,
    });

    const frames: BattleFrame[] = [];

    // ========================================================================
    // 빗맞았을 때 (Miss 처리)
    // ========================================================================
    if (!isHit) {
      // Step 1: 기(起) - 향기 개화 & 화면 핑크 페이드인 (5프레임, 50ms)
      for (let i = 0; i < 5; i++) {
        const prog = i / 4;
        const bobY = -Math.sin(prog * Math.PI) * 7;
        frames.push({
          ...baseFrame,
          delay: 50,
          ...cOff(0, bobY),
          ...cScale(1.06 - prog * 0.04, 0.94 + prog * 0.06),
          moveStep: 1,
          phaseId: `sweet-scent-miss-bloom-${i + 1}`,
          phaseName: "#1. 달콤한 향기 개화 및 화면 핑크 페이드인",
          effectProgress: prog,
          globalProgress: prog * 0.20,
          pinkFadeAlpha: prog * 0.38,
          showEffect: true,
          showBehindEffect: true,
        });
      }

      // Step 2: 승(承) - 꽃잎이 화면을 가로질러 흩날림 (8프레임, 45ms)
      for (let i = 0; i < 8; i++) {
        const prog = i / 7;
        frames.push({
          ...baseFrame,
          delay: 45,
          ...cOff(0, 0),
          moveStep: 2,
          phaseId: `sweet-scent-miss-drift-${i + 1}`,
          phaseName: "#2. 꽃잎이 화면을 가로질러 흩날림",
          effectProgress: prog,
          globalProgress: 0.20 + prog * 0.50,
          pinkFadeAlpha: 0.38 - prog * 0.04,
          showEffect: true,
          showBehindEffect: true,
        });
      }

      // Step 3: 대상 회피 (눈 돌림 / 물러섬) (5프레임, 50ms)
      for (let i = 0; i < 5; i++) {
        const prog = i / 4;
        const dodgeX = Math.sin(prog * Math.PI) * 16;
        frames.push({
          ...baseFrame,
          delay: 50,
          ...tOff(dodgeX, -Math.sin(prog * Math.PI) * 6),
          moveStep: 3,
          phaseId: `sweet-scent-miss-dodge-${i + 1}`,
          phaseName: "#3. 대상 회피 (향기를 피해 물러섬)",
          effectProgress: prog,
          globalProgress: 0.70 + prog * 0.25,
          pinkFadeAlpha: 0.34 - prog * 0.16,
          showEffect: true,
          showBehindEffect: false,
        });
      }

      // Step 4: 복귀 및 핑크 페이드 소산 (4프레임, 45ms)
      for (let i = 0; i < 4; i++) {
        const prog = i / 3;
        frames.push({
          ...baseFrame,
          delay: 45,
          ...tOff(0, 0),
          moveStep: 4,
          phaseId: `sweet-scent-miss-fade-${i + 1}`,
          phaseName: "#4. 화면 페이드아웃 및 정위치 복귀",
          effectProgress: prog,
          globalProgress: 1.0,
          pinkFadeAlpha: Math.max(0, 0.18 * (1.0 - prog)),
          showEffect: true,
          showBehindEffect: false,
        });
      }

      return frames;
    }

    // ========================================================================
    // 명중 시 (Hit 처리)
    // ========================================================================

    // [Step 1: 기(起) - 달콤한 향기 개화 및 화면 핑크 페이드인] (5프레임, 50ms)
    for (let i = 0; i < 5; i++) {
      const prog = i / 4;
      const bobY = -Math.sin(prog * Math.PI) * 7;

      frames.push({
        ...baseFrame,
        delay: 50,
        ...cOff(0, bobY),
        ...cScale(1.06 - prog * 0.04, 0.94 + prog * 0.06),
        moveStep: 1,
        phaseId: `sweet-scent-blossom-${i + 1}`,
        phaseName: "#1. 달콤한 향기 개화 & 화면 핑크 페이드인",
        effectProgress: prog,
        globalProgress: prog * 0.20,
        pinkFadeAlpha: prog * 0.38,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // [Step 2: 승(承) - 꽃잎이 화면을 가로질러 흩날림] (9프레임, 45ms)
    // - 플레이어 시점: 화면 왼쪽에서 나타나 오른쪽으로 페이드아웃
    // - 상대 시점: 화면 오른쪽에서 나타나 왼쪽으로 페이드아웃
    for (let i = 0; i < 9; i++) {
      const prog = i / 8;
      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        moveStep: 2,
        phaseId: `sweet-scent-drift-${i + 1}`,
        phaseName: "#2. 꽃잎이 화면을 가로질러 흩날림",
        effectProgress: prog,
        globalProgress: 0.20 + prog * 0.50,
        pinkFadeAlpha: 0.38 - prog * 0.04,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // [Step 3: 전(轉) - 대상을 둘러싼 향기와 꽃잎 페이드아웃] (6프레임, 50ms)
    for (let i = 0; i < 6; i++) {
      const prog = i / 5;
      const swayX = Math.sin(prog * Math.PI * 2) * 5;
      const swayRot = Math.sin(prog * Math.PI * 2) * 0.04;

      frames.push({
        ...baseFrame,
        delay: 50,
        ...tOff(swayX, 0),
        ...tRot(swayRot),
        moveStep: 3,
        phaseId: `sweet-scent-envelop-${i + 1}`,
        phaseName: "#3. 대상을 둘러싼 향기와 꽃잎 페이드아웃",
        effectProgress: prog,
        globalProgress: 0.70 + prog * 0.30,
        pinkFadeAlpha: 0.34 - prog * 0.14,
        showEffect: true,
        showBehindEffect: false,
      });
    }

    // [Step 4: 결(結) - 상대 긴장 완화 및 회피율 2랭크 하락 디버프] (6프레임, 50ms)
    for (let i = 0; i < 6; i++) {
      const stepProg = i / 5;
      const statProg = 0.12 + stepProg * 0.82;
      frames.push({
        ...baseFrame,
        delay: 50,
        ...tOff(0, 0),
        moveStep: 4,
        phaseId: `sweet-scent-debuff-${i + 1}`,
        phaseName: "#4. 상대 긴장 완화 및 회피율 2랭크 하락 디버프",
        effectProgress: stepProg,
        globalProgress: 1.0,
        pinkFadeAlpha: Math.max(0, 0.20 * (1.0 - stepProg)),
        statDropProgress: statProg,
        showEffect: true,
        showBehindEffect: false,
      });
    }

    return frames;
  },
};
