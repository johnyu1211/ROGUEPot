import {
  getKarateBlackImg,
  getKarateRedImg,
  getDoubleSlapWhiteImg,
  getCometPunchFistImg,
} from "../common/helpers.js";
import { drawPhysicalImpactEffect } from "../common/genericTypeEffects.js";

/**
 * 001 막치기 (Pound): Default Physical Strike
 */
export function drawPoundEffect(ctx: any, target: { x: number; y: number }, step: number = 1) {
  drawPhysicalImpactEffect(ctx, target);
}

/**
 * Authentic Front-Facing Straight Punch Fist SVG (정면 정권 - Seiken)
 */
export function drawFrontStraightPunchFistSvg(
  ctx: any,
  x: number,
  y: number,
  scale: number = 1.35,
  alpha: number = 1.0
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = "#0F172A";
  ctx.lineWidth = 3.2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // 1. Front-Facing Clenched Fist Contour (Seiken)
  ctx.beginPath();
  ctx.moveTo(-14, 18);
  ctx.lineTo(14, 18);
  ctx.lineTo(18, 10);
  ctx.lineTo(20, -2);
  ctx.arc(15, -9, 5.0, 0, Math.PI, true);
  ctx.arc(5, -12, 5.2, 0, Math.PI, true);
  ctx.arc(-5, -12, 5.2, 0, Math.PI, true);
  ctx.arc(-15, -9, 5.0, 0, Math.PI, true);
  ctx.lineTo(-20, -2);
  ctx.lineTo(-18, 10);
  ctx.lineTo(-14, 18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 2. Curled Finger Division Creases
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-10, -9); ctx.lineTo(-10, 3);
  ctx.moveTo(0, -12); ctx.lineTo(0, 3);
  ctx.moveTo(10, -9); ctx.lineTo(10, 3);
  ctx.moveTo(-15, -2); ctx.lineTo(15, -2);
  ctx.stroke();

  // 3. Thumb folded across lower front
  ctx.lineWidth = 3.0;
  ctx.beginPath();
  ctx.moveTo(-16, 10);
  ctx.quadraticCurveTo(-6, 13, 6, 9);
  ctx.quadraticCurveTo(9, 6, 7, 3);
  ctx.lineTo(-14, 3);
  ctx.closePath();
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.stroke();

  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(-5, 3);
  ctx.lineTo(-5, 9);
  ctx.stroke();

  ctx.restore();
}

/**
 * 002 태권당수 (Karate Chop): Iconic Gen 5 Blocky Karate Hand
 */
