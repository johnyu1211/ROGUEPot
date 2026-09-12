// ============================================================================
// ⚠️ [기술 이펙트 제작 지침 - 256색 팔레트 최적화(Octree Optimizer) 기준]
// 1. 배틀 GIF 렌더러는 Octree Quantizer + useOptimizer (threshold: 30) 기반의
//    256색 팔레트 재사용 표준을 채택하고 있음.
// 2. 기술 제작 시 불필요한 과도한 그라디언트 난사를 지양하고, 256색 팔레트 환경에서
//    선명하게 돋보이는 핵심 고채도 단색/네온 색상 체계 및 30 FPS 규격을 기준으로 제작할 것.
// 3. 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
//    직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { drawMiniRetroStar, drawStarburstImpact } from "../common/helpers.js";

/**
 * Gen 1 Moves 069 - 072 Renderers
 * 
 * 069: 지구던지기 (Seismic Toss)
 * 070: 괴력 (Strength)
 * 071: 흡수 (Absorb)
 * 072: 메가드레인 (Mega Drain)
 */

// ============================================================================
// 069: 지구던지기 (Seismic Toss) - 그래픽 렌더러
// ============================================================================

export function drawSeismicEarthGlobe(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  earthRot: number = 0,
  alpha: number = 1.0,
  crescentProg: number = 0,
  diamondAlpha: number = 0
) {
  if (alpha <= 0.01 || radius <= 2) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  if (radius >= 600) {
    ctx.fillStyle = "#020101";
    ctx.fillRect(-10000, -10000, 20000, 20000);
    ctx.restore();
    return;
  }

  const outerCoronaR = radius * 1.38;
  const coronaGrad = ctx.createRadialGradient(
    cx,
    cy,
    radius * 0.90,
    cx,
    cy,
    outerCoronaR
  );
  coronaGrad.addColorStop(0.00, "rgba(254, 215, 170, 0.85)");
  coronaGrad.addColorStop(0.18, "rgba(249, 115, 22, 0.70)");
  coronaGrad.addColorStop(0.45, "rgba(194, 65, 12, 0.38)");
  coronaGrad.addColorStop(0.75, "rgba(120, 53, 15, 0.14)");
  coronaGrad.addColorStop(1.00, "rgba(24, 6, 2, 0.0)");
  ctx.fillStyle = coronaGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, outerCoronaR, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();

  const darkSphereGrad = ctx.createRadialGradient(
    cx - radius * 0.15,
    cy - radius * 0.15,
    0,
    cx,
    cy,
    radius
  );
  darkSphereGrad.addColorStop(0.00, "#0e0604");
  darkSphereGrad.addColorStop(0.60, "#060202");
  darkSphereGrad.addColorStop(0.92, "#030101");
  darkSphereGrad.addColorStop(1.00, "#010000");
  ctx.fillStyle = darkSphereGrad;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

  ctx.restore();
  ctx.restore();
}

