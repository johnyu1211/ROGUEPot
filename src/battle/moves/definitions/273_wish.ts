// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawWishBehindEffect,
  drawWishEffect,
} from "../../../renderers/moves/gen1/move273_276.js";

/**
 * 🌟 273: 희망사항 (Wish / ねがいごと) - 노말 타입 변화 기술
 *
 * 위력: — / 명중: — / PP: 10 / 대상: 자신 / 접촉: X
 * 설명: 밤하늘의 별에 소원을 빈다. 다음 턴 종료 시 사용자 위치의 포켓몬 체력을 최대 HP의 절반만큼 회복한다.
 *
 * [연출 시퀀스]:
 * 1. [Step 1: 밤하늘 유성 횡단]:
 *    - 어두운 밤하늘 비네트 & 은은한 반짝이 별무리
 *    - 시전자에게 떨어지지 않고 밤하늘 상공을 가로질러 화면 한쪽에서 반대편으로 그냥 지나가는 유성
 * 2. [Step 2: 시전 포켓몬 위로 솟아오르는 소원의 별들]:
 *    - 유성이 지나간 뒤 시전자 몸 주변에서 머리 위 상공을 향해 다채로운 소원의 별들이 수직 상승 & 발밑 오라 링
 * 3. [Step 3: 소원별 승천 & 축복의 잔향]:
 *    - 시전자 머리 위 높이 계속 올라가는 소원별 무리와 위로 피어오르는 별가루 반짝이
 */
export const wishMove: BattleMoveAnimation = {
  num: 273,
  key: "wish",
  nameKo: "희망사항",
  nameEn: "Wish",
  type: "normal",
  category: "status",
  camera: {
    type: "self",
    zoom: 1.30,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showBehindEffect && !frame.showEffect) return;
    drawWishBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawWishEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      cameraZoom: 1.30,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
    };

    // 시전자 오프셋 및 스케일 변형 헬퍼
    const cTransform = (x = 0, y = 0, scaleX = 1.0, scaleY = 1.0, rot = 0) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
      pScale: isP && (scaleX !== 1.0 || scaleY !== 1.0) ? { x: scaleX, y: scaleY } : undefined,
      eScale: !isP && (scaleX !== 1.0 || scaleY !== 1.0) ? { x: scaleX, y: scaleY } : undefined,
      pRot: isP && rot !== 0 ? rot : undefined,
      eRot: !isP && rot !== 0 ? -rot : undefined,
    });

    // 따스한 황금빛 틴트 헬퍼
    const cTint = (alpha: number) => {
      if (alpha <= 0.01) return { pTintColor: null, eTintColor: null };
      const colorStr = `rgba(254, 240, 138, ${alpha.toFixed(2)})`;
      return {
        pTintColor: isP ? colorStr : null,
        eTintColor: !isP ? colorStr : null,
      };
    };

    const frames: BattleFrame[] = [];

    // ========================================================================
    // [Step 1: 밤하늘 유성 횡단] (9프레임, 45ms)
    // ========================================================================
    const step1Count = 9;
    for (let i = 0; i < step1Count; i++) {
      const prog = i / (step1Count - 1);
      // 밤하늘의 유성을 올려다보듯 살짝 고개를 들어올리는 모션
      const cy = -Math.sin(prog * Math.PI) * 3;
      const rot = Math.sin(prog * Math.PI) * (isP ? 0.04 : -0.04);
      const sx = 1.0 - Math.sin(prog * Math.PI) * 0.03;
      const sy = 1.0 + Math.sin(prog * Math.PI) * 0.04;

      frames.push({
        ...baseFrame,
        delay: 45,
        ...cTransform(0, cy, sx, sy, rot),
        ...cTint(prog * 0.2),
        moveStep: 1,
        effectProgress: prog,
        phaseId: `wish-shooting-star-${i + 1}`,
        phaseName: `#1. 밤하늘 유성 횡단 (${i + 1}/${step1Count})`,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // ========================================================================
    // [Step 2 & Step 3 통합: 시전 포켓몬 위로 1회 올라가는 노란 회복별 파티클]
    // (Step 2: 11프레임 + Step 3: 8프레임 = 총 19프레임 단일 시퀀스)
    // ========================================================================
    const step2Count = 11;
    const step3Count = 8;
    const totalRiseFrames = step2Count + step3Count;

    for (let i = 0; i < step2Count; i++) {
      const prog = i / (step2Count - 1);
      const u = i / (totalRiseFrames - 1);
      const floatY = -Math.sin(u * Math.PI) * 5;
      const sx = 1.0 + Math.sin(u * Math.PI) * 0.03;
      const sy = 1.0 - Math.sin(u * Math.PI) * 0.03;

      frames.push({
        ...baseFrame,
        delay: 40,
        ...cTransform(0, floatY, sx, sy, 0),
        ...cTint(Math.sin(u * Math.PI) * 0.35),
        moveStep: 2,
        effectProgress: prog,
        phaseId: `wish-rising-stars-${i + 1}`,
        phaseName: `#2. 노란 회복별 파티클 상승 (${i + 1}/${totalRiseFrames})`,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    for (let i = 0; i < step3Count; i++) {
      const prog = i / (step3Count - 1);
      const u = (step2Count + i) / (totalRiseFrames - 1);
      const floatY = -Math.sin(u * Math.PI) * 5;
      const sx = 1.0 + Math.sin(u * Math.PI) * 0.03;
      const sy = 1.0 - Math.sin(u * Math.PI) * 0.03;

      frames.push({
        ...baseFrame,
        delay: 46,
        ...cTransform(0, floatY, sx, sy, 0),
        ...cTint(Math.sin(u * Math.PI) * 0.35),
        moveStep: 3,
        effectProgress: prog,
        phaseId: `wish-blessing-${i + 1}`,
        phaseName: `#2. 노란 회복별 파티클 상승 및 소멸 (${step2Count + i + 1}/${totalRiseFrames})`,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    return frames;
  },
};
