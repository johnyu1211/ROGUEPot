// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawSwaggerEffect } from "../../../renderers/moves/gen1/move205_208.js";

/**
 * 207: 뽐내기 (Swagger) - 노말 타입 변화 기술
 *
 * 위력: - / 명중: 85 / PP: 15
 * 설명: 상대를 도발하여 공격을 2랭크 올리고 혼란에 빠뜨린다.
 *
 * [유저 지정 연출 시퀀스]:
 * 1. [시전포켓몬이 살짝 커짐]: 시전자 포켓몬이 가슴을 펴며 체격 확대(pScale/eScale 1.18x) ➔ 의기양양한 태세
 * 2. [대상포켓몬 붉게 페이드인/페이드아웃 & 화난 빠직(💢) 마크 왼쪽 ➔ 오른쪽]:
 *    - 대상 포켓몬이 분노로 붉게 달아오름 (targetRedTint + RedLevel 0.35 ➔ 1.0)
 *    - 왼쪽 이마에 빠직(💢) 마크 '빠직!' 팝인
 *    - 오른쪽 이마에 빠직(💢) 마크 2차 팝인
 *    - 양쪽 빠직 마크가 맥동하며 대상이 분노로 부들부들 떨림
 *    - 붉은기 및 빠직 마크 서서히 페이드아웃 소산
 * 3. [이후 랭크업]: 분노로 인한 공격 2랭크 상승 오라 파티클 솟구침
 * 4. [혼란]: 머리 위 3D 궤도 회전 별무리(★ ★ ★) 공전 & 비틀거리며 혼란 돌입
 */
