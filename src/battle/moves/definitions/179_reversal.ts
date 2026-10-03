import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawReversalBehindEffect,
  drawReversalEffect,
} from "../../../renderers/moves/gen1/move177_180.js";

/**
 * 179: 기사회생 (Reversal) - 5세대 고증 3D 회전 구체 & 잔상 연출
 *
 * 연출 시퀀스 (유저 요청 반영):
 * 1. 시전포켓몬 줌인 (카메라 시전자 포커싱)
 * 2. 1번 회전: 잔상을 남기는 3D 구체 1개가 시전포켓몬 둘레를 회전 (z축 뒤로 ➔ 앞으로 3D 입체)
 * 3. 2번째 회전: 구체 2개로 변함 (아래쪽에 추가 구체 생성) 둘레를 함께 3D 회전
 * 4. 다시 1개로 변함
 */
export const reversalMove: BattleMoveAnimation = {
  num: 179,
  key: "reversal",
  nameKo: "기사회생",
  nameEn: "Reversal",
  type: "fighting",
  category: "physical",
  camera: {
    type: "caster_to_target",
    zoom: 1.35,
    delayUntilStep: 99, // 시전자 줌인 유지
    inlineGlideInFrames: 3, // 카메라 줌인이 진행되는 동안에도 회전이 정지되지 않고 매끄럽게 진행
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawReversalBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawReversalEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const cOff = (x: number, y: number) =>
      isP ? { pOffset: { x, y } } : { eOffset: { x: -x, y: -y } };

    const cTargetOff = (x: number, y: number) =>
      isP ? { eOffset: { x, y } } : { pOffset: { x: -x, y: -y } };

    const cTransform = (scaleX: number, scaleY: number, rot: number) => ({
      pScale: isP ? { x: scaleX, y: scaleY } : undefined,
      eScale: !isP ? { x: scaleX, y: scaleY } : undefined,
      pRot: isP ? rot : 0,
      eRot: !isP ? -rot : 0,
    });

    const hitEnemyHp = isP ? (isHit ? a.enemyHpAfter : enemyHp) : enemyHp;
    const hitPlayerHp = !isP ? (isHit ? a.playerHpAfter : playerHp) : playerHp;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      pRot: 0,
      eRot: 0,
      pOffset: { x: 0, y: 0 },
      eOffset: { x: 0, y: 0 },
      showYellowAura: true,
    };

    return [
      // 0. 시전포켓몬 줌인 & 은은한 반투명 흰색 번쩍임 (회전 정지 없이 3D 회전 연속 시작)
      {
        ...baseFrame,
        delay: 45,
        showEffect: true,
        showBehindEffect: true,
        showYellowAura: true,
        whiteAlpha: 0.35,
        orbAngle: -0.78,
        orbCount: 1,
        moveStep: 1,
        phaseId: "reversal-zoom-flash",
        phaseName: "0. 시전포켓몬 줌인 & 섬광",
      },
      {
        ...baseFrame,
        delay: 45,
        showEffect: true,
        showBehindEffect: true,
        whiteAlpha: 0.15,
        orbAngle: 0.0,
        orbCount: 1,
        moveStep: 1,
        phaseId: "reversal-orb-spawn",
        phaseName: "1. 구체 출현",
      },

      // =======================================================================
      // 1번 회전: 구체 1개가 z축(앞/뒤)을 관통하며 3D 회전
      // =======================================================================
      {
        ...baseFrame,
        delay: 45,
        showEffect: true,
        showBehindEffect: true,
        whiteAlpha: 0.0,
        orbAngle: 0.78, // 전면 우측
        orbCount: 1,
        moveStep: 1,
        phaseId: "reversal-rot1-1",
        phaseName: "1-1. 1차 회전 (앞쪽 우측)",
      },
      {
        ...baseFrame,
        delay: 45,
        showEffect: true,
        showBehindEffect: true,
        orbAngle: 1.57, // 전면 중앙 (앞)
        orbCount: 1,
        moveStep: 1,
        phaseId: "reversal-rot1-2",
        phaseName: "1-2. 1차 회전 (앞쪽 중앙)",
      },
      {
        ...baseFrame,
        delay: 45,
        showEffect: true,
        showBehindEffect: true,
        orbAngle: 2.35, // 전면 좌측
        orbCount: 1,
        moveStep: 1,
        phaseId: "reversal-rot1-3",
        phaseName: "1-3. 1차 회전 (앞쪽 좌측)",
      },
      {
        ...baseFrame,
        delay: 45,
        showEffect: true,
        showBehindEffect: true,
        orbAngle: 3.14, // 좌측 에지 ➔ 등 뒤로 전환
        orbCount: 1,
        moveStep: 1,
        phaseId: "reversal-rot1-4",
        phaseName: "1-4. 1차 회전 (좌측 통과)",
      },
      {
        ...baseFrame,
        delay: 45,
        showEffect: true,
        showBehindEffect: true,
        orbAngle: 3.92, // 등 뒤 좌측 (behind 레이어)
        orbCount: 1,
        moveStep: 1,
        phaseId: "reversal-rot1-5",
        phaseName: "1-5. 1차 회전 (등 뒤 좌측)",
      },
      {
        ...baseFrame,
        delay: 45,
        showEffect: true,
        showBehindEffect: true,
        orbAngle: 4.71, // 등 뒤 중앙 (behind 레이어)
        orbCount: 1,
        moveStep: 1,
        phaseId: "reversal-rot1-6",
        phaseName: "1-6. 1차 회전 (등 뒤 중앙)",
      },
      {
        ...baseFrame,
        delay: 45,
        showEffect: true,
        showBehindEffect: true,
        orbAngle: 5.49, // 등 뒤 우측 (behind 레이어 ➔ 앞쪽으로 복귀)
        orbCount: 1,
        moveStep: 1,
        phaseId: "reversal-rot1-7",
        phaseName: "1-7. 1차 회전 (등 뒤 우측)",
      },

      // =======================================================================
      // 2번째 회전: 2개로 변함 (아래쪽에 구체 추가) 3D 회전
      // =======================================================================
      {
        ...baseFrame,
        delay: 45,
        showEffect: true,
        showBehindEffect: true,
        orbAngle: 6.28, // 2차 회전 시작 & 하단 구체 생성
        orbCount: 2,
        moveStep: 1,
        phaseId: "reversal-rot2-1",
        phaseName: "2-1. 2차 회전 (2개로 변함: 하단 추가)",
      },
      {
        ...baseFrame,
        delay: 45,
        showEffect: true,
        showBehindEffect: true,
        orbAngle: 7.06, // 앞쪽 우측 (2개 동시)
        orbCount: 2,
        moveStep: 1,
        phaseId: "reversal-rot2-2",
        phaseName: "2-2. 2차 회전 (앞쪽 우측 2개)",
      },
      {
        ...baseFrame,
        delay: 45,
        showEffect: true,
        showBehindEffect: true,
        orbAngle: 7.85, // 앞쪽 중앙 (2개 동시)
        orbCount: 2,
        moveStep: 1,
        phaseId: "reversal-rot2-3",
        phaseName: "2-3. 2차 회전 (앞쪽 중앙 2개)",
      },
      {
        ...baseFrame,
        delay: 45,
        showEffect: true,
        showBehindEffect: true,
        orbAngle: 8.63, // 앞쪽 좌측 (2개 동시)
        orbCount: 2,
        moveStep: 1,
        phaseId: "reversal-rot2-4",
        phaseName: "2-4. 2차 회전 (앞쪽 좌측 2개)",
      },
      {
        ...baseFrame,
        delay: 45,
        showEffect: true,
        showBehindEffect: true,
        orbAngle: 9.42, // 좌측 에지 ➔ 등 뒤로 전환 (2개 동시)
        orbCount: 2,
        moveStep: 1,
        phaseId: "reversal-rot2-5",
        phaseName: "2-5. 2차 회전 (좌측 통과 2개)",
      },
      {
        ...baseFrame,
        delay: 45,
        showEffect: true,
        showBehindEffect: true,
        orbAngle: 10.21, // 등 뒤 좌측 (behind 레이어 2개)
        orbCount: 2,
        moveStep: 1,
        phaseId: "reversal-rot2-6",
        phaseName: "2-6. 2차 회전 (등 뒤 좌측 2개)",
      },
      {
        ...baseFrame,
        delay: 45,
        showEffect: true,
        showBehindEffect: true,
        orbAngle: 10.99, // 등 뒤 중앙 (behind 레이어 2개)
        orbCount: 2,
        moveStep: 1,
        phaseId: "reversal-rot2-7",
        phaseName: "2-7. 2차 회전 (등 뒤 중앙 2개)",
      },
      {
        ...baseFrame,
        delay: 45,
        showEffect: true,
        showBehindEffect: true,
        orbAngle: 11.78, // 등 뒤 우측 (behind 레이어 2개)
        orbCount: 2,
        moveStep: 1,
        phaseId: "reversal-rot2-8",
        phaseName: "2-8. 2차 회전 (등 뒤 우측 2개)",
      },

      // =======================================================================
      // 회전 종료: 다시 1개로 변함 ➔ 🌟 [유저 지시]: 줌 아웃 전에 공중으로 분산시켜버림!
      // =======================================================================
      {
        ...baseFrame,
        delay: 45,
        showEffect: true,
        showBehindEffect: true,
        orbAngle: 12.56, // 4파이 도달, 1개로 합체
        orbCount: 1,
        moveStep: 1,
        phaseId: "reversal-merge-1",
        phaseName: "3. 1개 구체로 변함",
      },
      {
        ...baseFrame,
        delay: 45,
        showEffect: true,
        showBehindEffect: true,
        orbAngle: 13.34, // 가속 회전
        orbCount: 1,
        moveStep: 1,
        phaseId: "reversal-merge-rot",
        phaseName: "4. 가속 회전 & 에너지 방출 준비",
      },

      // 🌟 [유저 지시]: 줌 아웃 전에 공중으로 분산 (좀 더 빠르게 투명화되며 소멸)
      {
        ...baseFrame,
        delay: 30,
        showEffect: true,
        showBehindEffect: true,
        showYellowAura: true,
        orbAngle: 14.12,
        orbCount: 1,
        disperseProgress: 0.25,
        whiteAlpha: 0.0,
        moveStep: 1,
        phaseId: "reversal-disperse-1",
        phaseName: "5-1. 공중 분산 (초고속 투명화 & 상승)",
      },
      {
        ...baseFrame,
        delay: 25,
        showEffect: true,
        showBehindEffect: true,
        showYellowAura: true,
        orbAngle: 14.90,
        orbCount: 1,
        disperseProgress: 0.50,
        whiteAlpha: 0.0,
        moveStep: 1,
        phaseId: "reversal-disperse-2",
        phaseName: "5-2. 공중 분산 (완전 소산)",
      },

      // 🌟 [유저 지시]: 줌 아웃 직전 모든 이펙트 완전 종료 ➔ 줌 아웃 시 아무것도 정지되어 보이지 않음!
      {
        ...baseFrame,
        delay: 25,
        showEffect: false,
        showBehindEffect: false,
        showYellowAura: false,
        fadeEffectOnCameraReturn: false,
        orbAngle: undefined,
        moveStep: 1,
        phaseId: "reversal-finish",
        phaseName: "6. 시전 완료 (클린 필드 & 줌아웃 진입)",
      },

      // =======================================================================
      // 🌟 [유저 지시]: 클로즈 아웃 후 상대방 타격 (후속 격투 돌진 강타)
      // =======================================================================
      // 7-1. 도움닫기 (스프링 반동 축적)
      {
        ...baseFrame,
        delay: 50,
        afterCameraReturn: true,
        ...cOff(-14, 6),
        ...cTargetOff(0, 0),
        ...cTransform(1.12, 0.88, -0.06),
        showEffect: false,
        showBehindEffect: false,
        showYellowAura: false,
        hitFlash: false,
        phaseId: "reversal-strike-windup",
        phaseName: "7-1. 돌진 도움닫기",
      },
      // 7-2. 전방 고속 돌진 1 (상대를 향해 쇄도)
      {
        ...baseFrame,
        delay: 45,
        afterCameraReturn: true,
        ...cOff(85, -42),
        ...cTargetOff(0, 0),
        ...cTransform(0.88, 1.15, 0.10),
        showEffect: false,
        showBehindEffect: true,
        showYellowAura: false,
        hitFlash: false,
        phaseId: "reversal-strike-dash-1",
        phaseName: "7-2. 상대방을 향해 쾌속 돌진",
      },
      // 7-3. 전방 고속 돌진 2 (상대 코앞 급습)
      {
        ...baseFrame,
        delay: 40,
        afterCameraReturn: true,
        ...cOff(170, -82),
        ...cTargetOff(0, 0),
        ...cTransform(0.84, 1.20, 0.14),
        showEffect: false,
        showBehindEffect: true,
        showYellowAura: false,
        hitFlash: false,
        phaseId: "reversal-strike-dash-2",
        phaseName: "7-3. 상대 코앞 쇄도",
      },
      // 7-4. 상대방 직격 강타! (격투 타격 섬광 & 피격 플래시 & 데미지 적용)
      {
        ...baseFrame,
        delay: 85,
        afterCameraReturn: true,
        ...cOff(212, -104),
        ...(isHit ? cTargetOff(16, -7) : cTargetOff(0, 0)),
        ...cTransform(1.25, 0.80, 0.05),
        showEffect: isHit,
        showBehindEffect: false,
        showYellowAura: false,
        hitFlash: isHit,
        whiteAlpha: isHit ? 0.20 : 0.0,
        hitProgress: 0.15,
        phaseId: "reversal-strike-hit",
        phaseName: "7-4. 상대방 직격 강타 (초고휘도 파열 섬광)",
      },
      // 7-5. 충격파 폭발 & 넉백 (화염/황금 스타버스트 팽창 & 적 넉백)
      {
        ...baseFrame,
        delay: 90,
        afterCameraReturn: true,
        ...cOff(205, -100),
        ...(isHit ? cTargetOff(26, -11) : cTargetOff(0, 0)),
        ...cTransform(1.08, 0.94, 0.02),
        showEffect: isHit,
        showBehindEffect: false,
        showYellowAura: false,
        hitFlash: false,
        hitProgress: 0.55,
        phaseId: "reversal-strike-burst",
        phaseName: "7-5. 2중 충격파 폭발 & 최대 넉백",
      },
      // 7-6. 충돌 반동 반출 (원위치 복귀 시작)
      {
        ...baseFrame,
        delay: 80,
        afterCameraReturn: true,
        ...cOff(105, -50),
        ...(isHit ? cTargetOff(10, -4) : cTargetOff(0, 0)),
        ...cTransform(0.96, 1.04, 0),
        showEffect: false,
        showBehindEffect: false,
        showYellowAura: false,
        hitFlash: false,
        phaseId: "reversal-strike-rebound",
        phaseName: "7-6. 충돌 반동 반출",
      },
      // 7-7. 원위치 복귀 완료
      {
        ...baseFrame,
        delay: 75,
        afterCameraReturn: true,
        ...cOff(0, 0),
        ...cTargetOff(0, 0),
        ...cTransform(1.0, 1.0, 0),
        showEffect: false,
        showBehindEffect: false,
        showYellowAura: false,
        hitFlash: false,
        phaseId: "reversal-strike-finish",
        phaseName: "7-7. 원위치 복귀 완료",
      },
    ];
  },
};
