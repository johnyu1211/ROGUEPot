import { drawMiniRetroStar } from "../common/helpers.js";

/**
 * 013 칼바람 (Razor Wind): Dual Aerodynamic Sickle Wind Blades
 */
export function drawRazorWindEffect(ctx: any, target: { x: number; y: number }, step: number = 1) {
  ctx.save();
  const tx = target.x;
  const ty = target.y - 10;

  const drawSickle = (cx: number, cy: number, rot: number, scale: number, alpha: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    ctx.beginPath();
    ctx.arc(0, 0, 38, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.arc(10, 0, 32, Math.PI * 0.45, -Math.PI * 0.45, true);
    ctx.closePath();
    ctx.fillStyle = "#E0F2FE";
    ctx.strokeStyle = "#38BDF8";
    ctx.lineWidth = 2.5;
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 38, -Math.PI * 0.40, Math.PI * 0.40);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.restore();
  };

  if (step === 1) {
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = "rgba(186, 230, 253, 0.55)";
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.ellipse(tx, ty + 15, 24 + i * 8, 8 + i * 3, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (step === 2) {
    drawSickle(tx - 32, ty - 18, -Math.PI * 0.25, 0.95, 0.95);
    drawSickle(tx + 32, ty + 12, Math.PI * 0.75, 0.95, 0.95);
  } else if (step === 3) {
    drawSickle(tx, ty, -Math.PI * 0.35, 1.25, 1.0);
    drawSickle(tx, ty, Math.PI * 0.65, 1.25, 1.0);
    drawMiniRetroStar(ctx, tx, ty, 18, "rgba(56, 189, 248, 0.85)");
    drawMiniRetroStar(ctx, tx, ty, 10, "#FFFFFF");
  } else if (step >= 4) {
    drawSickle(tx, ty, -Math.PI * 0.35, 1.45, 0.35);
    drawSickle(tx, ty, Math.PI * 0.65, 1.45, 0.35);
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
    ctx.strokeStyle = "#BAE6FD";
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
      ctx.strokeStyle = i % 2 === 0 ? "#E0F2FE" : "#38BDF8";
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.ellipse(tx, ty - 8 + i * 8, 36 - i * 4, 12, (i * Math.PI) / 4, 0, Math.PI * 2);
      ctx.stroke();
    }
    drawMiniRetroStar(ctx, tx, ty, 14, "#BAE6FD");
    drawMiniRetroStar(ctx, tx, ty, 7, "#FFFFFF");
  } else if (step >= 4) {
    const sparkles = [
      { ox: -24, oy: -20, r: 2.8 },
      { ox: 22, oy: -16, r: 3.2 },
      { ox: -12, oy: 18, r: 2.5 },
      { ox: 16, oy: 22, r: 2.8 },
    ];
    for (const sp of sparkles) {
      ctx.fillStyle = "#E0F2FE";
      ctx.beginPath();
      ctx.arc(tx + sp.ox, ty + sp.oy, sp.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
