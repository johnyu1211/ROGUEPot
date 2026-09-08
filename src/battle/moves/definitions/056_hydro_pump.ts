// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증(3번 단계)은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawHydroPumpEffect, drawHydroPumpBehindEffect } from "../../../renderers/moves/gen1/move053_056.js";

/**
 * 056: 하이드로펌프 (Hydro Pump) - 5세대 공식 배틀 연출
 * 
 * Concept (5세대 블랙/화이트 완벽 재현):
 * 1. 시전자 후퇴 호흡 및 발사구 수류 소용돌이 흡입/응축 (Frames 1~2)
 * 2. 두께 52px에 달하는 초거대 고압 수류 볼텍스 캐논 전방 사출 (Frames 3~4):
 *    - 외곽 심해 오션 블루 시스 -> 고채도 아쿠아마린 제트 -> 순백 캐비테이션 코어
 *    - 외곽을 3D로 휘감는 이중 나선 물결 회오리 리본 (Twin Helical Vortex Ribbons)
 *    - 전진하는 고압 타원형 충격파 팽창 링
 * 3. 대상 직격 시 극대 넉백 진동, 섬광, 블루 피격 틴트, 초대형 간헐천(Geyser) 대폭발 (Frames 5~7, 클라이맥스)
 *    - 후면 레이어: 대상 등 뒤로 치솟는 5갈래 초대형 간헐천 물기둥 & 배경 물안개 돔
 *    - 전면 레이어: 거대 물보라 플레어, 2중 충격 물결 링, 24개 포물선 비산 수적
 * 4. 바닥 수면 웅덩이 동심원 파문 및 폭포수 중력 낙하, 수증기 기화 페이드아웃 (Frames 8~11)
 */
