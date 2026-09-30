// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";

/**
 * 150: 튀어오르기 (Splash)
 *
 * 타입: 노말 (Normal)
 * 분류: 변화 (Status)
 * 위력: - / 명중: - / PP: 40
 * 효과: 팔딱팔딱 튈 뿐 아무 일도 일어나지 않는다!
 *
 * [유저 요구사항 100% 반영]:
 * - 아래로 내려가는 오프셋 전면 제거 (바닥선 y=0 절대 고정, 아래로 쳐지지 않음)
 * - 납작할 때: 발은 지면에 칼같이 붙어있고 머리만 아래로 눌려 납작! (y: 0 고정)
 * - 세로길쭉할 때: 상공으로만 솟구쳐 위로 길쭉! (y <= 0)
 * - 과정프레임 각 최소 2개 (납작 2F, 세로 2F)
 */
export const splashMove: BattleMoveAnimation = {
  num: 150,
  key: "splash",
  nameKo: "튀어오르기",
  nameEn: "Splash",
  type: "normal",
  category: "status",
  camera: { type: "self", zoom: 1.25 }, // 시전 포켓몬에게 집중 조명
  drawEffect: () => {}, // 파티클 없이 순수 스프라이트 모션
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      showEffect: false,
      hitFlash: false,
    };

    // 시전자 오프셋 헬퍼
    // ⚠️ 상공 도약(y)은 플레이어/적 모두 화면 상단(음수 y) 방향이므로 y 부호 반전 없이 동일하게 적용!
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y } : { x: 0, y: 0 },
    });

    // 시전자 스케일 헬퍼
    const cScale = (scaleX: number, scaleY: number) => ({
      pScale: isP ? { x: scaleX, y: scaleY } : undefined,
      eScale: !isP ? { x: scaleX, y: scaleY } : undefined,
    });

    // 상공 도약 Y 오프셋 (위로만 솟구침, 음수)
    const stretchAirY1 = isP ? -8 : -7;
    const stretchAirY2 = isP ? -18 : -15;

    return [
      // Frame 1: 시작 준비 (기본 자세)
      {
        ...baseFrame,
        delay: 50,
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        moveStep: 1,
        phaseId: "splash-start",
        phaseName: "#1. 시작 준비",
      },

      // =========================================================================
      // [1차 납작 과정: 2프레임] - 발은 지면(y=0)에 고정, 머리만 눌림!
      // =========================================================================
      // Frame 2: 1차 납작 진입 (압축 시작, y=0)
      {
        ...baseFrame,
        delay: 60,
        ...cOff(0, 0),
        ...cScale(1.18, 0.82),
        moveStep: 1,
        phaseId: "splash-squash-1a",
        phaseName: "#2. 1차 납작 (압축 진입, 지면 고정)",
      },
      // Frame 3: 1차 납작 최대 피크 (완전 납작, y=0)
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...cScale(1.36, 0.64),
        moveStep: 1,
        phaseId: "splash-squash-1b",
        phaseName: "#3. 1차 납작 (최대 압축 피크, 지면 고정)",
      },

      // =========================================================================
      // [1차 세로길쭉 과정: 2프레임] - 상공으로만 솟구침! (y < 0)
      // =========================================================================
      // Frame 4: 1차 세로길쭉 진입 (상승 도약 중)
      {
        ...baseFrame,
        delay: 60,
        ...cOff(0, stretchAirY1),
        ...cScale(0.86, 1.18),
        moveStep: 1,
        phaseId: "splash-stretch-1a",
        phaseName: "#4. 1차 세로길쭉 (상승 도약)",
      },
      // Frame 5: 1차 세로길쭉 최대 피크 (상공 최고점 완전 길쭉)
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, stretchAirY2),
        ...cScale(0.68, 1.42),
        moveStep: 1,
        phaseId: "splash-stretch-1b",
        phaseName: "#5. 1차 세로길쭉 (상공 최고점 피크)",
      },

      // =========================================================================
      // [2차 납작 과정: 2프레임] - 지면(y=0)에 착지하며 납작!
      // =========================================================================
      // Frame 6: 2차 납작 진입 (착지 압축 진입, y=0)
      {
        ...baseFrame,
        delay: 60,
        ...cOff(0, 0),
        ...cScale(1.18, 0.82),
        moveStep: 2,
        phaseId: "splash-squash-2a",
        phaseName: "#6. 2차 납작 (착지 압축 진입)",
      },
      // Frame 7: 2차 납작 최대 피크 (완전 납작, y=0)
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...cScale(1.36, 0.64),
        moveStep: 2,
        phaseId: "splash-squash-2b",
        phaseName: "#7. 2차 납작 (최대 압축 피크)",
      },

      // =========================================================================
      // [2차 세로길쭉 과정: 2프레임] - 상공으로만 솟구침! (y < 0)
      // =========================================================================
      // Frame 8: 2차 세로길쭉 진입 (상승 도약 중)
      {
        ...baseFrame,
        delay: 60,
        ...cOff(0, stretchAirY1),
        ...cScale(0.86, 1.18),
        moveStep: 2,
        phaseId: "splash-stretch-2a",
        phaseName: "#8. 2차 세로길쭉 (상승 도약)",
      },
      // Frame 9: 2차 세로길쭉 최대 피크 (상공 최고점 완전 길쭉)
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, stretchAirY2),
        ...cScale(0.68, 1.42),
        moveStep: 2,
        phaseId: "splash-stretch-2b",
        phaseName: "#9. 2차 세로길쭉 (상공 최고점 피크)",
      },

      // =========================================================================
      // [3차 납작 과정: 2프레임] - 지면(y=0)에 착지하며 납작!
      // =========================================================================
      // Frame 10: 3차 납작 진입 (착지 압축 진입, y=0)
      {
        ...baseFrame,
        delay: 60,
        ...cOff(0, 0),
        ...cScale(1.18, 0.82),
        moveStep: 3,
        phaseId: "splash-squash-3a",
        phaseName: "#10. 3차 납작 (착지 압축 진입)",
      },
      // Frame 11: 3차 납작 최대 피크 (완전 납작, y=0)
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...cScale(1.36, 0.64),
        moveStep: 3,
        phaseId: "splash-squash-3b",
        phaseName: "#11. 3차 납작 (최대 압축 피크)",
      },

      // =========================================================================
      // [원복 과정: 2프레임]
      // =========================================================================
      // Frame 12: 탄성 반동 안착 (약간의 상단 미세 튕김)
      {
        ...baseFrame,
        delay: 65,
        ...cOff(0, -3),
        ...cScale(0.94, 1.06),
        moveStep: 3,
        phaseId: "splash-rebound",
        phaseName: "#12. 탄성 반동",
      },
      // Frame 13: 최종 원복 착지 (y=0)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        moveStep: 3,
        phaseId: "splash-restore",
        phaseName: "#13. 최종 원복 착지",
      },

      // =========================================================================
      // [마무리]
      // =========================================================================
      // Frame 14: 정지 및 여운 ("하지만 아무 일도 일어나지 않았다!")
      {
        ...baseFrame,
        delay: 130,
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        moveStep: 4,
        phaseId: "splash-finish-pause",
        phaseName: "#14. 아무 일도 일어나지 않았다!",
      },
      // Frame 15: 연출 완료 및 전장 복귀
      {
        ...baseFrame,
        delay: 60,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        moveStep: 5,
        phaseId: "splash-complete",
        phaseName: "#15. 연출 완료 및 복귀",
      },
    ];
  },
};
