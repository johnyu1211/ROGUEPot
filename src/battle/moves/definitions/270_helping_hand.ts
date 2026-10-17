// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawHelpingHandBehindEffect,
  drawHelpingHandEffect,
} from "../../../renderers/moves/gen1/move269_272.js";

/**
 * 🤝 270: 도우미 (Helping Hand / てだすけ) - 노말 타입 변화 기술
 *
 * 위력: — / 명중: — / PP: 20 / 우선도: +5 / 대상: 아군 / 접촉: X
 * 설명: 동료를 돕는다. 사용하면 동료(또는 자신)가 쓰는 기술의 위력이 1.5배가 된다.
 *
 * [연출 시퀀스]:
 * 1. [Step 1: 손 모으기 및 따뜻한 기운 집중 (Warm Influx & Clapping Palms)] (10프레임, 45ms):
 *    - 시전자가 힘차게 도약하며 따뜻한 황금빛 오라 발생
 *    - 빛나는 두 손이 박수/하이파이브하듯 합쳐짐
 * 2. [Step 2: 눈부신 황금빛 응원 폭발 & 위력 강화 화살표 (Radiant Cheer Burst & Power Buff)] (14프레임, 40ms):
 *    - 맞닿는 순간 눈부신 2중 골든 링 및 따뜻한 광배 폭발
 *    - 사방 360도로 터져 나가는 4각 반짝이 별과 응원 리본 스파클
 *    - 하늘을 향해 솟구치는 황금빛 위력 강화 화살표 3개 (1.5배 증폭 상징)
 * 3. [Step 3: 축복 잔광 및 안정화 (Floating Golden Blessings)] (6프레임, 45ms):
 *    - 대상을 감싸는 은은한 황금빛 글리터 파티클이 위로 피어오르며 완착
 */
export const helpingHandMove: BattleMoveAnimation = {
  num: 270,
  key: "helping-hand",
  nameKo: "도우미",
  nameEn: "Helping Hand",
  type: "normal",
  category: "status",
  camera: {
    type: "self",
    zoom: 1.25,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showBehindEffect && !frame.showEffect) return;
    drawHelpingHandBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawHelpingHandEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

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

    const frames: BattleFrame[] = [];

    // ========================================================================
    // [Step 1: 손 모으기 및 도약] (10프레임, 45ms)
    // ========================================================================
    const step1Count = 10;
    for (let i = 0; i < step1Count; i++) {
      const prog = i / (step1Count - 1);
      // 부드러운 도약 준비 웅크림 후 위로 살짝 솟구침
      const dy = -Math.sin(prog * Math.PI) * 12;
      const sx = 1.0 - Math.sin(prog * Math.PI) * 0.08;
      const sy = 1.0 + Math.sin(prog * Math.PI) * 0.12;
      const tint = `rgba(254, 240, 138, ${(prog * 0.35).toFixed(2)})`;

      frames.push({
        ...baseFrame,
        delay: 45,
        pOffset: isP ? { x: 0, y: dy } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: dy } : { x: 0, y: 0 },
        pScale: isP ? { x: sx, y: sy } : undefined,
        eScale: !isP ? { x: sx, y: sy } : undefined,
        pTintColor: isP ? tint : null,
        eTintColor: !isP ? tint : null,
        moveStep: 1,
        effectProgress: prog,
        phaseId: `helping-hand-influx-${i + 1}`,
        phaseName: `#1. 응원의 손길 (${i + 1}/${step1Count})`,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // ========================================================================
    // [Step 2: 황금빛 응원 폭발 & 위력 강화 화살표] (14프레임, 40ms)
    // ========================================================================
    const step2Count = 14;
    for (let i = 0; i < step2Count; i++) {
      const prog = i / (step2Count - 1);
      const flashTint = `rgba(254, 240, 138, ${(0.45 * (1 - prog * 0.5)).toFixed(2)})`;
      const bounceY = Math.sin(prog * Math.PI) * 4;

      frames.push({
        ...baseFrame,
        delay: 40,
        pOffset: isP ? { x: 0, y: bounceY } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: bounceY } : { x: 0, y: 0 },
        pTintColor: isP ? flashTint : null,
        eTintColor: !isP ? flashTint : null,
        moveStep: 2,
        effectProgress: prog,
        phaseId: `helping-hand-burst-${i + 1}`,
        phaseName: `#2. 황금빛 위력 강화 폭발 (${i + 1}/${step2Count})`,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // ========================================================================
    // [Step 3: 축복 잔광 및 안정화] (6프레임, 45ms)
    // ========================================================================
    const step3Count = 6;
    for (let i = 0; i < step3Count; i++) {
      const prog = i / (step3Count - 1);
      const settleTint = `rgba(254, 240, 138, ${(0.15 * (1 - prog)).toFixed(2)})`;

      frames.push({
        ...baseFrame,
        delay: 45,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pTintColor: isP ? settleTint : null,
        eTintColor: !isP ? settleTint : null,
        moveStep: 3,
        effectProgress: prog,
        phaseId: `helping-hand-settle-${i + 1}`,
        phaseName: `#3. 버프 부여 완료 (${i + 1}/${step3Count})`,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    return frames;
  },
};
