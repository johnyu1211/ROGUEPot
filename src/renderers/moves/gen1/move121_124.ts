// ============================================================================
// ⚠️ [개발/작업 지침 - AI 필독]
// 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
// 직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { MovePoint } from "../types.js";
import { drawPoisonSoapBubble } from "./move037_040.js";

/**
 * 정밀 3D 달걀(Ovoid Geometric Mesh) 곡선 패스 생성 헬퍼
 * 상단은 좁고 매끄러운 3D Apex, 하단은 둥글고 풍만한 3D Base
 */
function traceEggPath(ctx: any, cx: number, cy: number, rx: number, ry: number) {
  ctx.beginPath();
  // 1. 상단 꼭짓점 (Apex: 상단 끝)
  ctx.moveTo(cx, cy - ry);
  // 2. 우측 상단: 부드럽게 좁아지는 테이퍼 곡선
  ctx.bezierCurveTo(cx + rx * 0.58, cy - ry * 0.94, cx + rx * 1.04, cy - ry * 0.12, cx + rx * 1.02, cy + ry * 0.26);
  // 3. 우측 하단: 풍만하고 둥근 엉덩이 곡선
  ctx.bezierCurveTo(cx + rx * 1.0, cy + ry * 0.82, cx + rx * 0.54, cy + ry, cx, cy + ry);
  // 4. 좌측 하단: 풍만하고 둥근 엉덩이 곡선
  ctx.bezierCurveTo(cx - rx * 0.54, cy + ry, cx - rx * 1.0, cy + ry * 0.82, cx - rx * 1.02, cy + ry * 0.26);
  // 5. 좌측 상단: 부드럽게 좁아지는 테이퍼 곡선
  ctx.bezierCurveTo(cx - rx * 1.04, cy - ry * 0.12, cx - rx * 0.58, cy - ry * 0.94, cx, cy - ry);
  ctx.closePath();
}

/**
 * 🥚 실시간 3D 볼륨 셰이딩 & 바닥 반사광이 적용된 리얼 3D 달걀 (Realistic 3D Egg)
 * - 꽁지/도화선 0% 순수 달걀
 * - 고정된 월드 광원(World Space Light) 기반 구형 체적 셰이딩 (Volumetric Shading)
 * - 그림자 영역 바닥 반사광(Ground Bounce / Fresnel Rim Light)으로 완벽한 3D 입체감 구현
 * - 탄도 궤적 접선(Tangent) 자동 정렬 및 3D 롤링 원근 축척 변형
 */
function draw3DRealisticEgg(
  ctx: any,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  tangentAngle: number,
  flightProg: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;
  ctx.translate(cx, cy);
  ctx.rotate(tangentAngle);

  // 1. 3D 원근 축 롤링 (3D Axial Spin & Perspective Foreshortening)
  const roll = flightProg * Math.PI * 5;
  const scaleX = 1.0 + 0.06 * Math.cos(roll);
  const scaleY = 1.0 - 0.03 * Math.cos(roll);
  ctx.scale(scaleX, scaleY);

  // 2. 고정된 월드 광원 계산 (화면 좌상단 -55도에서 비치는 부드러운 직사광)
  // 회전각도와 무관하게 하이라이트가 항상 화면 좌상단에 고정되어 완벽한 3D 물체로 인식됨
  const lightWorldAngle = -Math.PI * 0.35;
  const localLightAngle = lightWorldAngle - tangentAngle;
  const lx = Math.cos(localLightAngle) * (rx * 0.36);
  const ly = Math.sin(localLightAngle) * (ry * 0.32);

  // 3. 3D 앰비언트 오클루전 외곽 림 (부드러운 깊이감 형성)
  ctx.fillStyle = "#8C4E20";
  traceEggPath(ctx, 0, 1.2, rx * 1.06, ry * 1.06);
  ctx.fill();

  // 4. 메인 3D 구형 체적 셰이딩 (Volumetric Diffuse & Core Shadow)
  const shadowX = -lx * 0.85;
  const shadowY = -ly * 0.85;
  const eggGrad = ctx.createRadialGradient(lx, ly, rx * 0.1, shadowX, shadowY, ry * 1.35);
  eggGrad.addColorStop(0, "#FFFFFF");        // 1. 광원 하이라이트 중심
  eggGrad.addColorStop(0.20, "#FFFDF6");     // 2. 신선한 달걀 아이보리 크림
  eggGrad.addColorStop(0.50, "#FEE3BC");     // 3. 따스한 달걀 쉘 베이지
  eggGrad.addColorStop(0.80, "#DF9F5C");     // 4. 핵심 터미네이터 그림자 (Core Shadow)
  eggGrad.addColorStop(1.0, "#A6632A");      // 5. 딥 섀도우 림

  ctx.fillStyle = eggGrad;
  traceEggPath(ctx, 0, 0, rx, ry);
  ctx.fill();

  // 5. 3D 바닥 반사광 (Ground Bounce Light / Fresnel Rim Light)
  // 실제 3D 렌더링의 핵심: 어두운 쪽에 바닥에서 튕겨 올라오는 따스한 반사광을 채워 완벽한 입체 구형 표현
  ctx.save();
  traceEggPath(ctx, 0, 0, rx, ry);
  ctx.clip(); // 달걀 곡면 내부로 마스킹

  const bounceGrad = ctx.createRadialGradient(shadowX * 1.15, shadowY * 1.15, rx * 0.2, shadowX, shadowY, rx * 1.25);
  bounceGrad.addColorStop(0, "rgba(255, 230, 200, 0.58)"); // 바닥 반사광
  bounceGrad.addColorStop(0.5, "rgba(240, 190, 140, 0.28)");
  bounceGrad.addColorStop(1, "rgba(240, 190, 140, 0)");

  ctx.fillStyle = bounceGrad;
  ctx.beginPath();
  ctx.arc(shadowX * 1.1, shadowY * 1.1, rx * 1.25, 0, Math.PI * 2);
  ctx.fill();

  // 6. 3D 입체 스펙큘러 하이라이트 (Glossy Surface Sheen)
  // 곡면을 타고 흐르는 부드러운 3D 타원 반사광
  const specGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, rx * 0.45);
  specGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
  specGrad.addColorStop(0.35, "rgba(255, 255, 255, 0.65)");
  specGrad.addColorStop(0.7, "rgba(255, 255, 255, 0.2)");
  specGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = specGrad;
  ctx.beginPath();
  ctx.ellipse(lx, ly, rx * 0.42, ry * 0.28, localLightAngle + Math.PI / 2, 0, Math.PI * 2);
  ctx.fill();

  // 7. 또렷한 핀포인트 3D 광원 반사점 (Key Light Highlight)
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(lx * 0.95, ly * 0.95, 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore(); // 클립 해제

  ctx.restore();
}

/**
 * 깨진 달걀 껍질 조각 (Eggshell Shards) 다각형 렌더링
 */