export const swaggerMove: BattleMoveAnimation = {
  num: 207,
  key: "swagger",
  nameKo: "뽐내기",
  nameEn: "Swagger",
  type: "normal",
  category: "status",
  customStatParticles: true,
  camera: {
    type: "target",
    zoom: 1.25,
    delayUntilStep: 2,
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawSwaggerEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      cameraZoom: 1.0,
      showEffect: true,
      moveStep: 1,
    };

    // 시전자 오프셋 & 스케일 (수비자는 {0, 0} 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const cScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    // 대상 오프셋, 회전, 붉어짐 (시전자는 영향 없음)
    const tOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x, y } : { x: 0, y: 0 },
    });

    const tRot = (rot: number) => ({
      pRot: !isP ? rot : 0,
      eRot: isP ? rot : 0,
    });

    // 대상 순수 붉은색 염색 헬퍼 (203: 버티기 고증 - RGBA 직접 오버레이 방식으로 선명한 분노 진홍빛 연출)
    const targetRedHelper = (lvl: number) => {
      const active = lvl > 0.01;
      const alpha = Math.max(0, Math.min(0.85, lvl * 0.85));
      const color = active ? `rgba(220, 20, 40, ${alpha.toFixed(2)})` : null;
      return {
        pTintColor: !isP ? color : undefined,
        eTintColor: isP ? color : undefined,
        targetRedTint: false,
        casterRedTint: false,
        casterRedLevel: 0,
        pRedTint: false,
        eRedTint: false,
      };
    };

    // 빗맞았을 때 (Miss 처리)
    if (isHit === false) {
      return [
        {
          ...baseFrame,
          delay: 110,
          ...cScale(1.08, 1.08),
          ...cOff(0, -3),
          phaseId: "swagger-miss-puff-1",
          phaseName: "#1. 시전자 가슴 펴기",
        },
        {
          ...baseFrame,
          delay: 140,
          ...cScale(1.18, 1.18),
          ...cOff(0, -6),
          phaseId: "swagger-miss-puff-2",
          phaseName: "#2. 시전자 뽐내기",
        },
        {
          ...baseFrame,
          delay: 130,
          ...cScale(1.15, 1.15),
          ...cOff(0, -4),
          phaseId: "swagger-miss-puff-3",
          phaseName: "#3. 시전자 뽐내기 유지",
        },
        {
          ...baseFrame,
          delay: 100,
          ...cScale(1.0, 1.0),
          ...cOff(0, 0),
          moveStep: 2,
          phaseId: "swagger-miss-finish",
          phaseName: "#4. 빗맞음 (반응 없음)",
        },
      ];
    }

    return [
      // ======================================================================
      // Step 1: 시전포켓몬이 살짝 커짐 (Caster Swaggers / Puffs Up)
      // ======================================================================
      // #1. 시전자 가슴 펴며 호흡
      {
        ...baseFrame,
        delay: 110,
        ...cScale(1.08, 1.08),
        ...cOff(0, -3),
        phaseId: "swagger-puff-1",
        phaseName: "#1. 시전자 가슴 펴기",
      },
      // #2. 시전자 뽐내며 체격 확대 피크 (Scale 1.18x)
      {
        ...baseFrame,
        delay: 140,
        ...cScale(1.18, 1.18),
        ...cOff(0, -6),
        phaseId: "swagger-puff-2",
        phaseName: "#2. 시전자 뽐내기 (체격 확대)",
      },
      // #3. 시전자 의기양양한 태세 유지
      {
        ...baseFrame,
        delay: 130,
        ...cScale(1.15, 1.15),
        ...cOff(0, -4),
        phaseId: "swagger-puff-3",
        phaseName: "#3. 시전자 뽐내기 유지",
      },
      // #4. 시전자 정위치 복귀
      {
        ...baseFrame,
        delay: 90,
        ...cScale(1.0, 1.0),
        ...cOff(0, 0),
        phaseId: "swagger-puff-return",
        phaseName: "#4. 시전자 정위치 복귀",
      },

      // ======================================================================
      // Step 2: 대상포켓몬 붉게 페이드인/페이드아웃 & 화난 빠직(💢) 단일 맥동
      // ======================================================================
      // #5. 대상 붉어짐 시작 (버티기 30% 틴트) & 빠직 출현 ('빠직!' 팝인)
      {
        ...baseFrame,
        delay: 80,
        moveStep: 2,
        ...targetRedHelper(0.30),
        ...tOff(-2, 0),
        swaggerVein: { scale: 1.45, alpha: 1.0, popProgress: 0.2 },
        phaseId: "swagger-vein-pop",
        phaseName: "#5. 대상 붉어짐 시작 (버티기 30%) & 빠직 출현",
      },
      // #6. 대상 붉어짐 심화 (버티기 70% 틴트) & 빠직 안착
      {
        ...baseFrame,
        delay: 80,
        moveStep: 2,
        ...targetRedHelper(0.70),
        ...tOff(3, 0),
        swaggerVein: { scale: 1.0, alpha: 1.0, popProgress: 1.0 },
        phaseId: "swagger-vein-settle",
        phaseName: "#6. 대상 붉어짐 심화 (버티기 70%) & 빠직 안착",
      },
      // #7. 대상 격분 붉어짐 피크 (버티기 100% 피크 틴트) & 빠직 강한 팽창 맥동
      {
        ...baseFrame,
        delay: 90,
        moveStep: 2,
        ...targetRedHelper(1.0),
        ...tOff(-4, 0),
        swaggerVein: { scale: 1.35, alpha: 1.0, popProgress: 1.0 },
        phaseId: "swagger-vein-pulse-1",
        phaseName: "#7. 대상 붉어짐 피크 (버티기 100%) & 빠직 팽창 맥동",
      },
      // #8. 대상 분노 진동 (부들부들 떨림) & 빠직 유지
      {
        ...baseFrame,
        delay: 90,
        moveStep: 2,
        ...targetRedHelper(0.85),
        ...tOff(3, 0),
        swaggerVein: { scale: 1.15, alpha: 1.0, popProgress: 1.0 },
        phaseId: "swagger-vein-pulse-2",
        phaseName: "#8. 대상 분노 진동 & 빠직 2차 맥동",
      },
      // #9. 분노 절정 & 붉은기 페이드아웃 시작 (버티기 50% 틴트)
      {
        ...baseFrame,
        delay: 80,
        moveStep: 2,
        ...targetRedHelper(0.50),
        ...tOff(-2, 0),
        swaggerVein: { scale: 0.90, alpha: 0.65, popProgress: 1.0 },
        phaseId: "swagger-rage-fading",
        phaseName: "#9. 분노 절정 & 붉은기 페이드아웃 시작 (버티기 50%)",
      },
      // #10. 붉은기 및 빠직 소산 완료 (버티기 20% ➔ 0%)
      {
        ...baseFrame,
        delay: 70,
        moveStep: 2,
        ...targetRedHelper(0.20),
        ...tOff(0, 0),
        swaggerVein: { scale: 0.60, alpha: 0.20, popProgress: 1.0 },
        phaseId: "swagger-rage-dissipate",
        phaseName: "#10. 붉은기 및 빠직 소산 완료",
      },

      // ======================================================================
      // Step 3: 이후 공격 2랭크 상승 오라 (Target Attack +2 Boost)
      // ======================================================================
      // #11. 공격 2랭크업 오라 개시
      {
        ...baseFrame,
        delay: 80,
        moveStep: 3,
        ...targetRedHelper(0.0),
        statProgress: 0.22,
        statDirection: "up",
        phaseId: "swagger-stat-1",
        phaseName: "#11. 공격 2랭크업 오라 개시",
      },
      // #12. 공격 2랭크업 에너지 솟구침
      {
        ...baseFrame,
        delay: 80,
        moveStep: 3,
        statProgress: 0.50,
        statDirection: "up",
        phaseId: "swagger-stat-2",
        phaseName: "#12. 공격 2랭크업 에너지 솟구침",
      },
      // #13. 공격 2랭크업 에너지 절정
      {
        ...baseFrame,
        delay: 80,
        moveStep: 3,
        statProgress: 0.78,
        statDirection: "up",
        phaseId: "swagger-stat-3",
        phaseName: "#13. 공격 2랭크업 에너지 절정",
      },
      // #14. 공격 2랭크업 만개 & 잔향
      {
        ...baseFrame,
        delay: 80,
        moveStep: 3,
        statProgress: 0.98,
        statDirection: "up",
        phaseId: "swagger-stat-4",
        phaseName: "#14. 공격 2랭크업 만개 및 잔향",
      },

      // ======================================================================
      // Step 4: 혼란(Confusion) 상태 돌입 (3D 궤도 회전 별무리)
      // ======================================================================
      // #15. 혼란 별무리 출현 & 우측 비틀림
      {
        ...baseFrame,
        delay: 80,
        moveStep: 4,
        ...tOff(3, 0),
        ...tRot(0.04),
        confusionProgress: 0.22,
        phaseId: "swagger-confuse-1",
        phaseName: "#15. 혼란 별무리 출현 & 우측 비틀림",
      },
      // #16. 혼란 별무리 3D 회전 & 좌측 비틀림
      {
        ...baseFrame,
        delay: 80,
        moveStep: 4,
        ...tOff(-3, 0),
        ...tRot(-0.04),
        confusionProgress: 0.50,
        phaseId: "swagger-confuse-2",
        phaseName: "#16. 별무리 3D 회전 & 좌측 비틀림",
      },
      // #17. 멍한 표정으로 비틀비틀
      {
        ...baseFrame,
        delay: 80,
        moveStep: 4,
        ...tOff(2, 0),
        ...tRot(0.03),
        confusionProgress: 0.80,
        phaseId: "swagger-confuse-3",
        phaseName: "#17. 멍한 표정으로 비틀비틀",
      },
      // #18. 별무리 2회전 통과 & 서서히 감속
      {
        ...baseFrame,
        delay: 80,
        moveStep: 4,
        ...tOff(-1, 0),
        ...tRot(-0.02),
        confusionProgress: 1.05,
        phaseId: "swagger-confuse-4",
        phaseName: "#18. 별무리 2회전 통과 & 서서히 감속",
      },
      // #19. 혼란 안착 & 원위치 복귀
      {
        ...baseFrame,
        delay: 90,
        moveStep: 4,
        ...tOff(0, 0),
        ...tRot(0),
        confusionProgress: 1.22,
        phaseId: "swagger-finish",
        phaseName: "#19. 혼란 안착 및 원위치 복귀",
      },
    ];
  },
};
