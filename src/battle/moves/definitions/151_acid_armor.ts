// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawAcidArmorEffect } from "../../../renderers/moves/gen1/move149_152.js";

/**
 * 151: 녹기 (Acid Armor)
 *
 * 타입: 독 (Poison)
 * 분류: 변화 (Status)
 * 위력: - / 명중: - / PP: 20
 * 효과: 몸을 액화시켜 자신의 방어를 크게(2랭크) 올린다.
 *
 * [유저 요구사항 100% 반영]:
 * - 원래상태에서 시전포켓몬
 * - 납작해지면서 넓어짐 > 동시에 흰색필터 적용 점점강하게 >
 * - 이후 납작상태유지 흰색필터적용유지 페이드아웃 하고 원상복귀 빠르게
 */
export const acidArmorMove: BattleMoveAnimation = {
  num: 151,
  key: "acid-armor",
  nameKo: "녹기",
  nameEn: "Acid Armor",
  type: "poison",
  category: "status",
  camera: { type: "self", zoom: 1.25 }, // 시전 포켓몬에게 집중 조명
  drawEffect: drawAcidArmorEffect,
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
    // ⚠️ 바닥 접지 방향(+y)은 플레이어/적 모두 화면 아래 방향이므로 동일하게 +y 적용!
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y } : { x: 0, y: 0 },
    });

    // 시전자 스케일 헬퍼 (납작 & 넓어짐)
    const cScale = (scaleX: number, scaleY: number) => ({
      pScale: isP ? { x: scaleX, y: scaleY } : undefined,
      eScale: !isP ? { x: scaleX, y: scaleY } : undefined,
    });

    // 시전자 흰색 필터 헬퍼 (점점 강해짐)
    const cWhite = (val: number) => ({
      whiteFilterAlpha: val,
      pWhiteAlpha: isP ? val : 0,
      eWhiteAlpha: !isP ? val : 0,
      casterWhite: val >= 0.99,
    });

    // 시전자 투명도(페이드아웃) 헬퍼
    const cAlpha = (val: number) => ({
      pAlpha: isP ? val : 1.0,
      eAlpha: !isP ? val : 1.0,
    });

    // 시전자 하단 넓어짐(사다리꼴 퍼짐) 헬퍼
    const cBottomSpread = (val: number) => ({
      bottomSpread: val,
      pBottomSpread: isP ? val : undefined,
      eBottomSpread: !isP ? val : undefined,
    });

    return [
      // Frame 1: 원래 상태에서 시작 준비
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...cBottomSpread(1.0),
        ...cWhite(0.0),
        ...cAlpha(1.0),
        moveStep: 1,
        phaseId: "acid-armor-start",
        phaseName: "#1. 시전 준비 (원래 상태)",
      },

      // =========================================================================
      // [납작해지면서 아래쪽이 더 넓어짐 + 흰색필터 적용 + 동시 페이드아웃]
      // =========================================================================
      // Frame 2: 1단계 용해 (하단 살짝 넓어짐, 흰색필터 30%, 페이드아웃 85%)
      {
        ...baseFrame,
        delay: 65,
        ...cOff(0, 0),
        ...cScale(1.08, 0.80),
        ...cBottomSpread(1.12),
        ...cWhite(0.30),
        ...cAlpha(0.85),
        moveStep: 1,
        phaseId: "acid-armor-melt-1",
        phaseName: "#2. 1단계 용해 (하단 넓어짐 1.12x, 흰색필터 30%, 알파 85%)",
      },

      // Frame 3: 2단계 용해 (납작 & 하단 적당히 넓어짐, 흰색필터 60%, 페이드아웃 60%)
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 0),
        ...cScale(1.18, 0.58),
        ...cBottomSpread(1.24),
        ...cWhite(0.60),
        ...cAlpha(0.60),
        moveStep: 1,
        phaseId: "acid-armor-melt-2",
        phaseName: "#3. 2단계 용해 (하단 넓어짐 1.24x, 흰색필터 60%, 알파 60%)",
      },

      // Frame 4: 3단계 용해 (더욱 납작 & 하단 자연스러운 퍼짐, 흰색필터 85%, 페이드아웃 35%)
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...cScale(1.28, 0.38),
        ...cBottomSpread(1.36),
        ...cWhite(0.85),
        ...cAlpha(0.35),
        moveStep: 1,
        phaseId: "acid-armor-melt-3",
        phaseName: "#4. 3단계 용해 (하단 넓어짐 1.36x, 흰색필터 85%, 알파 35%)",
      },

      // Frame 5: 최대 납작 상태 & 하단 적정 퍼짐 피크 & 완전 백색 (페이드아웃 10%)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...cScale(1.38, 0.22),
        ...cBottomSpread(1.45),
        ...cWhite(1.0),
        ...cAlpha(0.10),
        moveStep: 2,
        phaseId: "acid-armor-squash-peak",
        phaseName: "#5. 최대 납작 & 하단 1.45x (소실 직전, 알파 10%)",
      },

      // Frame 6: 완전 용해 소실 (알파 0.0)
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 0),
        ...cScale(1.38, 0.22),
        ...cBottomSpread(1.45),
        ...cWhite(1.0),
        ...cAlpha(0.0),
        moveStep: 2,
        phaseId: "acid-armor-vanish",
        phaseName: "#6. 완전 용해 소실 (은신, 알파 0%)",
      },

      // =========================================================================
      // [원상복귀 빠르게]
      // =========================================================================
      // Frame 7: 빠른 원상복귀 진입 (1프레임 복귀 과도기)
      {
        ...baseFrame,
        delay: 60,
        ...cOff(0, 0),
        ...cScale(1.06, 0.96),
        ...cBottomSpread(1.0),
        ...cWhite(0.0),
        ...cAlpha(0.75),
        moveStep: 3,
        phaseId: "acid-armor-restore-fast",
        phaseName: "#7. 빠른 원상복귀 진입",
      },

      // Frame 8: 완벽한 원래 상태로 복귀 완료
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...cBottomSpread(1.0),
        ...cWhite(0.0),
        ...cAlpha(1.0),
        moveStep: 3,
        phaseId: "acid-armor-complete",
        phaseName: "#8. 원상복귀 완료",
      },
    ];
  },
};