export function drawOrbitAtmosphericTrails(
  ctx: any,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  tiltAngle: number,
  orbitAngle: number,
  isFrontLayer: boolean,
  intensity: number = 1.0,
  targetPos?: { x: number; y: number }
) {
  if (intensity <= 0.01) return;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tiltAngle);

  let effectiveAngle = orbitAngle;
  let effectiveRx = rx;
  let effectiveRy = ry;

  if (targetPos) {
    const dx = targetPos.x - cx;
    const dy = targetPos.y - cy;
    const cosT = Math.cos(-tiltAngle);
    const sinT = Math.sin(-tiltAngle);
    const unRotX = dx * cosT - dy * sinT;
    const unRotY = dx * sinT + dy * cosT;
    const aspect = ry / rx;
    effectiveRx = Math.sqrt(unRotX * unRotX + (unRotY * unRotY) / (aspect * aspect));
    effectiveRy = effectiveRx * aspect;
    effectiveAngle = Math.atan2(unRotY / aspect, unRotX);
  }

  const STEPS = 32;
  const TRAIL_LENGTH = Math.PI * 0.85;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let i = 0; i < STEPS; i++) {
    const tHead = effectiveAngle - (1 - (i + 1) / STEPS) * TRAIL_LENGTH;
    const tTail = effectiveAngle - (1 - i / STEPS) * TRAIL_LENGTH;

    const midT = (tHead + tTail) / 2;
    const isMidFront = Math.sin(midT) >= -0.05;
    if (isMidFront !== isFrontLayer) continue;

    const progress = (i + 1) / STEPS;
    const x1 = effectiveRx * Math.cos(tTail);
    const y1 = effectiveRy * Math.sin(tTail);
    const x2 = effectiveRx * Math.cos(tHead);
    const y2 = effectiveRy * Math.sin(tHead);

    const w = (1.5 + progress * 6.5) * intensity;
    ctx.lineWidth = w;

    if (progress > 0.75) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${progress * 0.95 * intensity})`;
    } else if (progress > 0.35) {
      ctx.strokeStyle = `rgba(254, 240, 138, ${progress * 0.85 * intensity})`;
    } else {
      ctx.strokeStyle = `rgba(249, 115, 22, ${progress * 0.60 * intensity})`;
    }

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  const isHeadFront = Math.sin(effectiveAngle) >= -0.05;
  if (isHeadFront === isFrontLayer) {
    const headX = effectiveRx * Math.cos(effectiveAngle);
    const headY = effectiveRy * Math.sin(effectiveAngle);

    for (let s = 0; s < 6; s++) {
      const sparkDist = (s + 1) * 7;
      const sparkAng = effectiveAngle + Math.PI + (Math.sin(s * 1.8) * 0.35);
      const sx = headX + Math.cos(sparkAng) * sparkDist;
      const sy = headY + Math.sin(sparkAng) * sparkDist * 0.6;
      const sr = Math.max(1, 3.8 - s * 0.5);

      ctx.fillStyle = s % 2 === 0 ? "rgba(255, 255, 255, 0.95)" : "rgba(253, 224, 71, 0.90)";
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

export function drawSeismicCrater(
  ctx: any,
  tx: number,
  ty: number,
  progress: number = 1.0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || progress <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const p = Math.min(1.0, progress);
  const w = 78 * p;
  const h = 26 * p;

  const pitGrad = ctx.createRadialGradient(tx, ty + 6, w * 0.05, tx, ty + 6, w * 0.70);
  pitGrad.addColorStop(0.00, "rgba(254, 240, 138, 0.85)");
  pitGrad.addColorStop(0.35, "rgba(249, 115, 22, 0.70)");
  pitGrad.addColorStop(0.70, "rgba(154, 52, 18, 0.50)");
  pitGrad.addColorStop(1.00, "rgba(4, 1, 1, 0.0)");
  ctx.fillStyle = pitGrad;
  ctx.beginPath();
  ctx.ellipse(tx, ty + 6, w * 0.70, h * 0.70, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = Math.max(2.2, 3.4 * (1 - p * 0.25));
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const CRACK_BRANCHES = [
    [{ dx: -16, dy: -4 }, { dx: -44, dy: -11 }, { dx: -72, dy: -18 }],
    [{ dx: -20, dy:  5 }, { dx: -54, dy:  13 }, { dx: -88, dy:  21 }],
    [{ dx:  -6, dy: 10 }, { dx:  -8, dy:  26 }, { dx:  -4, dy:  40 }],
    [{ dx:  18, dy:  6 }, { dx:  56, dy:  15 }, { dx:  88, dy:  23 }],
    [{ dx:  16, dy: -4 }, { dx:  48, dy: -10 }, { dx:  74, dy: -16 }],
    [{ dx:   4, dy: -8 }, { dx:   7, dy: -23 }, { dx:   5, dy: -35 }],
  ];

  for (let b = 0; b < CRACK_BRANCHES.length; b++) {
    const branch = CRACK_BRANCHES[b];
    const lastPt = branch[branch.length - 1];
    const endX = tx + lastPt.dx * p;
    const endY = ty + 6 + lastPt.dy * p;

    const crackGrad = ctx.createLinearGradient(tx, ty + 6, endX, endY);
    crackGrad.addColorStop(0.00, "rgba(249, 115, 22, 1.0)");
    crackGrad.addColorStop(0.70, "rgba(249, 115, 22, 0.95)");
    crackGrad.addColorStop(0.88, "rgba(249, 115, 22, 0.50)");
    crackGrad.addColorStop(1.00, "rgba(249, 115, 22, 0.00)");

    ctx.strokeStyle = crackGrad;
    ctx.beginPath();
    ctx.moveTo(tx, ty + 6);
    for (let i = 0; i < branch.length; i++) {
      const pt = branch[i];
      const targetPtX = tx + pt.dx * p;
      const targetPtY = ty + 6 + pt.dy * p;
      ctx.lineTo(targetPtX, targetPtY);
    }
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(253, 224, 71, 0.85)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(tx, ty + 6, w * 0.88, h * 0.88, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

export function drawSeismicSlamImpact(
  ctx: any,
  tx: number,
  ty: number,
  progress: number = 0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const groundY = ty + 6;

  const ring1W = 35 + progress * 95;
  const ring1H = 14 + progress * 36;
  const ring1Alpha = Math.max(0, (1.0 - progress) * alpha);

  ctx.lineWidth = Math.max(1.5, 4.5 * (1 - progress));
  ctx.strokeStyle = `rgba(255, 255, 255, ${ring1Alpha * 0.95})`;
  ctx.beginPath();
  ctx.ellipse(tx, groundY, ring1W, ring1H, 0, 0, Math.PI * 2);
  ctx.stroke();

  const ring2W = ring1W * 0.72;
  const ring2H = ring1H * 0.72;
  ctx.lineWidth = Math.max(1.2, 3.2 * (1 - progress));
  ctx.strokeStyle = `rgba(249, 115, 22, ${ring1Alpha * 0.85})`;
  ctx.beginPath();
  ctx.ellipse(tx, groundY, ring2W, ring2H, 0, 0, Math.PI * 2);
  ctx.stroke();

  const ROCKS = [
    { vx: -48, vy: -58, size: 7.5, rot: -2.8 },
    { vx:  44, vy: -62, size: 7.0, rot:  3.1 },
    { vx: -68, vy: -32, size: 6.0, rot: -1.9 },
    { vx:  65, vy: -28, size: 6.5, rot:  2.4 },
    { vx: -28, vy: -75, size: 8.5, rot: -3.5 },
    { vx:  25, vy: -78, size: 8.0, rot:  3.8 },
    { vx: -54, vy: -15, size: 5.5, rot: -1.2 },
    { vx:  52, vy: -12, size: 5.0, rot:  1.5 },
  ];

  for (let i = 0; i < ROCKS.length; i++) {
    const r = ROCKS[i];
    const rx = tx + r.vx * progress;
    const ry = groundY + (r.vy * progress) + (55 * progress * progress);
    const rSize = r.size * (1 - progress * 0.25);
    const curRot = r.rot * progress;

    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(curRot);

    ctx.fillStyle = "#78350f";
    ctx.strokeStyle = "#451a03";
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.moveTo(-rSize * 0.8, -rSize * 0.6);
    ctx.lineTo( rSize * 0.4, -rSize * 0.9);
    ctx.lineTo( rSize * 0.9, -rSize * 0.2);
    ctx.lineTo( rSize * 0.6,  rSize * 0.8);
    ctx.lineTo(-rSize * 0.5,  rSize * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  if (progress <= 0.65) {
    const starScale = (1.0 - progress * 1.2);
    drawStarburstImpact(ctx, tx, groundY - 10, "#EA580C", "#FEF08A", 36 * starScale);
    drawMiniRetroStar(ctx, tx - 22, groundY - 36, 12 * starScale, "#FFFFFF");
    drawMiniRetroStar(ctx, tx + 24, groundY - 32, 11 * starScale, "#FEF08A");
    drawMiniRetroStar(ctx, tx,      groundY - 50, 14 * starScale, "#FFFFFF");
  }

  ctx.restore();
}

export function drawSeismicTossBehindEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    width?: number;
    height?: number;
    [key: string]: any;
  }
) {
  const cw = drawCtx.width || 560;
  const ch = drawCtx.height || 380;

  const spaceAlpha = frame.spaceAlpha ?? 0;
  if (spaceAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = Math.min(1.0, spaceAlpha);
    ctx.fillStyle = "#000000";
    ctx.fillRect(-10000, -10000, 20000, 20000);

    const STARS = [
      { x: cw * 0.08, y: ch * 0.15, r: 0.7, a: 0.18 },
      { x: cw * 0.22, y: ch * 0.22, r: 0.5, a: 0.12 },
      { x: cw * 0.78, y: ch * 0.12, r: 0.7, a: 0.18 },
      { x: cw * 0.90, y: ch * 0.24, r: 0.5, a: 0.14 },
      { x: cw * 0.12, y: ch * 0.65, r: 0.6, a: 0.12 },
      { x: cw * 0.88, y: ch * 0.65, r: 0.6, a: 0.14 },
    ];
    for (let s = 0; s < STARS.length; s++) {
      const st = STARS[s];
      ctx.fillStyle = s % 2 === 0
        ? `rgba(254, 240, 138, ${st.a * spaceAlpha})`
        : `rgba(255, 255, 255, ${st.a * spaceAlpha})`;
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  const earthAlpha = frame.earthAlpha ?? 0;
  const earthRadius = frame.earthRadius ?? 68;
  const earthRot = frame.earthRot ?? 0;
  const earthCenterX = frame.earthCenterX ?? (cw * 0.50);
  const earthCenterY = frame.earthCenterY ?? (ch * 0.38);
  const crescentProgress = frame.crescentProgress ?? 1.0;
  const diamondAlpha = frame.diamondAlpha ?? (crescentProgress >= 0.95 ? 1.0 : 0.0);
  if (earthAlpha > 0.01) {
    drawSeismicEarthGlobe(
      ctx,
      earthCenterX,
      earthCenterY,
      earthRadius,
      earthRot,
      earthAlpha,
      crescentProgress,
      diamondAlpha
    );
  }

  const orbitAlpha = frame.orbitAlpha ?? 0;
  const orbitAngle = frame.orbitAngle;
  if (orbitAlpha > 0.01 && orbitAngle !== undefined) {
    const isP = drawCtx.isPlayer;
    const targetBase = isP ? drawCtx.em : drawCtx.pm;
    const targetOffset = isP ? frame.eOffset : frame.pOffset;
    const targetPos = targetBase
      ? { x: targetBase.x + (targetOffset?.x ?? 0), y: targetBase.y + (targetOffset?.y ?? 0) }
      : undefined;

    drawOrbitAtmosphericTrails(
      ctx,
      earthCenterX,
      earthCenterY,
      105,
      50,
      -0.22,
      orbitAngle,
      false,
      orbitAlpha,
      targetPos
    );
  }

  const craterProg = frame.craterProgress ?? 0;
  const craterAlpha = frame.craterAlpha ?? 0;
  if (craterAlpha > 0.01 && craterProg > 0) {
    const tg = drawCtx.targetPos;
    drawSeismicCrater(ctx, tg.x, tg.y, craterProg, craterAlpha);
  }
}

export function drawSeismicTossEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    width?: number;
    height?: number;
    [key: string]: any;
  }
) {
  const cw = drawCtx.width || 560;
  const ch = drawCtx.height || 380;

  const orbitAlpha = frame.orbitAlpha ?? 0;
  const orbitAngle = frame.orbitAngle;
  if (orbitAlpha > 0.01 && orbitAngle !== undefined) {
    const earthCenterX = frame.earthCenterX ?? (cw * 0.50);
    const earthCenterY = frame.earthCenterY ?? (ch * 0.38);
    const isP = drawCtx.isPlayer;
    const targetBase = isP ? drawCtx.em : drawCtx.pm;
    const targetOffset = isP ? frame.eOffset : frame.pOffset;
    const targetPos = targetBase
      ? { x: targetBase.x + (targetOffset?.x ?? 0), y: targetBase.y + (targetOffset?.y ?? 0) }
      : undefined;

    drawOrbitAtmosphericTrails(
      ctx,
      earthCenterX,
      earthCenterY,
      105,
      50,
      -0.22,
      orbitAngle,
      true,
      orbitAlpha,
      targetPos
    );
  }

  const slamProg = frame.slamProgress ?? 0;
  const slamAlpha = frame.slamAlpha ?? 0;
  if (slamAlpha > 0.01) {
    const tg = drawCtx.targetPos;
    drawSeismicSlamImpact(ctx, tg.x, tg.y, slamProg, slamAlpha);
  }
}

// ============================================================================
// 070: 괴력 (Strength) - 그래픽 렌더러
// ============================================================================

export function drawSpikyHitBurst(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  rot: number = 0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || radius <= 2) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const numPoints = 10;
  const outerR = radius;
  const innerR = radius * 0.48;

  ctx.fillStyle = "#EA580C";
  ctx.strokeStyle = "#C2410C";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < numPoints * 2; i++) {
    const angle = rot + (i * Math.PI) / numPoints;
    const r = i % 2 === 0 ? outerR : innerR;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const coreOuterR = radius * 0.70;
  const coreInnerR = radius * 0.32;
  ctx.fillStyle = "#FEF08A";
  ctx.beginPath();
  for (let i = 0; i < numPoints * 2; i++) {
    const angle = rot + (i * Math.PI) / numPoints;
    const r = i % 2 === 0 ? coreOuterR : coreInnerR;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.22, 0, Math.PI * 2);
  ctx.fill();

  const SPARKS = [
    { a: rot + 0.45, dist: radius * 1.25, r: 2.8 },
    { a: rot + 2.10, dist: radius * 1.30, r: 2.4 },
    { a: rot + 3.75, dist: radius * 1.22, r: 2.6 },
    { a: rot + 5.15, dist: radius * 1.35, r: 3.0 },
  ];

  for (const sp of SPARKS) {
    const sx = cx + Math.cos(sp.a) * sp.dist;
    const sy = cy + Math.sin(sp.a) * sp.dist;

    ctx.fillStyle = "#FBBF24";
    ctx.beginPath();
    ctx.arc(sx, sy, sp.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(sx, sy, sp.r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawStrengthMultiStrikes(
  ctx: any,
  tx: number,
  ty: number,
  strikeStep: number = 1,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || strikeStep <= 0) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const BURSTS = [
    { dx: 4,   dy: -34, baseR: 25, rot: 0.15 },
    { dx: -22, dy: -14, baseR: 23, rot: 0.42 },
    { dx: -32, dy: 16,  baseR: 30, rot: 0.25 },
    { dx: 20,  dy: 20,  baseR: 28, rot: -0.30 },
    { dx: -2,  dy: 2,   baseR: 34, rot: 0.18 },
  ];

  const burstStates: { a: number; s: number }[] = [
    { a: 0, s: 1 },
    { a: 0, s: 1 },
    { a: 0, s: 1 },
    { a: 0, s: 1 },
    { a: 0, s: 1 },
  ];

  let orangeRing: { rx: number; ry: number; lw: number; a: number } | null = null;

  if (strikeStep === 1) {
    burstStates[0] = { a: 1.0, s: 1.05 };
    burstStates[1] = { a: 0.95, s: 0.95 };

    ctx.strokeStyle = "rgba(234, 88, 12, 0.75)";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(tx + BURSTS[0].dx, ty + BURSTS[0].dy, BURSTS[0].baseR * 1.25, 0, Math.PI * 2);
    ctx.stroke();
  } else if (strikeStep === 2) {
    burstStates[0] = { a: 0.85, s: 1.00 };
    burstStates[1] = { a: 0.80, s: 0.90 };
    burstStates[2] = { a: 1.0, s: 1.15 };

    ctx.strokeStyle = "rgba(234, 88, 12, 0.75)";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(tx + BURSTS[2].dx, ty + BURSTS[2].dy, BURSTS[2].baseR * 1.25, 0, Math.PI * 2);
    ctx.stroke();
  } else if (strikeStep === 3) {
    burstStates[0] = { a: 0.55, s: 0.85 };
    burstStates[1] = { a: 0.50, s: 0.80 };
    burstStates[2] = { a: 0.85, s: 1.00 };
    burstStates[3] = { a: 1.0, s: 1.10 };
  } else if (strikeStep === 4) {
    burstStates[0] = { a: 0.25, s: 0.70 };
    burstStates[1] = { a: 0.20, s: 0.65 };
    burstStates[2] = { a: 0.60, s: 0.88 };
    burstStates[3] = { a: 0.85, s: 0.98 };
    burstStates[4] = { a: 1.0, s: 1.25 };

    orangeRing = { rx: 46, ry: 36, lw: 3.5, a: 0.95 };

    const FINISHER_SPARKS = [
      { x: tx - 44, y: ty - 28, r: 2.8 },
      { x: tx + 42, y: ty - 18, r: 2.8 },
      { x: tx - 46, y: ty + 32, r: 3.2 },
      { x: tx + 38, y: ty + 38, r: 3.0 },
      { x: tx + 5,  y: ty - 52, r: 2.5 },
    ];
    for (const esp of FINISHER_SPARKS) {
      ctx.fillStyle = "#FBBF24";
      ctx.beginPath();
      ctx.arc(esp.x, esp.y, esp.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(esp.x, esp.y, esp.r * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (strikeStep === 5) {
    burstStates[0] = { a: 0.0, s: 0 };
    burstStates[1] = { a: 0.0, s: 0 };
    burstStates[2] = { a: 0.30, s: 0.75 };
    burstStates[3] = { a: 0.55, s: 0.85 };
    burstStates[4] = { a: 0.85, s: 1.10 };

    orangeRing = { rx: 70, ry: 55, lw: 2.6, a: 0.70 };
  } else if (strikeStep === 6) {
    burstStates[0] = { a: 0.0, s: 0 };
    burstStates[1] = { a: 0.0, s: 0 };
    burstStates[2] = { a: 0.0, s: 0 };
    burstStates[3] = { a: 0.25, s: 0.70 };
    burstStates[4] = { a: 0.50, s: 0.90 };

    orangeRing = { rx: 94, ry: 74, lw: 1.8, a: 0.35 };
  } else if (strikeStep === 7) {
    burstStates[0] = { a: 0.0, s: 0 };
    burstStates[1] = { a: 0.0, s: 0 };
    burstStates[2] = { a: 0.0, s: 0 };
    burstStates[3] = { a: 0.0, s: 0 };
    burstStates[4] = { a: 0.22, s: 0.70 };
  }

  if (orangeRing && orangeRing.a > 0.01) {
    ctx.strokeStyle = `rgba(234, 88, 12, ${orangeRing.a * alpha})`;
    ctx.lineWidth = orangeRing.lw;
    ctx.beginPath();
    ctx.ellipse(tx, ty + 2, orangeRing.rx, orangeRing.ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(251, 191, 36, ${orangeRing.a * 0.75 * alpha})`;
    ctx.lineWidth = Math.max(1.0, orangeRing.lw * 0.65);
    ctx.beginPath();
    ctx.ellipse(tx, ty + 2, orangeRing.rx * 0.85, orangeRing.ry * 0.85, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (let i = 0; i < BURSTS.length; i++) {
    const st = burstStates[i];
    if (st.a > 0.01) {
      const b = BURSTS[i];
      drawSpikyHitBurst(ctx, tx + b.dx, ty + b.dy, b.baseR * st.s, b.rot, st.a * alpha);
    }
  }

  ctx.restore();
}

