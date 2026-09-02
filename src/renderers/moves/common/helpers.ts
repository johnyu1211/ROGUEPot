import { createCanvas, loadImage } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";

export let karateBlackImg: any = null;
export let karateRedImg: any = null;
export let doubleSlapWhiteImg: any = null;
export let cometPunchFistImg: any = null;
export let firePunchFistCanvas: any = null;
export let icePunchFistCanvas: any = null;
export let thunderPunchFistCanvas: any = null;

export function createTintedFistCanvas(img: any, fillHex: string) {
  if (!img || !img.width || !img.height) return null;
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imgData.data;

  const r = parseInt(fillHex.slice(1, 3), 16);
  const g = parseInt(fillHex.slice(3, 5), 16);
  const b = parseInt(fillHex.slice(5, 7), 16);

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha > 30) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (brightness > 30) {
        const factor = brightness / 255;
        data[i] = Math.min(255, Math.round(r * factor * 1.25));
        data[i + 1] = Math.min(255, Math.round(g * factor * 1.25));
        data[i + 2] = Math.min(255, Math.round(b * factor * 1.25));
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

// Top-level await guarantees 100% decoded pixel buffers before any render call
try {
  const bPath = path.resolve(process.cwd(), "assets/effects/karate_chop_black.png");
  if (fs.existsSync(bPath)) karateBlackImg = await loadImage(bPath);

  const rPath = path.resolve(process.cwd(), "assets/effects/karate_chop_red.png");
  if (fs.existsSync(rPath)) karateRedImg = await loadImage(rPath);

  const wPath = path.resolve(process.cwd(), "assets/effects/double_slap_white.png");
  if (fs.existsSync(wPath)) doubleSlapWhiteImg = await loadImage(wPath);

  const pPath = path.resolve(process.cwd(), "assets/effects/comet_punch_fist.png");
  if (fs.existsSync(pPath)) {
    cometPunchFistImg = await loadImage(pPath);
    firePunchFistCanvas = createTintedFistCanvas(cometPunchFistImg, "#FF6B00");
    icePunchFistCanvas = createTintedFistCanvas(cometPunchFistImg, "#00D2FF");
    thunderPunchFistCanvas = createTintedFistCanvas(cometPunchFistImg, "#FFD700");
  }
} catch (err) {
  // Ignore error
}

export function getKarateBlackImg(): any {
  return karateBlackImg;
}

export function getKarateRedImg(): any {
  return karateRedImg;
}

export function getDoubleSlapWhiteImg(): any {
  return doubleSlapWhiteImg;
}

export function getCometPunchFistImg(): any {
  return cometPunchFistImg;
}

export function getFirePunchFistCanvas(): any {
  return firePunchFistCanvas;
}

export function getIcePunchFistCanvas(): any {
  return icePunchFistCanvas;
}

export function getThunderPunchFistCanvas(): any {
  return thunderPunchFistCanvas;
}

export async function preloadMoveAssets() {
  // Pre-loaded synchronously via top-level await!
}

/**
 * Common Helper: Mini Pixel Star Impact Burst
 */
export function drawMiniRetroStar(ctx: any, cx: number, cy: number, size: number, color: string = "#FFFFFF") {
  ctx.save();
  ctx.fillStyle = color;
  ctx.translate(cx, cy);

  const half = size / 2;
  const quarter = size / 4;

  ctx.beginPath();
  ctx.moveTo(0, -half);
  ctx.lineTo(quarter, -quarter);
  ctx.lineTo(half, 0);
  ctx.lineTo(quarter, quarter);
  ctx.lineTo(0, half);
  ctx.lineTo(-quarter, quarter);
  ctx.lineTo(-half, 0);
  ctx.lineTo(-quarter, -quarter);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Common Helper: High-Quality Impact Starburst & Shockwave Ring
 */
export function drawStarburstImpact(ctx: any, tx: number, ty: number, color1: string, color2: string, radius = 34) {
  const hitGrad = ctx.createRadialGradient(tx, ty, 2, tx, ty, radius);
  hitGrad.addColorStop(0, "#FFFFFF");
  hitGrad.addColorStop(0.35, color2);
  hitGrad.addColorStop(0.7, color1);
  hitGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = hitGrad;
  ctx.beginPath();
  ctx.arc(tx, ty, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(tx, ty, radius * 0.7, 0, Math.PI * 2);
  ctx.stroke();

  for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
    const r1 = radius * 0.35;
    const r2 = radius * (0.8 + (a % 2) * 0.3);
    const x1 = tx + Math.cos(a) * r1;
    const y1 = ty + Math.sin(a) * r1;
    const x2 = tx + Math.cos(a) * r2;
    const y2 = ty + Math.sin(a) * r2;
    ctx.strokeStyle = color2;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

/**
 * Stat Boost Effect (능력치 향상 / 랭크 상승)
 */
export function drawStatBoostEffect(ctx: any, pos: { x: number; y: number }, progress: number = 0.5) {
  ctx.save();
  const clampedProgress = Math.min(1.0, Math.max(0.0, progress));
  if (clampedProgress <= 0.0 || clampedProgress >= 1.0) {
    ctx.restore();
    return;
  }

  // 4 Continuous Waves of 6 Compact Crisp Orbs (24 total) shooting upward diagonally (↖ ↗)
  // Wide spread across base (-38px to +38px) fanning out broadly (driftDist 45px ~ 75px)
  const orbConfigs = [
    // Wave 1: First burst (6 orbs across wide base)
    { baseX: -28, driftDir: -1, driftDist: 62, spawn: 0.00, life: 0.46, speed: 105, radius: 6.5 },
    { baseX: 24,  driftDir: 1,  driftDist: 58, spawn: 0.02, life: 0.46, speed: 110, radius: 7.5 },
    { baseX: -12, driftDir: -1, driftDist: 48, spawn: 0.04, life: 0.46, speed: 115, radius: 5.5 },
    { baseX: 10,  driftDir: 1,  driftDist: 52, spawn: 0.06, life: 0.46, speed: 100, radius: 8.0 },
    { baseX: -36, driftDir: -1, driftDist: 70, spawn: 0.08, life: 0.46, speed: 95,  radius: 6.0 },
    { baseX: 32,  driftDir: 1,  driftDist: 68, spawn: 0.10, life: 0.46, speed: 105, radius: 5.0 },

    // Wave 2: Second burst (6 orbs)
    { baseX: -20, driftDir: -1, driftDist: 55, spawn: 0.20, life: 0.46, speed: 110, radius: 7.0 },
    { baseX: 18,  driftDir: 1,  driftDist: 60, spawn: 0.22, life: 0.46, speed: 115, radius: 6.0 },
    { baseX: -6,  driftDir: -1, driftDist: 44, spawn: 0.25, life: 0.46, speed: 120, radius: 8.0 },
    { baseX: 6,   driftDir: 1,  driftDist: 46, spawn: 0.27, life: 0.46, speed: 105, radius: 5.5 },
    { baseX: -32, driftDir: -1, driftDist: 72, spawn: 0.30, life: 0.46, speed: 100, radius: 7.5 },
    { baseX: 28,  driftDir: 1,  driftDist: 66, spawn: 0.32, life: 0.46, speed: 110, radius: 6.5 },

    // Wave 3: Third burst (6 orbs)
    { baseX: -24, driftDir: -1, driftDist: 64, spawn: 0.40, life: 0.44, speed: 105, radius: 6.0 },
    { baseX: 22,  driftDir: 1,  driftDist: 62, spawn: 0.42, life: 0.44, speed: 110, radius: 7.5 },
    { baseX: -10, driftDir: -1, driftDist: 50, spawn: 0.45, life: 0.44, speed: 115, radius: 8.0 },
    { baseX: 14,  driftDir: 1,  driftDist: 54, spawn: 0.47, life: 0.44, speed: 100, radius: 5.5 },
    { baseX: -38, driftDir: -1, driftDist: 75, spawn: 0.50, life: 0.44, speed: 95,  radius: 7.0 },
    { baseX: 34,  driftDir: 1,  driftDist: 72, spawn: 0.52, life: 0.44, speed: 105, radius: 6.0 },

    // Wave 4: Fourth burst (6 orbs)
    { baseX: -16, driftDir: -1, driftDist: 58, spawn: 0.58, life: 0.40, speed: 110, radius: 6.5 },
    { baseX: 12,  driftDir: 1,  driftDist: 56, spawn: 0.60, life: 0.40, speed: 105, radius: 7.0 },
    { baseX: -4,  driftDir: -1, driftDist: 46, spawn: 0.62, life: 0.40, speed: 115, radius: 5.5 },
    { baseX: 8,   driftDir: 1,  driftDist: 48, spawn: 0.64, life: 0.40, speed: 100, radius: 7.5 },
    { baseX: -30, driftDir: -1, driftDist: 68, spawn: 0.66, life: 0.40, speed: 95,  radius: 6.0 },
    { baseX: 26,  driftDir: 1,  driftDist: 65, spawn: 0.68, life: 0.40, speed: 105, radius: 5.0 },
  ];

  for (const cfg of orbConfigs) {
    if (clampedProgress < cfg.spawn || clampedProgress > cfg.spawn + cfg.life) continue;
    const t = (clampedProgress - cfg.spawn) / cfg.life; // strictly 0.0 -> 1.0 within its wave
    // Starts solid at bottom (t=0) and smoothly fades out as it ascends higher (t -> 1)
    const alpha = Math.pow(1.0 - t, 1.25) * 0.95;
    if (alpha <= 0.02) continue;

    // Soars upward from bottom ground baseline, expanding diagonally outward
    const soarT = Math.pow(t, 0.9);
    const orbY = pos.y - (soarT * cfg.speed);
    const orbX = pos.x + cfg.baseX + (cfg.driftDir * soarT * cfg.driftDist);

    ctx.save();
    ctx.globalAlpha = alpha;

    // Radius gently shrinks as it dissolves into air
    const r = cfg.radius * (1.0 - 0.25 * t);

    // 1. Rich vibrant orange compact orb body (#F97316 / #FB923C)
    ctx.fillStyle = "rgba(249, 115, 22, 0.96)";
    ctx.beginPath();
    ctx.arc(orbX, orbY, r, 0, Math.PI * 2);
    ctx.fill();

    // 2. Warm amber-orange subtle outer rim
    ctx.strokeStyle = "rgba(234, 88, 12, 0.85)";
    ctx.lineWidth = 0.9;
    ctx.stroke();

    // 3. Glowing warm apricot/peach inner highlight
    ctx.fillStyle = "rgba(254, 215, 170, 0.95)";
    ctx.beginPath();
    ctx.arc(orbX, orbY, r * 0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Stat Drop Effect (능력치 하락 / 랭크 하락): 4 Sequential Waves of Crisp Cyan/Blue Orbs descending diagonally and fading
 */
export function drawStatDropEffect(ctx: any, pos: { x: number; y: number }, progress: number = 0.5) {
  ctx.save();
  const clampedProgress = Math.min(1.0, Math.max(0.0, progress));
  if (clampedProgress <= 0.0 || clampedProgress >= 1.0) {
    ctx.restore();
    return;
  }

  const orbConfigs = [
    // Wave 1
    { baseX: -28, driftDir: -1, driftDist: 62, spawn: 0.00, life: 0.46, speed: 105, radius: 6.5 },
    { baseX: 24,  driftDir: 1,  driftDist: 58, spawn: 0.02, life: 0.46, speed: 110, radius: 7.5 },
    { baseX: -12, driftDir: -1, driftDist: 48, spawn: 0.04, life: 0.46, speed: 115, radius: 5.5 },
    { baseX: 10,  driftDir: 1,  driftDist: 52, spawn: 0.06, life: 0.46, speed: 100, radius: 8.0 },
    { baseX: -36, driftDir: -1, driftDist: 70, spawn: 0.08, life: 0.46, speed: 95,  radius: 6.0 },
    { baseX: 32,  driftDir: 1,  driftDist: 68, spawn: 0.10, life: 0.46, speed: 105, radius: 5.0 },

    // Wave 2
    { baseX: -20, driftDir: -1, driftDist: 55, spawn: 0.20, life: 0.46, speed: 110, radius: 7.0 },
    { baseX: 18,  driftDir: 1,  driftDist: 60, spawn: 0.22, life: 0.46, speed: 115, radius: 6.0 },
    { baseX: -6,  driftDir: -1, driftDist: 44, spawn: 0.25, life: 0.46, speed: 120, radius: 8.0 },
    { baseX: 6,   driftDir: 1,  driftDist: 46, spawn: 0.27, life: 0.46, speed: 105, radius: 5.5 },
    { baseX: -32, driftDir: -1, driftDist: 72, spawn: 0.30, life: 0.46, speed: 100, radius: 7.5 },
    { baseX: 28,  driftDir: 1,  driftDist: 66, spawn: 0.32, life: 0.46, speed: 110, radius: 6.5 },

    // Wave 3
    { baseX: -24, driftDir: -1, driftDist: 64, spawn: 0.40, life: 0.44, speed: 105, radius: 6.0 },
    { baseX: 22,  driftDir: 1,  driftDist: 62, spawn: 0.42, life: 0.44, speed: 110, radius: 7.5 },
    { baseX: -10, driftDir: -1, driftDist: 50, spawn: 0.45, life: 0.44, speed: 115, radius: 8.0 },
    { baseX: 14,  driftDir: 1,  driftDist: 54, spawn: 0.47, life: 0.44, speed: 100, radius: 5.5 },
    { baseX: -38, driftDir: -1, driftDist: 75, spawn: 0.50, life: 0.44, speed: 95,  radius: 7.0 },
    { baseX: 34,  driftDir: 1,  driftDist: 72, spawn: 0.52, life: 0.44, speed: 105, radius: 6.0 },

    // Wave 4
    { baseX: -16, driftDir: -1, driftDist: 58, spawn: 0.58, life: 0.40, speed: 110, radius: 6.5 },
    { baseX: 12,  driftDir: 1,  driftDist: 56, spawn: 0.60, life: 0.40, speed: 105, radius: 7.0 },
    { baseX: -4,  driftDir: -1, driftDist: 46, spawn: 0.62, life: 0.40, speed: 115, radius: 5.5 },
    { baseX: 8,   driftDir: 1,  driftDist: 48, spawn: 0.64, life: 0.40, speed: 100, radius: 7.5 },
    { baseX: -30, driftDir: -1, driftDist: 68, spawn: 0.66, life: 0.40, speed: 95,  radius: 6.0 },
    { baseX: 26,  driftDir: 1,  driftDist: 65, spawn: 0.68, life: 0.40, speed: 105, radius: 5.0 },
  ];

  for (const cfg of orbConfigs) {
    if (clampedProgress < cfg.spawn || clampedProgress > cfg.spawn + cfg.life) continue;
    const t = (clampedProgress - cfg.spawn) / cfg.life;
    const alpha = Math.pow(1.0 - t, 1.25) * 0.95;
    if (alpha <= 0.02) continue;

    const soarT = Math.pow(t, 0.9);
    const orbY = (pos.y - 85) + (soarT * cfg.speed);
    const orbX = pos.x + cfg.baseX + (cfg.driftDir * soarT * cfg.driftDist);

    ctx.save();
    ctx.globalAlpha = alpha;

    const r = cfg.radius * (1.0 - 0.25 * t);

    // Crisp compact blue circular dot (Clean #93C5FD)
    ctx.fillStyle = "rgba(147, 197, 253, 0.95)";
    ctx.beginPath();
    ctx.arc(orbX, orbY, r, 0, Math.PI * 2);
    ctx.fill();

    // Subtle bright center highlight
    ctx.fillStyle = "rgba(239, 246, 255, 0.95)";
    ctx.beginPath();
    ctx.arc(orbX, orbY, r * 0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  ctx.restore();
}