function drawEggShellShard(
  ctx: any,
  x: number,
  y: number,
  size: number,
  angle: number,
  shardType: number,
  alpha: number
) {
  if (alpha <= 0.02) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.fillStyle = "#FFFDF7";
  ctx.strokeStyle = "#C48446";
  ctx.lineWidth = 1.2;

  ctx.beginPath();
  if (shardType === 0) {
    // 날카로운 삼각형 껍질 파편
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.9, size * 0.8);
    ctx.lineTo(-size * 0.8, size * 0.6);
  } else if (shardType === 1) {
    // 톱니형 다각형 껍질 파편
    ctx.moveTo(-size * 0.7, -size * 0.7);
    ctx.lineTo(0, -size * 0.9);
    ctx.lineTo(size * 0.8, -size * 0.3);
    ctx.lineTo(size * 0.4, size * 0.8);
    ctx.lineTo(-size * 0.6, size * 0.5);
  } else {
    // 곡면이 살아있는 오목한 껍질 조각
    ctx.moveTo(-size * 0.8, -size * 0.4);
    ctx.quadraticCurveTo(0, -size * 0.8, size * 0.8, -size * 0.3);
    ctx.lineTo(size * 0.5, size * 0.7);
    ctx.quadraticCurveTo(0, size * 0.4, -size * 0.6, size * 0.6);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/**
 * 몽글몽글 만화풍 폭발 연기 퍼프 클러스터
 */
function drawExplosionSmokePuff(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  color: string,
  alpha: number
) {
  if (alpha <= 0.02 || radius <= 0.5) return;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha ?? 1.0) * alpha;
  ctx.fillStyle = color;

  // 3개 겹침 원 클러스터로 유기적인 만화 구름 형태 생성
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.arc(cx - radius * 0.4, cy + radius * 0.2, radius * 0.7, 0, Math.PI * 2);
  ctx.arc(cx + radius * 0.4, cy + radius * 0.2, radius * 0.7, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * ============================================================================
 * 121: 알폭탄 (Egg Bomb) 이펙트 렌더러
 * ============================================================================
 * - 와인드업: 시전자 상단에 튼실한 순수 3D 달걀 생성 (꽁지/도화선 없음)
 * - 탄도 투척: 높은 포물선 아크를 그리며 궤적 접선 방향으로 자연스럽게 정렬되는 3D 비행 + 바닥 그림자 + 속도 잔상 라인
 * - 착탄 & 파쇄: 직격 순백 섬광 + 10개 껍질 파편(Eggshell Shards) 사방 비산 + 황금 노른자 스플래시
 * - 100 위력 대폭발: 초고열 플라즈마 핵 + 2중 확장 타원 충격파 링 + 거대 화구 + 폭풍 흑연 연막
 */
export function drawEggBombEffect(
  ctx: any,
  startPos: MovePoint,
  targetPos: MovePoint,
  step: number,
  progress: number,
  isPlayer: boolean
) {
  ctx.save();

  // --------------------------------------------------------------------------
  // Phase 1: 와인드업 & 알 들기 (step 1)
  // --------------------------------------------------------------------------
  if (step === 1) {
    const eggX = startPos.x + (isPlayer ? 18 : -18);
    const eggY = startPos.y - 34;

    draw3DRealisticEgg(
      ctx,
      eggX,
      eggY,
      16,
      22,
      (isPlayer ? -0.2 : 0.2),
      0,
      1.0
    );
    ctx.restore();
    return;
  }

  // --------------------------------------------------------------------------
  // Phase 2: 포물선 탄도 비행 (step 2 & step 3: flight, progress 0.0 ~ 1.0)
  // --------------------------------------------------------------------------
  if (step === 2 || step === 3) {
    const flightProg = Math.max(0.0, Math.min(1.0, progress));
    const launchX = startPos.x + (isPlayer ? 18 : -18);
    const launchY = startPos.y - 34;
    const hitX = targetPos.x;
    const hitY = targetPos.y - 12;

    const dx = hitX - launchX;
    const dy = hitY - launchY;

    // 시원하고 뚜렷한 고도 탄도 포물선 계산 (정점 최대 -95px 높이 도달)
    const arcH = 95;
    const curX = launchX + dx * flightProg;
    const curY = launchY + dy * flightProg - Math.sin(flightProg * Math.PI) * arcH;

    // 1. 탄도 포물선 궤적의 3D 접선 각도 (Tangent Angle)
    // 순간 속도 벡터 방향으로 알의 뾰족한 끝(Apex)이 자연스럽게 비행 방향을 이끎
    const vx = dx;
    const vy = dy - Math.cos(flightProg * Math.PI) * Math.PI * arcH;
    const flightAngle = Math.atan2(vy, vx);
    const alignAngle = flightAngle + Math.PI / 2;

    // 2. 지면 투영 3D 그림자 (전장 바닥을 따라 이동, 고도에 따라 크기/투명도 조절)
    const groundStartY = startPos.y + 12;
    const groundTargetY = targetPos.y + 14;
    const shadowY = groundStartY + (groundTargetY - groundStartY) * flightProg;
    const heightFactor = Math.sin(flightProg * Math.PI);
    const shadowAlpha = 0.38 * (1.0 - heightFactor * 0.45);
    const shadowRx = 15 * (1.0 - heightFactor * 0.3);
    const shadowRy = 6.5 * (1.0 - heightFactor * 0.3);

    ctx.save();
    ctx.globalAlpha = shadowAlpha;
    ctx.fillStyle = "#0F172A";
    ctx.beginPath();
    ctx.ellipse(curX, shadowY, shadowRx, shadowRy, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. 알 뒤를 따르는 반투명 속도 잔상 궤적 (Stream Tail)
    const trailSegments = 5;
    for (let i = 1; i <= trailSegments; i++) {
      const trailProg = Math.max(0, flightProg - i * 0.055);
      if (trailProg <= 0.01) continue;
      const trailX = launchX + dx * trailProg;
      const trailY = launchY + dy * trailProg - Math.sin(trailProg * Math.PI) * arcH;
      const trailAlpha = (1 - i / (trailSegments + 1)) * 0.45;
      const trailR = 10 * (1 - i * 0.15);

      ctx.fillStyle = "rgba(254, 243, 199, " + trailAlpha.toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(trailX, trailY, trailR, 0, Math.PI * 2);
      ctx.fill();

      // 금빛 스파크 불티 파티클
      if (i % 2 === 1) {
        ctx.fillStyle = "rgba(245, 158, 11, " + (trailAlpha * 1.3).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(trailX + (i * 3 * (isPlayer ? -1 : 1)), trailY + (i % 2 === 0 ? 3 : -3), 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. 완벽한 3D 입체 달걀 렌더링
    draw3DRealisticEgg(ctx, curX, curY, 16, 22, alignAngle, flightProg, 1.0);

    ctx.restore();
    return;
  }

  // --------------------------------------------------------------------------
  // Phase 3 & 4: 착탄 껍질 파쇄 & 대폭발 (step >= 4, detonation)
  // --------------------------------------------------------------------------
  const blastProg = Math.max(0.0, Math.min(1.0, progress));
  const blastX = targetPos.x;
  const blastY = targetPos.y - 12;

  // 1. 2중 팽창 초음속 충격파 링 (Expanding Shockwave Rings - 바닥에 타원 전개)
  if (blastProg <= 0.75) {
    const ringProg = blastProg / 0.75;
    const ringRadiusX = ringProg * 75;
    const ringRadiusY = ringRadiusX * 0.45; // 3D 바닥 원근 타원
    const ringAlpha = (1.0 - ringProg) * 0.85;

    ctx.save();
    ctx.globalAlpha = ringAlpha;
    ctx.strokeStyle = "#FFFBEB";
    ctx.lineWidth = 3.2 * (1.0 - ringProg * 0.6);
    ctx.beginPath();
    ctx.ellipse(blastX, targetPos.y + 14, ringRadiusX, ringRadiusY, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 2차 내부 황금빛 링
    const innerR = ringRadiusX * 0.65;
    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 2.0 * (1.0 - ringProg * 0.5);
    ctx.beginPath();
    ctx.ellipse(blastX, targetPos.y + 14, innerR, innerR * 0.45, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 2. 사방으로 격렬하게 비산하는 깨진 달걀 껍질 조각 10개 (Eggshell Shards)
  const SHARD_CONFIGS = [
    { angle: -0.3, dist: 58, size: 8.5, type: 0, rotSpeed: 5.5 },
    { angle: -0.8, dist: 52, size: 7.5, type: 1, rotSpeed: -6.5 },
    { angle: -1.4, dist: 66, size: 9.0, type: 2, rotSpeed: 4.8 },
    { angle: -2.0, dist: 60, size: 8.0, type: 0, rotSpeed: -5.8 },
    { angle: -2.6, dist: 50, size: 7.0, type: 1, rotSpeed: 7.5 },
    { angle: 0.2, dist: 45, size: 6.5, type: 2, rotSpeed: -4.5 },
    { angle: 0.8, dist: 42, size: 7.8, type: 0, rotSpeed: 6.5 },
    { angle: 2.2, dist: 44, size: 6.0, type: 1, rotSpeed: -8.0 },
    { angle: 2.8, dist: 48, size: 7.2, type: 2, rotSpeed: 5.5 },
    { angle: -3.0, dist: 56, size: 8.2, type: 0, rotSpeed: -6.8 },
  ];

  for (let i = 0; i < SHARD_CONFIGS.length; i++) {
    const cfg = SHARD_CONFIGS[i];
    // 물리 포물선: 초기 속도로 튕겨져 나가다가 중력에 의해 아래로 낙하
    const shardTravel = Math.pow(blastProg, 0.75);
    const sx = blastX + Math.cos(cfg.angle) * (cfg.dist * shardTravel);
    const sy = blastY + Math.sin(cfg.angle) * (cfg.dist * shardTravel) + (blastProg * blastProg * 32);
    const shardRot = blastProg * cfg.rotSpeed;
    const shardAlpha = Math.max(0.0, 1.0 - Math.pow(blastProg, 1.3));

    drawEggShellShard(ctx, sx, sy, cfg.size, shardRot, cfg.type, shardAlpha);
  }

  // 3. 황금 노른자 & 흰자 액체 스플래시 물방울 비산 (Yolk & Albumen Droplets)
  const DROPLET_ANGLES = [
    -0.5, -1.0, -1.6, -2.2, -2.7, 0.4, 2.5
  ];
  for (let j = 0; j < DROPLET_ANGLES.length; j++) {
    const dAng = DROPLET_ANGLES[j];
    const dDist = 44 * Math.pow(blastProg, 0.8);
    const dx = blastX + Math.cos(dAng) * dDist;
    const dy = blastY + Math.sin(dAng) * dDist + (blastProg * blastProg * 24);
    const dAlpha = Math.max(0, 1.0 - blastProg * 1.2);
    const dRad = Math.max(1.0, (1.0 - blastProg * 0.7) * (j % 2 === 0 ? 4.0 : 3.0));

    ctx.save();
    ctx.globalAlpha = dAlpha;
    ctx.fillStyle = j % 2 === 0 ? "#F59E0B" : "#FDE047";
    ctx.beginPath();
    ctx.arc(dx, dy, dRad, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 4. 거대 폭발 화구 클러스터 (Detonation Fireballs & Plasma Core)
  if (blastProg < 0.85) {
    const fireProg = blastProg / 0.85;
    const fireExpansion = Math.sin(fireProg * Math.PI * 0.65); // 초반 급팽창 후 완만
    const fireAlpha = Math.max(0.0, 1.0 - fireProg * 1.15);

    ctx.save();
    ctx.globalAlpha = fireAlpha;

    // 외곽 붉은 주황 화염구 군집 (5방향 다엽형 화염)
    const fireLobes = [
      { ox: 0, oy: -16, r: 34 },
      { ox: -20, oy: -8, r: 30 },
      { ox: 20, oy: -8, r: 30 },
      { ox: -12, oy: 10, r: 28 },
      { ox: 12, oy: 10, r: 28 },
    ];

    for (const lobe of fireLobes) {
      const lr = lobe.r * (0.4 + fireExpansion * 0.78);
      const lx = blastX + lobe.ox * fireExpansion;
      const ly = blastY + lobe.oy * fireExpansion;

      const fGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr);
      fGrad.addColorStop(0, "#FDE047");
      fGrad.addColorStop(0.35, "#F97316");
      fGrad.addColorStop(0.75, "#DC2626");
      fGrad.addColorStop(1, "rgba(185, 28, 28, 0)");

      ctx.fillStyle = fGrad;
      ctx.beginPath();
      ctx.arc(lx, ly, lr, 0, Math.PI * 2);
      ctx.fill();
    }

    // 중심 순백 초고열 플라즈마 코어
    const coreR = 30 * (1.0 - fireProg * 0.7);
    if (coreR > 1.0) {
      const coreGrad = ctx.createRadialGradient(blastX, blastY - 4, 0, blastX, blastY - 4, coreR);
      coreGrad.addColorStop(0, "#FFFFFF");
      coreGrad.addColorStop(0.4, "#FEF08A");
      coreGrad.addColorStop(1, "rgba(254, 240, 138, 0)");

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(blastX, blastY - 4, coreR, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // 5. 피어오르는 만화풍 흑연/먼지 연막 구름 (Smoke Puffs)
  if (blastProg >= 0.25) {
    const smokeProg = (blastProg - 0.25) / 0.75;
    const smokeAlpha = (1.0 - smokeProg) * 0.75;

    const smokeClusters = [
      { ox: -20, oy: -22 - smokeProg * 24, r: 18 + smokeProg * 12, col: "#64748B" },
      { ox: 18, oy: -26 - smokeProg * 26, r: 20 + smokeProg * 14, col: "#94A3B8" },
      { ox: 0, oy: -35 - smokeProg * 30, r: 25 + smokeProg * 16, col: "#475569" },
      { ox: -26, oy: -10 - smokeProg * 14, r: 16 + smokeProg * 9, col: "#94A3B8" },
      { ox: 24, oy: -12 - smokeProg * 16, r: 17 + smokeProg * 10, col: "#64748B" },
    ];

    for (const s of smokeClusters) {
      drawExplosionSmokePuff(ctx, blastX + s.ox, blastY + s.oy, s.r, s.col, smokeAlpha);
    }
  }

  ctx.restore();
}

/**
 * ============================================================================
 * 👅 122: 핥기 (Lick) - 고스트 타입 물리 기술 (위력 30, 명중 100%, 30% 마비)
 * ============================================================================
 * 
 * 연출 지침 (유저 100% 반영):
 * 1. 시전포켓몬이 가까이 다가감 (Step 1)
 * 2. 대상포켓몬 많이 줌인 (1.70x 초근접 줌)
 *    - 이때 시전포켓몬은 줌인된 카메라 범위 밖에 있음
 * 3. 카메라 바깥에서 거대한 혓바닥이 나와서 핥음 (Step 2~4)
 *    - 카메라 밖 모서리에서 거대한 핑크빛 입체 혓바닥 쇄도 출현
 *    - 대상을 강타하며 부드럽고 끈적하게 쓸어올리는 거대 핥기 궤적
 *    - 3D 볼륨 음영, 혀 중심선(Median sulcus), 번들거리는 침 광택(Wet Sheen), 비산하는 타액 방울
 * 4. 혓바닥 회수 & 묻어난 타액 잔향 & 고스트 기운의 오한/마비 전율 (Step 4~5)
 */

/**
 * 👅 만화풍 셀 애니메이션 거대 혓바닥 (산뜻한 셀 핑크 톤 & 뚜렷한 카툰 외곽선)
 */
function drawGiantTongue(
  ctx: any,
  originX: number,
  originY: number,
  targetX: number,
  targetY: number,
  reachProg: number,
  sweepProg: number,
  isPlayer: boolean
) {
  ctx.save();

  // 방향 벡터 계산 (플레이어: 좌하단 ➔ 우상단, 적: 우상단 ➔ 좌하단)
  const dirX = isPlayer ? 1 : -1;
  const dirY = isPlayer ? -1 : 1;

  // 혀의 끝단(Tip) 도달 위치 계산
  const distReach = Math.min(1.0, reachProg);
  const curEndX = originX + (targetX - originX) * distReach + dirX * 42 * sweepProg;
  const curEndY = originY + (targetY - originY) * distReach + dirY * 48 * sweepProg;

  // 유연하고 탄력 넘치는 곡선 제어점
  const midX = originX + (curEndX - originX) * 0.50 - dirX * 32 * (1.0 - sweepProg * 0.4);
  const midY = originY + (curEndY - originY) * 0.48 + dirY * 22 * (1.0 - sweepProg * 0.4);

  // 넓적하고 둥글둥글한 카툰 혓바닥 두께 (뿌리 34px, 끝단 28~36px 유동 확장)
  const rootHalfW = 34;
  const tipHalfW = 28 + Math.sin(sweepProg * Math.PI) * 10;

  // 법선 및 접선 단위 벡터
  const dx = curEndX - originX;
  const dy = curEndY - originY;
  const len = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / len;
  const ny = dx / len;
  const ux = dx / len;
  const uy = dy / len;
  // 화면 아래쪽(y > 0)을 향하는 음영 단위 법선 벡터 (어두운 음영이 항상 혓바닥 아래쪽에 오도록 보장)
  const shadowSign = ny >= 0 ? 1 : -1;
  const snx = nx * shadowSign;
  const sny = ny * shadowSign;

  // --------------------------------------------------------------------------
  // 1. 카툰 혓바닥 전체 외곽 패스 함수
  // --------------------------------------------------------------------------
  const buildTonguePath = () => {
    ctx.beginPath();
    // 뿌리 좌측
    ctx.moveTo(originX - nx * rootHalfW, originY - ny * rootHalfW);
    // 하단 외곽 곡선 (S-curve)
    ctx.quadraticCurveTo(
      midX - nx * (rootHalfW * 0.88),
      midY - ny * (rootHalfW * 0.88),
      curEndX - nx * tipHalfW,
      curEndY - ny * tipHalfW
    );
    // 끝단 매끄러운 원형 돔 혀끝 (각진 느낌 없는 완전 둥근 카툰 곡선)
    const tipForward = tipHalfW * 1.0;
    ctx.bezierCurveTo(
      curEndX - nx * tipHalfW + ux * (tipForward * 0.552),
      curEndY - ny * tipHalfW + uy * (tipForward * 0.552),
      curEndX - nx * (tipHalfW * 0.552) + ux * tipForward,
      curEndY - ny * (tipHalfW * 0.552) + uy * tipForward,
      curEndX + ux * tipForward,
      curEndY + uy * tipForward
    );
    ctx.bezierCurveTo(
      curEndX + nx * (tipHalfW * 0.552) + ux * tipForward,
      curEndY + ny * (tipHalfW * 0.552) + uy * tipForward,
      curEndX + nx * tipHalfW + ux * (tipForward * 0.552),
      curEndY + ny * tipHalfW + uy * (tipForward * 0.552),
      curEndX + nx * tipHalfW,
      curEndY + ny * tipHalfW
    );
    // 상단 외곽 곡선
    ctx.quadraticCurveTo(
      midX + nx * (rootHalfW * 0.88),
      midY + ny * (rootHalfW * 0.88),
      originX + nx * rootHalfW,
      originY + ny * rootHalfW
    );
    ctx.closePath();
  };

  // --------------------------------------------------------------------------
  // 2. 베이스 컬러 채우기 (화사하고 산뜻한 셀 애니메이션 핑크)
  // --------------------------------------------------------------------------
  buildTonguePath();
  ctx.fillStyle = "#FF7597"; // 밝고 선명한 애니 혓바닥 핑크
  ctx.fill();

  // --------------------------------------------------------------------------
  // 3. 클리핑 마스크 내부 셀 셰이딩 (하단 카툰 음영만 적용)
  // --------------------------------------------------------------------------
  ctx.save();
  buildTonguePath();
  ctx.clip();

  // 하단 카툰 음영 밴드 (어두운 음영이 혓바닥 아래쪽에 위치 #E11D48)
  // 클리핑 마스크(buildTonguePath)가 혓바닥 외곽선과 돔 곡면을 완벽히 재단하므로,
  // 외곽 경계는 아래쪽(+snx, +sny) 마스크 바깥으로 여유롭게 확장하여 혀끝 돔 곡면에 짙은 색상이 빈틈없이 100% 밀착되도록 처리
  const tipForward = tipHalfW * 1.0;
  ctx.fillStyle = "#E11D48";
  ctx.beginPath();
  // 1. 혀 내부 음영 분할 곡선: 뿌리에서 혀끝 정점(Apex)까지 부드럽게 이어짐 (하단 35% 영역)
  ctx.moveTo(originX + snx * (rootHalfW * 0.35), originY + sny * (rootHalfW * 0.35));
  ctx.quadraticCurveTo(
    midX + snx * (rootHalfW * 0.35),
    midY + sny * (rootHalfW * 0.35),
    curEndX + ux * (tipForward + 5),
    curEndY + uy * (tipForward + 5)
  );
  // 2. 바깥쪽 여유 영역: 혀 아래쪽(+snx, +sny)으로 크게 둘러싸서 클리핑 마스크가 혀 아래쪽 곡선 전체를 100% 채우도록 위임
  ctx.lineTo(curEndX + snx * (tipHalfW + 40) + ux * (tipForward + 40), curEndY + sny * (tipHalfW + 40) + uy * (tipForward + 40));
  ctx.lineTo(curEndX + snx * (tipHalfW + 40) - ux * 60, curEndY + sny * (tipHalfW + 40) - uy * 60);
  ctx.lineTo(originX + snx * (rootHalfW + 40), originY + sny * (rootHalfW + 40));
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  // --------------------------------------------------------------------------
  // 4. 뚜렷한 만화풍 외곽선 (Crisp Anime Cartoon Outline)
  // --------------------------------------------------------------------------
  buildTonguePath();
  ctx.strokeStyle = "#4C0519"; // 짙은 버건디/플럼 만화 외곽선
  ctx.lineWidth = 3.6;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();

  ctx.restore();
}

/**
 * 핥는 순간 사방으로 비산하는 유기적 타액/침방울 클러스터
 */
function drawSalivaSplash(
  ctx: any,
  splashX: number,
  splashY: number,
  progress: number,
  isPlayer: boolean
) {
  if (progress <= 0 || progress >= 1.0) return;
  ctx.save();

  const burstProg = Math.min(1.0, progress * 1.3);
  const fadeAlpha = Math.max(0.0, 1.0 - progress);

  const droplets = [
    { ang: -0.6, dist: 38, r: 4.2 },
    { ang: -0.2, dist: 52, r: 5.5 },
    { ang: 0.15, dist: 64, r: 4.8 },
    { ang: 0.55, dist: 46, r: 4.0 },
    { ang: 0.95, dist: 58, r: 5.0 },
    { ang: 1.35, dist: 34, r: 3.6 },
    { ang: -1.05, dist: 42, r: 3.8 },
    { ang: -0.4, dist: 72, r: 3.2 },
    { ang: 0.35, dist: 78, r: 3.4 },
  ];

  const baseAngle = isPlayer ? -Math.PI * 0.35 : Math.PI * 0.65;

  for (const d of droplets) {
    const curAngle = baseAngle + d.ang;
    const curDist = d.dist * burstProg;
    const dx = splashX + Math.cos(curAngle) * curDist;
    const dy = splashY + Math.sin(curAngle) * curDist + burstProg * burstProg * 14; // 중력 낙하

    ctx.save();
    ctx.globalAlpha = fadeAlpha * 0.92;

    // 타원형 물방울 (비행 방향으로 살짝 늘어남)
    ctx.translate(dx, dy);
    ctx.rotate(curAngle);

    // 물방울 본체
    const dropGrad = ctx.createRadialGradient(-1, -1, 0.5, 0, 0, d.r);
    dropGrad.addColorStop(0, "#FFFFFF");
    dropGrad.addColorStop(0.45, "rgba(224, 242, 254, 0.95)");
    dropGrad.addColorStop(0.85, "rgba(186, 230, 253, 0.75)");
    dropGrad.addColorStop(1, "rgba(125, 211, 252, 0.15)");

    ctx.fillStyle = dropGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, d.r * 1.35, d.r * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();

    // 물방울 반사광
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(-d.r * 0.35, -d.r * 0.25, d.r * 0.32, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  ctx.restore();
}

/**
/**
 * 122: 핥기 (Lick) 메인 이펙트 렌더러
 */
export function drawLickEffect(
  ctx: any,
  attackerPos: MovePoint,
  targetPos: MovePoint,
  step: number,
  progress: number = 0,
  isPlayer: boolean = true
) {
  // Step 1: 시전자 접근 (카메라 1.0x 중립 ➔ 혓바닥 미노출)
  if (step === 1) return;

  // 카메라 1.70x 줌 상태에서 혓바닥이 화면 바깥 모서리에서 튀어나오는 기점 좌표
  // 플레이어 공격 시: 대상(적)은 우상단 ➔ 혓바닥 기점은 화면 좌하단 바깥
  // 적 공격 시: 대상(플레이어)은 좌하단 ➔ 혓바닥 기점은 화면 우상단 바깥
  const originX = isPlayer ? targetPos.x - 175 : targetPos.x + 175;
  const originY = isPlayer ? targetPos.y + 130 : targetPos.y - 130;

  // Step 2: 카메라 바깥에서 거대한 혓바닥 급속 출현 (도달 단계)
  if (step === 2) {
    const reachProg = Math.min(1.0, 0.45 + progress * 0.55);
    drawGiantTongue(ctx, originX, originY, targetPos.x, targetPos.y, reachProg, 0.05, isPlayer);
  }

  // Step 3: 거대 혓바닥 전면 쓸어올리기 핥기 강타 (타격 & 침 비산 유지)
  else if (step === 3) {
    const sweepProg = Math.min(1.0, 0.25 + progress * 0.75);
    drawGiantTongue(ctx, originX, originY, targetPos.x, targetPos.y, 1.0, sweepProg, isPlayer);
    drawSalivaSplash(ctx, targetPos.x, targetPos.y - 8, progress, isPlayer);
  }

  // Step 4: 혓바닥 관통 회수 & 비산한 침 잔향
  else if (step === 4) {
    const retractProg = Math.max(0.0, 1.0 - progress * 1.25);
    if (retractProg > 0.05) {
      drawGiantTongue(ctx, originX, originY, targetPos.x, targetPos.y, retractProg, 1.0, isPlayer);
    }
    drawSalivaSplash(ctx, targetPos.x + (isPlayer ? 24 : -24), targetPos.y - 20, 0.6 + progress * 0.4, isPlayer);
  }

  // Step 5: 피격자 마비 오한 전율
  else if (step === 5) {
    // 잔여 타액 얼룩/원 없이 피격자의 오한 전율 모션만 깔끔하게 진행
  }
}

/**
 * ============================================================================
 * 💨 123: 스모그 (Smog) - 독 타입 특수 기술 (위력 30, 명중 70%, 40% 독)
 * ============================================================================
 * 
 * 연출 지침 (유저 100% 반영):
 * 1. 연막(108번)의 유기적 뭉게구름 표현을 참고하되, 구체를 포물선으로 던지지 않음!
 * 2. 시전자가 입에서 전방으로 유독한 가스를 연속으로 뿜어내는 느낌(Exhaling/Spewing Gas Stream)!
 * 3. 탁한 심연 흑자색(#190526) ~ 독성 바이올렛(#581C87) ~ 유독 가스 연무(#A855F7) 3단 입체 컬러
 * 4. 대상 포켓몬 3D 샌드위치 차폐(배후 가스벽 + 전면 롤링 구름) & 내부 독성 기포(Bubbles)
 * 5. 먼저 뿜어진 가스부터 순차적으로 상공 분산 소멸 (FIFO)
 */

interface SmogCloudDef {
  dx: number;
  dy: number;
  r: number;
  birth: number;
  wave: 1 | 2 | 3;
  seed: number;
  layer: "behind" | "front";
}

const SMOG_BILLOW_CLOUDS: SmogCloudDef[] = [
  // 1차 웨이브 (가장 먼저 도달하여 피어오르고, 가장 먼저 페이드아웃)
  { dx: 0, dy: -4, r: 48, birth: 0.04, wave: 1, seed: 1.5, layer: "front" },
  { dx: -26, dy: 8, r: 42, birth: 0.08, wave: 1, seed: 2.8, layer: "front" },
  { dx: 24, dy: -14, r: 50, birth: 0.12, wave: 1, seed: 3.9, layer: "behind" },

  // 2차 웨이브 (두 번째로 피어오르고, 중간에 페이드아웃)
  { dx: -30, dy: -18, r: 46, birth: 0.35, wave: 2, seed: 4.7, layer: "front" },
  { dx: 28, dy: 12, r: 44, birth: 0.40, wave: 2, seed: 5.8, layer: "front" },
  { dx: -6, dy: -26, r: 52, birth: 0.45, wave: 2, seed: 6.6, layer: "behind" },

  // 3차 웨이브 (가장 늦게 도달하여 피어오르고, 마지막까지 남아 잔향 유지)
  { dx: 32, dy: -16, r: 48, birth: 0.65, wave: 3, seed: 7.4, layer: "front" },
  { dx: 4, dy: 22, r: 44, birth: 0.70, wave: 3, seed: 8.5, layer: "front" },
  { dx: -28, dy: -8, r: 54, birth: 0.75, wave: 3, seed: 9.3, layer: "behind" },
];

/**
 * 부드러운 유독 가스 퍼프 (외곽 100% 완전 투명 라디얼 그라데이션)
 */
function drawToxicGasPuff(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  innerAlpha: number = 0.65,
  tint: "dark" | "mid" | "light" = "mid"
) {
  if (radius <= 1 || innerAlpha <= 0.01) return;
  ctx.save();

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);

  if (tint === "dark") {
    // 심연의 탁한 흑자색 (#190526 ~ #2D0845)
    grad.addColorStop(0.0, `rgba(25, 5, 38, ${innerAlpha})`);
    grad.addColorStop(0.35, `rgba(45, 8, 69, ${innerAlpha * 0.85})`);
    grad.addColorStop(0.70, `rgba(74, 14, 110, ${innerAlpha * 0.45})`);
    grad.addColorStop(1.0, `rgba(74, 14, 110, 0.0)`);
  } else if (tint === "mid") {
    // 독성 보라빛 바이올렛 (#3B0764 ~ #6B21A8)
    grad.addColorStop(0.0, `rgba(59, 7, 100, ${innerAlpha})`);
    grad.addColorStop(0.40, `rgba(88, 28, 135, ${innerAlpha * 0.75})`);
    grad.addColorStop(0.75, `rgba(126, 34, 206, ${innerAlpha * 0.35})`);
    grad.addColorStop(1.0, `rgba(126, 34, 206, 0.0)`);
  } else {
    // 상단 피어오르는 유독 연무 가스 (#7E22CE ~ #A855F7)
    grad.addColorStop(0.0, `rgba(107, 33, 168, ${innerAlpha})`);
    grad.addColorStop(0.45, `rgba(147, 51, 234, ${innerAlpha * 0.70})`);
    grad.addColorStop(0.80, `rgba(168, 85, 247, ${innerAlpha * 0.30})`);
    grad.addColorStop(1.0, `rgba(168, 85, 247, 0.0)`);
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 다엽형 유기적 독가스 구름 클러스터 (Organic Billowing Toxic Gas Cloud)
 */
function drawOrganicToxicCloud(
  ctx: any,
  cx: number,
  cy: number,
  baseRadius: number,
  alpha: number,
  seed: number = 0,
  riseOffset: number = 0
) {
  if (alpha <= 0.02 || baseRadius <= 3) return;
  ctx.save();
  ctx.translate(cx, cy - riseOffset);
  ctx.globalAlpha = Math.min(1.0, Math.max(0.0, alpha));

  const lobes = 7;
  const lobeData: { x: number; y: number; r: number }[] = [];

  for (let i = 0; i < lobes; i++) {
    const ang = (i / lobes) * Math.PI * 2 + seed;
    const rVar = 0.72 + 0.38 * Math.sin(ang * 2.3 + seed * 1.7);
    const dist = baseRadius * 0.46 * rVar;
    const lx = Math.cos(ang) * dist;
    const ly = Math.sin(ang) * (dist * 0.82);
    const lr = baseRadius * 0.58 * (0.80 + 0.35 * Math.cos(ang * 3.1 + seed));
    lobeData.push({ x: lx, y: ly, r: lr });
  }

  // 1. 심연 흑자색 코어
  drawToxicGasPuff(ctx, 0, 0, baseRadius * 0.95, 0.70, "dark");

  // 2. 외곽 7개 로브
  for (const l of lobeData) {
    drawToxicGasPuff(ctx, l.x, l.y, l.r, 0.62, "dark");
  }

  // 3. 중상단 바이올렛 볼륨
  drawToxicGasPuff(ctx, 0, -baseRadius * 0.12, baseRadius * 0.72, 0.55, "mid");
  for (const l of lobeData) {
    if (l.y < baseRadius * 0.25) {
      drawToxicGasPuff(ctx, l.x * 0.7, l.y * 0.7 - baseRadius * 0.10, l.r * 0.75, 0.48, "mid");
    }
  }

  // 4. 상단 능선 하이라이트 연무
  for (const l of lobeData) {
    if (l.y < 0) {
      drawToxicGasPuff(ctx, l.x * 0.6, l.y * 0.6 - baseRadius * 0.18, l.r * 0.55, 0.40, "light");
    }
  }

  ctx.restore();
}

/**
 * 스모그 생애주기 투명도/스케일 계산 헬퍼
 */
function getSmogCloudInfo(
  c: SmogCloudDef,
  step: number,
  p: number
): { alpha: number; scale: number; riseOffset: number; active: boolean } {
  if (step < 3) return { alpha: 0, scale: 0, riseOffset: 0, active: false };

  // Step 3: 순차 피어오름
  if (step === 3) {
    if (p < c.birth) return { alpha: 0, scale: 0, riseOffset: 0, active: false };
    const grow = Math.min(1.0, (p - c.birth) / 0.22);
    const scale = 0.35 + 0.65 * Math.sin(grow * Math.PI * 0.5);
    const alpha = Math.min(0.96, grow * 1.05);
    return { alpha, scale, riseOffset: 0, active: true };
  }

  // Step 4: 소용돌이 롤링 & 1차 웨이브부터 서서히 투명화 시작
  if (step === 4) {
    let alpha = 0.96;
    if (c.wave === 1) {
      alpha = Math.max(0.50, 0.96 - p * 0.48);
    } else if (c.wave === 2) {
      alpha = Math.max(0.75, 0.96 - Math.max(0, p - 0.30) * 0.30);
    } else {
      alpha = 0.96;
    }
    return { alpha, scale: 1.0, riseOffset: 0, active: true };
  }

  // Step 5: 상공 분산 소멸 (Wave 1 ➔ Wave 2 ➔ Wave 3 순차 FIFO)
  if (step === 5) {
    let alpha = 0;
    let waveRiseMult = 1.0;
    let waveExpandMult = 1.0;

    if (c.wave === 1) {
      alpha = Math.max(0.0, 0.50 * (1.0 - p / 0.55));
      waveRiseMult = 1.25;
      waveExpandMult = 1.40;
    } else if (c.wave === 2) {
      alpha = Math.max(0.0, 0.75 * (1.0 - p / 0.80));
      waveRiseMult = 1.05;
      waveExpandMult = 1.22;
    } else {
      alpha = Math.max(0.0, 0.95 * (1.0 - p));
      waveRiseMult = 0.85;
      waveExpandMult = 1.10;
    }

    const rise = p * 38 * waveRiseMult;
    const scale = (1.0 + p * 0.35) * waveExpandMult;
    return { alpha, scale, riseOffset: rise, active: alpha > 0.01 };
  }

  return { alpha: 0, scale: 0, riseOffset: 0, active: false };
}

/**
 * 💨 원추형 반투명 유독 가스 빔 콘 (Translucent Toxic Gas Stream Cone)
 * - 입가 노즐에서 대상 쪽으로 부드럽게 팽창하는 고압 유독 가스 기류
 * - 양쪽 외곽 경계선(상/하단) 및 시점/종점 모두 100% 완전 투명 그라데이션 페이드아웃 적용 (사다리꼴 외곽선 제거)
 */
function drawTranslucentToxicGasCone(
  ctx: any,
  ax: number,
  ay: number,
  tx: number,
  ty: number,
  startP: number,
  endP: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || endP <= startP) return;

  const dx = tx - ax;
  const dy = ty - ay;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return;

  const ux = dx / dist;
  const uy = dy / dist;
  const nx = -uy;
  const ny = ux;

  const SAMPLES = 16;
  const pts: { cx: number; cy: number; w: number; s: number }[] = [];

  const wStart = 5.0 + startP * 6.0;
  const wEnd = 12.0 + endP * 32.0;

  for (let i = 0; i <= SAMPLES; i++) {
    const frac = i / SAMPLES;
    const s = startP + frac * (endP - startP);

    // 미세 기체 파동 및 열기 상승
    const wave = Math.sin(s * Math.PI * 3.0) * (3.5 * s);
    const rise = -Math.pow(Math.max(0, s), 1.2) * 8.0;

    const cx = ax + ux * (dist * s) + nx * wave;
    const cy = ay + uy * (dist * s) + ny * wave + rise;
    const w = wStart + frac * (wEnd - wStart);

    pts.push({ cx, cy, w, s });
  }

  ctx.save();

  for (let i = 0; i < SAMPLES; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];

    const midCx = (p0.cx + p1.cx) * 0.5;
    const midCy = (p0.cy + p1.cy) * 0.5;
    const midW = (p0.w + p1.w) * 0.5;
    const midS = (p0.s + p1.s) * 0.5;

    // 종방향(길이 방향) 양 끝단 투명 페이드 (시전자 입가 & 스트림 선두)
    const casterDist = Math.max(0, midS - startP);
    const startFade = Math.min(1.0, casterDist / 0.15);
    const tipDist = Math.max(0, endP - midS);
    const endFade = Math.min(1.0, tipDist / 0.15);
    const longFade = startFade * endFade;
    if (longFade <= 0.01) continue;

    // 횡방향(폭 방향) 양쪽 끝 그라데이션 투명화 (위쪽 끝 0% ~ 중심 100% ~ 아래쪽 끝 0%)
    const grad = ctx.createLinearGradient(
      midCx - nx * midW,
      midCy - ny * midW,
      midCx + nx * midW,
      midCy + ny * midW
    );

    const aBase = alpha * longFade;
    grad.addColorStop(0.0, "rgba(107, 33, 168, 0.0)"); // 외곽 끝 100% 완전 투명 (선 제거)
    grad.addColorStop(0.18, `rgba(126, 34, 206, ${0.18 * aBase})`);
    grad.addColorStop(0.35, `rgba(88, 28, 135, ${0.42 * aBase})`);
    grad.addColorStop(0.50, `rgba(25, 5, 38, ${0.60 * aBase})`); // 중심 진한 심연 흑자색 코어
    grad.addColorStop(0.65, `rgba(88, 28, 135, ${0.42 * aBase})`);
    grad.addColorStop(0.82, `rgba(126, 34, 206, ${0.18 * aBase})`);
    grad.addColorStop(1.0, "rgba(107, 33, 168, 0.0)"); // 반대쪽 외곽 끝 100% 완전 투명 (선 제거)

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(p0.cx - nx * p0.w, p0.cy - ny * p0.w);
    ctx.lineTo(p1.cx - nx * p1.w, p1.cy - ny * p1.w);
    ctx.lineTo(p1.cx + nx * p1.w, p1.cy + ny * p1.w);
    ctx.lineTo(p0.cx + nx * p0.w, p0.cy + ny * p0.w);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 💨 입에서 뿜어져 나오는 유동적 연속 독가스 제트 스트림 (Flowing Toxic Gas Spewing Stream)
 * - 마치 화염방사처럼 입가에서부터 연속으로 뿜어져 나와 앞으로 흘러가는(Flowing) 유기적 독가스 플룸
 */
function drawSmogExhaleStream(
  ctx: any,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  startP: number = 0.0,
  endP: number = 1.0,
  alpha: number = 1.0,
  flowTime: number = 0.0
) {
  if (alpha <= 0.01 || endP <= startP) return;
  ctx.save();

  const dx = endX - startX;
  const dy = endY - startY;
  const dist = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / dist;
  const uy = dy / dist;
  const nx = -uy;
  const ny = ux;

  // 1. 기저 반투명 가스 콘 빔 렌더링
  drawTranslucentToxicGasCone(ctx, startX, startY, endX, endY, startP, endP, alpha);

  // 2. 앞으로 끊임없이 뿜어져 흘러가는 유기적 독가스 뭉게구름 클러스터
  const BURST_SPACING = 0.10;
  const flowAdvance = (flowTime * 0.28) % BURST_SPACING;
  const activeEnd = Math.min(1.08, endP);

  for (let k = 0; k < 12; k++) {
    const t = activeEnd - flowAdvance - k * BURST_SPACING;
    if (t < startP - 0.04 || t > endP + 0.02) continue;

    // 기체 상승 및 롤링 파동
    const wave = Math.sin(t * Math.PI * 3.2 - flowTime * 2.0) * (5.0 * t);
    const jiggle = Math.cos(k * 2.3 + flowTime * 1.5) * (2.0 + t * 4.0);
    const rise = -Math.pow(Math.max(0, t), 1.2) * 10.0;

    const px = startX + ux * (dist * t) + nx * (wave + jiggle);
    const py = startY + uy * (dist * t) + ny * (wave + jiggle) + rise;

    // 기체 팽창: 입가(10px)에서 타겟(42px)으로 점진적 확대
    const r = 10.0 + Math.pow(Math.max(0, t), 0.72) * 32.0;

    // 시전자 노즐 근처 페이드인 (노즐에서 부드럽게 분출)
    const casterDist = Math.max(0, t - startP);
    const nearFade = Math.min(1.0, casterDist / 0.18);

    // 스트림 선두 페이드아웃
    let puffAlpha = alpha * 0.90 * nearFade;
    if (t > endP - 0.08) {
      puffAlpha *= Math.max(0, (endP - t) / 0.08);
    }

    drawOrganicToxicCloud(ctx, px, py, r, puffAlpha, k * 1.5 + flowTime, 0);
  }

  // 3. 가스 제트 스트림 경계를 따라 뿜어지는 유독 연무 가닥 (Mist Wisps)
  const WISP_COUNT = 6;
  for (let j = 0; j < WISP_COUNT; j++) {
    const wt = startP + (j / (WISP_COUNT - 1)) * (endP - startP);
    if (wt < 0.10 || wt > 1.02) continue;

    const sign = j % 2 === 0 ? 1 : -1;
    const wWave = Math.sin(wt * Math.PI * 3.5 - flowTime * 2.5) * (6.0 * wt);
    const halfW = 8.0 + Math.pow(wt, 0.75) * 24.0;
    const rise = -Math.pow(Math.max(0, wt), 1.2) * 10.0;

    const wx = startX + ux * (dist * wt) + nx * (wWave + sign * halfW);
    const wy = startY + uy * (dist * wt) + ny * (wWave + sign * halfW) + rise;

    const wispR = 7.0 + wt * 14.0;
    drawToxicGasPuff(ctx, wx, wy, wispR, alpha * 0.40, "light");
  }

  ctx.restore();
}

/**
 * 123: 스모그 (Smog) 후방 레이어 렌더러
 */
export function drawSmogBehindEffect(
  ctx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  let step = 1;
  let p = 0.5;
  let tx = 550;
  let ty = 180;
  let isP = true;

  if (attackerPosOrFrame && typeof attackerPosOrFrame.x === "number") {
    tx = targetPosOrDrawCtx?.x ?? 550;
    ty = targetPosOrDrawCtx?.y ?? 180;
    step = moveStep ?? 1;
    p = Math.min(1.0, Math.max(0.0, progress ?? 0.5));
    isP = Boolean(isPlayer);
  } else {
    const frame = attackerPosOrFrame || {};
    const drawCtx = targetPosOrDrawCtx || {};
    const tPos = drawCtx.targetPos || { x: 550, y: 180 };
    tx = tPos.x;
    ty = tPos.y;
    step = frame.moveStep ?? 1;
    p = Math.min(1.0, Math.max(0.0, frame.effectProgress ?? 0.5));
    isP = Boolean(drawCtx.isPlayer);
  }

  if (step < 3) return;

  ctx.save();
  const behindClouds = SMOG_BILLOW_CLOUDS.filter(c => c.layer === "behind");
  const targetCenterY = ty - (isP ? 14 : 10);

  for (const c of behindClouds) {
    const info = getSmogCloudInfo(c, step, p);
    if (!info.active) continue;

    const swirlFreq = step === 5 ? 1.2 : 2.0;
    const swirlAmp = step === 4 ? 4 : (step === 3 ? 3 : 2);
    const sx = c.dx + Math.sin(p * Math.PI * swirlFreq + c.seed) * swirlAmp;
    const sy = c.dy + Math.cos(p * Math.PI * swirlFreq + c.seed) * swirlAmp;

    drawOrganicToxicCloud(
      ctx,
      tx + sx,
      targetCenterY + sy,
      c.r * info.scale,
      info.alpha,
      c.seed,
      info.riseOffset
    );
  }
  ctx.restore();
}

/**
 * 123: 스모그 (Smog) 전면 레이어 렌더러
 */
export function drawSmogEffect(
  ctx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  let step = 1;
  let p = 0.5;
  let ax = 200;
  let ay = 300;
  let tx = 550;
  let ty = 180;
  let isP = true;
  let frameObj: any = null;

  if (attackerPosOrFrame && typeof attackerPosOrFrame.x === "number") {
    ax = attackerPosOrFrame.x;
    ay = attackerPosOrFrame.y;
    tx = targetPosOrDrawCtx?.x ?? 550;
    ty = targetPosOrDrawCtx?.y ?? 180;
    step = moveStep ?? 1;
    p = Math.min(1.0, Math.max(0.0, progress ?? 0.5));
    isP = Boolean(isPlayer);
  } else {
    const frame = attackerPosOrFrame || {};
    frameObj = frame;
    const drawCtx = targetPosOrDrawCtx || {};
    const aPos = drawCtx.attackerPos || { x: 200, y: 300 };
    const tPos = drawCtx.targetPos || { x: 550, y: 180 };
    ax = aPos.x;
    ay = aPos.y;
    tx = tPos.x;
    ty = tPos.y;
    step = frame.moveStep ?? 1;
    p = Math.min(1.0, Math.max(0.0, frame.effectProgress ?? 0.5));
    isP = Boolean(drawCtx.isPlayer);
  }

  ctx.save();

  const mouthX = ax + (isP ? 34 : -34);
  const mouthY = ay - (isP ? 14 : 10);
  const targetCenterY = ty - (isP ? 14 : 10);

  // 1. Step 1: 시전자 들이쉬기 웅크림 & 입가 독가스 연무 응축
  if (step === 1) {
    const muzzleAlpha = Math.min(0.95, p * 1.6);
    const muzzleR = 12 + p * 16;
    drawOrganicToxicCloud(ctx, mouthX, mouthY, muzzleR, muzzleAlpha, 0.8);

    // 입가 주변 독가스 미세 연무
    for (let i = 0; i < 4; i++) {
      const ang = -0.4 + (i / 3) * 0.8 + (isP ? 0 : Math.PI);
      const dist = 10 + p * 18;
      const sx = mouthX + Math.cos(ang) * dist;
      const sy = mouthY + Math.sin(ang) * (dist * 0.6);
      drawToxicGasPuff(ctx, sx, sy, 4.0, muzzleAlpha * 0.75, "dark");
    }
  }

  // 2. 가스 제트 스트림 지속 분사 (마치 화염방사처럼 입에서 계속해서 뿜어냄!)
  let streamHead = frameObj?.streamHead;
  let streamTail = frameObj?.streamTail ?? 0.0;
  let streamAlpha = frameObj?.streamAlpha ?? 1.0;

  if (streamHead === undefined) {
    if (step === 2) {
      streamHead = Math.min(1.05, 0.35 + p * 0.70);
      streamTail = 0.0;
      streamAlpha = 1.0;
    } else if (step === 3) {
      streamHead = 1.10;
      streamTail = 0.0;
      streamAlpha = 1.0;
    } else if (step === 4) {
      streamHead = 1.10;
      streamTail = p < 0.35 ? 0.0 : (p - 0.35) / 0.65;
      streamAlpha = Math.max(0, 1.0 - streamTail * 0.45);
    } else {
      streamHead = 0;
      streamTail = 0;
      streamAlpha = 0;
    }
  }

  if (streamHead > 0 && streamHead > streamTail && streamAlpha > 0.01) {
    const flowTime = (step * 2.0) + p * 3.5;
    drawSmogExhaleStream(
      ctx,
      mouthX,
      mouthY,
      tx,
      targetCenterY,
      streamTail,
      streamHead,
      streamAlpha,
      flowTime
    );
  }

  // 3. Step 3 ~ 5: 대상 포켓몬 전신 포위 뭉게구름 (전면 레이어)
  if (step >= 3) {
    const frontClouds = SMOG_BILLOW_CLOUDS.filter(c => c.layer === "front");

    for (const c of frontClouds) {
      const info = getSmogCloudInfo(c, step, p);
      if (!info.active) continue;

      const swirlFreq = step === 5 ? 1.2 : 2.0;
      const swirlAmp = step === 4 ? 4 : (step === 3 ? 3 : 2);
      const sx = c.dx + Math.sin(p * Math.PI * swirlFreq + c.seed) * swirlAmp;
      const sy = c.dy + Math.cos(p * Math.PI * swirlFreq + c.seed) * swirlAmp;

      drawOrganicToxicCloud(
        ctx,
        tx + sx,
        targetCenterY + sy,
        c.r * info.scale,
        info.alpha,
        c.seed,
        info.riseOffset
      );
    }
  }

  ctx.restore();
}

/**
 * ============================================================================
 * ☣️ 124: 오물공격 (Sludge) - 독 타입 특수 기술 (위력 65, 명중 100%, 30% 독)
 * ============================================================================
 * 
 * 연출 지침 (유저 100% 반영):
 * 1. 투사체: 순수 스모그 가스로 뭉쳐진 유기적 덩어리 (Billowing Smog Cluster Blob)
 * 2. 궤적: 포물선 탄도 비행 & 날아가면서 뒤편으로 스모그 연무 잔상 방출 & 바닥 그림자
 * 3. 피격: 맞으면 독침 맞았을 때 같은 이펙트
 *    - 착탄 순간 핀포인트 독기 타격 스파크 및 스모그 파열
 *    - 피격자 전신 선명한 보라색화 진행 (0.35 ➔ 0.75 ➔ 1.0 ➔ 0.40 ➔ 0)
 *    - 피격자 주변에 100% 완전 불투명 선명한 영롱한 보라색 독 비눗방울 군집 발생 및 상공 부유
 */

/**
 * 표준 오물공격 포물곡선 위치 계산 헬퍼 (유려한 정통 탄도 곡선)
 */
function getSludgeParabolaPos(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  t: number,
  arcHeight: number = 105
) {
  const clampedT = Math.max(0, Math.min(1.0, t));
  const x = startX + (endX - startX) * clampedT;
  const directY = startY + (endY - startY) * clampedT;
  const arc = Math.sin(clampedT * Math.PI) * arcHeight;
  return { x, y: directY - arc };
}

/**
 * 포물선 탄도 궤적 접선(Tangent) 순간 비행 각도 계산 헬퍼
 */
function getSludgeTangentAngle(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  t: number,
  arcHeight: number = 105
) {
  const clampedT = Math.max(0, Math.min(1.0, t));
  const dx = endX - startX;
  const dy = (endY - startY) - Math.cos(clampedT * Math.PI) * Math.PI * arcHeight;
  return Math.atan2(dy, dx);
}

/**
 * 🟣 순수 스모그 가스로 뭉쳐진 유기적 독가스 덩어리 (Billowing Smog Cluster Blob)
 * - 딱딱하거나 번들거리는 액체 껍질이 아닌, 꿀렁이는 고밀도 유기적 스모그 가스 뭉치
 */
function drawSludgeSmogBlob(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  tangentAngle: number,
  flightProg: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || radius <= 1) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.translate(cx, cy);
  ctx.rotate(tangentAngle);

  // 탄도 비행 속도감에 따른 미세한 타원 변형 (Squash & Stretch)
  ctx.scale(1.15, 0.90);

  // 1. 심연 흑자색 고밀도 코어 스모그 퍼프
  const coreR = radius * 0.85;
  drawToxicGasPuff(ctx, 0, 0, coreR, 0.95, "dark");

  // 2. 꿀렁이며 회전하는 4개의 외곽 스모그 로브 (깔끔하고 명확한 스모그 덩어리)
  const lobes = 4;
  for (let i = 0; i < lobes; i++) {
    const ang = (i / lobes) * Math.PI * 2 + flightProg * 5.0;
    const dist = radius * 0.42;
    const lx = Math.cos(ang) * dist;
    const ly = Math.sin(ang) * dist;
    const lr = radius * 0.52;

    drawToxicGasPuff(ctx, lx, ly, lr, 0.80, "mid");
  }

  // 3. 선두 능선 라이트 바이올렛 스모그 층 (light)
  drawToxicGasPuff(ctx, radius * 0.25, 0, radius * 0.45, 0.65, "light");

  ctx.restore();
}

/**
 * 💨 포물선 비행 후류에 남겨지는 스모그 연무 잔상 (Smog Trail Puff)
 * - 촘촘하게 뭉치지 않고, 공기 중에 퐁퐁 피어나는 부드러운 스모그 연무
 */
function drawSmogTrailPuff(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  alpha: number,
  seed: number
) {
  if (alpha <= 0.02 || radius <= 2) return;
  ctx.save();

  // 1. 은은한 심연 흑자색 코어
  drawToxicGasPuff(ctx, cx, cy, radius * 0.70, alpha * 0.85, "dark");

  // 2. 부드럽게 퍼지는 바이올렛 스모그 연무 체적
  drawToxicGasPuff(ctx, cx, cy, radius, alpha * 0.65, "mid");

  // 3. 상단으로 살짝 피어오르는 라이트 연기
  const driftX = Math.cos(seed) * (radius * 0.25);
  const driftY = -radius * 0.25;
  drawToxicGasPuff(ctx, cx + driftX, cy + driftY, radius * 0.55, alpha * 0.45, "light");

  ctx.restore();
}

/**
 * 궤적 포물선 비행 및 바닥 그림자, 후류 스모그 연무 잔상 렌더러
 */
function drawSludgePelletAndTrail(
  ctx: any,
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  p: number,
  arcHeight: number = 105,
  alpha: number = 1.0
) {
  if (alpha <= 0.02 || p <= 0 || p >= 1.05) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const curPos = getSludgeParabolaPos(startX, startY, targetX, targetY, p, arcHeight);

  // 1. 바닥 타원형 그림자 (고도에 따라 크기/진하기 변동)
  const groundStartY = startY + 22;
  const groundTargetY = targetY + 22;
  const shadowY = groundStartY + (groundTargetY - groundStartY) * p;
  const heightFactor = Math.sin(p * Math.PI);
  const shadowAlpha = Math.max(0.12, 0.40 * (1.0 - heightFactor * 0.45));
  const shadowRx = 14 * (1.0 - heightFactor * 0.35);
  const shadowRy = 6 * (1.0 - heightFactor * 0.35);

  ctx.save();
  ctx.fillStyle = `rgba(15, 23, 42, ${shadowAlpha * alpha})`;
  ctx.beginPath();
  ctx.ellipse(curPos.x, shadowY, shadowRx, shadowRy, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. 포물선 궤적 뒤편으로 남겨지는 여유로운 스모그 연무 잔상 3개 (촘촘함 해소, 퐁... 퐁... 퐁...)
  const trailCount = 3;
  const stepGap = 0.085; // 기존 0.035 -> 0.085로 대폭 넓혀 띄엄띄엄 배치
  for (let i = trailCount; i >= 1; i--) {
    const tp = p - i * stepGap;
    if (tp > 0) {
      const tPos = getSludgeParabolaPos(startX, startY, targetX, targetY, tp, arcHeight);
      // i=1 (가장 가까운 잔상) -> 작고 비교적 선명
      // i=3 (가장 먼 잔상) -> 크고 부드럽게 공기 중으로 흩어짐
      const distFromHead = i; // 1, 2, 3
      const trailAlpha = (0.65 - (distFromHead - 1) * 0.18) * alpha; // 0.65, 0.47, 0.29
      const trailR = 10.0 + distFromHead * 3.5; // 13.5px, 17px, 20.5px
      const rise = distFromHead * 4.5; // 가스가 공기 중으로 피어오르는 높이

      drawSmogTrailPuff(ctx, tPos.x, tPos.y - rise, trailR, trailAlpha, i * 2.1 + p * 3.0);
    }
  }

  // 3. 탄도 궤적 접선(Tangent) 순간 비행 각도
  const tangentAngle = getSludgeTangentAngle(startX, startY, targetX, targetY, p, arcHeight);

  // 4. 선두 스모그 덩어리 본체 (14.5px 깔끔한 크기)
  drawSludgeSmogBlob(ctx, curPos.x, curPos.y, 14.5, tangentAngle, p, alpha);

  ctx.restore();
}

/**
 * 💨 도달 시 사방 여러 방향으로 방사형으로 퍼지는 스모그 클러스터
 * - 유저 요청: 도달 시 퍼지는 스모그는 여러 방향으로
 */
interface RadialSmogLobe {
  ang: number;      // 발산 각도
  dist: number;     // 도달 거리
  r: number;        // 기본 반경
  seed: number;
  layer: "front" | "behind";
}

const RADIAL_SMOG_LOBES: RadialSmogLobe[] = [
  // 상단 및 후방 (behind layer)
  { ang: -Math.PI * 0.50, dist: 50, r: 25, seed: 1.2, layer: "behind" }, // 정수리 위쪽
  { ang: -Math.PI * 0.75, dist: 46, r: 23, seed: 2.3, layer: "behind" }, // 좌상단
  { ang: -Math.PI * 0.25, dist: 48, r: 24, seed: 3.5, layer: "behind" }, // 우상단
  { ang: -Math.PI * 0.90, dist: 52, r: 22, seed: 4.1, layer: "behind" }, // 좌측 뒤

  // 전방 및 사방 (front layer)
  { ang: 0, dist: 54, r: 26, seed: 5.4, layer: "front" },               // 우측 전방
  { ang: Math.PI * 0.22, dist: 46, r: 23, seed: 6.2, layer: "front" },   // 우하단
  { ang: Math.PI * 0.55, dist: 40, r: 22, seed: 7.3, layer: "front" },   // 하단
  { ang: Math.PI * 0.85, dist: 45, r: 23, seed: 8.5, layer: "front" },   // 좌하단
  { ang: Math.PI * 1.05, dist: 50, r: 25, seed: 9.1, layer: "front" },   // 좌측 앞
];

/**
 * 방사형 다방향 스모그 확산 렌더러
 */
function drawRadialSmogDispersal(
  ctx: any,
  cx: number,
  cy: number,
  expansion: number,
  alpha: number,
  layer: "front" | "behind"
) {
  if (alpha <= 0.02) return;
  ctx.save();

  // 1. 중심 대형 코어 스모그
  if (layer === "front") {
    const coreR = 26 + expansion * 16;
    drawToxicGasPuff(ctx, cx, cy - expansion * 6, coreR * 0.85, alpha * 0.90, "dark");
    drawToxicGasPuff(ctx, cx, cy - expansion * 6, coreR, alpha * 0.82, "mid");
  } else {
    const coreR = 30 + expansion * 20;
    drawToxicGasPuff(ctx, cx, cy - expansion * 8, coreR, alpha * 0.88, "dark");
  }

  // 2. 여러 방향(방사형)으로 터져 나가는 스모그 로브들
  const targetLobes = RADIAL_SMOG_LOBES.filter(l => l.layer === layer);
  for (const lobe of targetLobes) {
    const curDist = lobe.dist * (0.35 + expansion * 0.75);
    const lx = cx + Math.cos(lobe.ang) * curDist;
    const ly = cy + Math.sin(lobe.ang) * (curDist * 0.75) - expansion * 8;
    const curR = lobe.r * (0.70 + expansion * 0.65);

    // 심연 코어 + 바이올렛 체적 + 라이트 하이라이트
    drawToxicGasPuff(ctx, lx, ly, curR * 0.80, alpha * 0.88, "dark");
    drawToxicGasPuff(ctx, lx, ly, curR, alpha * 0.82, "mid");
    drawToxicGasPuff(ctx, lx, ly - curR * 0.2, curR * 0.65, alpha * 0.55, "light");
  }

  ctx.restore();
}

/**
 * 124: 오물공격 (Sludge) 후방 레이어 렌더러
 * - 도달 시 대상을 3D로 감싸는 배경 스모그 구름 여러 방향 확산
 */
export function drawSludgeBehindEffect(
  ctx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx: any,
  moveStep?: number,
  _progress?: number,
  isPlayer?: boolean
) {
  let step = 1;
  let tx = 550;
  let ty = 180;
  let isP = true;

  if (attackerPosOrFrame && typeof attackerPosOrFrame.x === "number") {
    tx = targetPosOrDrawCtx?.x ?? 550;
    ty = targetPosOrDrawCtx?.y ?? 180;
    step = moveStep ?? 1;
    isP = Boolean(isPlayer);
  } else {
    const frame = attackerPosOrFrame || {};
    const drawCtx = targetPosOrDrawCtx || {};
    const tPos = drawCtx.targetPos || { x: 550, y: 180 };
    tx = tPos.x;
    ty = tPos.y;
    step = frame.moveStep ?? 1;
    isP = Boolean(drawCtx.isPlayer);
  }

  if (step < 3 || step > 4) return;

  ctx.save();
  const targetCenterY = ty - (isP ? 14 : 10);

  // 도달 시 대상 후방 여러 방향으로 터져 나가는 스모그 구름 (3D 샌드위치 레이어)
  if (step === 3) {
    drawRadialSmogDispersal(ctx, tx, targetCenterY, 0.40, 0.90, "behind");
  } else if (step === 4) {
    drawRadialSmogDispersal(ctx, tx, targetCenterY, 0.95, 0.42, "behind");
  }

  ctx.restore();
}

/**
 * 🫧 오물공격 전용 3개 독 거품 좌표 (단계별 상승 애니메이션)
 * - 유저 요청: 거품 나오는 개수 3개
 */
const SLUDGE_BUBBLES_STEP3 = [
  { ox: -14, oy: 6, r: 8.0 },
  { ox: 15, oy: -6, r: 9.5 },
  { ox: -2, oy: 16, r: 7.0 },
];

const SLUDGE_BUBBLES_STEP4 = [
  { ox: -18, oy: -18, r: 8.5 },
  { ox: 19, oy: -32, r: 10.0 },
  { ox: 0, oy: -10, r: 7.5 },
];

const SLUDGE_BUBBLES_STEP5 = [
  { ox: -22, oy: -42, r: 7.5 },
  { ox: 23, oy: -58, r: 9.0 },
  { ox: 2, oy: -34, r: 6.5 },
];

function drawSludgeThreePoisonBubbles(ctx: any, tx: number, ty: number, wave: 1 | 2 | 3) {
  const bubbles = wave === 1 ? SLUDGE_BUBBLES_STEP3 : (wave === 2 ? SLUDGE_BUBBLES_STEP4 : SLUDGE_BUBBLES_STEP5);
  for (const b of bubbles) {
    drawPoisonSoapBubble(ctx, tx + b.ox, ty + b.oy, b.r);
  }
}

/**
 * 124: 오물공격 (Sludge) 전면 레이어 렌더러
 */
export function drawSludgeEffect(
  ctx: any,
  attackerPosOrFrame: any,
  targetPosOrDrawCtx: any,
  moveStep?: number,
  progress?: number,
  isPlayer?: boolean
) {
  let step = 1;
  let p = 0.5;
  let ax = 200;
  let ay = 300;
  let tx = 550;
  let ty = 180;
  let isP = true;

  if (attackerPosOrFrame && typeof attackerPosOrFrame.x === "number") {
    ax = attackerPosOrFrame.x;
    ay = attackerPosOrFrame.y;
    tx = targetPosOrDrawCtx?.x ?? 550;
    ty = targetPosOrDrawCtx?.y ?? 180;
    step = moveStep ?? 1;
    p = Math.min(1.0, Math.max(0.0, progress ?? 0.5));
    isP = Boolean(isPlayer);
  } else {
    const frame = attackerPosOrFrame || {};
    const drawCtx = targetPosOrDrawCtx || {};
    const aPos = drawCtx.attackerPos || { x: 200, y: 300 };
    const tPos = drawCtx.targetPos || { x: 550, y: 180 };
    ax = aPos.x;
    ay = aPos.y;
    tx = tPos.x;
    ty = tPos.y;
    step = frame.moveStep ?? 1;
    p = Math.min(1.0, Math.max(0.0, frame.effectProgress ?? 0.5));
    isP = Boolean(drawCtx.isPlayer);
  }

  ctx.save();

  const launchX = ax + (isP ? 36 : -36);
  const launchY = ay - (isP ? 16 : 12);
  const targetCenterY = ty - (isP ? 14 : 10);

  // Step 1: 시전자 웅크림 및 스모그 덩어리 응축 생성
  if (step === 1) {
    const gatherR = 8.0 + p * 10.0;
    const gatherAlpha = Math.min(1.0, p * 1.4);
    drawSludgeSmogBlob(ctx, launchX, launchY, gatherR, 0, p, gatherAlpha);
  }

  // Step 2: 포물선 고각 투척 비행 & 후류 스모그 연무 잔상 & 바닥 그림자
  else if (step === 2) {
    drawSludgePelletAndTrail(ctx, launchX, launchY, tx, targetCenterY, p, 105, 1.0);
  }

  // Step 3: 도달 시 여러 방향으로 스모그 확산 퍼짐 & 독 거품 3개 발생
  else if (step === 3) {
    drawRadialSmogDispersal(ctx, tx, targetCenterY, 0.40, 0.90, "front");
    drawSludgeThreePoisonBubbles(ctx, tx, targetCenterY, 1);
  }

  // Step 4: 스모그 사방 확장 & 상공 승화 & 독 거품 3개 상승
  else if (step === 4) {
    drawRadialSmogDispersal(ctx, tx, targetCenterY, 0.95, 0.42, "front");
    drawSludgeThreePoisonBubbles(ctx, tx, targetCenterY, 2);
  }

  // Step 5: 스모그 완전 소멸 & 독 거품 3개 상공 부유 및 분산 소멸
  else if (step === 5) {
    drawSludgeThreePoisonBubbles(ctx, tx, targetCenterY, 3);
  }

  ctx.restore();
}



