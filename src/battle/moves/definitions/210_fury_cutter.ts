// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawFuryCutterEffect } from "../../../renderers/moves/gen1/move209_212.js";

/**
 * 210: 연속자르기 (Fury Cutter / れんぞくぎり) - 벌레 타입 물리 기술
 *
 * 위력: 40 / 명중: 95 / PP: 20
 * 설명: 낫이나 발톱 등으로 상대를 베어 공격한다. 연속으로 맞히면 위력이 올라간다.
 *
 * [유저 지정 연출 규격]:
 * - 날카로운 연두색 칼등치기
 * - 기술 베기 전 페이드암전 페이드아웃
 *
 * [커스텀 연출 기승전결 시퀀스]:
 * 1. [발도 준비 & 페이드 암전 진입]: 시전자 웅크림 & 화면 서서히 암전 시작 (blackFadeAlpha: 0.40) & 칼자루 십자 섬광
 * 2. [기 모으기 & 완전 암전 피크]: 도약 자세 압축 & 화면 칠흑 암전 도달 (blackFadeAlpha: 0.75)
 * 3. [초고속 전방 쇄도 & 암전 페이드아웃]: 잔상을 남기며 돌진 & 암전이 빠르게 걷힘 (blackFadeAlpha: 0.35)
 * 4. [날카로운 연두색 참격호 전개]: 암전 완전 해제 (blackFadeAlpha: 0.0) & 상대 전면에 날카로운 연두색 초승달 칼날 전개
 * 5. ['챙!!' 직격 타격 & 십자 메탈릭 글린트]: 날카로운 십자 크로스 글린트 작렬 & 피격자 넉백 압축 (hitFlash: true)
 * 6. [연두색 충격파 펄스 & 스파크 비산]: 참격 충격파 호 확산 & 라임/연두 메탈릭 스파크 비산
 * 7. [참격 잔향 소산 & 피격자 탄성 반동]: 유려한 참격 잔향이 부드럽게 기화 & 피격자 탄성 복귀
 * 8. [납도 & 피격자 안정화]: 칼을 거두며 피격자 전장 안정화
 * 9. [원위치 복귀]: 시전자 착지 및 원위치 복귀 완료
 */
