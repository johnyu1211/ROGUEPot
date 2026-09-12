// ============================================================================
// ⚠️ [기술 이펙트 제작 지침 - 256색 팔레트 최적화(Octree Optimizer) 기준]
// 1. 배틀 GIF 렌더러는 Octree Quantizer + useOptimizer (threshold: 30) 기반의
//    256색 팔레트 재사용 표준을 채택하고 있음.
// 2. 기술 제작 시 불필요한 과도한 그라디언트 난사를 지양하고, 256색 팔레트 환경에서
//    선명하게 돋보이는 핵심 고채도 단색/네온 색상 체계 및 30 FPS 규격을 기준으로 제작할 것.
// 3. 프레임별 이미지 추출 및 시각적 검증은 유저가 웹 뷰어(http://localhost:3456)에서
//    직접 확인하므로, 작업 시 에이전트가 매번 프레임을 일일이 추출/조회하지 말 것!
// ============================================================================

import { drawMiniRetroStar } from "../common/helpers.js";

/**
 * Gen 1 Moves 073 - 076 Renderers
 * 
 * 073: 씨뿌리기 (Leech Seed)
 * 074: 성장 (Growth)
 * 075: 잎날가르기 (Razor Leaf)
 * 076: 솔라빔 (Solar Beam)
 */

// ============================================================================
// 073: 씨뿌리기 (Leech Seed) - 그래픽 렌더러
// ============================================================================

function drawSproutLeaf(ctx: any, x: number, y: number, size: number, angle: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.fillStyle = "#22c55e";
  ctx.strokeStyle = "#14532d";
  ctx.lineWidth = 1.0;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(size * 0.6, -size * 0.45, size, 0);
  ctx.quadraticCurveTo(size * 0.6, size * 0.45, 0, 0);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "#86efac";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size * 0.8, 0);
  ctx.stroke();

  ctx.restore();
}

export function drawLeechSeedBean(
  ctx: any,
  cx: number,
  cy: number,
  scale: number = 1.0,
  rot: number = 0,
  alpha: number = 1.0,
  sproutProg: number = 0
) {
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.scale(scale, scale);

  ctx.fillStyle = "#92400e";
  ctx.strokeStyle = "#451a03";
  ctx.lineWidth = 1.4;

  ctx.beginPath();
  ctx.ellipse(0, 0, 4.2, 2.8, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#fef3c7";
  ctx.beginPath();
  ctx.ellipse(0.8, -0.3, 1.6, 0.7, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(134, 239, 172, 0.75)";
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.arc(-1.4, 0.4, 1.0, 0, Math.PI * 2);
  ctx.stroke();

  if (sproutProg > 0.05) {
    const sP = Math.min(1.0, sproutProg);
    const leafSize = 7.5 * sP;
    drawSproutLeaf(ctx, 0.8, -0.8, leafSize, -Math.PI * 0.45);
    drawSproutLeaf(ctx, 0.8, -0.8, leafSize * 0.85, -Math.PI * 0.15);

    if (sP > 0.7) {
      drawMiniRetroStar(ctx, 0.8, -4.5, 4.5 * sP, "#86efac");
    }
  }

  ctx.restore();
}

export function drawLeechSeedFlight(
  ctx: any,
  startPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  progress: number = 0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || progress <= 0) return;

  const dx = targetPos.x - startPos.x;
  const dy = targetPos.y - startPos.y;

  const SEEDS = [
    { delay: 0.00, dur: 0.65, arcH: -48, rotSpd: 6.2, scale: 0.65, txOff: -14, tyOff:  14 },
    { delay: 0.14, dur: 0.62, arcH: -65, rotSpd: 7.5, scale: 0.55, txOff:  14, tyOff:  -8 },
    { delay: 0.28, dur: 0.60, arcH: -40, rotSpd: 8.8, scale: 0.60, txOff:  -4, tyOff: -16 },
  ];

  for (let i = 0; i < SEEDS.length; i++) {
    const s = SEEDS[i];
    const p = (progress - s.delay) / s.dur;
    if (p < 0 || p > 1.08) continue;

    const t = Math.max(0, Math.min(1.0, p));
    const tEased = t * t * (3 - 2 * t);

    const arc = Math.sin(t * Math.PI) * s.arcH;
    const curX = startPos.x + dx * tEased + s.txOff * t;
    const curY = startPos.y + dy * tEased + arc + s.tyOff * t;
    const rot = t * Math.PI * s.rotSpd;

    if (t > 0.08 && t < 0.95) {
      ctx.fillStyle = "rgba(74, 222, 128, 0.65)";
      ctx.beginPath();
      ctx.arc(curX - (dx / 30), curY - (dy / 30) - 2, 2.0, 0, Math.PI * 2);
      ctx.fill();
    }

    drawLeechSeedBean(ctx, curX, curY, s.scale, rot, alpha, 0);
  }
}

/**
 * 깔끔한 단일 3차원 입체 나선 덩굴 (Single Clean 3D Helical Vine)
 */
export function draw3DHelixVines(
  ctx: any,
  tx: number,
  ty: number,
  progress: number = 0,
  isFrontLayer: boolean,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || progress <= 0) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  const rx = 30;
  const ry = 12;
  const botY = ty + 22;
  const topY = ty - 26;
  const totalTurns = 2.1;
  const startAngle = Math.PI * 0.2;

  const coilProg = Math.max(0, Math.min(1.0, progress));
  if (coilProg <= 0.02) {
    ctx.restore();
    return;
  }

  const STEPS = 48;
  const activeSteps = Math.ceil(STEPS * coilProg);

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let i = 0; i < activeSteps; i++) {
    const t1 = i / STEPS;
    const t2 = (i + 1) / STEPS;

    const ang1 = startAngle + t1 * totalTurns * Math.PI * 2;
    const ang2 = startAngle + t2 * totalTurns * Math.PI * 2;

    const midAng = (ang1 + ang2) / 2;
    const isSegmentFront = Math.sin(midAng) >= -0.05;
    if (isSegmentFront !== isFrontLayer) continue;

    const x1 = tx + Math.cos(ang1) * rx;
    const y1 = botY + (topY - botY) * t1 + Math.sin(ang1) * ry;

    const x2 = tx + Math.cos(ang2) * rx;
    const y2 = botY + (topY - botY) * t2 + Math.sin(ang2) * ry;

    const depthFactor = isFrontLayer ? (1.0 + Math.sin(midAng) * 0.28) : 0.82;

    ctx.strokeStyle = isFrontLayer ? "#14532d" : "#052e16";
    ctx.lineWidth = 4.0 * depthFactor;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.strokeStyle = isFrontLayer ? "#4ade80" : "#16a34a";
    ctx.lineWidth = 2.2 * depthFactor;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    if (isFrontLayer && i === Math.floor(STEPS * 0.45)) {
      drawSproutLeaf(ctx, x2, y2, 5.5, midAng + 0.5);
    }
  }

  if (coilProg > 0.65) {
    const tipT = coilProg;
    const tipAng = startAngle + tipT * totalTurns * Math.PI * 2;
    const isTipFront = Math.sin(tipAng) >= -0.05;

    if (isTipFront === isFrontLayer) {
      const tipX = tx + Math.cos(tipAng) * rx;
      const tipY = botY + (topY - botY) * tipT + Math.sin(tipAng) * ry;
      const leafP = (coilProg - 0.65) / 0.35;
      const leafSize = 9.0 * leafP;

      drawSproutLeaf(ctx, tipX, tipY, leafSize, -0.6);
      drawSproutLeaf(ctx, tipX, tipY, leafSize * 0.85, 0.1);

      if (leafP > 0.65) {
        drawMiniRetroStar(ctx, tipX + 3, tipY - 5, 5.5 * leafP, "#86efac");
      }
    }
  }

  ctx.restore();
}

