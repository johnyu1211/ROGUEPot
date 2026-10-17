// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawSteelWingEffect } from "../../../renderers/moves/gen1/move209_212.js";

/**
 * 211: 강철날개 (Steel Wing / はがねのつばさ) - 강철 타입 물리 기술
 *
 * 위력: 70 / 명중: 90 / PP: 25
 * 설명: 단단한 날개를 상대에게 부딪쳐서 공격한다. 자신의 방어가 올라갈 때가 있다 (10%).
 *
 * [커스텀 연출 기승전결 시퀀스]:
 * 1. [도약 & 강철 날개 발현]: 시전자 웅크림 후 도약 & 배후에 거대한 은백색 강철 날개 전개 (메탈릭 실버/크롬 광택 + 십자 글린트)
 * 2. [초고속 급강하 쇄도]: 강철 날개를 전방으로 모아 상대 전면으로 쾌속 급강하 (은빛 슬립스트림 스트리머 & 스피드라인)
 * 3. [양단 교차 베기 (Cross Slash) 강타]: 상대 전면에 좌우 거대한 강철 날개가 교차하며 '챙-캉!!' 대각 X자 강타
 *    - 눈부신 은백색 메탈릭 충돌 섬광 (hitFlash: true) + 4방향 대형 메탈릭 크로스 글린트 + 원형 충격파 링
 *    - 16방향 은빛/시안/플래티넘 메탈릭 스파크 폭발 비산
 * 4. [강철 깃털 비산 & 잔향 소산]: 은백색 강철 깃털(Steel Feathers) 4~6개가 물리 궤적을 그리며 공중으로 유려하게 비산
 *    - 참격 잔향 소산 & 피격자 넉백 후 탄성 복귀
 * 5. [착지 복귀 & 경질화 방어 태세]: 시전자 원위치 착지 & 다이아몬드/방패형 은빛 경질화 방어 오라 파동 (10% 방어 랭크업 연계)
 */
