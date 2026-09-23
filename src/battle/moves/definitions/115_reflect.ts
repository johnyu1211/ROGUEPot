// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawReflectEffect,
  drawReflectBehindEffect,
} from "../../../renderers/moves/gen1/move113_116.js";
import {
  createSmoothCameraGlideInFrames,
  createSmoothCameraReturnFrames,
} from "../../../utils/battleCamera.js";

/**
 * 전장 3D 타원 궤도 연산 헬퍼 (빛의장막 공유 표준 아크 샷 규격)
 * 
 * 전장 중심점 (284, 180)을 축으로 아군과 적군이 타원 궤도를 그리며 180도 선회합니다.
 * @param t 0.0 (0° 아군 뷰) ~ 0.5 (90° 측면 뷰) ~ 1.0 (180° 적 시점 뷰) ~ 2.0 (360° 복귀)
 * @param isP 시전자가 플레이어인지 여부
 */
function computeOrbitPose(t: number, isP: boolean) {
  const theta = t * Math.PI;
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);

  const cx = 284;
  const cy = 180;

  // 와이드 아크 샷: 카메라가 전장을 360도 연속 선회
  const W_x = 150;
  const W_y = 25;

  // 아군(Player) 와이드 3D 궤적: (150, 245) -> 180° (418, 115) -> 360° (150, 245)
  const P_x = cx - 134 * cosT - W_x * sinT;
  const P_y = cy + 65 * cosT - W_y * sinT;

  // 적군(Enemy) 와이드 3D 궤적: (418, 116) -> 180° (150, 245) -> 360° (418, 116)
  const E_x = cx + 134 * cosT + W_x * sinT;
  const E_y = cy - 64 * cosT + W_y * sinT;

  const playerPos = { x: P_x, y: P_y };
  const enemyPos = { x: E_x, y: E_y };

  const pOffset = {
    x: Math.round(playerPos.x - 150),
    y: Math.round(playerPos.y - 245),
  };
  const eOffset = {
    x: Math.round(enemyPos.x - 418),
    y: Math.round(enemyPos.y - 116),
  };

  const inEnemyHemisphere = t >= 0.45 && t <= 1.55;
  const usePlayerFront = inEnemyHemisphere;
  const useEnemyBack = inEnemyHemisphere;
  const drawEnemyOnTop = inEnemyHemisphere;

  // 3D 원근감(Perspective Depth) 스케일링
  const depthFactor = Math.sin(t * Math.PI * 0.5);
  const pScaleVal = Number((1.0 - 0.30 * depthFactor).toFixed(3));
  const eScaleVal = Number((1.0 + 0.42 * depthFactor).toFixed(3));
  const pScale = { x: pScaleVal, y: pScaleVal };
  const eScale = { x: eScaleVal, y: eScaleVal };

  // 발판 3D 원근감 스케일링
  const pPlatScale = Number((1.0 - 0.25 * depthFactor).toFixed(3));
  const ePlatScale = Number((1.0 + 0.333 * depthFactor).toFixed(3));

  // 360도 연속 회전 3D 다이내믹 카메라
  const sinOrbit = Math.sin(t * Math.PI);
  const sinHalf = Math.abs(sinOrbit);

  const zoom = Number((1.00 + 0.05 * sinHalf + 0.42 * depthFactor).toFixed(3));
  const panX = Math.round(-28 * sinOrbit);
  const panY = Math.round(10 * sinHalf - 6 * depthFactor);
  const cameraPan = { x: panX, y: panY };
  const cameraRoll = Number((-0.042 * sinHalf).toFixed(4));

  const casterTargetX = isP ? 395 : 175;
  const casterTargetY = isP ? 130 : 240;
  const focalX = Math.round(284 + (casterTargetX - 284) * depthFactor);
  const focalY = Math.round(192 + (casterTargetY - 192) * depthFactor);
  const cameraFocal = { x: focalX, y: focalY };

  const bgOffsetX = Math.round(-760 * t);

  const casterP = isP ? playerPos : enemyPos;
  const targetP = isP ? enemyPos : playerPos;
  const vX = targetP.x - casterP.x;
  const vY = targetP.y - casterP.y;
  const vLen = Math.hypot(vX, vY) || 1;
  const dirX = Number((vX / vLen).toFixed(4));
  const dirY = Number((vY / vLen).toFixed(4));

  return {
    pOffset,
    eOffset,
    pScale,
    eScale,
    usePlayerFront,
    useEnemyBack,
    drawEnemyOnTop,
    cameraZoom: zoom,
    cameraPan,
    cameraRoll,
    cameraFocal,
    bgOffsetX,
    hidePlatform: false,
    pPlatOffset: pOffset,
    ePlatOffset: eOffset,
    pPlatScale,
    ePlatScale,
    orbitT: t,
    dirX,
    dirY,
  };
}