export const hydroPumpMove: BattleMoveAnimation = {
  num: 56,
  key: "hydro-pump",
  nameKo: "하이드로펌프",
  nameEn: "Hydro Pump",
  type: "water",
  category: "special",
  camera: { type: "target", zoom: 1.35 },
  drawBehindEffect: drawHydroPumpBehindEffect,
  drawEffect: drawHydroPumpEffect,
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

    const attackerScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    // [유저 요청: "시전포켓몬 앞에 회전하는 링 돌아가는동안 범위는 짧지만 빠르게 시전포켓몬 흔들리게"]
    const casterShake = (baseX: number, baseY: number, vibX: number, vibY: number) => ({
      pOffset: isP ? { x: baseX + vibX, y: baseY + vibY } : { x: 0, y: 0 },
      eOffset: !isP ? { x: baseX + vibX, y: baseY + vibY } : { x: 0, y: 0 },
    });

    return [
      // 1. 발사 준비 및 수류 소용돌이 흡입 (고주파 미세 진동)
      {
        ...baseFrame,
        delay: 75,
        ...attackerScale(1.06, 0.94),
        ...casterShake(-dir * 3, 1, dir * 1, -1),
        showEffect: true,
        moveStep: 1,
        chargeAlpha: 0.85,
        chargeIntensity: 0.65,
        phaseId: "hydro-charge-1",
        phaseName: "1. 발사 준비 및 고압 소용돌이 응결 (진동 시작)",
      },
      // 2. 초고압 수류 핵 응축 완료 (회전 링 가속 진동)
      {
        ...baseFrame,
        delay: 75,
        ...attackerScale(1.08, 0.92),
        ...casterShake(-dir * 4, 2, -dir * 1, 1),
        showEffect: true,
        moveStep: 2,
        chargeAlpha: 1.0,
        chargeIntensity: 1.0,
        phaseId: "hydro-charge-2",
        phaseName: "2. 초고압 수류 핵 응축 완료 (회전 링 가속)",
      },
      // 3. 초거대 수류 볼텍스 캐논 사출
      {
        ...baseFrame,
        delay: 70,
        ...attackerScale(0.92, 1.08),
        ...casterShake(dir * 3, -1, dir * 1, 1),
        showEffect: true,
        moveStep: 3,
        streamProgress: 0.48,
        streamTailProgress: 0.0,
        streamAlpha: 1.0,
        streamThickness: 48,
        phaseId: "hydro-blast-start",
        phaseName: "3. 초거대 수류 볼텍스 캐논 사출",
      },
      // 4. 초고압 수류 맹렬한 쇄도
      {
        ...baseFrame,
        delay: 75,
        ...casterShake(dir * 2, 0, -dir * 1, -1),
        showEffect: true,
        moveStep: 4,
        streamProgress: 0.88,
        streamTailProgress: 0.0,
        streamAlpha: 1.0,
        streamThickness: 52,
        phaseId: "hydro-blast-rush",
        phaseName: "4. 초고압 수류 맹렬한 쇄도",
      },
      // 5. [유저 요청: "대상포켓몬에 물줄기가 닿은 시점부터는 대상포켓몬과 카메라도 흔들리게"]
      // 5. [지속 사출 1 / 직격] 대상 정면 강타! 피격 + 카메라 지진 시작 (두께 52)
      {
        ...baseFrame,
        delay: 90,
        ...casterShake(dir * 2, 0, dir * 1, 1),
        ...(isHit ? targetShake(dir * 6, -2) : {}),
        cameraPan: isHit ? { x: dir * 3, y: -2 } : undefined,
        hitFlash: isHit,
        targetBlueTint: isHit,
        showEffect: true,
        moveStep: 5,
        streamProgress: 1.04,
        streamTailProgress: 0.0,
        streamAlpha: 1.0,
        streamThickness: 52,
        splashProgress: 0.20,
        splashAlpha: 0.85,
        phaseId: "hydro-impact-start",
        phaseName: "5. [직격] 대상 정면 강타! 피격 & 카메라 흔들림 시작",
      },
      // 6. [지속 사출 2 / 중간 1] 유저 요청: "중간에 살짝 줄어들었다가" -> 두께 44로 좁아지며 고속 분사
      {
        ...baseFrame,
        delay: 95,
        ...casterShake(dir * 2, 0, -dir * 1, -1),
        ...(isHit ? targetShake(-dir * 4, 1) : {}),
        cameraPan: isHit ? { x: -dir * 2, y: 1 } : undefined,
        targetBlueTint: isHit,
        showEffect: true,
        moveStep: 6,
        streamProgress: 1.04,
        streamTailProgress: 0.0,
        streamAlpha: 1.0,
        streamThickness: 44,
        splashProgress: 0.38,
        splashAlpha: 0.95,
        phaseId: "hydro-pump-sustain-dip-1",
        phaseName: "6. [중간 수류 1] 수류 살짝 응축(가늘어짐) & 연속 타격",
      },
      // 7. [지속 사출 3 / 중간 2] 유저 요청: "중간에 살짝 줄어들었다가" -> 두께 40 (최저 두께로 날렵한 응축 수류)
      {
        ...baseFrame,
        delay: 95,
        ...casterShake(dir * 2, 0, dir * 1, 1),
        ...(isHit ? targetShake(dir * 4, -1) : {}),
        cameraPan: isHit ? { x: dir * 2, y: -1 } : undefined,
        targetBlueTint: isHit,
        showEffect: true,
        moveStep: 7,
        streamProgress: 1.04,
        streamTailProgress: 0.0,
        streamAlpha: 1.0,
        streamThickness: 40,
        splashProgress: 0.52,
        splashAlpha: 1.0,
        phaseId: "hydro-pump-sustain-dip-2",
        phaseName: "7. [중간 수류 2] 초고속 응축 수류 (두께 최저점) & 재가압 전조",
      },
      // 8. [지속 사출 4 / 재가압] 수압 급상승 & 수류 팽창 (두께 53)
      {
        ...baseFrame,
        delay: 100,
        ...casterShake(dir * 2, 0, -dir * 1, -1),
        ...(isHit ? targetShake(-dir * 6, 2) : {}),
        cameraPan: isHit ? { x: -dir * 3, y: 2 } : undefined,
        targetBlueTint: isHit,
        showEffect: true,
        moveStep: 8,
        streamProgress: 1.04,
        streamTailProgress: 0.0,
        streamAlpha: 1.0,
        streamThickness: 53,
        splashProgress: 0.68,
        splashAlpha: 1.0,
        phaseId: "hydro-pump-surge",
        phaseName: "8. [수압 재가압] 수류 급팽창 & 거센 수압 상승",
      },
      // 9. [지속 사출 5 / 클라이맥스] 유저 요청: "마지막에 강해지게 (살짝더 두꺼워지는정도)" -> 두께 64 (최대 극대 방사!)
      {
        ...baseFrame,
        delay: 110,
        ...attackerScale(0.94, 1.06),
        ...casterShake(-dir * 4, 2, dir * 1, 1), // 강력한 사출 반동
        ...(isHit ? targetShake(dir * 8, -3) : {}), // 극대 타격 넉백
        cameraPan: isHit ? { x: dir * 5, y: -3 } : undefined, // 최대 카메라 흔들림!
        targetBlueTint: isHit,
        showEffect: true,
        moveStep: 9,
        streamProgress: 1.04,
        streamTailProgress: 0.0,
        streamAlpha: 1.0,
        streamThickness: 64,
        splashProgress: 0.82,
        splashAlpha: 1.0,
        phaseId: "hydro-pump-climax",
        phaseName: "9. [마지막 피니시 클라이맥스] 최대 수압 극대 방사 (두께 최대 확장 & 극대 카메라 흔들림)",
      },
      // 10. [수류 후미 쇄도] 사출 종료 후 굵은 수류 꼬리가 대상 돌파
      {
        ...baseFrame,
        delay: 95,
        ...casterShake(dir * 1, 0, -dir * 1, -1),
        ...(isHit ? targetShake(-dir * 5, 2) : {}),
        cameraPan: isHit ? { x: -dir * 3, y: 1 } : undefined,
        showEffect: true,
        moveStep: 10,
        streamProgress: 1.04,
        streamTailProgress: 0.40,
        streamAlpha: 0.95,
        streamThickness: 56,
        splashProgress: 0.92,
        splashAlpha: 0.95,
        phaseId: "hydro-tail-rush",
        phaseName: "10. 수류 후미 쇄도 & 관통 타격",
      },
      // 11. [수류 완전 착탄] 수류 끝자락 대상 타격 및 분무 확산
      {
        ...baseFrame,
        delay: 85,
        ...(isHit ? targetShake(dir * 2, -1) : {}),
        cameraPan: isHit ? { x: dir * 1, y: 0 } : undefined,
        showEffect: true,
        moveStep: 11,
        streamProgress: 1.04,
        streamTailProgress: 0.85,
        streamAlpha: 0.70,
        streamThickness: 46,
        splashProgress: 0.98,
        splashAlpha: 0.75,
        phaseId: "hydro-tail-finish",
        phaseName: "11. 수류 완전 착탄 & 분무 비산",
      },
      // 12. 바닥 수면 웅덩이 파문 및 잔여 수적 낙하
      {
        ...baseFrame,
        delay: 85,
        cameraPan: { x: 0, y: 0 },
        showEffect: true,
        moveStep: 12,
        streamAlpha: 0.0,
        splashProgress: 1.0,
        splashAlpha: 0.50,
        phaseId: "hydro-puddle",
        phaseName: "12. 바닥 수면 웅덩이 파문 및 잔여 수적 낙하",
      },
      // 13. 잔여 수증기 기화 페이드아웃
      {
        ...baseFrame,
        delay: 80,
        cameraPan: { x: 0, y: 0 },
        showEffect: true,
        moveStep: 13,
        streamAlpha: 0.0,
        splashProgress: 1.0,
        splashAlpha: 0.20,
        phaseId: "hydro-fadeout",
        phaseName: "13. 수증기 기화 페이드아웃",
      },
      // 14. 기술 종료 및 스탠스 복귀
      {
        ...baseFrame,
        delay: 75,
        cameraPan: { x: 0, y: 0 },
        showEffect: false,
        moveStep: 14,
        phaseId: "hydro-finish",
        phaseName: "14. 기술 종료 및 스탠스 복귀",
      },
    ];
  },
};
