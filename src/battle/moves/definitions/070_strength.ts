import { BattleFrame, BattleMoveAnimation, MoveContext } from "../types.js";
import {
  drawStrengthEffect,
  drawStrengthBehindEffect,
} from "../../../renderers/moves/gen1/move069_072.js";

/**
 * 070: 괴력 (Strength)
 * 
 * 타입: 노말 (Normal)
 * 분류: 물리 (Physical)
 * 위력: 80 / 명중: 100 / PP: 15
 * 
 * [연출 타임라인 및 페이즈 - 5세대 원작(BW/B2W2) 스타일]:
 * Phase 1: 시전자 붉은빛 집중 충전 & 전신 수축(Shrink) & 고속 진동(Jitter) (Frames 1~3, 270ms, 시전자 클로즈업)
 * Phase 2: 전방 급도약 릴리즈 & 카메라 상대방으로 고속 러시 전환 (Frame 4, 70ms, 미드포인트 트래킹)
 * Phase 3: 상대 면전 5연속 스파이키 폭발 타격 난무 & 황금빛 스파크 비산 (Frames 5~7, 260ms, 상대방 클로즈업 & 피격 섬광)
 * Phase 4: 타격 잔향 분산 및 원위치 기본 스탠스 복귀 (Frames 8~9, 160ms, 중립 복귀)
 */
