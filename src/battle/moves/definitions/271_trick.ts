// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawTrickBehindEffect,
  drawTrickEffect,
} from "../../../renderers/moves/gen1/move269_272.js";

/**
 * 🥛 271: 트릭 (Trick / トリック) - 에스퍼 타입 변화 기술
 *
 * 위력: — / 명중: 100 / PP: 10 / 대상: 상대 / 접촉: X
 * 설명: 틈을 노려 자신과 상대가 지닌 도구를 서로 맞바꾼다.
 *
 * [연출 시퀀스 - 본가 스타일 야바위 컵(Shell Game Cups) 연출]:
 * 1. [Step 1: 양쪽 포켓몬 위로 컵 하강 & 덮기] (10프레임, 38ms):
 *    - 시전자와 상대 포켓몬 머리 위 상공에서 심플한 하얀색/은색 컵이 각각 내려와 포켓몬을 덮음
 *    - 컵이 덮이는 순간 양쪽 포켓몬이 컵 안으로 쏙 수렴하며 숨겨지고, 컵은 발판 위에 탄성 있게 안착
 * 2. [Step 2: 야바위 셔플 (3회 고속 교차 자리바꿈)] (21프레임, 35ms):
 *    - 포켓몬을 덮은 두 컵이 아군 발판과 적군 발판 사이를 3D 타원 궤도로 3회 연속 빠르게 교차 이동
 *    - 원근감(전경 확대·원경 축소) 및 전후방 Z-정렬, 은빛 잔상이 어우러진 경쾌한 야바위 섞기
 * 3. [Step 3: 컵 들어올리기 & 포켓몬 재등장] (11프레임, 38ms):
 *    - 셔플을 마친 두 컵이 위로 휙 들려 올라가며 사르르 사라짐
 *    - 양쪽 포켓몬이 탄성 있게 다시 모습을 드러내며 주변에 도구 교환 반짝이 스파클 작렬
 */
export const trickMove: BattleMoveAnimation = {
  num: 271,
  key: "trick",
  nameKo: "트릭",
  nameEn: "Trick",
  type: "psychic",
  category: "status",
  camera: {
    type: "none",
    zoom: 1.0,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showBehindEffect && !frame.showEffect) return;
    drawTrickBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawTrickEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { action: a, enemyHp, playerHp, textLineIdx } = ctx;

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

    const frames: BattleFrame[] = [];

    // ========================================================================
    // [Step 1: 양쪽 포켓몬 위로 하얀색/은색 컵 하강 & 덮기] (10프레임, 38ms)
    // ========================================================================
    const step1Count = 10;
    for (let i = 0; i < step1Count; i++) {
      const prog = i / (step1Count - 1);

      // prog 0.20 ~ 0.60 구간 동안 포켓몬이 내려오는 컵 안으로 쏙 작아지며 들어감
      // prog >= 0.60 이후에는 컵이 완전히 덮어 포켓몬 숨김 처리
      const isCovered = prog >= 0.60;
      let monScale = 1.0;
      let monOffsetY = 0;
      if (!isCovered && prog > 0.18) {
        const shrinkT = (prog - 0.18) / (0.60 - 0.18);
        monScale = Math.max(0.35, 1.0 - shrinkT * 0.65);
        monOffsetY = -shrinkT * 10;
      }

      frames.push({
        ...baseFrame,
        delay: 38,
        pOffset: { x: 0, y: monOffsetY },
        eOffset: { x: 0, y: monOffsetY * 0.75 },
        pScale: !isCovered && monScale !== 1.0 ? { x: monScale, y: monScale } : undefined,
        eScale: !isCovered && monScale !== 1.0 ? { x: monScale, y: monScale } : undefined,
        hidePlayer: isCovered,
        hideEnemy: isCovered,
        hidePShadow: isCovered,
        hideEShadow: isCovered,
        moveStep: 1,
        effectProgress: prog,
        phaseId: `trick-cup-cover-${i + 1}`,
        phaseName: `#1. 컵 하강 및 포켓몬 덮기 (${i + 1}/${step1Count})`,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // ========================================================================
    // [Step 2: 야바위 셔플 - 두 컵의 3회 고속 교차 자리바꿈] (21프레임, 35ms)
    // ========================================================================
    const step2Count = 21;
    for (let i = 0; i < step2Count; i++) {
      const prog = i / (step2Count - 1);

      frames.push({
        ...baseFrame,
        delay: 35,
        hidePlayer: true,
        hideEnemy: true,
        hidePShadow: true,
        hideEShadow: true,
        moveStep: 2,
        effectProgress: prog,
        phaseId: `trick-cup-shuffle-${i + 1}`,
        phaseName: `#2. 야바위 컵 교차 섞기 (${i + 1}/${step2Count})`,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // ========================================================================
    // [Step 3: 컵 들어올리기 & 포켓몬 재등장] (11프레임, 38ms)
    // ========================================================================
    const step3Count = 11;
    for (let i = 0; i < step3Count; i++) {
      const prog = i / (step3Count - 1);

      // 컵이 위로 들리는 순간 포켓몬이 탄성 있게 원래 크기로 뿅! 등장
      let sx = 1.0;
      let sy = 1.0;
      let bounceY = 0;
      if (prog < 0.35) {
        const u = prog / 0.35;
        sx = 0.55 + 0.53 * u; // 0.55 -> 1.08
        sy = 0.55 + 0.40 * u; // 0.55 -> 0.95
        bounceY = -Math.sin(u * Math.PI * 0.5) * 6;
      } else if (prog < 0.70) {
        const u = (prog - 0.35) / 0.35;
        sx = 1.08 - 0.11 * u; // 1.08 -> 0.97
        sy = 0.95 + 0.09 * u; // 0.95 -> 1.04
        bounceY = -6 * (1 - u);
      } else {
        const u = (prog - 0.70) / 0.30;
        sx = 0.97 + 0.03 * u; // 0.97 -> 1.00
        sy = 1.04 - 0.04 * u; // 1.04 -> 1.00
        bounceY = 0;
      }

      frames.push({
        ...baseFrame,
        delay: 38,
        pOffset: { x: 0, y: bounceY },
        eOffset: { x: 0, y: bounceY * 0.75 },
        pScale: { x: Number(sx.toFixed(3)), y: Number(sy.toFixed(3)) },
        eScale: { x: Number(sx.toFixed(3)), y: Number(sy.toFixed(3)) },
        hidePlayer: false,
        hideEnemy: false,
        hidePShadow: false,
        hideEShadow: false,
        moveStep: 3,
        effectProgress: prog,
        phaseId: `trick-cup-reveal-${i + 1}`,
        phaseName: `#3. 컵 오픈 및 교환 완료 (${i + 1}/${step3Count})`,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    return frames;
  },
};
