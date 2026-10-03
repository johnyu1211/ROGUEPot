// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawZapCannonBehindEffect,
  drawZapCannonEffect,
} from "../../../renderers/moves/gen1/move189_192.js";

/**
 * 192: 전자포 (Zap Cannon) - 전기 타입 특수 기술 (위력 120, 명중률 50%, 100% 확정 마비)
 *
 * 연출 구성 (초고화력 대구경 레일건/전자기포 + 256색 Octree 고선명 플라즈마):
 * 1. Step 1: [전자장 집속 & 초고밀도 볼 라이트닝 구체 형성] (4프레임)
 *    - 카메라 시전자 깊은 줌인(1.48x) & 전장 암전 심화(0.20 -> 0.75)
 *    - 발밑 지면 전자기 이온화 필드, 3D 회전 유도 링 전개, 사방 수렴 벼락 흡수 및 초고열 구체 임계 응축
 * 2. Step 2: [레일건 포격 사출 & 마하 충격파 쇄도] (4프레임)
 *    - 발사 후 타격까지 짙은 전자기 암전 지속 유지(blackFadeAlpha: 0.75)
 *    - 강력한 격발 반동(Squash & Stretch) 및 머즐 블라스트
 *    - 레일건 유도 가속 링 3개 돌파, 고전압 빔 회랑 & 이중 나선 벼락(Double-Helix Arc), 마하 충격파 콘
 * 3. Step 3: [상대방 정면 직격 & 초신성 플라즈마 대폭발] (3프레임)
 *    - 피격자 직격 1프레임 순백 섬광(hitFlash) & 회전 없이 정자세 넉백 충격 흡수 (No Rotation)
 *    - 지면 크레이터 접지 방전, 16방향 방사 벼락 분기 폭쇄(Fractal Branching Lightning), 대형 충격파 링
 * 4. Step 4: [100% 확정 마비 감전! 전신 전자기 구속망 & 고전압 경련] (4프레임)
 *    - 상대를 옥죄는 3단 3D 전자기 구속 링(머리, 가슴, 하체 입체 감싸기)
 *    - 전신을 관통하는 7중 고압 지그재그 벼락망, 접지 방전 아크, 고주파 경련 진동(회전 없이 수평/수직 지진)
 * 5. Step 5: [방전 소산 & 전투 태세 복귀] (2프레임)
 *    - 잔여 정전기 및 부유 스파크 소산, HP 감쇠 반영 및 카메라 원위치 복귀
 */
