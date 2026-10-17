// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawKnockOffBehindEffect,
  drawKnockOffEffect,
} from "../../../renderers/moves/gen1/move281_284.js";

/**
 * 👋 282: 탁쳐서떨구기 (Knock Off / はたきおとす) - 악 타입 물리 공격 기술
 *
 * 위력: 65 (상대가 도구를 지니고 있으면 1.5배 = 97) / 명중: 100 / PP: 20 / 접촉: O
 * 설명: 상대의 지닌물건을 탁 쳐서 떨어뜨려 배틀이 끝날 때까지 사용할 수 없게 한다.
 *       물건을 가진 상대에게는 데미지가 1.5배가 된다.
 *
 * [연출 시퀀스]:
 * 1. [90도 세워진 빨간 태권당수 손바닥 출현 & 위에서 아래로 내려치기]:
 *    - 90도로 직립한 태권당수 손바닥(빨간 필터 적용: getKarateRedImg)이 대상 상공에서 아래로 수직 하강하여 타격
 * 2. [타격 이후 Z축 회전을 통한 내려치기]:
 *    - 타격 직후 손바닥이 Z축 회전을 통해 강하게 내려치는 스윙 팔로우스루 연출
 */
export const knockOffMove: BattleMoveAnimation = {
  num: 282,
  key: "knock-off",
  nameKo: "탁쳐서떨구기",
  nameEn: "Knock Off",
  type: "dark",
  category: "physical",
  camera: {
    type: "target",
    zoom: 1.35,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showBehindEffect && !frame.showEffect) return;
    drawKnockOffBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawKnockOffEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const startEnemyHp = a.enemyHpBefore ?? enemyHp;
    const startPlayerHp = a.playerHpBefore ?? playerHp;

    const baseFrame = {
      enemyHp: startEnemyHp,
      playerHp: startPlayerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      showEffect: true,
      showBehindEffect: true,
    };

    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const defOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const defScale = (x: number, y: number) => ({
      pScale: !isP ? { x, y } : undefined,
      eScale: isP ? { x, y } : undefined,
    });

    if (!isHit) {
      return [
        {
          ...baseFrame,
          delay: 70,
          moveStep: 0.12,
          ...cOff(24, -12),
        },
        {
          ...baseFrame,
          delay: 90,
          moveStep: 1.0,
          showEffect: false,
          showBehindEffect: false,
          ...cOff(0, 0),
        },
      ];
    }

    const frames: BattleFrame[] = [];
    const totalFrames = 20;

    for (let i = 0; i < totalFrames; i++) {
      // i = 0일 때도 첫 프레임부터 손이 바로 보이도록 최소 step을 0.04로 설정
      const rawStep = i / (totalFrames - 1);
      const step = Number(Math.max(0.04, rawStep).toFixed(3));
      const isImpactFrame = i === 5;
      const afterImpact = i >= 5;

      if (i < 5) {
        // Phase 1: 90도 세워진 빨간 손바닥 위에서 아래로 내려치기 (i = 0..4, step ≈ 0.04 ~ 0.211)
        const p = (i + 1) / 5;
        frames.push({
          ...baseFrame,
          delay: 38,
          moveStep: step,
          ...cOff(p * 26, -p * 10),
          phaseId: `knock-off-chop-${i + 1}`,
          phaseName: `#1. 90도 빨간 태권당수 손바닥 수직 내려치기`,
        });
      } else if (i < 13) {
        // Phase 2: 타격 이후 Z축 회전을 통해 내려치는 스윙 (i = 5..12, step ≈ 0.263 ~ 0.632)
        const p = (i - 5) / 8;
        const shakeX = (i % 2 === 1 ? 10 : -8) * (1 - p * 0.7);
        const shakeY = (i % 2 === 1 ? 8 : -4) * (1 - p * 0.7);
        frames.push({
          ...baseFrame,
          enemyHp: afterImpact ? enemyHp : startEnemyHp,
          playerHp: afterImpact ? playerHp : startPlayerHp,
          delay: 40,
          moveStep: step,
          hitFlash: isImpactFrame,
          ...defOff(shakeX, shakeY),
          ...defScale(isImpactFrame ? 1.14 : 1.0, isImpactFrame ? 0.86 : 1.0),
          phaseId: `knock-off-rotate-${i + 1}`,
          phaseName: `#2. 타격 및 Z축 회전 내려치기`,
        });
      } else {
        // Phase 3: 회전 내려치기 잔상 및 페이드아웃 (i = 13..19, step ≈ 0.684 ~ 0.96)
        const fadeStep = Number(Math.min(0.96, step).toFixed(3));
        frames.push({
          ...baseFrame,
          enemyHp,
          playerHp,
          delay: 42,
          moveStep: fadeStep,
          ...defOff(0, 0),
          phaseId: `knock-off-fade-${i + 1}`,
          phaseName: `#3. 회전 내려치기 마무리`,
        });
      }
    }

    frames.push({
      ...baseFrame,
      enemyHp,
      playerHp,
      delay: 55,
      moveStep: 1.0,
      showEffect: false,
      showBehindEffect: false,
      ...cOff(0, 0),
      ...defOff(0, 0),
      phaseId: "knock-off-finish",
      phaseName: "#4. 탁쳐서떨구기 완료",
    });

    return frames;
  },
};