export function drawLeechSeedBehindEffect(
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

  const vineProg = frame.vineProgress ?? 0;
  const vineAlpha = frame.vineAlpha ?? 1.0;
  if (vineProg > 0 && vineAlpha > 0.01) {
    const targetPos = drawCtx.targetPos;
    draw3DHelixVines(ctx, targetPos.x, targetPos.y, vineProg, false, vineAlpha);
  }
}

export function drawLeechSeedEffect(
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
  const casterPos = drawCtx.casterPos ?? drawCtx.attackerPos;
  const targetPos = drawCtx.targetPos;

  const seedFlightProg = frame.seedFlightProgress ?? 0;
  const seedAlpha = frame.seedAlpha ?? 1.0;
  if (seedFlightProg > 0 && seedAlpha > 0.01) {
    drawLeechSeedFlight(ctx, casterPos, targetPos, seedFlightProg, seedAlpha);
  }

  const vineProg = frame.vineProgress ?? 0;
  const vineAlpha = frame.vineAlpha ?? 1.0;
  if (vineProg > 0 && vineAlpha > 0.01) {
    draw3DHelixVines(ctx, targetPos.x, targetPos.y, vineProg, true, vineAlpha);

    const SEED_LOCS = [
      { x: targetPos.x - 14, y: targetPos.y + 14, rot: 0.4 },
      { x: targetPos.x + 14, y: targetPos.y - 8,  rot: -0.5 },
      { x: targetPos.x - 4,  y: targetPos.y - 16, rot: 0.8 },
    ];

    const sproutProg = Math.max(0, (vineProg - 0.25) / 0.75);
    for (const sl of SEED_LOCS) {
      drawLeechSeedBean(ctx, sl.x, sl.y, 0.58, sl.rot, vineAlpha * Math.min(1.0, (1.2 - vineProg * 0.4)), sproutProg);
    }

    if (vineProg > 0.75) {
      const auraP = (vineProg - 0.75) / 0.25;
      ctx.save();
      ctx.strokeStyle = `rgba(74, 222, 128, ${(1 - auraP) * 0.85 * vineAlpha})`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(targetPos.x, targetPos.y, 32 + auraP * 14, 24 + auraP * 10, 0, 0, Math.PI * 2);
      ctx.stroke();

      drawMiniRetroStar(ctx, targetPos.x - 18, targetPos.y - 22, 8.0 * (1 - auraP), "#ffffff");
      drawMiniRetroStar(ctx, targetPos.x + 20, targetPos.y + 12, 7.0 * (1 - auraP), "#86efac");
      ctx.restore();
    }
  }
}

// ============================================================================
// 074: 성장 (Growth) - 그래픽 렌더러
// ============================================================================

function drawGrowthLeafParticle(
  ctx: any,
  x: number,
  y: number,
  size: number,
  angle: number,
  alpha: number
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, Math.max(0, alpha));
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.fillStyle = "#22c55e";
  ctx.strokeStyle = "#14532d";
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(size * 0.6, -size * 0.45, size, 0);
  ctx.quadraticCurveTo(size * 0.6, size * 0.45, 0, 0);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "#bbf7d0";
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size * 0.8, 0);
  ctx.stroke();

  ctx.restore();
}

