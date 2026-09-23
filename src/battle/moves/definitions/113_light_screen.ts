// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import {
  drawLightScreenEffect,
  drawLightScreenBehindEffect,
} from "../../../renderers/moves/gen1/move113_116.js";
import {
  createSmoothCameraGlideInFrames,
  createSmoothCameraReturnFrames,
} from "../../../utils/battleCamera.js";

/**
 * 전장 3D 타원 궤도 연산 헬퍼
 * 
 * 전장 중심점 (284, 180)을 축으로 아군과 적군이 타원 궤도를 그리며 180도 선회합니다.
 * @param t 0.0 (0° 아군 뷰) ~ 0.5 (90° 측면 뷰) ~ 1.0 (180° 적 시점 뷰)
 * @param isP 시전자가 플레이어인지 여부
 */
function computeOrbitPose(t: number, isP: boolean) {
  const theta = t * Math.PI;
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);

  const cx = 284;
  const cy = 180;

  // 와이드 아크 샷: 카메라가 전장을 360도 연속 선회
  // 아군은 좌측 외곽(0~180°) -> 우측 외곽(180~360°)으로 회전
  // 적군은 우측 외곽(0~180°) -> 좌측 외곽(180~360°)으로 회전하여
  // 두 포켓몬이 화면 중앙에서 서로 겹치거나 가로지르지 않습니다.
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

  // 90도(t >= 0.45)부터 270도(t <= 1.55)까지는 적 시점 반구(180도 영역):
  // 아군 포켓몬: 카메라와 정면 마주봄 (usePlayerFront = true)
  // 적군 포켓몬: 카메라 앞쪽 등 뒤 시점 (useEnemyBack = true)
  // 레이어: 적군이 전경에 위치하므로 drawEnemyOnTop = true
  //
  // 0도 ~ 90도(t < 0.45) 및 270도 ~ 360도(t > 1.55)는 아군 시점 반구(0도/360도 영역):
  // 아군 포켓몬: 등 뒤 시점 (usePlayerFront = false)
  // 적군 포켓몬: 정면 시점 (useEnemyBack = false)
  // 레이어: 아군이 전경에 위치하므로 drawEnemyOnTop = false
  const inEnemyHemisphere = t >= 0.45 && t <= 1.55;
  const usePlayerFront = inEnemyHemisphere;
  const useEnemyBack = inEnemyHemisphere;
  const drawEnemyOnTop = inEnemyHemisphere;

  // ==========================================================================
  // 🌟 3D 원근감(Perspective Depth) 스케일링:
  // - 0°(0.0) -> 180°(1.0) -> 360°(0.0) 매끄러운 삼각함수 매핑
  // ==========================================================================
  const depthFactor = Math.sin(t * Math.PI * 0.5);
  const pScaleVal = Number((1.0 - 0.30 * depthFactor).toFixed(3));
  const eScaleVal = Number((1.0 + 0.42 * depthFactor).toFixed(3));
  const pScale = { x: pScaleVal, y: pScaleVal };
  const eScale = { x: eScaleVal, y: eScaleVal };

  // ==========================================================================
  // 🌟 지면(발판) 3D 원근감(Perspective Depth) 스케일링
  // ==========================================================================
  const pPlatScale = Number((1.0 - 0.25 * depthFactor).toFixed(3));
  const ePlatScale = Number((1.0 + 0.333 * depthFactor).toFixed(3));

  // ==========================================================================
  // 🌟 전장 360도 연속 회전 3D 다이내믹 카메라 연출 (Dynamic 360° Orbit Camera):
  // - 줌(Zoom): 0°(1.00x) -> 90°(1.35x) -> 180°(1.42x) -> 270°(1.35x) -> 360°(1.00x)
  // - 패닝(Pan): 우측 선회 원심력(-28px) -> 180°(0px) -> 좌측 선회 원심력(+28px) -> 360°(0px)
  // - 롤(Roll): 카메라 3D 뱅킹 틸트 (90° 및 270° 선회 시 -2.4도 기울임 -> 180° 및 360° 안착 시 0도)
  // - 초점(Focal): 회전하면서 시전 포켓몬 쪽으로 집중 후 아군 뷰 복귀 시 전장 중심으로 복귀
  // - 배경 패럴랙스: 360도 연속 회전에 맞춰 순방향 지속 스크롤 (-760 * t)
  // ==========================================================================
  const sinOrbit = Math.sin(t * Math.PI);
  const sinHalf = Math.abs(sinOrbit);

  const zoom = Number((1.00 + 0.05 * sinHalf + 0.42 * depthFactor).toFixed(3));
  const panX = Math.round(-28 * sinOrbit);
  const panY = Math.round(10 * sinHalf - 6 * depthFactor);
  const cameraPan = { x: panX, y: panY };
  const cameraRoll = Number((-0.042 * sinHalf).toFixed(4));

  // 시전 포켓몬 위치(상대 진영)로 카메라 포커스 이동 후 복귀
  const casterTargetX = isP ? 395 : 175;
  const casterTargetY = isP ? 130 : 240;
  const focalX = Math.round(284 + (casterTargetX - 284) * depthFactor);
  const focalY = Math.round(192 + (casterTargetY - 192) * depthFactor);
  const cameraFocal = { x: focalX, y: focalY };

  // 전장 회전에 맞춘 배경 실시간 360도 연속 패럴랙스
  const bgOffsetX = Math.round(-760 * t);

  // 시전자 -> 대상 방향 단위 벡터 (베리어 레이어 3D 공간 정렬용)
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
 * 113: 빛의장막 (Light Screen) - 에스퍼 타입 변화기 (5턴간 특수 피해 50% 반감)
 *
 * 연출 구성:
 * 1. Act 1: 전장 180도 아크 샷 (0° -> 90° 측면 -> 180° 적 시점 정면 대면)
 * 2. Act 2: 적 시점에서 시전 포켓몬 앞에 5개 에스퍼 크리스탈 유리판 순차 전개 & 결계 공명
 * 3. Act 3: 전장 360도 연속 순방향 선회 아크 샷 (180° -> 270° 반대편 측면 -> 360° 원래 아군 뷰)
 * 4. Act 4: 내 포켓몬 뷰 전방 빛의장막 일체형 수호 상태 안착 (360° = 0°)
 */
