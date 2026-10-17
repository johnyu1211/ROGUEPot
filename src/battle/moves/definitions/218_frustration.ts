// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawFrustrationEffect } from "../../../renderers/moves/gen1/move217_220.js";

/**
 * 218: 화풀이 (Frustration / やつあたり) - 노말 타입 물리 공격기
 *
 * 위력: 친밀도 반비례 (최대 102) / 명중: 100 / PP: 20 / 접촉 판정: O
 * 설명: 불만을 풀기 위해 전력으로 상대를 공격한다. 친밀하지 않을수록 위력이 올라간다.
 *
 * [유저 지정 연출 시퀀스]:
 * 1. [시전포켓몬이 붉게 물듦]: 뽐내기의 대상포켓몬 고증 ➔ 선명한 RGBA 진홍빛 분노 틴트
 * 2. [앞뒤로 움직이면서 각도를 해당방향으로 각도기울기]:
 *    - 40~50ms 간격의 촘촘한 고밀도 프레임으로 부드럽게 앞뒤로 가속/감속 왕복
 *    - 뒤로 젖히며 후퇴 ➔ 앞으로 쿵! ➔ 뒤로 반동 ➔ 앞으로 쿵쿵! ➔ 타격 쇄도
 * 3. [타격 3개 (Z축 최상단 레이어)]:
 *    - 타격 이펙트 및 점 파티클은 은혜갚기에서 가져오되 글로우 빨간색
 *    - 타격 3개는 큰 점파티클:
 *      * 1타: 좌상단 타격 직격 & 큰 붉은 발광 점 파티클 + 작은 붉은 점 파티클 방출 & 피격자 넉백
 *      * 2타: 우하단 타격 직격 & 큰 붉은 발광 점 파티클 + 작은 붉은 점 파티클 방출 & 피격자 넉백
 *      * 3타: 정중앙 결정타 직격 & 가장 큰 붉은 발광 점 파티클 + 사방 360도 폭발적 방출 & 강한 넉백
 * 4. [복귀 및 정돈]: 붉은 기운 페이드아웃 및 원위치 안정화 복귀
 */
