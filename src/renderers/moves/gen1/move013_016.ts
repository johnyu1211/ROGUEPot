import { drawMiniRetroStar } from "../common/helpers.js";

/**
 * 013 칼바람 (Razor Wind): Official Gen 7/8 Authentic 3D Spiral Whirlwind & Razor Cleave Storm
 * 
 * Step 1: Cyan ground aura + 3D ascending helical spiral wind ribbons wrapping around attacker
 * Step 2: Dense 6-layer helical tornado swirl around attacker + high sweeping wind arc launching to target
 * Step 3: Sweeping wind arc descends into target + initial razor blades intercept
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

  // Helper: Draw authentic curved razor blade slash (from reference image 2)
  const drawRazorBlade = (
    cx: number,
    cy: number,
    angle: number,
    length: number = 55,
    curve: number = 18,
    scale: number = 1.0,
    alpha: number = 1.0
  ) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    // Outer cyan/sky glow
    ctx.strokeStyle = "#BAE6FD";
    ctx.lineWidth = 4.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-length / 2, -curve);
    ctx.quadraticCurveTo(0, curve, length / 2, -curve * 0.4);
    ctx.stroke();

    // Sharp luminous white core blade
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-length / 2 + 3, -curve + 1);
    ctx.quadraticCurveTo(0, curve - 1, length / 2 - 3, -curve * 0.4 + 1);
    ctx.stroke();

    // Tapered back fin blade edge
    ctx.fillStyle = "rgba(240, 249, 255, 0.45)";
    ctx.beginPath();
    ctx.moveTo(-length / 2, -curve);
    ctx.quadraticCurveTo(0, curve, length / 2, -curve * 0.4);
    ctx.quadraticCurveTo(0, curve - 6, -length / 2, -curve);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  // Helper: Draw 3D Helical Tornado Ribbon Arc wrapping around user (from reference image 1)
  const drawHelicalWindRibbon = (
    centerX: number,
    centerY: number,
    yOffset: number,
    radiusX: number,
    radiusY: number,
    rotAngle: number,
    width: number,
    color: string,
    alpha: number
  ) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(centerX, centerY + yOffset);
    ctx.rotate(rotAngle);

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.ellipse(0, 0, radiusX, radiusY, 0, -Math.PI * 0.9, Math.PI * 0.9);
    ctx.stroke();

    // Inner bright core
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = Math.max(1.2, width * 0.45);
    ctx.beginPath();
    ctx.ellipse(0, 0, radiusX * 0.95, radiusY * 0.95, 0, -Math.PI * 0.8, Math.PI * 0.8);
    ctx.stroke();

    ctx.restore();
  };

  if (step === 1) {
    // Step 1: Glowing Cyan Ground Aura + Initial 3D Helical Spiral Wrapping around User
    const groundGrad = ctx.createRadialGradient(sx, sy + 30, 8, sx, sy + 30, 58);
    groundGrad.addColorStop(0, "rgba(56, 189, 248, 0.85)");
    groundGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.45)");
    groundGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = groundGrad;
    ctx.beginPath();
    ctx.ellipse(sx, sy + 30, 58, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4 Helical Spiral Wind Ribbon Layers ascending up the body
    const ribbonLayers = [
      { y: 25, rx: 52, ry: 16, rot: -0.15, w: 5.5, col: "#E0F2FE", a: 0.85 },
      { y: 6, rx: 46, ry: 14, rot: 0.20, w: 5.0, col: "#BAE6FD", a: 0.80 },
      { y: -14, rx: 42, ry: 13, rot: -0.25, w: 4.5, col: "#E0F2FE", a: 0.75 },
      { y: -34, rx: 36, ry: 11, rot: 0.15, w: 4.0, col: "#FFFFFF", a: 0.70 },
    ];
    for (const r of ribbonLayers) {
      drawHelicalWindRibbon(sx, sy, r.y, r.rx, r.ry, r.rot, r.w, r.col, r.a);
    }
  } else if (step === 2) {
    // Step 2: Dense Towering 3D Helical Tornado Whirl around User + High Sweeping Wind Arc toward Enemy!
    const groundGrad = ctx.createRadialGradient(sx, sy + 30, 10, sx, sy + 30, 68);
    groundGrad.addColorStop(0, "rgba(56, 189, 248, 0.95)");
    groundGrad.addColorStop(0.6, "rgba(56, 189, 248, 0.50)");
    groundGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = groundGrad;
    ctx.beginPath();
    ctx.ellipse(sx, sy + 30, 68, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // 6 Dense Helical Spiral Ribbon Rings enveloping the Pokémon
    const ribbonLayers = [
      { y: 30, rx: 58, ry: 18, rot: 0.1, w: 6.5, col: "#BAE6FD", a: 0.95 },
      { y: 14, rx: 52, ry: 16, rot: -0.2, w: 6.0, col: "#E0F2FE", a: 0.90 },
      { y: -2, rx: 48, ry: 15, rot: 0.25, w: 5.5, col: "#BAE6FD", a: 0.90 },
      { y: -18, rx: 44, ry: 14, rot: -0.15, w: 5.0, col: "#FFFFFF", a: 0.95 },
      { y: -36, rx: 40, ry: 12, rot: 0.2, w: 4.5, col: "#E0F2FE", a: 0.85 },
      { y: -54, rx: 34, ry: 10, rot: -0.1, w: 4.0, col: "#FFFFFF", a: 0.80 },
    ];
    for (const r of ribbonLayers) {
      drawHelicalWindRibbon(sx, sy, r.y, r.rx, r.ry, r.rot, r.w, r.col, r.a);
    }

    // High Sweeping Wind Arc Launching from Top of Swirl toward Target! (From Reference Image 1)
    ctx.save();
    ctx.strokeStyle = "#BAE6FD";
    ctx.lineWidth = 6.0;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(sx - 10, sy - 55);
    ctx.quadraticCurveTo((sx + tx) / 2 - 20, sy - 110, (sx + tx) * 0.65, (sy + ty) * 0.65 - 30);
    ctx.stroke();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(sx - 10, sy - 55);
    ctx.quadraticCurveTo((sx + tx) / 2 - 20, sy - 110, (sx + tx) * 0.65, (sy + ty) * 0.65 - 30);
    ctx.stroke();
    ctx.restore();
  } else if (step === 3) {
    // Step 3: Sweeping Arc Completes & First Wave of Razor Blades Intercepts Target
    ctx.save();
    ctx.strokeStyle = "rgba(186, 230, 253, 0.75)";
    ctx.lineWidth = 5.0;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(sx + 20, sy - 60);
    ctx.quadraticCurveTo((sx + tx) / 2, sy - 100, tx, ty - 10);
    ctx.stroke();
    ctx.restore();

    // Initial 4 Razor Blades converging on Target
    const initialBlades = [
      { cx: tx - 38, cy: ty - 28, ang: -0.45, len: 55, curve: 16 },
      { cx: tx + 36, cy: ty - 24, ang: 0.55, len: 58, curve: -16 },
      { cx: tx - 28, cy: ty + 24, ang: 2.10, len: 52, curve: 14 },
      { cx: tx + 30, cy: ty + 22, ang: -2.30, len: 54, curve: -14 },
    ];
    for (const b of initialBlades) {
      drawRazorBlade(b.cx, b.cy, b.ang, b.len, b.curve, 0.95, 0.90);
    }
  } else if (step === 4) {
    // Step 4: Full Multi-Angle "사사사사삿!" Razor Cleave Storm on Target (Reference Image 2!)
    const stormBlades = [
      // Top-Left to Center-Right
      { cx: tx - 22, cy: ty - 26, ang: -0.40, len: 68, curve: 18, s: 1.1 },
      // Top-Right to Center-Left
      { cx: tx + 24, cy: ty - 24, ang: 0.45, len: 70, curve: -18, s: 1.15 },
      // Horizontal Left Slash
      { cx: tx - 32, cy: ty - 4, ang: 0.10, len: 64, curve: 16, s: 1.05 },
      // Horizontal Right Slash
      { cx: tx + 30, cy: ty + 4, ang: -0.15, len: 66, curve: -16, s: 1.1 },
      // Bottom-Left to Upper-Right
      { cx: tx - 24, cy: ty + 24, ang: 2.35, len: 62, curve: 16, s: 1.05 },
      // Bottom-Right to Upper-Left
      { cx: tx + 26, cy: ty + 22, ang: -2.40, len: 64, curve: -16, s: 1.05 },
      // Vertical Plunge Slash
      { cx: tx - 4, cy: ty - 34, ang: 1.50, len: 58, curve: 14, s: 1.0 },
      // Upward Riser Slash
      { cx: tx + 4, cy: ty + 32, ang: -1.55, len: 58, curve: -14, s: 1.0 },
    ];

    for (const b of stormBlades) {
      drawRazorBlade(b.cx, b.cy, b.ang, b.len, b.curve, b.s, 1.0);
    }

    // Double Center Impact Stars (Yellow & White from Reference Image 2!)
    drawMiniRetroStar(ctx, tx - 6, ty - 8, 26, "#FACC15");
    drawMiniRetroStar(ctx, tx - 6, ty - 8, 14, "#FFFFFF");
    drawMiniRetroStar(ctx, tx + 8, ty + 6, 20, "#FDE047");
    drawMiniRetroStar(ctx, tx + 8, ty + 6, 10, "#FFFFFF");

    // Piercing Light Streaks radiating from center
    const streaks = [
      { ox: -40, oy: -32, ex: -55, ey: -44 },
      { ox: 38, oy: -28, ex: 54, ey: -40 },
      { ox: -36, oy: 30, ex: 50, ey: 42 },
      { ox: 34, oy: 28, ex: 48, ey: 38 },
      { ox: 0, oy: -42, ex: 0, ey: -58 },
      { ox: 0, oy: 40, ex: 0, ey: 56 },
    ];
    for (const st of streaks) {
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(tx + st.ox, ty + st.oy);
      ctx.lineTo(tx + st.ex, ty + st.ey);
      ctx.stroke();
    }
  } else if (step >= 5) {
    // Step 5: Star Impact Burst & Dispersing Razor Blade Shards
    drawMiniRetroStar(ctx, tx, ty, 20, "#FACC15");
    drawMiniRetroStar(ctx, tx, ty, 10, "#FFFFFF");

    const shards = [
      { cx: tx - 44, cy: ty - 32, ang: -0.5, len: 42, curve: 12, a: 0.40 },
      { cx: tx + 46, cy: ty - 28, ang: 0.6, len: 44, curve: -12, a: 0.40 },
      { cx: tx - 38, cy: ty + 32, ang: 2.2, len: 40, curve: 10, a: 0.35 },
      { cx: tx + 40, cy: ty + 30, ang: -2.2, len: 42, curve: -10, a: 0.35 },
    ];
    for (const sh of shards) {
      drawRazorBlade(sh.cx, sh.cy, sh.ang, sh.len, sh.curve, 0.85, sh.a);
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
