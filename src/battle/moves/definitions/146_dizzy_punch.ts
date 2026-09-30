// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame } from "../types.js";
import { drawDizzyPunchEffect } from "../../../renderers/moves/gen1/move145_148.js";

/**
 * 146: 잼잼펀치 / 잽잽펀치 (Dizzy Punch)
 *
 * 타입: 노말 (Normal)
 * 분류: 물리 (Physical)
 * 위력: 70 / 명중: 100 / PP: 10
 * 부가 효과: 20% 확률로 대상을 혼란 상태로 만듦
 *
 * [유저 요구사항 100% 반영]:
 * 1. 주먹 SVG: 메가톤펀치에 있는 정면 정권 SVG(drawFrontStraightPunchFistSvg) 사용
 * 2. 퍽 > 혼란 효과 터지기 2회 (1차 잽 퍽 > 1차 혼란 분출 ➔ 2차 잽 퍽 > 2차 혼란 분출)
 * 3. 혼란 효과는 머리 위를 빙글빙글 돌아가는 것이 아닌, 타격점으로부터 다각도 포물선으로 퍼져나옴
 */
export const dizzyPunchMove: BattleMoveAnimation = {
  num: 146,
  key: "dizzy-punch",
  nameKo: "잼잼펀치",
  nameEn: "Dizzy Punch",
  type: "normal",
  category: "physical",
  camera: { type: "target", zoom: 1.32 },
  drawEffect: drawDizzyPunchEffect,
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
    };

    const frames: BattleFrame[] = [];

    // Miss일 때: 잽 2방을 헛치고 상대는 회피
    if (!isHit) {
      return [
        // 1. 1차 잽 준비
        {
          ...baseFrame,
          delay: 35,
          pOffset: isP ? { x: 12, y: -4 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: -12, y: 4 } : { x: 0, y: 0 },
          showEffect: false,
          moveStep: 1,
          phaseId: "dizzy-punch-miss-jab1",
          phaseName: "1. 1차 잽 준비",
        },
        // 2. 1차 잽 헛치기 & 상대 도약 회피
        {
          ...baseFrame,
          delay: 40,
          pOffset: isP ? { x: 26, y: -8 } : { x: 0, y: -16 },
          eOffset: !isP ? { x: -26, y: 8 } : { x: 0, y: -16 },
          showEffect: true,
          jabNum: 1,
          fistProg: 1.0,
          fistAlpha: 0.8,
          moveStep: 2,
          phaseId: "dizzy-punch-miss-dodge1",
          phaseName: "2. 대상 회피 (1차 잽 빗나감)",
        },
        // 3. 1차 잽 소산
        {
          ...baseFrame,
          delay: 40,
          pOffset: isP ? { x: 14, y: -4 } : { x: 0, y: -8 },
          eOffset: !isP ? { x: -14, y: 4 } : { x: 0, y: -8 },
          showEffect: true,
          jabNum: 1,
          fistProg: 1.0,
          fistAlpha: 0.3,
          moveStep: 2,
        },
        // 4. 2차 잽 전환
        {
          ...baseFrame,
          delay: 35,
          pOffset: isP ? { x: 18, y: -5 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: -18, y: 5 } : { x: 0, y: 0 },
          showEffect: false,
          moveStep: 3,
        },
        // 5. 2차 잽 헛치기 & 상대 뒤로 물러서기
        {
          ...baseFrame,
          delay: 40,
          pOffset: isP ? { x: 30, y: -9 } : { x: -8, y: 0 },
          eOffset: !isP ? { x: -30, y: 9 } : { x: 8, y: 0 },
          showEffect: true,
          jabNum: 2,
          fistProg: 1.0,
          fistAlpha: 0.8,
          moveStep: 4,
          phaseId: "dizzy-punch-miss-dodge2",
          phaseName: "3. 대상 슬립 (2차 잽 빗나감)",
        },
        // 6. 소산 및 복귀
        {
          ...baseFrame,
          delay: 45,
          pOffset: isP ? { x: 14, y: -4 } : { x: 0, y: 0 },
          eOffset: !isP ? { x: -14, y: 4 } : { x: 0, y: 0 },
          showEffect: false,
          moveStep: 5,
        },
        {
          ...baseFrame,
          delay: 60,
          pOffset: { x: 0, y: 0 },
          eOffset: { x: 0, y: 0 },
          showEffect: false,
          moveStep: 5,
          phaseId: "dizzy-punch-complete",
          phaseName: "4. 복귀",
        },
      ];
    }

    // -------------------------------------------------------------
    // Hit인 경우: 1차 잽 (퍽!) ➔ 1차 혼란 분출 ➔ 2차 잽 (퍽!) ➔ 2차 혼란 분출
    // [유저 피드백 반영: "그 터진 애들이 너무 빨리 사라진다"]
    // 체공 프레임을 대폭 연장(각 웨이브 15프레임 체공, 1·2차 웨이브 풍성한 공존)
    // -------------------------------------------------------------

    // Frame 1: 1차 잽 준비
    frames.push({
      ...baseFrame,
      delay: 40,
      pOffset: isP ? { x: 10, y: -3 } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -10, y: 3 } : { x: 0, y: 0 },
      showEffect: false,
      moveStep: 1,
      phaseId: "dizzy-punch-jab1-ready",
      phaseName: "1. 1차 잽 준비",
    });

    // Frame 2: 1차 잽 돌진 (주먹 뻗음)
    frames.push({
      ...baseFrame,
      delay: 40,
      pOffset: isP ? { x: 22, y: -7 } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -22, y: 7 } : { x: 0, y: 0 },
      showEffect: true,
      jabNum: 1,
      fistProg: 0.65,
      fistAlpha: 0.85,
      moveStep: 1,
      phaseId: "dizzy-punch-jab1-thrust",
      phaseName: "2. 1차 잽 돌진",
    });

    // Frame 3: 1차 잽 타격 작렬 (퍽!)
    frames.push({
      ...baseFrame,
      delay: 40,
      pOffset: isP ? { x: 28, y: -9 } : { x: -7, y: 3 },
      eOffset: isP ? { x: 7, y: -3 } : { x: -28, y: 9 },
      showEffect: true,
      hitFlash: true,
      showHitSpark: true,
      jabNum: 1,
      fistProg: 1.0,
      fistAlpha: 1.0,
      wave1Prog: 0.05,
      moveStep: 2,
      phaseId: "dizzy-punch-jab1-hit",
      phaseName: "3. 1차 잽 타격 작렬 (퍽!)",
    });

    // Frame 4: 1차 혼란 3D 돔 급속 팽창 & 주먹 회수
    frames.push({
      ...baseFrame,
      delay: 40,
      pOffset: isP ? { x: 24, y: -8 } : { x: 4, y: -2 },
      eOffset: isP ? { x: -4, y: 2 } : { x: -24, y: 8 },
      showEffect: true,
      jabNum: 1,
      fistProg: 1.0,
      fistAlpha: 0.40,
      wave1Prog: 0.12,
      moveStep: 3,
      phaseId: "dizzy-punch-jab1-burst",
      phaseName: "4. 1차 혼란 효과 포물선 분출",
    });

    // Frame 5: 1차 혼란 별무리 3D 상승 비산
    frames.push({
      ...baseFrame,
      delay: 40,
      pOffset: isP ? { x: 18, y: -6 } : { x: -2, y: 1 },
      eOffset: isP ? { x: 2, y: -1 } : { x: -18, y: 6 },
      showEffect: true,
      jabNum: 1,
      fistProg: 1.0,
      fistAlpha: 0,
      wave1Prog: 0.19,
      moveStep: 3,
      phaseId: "dizzy-punch-jab1-burst",
      phaseName: "4. 1차 혼란 효과 포물선 분출",
    });

    // Frame 6: 1차 혼란 3D 상승 가속
    frames.push({
      ...baseFrame,
      delay: 40,
      pOffset: isP ? { x: 14, y: -4 } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -14, y: 4 } : { x: 0, y: 0 },
      showEffect: true,
      wave1Prog: 0.26,
      moveStep: 3,
      phaseId: "dizzy-punch-jab1-burst",
      phaseName: "4. 1차 혼란 효과 포물선 분출",
    });

    // Frame 7: 1차 혼란 3D 상공 진입
    frames.push({
      ...baseFrame,
      delay: 40,
      pOffset: isP ? { x: 10, y: -3 } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -10, y: 3 } : { x: 0, y: 0 },
      showEffect: true,
      wave1Prog: 0.33,
      moveStep: 3,
      phaseId: "dizzy-punch-jab1-burst",
      phaseName: "4. 1차 혼란 효과 포물선 분출",
    });

    // Frame 8: 1차 혼란 정점(Apex) 체공 진입 & 반짝임
    frames.push({
      ...baseFrame,
      delay: 40,
      pOffset: isP ? { x: 8, y: -2 } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -8, y: 2 } : { x: 0, y: 0 },
      showEffect: true,
      wave1Prog: 0.40,
      moveStep: 3,
      phaseId: "dizzy-punch-jab1-burst",
      phaseName: "4. 1차 혼란 효과 포물선 분출",
    });

    // Frame 9: 1차 혼란 상공 체공 지속 / 2차 잽 전환 준비 (반대손 장전)
    frames.push({
      ...baseFrame,
      delay: 40,
      pOffset: isP ? { x: 16, y: -5 } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -16, y: 5 } : { x: 0, y: 0 },
      showEffect: true,
      jabNum: 2,
      fistProg: 0.35,
      fistAlpha: 0.65,
      wave1Prog: 0.47,
      moveStep: 4,
      phaseId: "dizzy-punch-jab2-ready",
      phaseName: "5. 2차 잽 전환 준비",
    });

    // Frame 10: 1차 혼란 상공 체공 지속 / 2차 잽 돌진 (반대손 주먹 뻗음)
    frames.push({
      ...baseFrame,
      delay: 40,
      pOffset: isP ? { x: 26, y: -8 } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -26, y: 8 } : { x: 0, y: 0 },
      showEffect: true,
      jabNum: 2,
      fistProg: 0.75,
      fistAlpha: 0.90,
      wave1Prog: 0.54,
      moveStep: 4,
      phaseId: "dizzy-punch-jab2-thrust",
      phaseName: "6. 2차 잽 돌진",
    });

    // Frame 11: 2차 잽 타격 작렬 (퍽!) ➔ 1차 혼란 체공 중 + 2차 혼란 3D 폭발 개시!
    frames.push({
      ...baseFrame,
      delay: 40,
      pOffset: isP ? { x: 34, y: -11 } : { x: 8, y: -4 },
      eOffset: isP ? { x: -8, y: 4 } : { x: -34, y: 11 },
      pRot: !isP ? 0.06 : 0,
      eRot: isP ? -0.06 : 0,
      showEffect: true,
      hitFlash: true,
      showHitSpark: true,
      jabNum: 2,
      fistProg: 1.0,
      fistAlpha: 1.0,
      wave1Prog: 0.61,
      wave2Prog: 0.05,
      enemyHp: a.enemyHpAfter,
      playerHp: a.playerHpAfter,
      moveStep: 5,
      phaseId: "dizzy-punch-jab2-hit",
      phaseName: "7. 2차 잽 타격 작렬 (퍽!)",
    });

    // Frame 12: 2차 혼란 3D 돔 팽창 + 1차 혼란 체공 (두 웨이브 동시 화려한 공존)
    frames.push({
      ...baseFrame,
      delay: 40,
      pOffset: isP ? { x: 30, y: -10 } : { x: -5, y: 2 },
      eOffset: isP ? { x: 5, y: -2 } : { x: -30, y: 10 },
      pRot: !isP ? -0.05 : 0,
      eRot: isP ? 0.05 : 0,
      showEffect: true,
      jabNum: 2,
      fistProg: 1.0,
      fistAlpha: 0.40,
      wave1Prog: 0.68,
      wave2Prog: 0.12,
      enemyHp: a.enemyHpAfter,
      playerHp: a.playerHpAfter,
      moveStep: 6,
      phaseId: "dizzy-punch-jab2-burst",
      phaseName: "8. 2차 혼란 효과 포물선 분출",
    });

    // Frame 13: 2차 혼란 상승 + 1차 혼란 체공 지속
    frames.push({
      ...baseFrame,
      delay: 40,
      pOffset: isP ? { x: 24, y: -8 } : { x: 3, y: -1 },
      eOffset: isP ? { x: -3, y: 1 } : { x: -24, y: 8 },
      pRot: !isP ? 0.04 : 0,
      eRot: isP ? -0.04 : 0,
      showEffect: true,
      jabNum: 2,
      fistProg: 1.0,
      fistAlpha: 0,
      wave1Prog: 0.75,
      wave2Prog: 0.19,
      enemyHp: a.enemyHpAfter,
      playerHp: a.playerHpAfter,
      moveStep: 6,
      phaseId: "dizzy-punch-jab2-burst",
      phaseName: "8. 2차 혼란 효과 포물선 분출",
    });

    // Frame 14: 2차 혼란 상승 가속 + 1차 혼란 완만 하강 진입 (여전히 완전 불투명!)
    frames.push({
      ...baseFrame,
      delay: 40,
      pOffset: isP ? { x: 18, y: -6 } : { x: -2, y: 1 },
      eOffset: isP ? { x: 2, y: -1 } : { x: -18, y: 6 },
      pRot: !isP ? -0.03 : 0,
      eRot: isP ? 0.03 : 0,
      showEffect: true,
      wave1Prog: 0.81,
      wave2Prog: 0.26,
      enemyHp: a.enemyHpAfter,
      playerHp: a.playerHpAfter,
      moveStep: 6,
      phaseId: "dizzy-punch-jab2-burst",
      phaseName: "8. 2차 혼란 효과 포물선 분출",
    });

    // Frame 15: 2차 혼란 상공 진입 + 1차 혼란 미세 페이드 시작
    frames.push({
      ...baseFrame,
      delay: 40,
      pOffset: isP ? { x: 14, y: -5 } : { x: -1, y: 0 },
      eOffset: isP ? { x: 1, y: 0 } : { x: -14, y: 5 },
      pRot: !isP ? 0.02 : 0,
      eRot: isP ? -0.02 : 0,
      showEffect: true,
      wave1Prog: 0.87,
      wave2Prog: 0.33,
      enemyHp: a.enemyHpAfter,
      playerHp: a.playerHpAfter,
      moveStep: 6,
      phaseId: "dizzy-punch-jab2-burst",
      phaseName: "8. 2차 혼란 효과 포물선 분출",
    });

    // Frame 16: 2차 혼란 정점 체공 진입 + 1차 혼란 부드러운 페이드
    frames.push({
      ...baseFrame,
      delay: 40,
      pOffset: isP ? { x: 11, y: -4 } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -11, y: 4 } : { x: 0, y: 0 },
      pRot: 0,
      eRot: 0,
      showEffect: true,
      wave1Prog: 0.93,
      wave2Prog: 0.40,
      enemyHp: a.enemyHpAfter,
      playerHp: a.playerHpAfter,
      moveStep: 6,
      phaseId: "dizzy-punch-jab2-burst",
      phaseName: "8. 2차 혼란 효과 포물선 분출",
    });

    // Frame 17: 2차 혼란 정점 체공 지속 + 1차 혼란 잔여 반짝임
    frames.push({
      ...baseFrame,
      delay: 40,
      pOffset: isP ? { x: 9, y: -3 } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -9, y: 3 } : { x: 0, y: 0 },
      showEffect: true,
      wave1Prog: 0.98,
      wave2Prog: 0.47,
      enemyHp: a.enemyHpAfter,
      playerHp: a.playerHpAfter,
      moveStep: 6,
      phaseId: "dizzy-punch-jab2-burst",
      phaseName: "8. 2차 혼란 효과 포물선 분출",
    });

    // Frame 18: 1차 소산 완료 + 2차 혼란 상공 체공 & 반짝임 지속
    frames.push({
      ...baseFrame,
      delay: 40,
      pOffset: isP ? { x: 7, y: -2 } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -7, y: 2 } : { x: 0, y: 0 },
      showEffect: true,
      wave2Prog: 0.54,
      enemyHp: a.enemyHpAfter,
      playerHp: a.playerHpAfter,
      moveStep: 6,
      phaseId: "dizzy-punch-jab2-burst",
      phaseName: "8. 2차 혼란 효과 포물선 분출",
    });

    // Frame 19: 2차 혼란 체공 지속 & 회전 유영
    frames.push({
      ...baseFrame,
      delay: 40,
      pOffset: isP ? { x: 5, y: -2 } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -5, y: 2 } : { x: 0, y: 0 },
      showEffect: true,
      wave2Prog: 0.61,
      enemyHp: a.enemyHpAfter,
      playerHp: a.playerHpAfter,
      moveStep: 6,
      phaseId: "dizzy-punch-jab2-burst",
      phaseName: "8. 2차 혼란 효과 포물선 분출",
    });

    // Frame 20: 2차 혼란 완만 하강 호
    frames.push({
      ...baseFrame,
      delay: 40,
      pOffset: isP ? { x: 4, y: -1 } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -4, y: 1 } : { x: 0, y: 0 },
      showEffect: true,
      wave2Prog: 0.68,
      enemyHp: a.enemyHpAfter,
      playerHp: a.playerHpAfter,
      moveStep: 6,
      phaseId: "dizzy-punch-jab2-burst",
      phaseName: "8. 2차 혼란 효과 포물선 분출",
    });

    // Frame 21: 2차 혼란 하강 지속 (여전히 완전 불투명 유지!)
    frames.push({
      ...baseFrame,
      delay: 40,
      pOffset: isP ? { x: 3, y: -1 } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -3, y: 1 } : { x: 0, y: 0 },
      showEffect: true,
      wave2Prog: 0.75,
      enemyHp: a.enemyHpAfter,
      playerHp: a.playerHpAfter,
      moveStep: 6,
      phaseId: "dizzy-punch-jab2-burst",
      phaseName: "8. 2차 혼란 효과 포물선 분출",
    });

    // Frame 22: 2차 혼란 미세 페이드 진입 (alpha ~0.95)
    frames.push({
      ...baseFrame,
      delay: 40,
      pOffset: isP ? { x: 2, y: 0 } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -2, y: 0 } : { x: 0, y: 0 },
      showEffect: true,
      wave2Prog: 0.81,
      enemyHp: a.enemyHpAfter,
      playerHp: a.playerHpAfter,
      moveStep: 6,
      phaseId: "dizzy-punch-jab2-burst",
      phaseName: "8. 2차 혼란 효과 포물선 분출",
    });

    // Frame 23: 2차 혼란 부드러운 페이드 (alpha ~0.65)
    frames.push({
      ...baseFrame,
      delay: 45,
      pOffset: isP ? { x: 2, y: 0 } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -2, y: 0 } : { x: 0, y: 0 },
      showEffect: true,
      wave2Prog: 0.87,
      enemyHp: a.enemyHpAfter,
      playerHp: a.playerHpAfter,
      moveStep: 6,
      phaseId: "dizzy-punch-jab2-burst",
      phaseName: "8. 2차 혼란 효과 포물선 분출",
    });

    // Frame 24: 2차 혼란 페이드 진행 (alpha ~0.35)
    frames.push({
      ...baseFrame,
      delay: 45,
      pOffset: isP ? { x: 1, y: 0 } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -1, y: 0 } : { x: 0, y: 0 },
      showEffect: true,
      wave2Prog: 0.93,
      enemyHp: a.enemyHpAfter,
      playerHp: a.playerHpAfter,
      moveStep: 6,
      phaseId: "dizzy-punch-jab2-burst",
      phaseName: "8. 2차 혼란 효과 포물선 분출",
    });

    // Frame 25: 2차 혼란 마무리 소산 (alpha ~0.10)
    frames.push({
      ...baseFrame,
      delay: 45,
      pOffset: isP ? { x: 1, y: 0 } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -1, y: 0 } : { x: 0, y: 0 },
      showEffect: true,
      wave2Prog: 0.98,
      enemyHp: a.enemyHpAfter,
      playerHp: a.playerHpAfter,
      moveStep: 6,
      phaseId: "dizzy-punch-jab2-burst",
      phaseName: "8. 2차 혼란 효과 포물선 분출",
    });

    // Frame 26: 2차 혼란 완전 소산
    frames.push({
      ...baseFrame,
      delay: 45,
      pOffset: isP ? { x: 1, y: 0 } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -1, y: 0 } : { x: 0, y: 0 },
      showEffect: true,
      wave2Prog: 1.0,
      enemyHp: a.enemyHpAfter,
      playerHp: a.playerHpAfter,
      moveStep: 6,
      phaseId: "dizzy-punch-jab2-burst",
      phaseName: "8. 2차 혼란 효과 포물선 분출",
    });

    // Frame 27: 착지 및 자세 복귀
    frames.push({
      ...baseFrame,
      delay: 50,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
      showEffect: false,
      enemyHp: a.enemyHpAfter,
      playerHp: a.playerHpAfter,
      moveStep: 7,
      phaseId: "dizzy-punch-recovery",
      phaseName: "9. 착지 및 자세 복귀",
    });

    // Frame 28: 완전 복귀
    frames.push({
      ...baseFrame,
      delay: 60,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
      showEffect: false,
      enemyHp: a.enemyHpAfter,
      playerHp: a.playerHpAfter,
      moveStep: 7,
      phaseId: "dizzy-punch-recovery",
      phaseName: "9. 착지 및 자세 복귀",
    });

    return frames;
  },
};