export function drawKarateChopEffect(ctx: any, target: { x: number; y: number }, step: number = 4) {
  ctx.save();

  const cx = target.x;
  const cy = target.y - 45;

  let handOy = -55;
  let isRedFlash = false;
  let showImpact = false;

  if (step === 1) {
    handOy = -58;
    isRedFlash = false;
  } else if (step === 2) {
    handOy = -44;
    isRedFlash = false;
  } else if (step === 3) {
    handOy = -76;
    isRedFlash = true;
  } else {
    handOy = -15;
    isRedFlash = false;
    showImpact = true;
  }

  const sprite = isRedFlash ? getKarateRedImg() : getKarateBlackImg();
  if (sprite) {
    ctx.save();
    ctx.translate(cx, cy + handOy);
    const sw = 80 * 1.15;
    const sh = 60 * 1.15;
    ctx.drawImage(sprite, -sw / 2, -sh / 2, sw, sh);
    ctx.restore();
  }

  if (showImpact) {
    ctx.save();
    const embers = [
      { ox: -30, oy: -20, r: 3.5, color: "#EA580C" },
      { ox: 25, oy: -35, r: 3.0, color: "#F97316" },
      { ox: 38, oy: -15, r: 4.0, color: "#FBBF24" },
      { ox: -40, oy: 10, r: 3.5, color: "#F97316" },
      { ox: -25, oy: 30, r: 3.0, color: "#EA580C" },
      { ox: 35, oy: 25, r: 4.0, color: "#FBBF24" },
      { ox: 0, oy: 38, r: 3.5, color: "#EA580C" },
      { ox: -10, oy: -45, r: 2.5, color: "#FDE047" },
    ];

    for (const eb of embers) {
      const px = cx + eb.ox;
      const py = cy + handOy + 15 + eb.oy;
      ctx.fillStyle = eb.color;
      ctx.beginPath();
      ctx.arc(px, py, eb.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 003 연속뺨치기 (Double Slap): Alternating Left/Right Slaps with Sparks
 */
export function drawDoubleSlapEffect(ctx: any, target: { x: number; y: number }, step: number = 1) {
  ctx.save();

  const isFade = (step % 2 === 0);
  const hitIndex = Math.floor((step - 1) / 2);
  const isLeft = (hitIndex % 2 === 0);

  const followOffset = isFade ? (isLeft ? 8 : -8) : 0;
  const handX = target.x + (isLeft ? -34 : 34) + followOffset;
  const handY = target.y - 25;
  const rotAngle = 0;
  const scaleX = isLeft ? 1 : -1;
  const alpha = isFade ? 0.32 : 1.0;

  const slapImg = getDoubleSlapWhiteImg();
  if (slapImg) {
    ctx.save();
    ctx.translate(handX, handY);
    ctx.scale(scaleX * 1.15, 1.15);
    ctx.rotate(rotAngle);
    ctx.globalAlpha = alpha;
    const sw = 80 * 1.15;
    const sh = 60 * 1.15;
    ctx.drawImage(slapImg, -sw / 2, -sh / 2, sw, sh);
    ctx.restore();
  }

  ctx.save();
  const sparkX = target.x + (isLeft ? -10 : 10) + (isFade ? (isLeft ? 6 : -6) : 0);
  const sparkY = target.y - 25;
  const starRadius = isFade ? 11 : 18;
  const starAlpha = isFade ? 0.38 : 1.0;

  ctx.globalAlpha = starAlpha;

  ctx.fillStyle = "#FACC15";
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sparkX, sparkY - starRadius);
  ctx.quadraticCurveTo(sparkX, sparkY, sparkX + starRadius, sparkY);
  ctx.quadraticCurveTo(sparkX, sparkY, sparkX, sparkY + starRadius);
  ctx.quadraticCurveTo(sparkX, sparkY, sparkX - starRadius, sparkY);
  ctx.quadraticCurveTo(sparkX, sparkY, sparkX, sparkY - starRadius);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  const innerR = starRadius * 0.5;
  ctx.beginPath();
  ctx.moveTo(sparkX, sparkY - innerR);
  ctx.quadraticCurveTo(sparkX, sparkY, sparkX + innerR, sparkY);
  ctx.quadraticCurveTo(sparkX, sparkY, sparkX, sparkY + innerR);
  ctx.quadraticCurveTo(sparkX, sparkY, sparkX - innerR, sparkY);
  ctx.quadraticCurveTo(sparkX, sparkY, sparkX, sparkY - innerR);
  ctx.closePath();
  ctx.fill();

  const sparkScale = isFade ? 1.4 : 1.0;
  const sparkDots = [
    { ox: -15 * sparkScale, oy: -14 * sparkScale, r: 2.5, c: "#FEF08A" },
    { ox: 16 * sparkScale, oy: -13 * sparkScale, r: 2.2, c: "#FACC15" },
    { ox: -13 * sparkScale, oy: 16 * sparkScale, r: 2.2, c: "#FACC15" },
    { ox: 15 * sparkScale, oy: 15 * sparkScale, r: 2.5, c: "#FEF08A" },
  ];
  for (const sd of sparkDots) {
    ctx.fillStyle = sd.c;
    ctx.beginPath();
    ctx.arc(sparkX + sd.ox, sparkY + sd.oy, isFade ? sd.r * 0.8 : sd.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.restore();
}

/**
 * 004 연속펀치 (Comet Punch): 3-hit Front Straight Punch Barrage
 */
export function drawCometPunchEffect(ctx: any, target: { x: number; y: number }, step: number = 1) {
  ctx.save();

  const isFade = (step % 2 === 0);
  const hitIndex = Math.floor((step - 1) / 2) % 3;

  const configs = [
    { ox: -12, oy: -20, scale: 0.55 },
    { ox: 12, oy: -26, scale: 0.58 },
    { ox: 0, oy: -24, scale: 0.62 },
  ];
  const cfg = configs[hitIndex];

  const fistX = target.x + cfg.ox;
  const fistY = target.y + cfg.oy + (isFade ? -3 : 0);
  const alpha = isFade ? 0.32 : 1.0;
  const currentScale = isFade ? cfg.scale * 1.08 : cfg.scale;

  ctx.save();
  ctx.translate(fistX, fistY);
  ctx.scale(currentScale, currentScale);
  ctx.globalAlpha = alpha;

  const fistImg = getCometPunchFistImg();
  if (fistImg) {
    const fw = fistImg.width;
    const fh = fistImg.height;
    ctx.drawImage(fistImg, -fw / 2, -fh / 2, fw, fh);
  } else {
    drawFrontStraightPunchFistSvg(ctx, 0, 0, 2.2, 1.0);
  }
  ctx.restore();

  ctx.save();
  const sparkX = fistX;
  const sparkY = fistY - 8;
  const starRadius = isFade ? 12 : 20;
  const starAlpha = isFade ? 0.38 : 1.0;

  ctx.globalAlpha = starAlpha;

  ctx.fillStyle = "#FACC15";
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sparkX, sparkY - starRadius);
  ctx.quadraticCurveTo(sparkX, sparkY, sparkX + starRadius, sparkY);
  ctx.quadraticCurveTo(sparkX, sparkY, sparkX, sparkY + starRadius);
  ctx.quadraticCurveTo(sparkX, sparkY, sparkX - starRadius, sparkY);
  ctx.quadraticCurveTo(sparkX, sparkY, sparkX, sparkY - starRadius);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  const innerR = starRadius * 0.5;
  ctx.beginPath();
  ctx.moveTo(sparkX, sparkY - innerR);
  ctx.quadraticCurveTo(sparkX, sparkY, sparkX + innerR, sparkY);
  ctx.quadraticCurveTo(sparkX, sparkY, sparkX, sparkY + innerR);
  ctx.quadraticCurveTo(sparkX, sparkY, sparkX - innerR, sparkY);
  ctx.quadraticCurveTo(sparkX, sparkY, sparkX, sparkY - innerR);
  ctx.closePath();
  ctx.fill();

  const sparkScale = isFade ? 1.4 : 1.0;
  const sparkDots = [
    { ox: -12 * sparkScale, oy: -11 * sparkScale, r: 2.5, c: "#FEF08A" },
    { ox: 13 * sparkScale, oy: -10 * sparkScale, r: 2.2, c: "#FACC15" },
    { ox: -10 * sparkScale, oy: 13 * sparkScale, r: 2.2, c: "#FACC15" },
    { ox: 12 * sparkScale, oy: 12 * sparkScale, r: 2.5, c: "#FEF08A" },
  ];
  for (const sd of sparkDots) {
    ctx.fillStyle = sd.c;
    ctx.beginPath();
    ctx.arc(sparkX + sd.ox, sparkY + sd.oy, isFade ? sd.r * 0.8 : sd.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.restore();
}
