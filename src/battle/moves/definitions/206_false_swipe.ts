// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawFalseSwipeEffect } from "../../../renderers/moves/gen1/move205_208.js";

/**
 * 206: 칼등치기 (False Swipe / みねうち) - 노말 타입 물리 기술
 *
 * 위력: 40 / 명중: 100 / PP: 40
 * 설명: 상대의 HP가 반드시 1만큼 남도록 칼등으로 조절하여 공격한다.
 *
 * [커스텀 연출 기승전결 시퀀스]:
 * 1. [발도 준비 & 칼자루 십자 섬광]: 시전자 웅크림 (Squash) & 칼자루에 반짝이는 은청색 메탈릭 십자 섬광 (✦)
 * 2. [기 모으기 & 도약 가속]: 스프링처럼 자세 압축 & 도약 추진
 * 3. [초고속 전방 쇄도]: 잔상을 남기며 상대 전면으로 찰나의 순간 돌진
 * 4. [은빛-청색 카타나 칼등 참격호 전개]: 맑고 차가운 강철 실버-블루 칼날 궤적이 상대 전면에 유려하게 호를 그리며 전개
 * 5. ['챙!!' 칼등 직격 타격 & 십자 메탈릭 섬광]: 날카로운 십자 크로스 글린트 작렬 & 피격자 넉백 압축
 * 6. [둔탁한 칼등 충격파 펄스 & 스파크 비산]: 비살상 타격의 묵직한 칼등 충격파 호 확산 & 푸른 메탈릭 스파크 비산
 * 7. [참격 잔향 소산 & 피격자 탄성 반동]: 유려한 참격 잔향이 부드럽게 기화 & 피격자 탄성 복귀 (HP 1로 안전 생존)
 * 8. [납도 & 피격자 안정화]: 칼을 거두며 피격자 전장 안정화
 * 9. [원위치 복귀]: 시전자 착지 및 원위치 복귀 완료
 */
