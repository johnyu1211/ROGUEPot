// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawSleepTalkBehindEffect,
  drawSleepTalkEffect,
} from "../../../renderers/moves/gen1/move213_216.js";

function getSubAnim(key: string): BattleMoveAnimation | undefined {
  if (typeof (globalThis as any).__getMoveAnimation === "function") {
    return (globalThis as any).__getMoveAnimation(key);
  }
  return undefined;
}

/**
 * 214: 잠꼬대 (Sleep Talk / ねごと) - 노말 타입 변화 기술
 *
 * 위력: — / 명중: — / PP: 10 / 접촉 판정: X
 * 설명: 자신이 배운 기술 중 하나를 무작위로 날린다. 자신이 잠들어 있을 때만 쓸 수 있다.
 *
 * [연출 기승전결 시퀀스]:
 * 1. 1단계: 잠든 상태에서 머리 위로 순서대로 피어오르는 입체 'z' -> 'z' -> 'Z' 수면 이펙트
 * 2. 수면 중 몸을 좌우로 부들부들 떠는 리액션 (-3px ~ +3px)
 * 3. 2단계: 추첨된 고유 기술 애니메이션으로 매끄럽게 전환되어 타격/실행
 * 4. 실패 시: 어리둥절 갸우뚱거리며 머리 위 땀방울(💧) 및 잿빛 연기 퍼프(💨) 소산
 */
