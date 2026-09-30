// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawFlashEffect } from "../../../renderers/moves/gen1/move145_148.js";

/**
 * 148: 플래시 (Flash)
 *
 * 타입: 노말 (Normal)
 * 분류: 변화 (Status)
 * 위력: - / 명중: 100 / PP: 20
 * 효과: 상대의 명중률을 1랭크 떨어뜨린다.
 *
 * [유저 요구사항 100% 반영]:
 * > 암전 > 시전포켓몬에게서 번쩍 1프레임 > 전체 흰색 > 흰색이 페이드아웃
 *
 * 1. 암전: 전장이 칠흑 같은 어둠으로 가라앉음
 * 2. 시전포켓몬에게서 번쩍 1프레임: 어둠 속 시전자 중심 대형 스타버스트 & 광선 발광 (정확히 1프레임)
 * 3. 전체 흰색: 화면 전체를 100% 완전하게 채우는 순백 화이트아웃
 * 4. 흰색이 페이드아웃: 순백 오버레이가 서서히 걷히며 배틀 전장 복원 & 피격 리액션 및 명중률 1랭크 하락 디버프
 */
export const flashMove: BattleMoveAnimation = {
  num: 148,
  key: "flash",
  nameKo: "플래시",
  nameEn: "Flash",
  type: "normal",
  category: "status",
  camera: { type: "none" },
  drawEffect: drawFlashEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    // 시전자 오프셋 헬퍼
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 대상 피격자 오프셋 헬퍼
    const tOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // -------------------------------------------------------------
    // Miss인 경우 (!isHit):
    // 암전 -> 번쩍 1프레임 -> 전체 흰색 -> 대상 회피 (눈 돌림/물러섬) -> 복귀
    // -------------------------------------------------------------
    if (!isHit) {
      return [
        // 1. 암전 진입
        {
          ...baseFrame,
          delay: 60,
          ...cOff(-2, 1),
          pScale: isP ? { x: 1.04, y: 0.96 } : undefined,
          eScale: !isP ? { x: 1.04, y: 0.96 } : undefined,
          showEffect: true,
          darkAlpha: 0.65,
          moveStep: 1,
          phaseId: "flash-miss-dark-in",
          phaseName: "1. 전장 암전 진입",
        },
        // 2. 칠흑 같은 암전
        {
          ...baseFrame,
          delay: 75,
          ...cOff(-3, 1),
          pScale: isP ? { x: 1.06, y: 0.94 } : undefined,
          eScale: !isP ? { x: 1.06, y: 0.94 } : undefined,
          showEffect: true,
          darkAlpha: 0.92,
          moveStep: 1,
          phaseId: "flash-miss-dark-hold",
          phaseName: "2. 칠흑 같은 암전",
        },
        // 3. 시전포켓몬에게서 번쩍 (정확히 단 1프레임!)
        {
          ...baseFrame,
          delay: 70,
          ...cOff(0, 0),
          casterWhite: true,
          showEffect: true,
          darkAlpha: 0.90,
          casterFlash: true,
          flashScale: 1.15,
          moveStep: 2,
          phaseId: "flash-miss-caster-burst",
          phaseName: "3. 시전포켓몬 번쩍 (1프레임 섬광)",
        },
        // 4. 전체 흰색 (화이트아웃)
        {
          ...baseFrame,
          delay: 80,
          ...cOff(0, 0),
          showEffect: true,
          whiteAlpha: 1.0,
          moveStep: 3,
          phaseId: "flash-miss-whiteout",
          phaseName: "4. 전체 흰색 (화이트아웃)",
        },
        // 5. 흰색 페이드아웃 & 대상 회피
        {
          ...baseFrame,
          delay: 65,
          ...cOff(0, 0),
          ...tOff(10, -2),
          showEffect: true,
          whiteAlpha: 0.65,
          moveStep: 4,
          phaseId: "flash-miss-dodge",
          phaseName: "5. 대상 회피 (눈 돌림 / 빗나감)",
        },
        // 6. 흰색 페이드아웃 소산
        {
          ...baseFrame,
          delay: 70,
          ...cOff(0, 0),
          ...tOff(6, -1),
          showEffect: true,
          whiteAlpha: 0.25,
          moveStep: 4,
          phaseId: "flash-miss-fade",
          phaseName: "6. 흰색 소산",
        },
        // 7. 대상 원래 위치 복귀
        {
          ...baseFrame,
          delay: 75,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          showEffect: false,
          moveStep: 4,
          phaseId: "flash-miss-complete",
          phaseName: "7. 완료 및 복귀",
        },
      ];
    }

    // -------------------------------------------------------------
    // Hit인 경우 (isHit === true):
    // 1. 암전 (2프레임)
    // 2. 시전포켓몬에게서 번쩍 1프레임
    // 3. 전체 흰색 (1프레임)
    // 4. 흰색이 페이드아웃 (스탯 다운 연계)
    // -------------------------------------------------------------
    return [
      // Frame 1: 암전 진입 (서서히 어둠이 내려앉음)
      {
        ...baseFrame,
        delay: 60,
        ...cOff(-2, 1),
        pScale: isP ? { x: 1.04, y: 0.96 } : undefined,
        eScale: !isP ? { x: 1.04, y: 0.96 } : undefined,
        showEffect: true,
        darkAlpha: 0.65,
        moveStep: 1,
        phaseId: "flash-dark-in",
        phaseName: "#1. 전장 암전 진입",
      },

      // Frame 2: 칠흑 같은 암전 (전장이 어둠에 휩싸여 침묵)
      {
        ...baseFrame,
        delay: 75,
        ...cOff(-3, 1),
        pScale: isP ? { x: 1.06, y: 0.94 } : undefined,
        eScale: !isP ? { x: 1.06, y: 0.94 } : undefined,
        showEffect: true,
        darkAlpha: 0.92,
        moveStep: 1,
        phaseId: "flash-dark-hold",
        phaseName: "#2. 칠흑 같은 암전",
      },

      // Frame 3: 시전포켓몬에게서 번쩍 1프레임! (Caster Flash 1-Frame Burst)
      // ⚠️ 유저 요구사항: "시전포켓몬에게서 번쩍 1프레임"
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 0),
        casterWhite: true,
        showEffect: true,
        darkAlpha: 0.90,
        casterFlash: true,
        flashScale: 1.15,
        moveStep: 2,
        phaseId: "flash-caster-burst",
        phaseName: "#3. 시전포켓몬 번쩍 (1프레임 섬광)",
      },

      // Frame 4: 전체 흰색 (Full-Screen Pure Whiteout)
      // ⚠️ 유저 요구사항: "전체 흰색"
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        showEffect: true,
        whiteAlpha: 1.0,
        moveStep: 3,
        phaseId: "flash-whiteout",
        phaseName: "#4. 전체 흰색 (화이트아웃)",
      },

      // Frame 5: 흰색 페이드아웃 1 (75%)
      {
        ...baseFrame,
        delay: 60,
        ...cOff(0, 0),
        showEffect: true,
        whiteAlpha: 0.75,
        moveStep: 4,
        phaseId: "flash-fadeout-1",
        phaseName: "#5. 흰색 페이드아웃 (75%)",
      },

      // Frame 6: 흰색 페이드아웃 2 (45%) & 피격 대상 눈부심 움찔 리액션
      {
        ...baseFrame,
        delay: 60,
        ...cOff(0, 0),
        ...tOff(4, -2),
        showEffect: true,
        whiteAlpha: 0.45,
        moveStep: 4,
        phaseId: "flash-fadeout-2",
        phaseName: "#6. 흰색 페이드아웃 (45%) & 피격 리액션",
      },

      // Frame 7: 흰색 페이드아웃 3 (20%) & 명중률 하락 개시
      {
        ...baseFrame,
        delay: 65,
        ...cOff(0, 0),
        ...tOff(-2, 1),
        showEffect: true,
        whiteAlpha: 0.20,
        statProgress: 0.35,
        moveStep: 4,
        phaseId: "flash-fadeout-3",
        phaseName: "#7. 흰색 페이드아웃 (20%) & 명중률 하락 개시",
      },

      // Frame 8: 흰색 거의 소멸 (5%) & 명중률 하락 가속
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 0),
        ...tOff(0, 0),
        showEffect: true,
        whiteAlpha: 0.05,
        statProgress: 0.70,
        moveStep: 4,
        phaseId: "flash-fadeout-4",
        phaseName: "#8. 전장 복원 & 명중률 하락 가속",
      },

      // Frame 9: 명중률 하락 안착 (스탯 하강 화살표 피날레)
      {
        ...baseFrame,
        delay: 75,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        whiteAlpha: 0.0,
        statProgress: 1.00,
        moveStep: 4,
        phaseId: "flash-debuff-settle",
        phaseName: "#9. 명중률 하락 안착",
      },

      // Frame 10: 복귀 및 연출 종료
      {
        ...baseFrame,
        delay: 60,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        moveStep: 4,
        phaseId: "flash-complete",
        phaseName: "#10. 복귀 및 연출 종료",
      },
    ];
  },
};
