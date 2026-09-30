// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { BattleMoveAnimation, MoveContext, BattleFrame, EffectDrawContext } from "../types.js";
import { drawExplosionEffect, drawExplosionBehindEffect } from "../../../renderers/moves/gen1/move153_156.js";

/**
 * 전장 3D 타원 궤도 연산 헬퍼 (시전자 중심 360° ORBIT 샷)
 * 
 * 시전 포켓몬을 화면 정중앙에 고정하고, 카메라가 시전 포켓몬을 축으로 360도 선회합니다.
 * @param t 0.0 (0° 시작) ~ 1.0 (180° 정면 대면) ~ 2.0 (360° 복귀)
 * @param isP 시전자가 플레이어인지 여부
 */
function computeCasterCenteredOrbitPose(t: number, isP: boolean) {
  const theta = t * Math.PI;

  // 시전자(Caster) 원점
  const casterX = isP ? 150 : 418;
  const casterY = isP ? 245 : 116;

  // 피격자(Target) 기본 위치
  const targetBaseX = isP ? 418 : 150;
  const targetBaseY = isP ? 116 : 245;

  // 시전자 -> 피격자 상대 벡터
  const dx0 = targetBaseX - casterX;
  const dy0 = targetBaseY - casterY;

  // 2.5D 타원 원근비 (배틀 필드 기울기)
  const yAspect = 0.44;
  const angle0 = Math.atan2(dy0 / yAspect, dx0);
  const radius = Math.hypot(dx0, dy0 / yAspect);

  // 카메라가 시전자를 축으로 theta만큼 시계방향 회전하면,
  // 상대방은 카메라 기준 반시계방향(angle0 - theta)으로 공전합니다.
  const currentAngle = angle0 - theta;
  const relX = Math.round(radius * Math.cos(currentAngle));

  // 🌟 [유저 요구사항 100% 반영]: "화면 아래쪽으로는 이탈해도 상관없는데"
  // 전경(화면 아래쪽, sin > 0)으로 스윙할 때는 카메라 앞쪽으로 과감하게 돌출하여
  // 화면 하단으로 자연스럽게 넘나들며 압도적인 3D 입체감과 전경감을 연출!
  const sinVal = Math.sin(currentAngle);
  const fgMultiplier = sinVal > 0 ? (isP ? 1.30 : 1.55) : 1.0;
  const rawRelY = radius * sinVal * yAspect * fgMultiplier;

  // 🌟 상공(하늘 배경 영역 Y < 116)은 지평선(116px)으로 철저히 차단 (화면 아래쪽은 자유롭게 진입/이탈 허용!)
  const SKY_LIMIT_Y = 116;
  const rawTargetY = casterY + rawRelY;
  let currentTargetY: number;
  if (rawTargetY < SKY_LIMIT_Y) {
    const diff = SKY_LIMIT_Y - rawTargetY;
    currentTargetY = Math.round(SKY_LIMIT_Y - Math.tanh(diff / 40) * 8); // 108px ~ 116px 완만 수렴
  } else {
    currentTargetY = Math.round(rawTargetY);
  }
  const relY = currentTargetY - casterY;

  const currentTargetX = casterX + relX;

  // 🌟 시전자는 화면 정중앙 고정 (offset: 0, 0)
  const pOffset = isP ? { x: 0, y: 0 } : { x: currentTargetX - 150, y: currentTargetY - 245 };
  const eOffset = !isP ? { x: 0, y: 0 } : { x: currentTargetX - 418, y: currentTargetY - 116 };

  // 🌟 [유저 피드백 완벽 반영]: 
  // 포켓몬이 상시 납작해져 있지 않고, 앞/뒤 전환 구간(90°, 270°)에서만 빠르게 휙 돌고
  // 나머지 구간에서는 시원하게 정면/후면을 유지하며 카메라가 '쭉~ 둘러서' 선회!
  let casterScaleX = 1.0;
  if (t >= 0.38 && t <= 0.62) {
    // 90도 전후 전환 구간: 0.38(1.0) -> 0.50(0.15) -> 0.62(1.0)
    const dist = Math.abs(t - 0.50) / 0.12; // 0.0(중심) ~ 1.0(외곽)
    casterScaleX = Number((0.15 + 0.85 * dist).toFixed(3));
  } else if (t >= 1.38 && t <= 1.62) {
    // 270도 전후 전환 구간: 1.38(1.0) -> 1.50(0.15) -> 1.62(1.0)
    const dist = Math.abs(t - 1.50) / 0.12;
    casterScaleX = Number((0.15 + 0.85 * dist).toFixed(3));
  } else {
    casterScaleX = 1.0;
  }

  // 플레이어/상대 시전 시 전면/후면 및 레이어 순서 완벽 동기화
  const inFrontHemisphere = t >= 0.50 && t <= 1.50;
  const usePlayerFront = isP ? inFrontHemisphere : (relY <= 0);
  const useEnemyBack = !isP ? inFrontHemisphere : (relY > 0);
  const drawEnemyOnTop = isP ? (relY > 0) : (relY <= 0);

  // 🌟 [유저 피드백 완벽 반영]: 원근감(Perspective Depth) 스케일링 & "화면 아래쪽으로는 이탈해도 상관없음"
  // 1) 시전자: 상대 시전 시에도 상대 스프라이트가 왜소해 보이지 않도록 기본 1.55배 당당한 스케일 부여
  // 2) 피격자/공전 스프라이트: 화면 아래쪽(전경, 카메라 바로 앞)으로 내려올 때 1.75배로 시원하게 확대하여
  //    화면 하단으로 과감하게 오가며 압도적인 3D 원근 입체감 실현!
  let pScale: { x: number; y: number };
  let eScale: { x: number; y: number };

  if (isP) {
    // 플레이어 시전: 시전자(Player) 1.0x 중심, 상대(Enemy) 전경 하단으로 내려올 때 0.85 -> 1.75x 대폭 확대!
    const normDepth = Math.max(0, Math.min(1.0, (relY + 130) / 350));
    const enemyScaleVal = Number((0.85 + 0.90 * normDepth).toFixed(3));
    pScale = { x: casterScaleX, y: 1.0 };
    eScale = { x: enemyScaleVal, y: enemyScaleVal };
  } else {
    // 상대 시전: 시전자(Enemy) 1.55x 기본 스케일로 화면 장악력 부여, 피격자(Player) 전경 하단으로 내려올 때 0.85 -> 1.75x 대폭 확대!
    const normDepth = Math.max(0, Math.min(1.0, relY / 250));
    const playerScaleVal = Number((0.85 + 0.90 * normDepth).toFixed(3));
    const enemyScaleX = Number((casterScaleX * 1.55).toFixed(3));
    pScale = { x: playerScaleVal, y: playerScaleVal };
    eScale = { x: enemyScaleX, y: 1.55 };
  }

  // 🌟 [유저 요구사항]: "줌아웃하면서 ORBIT샷으로 시전포켓몬을 비추면서 360 회전하면서 축소했다가 확대해서 가까이 붙인 후"
  // t: 0.0 -> 0.9 : 1.00 -> 0.78 (축소 줌아웃으로 시전자 중심 전장 360° 회전 조망)
  // t: 0.9 -> 2.0 : 0.78 -> 1.50 (확대 줌인으로 시전자 초근접 확대 밀착!)
  let zoom = 1.0;
  if (t <= 0.9) {
    const u = t / 0.9;
    zoom = Number((1.00 - 0.22 * Math.sin(u * Math.PI * 0.5)).toFixed(3));
  } else {
    const u = (t - 0.9) / 1.1;
    const smoothU = u * u * (3 - 2 * u);
    zoom = Number((0.78 + (1.50 - 0.78) * smoothU).toFixed(3));
  }

  // 🌟 카메라 포커스: 시전 포켓몬에게 고정!
  // t: 0.0 -> 0.35 동안 전장 기본 중심(284, 180)에서 시전자(casterX, casterY)로 부드럽게 글라이드
  const neutralX = 284;
  const neutralY = 180;
  const glideT = Math.min(1.0, t / 0.35);
  const smoothGlide = glideT * glideT * (3 - 2 * glideT);
  const focalX = Math.round(neutralX + (casterX - neutralX) * smoothGlide);
  const focalY = Math.round(neutralY + (casterY - neutralY) * smoothGlide);
  const cameraFocal = { x: focalX, y: focalY };

  // 롤 & 패닝
  const sinOrbit = Math.sin(theta);
  const sinHalf = Math.abs(sinOrbit);
  const cameraPan = {
    x: Math.round(-18 * sinOrbit),
    y: Math.round(6 * sinHalf),
  };
  const cameraRoll = Number((-0.038 * sinOrbit).toFixed(4));

  // 배경 360도 회전 패럴랙스
  const bgOffsetX = Math.round(-760 * t);

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
    // 🌟 [유저 요구사항]: "회전할 때 적의 바닥은 잠시 제거해보자"
    // 회전 중에는 시전자 바닥만 남기고, 적의 바닥은 화면 밖(y=9999)으로 완전히 제거!
    pPlatOffset: isP ? { x: 0, y: 0 } : { x: 0, y: 9999 },
    ePlatOffset: !isP ? { x: 0, y: 0 } : { x: 0, y: 9999 },
    pPlatScale: isP ? 1.0 : 0.001,
    ePlatScale: !isP ? 1.0 : 0.001,
    orbitT: t,
  };
}

