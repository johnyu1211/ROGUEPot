// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawMetronomeEffect } from "../../../renderers/moves/gen1/move117_120.js";

function getSubAnim(key: string): BattleMoveAnimation | undefined {
  if (typeof (globalThis as any).__getMoveAnimation === "function") {
    return (globalThis as any).__getMoveAnimation(key);
  }
  return undefined;
}

/**
 * 118: 손가락흔들기 (Metronome / ゆびをふる)
 *
 * 연출 기승전결:
 * 1. 1단계: 시전자 정면에 소환된 거대 순백 포인팅 핸드가 메트로놈처럼 좌우로 째깍째깍 3회 리드미컬 스윙
 * 2. 손끝에서 튀어나오는 마법 별빛(✦)과 음표(♪) 파티클
 * 3. 중앙 정지 순간 손끝에서 8방향 스타버스트 섬광 발산 ("기술 결정!")
 * 4. 2단계: 추첨된 기술(copiedMoveKey / subMoveKey)의 고유 애니메이션으로 자연스럽게 전환되어 타격/실행
 */
export const metronomeMove: BattleMoveAnimation = {
  num: 118,
  key: "metronome",
  nameKo: "손가락흔들기",
  nameEn: "Metronome",
  type: "normal",
  category: "status",
  camera: { type: "self", zoom: 1.25 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    if (frame.isMetronomeSubmove) {
      const subKey = (frame.copiedMoveKey || "tackle").toLowerCase().replace(/[\s_]+/g, "-");
      const subAnim = getSubAnim(subKey);
      if (subAnim?.drawBehindEffect) {
        subAnim.drawBehindEffect(targetCtx, frame, drawCtx);
      }
    }
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    if (frame.isMetronomeSubmove) {
      const subKey = (frame.copiedMoveKey || "tackle").toLowerCase().replace(/[\s_]+/g, "-");
      const subAnim = getSubAnim(subKey);
      if (subAnim?.drawEffect) {
        subAnim.drawEffect(targetCtx, frame, drawCtx);
      }
      return;
    }

    const casterPos = drawCtx?.casterPos || drawCtx?.attackerPos;
    if (!casterPos) return;
    const prog = frame.effectProgress ?? 0.5;
    drawMetronomeEffect(targetCtx, casterPos, prog, drawCtx.isPlayer);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.25,
      pRot: 0,
      eRot: 0,
      showEffect: true,
      hitFlash: false,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
    };

    // 시전자 리드미컬 역동 스윙 트랜스폼 (좌우 스웨이, 진자 틸트 회전, 스쿼시 & 스트레치)
    const casterTransform = (ox: number, oy: number, rot: number, sx: number = 1.0, sy: number = 1.0) => ({
      pOffset: isP ? { x: ox, y: oy } : { x: 0, y: 0 },
      eOffset: !isP ? { x: ox, y: oy } : { x: 0, y: 0 },
      pRot: isP ? rot : 0,
      eRot: !isP ? rot : 0,
      pScale: isP ? { x: sx, y: sy } : undefined,
      eScale: !isP ? { x: sx, y: sy } : undefined,
    });

    // 1. 손가락 흔들기 역동 9프레임 시퀀스
    const metronomeFrames: BattleFrame[] = [
      // #1. 리듬 시동 & 둠칫 웅크림
      {
        ...baseFrame,
        delay: 85,
        ...casterTransform(0, 3, 0, 1.05, 0.95),
        moveStep: 1,
        effectProgress: 0.08,
        phaseId: "metronome-init",
        phaseName: "#1. 메트로놈 스윙 시동 & 리듬 웅크림",
      },
      // #2. 1차 우측 스윙 정점 (+28° 틸트 & 스트레치)
      {
        ...baseFrame,
        delay: 75,
        ...casterTransform(10, -4, 0.11, 0.93, 1.07),
        moveStep: 1,
        effectProgress: 0.22,
        phaseId: "metronome-swing-r1",
        phaseName: "#2. 1차 우측 스윙 & 황금빛 별빛 방출",
      },
      // #3. 1차 좌측 반전 스윙 통과 (바운스 딥)
      {
        ...baseFrame,
        delay: 75,
        ...casterTransform(0, 4, 0, 1.06, 0.94),
        moveStep: 2,
        effectProgress: 0.36,
        phaseId: "metronome-swing-mid1",
        phaseName: "#3. 1차 좌측 반전 스윙 & 스카이블루 별빛",
      },
      // #4. 1차 좌측 정점 도달 (-28° 틸트 & 스트레치)
      {
        ...baseFrame,
        delay: 75,
        ...casterTransform(-10, -4, -0.11, 0.93, 1.07),
        moveStep: 2,
        effectProgress: 0.50,
        phaseId: "metronome-swing-l1",
        phaseName: "#4. 1차 좌측 정점 & 음표(♪) 멜로디 방출",
      },
      // #5. 2차 우측 반전 스윙 통과 (바운스 딥)
      {
        ...baseFrame,
        delay: 75,
        ...casterTransform(0, 4, 0, 1.06, 0.94),
        moveStep: 3,
        effectProgress: 0.64,
        phaseId: "metronome-swing-mid2",
        phaseName: "#5. 2차 우측 반전 스윙 & 핑크빛 별빛",
      },
      // #6. 2차 우측 정점 도달 (+24° 틸트 & 스트레치)
      {
        ...baseFrame,
        delay: 75,
        ...casterTransform(9, -3, 0.09, 0.94, 1.06),
        moveStep: 3,
        effectProgress: 0.76,
        phaseId: "metronome-swing-r2",
        phaseName: "#6. 2차 우측 정점 & 그린빛 별빛",
      },
      // #7. 정중앙 복귀 & 텐션 집중 웅크림 (Anticipation Squash)
      {
        ...baseFrame,
        delay: 80,
        ...casterTransform(0, 5, 0, 1.10, 0.88),
        moveStep: 4,
        effectProgress: 0.88,
        phaseId: "metronome-center-lock",
        phaseName: "#7. 정중앙 복귀 & 텐션 집중 웅크림",
      },
      // #8. 손끝 결정 섬광 (Ding!) & 환호 점프 (Pop Hop Stretch)
      {
        ...baseFrame,
        delay: 110,
        ...casterTransform(0, -8, 0, 1.05, 1.14),
        moveStep: 4,
        effectProgress: 0.98,
        phaseId: "metronome-ding-flash",
        phaseName: "#8. 손끝 결정 섬광 (Ding!) & 환호 점프",
      },
      // #9. 착지 & 기술 시전 태세
      {
        ...baseFrame,
        delay: 60,
        ...casterTransform(0, 0, 0, 1.0, 1.0),
        moveStep: 4,
        effectProgress: 1.0,
        phaseId: "metronome-ready",
        phaseName: "#9. 착지 & 기술 시전 태세",
      },
    ];

    // 2. 연계 기술 (Submove) 연계 확인
    const rawSubKey = (a.copiedMoveKey || (a as any).subMoveKey || "").toLowerCase().replace(/[\s_]+/g, "-");
    const isOnlyMode = rawSubKey === "none" || rawSubKey === "only" || rawSubKey === "solo";

    if (isOnlyMode || !rawSubKey) {
      return metronomeFrames;
    }

    // 연계 기술 프레임 생성
    const subAnim = getSubAnim(rawSubKey);
    if (!subAnim) {
      return metronomeFrames;
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
      copiedMoveKey: rawSubKey,
      phaseName: `[${subAnim.nameKo}] ${sf.phaseName || `프레임 #${idx + 1}`}`,
    }));

    return [...metronomeFrames, ...taggedSubFrames];
  },
};
