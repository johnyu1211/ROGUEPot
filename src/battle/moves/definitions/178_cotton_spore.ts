// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawCottonSporeBehindEffect,
  drawCottonSporeEffect,
} from "../../../renderers/moves/gen1/move177_180.js";

/**
 * 178: 목화포자 (Cotton Spore) - 풀 타입 변화 기술 (스피드 2랭크 하강)
 *
 * 위력: - / 명중: 100 / PP: 40 / 접촉 판정: X
 * 설명: 솜처럼 폭신폭신한 포자를 착 달라붙게 해서 상대의 스피드를 크게 떨어뜨린다.
 *
 * [연출 기승전결 시퀀스]:
 * 1. Step 1: 시전자 포자 방출 & 털어내기 (Scatter & Windup)
 *    - 시전자가 몸을 톡톡 털어내며 바운스, 주변에 보송보송한 목화 솜뭉치들과 미세 홀씨 입자 피어오름
 * 2. Step 2: 솜뭉치 공중 부유 & 쇄도 (Floating Spore Drift Across Field)
 *    - 가벼운 목화 솜뭉치들이 바람을 타고 S자 곡선 나선 궤적으로 대각선 부유 쇄도
 *    - 카메라 타겟 스무스 글라이드 포커싱
 * 3. Step 3: 상대 전신 착탄 & 찰싹 밀착 (Clinging Impact - '착 달라붙음!')
 *    - 솜뭉치들이 상대방의 머리, 어깨, 몸통, 발치에 퐁퐁퐁 찰싹 달라붙으며 탄성 바운스
 *    - 피격자 당황하여 주춤 & 좌우 흔들림
 * 4. Step 4: 결박 무게감 & 스피드 2랭크 급하락 (Weighed Down & Harsh Speed Debuff)
 *    - 전신을 뒤덮은 솜뭉치들에 짓눌려 둔해진 반응 (Squash & 묵직한 진동)
 *    - 스피드 2랭크 급하락 하강 화살표 파티클 & 속도 감속 기류선 연쇄 작렬
 * 5. Step 5: 소산 & 안정 복귀 (Soft Dissipation & Recovery)
 *    - 솜뭉치들이 부드러운 솜털 홀씨 가루로 분해되어 대기 중으로 승화 페이드아웃
 *    - 양쪽 포켓몬 안정 정위치 복귀
 */
