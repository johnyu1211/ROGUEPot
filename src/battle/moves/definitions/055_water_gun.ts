// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawWaterGunEffect, drawWaterGunBehindEffect } from "../../../renderers/moves/gen1/move053_056.js";

/**
 * 055: 물대포 (Water Gun)
 * 
 * Concept:
 * 1. 시전자 입가 수류 응결 링 및 미세 기포 발생 (Frames 1~2)
 * 2. 고속 원통형 제트 수류(Jet Stream) 사출 (Frames 3~5):
 *    외곽 청록 시스 -> 시안 하이드로 빔 -> 순백 캐비테이션 코어 + 나선 리본/버블
 * 3. 대상 직격 시 16개의 포물선 물방울 비산, 2중 충격 물결 링, 하이드로 스플래시 (Frames 5~7, 클라이맥스)
 * 4. 중력 낙하 물방울 착수 및 미세 수증기 페이드아웃 (Frames 8~10)
 */
export const waterGunMove: BattleMoveAnimation = {
  num: 55,
  key: "water-gun",
  nameKo: "물대포",
  nameEn: "Water Gun",
  type: "water",
  category: "special",
  camera: { type: "target", zoom: 1.25 },
  drawBehindEffect: drawWaterGunBehindEffect,
  drawEffect: drawWaterGunEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    const dir = isP ? 1 : -1;

    const targetShake = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x, y } : { x: 0, y: 0 },
    });

    const attackerOffset = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x, y } : { x: 0, y: 0 },
    });

    const attackerScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    return [
      // 1. 발사 준비 및 입가 수류 응결
      {
        ...baseFrame,
        delay: 80,
        ...attackerScale(1.05, 0.95),
        ...attackerOffset(-dir * 2, 0),
        showEffect: true,
        moveStep: 1,
        nozzleAlpha: 0.85,
        phaseId: "water-charge",
        phaseName: "1. 발사 준비 및 입가 수류 응결",
      },
      // 2. 고압 수류 노즐 분출 시작 (짧고 날렵한 수류 사출)
      {
        ...baseFrame,
        delay: 75,
        ...attackerScale(0.96, 1.04),
        ...attackerOffset(dir * 2, 0),
        showEffect: true,
        moveStep: 2,
        nozzleAlpha: 0.90,
        streamProgress: 0.30,
        streamTailProgress: 0.0,
        streamAlpha: 0.95,
        streamThickness: 15,
        phaseId: "water-burst",
        phaseName: "2. 고압 수류 노즐 분출 시작",
      },
      // 3. 짧은 수류 제트 기류 고속 비행 (시전자 입을 떠나 비행, 길이 약 0.32로 컴팩트)
      {
        ...baseFrame,
        delay: 75,
        ...attackerOffset(dir * 1, 0),
        showEffect: true,
        moveStep: 3,
        nozzleAlpha: 0.15,
        streamProgress: 0.68,
        streamTailProgress: 0.36,
        streamAlpha: 1.0,
        streamThickness: 17,
        phaseId: "water-rush-1",
        phaseName: "3. 컴팩트 수류 제트 고속 비행",
      },
      // 4. 대상 면전 도달 및 직격 개시 (머리가 닿고 꼬리가 따라옴, 길이 0.32)
      {
        ...baseFrame,
        delay: 80,
        ...attackerOffset(0, 0),
        showEffect: true,
        moveStep: 4,
        nozzleAlpha: 0.0,
        streamProgress: 1.02,
        streamTailProgress: 0.70,
        streamAlpha: 1.0,
        streamThickness: 18,
        splashProgress: 0.20,
        splashAlpha: 0.85,
        phaseId: "water-rush-2",
        phaseName: "4. 대상 면전 수류 돌파 및 착탄",
      },
      // 5. [클라이맥스] 대상 직격! 강한 충격 스플래시 & 수류 꼬리 수렴
      {
        ...baseFrame,
        delay: 95,
        ...(isHit ? targetShake(dir * 5, -2) : {}),
        hitFlash: isHit,
        targetBlueTint: isHit,
        showEffect: true,
        moveStep: 5,
        nozzleAlpha: 0.0,
        streamProgress: 1.04,
        streamTailProgress: 0.92,
        streamAlpha: 0.85,
        streamThickness: 18,
        splashProgress: 0.50,
        splashAlpha: 1.0,
        phaseId: "water-impact-1",
        phaseName: "5. [클라이맥스] 대상 직격! 강한 충격 스플래시",
      },
      // 6. 수류 완전 소멸 & 연속 충격 물결 링 확산
      {
        ...baseFrame,
        delay: 90,
        ...(isHit ? targetShake(-dir * 3, 1) : {}),
        targetBlueTint: isHit,
        showEffect: true,
        moveStep: 6,
        nozzleAlpha: 0.0,
        streamAlpha: 0.0,
        splashProgress: 0.75,
        splashAlpha: 1.0,
        phaseId: "water-impact-2",
        phaseName: "6. 연속 충격 물결 링 확산",
      },
      // 7. 물방울 포물선 비산 및 낙하
      {
        ...baseFrame,
        delay: 85,
        ...(isHit ? targetShake(dir * 2, -1) : {}),
        showEffect: true,
        moveStep: 7,
        streamAlpha: 0.0,
        splashProgress: 0.90,
        splashAlpha: 0.80,
        phaseId: "water-splash",
        phaseName: "7. 물방울 포물선 비산 및 낙하",
      },
      // 8. 중력 물방울 낙하 및 지면 착수
      {
        ...baseFrame,
        delay: 80,
        showEffect: true,
        moveStep: 8,
        streamAlpha: 0.0,
        splashProgress: 1.02,
        splashAlpha: 0.50,
        phaseId: "water-drop",
        phaseName: "8. 중력 물방울 낙하 및 지면 착수",
      },
      // 9. 잔여 물방울 지면 소멸 및 종료 준비
      {
        ...baseFrame,
        delay: 75,
        showEffect: true,
        moveStep: 9,
        streamAlpha: 0.0,
        splashProgress: 1.12,
        splashAlpha: 0.20,
        phaseId: "water-dissolve",
        phaseName: "9. 잔여 물방울 지면 소멸",
      },
      // 10. 스탠스 복귀 및 기술 종료
      {
        ...baseFrame,
        delay: 70,
        showEffect: false,
        moveStep: 10,
        phaseId: "water-recover",
        phaseName: "10. 스탠스 복귀 및 기술 종료",
      },
    ];
  },
};
