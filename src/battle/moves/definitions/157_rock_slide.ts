// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawRockSlideEffect, drawRockSlideBehindEffect } from "../../../renderers/moves/gen1/move157_160.js";

/**
 * 157: 스톤샤워 (Rock Slide) - 바위 타입 물리 비접촉 광역기
 *
 * 연출 구성:
 * 1. [시동 & 지면 융기] 시전자가 힘차게 발을 구르며 지면 강타 ➔ 시전자 앞 발밑에서 흙먼지와 자갈 파편이 상공으로 솟구침
 * 2. [바위 샤워 급강하] 상대 상공 전방위에서 여러 크기의 3D 각진 암석들이 맹렬한 속도선과 함께 빗발치듯(소나기) 쏟아져 내림
 * 3. [1차 연쇄 강타] 선발 바위군(0호, 2호)이 상대를 1차 직격 ➔ 타격 섬광 & 십자 스파크 & 상대 찌그러짐
 * 4. [2차 대형 바위 직격 & 대폭쇄] 연이어 메인 초대형 바위(1호)가 굉음과 함께 쾅!! 내리찍음 ➔ 거대한 모래먼지 폭풍 구름 융기 & 사방으로 수십 개 암석 파편 폭발적 비산 & 상대 최대 넉백 진동
 * 5. [파편 바닥 안착 & 먼지 확산] 쪼개진 바위 잔해들이 지면에 굴러떨어지고 자욱한 모래먼지 소산
 * 6. [복귀 & 안정화] 상대 탄성 복귀 및 시전자 정위치 복귀
 */
