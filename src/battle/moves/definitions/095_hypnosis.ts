import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawHypnosisEffect } from "../../../renderers/moves/gen1/move093_096.js";

/**
 * 095: 최면술 (Hypnosis) - 에스퍼 타입 변화기 (명중 60, 수면 부여)
 *
 * 연출:
 * - 몽환적인 전장 톤다운 & 시전자 최면 파동 충전
 * - 초음파 방식 발포: 시전자에서 상대를 향해 연속 사출되는 5중 노란색 중공원 링 (사이코키네시스/울음소리형 원반)
 * - 대상 도달 시 2차원 동심원 링으로 중첩되어 대상을 감싸고 최면 펄스 공명
 * - 대상 졸음 유발 (스프라이트 살짝 가라앉음), 수면 방울 및 떠오르는 Zzz 수면 룬 파티클
 * - 수면 상태 안착 & 암전 해제 및 복귀
 */
export const hypnosisMove: BattleMoveAnimation = {
  num: 95,
  key: "hypnosis",
  nameKo: "최면술",
  nameEn: "Hypnosis",
  type: "psychic",
  category: "status",
  camera: { type: "target", zoom: 1.25 },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawHypnosisEffect(targetCtx, frame, drawCtx);
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
    };

    // 시전자 전용 오프셋 헬퍼 (수비자는 { 0, 0 } 절대 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 피격자(대상) 전용 리액션 오프셋 헬퍼 (시전자는 { 0, 0 } 절대 고정)
    const targetReact = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x, y } : { x: 0, y: 0 },
    });

    return [
      // 1. 최면 에너지 집약 및 1차 노란 링 발사
      {
        ...baseFrame,
        delay: 85,
        ...cOff(-3, 1),
        pScale: isP ? { x: 1.04, y: 0.96 } : undefined,
        eScale: !isP ? { x: 1.04, y: 0.96 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        leaderT: 0.20,
        effectProgress: 0.15,
        phaseId: "hypnosis-start",
        phaseName: "1. 최면 에너지 집약 및 1차 노란 링 발사",
      },
      // 2. 노란 최면 링 연속 사출 1
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        leaderT: 0.42,
        effectProgress: 0.35,
        phaseId: "hypnosis-stream-1",
        phaseName: "2. 노란 최면 링 연속 사출 1",
      },
      // 3. 노란 최면 링 연속 사출 2
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        leaderT: 0.68,
        effectProgress: 0.55,
        phaseId: "hypnosis-stream-2",
        phaseName: "3. 노란 최면 링 연속 사출 2",
      },
      // 4. 노란 최면 링 일렬 비행 및 대상 접근
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        leaderT: 0.92,
        effectProgress: 0.75,
        phaseId: "hypnosis-approach",
        phaseName: "4. 노란 최면 링 일렬 비행 및 대상 접근",
      },
      // 5. 선두 링 대상 관통 및 후방 확산 시작
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        leaderT: 1.20,
        effectProgress: 0.50,
        phaseId: "hypnosis-pass-start",
        phaseName: "5. 선두 링 대상 관통 및 후방 확산 시작",
      },
      // 6. 노란 최면파 연속 관통 및 후방 광역 투명 확산
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        leaderT: 1.50,
        effectProgress: 0.85,
        phaseId: "hypnosis-pass-spread",
        phaseName: "6. 노란 최면파 연속 관통 및 후방 광역 투명 확산",
      },
      // 7. 대상 졸음 유발 및 수면 방울 생성
      {
        ...baseFrame,
        delay: 110,
        ...(isHit ? targetReact(0, 5) : cOff(0, 0)),
        pScale: !isP && isHit ? { x: 1.06, y: 0.90 } : undefined,
        eScale: isP && isHit ? { x: 1.06, y: 0.90 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.35,
        phaseId: "hypnosis-drowsy",
        phaseName: "7. 대상 졸음 유발 및 수면 방울 생성",
      },
      // 8. 깊은 수면 유도 및 Zzz 룬 파티클 상승
      {
        ...baseFrame,
        delay: 120,
        ...(isHit ? targetReact(0, 6) : cOff(0, 0)),
        pScale: !isP && isHit ? { x: 1.06, y: 0.90 } : undefined,
        eScale: isP && isHit ? { x: 1.06, y: 0.90 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.75,
        phaseId: "hypnosis-zzz-float",
        phaseName: "8. 깊은 수면 유도 및 Zzz 룬 파티클 상승",
      },
      // 9. 수면 상태 안착 및 암전 해제
      {
        ...baseFrame,
        delay: 100,
        ...(isHit ? targetReact(0, 6) : cOff(0, 0)),
        pScale: !isP && isHit ? { x: 1.04, y: 0.92 } : undefined,
        eScale: isP && isHit ? { x: 1.04, y: 0.92 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.60,
        phaseId: "hypnosis-settle",
        phaseName: "9. 수면 상태 안착 및 암전 해제",
      },
      // 10. 완료 및 복귀
      {
        ...baseFrame,
        delay: 60,
        ...cOff(0, 0),
        showEffect: false,
        hitFlash: false,
        phaseId: "hypnosis-complete",
        phaseName: "10. 완료 및 복귀",
      },
    ];
  },
};
