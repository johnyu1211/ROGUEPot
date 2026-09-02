import { drawMiniRetroStar } from "../common/helpers.js";

/**
 * 017 날개치기 (Wing Attack): Upward Ascending Wing Blade Strike with Fluttering Translucent White Feathers
 */
export function drawWingAttackEffect(ctx: any, target: { x: number; y: number }, step: number = 1) {
  ctx.save();
  const tx = target.x;
  const ty = target.y - 12;

  // Helper: Draw beautifully shaped translucent white feather
  const drawTranslucentFeather = (
    fx: number,
    fy: number,
    rot: number,
    length: number = 22,
    width: number = 8.0,
    alpha: number = 0.8
  ) => {
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;

    const halfL = length / 2;
    const halfW = width / 2;

    // 1. Soft Translucent White Feather Vane
    ctx.fillStyle = "rgba(255, 255, 255, 0.70)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.90)";
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(0, -halfL); // tip top
    ctx.quadraticCurveTo(halfW * 1.15, -halfL * 0.15, halfW * 0.65, halfL * 0.55);
    ctx.quadraticCurveTo(halfW * 0.35, halfL, 0, halfL); // quill base
    ctx.quadraticCurveTo(-halfW * 0.35, halfL, -halfW * 0.65, halfL * 0.55);
    ctx.quadraticCurveTo(-halfW * 1.15, -halfL * 0.15, 0, -halfL);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. Center Spine / Rachis Line
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -halfL + 2);
    ctx.lineTo(0, halfL + 2.5);
    ctx.stroke();

    ctx.restore();
  };

  // Helper: Draw ascending wing blade slash line (Bottom-Left -> Upper-Right)
  const drawAscendingWingBlade = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    outerWidth: number,
    innerWidth: number,
    alpha: number
  ) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = "round";

    // 1. Outer Luminous Sky-Blue Rim
    ctx.strokeStyle = "#BAE6FD";
    ctx.lineWidth = outerWidth;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // 2. Inner Brilliant Pure White Wing Core
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = innerWidth;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.restore();
  };

  // Helper: Draw stylized spectral wing silhouette
  const drawSpectralWing = (cx: number, cy: number, rot: number, scale: number, alpha: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    ctx.fillStyle = "rgba(224, 242, 254, 0.45)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-45, 12);
    ctx.quadraticCurveTo(-15, -42, 50, -28);
    ctx.quadraticCurveTo(18, -6, -45, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Feather primary points
    const primaries = [
      { ox: 45, oy: -25, l: 30, r: 0.12 },
      { ox: 30, oy: -32, l: 36, r: 0.04 },
      { ox: 12, oy: -34, l: 40, r: -0.08 },
      { ox: -8, oy: -30, l: 34, r: -0.20 },
      { ox: -26, oy: -20, l: 26, r: -0.32 },
    ];

    for (const f of primaries) {
      drawTranslucentFeather(f.ox, f.oy, f.r, f.l, 7.5, 0.85);
    }

    ctx.restore();
  };

  if (step === 1) {
    // Step 1: Upward strike inception (Starts below target, rising upwards)
    drawAscendingWingBlade(tx - 45, ty + 40, tx + 10, ty - 5, 8.5, 4.5, 0.85);
    drawSpectralWing(tx - 25, ty + 20, -Math.PI * 0.18, 0.9, 0.80);

    // Initial fluttering feathers rising from the bottom
    drawTranslucentFeather(tx - 35, ty + 30, -0.4, 20, 7.0, 0.75);
    drawTranslucentFeather(tx - 15, ty + 15, 0.3, 24, 8.5, 0.80);
    drawTranslucentFeather(tx + 20, ty + 25, -0.2, 18, 6.5, 0.70);
    drawTranslucentFeather(tx + 5, ty + 38, 0.5, 22, 7.5, 0.65);
  } else if (step === 2) {
    // Step 2: Climax powerful ascending wing strike slicing up through defender + bursting feathers
    drawAscendingWingBlade(tx - 55, ty + 45, tx + 55, ty - 45, 12.0, 6.5, 1.0);
    drawAscendingWingBlade(tx - 35, ty + 35, tx + 65, ty - 35, 6.5, 3.2, 0.75);
    drawSpectralWing(tx + 5, ty - 12, Math.PI * 0.12, 1.25, 0.95);

    // Dynamic upward fan of fluttering translucent white feathers
    drawTranslucentFeather(tx - 50, ty - 10, -0.7, 24, 8.5, 0.90);
    drawTranslucentFeather(tx - 28, ty - 38, -0.3, 26, 9.0, 0.95);
    drawTranslucentFeather(tx + 8, ty - 50, 0.1, 28, 9.5, 0.95);
    drawTranslucentFeather(tx + 38, ty - 35, 0.4, 25, 8.5, 0.90);
    drawTranslucentFeather(tx + 55, ty - 12, 0.8, 22, 7.5, 0.85);

    drawTranslucentFeather(tx - 35, ty + 18, -0.5, 20, 7.0, 0.75);
    drawTranslucentFeather(tx + 25, ty + 22, 0.3, 22, 7.5, 0.75);
    drawTranslucentFeather(tx + 45, ty + 8, 0.6, 18, 6.5, 0.70);

    // Center sharp impact star
    drawMiniRetroStar(ctx, tx, ty, 18, "#BAE6FD");
    drawMiniRetroStar(ctx, tx, ty, 9, "#FFFFFF");
  } else if (step === 3) {
    // Step 3: Wing ascends past the top and fades into the sky, feathers floating high up
    drawAscendingWingBlade(tx - 20, ty + 15, tx + 65, ty - 55, 6.5, 3.5, 0.45);
    drawSpectralWing(tx + 18, ty - 35, Math.PI * 0.20, 1.1, 0.40);

    // Feathers floating high up and dispersing
    drawTranslucentFeather(tx - 45, ty - 35, -0.8, 22, 7.5, 0.50);
    drawTranslucentFeather(tx - 15, ty - 55, -0.2, 26, 8.5, 0.55);
    drawTranslucentFeather(tx + 20, ty - 60, 0.2, 24, 8.0, 0.55);
    drawTranslucentFeather(tx + 48, ty - 45, 0.6, 20, 7.0, 0.45);
    drawTranslucentFeather(tx + 65, ty - 25, 0.9, 18, 6.5, 0.40);
  }

  ctx.restore();
}

