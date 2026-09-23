// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawSmokescreenEffect,
  drawSmokescreenBehindEffect,
} from "../../../renderers/moves/gen1/move105_108.js";

/**
 * 108: 연막 (Smokescreen) - 노말 타입 변화기 (상대의 명중률 1랭크 하락)
 *
 * 연출 구성:
 * 1. 시전자 입가에서 연막탄 사출 & 발사 반동 (머즐 그을음 연무)
 * 2. 칠흑 연기탄의 유려한 탄도 포물선 비행 & 후류 연무 스트림
 * 3. 상대 정면 직격 착탄 폭발! 다엽형 칠흑 연막 클러스터의 방사형 폭발 전개
 * 4. 입체 샌드위치 연막(배후 연벽 + 전면 롤링 연막)으로 상대 전신 완전 차폐 (상대 실루엣화 & 명중률 하락 디버프)
 * 5. 연막이 상공으로 피어오르며 부드럽게 대기 중으로 확산 소멸 및 복귀
 */
export const smokescreenMove: BattleMoveAnimation = {
  num: 108,
  key: "smokescreen",
  nameKo: "연막",
  nameEn: "Smokescreen",
  type: "normal",
  category: "status",
  customStatParticles: true,
  camera: { type: "target", zoom: 1.25 },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawSmokescreenBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawSmokescreenEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.25,
      pRot: 0,
      eRot: 0,
    };

    // 시전자 전용 오프셋 헬퍼 (수비자는 절대 {0,0} 고정)
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 피격자(수비자) 전용 리액션 오프셋 헬퍼 (시전자는 절대 {0,0} 고정)
    const targetReact = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x, y } : { x: 0, y: 0 },
    });

    return [
      // 1. 시전자 연기탄 사출 및 발사 반동
      {
        ...baseFrame,
        delay: 90,
        ...cOff(-8, 3),
        pScale: isP ? { x: 1.10, y: 0.90 } : undefined,
        eScale: !isP ? { x: 1.10, y: 0.90 } : undefined,
        showEffect: true,
        hitFlash: false,
        moveStep: 1,
        effectProgress: 0.50,
        phaseId: "smokescreen-launch",
        phaseName: "1. 연기탄 사출 및 반동",
      },
      // 2. 연기탄 포물선 상승 비행
      {
        ...baseFrame,
        delay: 70,
        ...cOff(-2, 1),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.22,
        phaseId: "smokescreen-fly-1",
        phaseName: "2. 연기탄 포물선 상승",
      },
      // 3. 연기탄 포물선 정점 통과 & 흐릿한 잔상
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.58,
        phaseId: "smokescreen-fly-2",
        phaseName: "3. 연기탄 포물선 정점 & 잔상",
      },
      // 4. 연기탄 포물선 급강하 직격
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 0),
        showEffect: true,
        hitFlash: false,
        moveStep: 2,
        effectProgress: 0.90,
        phaseId: "smokescreen-fly-3",
        phaseName: "4. 연기탄 포물선 급강하",
      },
      // 5. 직격 착탄 & 1차 연막(3개) 피어오름
      {
        ...baseFrame,
        delay: 95,
        ...targetReact(-5, -2),
        targetDarkLevel: 0.25,
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.22,
        phaseId: "smokescreen-impact-1",
        phaseName: "5. 직격 착탄 & 1차 연막(3개) 피어오름",
      },
      // 6. 2차 연막(3개) 연쇄 피어오름
      {
        ...baseFrame,
        delay: 100,
        ...targetReact(3, 1),
        targetDarkLevel: 0.50,
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.58,
        phaseId: "smokescreen-impact-2",
        phaseName: "6. 2차 연막(3개) 연쇄 피어오름",
      },
      // 7. 3차 연막(3개) 피어오르며 전신 차폐 완성
      {
        ...baseFrame,
        delay: 110,
        ...targetReact(-2, 0),
        targetDarkLevel: 0.75,
        showEffect: true,
        hitFlash: false,
        moveStep: 3,
        effectProgress: 0.92,
        phaseId: "smokescreen-engulf",
        phaseName: "7. 3차 연막(3개) 전신 차폐 완성",
      },
      // 8. 칠흑 연막 소용돌이 & 상대 실루엣화 (명중률 하락 디버프 1)
      {
        ...baseFrame,
        delay: 120,
        ...targetReact(-3, 0),
        targetDarkLevel: 0.75,
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.40,
        phaseId: "smokescreen-vortex-1",
        phaseName: "8. 칠흑 소용돌이 차폐 & 시야 상실 1",
      },
      // 9. 칠흑 연막 소용돌이 & 1차 연막부터 서서히 투명화 시작
      {
        ...baseFrame,
        delay: 120,
        ...targetReact(2, 0),
        targetDarkLevel: 0.65,
        showEffect: true,
        hitFlash: false,
        moveStep: 4,
        effectProgress: 0.85,
        phaseId: "smokescreen-vortex-2",
        phaseName: "9. 1차 연막 서서히 투명화",
      },
      // 10. 연막 상공 분산 & 1차 소멸 / 2차 투명화
      {
        ...baseFrame,
        delay: 95,
        ...targetReact(0, 0),
        targetDarkLevel: 0.35,
        showEffect: true,
        hitFlash: false,
        moveStep: 5,
        effectProgress: 0.35,
        phaseId: "smokescreen-rise",
        phaseName: "10. 1차 소멸 & 2차 투명화",
      },
      // 11. 잔여 3차 연막 소산 및 시야 완전 회복
      {
        ...baseFrame,
        delay: 80,
        ...targetReact(0, 0),
        targetDarkLevel: 0.10,
        showEffect: true,
        hitFlash: false,
        moveStep: 5,
        effectProgress: 0.75,
        phaseId: "smokescreen-fade",
        phaseName: "11. 잔여 3차 연막 소산",
      },
      // 12. 완료 및 복귀
      {
        ...baseFrame,
        delay: 70,
        ...cOff(0, 0),
        targetDarkLevel: 0.0,
        showEffect: false,
        hitFlash: false,
        moveStep: 5,
        effectProgress: 1.0,
        phaseId: "smokescreen-complete",
        phaseName: "12. 완료 및 복귀",
      },
    ];
  },
};