export const lightScreenMove: BattleMoveAnimation = {
  num: 113,
  key: "light-screen",
  nameKo: "빛의장막",
  nameEn: "Light Screen",
  type: "psychic",
  category: "status",
  camera: { type: "custom" },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    drawLightScreenBehindEffect(targetCtx, frame, drawCtx);
  },
  drawMiddleEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { casterPos, attackerPos, targetPos } = drawCtx;
    const step = frame.moveStep ?? 1;
    const prog = frame.effectProgress ?? 0.5;
    drawLightScreenEffect(targetCtx, casterPos || attackerPos, targetPos, step, prog, frame, drawCtx);
  },
  drawEffect: (_targetCtx: any, _frame: BattleFrame, _drawCtx: EffectDrawContext) => {
    // 3D 뎁스: 베리어는 배경 포켓몬과 전경 포켓몬 사이(drawMiddleEffect)에서 정확한 Z축 순서로 렌더링됩니다.
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
    // 상대는 이미 전장 우상단에서 플레이어를 향해 정면을 마주보고 있으므로,
    // 360° 카메라 선회 대신 5세대 스타일의 부드러운 카메라 포커싱(Glide-In)을 적용합니다.
    // 1. 중립 전장(1.0x) -> 상대 포켓몬으로 부드러운 카메라 줌인 포커싱 (Glide-In)
    // 2. 상대 전방 5단 크리스탈 장막 순차 돌출 & 결계 공명
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

      // 1. 중립 전장(1.0x)에서 상대 포켓몬을 향해 부드러운 줌인 포커싱 (4프레임 x 45ms)
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

      // 2. 포커싱 완료 상태에서 장막 형성 및 공명 연출
      const actionFrames = [
        // #1. 1차 기저 레이어 발현
        makeEnemyFrame(95, 2, 0.50, "enemy-ls-layer-1", "#1. 상대 1차 기저 레이어 발현"),
        makeEnemyFrame(95, 2, 1.00, "enemy-ls-layer-1-glint", "#1. 상대 1차 기저 레이어 형성"),

        // #2. 2, 3차 레이어 돌출
        makeEnemyFrame(90, 3, 0.50, "enemy-ls-layer-23", "#2. 상대 2차 레이어 돌출"),
        makeEnemyFrame(90, 3, 1.00, "enemy-ls-layer-23-dock", "#2. 상대 3차 레이어 중첩 돌출"),

        // #3. 4, 5차 레이어 결합 완성
        makeEnemyFrame(90, 4, 0.50, "enemy-ls-layer-45", "#3. 상대 4차 레이어 돌출"),
        makeEnemyFrame(95, 4, 1.00, "enemy-ls-layer-complete", "#3. 상대 5단 레이어 결합 완성"),

        // #4. 5단 레이어드 공명 펄스
        makeEnemyFrame(85, 5, 0.25, "enemy-ls-sweep-start", "#4. 상대 5단 레이어드 결계 공명 펄스 시작"),
        makeEnemyFrame(85, 5, 0.55, "enemy-ls-sweep-mid", "#4. 상대 5단 레이어드 최고조 결계 공명"),
        makeEnemyFrame(95, 5, 0.95, "enemy-ls-sweep-end", "#4. 상대 5단 레이어드 수호 결계 형성 완료"),

        // #5. 초고속 페이드아웃 (Step 6)
        makeEnemyFrame(45, 6, 0.08, "enemy-ls-fade-1", "#5. 상대 빛의장막 페이드아웃 시작"),
        makeEnemyFrame(40, 6, 0.20, "enemy-ls-fade-2", "#5. 상대 빛의장막 투명화 진행"),
        makeEnemyFrame(40, 6, 0.35, "enemy-ls-fade-complete", "#5. 상대 빛의장막 완전 소멸"),
      ];

      // 3. 소멸 직후 원래 중립 전장(1.0x)으로 부드러운 글라이드아웃 복귀 (5프레임 x 45ms)
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
      makeFrame(0.0000, 65, 1, 0.04, "lightscreen-arc-in-01", "#1. 180도 전장 아크 샷 (출발 0°)"),
      makeFrame(0.0625, 40, 1, 0.10, "lightscreen-arc-in-02", "#1. 180도 전장 아크 샷 (선회 가속 11.25°)"),
      makeFrame(0.1250, 40, 1, 0.16, "lightscreen-arc-in-03", "#1. 180도 전장 아크 샷 (우측 선회 22.5°)"),
      makeFrame(0.1875, 40, 1, 0.22, "lightscreen-arc-in-04", "#1. 180도 전장 아크 샷 (원호 선회 33.75°)"),
      makeFrame(0.2500, 40, 1, 0.28, "lightscreen-arc-in-05", "#1. 180도 전장 아크 샷 (선회 45°)"),
      makeFrame(0.3125, 40, 1, 0.35, "lightscreen-arc-in-06", "#1. 180도 전장 아크 샷 (측면 접근 56.25°)"),
      makeFrame(0.3750, 40, 1, 0.42, "lightscreen-arc-in-07", "#1. 180도 전장 아크 샷 (측면 접근 67.5°)"),
      makeFrame(0.4375, 40, 1, 0.49, "lightscreen-arc-in-08", "#1. 180도 전장 아크 샷 (측면 도달 78.75°)"),
      makeFrame(0.5000, 40, 1, 0.56, "lightscreen-arc-in-09", "#1. 180도 전장 아크 샷 (90° 측면 대치 정점 통과)"),
      makeFrame(0.5625, 40, 1, 0.63, "lightscreen-arc-in-10", "#1. 180도 전장 아크 샷 (적 진영 선회 101.25°)"),
      makeFrame(0.6250, 40, 1, 0.70, "lightscreen-arc-in-11", "#1. 180도 전장 아크 샷 (적 진영 진입 112.5°)"),
      makeFrame(0.6875, 40, 1, 0.76, "lightscreen-arc-in-12", "#1. 180도 전장 아크 샷 (정면 유도 123.75°)"),
      makeFrame(0.7500, 40, 1, 0.82, "lightscreen-arc-in-13", "#1. 180도 전장 아크 샷 (정면 정렬 135°)"),
      makeFrame(0.8125, 40, 1, 0.88, "lightscreen-arc-in-14", "#1. 180도 전장 아크 샷 (적 시점 근접 146.25°)"),
      makeFrame(0.8750, 40, 1, 0.94, "lightscreen-arc-in-15", "#1. 180도 전장 아크 샷 (적 시점 도달 감속 157.5°)"),
      makeFrame(0.9375, 45, 1, 0.98, "lightscreen-arc-in-16", "#1. 180도 전장 아크 샷 (최종 정렬 168.75°)"),
      makeFrame(1.0000, 75, 1, 1.00, "lightscreen-arc-in-complete", "#1. 적 시점 180° 안착 (시전 포켓몬 정면 대면)"),

      // ======================================================================
      // Act 2: 적 시점에서 5단 전방 레이어드 에스퍼 장막 순차 전개 (t = 1.0 유지)
      // ======================================================================
      // #18. 1차 기저 레이어 발현
      makeFrame(1.0, 95, 2, 0.50, "lightscreen-layer-1", "#2. 1차 기저 레이어 장막 발현"),

      // #19. 1차 기저 레이어 완성
      makeFrame(1.0, 95, 2, 1.0, "lightscreen-layer-1-glint", "#2. 1차 기저 레이어 장막 형성"),

      // #20. 2차 레이어 전방 돌출
      makeFrame(1.0, 90, 3, 0.50, "lightscreen-layer-23", "#3. 2차 레이어 전방 돌출"),

      // #21. 3차 레이어 전방 돌출
      makeFrame(1.0, 90, 3, 1.0, "lightscreen-layer-23-dock", "#3. 3차 레이어 전방 중첩 돌출"),

      // #22. 4차 레이어 전방 돌출
      makeFrame(1.0, 90, 4, 0.50, "lightscreen-layer-45", "#4. 4차 레이어 전방 돌출"),

      // #23. 5단 전방 레이어드 장막 완성!
      makeFrame(1.0, 95, 4, 1.0, "lightscreen-layer-complete", "#4. 5단 전방 레이어드 결합 완성"),

      // #24. 5단 레이어드 결계 공명 시작
      makeFrame(1.0, 85, 5, 0.25, "lightscreen-sweep-start", "#5. 5단 레이어드 결계 공명 펄스 시작"),

      // #25. 5단 레이어드 결계 공명 정점
      makeFrame(1.0, 85, 5, 0.55, "lightscreen-sweep-mid", "#5. 5단 레이어드 최고조 결계 공명"),

      // #26. 5단 레이어드 결계 공명 완료
      makeFrame(1.0, 95, 5, 0.95, "lightscreen-sweep-end", "#5. 5단 레이어드 수호 결계 형성 완료"),

      // ======================================================================
      // Act 3: 전장 360도 순방향 아크 샷 지속 선회 (180° -> 270° -> 360°)
      // (#27부터 쌓인 베리어들 투명도 진행/페이드아웃 시작)
      // ======================================================================
      // #27. 360도 순방향 아크 샷 & 베리어 페이드아웃 시작
      makeFrame(1.0625, 45, 6, 0.06, "lightscreen-arc-out-01", "#6. 360도 순방향 아크 샷 & 페이드아웃 시작 (191.25°)"),
      makeFrame(1.1250, 40, 6, 0.12, "lightscreen-arc-out-02", "#6. 360도 순방향 아크 샷 (선회 지속 202.5°)"),
      makeFrame(1.1875, 40, 6, 0.18, "lightscreen-arc-out-03", "#6. 360도 순방향 아크 샷 (선회 가속 213.75°)"),
      makeFrame(1.2500, 40, 6, 0.25, "lightscreen-arc-out-04", "#6. 360도 순방향 아크 샷 (선회 지속 225°)"),
      makeFrame(1.3125, 40, 6, 0.32, "lightscreen-arc-out-05", "#6. 360도 순방향 아크 샷 (선회 지속 236.25°)"),
      makeFrame(1.3750, 40, 6, 0.38, "lightscreen-arc-out-06", "#6. 360도 순방향 아크 샷 (반대편 진영 통과 247.5°)"),
      makeFrame(1.4375, 40, 6, 0.44, "lightscreen-arc-out-07", "#6. 360도 순방향 아크 샷 (측면 접근 258.75°)"),
      makeFrame(1.5000, 40, 6, 0.50, "lightscreen-arc-out-08", "#6. 360도 순방향 아크 샷 (270° 반대편 측면 대치 통과)"),
      makeFrame(1.5625, 40, 6, 0.56, "lightscreen-arc-out-09", "#6. 360도 순방향 아크 샷 (선회 지속 281.25°)"),
      makeFrame(1.6250, 40, 6, 0.63, "lightscreen-arc-out-10", "#6. 360도 순방향 아크 샷 (등 뒤 접근 292.5°)"),
      makeFrame(1.6875, 40, 6, 0.70, "lightscreen-arc-out-11", "#6. 360도 순방향 아크 샷 (아군 등 뒤 유도 303.75°)"),
      makeFrame(1.7500, 40, 6, 0.76, "lightscreen-arc-out-12", "#6. 360도 순방향 아크 샷 (선회 감속 315°)"),
      makeFrame(1.8125, 40, 6, 0.82, "lightscreen-arc-out-13", "#6. 360도 순방향 아크 샷 (아군 등 뒤 접근 326.25°)"),
      makeFrame(1.8750, 40, 6, 0.88, "lightscreen-arc-out-14", "#6. 360도 순방향 아크 샷 (아군 등 뒤 정렬 337.5°)"),
      makeFrame(1.9375, 40, 6, 0.94, "lightscreen-arc-out-15", "#6. 360도 순방향 아크 샷 (최종 감속 348.75°)"),
      makeFrame(2.0000, 75, 6, 1.00, "lightscreen-arc-out-complete", "#6. 360도 회전 완료 및 원래 아군 뷰 복귀 (360°)"),

      // ======================================================================
      // Act 4: 내 포켓몬 뷰 전방 빛의장막 수호 상태 안착 (t = 2.0 / 360°)
      // ======================================================================
      {
        ...baseFrame,
        ...computeOrbitPose(2.0, isP),
        delay: 110,
        moveStep: 7,
        effectProgress: 0.5,
        hideHud: false,
        hideUI: false,
        phaseId: "lightscreen-guard-settle",
        phaseName: "#7. 아군 전방 빛의장막 수호 장막 안착",
      },
      {
        ...baseFrame,
        ...computeOrbitPose(2.0, isP),
        delay: 130,
        moveStep: 7,
        effectProgress: 1.0,
        hideHud: false,
        hideUI: false,
        phaseId: "lightscreen-guard-steady",
        phaseName: "#7. 빛의장막 전개 완료 & 수호 상태 유지",
      },
    ];
  },
};
