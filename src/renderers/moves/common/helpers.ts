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

  // Glowing circular orb particles rising from the sprite horizontal bottom baseline
  const orbConfigs = [
    { offsetX: -38, delay: 0.00, speed: 80, radius: 5.0, color: "rgba(239, 68, 68, 0.85)" },
    { offsetX: -26, delay: 0.25, speed: 90, radius: 6.5, color: "rgba(245, 158, 11, 0.90)" },
    { offsetX: -14, delay: 0.10, speed: 85, radius: 5.5, color: "rgba(253, 224, 71, 0.95)" },
    { offsetX: -2,  delay: 0.35, speed: 95, radius: 7.0, color: "rgba(254, 240, 138, 0.95)" },
    { offsetX: 10,  delay: 0.05, speed: 90, radius: 6.0, color: "rgba(253, 224, 71, 0.95)" },
    { offsetX: 22,  delay: 0.20, speed: 85, radius: 5.5, color: "rgba(245, 158, 11, 0.90)" },
    { offsetX: 34,  delay: 0.40, speed: 80, radius: 4.5, color: "rgba(239, 68, 68, 0.85)" },
  ];

  for (const cfg of orbConfigs) {
    const localProgress = (clampedProgress + cfg.delay) % 1.0;
    // Starts exactly at sprite bottom baseline (pos.y) and rises upward
    const orbY = pos.y - (localProgress * cfg.speed);
    const orbX = pos.x + cfg.offsetX;
    const alpha = Math.sin(localProgress * Math.PI);

    if (alpha <= 0.05) continue;

    ctx.save();
    ctx.globalAlpha = alpha;

    const r = cfg.radius * (0.75 + 0.35 * Math.sin(localProgress * Math.PI));

    // Outer warm glowing circle
    ctx.fillStyle = cfg.color;
    ctx.beginPath();
    ctx.arc(orbX, orbY, r, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright white center
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(orbX, orbY, r * 0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Stat Drop Effect (능력치 하락 / 랭크 하락)
 */
export function drawStatDropEffect(ctx: any, pos: { x: number; y: number }, progress: number = 0.5) {
  ctx.save();
  const clampedProgress = Math.min(1.0, Math.max(0.0, progress));

  // Pure blue descending arrow particles spanning across the sprite horizontal width down to bottom baseline
  const arrowConfigs = [
    { offsetX: -36, delay: 0.00, speed: 75, size: 10, color: "#3B82F6" },
    { offsetX: -22, delay: 0.20, speed: 85, size: 12, color: "#60A5FA" },
    { offsetX: -8,  delay: 0.08, speed: 90, size: 14, color: "#93C5FD" },
    { offsetX: 8,   delay: 0.16, speed: 90, size: 14, color: "#93C5FD" },
    { offsetX: 22,  delay: 0.04, speed: 85, size: 12, color: "#60A5FA" },
    { offsetX: 36,  delay: 0.24, speed: 75, size: 10, color: "#3B82F6" },
  ];

  for (const cfg of arrowConfigs) {
    const localProgress = (clampedProgress + cfg.delay) % 1.0;
    // Descends from top of sprite down to bottom baseline (pos.y)
    const arrowY = (pos.y - 75) + (localProgress * cfg.speed);
    const arrowX = pos.x + cfg.offsetX;
    const alpha = Math.sin(localProgress * Math.PI);

    if (alpha <= 0.05) continue;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = cfg.color;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = cfg.color;
    ctx.lineWidth = 3.0;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const s = cfg.size;
    ctx.beginPath();
    ctx.moveTo(arrowX - s, arrowY - s * 0.55);
    ctx.lineTo(arrowX, arrowY + s * 0.45);
    ctx.lineTo(arrowX + s, arrowY - s * 0.55);
    ctx.stroke();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(arrowX - s * 0.7, arrowY - s * 0.45);
    ctx.lineTo(arrowX, arrowY + s * 0.35);
    ctx.lineTo(arrowX + s * 0.7, arrowY - s * 0.45);
    ctx.stroke();

    ctx.fillStyle = cfg.color;
    ctx.beginPath();
    ctx.arc(arrowX, arrowY - s * 1.0, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  ctx.restore();
}