export const falseSwipeMove: BattleMoveAnimation = {
  num: 206,
  key: "false-swipe",
  nameKo: "칼등치기",
  nameEn: "False Swipe",
  type: "normal",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawFalseSwipeEffect(targetCtx, frame, drawCtx);
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

    // 시전자 오프셋 & 스케일 헬퍼
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const cScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    // 피격자(수비자) 오프셋 & 스케일 헬퍼
    const defOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const defScale = (x: number, y: number) => ({
      pScale: !isP ? { x, y } : undefined,
      eScale: isP ? { x, y } : undefined,
    });

    // =========================================================================
    // 1. Miss (!isHit) 시퀀스
    // =========================================================================
    if (!isHit) {
      return [
        // 1. 발도 준비
        {
          ...baseFrame,
          delay: 80,
          ...cOff(-8, 3),
          ...cScale(1.08, 0.92),
          showEffect: true,
          moveStep: 1,
          effectProgress: 0.40,
          phaseId: "false-swipe-miss-draw-1",
          phaseName: "1. 발도 준비 & 섬광",
        },
        // 2. 도약 추진
        {
          ...baseFrame,
          delay: 70,
          ...cOff(-14, 5),
          ...cScale(1.14, 0.86),
          showEffect: true,
          moveStep: 1,
          effectProgress: 0.85,
          phaseId: "false-swipe-miss-draw-2",
          phaseName: "2. 도약 추진",
        },
        // 3. 전방 쇄도
        {
          ...baseFrame,
          delay: 50,
          ...cOff(22, -8),
          ...cScale(0.92, 1.08),
          showEffect: false,
          moveStep: 2,
          effectProgress: 0.25,
          phaseId: "false-swipe-miss-rush",
          phaseName: "3. 전방 쇄도",
        },
        // 4. 상대 백스텝 회피 & 헛스윙 칼등 참격 출현
        {
          ...baseFrame,
          delay: 60,
          ...cOff(32, -11),
          ...defOff(isP ? 16 : -16, isP ? -4 : 4),
          showEffect: true,
          moveStep: 2,
          effectProgress: 0.70,
          phaseId: "false-swipe-miss-dodge",
          phaseName: "4. 상대 백스텝 회피 & 헛스윙 출현",
        },
        // 5. 참격 빗맞음 슬라이드 소멸
        {
          ...baseFrame,
          delay: 80,
          ...cOff(34, -12),
          ...defOff(isP ? 18 : -18, isP ? -5 : 5),
          showEffect: true,
          moveStep: 4,
          effectProgress: 0.75,
          phaseId: "false-swipe-miss-fade",
          phaseName: "5. 참격 빗맞음 슬라이드 소멸",
        },
        // 6. 헛스윙 후 멈칫
        {
          ...baseFrame,
          delay: 75,
          ...cOff(14, -5),
          ...defOff(0, 0),
          showEffect: false,
          moveStep: 5,
          phaseId: "false-swipe-miss-stumble",
          phaseName: "6. 헛스윙 후 멈칫",
        },
        // 7. 원위치 복귀
        {
          ...baseFrame,
          delay: 70,
          ...cOff(0, 0),
          ...defOff(0, 0),
          showEffect: false,
          moveStep: 5,
          phaseId: "false-swipe-miss-finish",
          phaseName: "7. 원위치 복귀",
        },
      ];
    }

    // =========================================================================
    // 2. Hit (isHit === true) 시퀀스 (9단계 정밀 연출)
    // =========================================================================
    return [
      // 1. 발도 준비: 시전자 낮게 웅크림 (Squash) & 칼자루 십자 섬광
      {
        ...baseFrame,
        delay: 80,
        ...cOff(-8, 3),
        ...cScale(1.08, 0.92),
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.35,
        phaseId: "false-swipe-draw-1",
        phaseName: "1. 발도 준비 & 칼자루 십자 섬광",
      },
      // 2. 기 모으기 & 도약 가속: 스프링 자세 압축
      {
        ...baseFrame,
        delay: 70,
        ...cOff(-14, 5),
        ...cScale(1.14, 0.86),
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.85,
        phaseId: "false-swipe-draw-2",
        phaseName: "2. 기 모으기 & 도약 가속",
      },
      // 3. 순간 전방 쇄도: 시전자 고속 돌진 (잔상 효과)
      {
        ...baseFrame,
        delay: 50,
        ...cOff(24, -9),
        ...cScale(0.90, 1.10),
        showEffect: false,
        moveStep: 2,
        effectProgress: 0.25,
        casterAfterimages: [
          { dx: -12, dy: 4, alpha: 0.40 },
        ],
        phaseId: "false-swipe-rush",
        phaseName: "3. 순간 전방 쇄도 (잔상)",
      },
      // 4. 은빛-청색 카타나 칼등 참격호 전개
      {
        ...baseFrame,
        delay: 50,
        ...cOff(36, -13),
        ...cScale(0.95, 1.05),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.90,
        phaseId: "false-swipe-blade-arc",
        phaseName: "4. 은빛-청색 칼등 참격호 전개",
      },
      // 5. '챙!!' 칼등 직격 타격 & 십자 메탈릭 글린트 & 피격자 넉백
      {
        ...baseFrame,
        delay: 90,
        ...cOff(40, -15),
        ...defOff(isP ? 16 : -16, isP ? -6 : 6),
        ...defScale(1.22, 0.78),
        hitFlash: true,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.35,
        phaseId: "false-swipe-impact",
        phaseName: "5. '챙!!' 칼등 직격 타격 & 십자 메탈릭 글린트",
      },
      // 6. 둔탁한 칼등 충격파 펄스 & 은청색 스파크 비산
      {
        ...baseFrame,
        delay: 85,
        ...cOff(32, -11),
        ...defOff(isP ? 18 : -18, isP ? -7 : 7),
        ...defScale(1.15, 0.85),
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.85,
        phaseId: "false-swipe-shockwave",
        phaseName: "6. 칼등 충격파 펄스 & 스파크 비산",
      },
      // 7. 참격 잔향 소산 & 피격자 탄성 반동 (HP 1 생존 확인)
      {
        ...baseFrame,
        delay: 80,
        ...cOff(20, -7),
        ...defOff(isP ? -4 : 4, isP ? 2 : -2),
        ...defScale(0.95, 1.05),
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.45,
        phaseId: "false-swipe-rebound",
        phaseName: "7. 참격 잔향 소산 & 피격자 반동",
      },
      // 8. 납도 완료 & 피격자 안정화 복귀
      {
        ...baseFrame,
        delay: 75,
        ...cOff(10, -3),
        ...defOff(0, 0),
        ...defScale(1.0, 1.0),
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.90,
        phaseId: "false-swipe-sheathe",
        phaseName: "8. 납도 완료 & 피격자 안정화",
      },
      // 9. 원위치 복귀 완료
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...defOff(0, 0),
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showEffect: false,
        moveStep: 5,
        phaseId: "false-swipe-finish",
        phaseName: "9. 원위치 복귀",
      },
    ];
  },
};