export const frustrationMove: BattleMoveAnimation = {
  num: 218,
  key: "frustration",
  nameKo: "화풀이",
  nameEn: "Frustration",
  type: "normal",
  category: "physical",
  camera: {
    type: "caster_to_target",
    zoom: 1.35,
    focalRatio: 1.0,
    delayUntilStep: 2, // Step 1: 시전자 앞뒤 분노 모션, Step 2부터 적 포커싱 & 3연타
    inlineGlideInFrames: 2,
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawFrustrationEffect(targetCtx, frame, drawCtx);
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

    // 시전자와 피격자의 위치 오프셋을 한 객체로 동시에 적용 (서로 덮어쓰기 방지)
    const posOff = (
      casterX: number = 0,
      casterY: number = 0,
      targetKnockbackX: number = 0,
      targetKnockbackY: number = 0
    ) => ({
      pOffset: isP ? { x: casterX, y: casterY } : { x: targetKnockbackX, y: targetKnockbackY },
      eOffset: isP ? { x: targetKnockbackX, y: targetKnockbackY } : { x: -casterX, y: -casterY },
    });

    // 시전자 회전 (rot > 0: 앞쪽으로 숙임, rot < 0: 뒤쪽으로 젖힘)
    const cRot = (rot: number) => ({
      pRot: isP ? rot : undefined,
      eRot: !isP ? -rot : undefined,
    });

    // 시전자 스케일
    const cScale = (sx: number, sy: number) => ({
      pScale: isP ? { x: sx, y: sy } : undefined,
      eScale: !isP ? { x: sx, y: sy } : undefined,
    });

    // 피격자 스케일
    const tScale = (sx: number, sy: number) => ({
      pScale: !isP ? { x: sx, y: sy } : undefined,
      eScale: isP ? { x: sx, y: sy } : undefined,
    });

    // [유저 지시 엄수]: 시전포켓몬 순수 붉은색 염색 헬퍼 (뽐내기 207_swagger 고증 RGBA 방식)
    const casterRedHelper = (lvl: number) => {
      const active = lvl > 0.01;
      const alpha = Math.max(0, Math.min(0.85, lvl * 0.85));
      const color = active ? `rgba(220, 20, 40, ${alpha.toFixed(2)})` : undefined;
      return {
        pTintColor: isP ? color : undefined,
        eTintColor: !isP ? color : undefined,
        targetRedTint: false,
        casterRedTint: false,
        casterRedLevel: 0,
        pRedTint: false,
        eRedTint: false,
      };
    };

    // 빗맞았을 때 (Miss 처리)
    if (!isHit) {
      return [
        { ...baseFrame, delay: 65, ...posOff(-7, 2), ...cRot(-0.14), ...cScale(1.05, 0.95), ...casterRedHelper(0.35), showEffect: false, moveStep: 1, phaseId: "frust-miss-1", phaseName: "#1. 시전자 분노 시동" },
        { ...baseFrame, delay: 65, ...posOff(+14, -2), ...cRot(+0.22), ...cScale(0.95, 1.05), ...casterRedHelper(0.65), showEffect: false, moveStep: 1, phaseId: "frust-miss-2", phaseName: "#1. 시전자 앞쪽 쿵" },
        { ...baseFrame, delay: 60, ...posOff(-12, 3), ...cRot(-0.18), ...cScale(1.08, 0.92), ...casterRedHelper(0.85), showEffect: false, moveStep: 1, phaseId: "frust-miss-3", phaseName: "#1. 시전자 뒤쪽 반동" },
        { ...baseFrame, delay: 70, ...posOff(+22, -3), ...cRot(+0.30), ...cScale(0.92, 1.08), ...casterRedHelper(1.0), showEffect: false, moveStep: 1, phaseId: "frust-miss-4", phaseName: "#1. 시전자 앞쪽 쿵쿵" },
        // 상대방 회피
        { ...baseFrame, delay: 80, ...posOff(+26, -4, isP ? -18 : 18, isP ? 4 : -4), ...cRot(+0.32), ...casterRedHelper(0.90), showEffect: false, moveStep: 2, phaseId: "frust-miss-dodge", phaseName: "#2. 빗맞음 (상대방 회피)" },
        // 붉은기 가라앉으며 복귀
        { ...baseFrame, delay: 65, ...posOff(+6, 0), ...cRot(+0.06), ...cScale(1.0, 1.0), ...casterRedHelper(0.35), showEffect: false, moveStep: 3, phaseId: "frust-miss-fading", phaseName: "#3. 분노 가라앉음" },
        { ...baseFrame, delay: 75, ...posOff(0, 0), ...cRot(0), ...cScale(1.0, 1.0), ...casterRedHelper(0.0), showEffect: false, moveStep: 3, phaseId: "frust-miss-finish", phaseName: "#3. 원위치 복귀" },
      ];
    }

    return [
      // ======================================================================
      // Phase 1. 시전포켓몬 분노 고조 (앞뒤 움직임 + 각도 기울기 + 붉게 물듦) (Step 1)
      // [유저 피드백 반영]: 과하게 많은 프레임 없이, 딱 적당하고 탄력적인 6프레임 시퀀스
      // ======================================================================
      // #1. 1차 뒤로 젖히며 후퇴: 몸을 뒤로 젖히며 분노 시동 (붉은기 35%)
      {
        ...baseFrame,
        delay: 65,
        ...posOff(-7, 2),
        ...cRot(-0.14),
        ...cScale(1.05, 0.95),
        ...casterRedHelper(0.35),
        showEffect: false,
        moveStep: 1,
        phaseId: "frustration-rage-back-1",
        phaseName: "#1. 시전자 뒤쪽 젖힘 & 붉어짐 시작 (35%)",
      },
      // #2. 1차 앞으로 쿵!: 지면을 박차고 앞쪽으로 돌진하며 각도 기울기 (쿵!) (붉은기 65%)
      {
        ...baseFrame,
        delay: 65,
        ...posOff(+14, -2),
        ...cRot(+0.22),
        ...cScale(0.95, 1.05),
        ...casterRedHelper(0.65),
        showEffect: false,
        moveStep: 1,
        phaseId: "frustration-rage-front-1",
        phaseName: "#1. 시전자 앞쪽 쿵 & 앞쪽 기울기 (65%)",
      },
      // #3. 2차 뒤로 반동: 강한 반동으로 뒤로 물러서며 뒤쪽으로 젖힘 (붉은기 85%)
      {
        ...baseFrame,
        delay: 60,
        ...posOff(-12, 3),
        ...cRot(-0.18),
        ...cScale(1.08, 0.92),
        ...casterRedHelper(0.85),
        showEffect: false,
        moveStep: 1,
        phaseId: "frustration-rage-back-2",
        phaseName: "#1. 시전자 뒤쪽 반동 & 붉어짐 심화 (85%)",
      },
      // #4. 2차 앞으로 쿵쿵!: 더 거칠게 앞으로 쇄도하며 각도 깊게 기울기 (쿵쿵!) (붉은기 100%)
      {
        ...baseFrame,
        delay: 70,
        ...posOff(+22, -3),
        ...cRot(+0.30),
        ...cScale(0.92, 1.08),
        ...casterRedHelper(1.0),
        showEffect: false,
        moveStep: 1,
        phaseId: "frustration-rage-front-2",
        phaseName: "#1. 시전자 앞쪽 쿵쿵 & 붉어짐 피크 (100%)",
      },
      // #5. 3차 뒤로 반동 & 최종 힘 장전: 뒤로 당기며 도약 압축
      {
        ...baseFrame,
        delay: 60,
        ...posOff(-9, 2),
        ...cRot(-0.14),
        ...cScale(1.06, 0.94),
        ...casterRedHelper(1.0),
        showEffect: false,
        moveStep: 1,
        phaseId: "frustration-rage-prep",
        phaseName: "#1. 시전자 뒤쪽 힘 장전 & 도약 압축",
      },
      // #6. 3차 앞으로 타격 쇄도!: 강하게 앞쪽으로 전진하며 각도 기울임 + 타격 시작!
      {
        ...baseFrame,
        delay: 55,
        ...posOff(+18, -3),
        ...cRot(+0.26),
        ...cScale(0.94, 1.06),
        ...casterRedHelper(1.0),
        showEffect: false,
        moveStep: 1,
        phaseId: "frustration-rage-charge",
        phaseName: "#1. 시전자 타격 쇄도 발진",
      },

      // ======================================================================
      // Phase 2. 타격 3개 (Z축 최상단 레이어 확고 렌더링 & 피격자 넉백) (Step 2)
      // ======================================================================

      // ----------------------------------------------------------------------
      // [타격 1]: 좌상단 직격 & 1차 큰 점 파티클 (Z축 최상단) + 붉은 점 방출 & 피격자 우하단 넉백
      // ----------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 55,
        hitFlash: true,
        ...posOff(+16, -2, -8, 5),
        ...cRot(+0.22),
        ...tScale(1.14, 0.86),
        ...casterRedHelper(1.0),
        showEffect: true,
        moveStep: 2,
        hitIndex: 1,
        hitProgress: 0.10,
        phaseId: "frustration-hit1-impact",
        phaseName: "#2. 1타 직격 (좌상단 큰 점 파티클 작렬 & 넉백)",
      },
      {
        ...baseFrame,
        delay: 55,
        ...posOff(+14, -2, +6, -3),
        ...cRot(+0.18),
        ...tScale(1.06, 0.94),
        ...casterRedHelper(1.0),
        showEffect: true,
        moveStep: 2,
        hitIndex: 1,
        hitProgress: 0.45,
        phaseId: "frustration-hit1-spread",
        phaseName: "#2. 1타 붉은 점 파티클 확산",
      },
      {
        ...baseFrame,
        delay: 50,
        ...posOff(+12, -1, -3, 2),
        ...cRot(+0.15),
        ...tScale(1.0, 1.0),
        ...casterRedHelper(1.0),
        showEffect: true,
        moveStep: 2,
        hitIndex: 1,
        hitProgress: 0.85,
        phaseId: "frustration-hit1-fade",
        phaseName: "#2. 1타 잔향 감쇠 & 2타 준비",
      },

      // ----------------------------------------------------------------------
      // [타격 2]: 우하단 직격 & 2차 큰 점 파티클 (Z축 최상단) + 붉은 점 방출 & 피격자 좌상단 넉백
      // ----------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 55,
        hitFlash: true,
        ...posOff(+18, -3, +10, -5),
        ...cRot(+0.24),
        ...tScale(1.16, 0.84),
        ...casterRedHelper(1.0),
        showEffect: true,
        moveStep: 2,
        hitIndex: 2,
        hitProgress: 0.10,
        phaseId: "frustration-hit2-impact",
        phaseName: "#2. 2타 직격 (우하단 큰 점 파티클 작렬 & 넉백)",
      },
      {
        ...baseFrame,
        delay: 55,
        ...posOff(+16, -2, -8, +4),
        ...cRot(+0.20),
        ...tScale(1.08, 0.92),
        ...casterRedHelper(1.0),
        showEffect: true,
        moveStep: 2,
        hitIndex: 2,
        hitProgress: 0.45,
        phaseId: "frustration-hit2-spread",
        phaseName: "#2. 2타 붉은 점 파티클 확산",
      },
      {
        ...baseFrame,
        delay: 50,
        ...posOff(+13, -1, +4, -2),
        ...cRot(+0.16),
        ...tScale(1.0, 1.0),
        ...casterRedHelper(1.0),
        showEffect: true,
        moveStep: 2,
        hitIndex: 2,
        hitProgress: 0.85,
        phaseId: "frustration-hit2-fade",
        phaseName: "#2. 2타 잔향 감쇠 & 3타 피니시 준비",
      },

      // ----------------------------------------------------------------------
      // [타격 3]: 정중앙 결정타 직격 & 가장 큰 점 파티클 (Z축 최상단) + 8방향 폭발 방출 & 피격자 강한 넉백
      // ----------------------------------------------------------------------
      {
        ...baseFrame,
        delay: 60,
        hitFlash: true,
        ...posOff(+22, -3, -16, +7),
        ...cRot(+0.30),
        ...tScale(1.22, 0.78),
        ...casterRedHelper(1.0),
        showEffect: true,
        moveStep: 2,
        hitIndex: 3,
        hitProgress: 0.10,
        phaseId: "frustration-hit3-impact",
        phaseName: "#2. 3타 피니시 직격 (정중앙 최대 큰 점 파티클 작렬)",
      },
      {
        ...baseFrame,
        delay: 60,
        ...posOff(+18, -2, +12, -5),
        ...cRot(+0.24),
        ...tScale(1.12, 0.88),
        ...casterRedHelper(0.95),
        showEffect: true,
        moveStep: 2,
        hitIndex: 3,
        hitProgress: 0.40,
        phaseId: "frustration-hit3-expand",
        phaseName: "#2. 3타 붉은 점 파티클 폭발적 비산",
      },
      {
        ...baseFrame,
        delay: 65,
        ...posOff(+14, -1, -6, +2),
        ...cRot(+0.18),
        ...tScale(1.05, 0.95),
        ...casterRedHelper(0.85),
        showEffect: true,
        moveStep: 2,
        hitIndex: 3,
        hitProgress: 0.70,
        phaseId: "frustration-hit3-max-spread",
        phaseName: "#2. 3타 붉은 점 파티클 최대 확산",
      },
      {
        ...baseFrame,
        delay: 65,
        ...posOff(+10, 0, 0, 0),
        ...cRot(+0.10),
        ...tScale(1.0, 1.0),
        ...casterRedHelper(0.65),
        showEffect: true,
        moveStep: 2,
        hitIndex: 3,
        hitProgress: 0.95,
        phaseId: "frustration-hit3-dissipate",
        phaseName: "#2. 3타 파티클 소산 & 피격자 안정화",
      },

      // ======================================================================
      // Phase 3. 복귀 및 붉은 기운 페이드아웃 (Step 3)
      // ======================================================================
      {
        ...baseFrame,
        delay: 65,
        ...posOff(+4, 0, 0, 0),
        ...cRot(+0.04),
        ...cScale(1.0, 1.0),
        ...tScale(1.0, 1.0),
        ...casterRedHelper(0.35),
        showEffect: false,
        moveStep: 3,
        phaseId: "frustration-return-fading",
        phaseName: "#3. 분노 붉은기 가라앉음 (35%)",
      },
      {
        ...baseFrame,
        delay: 75,
        ...posOff(0, 0, 0, 0),
        ...cRot(0),
        ...cScale(1.0, 1.0),
        ...tScale(1.0, 1.0),
        ...casterRedHelper(0.0),
        showEffect: false,
        moveStep: 3,
        phaseId: "frustration-finish",
        phaseName: "#3. 원위치 복귀 및 분노 해소 완료",
      },
    ];
  },
};
