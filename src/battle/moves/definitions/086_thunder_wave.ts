// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawThunderWaveEffect } from "../../../renderers/moves/gen1/move085_088.js";

/**
 * 086: 전기자석파 (Thunder Wave) - 전기 타입 변화기 (100% 마비)
 *
 * 연출:
 * - 전장 짙은 암전 속 적 스프라이트 중심 전자기 핵 태동
 * - 적 중심에서 밖으로 퍼져나가는 다중 노란 링 (안쪽 반투명, 바깥쪽 완전 투명)
 * - 원이 커지면서 투명화되고 파동 리플로 흔들거림 (Wobble & Transparency Falloff)
 * - 원을 따라가는 고속 회전 궤도 곡선 아크
 * - 화면 노란빛 전환 없이 암전 유지 후 자연스러운 페이드아웃
 * - 마비(Paralysis) 다이아몬드 스타 & 정전기 엠버 비산 후 복귀
 */
export const thunderWaveMove: BattleMoveAnimation = {
  num: 86,
  key: "thunder-wave",
  nameKo: "전기자석파",
  nameEn: "Thunder Wave",
  type: "electric",
  category: "status",
  camera: { type: "target", zoom: 1.25 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos, isPlayer } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawThunderWaveEffect(targetCtx, attackerPos, targetPos, step, prog, isPlayer);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.25,
      pRot: 0,
      eRot: 0,
    };

    return [
      // #1. 암전 & 전자기 전조
      {
        ...baseFrame,
        delay: 95,
        pOffset: isP ? { x: -2, y: 1 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 2, y: -1 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.04, y: 0.96 } : undefined,
        eScale: !isP ? { x: 1.04, y: 0.96 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.45,
        phaseId: "thunder-wave-prep",
        phaseName: "#1. 암전 & 전자기 전조",
      },
      // #2. 적 중심 노란 링 전개 & 흔들림 팽창
      {
        ...baseFrame,
        delay: 105,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.55,
        phaseId: "thunder-wave-rings",
        phaseName: "#2. 적 중심 노란 링 전개 & 흔들림 팽창",
      },
      // #3. 다중 링 고속 팽창 & 파동 흔들림
      {
        ...baseFrame,
        delay: 105,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.85,
        phaseId: "thunder-wave-surge",
        phaseName: "#3. 다중 링 고속 팽창 & 파동 흔들림",
      },
      // #4. 최대 팽창 투명화 & 전자기 진동
      {
        ...baseFrame,
        delay: 120,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: -3, y: 2 } : { x: 3, y: -2 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.75,
        phaseId: "thunder-wave-burst",
        phaseName: "#4. 최대 팽창 투명화 & 전자기 진동",
      },
      // #5. 마비 상태이상 각인 & 정전기 엠버
      {
        ...baseFrame,
        delay: 110,
        pOffset: { x: 0, y: 0 },
        eOffset: isHit ? (!isP ? { x: 2, y: -1 } : { x: -2, y: 1 }) : { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        pWhiteTint: isHit && !isP,
        eWhiteTint: isHit && isP,
        moveStep: 5,
        effectProgress: 0.65,
        phaseId: "thunder-wave-paralysis",
        phaseName: "#5. 마비 상태이상 각인 & 정전기 엠버",
      },
      // #6. 잔류 전파 냉각 및 암전 해제
      {
        ...baseFrame,
        delay: 90,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        hitFlash: false,
        moveStep: 6,
        effectProgress: 0.50,
        phaseId: "thunder-wave-cool",
        phaseName: "#6. 잔류 전파 냉각 및 암전 해제",
      },
      // #7. 완료 및 복귀
      {
        ...baseFrame,
        delay: 75,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        hitFlash: false,
        phaseId: "thunder-wave-complete",
        phaseName: "#7. 완료 및 복귀",
      },
    ];
  },
};