export function drawGrowthEffect(
  ctx: any,
  casterPos: { x: number; y: number },
  progress: number = 0
) {
  if (progress <= 0) return;

  const p = Math.max(0, Math.min(1.0, progress));

  const riseH = 34 * p;
  const baseY = casterPos.y + 18;
  ctx.save();
  ctx.globalAlpha = 0.55 * (1 - p * 0.25);
  for (let i = 0; i < 4; i++) {
    const segW = 26 - i * 5;
    ctx.fillStyle = i < 2 ? "#16a34a" : "#4ade80";
    const segY = baseY - (riseH * (i / 4));
    ctx.beginPath();
    ctx.ellipse(casterPos.x, segY, segW * 0.5, 5 - i, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const LEAF_COUNT = 6;
  for (let i = 0; i < LEAF_COUNT; i++) {
    const phase = (i / LEAF_COUNT) * Math.PI * 2;
    const spin = p * Math.PI * 3.2 + phase;
    const radius = 16 + Math.sin(p * Math.PI) * 10;
    const ly = baseY - 8 - riseH * (0.4 + 0.6 * ((i % 3) / 2)) - Math.sin(spin) * 6;
    const lx = casterPos.x + Math.cos(spin) * radius;
    const leafAlpha = Math.min(1, p * 3) * (p > 0.85 ? (1 - p) / 0.15 : 1);
    drawGrowthLeafParticle(ctx, lx, ly, 6.5, spin * 0.8, leafAlpha);
  }

  if (p > 0.4) {
    const auraP = (p - 0.4) / 0.6;
    ctx.save();
    ctx.globalAlpha = (1 - auraP) * 0.8;
    ctx.strokeStyle = "#86efac";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(
      casterPos.x,
      casterPos.y - 6,
      22 + auraP * 16,
      16 + auraP * 12,
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    drawMiniRetroStar(ctx, casterPos.x - 14, casterPos.y - 24, 9.0 * (1 - auraP), "#ffffff");
    drawMiniRetroStar(ctx, casterPos.x + 16, casterPos.y - 8, 7.5 * (1 - auraP), "#bbf7d0");
    drawMiniRetroStar(ctx, casterPos.x + 4, casterPos.y - 30, 6.0 * (1 - auraP), "#4ade80");
    ctx.restore();
  }

  if (p < 0.6) {
    const sproutP = Math.min(1, p / 0.6);
    const sSize = 7.5 * sproutP;
    drawGrowthLeafParticle(ctx, casterPos.x - 12, baseY - 2, sSize, -Math.PI * 0.5, 0.9);
    drawGrowthLeafParticle(ctx, casterPos.x + 12, baseY - 2, sSize * 0.85, -Math.PI * 0.3, 0.9);
  }
}

// ============================================================================
// 075: 잎날가르기 (Razor Leaf) - 3세대(GBA 레트로) 스타일 그래픽 렌더러
// ============================================================================

function drawRetroSharpLeaf(
  ctx: any,
  cx: number,
  cy: number,
  rotAngle: number,
  flipFactor: number = 1.0,
  scale: number = 1.0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.translate(cx, cy);
  ctx.rotate(rotAngle);
  ctx.scale(scale * Math.sign(flipFactor || 1), scale);
  const wScale = Math.max(0.2, Math.abs(flipFactor));

  ctx.strokeStyle = "#14532d";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, 11);
  ctx.quadraticCurveTo(-1.5 * wScale, 15, -2 * wScale, 17);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.bezierCurveTo(11 * wScale, -7, 12 * wScale, 6, 0, 12);
  ctx.bezierCurveTo(-12 * wScale, 6, -11 * wScale, -7, 0, -14);
  ctx.closePath();

  ctx.fillStyle = "#4ade80";
  ctx.fill();
  ctx.strokeStyle = "#14532d";
  ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.fillStyle = "#15803d";
  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.bezierCurveTo(9 * wScale, -6, 10 * wScale, 5, 0, 11);
  ctx.lineTo(0, -13);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#fef08a";
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(0, 10);
  ctx.stroke();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-1 * wScale, -13);
  ctx.lineTo(1.5 * wScale, -9);
  ctx.stroke();

  ctx.restore();
}

function drawBladeTaperedTrail(
  ctx: any,
  headX: number,
  headY: number,
  dirAngle: number,
  trailLength: number,
  bladeWidth: number = 14,
  alpha: number = 1.0
) {
  if (alpha <= 0.01 || trailLength <= 2) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.translate(headX, headY);
  ctx.rotate(dirAngle);

  const grad = ctx.createLinearGradient(-trailLength, 0, 0, 0);
  grad.addColorStop(0, "rgba(74, 222, 128, 0)");
  grad.addColorStop(0.4, "rgba(74, 222, 128, 0.25)");
  grad.addColorStop(0.85, "rgba(187, 247, 208, 0.65)");
  grad.addColorStop(1, "rgba(255, 255, 255, 0.85)");

  ctx.fillStyle = grad;

  ctx.beginPath();
  ctx.moveTo(0, -bladeWidth * 0.5);
  ctx.lineTo(0, bladeWidth * 0.5);
  ctx.quadraticCurveTo(-trailLength * 0.4, bladeWidth * 0.3, -trailLength, 0);
  ctx.quadraticCurveTo(-trailLength * 0.4, -bladeWidth * 0.3, 0, -bladeWidth * 0.5);
  ctx.closePath();
  ctx.fill();

  const coreGrad = ctx.createLinearGradient(-trailLength * 0.85, 0, 0, 0);
  coreGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
  coreGrad.addColorStop(1, "rgba(255, 255, 255, 0.7)");
  ctx.strokeStyle = coreGrad;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-trailLength * 0.85, 0);
  ctx.lineTo(0, 0);
  ctx.stroke();

  ctx.restore();
}

function drawSpinningSickleLeaf(
  ctx: any,
  cx: number,
  cy: number,
  spinAngle: number,
  flipFactor: number = 1.0,
  scale: number = 1.0,
  alpha: number = 1.0
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
  ctx.translate(cx, cy);

  ctx.rotate(spinAngle);

  const tilt = 0.35 + 0.65 * Math.abs(flipFactor);
  ctx.scale(scale, scale * tilt * Math.sign(flipFactor || 1));

  ctx.beginPath();
  ctx.moveTo(-2, -15);
  ctx.bezierCurveTo(-15, -12, -18, 10, 0, 15);
  ctx.bezierCurveTo(7, 15, 12, 8, 12, 0);
  ctx.bezierCurveTo(6, 4, 1, 6, -3, 3);
  ctx.bezierCurveTo(-8, 0, -8, -9, -2, -15);
  ctx.closePath();

  ctx.fillStyle = "#4ade80";
  ctx.fill();
  ctx.strokeStyle = "#14532d";
  ctx.lineWidth = 1.3;
  ctx.lineJoin = "miter";
  ctx.miterLimit = 4;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-2, -13);
  ctx.bezierCurveTo(-11, -9, -13, 8, 0, 12);
  ctx.bezierCurveTo(5, 12, 8, 6, 9, 0);
  ctx.bezierCurveTo(5, 3, 1, 5, -2, 2);
  ctx.bezierCurveTo(-6, 0, -6, -7, -2, -13);
  ctx.closePath();
  ctx.fillStyle = "#15803d";
  ctx.fill();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-2, -14);
  ctx.bezierCurveTo(-14, -11, -16, 9, 0, 14);
  ctx.bezierCurveTo(6, 14, 11, 7, 11, 0);
  ctx.stroke();

  ctx.restore();
}

/**
 * 075: 잎날가르기 (Razor Leaf) 메인 이펙트 렌더러
 */
