// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawAttractBehindEffect,
  drawAttractEffect,
} from "../../../renderers/moves/gen1/move213_216.js";

/**
 * 213: 헤롱헤롱 (Attract / メロメロ) - 노말 타입 변화 기술
 *
 * 위력: — / 명중: 100 / PP: 15 / 접촉 판정: X
 * 설명: 수컷은 암컷을 암컷은 수컷을 유혹하여 헤롱헤롱하게 만든다. 상대가 기술을 쓰기 어려워진다.
 *
 * [연출 시퀀스]:
 * 1. 핑크빛 대기 틴트 및 시전자 애교 바운스 + 시전자 주변 미니 핑크 하트 분출
 * 2. 사랑의 메인 핑크 하트가 콩닥콩닥 박동(Heartbeat pulse)하며 포물선/물결 궤적으로 비행
 * 3. 대상에게 하트가 안착
 * 4. 대상 머리 주위를 빙글빙글 공전하는 헤롱헤롱 하트들 & 황홀경 스웨이
 * 5. 빗나감/실패 시: 대상 앞에서 하트에 금이 가며 쩍 갈라져(Broken Heart) 잿빛으로 추락 소산
 */
export const attractMove: BattleMoveAnimation = {
  num: 213,
  key: "attract",
  nameKo: "헤롱헤롱",
  nameEn: "Attract",
  type: "normal",
  category: "status",
  camera: {
    type: "target",
    zoom: 1.32,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawAttractBehindEffect(targetCtx, frame, drawCtx);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    drawAttractEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      hitFlash: false,
      cameraZoom: 1.32,
      pRot: 0,
      eRot: 0,
      showEffect: true,
      showBehindEffect: true,
    };

    // 시전자 오프셋 & 스케일 헬퍼
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const cScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    const cRot = (rot: number) => ({
      pRot: isP ? rot : 0,
      eRot: !isP ? -rot : 0,
    });

    // 피격자(대상 포켓몬) 오프셋 & 스케일 헬퍼
    const defOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    const defScale = (x: number, y: number) => ({
      pScale: !isP ? { x, y } : undefined,
      eScale: isP ? { x, y } : undefined,
    });

    const defRot = (rot: number) => ({
      pRot: !isP ? rot : 0,
      eRot: isP ? -rot : 0,
    });

    // -------------------------------------------------------------
    // Miss / Invalid Gender 시퀀스 (실패/빗나감 시 깨진 하트 연출)
    // -------------------------------------------------------------
    if (!isHit) {
      return [
        {
          ...baseFrame,
          delay: 100,
          ...cOff(0, 0),
          ...cScale(1.05, 0.95),
          pinkDimAlpha: 0.25,
          casterHeartsAlpha: 0.5,
          effectProgress: 0.2,
          phaseId: "attract-miss-windup",
          phaseName: "1. 시전자 애교 바운스",
        },
        {
          ...baseFrame,
          delay: 110,
          ...cOff(0, -6),
          ...cScale(0.95, 1.06),
          ...cRot(0.04),
          pinkDimAlpha: 0.35,
          casterHeartsAlpha: 0.9,
          effectProgress: 0.6,
          phaseId: "attract-miss-hearts",
          phaseName: "1. 미니 하트 분출",
        },
        {
          ...baseFrame,
          delay: 90,
          ...cOff(0, 0),
          heartProgress: 0.25,
          heartSize: 20,
          heartAlpha: 0.95,
          pinkDimAlpha: 0.35,
          phaseId: "attract-miss-fly-1",
          phaseName: "2. 하트 사출",
        },
        {
          ...baseFrame,
          delay: 90,
          heartProgress: 0.60,
          heartSize: 23,
          heartAlpha: 1.0,
          pinkDimAlpha: 0.35,
          phaseId: "attract-miss-fly-2",
          phaseName: "2. 하트 비행",
        },
        {
          ...baseFrame,
          delay: 95,
          heartProgress: 0.85,
          isBrokenHeart: true,
          breakProgress: 0.15,
          heartSize: 24,
          heartAlpha: 0.95,
          pinkDimAlpha: 0.25,
          ...defRot(-0.04),
          phaseId: "attract-miss-crack",
          phaseName: "3. 대상 앞 하트 균열",
        },
        {
          ...baseFrame,
          delay: 120,
          heartProgress: 0.90,
          isBrokenHeart: true,
          breakProgress: 0.55,
          heartSize: 24,
          heartAlpha: 0.75,
          pinkDimAlpha: 0.15,
          ...defRot(0.03),
          phaseId: "attract-miss-break",
          phaseName: "4. 깨진 하트 쪼개짐",
        },
        {
          ...baseFrame,
          delay: 120,
          heartProgress: 0.93,
          isBrokenHeart: true,
          breakProgress: 1.0,
          heartSize: 24,
          heartAlpha: 0.35,
          pinkDimAlpha: 0.05,
          phaseId: "attract-miss-fall",
          phaseName: "5. 잿빛 조각 추락 소산",
        },
        {
          ...baseFrame,
          delay: 80,
          showEffect: false,
          showBehindEffect: false,
          phaseId: "attract-miss-end",
          phaseName: "6. 복귀",
        },
      ];
    }

    // -------------------------------------------------------------
    // Hit (정상 적중) 시퀀스: 완벽한 매혹 연출 (총 14 프레임)
    // -------------------------------------------------------------
    return [
      // 1. 시전자 애교 바운스 & 미니 하트 분출 (Frames 1 ~ 3)
      {
        ...baseFrame,
        delay: 100,
        ...cOff(0, 0),
        ...cScale(1.06, 0.94),
        ...cRot(0.05),
        pinkDimAlpha: 0.25,
        casterHeartsAlpha: 0.45,
        effectProgress: 0.2,
        phaseId: "attract-windup-1",
        phaseName: "1. 시전자 애교 바운스 & 미니 하트 분출",
      },
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, -8),
        ...cScale(0.94, 1.08),
        ...cRot(-0.06),
        pinkDimAlpha: 0.35,
        casterHeartsAlpha: 0.85,
        effectProgress: 0.55,
        phaseId: "attract-windup-2",
        phaseName: "1. 시전자 애교 바운스 & 미니 하트 분출",
      },
      {
        ...baseFrame,
        delay: 110,
        ...cOff(0, 0),
        ...cScale(1.0, 1.0),
        ...cRot(0),
        pinkDimAlpha: 0.40,
        casterHeartsAlpha: 1.0,
        effectProgress: 0.9,
        phaseId: "attract-windup-3",
        phaseName: "1. 시전자 애교 바운스 & 미니 하트 분출",
      },

      // 2. 사랑의 메인 하트 발사 & 콩닥콩닥 비행 (Frames 4 ~ 7)
      {
        ...baseFrame,
        delay: 90,
        heartProgress: 0.15,
        heartSize: 18,
        heartAlpha: 0.95,
        pinkDimAlpha: 0.40,
        phaseId: "attract-flight-1",
        phaseName: "2. 사랑의 하트 사출 & 비행",
      },
      {
        ...baseFrame,
        delay: 90,
        heartProgress: 0.40,
        heartSize: 22,
        heartAlpha: 1.0,
        pinkDimAlpha: 0.45,
        phaseId: "attract-flight-2",
        phaseName: "2. 사랑의 하트 사출 & 비행",
      },
      {
        ...baseFrame,
        delay: 90,
        heartProgress: 0.68,
        heartSize: 24,
        heartAlpha: 1.0,
        pinkDimAlpha: 0.48,
        phaseId: "attract-flight-3",
        phaseName: "2. 사랑의 하트 사출 & 비행",
      },
      {
        ...baseFrame,
        delay: 90,
        heartProgress: 0.92,
        heartSize: 25,
        heartAlpha: 1.0,
        pinkDimAlpha: 0.50,
        phaseId: "attract-flight-4",
        phaseName: "2. 사랑의 하트 사출 & 비행",
      },

      // 3. 대상 피격 직격 (Frames 8 ~ 10)
      {
        ...baseFrame,
        delay: 95,
        heartProgress: 1.0,
        ...defOff(2, -2),
        ...defRot(0.04),
        pinkAuraAlpha: 0.4,
        phaseId: "attract-impact-1",
        phaseName: "3. 대상 하트 직격",
      },
      {
        ...baseFrame,
        delay: 110,
        ...defOff(-3, 1),
        ...defRot(-0.05),
        pinkAuraAlpha: 0.6,
        infatuateHeartsAlpha: 0.6,
        orbitProgress: 0.15,
        phaseId: "attract-impact-2",
        phaseName: "3. 대상 하트 직격",
      },
      {
        ...baseFrame,
        delay: 110,
        ...defOff(1, 0),
        ...defRot(0.03),
        pinkAuraAlpha: 0.55,
        infatuateHeartsAlpha: 0.9,
        orbitProgress: 0.35,
        phaseId: "attract-infatuate-1",
        phaseName: "4. 대상 황홀경 & 공전 하트",
      },

      // 4. 대상 헤롱헤롱 매혹 & 공전 하트 & 살랑살랑 스웨이 (Frames 11 ~ 14)
      {
        ...baseFrame,
        delay: 120,
        ...defRot(0.08),
        ...defScale(0.97, 1.03),
        infatuateHeartsAlpha: 1.0,
        orbitProgress: 0.60,
        pinkDimAlpha: 0.35,
        phaseId: "attract-infatuate-2",
        phaseName: "4. 대상 황홀경 & 공전 하트",
      },
      {
        ...baseFrame,
        delay: 120,
        ...defRot(-0.08),
        ...defScale(1.03, 0.97),
        infatuateHeartsAlpha: 1.0,
        orbitProgress: 0.85,
        pinkDimAlpha: 0.28,
        phaseId: "attract-infatuate-3",
        phaseName: "4. 대상 황홀경 & 공전 하트",
      },
      {
        ...baseFrame,
        delay: 120,
        ...defRot(0.04),
        ...defScale(1.0, 1.0),
        infatuateHeartsAlpha: 0.7,
        orbitProgress: 1.10,
        pinkDimAlpha: 0.18,
        phaseId: "attract-infatuate-4",
        phaseName: "4. 대상 황홀경 & 공전 하트",
      },
      {
        ...baseFrame,
        delay: 100,
        ...defRot(0),
        infatuateHeartsAlpha: 0.3,
        orbitProgress: 1.30,
        pinkDimAlpha: 0.08,
        phaseId: "attract-recover",
        phaseName: "5. 이펙트 소산 & 전장 복귀",
      },
    ];
  },
};