export const steelWingMove: BattleMoveAnimation = {
  num: 211,
  key: "steel-wing",
  nameKo: "강철날개",
  nameEn: "Steel Wing",
  type: "steel",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawSteelWingEffect(targetCtx, frame, drawCtx);
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

    // 시전자 오프셋 & 스케일 & 회전 헬퍼
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const cScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    const cRot = (rot: number) => ({
      pRot: isP ? rot : undefined,
      eRot: !isP ? -rot : undefined,
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
    // 1. Miss (!isHit) 시퀀스 (10 프레임)
    // =========================================================================
    if (!isHit) {
      return [
        // 1. 자세 웅크림 (Squash) & 아래에서 날개 페이드인 시동 (15%)
        {
          ...baseFrame,
          delay: 60,
          ...cOff(0, 5),
          ...cScale(1.10, 0.90),
          showEffect: true,
          moveStep: 1,
          effectProgress: 0.15,
          phaseId: "steel-wing-miss-charge-1",
          phaseName: "1. 웅크림 & 아래에서 날개 페이드인 시동 (15%)",
        },
        // 2. 도약 추진 & 날개 아래에서 기울어지며 펴짐 (45%)
        {
          ...baseFrame,
          delay: 65,
          ...cOff(0, 2),
          ...cScale(1.05, 0.95),
          showEffect: true,
          moveStep: 1,
          effectProgress: 0.45,
          phaseId: "steel-wing-miss-charge-2",
          phaseName: "2. 도약 추진 & 날개 아래에서 기울어지며 펴짐 (45%)",
        },
        // 3. 도약 가속 & 반투명에서 선명하게 활짝 펼쳐짐 (75%)
        {
          ...baseFrame,
          delay: 65,
          ...cOff(isP ? 8 : -8, -14),
          ...cScale(0.98, 1.04),
          showEffect: true,
          moveStep: 1,
          effectProgress: 0.75,
          phaseId: "steel-wing-miss-charge-3",
          phaseName: "3. 도약 가속 & 날개 활짝 펼쳐짐 (75%)",
        },
        // 4. 상공 도약 피크 & 완전 불투명 거대 강철 날개 만개 (100%)
        {
          ...baseFrame,
          delay: 75,
          ...cOff(isP ? 16 : -16, -30),
          ...cScale(0.94, 1.08),
          showEffect: true,
          moveStep: 1,
          effectProgress: 1.00,
          phaseId: "steel-wing-miss-charge-4",
          phaseName: "4. 상공 피크 & 완전 불투명 거대 강철 날개 만개 (100%)",
        },
        // 5. 고속 쇄도 돌진
        {
          ...baseFrame,
          delay: 55,
          ...cOff(isP ? 140 : -140, isP ? -65 : 65),
          ...cScale(1.22, 0.82),
          ...cRot(isP ? -0.25 : 0.25),
          showEffect: true,
          moveStep: 2,
          effectProgress: 0.50,
          phaseId: "steel-wing-miss-rush",
          phaseName: "5. 초고속 급강하 쇄도",
        },
        // 6. 상대 백스텝 회피
        {
          ...baseFrame,
          delay: 50,
          ...cOff(isP ? 240 : -240, isP ? -100 : 100),
          ...defOff(isP ? 20 : -20, isP ? -5 : 5),
          ...cRot(isP ? -0.32 : 0.32),
          showEffect: true,
          moveStep: 2,
          effectProgress: 0.85,
          phaseId: "steel-wing-miss-dodge",
          phaseName: "6. 상대 백스텝 회피 & 허공 돌파",
        },
        // 7. 헛스윙 참격 전개
        {
          ...baseFrame,
          delay: 65,
          ...cOff(isP ? 310 : -310, isP ? -120 : 120),
          ...defOff(isP ? 22 : -22, isP ? -6 : 6),
          showEffect: true,
          moveStep: 3,
          effectProgress: 0.45,
          phaseId: "steel-wing-miss-whiff",
          phaseName: "7. 헛스윙 참격 소산",
        },
        // 8. 관성 오버슈트 & 감속
        {
          ...baseFrame,
          delay: 75,
          ...cOff(isP ? 340 : -340, isP ? -110 : 110),
          ...defOff(isP ? 12 : -12, 0),
          showEffect: true,
          moveStep: 4,
          effectProgress: 0.70,
          phaseId: "steel-wing-miss-overshoot",
          phaseName: "8. 오버슈트 감속 & 방향 전환",
        },
        // 9. 자세 회복
        {
          ...baseFrame,
          delay: 70,
          ...cOff(isP ? 120 : -120, isP ? -50 : 50),
          ...defOff(0, 0),
          showEffect: false,
          moveStep: 5,
          phaseId: "steel-wing-miss-recover",
          phaseName: "9. 공중 회전 자세 복귀",
        },
        // 10. 원위치 복귀 완료
        {
          ...baseFrame,
          delay: 60,
          ...cOff(0, 0),
          ...defOff(0, 0),
          showEffect: false,
          moveStep: 5,
          phaseId: "steel-wing-miss-finish",
          phaseName: "10. 원위치 복귀 완료",
        },
      ];
    }

    // =========================================================================
    // 2. Hit (isHit === true) 시퀀스 (12 프레임)
    // =========================================================================
    return [
      // 1. 도약 시동: 자세 웅크림 (Squash) & 아래에서 날개 페이드인 시동 (15%)
      {
        ...baseFrame,
        delay: 60,
        ...cOff(0, 5),
        ...cScale(1.10, 0.90),
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.15,
        phaseId: "steel-wing-charge-1",
        phaseName: "1. 웅크림 & 아래에서 날개 페이드인 시동 (15%)",
      },
      // 2. 도약 추진: 자세 반동 & 날개 아래에서 기울어지며 펴짐 (45%)
      {
        ...baseFrame,
        delay: 65,
        ...cOff(0, 2),
        ...cScale(1.05, 0.95),
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.45,
        phaseId: "steel-wing-charge-2",
        phaseName: "2. 도약 추진 & 날개 아래에서 기울어지며 펴짐 (45%)",
      },
      // 3. 도약 가속: 상공 도약 & 반투명에서 선명하게 활짝 펼쳐짐 (75%)
      {
        ...baseFrame,
        delay: 65,
        ...cOff(isP ? 8 : -8, -14),
        ...cScale(0.98, 1.04),
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.75,
        phaseId: "steel-wing-charge-3",
        phaseName: "3. 도약 가속 & 날개 활짝 펼쳐짐 (75%)",
      },
      // 4. 힘찬 도약 피크: 상공 체공 피크 & 완전 불투명 거대 강철 날개 만개 (100%)
      {
        ...baseFrame,
        delay: 75,
        ...cOff(isP ? 16 : -16, -30),
        ...cScale(0.94, 1.08),
        showEffect: true,
        moveStep: 1,
        effectProgress: 1.00,
        phaseId: "steel-wing-charge-4",
        phaseName: "4. 상공 피크 & 완전 불투명 거대 강철 날개 만개 (100%)",
      },
      // 3. 초고속 급강하 쇄도: 은빛 슬립스트림 스트리머 & 스피드라인
      {
        ...baseFrame,
        delay: 50,
        ...cOff(isP ? 130 : -130, isP ? -60 : 60),
        ...cScale(1.22, 0.82),
        ...cRot(isP ? -0.25 : 0.25),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.40,
        phaseId: "steel-wing-rush-1",
        phaseName: "3. 초고속 급강하 쇄도 발진 & 은빛 슬립스트림",
      },
      // 4. 상대 전면 근접: 강철 날개 타격 자세 압축
      {
        ...baseFrame,
        delay: 45,
        ...cOff(isP ? 230 : -230, isP ? -95 : 95),
        ...cScale(1.28, 0.78),
        ...cRot(isP ? -0.32 : 0.32),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.85,
        phaseId: "steel-wing-rush-2",
        phaseName: "4. 상대 전면 근접 & 강철 날개 타격 준비",
      },
      // 5. '챙-캉!!' 양단 교차 베기 (Cross Slash) 강타 & 직격 충돌 섬광 (hitFlash: true)
      {
        ...baseFrame,
        delay: 90,
        ...cOff(isP ? 270 : -270, isP ? -105 : 105),
        ...defOff(isP ? 18 : -18, isP ? -6 : 6),
        ...defScale(1.18, 0.84),
        hitFlash: true,
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.25,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        phaseId: "steel-wing-impact-1",
        phaseName: "5. '챙-캉!!' 양단 교차 베기 강타 & 섬광 작렬",
      },
      // 6. 메탈릭 충격파 링 확산 & 16방향 강철 파편 스파크 폭발 비산
      {
        ...baseFrame,
        delay: 80,
        ...cOff(isP ? 260 : -260, isP ? -115 : 115),
        ...defOff(isP ? 26 : -26, isP ? -8 : 8),
        ...defScale(1.12, 0.88),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.65,
        phaseId: "steel-wing-impact-2",
        phaseName: "6. 메탈릭 충격파 링 확산 & 강철 파편 스파크 비산",
      },
      // 7. 반동 체공 & 공중으로 흩날리는 은백색 강철 깃털들
      {
        ...baseFrame,
        delay: 75,
        ...cOff(isP ? 180 : -180, isP ? -135 : 135),
        ...cScale(0.96, 1.05),
        ...defOff(isP ? 14 : -14, isP ? -4 : 4),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.95,
        phaseId: "steel-wing-rebound",
        phaseName: "7. 반동 체공 & 강철 깃털 공중 비산",
      },
      // 8. 하강 복귀 & 참격 잔향 소산 & 피격자 안정화
      {
        ...baseFrame,
        delay: 80,
        ...cOff(isP ? 70 : -70, isP ? -55 : 55),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.40,
        phaseId: "steel-wing-recover-1",
        phaseName: "8. 하강 복귀 & 참격 잔향 소산",
      },
      // 9. 착지 & 다이아몬드/방패형 은빛 경질화 방어 오라 파동 (10% 방어 랭크업 연계)
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.85,
        phaseId: "steel-wing-recover-2",
        phaseName: "9. 착지 & 다이아몬드 방어 경질화 오라",
      },
      // 10. 원위치 복귀 완료 & 전장 안정화
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 0),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 5,
        effectProgress: 1.0,
        phaseId: "steel-wing-finish",
        phaseName: "10. 원위치 복귀 완료 & 안정화",
      },
    ];
  },
};
