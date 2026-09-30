// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawSporeEffect } from "../../../renderers/moves/gen1/move145_148.js";

/**
 * 147: 버섯포자 (Spore)
 *
 * 타입: 풀 (Grass)
 * 분류: 변화 (Status)
 * 위력: - / 명중: 100 / PP: 15
 * 효과: 대상을 100% 확률로 수면 상태로 만듦 (풀 타입에게는 무효)
 *
 * [유저 요구사항 100% 반영]:
 * 1. 버섯 던지는 과정 일체 배제
 * 2. 대상 머리 위 상공에서 황금빛 포자가 살랑살랑 전신으로 쏟아져 내리는 포자 샤워 바로 발현
 * 3. 포자의 흰색 하이라이트 배제 (순수 노랑/황금/연두 포자 입자)
 * 4. 포자 침투와 함께 머리 위로 Zzz 수면 방울이 피어오르며 깊은 잠에 안착
 */
export const sporeMove: BattleMoveAnimation = {
  num: 147,
  key: "spore",
  nameKo: "버섯포자",
  nameEn: "Spore",
  type: "grass",
  category: "status",
  camera: { type: "target", zoom: 1.30 },
  drawEffect: drawSporeEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    // 절대 규칙 2 준수: 시전자 전용 오프셋 헬퍼 (수비자는 {0, 0} 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // -------------------------------------------------------------
    // Miss인 경우: 대상 머리 위에 포자가 떨어지나 대상이 뒤로 회피하여 빗나감
    // -------------------------------------------------------------
    if (!isHit) {
      return [
        // 1. 시전자 포자 방출
        {
          ...baseFrame,
          delay: 70,
          ...cOff(-4, 2),
          pScale: isP ? { x: 1.06, y: 0.94 } : undefined,
          eScale: !isP ? { x: 1.06, y: 0.94 } : undefined,
          showEffect: false,
          moveStep: 1,
          phaseId: "spore-miss-prep",
          phaseName: "1. 포자 방출",
        },
        // 2. 포자가 떨어지기 시작 & 대상이 뒤로 쓱 물러남
        {
          ...baseFrame,
          delay: 80,
          pOffset: isP ? { x: 0, y: 0 } : { x: -12, y: 0 },
          eOffset: !isP ? { x: 0, y: 0 } : { x: 12, y: 0 },
          showEffect: true,
          sporeShowerProg: 0.35,
          moveStep: 2,
          phaseId: "spore-miss-dodge",
          phaseName: "2. 대상 회피 (포자 빗나감)",
        },
        // 3. 포자가 빈 바닥으로 쏟아져 소산
        {
          ...baseFrame,
          delay: 85,
          pOffset: isP ? { x: 0, y: 0 } : { x: -8, y: 0 },
          eOffset: !isP ? { x: 0, y: 0 } : { x: 8, y: 0 },
          showEffect: true,
          sporeShowerProg: 0.75,
          sporeMistFade: 0.5,
          moveStep: 3,
          phaseId: "spore-miss-settle",
          phaseName: "3. 포자 바닥 소산",
        },
        // 4. 복귀
        {
          ...baseFrame,
          delay: 70,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          showEffect: false,
          moveStep: 4,
          phaseId: "spore-miss-complete",
          phaseName: "4. 복귀",
        },
      ];
    }

    // -------------------------------------------------------------
    // Hit인 경우: 대상 머리 위 상공에서 포자가 바로 쏟아져 내림 ➔ Zzz 수면 비상
    // -------------------------------------------------------------
    return [
      // Frame 1: 시전자 포자 방출 (살짝 힘 주기)
      {
        ...baseFrame,
        delay: 60,
        ...cOff(-4, 2),
        pScale: isP ? { x: 1.05, y: 0.95 } : undefined,
        eScale: !isP ? { x: 1.05, y: 0.95 } : undefined,
        showEffect: false,
        moveStep: 1,
        phaseId: "spore-cast",
        phaseName: "#1. 포자 방출",
      },

      // Frame 2: 대상 머리 위 상공에서 포자 구름 발생 & 포자 낙하 개시
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 0),
        showEffect: true,
        sporeShowerProg: 0.18,
        moveStep: 2,
        phaseId: "spore-shower-start",
        phaseName: "#2. 포자 낙하 개시",
      },

      // Frame 3: 포자 샤워 확산 (전신으로 살랑살랑 쏟아져 내림)
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        pOffset: !isP ? { x: 0, y: 1 } : { x: 0, y: 0 },
        eOffset: isP ? { x: 0, y: 1 } : { x: 0, y: 0 },
        showEffect: true,
        sporeShowerProg: 0.42,
        moveStep: 3,
        phaseId: "spore-shower-body",
        phaseName: "#3. 포자 샤워 전신 확산",
      },

      // Frame 4: 포자 전신 침투 & 대상 졸림 반응 (살짝 웅크려짐 & 수면 틴트 발현)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        pOffset: !isP ? { x: 0, y: 3 } : { x: 0, y: 0 },
        eOffset: isP ? { x: 0, y: 3 } : { x: 0, y: 0 },
        pScale: !isP ? { x: 1.04, y: 0.96 } : undefined,
        eScale: isP ? { x: 1.04, y: 0.96 } : undefined,
        showEffect: true,
        sporeShowerProg: 0.58,
        targetBlueTint: true,
        moveStep: 4,
        phaseId: "spore-infect",
        phaseName: "#4. 포자 전신 침투 & 수면 반응",
      },

      // Frame 5: 포자 가루 전원 바닥 침강 소멸 & 첫 Zzz 방울 발생
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        pOffset: !isP ? { x: 0, y: 2 } : { x: 0, y: 0 },
        eOffset: isP ? { x: 0, y: 2 } : { x: 0, y: 0 },
        showEffect: true,
        sleepProgress: 0.28,
        sleepAlpha: 0.85,
        targetBlueTint: true,
        moveStep: 5,
        phaseId: "spore-sleep-zzz1",
        phaseName: "#5. 첫 Zzz 방울 발생",
      },

      // Frame 6: Zzz 방울 몽환 비상 1 (포자 알갱이 완전 소멸 상태)
      {
        ...baseFrame,
        delay: 105,
        ...cOff(0, 0),
        pOffset: !isP ? { x: 0, y: 1 } : { x: 0, y: 0 },
        eOffset: isP ? { x: 0, y: 1 } : { x: 0, y: 0 },
        showEffect: true,
        sleepProgress: 0.58,
        sleepAlpha: 1.0,
        targetBlueTint: true,
        moveStep: 6,
        phaseId: "spore-sleep-zzz2",
        phaseName: "#6. Zzz 방울 몽환 비상 1",
      },

      // Frame 7: Zzz 방울 몽환 비상 2
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, 0),
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        sleepProgress: 0.88,
        sleepAlpha: 0.90,
        targetBlueTint: true,
        moveStep: 7,
        phaseId: "spore-sleep-zzz3",
        phaseName: "#7. Zzz 방울 몽환 비상 2",
      },

      // Frame 8: 깊은 수면 안착
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        sporeMistFade: 0.0,
        sleepProgress: 1.0,
        sleepAlpha: 0.40,
        moveStep: 8,
        phaseId: "spore-deep-sleep",
        phaseName: "#8. 깊은 수면 안착",
      },

      // Frame 9: 완료 및 복귀
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        moveStep: 8,
        phaseId: "spore-complete",
        phaseName: "#9. 완료 및 복귀",
      },
    ];
  },
};