/**
 * 018 날려버리기 (Whirlwind): Towering Spiral Tornado Column
 */
export function drawWhirlwindEffect(ctx: any, target: { x: number; y: number }, step: number = 1) {
  ctx.save();
  const tx = target.x;
  const ty = target.y - 12;

  if (step === 1) {
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = "rgba(148, 163, 184, 0.55)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(tx, ty + 20 - i * 8, 30 + i * 6, 8, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (step === 2 || step === 3) {
    const layers = 8;
    for (let i = 0; i < layers; i++) {
      const ringY = ty + 25 - i * 14;
      const ringW = 20 + i * 5.5;
      const ringH = 8 + i * 1.5;
      const rot = ((step * 3 + i) * Math.PI) / 6;

      ctx.strokeStyle = i % 2 === 0 ? "#E2E8F0" : "#94A3B8";
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.ellipse(tx, ringY, ringW, ringH, rot, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(tx, ringY, ringW * 0.9, ringH * 0.85, rot + 0.2, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (step === 3) {
      drawMiniRetroStar(ctx, tx, ty - 20, 16, "rgba(148, 163, 184, 0.85)");
    }
  } else if (step >= 4) {
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = "rgba(226, 232, 240, 0.35)";
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.ellipse(tx, ty - 20 + i * 20, 55 + i * 10, 12, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * 019 공중날기 (Fly): High-Speed Sky Launch & Supersonic Dive-Bomb Crater Impact
 */
export function drawFlyEffect(ctx: any, start: { x: number; y: number }, target: { x: number; y: number }, step: number = 1) {
  ctx.save();
  const tx = target.x;
  const ty = target.y - 12;

  if (step === 1) {
    for (let i = -2; i <= 2; i++) {
      ctx.strokeStyle = "rgba(224, 242, 254, 0.75)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(start.x + i * 14, start.y + 20);
      ctx.lineTo(start.x + i * 14, start.y - 70);
      ctx.stroke();
    }
  } else if (step === 2) {
    ctx.fillStyle = "rgba(15, 23, 42, 0.45)";
    ctx.beginPath();
    ctx.ellipse(tx, ty + 24, 32, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let i = -1; i <= 1; i++) {
      ctx.strokeStyle = "rgba(186, 230, 253, 0.70)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(tx + i * 18, 0);
      ctx.lineTo(tx + i * 18, ty - 30);
      ctx.stroke();
    }
  } else if (step === 3) {
    // Step 3: Supersonic Dive-Bomb Impact Slam!
    ctx.strokeStyle = "#BAE6FD";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(tx, 0);
    ctx.lineTo(tx, ty + 10);
    ctx.stroke();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(tx, 0);
    ctx.lineTo(tx, ty + 10);
    ctx.stroke();

    // Explosive Ground Crater Shockwave
    ctx.strokeStyle = "#F8FAFC";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(tx, ty + 18, 48, 14, 0, 0, Math.PI * 2);
    ctx.stroke();

    drawMiniRetroStar(ctx, tx, ty, 24, "#BAE6FD");
    drawMiniRetroStar(ctx, tx, ty, 14, "#FFFFFF");
  } else if (step >= 4) {
    // Step 4: Radial impact dispersal
    ctx.strokeStyle = "rgba(224, 242, 254, 0.40)";
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.ellipse(tx, ty + 18, 64, 18, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 020 조이기 (Bind): Constricting Coiled Bands with Pressure Squeeze
 */
export function drawBindEffect(ctx: any, target: { x: number; y: number }, step: number = 1) {
  ctx.save();
  const tx = target.x;
  const ty = target.y - 10;

  const squeeze = step === 2 ? 0.75 : (step >= 3 ? 0.90 : 1.0);
  const alpha = step >= 3 ? 0.35 : 1.0;

  ctx.globalAlpha = alpha;
  for (let i = 0; i < 3; i++) {
    const cy = ty - 12 + i * 12;
    ctx.strokeStyle = "#D97706";
    ctx.lineWidth = 6.0;
    ctx.beginPath();
    ctx.ellipse(tx, cy, 32 * squeeze, 10 * squeeze, -0.15, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#FEF3C7";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(tx, cy, 32 * squeeze, 10 * squeeze, -0.15, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (step === 2) {
    drawMiniRetroStar(ctx, tx, ty, 16, "#F59E0B");
  }

  ctx.restore();
}
