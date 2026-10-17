// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawHiddenPowerBehindEffect,
  drawHiddenPowerEffect,
} from "../../../renderers/moves/gen1/move237_240.js";

/**
 * 237: 잠재파워 (Hidden Power / めざめるパワー) - 특수 기술
 *
 * 위력: 60 / 명중: 100 / PP: 15 / 비접촉
 * 설명: 시전자의 개체값(IV)에 따라 기술의 속성과 위력이 변화한다.
 */
export const hiddenPowerMove: BattleMoveAnimation = {
  num: 237,
  key: "hidden-power",
  nameKo: "잠재파워",
  nameEn: "Hidden Power",
  type: "normal",
  category: "special",
  camera: {
    type: "target",
    zoom: 1.25,
    delayUntilStep: 4,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawHiddenPowerBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawHiddenPowerEffect(targetCtx, frame, drawCtx);
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

    // [Step 1: 화면 암전 & 3차원 회전하며 시전자 포켓몬 스프라이트 위치로 수렴] (11프레임, 45ms)
    // - 전장 암전 (darkAlpha: 0.25 -> 0.75)
    // - 5개의 주황빛 오라 구체가 시전자 포켓몬 스프라이트를 중심으로 수평 나선 회전하며 중심으로 지속적 수렴
    // - 멀리서 페이드 인되며 끊김 없는 부드러운 회전 궤적으로 시전자 중심점으로 쇄도 흡인
    const gatherSteps = 11;
    const gatherDarkAlphas = [0.25, 0.40, 0.55, 0.68, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75];
    for (let i = 0; i < gatherSteps; i++) {
      const prog = i / (gatherSteps - 1);
      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        moveStep: 1,
        phaseId: `hidden-power-gather-${i + 1}`,
        phaseName: "#1. 3D 회전 주황빛 에너지 페이드 인 & 시전자 수렴",
        effectProgress: prog,
        darkAlpha: gatherDarkAlphas[i],
        blackFadeAlpha: 0.0,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // [Step 2: 시전자 포켓몬 위치에서 응축 & 초록색 변환] (6프레임, 45ms)
    // - 시전자 포켓몬 스프라이트 위치로 완전히 모여든 에너지가 응축 구체 형성
    // - 주황빛에서 눈부신 에메랄드 초록빛으로 색상 변환 및 백색 자글자글한 코어 고속 진동
    const condenseSteps = 6;
    for (let i = 0; i < condenseSteps; i++) {
      const prog = i / (condenseSteps - 1);
      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(i < 3 ? 2 : 0, 0),
        moveStep: 2,
        phaseId: `hidden-power-condense-${i + 1}`,
        phaseName: "#2. 에너지 집결 응축 & 초록빛 변환",
        effectProgress: prog,
        darkAlpha: 0.75,
        blackFadeAlpha: 0.0,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // [Step 3: 발사 & 3D 원형 링 확장 및 회전] (7프레임, 45ms)
    // - 시전자 포켓몬 위치에서 전방을 향해 굉음과 함께 발사
    // - 발사 순간 6개의 초록 에너지 덩어리들이 사방으로 3D 원형 링을 형성하며 매끄럽게 회전 개화
    const fireSteps = 7;
    for (let i = 0; i < fireSteps; i++) {
      const prog = i / (fireSteps - 1);
      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(i === 0 ? -3 : 0, 0),
        moveStep: 3,
        phaseId: `hidden-power-fire-${i + 1}`,
        phaseName: "#3. 발사 및 3D 원형 링 회전 개화",
        effectProgress: prog,
        darkAlpha: 0.70,
        blackFadeAlpha: 0.0,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // [Step 4: 3D 나선 회전하며 상대방 스프라이트로 쇄도 돌진] (7프레임, 40ms)
    // - 원형 링을 형성했던 6개의 구체들이 나선을 그리며 고속 회전하여 상대방 스프라이트로 일제히 돌진
    const rushSteps = 7;
    for (let i = 0; i < rushSteps; i++) {
      const prog = i / (rushSteps - 1);
      frames.push({
        ...baseFrame,
        delay: 40,
        ...cOff(0, 0),
        moveStep: 4,
        phaseId: `hidden-power-rush-${i + 1}`,
        phaseName: "#4. 3D 나선 회전 돌진",
        effectProgress: prog,
        darkAlpha: 0.70,
        blackFadeAlpha: 0.0,
        showEffect: true,
        showBehindEffect: false,
      });
    }

    // [Step 5: 상대방 피격 폭발 & 초록 플라즈마 비산] (7프레임, 50ms)
    // - 상대방 스프라이트 직격, 타격 플래시 & 넉백
    // - 초록 플라즈마 충격파와 스파크 비산 및 암전 해제
    const hitSteps = 7;
    const hitFadeAlphas = [0.65, 0.50, 0.35, 0.20, 0.10, 0.04, 0.0];
    for (let i = 0; i < hitSteps; i++) {
      const prog = i / (hitSteps - 1);
      const hitFlash = isHit && (i === 0 || i === 1);
      const knockX = isHit ? (i === 0 ? 9 : i === 1 ? -6 : i === 2 ? 3 : i === 3 ? -1 : 0) : 0;

      frames.push({
        ...baseFrame,
        delay: 50,
        ...cOff(0, 0),
        ...tOff(knockX, 0),
        hitFlash,
        moveStep: 5,
        phaseId: `hidden-power-hit-${i + 1}`,
        phaseName: "#5. 상대방 직격 폭발 & 초록 플라즈마 비산",
        effectProgress: prog,
        hitProgress: prog,
        blackFadeAlpha: hitFadeAlphas[i],
        showEffect: isHit,
        showBehindEffect: false,
      });
    }

    // [Step 6: 정위치 복귀 및 마무리] (2프레임, 45ms)
    for (let i = 0; i < 2; i++) {
      frames.push({
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        ...tOff(0, 0),
        moveStep: 6,
        phaseId: `hidden-power-settle-${i + 1}`,
        phaseName: "#6. 정위치 복귀",
        effectProgress: 1.0,
        blackFadeAlpha: 0.0,
        showEffect: false,
        showBehindEffect: false,
      });
    }

    return frames;
  },
};