/**
 * 115: 리플렉터 (Reflect) - 에스퍼 타입 변화기 (5턴간 물리 피해 50% 반감)
 *
 * 연출 구성 (빛의장막 카메라 아크 샷 & 3D 육각형 베리어):
 * 1. Act 1: 전장 180도 아크 샷 (0° -> 90° 측면 -> 180° 적 시점 정면 대면)
 * 2. Act 2: 적 시점에서 시전 포켓몬 앞에 5단 3D 에메랄드 육각 크리스탈 거울 패널 순차 전개 & 결계 공명 & 사선 반사광
 * 3. Act 3: 전장 360도 연속 순방향 선회 아크 샷 (180° -> 270° -> 360° 원래 아군 뷰 복귀 및 에메랄드 스타더스트 분산)
 * 4. Act 4: 내 포켓몬 뷰 전방 리플렉터 일체형 수호 상태 안착 (360° = 0°)
 */
export const reflectMove: BattleMoveAnimation = {
  num: 115,
  key: "reflect",
  nameKo: "리플렉터",
  nameEn: "Reflect",
  type: "psychic",
  category: "status",
  camera: { type: "custom" },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawReflectBehindEffect(targetCtx, frame, drawCtx);
  },
  drawMiddleEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { casterPos, attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawReflectEffect(targetCtx, casterPos || attackerPos, targetPos, step, prog, frame, drawCtx);
  },
  drawEffect: (_targetCtx: any, _frame: BattleFrame, _drawCtx: EffectDrawContext) => {
    // 3D 뎁스: 육각 베리어는 배경 포켓몬과 전경 포켓몬 사이(drawMiddleEffect)에서 정확한 Z축 순서로 렌더링됩니다.
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
      hideHud: true,
      hideUI: true,
      hidePlayer: false,
      hideEnemy: false,
      showEffect: true,
    };

    // ========================================================================
    // 🌟 상대(Enemy) 시전 시:
    // 360° 카메라 선회 대신 5세대 스타일의 부드러운 카메라 포커싱(Glide-In) 적용
    // 1. 중립 전장(1.0x) -> 상대 포켓몬으로 부드러운 카메라 줌인 포커싱 (Glide-In)
    // 2. 상대 전방 5단 3D 에메랄드 육각 크리스탈 결계 순차 돌출 & 공명 반사광
    // 3. 초고속 페이드아웃 (단 3~4프레임)
    // 4. 원래 중립 전장으로 부드러운 카메라 글라이드아웃 복귀 (Return Dolly-Out)
    // ========================================================================
    if (!isP) {
      const neutralX = 280;
      const neutralY = 190;
      const enemyPos = { x: 418, y: 116 };
      const enemyFocal = {
        x: Math.round(neutralX + (enemyPos.x - neutralX) * 0.48), // 346
        y: Math.round(neutralY + (enemyPos.y - neutralY) * 0.48), // 154
      };
      const enemyZoom = 1.25;

      const enemyBaseFrame: BattleFrame = {
        ...baseFrame,
        delay: 45,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        pScale: { x: 1.0, y: 1.0 },
        eScale: { x: 1.0, y: 1.0 },
        usePlayerFront: false,
        useEnemyBack: false,
        drawEnemyOnTop: false,
        cameraZoom: enemyZoom,
        cameraPan: { x: 0, y: 0 },
        cameraRoll: 0,
        cameraFocal: enemyFocal,
        bgOffsetX: 0,
        hidePlatform: false,
        hideHud: false,
        hideUI: false,
        _gen5Camera: true,
        dirX: -0.901, // 상대 -> 아군 방향 (-X)
        dirY: 0.434,
      };

      // 1. 중립 전장에서 상대 포켓몬을 향해 부드러운 줌인 포커싱 (4프레임 x 45ms)
      const glideInFrames = createSmoothCameraGlideInFrames(
        enemyBaseFrame,
        enemyZoom,
        enemyFocal,
        neutralX,
        neutralY,
        4,
        45
      );

      const makeEnemyFrame = (
        delay: number,
        moveStep: number,
        effectProgress: number,
        phaseId: string,
        phaseName: string
      ): BattleFrame => ({
        ...enemyBaseFrame,
        delay,
        moveStep,
        effectProgress,
        phaseId,
        phaseName,
      });

      // 2. 포커싱 완료 상태에서 육각 장막 형성 및 공명 연출
      const actionFrames = [
        // #1. 1차 기저 육각 레이어 발현
        makeEnemyFrame(95, 2, 0.50, "enemy-rf-layer-1", "#1. 상대 1차 기저 육각 레이어 발현"),
        makeEnemyFrame(95, 2, 1.00, "enemy-rf-layer-1-dock", "#1. 상대 1차 기저 육각 레이어 형성"),

        // #2. 2, 3차 육각 레이어 돌출
        makeEnemyFrame(90, 3, 0.50, "enemy-rf-layer-23", "#2. 상대 2차 육각 레이어 돌출"),
        makeEnemyFrame(90, 3, 1.00, "enemy-rf-layer-23-dock", "#2. 상대 3차 육각 레이어 중첩 돌출"),

        // #3. 4, 5차 육각 레이어 결합 완성
        makeEnemyFrame(90, 4, 0.50, "enemy-rf-layer-45", "#3. 상대 4차 육각 레이어 돌출"),
        makeEnemyFrame(95, 4, 1.00, "enemy-rf-layer-complete", "#3. 상대 5단 육각 레이어 결합 완성"),

        // #4. 5단 레이어드 육각 공명 펄스 & 사선 반사광
        makeEnemyFrame(85, 5, 0.25, "enemy-rf-sweep-start", "#4. 상대 5단 육각 결계 공명 펄스 시작"),
        makeEnemyFrame(85, 5, 0.55, "enemy-rf-sweep-mid", "#4. 상대 5단 육각 최고조 결계 공명 & 사선 반사광"),
        makeEnemyFrame(95, 5, 0.95, "enemy-rf-sweep-end", "#4. 상대 5단 육각 수호 결계 형성 완료"),

        // #5. 초고속 페이드아웃 (Step 6)
        makeEnemyFrame(45, 6, 0.08, "enemy-rf-fade-1", "#5. 상대 리플렉터 페이드아웃 시작"),
        makeEnemyFrame(40, 6, 0.20, "enemy-rf-fade-2", "#5. 상대 리플렉터 투명화 진행"),
        makeEnemyFrame(40, 6, 0.35, "enemy-rf-fade-complete", "#5. 상대 리플렉터 완전 소멸"),
      ];

      // 3. 소멸 직후 원래 중립 전장으로 부드러운 글라이드아웃 복귀 (5프레임 x 45ms)
      const lastFadeFrame = actionFrames[actionFrames.length - 1];
      const returnFrames = createSmoothCameraReturnFrames(
        lastFadeFrame,
        enemyZoom,
        enemyFocal,
        neutralX,
        neutralY,
        5,
        45
      );

      return [...glideInFrames, ...actionFrames, ...returnFrames];
    }

    const makeFrame = (
      t: number,
      delay: number,
      moveStep: number,
      effectProgress: number,
      phaseId: string,
      phaseName: string
    ): BattleFrame => {
      const orbit = computeOrbitPose(t, isP);
      return {
        ...baseFrame,
        ...orbit,
        delay,
        moveStep,
        effectProgress,
        phaseId,
        phaseName,
      };
    };

    return [
      // ======================================================================
      // Act 1: 전장 180도 아크 샷 (Battlefield Arc Shot 진입: 0° -> 90° -> 180°)
      // 17개 고밀도 키프레임으로 3D 카메라 비행감 및 유려한 선회 모션 극대화
      // ======================================================================
      makeFrame(0.0000, 65, 1, 0.04, "reflect-arc-in-01", "#1. 180도 전장 아크 샷 (출발 0°)"),
      makeFrame(0.0625, 40, 1, 0.10, "reflect-arc-in-02", "#1. 180도 전장 아크 샷 (선회 가속 11.25°)"),
      makeFrame(0.1250, 40, 1, 0.16, "reflect-arc-in-03", "#1. 180도 전장 아크 샷 (우측 선회 22.5°)"),
      makeFrame(0.1875, 40, 1, 0.22, "reflect-arc-in-04", "#1. 180도 전장 아크 샷 (원호 선회 33.75°)"),
      makeFrame(0.2500, 40, 1, 0.28, "reflect-arc-in-05", "#1. 180도 전장 아크 샷 (선회 45°)"),
      makeFrame(0.3125, 40, 1, 0.35, "reflect-arc-in-06", "#1. 180도 전장 아크 샷 (측면 접근 56.25°)"),
      makeFrame(0.3750, 40, 1, 0.42, "reflect-arc-in-07", "#1. 180도 전장 아크 샷 (측면 접근 67.5°)"),
      makeFrame(0.4375, 40, 1, 0.49, "reflect-arc-in-08", "#1. 180도 전장 아크 샷 (측면 도달 78.75°)"),
      makeFrame(0.5000, 40, 1, 0.56, "reflect-arc-in-09", "#1. 180도 전장 아크 샷 (90° 측면 대치 정점 통과)"),
      makeFrame(0.5625, 40, 1, 0.63, "reflect-arc-in-10", "#1. 180도 전장 아크 샷 (적 진영 선회 101.25°)"),
      makeFrame(0.6250, 40, 1, 0.70, "reflect-arc-in-11", "#1. 180도 전장 아크 샷 (적 진영 진입 112.5°)"),
      makeFrame(0.6875, 40, 1, 0.76, "reflect-arc-in-12", "#1. 180도 전장 아크 샷 (정면 유도 123.75°)"),
      makeFrame(0.7500, 40, 1, 0.82, "reflect-arc-in-13", "#1. 180도 전장 아크 샷 (정면 정렬 135°)"),
      makeFrame(0.8125, 40, 1, 0.88, "reflect-arc-in-14", "#1. 180도 전장 아크 샷 (적 시점 근접 146.25°)"),
      makeFrame(0.8750, 40, 1, 0.94, "reflect-arc-in-15", "#1. 180도 전장 아크 샷 (적 시점 도달 감속 157.5°)"),
      makeFrame(0.9375, 45, 1, 0.98, "reflect-arc-in-16", "#1. 180도 전장 아크 샷 (최종 정렬 168.75°)"),
      makeFrame(1.0000, 75, 1, 1.00, "reflect-arc-in-complete", "#1. 적 시점 180° 안착 (시전 포켓몬 정면 대면)"),

      // ======================================================================
      // Act 2: 적 시점에서 5단 전방 레이어드 에메랄드 육각 장막 순차 전개 (t = 1.0 유지)
      // ======================================================================
      // 1차 기저 육각 레이어 발현
      makeFrame(1.0, 95, 2, 0.50, "reflect-layer-1", "#2. 1차 기저 육각 레이어 장막 발현"),

      // 1차 기저 육각 레이어 완성
      makeFrame(1.0, 95, 2, 1.0, "reflect-layer-1-dock", "#2. 1차 기저 육각 레이어 장막 형성"),

      // 2차 육각 레이어 전방 돌출
      makeFrame(1.0, 90, 3, 0.50, "reflect-layer-23", "#3. 2차 육각 레이어 전방 돌출"),

      // 3차 육각 레이어 전방 돌출
      makeFrame(1.0, 90, 3, 1.0, "reflect-layer-23-dock", "#3. 3차 육각 레이어 전방 중첩 돌출"),

      // 4차 육각 레이어 전방 돌출
      makeFrame(1.0, 90, 4, 0.50, "reflect-layer-45", "#4. 4차 육각 레이어 전방 돌출"),

      // 5단 전방 레이어드 육각 장막 완성!
      makeFrame(1.0, 95, 4, 1.0, "reflect-layer-complete", "#4. 5단 전방 육각 레이어드 결합 완성"),

      // 5단 레이어드 육각 결계 공명 시작
      makeFrame(1.0, 85, 5, 0.25, "reflect-sweep-start", "#5. 5단 육각 결계 공명 펄스 시작"),

      // 5단 레이어드 육각 결계 최고조 공명 & 사선 반사광
      makeFrame(1.0, 85, 5, 0.55, "reflect-sweep-mid", "#5. 5단 육각 최고조 결계 공명 & 사선 반사광"),

      // 5단 레이어드 육각 결계 형성 완료
      makeFrame(1.0, 95, 5, 0.95, "reflect-sweep-end", "#5. 5단 육각 수호 결계 형성 완료"),

      // ======================================================================
      // Act 3: 전장 360도 순방향 아크 샷 지속 선회 (180° -> 270° -> 360°)
      // (베리어 초고속 페이드아웃 및 에메랄드 스타더스트 분산)
      // ======================================================================
      makeFrame(1.0625, 45, 6, 0.06, "reflect-arc-out-01", "#6. 360도 순방향 아크 샷 & 페이드아웃 시작 (191.25°)"),
      makeFrame(1.1250, 40, 6, 0.12, "reflect-arc-out-02", "#6. 360도 순방향 아크 샷 (선회 지속 202.5°)"),
      makeFrame(1.1875, 40, 6, 0.18, "reflect-arc-out-03", "#6. 360도 순방향 아크 샷 (선회 가속 213.75°)"),
      makeFrame(1.2500, 40, 6, 0.25, "reflect-arc-out-04", "#6. 360도 순방향 아크 샷 (선회 지속 225°)"),
      makeFrame(1.3125, 40, 6, 0.32, "reflect-arc-out-05", "#6. 360도 순방향 아크 샷 (선회 지속 236.25°)"),
      makeFrame(1.3750, 40, 6, 0.38, "reflect-arc-out-06", "#6. 360도 순방향 아크 샷 (반대편 진영 통과 247.5°)"),
      makeFrame(1.4375, 40, 6, 0.44, "reflect-arc-out-07", "#6. 360도 순방향 아크 샷 (측면 접근 258.75°)"),
      makeFrame(1.5000, 40, 6, 0.50, "reflect-arc-out-08", "#6. 360도 순방향 아크 샷 (270° 반대편 측면 대치 통과)"),
      makeFrame(1.5625, 40, 6, 0.56, "reflect-arc-out-09", "#6. 360도 순방향 아크 샷 (선회 지속 281.25°)"),
      makeFrame(1.6250, 40, 6, 0.63, "reflect-arc-out-10", "#6. 360도 순방향 아크 샷 (등 뒤 접근 292.5°)"),
      makeFrame(1.6875, 40, 6, 0.70, "reflect-arc-out-11", "#6. 360도 순방향 아크 샷 (아군 등 뒤 유도 303.75°)"),
      makeFrame(1.7500, 40, 6, 0.76, "reflect-arc-out-12", "#6. 360도 순방향 아크 샷 (선회 감속 315°)"),
      makeFrame(1.8125, 40, 6, 0.82, "reflect-arc-out-13", "#6. 360도 순방향 아크 샷 (아군 등 뒤 접근 326.25°)"),
      makeFrame(1.8750, 40, 6, 0.88, "reflect-arc-out-14", "#6. 360도 순방향 아크 샷 (아군 등 뒤 정렬 337.5°)"),
      makeFrame(1.9375, 40, 6, 0.94, "reflect-arc-out-15", "#6. 360도 순방향 아크 샷 (최종 감속 348.75°)"),
      makeFrame(2.0000, 75, 6, 1.00, "reflect-arc-out-complete", "#6. 360도 회전 완료 및 원래 아군 뷰 복귀 (360°)"),

      // ======================================================================
      // Act 4: 내 포켓몬 뷰 전방 리플렉터 수호 상태 안착 (t = 2.0 / 360°)
      // ======================================================================
      {
        ...baseFrame,
        ...computeOrbitPose(2.0, isP),
        delay: 110,
        moveStep: 7,
        effectProgress: 0.5,
        hideHud: false,
        hideUI: false,
        phaseId: "reflect-guard-settle",
        phaseName: "#7. 아군 전방 리플렉터 육각 수호 장막 안착",
      },
      {
        ...baseFrame,
        ...computeOrbitPose(2.0, isP),
        delay: 130,
        moveStep: 7,
        effectProgress: 1.0,
        hideHud: false,
        hideUI: false,
        phaseId: "reflect-guard-steady",
        phaseName: "#7. 리플렉터 전개 완료 & 수호 상태 유지",
      },
    ];
  },
};