export const zapCannonMove: BattleMoveAnimation = {
  num: 192,
  key: "zap-cannon",
  nameKo: "전자포",
  nameEn: "Zap Cannon",
  type: "electric",
  category: "special",
  camera: {
    type: "caster_to_target",
    zoom: 1.48,
    focalRatio: 0.85,
    delayUntilStep: 2,
  },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (frame.showBehindEffect ?? frame.showEffect) {
      drawZapCannonBehindEffect(targetCtx, frame, drawCtx);
    }
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (frame.showEffect) {
      drawZapCannonEffect(targetCtx, frame, drawCtx);
    }
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.0,
      pRot: 0,
      eRot: 0,
      hitFlash: false,
    };

    const dir = isP ? 1 : -1;

    // 시전자 오프셋 헬퍼
    const cOff = (x: number, y: number) => ({
      pOffset: isP ? { x, y } : { x: 0, y: 0 },
      eOffset: !isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    // 시전자 스케일 헬퍼
    const cScale = (x: number, y: number) => ({
      pScale: isP ? { x, y } : undefined,
      eScale: !isP ? { x, y } : undefined,
    });

    // 수비자(피격자) 오프셋 헬퍼 (회전 없이 정자세 충격 리액션)
    const defOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x, y } : { x: 0, y: 0 },
      pRot: 0,
      eRot: 0,
    });

    return [
      // =======================================================================
      // Step 1: [전자장 집속 & 초고밀도 볼 라이트닝 구체 형성] (4프레임)
      // =======================================================================
      {
        ...baseFrame,
        delay: 90,
        ...cOff(-dir * 3, 1),
        ...cScale(1.04, 0.96),
        ...defOff(0, 0),
        blackFadeAlpha: 0.20,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 1,
        effectProgress: 0.20,
        phaseId: "zap-charge-1",
        phaseName: "1. [전자장 집속] 대기 이온화 및 전자기장 태동",
      },
      {
        ...baseFrame,
        delay: 95,
        ...cOff(-dir * 6, 2),
        ...cScale(1.08, 0.92),
        ...defOff(0, 0),
        blackFadeAlpha: 0.45,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 1,
        effectProgress: 0.45,
        phaseId: "zap-charge-2",
        phaseName: "1. [전자장 집속] 회전 자기장 링 전개 & 사방 벼락 수렴",
      },
      {
        ...baseFrame,
        delay: 100,
        ...cOff(-dir * 9, 3),
        ...cScale(1.12, 0.88),
        ...defOff(0, 0),
        blackFadeAlpha: 0.65,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 1,
        effectProgress: 0.75,
        phaseId: "zap-charge-3",
        phaseName: "1. [전자장 집속] 초고밀도 볼 라이트닝 구체 응축 & 임계 출력",
      },
      {
        ...baseFrame,
        delay: 95,
        ...cOff(-dir * 11, 4),
        ...cScale(1.15, 0.85),
        ...defOff(0, 0),
        blackFadeAlpha: 0.75,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 1,
        effectProgress: 0.95,
        phaseId: "zap-charge-4",
        phaseName: "1. [전자장 집속] 초고압 플라즈마 핵 임계 과부하 & 발사 직전",
      },

      // =======================================================================
      // Step 2: [레일건 포격 사출 & 마하 충격파 쇄도] (4프레임) - 암전 깊게 지속 유지
      // =======================================================================
      {
        ...baseFrame,
        delay: 85,
        ...cOff(dir * 18, -4),
        ...cScale(0.85, 1.15),
        ...defOff(0, 0),
        blackFadeAlpha: 0.75,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 2,
        effectProgress: 0.15,
        phaseId: "zap-fire-kick",
        phaseName: "2. [레일건 포격] 대구경 포격 격발 & 포구 대폭발",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(-dir * 12, 3),
        ...cScale(1.08, 0.92),
        ...defOff(0, 0),
        blackFadeAlpha: 0.75,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 2,
        effectProgress: 0.45,
        phaseId: "zap-fire-flight-1",
        phaseName: "2. [레일건 포격] 초음속 쇄도 & 이온화 빔 회랑 형성",
      },
      {
        ...baseFrame,
        delay: 90,
        ...cOff(-dir * 4, 1),
        ...cScale(1.02, 0.98),
        ...defOff(0, 0),
        blackFadeAlpha: 0.75,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 2,
        effectProgress: 0.75,
        phaseId: "zap-fire-flight-2",
        phaseName: "2. [레일건 포격] 이중 나선 벼락 & 마하 충격파 가속",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...defOff(0, 0),
        blackFadeAlpha: 0.75,
        showEffect: true,
        showBehindEffect: true,
        moveStep: 2,
        effectProgress: 0.96,
        phaseId: "zap-fire-imminent",
        phaseName: "2. [레일건 포격] 상대 정면 타격 직전 초밀착",
      },

      // =======================================================================
      // Step 3: [상대방 정면 직격 & 초신성 플라즈마 대폭발] (3프레임) - 타격 시 카메라 블러 & 강렬한 화면 쉐이크
      // =======================================================================
      {
        ...baseFrame,
        delay: 90,
        ...defOff(-dir * 18, -4),
        cameraBlur: isHit ? 2.5 : undefined,
        cameraPan: isHit ? { x: -dir * 4, y: -3 } : undefined,
        blackFadeAlpha: 0.75,
        hitFlash: isHit,
        showEffect: isHit,
        showBehindEffect: isHit,
        moveStep: 3,
        effectProgress: 0.30,
        phaseId: "zap-detonate-flash",
        phaseName: "3. [초신성 대폭발] 순백 섬광 격돌 & 플라즈마 파열 기폭",
      },
      {
        ...baseFrame,
        delay: 105,
        ...defOff(-dir * 24, -6),
        cameraBlur: isHit ? 3.5 : undefined,
        cameraPan: isHit ? { x: dir * 5, y: 4 } : undefined,
        blackFadeAlpha: 0.60,
        showEffect: isHit,
        showBehindEffect: isHit,
        moveStep: 3,
        effectProgress: 0.75,
        phaseId: "zap-detonate-shockwave",
        phaseName: "3. [초신성 대폭발] 16방향 방사 벼락 분기 폭쇄 & 초대형 충격파 링",
      },
      {
        ...baseFrame,
        delay: 95,
        ...defOff(-dir * 16, -2),
        cameraBlur: isHit ? 2.8 : undefined,
        cameraPan: isHit ? { x: -dir * 3, y: -2 } : undefined,
        blackFadeAlpha: 0.40,
        showEffect: isHit,
        showBehindEffect: isHit,
        moveStep: 3,
        effectProgress: 0.98,
        phaseId: "zap-detonate-secondary",
        phaseName: "3. [초신성 대폭발] 팽창 플라즈마 화염 & 비산하는 고압 스파크",
      },

      // =======================================================================
      // Step 4: [100% 확정 마비 감전! 전신 전자기 구속망 & 고전압 경련] (4프레임) - 회전 없는 고주파 진동 & 지속 카메라 블러/쉐이크
      // =======================================================================
      {
        ...baseFrame,
        delay: 105,
        ...defOff(-dir * 8, 3),
        cameraBlur: isHit ? 2.8 : undefined,
        cameraPan: isHit ? { x: dir * 2, y: -2 } : undefined,
        blackFadeAlpha: 0.25,
        showEffect: isHit,
        showBehindEffect: isHit,
        moveStep: 4,
        effectProgress: 0.25,
        phaseId: "zap-paralysis-cage",
        phaseName: "4. [100% 확정 마비] 전자 감전 구속망 결속 & 전신 통전",
      },
      {
        ...baseFrame,
        delay: 100,
        ...defOff(dir * 10, -2),
        cameraBlur: isHit ? 3.0 : undefined,
        cameraPan: isHit ? { x: -dir * 3, y: 2 } : undefined,
        blackFadeAlpha: 0.15,
        showEffect: isHit,
        showBehindEffect: isHit,
        moveStep: 4,
        effectProgress: 0.50,
        phaseId: "zap-spasm-1",
        phaseName: "4. [100% 확정 마비] 초고압 전류 방전 & 전신 1차 격렬한 경련",
      },
      {
        ...baseFrame,
        delay: 105,
        ...defOff(-dir * 8, 2),
        cameraBlur: isHit ? 2.8 : undefined,
        cameraPan: isHit ? { x: dir * 2, y: -1 } : undefined,
        blackFadeAlpha: 0.08,
        showEffect: isHit,
        showBehindEffect: isHit,
        moveStep: 4,
        effectProgress: 0.75,
        phaseId: "zap-spasm-2",
        phaseName: "4. [100% 확정 마비] 관통 아크 방전 & 2차 마비 강직 경련",
      },
      {
        ...baseFrame,
        delay: 100,
        ...defOff(dir * 4, -1),
        cameraBlur: isHit ? 2.5 : undefined,
        cameraPan: isHit ? { x: -dir * 1, y: 1 } : undefined,
        showEffect: isHit,
        showBehindEffect: isHit,
        moveStep: 4,
        effectProgress: 0.95,
        phaseId: "zap-spasm-3",
        phaseName: "4. [100% 확정 마비] 잔류 전압 구속 & 100% 완전 마비 고착",
      },

      // =======================================================================
      // Step 5: [방전 소산 & 전투 태세 복귀] (2프레임)
      // =======================================================================
      {
        ...baseFrame,
        delay: 100,
        ...cOff(0, 0),
        ...defOff(0, 0),
        cameraBlur: 0,
        cameraPan: { x: 0, y: 0 },
        enemyHp: isHit ? a.enemyHpAfter : enemyHp,
        playerHp: isHit ? a.playerHpAfter : playerHp,
        showEffect: isHit,
        showBehindEffect: false,
        moveStep: 5,
        effectProgress: 0.50,
        phaseId: "zap-dissipate",
        phaseName: "5. [방전 소산] 고전압 아크 소산 & 이온화 대기 냉각",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        ...defOff(0, 0),
        cameraBlur: 0,
        cameraPan: { x: 0, y: 0 },
        showEffect: false,
        showBehindEffect: false,
        moveStep: 5,
        effectProgress: 1.0,
        phaseId: "zap-recover",
        phaseName: "5. [복귀 완료] 전투 태세 복귀",
      },
    ];
  },
};
