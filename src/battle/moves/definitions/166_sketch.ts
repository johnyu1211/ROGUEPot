// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawSketchEffect } from "../../../renderers/moves/gen1/move165_168.js";

/**
 * 166: 스케치 (Sketch) - 노말 타입 변화기 (상대가 쓴 기술을 영구 복사하여 자신의 것으로 만든다)
 *
 * 위력: -- / 명중: -- / PP: 1
 * 설명: 상대가 쓴 기술을 자신의 것으로 만든다. 한 번 사용하면 스케치는 사라진다.
 *
 * [유저 지정 연출]: 캔버스 & 붓질 스케치 고증 연출
 * 1. [Step 1: 시전자 붓질 와인드업 & 잉크 방출] (Frames 1~3, 240ms)
 *    - 카메라: 시전자(루브도) 포커싱 (zoom: 1.0)
 *    - 시전 포켓몬 웅크림 힘 축적 ➔ 전방 점프하며 붓 스윙
 *    - 시전자 붓끝에서 에메랄드 그린/무지개빛 잉크 방울이 타겟을 향해 포물선 비행
 * 2. [Step 2: 카메라 타겟 글라이드 & 우든 이젤/캔버스 출현 & 붓 드로잉] (Frames 4~8, 410ms)
 *    - 카메라: 타겟 포커싱 (zoom: 1.34)
 *    - 타겟 앞에 클래식 우든 이젤과 아이보리 캔버스 보드 탄성 팝업 등장
 *    - 아티스트 브러시가 캔버스 위를 빠르게 춤추며 해칭 & 외곽선 & 디테일 & 컬러 워시 채색
 * 3. [Step 3: 스케치 완성! 순백 플래시 & 컬러풀 페인트 스플래시 & 스타버스트 작렬] (Frames 9~12, 340ms)
 *    - 브러시 피니시 터치와 동시에 1프레임 백색 섬광 (hitFlash: true)!
 *    - 캔버스에 금빛 프레임과 함께 완성된 마스터피스 작품 공개
 *    - 4방향 비비드 4색(에메랄드 그린, 루비 레드, 선샤인 옐로우, 스카이 블루) 페인트 스플래시 팡! 분출
 *    - 미니 레트로 스타 만개 및 충격파 링 확산
 * 4. [Step 4: 캔버스 페이드아웃 & 안착] (Frames 13~14, 170ms)
 *    - 캔버스와 잔여 별가루가 은은하게 페이드아웃되며 평온하게 정위치 복귀
 */
export const sketchMove: BattleMoveAnimation = {
  num: 166,
  key: "sketch",
  nameKo: "스케치",
  nameEn: "Sketch",
  type: "normal",
  category: "status",
  camera: {
    type: "caster_to_target",
    zoom: 1.34,
    delayUntilStep: 2, // Step 1: 시전자 포커싱, Step 2부터 상대방 포커싱
    inlineGlideInFrames: 2,
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawSketchEffect(targetCtx, frame, drawCtx);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, action: a, enemyHp, playerHp, textLineIdx } = ctx;

    const baseFrame = {
      enemyHp,
      playerHp,
      textLineIdx,
      moveEffect: a,
      cameraZoom: 1.0,
      hitFlash: false,
      pRot: 0,
      eRot: 0,
    };

    // 절대 규칙 2 준수: 시전자 전용 오프셋/스케일/회전 (수비자는 {0, 0} 고정)
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
      eRot: !isP ? rot : 0,
    });

    // 수비자(피격자) 오프셋
    const defOff = (x: number, y: number) => ({
      pOffset: !isP ? { x, y } : { x: 0, y: 0 },
      eOffset: isP ? { x: -x, y: -y } : { x: 0, y: 0 },
    });

    return [
      // =======================================================================
      // Step 1: 시전 포켓몬 전방 과감한 돌진 (Caster Forward Rush)
      // =======================================================================
      {
        ...baseFrame,
        delay: 75,
        ...cOff(-8, 4),
        ...cScale(1.14, 0.88),
        ...cRot(-0.12),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.20,
        phaseId: "sketch-windup-1",
        phaseName: "1. 시전자 웅크림 힘 축적",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(36, -8),
        ...cScale(1.24, 0.80),
        ...cRot(0.16),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 1,
        effectProgress: 0.60,
        phaseId: "sketch-windup-2",
        phaseName: "1. 전방 과감한 돌진 쇄도",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(52, -2),
        ...cScale(1.08, 0.94),
        ...cRot(0.08),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 1,
        effectProgress: 1.00,
        phaseId: "sketch-windup-3",
        phaseName: "1. 돌진 최고점 & 붓 스윙 완비",
      },

      // =======================================================================
      // Step 2: 카메라 타겟 글라이드 & 우든 이젤/캔버스 출현 & 붓 드로잉
      // =======================================================================
      {
        ...baseFrame,
        delay: 85,
        ...cOff(42, 0),
        ...cScale(1.02, 0.98),
        ...cRot(0.04),
        ...defOff(0, -2),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.15,
        phaseId: "sketch-draw-1",
        phaseName: "2. 이젤 & 캔버스 팝업 출현",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(26, 0),
        ...cRot(0),
        ...defOff(0, 0),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.35,
        phaseId: "sketch-draw-2",
        phaseName: "2. 1차 해칭 & 외곽선 스케치",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(10, 0),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.60,
        phaseId: "sketch-draw-3",
        phaseName: "2. 중앙 분할선 & 디테일 드로잉",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 2,
        effectProgress: 0.85,
        phaseId: "sketch-draw-4",
        phaseName: "2. 붓터치 컬러 워시 채색",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 2,
        effectProgress: 1.00,
        phaseId: "sketch-draw-finish",
        phaseName: "2. 브러시 피니시 터치",
      },

      // =======================================================================
      // Step 3: 스케치 완성! 순백 플래시 & 컬러풀 페인트 스플래시 & 스타버스트 작렬
      // =======================================================================
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        ...defOff(0, -2),
        hitFlash: true,
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.20,
        phaseId: "sketch-splash-1",
        phaseName: "3. 스케치 완성! 1프레임 섬광 & 페인트 폭발",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        ...defOff(0, -1),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.50,
        phaseId: "sketch-splash-2",
        phaseName: "3. 4색 페인트 스플래시 & 충격파 링 확산",
      },
      {
        ...baseFrame,
        delay: 85,
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 3,
        effectProgress: 0.80,
        phaseId: "sketch-splash-3",
        phaseName: "3. 페인트 방울 비산 & 미니 레트로 스타 만개",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 3,
        effectProgress: 1.00,
        phaseId: "sketch-splash-4",
        phaseName: "3. 마스터피스 완성 피날레",
      },

      // =======================================================================
      // Step 4: 캔버스 페이드아웃 & 안착 (moveStep: 4 명시 필수!)
      // =======================================================================
      {
        ...baseFrame,
        delay: 90,
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.40,
        phaseId: "sketch-fade-1",
        phaseName: "4. 캔버스 페이드아웃 & 별빛 잔향",
      },
      {
        ...baseFrame,
        delay: 80,
        ...cOff(0, 0),
        showEffect: true,
        moveStep: 4,
        effectProgress: 0.85,
        fadeEffectOnCameraReturn: true,
        phaseId: "sketch-fade-2",
        phaseName: "4. 완전 안착 & 복귀 준비",
      },
    ];
  },
};
