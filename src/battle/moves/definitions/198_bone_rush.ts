// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawBoneRushBehindEffect,
  drawBoneRushEffect,
} from "../../../renderers/moves/gen1/move197_200.js";

/**
 * 198: 본러시 (Bone Rush) - 땅 타입 물리 연속 공격 기술 (위력 25 x 2~5회, 명중 90%)
 *
 * 연출 구성 (유저 피드백 100% 반영: 고밀도 프레임 & 십자선 제거):
 * 1. 뼈 에셋: 뼈다귀치기/뼈다귀부메랑(drawCartoonBone) 포켓몬 정통 뼈다귀 활용
 * 2. 뼈다귀치기(125 Bone Club)의 촘촘한 45ms 단위 비행 프레임 완벽 계승:
 *    - 뼈가 끊김 없이 물 흐르듯 포물선을 그리며 날아가는 고밀도 비행 프레임 (4~5단계 궤적)
 *    - 타격 시 십자선 완전 제거, 순수 뼈 닿음 & 피격자 스쿼시만 정갈하게 표현
 * 3. 4연속 투척 콤보 시퀀스:
 *    - [와인드업] ➔ [1번 뼈 4단계 비행 & 톡!] ➔ [2번 뼈 4단계 비행 & 톡!]
 *    ➔ [3번 뼈 4단계 비행 & 톡!] ➔ [4번 피니시 뼈 고각 쇄도 & 쾅!] ➔ [우측 바운스 튕김 & 복귀]
 */
