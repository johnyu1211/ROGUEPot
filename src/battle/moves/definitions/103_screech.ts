// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawScreechEffect } from "../../../renderers/moves/gen1/move101_104.js";

/**
 * 103: 싫은소리 (Screech) - 노말 타입 변화 기술 (방어 2랭크 하락)
 *
 * 연출 구성:
 * 1. 시전자 포효 준비: 시전자가 살짝 뒤로 당기며 입가에 고주파 음파 링 태동
 * 2. 1차 톱니형 굉음 음파 사출: 시전자가 앞으로 기울며 날카로운 비명 발성, 1차 지그재그 음파 사출
 * 3. 연쇄 불협화음 음파 쇄도: 2차/3차 톱니형 음파가 연쇄적으로 적 방향으로 가속 비산
 * 4. 대상 직격 & 귀 찢는 고주파 공명: 음파가 적을 강타, 적 1차 좌측 격렬한 떨림 & 칠판 긁는 노이즈 스파이크 폭발
 * 5. 극심한 불협화음 진동 & 방어력 급하락 개시: 적 2차 반대 방향 격렬한 진동, 방어력 급하락 화살표 하강 개시
 * 6. 방어력 2랭크 급하락 연쇄 파동: 적 진동 감쇠 & 방어력 급하락 화살표 몸체 관통
 * 7. 방어력 2랭크 하락 완료: 적 미세 잔여 진동 & 방어력 하락 파티클 발밑 완료
 * 8. 안정 정위치 복귀: 시전자와 적 모두 안정적 원래 자세 복귀
 */