/**
 * 153: 대폭발 (Explosion) - 노말 타입 물리 기술 (위력 250)
 *
 * 연출 구성 (시전자 중앙 고정 360° ORBIT ➔ 튀어오르기 ➔ 대폭발):
 * 1. Step 1: 시전자를 화면 중앙에 두고 카메라 줌아웃(0.78x) 360° 회전 ➔ 줌인(1.50x) 시전자 초근접 확대 밀착
 * 2. Step 2: 화면 중앙에 가까이 잡힌 시전 포켓몬의 튀어오르기(Splash) 1회 팔딱 모션 ➔ 착지 후 순백 팽창 임계!
 * 3. Step 3: 펑!! 초대형 초신성 대폭발 기폭 (시전자 산화 소멸 & 자폭 기반 3D 충격파·화구·흑연 버섯구름) & 타겟 최대 넉백
 */
export const explosionMove: BattleMoveAnimation = {
  num: 153,
  key: "explosion",
  nameKo: "대폭발",
  nameEn: "Explosion",
  type: "normal",
  category: "physical",
  camera: { type: "custom" },
  drawBehindEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, isPlayer: isP } = drawCtx;
    const blastX = attackerPos.x;
    const blastY = attackerPos.y + 12;
    drawExplosionBehindEffect(targetCtx, { x: blastX, y: blastY }, frame.moveStep ?? 1, frame.effectProgress ?? 0.5);
  },
  drawEffect: (targetCtx: any, frame: BattleFrame, drawCtx: EffectDrawContext) => {
    if (!frame.showEffect) return;
    const { attackerPos, isPlayer: isP } = drawCtx;
    const blastX = attackerPos.x;
    const blastY = attackerPos.y + 12;
    drawExplosionEffect(targetCtx, { x: blastX, y: blastY }, { x: blastX, y: blastY }, frame.moveStep ?? 1, frame.effectProgress ?? 0.5, isP);
  },
  buildFrames: (ctx: MoveContext): BattleFrame[] => {
    const { isPlayer: isP, isHit, action: a, enemyHp, playerHp, textLineIdx } = ctx;

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
      showEffect: false,
    };

    const casterX = isP ? 150 : 418;
    const casterY = isP ? 245 : 116;
    const neutralX = 284;
    const neutralY = 180;
    const closeFocal = { x: casterX, y: casterY };
    const closeZoom = 1.50;

    // =========================================================================
    // STEP 1: 시전자 중앙 고정 360° ORBIT 샷 (줌아웃 0.78x ➔ 줌인 1.50x 밀착)
    // =========================================================================
    // 🌟 [유저 요구사항]: "회전이 너무 빨리 일어남 (회전이 빨리 일어나는건 앞면 뒷면이 전환되는 곳만) 쭉~ 둘러서 가는것처럼 느껴지게 해줘"
    const orbitSteps = 24;
    const orbitFrames: BattleFrame[] = [];
    for (let i = 0; i <= orbitSteps; i++) {
      const t = Number(((i / orbitSteps) * 2.0).toFixed(4));
      const orbit = computeCasterCenteredOrbitPose(t, isP);

      // 앞/뒷면 전환 구간(90° [t ≈ 0.50], 270° [t ≈ 1.50])은 40ms로 빠르게 휙 돌고,
      // 나머지 넓은 전장 조망 구간은 70ms로 '쭉~ 둘러서' 여유롭게 선회!
      const isTransition = (t >= 0.40 && t <= 0.60) || (t >= 1.40 && t <= 1.60);
      const delay = isTransition ? 40 : (i === 0 || i === orbitSteps ? 80 : 70);

      orbitFrames.push({
        ...baseFrame,
        ...orbit,
        delay,
        moveStep: 1,
        effectProgress: Number(((t / 2.0) * 0.40).toFixed(3)),
        phaseId: `explosion-orbit-${i}`,
        phaseName: `#1. 시전자 중심 360° ORBIT (${Math.round(t * 180)}°)`,
      });
    }

    // =========================================================================
    // STEP 2: 화면 중앙에 가까이 잡힌 시전 포켓몬의 튀어오르기(Splash) 1회 팔딱 모션
    // =========================================================================
    const hopBase = {
      ...baseFrame,
      hideHud: false,
      hideUI: false,
      usePlayerFront: false,
      useEnemyBack: false,
      drawEnemyOnTop: false,
      cameraZoom: closeZoom,
      cameraPan: { x: 0, y: 0 },
      cameraRoll: 0,
      cameraFocal: closeFocal,
      bgOffsetX: 0,
      showEffect: false,
      moveStep: 2,
    };

    // 🌟 시전자와 피격자의 시각적 볼륨 균형 맞춤:
    // 상대(Enemy)가 시전할 때는 베이스 크기가 작으므로 1.55배 스케일을 주어 플레이어와 동일한 거대 클로즈업 크기감 구현
    // 피격자는 배경에 위치하므로 0.85배로 자연스러운 원근 깊이 유지
    const hopCasterScale = (sx: number, sy: number) => {
      if (isP) {
        return {
          pScale: { x: sx, y: sy },
          eScale: { x: 0.85, y: 0.85 },
        };
      } else {
        return {
          pScale: { x: 0.85, y: 0.85 },
          eScale: { x: Number((sx * 1.55).toFixed(3)), y: Number((sy * 1.55).toFixed(3)) },
        };
      }
    };

    const hopFrames: BattleFrame[] = [
      // 1. 납작 준비 (지면 밀착 압축, y=0)
      {
        ...hopBase,
        delay: 75,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        ...hopCasterScale(1.25, 0.75),
        effectProgress: 0.45,
        phaseId: "explosion-hop-squash1",
        phaseName: "#2. 튀어오르기 (지면 압축)",
      },
      // 2. 도약 상승 (Hop launch up, y < 0)
      {
        ...hopBase,
        delay: 85,
        pOffset: isP ? { x: 0, y: -20 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -20 } : { x: 0, y: 0 },
        ...hopCasterScale(0.85, 1.25),
        effectProgress: 0.50,
        phaseId: "explosion-hop-launch",
        phaseName: "#2. 튀어오르기 (도약 상승)",
      },
      // 3. 체공 정점 (Air peak)
      {
        ...hopBase,
        delay: 80,
        pOffset: isP ? { x: 0, y: -28 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -28 } : { x: 0, y: 0 },
        ...hopCasterScale(0.95, 1.10),
        effectProgress: 0.55,
        phaseId: "explosion-hop-apex",
        phaseName: "#2. 튀어오르기 (체공 정점)",
      },
      // 4. 하강 (Falling)
      {
        ...hopBase,
        delay: 70,
        pOffset: isP ? { x: 0, y: -12 } : { x: 0, y: 0 },
        eOffset: !isP ? { x: 0, y: -12 } : { x: 0, y: 0 },
        ...hopCasterScale(1.05, 0.95),
        effectProgress: 0.60,
        phaseId: "explosion-hop-fall",
        phaseName: "#2. 튀어오르기 (하강)",
      },
      // 5. 착지 납작 (Landing Squash, y=0)
      {
        ...hopBase,
        delay: 80,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        ...hopCasterScale(1.30, 0.70),
        effectProgress: 0.64,
        phaseId: "explosion-hop-land",
        phaseName: "#2. 튀어오르기 (착지 압축)",
      },
      // 6. 순백 팽창 점멸 (기폭 직전 임계 도달)
      {
        ...hopBase,
        delay: 85,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        ...hopCasterScale(1.38, 1.38),
        casterWhite: true,
        effectProgress: 0.68,
        phaseId: "explosion-critical-white",
        phaseName: "#2. 기폭 직전 순백 팽창",
      },
      // 7. 이펙트프레임 #1: 흑백 고대비 필터 임팩트 (전체 화면 흑백 + 고대비 + 백색 방사 쐐기 & 쇼크링)
      {
        ...hopBase,
        delay: 70,
        showEffect: true,
        screenFilter: "grayscale(100%) contrast(300%) brightness(1.15)",
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        ...hopCasterScale(1.42, 1.42),
        effectProgress: 0.705,
        phaseId: "explosion-impact-bw1",
        phaseName: "#2. 이펙트프레임 (흑백 고대비 필터 #1)",
      },
      // 8. 이펙트프레임 #2: 반전 네거티브 필터 임팩트 (전체 화면 색상 반전 + 흑백 + 흑색 싱귤래리티 균열)
      {
        ...hopBase,
        delay: 60,
        showEffect: true,
        screenFilter: "invert(100%) grayscale(100%) contrast(250%) brightness(1.1)",
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        ...hopCasterScale(1.46, 1.46),
        effectProgress: 0.715,
        phaseId: "explosion-impact-bw2",
        phaseName: "#2. 이펙트프레임 (음화 반전 필터 #2)",
      },
    ];

    // =========================================================================
    // STEP 3: 펑!! 대폭발 기폭 (시전자 산화 소멸 & 자폭 이펙트 기반 초신성 폭발)
    // =========================================================================
    const blastBase = {
      ...baseFrame,
      hideHud: false,
      hideUI: false,
      usePlayerFront: false,
      useEnemyBack: false,
      drawEnemyOnTop: false,
      cameraRoll: 0,
      bgOffsetX: 0,
      showEffect: true,
      moveStep: 3,
      hidePlayer: isP,
      hideEnemy: !isP,
      enemyHp: !isP ? 0 : enemyHp,
    };

    const explosionFrames: BattleFrame[] = [
      // #1. 펑! 기폭 (시전자 산화 소멸 & 백색 섬광 & 최대 셰이크 & 피크 블러)
      {
        ...blastBase,
        delay: 140,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        cameraZoom: 1.48,
        cameraPan: isP ? { x: -16, y: 12 } : { x: 16, y: -12 },
        cameraBlur: 6.0,
        cameraFocal: closeFocal,
        hitFlash: true,
        effectProgress: 0.72,
        phaseId: "explosion-detonate",
        phaseName: "#3. 펑! 기폭 (시전자 소멸 & 섬광)",
      },
      // #2. 순백 섬광 (백색 프레임 - 화면 전체 순백 발광!)
      {
        ...blastBase,
        delay: 80,
        screenFilter: "brightness(10)",
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        cameraZoom: 1.48,
        cameraPan: { x: 0, y: 0 },
        cameraBlur: 0,
        cameraFocal: closeFocal,
        effectProgress: 0.74,
        phaseId: "explosion-whiteout",
        phaseName: "#3. 순백 섬광 (화면 전체 백색)",
      },
      // #3. 화면 장악 폭발 & 격렬한 지진 셰이크 #1 (폭발이 전 화면을 집어삼키며 카메라 격렬한 요동)
      {
        ...blastBase,
        delay: 130,
        pOffset: !isP ? { x: -48, y: 19 } : { x: 0, y: 0 },
        eOffset: isP ? { x: 50, y: 2 } : { x: 0, y: 0 },
        cameraZoom: 1.45,
        cameraPan: isP ? { x: -36, y: 26 } : { x: 36, y: -26 },
        cameraBlur: 6.5,
        cameraFocal: {
          x: Math.round(closeFocal.x * 0.75 + neutralX * 0.25),
          y: Math.round(closeFocal.y * 0.75 + neutralY * 0.25),
        },
        effectProgress: 0.77,
        phaseId: "explosion-screen-inferno1",
        phaseName: "#3. 화면 장악 폭발 & 격렬한 셰이크 #1",
      },
      // #4. 폭발 속 2차 연쇄 폭발 & 셰이크 #2 (화염 속 2차 화구 연속 기폭 & 반동 셰이크)
      {
        ...blastBase,
        delay: 130,
        pOffset: !isP ? { x: -68, y: 26 } : { x: 0, y: 0 },
        eOffset: isP ? { x: 70, y: 3 } : { x: 0, y: 0 },
        cameraZoom: 1.40,
        cameraPan: isP ? { x: 38, y: -28 } : { x: -38, y: 28 },
        cameraBlur: 6.0,
        cameraFocal: {
          x: Math.round(closeFocal.x * 0.60 + neutralX * 0.40),
          y: Math.round(closeFocal.y * 0.60 + neutralY * 0.40),
        },
        effectProgress: 0.80,
        phaseId: "explosion-screen-inferno2",
        phaseName: "#3. 폭발 속 2차 연쇄 폭발 & 셰이크 #2",
      },
      // #5. 폭발 속 3차 연쇄 폭발 & 셰이크 #3 (화염 속 3차 솔라 화구 기폭 & 격동 셰이크)
      {
        ...blastBase,
        delay: 130,
        pOffset: !isP ? { x: -80, y: 31 } : { x: 0, y: 0 },
        eOffset: isP ? { x: 84, y: 3 } : { x: 0, y: 0 },
        cameraZoom: 1.35,
        cameraPan: isP ? { x: -30, y: -22 } : { x: 30, y: 22 },
        cameraBlur: 5.5,
        cameraFocal: {
          x: Math.round(closeFocal.x * 0.45 + neutralX * 0.55),
          y: Math.round(closeFocal.y * 0.45 + neutralY * 0.55),
        },
        effectProgress: 0.83,
        phaseId: "explosion-screen-inferno3",
        phaseName: "#3. 폭발 속 3차 연쇄 폭발 & 셰이크 #3",
      },
      // #6. 폭발 속 4차 연쇄 폭발 & 셰이크 #4 (화염 속 4차 다중 화구 폭굉)
      {
        ...blastBase,
        delay: 140,
        pOffset: !isP ? { x: -88, y: 34 } : { x: 0, y: 0 },
        eOffset: isP ? { x: 92, y: 4 } : { x: 0, y: 0 },
        cameraZoom: 1.25,
        cameraPan: isP ? { x: 26, y: 18 } : { x: -26, y: -18 },
        cameraBlur: 4.5,
        cameraFocal: {
          x: Math.round(closeFocal.x * 0.35 + neutralX * 0.65),
          y: Math.round(closeFocal.y * 0.35 + neutralY * 0.65),
        },
        effectProgress: 0.86,
        phaseId: "explosion-screen-inferno4",
        phaseName: "#3. 폭발 속 4차 연쇄 폭발 & 셰이크 #4",
      },
      // #7. 거대 화구 절정 & 최대 넉백 (피크 넉백 & HP 감소 - 상대 하늘 침범 절대 방지 y >= 0)
      {
        ...blastBase,
        delay: 180,
        pOffset: !isP ? { x: -88, y: 34 } : { x: 0, y: 0 },
        eOffset: isP ? { x: 92, y: 4 } : { x: 0, y: 0 },
        enemyHp: !isP ? 0 : (isHit ? a.enemyHpAfter : enemyHp),
        playerHp: isP ? playerHp : (isHit ? a.playerHpAfter : playerHp),
        cameraZoom: 1.15,
        cameraPan: isP ? { x: -14, y: 10 } : { x: 14, y: -10 },
        cameraBlur: 3.0,
        cameraFocal: {
          x: Math.round(closeFocal.x * 0.25 + neutralX * 0.75),
          y: Math.round(closeFocal.y * 0.25 + neutralY * 0.75),
        },
        effectProgress: 0.89,
        phaseId: "explosion-mushroom-apex",
        phaseName: "#3. 거대 화구 절정 & 최대 넉백",
      },
      // #6. 흑연 연막 확산 (소강 셰이크 & 타겟 리바운드)
      {
        ...blastBase,
        delay: 170,
        pOffset: !isP ? { x: -55, y: 21 } : { x: 0, y: 0 },
        eOffset: isP ? { x: 58, y: 2 } : { x: 0, y: 0 },
        enemyHp: !isP ? 0 : (isHit ? a.enemyHpAfter : enemyHp),
        playerHp: isP ? playerHp : (isHit ? a.playerHpAfter : playerHp),
        cameraZoom: 1.05,
        cameraPan: isP ? { x: -4, y: 3 } : { x: 4, y: -3 },
        cameraBlur: 0.9,
        cameraFocal: { x: neutralX, y: neutralY },
        effectProgress: 0.93,
        phaseId: "explosion-smoke-billow",
        phaseName: "#3. 흑연 연막 확산 (소강 셰이크)",
      },
      // #6. 폭발 잔흔 & 연기 소멸
      {
        ...blastBase,
        delay: 170,
        pOffset: !isP ? { x: -22, y: 8 } : { x: 0, y: 0 },
        eOffset: isP ? { x: 24, y: 1 } : { x: 0, y: 0 },
        enemyHp: !isP ? 0 : (isHit ? a.enemyHpAfter : enemyHp),
        playerHp: isP ? playerHp : (isHit ? a.playerHpAfter : playerHp),
        cameraZoom: 1.00,
        cameraPan: isP ? { x: 1, y: -1 } : { x: -1, y: 1 },
        cameraBlur: 0,
        cameraFocal: { x: neutralX, y: neutralY },
        effectProgress: 0.98,
        phaseId: "explosion-dissipate",
        phaseName: "#3. 폭발 잔흔 & 연기 소멸",
      },
      // #7. 완전 안정화 (원위치 복귀)
      {
        ...blastBase,
        delay: 190,
        pOffset: { x: 0, y: 0 },
        eOffset: { x: 0, y: 0 },
        enemyHp: !isP ? 0 : (isHit ? a.enemyHpAfter : enemyHp),
        playerHp: isP ? playerHp : (isHit ? a.playerHpAfter : playerHp),
        cameraZoom: 1.00,
        cameraPan: { x: 0, y: 0 },
        cameraBlur: 0,
        cameraFocal: { x: neutralX, y: neutralY },
        effectProgress: 1.0,
        phaseId: "explosion-settle",
        phaseName: "#3. 완전 안정화 (원위치 복귀)",
      },
    ];

    return [...orbitFrames, ...hopFrames, ...explosionFrames];
  },
};
