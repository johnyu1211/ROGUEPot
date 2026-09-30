import { BattleFrame, BattleMoveAnimation, MoveContext } from "../types.js";
import {
  drawTransformBehindEffect,
  drawTransformEffect,
} from "../../../renderers/moves/gen1/move141_144.js";

/**
 * 144: 변신 (Transform)
 * 
 * 타입: 노말 (Normal)
 * 분류: 변화 (Status)
 * 위력: - / 명중: - / PP: 10
 * 
 * [유저 지정 4단계 연출 타임라인]:
 * 1. (시전포켓몬이 납작해지면서 흰색필터) (Frames 1~3, 240ms)
 * 2. 시전포켓몬이 완전납작 (Frame 4, 110ms)
 * 3. 흰색필터가 적용된 대상포켓몬 후면 (플레이어 시전 시 대상 후면 / 적 시전 시 대상 전면) (Frames 5~6, 210ms)
 * 4. 펴지면서 원래상태로 돌아오면서 흰색필터 서서히 제거 & 안착 (Frames 7~11, 450ms)
 */
export const transformMove: BattleMoveAnimation = {
  num: 144,
  key: "transform",
  nameKo: "변신",
  nameEn: "Transform",
  type: "normal",
  category: "status",
  camera: { type: "self", zoom: 1.25 },
  drawBehindEffect: drawTransformBehindEffect,
  drawEffect: drawTransformEffect,

  buildFrames: (context: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = context;

    // 시전자 위치 오프셋/스케일 헬퍼
    const cTransform = (
      scale: { x: number; y: number },
      offsetY: number,
      whiteFilterAlpha: number,
      useTransformed: boolean,
      extra: Record<string, any> = {}
    ): Partial<BattleFrame> => ({
      pOffset: isP ? { x: 0, y: offsetY } : { x: 0, y: 0 },
      eOffset: !isP ? { x: 0, y: offsetY } : { x: 0, y: 0 },
      pScale: isP ? scale : { x: 1, y: 1 },
      eScale: !isP ? scale : { x: 1, y: 1 },
      pWhiteAlpha: isP ? whiteFilterAlpha : 0,
      eWhiteAlpha: !isP ? whiteFilterAlpha : 0,
      whiteFilterAlpha,
      useTransformedSprite: useTransformed,
      transformedWho: useTransformed ? (isP ? "player" : "enemy") : undefined,
      ...extra,
    });

    const baseFrame: BattleFrame = {
      delay: 80,
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
      pScale: { x: 1, y: 1 },
      eScale: { x: 1, y: 1 },
      pRot: 0,
      eRot: 0,
      hidePShadow: false,
      hideEShadow: false,
      showEffect: true,
      pRedTint: false,
      eRedTint: false,
    };

    // 빗맞았을 때 (변신은 필중기이나 miss 안전장치)
    if (!isHit) {
      return [
        {
          ...baseFrame,
          delay: 90,
          ...cTransform({ x: 1.10, y: 0.90 }, 4, 0.3, false),
          phaseId: "transform-miss-1",
          phaseName: "1. 찌그러짐",
        },
        {
          ...baseFrame,
          delay: 100,
          ...cTransform({ x: 1.0, y: 1.0 }, 0, 0.0, false),
          phaseId: "transform-miss-2",
          phaseName: "2. 실패 복귀",
        },
      ];
    }

    return [
      // ======================================================================
      // 1단계: (시전포켓몬이 납작해지면서 흰색필터)
      // ======================================================================
      {
        ...baseFrame,
        delay: 80,
        moveStep: 1,
        ...cTransform({ x: 1.12, y: 0.82 }, 0, 0.25, false, {
          dimAlpha: 0.12,
        }),
        phaseId: "transform-squash-1",
        phaseName: "1. 시전포켓몬 하향 압축 & 흰색필터 시작 (80ms)",
      },
      {
        ...baseFrame,
        delay: 80,
        moveStep: 1,
        ...cTransform({ x: 1.30, y: 0.48 }, 0, 0.60, false, {
          dimAlpha: 0.25,
        }),
        phaseId: "transform-squash-2",
        phaseName: "2. 중간 압축 & 흰색필터 강화 (80ms)",
      },
      {
        ...baseFrame,
        delay: 80,
        moveStep: 1,
        ...cTransform({ x: 1.50, y: 0.18 }, 0, 0.90, false, {
          dimAlpha: 0.35,
        }),
        phaseId: "transform-squash-3",
        phaseName: "3. 강한 압축 & 순백화 절정 (80ms)",
      },

      // ======================================================================
      // 2단계: 시전포켓몬이 완전납작
      // ======================================================================
      {
        ...baseFrame,
        delay: 110,
        moveStep: 2,
        ...cTransform({ x: 1.65, y: 0.05 }, 0, 1.0, false, {
          dimAlpha: 0.45,
        }),
        phaseId: "transform-flat",
        phaseName: "4. 시전포켓몬 완전 납작 (순백 100%) (110ms)",
      },

      // ======================================================================
      // 3단계: 흰색필터가 적용된 대상포켓몬 후면 (플레이어 기준 대상 후면 / 적 기준 대상 전면)
      // ======================================================================
      {
        ...baseFrame,
        delay: 110,
        moveStep: 3,
        ...cTransform({ x: 1.65, y: 0.05 }, 0, 1.0, true, {
          dimAlpha: 0.45,
        }),
        phaseId: "transform-swapped-flat",
        phaseName: "5. 대상포켓몬 후면으로 전환 (완전 납작 & 순백필터) (110ms)",
      },
      {
        ...baseFrame,
        delay: 90,
        moveStep: 3,
        ...cTransform({ x: 1.45, y: 0.30 }, 0, 1.0, true, {
          sparkleProgress: 0.25,
          sparkleAlpha: 0.75,
          dimAlpha: 0.38,
        }),
        phaseId: "transform-rising-white",
        phaseName: "6. 대상포켓몬 솟구침 시작 (순백필터 유지) (90ms)",
      },

      // ======================================================================
      // 4단계: 펴지면서 원래상태로 돌아오면서 흰색필터 서서히 제거
      // ======================================================================
      {
        ...baseFrame,
        delay: 90,
        moveStep: 4,
        ...cTransform({ x: 1.25, y: 0.65 }, 0, 0.70, true, {
          sparkleProgress: 0.50,
          sparkleAlpha: 0.95,
          dimAlpha: 0.28,
        }),
        phaseId: "transform-expand-1",
        phaseName: "7. 수직 팽창 & 흰색필터 서서히 제거 (70%) (90ms)",
      },
      {
        ...baseFrame,
        delay: 90,
        moveStep: 4,
        ...cTransform({ x: 1.08, y: 0.94 }, 0, 0.35, true, {
          sparkleProgress: 0.75,
          sparkleAlpha: 0.90,
          dimAlpha: 0.16,
        }),
        phaseId: "transform-expand-2",
        phaseName: "8. 형태 복원 & 본래 색상 발현 (35%) (90ms)",
      },
      {
        ...baseFrame,
        delay: 80,
        moveStep: 4,
        ...cTransform({ x: 0.96, y: 1.04 }, -3, 0.10, true, {
          sparkleProgress: 0.90,
          sparkleAlpha: 0.65,
          dimAlpha: 0.08,
        }),
        phaseId: "transform-rebound",
        phaseName: "9. 탄성 리바운드 & 흰색필터 소멸 (10%) (80ms)",
      },
      {
        ...baseFrame,
        delay: 90,
        moveStep: 4,
        ...cTransform({ x: 1.00, y: 1.00 }, 0, 0.0, true, {
          sparkleProgress: 1.0,
          sparkleAlpha: 0.40,
          dimAlpha: 0.0,
        }),
        phaseId: "transform-complete",
        phaseName: "10. 원래 크기 복귀 & 흰색필터 완전 제거 (90ms)",
      },
      {
        ...baseFrame,
        delay: 110,
        moveStep: 4,
        ...cTransform({ x: 1.00, y: 1.00 }, 0, 0.0, true, {
          sparkleProgress: 0,
          sparkleAlpha: 0,
          dimAlpha: 0.0,
        }),
        phaseId: "transform-settle",
        phaseName: "11. 변신 완료 안착 (110ms)",
      },
    ];
  },
};
