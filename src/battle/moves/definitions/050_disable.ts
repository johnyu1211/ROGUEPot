// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import {
  drawDisableBehindEffect,
  drawDisableFrontEffect,
} from "../../../renderers/moves/gen1/move049_052.js";

/**
 * 050: 사슬묶기 (Disable)
 * 
 * Concept (유저 요구사항 100% 반영):
 * 1. 서서히 하지만 빠르게 사슬묶기 배경을 회색깔로 바꿈
 * 2. 시전 포켓몬의 앞쪽에 파란색 십자형별이 번쩍함
 * 3. 대상 포켓몬 스프라이트에는 보라색깔 사슬이 가로로 회전함
 *    (앞쪽은 스프라이트 Z축 위, 뒤로 간 사슬은 Z축 아래로 3D 교차 레이어링)
 */
export const disableMove: BattleMoveAnimation = {
  num: 50,
  key: "disable",
  nameKo: "사슬묶기",
  nameEn: "Disable",
  type: "normal",
  category: "status",
  camera: { type: "target", zoom: 1.30 },
  drawBehindEffect: drawDisableBehindEffect,
  drawEffect: drawDisableFrontEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    return [
      // 1. [회색빛 화면 1] 서서히 하지만 빠르게 배경 회색화 시작 (별 없음, 사슬 없음)
      {
        ...baseFrame,
        delay: 85,
        pOffset: isP ? { x: 0, y: -2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -2 } : { x: 0, y: 0 },
        pScale: isP ? { x: 1.02, y: 0.98 } : undefined,
        eScale: !isP ? { x: 1.02, y: 0.98 } : undefined,
        showEffect: true,
        moveStep: 1,
        grayAlpha: 0.55,
        starScale: 0.0,
        chainAlpha: 0.0,
        phaseId: "disable-gray-start",
        phaseName: "1. 전장 배경 회색 전환 시작",
      },
      // 2. [회색빛 화면 2] 전장 완전 무채색 잿빛 정착 (별 없음, 사슬 없음)
      {
        ...baseFrame,
        delay: 85,
        pOffset: isP ? { x: 0, y: -3 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -3 } : { x: 0, y: 0 },
        pScale: isP ? { x: 0.97, y: 1.03 } : undefined,
        eScale: !isP ? { x: 0.97, y: 1.03 } : undefined,
        showEffect: true,
        moveStep: 2,
        grayAlpha: 0.95,
        starScale: 0.0,
        chainAlpha: 0.0,
        phaseId: "disable-gray-solid",
        phaseName: "2. 전장 완전 회색화 정착",
      },
      // 3. [파란거 번쩍 1] 시전 포켓몬 앞쪽에 파란 십자형 별 점등
      {
        ...baseFrame,
        delay: 80,
        pOffset: isP ? { x: 0, y: -2 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -2 } : { x: 0, y: 0 },
        showEffect: true,
        moveStep: 3,
        grayAlpha: 0.95,
        starScale: 0.80,
        starAlpha: 0.90,
        chainAlpha: 0.0,
        phaseId: "disable-star-ignite",
        phaseName: "3. 시전자 앞 파란 십자별 점등",
      },
      // 4. [파란거 번쩍 2] 파란 십자형 별 최대 섬광 번쩍!
      {
        ...baseFrame,
        delay: 90,
        pOffset: isP ? { x: 0, y: -3 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -3 } : { x: 0, y: 0 },
        showEffect: true,
        moveStep: 4,
        grayAlpha: 0.95,
        starScale: 1.65,
        starAlpha: 1.00,
        chainAlpha: 0.0,
        phaseId: "disable-star-flash",
        phaseName: "4. 파란 십자별 최대 번쩍임",
      },
      // 5. [파란거 번쩍 3] 십자별 잔광 수축 및 소멸
      {
        ...baseFrame,
        delay: 75,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        moveStep: 5,
        grayAlpha: 0.95,
        starScale: 0.45,
        starAlpha: 0.45,
        chainAlpha: 0.0,
        phaseId: "disable-star-fade",
        phaseName: "5. 십자별 잔광 수축",
      },
      // 6. [그 후 사슬 1] 대상 주위에 보라색 사슬 고리 발현 및 3D 회전 시작!
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: 1, y: 0 } : { x: -1, y: 0 },
        showEffect: true,
        moveStep: 6,
        grayAlpha: 0.90,
        starScale: 0.0,
        chainAlpha: 1.0,
        chainProgress: 0.12,
        phaseId: "disable-chains-start",
        phaseName: "6. 대상 주위 보라색 사슬 발현 및 3D 가로 회전 1",
      },
      // 7. [그 후 사슬 2] 사슬 가로 회전 2 (앞/뒤 Z축 교차)
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: -2, y: 0 } : { x: 2, y: 0 },
        showEffect: true,
        moveStep: 7,
        grayAlpha: 0.90,
        starScale: 0.0,
        chainAlpha: 1.0,
        chainProgress: 0.32,
        phaseId: "disable-chains-rot-2",
        phaseName: "7. 사슬 3D 가로 회전 2",
      },
      // 8. [그 후 사슬 3] 사슬 가로 회전 3
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: 2, y: -1 } : { x: -2, y: 1 },
        showEffect: true,
        moveStep: 8,
        grayAlpha: 0.90,
        chainAlpha: 1.0,
        chainProgress: 0.54,
        phaseId: "disable-chains-rot-3",
        phaseName: "8. 사슬 3D 가로 회전 3",
      },
      // 9. [그 후 사슬 4] 사슬 가로 회전 4 & 대상 포위
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: -2, y: 1 } : { x: 2, y: -1 },
        showEffect: true,
        moveStep: 9,
        grayAlpha: 0.90,
        chainAlpha: 1.0,
        chainProgress: 0.76,
        phaseId: "disable-chains-rot-4",
        phaseName: "9. 사슬 3D 가로 회전 4",
      },
      // 10. [그 후 사슬 5] 사슬 가로 회전 5 & 조여들기 준비
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: 1, y: 0 } : { x: -1, y: 0 },
        showEffect: true,
        moveStep: 10,
        grayAlpha: 0.90,
        chainAlpha: 1.0,
        chainProgress: 0.96,
        phaseId: "disable-chains-rot-5",
        phaseName: "10. 사슬 3D 회전 최고조",
      },
      // 11. [사슬 조여듦 & 구속 직격] 대상 몸체에 사슬이 타이트하게 압착!
      {
        ...baseFrame,
        delay: 90,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: -3, y: 1 } : { x: 3, y: -1 },
        showEffect: true,
        moveStep: 11,
        grayAlpha: 0.90,
        chainAlpha: 1.0,
        chainProgress: 1.14,
        chainSqueeze: 0.72,
        hitFlash: isHit,
        phaseId: "disable-lock-impact",
        phaseName: "11. 사슬 압착 조여듦 (구속 직격)",
      },
      // 12. 사슬 완전 봉인 구속 & 대상 경직 충격
      {
        ...baseFrame,
        delay: 85,
        pOffset: { x: 0, y: 0 },
        eOffset: isP ? { x: 2, y: 0 } : { x: -2, y: 0 },
        showEffect: true,
        moveStep: 12,
        grayAlpha: 0.85,
        chainAlpha: 1.0,
        chainProgress: 1.28,
        chainSqueeze: 0.72,
        phaseId: "disable-lock-hold",
        phaseName: "12. 사슬 봉인 구속 유지",
      },
      // 13. 사슬 및 회색 배경 서서히 페이드아웃 1
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        moveStep: 13,
        grayAlpha: 0.50,
        chainAlpha: 0.65,
        chainSqueeze: 0.72,
        chainProgress: 1.38,
        phaseId: "disable-fade-1",
        phaseName: "13. 사슬 및 배경 페이드아웃 1",
      },
      // 14. 사슬 소멸 및 배경 원래대로 복귀 2
      {
        ...baseFrame,
        delay: 75,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: true,
        moveStep: 14,
        grayAlpha: 0.18,
        chainAlpha: 0.25,
        chainSqueeze: 0.72,
        chainProgress: 1.45,
        phaseId: "disable-fade-2",
        phaseName: "14. 사슬 및 배경 페이드아웃 2",
      },
      // 15. 정상 스탠스 안착 및 기술 완료
      {
        ...baseFrame,
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        showEffect: false,
        moveStep: 15,
        phaseId: "disable-end",
        phaseName: "15. 기술 완료",
      },
    ];
  },
};
