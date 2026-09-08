import { createCanvas } from '@napi-rs/canvas';
import fs from 'fs';

const W = 420;
const H = 285;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// Background battlefield
ctx.fillStyle = '#65a30d';
ctx.fillRect(0, 0, W, H);
// Sky
ctx.fillStyle = '#bae6fd';
ctx.fillRect(0, 0, W, 110);
// Battle line
ctx.fillStyle = '#4d7c0f';
ctx.fillRect(0, 110, W, H - 110);

// Platforms
ctx.fillStyle = '#78716c';
ctx.beginPath();
ctx.ellipse(80, 215, 65, 22, 0, 0, Math.PI * 2);
ctx.fill();

ctx.beginPath();
ctx.ellipse(310, 135, 75, 25, 0, 0, Math.PI * 2);
ctx.fill();

/**
 * Draw an authentic Hokusai/Anime Ocean Barrel Wave
 * Full battlefield span (from attacker to target!),
 * sweeping concave vortex face, and majestic jagged foam crown.
 */
function drawFullSpanWave(
  ctx: any,
  ax: number,
  ay: number,
  tx: number,
  ty: number,
  progress: number,
  curlProgress: number,
  plungeProgress: number,
  alpha: number,
  step: number
) {
  const dir = 1;
  const baseY = ay + 20; // ~235
  const baseX = ax - 20; // ~60

  // 1. Full Battlefield Span Dimensions
  // The wave towers up to Y ~ 65 and extends horizontally towards the target (X ~ 310)
  const waveHeight = 175 * Math.min(1.0, progress * 1.05);
  const curlAmt = Math.min(1.0, Math.max(0, curlProgress));
  const plungeT = Math.min(1.0, Math.max(0, plungeProgress));

  // --- Landmarks ---
  const bLeftX = baseX - 25;
  const bLeftY = baseY;

  // Left wall shoulder (steep rising wall)
  const shoulderX = baseX + dir * 45;
  const shoulderY = baseY - waveHeight * 0.58;

  // High crest peak (Apex) - leans forward to X ~ 160
  const apexX = baseX + dir * (125 + curlAmt * 35 + plungeT * 10);
  const apexY = baseY - waveHeight;

  // Crest overhang (curling forward towards X ~ 230)
  const overX = apexX + dir * (65 + curlAmt * 28 + plungeT * 15);
  const overY = apexY + 26 + curlAmt * 14;

  // Plunging lip drop (looming right over opponent platform X ~ 295)
  const dropX = overX + dir * (32 + curlAmt * 20 + plungeT * 35);
  const dropY = overY + 38 + curlAmt * 28 + plungeT * 42;

  // Hook tip (claw curling back inward into the cavern)
  const hookCurl = 44 + curlAmt * 18 + plungeT * 12;
  const hookTipX = dropX - dir * (hookCurl * 0.52);
  const hookTipY = dropY + 24;
  const hookInX = dropX - dir * hookCurl;
  const hookInY = dropY + 4;

  // Barrel Vortex center (deep hollow cavern inside the tube)
  const vortexX = (apexX + hookInX) * 0.5 + dir * 15;
  const vortexY = (apexY + hookTipY) * 0.5 + 8;

  // Right Trough Base (sweeping past opponent)
  const bRightX = dropX + dir * 40;
  const bRightY = baseY;

  ctx.save();
  ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));

  // ==========================================================================
  // 1. SOLID OCEAN WATER MASS (Full body)
  // ==========================================================================
  ctx.beginPath();
  ctx.moveTo(bLeftX, bLeftY);
  // Back wall S-curve up to Apex
  ctx.bezierCurveTo(
    bLeftX - dir * 20, bLeftY - waveHeight * 0.38,
    shoulderX - dir * 32, shoulderY + 24,
    shoulderX, shoulderY
  );
  ctx.bezierCurveTo(
    shoulderX + dir * 28, shoulderY - 28,
    apexX - dir * 42, apexY - 4,
    apexX, apexY
  );
  // Overhang to Lip Drop
  ctx.bezierCurveTo(
    apexX + dir * 35, apexY,
    overX - dir * 22, overY - 6,
    overX, overY
  );
  ctx.bezierCurveTo(
    overX + dir * 26, overY + 22,
    dropX + dir * 12, dropY - 24,
    dropX, dropY
  );
  // Lip Hook
  ctx.bezierCurveTo(
    dropX + dir * 6, dropY + 16,
    hookTipX + dir * 14, hookTipY + 4,
    hookTipX, hookTipY
  );
  ctx.bezierCurveTo(
    hookTipX - dir * 12, hookTipY - 2,
    hookInX - dir * 2, hookInY + 12,
    hookInX, hookInY
  );
  // Bottom sweep to sea floor
  ctx.bezierCurveTo(
    hookInX + dir * 12, hookInY + 25,
    bRightX - dir * 12, bRightY - 25,
    bRightX, bRightY
  );
  ctx.lineTo(bLeftX, bLeftY);
  ctx.closePath();

  // Cel-shaded ocean blue gradation
  const baseGrad = ctx.createLinearGradient(bLeftX, baseY, apexX, apexY);
  baseGrad.addColorStop(0.00, '#042852');
  baseGrad.addColorStop(0.35, '#02528e');
  baseGrad.addColorStop(0.70, '#0284c7');
  baseGrad.addColorStop(0.92, '#0ea5e9');
  baseGrad.addColorStop(1.00, '#38bdf8');
  ctx.fillStyle = baseGrad;
  ctx.fill();

  // ==========================================================================
  // 2. DEEP PRUSSIAN / NAVY BARREL CAVITY SHADOW
  // ==========================================================================
  ctx.save();
  // Clip to wave body
  ctx.beginPath();
  ctx.moveTo(bLeftX, bLeftY);
  ctx.bezierCurveTo(
    bLeftX - dir * 20, bLeftY - waveHeight * 0.38,
    shoulderX - dir * 32, shoulderY + 24,
    shoulderX, shoulderY
  );
  ctx.bezierCurveTo(
    shoulderX + dir * 28, shoulderY - 28,
    apexX - dir * 42, apexY - 4,
    apexX, apexY
  );
  ctx.bezierCurveTo(
    apexX + dir * 35, apexY,
    overX - dir * 22, overY - 6,
    overX, overY
  );
  ctx.bezierCurveTo(
    overX + dir * 26, overY + 22,
    dropX + dir * 12, dropY - 24,
    dropX, dropY
  );
  ctx.bezierCurveTo(
    dropX + dir * 6, dropY + 16,
    hookTipX + dir * 14, hookTipY + 4,
    hookTipX, hookTipY
  );
  ctx.bezierCurveTo(
    hookTipX - dir * 12, hookTipY - 2,
    hookInX - dir * 2, hookInY + 12,
    hookInX, hookInY
  );
  ctx.bezierCurveTo(
    hookInX + dir * 12, hookInY + 25,
    bRightX - dir * 12, bRightY - 25,
    bRightX, bRightY
  );
  ctx.lineTo(bLeftX, bLeftY);
  ctx.closePath();
  ctx.clip();

  // Dark cavern inside the tube
  const caveRadius = 125 + curlAmt * 20;
  const caveGrad = ctx.createRadialGradient(
    vortexX - dir * 8, vortexY, 6,
    vortexX - dir * 8, vortexY, caveRadius
  );
  caveGrad.addColorStop(0.00, '#010d1c'); // Midnight Indigo
  caveGrad.addColorStop(0.42, '#021e3d');
  caveGrad.addColorStop(0.72, '#024b82');
  caveGrad.addColorStop(1.00, 'rgba(2, 75, 130, 0)');
  ctx.fillStyle = caveGrad;
  ctx.beginPath();
  ctx.arc(vortexX - dir * 8, vortexY, caveRadius, 0, Math.PI * 2);
  ctx.fill();

  // Underside shadow of plunging lip
  const lipShadow = ctx.createRadialGradient(
    dropX - dir * 18, dropY, 4,
    dropX - dir * 18, dropY, 80
  );
  lipShadow.addColorStop(0.00, '#010d1c');
  lipShadow.addColorStop(0.55, '#02254d');
  lipShadow.addColorStop(1.00, 'rgba(2, 37, 77, 0)');
  ctx.fillStyle = lipShadow;
  ctx.beginPath();
  ctx.arc(dropX - dir * 18, dropY, 80, 0, Math.PI * 2);
  ctx.fill();

  // ==========================================================================
  // 3. DIAGONAL CONCAVE SWEEPING SURF VEINS (3D Surface Webbing)
  // ==========================================================================
  // Sweeping diagonally up the amphitheater face into the vortex
  const veinConfigs = [
    { startU: 0.08, endU: 0.15, w: 1.5, alpha: 0.60 },
    { startU: 0.18, endU: 0.30, w: 1.8, alpha: 0.75 },
    { startU: 0.32, endU: 0.48, w: 2.2, alpha: 0.90 },
    { startU: 0.48, endU: 0.65, w: 2.2, alpha: 0.88 },
    { startU: 0.65, endU: 0.80, w: 1.8, alpha: 0.75 },
    { startU: 0.80, endU: 0.92, w: 1.4, alpha: 0.60 },
  ];

  for (const vc of veinConfigs) {
    const sX = bLeftX + (bRightX - bLeftX) * vc.startU;
    const sY = baseY - 2;

    const u = vc.endU;
    const midApexX = shoulderX * (1 - u) + apexX * u;
    const midApexY = shoulderY * (1 - u) + apexY * u + (1 - u) * 28;

    const midOverX = apexX * (1 - u) + overX * u;
    const midOverY = apexY * (1 - u) + overY * u;

    const midDropX = overX * (1 - u) + dropX * u;
    const midDropY = overY * (1 - u) + dropY * u;

    const midHookX = hookTipX * (1 - u) + hookInX * u;
    const midHookY = hookTipY * (1 - u) + hookInY * u;

    ctx.beginPath();
    ctx.moveTo(sX, sY);
    ctx.bezierCurveTo(
      sX + dir * 35, sY - waveHeight * 0.45 * u,
      midApexX - dir * 30, midApexY + 26,
      midApexX, midApexY
    );
    ctx.bezierCurveTo(
      midApexX + dir * 26, midApexY - 10,
      midOverX - dir * 20, midOverY - 6,
      midOverX, midOverY
    );
    ctx.bezierCurveTo(
      midOverX + dir * 22, midOverY + 16,
      midDropX + dir * 10, midDropY - 18,
      midDropX, midDropY
    );
    ctx.bezierCurveTo(
      midDropX + dir * 6, midDropY + 14,
      midHookX + dir * 12, midHookY + 4,
      midHookX, midHookY
    );

    ctx.strokeStyle = `rgba(186, 230, 253, ${vc.alpha * 0.65 * alpha})`;
    ctx.lineWidth = vc.w + 1.4;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 255, 255, ${vc.alpha * alpha})`;
    ctx.lineWidth = vc.w;
    ctx.stroke();
  }

  // Swirling curves inside the dark tube
  for (let vx = 0; vx < 4; vx++) {
    const vu = (vx + 1) / 5;
    ctx.beginPath();
    ctx.arc(vortexX, vortexY, 22 + vu * 40, -Math.PI * 0.85, Math.PI * 0.55);
    ctx.strokeStyle = `rgba(125, 211, 252, ${0.35 * alpha * vu})`;
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }

  ctx.restore(); // end clip

  // ==========================================================================
  // 4. TRANSLUCENT CURLING LIP SHEET (The Glowing Lip Arc)
  // ==========================================================================
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(apexX - dir * 25, apexY);
  ctx.bezierCurveTo(
    apexX + dir * 32, apexY - 2,
    overX - dir * 16, overY - 6,
    overX, overY
  );
  ctx.bezierCurveTo(
    overX + dir * 24, overY + 20,
    dropX + dir * 12, dropY - 22,
    dropX, dropY
  );
  ctx.bezierCurveTo(
    dropX + dir * 6, dropY + 16,
    hookTipX + dir * 14, hookTipY + 4,
    hookTipX, hookTipY
  );
  ctx.lineTo(hookTipX - dir * 10, hookTipY - 8);
  ctx.bezierCurveTo(
    dropX - dir * 6, dropY - 14,
    overX - dir * 12, overY + 2,
    apexX - dir * 15, apexY + 14
  );
  ctx.closePath();

  const lipGrad = ctx.createLinearGradient(apexX, apexY, dropX, dropY);
  lipGrad.addColorStop(0.00, '#ffffff');
  lipGrad.addColorStop(0.30, '#bae6fd');
  lipGrad.addColorStop(0.65, '#38bdf8');
  lipGrad.addColorStop(0.90, '#7dd3fc');
  lipGrad.addColorStop(1.00, '#ffffff');
  ctx.fillStyle = lipGrad;
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.2;
  ctx.stroke();
  ctx.restore();

  // ==========================================================================
  // 5. 🌟 MASSIVE BILLOWING FOAM CANOPY WITH SHARP WAVE TEETH
  // ==========================================================================
  // A. Ice-Blue Under-Shadow Foam Base
  for (let row = 0; row < 2; row++) {
    const shadowCount = 22;
    for (let i = 0; i < shadowCount; i++) {
      const t = i / (shadowCount - 1);
      let px: number, py: number;
      if (t < 0.40) {
        const u = t / 0.40;
        px = (1 - u) * (shoulderX - dir * 6) + u * (apexX - dir * 4);
        py = (1 - u) * (shoulderY - 2) + u * (apexY - 6);
      } else {
        const u = (t - 0.40) / 0.60;
        px = (1 - u) * (apexX - dir * 4) + u * (overX + dir * 20);
        py = (1 - u) * (apexY - 6) + u * (overY + 8);
      }
      const rY = py + row * 14 + Math.sin(i * 1.9 + step) * 2;
      const r = 18 + Math.sin(t * Math.PI) * 11;

      const grad = ctx.createRadialGradient(px, rY, 0, px, rY, r);
      grad.addColorStop(0.00, 'rgba(186, 230, 253, 0.90)');
      grad.addColorStop(0.65, 'rgba(186, 230, 253, 0.50)');
      grad.addColorStop(1.00, 'rgba(186, 230, 253, 0.0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, rY, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // B. Thick Volumetric Pure White Foam Puffs (NO borders)
  for (let tier = 0; tier < 3; tier++) {
    const puffCount = 36;
    const tierOffsetY = (tier - 1) * 9;
    for (let i = 0; i < puffCount; i++) {
      const t = i / (puffCount - 1);
      let px: number, py: number;
      if (t < 0.38) {
        const u = t / 0.38;
        px = (1 - u) * (shoulderX - dir * 4) + u * apexX;
        py = (1 - u) * (shoulderY - 6) + u * (apexY - 8);
      } else {
        const u = (t - 0.38) / 0.62;
        px = (1 - u) * apexX + u * (overX + dir * 24);
        py = (1 - u) * (apexY - 8) + u * (overY - 2);
      }
      const r = 12 + Math.sin(t * Math.PI) * 12 + ((i * 17) % 6);
      const wobble = ((i * 13) % 7) - 3.5;
      const finalY = py + tierOffsetY + wobble;

      const grad = ctx.createRadialGradient(px, finalY, 0, px, finalY, r);
      grad.addColorStop(0.00, 'rgba(255, 255, 255, 1.0)');
      grad.addColorStop(0.72, 'rgba(255, 255, 255, 0.96)');
      grad.addColorStop(0.90, 'rgba(240, 249, 255, 0.40)');
      grad.addColorStop(1.00, 'rgba(255, 255, 255, 0.0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, finalY, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // C. 🌟 Sharp Hooked Wave Teeth (호쿠사이 특유의 날카로운 갈퀴형 파도 첨단)
  function drawSharpWaveTooth(
    ctx: any,
    rootX: number,
    rootY: number,
    angle: number,
    length: number,
    baseWidth: number,
    hookCurvature: number,
    hasSubTooth: boolean = false
  ) {
    ctx.save();
    ctx.translate(rootX, rootY);
    ctx.rotate(angle);

    const tipX = length;
    const tipY = length * hookCurvature;

    ctx.beginPath();
    ctx.moveTo(0, baseWidth * 0.5);
    ctx.bezierCurveTo(
      length * 0.35, baseWidth * 0.15,
      length * 0.75, tipY * 0.5 - baseWidth * 0.1,
      tipX, tipY
    );
    ctx.bezierCurveTo(
      length * 0.65, tipY * 0.85 + baseWidth * 0.3,
      length * 0.30, baseWidth * 0.70,
      0, -baseWidth * 0.5
    );
    ctx.closePath();

    ctx.fillStyle = '#ffffff';
    ctx.fill();

    if (hasSubTooth) {
      const bX = length * 0.50;
      const bY = tipY * 0.40;
      const bLen = length * 0.44;
      const bAngle = -0.58;

      ctx.save();
      ctx.translate(bX, bY);
      ctx.rotate(bAngle);
      ctx.beginPath();
      ctx.moveTo(0, baseWidth * 0.25);
      ctx.quadraticCurveTo(bLen * 0.45, -baseWidth * 0.15, bLen, -bLen * 0.35);
      ctx.quadraticCurveTo(bLen * 0.45, baseWidth * 0.35, 0, -baseWidth * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  // Sharp Crest Teeth projecting high into the sky and curling forward
  const crestTeeth = [
    { u: 0.08, len: 28, w: 10.0, angle: -0.75, cur: -0.38, sub: false },
    { u: 0.20, len: 40, w: 12.0, angle: -0.50, cur: -0.45, sub: true },
    { u: 0.35, len: 50, w: 14.0, angle: -0.25, cur: -0.52, sub: true },
    { u: 0.50, len: 52, w: 15.0, angle: 0.02, cur: -0.56, sub: true },
    { u: 0.65, len: 45, w: 13.0, angle: 0.28, cur: -0.60, sub: true },
    { u: 0.78, len: 38, w: 11.5, angle: 0.52, cur: -0.64, sub: false },
    { u: 0.90, len: 30, w: 10.0, angle: 0.75, cur: -0.68, sub: false },
  ];

  for (const ct of crestTeeth) {
    let rx: number, ry: number;
    if (ct.u < 0.38) {
      const subU = ct.u / 0.38;
      rx = (1 - subU) * (shoulderX + dir * 6) + subU * apexX;
      ry = (1 - subU) * (shoulderY - 4) + subU * (apexY - 14);
    } else {
      const subU = (ct.u - 0.38) / 0.62;
      rx = (1 - subU) * apexX + subU * (overX + dir * 18);
      ry = (1 - subU) * (apexY - 14) + subU * (overY - 8);
    }
    drawSharpWaveTooth(ctx, rx, ry, ct.angle, ct.len, ct.w, ct.cur, ct.sub);
  }

  // Plunging Lip Teeth (Sharp talons curling inward into the barrel)
  const lipTeeth = [
    { x: dropX + dir * 5, y: dropY - 14, len: 32, w: 11.0, angle: 0.82, cur: -0.54, sub: true },
    { x: dropX + dir * 3, y: dropY + 6, len: 36, w: 12.0, angle: 1.20, cur: -0.58, sub: true },
    { x: hookTipX + dir * 5, y: hookTipY, len: 32, w: 11.0, angle: 1.65, cur: -0.64, sub: false },
    { x: hookTipX - dir * 4, y: hookTipY - 6, len: 26, w: 9.5, angle: 2.18, cur: -0.60, sub: false },
    { x: hookInX + dir * 3, y: hookInY, len: 20, w: 8.5, angle: 2.70, cur: -0.55, sub: false },
  ];
  for (const lt of lipTeeth) {
    drawSharpWaveTooth(ctx, lt.x, lt.y, lt.angle, lt.len, lt.w, lt.cur, lt.sub);
  }

  // Downward foam fingers reaching down onto the blue water face
  const downFingers = [
    { u: 0.22, len: 22, w: 8.0, angle: 1.25, cur: 0.20 },
    { u: 0.40, len: 28, w: 9.5, angle: 1.15, cur: 0.25 },
    { u: 0.58, len: 25, w: 9.0, angle: 1.00, cur: 0.22 },
    { u: 0.74, len: 20, w: 8.0, angle: 0.85, cur: 0.18 },
  ];
  for (const df of downFingers) {
    const rx = apexX * (1 - df.u) + overX * df.u - dir * 6;
    const ry = (apexY + 16) * (1 - df.u) + (overY + 18) * df.u;
    drawSharpWaveTooth(ctx, rx, ry, df.angle, df.len, df.w, df.cur, false);
  }

  // Lip Froth Clusters
  const lipLobes = [
    { x: dropX, y: dropY, r: 16 },
    { x: dropX + dir * 10, y: dropY + 8, r: 14 },
    { x: hookTipX, y: hookTipY, r: 15 },
    { x: hookInX, y: hookInY, r: 12 },
  ];
  for (const ll of lipLobes) {
    const grad = ctx.createRadialGradient(ll.x, ll.y, 0, ll.x, ll.y, ll.r);
    grad.addColorStop(0.00, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.70, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(1.00, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ll.x, ll.y, ll.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // ==========================================================================
  // 6. FINE SEA SPRAY & DROPLETS
  // ==========================================================================
  const sprayCount = 75;
  for (let s = 0; s < sprayCount; s++) {
    const seed = (s * 23 + step * 17) % 67;
    const originU = (s % 13) / 13;
    const ox = apexX * (1 - originU) + dropX * originU;
    const oy = (apexY - 16) * (1 - originU) + dropY * originU;

    const angle = -0.38 + (seed / 67) * 1.55;
    const dist = 18 + (seed * 11) % 105;
    const sx = ox + Math.cos(angle) * dist * dir;
    const sy = oy + Math.sin(angle) * dist * 0.65 - 4;
    const sr = 1.0 + (s % 3) * 0.9;

    const spGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 1.4);
    spGrad.addColorStop(0.00, 'rgba(255, 255, 255, 0.98)');
    spGrad.addColorStop(0.65, 'rgba(240, 249, 255, 0.75)');
    spGrad.addColorStop(1.00, 'rgba(224, 242, 254, 0.0)');
    ctx.fillStyle = spGrad;
    ctx.beginPath();
    ctx.arc(sx, sy, sr * 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // ==========================================================================
  // 7. CHURNING TROUGH & BASE WHITEWATER FOAM CUSHION
  // ==========================================================================
  const baseFoamCount = 22;
  for (let bf = 0; bf < baseFoamCount; bf++) {
    const bft = bf / (baseFoamCount - 1);
    const bfx = bLeftX + (bRightX - bLeftX) * bft;
    const bfy = baseY - 2 + Math.sin(bf * 2.2 + step) * 4;
    const bfr = 11 + ((bf * 5) % 9);

    const grad = ctx.createRadialGradient(bfx, bfy, 0, bfx, bfy, bfr);
    grad.addColorStop(0.00, 'rgba(255, 255, 255, 0.96)');
    grad.addColorStop(0.65, 'rgba(240, 249, 255, 0.75)');
    grad.addColorStop(1.00, 'rgba(240, 249, 255, 0.0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(bfx, bfy, bfr, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// Render test frame: step 5 peak barrel
drawFullSpanWave(ctx, 80, 215, 310, 135, 1.0, 1.0, 0.65, 1.0, 5);

fs.writeFileSync('scratch/test_wave_fullspan.png', canvas.toBuffer('image/png'));
console.log('Saved scratch/test_wave_fullspan.png');
