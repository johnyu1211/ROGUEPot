import { drawMiniRetroStar } from "../common/helpers.js";

/**
 * 013 칼바람 (Razor Wind): Official Gen 7/8 Authentic 3D Spiral Whirlwind & Razor Cleave Storm
 * All elements rendered with true razor-sharp tapered polygons (tips taper to needle-point 0px).
 * 
 * Step 1: Cyan ground aura + 3D ascending tapered helical wind ribbons wrapping around attacker
 * Step 2: Dense 6-layer tapered helical tornado swirl around attacker + high tapered launch arc to target
 * Step 3: High sweeping arc descends into target + initial razor crescent blades intercept
 * Step 4: Omnidirectional "사사사사삿!" Razor Cleave Storm on defender + double yellow/white center flash stars
 * Step 5: Center impact star & dispersing blade shards
 */
export function drawRazorWindEffect(
  ctx: any,
  startPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  step: number = 1
) {
  ctx.save();
  const sx = startPos.x;
  const sy = startPos.y;
  const tx = targetPos.x;
  const ty = targetPos.y - 12;

  // 1. Tapered Needle-Sharp Crescent Razor Blade Helper (Both ends meet at 0-width sharp points)
  const drawTaperedRazorBlade = (
    cx: number,
    cy: number,
    angle: number,
    length: number = 65,
    curve: number = 18,
    thickness: number = 8.5,
    scale: number = 1.0,
    alpha: number = 1.0
  ) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    const halfL = length / 2;

    // 1A. Outer Glowing Air Wake (Translucent soft sky-blue)
    ctx.fillStyle = "rgba(186, 230, 253, 0.40)";
    ctx.beginPath();
    ctx.moveTo(-halfL, 0);
    ctx.quadraticCurveTo(0, curve * 1.35, halfL, 0);
    ctx.quadraticCurveTo(0, curve * 0.15, -halfL, 0);
    ctx.closePath();
    ctx.fill();

    // 1B. Main Tapered Crescent Blade Body (#BAE6FD / #E0F2FE)
    ctx.fillStyle = "#BAE6FD";
    ctx.beginPath();
    ctx.moveTo(-halfL, 0); // Sharp needle tip left
    ctx.quadraticCurveTo(0, curve, halfL, 0); // Sharp needle tip right
    ctx.quadraticCurveTo(0, curve - thickness, -halfL, 0);
    ctx.closePath();
    ctx.fill();

    // 1C. Razor-Sharp Luminous White Core Crescent (#FFFFFF)
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(-halfL + 4, 0);
    ctx.quadraticCurveTo(0, curve - 1.5, halfL - 4, 0);
    ctx.quadraticCurveTo(0, curve - thickness * 0.55, -halfL + 4, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  // 2. Tapered 3D Helical Wind Ribbon Helper (Tip starts at 0px, swells in center, tapers to 0px at tail)
  const drawTaperedHelicalRibbon = (
    centerX: number,
    centerY: number,
    yOffset: number,
    radiusX: number,
    radiusY: number,
    rotAngle: number,
    startAngle: number,
    endAngle: number,
    maxWidth: number,
    color: string,
    alpha: number
  ) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(centerX, centerY + yOffset);
    ctx.rotate(rotAngle);

    const steps = 24;
    const outerPts: { x: number; y: number }[] = [];
    const innerPts: { x: number; y: number }[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const ang = startAngle + (endAngle - startAngle) * t;
      // Smooth aerodynamic taper: 0 at ends -> maxWidth at center
      const w = maxWidth * Math.pow(Math.sin(t * Math.PI), 0.75);

      const cosA = Math.cos(ang);
      const sinA = Math.sin(ang);

      outerPts.push({
        x: (radiusX + w * 0.5) * cosA,
        y: (radiusY + w * 0.5) * sinA,
      });
      innerPts.push({
        x: (radiusX - w * 0.5) * cosA,
        y: (radiusY - w * 0.5) * sinA,
      });
    }

    // Outer sky-blue tapered ribbon
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(outerPts[0].x, outerPts[0].y);
    for (let i = 1; i <= steps; i++) ctx.lineTo(outerPts[i].x, outerPts[i].y);
    for (let i = steps; i >= 0; i--) ctx.lineTo(innerPts[i].x, innerPts[i].y);
    ctx.closePath();
    ctx.fill();

    // Pure white sharp tapered core
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    const coreMaxW = maxWidth * 0.45;
    const cOuterPts: { x: number; y: number }[] = [];
    const cInnerPts: { x: number; y: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const ang = startAngle + (endAngle - startAngle) * t;
      const w = coreMaxW * Math.pow(Math.sin(t * Math.PI), 0.75);
      cOuterPts.push({ x: (radiusX + w * 0.5) * Math.cos(ang), y: (radiusY + w * 0.5) * Math.sin(ang) });
      cInnerPts.push({ x: (radiusX - w * 0.5) * Math.cos(ang), y: (radiusY - w * 0.5) * Math.sin(ang) });
    }
    ctx.moveTo(cOuterPts[0].x, cOuterPts[0].y);
    for (let i = 1; i <= steps; i++) ctx.lineTo(cOuterPts[i].x, cOuterPts[i].y);
    for (let i = steps; i >= 0; i--) ctx.lineTo(cInnerPts[i].x, cInnerPts[i].y);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  if (step === 1) {
    // Step 1: Initial 3D Tapered Helical Spiral Wrapping around User (Full Opacity)
    const ribbonLayers = [
      { y: 25, rx: 52, ry: 16, rot: -0.15, sA: -Math.PI * 0.85, eA: Math.PI * 0.85, maxW: 6.5, col: "#E0F2FE", a: 0.90 },
      { y: 6, rx: 46, ry: 14, rot: 0.20, sA: -Math.PI * 0.90, eA: Math.PI * 0.90, maxW: 6.0, col: "#BAE6FD", a: 0.85 },
      { y: -14, rx: 42, ry: 13, rot: -0.25, sA: -Math.PI * 0.85, eA: Math.PI * 0.85, maxW: 5.5, col: "#E0F2FE", a: 0.80 },
      { y: -34, rx: 36, ry: 11, rot: 0.15, sA: -Math.PI * 0.80, eA: Math.PI * 0.80, maxW: 5.0, col: "#FFFFFF", a: 0.75 },
    ];
    for (const r of ribbonLayers) {
      drawTaperedHelicalRibbon(sx, sy, r.y, r.rx, r.ry, r.rot, r.sA, r.eA, r.maxW, r.col, r.a);
    }
  } else if (step === 2) {
    // Step 2: High-Speed Swirl at User Dissolving & Fading Out into the Air (Fade-out Alpha)
    const ribbonLayers = [
      { y: 30, rx: 58, ry: 18, rot: 0.35, sA: -Math.PI * 0.90, eA: Math.PI * 0.90, maxW: 7.0, col: "#BAE6FD", a: 0.45 },
      { y: 14, rx: 52, ry: 16, rot: -0.40, sA: -Math.PI * 0.92, eA: Math.PI * 0.92, maxW: 6.5, col: "#E0F2FE", a: 0.40 },
      { y: -2, rx: 48, ry: 15, rot: 0.45, sA: -Math.PI * 0.90, eA: Math.PI * 0.90, maxW: 6.0, col: "#BAE6FD", a: 0.40 },
      { y: -18, rx: 44, ry: 14, rot: -0.35, sA: -Math.PI * 0.88, eA: Math.PI * 0.88, maxW: 5.5, col: "#FFFFFF", a: 0.35 },
      { y: -36, rx: 40, ry: 12, rot: 0.40, sA: -Math.PI * 0.85, eA: Math.PI * 0.85, maxW: 5.0, col: "#E0F2FE", a: 0.30 },
      { y: -54, rx: 34, ry: 10, rot: -0.30, sA: -Math.PI * 0.80, eA: Math.PI * 0.80, maxW: 4.5, col: "#FFFFFF", a: 0.25 },
    ];
    for (const r of ribbonLayers) {
      drawTaperedHelicalRibbon(sx, sy, r.y, r.rx, r.ry, r.rot, r.sA, r.eA, r.maxW, r.col, r.a);
    }
  } else if (step === 3) {
    // Step 3: At Defender - Opposing Outer Pairs Form with Faint Translucency (Transparent -> Starting to appear)
    const earlyBlades = [
      { cx: tx - 52, cy: ty - 40, ang: -0.42, len: 62, curve: 16, thick: 7.5, a: 0.38 },
      { cx: tx + 52, cy: ty + 40, ang: -2.35, len: 62, curve: -16, thick: 7.5, a: 0.38 },
      { cx: tx + 50, cy: ty - 38, ang: 0.48, len: 60, curve: -16, thick: 7.5, a: 0.38 },
      { cx: tx - 50, cy: ty + 38, ang: 2.25, len: 60, curve: 16, thick: 7.5, a: 0.38 },
    ];
    for (const b of earlyBlades) {
      drawTaperedRazorBlade(b.cx, b.cy, b.ang, b.len, b.curve, b.thick, 0.95, b.a);
    }
  } else if (step === 4) {
    // Step 4: Closing In from All Opposing Directions - Becoming Denser / Semi-Opaque (사사사삭 쇄도!)
    const midBlades = [
      // Diagonal Opposing Pairs (Closer to center, darker alpha)
      { cx: tx - 32, cy: ty - 26, ang: -0.40, len: 68, curve: 18, thick: 8.5, a: 0.78 },
      { cx: tx + 32, cy: ty + 26, ang: -2.40, len: 68, curve: -18, thick: 8.5, a: 0.78 },
      { cx: tx + 34, cy: ty - 24, ang: 0.45, len: 70, curve: -18, thick: 8.5, a: 0.78 },
      { cx: tx - 34, cy: ty + 24, ang: 2.35, len: 70, curve: 18, thick: 8.5, a: 0.78 },
      // Horizontal / Vertical Opposing Pairs joining in
      { cx: tx - 44, cy: ty - 4, ang: 0.10, len: 64, curve: 16, thick: 8.0, a: 0.68 },
      { cx: tx + 44, cy: ty + 4, ang: -0.15, len: 64, curve: -16, thick: 8.0, a: 0.68 },
      { cx: tx - 4, cy: ty - 46, ang: 1.50, len: 60, curve: 15, thick: 7.5, a: 0.65 },
      { cx: tx + 4, cy: ty + 46, ang: -1.55, len: 60, curve: -15, thick: 7.5, a: 0.65 },
    ];
    for (const b of midBlades) {
      drawTaperedRazorBlade(b.cx, b.cy, b.ang, b.len, b.curve, b.thick, 1.0, b.a);
    }
  } else if (step === 5) {
    // Step 5: Full Omnidirectional Solid Cleave Impact (100% Solid Alpha, 사사사사삿!) + Double Star Flash
    const stormBlades = [
      { cx: tx - 18, cy: ty - 20, ang: -0.40, len: 74, curve: 20, thick: 9.5, s: 1.1 },
      { cx: tx + 20, cy: ty - 18, ang: 0.45, len: 76, curve: -20, thick: 9.5, s: 1.15 },
      { cx: tx - 28, cy: ty - 2, ang: 0.10, len: 70, curve: 18, thick: 9.0, s: 1.05 },
      { cx: tx + 26, cy: ty + 2, ang: -0.15, len: 72, curve: -18, thick: 9.0, s: 1.1 },
      { cx: tx - 20, cy: ty + 20, ang: 2.35, len: 68, curve: 18, thick: 8.5, s: 1.05 },
      { cx: tx + 22, cy: ty + 18, ang: -2.40, len: 70, curve: -18, thick: 8.5, s: 1.05 },
      { cx: tx - 4, cy: ty - 30, ang: 1.50, len: 64, curve: 16, thick: 8.0, s: 1.0 },
      { cx: tx + 4, cy: ty + 28, ang: -1.55, len: 64, curve: -16, thick: 8.0, s: 1.0 },
    ];

    for (const b of stormBlades) {
      drawTaperedRazorBlade(b.cx, b.cy, b.ang, b.len, b.curve, b.thick, b.s, 1.0);
    }

    // Double Center Impact Stars (Yellow & White)
    drawMiniRetroStar(ctx, tx - 6, ty - 8, 28, "#FACC15");
    drawMiniRetroStar(ctx, tx - 6, ty - 8, 14, "#FFFFFF");
    drawMiniRetroStar(ctx, tx + 8, ty + 6, 22, "#FDE047");
    drawMiniRetroStar(ctx, tx + 8, ty + 6, 11, "#FFFFFF");

    // Piercing Tapered Light Streaks radiating from center
    const streaks = [
      { ox: -30, oy: -24, ex: -65, ey: -50 },
      { ox: 28, oy: -22, ex: 62, ey: -46 },
      { ox: -28, oy: 24, ex: 58, ey: 48 },
      { ox: 26, oy: 22, ex: 54, ey: 44 },
      { ox: 0, oy: -32, ex: 0, ey: -68 },
      { ox: 0, oy: 30, ex: 0, ey: 64 },
    ];
    for (const st of streaks) {
      const dx = st.ex - st.ox;
      const dy = st.ey - st.oy;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;

      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.moveTo(tx + st.ox + nx * 2, ty + st.oy + ny * 2);
      ctx.lineTo(tx + st.ex, ty + st.ey);
      ctx.lineTo(tx + st.ox - nx * 2, ty + st.oy - ny * 2);
      ctx.closePath();
      ctx.fill();
    }
  } else if (step >= 6) {
    // Step 6: Star Impact Burst & Dispersing Razor Blade Shards with Smooth Fade-Out Alpha
    drawMiniRetroStar(ctx, tx, ty, 16, "rgba(250, 204, 21, 0.45)");
    drawMiniRetroStar(ctx, tx, ty, 8, "rgba(255, 255, 255, 0.55)");

    const shards = [
      { cx: tx - 52, cy: ty - 38, ang: -0.5, len: 44, curve: 14, thick: 5.5, a: 0.20 },
      { cx: tx + 54, cy: ty - 34, ang: 0.6, len: 46, curve: -14, thick: 5.5, a: 0.20 },
      { cx: tx - 44, cy: ty + 38, ang: 2.2, len: 42, curve: 12, thick: 5.0, a: 0.16 },
      { cx: tx + 46, cy: ty + 36, ang: -2.2, len: 44, curve: -12, thick: 5.0, a: 0.16 },
    ];
    for (const sh of shards) {
      drawTaperedRazorBlade(sh.cx, sh.cy, sh.ang, sh.len, sh.curve, sh.thick, 0.85, sh.a);
    }
  }

  ctx.restore();
}

/**
 * 014 칼춤 (Swords Dance): 4 Orbiting & Clashing Spectral Swords with Attack Up Aura
 */
export function drawSwordsDanceEffect(ctx: any, userPos: { x: number; y: number }, step: number = 1) {
  ctx.save();
  const ux = userPos.x;
  const uy = userPos.y - 14;

  const drawSword = (cx: number, cy: number, rot: number, scale: number = 1.0, alpha: number = 1.0) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    ctx.fillStyle = "#FEE2E2";
    ctx.strokeStyle = "#DC2626";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(4.5, -24);
    ctx.lineTo(4.5, 6);
    ctx.lineTo(0, 8);
    ctx.lineTo(-4.5, 6);
    ctx.lineTo(-4.5, -24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(0, 6);
    ctx.stroke();

    ctx.fillStyle = "#FBBF24";
    ctx.strokeStyle = "#B45309";
    ctx.lineWidth = 1.2;
    ctx.fillRect(-9, 6, 18, 3.5);
    ctx.strokeRect(-9, 6, 18, 3.5);

    ctx.fillStyle = "#78350F";
    ctx.fillRect(-2, 9.5, 4, 7);
    ctx.fillStyle = "#FBBF24";
    ctx.beginPath();
    ctx.arc(0, 18, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  };

  if (step === 1) {
    const offsets = [
      { ox: -36, oy: -8, rot: -0.2 },
      { ox: 36, oy: -8, rot: 0.2 },
      { ox: -18, oy: 16, rot: -0.4 },
      { ox: 18, oy: 16, rot: 0.4 },
    ];
    for (const o of offsets) {
      drawSword(ux + o.ox, uy + o.oy, o.rot, 0.9, 0.85);
    }
  } else if (step === 2) {
    ctx.fillStyle = "rgba(239, 68, 68, 0.18)";
    ctx.beginPath();
    ctx.arc(ux, uy, 48, 0, Math.PI * 2);
    ctx.fill();

    const offsets = [
      { ox: -28, oy: -26, rot: -0.5 },
      { ox: 28, oy: -26, rot: 0.5 },
      { ox: -36, oy: 4, rot: -0.1 },
      { ox: 36, oy: 4, rot: 0.1 },
    ];
    for (const o of offsets) {
      drawSword(ux + o.ox, uy + o.oy, o.rot, 1.05, 0.95);
    }
  } else if (step === 3) {
    ctx.fillStyle = "rgba(245, 158, 11, 0.25)";
    ctx.beginPath();
    ctx.arc(ux, uy - 32, 54, 0, Math.PI * 2);
    ctx.fill();

    drawSword(ux - 12, uy - 36, Math.PI * 0.25, 1.25, 1.0);
    drawSword(ux + 12, uy - 36, -Math.PI * 0.25, 1.25, 1.0);
    drawMiniRetroStar(ctx, ux, uy - 36, 18, "#F59E0B");
    drawMiniRetroStar(ctx, ux, uy - 36, 10, "#FFFFFF");

    ctx.fillStyle = "#EF4444";
    ctx.font = "bold 16px DungGeunMo";
    ctx.fillText("▲ ATK UP", ux - 30, uy - 64);
  } else if (step >= 4) {
    const sparks = [
      { ox: -20, oy: -45, r: 3.5, c: "#EF4444" },
      { ox: 20, oy: -48, r: 3.5, c: "#F59E0B" },
      { ox: 0, oy: -55, r: 4.2, c: "#FFFFFF" },
    ];
    for (const sp of sparks) {
      ctx.fillStyle = sp.c;
      ctx.beginPath();
      ctx.arc(ux + sp.ox, uy + sp.oy, sp.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * 015 풀베기 (Cut): Razor-Sharp Luminous Blade Slash with Severed Flying Leaves
 */
export function drawCutEffect(ctx: any, target: { x: number; y: number }, step: number = 1) {
  ctx.save();
  const tx = target.x;
  const ty = target.y - 12;

  const drawLeaf = (lx: number, ly: number, rot: number, size: number) => {
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(rot);
    ctx.fillStyle = "#22C55E";
    ctx.strokeStyle = "#15803D";
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.quadraticCurveTo(size * 0.7, 0, 0, size);
    ctx.quadraticCurveTo(-size * 0.7, 0, 0, -size);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  if (step === 1) {
    ctx.strokeStyle = "rgba(134, 239, 172, 0.45)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(tx - 38, ty - 38);
    ctx.lineTo(tx + 38, ty + 38);
    ctx.stroke();
  } else if (step === 2) {
    ctx.strokeStyle = "#22C55E";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(tx - 48, ty - 48);
    ctx.lineTo(tx + 48, ty + 48);
    ctx.stroke();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(tx - 42, ty - 42);
    ctx.lineTo(tx + 42, ty + 42);
    ctx.stroke();

    drawLeaf(tx - 24, ty + 12, 0.4, 8);
    drawLeaf(tx + 26, ty - 18, -0.6, 9);
    drawLeaf(tx + 12, ty + 24, 1.2, 7);
  } else if (step === 3) {
    drawMiniRetroStar(ctx, tx, ty, 16, "#22C55E");
    drawMiniRetroStar(ctx, tx, ty, 8, "#FFFFFF");

    drawLeaf(tx - 36, ty + 20, 0.8, 8);
    drawLeaf(tx + 40, ty - 26, -0.9, 9);
    drawLeaf(tx - 18, ty - 32, 1.5, 7);
    drawLeaf(tx + 28, ty + 30, -1.2, 8);
  } else if (step >= 4) {
    drawLeaf(tx - 44, ty + 32, 1.1, 7);
    drawLeaf(tx + 48, ty + 24, -1.4, 8);
  }

  ctx.restore();
}

/**
 * 016 바람일으키기 (Gust): Rapid Aerodynamic Swirling Wind Streams
 */
export function drawGustEffect(ctx: any, start: { x: number; y: number }, target: { x: number; y: number }, step: number = 1) {
  ctx.save();
  const tx = target.x;
  const ty = target.y - 12;

  const drawWindStream = (sx: number, sy: number, ex: number, ey: number, curvature: number, alpha: number) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "#E0F2FE";
    ctx.lineWidth = 4.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    const mx = (sx + ex) / 2 + curvature;
    const my = (sy + ey) / 2 - 14;
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.stroke();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.stroke();
    ctx.restore();
  };

  if (step === 1) {
    drawWindStream(start.x + 20, start.y - 10, (start.x + tx) / 2, (start.y + ty) / 2, -18, 0.65);
  } else if (step === 2) {
    drawWindStream(start.x + 30, start.y - 24, tx - 10, ty - 20, -26, 0.95);
    drawWindStream(start.x + 20, start.y, tx, ty, 0, 0.95);
    drawWindStream(start.x + 30, start.y + 24, tx - 10, ty + 20, 26, 0.95);
  } else if (step === 3) {
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = i % 2 === 0 ? "#F0F9FF" : "#BAE6FD";
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.ellipse(tx, ty - 8 + i * 8, 36 - i * 4, 12, (i * Math.PI) / 4, 0, Math.PI * 2);
      ctx.stroke();
    }
    drawMiniRetroStar(ctx, tx, ty, 14, "#E0F2FE");
    drawMiniRetroStar(ctx, tx, ty, 7, "#FFFFFF");
  } else if (step >= 4) {
    const sparkles = [
      { ox: -24, oy: -20, r: 2.8 },
      { ox: 22, oy: -16, r: 3.2 },
      { ox: -12, oy: 18, r: 2.5 },
      { ox: 16, oy: 22, r: 2.8 },
    ];
    for (const sp of sparkles) {
      ctx.fillStyle = "#F0F9FF";
      ctx.beginPath();
      ctx.arc(tx + sp.ox, ty + sp.oy, sp.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
