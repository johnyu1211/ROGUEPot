// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawGlareEffect } from "../../../renderers/moves/gen1/move137_140.js";

/**
 * 137: 뱀눈초리 (Glare) - 노말 타입 변화기 (100% 마비)
 *
 * 연출 시퀀스:
 * 1. 전장 딥 바이올렛 암전 페이드인 & 시전자에게 집중
 * 2. 시전자 전방 상공에 거대한 핏빛-황금 뱀 눈동자(Snake Eyes) 한 쌍 번뜩 발현
 * 3. 뱀눈에서 상대를 향해 꿰뚫는 붉은빛-황금빛 시선 레이저 충격파(Gaze Shockwaves) 쇄도
 * 4. 상대 포켓몬은 공포에 질려 굳어버리며(Tremble 진동), 전신에 황금 마비 스파크 방출
 * 5. 마비 상태 안착 & 암전 페이드아웃 복귀
 */
export const glareMove: BattleMoveAnimation = {
  num: 137,
  key: "glare",
  nameKo: "뱀눈초리",
  nameEn: "Glare",
  type: "normal",
  category: "status",
  camera: { type: "target", zoom: 1.30 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (frame.showEffect) {
      drawGlareEffect(targetCtx, frame, drawCtx);
    }
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    // 시전자 오프셋
    const cOff = (x: number, y: number) =>
      isP ? { pOffset: { x, y } } : { eOffset: { x: -x, y: -y } };

    // 대상 오프셋 (마비 전율 진동)
    const tTremble = (shake: number) =>
      isP
        ? (isHit ? { eOffset: { x: shake, y: 0 } } : { eOffset: { x: 0, y: 0 } })
        : (isHit ? { pOffset: { x: shake, y: 0 } } : { pOffset: { x: 0, y: 0 } });

    return [
      // 1. 암전 진입 & 붉은 실선 아래에서 상승
      {
        ...baseFrame,
        delay: 90,
        ...cOff(-3, 1),
        ...tTremble(0),
        showEffect: true,
        moveStep: 1,
        phaseId: "glare-slit-rise",
        phaseName: "1. 암전 진입 & 붉은 실선 상승",
      },
      // 2. 실선 눈 높이 안착
      {
        ...baseFrame,
        delay: 75,
        ...cOff(-4, 2),
        ...tTremble(0),
        showEffect: true,
        moveStep: 2,
        phaseId: "glare-slit-settle",
        phaseName: "2. 붉은 실선 눈 높이 안착",
      },
      // 3. 눈을 뜨기 시작 (실선이 위아래로 갈라짐)
      {
        ...baseFrame,
        delay: 90,
        ...cOff(-4, 2),
        ...tTremble(0),
        showEffect: true,
        moveStep: 3,
        phaseId: "glare-eye-opening",
        phaseName: "3. 붉은 실선이 열리며 개안",
      },
      // 4. 눈을 완전히 뜨며 붉은 뱀눈 & 황록색 슬릿 동공 형성
      {
        ...baseFrame,
        delay: 200,
        ...cOff(-2, 1),
        ...tTremble(0),
        showEffect: true,
        moveStep: 4,
        phaseId: "glare-eye-open",
        phaseName: "4. 붉은 뱀눈 & 황록색 슬릿 동공 형성",
      },
      // 5. 암전 및 뱀눈 페이드아웃
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, 0),
        ...tTremble(0),
        showEffect: true,
        moveStep: 5,
        phaseId: "glare-fade",
        phaseName: "5. 암전 및 뱀눈 페이드아웃",
      },
      // 6. 정위치 복귀
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 0),
        ...tTremble(0),
        showEffect: false,
        moveStep: 6,
        phaseId: "glare-finish",
        phaseName: "6. 정위치 복귀 완료",
      },
    ];
  },
};