export const screechMove: BattleMoveAnimation = {
  num: 103,
  key: "screech",
  nameKo: "싫은소리",
  nameEn: "Screech",
  type: "normal",
  category: "status",
  camera: { type: "none" }, // 전장 전체 뷰 (발성 ➔ 음파 쇄도 ➔ 적 격렬 떨림 ➔ 방어 하락 전체 노출)
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawScreechEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.0,
      pRot: 0,
      eRot: 0,
      hitFlash: false,
      pScale: { x: 1.0, y: 1.0 },
      eScale: { x: 1.0, y: 1.0 },
      hidePlayer: false,
      hideEnemy: false,
    };

    // 공격자 오프셋 / 대상 오프셋 분기 헬퍼
    const actorOffset = (ax: number, ay: number) => (isP ? { pOffset: { x: ax, y: ay } } : { eOffset: { x: -ax, y: -ay } });
    const targetOffset = (tx: number, ty: number) => (isP ? { eOffset: { x: tx, y: ty } } : { pOffset: { x: -tx, y: -ty } });

    return [
      // #1. 시전자 포효 준비 (뒤로 당김 & 1차 소형 3D 자글자글한 링 태동)
      {
        ...baseFrame,
        delay: 105,
        ...actorOffset(-4, 1),
        ...targetOffset(0, 0),
        pScale: isP ? { x: 0.96, y: 1.04 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 0.96, y: 1.04 } : { x: 1.0, y: 1.0 },
        showEffect: true,
        moveStep: 1,
        screechRings: [{ t: 0.12, r: 24, alpha: 0.65, tooth: 4, color: "#FEF08A", rotAngle: 0 }],
        phaseId: "screech-windup",
        phaseName: "#1. 시전자 포효 준비 (3D 자글자글한 링 태동)",
      },
      // #2. 3단 3D 굉음 링 전방 사출 1 (발사 순간)
      {
        ...baseFrame,
        delay: 55,
        ...actorOffset(6, -3),
        ...targetOffset(0, 0),
        pScale: isP ? { x: 1.06, y: 0.94 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 1.06, y: 0.94 } : { x: 1.0, y: 1.0 },
        showEffect: true,
        moveStep: 2,
        screechRings: [
          { t: 0.16, r: 24, alpha: 0.58, tooth: 5.5, color: "#FEF08A", rotAngle: 0.00 },
          { t: 0.28, r: 42, alpha: 0.72, tooth: 6.5, color: "#FDE047", rotAngle: 0.00 },
          { t: 0.40, r: 62, alpha: 0.85, tooth: 7.5, color: "#FACC15", rotAngle: 0.00 },
        ],
        phaseId: "screech-ring-advance-1",
        phaseName: "#2. 3단 3D 굉음 링 전방 사출 1",
      },
      // #3. 3단 3D 굉음 링 전방 사출 2
      {
        ...baseFrame,
        delay: 55,
        ...actorOffset(5, -2),
        ...targetOffset(0, 0),
        pScale: isP ? { x: 1.04, y: 0.96 } : { x: 1.0, y: 1.0 },
        eScale: !isP ? { x: 1.04, y: 0.96 } : { x: 1.0, y: 1.0 },
        showEffect: true,
        moveStep: 3,
        screechRings: [
          { t: 0.26, r: 34, alpha: 0.64, tooth: 6.0, color: "#FEF08A", rotAngle: -0.70 },
          { t: 0.39, r: 54, alpha: 0.78, tooth: 7.0, color: "#FDE047", rotAngle: 0.70 },
          { t: 0.52, r: 76, alpha: 0.90, tooth: 8.0, color: "#FACC15", rotAngle: -0.70 },
        ],
        phaseId: "screech-ring-advance-2",
        phaseName: "#3. 3단 3D 굉음 링 전방 사출 2",
      },
      // #4. 3단 3D 굉음 링 전방 사출 3 (중간 지점 전진)
      {
        ...baseFrame,
        delay: 55,
        ...actorOffset(4, -2),
        ...targetOffset(0, 0),
        showEffect: true,
        moveStep: 4,
        screechRings: [
          { t: 0.37, r: 45, alpha: 0.70, tooth: 6.5, color: "#FEF08A", rotAngle: -1.40 },
          { t: 0.51, r: 68, alpha: 0.83, tooth: 7.5, color: "#FDE047", rotAngle: 1.40 },
          { t: 0.65, r: 92, alpha: 0.93, tooth: 8.5, color: "#FACC15", rotAngle: -1.40 },
        ],
        phaseId: "screech-ring-advance-3",
        phaseName: "#4. 3단 3D 굉음 링 전방 사출 3",
      },
      // #5. 3단 3D 굉음 링 전방 사출 4 (가속 쇄도)
      {
        ...baseFrame,
        delay: 55,
        ...actorOffset(3, -1),
        ...targetOffset(0, 0),
        showEffect: true,
        moveStep: 5,
        screechRings: [
          { t: 0.49, r: 58, alpha: 0.75, tooth: 7.0, color: "#FEF08A", rotAngle: -2.10 },
          { t: 0.64, r: 84, alpha: 0.88, tooth: 8.0, color: "#FDE047", rotAngle: 2.10 },
          { t: 0.78, r: 108, alpha: 0.96, tooth: 9.0, color: "#FACC15", rotAngle: -2.10 },
        ],
        phaseId: "screech-ring-advance-4",
        phaseName: "#5. 3단 3D 굉음 링 전방 사출 4",
      },
      // #6. 3단 3D 굉음 링 전방 사출 5 (적 목전 육박)
      {
        ...baseFrame,
        delay: 55,
        ...actorOffset(2, -1),
        ...targetOffset(0, 0),
        showEffect: true,
        moveStep: 6,
        screechRings: [
          { t: 0.62, r: 72, alpha: 0.80, tooth: 7.5, color: "#FEF08A", rotAngle: -2.80 },
          { t: 0.77, r: 100, alpha: 0.92, tooth: 8.5, color: "#FDE047", rotAngle: 2.80 },
          { t: 0.90, r: 124, alpha: 0.98, tooth: 9.5, color: "#FACC15", rotAngle: -2.80 },
        ],
        phaseId: "screech-ring-advance-5",
        phaseName: "#6. 3단 3D 굉음 링 전방 사출 5",
      },
      // #7. 3단 3D 굉음 링 전방 사출 6 (선두 링 대상 도달 직격)
      {
        ...baseFrame,
        delay: 55,
        ...actorOffset(1, 0),
        ...targetOffset(0, 0),
        showEffect: true,
        moveStep: 7,
        screechRings: [
          { t: 0.76, r: 88, alpha: 0.84, tooth: 8.0, color: "#FEF08A", rotAngle: -3.50 },
          { t: 0.89, r: 116, alpha: 0.94, tooth: 9.0, color: "#FDE047", rotAngle: 3.50 },
          { t: 1.00, r: 140, alpha: 0.98, tooth: 10.5, color: "#FACC15", rotAngle: -3.50 },
        ],
        phaseId: "screech-ring-advance-6",
        phaseName: "#7. 3단 3D 굉음 링 전방 사출 6 (대상 도달 직격)",
      },
      // #8. 대상 직격 & 3D 굉음 링 적 강타 & 귀 찢는 고주파 공명 (적 좌측 떨림)
      {
        ...baseFrame,
        delay: 85,
        ...actorOffset(0, 0),
        ...targetOffset(-7, 0),
        pScale: !isP ? { x: 1.08, y: 0.92 } : { x: 1.0, y: 1.0 },
        eScale: isP ? { x: 1.08, y: 0.92 } : { x: 1.0, y: 1.0 },
        showEffect: true,
        moveStep: 8,
        screechRings: [
          { t: 0.90, r: 104, alpha: 0.65, tooth: 8.5, color: "#FEF08A", rotAngle: -4.20 },
          { t: 1.04, r: 130, alpha: 0.50, tooth: 9.5, color: "#FDE047", rotAngle: 4.20 },
          { t: 1.18, r: 156, alpha: 0.35, tooth: 10.5, color: "#FACC15", rotAngle: -4.20 },
        ],
        phaseId: "screech-impact",
        phaseName: "#8. 대상 직격 & 3D 링 강타 & 고주파 공명 (적 좌측 떨림)",
      },
      // #9. 3D 굉음 링 관통 소멸 & 적 우측 떨림 & 방어력 급하락 개시
      {
        ...baseFrame,
        delay: 95,
        ...actorOffset(0, 0),
        ...targetOffset(7, 0),
        showEffect: true,
        moveStep: 9,
        screechRings: [
          { t: 1.05, r: 118, alpha: 0.30, tooth: 8.5, color: "#FEF08A", rotAngle: -4.90 },
          { t: 1.20, r: 146, alpha: 0.20, tooth: 9.5, color: "#FDE047", rotAngle: 4.90 },
          { t: 1.35, r: 172, alpha: 0.12, tooth: 10.5, color: "#FACC15", rotAngle: -4.90 },
        ],
        statProgress: 0.25,
        phaseId: "screech-debuff-start",
        phaseName: "#9. 링 관통 소멸 & 방어력 급하락 개시 (적 우측 떨림)",
      },
      // #10. 방어력 2랭크 급하락 연쇄 파동 (적 좌측 떨림 감쇠)
      {
        ...baseFrame,
        delay: 95,
        ...actorOffset(0, 0),
        ...targetOffset(-4, 0),
        showEffect: true,
        moveStep: 10,
        screechRings: [],
        statProgress: 0.60,
        phaseId: "screech-debuff-cascade",
        phaseName: "#10. 방어력 2랭크 급하락 연쇄 파동",
      },
      // #11. 방어력 2랭크 하락 완료 (적 우측 미세 잔여 진동)
      {
        ...baseFrame,
        delay: 95,
        ...actorOffset(0, 0),
        ...targetOffset(2, 0),
        showEffect: false,
        moveStep: 11,
        statProgress: 0.98,
        phaseId: "screech-debuff-finish",
        phaseName: "#11. 방어력 2랭크 하락 완료 (발밑 소멸)",
      },
      // #12. 안정 정위치 복귀
      {
        ...baseFrame,
        delay: 80,
        ...actorOffset(0, 0),
        ...targetOffset(0, 0),
        showEffect: false,
        moveStep: 12,
        phaseId: "screech-finish",
        phaseName: "#12. 안정 정위치 복귀",
      },
    ];
  },
};