export function drawRazorLeafEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number = 0,
  isPlayerAttacking: boolean = true
) {
  const dx = targetPos.x - attackerPos.x;
  const dy = targetPos.y - attackerPos.y;
  const aimAngle = Math.atan2(dy, dx);
  const dirX = dx >= 0 ? 1 : -1;

  const midX = attackerPos.x + dx * (1 / 3);
  const midY = attackerPos.y + dy * (1 / 3) - 12;

  const LEAF_SLOTS = [
    { offX:  -6, offY: -32, ang: -0.3, riseDelay: 0.00, arcH: -38 },
    { offX:  30, offY:  14, ang:  0.4, riseDelay: 0.08, arcH: -28 },
    { offX: -32, offY:  18, ang: -0.6, riseDelay: 0.16, arcH: -34 },
    { offX:  26, offY: -22, ang:  0.5, riseDelay: 0.12, arcH: -42 },
    { offX: -28, offY: -12, ang: -0.2, riseDelay: 0.20, arcH: -30 },
    { offX:   2, offY:  28, ang:  0.1, riseDelay: 0.24, arcH: -24 },
  ];

  if (moveStep === 1) {
    const p = Math.max(0, Math.min(1.0, effectProgress || 0.2));
    ctx.save();
    ctx.strokeStyle = "rgba(74, 222, 128, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(attackerPos.x + 16 * dirX, attackerPos.y - 6, 12 * p, 5 * p, aimAngle, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (moveStep >= 2 && moveStep <= 4) {
    let globalP = 0;
    if (moveStep === 2) globalP = effectProgress * 0.35;
    else if (moveStep === 3) globalP = 0.35 + (effectProgress - 0.35) * 0.5;
    else globalP = 0.85 + (effectProgress - 0.85) * 0.15;

    for (let i = 0; i < LEAF_SLOTS.length; i++) {
      const slot = LEAF_SLOTS[i];
      const leafP = (globalP - slot.riseDelay) / (1.0 - slot.riseDelay);
      if (leafP <= 0) continue;

      const t = Math.min(1.0, leafP);
      const easeRise = 1 - Math.pow(1 - t, 2.0);

      const startX = attackerPos.x + 12 * dirX;
      const startY = attackerPos.y + 14;

      const targetSlotX = midX + slot.offX;
      const targetSlotY = midY + slot.offY;

      const curX = startX + (targetSlotX - startX) * easeRise;
      const curY = startY + (targetSlotY - startY) * easeRise + Math.sin(t * Math.PI) * (slot.arcH * 0.4);

      const wobble = slot.ang + Math.sin(t * Math.PI * 3) * 0.4;
      const alpha = Math.min(1.0, t * 1.8);

      drawRetroSharpLeaf(ctx, curX, curY, wobble, Math.cos(wobble), 0.9, alpha);
    }
    return;
  }

  if (moveStep === 5) {
    const p = Math.max(0, Math.min(1.0, effectProgress || 0.5));

    for (let i = 0; i < 2; i++) {
      const slot = LEAF_SLOTS[i];
      const lx = midX + slot.offX;
      const ly = midY + slot.offY;
      const spin = slot.ang + p * Math.PI * 10 + i * 2.1;
      const flip = Math.cos(p * Math.PI * 6 + i);
      drawSpinningSickleLeaf(ctx, lx, ly, spin, flip, 1.05, 1.0);
    }

    for (let i = 2; i < 6; i++) {
      const slot = LEAF_SLOTS[i];
      const lx = midX + slot.offX;
      const ly = midY + slot.offY + Math.sin(p * Math.PI * 2 + i) * 2;
      const spin = slot.ang + p * Math.PI * 2.5 + i * 1.5;
      const flip = Math.cos(p * Math.PI * 2 + i);
      drawSpinningSickleLeaf(ctx, lx, ly, spin, flip, 0.95, 1.0);
    }
    return;
  }

  if (moveStep >= 6 && moveStep <= 11) {
    const volleys = [
      { leafIndices: [0, 1], launchStep: 6, hitStep: 7 },
      { leafIndices: [2, 3], launchStep: 8, hitStep: 9 },
      { leafIndices: [4, 5], launchStep: 10, hitStep: 11 },
    ];

    for (const v of volleys) {
      for (let idx = 0; idx < v.leafIndices.length; idx++) {
        const i = v.leafIndices[idx];
        const slot = LEAF_SLOTS[i];
        const stagger = idx * 0.12;

        if (moveStep < v.launchStep) {
          const lx = midX + slot.offX;
          const ly = midY + slot.offY + Math.sin(moveStep * 2 + i) * 2;
          const spin = slot.ang + moveStep * Math.PI * 3 + i * 1.5;
          drawSpinningSickleLeaf(ctx, lx, ly, spin, Math.cos(moveStep + i), 1.0, 1.0);
        } else {
          let tNorm = 0;
          if (moveStep === v.launchStep) {
            tNorm = 0.05 + effectProgress * 0.5 - stagger * 0.15;
          } else if (moveStep === v.hitStep) {
            tNorm = 0.55 + effectProgress * 0.55 - stagger * 0.1;
          } else {
            tNorm = 1.3;
          }

          if (tNorm > 0 && tNorm <= 1.2) {
            const t = Math.max(0, Math.min(1.0, tNorm));
            const startX = midX + slot.offX;
            const startY = midY + slot.offY;

            const targetX = targetPos.x + 38 * dirX;
            const targetY = targetPos.y + slot.offY * 0.6;

            const flyX = startX + (targetX - startX) * t;
            const flyY = startY + (targetY - startY) * t + Math.sin(t * Math.PI) * (slot.arcH * 0.4);

            const dt = 0.02;
            const tPrev = Math.max(0, t - dt);
            const prevX = startX + (targetX - startX) * tPrev;
            const prevY = startY + (targetY - startY) * tPrev + Math.sin(tPrev * Math.PI) * (slot.arcH * 0.4);
            const flightAngle = Math.atan2(flyY - prevY, flyX - prevX);

            const alpha = tNorm >= 1.0 ? Math.max(0, 1 - (tNorm - 1.0) / 0.2) : 1.0;

            if (t > 0.08 && tNorm < 1.1) {
              const trailLen = Math.min(65, 20 + t * 45);
              drawBladeTaperedTrail(ctx, flyX, flyY, flightAngle, trailLen, 15, alpha * 0.85);
            }

            const spin = aimAngle + tNorm * Math.PI * 14 + i * 2.2;
            drawSpinningSickleLeaf(ctx, flyX, flyY, spin, Math.cos(tNorm * Math.PI * 6 + i), 1.05, alpha);
          }
        }
      }
    }

    const hitSparks = [
      {
        step: 7,
        items: [
          { x: targetPos.x - 24, y: targetPos.y - 28, baseR: 13 },
          { x: targetPos.x + 16, y: targetPos.y - 24, baseR: 14 },
        ]
      },
      {
        step: 9,
        items: [
          { x: targetPos.x - 22, y: targetPos.y - 4,  baseR: 15 },
          { x: targetPos.x + 24, y: targetPos.y - 12, baseR: 14 },
        ]
      },
      {
        step: 11,
        items: [
          { x: targetPos.x - 12, y: targetPos.y + 18, baseR: 16 },
          { x: targetPos.x + 20, y: targetPos.y + 8,  baseR: 15 },
        ]
      },
    ];

    for (const h of hitSparks) {
      if (moveStep === h.step) {
        const p = effectProgress || 0.5;
        const sparkAlpha = Math.max(0, 1.0 - p * 0.8);
        const expand = 1.0 + p * 0.5;

        for (const item of h.items) {
          const r = item.baseR * expand;
          drawMiniRetroStar(ctx, item.x, item.y, r * sparkAlpha, "#fde047");
          drawMiniRetroStar(ctx, item.x, item.y, r * 0.55 * sparkAlpha, "#ffffff");

          ctx.save();
          ctx.globalAlpha = sparkAlpha * 0.7;
          ctx.strokeStyle = "#ca8a04";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(item.x, item.y, r * 0.7, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
    return;
  }

  if (moveStep === 12) {
    const p = Math.max(0, Math.min(1.0, effectProgress || 0.6));
    const fade = Math.max(0, (1.0 - p * 1.5) * 0.45);
    if (fade > 0.02) {
      drawMiniRetroStar(ctx, targetPos.x - 12, targetPos.y + 18, 14 * fade, "#fde047");
      drawMiniRetroStar(ctx, targetPos.x + 20, targetPos.y + 8,  13 * fade, "#fde047");
    }
  }
}

// ============================================================================
// 076: 솔라빔 (Solar Beam) - 그래픽 렌더러 (1턴 충전 & 2턴 발사)
// ============================================================================

/**
 * 1턴: 솔라빔 충전 비하인드 배경 암전 (Dimming)
 */
export function drawSolarBeamChargeBehindEffect(
  ctx: any,
  frame: any
) {
  const dimAlpha = frame.dimAlpha ?? 0;
  if (dimAlpha > 0.005) {
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${dimAlpha})`;
    ctx.fillRect(-20000, -20000, 40000, 40000);
    ctx.restore();
  }
}

/**
 * 256색 팔레트 최적화형 3구간 수렴 광선 스트릭 (3-Stage Influx Ray)
 */
function drawConvergingRay256(
  ctx: any,
  cx: number,
  cy: number,
  angle: number,
  distOuter: number,
  distInner: number,
  width: number,
  globalAlpha: number
) {
  if (globalAlpha <= 0.02 || distOuter <= distInner) return;

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // 3구간 경계 거리
  const midDist1 = distInner + (distOuter - distInner) * 0.45;  // 몸통→머리 경계
  const midDist2 = distInner + (distOuter - distInner) * 0.8;   // 꼬리→몸통 경계

  // 각 끝점 좌표
  const xOuter = cx + cos * distOuter;
  const yOuter = cy + sin * distOuter;
  const xMid2 = cx + cos * midDist2;
  const yMid2 = cy + sin * midDist2;
  const xMid1 = cx + cos * midDist1;
  const yMid1 = cy + sin * midDist1;
  const xInner = cx + cos * distInner;
  const yInner = cy + sin * distInner;

  ctx.save();
  ctx.lineCap = "round";

  // ─── 1. 꼬리 구간: 라임색이 distOuter에서 알파 0 → midDist2에서 0.45로 자연스럽게 ───
  const tailGrad = ctx.createLinearGradient(xOuter, yOuter, xMid2, yMid2);
  tailGrad.addColorStop(0.00, `rgba(74, 222, 128, 0)`);
  tailGrad.addColorStop(0.55, `rgba(74, 222, 128, ${globalAlpha * 0.22})`);
  tailGrad.addColorStop(1.00, `rgba(74, 222, 128, ${globalAlpha * 0.45})`);
  ctx.globalAlpha = 1.0;
  ctx.strokeStyle = tailGrad;
  ctx.lineWidth = width * 0.75;
  ctx.beginPath();
  ctx.moveTo(xOuter, yOuter);
  ctx.lineTo(xMid2, yMid2);
  ctx.stroke();

  // ─── 2. 몸통 구간: 라임 → 레몬 색 전환 + 알파 0.45 → 0.8 ───
  const bodyGrad = ctx.createLinearGradient(xMid2, yMid2, xMid1, yMid1);
  bodyGrad.addColorStop(0.00, `rgba(74, 222, 128, ${globalAlpha * 0.45})`);
  bodyGrad.addColorStop(0.40, `rgba(163, 230, 53, ${globalAlpha * 0.60})`);
  bodyGrad.addColorStop(1.00, `rgba(250, 204, 21, ${globalAlpha * 0.80})`);
  ctx.strokeStyle = bodyGrad;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(xMid2, yMid2);
  ctx.lineTo(xMid1, yMid1);
  ctx.stroke();

  // ─── 3. 머리 구간: 레몬 → 순백 색 전환 + 알파 0.8 → 1.0 ───
  const headGrad = ctx.createLinearGradient(xMid1, yMid1, xInner, yInner);
  headGrad.addColorStop(0.00, `rgba(250, 204, 21, ${globalAlpha * 0.80})`);
  headGrad.addColorStop(0.45, `rgba(254, 240, 138, ${globalAlpha * 0.92})`);
  headGrad.addColorStop(1.00, `rgba(255, 255, 255, ${globalAlpha})`);
  ctx.strokeStyle = headGrad;
  ctx.lineWidth = width * 1.15;
  ctx.beginPath();
  ctx.moveTo(xMid1, yMid1);
  ctx.lineTo(xInner, yInner);
  ctx.stroke();

  // ─── 4. 흡수 돌입 팁 포인트 (자연스럽게 radial gradient) ───
  const tipR = width * 0.9;
  const tipGrad = ctx.createRadialGradient(xInner, yInner, 0, xInner, yInner, tipR);
  tipGrad.addColorStop(0.00, `rgba(255, 255, 255, ${globalAlpha})`);
  tipGrad.addColorStop(0.50, `rgba(254, 240, 138, ${globalAlpha * 0.75})`);
  tipGrad.addColorStop(1.00, `rgba(250, 204, 21, 0)`);
  ctx.fillStyle = tipGrad;
  ctx.beginPath();
  ctx.arc(xInner, yInner, tipR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 076: 솔라빔 1턴 - 빛 모으기 (Solar Beam Charge) 전면 이펙트
 */
export function drawSolarBeamChargeEffect(
  ctx: any,
  casterPos: { x: number; y: number },
  moveStep: number,
  progress: number = 0
) {
  const cx = casterPos.x;
  const cy = casterPos.y - 6;

  const RAYS = [
    { ang: 0.10, dStart: 190, spd: 1.05, w: 2.8 },
    { ang: 0.45, dStart: 170, spd: 1.25, w: 2.4 },
    { ang: 0.80, dStart: 215, spd: 0.90, w: 3.2 },
    { ang: 1.18, dStart: 185, spd: 1.15, w: 2.6 },
    { ang: 1.55, dStart: 165, spd: 1.35, w: 3.0 },
    { ang: 1.95, dStart: 220, spd: 0.85, w: 3.4 },
    { ang: 2.30, dStart: 180, spd: 1.20, w: 2.4 },
    { ang: 2.68, dStart: 205, spd: 1.00, w: 3.0 },
    { ang: 3.05, dStart: 175, spd: 1.30, w: 2.5 },
    { ang: 3.42, dStart: 225, spd: 0.95, w: 3.2 },
    { ang: 3.80, dStart: 190, spd: 1.10, w: 2.6 },
    { ang: 4.18, dStart: 170, spd: 1.30, w: 3.5 },
    { ang: 4.55, dStart: 210, spd: 0.90, w: 2.8 },
    { ang: 4.92, dStart: 180, spd: 1.20, w: 3.0 },
    { ang: 5.30, dStart: 235, spd: 0.95, w: 2.2 },
    { ang: 5.65, dStart: 165, spd: 1.35, w: 2.8 },
    { ang: 6.00, dStart: 200, spd: 1.05, w: 3.2 },
    { ang: 6.25, dStart: 175, spd: 1.15, w: 2.4 },
  ];

  const isChargeActive = moveStep >= 2 && moveStep <= 6;
  if (isChargeActive) {
    const tRaw = Math.max(0, Math.min(1.0, progress));
    const STEP_MIN_T = [0, 0, 0.35, 0.65, 0.95, 0.98, 1.0];
    const stepMinT = STEP_MIN_T[Math.min(moveStep, 6)] ?? 0;
    const t = moveStep >= 6 ? 1.0 : Math.max(tRaw, stepMinT);
    const absorbFade = moveStep >= 6 ? Math.max(0, 1.0 - (progress - 0.5) * 1.4) : 1.0;
    const shrink = moveStep >= 6 ? Math.min(1.0, Math.max(0, (progress - 0.85) / 0.15)) : 0;

    for (let i = 0; i < RAYS.length; i++) {
      const r = RAYS[i];
      const stagger = (i % 4) * 0.08;
      const p = Math.max(0, Math.min(1.0, (t - stagger) / (1.0 - stagger) * r.spd));
      if (p <= 0.02) continue;

      const easeP = p * p;
      const baseOuter = r.dStart * (1 - easeP * 0.72);
      const curDistOuter = baseOuter * (1 - shrink) + 8 * shrink;
      const coreSurfaceR = 18 * (0.3 + t * 0.7) + 4;
      const curDistInner = Math.max(coreSurfaceR, r.dStart * (1 - easeP * 1.18));
      const rayAlpha = Math.min(1.0, p * 2.5) * (1 - p * 0.15) * absorbFade;
      if (rayAlpha <= 0.02) continue;

      const spiralAngle = r.ang + easeP * 0.35;

      drawConvergingRay256(ctx, cx, cy, spiralAngle, curDistOuter, curDistInner, r.w, rayAlpha);
    }

    const coreScale = 0.3 + t * 0.7;
    const baseR = 18 * coreScale;
    const coreAlpha = moveStep >= 6 ? Math.max(0, 1.0 - (progress - 0.5) * 1.2) : 1.0;

    ctx.save();
    ctx.globalAlpha = 0.35 * coreAlpha;
    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.arc(cx, cy, baseR * 1.55, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.75 * coreAlpha;
    ctx.fillStyle = "#fde047";
    ctx.beginPath();
    ctx.arc(cx, cy, baseR * 1.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1.0 * coreAlpha;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx, cy, baseR * 0.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (moveStep >= 5 && moveStep <= 6) {
    const p = Math.max(0, Math.min(1.0, progress));
    const ringT = moveStep >= 5 ? 1.0 : p;
    const fade = moveStep >= 6
      ? Math.max(0, 1.0 - (progress - 0.5) * 1.2) * 0.6
      : Math.max(0, 1.0 - p);

    ctx.save();
    ctx.globalAlpha = fade * 0.85;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 34 - ringT * 18, 24 - ringT * 12, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = fade * 0.6;
    ctx.strokeStyle = "#a3e635";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 26 - ringT * 14, 18 - ringT * 9, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    drawMiniRetroStar(ctx, cx - 10, cy - 6, 7 * fade, "#fef08a");
    drawMiniRetroStar(ctx, cx + 8, cy + 4, 6 * fade, "#ffffff");
  }
}

/**
 * 하늘에서 대각선으로 내리꽂히는 거대 솔라빔 (6각형 조각 배열)
 */
function drawSkyDiagonalBeam(
  ctx: any,
  targetPos: { x: number; y: number },
  descend: number,
  beamWidth: number,
  alpha: number,
  fromLeft: boolean = true,
  tailCut: number = 0
) {
  if (alpha <= 0.02) return;

  const skyDirX = fromLeft ? -1 : 1;
  const skyX = targetPos.x + 260 * skyDirX;
  const skyY = targetPos.y - 380;
  const groundX = targetPos.x;
  const groundY = targetPos.y;

  const t = Math.max(0, Math.min(1.0, descend));
  const headX = skyX + (groundX - skyX) * t;
  const headY = skyY + (groundY - skyY) * t;

  const beamAngle = Math.atan2(groundY - skyY, groundX - skyX);

  const fullTail = Math.hypot(headX - skyX, headY - skyY) + 40;
  const tailLen = fullTail * (1 - Math.max(0, Math.min(1.0, tailCut)));
  if (tailLen <= 4) return;

  ctx.save();
  ctx.translate(headX, headY);
  ctx.rotate(beamAngle);

  const SEG_COUNT = 7;
  const segLen = tailLen / SEG_COUNT;
  const timeBase = descend * Math.PI * 2 + tailCut * Math.PI;

  const drawHexSlab = (cx: number, axisLen: number, thick: number) => {
    const halfL = axisLen * 0.5;
    const halfT = thick * 0.5;
    const bevel = Math.min(halfT * 0.9, halfL * 0.35);
    ctx.beginPath();
    ctx.moveTo(cx - halfL + bevel, -halfT);
    ctx.lineTo(cx + halfL - bevel, -halfT);
    ctx.lineTo(cx + halfL, 0);
    ctx.lineTo(cx + halfL - bevel, halfT);
    ctx.lineTo(cx - halfL + bevel, halfT);
    ctx.lineTo(cx - halfL, 0);
    ctx.closePath();
  };

  const LAYERS = [
    { scale: 1.20, color: "34, 197, 94",  baseAlpha: 0.30 },
    { scale: 0.85, color: "250, 204, 21", baseAlpha: 0.65 },
    { scale: 0.55, color: "254, 240, 138", baseAlpha: 0.85 },
    { scale: 0.30, color: "255, 255, 255", baseAlpha: 1.0 },
  ];

  for (const layer of LAYERS) {
    const layerThick = beamWidth * layer.scale;
    for (let i = 0; i < SEG_COUNT; i++) {
      const ph = timeBase + i * 1.35;
      // jitter를 segLen*0.28 이내로 제한 → 조각 간격이 벌어져도 항상 겹침
      const jitter = Math.sin(ph) * segLen * 0.28;
      const sizeOsc = 0.80 + Math.sin(ph * 1.3 + i * 0.9) * 0.20;
      const thick = layerThick * sizeOsc;
      // axisLen을 segLen*1.7 이상으로 유지 → 인접 조각이 최소 60% 이상 겹쳐 빔이 끊기지 않음
      const axisLen = segLen * (1.5 + sizeOsc * 0.4);
      const cx = -tailLen + segLen * (i + 0.5) + jitter;

      const alongT = (i + 0.5) / SEG_COUNT;
      const fadeIn = Math.min(1, alongT * 2.2);
      const a = layer.baseAlpha * fadeIn * alpha;

      const gradR = Math.max(thick, axisLen * 0.55);
      const grad = ctx.createRadialGradient(cx, 0, gradR * 0.05, cx, 0, gradR);
      grad.addColorStop(0, `rgba(${layer.color}, ${a})`);
      grad.addColorStop(0.45, `rgba(${layer.color}, ${a * 0.7})`);
      grad.addColorStop(0.75, `rgba(${layer.color}, ${a * 0.25})`);
      grad.addColorStop(1, `rgba(${layer.color}, 0)`);

      ctx.fillStyle = grad;
      drawHexSlab(cx, axisLen, thick);
      ctx.fill();
    }
  }

  // 빔 머리 플레어: radial gradient로 자연스러운 발광 (딱딱한 원형 경계 제거)
  const headPulse = 1 + Math.sin(descend * Math.PI * 8) * 0.08;
  const headR = beamWidth * 1.7 * headPulse;

  const headGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, headR);
  headGrad.addColorStop(0.00, `rgba(255, 255, 255, ${alpha})`);
  headGrad.addColorStop(0.22, `rgba(255, 255, 255, ${alpha * 0.85})`);
  headGrad.addColorStop(0.42, `rgba(254, 240, 138, ${alpha * 0.55})`);
  headGrad.addColorStop(0.65, `rgba(250, 204, 21, ${alpha * 0.28})`);
  headGrad.addColorStop(0.85, `rgba(250, 204, 21, ${alpha * 0.10})`);
  headGrad.addColorStop(1.00, `rgba(250, 204, 21, 0)`);

  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.arc(0, 0, headR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 076: 솔라빔 2턴 - 도착지점 태양 코어 구체 (Impact Orb)
 */
function drawImpactOrb(
  ctx: any,
  targetPos: { x: number; y: number },
  radius: number,
  pulse: number,
  alpha: number
) {
  if (alpha <= 0.02 || radius <= 1) return;
  const x = targetPos.x;
  const y = targetPos.y;
  const r = radius * (1 + Math.sin(pulse * Math.PI * 6) * 0.06);

  // 단일 radial gradient로 중심 진함 → 가장자리 투명 (자연스러운 falloff)
  ctx.save();
  const orbGrad = ctx.createRadialGradient(x, y, 0, x, y, r * 1.8);
  orbGrad.addColorStop(0.00, `rgba(255, 255, 255, ${alpha})`);
  orbGrad.addColorStop(0.18, `rgba(255, 255, 255, ${alpha * 0.95})`);
  orbGrad.addColorStop(0.32, `rgba(254, 240, 138, ${alpha * 0.85})`);
  orbGrad.addColorStop(0.50, `rgba(250, 204, 21, ${alpha * 0.55})`);
  orbGrad.addColorStop(0.72, `rgba(34, 197, 94, ${alpha * 0.25})`);
  orbGrad.addColorStop(1.00, `rgba(34, 197, 94, 0)`);

  ctx.fillStyle = orbGrad;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * 076: 솔라빔 2턴 - 비하인드 레이어 (암전 & 노란 섬광)
 */
export function drawSolarBeamFireBehindEffect(ctx: any, frame: any) {
  const dimAlpha = frame.dimAlpha ?? 0;
  if (dimAlpha > 0.005) {
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${dimAlpha})`;
    ctx.fillRect(-20000, -20000, 40000, 40000);
    ctx.restore();
  }

  const yellowFlash = frame.yellowFlash ?? 0;
  if (yellowFlash > 0.02) {
    ctx.save();
    ctx.fillStyle = `rgba(253, 224, 71, ${yellowFlash * 0.55})`;
    ctx.fillRect(-20000, -20000, 40000, 40000);
    ctx.fillStyle = `rgba(255, 255, 255, ${yellowFlash * 0.35})`;
    ctx.fillRect(-20000, -20000, 40000, 40000);
    ctx.restore();
  }

  const yellowCharge = frame.yellowCharge ?? 0;
  if (yellowCharge > 0.02) {
    ctx.save();
    ctx.fillStyle = `rgba(250, 204, 21, ${yellowCharge * 0.25})`;
    ctx.fillRect(-20000, -20000, 40000, 40000);
    ctx.restore();
  }
}

/**
 * 076: 솔라빔 2턴 - 하늘에서 강하하는 솔라 레이저 빔 (16단계)
 *
 *  1~4: 발사 전 응축 (암전 심화, 하늘 코어 응축)
 *  5:    번쩍! 노란 섬광
 *  6~7: 직선 빔 생성 & 강하
 *  8:    빔 도달 & 구체 생성 시작
 *  9~11: 노드 강약 + 구체 성장
 *  12:   구체 대폭발 & 넉백
 *  13:   폭발 잔광
 *  14:   빔 꼬리 소멸
 *  15:   잔향 소멸
 *  16:   복귀
 */
export function drawSolarBeamFireEffect(
  ctx: any,
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  moveStep: number,
  effectProgress: number = 0
) {
  const cx = attackerPos.x;
  const cy = attackerPos.y - 6;
  const fromLeft = attackerPos.x <= targetPos.x;

  const skyX = targetPos.x + 260 * (fromLeft ? -1 : 1);
  const skyY = targetPos.y - 380;

  // #1~4: 발사 전 응축
  if (moveStep >= 1 && moveStep <= 4) {
    const p = Math.max(0, Math.min(1.0, effectProgress || 0.3));

    const r = 10 + p * 18;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = "rgba(74, 222, 128, 0.30)";
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const skyP = moveStep === 4 ? 1.0 : p * 0.6;
    ctx.save();
    ctx.translate(skyX, skyY);
    const sr = 18 + skyP * 26;
    const skyGrad = ctx.createRadialGradient(0, 0, sr * 0.2, 0, 0, sr * 1.7);
    skyGrad.addColorStop(0, `rgba(255, 255, 255, ${0.9})`);
    skyGrad.addColorStop(0.4, `rgba(253, 224, 71, ${0.7 * skyP})`);
    skyGrad.addColorStop(1, `rgba(250, 204, 21, 0)`);
    ctx.fillStyle = skyGrad;
    ctx.beginPath();
    ctx.arc(0, 0, sr * 1.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  // #5: 번쩍! - 하늘 코어 최대 폭발
  if (moveStep === 5) {
    const p = Math.max(0, Math.min(1.0, effectProgress || 0.1));
    ctx.save();
    ctx.translate(skyX, skyY);
    const r = 42 + p * 34;
    const flashGrad = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.6);
    flashGrad.addColorStop(0, `rgba(255, 255, 255, ${0.95})`);
    flashGrad.addColorStop(0.4, `rgba(253, 224, 71, ${0.75})`);
    flashGrad.addColorStop(1, `rgba(250, 204, 21, 0)`);
    ctx.fillStyle = flashGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  // #6~7: 직선 빔 생성 & 강하 (얇게 시작 → 살짝 굵어짐)
  if (moveStep === 6 || moveStep === 7) {
    const baseP = moveStep === 6 ? 0.15 : 0.55;
    const p = baseP + (effectProgress || 0.3) * 0.30;
    const descend = Math.min(1.0, p);
    // 얇게(14) → 살짝 굵어짐(22~26) + 미세 맥동
    const baseW = moveStep === 6 ? 14 + descend * 10 : 22 + descend * 6;
    const pulse = 1 + Math.sin((effectProgress || 0.3) * Math.PI * 6) * 0.15;
    const beamWidth = baseW * pulse;
    drawSkyDiagonalBeam(ctx, targetPos, descend, beamWidth, 1.0, fromLeft);
    return;
  }

  // #8: 빔 도달 + 구체 생성 시작 (굵기 상승 32)
  if (moveStep === 8) {
    const p = Math.max(0, Math.min(1.0, effectProgress || 0.25));
    const pulse = 1 + Math.sin(p * Math.PI * 6) * 0.18;
    drawSkyDiagonalBeam(ctx, targetPos, 1.0, 32 * pulse, 1.0, fromLeft);
    const orbR = 10 + p * 12;
    drawImpactOrb(ctx, targetPos, orbR, p, 1.0);
    return;
  }

  // #9~11: 노드 강약 + 구체 성장 + 빔이 점점 거대해짐 (48 → 60 → 72)
  if (moveStep === 9 || moveStep === 10 || moveStep === 11) {
    const p = Math.max(0, Math.min(1.0, effectProgress || 0.5));
    // 스텝별 기본 굵기: 9→48, 10→60, 11→72
    const baseW = moveStep === 9 ? 48 : (moveStep === 10 ? 60 : 72);
    // 진행도에 따라 스텝 내에서도 살짝 커지며, 맥동으로 얇아졌다 굵어졌다 반복
    const growth = baseW + p * 6;
    const pulse = 1 + Math.sin(p * Math.PI * 10) * 0.18;
    const beamWidth = growth * pulse;
    drawSkyDiagonalBeam(ctx, targetPos, 1.0, beamWidth, 1.0, fromLeft);

    const orbBase = moveStep === 9 ? 22 : (moveStep === 10 ? 30 : 36);
    const orbR = orbBase + p * 12;
    drawImpactOrb(ctx, targetPos, orbR, p, 1.0);
    return;
  }

  // #12: 구체 대폭발 & 넉백 (폭발 직전 살짝 수축 → 58)
  if (moveStep === 12) {
    const p = Math.max(0, Math.min(1.0, effectProgress || 0.6));
    const pulse = 1 + Math.sin(p * Math.PI * 6) * 0.10;
    drawSkyDiagonalBeam(ctx, targetPos, 1.0, 58 * pulse, 0.95, fromLeft);
    const orbR = 44 + p * 24;
    drawImpactOrb(ctx, targetPos, orbR, p, 1.0 - p * 0.5);

    // 충격파: 선명한 stroke 대신 radial gradient로 자연스러운 확산
    const shockR = (34 + p * 20) * 1.6;
    const shockAlpha = Math.max(0, 1 - p * 0.7);
    if (shockAlpha > 0.02) {
      ctx.save();
      const shockGrad = ctx.createRadialGradient(
        targetPos.x, targetPos.y, shockR * 0.30,
        targetPos.x, targetPos.y, shockR
      );
      shockGrad.addColorStop(0.00, `rgba(254, 240, 138, 0)`);
      shockGrad.addColorStop(0.55, `rgba(254, 240, 138, 0)`);
      shockGrad.addColorStop(0.75, `rgba(254, 240, 138, ${shockAlpha * 0.35})`);
      shockGrad.addColorStop(0.90, `rgba(250, 204, 21, ${shockAlpha * 0.20})`);
      shockGrad.addColorStop(1.00, `rgba(74, 222, 128, 0)`);
      ctx.fillStyle = shockGrad;
      ctx.beginPath();
      ctx.ellipse(targetPos.x, targetPos.y, shockR * 1.1, shockR * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    return;
  }

  // #13: 폭발 잔광
  if (moveStep === 13) {
    const p = Math.max(0, Math.min(1.0, effectProgress || 0.4));
    const fade = Math.max(0, 1 - p);
    drawImpactOrb(ctx, targetPos, 30 + p * 20, p, fade * 0.5);
    return;
  }

  // #14: 빔 꼬리 소멸 (머리는 표적에 꽂힌 채, 꼬리만 사라짐)
  //      굵기도 서서히 수축 (34 → 20)
  if (moveStep === 14) {
    const p = Math.max(0, Math.min(1.0, effectProgress || 0.35));
    const tailCut = Math.min(1.0, p * 1.2);
    const alpha = Math.max(0, 1 - p * 0.5);
    const shrinkW = 34 * (1 - p * 0.4);
    if (alpha > 0.02 && tailCut < 0.98) {
      drawSkyDiagonalBeam(ctx, targetPos, 1.0, shrinkW, alpha, fromLeft, tailCut);
    }
    return;
  }

  // #15: 잔향 소멸
  if (moveStep === 15) {
    return;
  }
}