export const furyCutterMove: BattleMoveAnimation = {
  num: 210,
  key: "fury-cutter",
  nameKo: "연속자르기",
  nameEn: "Fury Cutter",
  type: "bug",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawFuryCutterEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      cameraZoom: 1.35,
    };

    // 시전자 오프셋 & 스케일 헬퍼 (혼선 방지 완전 격리)
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
        // 1a. 발도 시동 & 부드러운 암전 페이드인 1단계
        {
          ...baseFrame,
          delay: 60,
          ...cOff(-4, 1),
          ...cScale(1.04, 0.96),
          blackFadeAlpha: 0.18,
          showEffect: true,
          moveStep: 1,
          effectProgress: 0.20,
          phaseId: "fury-cutter-miss-draw-1a",
          phaseName: "1a. 발도 시동 & 암전 서서히 시작 (18%)",
        },
        // 1b. 발도 준비 & 암전 페이드인 2단계
        {
          ...baseFrame,
          delay: 65,
          ...cOff(-8, 3),
          ...cScale(1.08, 0.92),
          blackFadeAlpha: 0.42,
          showEffect: true,
          moveStep: 1,
          effectProgress: 0.50,
          phaseId: "fury-cutter-miss-draw-1b",
          phaseName: "1b. 발도 준비 & 암전 심화 (42%)",
        },
        // 2a. 도약 준비 & 암전 페이드인 3단계
        {
          ...baseFrame,
          delay: 60,
          ...cOff(-12, 4),
          ...cScale(1.12, 0.88),
          blackFadeAlpha: 0.65,
          showEffect: true,
          moveStep: 1,
          effectProgress: 0.75,
          phaseId: "fury-cutter-miss-draw-2a",
          phaseName: "2a. 도약 준비 & 짙은 암전 (65%)",
        },
        // 2b. 도약 가속 & 완전 암전 피크
        {
          ...baseFrame,
          delay: 65,
          ...cOff(-15, 5),
          ...cScale(1.15, 0.85),
          blackFadeAlpha: 0.78,
          showEffect: true,
          moveStep: 1,
          effectProgress: 0.95,
          phaseId: "fury-cutter-miss-draw-2b",
          phaseName: "2b. 도약 추진 & 암전 피크 (78%)",
        },
        // 3a. 전방 쇄도 발진 & 암전 페이드아웃 1단계
        {
          ...baseFrame,
          delay: 45,
          ...cOff(10, -4),
          ...cScale(0.94, 1.06),
          blackFadeAlpha: 0.52,
          showEffect: false,
          moveStep: 2,
          effectProgress: 0.20,
          phaseId: "fury-cutter-miss-rush-1",
          phaseName: "3a. 전방 쇄도 & 암전 감쇄 (52%)",
        },
        // 3b. 고속 전방 쇄도 & 암전 페이드아웃 2단계
        {
          ...baseFrame,
          delay: 45,
          ...cOff(24, -9),
          ...cScale(0.91, 1.09),
          blackFadeAlpha: 0.26,
          showEffect: false,
          moveStep: 2,
          effectProgress: 0.45,
          phaseId: "fury-cutter-miss-rush-2",
          phaseName: "3b. 고속 쇄도 & 밝아짐 (26%)",
        },
        // 4a. 상대 백스텝 회피 & 헛스윙 참격 출현 직전 (암전 잔여 8%)
        {
          ...baseFrame,
          delay: 45,
          ...cOff(30, -11),
          ...defOff(isP ? 12 : -12, isP ? -3 : 3),
          blackFadeAlpha: 0.08,
          showEffect: true,
          moveStep: 2,
          effectProgress: 0.65,
          phaseId: "fury-cutter-miss-dodge-1",
          phaseName: "4a. 상대 백스텝 회피 & 암전 소산 (8%)",
        },
        // 4b. 상대 백스텝 회피 & 헛스윙 참격 출현 (완전 해제 0%)
        {
          ...baseFrame,
          delay: 55,
          ...cOff(34, -12),
          ...defOff(isP ? 16 : -16, isP ? -4 : 4),
          blackFadeAlpha: 0.0,
          showEffect: true,
          moveStep: 2,
          effectProgress: 0.85,
          phaseId: "fury-cutter-miss-dodge-2",
          phaseName: "4b. 헛스윙 참격 전개 (암전 완전 해제)",
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
          phaseId: "fury-cutter-miss-fade",
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
          phaseId: "fury-cutter-miss-stumble",
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
          phaseId: "fury-cutter-miss-finish",
          phaseName: "7. 원위치 복귀",
        },
      ];
    }

    // =========================================================================
    // 2. Hit (isHit === true) 시퀀스 (부드러운 다단계 페이드암전 ➔ 페이드아웃)
    // =========================================================================
    return [
      // 1a. 발도 시동: 시전자 자세 낮추기 & 부드러운 페이드 암전 1단계 (18%)
      {
        ...baseFrame,
        delay: 60,
        ...cOff(-4, 1),
        ...cScale(1.04, 0.96),
        blackFadeAlpha: 0.18,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.20,
        phaseId: "fury-cutter-draw-1a",
        phaseName: "1a. 발도 시동 & 암전 서서히 시작 (18%)",
      },
      // 1b. 발도 준비: 시전자 낮게 웅크림 (Squash) & 암전 심화 (42%) & 칼자루 십자 섬광
      {
        ...baseFrame,
        delay: 65,
        ...cOff(-8, 3),
        ...cScale(1.08, 0.92),
        blackFadeAlpha: 0.42,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.50,
        phaseId: "fury-cutter-draw-1b",
        phaseName: "1b. 발도 준비 & 암전 심화 (42%)",
      },
      // 2a. 기 모으기 압축: 스프링 자세 압축 & 짙은 암전 (65%)
      {
        ...baseFrame,
        delay: 60,
        ...cOff(-12, 4),
        ...cScale(1.12, 0.88),
        blackFadeAlpha: 0.65,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.75,
        phaseId: "fury-cutter-draw-2a",
        phaseName: "2a. 기 모으기 압축 & 짙은 암전 (65%)",
      },
      // 2b. 도약 가속: 추진력 폭발 & 완전 암전 피크 (78% 암전)
      {
        ...baseFrame,
        delay: 65,
        ...cOff(-15, 5),
        ...cScale(1.15, 0.85),
        blackFadeAlpha: 0.78,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.95,
        phaseId: "fury-cutter-draw-2b",
        phaseName: "2b. 도약 가속 & 완전 암전 피크 (78%)",
      },
      // 3a. 순간 전방 쇄도 발진: 고속 돌진 & 암전 서서히 페이드아웃 1단계 (52%)
      {
        ...baseFrame,
        delay: 45,
        ...cOff(10, -4),
        ...cScale(0.94, 1.06),
        blackFadeAlpha: 0.52,
        showEffect: false,
        moveStep: 2,
        effectProgress: 0.20,
        casterAfterimages: [
          { dx: -8, dy: 3, alpha: 0.35 },
        ],
        phaseId: "fury-cutter-rush-1",
        phaseName: "3a. 순간 전방 쇄도 & 암전 감쇄 (52%)",
      },
      // 3b. 고속 쇄도 관통: 고속 잔상 & 암전 빠르게 페이드아웃 2단계 (26%)
      {
        ...baseFrame,
        delay: 45,
        ...cOff(24, -9),
        ...cScale(0.90, 1.10),
        blackFadeAlpha: 0.26,
        showEffect: false,
        moveStep: 2,
        effectProgress: 0.50,
        casterAfterimages: [
          { dx: -14, dy: 5, alpha: 0.45 },
        ],
        phaseId: "fury-cutter-rush-2",
        phaseName: "3b. 고속 쇄도 & 시야 밝아짐 (26%)",
      },
      // 4a. 참격 진입 직전: 암전 미세 잔여 소산 (8%) & 칼날 사출 개시
      {
        ...baseFrame,
        delay: 40,
        ...cOff(32, -12),
        ...cScale(0.93, 1.07),
        blackFadeAlpha: 0.08,
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.75,
        phaseId: "fury-cutter-blade-entry",
        phaseName: "4a. 참격 진입 직전 & 미세 잔여 소산 (8%)",
      },
      // 4b. 날카로운 연두색 초승달 참격호 전개 & 암전 완전 해제 (0%)
      {
        ...baseFrame,
        delay: 45,
        ...cOff(38, -14),
        ...cScale(0.96, 1.04),
        blackFadeAlpha: 0.0,
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.95,
        phaseId: "fury-cutter-blade-arc",
        phaseName: "4b. 날카로운 연두색 참격호 전개 (암전 완전 해제)",
      },
      // 5. '챙!!' 날카로운 연두색 참격 직격 타격 & 십자 메탈릭 글린트 & 피격자 넉백
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
        phaseId: "fury-cutter-impact",
        phaseName: "5. '챙!!' 연두색 참격 직격 타격 & 십자 글린트",
      },
      // 6. 연두색 충격파 펄스 & 비산하는 스파크
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
        phaseId: "fury-cutter-shockwave",
        phaseName: "6. 연두색 충격파 펄스 & 스파크 비산",
      },
      // 7. 참격 잔향 소산 & 피격자 탄성 반동
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
        phaseId: "fury-cutter-rebound",
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
        phaseId: "fury-cutter-sheathe",
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
        phaseId: "fury-cutter-finish",
        phaseName: "9. 원위치 복귀",
      },
    ];
  },
};
