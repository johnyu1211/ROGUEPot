// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawThiefEffect } from "../../../renderers/moves/gen1/move165_168.js";

/**
 * 168: 도둑질 (Thief) - 악 타입 물리 공격기
 *
 * 위력: 60 / 명중: 100 / PP: 25 / 접촉 판정: O
 * 설명: 공격과 동시에 상대의 도구를 훔친다. 자신이 이미 도구를 지니고 있다면 훔칠 수 없다.
 *
 * [유저 지정 연출 시퀀스]:
 * 1. 상대포커싱 (camera: target, zoom: 1.32)
 * 2. 회색연막 같은 게 좁은 범위로 대상 포켓몬 스프라이트 위에 퍼짐 (Step 2)
 * 3. 대상 포켓몬 회색화 (targetGreyTint: true, Step 3)
 * 4. 좀 더 어두운 회색 연기 같은 게 살짝 다각도로 퍼짐 (Step 3)
 * 5. 대상 포켓몬에게서 작은 흰색 구체가 시전 포켓몬에게로 이동 (Step 4)
 * 6. 시전 포켓몬에게 안착하며 영롱한 흡수 반짝임과 함께 복귀 (Step 5)
 */
export const thiefMove: BattleMoveAnimation = {
  num: 168,
  key: "thief",
  nameKo: "도둑질",
  nameEn: "Thief",
  type: "dark",
  category: "physical",
  camera: {
    type: "target",
    zoom: 1.32,
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawThiefEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      pRot: 0,
      eRot: 0,
    };

    // 시전자 오프셋 (시전자만 정확히 이동, 수비자는 완벽하게 {0, 0} 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 시전자 스케일
    const cScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    // 수비자(피격자) 오프셋
    const defOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    return [
      // =======================================================================
      // Step 1: 상대포커싱 & 시전자 잠입 준비 (Windup - 160ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 80,
        ...cOff(-4, 2),
        ...cScale(0.96, 1.04),
        ...defOff(0, 0),
        showEffect: false,
        moveStep: 1,
        effectProgress: 0.2,
        phaseId: "thief-stalk-1",
        phaseName: "1. 상대 포커싱 & 은밀한 잠입",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(-6, 3),
        ...cScale(0.93, 1.07),
        ...defOff(0, 0),
        showEffect: false,
        moveStep: 1,
        effectProgress: 0.6,
        phaseId: "thief-stalk-2",
        phaseName: "1. 시전자 기습 웅크림 힘 축적",
      },

      // =======================================================================
      // Step 2: 좁은 범위의 회색 연막이 대상 포켓몬 스프라이트 위에 퍼짐 (180ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 90,
        ...cOff(-2, 1),
        ...cScale(1.02, 0.98),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.35,
        phaseId: "thief-smoke-puff-1",
        phaseName: "2. 대상 스프라이트 위 좁은 회색 연막 피어오름",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.85,
        phaseId: "thief-smoke-puff-2",
        phaseName: "2. 회색 연막 대상 포켓몬 감싸기",
      },

      // =======================================================================
      // Step 3: 대상 포켓몬 회색화 & 어두운 회색 연기 다각도 퍼짐 (280ms)
      // =======================================================================
      // 3-1. 대상 포켓몬 회색화 직격! 넉백 및 HP 감소
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        ...defOff(8, -2),
        hitFlash: true,
        targetGreyTint: true,
        showEffect: true,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 3,
        effectProgress: 0.30,
        phaseId: "thief-target-greyscale",
        phaseName: "3. 대상 포켓몬 회색화 & 피격 직격",
      },
      // 3-2. 좀 더 어두운 회색 연기가 살짝 다각도로 퍼짐
      {
        ...baseFrame,
        delay: 95,
        ...cOff(0, 0),
        ...defOff(-2, 1),
        targetGreyTint: true,
        showEffect: true,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 3,
        effectProgress: 0.65,
        phaseId: "thief-dark-smoke-disperse-1",
        phaseName: "4. 어두운 회색 연기 다각도 확산",
      },
      // 3-3. 어두운 연기 소산 & 대상 중심 순백 빛무리 응축 시작
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...defOff(0, 0),
        targetGreyTint: true,
        showEffect: true,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 3,
        effectProgress: 1.00,
        phaseId: "thief-dark-smoke-disperse-2",
        phaseName: "4. 어두운 연기 소산 & 순백 빛무리 응축",
      },

      // =======================================================================
      // Step 4: 대상에게서 작은 흰색 구체가 시전 포켓몬에게로 이동 (350ms)
      // =======================================================================
      // 4-1. 흰색 구체 뿅! 부유 출발
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...defOff(0, 0),
        targetGreyTint: true,
        showEffect: true,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 4,
        effectProgress: 0.20,
        phaseId: "thief-orb-launch",
        phaseName: "5. 작은 흰색 구체 생성 및 출발",
      },
      // 4-2. 흰색 구체 1/2 지점 아크 비행 & 빛가루 꼬리 잔상
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...defOff(0, 0),
        targetGreyTint: true,
        showEffect: true,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 4,
        effectProgress: 0.50,
        phaseId: "thief-orb-flight-mid",
        phaseName: "5. 흰색 구체 시전자 방향 포물선 비행",
      },
      // 4-3. 흰색 구체 시전자 코앞 쇄도 (3/4 지점)
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...defOff(0, 0),
        targetGreyTint: true,
        showEffect: true,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 4,
        effectProgress: 0.80,
        phaseId: "thief-orb-flight-reach",
        phaseName: "5. 시전자 코앞 접근 쇄도",
      },
      // 4-4. 시전 포켓몬에게 쏙 도달 및 흡수 반짝임!
      {
        ...baseFrame,
        delay: 90,
        ...cOff(2, -2),
        ...cScale(1.05, 0.95),
        ...defOff(0, 0),
        targetGreyTint: true,
        showEffect: true,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 4,
        effectProgress: 1.00,
        fadeEffectOnCameraReturn: true,
        phaseId: "thief-orb-absorb",
        phaseName: "5. 시전 포켓몬 안착 & 흡수 반짝임",
      },

      // =======================================================================
      // Step 5: 카메라 중립 복귀 & 정위치 안착 (Recovery - 180ms)
      // =======================================================================
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...defOff(0, 0),
        targetGreyTint: false,
        showEffect: true,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 5,
        effectProgress: 0.50,
        phaseId: "thief-recover-1",
        phaseName: "6. 흡수 잔향 소산 & 회색화 해제",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...defOff(0, 0),
        targetGreyTint: false,
        showEffect: false,
        enemyHp: a.enemyHpAfter,
        playerHp: a.playerHpAfter,
        moveStep: 5,
        effectProgress: 1.00,
        phaseId: "thief-recover-2",
        phaseName: "6. 최종 정위치 안착 완료",
      },
    ];
  },
};