export const strengthMove: BattleMoveAnimation = {
  num: 70,
  key: "strength",
  nameKo: "괴력",
  nameEn: "Strength",
  type: "normal",
  category: "physical",
  camera: { type: "rush", zoom: 1.35 },
  drawBehindEffect: drawStrengthBehindEffect,
  drawEffect: drawStrengthEffect,

  buildFrames: (context: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = context;
    const dir = isP ? 1 : -1;

    // 절대 기준 좌표 (560x380 기준)
    const pm = { x: 150, y: 280 };
    const em = { x: 418, y: 152 };

    const casterBase = isP ? pm : em;
    const targetBase = isP ? em : pm;

    // 시전자(caster)와 피격대상(target)의 목표 화면 절대좌표를 pOffset / eOffset으로 변환
    const pos = (casterPos: { x: number; y: number }, targetPos: { x: number; y: number }) => {
      if (isP) {
        return {
          pOffset: { x: Math.round(casterPos.x - pm.x), y: Math.round(casterPos.y - pm.y) },
          eOffset: { x: Math.round(targetPos.x - em.x), y: Math.round(targetPos.y - em.y) },
        };
      } else {
        return {
          pOffset: { x: Math.round(targetPos.x - pm.x), y: Math.round(targetPos.y - pm.y) },
          eOffset: { x: Math.round(casterPos.x - em.x), y: Math.round(casterPos.y - em.y) },
        };
      }
    };

    const scl = (casterScale?: { x: number; y: number }, targetScale?: { x: number; y: number }) => ({
      pScale: isP ? casterScale : targetScale,
      eScale: !isP ? casterScale : targetScale,
    });

    const rot = (casterRot?: number, targetRot?: number) => ({
      pRot: isP ? casterRot : targetRot,
      eRot: !isP ? casterRot : targetRot,
    });

    const baseFrame = {
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

    // 빗맞았을 때 (Miss 처리)
    if (!isHit) {
      return [
        {
          ...baseFrame,
          delay: 85,
          moveStep: 1,
          ...pos(
            { x: casterBase.x - dir * 2, y: casterBase.y + 1 },
            targetBase
          ),
          ...scl({ x: 0.94, y: 0.94 }, { x: 1.0, y: 1.0 }),
          pRedTint: isP,
          eRedTint: !isP,
          auraAlpha: 0,
          phaseId: "strength-miss",
          phaseName: "1. 기합 집중 & 붉은빛 충전 (85ms)",
        },
        {
          ...baseFrame,
          delay: 90,
          moveStep: 1,
          ...pos(
            { x: casterBase.x + dir * 3, y: casterBase.y - 2 },
            targetBase
          ),
          ...scl({ x: 0.90, y: 0.90 }, { x: 1.0, y: 1.0 }),
          pRedTint: isP,
          eRedTint: !isP,
          auraAlpha: 0,
          phaseId: "strength-miss",
          phaseName: "2. 전신 수축 및 진동 (90ms)",
        },
        {
          ...baseFrame,
          delay: 75,
          moveStep: 2,
          ...pos(
            { x: casterBase.x + dir * 18, y: casterBase.y - 4 },
            targetBase
          ),
          ...scl({ x: 1.06, y: 1.02 }, { x: 1.0, y: 1.0 }),
          auraAlpha: 0,
          phaseId: "strength-miss",
          phaseName: "3. 전방 가속 돌진 (75ms)",
        },
        {
          ...baseFrame,
          delay: 85,
          moveStep: 3,
          ...pos(
            { x: casterBase.x + dir * 28, y: casterBase.y },
            { x: targetBase.x, y: targetBase.y - 28 } // 상대방 상공으로 회피
          ),
          ...scl({ x: 1.02, y: 0.98 }, { x: 0.92, y: 1.10 }),
          phaseId: "strength-miss",
          phaseName: "4. 상대방 긴급 회피 (85ms)",
        },
        {
          ...baseFrame,
          delay: 80,
          moveStep: 4,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          pRot: 0,
          eRot: 0,
          showEffect: false,
          phaseId: "strength-miss",
          phaseName: "5. 원위치 복귀 (80ms)",
        },
      ];
    }

    // 적중 시 (Hit 모션 시퀀스)
    return [
      // ----------------------------------------------------------------------
      // Phase 1: 시전자 붉은빛 집중 충전 & 전신 수축 및 고속 진동 (Frames 1~3, 270ms)
      // ----------------------------------------------------------------------
      // 1. [기합 집중 & 붉은빛 차징 시작]: 시전자가 붉게 물들며 살짝 수축 (85ms)
      {
        ...baseFrame,
        delay: 85,
        moveStep: 1,
        ...pos(
          { x: casterBase.x - dir * 2, y: casterBase.y + 1 },
          targetBase
        ),
        ...scl({ x: 0.94, y: 0.94 }, { x: 1.0, y: 1.0 }),
        pRedTint: isP,
        eRedTint: !isP,
        auraAlpha: 0,
        phaseId: "strength-charge",
        phaseName: "1. 기합 집중 & 붉은빛 충전 (85ms)",
      },

      // 2. [전신 수축 & 고속 진동]: 시전자가 더 작게 수축하며 반대 방향으로 바르르 진동 (90ms)
      {
        ...baseFrame,
        delay: 90,
        moveStep: 1,
        ...pos(
          { x: casterBase.x + dir * 3, y: casterBase.y - 2 },
          targetBase
        ),
        ...scl({ x: 0.90, y: 0.90 }, { x: 1.0, y: 1.0 }),
        pRedTint: isP,
        eRedTint: !isP,
        auraAlpha: 0,
        phaseId: "strength-charge",
        phaseName: "2. 전신 수축 & 고속 진동 (90ms)",
      },

      // 3. [근력 집중 정점]: 최대 수축(0.88) 및 팽팽한 장력 충전 정점 (95ms)
      {
        ...baseFrame,
        delay: 95,
        moveStep: 1,
        ...pos(
          { x: casterBase.x - dir * 3, y: casterBase.y + 2 },
          targetBase
        ),
        ...scl({ x: 0.88, y: 0.88 }, { x: 1.0, y: 1.0 }),
        pRedTint: isP,
        eRedTint: !isP,
        auraAlpha: 0,
        phaseId: "strength-charge",
        phaseName: "3. 근력 집중 정점 (95ms)",
      },

      // ----------------------------------------------------------------------
      // Phase 2: 전방 급도약 릴리즈 & 카메라 상대방 고속 러시 전환 (Frame 4, 70ms)
      // ----------------------------------------------------------------------
      // 4. [에너지 릴리즈 & 전방 도약]: 압축되었던 시전자가 탄성 팽창하며 전방 도약 (70ms)
      {
        ...baseFrame,
        delay: 70,
        moveStep: 2,
        ...pos(
          { x: casterBase.x + dir * 16, y: casterBase.y - 4 },
          targetBase
        ),
        ...scl({ x: 1.06, y: 1.04 }, { x: 1.0, y: 1.0 }),
        pRedTint: false,
        eRedTint: false,
        auraAlpha: 0,
        phaseId: "strength-rush",
        phaseName: "4. 전방 도약 & 상대방 포커싱 (70ms)",
      },

      // ----------------------------------------------------------------------
      // Phase 3: 상대 면전 5연속 개별 스파이키 폭발 타격 난무 & 주황링 팽창 (Frames 5~11)
      // ----------------------------------------------------------------------
      // 5. [상단 1·2타 직격]: Burst 0(상단), Burst 1(좌상단) 출현 (75ms)
      {
        ...baseFrame,
        delay: 75,
        moveStep: 3,
        ...pos(
          { x: casterBase.x + dir * 12, y: casterBase.y - 2 },
          { x: targetBase.x + dir * 4, y: targetBase.y + 2 }
        ),
        ...scl({ x: 1.02, y: 1.0 }, { x: 1.08, y: 0.88 }),
        hitFlash: true,
        cameraPan: { x: -dir * 3.5, y: 2.5 },
        strikeStep: 1,
        strikeAlpha: 1.0,
        phaseId: "strength-strike",
        phaseName: "5. 상단 1·2타 연타 직격 (75ms)",
      },

      // 6. [좌하단 3타 강타]: 0·1타 서서히 유지 감쇠 + Burst 2(좌하단) 강타 (75ms)
      {
        ...baseFrame,
        delay: 75,
        moveStep: 3,
        ...pos(
          { x: casterBase.x + dir * 8, y: casterBase.y },
          { x: targetBase.x - dir * 4, y: targetBase.y - 3 }
        ),
        ...scl({ x: 1.0, y: 1.0 }, { x: 0.90, y: 1.10 }),
        hitFlash: true,
        cameraPan: { x: dir * 4.0, y: -3.0 },
        strikeStep: 2,
        strikeAlpha: 1.0,
        phaseId: "strength-strike",
        phaseName: "6. 좌하단 3타 강타 (75ms)",
      },

      // 7. [우하단 4타 강타]: 0·1타 감쇠 + 2타 유지 + Burst 3(우하단) 강타 (75ms)
      {
        ...baseFrame,
        delay: 75,
        moveStep: 3,
        ...pos(
          { x: casterBase.x + dir * 6, y: casterBase.y },
          { x: targetBase.x + dir * 5, y: targetBase.y + 3 }
        ),
        ...scl({ x: 1.0, y: 1.0 }, { x: 1.12, y: 0.86 }),
        hitFlash: true,
        cameraPan: { x: -dir * 4.5, y: 3.5 },
        strikeStep: 3,
        strikeAlpha: 1.0,
        phaseId: "strength-strike",
        phaseName: "7. 우하단 4타 강타 (75ms)",
      },

      // 8. [중앙 5타 피니시 대폭발 & 주황링 확산 시작]: Burst 4(중앙 피니시) 극대 폭발! (90ms)
      {
        ...baseFrame,
        delay: 90,
        moveStep: 3,
        ...pos(
          { x: casterBase.x + dir * 4, y: casterBase.y },
          { x: targetBase.x + dir * 8, y: targetBase.y + 4 }
        ),
        ...scl({ x: 1.0, y: 1.0 }, { x: 1.22, y: 0.74 }),
        hitFlash: true,
        cameraPan: { x: dir * 7.0, y: -5.5 },
        strikeStep: 4,
        strikeAlpha: 1.0,
        phaseId: "strength-strike",
        phaseName: "8. 중앙 피니시 극대 폭발 & 주황링 확산 (90ms)",
      },

      // 9. [순차 서서히 소멸 1단계]: 0·1타 1번째 소멸 + 주황링 2단계 확장 (80ms)
      {
        ...baseFrame,
        delay: 80,
        moveStep: 3,
        ...pos(
          { x: casterBase.x + dir * 3, y: casterBase.y },
          { x: targetBase.x + dir * 5, y: targetBase.y + 2 }
        ),
        ...scl({ x: 1.0, y: 1.0 }, { x: 1.10, y: 0.92 }),
        hitFlash: false,
        cameraPan: { x: -dir * 3.5, y: 2.5 },
        strikeStep: 5,
        strikeAlpha: 1.0,
        phaseId: "strength-strike",
        phaseName: "9. 상단 타격 소멸 & 주황링 확장 (80ms)",
      },

      // 10. [순차 서서히 소멸 2단계]: 2타 2번째 소멸 + 주황링 최대 팽창 (80ms)
      {
        ...baseFrame,
        delay: 80,
        moveStep: 4,
        ...pos(
          { x: casterBase.x + dir * 2, y: casterBase.y },
          { x: targetBase.x + dir * 3, y: targetBase.y + 1 }
        ),
        ...scl({ x: 1.0, y: 1.0 }, { x: 1.05, y: 0.96 }),
        cameraPan: { x: dir * 1.5, y: -1.0 },
        strikeStep: 6,
        strikeAlpha: 1.0,
        phaseId: "strength-recovery",
        phaseName: "10. 좌하단 타격 소멸 & 주황링 페이드 (80ms)",
      },

      // 11. [순차 서서히 소멸 3단계]: 3타 3번째 소멸 + 4타(중앙) 마지막 잔향 (75ms)
      {
        ...baseFrame,
        delay: 75,
        moveStep: 4,
        ...pos(
          { x: casterBase.x + dir * 1, y: casterBase.y },
          { x: targetBase.x + dir * 1, y: targetBase.y }
        ),
        ...scl({ x: 1.0, y: 1.0 }, { x: 1.02, y: 0.98 }),
        cameraPan: { x: 0, y: 0 },
        strikeStep: 7,
        strikeAlpha: 1.0,
        phaseId: "strength-recovery",
        phaseName: "11. 우하단 타격 소멸 & 피니시 잔향 (75ms)",
      },

      // ----------------------------------------------------------------------
      // Phase 4: 완전 복귀 (Frame 12)
      // ----------------------------------------------------------------------
      // 12. [기본 스탠스 복귀]: 완전한 원위치 복귀, 모든 버스트 완전 소멸 (75ms)
      {
        ...baseFrame,
        delay: 75,
        moveStep: 4,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pRot: 0,
        eRot: 0,
        cameraPan: { x: 0, y: 0 },
        showEffect: false,
        strikeStep: 0,
        strikeAlpha: 0,
        phaseId: "strength-recovery",
        phaseName: "12. 기본 스탠스 복귀 (75ms)",
      },
    ];
  },
};