export const rockSlideMove: BattleMoveAnimation = {
  num: 157,
  key: "rock-slide",
  nameKo: "스톤샤워",
  nameEn: "Rock Slide",
  type: "rock",
  category: "physical",
  camera: { type: "target", zoom: 1.35 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect && !frame.moveStep) return;
    const { attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawRockSlideBehindEffect(targetCtx, attackerPos, targetPos, step, prog);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawRockSlideEffect(targetCtx, attackerPos, targetPos, step, prog);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.35,
      pRot: 0,
      eRot: 0,
    };

    // 절대 규칙 2 준수: 시전자 전용 오프셋 및 탄성 스케일 (수비자는 {0, 0} 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const cScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    // 피격자(수비자) 전용 리액션 오프셋 및 찌그러짐 탄성
    const defOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x, y } : { x: 0, y: 0 },
    });

    const defScale = (x: number, y: number) => ({
      pScale: !isP ? { x, y } : undefined,
      eScale: isP ? { x, y } : undefined,
    });

    return [
      // =======================================================================
      // Phase 1: 시동 & 지면 융기 (Windup & Earth Rupture, Step 1)
      // =======================================================================
      // 1. 시전자 지면을 향해 힘차게 웅크림 (발구르기 충격파/균열 시동)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 6),
        ...cScale(1.10, 0.90),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.25,
        phaseId: "rock-slide-windup",
        phaseName: "1. 시전자 발구르기 힘축적",
      },
      // 2. 발 구르며 지면 파쇄 & 상공으로 흙먼지/자갈 분출
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, -4),
        ...cScale(0.95, 1.06),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.85,
        phaseId: "rock-slide-erupt",
        phaseName: "2. 지면 파쇄 및 자갈 분출",
      },

      // =======================================================================
      // Phase 2: 상공 바위 샤워 급강하 (Rock Shower Plunge, Step 2 - 4프레임 상세 낙하)
      // =======================================================================
      // 3. 상대 머리 위 상공에서 암석 소나기 출현 시작
      {
        ...baseFrame,
        delay: 50,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.15,
        phaseId: "rock-slide-spawn",
        phaseName: "3. 상공 암석 소나기 출현",
      },
      // 4. 1차 바위군 중력 가속도로 속도선을 뿜으며 급강하
      {
        ...baseFrame,
        delay: 50,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.40,
        phaseId: "rock-slide-plunge-1",
        phaseName: "4. 1차 암석군 급강하 쇄도",
      },
      // 5. 1차 바위군 지면 접근 및 선두 바위 착지
      {
        ...baseFrame,
        delay: 50,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.68,
        phaseId: "rock-slide-plunge-2",
        phaseName: "5. 1차 암석군 지면 접근 및 선두 착지",
      },
      // 6. 1차 바위군 연속 착지 완료
      {
        ...baseFrame,
        delay: 50,
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.95,
        phaseId: "rock-slide-plunge-3",
        phaseName: "6. 1차 암석군 연속 착지",
      },

      // =======================================================================
      // Phase 3: 2차 바위 소나기 연쇄 급강하 및 타격 (Second Wave Plunge, Step 3 - 4프레임)
      // =======================================================================
      // 7. 2차 후발 암석군 상공 진입
      {
        ...baseFrame,
        delay: 50,
        ...defOff(2, -1),
        ...defScale(1.06, 0.94),
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.20,
        phaseId: "rock-slide-wave2-entry",
        phaseName: "7. 2차 암석 소나기 상공 진입",
      },
      // 8. 2차 암석군 연속 직격 (타격 섬광 & 찌그러짐)
      {
        ...baseFrame,
        delay: 50,
        ...defOff(3, -2),
        ...defScale(1.12, 0.88),
        showEffect: true,
        hitFlash: true,
        moveStep: 3,
        effectProgress: 0.45,
        phaseId: "rock-slide-wave2-hit1",
        phaseName: "8. 2차 암석군 연속 직격 (타격 섬광)",
      },
      // 9. 2차 암석군 파편 비산 및 추가 바위 착지
      {
        ...baseFrame,
        delay: 50,
        ...defOff(-3, 2),
        ...defScale(0.92, 1.08),
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.70,
        phaseId: "rock-slide-wave2-hit2",
        phaseName: "9. 2차 암석군 연속 타격 및 파편 비산",
      },
      // 10. 초대형 메인 바위 상공 육박 (마지막 바위 낙하 전 템포 확보)
      {
        ...baseFrame,
        delay: 85,
        ...defOff(1, -1),
        ...defScale(1.02, 0.98),
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.95,
        phaseId: "rock-slide-wave2-looming",
        phaseName: "10. 초대형 메인 바위 상공 육박",
      },

      // =======================================================================
      // Phase 4: 메인 초대형 바위 직격 & 대폭쇄 (Heavy Boulder Slam, Step 4 - 3프레임)
      // =======================================================================
      // 11. 초대형 바위 초고속 수직 급강하
      {
        ...baseFrame,
        delay: 45,
        ...defOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.20,
        phaseId: "rock-slide-heavy-plunge",
        phaseName: "11. 초대형 바위 수직 급강하",
      },
      // 12. 초대형 바위가 지면과 상대를 쾅!! 내리찍음 (최대 히트 플래시)
      {
        ...baseFrame,
        delay: 65,
        ...defOff(5, 4),
        ...defScale(1.22, 0.78),
        showEffect: true,
        hitFlash: true,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 4,
        effectProgress: 0.50,
        phaseId: "rock-slide-heavy-slam",
        phaseName: "12. 메인 거대 암석 격돌 (쾅!!)",
      },
      // 13. 사방으로 22개 암석 파편 폭발적 비산
      {
        ...baseFrame,
        delay: 75,
        ...defOff(-4, -2),
        ...defScale(0.88, 1.12),
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 4,
        effectProgress: 0.85,
        phaseId: "rock-slide-heavy-burst",
        phaseName: "13. 암석 파쇄 폭풍 비산",
      },

      // =======================================================================
      // Phase 5: 파편 바닥 안착 & 먼지 구름 확산 (Debris Settle, Step 5)
      // =======================================================================
      // 9. 파쇄된 바위 잔해들 지면에 안착 & 자욱한 모래먼지 연막
      {
        ...baseFrame,
        delay: 80,
        ...defOff(2, 0),
        ...defScale(1.04, 0.96),
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 5,
        effectProgress: 0.35,
        phaseId: "rock-slide-debris-settle",
        phaseName: "9. 바위 잔해 지면 안착 & 먼지 연막",
      },
      // 10. 모래먼지 서서히 걷히기 시작 & 상대 안정화
      {
        ...baseFrame,
        delay: 80,
        ...defOff(0, 0),
        ...defScale(1.0, 1.0),
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 5,
        effectProgress: 0.85,
        phaseId: "rock-slide-dust-fade",
        phaseName: "10. 모래먼지 감쇄 및 상대 안정화",
      },

      // =======================================================================
      // Phase 6: 피날레 복귀 (Recovery & Finale, Step 6)
      // =======================================================================
      // 11. 피날레 복귀 (카메라 글라이드 아웃 연동을 위해 moveStep: 6 명시)
      {
        ...baseFrame,
        delay: 70,
        showEffect: true,
        hitFlash: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 6,
        effectProgress: 1.0,
        phaseId: "rock-slide-recover",
        phaseName: "11. 피날레 복귀 및 안정화",
      },
    ];
  },
};
