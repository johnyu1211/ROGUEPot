// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawSlashMoveEffect } from "../../../renderers/moves/gen1/move161_164.js";

/**
 * 163: 베어가르기 (Slash) - 노말 타입 물리 접촉기 (급소율 1랭크 증가)
 *
 * 위력: 70 / 명중: 100 / PP: 20
 * 설명: 발톱이나 낫 등으로 상대를 베어 갈라서 공격한다. 급소에 맞기 쉽다.
 *
 * [유저 업로드 레퍼런스 이미지 1:1 완벽 반영 연출 시퀀스]:
 * 1. [발도 & 웅크림 준비]: 시전자가 몸을 낮추고 도약 준비 (시전자 발광 배제, 순수 모션)
 * 2. [초고속 쇄도 & 레몬 옐로우 참격호 출현]: 시전자 찰나의 전방 돌진 ➔ 상대 전면에 벼락같은 레몬 옐로우 & 순백 코어 거대 단일 참격호 쇄도 (양 끝단 극세 바늘 수렴)
 * 3. [촥!! 직격 & 중심 순백-핑크 스타버스트 폭발]: 피격자 넉백 찌그러짐 ➔ 중심부 눈부신 백열 코어 & 연분홍 림 스타버스트 폭발 ➔ 일체형 참격호 관통 ➔ 12방향 골드/라임 스파크 분출
 * 4. [참격 잔향 소산 & 피격자 반동]: 참격 잔향 및 스파크 소산 ➔ 피격자 탄성 복귀
 * 5. [피날레 복귀]: 시전자 착지 및 원위치 복귀 완료
 */
export const slashMove: BattleMoveAnimation = {
  num: 163,
  key: "slash",
  nameKo: "베어가르기",
  nameEn: "Slash",
  type: "normal",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawSlashMoveEffect(targetCtx, frame, drawCtx);
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
          delay: 75,
          ...cOff(-8, 3),
          ...cScale(1.06, 0.94),
          showEffect: false,
          moveStep: 1,
          effectProgress: 0.3,
          phaseId: "slash-miss-windup-1",
          phaseName: "1. 발도 준비",
        },
        // 2. 도약 추진
        {
          ...baseFrame,
          delay: 70,
          ...cOff(-14, 5),
          ...cScale(1.12, 0.88),
          showEffect: false,
          moveStep: 1,
          effectProgress: 0.8,
          phaseId: "slash-miss-windup-2",
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
          phaseId: "slash-miss-rush",
          phaseName: "3. 전방 쇄도",
        },
        // 4. 상대 백스텝 회피 & 헛스윙 참격 출현
        {
          ...baseFrame,
          delay: 60,
          ...cOff(32, -11),
          ...(isP ? { eOffset: { x: 16, y: -4 } } : { pOffset: { x: -16, y: 4 } }),
          showEffect: true,
          moveStep: 2,
          effectProgress: 0.70,
          phaseId: "slash-miss-dodge",
          phaseName: "4. 상대 백스텝 회피 & 헛스윙 출현",
        },
        // 5. 참격 빗맞음 슬라이드 소멸
        {
          ...baseFrame,
          delay: 80,
          ...cOff(34, -12),
          ...(isP ? { eOffset: { x: 18, y: -5 } } : { pOffset: { x: -18, y: 5 } }),
          showEffect: true,
          moveStep: 4,
          effectProgress: 0.75,
          phaseId: "slash-miss-fade",
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
          phaseId: "slash-miss-stumble",
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
          phaseId: "slash-miss-return",
          phaseName: "7. 원위치 복귀",
        },
      ];
    }

    // =========================================================================
    // 2. Hit (isHit === true) 시퀀스
    // =========================================================================
    return [
      // 1. 발도 및 도약 준비
      {
        ...baseFrame,
        delay: 75,
        ...cOff(-8, 3),
        ...cScale(1.06, 0.94),
        showEffect: false,
        moveStep: 1,
        effectProgress: 0.35,
        phaseId: "slash-windup-1",
        phaseName: "1. 발도 및 도약 준비",
      },
      // 2. 웅크림 및 도약 가속
      {
        ...baseFrame,
        delay: 70,
        ...cOff(-14, 5),
        ...cScale(1.12, 0.88),
        showEffect: false,
        moveStep: 1,
        effectProgress: 0.85,
        phaseId: "slash-windup-2",
        phaseName: "2. 웅크림 및 도약 가속",
      },
      // 3. 찰나의 순간 상대방으로 초고속 돌진 도약
      {
        ...baseFrame,
        delay: 50,
        ...cOff(22, -8),
        ...cScale(0.92, 1.08),
        showEffect: false,
        moveStep: 2,
        effectProgress: 0.25,
        phaseId: "slash-rush",
        phaseName: "3. 찰나의 초고속 돌진",
      },
      // 4. 레몬 옐로우 참격호 출현 & 쇄도
      {
        ...baseFrame,
        delay: 50,
        ...cOff(34, -12),
        ...cScale(0.95, 1.05),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.90,
        phaseId: "slash-swing",
        phaseName: "4. 레몬 옐로우 참격호 출현 & 쇄도",
      },
      // 5. 촥!! 직격 & 순백-핑크 스타버스트 폭발
      {
        ...baseFrame,
        delay: 90,
        ...cOff(38, -14),
        ...defOff(16, -6),
        ...defScale(1.24, 0.76),
        hitFlash: true,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.35,
        phaseId: "slash-strike",
        phaseName: "5. 촥!! 직격 & 순백-핑크 스타버스트 폭발",
      },
      // 6. 번개형 에너지 꼬리 & 골드/라임 스파크 비산
      {
        ...baseFrame,
        delay: 85,
        ...cOff(30, -10),
        ...defOff(18, -7),
        ...defScale(1.16, 0.84),
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.85,
        phaseId: "slash-critical-flash",
        phaseName: "6. 번개형 에너지 꼬리 & 골드/라임 스파크 비산",
      },
      // 7. 참격 잔향 확산 & 피격자 탄성 반동
      {
        ...baseFrame,
        delay: 80,
        ...cOff(20, -7),
        ...defOff(-4, 2),
        ...defScale(0.94, 1.06),
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.45,
        phaseId: "slash-rebound",
        phaseName: "7. 참격 잔향 확산 & 피격자 반동",
      },
      // 8. 스파크 소산 & 피격자 안정화 복귀
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
        phaseId: "slash-fade",
        phaseName: "8. 스파크 소산 & 피격자 안정화",
      },
      // 9. 시전자 착지 및 피날레 복귀
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 0),
        ...defOff(0, 0),
        ...defScale(1.0, 1.0),
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        showEffect: false,
        moveStep: 5,
        effectProgress: 1.0,
        phaseId: "slash-recover",
        phaseName: "9. 시전자 착지 복귀",
      },
    ];
  },
};