export function drawStrengthPowerAura(
  ctx: any,
  x: number,
  y: number,
  progress: number = 1.0,
  alpha: number = 1.0
) {}

export function drawStrengthBehindEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    width?: number;
    height?: number;
    [key: string]: any;
  }
) {}

export function drawStrengthEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    width?: number;
    height?: number;
    [key: string]: any;
  }
) {
  const auraAlpha = frame.auraAlpha ?? 0;
  if (auraAlpha > 0.01) {
    const casterPos = drawCtx.casterPos ?? drawCtx.attackerPos;
    const auraProg = frame.auraProgress ?? 1.0;
    drawStrengthPowerAura(ctx, casterPos.x, casterPos.y, auraProg, auraAlpha);
  }

  const strikeAlpha = frame.strikeAlpha ?? 0;
  const strikeStep = frame.strikeStep ?? 0;
  if (strikeAlpha > 0.01 && strikeStep > 0) {
    const tg = drawCtx.targetPos;
    drawStrengthMultiStrikes(ctx, tg.x, tg.y, strikeStep, strikeAlpha);
  }
}

// ============================================================================
// 071: 흡수 (Absorb) - 그래픽 렌더러
// ============================================================================

export function drawAbsorbMote(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || radius <= 0.5) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  ctx.fillStyle = "rgba(254, 240, 138, 0.18)";
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(253, 224, 71, 0.38)";
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 1.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#FEF9C3";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.45, 0, Math.PI * 2);
  ctx.fill();

  if (radius >= 3.6) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 1.0;
    const spL = radius * 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - spL, cy);
    ctx.lineTo(cx + spL, cy);
    ctx.moveTo(cx, cy - spL);
    ctx.lineTo(cx, cy + spL);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawAbsorbDrainStream(
  ctx: any,
  startPos: { x: number; y: number },
  endPos: { x: number; y: number },
  progress: number = 0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || progress <= 0) return;

  const dx = endPos.x - startPos.x;
  const dy = endPos.y - startPos.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return;

  const nx = -dy / dist;
  const ny = dx / dist;

  const MOTES = [
    { curveOffset:  48, delay: 0.00, dur: 0.65, r: 4.4, ox:   0, oy:   0 },
    { curveOffset: -42, delay: 0.08, dur: 0.64, r: 4.0, ox: -10, oy:   6 },
    { curveOffset:  28, delay: 0.16, dur: 0.62, r: 3.6, ox:   8, oy:  -8 },
    { curveOffset: -30, delay: 0.24, dur: 0.60, r: 3.8, ox:  -6, oy: -10 },
    { curveOffset:  58, delay: 0.30, dur: 0.62, r: 4.2, ox:  12, oy:   8 },
  ];

  ctx.save();

  for (const m of MOTES) {
    const p = (progress - m.delay) / m.dur;

    if (p < 0) {
      const gatherProg = Math.max(0, Math.min(1, progress / Math.max(0.01, m.delay)));
      if (gatherProg > 0.15) {
        drawAbsorbMote(
          ctx,
          startPos.x + m.ox,
          startPos.y + m.oy,
          m.r * 0.55 * gatherProg,
          alpha * gatherProg * 0.75
        );
      }
      continue;
    }

    if (p > 1.0) continue;

    const t = Math.max(0, Math.min(1.0, p));
    const tEased = t * t * (3 - 2 * t);

    for (let g = 2; g >= 1; g--) {
      const gt = Math.max(0, t - g * 0.045);
      const gtEased = gt * gt * (3 - 2 * gt);
      const gCurve = Math.sin(gt * Math.PI);

      const gx = startPos.x + m.ox * (1 - gt) + dx * gtEased + nx * (m.curveOffset * gCurve);
      const gy = startPos.y + m.oy * (1 - gt) + dy * gtEased + ny * (m.curveOffset * gCurve);

      let gAlpha = alpha * (1 - g * 0.35) * 0.65;
      if (gt < 0.12) gAlpha *= (gt / 0.12);
      else if (gt > 0.88) gAlpha *= ((1 - gt) / 0.12);

      drawAbsorbMote(ctx, gx, gy, m.r * (1 - g * 0.28), gAlpha);
    }

    const curve = Math.sin(t * Math.PI);
    const curX = startPos.x + m.ox * (1 - t) + dx * tEased + nx * (m.curveOffset * curve);
    const curY = startPos.y + m.oy * (1 - t) + dy * tEased + ny * (m.curveOffset * curve);

    let moteAlpha = alpha;
    if (t < 0.12) moteAlpha *= (t / 0.12);
    else if (t > 0.88) moteAlpha *= ((1 - t) / 0.12);

    drawAbsorbMote(ctx, curX, curY, m.r, moteAlpha);
  }

  ctx.restore();
}

