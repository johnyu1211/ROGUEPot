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
  if (!img) return null;
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
      if (brightness > 50) {
        const factor = brightness / 255;
        data[i] = Math.min(255, Math.round(r * factor * 1.15));
        data[i + 1] = Math.min(255, Math.round(g * factor * 1.15));
        data[i + 2] = Math.min(255, Math.round(b * factor * 1.15));
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

export async function preloadMoveAssets() {
  try {
    if (!karateBlackImg) {
      const bPath = path.resolve(process.cwd(), "assets/effects/karate_chop_black.png");
      if (fs.existsSync(bPath)) karateBlackImg = await loadImage(bPath);
    }
    if (!karateRedImg) {
      const rPath = path.resolve(process.cwd(), "assets/effects/karate_chop_red.png");
      if (fs.existsSync(rPath)) karateRedImg = await loadImage(rPath);
    }
    if (!doubleSlapWhiteImg) {
      const wPath = path.resolve(process.cwd(), "assets/effects/double_slap_white.png");
      if (fs.existsSync(wPath)) doubleSlapWhiteImg = await loadImage(wPath);
    }
    if (!cometPunchFistImg) {
      const pPath = path.resolve(process.cwd(), "assets/effects/comet_punch_fist.png");
      if (fs.existsSync(pPath)) {
        cometPunchFistImg = await loadImage(pPath);
        firePunchFistCanvas = createTintedFistCanvas(cometPunchFistImg, "#FF6B00");
        icePunchFistCanvas = createTintedFistCanvas(cometPunchFistImg, "#00D2FF");
        thunderPunchFistCanvas = createTintedFistCanvas(cometPunchFistImg, "#FFD700");
      }
    }
  } catch (err) {
    // Ignore asset load errors
  }
}

// Initial eager load
preloadMoveAssets();

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

  const auraGrad = ctx.createRadialGradient(pos.x, pos.y, 10, pos.x, pos.y - 20, 65);
  auraGrad.addColorStop(0, "rgba(239, 68, 68, 0.35)");
  auraGrad.addColorStop(0.5, "rgba(245, 158, 11, 0.20)");
  auraGrad.addColorStop(1, "rgba(239, 68, 68, 0)");
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y - 15, 65, 0, Math.PI * 2);
  ctx.fill();

  const arrowConfigs = [
    { offsetX: -32, baseY: 25, speed: 65, size: 11, delay: 0.0, color: "#EF4444" },
    { offsetX: -14, baseY: 35, speed: 75, size: 14, delay: 0.15, color: "#F59E0B" },
    { offsetX: 0,   baseY: 45, speed: 85, size: 16, delay: 0.05, color: "#FDE047" },
    { offsetX: 16,  baseY: 35, speed: 75, size: 13, delay: 0.2, color: "#F59E0B" },
    { offsetX: 34,  baseY: 25, speed: 65, size: 10, delay: 0.1, color: "#EF4444" },
  ];

  for (const cfg of arrowConfigs) {
    const localProgress = (clampedProgress + cfg.delay) % 1.0;
    const arrowY = pos.y + cfg.baseY - (localProgress * cfg.speed);
    const arrowX = pos.x + cfg.offsetX;
    const alpha = Math.sin(localProgress * Math.PI);

    if (alpha <= 0.05) continue;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = cfg.color;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = cfg.color;
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const s = cfg.size;
    ctx.beginPath();
    ctx.moveTo(arrowX - s, arrowY + s * 0.55);
    ctx.lineTo(arrowX, arrowY - s * 0.45);
    ctx.lineTo(arrowX + s, arrowY + s * 0.55);
    ctx.stroke();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(arrowX - s * 0.7, arrowY + s * 0.45);
    ctx.lineTo(arrowX, arrowY - s * 0.35);
    ctx.lineTo(arrowX + s * 0.7, arrowY + s * 0.45);
    ctx.stroke();

    ctx.fillStyle = cfg.color;
    ctx.beginPath();
    ctx.arc(arrowX, arrowY + s * 1.1, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  const sparkles = [
    { ox: -20, oy: -10, r: 2.5, color: "#FDE047" },
    { ox: 15, oy: -25, r: 3.0, color: "#F59E0B" },
    { ox: -5, oy: -40, r: 2.0, color: "#EF4444" },
    { ox: 25, oy: -5, r: 2.2, color: "#FDE047" },
  ];
  for (const sp of sparkles) {
    const py = pos.y + sp.oy - clampedProgress * 30;
    const px = pos.x + sp.ox;
    ctx.fillStyle = sp.color;
    ctx.beginPath();
    ctx.arc(px, py, sp.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Stat Drop Effect (능력치 하락 / 랭크 하락)
 */
export function drawStatDropEffect(ctx: any, pos: { x: number; y: number }, progress: number = 0.5) {
  ctx.save();
  const clampedProgress = Math.min(1.0, Math.max(0.0, progress));

  const auraGrad = ctx.createRadialGradient(pos.x, pos.y, 10, pos.x, pos.y + 15, 65);
  auraGrad.addColorStop(0, "rgba(59, 130, 246, 0.35)");
  auraGrad.addColorStop(0.5, "rgba(99, 102, 241, 0.20)");
  auraGrad.addColorStop(1, "rgba(59, 130, 246, 0)");
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y + 10, 65, 0, Math.PI * 2);
  ctx.fill();

  const arrowConfigs = [
    { offsetX: -32, baseY: -35, speed: 65, size: 11, delay: 0.0, color: "#3B82F6" },
    { offsetX: -14, baseY: -45, speed: 75, size: 14, delay: 0.15, color: "#60A5FA" },
    { offsetX: 0,   baseY: -55, speed: 85, size: 16, delay: 0.05, color: "#818CF8" },
    { offsetX: 16,  baseY: -45, speed: 75, size: 13, delay: 0.2, color: "#60A5FA" },
    { offsetX: 34,  baseY: -35, speed: 65, size: 10, delay: 0.1, color: "#3B82F6" },
  ];

  for (const cfg of arrowConfigs) {
    const localProgress = (clampedProgress + cfg.delay) % 1.0;
    const arrowY = pos.y + cfg.baseY + (localProgress * cfg.speed);
    const arrowX = pos.x + cfg.offsetX;
    const alpha = Math.sin(localProgress * Math.PI);

    if (alpha <= 0.05) continue;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = cfg.color;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = cfg.color;
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const s = cfg.size;
    ctx.beginPath();
    ctx.moveTo(arrowX - s, arrowY - s * 0.55);
    ctx.lineTo(arrowX, arrowY + s * 0.45);
    ctx.lineTo(arrowX + s, arrowY - s * 0.55);
    ctx.stroke();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(arrowX - s * 0.7, arrowY - s * 0.45);
    ctx.lineTo(arrowX, arrowY + s * 0.35);
    ctx.lineTo(arrowX + s * 0.7, arrowY - s * 0.45);
    ctx.stroke();

    ctx.fillStyle = cfg.color;
    ctx.beginPath();
    ctx.arc(arrowX, arrowY - s * 1.1, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  const droplets = [
    { ox: -20, oy: 5, r: 2.5, color: "#60A5FA" },
    { ox: 15, oy: 20, r: 3.0, color: "#3B82F6" },
    { ox: -5, oy: 35, r: 2.0, color: "#818CF8" },
    { ox: 25, oy: -2, r: 2.2, color: "#60A5FA" },
  ];
  for (const dp of droplets) {
    const py = pos.y + dp.oy + clampedProgress * 30;
    const px = pos.x + dp.ox;
    ctx.fillStyle = dp.color;
    ctx.beginPath();
    ctx.arc(px, py, dp.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