export const sleepTalkMove: BattleMoveAnimation = {
  num: 214,
  key: "sleep-talk",
  nameKo: "잠꼬대",
  nameEn: "Sleep Talk",
  type: "normal",
  category: "status",
  camera: { type: "self", zoom: 1.28 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    if (frame.isMetronomeSubmove || frame.isSleepTalkSubmove) {
      const subKey = (frame.copiedMoveKey || "tackle").toLowerCase().replace(/[\s_]+/g, "-");
      const subAnim = getSubAnim(subKey);
      if (subAnim?.drawBehindEffect) {
        subAnim.drawBehindEffect(targetCtx, frame, drawCtx);
      }
      return;
    }
    drawSleepTalkBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    if (frame.isMetronomeSubmove || frame.isSleepTalkSubmove) {
      const subKey = (frame.copiedMoveKey || "tackle").toLowerCase().replace(/[\s_]+/g, "-");
      const subAnim = getSubAnim(subKey);
      if (subAnim?.drawEffect) {
        subAnim.drawEffect(targetCtx, frame, drawCtx);
      }
      return;
    }
    drawSleepTalkEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, isMiss, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.28,
      pRot: 0,
      eRot: 0,
      showEffect: true,
      showBehindEffect: true,
      hitFlash: false,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
    };

    // 시전자 트랜스폼 헬퍼
    const casterTransform = (ox: number, oy: number, rot: number, sx: number = 1.0, sy: number = 1.0) => ({
      pOffset: isP ? { x: ox, y: oy } : { x: 0, y: 0 },
      eOffset: !isP ? { x: ox, y: oy } : { x: 0, y: 0 },
      pRot: isP ? rot : 0,
      eRot: !isP ? rot : 0,
      pScale: isP ? { x: sx, y: sy } : undefined,
      eScale: !isP ? { x: sx, y: sy } : undefined,
    });

    const isFailed = (
      !isHit ||
      isMiss ||
      (a.log && (a.log.includes("실패했다") || a.log.includes("failed"))) ||
      (a as any).isFailed
    );

    // -------------------------------------------------------------
    // 실패 연출 (잠들어 있지 않거나 유효 기술 없음)
    // -------------------------------------------------------------
    if (isFailed && (!a.copiedMoveKey || a.copiedMoveKey === "none")) {
      return [
        {
          ...baseFrame,
          delay: 90,
          ...casterTransform(0, 0, 0.08, 1.0, 1.0),
          moveStep: 1,
          isSleepFail: true,
          failProgress: 0.1,
          phaseId: "sleeptalk-fail-1",
          phaseName: "1. 어리둥절 갸웃 (실패)",
        },
        {
          ...baseFrame,
          delay: 110,
          ...casterTransform(0, 0, -0.08, 1.0, 1.0),
          moveStep: 1,
          isSleepFail: true,
          failProgress: 0.45,
          phaseId: "sleeptalk-fail-2",
          phaseName: "2. 반대편 갸웃 & 땀방울(💧)",
        },
        {
          ...baseFrame,
          delay: 120,
          ...casterTransform(0, 2, 0, 1.04, 0.96),
          moveStep: 2,
          isSleepFail: true,
          failProgress: 0.85,
          phaseId: "sleeptalk-fail-3",
          phaseName: "3. 머쓱한 웅크림 & 연기 퍼프(💨)",
        },
        {
          ...baseFrame,
          delay: 80,
          ...casterTransform(0, 0, 0, 1.0, 1.0),
          moveStep: 4,
          isSleepFail: true,
          failProgress: 1.0,
          phaseId: "sleeptalk-fail-4",
          phaseName: "4. 원위치 복귀",
        },
      ];
    }

    // -------------------------------------------------------------
    // 정상 잠꼬대 8단계 시퀀스: 순수 수면 'z' 애니메이션 + 부들부들 떨림
    // -------------------------------------------------------------
    const sleepTalkFrames: BattleFrame[] = [
      // #1. 잠든 상태 (Zzz 시작)
      {
        ...baseFrame,
        delay: 85,
        ...casterTransform(0, 3, 0, 1.02, 0.98),
        moveStep: 1,
        effectProgress: 0.10,
        phaseId: "sleeptalk-sleep-1",
        phaseName: "1. 잠든 상태 (Zzz)",
      },
      // #2. 부들부들 떨림 (1)
      {
        ...baseFrame,
        delay: 75,
        ...casterTransform(-3, 3, -0.02, 1.02, 0.98),
        moveStep: 2,
        effectProgress: 0.25,
        phaseId: "sleeptalk-tremble-1",
        phaseName: "2. 부들부들 떨림 (1)",
      },
      // #3. 부들부들 떨림 (2)
      {
        ...baseFrame,
        delay: 75,
        ...casterTransform(3, 2, 0.02, 1.02, 0.98),
        moveStep: 2,
        effectProgress: 0.40,
        phaseId: "sleeptalk-tremble-2",
        phaseName: "3. 부들부들 떨림 (2)",
      },
      // #4. 부들부들 떨림 (3)
      {
        ...baseFrame,
        delay: 75,
        ...casterTransform(-3, 3, -0.02, 1.02, 0.98),
        moveStep: 3,
        effectProgress: 0.55,
        phaseId: "sleeptalk-tremble-3",
        phaseName: "4. 부들부들 떨림 (3)",
      },
      // #5. 부들부들 떨림 (4)
      {
        ...baseFrame,
        delay: 75,
        ...casterTransform(3, 2, 0.02, 1.02, 0.98),
        moveStep: 3,
        effectProgress: 0.70,
        phaseId: "sleeptalk-tremble-4",
        phaseName: "5. 부들부들 떨림 (4)",
      },
      // #6. 부들부들 떨림 (5)
      {
        ...baseFrame,
        delay: 75,
        ...casterTransform(-2, 3, -0.01, 1.01, 0.99),
        moveStep: 4,
        effectProgress: 0.82,
        phaseId: "sleeptalk-tremble-5",
        phaseName: "6. 부들부들 떨림 (5)",
      },
      // #7. 부들부들 떨림 (6)
      {
        ...baseFrame,
        delay: 75,
        ...casterTransform(2, 2, 0.01, 1.01, 0.99),
        moveStep: 4,
        effectProgress: 0.94,
        phaseId: "sleeptalk-tremble-6",
        phaseName: "7. 부들부들 떨림 (6)",
      },
      // #8. 원위치 복귀 & 연계 기술 시전 태세
      {
        ...baseFrame,
        delay: 75,
        ...casterTransform(0, 0, 0, 1.0, 1.0),
        moveStep: 4,
        effectProgress: 1.0,
        phaseId: "sleeptalk-ready",
        phaseName: "8. 연계 기술 시전 태세",
      },
    ];

    // 연계 기술 (Submove) 확인
    const rawSubKey = (a.copiedMoveKey || (a as any).subMoveKey || "").toLowerCase().replace(/[\s_]+/g, "-");
    const isOnlyMode = rawSubKey === "none" || rawSubKey === "only" || rawSubKey === "solo";

    if (isOnlyMode || !rawSubKey) {
      return sleepTalkFrames;
    }

    const subAnim = getSubAnim(rawSubKey);
    if (!subAnim) {
      return sleepTalkFrames;
    }

    const subAction = {
      ...a,
      moveKey: rawSubKey,
      moveName: subAnim.nameKo || rawSubKey,
    };
    const subCtx: MoveContext = {
      ...ctx,
      action: subAction,
    };

    const rawSubFrames = subAnim.buildFrames(subCtx);
    const taggedSubFrames = rawSubFrames.map((sf, idx) => ({
      ...sf,
      isMetronomeSubmove: true,
      isSleepTalkSubmove: true,
      copiedMoveKey: rawSubKey,
      phaseName: `[${subAnim.nameKo || rawSubKey}] ${sf.phaseName || `프레임 #${idx + 1}`}`,
    }));

    return [...sleepTalkFrames, ...taggedSubFrames];
  },
};