export const cottonSporeMove: BattleMoveAnimation = {
  num: 178,
  key: "cotton-spore",
  nameKo: "목화포자",
  nameEn: "Cotton Spore",
  type: "grass",
  category: "status",
  camera: {
    type: "caster_to_target",
    zoom: 1.32,
    delayUntilStep: 2,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawCottonSporeBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawCottonSporeEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      pRot: 0,
      eRot: 0,
    };

    // 공격자 오프셋 / 대상 오프셋 분기 헬퍼
    const actorOffset = (ax: number, ay: number) => (isP ? { pOffset: { x: ax, y: ay } } : { eOffset: { x: -ax, y: -ay } });
    const targetOffset = (tx: number, ty: number) => (isP ? { eOffset: { x: tx, y: ty } } : { pOffset: { x: -tx, y: -ty } });
    const actorScale = (sx: number, sy: number) => ({
      pScale: isP ? { x: sx, y: sy } : undefined,
      eScale: !isP ? { x: sx, y: sy } : undefined,
    });
    const targetScale = (sx: number, sy: number) => ({
      pScale: !isP ? { x: sx, y: sy } : undefined,
      eScale: isP ? { x: sx, y: sy } : undefined,
    });

    // -------------------------------------------------------------
    // Miss인 경우: 대상이 뒤로 쓱 물러나며 솜뭉치가 허공으로 날아가 소산
    // -------------------------------------------------------------
    if (!isHit) {
      return [
        // #1. 포자 방출
        {
          ...baseFrame,
          delay: 85,
          ...actorOffset(-3, 2),
          ...targetOffset(0, 0),
          ...actorScale(1.05, 0.95),
          showEffect: true,
          showBehindEffect: true,
          moveStep: 1,
          cottonWindupProg: 0.60,
          phaseId: "cotton-spore-miss-windup",
          phaseName: "1. 포자 방출",
        },
        // #2. 포자 날아감 & 대상 회피 (물러남)
        {
          ...baseFrame,
          delay: 85,
          ...actorOffset(0, 0),
          ...targetOffset(14, 0),
          showEffect: true,
          showBehindEffect: true,
          moveStep: 2,
          sporeFlightProg: 0.70,
          phaseId: "cotton-spore-miss-dodge",
          phaseName: "2. 대상 회피 (포자 빗나감)",
        },
        // #3. 포자 허공 소산
        {
          ...baseFrame,
          delay: 85,
          ...actorOffset(0, 0),
          ...targetOffset(8, 0),
          showEffect: true,
          showBehindEffect: false,
          moveStep: 5,
          dissipationProgress: 0.80,
          phaseId: "cotton-spore-miss-dissipate",
          phaseName: "3. 포자 허공 소산",
        },
        // #4. 정위치 복귀
        {
          ...baseFrame,
          delay: 70,
          ...actorOffset(0, 0),
          ...targetOffset(0, 0),
          showEffect: false,
          showBehindEffect: false,
          moveStep: 6,
          phaseId: "cotton-spore-miss-finish",
          phaseName: "4. 정위치 복귀",
        },
      ];
    }

    // -------------------------------------------------------------
    // Normal Hit: 전신 착탄 ('착 달라붙음!') & 스피드 2랭크 급하락
    // -------------------------------------------------------------
    return [
      // =======================================================================
      // Step 1: 시전자 웅크림 및 몸 털기 방출 (Windup & Scatter - 3프레임)
      // =======================================================================
      // #1. 시전자 웅크림 & 1차 포자 싹틈
      {
        ...baseFrame,
        delay: 85,
        ...actorOffset(-3, 2),
        ...targetOffset(0, 0),
        ...actorScale(1.05, 0.95),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 1,
        cottonWindupProg: 0.30,
        phaseId: "cotton-spore-windup-1",
        phaseName: "#1. 시전자 웅크림 (포자 싹틈)",
      },
      // #2. 시전자 바운스 털어내기 & 포자 퐁퐁 분출
      {
        ...baseFrame,
        delay: 85,
        ...actorOffset(4, -3),
        ...targetOffset(0, 0),
        ...actorScale(0.95, 1.05),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 1,
        cottonWindupProg: 0.85,
        phaseId: "cotton-spore-windup-2",
        phaseName: "#2. 시전자 바운스 털어내기 (포자 분출)",
      },
      // #3. 방출된 포자 대기 부유
      {
        ...baseFrame,
        delay: 75,
        ...actorOffset(2, -1),
        ...targetOffset(0, 0),
        ...actorScale(1.0, 1.0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 1,
        cottonWindupProg: 1.0,
        phaseId: "cotton-spore-windup-3",
        phaseName: "#3. 방출된 포자 대기 부유",
      },

      // =======================================================================
      // Step 2: 솜뭉치 공중 비행 쇄도 (Floating Spore Drift - 4프레임)
      // =======================================================================
      // #4. 솜뭉치 공중 비행 쇄도 (1)
      {
        ...baseFrame,
        delay: 65,
        ...actorOffset(0, 0),
        ...targetOffset(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 2,
        sporeFlightProg: 0.20,
        phaseId: "cotton-spore-flight-1",
        phaseName: "#4. 솜뭉치 공중 비행 쇄도 (1)",
      },
      // #5. 솜뭉치 공중 비행 쇄도 (2)
      {
        ...baseFrame,
        delay: 65,
        ...actorOffset(0, 0),
        ...targetOffset(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 2,
        sporeFlightProg: 0.45,
        phaseId: "cotton-spore-flight-2",
        phaseName: "#5. 솜뭉치 공중 비행 쇄도 (2)",
      },
      // #6. 솜뭉치 공중 비행 쇄도 (3)
      {
        ...baseFrame,
        delay: 65,
        ...actorOffset(0, 0),
        ...targetOffset(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 2,
        sporeFlightProg: 0.70,
        phaseId: "cotton-spore-flight-3",
        phaseName: "#6. 솜뭉치 공중 비행 쇄도 (3)",
      },
      // #7. 솜뭉치 대상 목전 육박 (4)
      {
        ...baseFrame,
        delay: 65,
        ...actorOffset(0, 0),
        ...targetOffset(0, 0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 2,
        sporeFlightProg: 0.95,
        phaseId: "cotton-spore-flight-4",
        phaseName: "#7. 솜뭉치 대상 목전 육박 (4)",
      },

      // =======================================================================
      // Step 3: 상대방 전신 착탄 & 찰싹 밀착 ('착 달라붙음!') (Clinging Impact - 3프레임)
      // =======================================================================
      // #8. 대상 전신 착탄 & 솜뭉치 찰싹 밀착 (1)
      {
        ...baseFrame,
        delay: 85,
        ...actorOffset(0, 0),
        ...targetOffset(5, -2),
        ...targetScale(0.94, 1.06),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 3,
        clingProg: 0.35,
        impactPop: true,
        phaseId: "cotton-spore-impact-1",
        phaseName: "#8. 전신 착탄 & 솜뭉치 찰싹 밀착 (1)",
      },
      // #9. 솜뭉치 부풀어 오름 & 대상 깜짝 흔들림 (2)
      {
        ...baseFrame,
        delay: 85,
        ...actorOffset(0, 0),
        ...targetOffset(-4, 2),
        ...targetScale(1.06, 0.95),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 3,
        clingProg: 0.70,
        phaseId: "cotton-spore-impact-2",
        phaseName: "#9. 솜뭉치 부풀어 오름 & 대상 흔들림 (2)",
      },
      // #10. 전신 완전 결박 안착 (3)
      {
        ...baseFrame,
        delay: 85,
        ...actorOffset(0, 0),
        ...targetOffset(2, -1),
        ...targetScale(1.02, 0.98),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 3,
        clingProg: 1.00,
        phaseId: "cotton-spore-impact-3",
        phaseName: "#10. 전신 완전 결박 안착 (3)",
      },

      // =======================================================================
      // Step 4: 결박 무게감 & 짓눌림 둔화 반응 (Weighed Down & Struggling - 2프레임)
      // =======================================================================
      // #11. 무거운 솜뭉치 짓누름 & 둔화 반응
      {
        ...baseFrame,
        delay: 95,
        ...actorOffset(0, 0),
        ...targetOffset(-3, 3),
        ...targetScale(1.06, 0.94),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 4,
        clingProg: 1.0,
        phaseId: "cotton-spore-weighed-1",
        phaseName: "#11. 무거운 솜뭉치 짓누름 (둔화 반응 1)",
      },
      // #12. 짓눌린 둔화 전율 & 묵직한 호흡
      {
        ...baseFrame,
        delay: 95,
        ...actorOffset(0, 0),
        ...targetOffset(3, 1),
        ...targetScale(1.04, 0.96),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 4,
        clingProg: 1.0,
        phaseId: "cotton-spore-weighed-2",
        phaseName: "#12. 짓눌린 둔화 전율 (묵직한 호흡 2)",
      },

      // =======================================================================
      // Step 5: 소산 & 안정 복귀 (Soft Dissipation & Recovery - 2프레임)
      // =======================================================================
      // #13. 솜뭉치 솜털 홀씨로 부드러운 승화 소산
      {
        ...baseFrame,
        delay: 90,
        ...actorOffset(0, 0),
        ...targetOffset(0, 0),
        ...targetScale(1.0, 1.0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 5,
        dissipationProgress: 0.50,
        phaseId: "cotton-spore-dissolve-1",
        phaseName: "#13. 솜뭉치 솜털 홀씨로 부드러운 승화 소산",
      },
      // #14. 솜털 대기 비산 & 복귀
      {
        ...baseFrame,
        delay: 80,
        ...actorOffset(0, 0),
        ...targetOffset(0, 0),
        ...targetScale(1.0, 1.0),
        showEffect: true,
        showBehindEffect: true,
        moveStep: 5,
        dissipationProgress: 0.95,
        phaseId: "cotton-spore-dissolve-2",
        phaseName: "#14. 솜털 대기 비산 & 복귀",
      },
      // #15. 기술 연출 종료 & 정위치 복귀 (이후 기본 랭크다운 연출 자동 재생)
      {
        ...baseFrame,
        delay: 70,
        ...actorOffset(0, 0),
        ...targetOffset(0, 0),
        showEffect: false,
        showBehindEffect: false,
        moveStep: 6,
        phaseId: "cotton-spore-finish",
        phaseName: "#15. 기술 연출 종료 (정위치 복귀)",
      },
    ];
  },
};