export function drawAbsorbHealAura(
  ctx: any,
  cx: number,
  cy: number,
  progress: number = 1.0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const p = Math.max(0, Math.min(1.5, progress));

  const pulseR = 18 + p * 24;
  ctx.strokeStyle = `rgba(253, 224, 71, ${Math.max(0, (1 - p * 0.65) * 0.75)})`;
  ctx.lineWidth = Math.max(1.2, 2.8 * (1 - p * 0.5));
  ctx.beginPath();
  ctx.ellipse(cx, cy + 6, pulseR * 1.2, pulseR * 0.6, 0, 0, Math.PI * 2);
  ctx.stroke();

  const SPARKLES = [
    { ox: -18, oy:   6, vy: -34, size: 7.0, color: "#FEF08A" },
    { ox:  16, oy:   2, vy: -40, size: 8.0, color: "#FDE047" },
    { ox:  -4, oy: -10, vy: -48, size: 9.0, color: "#FFFFFF" },
    { ox:  22, oy:  12, vy: -30, size: 6.5, color: "#FEF9C3" },
    { ox: -22, oy:  14, vy: -32, size: 6.5, color: "#FEF08A" },
  ];

  for (const sp of SPARKLES) {
    const sx = cx + sp.ox;
    const sy = cy + sp.oy + sp.vy * p;
    const sSize = Math.max(1.5, sp.size * (1 - p * 0.35));
    const sAlpha = Math.max(0, (1.0 - p * 0.65));

    if (sAlpha > 0.01) {
      drawMiniRetroStar(ctx, sx, sy, sSize, sp.color);
    }
  }

  ctx.restore();
}