export const boneRushMove: BattleMoveAnimation = {
  num: 198,
  key: "bone-rush",
  nameKo: "본러시",
  nameEn: "Bone Rush",
  type: "ground",
  category: "physical",
  camera: { type: "target", zoom: 1.25, inlineGlideInFrames: 5 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawBoneRushBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawBoneRushEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.25,
      pRot: 0,
      eRot: 0,
      hitFlash: false,
    };

    // 시전자 오프셋 헬퍼
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 피격자 스쿼시/넉백 헬퍼 (톡! 칠 때 대상 포켓몬 살짝 납작)
    const targetSquash = (scaleX: number, scaleY: number, offX: number, offY: number) => ({
      pScale: !isP ? { x: scaleX, y: scaleY } : undefined,
      eScale: isP ? { x: scaleX, y: scaleY } : undefined,
      pOffset: !isP ? { x: -offX, y: offY } : { x: 0, y: 0 },
      eOffset: isP ? { x: offX, y: offY } : { x: 0, y: 0 },
    });

    // -------------------------------------------------------------
    // Miss인 경우 (!isHit)
    // -------------------------------------------------------------
    if (!isHit) {
      return [
        {
          ...baseFrame,
          delay: 85,
          ...cOff(-8, 3),
          showEffect: true,
          moveStep: 1,
          effectProgress: 0.0,
          phaseId: "bone-rush-miss-windup",
          phaseName: "1. 뼈다귀 연속 투척 준비",
        },
        {
          ...baseFrame,
          delay: 45,
          ...cOff(10, -3),
          showEffect: true,
          moveStep: 2,
          effectProgress: 0.30,
          phaseId: "bone-rush-miss-throw1-fly1",
          phaseName: "2. 1번 뼈 투척 비행 #1",
        },
        {
          ...baseFrame,
          delay: 45,
          ...cOff(6, -2),
          showEffect: true,
          moveStep: 2,
          effectProgress: 0.65,
          phaseId: "bone-rush-miss-throw1-fly2",
          phaseName: "3. 1번 뼈 투척 비행 #2",
        },
        {
          ...baseFrame,
          delay: 70,
          ...cOff(2, -1),
          // 상대방이 뒤로 백스텝 회피
          ...(isP ? { eOffset: { x: 14, y: -4 } } : { pOffset: { x: -14, y: 4 } }),
          showEffect: true,
          moveStep: 2,
          effectProgress: 0.95,
          phaseId: "bone-rush-miss-dodge",
          phaseName: "4. 상대방 백스텝 회피",
        },
        {
          ...baseFrame,
          delay: 55,
          ...cOff(12, -3),
          ...(isP ? { eOffset: { x: 12, y: -3 } } : { pOffset: { x: -12, y: 3 } }),
          showEffect: true,
          moveStep: 3,
          effectProgress: 0.50,
          phaseId: "bone-rush-miss-throw2",
          phaseName: "5. 2번 뼈 헛투척 후 멈칫",
        },
        {
          ...baseFrame,
          delay: 80,
          ...cOff(0, 0),
          ...(isP ? { eOffset: { x: 0, y: 0 } } : { pOffset: { x: 0, y: 0 } }),
          showEffect: false,
          moveStep: 6,
          effectProgress: 1.0,
          phaseId: "bone-rush-miss-return",
          phaseName: "6. 정위치 복귀",
        },
      ];
    }

    // -------------------------------------------------------------
    // Hit인 경우 (isHit) - 촘촘한 고밀도 프레임 연속 투척 시퀀스 (26프레임)
    // -------------------------------------------------------------
    return [
      // 1. 연속 투척 준비 와인드업 (몸을 뒤로 살짝 젖히며 뼈다귀 장전)
      {
        ...baseFrame,
        delay: 85,
        ...cOff(-10, 4),
        pScale: isP ? { x: 1.06, y: 0.94 } : undefined,
        eScale: !isP ? { x: 1.06, y: 0.94 } : undefined,
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.0,
        phaseId: "bone-rush-windup",
        phaseName: "1. 뼈다귀 연속 투척 와인드업",
      },

      // === [1차 투척 (1타)] ===
      // 2. 1번 뼈 비행 #1 - 발진 및 초기 상승
      {
        ...baseFrame,
        delay: 45,
        ...cOff(12, -4),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.15,
        phaseId: "bone-rush-throw-1-fly-1",
        phaseName: "2. 1번 뼈 포물선 발진",
      },
      // 3. 1번 뼈 비행 #2 - 고각 포물선 상승
      {
        ...baseFrame,
        delay: 45,
        ...cOff(8, -2),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.40,
        phaseId: "bone-rush-throw-1-fly-2",
        phaseName: "3. 1번 뼈 포물선 상승",
      },
      // 4. 1번 뼈 비행 #3 - 정점 통과 및 하강 진입
      {
        ...baseFrame,
        delay: 45,
        ...cOff(2, -1),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.65,
        phaseId: "bone-rush-throw-1-fly-3",
        phaseName: "4. 1번 뼈 상공 정점 통과",
      },
      // 5. 1번 뼈 비행 #4 - 상대 머리를 향해 쇄도
      {
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.86,
        phaseId: "bone-rush-throw-1-fly-4",
        phaseName: "5. 1번 뼈 상대 머리 쇄도",
      },
      // 6. 1번 뼈 톡! 직격 (1타) & 피격자 납작 (십자선 없이 뼈 닿음만 또렷이)
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...targetSquash(1.16, 0.84, 4, 6),
        showEffect: true,
        hitFlash: true,
        moveStep: 2,
        effectProgress: 0.98,
        phaseId: "bone-rush-throw-1-hit",
        phaseName: "6. 1번 뼈 톡! 머리 직격",
      },

      // === [2차 투척 (2타)] ===
      // 7. 2번 뼈 비행 #1 - 2번 뼈 발진 & 1번 뼈 우측 튕김 시작
      {
        ...baseFrame,
        delay: 45,
        ...cOff(12, -4),
        ...targetSquash(0.92, 1.08, 2, -2),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.15,
        phaseId: "bone-rush-throw-2-fly-1",
        phaseName: "7. 2번 뼈 발진 (1번 뼈 튕김 시작)",
      },
      // 8. 2번 뼈 비행 #2 - 2번 뼈 상승 & 1번 뼈 튕김 진행
      {
        ...baseFrame,
        delay: 45,
        ...cOff(8, -2),
        ...targetSquash(1.0, 1.0, 0, 0),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.40,
        phaseId: "bone-rush-throw-2-fly-2",
        phaseName: "8. 2번 뼈 상승 (1번 뼈 우측 비산)",
      },
      // 9. 2번 뼈 비행 #3 - 2번 뼈 정점 통과
      {
        ...baseFrame,
        delay: 45,
        ...cOff(2, -1),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.65,
        phaseId: "bone-rush-throw-2-fly-3",
        phaseName: "9. 2번 뼈 정점 통과",
      },
      // 10. 2번 뼈 비행 #4 - 2번 뼈 하강 쇄도
      {
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.86,
        phaseId: "bone-rush-throw-2-fly-4",
        phaseName: "10. 2번 뼈 하강 쇄도",
      },
      // 11. 2번 뼈 톡! 직격 (2타) & 피격자 납작
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...targetSquash(1.16, 0.84, 5, 5),
        showEffect: true,
        hitFlash: true,
        moveStep: 3,
        effectProgress: 0.98,
        phaseId: "bone-rush-throw-2-hit",
        phaseName: "11. 2번 뼈 톡! 머리 직격",
      },

      // === [3차 투척 (3타)] ===
      // 12. 3번 뼈 비행 #1 - 3번 뼈 발진 & 2번 뼈 튕김 시작
      {
        ...baseFrame,
        delay: 45,
        ...cOff(12, -4),
        ...targetSquash(0.94, 1.06, 2, -2),
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.15,
        phaseId: "bone-rush-throw-3-fly-1",
        phaseName: "12. 3번 뼈 발진 (2번 뼈 튕김)",
      },
      // 13. 3번 뼈 비행 #2 - 3번 뼈 상승
      {
        ...baseFrame,
        delay: 45,
        ...cOff(8, -2),
        ...targetSquash(1.0, 1.0, 0, 0),
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.40,
        phaseId: "bone-rush-throw-3-fly-2",
        phaseName: "13. 3번 뼈 상승",
      },
      // 14. 3번 뼈 비행 #3 - 3번 뼈 정점 통과
      {
        ...baseFrame,
        delay: 45,
        ...cOff(2, -1),
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.65,
        phaseId: "bone-rush-throw-3-fly-3",
        phaseName: "14. 3번 뼈 정점 통과",
      },
      // 15. 3번 뼈 비행 #4 - 3번 뼈 하강 쇄도
      {
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.86,
        phaseId: "bone-rush-throw-3-fly-4",
        phaseName: "15. 3번 뼈 하강 쇄도",
      },
      // 16. 3번 뼈 톡! 직격 (3타) & 피격자 납작
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        ...targetSquash(1.18, 0.82, 6, 6),
        showEffect: true,
        hitFlash: true,
        moveStep: 4,
        effectProgress: 0.98,
        phaseId: "bone-rush-throw-3-hit",
        phaseName: "16. 3번 뼈 톡! 머리 직격",
      },

      // === [4차 투척 피니시 (4타)] ===
      // 17. 4번 피니시 뼈 비행 #1 - 시전자 크게 젖히며 발진 (3번 뼈 튕김)
      {
        ...baseFrame,
        delay: 45,
        ...cOff(14, -6),
        ...targetSquash(0.96, 1.04, 2, -2),
        showEffect: true,
        moveStep: 5,
        effectProgress: 0.12,
        phaseId: "bone-rush-throw-4-fly-1",
        phaseName: "17. 4번 피니시 뼈 발진 (3번 뼈 튕김)",
      },
      // 18. 4번 피니시 뼈 비행 #2 - 95px 상공 고각 상승
      {
        ...baseFrame,
        delay: 45,
        ...cOff(10, -4),
        ...targetSquash(1.0, 1.0, 0, 0),
        showEffect: true,
        moveStep: 5,
        effectProgress: 0.38,
        phaseId: "bone-rush-throw-4-fly-2",
        phaseName: "18. 4번 피니시 뼈 고각 상승",
      },
      // 19. 4번 피니시 뼈 비행 #3 - 최고 상공 정점 통과
      {
        ...baseFrame,
        delay: 45,
        ...cOff(4, -2),
        showEffect: true,
        moveStep: 5,
        effectProgress: 0.62,
        phaseId: "bone-rush-throw-4-fly-3",
        phaseName: "19. 4번 피니시 뼈 상공 정점 통과",
      },
      // 20. 4번 피니시 뼈 비행 #4 - 정수리 급강하 수직 쇄도
      {
        ...baseFrame,
        delay: 45,
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 5,
        effectProgress: 0.86,
        phaseId: "bone-rush-throw-4-fly-4",
        phaseName: "20. 4번 피니시 뼈 급강하 쇄도",
      },
      // 21. 4번 뼈 쾅! 피니시 머리 직격! (스쿼시 강화 & 십자선 없음)
      {
        ...baseFrame,
        delay: 100,
        ...cOff(0, 0),
        ...targetSquash(1.24, 0.76, 4, 8),
        showEffect: true,
        hitFlash: true,
        moveStep: 5,
        effectProgress: 0.98,
        phaseId: "bone-rush-throw-4-hit",
        phaseName: "21. 4번 뼈 쾅! 피니시 머리 직격",
      },

      // === [피니시 뼈 튕겨나감 및 소멸 복귀] ===
      // 22. 4번 뼈 우측 튕겨나감 #1 - 우상향 바운스
      {
        ...baseFrame,
        delay: 50,
        ...cOff(4, -1),
        ...targetSquash(0.94, 1.06, 2, -2),
        showEffect: true,
        moveStep: 6,
        effectProgress: 0.25,
        phaseId: "bone-rush-ricochet-1",
        phaseName: "22. 4번 뼈 우측 튕겨나감 #1",
      },
      // 23. 4번 뼈 우측 튕겨나감 #2 - 우하향 바운스 회전
      {
        ...baseFrame,
        delay: 50,
        ...cOff(2, 0),
        ...targetSquash(1.0, 1.0, 0, 0),
        showEffect: true,
        moveStep: 6,
        effectProgress: 0.55,
        phaseId: "bone-rush-ricochet-2",
        phaseName: "23. 4번 뼈 우측 튕겨나감 #2",
      },
      // 24. 4번 뼈 우측 튕겨나감 #3 - 페이드 소멸 진행
      {
        ...baseFrame,
        delay: 55,
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 6,
        effectProgress: 0.85,
        phaseId: "bone-rush-ricochet-3",
        phaseName: "24. 4번 뼈 페이드 소멸 진행",
      },
      // 25. 정위치 복귀
      {
        ...baseFrame,
        delay: 75,
        ...cOff(0, 0),
        showEffect: false,
        moveStep: 6,
        effectProgress: 1.0,
        phaseId: "bone-rush-settle",
        phaseName: "25. 정위치 복귀",
      },
    ];
  },
};
