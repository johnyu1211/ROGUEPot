// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawSwallowBehindEffect,
  drawSwallowEffect,
} from "../../../renderers/moves/gen1/move253_256.js";

/**
 * 256: 꿀꺽 (Swallow / のみこむ) - 노말 타입 변화 기술
 *
 * 위력: — / 명중: — / PP: 10 / 대상: 자신 / 접촉: X
 * 설명: 비축된 힘을 삼켜서 자신의 체력을 회복한다. 비축된 양이 많을수록 회복량이 늘어난다.
 *
 * [유저 요구사항 100% 반영]:
 * 1. 세로로 길어졌다가 아래로 꾹 눌러짐 (스프라이트 모션: 스트레치 후 강력한 스쿼시)
 * 2. 위로 비축하기 이펙트가 위로 올라가는데 색깔이 하늘 파란 색깔임 (#38BDF8 / #7DD3FC)
 * 3. 직선 위로 올라감 (곡선/회전 없이 순수 수직 직선 궤적으로 상승하며 다단계 잔상 유지)
 */
export const swallowMove: BattleMoveAnimation = {
  num: 256,
  key: "swallow",
  nameKo: "꿀꺽",
  nameEn: "Swallow",
  type: "normal",
  category: "status",
  camera: {
    type: "self",
    zoom: 1.30,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.showBehindEffect) return;
    drawSwallowBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawSwallowEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
      cameraZoom: 1.30,
    };

    const cOff = (x = 0, y = 0) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const cScale = (scaleX: number, scaleY: number) => ({
      pScale: isP ? { x: scaleX, y: scaleY } : undefined,
      eScale: !isP ? { x: scaleX, y: scaleY } : undefined,
    });

    const frames: BattleFrame[] = [];

    // ========================================================================
    // [Step 1]: 꿀꺽 시전 & 하늘 파란 색깔 비축하기 오브 상승 및 하강 복귀
    // - 세로로 길어졌다가 ➔ 아래로 꾹 눌러짐
    // - 7개 하늘빛 오브가 띄엄띄엄 위로 솟아올랐다가 다시 내려와 몸속으로 복귀
    // ========================================================================
    const STEP1_SPECS: Array<{
      prog: number;
      sx: number;
      sy: number;
      offY: number;
      phaseId: string;
      phaseName: string;
      delay?: number;
    }> = [
      // [1] 시전 준비
      { prog: 0.00, sx: 1.00, sy: 1.00, offY: 0, phaseId: "swallow-ready-1", phaseName: "꿀꺽 시전 준비" },
      { prog: 0.06, sx: 0.98, sy: 1.03, offY: -1, phaseId: "swallow-ready-2", phaseName: "호흡 모으기" },

      // [2] 세로로 길어졌다가 & [1단계: 올라가는 거 재생] (prog 0.12 ~ 0.40)
      { prog: 0.12, sx: 0.92, sy: 1.10, offY: -2, phaseId: "swallow-rise-start", phaseName: "1. 세로로 길어짐 & 하늘빛 오브 순차 상승 시작" },
      { prog: 0.18, sx: 0.85, sy: 1.20, offY: -4, phaseId: "swallow-rise-mid1", phaseName: "1. 스트레치 & 오브 1~3번 상승" },
      { prog: 0.24, sx: 0.80, sy: 1.26, offY: -6, phaseId: "swallow-rise-peak", phaseName: "1. 최대 세로 스트레치 & 오브 4~5번 상승" },
      { prog: 0.32, sx: 0.85, sy: 1.18, offY: -4, phaseId: "swallow-rise-mid2", phaseName: "1. 스트레치 유지 & 오브 6~7번 상승" },
      { prog: 0.38, sx: 0.94, sy: 1.08, offY: -2, phaseId: "swallow-rise-climax", phaseName: "1. 모든 오브 상공 도달 완료" },

      // [3] 상공 체류 & 아래로 꾹 눌림 준비 (prog 0.40 ~ 0.44)
      { prog: 0.42, sx: 1.05, sy: 0.95, offY: 2, phaseId: "swallow-hover-squash-start", phaseName: "1. 오브 전체 상공 체류 & 아래로 꾹 눌림 시작" },

      // [4] 아래로 꾹 눌려짐 & [2단계: 내려오는 거 재생] (prog 0.46 ~ 0.72)
      { prog: 0.48, sx: 1.18, sy: 0.80, offY: 5, phaseId: "swallow-fall-start", phaseName: "1. 아래로 꾹 눌림 & 오브 1~2번 하강 쇄도" },
      { prog: 0.54, sx: 1.26, sy: 0.70, offY: 8, phaseId: "swallow-fall-peak", phaseName: "1. 최대 아래로 꾹 눌림 (꿀꺽 압축) & 오브 3~4번 하강" },
      { prog: 0.60, sx: 1.25, sy: 0.72, offY: 7, phaseId: "swallow-fall-mid", phaseName: "1. 꾹 눌린 상태 유지 & 오브 5~6번 하강" },
      { prog: 0.66, sx: 1.20, sy: 0.78, offY: 6, phaseId: "swallow-fall-last", phaseName: "1. 꾹 눌림 유지 & 마지막 7번 오브 하강" },
      { prog: 0.72, sx: 1.12, sy: 0.88, offY: 4, phaseId: "swallow-fall-complete", phaseName: "1. 모든 오브 몸속 완전 유입 하강 완료" },

      // [5] [3단계: 내려오는 거 완전히 끝나고 안착 및 대기] (prog 0.78 ~ 1.00)
      // * 이 구간에서는 하늘빛 오브가 100% 소멸되어 공중에 아무것도 없음!
      { prog: 0.78, sx: 1.05, sy: 0.95, offY: 2, phaseId: "swallow-rebound", phaseName: "1. 하강 완료 ➔ 몸체 원형 복귀 중" },
      { prog: 0.86, sx: 0.98, sy: 1.02, offY: -1, phaseId: "swallow-settle", phaseName: "1. 가벼운 반동" },
      { prog: 0.94, sx: 1.00, sy: 1.00, offY: 0, phaseId: "swallow-ready-heal", phaseName: "1. 몸체 완전 정상 복귀 & 꿀꺽 완료" },
      { prog: 1.00, sx: 1.00, sy: 1.00, offY: 0, phaseId: "swallow-step1-finish", phaseName: "1. 꿀꺽 안착 대기 (회복 전 호흡)", delay: 120 },
    ];

    for (const spec of STEP1_SPECS) {
      frames.push({
        ...baseFrame,
        delay: spec.delay ?? 46,
        ...cOff(0, spec.offY),
        ...cScale(spec.sx, spec.sy),
        moveStep: 1,
        phaseId: spec.phaseId,
        phaseName: spec.phaseName,
        effectProgress: spec.prog,
        showEffect: true,
        showBehindEffect: true,
      });
    }

    // ========================================================================
    // [Step 2]: "그리고 나서 HP 회복의 회복 이펙트 재생해줘"
    // - 4개의 회복별 엠블럼이 발밑에서 순차 출현하여 330도 시계방향 나선 상승 후 상공 승화
    // - 포켓몬 체표면 치유 광채 펄스 전개
    // ========================================================================
    const STEP2_SPECS = [
      { prog: 0.10, offY:  0, delay: 85, phaseId: "swallow-heal-star1", phaseName: "2. 1번 회복별 발밑 출현 & 시계방향 상승" },
      { prog: 0.28, offY: -1, delay: 85, phaseId: "swallow-heal-star2", phaseName: "2. 2번 회복별 출현 & 1번 별 나선 선회" },
      { prog: 0.48, offY: -1, delay: 85, phaseId: "swallow-heal-star3", phaseName: "2. 3번 회복별 출현 & 순차 나선 비상" },
      { prog: 0.68, offY: -1, delay: 85, phaseId: "swallow-heal-star4", phaseName: "2. 4번 회복별 출현 & 선행 별 상공 페이드" },
      { prog: 0.88, offY:  0, delay: 85, phaseId: "swallow-heal-fade",  phaseName: "2. 잔여 회복별들 순차적 승화 소멸" },
      { prog: 1.00, offY:  0, delay: 70, phaseId: "swallow-heal-finish", phaseName: "2. HP 회복 이펙트 완료" },
    ];

    for (const spec of STEP2_SPECS) {
      frames.push({
        ...baseFrame,
        delay: spec.delay,
        ...cOff(0, spec.offY),
        ...cScale(1.0, 1.0),
        moveStep: 2,
        phaseId: spec.phaseId,
        phaseName: spec.phaseName,
        effectProgress: spec.prog,
        showEffect: true,
        showBehindEffect: false,
      });
    }

    // ========================================================================
    // [Step 3]: 공식 고증 - 비축 해제에 따른 방어/특수방어 랭크 하락 디버프 연출
    // - 파란색 하강 화살표 파동이 시전자 몸체를 감싸며 하강
    // ========================================================================
    const STEP3_SPECS = [
      { prog: 0.18, offY:  2, delay: 90, phaseId: "swallow-stat-drop-1", phaseName: "3. 비축 해제 ➔ 방어/특방 랭크 하락 개시" },
      { prog: 0.45, offY:  1, delay: 90, phaseId: "swallow-stat-drop-2", phaseName: "3. 방어/특방 하락 화살표 통과" },
      { prog: 0.72, offY:  0, delay: 90, phaseId: "swallow-stat-drop-3", phaseName: "3. 랭크 하락 파동 전개" },
      { prog: 0.98, offY:  0, delay: 85, phaseId: "swallow-stat-drop-4", phaseName: "3. 랭크 하락 완료" },
    ];

    for (const spec of STEP3_SPECS) {
      frames.push({
        ...baseFrame,
        delay: spec.delay,
        ...cOff(0, spec.offY),
        ...cScale(1.0, 1.0),
        moveStep: 3,
        phaseId: spec.phaseId,
        phaseName: spec.phaseName,
        statProgress: spec.prog,
        statDirection: "down",
        moveEffect: {
          ...a,
          statChanges: [{ target: isP ? "player" : "enemy", direction: "down" }],
        },
        showEffect: false,
        showBehindEffect: false,
      });
    }

    // [Step 4: 꿀꺽 및 랭크 복구 최종 완료 안착 프레임]
    frames.push({
      ...baseFrame,
      delay: 110,
      ...cOff(0, 0),
      ...cScale(1.0, 1.0),
      showEffect: false,
      showBehindEffect: false,
      moveStep: 4,
      phaseId: "swallow-complete",
      phaseName: "#4. 꿀꺽 및 랭크 복구 완료",
    });

    return frames;
  },
};
