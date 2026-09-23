// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawMeditateEffect } from "../../../renderers/moves/gen1/move093_096.js";

/**
 * 096: 요가포즈 (Meditate) - 에스퍼 타입 변화기 (자신의 공격 1랭크 상승)
 *
 * 연출:
 * - 시전자 전용 줌 & 명상 자세 돌입, 발밑 황금빛 안착
 * - 발밑에 펼쳐지는 8방향 신성 기하학 연꽃 만다라 서클 회전
 * - 부드럽게 솟구쳐 오르는 수직 차크라 영기(Aura) 빛기둥 & 부유 라이트 오브
 * - 내면의 투기 각성: 붉은/주황빛 무투 펄스 번쩍임 & 공격 1랭크 상승 스탯 부스트
 * - 만다라 서클 페이드아웃 및 자세 정렬 복귀
 */
export const meditateMove: BattleMoveAnimation = {
  num: 96,
  key: "meditate",
  nameKo: "요가포즈",
  nameEn: "Meditate",
  type: "psychic",
  category: "status",
  camera: { type: "self", zoom: 1.25 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos, isPlayer } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawMeditateEffect(targetCtx, attackerPos, targetPos, step, prog, isPlayer);
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
    };

    // 시전 포켓몬 모션 (1번 납작 -> 2번 세로로 길고 얇게 -> 원래상태)
    const getCasterTransform = (sx: number, sy: number, oy: number) => ({
      pScale: isP ? { x: sx, y: sy } : undefined,
      eScale: !isP ? { x: sx, y: sy } : undefined,
      pOffset: isP ? { x: 0, y: oy } : { x: 0, y: 0 },
      eOffset: !isP ? { x: 0, y: oy } : { x: 0, y: 0 },
    });

    return [
      // [1번 납작 구간: #1 ~ #5] 충분히 오래 납작 상태 유지
      // #1. 기존 원 발현 & 1번 납작 시작
      {
        ...baseFrame,
        ...getCasterTransform(1.22, 0.78, 5),
        delay: 55,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.08,
        phaseId: "meditate-1",
        phaseName: "#1. 기존 원 발현 & 1번 납작 시작",
      },
      // #2. 1번 최대 납작
      {
        ...baseFrame,
        ...getCasterTransform(1.36, 0.64, 8),
        delay: 55,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.17,
        phaseId: "meditate-2",
        phaseName: "#2. 1번 최대 납작 지속",
      },
      // #3. 1번 최대 납작 지속
      {
        ...baseFrame,
        ...getCasterTransform(1.36, 0.64, 8),
        delay: 55,
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.25,
        phaseId: "meditate-3",
        phaseName: "#3. 1번 최대 납작 지속",
      },
      // #4. 3프레임 뒤 내부 원 발현 & 1번 납작 유지
      {
        ...baseFrame,
        ...getCasterTransform(1.36, 0.64, 8),
        delay: 55,
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.33,
        phaseId: "meditate-4",
        phaseName: "#4. 3프레임 뒤 내부 원 발현 & 1번 납작 유지",
      },
      // #5. 1번 납작 유지 & 세로 신장 준비
      {
        ...baseFrame,
        ...getCasterTransform(1.30, 0.70, 7),
        delay: 55,
        showEffect: true,
        hitFlash: false,
        moveStep: 5,
        effectProgress: 0.42,
        phaseId: "meditate-5",
        phaseName: "#5. 1번 납작 유지",
      },

      // [2번 세로로 길고 얇게 구간: #6 ~ #10] 충분히 오래 세로 신장 상태 유지
      // #6. 2번 세로로 길고 얇아짐 솟구침
      {
        ...baseFrame,
        ...getCasterTransform(0.78, 1.28, -7),
        delay: 55,
        showEffect: true,
        hitFlash: false,
        moveStep: 6,
        effectProgress: 0.50,
        phaseId: "meditate-6",
        phaseName: "#6. 2번 세로로 길고 얇아짐 솟구침",
      },
      // #7. 2번 세로로 최대 길고 얇아짐
      {
        ...baseFrame,
        ...getCasterTransform(0.66, 1.40, -10),
        delay: 55,
        showEffect: true,
        hitFlash: false,
        moveStep: 7,
        effectProgress: 0.58,
        phaseId: "meditate-7",
        phaseName: "#7. 2번 세로로 최대 길고 얇아짐",
      },
      // #8. 2번 세로로 길고 얇은 상태 지속
      {
        ...baseFrame,
        ...getCasterTransform(0.66, 1.40, -10),
        delay: 55,
        showEffect: true,
        hitFlash: false,
        moveStep: 8,
        effectProgress: 0.67,
        phaseId: "meditate-8",
        phaseName: "#8. 2번 세로로 길고 얇은 상태 지속",
      },
      // #9. 2번 세로로 길고 얇은 상태 지속
      {
        ...baseFrame,
        ...getCasterTransform(0.68, 1.38, -9),
        delay: 55,
        showEffect: true,
        hitFlash: false,
        moveStep: 9,
        effectProgress: 0.78,
        phaseId: "meditate-9",
        phaseName: "#9. 2번 세로로 길고 얇은 상태 지속",
      },
      // #10. 2번 세로로 길고 얇은 상태 지속
      {
        ...baseFrame,
        ...getCasterTransform(0.72, 1.32, -8),
        delay: 55,
        showEffect: true,
        hitFlash: false,
        moveStep: 10,
        effectProgress: 0.89,
        phaseId: "meditate-10",
        phaseName: "#10. 2번 세로로 길고 얇은 상태 지속",
      },

      // [복귀 구간: #11 ~ #12]
      // #11. 원래 상태 복귀 전이
      {
        ...baseFrame,
        ...getCasterTransform(0.96, 1.05, -1),
        delay: 55,
        showEffect: true,
        hitFlash: false,
        moveStep: 11,
        effectProgress: 0.98,
        phaseId: "meditate-11",
        phaseName: "#11. 원래 상태 복귀",
      },
      // #12. 완료 및 복귀 (완전한 원래 상태)
      {
        ...baseFrame,
        ...getCasterTransform(1.0, 1.0, 0),
        delay: 60,
        showEffect: false,
        hitFlash: false,
        moveStep: 12,
        phaseId: "meditate-complete",
        phaseName: "#12. 원래 상태 완료 및 복귀",
      },
    ];
  },
};
