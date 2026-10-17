// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawRolePlayBehindEffect,
  drawRolePlayEffect,
} from "../../../renderers/moves/gen1/move269_272.js";

/**
 * 👥 272: 역할놀이 (Role Play / なりきり) - 에스퍼 타입 변화 기술
 *
 * 위력: — / 명중: — / PP: 10 / 대상: 상대 / 접촉: X
 * 설명: 상대의 행동을 모방하여 자신도 상대와 같은 특성으로 변화한다.
 *
 * [연출 시퀀스 - 본가(3~5세대) 스타일 상대 포켓몬 분신 투영 & 확대·수축 동화 연출]:
 * 1. [Step 1: 전장 암전 & 시전자 모방 도약 + 상대 포켓몬 반투명 분신(실루엣) 분리] (10프레임, 40ms):
 *    - 전장이 은은하게 암전되며 시전자가 가볍게 점프해 상대를 모방하는 포즈를 취함
 *    - 상대 포켓몬에게서 하얀/하늘빛 실루엣 파동과 함께 반투명 분신(클론)이 스르륵 떠오름
 * 2. [Step 2: 상대 포켓몬 반투명 분신의 시전자 방향 슬라이드 이동 & 중첩] (12프레임, 38ms):
 *    - 상대에게서 분리된 반투명 분신이 잔상을 남기며 시전자 위치로 미끄러지듯 고속 이동해 시전자 몸 위에 포개짐
 * 3. [Step 3: 시전자 위에서 상대 분신 확대·수축 흡수 (TransparentCloneGrowAndShrink) & 동기화 섬광] (10프레임, 40ms):
 *    - 본가 특유의 연출처럼 시전자 위에 겹쳐진 상대의 반투명 분신이 크게 팽창(1.28x)했다가
 *      시전자 몸속으로 빠르게 수축·흡수되며 백색 섬광과 스타 스파클이 반짝이고 원래 모습으로 안착
 */
export const rolePlayMove: BattleMoveAnimation = {
  num: 272,
  key: "role-play",
  nameKo: "역할놀이",
  nameEn: "Role Play",
  type: "psychic",
  category: "status",
  camera: {
    type: "none",
    zoom: 1.0,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showBehindEffect && !frame.showEffect) return;
    drawRolePlayBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawRolePlayEffect(targetCtx, frame, drawCtx);
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

    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y } : { x: 0, y: 0 },
    });

    const cScale = (sx: number, sy: number) => ({
      pScale: isP ? { x: sx, y: sy } : undefined,
      eScale: !isP ? { x: sx, y: sy } : undefined,
    });

    const frames: BattleFrame[] = [];

    // ========================================================================
    // [Step 1: 전장 암전 & 시전자 모방 도약 + 상대 포켓몬 반투명 분신 분리] (10프레임, 40ms)
    // ========================================================================
    const step1Count = 10;
    for (let i = 0; i < step1Count; i++) {
      const prog = i / (step1Count - 1);
      // 시전자 가벼운 모방 점프 & 좌우 스텝
      const hopX = Math.sin(prog * Math.PI * 2) * 5;
      const hopY = -Math.abs(Math.sin(prog * Math.PI)) * 8;
      const sx = 1.0 - Math.sin(prog * Math.PI) * 0.04;
      const sy = 1.0 + Math.sin(prog * Math.PI) * 0.06;

      // 상대방에게서 분신이 추출될 때 은은한 하늘빛 틴트
      const extractTintAlpha = Math.sin(prog * Math.PI) * 0.35;
      const extractTint = extractTintAlpha > 0.02
        ? `rgba(186, 230, 253, ${extractTintAlpha.toFixed(2)})`
        : null;

      frames.push({
        ...baseFrame,
        delay: 40,
        ...cOff(hopX, hopY),
        ...cScale(sx, sy),
        blackFadeAlpha: Number((prog * 0.42).toFixed(3)),
        drawCasterAboveFade: true,
        pTintColor: !isP ? extractTint : null,
        eTintColor: isP ? extractTint : null,
        moveStep: 1,
        effectProgress: prog,
        phaseId: `role-play-clone-extract-${i + 1}`,
        phaseName: `#1. 상대 분신 투영 및 분리 (${i + 1}/${step1Count})`,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // ========================================================================
    // [Step 2: 상대 포켓몬 반투명 분신의 시전자 방향 슬라이드 이동 & 중첩] (12프레임, 38ms)
    // ========================================================================
    const step2Count = 12;
    for (let i = 0; i < step2Count; i++) {
      const prog = i / (step2Count - 1);

      frames.push({
        ...baseFrame,
        delay: 38,
        ...cOff(0, 0),
        blackFadeAlpha: 0.42,
        drawCasterAboveFade: true,
        moveStep: 2,
        effectProgress: prog,
        phaseId: `role-play-clone-slide-${i + 1}`,
        phaseName: `#2. 상대 분신 슬라이드 전이 (${i + 1}/${step2Count})`,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // ========================================================================
    // [Step 3: 시전자 위에서 상대 분신 확대·수축 동화 & 특성 흡수 완료] (10프레임, 40ms)
    // ========================================================================
    const step3Count = 10;
    for (let i = 0; i < step3Count; i++) {
      const prog = i / (step3Count - 1);
      const syncTintAlpha = Math.sin(prog * Math.PI) * 0.45;
      const syncTint = syncTintAlpha > 0.02
        ? `rgba(186, 230, 253, ${syncTintAlpha.toFixed(2)})`
        : null;
      const isPeakSync = prog >= 0.30 && prog <= 0.65;
      const bounceY = -Math.sin(prog * Math.PI) * 6;
      const sx = 1.0 + Math.sin(prog * Math.PI) * 0.10;
      const sy = 1.0 - Math.sin(prog * Math.PI) * 0.06;

      frames.push({
        ...baseFrame,
        delay: 40,
        ...cOff(0, bounceY),
        ...cScale(sx, sy),
        blackFadeAlpha: Number((0.42 * (1.0 - prog)).toFixed(3)),
        drawCasterAboveFade: true,
        pWhiteTint: isP && isPeakSync,
        eWhiteTint: !isP && isPeakSync,
        pTintColor: isP ? syncTint : null,
        eTintColor: !isP ? syncTint : null,
        moveStep: 3,
        effectProgress: prog,
        phaseId: `role-play-clone-absorb-${i + 1}`,
        phaseName: `#3. 분신 확대·수축 동화 완료 (${i + 1}/${step3Count})`,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    return frames;
  },
};
