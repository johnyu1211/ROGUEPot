import { drawMiniRetroStar } from "../common/helpers.js";

/**
 * 017 날개치기 (Wing Attack): Glowing Spectral Feathered Wing Cleave
 */
export function drawWingAttackEffect(ctx: any, target: { x: number; y: number }, step: number = 1) {
  ctx.save();
  const tx = target.x;
  const ty = target.y - 12;

  const drawWing = (cx: number, cy: number, rot: number, scale: number, alpha: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    ctx.fillStyle = "rgba(56, 189, 248, 0.25)";
    ctx.beginPath();
    ctx.moveTo(-45, 10);
    ctx.quadraticCurveTo(-15, -45, 50, -25);
    ctx.quadraticCurveTo(20, -5, -45, 10);
    ctx.fill();

    const feathers = [
      { ox: 45, oy: -22, l: 32, r: 0.15 },
      { ox: 30, oy: -28, l: 38, r: 0.05 },
      { ox: 12, oy: -30, l: 42, r: -0.08 },
      { ox: -8, oy: -26, l: 36, r: -0.22 },
      { ox: -26, oy: -18, l: 28, r: -0.35 },
    ];

    for (const f of feathers) {
      ctx.save();
      ctx.translate(f.ox, f.oy);
      ctx.rotate(f.r);
      ctx.fillStyle = "#F8FAFC";
      ctx.strokeStyle = "#38BDF8";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(8, -f.l * 0.5, 0, -f.l);
      ctx.quadraticCurveTo(-8, -f.l * 0.5, 0, 0);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -f.l * 0.9);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  };

  if (step === 1) {
    drawWing(tx - 38, ty - 18, -Math.PI * 0.25, 0.9, 0.85);
  } else if (step === 2) {
    drawWing(tx, ty - 6, Math.PI * 0.15, 1.25, 1.0);
    ctx.strokeStyle = "#38BDF8";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(tx - 55, ty - 32);
    ctx.lineTo(tx + 55, ty + 24);
    ctx.stroke();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(tx - 48, ty - 28);
    ctx.lineTo(tx + 48, ty + 20);
    ctx.stroke();
  } else if (step === 3) {
    drawMiniRetroStar(ctx, tx, ty, 20, "#38BDF8");
    drawMiniRetroStar(ctx, tx, ty, 10, "#FFFFFF");

    const sparks = [
      { ox: -32, oy: -20 },
      { ox: 36, oy: -16 },
      { ox: -20, oy: 24 },
      { ox: 24, oy: 28 },
    ];
    for (const sp of sparks) {
      ctx.fillStyle = "#E0F2FE";
      ctx.beginPath();
      ctx.arc(tx + sp.ox, ty + sp.oy, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (step >= 4) {
    drawMiniRetroStar(ctx, tx, ty, 8, "rgba(224, 242, 254, 0.45)");
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
      ctx.strokeStyle = "rgba(56, 189, 248, 0.65)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(tx + i * 18, 0);
      ctx.lineTo(tx + i * 18, ty - 30);
      ctx.stroke();
    }
  } else if (step === 3) {
    ctx.strokeStyle = "#38BDF8";
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

    ctx.strokeStyle = "#F8FAFC";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(tx, ty + 18, 48, 14, 0, 0, Math.PI * 2);
    ctx.stroke();

    drawMiniRetroStar(ctx, tx, ty, 24, "#38BDF8");
    drawMiniRetroStar(ctx, tx, ty, 14, "#FFFFFF");
  } else if (step >= 4) {
    ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
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