export function drawAbsorbBehindEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    width?: number;
    height?: number;
    [key: string]: any;
  }
) {
  const dimAlpha = frame.dimAlpha ?? 0;
  if (dimAlpha > 0.005) {
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${dimAlpha})`;
    ctx.fillRect(-20000, -20000, 40000, 40000);
    ctx.restore();
  }

  const drainProg = frame.drainProgress ?? 0;
  const drainAlpha = frame.drainAlpha ?? 1.0;
  if (drainProg > 0 && drainAlpha > 0.01) {
    const startPos = drawCtx.targetPos;
    const endPos = drawCtx.casterPos ?? drawCtx.attackerPos;
    drawAbsorbDrainStream(ctx, startPos, endPos, drainProg, drainAlpha);
  }
}

export function drawAbsorbEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    width?: number;
    height?: number;
    [key: string]: any;
  }
) {
  const healAlpha = frame.healAlpha ?? 0;
  if (healAlpha > 0.01) {
    const casterPos = drawCtx.casterPos ?? drawCtx.attackerPos;
    const healProg = frame.healProgress ?? 1.0;
    drawAbsorbHealAura(ctx, casterPos.x, casterPos.y, healProg, healAlpha);
  }
}

// ============================================================================
// 072: 메가드레인 (Mega Drain) - 그래픽 렌더러
// ============================================================================

export function drawMegaDrainMote(
  ctx: any,
  cx: number,
  cy: number,
  radius: number,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || radius <= 0.5) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  ctx.fillStyle = "rgba(74, 222, 128, 0.22)";
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 2.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(134, 239, 172, 0.45)";
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#DCFCE7";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.48, 0, Math.PI * 2);
  ctx.fill();

  if (radius >= 3.4) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
    ctx.lineWidth = 1.2;
    const spL = radius * 1.6;
    ctx.beginPath();
    ctx.moveTo(cx - spL, cy);
    ctx.lineTo(cx + spL, cy);
    ctx.moveTo(cx, cy - spL);
    ctx.lineTo(cx, cy + spL);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawMegaDrainStream(
  ctx: any,
  startPos: { x: number; y: number },
  endPos: { x: number; y: number },
  progress: number = 0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || progress <= 0) return;

  const dx = endPos.x - startPos.x;
  const dy = endPos.y - startPos.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return;

  const nx = -dy / dist;
  const ny = dx / dist;

  const MOTES = [
    { curveOffset:  56, delay: 0.00, dur: 0.62, r: 5.2, ox:   0, oy:   0 },
    { curveOffset: -52, delay: 0.06, dur: 0.62, r: 4.8, ox: -12, oy:   8 },
    { curveOffset:  36, delay: 0.12, dur: 0.60, r: 4.4, ox:  10, oy: -10 },
    { curveOffset: -38, delay: 0.18, dur: 0.58, r: 4.6, ox:  -8, oy: -12 },
    { curveOffset:  68, delay: 0.22, dur: 0.60, r: 5.4, ox:  14, oy:  10 },
    { curveOffset: -62, delay: 0.26, dur: 0.58, r: 4.8, ox: -14, oy:   4 },
    { curveOffset:  44, delay: 0.30, dur: 0.56, r: 4.2, ox:   6, oy:  -6 },
    { curveOffset: -40, delay: 0.34, dur: 0.55, r: 4.5, ox:  -4, oy:  12 },
  ];

  ctx.save();

  for (const m of MOTES) {
    const p = (progress - m.delay) / m.dur;

    if (p < 0) {
      const gatherProg = Math.max(0, Math.min(1, progress / Math.max(0.01, m.delay)));
      if (gatherProg > 0.12) {
        drawMegaDrainMote(
          ctx,
          startPos.x + m.ox,
          startPos.y + m.oy,
          m.r * 0.6 * gatherProg,
          alpha * gatherProg * 0.8
        );
      }
      continue;
    }

    if (p > 1.0) continue;

    const t = Math.max(0, Math.min(1.0, p));
    const tEased = t * t * (3 - 2 * t);

    for (let g = 3; g >= 1; g--) {
      const gt = Math.max(0, t - g * 0.04);
      const gtEased = gt * gt * (3 - 2 * gt);
      const gCurve = Math.sin(gt * Math.PI);

      const gx = startPos.x + m.ox * (1 - gt) + dx * gtEased + nx * (m.curveOffset * gCurve);
      const gy = startPos.y + m.oy * (1 - gt) + dy * gtEased + ny * (m.curveOffset * gCurve);

      let gAlpha = alpha * (1 - g * 0.28) * 0.65;
      if (gt < 0.10) gAlpha *= (gt / 0.10);
      else if (gt > 0.90) gAlpha *= ((1 - gt) / 0.10);

      drawMegaDrainMote(ctx, gx, gy, m.r * (1 - g * 0.22), gAlpha);
    }

    const curve = Math.sin(t * Math.PI);
    const curX = startPos.x + m.ox * (1 - t) + dx * tEased + nx * (m.curveOffset * curve);
    const curY = startPos.y + m.oy * (1 - t) + dy * tEased + ny * (m.curveOffset * curve);

    let moteAlpha = alpha;
    if (t < 0.10) moteAlpha *= (t / 0.10);
    else if (t > 0.90) moteAlpha *= ((1 - t) / 0.10);

    drawMegaDrainMote(ctx, curX, curY, m.r, moteAlpha);
  }

  ctx.restore();
}

export function drawMegaDrainHealAura(
  ctx: any,
  cx: number,
  cy: number,
  progress: number = 1.0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const p = Math.max(0, Math.min(1.5, progress));

  const pulseR1 = 20 + p * 34;
  ctx.strokeStyle = `rgba(74, 222, 128, ${Math.max(0, (1 - p * 0.65) * 0.85)})`;
  ctx.lineWidth = Math.max(1.4, 3.2 * (1 - p * 0.5));
  ctx.beginPath();
  ctx.ellipse(cx, cy + 6, pulseR1 * 1.25, pulseR1 * 0.62, 0, 0, Math.PI * 2);
  ctx.stroke();

  const pulseR2 = pulseR1 * 0.68;
  ctx.strokeStyle = `rgba(187, 247, 208, ${Math.max(0, (1 - p * 0.60) * 0.90)})`;
  ctx.lineWidth = Math.max(1.0, 2.2 * (1 - p * 0.5));
  ctx.beginPath();
  ctx.ellipse(cx, cy + 6, pulseR2 * 1.25, pulseR2 * 0.62, 0, 0, Math.PI * 2);
  ctx.stroke();

  const SPARKLES = [
    { ox: -24, oy:   8, vy: -44, size: 8.5, color: "#86EFAC" },
    { ox:  22, oy:   4, vy: -52, size: 9.5, color: "#4ADE80" },
    { ox:  -6, oy: -12, vy: -60, size: 11.0, color: "#FFFFFF" },
    { ox:  28, oy:  14, vy: -38, size: 7.5, color: "#DCFCE7" },
    { ox: -28, oy:  16, vy: -42, size: 8.0, color: "#86EFAC" },
    { ox:  10, oy: -20, vy: -55, size: 9.0, color: "#BBF7D0" },
    { ox: -12, oy:   0, vy: -48, size: 8.5, color: "#FFFFFF" },
  ];

  for (const sp of SPARKLES) {
    const sx = cx + sp.ox;
    const sy = cy + sp.oy + sp.vy * p;
    const sSize = Math.max(1.8, sp.size * (1 - p * 0.32));
    const sAlpha = Math.max(0, (1.0 - p * 0.60));

    if (sAlpha > 0.01) {
      drawMiniRetroStar(ctx, sx, sy, sSize, sp.color);
    }
  }

  ctx.restore();
}

export function drawMegaDrainBehindEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    width?: number;
    height?: number;
    [key: string]: any;
  }
) {
  const dimAlpha = frame.dimAlpha ?? 0;
  if (dimAlpha > 0.005) {
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${dimAlpha})`;
    ctx.fillRect(-20000, -20000, 40000, 40000);
    ctx.restore();
  }

  const drainProg = frame.drainProgress ?? 0;
  const drainAlpha = frame.drainAlpha ?? 1.0;
  if (drainProg > 0 && drainAlpha > 0.01) {
    const startPos = drawCtx.targetPos;
    const endPos = drawCtx.casterPos ?? drawCtx.attackerPos;
    drawMegaDrainStream(ctx, startPos, endPos, drainProg, drainAlpha);
  }
}

export function drawMegaDrainEffect(
  ctx: any,
  frame: any,
  drawCtx: {
    targetPos: { x: number; y: number };
    attackerPos: { x: number; y: number };
    isPlayer: boolean;
    isHit: boolean;
    width?: number;
    height?: number;
    [key: string]: any;
  }
) {
  const healAlpha = frame.healAlpha ?? 0;
  if (healAlpha > 0.01) {
    const casterPos = drawCtx.casterPos ?? drawCtx.attackerPos;
    const healProg = frame.healProgress ?? 1.0;
    drawMegaDrainHealAura(ctx, casterPos.x, casterPos.y, healProg, healAlpha);
  }
}