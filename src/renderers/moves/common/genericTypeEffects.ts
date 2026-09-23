import { drawStarburstImpact, drawMiniRetroStar } from "./helpers.js";

/**
 * Sharp Comic Impact Starburst Polygon (날카로운 만화풍 충돌 섬광 스타버스트 💥)
 */
function drawSharpImpactBurst(
  ctx: any,
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  points: number = 8,
  fillColor: string = "#FFFFFF",
  strokeColor: string = "#FEF08A",
  lineWidth: number = 2.0,
  rotation: number = 0
) {
  ctx.save();
  ctx.translate(cx, cy);
  if (rotation !== 0) ctx.rotate(rotation);

  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "miter";
  ctx.miterLimit = 4;

  ctx.beginPath();
  const step = Math.PI / points;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const a = i * step - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  if (strokeColor && lineWidth > 0) ctx.stroke();
  ctx.restore();
}

/**
 * Helper to interpolate linear motion
 */
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

/**
 * 1. Solar Beam: Animated Gathering Orb -> Piercing Laser -> Colossal Blast -> Dissipating Plasma
 */
export function drawSolarBeamEffect(
  ctx: any,
  start: { x: number; y: number },
  target: { x: number; y: number },
  angle: number,
  dx: number,
  dy: number,
  progress: number = 0.8
) {
  ctx.save();
  ctx.fillStyle = `rgba(10, 25, 15, ${Math.min(0.35, progress * 0.4)})`;
  ctx.fillRect(0, 0, 560, 275);

  if (progress <= 0.35) {
    const p = progress / 0.35;
    const r = 8 + p * 20;
    const grad = ctx.createRadialGradient(start.x, start.y, 2, start.x, start.y, r);
    grad.addColorStop(0, "#FFFFFF");
    grad.addColorStop(0.5, "#86EFAC");
    grad.addColorStop(1, "rgba(34, 197, 94, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(start.x, start.y, r, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + p * 4;
      const dist = (1 - p) * 36 + 10;
      ctx.fillStyle = "#FEF08A";
      ctx.fillRect(start.x + Math.cos(a) * dist - 2, start.y + Math.sin(a) * dist - 2, 4, 4);
    }
  } else if (progress <= 0.70) {
    const p = (progress - 0.35) / 0.35;
    const curX = lerp(start.x, target.x, p);
    const curY = lerp(start.y, target.y, p);

    ctx.strokeStyle = "rgba(74, 222, 128, 0.6)";
    ctx.lineWidth = 18;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(curX, curY);
    ctx.stroke();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(curX, curY);
    ctx.stroke();

    drawStarburstImpact(ctx, curX, curY, "#4ADE80", "#FFFFFF", 24 * p);
  } else {
    const p = (progress - 0.70) / 0.30;
    const alpha = p > 0.6 ? 1 - (p - 0.6) / 0.4 : 1.0;
    ctx.globalAlpha = alpha;

    ctx.strokeStyle = "rgba(74, 222, 128, 0.45)";
    ctx.lineWidth = 34;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();

    ctx.strokeStyle = "#22C55E";
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();

    ctx.strokeStyle = "#86EFAC";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();

    const ringCount = 5;
    for (let i = 1; i <= ringCount; i++) {
      const t = (i / (ringCount + 1) + p * 0.4) % 1.0;
      const rx = start.x + dx * t;
      const ry = start.y + dy * t;
      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(angle);
      ctx.strokeStyle = "#FEF08A";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 18, Math.PI / 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    drawStarburstImpact(ctx, target.x, target.y, "#4ADE80", "#FFFFFF", 48 + p * 12);
  }
  ctx.restore();
}

/**
 * 2. Hyper Beam / Giga Impact: Destructive White/Gold Laser Cannon
 */
export function drawHyperBeamEffect(
  ctx: any,
  start: { x: number; y: number },
  target: { x: number; y: number },
  angle: number,
  dx: number,
  dy: number,
  progress: number = 0.8
) {
  ctx.save();
  ctx.fillStyle = `rgba(15, 10, 25, ${Math.min(0.5, progress * 0.6)})`;
  ctx.fillRect(0, 0, 560, 275);

  if (progress <= 0.35) {
    const p = progress / 0.35;
    const r = 10 + p * 22;
    ctx.fillStyle = "#18181B";
    ctx.beginPath();
    ctx.arc(start.x, start.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(start.x, start.y, r * 0.6, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    const p = (progress - 0.35) / 0.65;
    const beamW = p > 0.8 ? 38 * (1 - (p - 0.8) / 0.2) : 38;

    ctx.strokeStyle = "rgba(251, 191, 36, 0.5)";
    ctx.lineWidth = beamW;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();

    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = beamW * 0.65;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = beamW * 0.3;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();

    drawStarburstImpact(ctx, target.x, target.y, "#F59E0B", "#FFFFFF", 55 + p * 15);
  }
  ctx.restore();
}

/**
 * 3. Drain Moves: Swirling Life-Energy Orbs from Defender into Attacker
 */
export function drawDrainEffect(
  ctx: any,
  user: { x: number; y: number },
  target: { x: number; y: number },
  type: string,
  progress: number = 0.5
) {
  ctx.save();
  const orbColor = type === "fairy" ? "#F472B6" : (type === "bug" ? "#A3E635" : "#4ADE80");
  const glowColor = type === "fairy" ? "#FBCFE8" : "#DCFCE7";

  if (progress <= 0.35) {
    const p = progress / 0.35;
    drawStarburstImpact(ctx, target.x, target.y, orbColor, "#FFFFFF", 30 * p);
  } else if (progress <= 0.80) {
    const p = (progress - 0.35) / 0.45;
    const dx = user.x - target.x;
    const dy = user.y - target.y;

    for (let i = 0; i < 5; i++) {
      const orbT = Math.max(0, Math.min(1, p - i * 0.1));
      if (orbT <= 0 || orbT >= 1) continue;

      const curve = Math.sin(orbT * Math.PI * 2 + i) * 32;
      const ox = target.x + dx * orbT - (dy / Math.sqrt(dx * dx + dy * dy)) * curve;
      const oy = target.y + dy * orbT + (dx / Math.sqrt(dx * dx + dy * dy)) * curve;

      ctx.fillStyle = orbColor;
      ctx.beginPath();
      ctx.arc(ox, oy, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(ox, oy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    const p = (progress - 0.80) / 0.20;
    const userAura = ctx.createRadialGradient(user.x, user.y, 5, user.x, user.y, 45 * p);
    userAura.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    userAura.addColorStop(0.4, glowColor);
    userAura.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = userAura;
    ctx.beginPath();
    ctx.arc(user.x, user.y, 45 * p, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * 4. Electric: Crackling Sky Lightning Bolts + Pulsing Electric Cage
 */
export function drawElectricEffect(
  ctx: any,
  start: { x: number; y: number },
  target: { x: number; y: number },
  isSpecial: boolean,
  progress: number = 0.8
) {
  ctx.save();
  const tx = target.x;
  const ty = target.y;

  if (progress <= 0.35) {
    const p = progress / 0.35;
    for (let i = 0; i < 5; i++) {
      const sx = tx - 30 + i * 15;
      const sy = ty - 45 - Math.sin(p * Math.PI) * 10;
      ctx.fillStyle = "#FFE600";
      ctx.fillRect(sx, sy, 4, 4);
    }
  } else if (progress <= 0.70) {
    const segments = [
      { x: tx - 20, y: ty - 65 },
      { x: tx - 5,  y: ty - 40 },
      { x: tx - 22, y: ty - 20 },
      { x: tx + 8,  y: ty - 5 },
      { x: tx,      y: ty }
    ];

    ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
    ctx.lineWidth = 14;
    ctx.lineJoin = "miter";
    ctx.beginPath();
    ctx.moveTo(segments[0].x, segments[0].y);
    for (let i = 1; i < segments.length; i++) ctx.lineTo(segments[i].x, segments[i].y);
    ctx.stroke();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(segments[0].x, segments[0].y);
    for (let i = 1; i < segments.length; i++) ctx.lineTo(segments[i].x, segments[i].y);
    ctx.stroke();
  } else {
    const p = (progress - 0.70) / 0.30;
    const alpha = p > 0.6 ? 1 - (p - 0.6) / 0.4 : 1.0;
    ctx.globalAlpha = alpha;

    for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
      const r = 26 + Math.sin(p * Math.PI * 3) * 6;
      ctx.strokeStyle = "#FFE600";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(tx, ty, r, a, a + 0.8);
      ctx.stroke();
    }

    drawStarburstImpact(ctx, tx, ty, "#FFE600", "#FFFFFF", 44);
  }
  ctx.restore();
}

/**
 * 5. Fire: Fiery Blast Stream & Rising Inferno Column
 */
export function drawFireEffect(
  ctx: any,
  start: { x: number; y: number },
  target: { x: number; y: number },
  isSpecial: boolean,
  progress: number = 0.8
) {
  ctx.save();
  const dx = target.x - start.x;
  const dy = target.y - start.y;

  if (progress <= 0.40) {
    const p = progress / 0.40;
    for (let i = 0; i < 3; i++) {
      const trailT = Math.max(0, p - i * 0.08);
      const fx = start.x + dx * trailT;
      const fy = start.y + dy * trailT;
      const r = 12 + i * 4;

      const fGrad = ctx.createRadialGradient(fx, fy, 2, fx, fy, r);
      fGrad.addColorStop(0, "#FFFFFF");
      fGrad.addColorStop(0.3, "#FEF08A");
      fGrad.addColorStop(0.7, "#EA580C");
      fGrad.addColorStop(1, "rgba(220, 38, 38, 0)");
      ctx.fillStyle = fGrad;
      ctx.beginPath();
      ctx.arc(fx, fy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    const p = (progress - 0.40) / 0.60;
    const alpha = p > 0.7 ? 1 - (p - 0.7) / 0.3 : 1.0;
    ctx.globalAlpha = alpha;

    const flameH = 46 + p * 18;
    const flameW = 34 + p * 10;
    const flameGrad = ctx.createRadialGradient(target.x, target.y, 4, target.x, target.y - 12, flameH);
    flameGrad.addColorStop(0, "#FFFFFF");
    flameGrad.addColorStop(0.25, "#FDE047");
    flameGrad.addColorStop(0.65, "#EA580C");
    flameGrad.addColorStop(1, "rgba(185, 28, 28, 0)");
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.ellipse(target.x, target.y - 10, flameW, flameH, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 8; i++) {
      const ex = target.x - 24 + i * 6 + Math.sin(p * 5 + i) * 8;
      const ey = target.y - p * 35 - i * 4;
      ctx.fillStyle = "#FEF08A";
      ctx.fillRect(ex, ey, 3, 3);
    }

    drawStarburstImpact(ctx, target.x, target.y, "#EA580C", "#FEF08A", 36);
  }
  ctx.restore();
}

/**
 * 6. Water: High-Velocity Torrent Stream & Crashing Water Dome
 */
export function drawWaterEffect(
  ctx: any,
  start: { x: number; y: number },
  target: { x: number; y: number },
  isSpecial: boolean,
  progress: number = 0.8
) {
  ctx.save();
  const dx = target.x - start.x;
  const dy = target.y - start.y;

  if (progress <= 0.40) {
    const p = progress / 0.40;
    const curX = start.x + dx * p;
    const curY = start.y + dy * p;

    ctx.strokeStyle = "rgba(14, 165, 233, 0.5)";
    ctx.lineWidth = 24;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(curX, curY);
    ctx.stroke();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(curX, curY);
    ctx.stroke();
  } else {
    const p = (progress - 0.40) / 0.60;
    const alpha = p > 0.7 ? 1 - (p - 0.7) / 0.3 : 1.0;
    ctx.globalAlpha = alpha;

    const r = 32 + p * 18;
    const splashGrad = ctx.createRadialGradient(target.x, target.y, 4, target.x, target.y, r);
    splashGrad.addColorStop(0, "#FFFFFF");
    splashGrad.addColorStop(0.4, "#38BDF8");
    splashGrad.addColorStop(1, "rgba(2, 132, 199, 0)");
    ctx.fillStyle = splashGrad;
    ctx.beginPath();
    ctx.arc(target.x, target.y, r, 0, Math.PI * 2);
    ctx.fill();

    for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) {
      const dropDist = 28 + p * 24;
      const dropX = target.x + Math.cos(a) * dropDist;
      const dropY = target.y + Math.sin(a) * dropDist;
      ctx.fillStyle = "#E0F2FE";
      ctx.beginPath();
      ctx.arc(dropX, dropY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    drawStarburstImpact(ctx, target.x, target.y, "#0284C7", "#FFFFFF", 38);
  }
  ctx.restore();
}

/**
 * 7. Ice: Crystalline Snowflake Burst & Freezing Jagged Spires
 */
export function drawIceEffect(
  ctx: any,
  start: { x: number; y: number },
  target: { x: number; y: number },
  isSpecial: boolean,
  progress: number = 0.8
) {
  ctx.save();
  const tx = target.x;
  const ty = target.y;

  const spireCount = 4;
  for (let i = 0; i < spireCount; i++) {
    const spireH = Math.min(1.0, progress * 1.5) * (38 + (i % 2) * 16);
    const sx = tx - 24 + i * 16;
    const sy = ty + 18;

    ctx.fillStyle = "rgba(186, 230, 253, 0.88)";
    ctx.strokeStyle = "#0284C7";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + 8, sy - spireH);
    ctx.lineTo(sx + 16, sy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  if (progress > 0.5) {
    drawStarburstImpact(ctx, tx, ty - 6, "#38BDF8", "#FFFFFF", 36 * progress);
  }
  ctx.restore();
}

/**
 * 8. Physical Slash / Scratch: Crossing Dual-Blade Crescent Cut
 */
export function drawSlashEffect(
  ctx: any,
  target: { x: number; y: number },
  type: string = "normal",
  progress: number = 0.8
) {
  ctx.save();
  const glowColor = type === "dark" || type === "ghost" ? "rgba(168, 85, 247, 0.6)" : (type === "dragon" ? "rgba(20, 184, 166, 0.6)" : "rgba(239, 68, 68, 0.5)");
  const coreColor = type === "dark" ? "#C084FC" : "#FFFFFF";

  const slashLen = 65 * Math.min(1.0, progress * 1.4);
  
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(target.x + slashLen / 2, target.y - slashLen / 2);
  ctx.lineTo(target.x - slashLen / 2, target.y + slashLen / 2);
  ctx.stroke();

  ctx.strokeStyle = coreColor;
  ctx.lineWidth = 3.0;
  ctx.beginPath();
  ctx.moveTo(target.x + slashLen / 2, target.y - slashLen / 2);
  ctx.lineTo(target.x - slashLen / 2, target.y + slashLen / 2);
  ctx.stroke();

  if (progress > 0.4) {
    const p2 = (progress - 0.4) / 0.6;
    const len2 = 65 * p2;

    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(target.x - len2 / 2, target.y - len2 / 2);
    ctx.lineTo(target.x + len2 / 2, target.y + len2 / 2);
    ctx.stroke();

    ctx.strokeStyle = coreColor;
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(target.x - len2 / 2, target.y - len2 / 2);
    ctx.lineTo(target.x + len2 / 2, target.y + len2 / 2);
    ctx.stroke();

    drawStarburstImpact(ctx, target.x, target.y, "#FDE047", "#FFFFFF", 32);
  }
  ctx.restore();
}

/**
 * 9. Shadow Ball / Dark Pulse: Void Energy Orb & Shadow Burst
 */
export function drawShadowBallEffect(
  ctx: any,
  start: { x: number; y: number },
  target: { x: number; y: number },
  angle: number,
  progress: number = 0.8
) {
  ctx.save();
  const dx = target.x - start.x;
  const dy = target.y - start.y;

  if (progress <= 0.65) {
    const p = progress / 0.65;
    const bx = start.x + dx * p;
    const by = start.y + dy * p;
    const r = 16 + Math.sin(p * Math.PI) * 8;

    const ballGrad = ctx.createRadialGradient(bx, by, 3, bx, by, r);
    ballGrad.addColorStop(0, "#18181B");
    ballGrad.addColorStop(0.5, "#7E22CE");
    ballGrad.addColorStop(0.9, "#C084FC");
    ballGrad.addColorStop(1, "rgba(126, 34, 206, 0)");
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const p = (progress - 0.65) / 0.35;
    const r = 36 + p * 16;
    const hitGrad = ctx.createRadialGradient(target.x, target.y, 5, target.x, target.y, r);
    hitGrad.addColorStop(0, "#09090B");
    hitGrad.addColorStop(0.4, "#6B21A8");
    hitGrad.addColorStop(0.8, "#A855F7");
    hitGrad.addColorStop(1, "rgba(168, 85, 247, 0)");
    ctx.fillStyle = hitGrad;
    ctx.beginPath();
    ctx.arc(target.x, target.y, r, 0, Math.PI * 2);
    ctx.fill();

    drawStarburstImpact(ctx, target.x, target.y, "#9333EA", "#C084FC", 38);
  }
  ctx.restore();
}

/**
 * 10. Grass: Spinning Dual-Tone Leaf Whirlwind
 */
export function drawGrassEffect(
  ctx: any,
  start: { x: number; y: number },
  target: { x: number; y: number },
  progress: number = 0.8
) {
  ctx.save();
  const leafCount = 8;
  const vortexR = 26 + (1 - progress) * 20;

  for (let i = 0; i < leafCount; i++) {
    const a = (i / leafCount) * Math.PI * 2 + progress * Math.PI * 3;
    const lx = target.x + Math.cos(a) * vortexR;
    const ly = target.y + Math.sin(a) * (vortexR * 0.7);

    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(a + Math.PI / 4);
    ctx.fillStyle = i % 2 === 0 ? "#22C55E" : "#86EFAC";
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  drawStarburstImpact(ctx, target.x, target.y, "#4ADE80", "#FEF08A", 30 * progress);
  ctx.restore();
}

/**
 * 11. Psychic: Concentric Magenta/Violet Expanding Distortion Rings
 */
export function drawPsychicEffect(ctx: any, target: { x: number; y: number }, progress: number = 0.8) {
  ctx.save();
  const ringColors = ["rgba(244, 63, 94, 0.8)", "rgba(192, 132, 252, 0.7)", "rgba(244, 114, 182, 0.6)"];
  for (let i = 0; i < 3; i++) {
    const r = (16 + i * 14) * (0.6 + progress * 0.6);
    ctx.strokeStyle = ringColors[i];
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(target.x, target.y, r, r * 0.65, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * 12. Poison: Toxic Purple Bubbling Acidic Blast
 */
export function drawPoisonEffect(
  ctx: any,
  start: { x: number; y: number },
  target: { x: number; y: number },
  progress: number = 0.8
) {
  ctx.save();
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const dist = 18 + progress * 20;
    const px = target.x + Math.cos(a) * dist;
    const py = target.y + Math.sin(a) * (dist * 0.8) - progress * 14;
    const r = 6 + (i % 3) * 3;

    const pGrad = ctx.createRadialGradient(px, py, 2, px, py, r);
    pGrad.addColorStop(0, "#E9D5FF");
    pGrad.addColorStop(0.6, "#A855F7");
    pGrad.addColorStop(1, "#581C87");
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
  drawStarburstImpact(ctx, target.x, target.y, "#A855F7", "#F3E8FF", 32);
  ctx.restore();
}

/**
 * 13. Rock / Ground: Crashing Boulders & Ground Dust
 */
export function drawRockGroundEffect(ctx: any, target: { x: number; y: number }, progress: number = 0.8) {
  ctx.save();
  const fallY = (1 - progress) * -45;
  const rockColors = ["#78716C", "#A8A29E", "#57534E"];
  for (let i = 0; i < 4; i++) {
    const rx = target.x - 24 + i * 16;
    const ry = target.y + fallY + (i % 2) * 8;
    ctx.fillStyle = rockColors[i % 3];
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + 12, ry - 14);
    ctx.lineTo(rx + 16, ry + 2);
    ctx.closePath();
    ctx.fill();
  }
  if (progress > 0.5) {
    ctx.strokeStyle = "#A16207";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(target.x, target.y + 15, 36, 14, 0, 0, Math.PI * 2);
    ctx.stroke();
    drawStarburstImpact(ctx, target.x, target.y, "#D97706", "#FEF3C7", 34);
  }
  ctx.restore();
}

/**
 * 14. Flying: Sharp Sky-Blue Crescent Wind Blades
 */
export function drawFlyingEffect(ctx: any, target: { x: number; y: number }, progress: number = 0.8) {
  ctx.save();
  for (let i = 0; i < 3; i++) {
    const offsetP = (progress + i * 0.25) % 1.0;
    const fx = target.x - 30 + offsetP * 60;
    const fy = target.y - 20 + i * 14;
    ctx.strokeStyle = "#38BDF8";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(fx, fy, 22, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();
  }
  drawStarburstImpact(ctx, target.x, target.y, "#BAE6FD", "#FFFFFF", 30);
  ctx.restore();
}

/**
 * 15. Ghost / Dark: Shadow Wave
 */
export function drawGhostDarkEffect(ctx: any, target: { x: number; y: number }, progress: number = 0.8) {
  ctx.save();
  const r = 26 + progress * 16;
  const shadowGrad = ctx.createRadialGradient(target.x, target.y, 4, target.x, target.y, r);
  shadowGrad.addColorStop(0, "#1E1B4B");
  shadowGrad.addColorStop(0.5, "#6B21A8");
  shadowGrad.addColorStop(1, "rgba(59, 7, 100, 0)");
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.arc(target.x, target.y, r, 0, Math.PI * 2);
  ctx.fill();

  drawStarburstImpact(ctx, target.x, target.y, "#7E22CE", "#C084FC", 36);
  ctx.restore();
}

/**
 * 16. Dragon: Mystic Cyan/Teal Dragon Breath
 */
export function drawDragonEffect(
  ctx: any,
  start: { x: number; y: number },
  target: { x: number; y: number },
  progress: number = 0.8
) {
  ctx.save();
  const r = 28 + progress * 16;
  drawStarburstImpact(ctx, target.x, target.y, "#0D9488", "#2DD4BF", r);
  ctx.restore();
}

/**
 * 17. Steel: Metallic Sheen Gleam & Impact Ping
 */
export function drawSteelEffect(ctx: any, target: { x: number; y: number }, progress: number = 0.8) {
  ctx.save();
  drawStarburstImpact(ctx, target.x, target.y, "#94A3B8", "#FFFFFF", 32 + progress * 10);
  ctx.restore();
}

/**
 * 18. Fairy: Pink Starburst & Sparkling Moon Dust
 */
export function drawFairyEffect(ctx: any, target: { x: number; y: number }, progress: number = 0.8) {
  ctx.save();
  drawStarburstImpact(ctx, target.x, target.y, "#EC4899", "#FDE047", 34 + progress * 8);
  ctx.restore();
}

/**
 * 19. Bite / Fang Clamping Effect (5th Gen Official Interlocking Serrated Jaws)
 * Fully animated: Opens wide -> snaps shut -> interlocks tightly -> crunches!
 */
export function drawBiteEffect(
  ctx: any,
  target: { x: number; y: number },
  type: string = "normal",
  progress: number = 0.8
) {
  ctx.save();
  const tx = target.x;
  const ty = target.y;

  const fangColor = type === "dark" || type === "ghost" ? "#E2E8F0" : (type === "fire" ? "#FED7AA" : (type === "ice" ? "#BAE6FD" : (type === "electric" ? "#FEF08A" : "#FFFFFF")));
  const outlineColor = "#0F172A";

  let gap = 0;
  let alpha = 1.0;
  let scale = 1.0;

  if (progress <= 0.35) {
    const p = progress / 0.35;
    gap = lerp(48, 28, p);
    alpha = lerp(0.6, 1.0, p);
    scale = 0.85;
  } else if (progress <= 0.70) {
    const p = (progress - 0.35) / 0.35;
    gap = lerp(28, 0, p);
    alpha = 1.0;
    scale = 1.0;
  } else {
    const p = (progress - 0.70) / 0.30;
    gap = 0;
    alpha = p > 0.5 ? 1.0 - (p - 0.5) / 0.5 : 1.0;
    scale = 1.0 + p * 0.08;
  }

  ctx.globalAlpha = alpha;
  ctx.fillStyle = fangColor;
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 2.0;

  // Upper Jaw (가로로 길고 위아래로는 얇은 상악)
  ctx.save();
  ctx.translate(tx, ty - gap);
  ctx.scale(scale, scale);
  ctx.lineJoin = "miter";
  ctx.miterLimit = 4;
  ctx.beginPath();
  const w = 56;
  ctx.moveTo(-w, -2);
  ctx.quadraticCurveTo(0, -14, w, -2);
  const topTeeth = [
    { x: 48, y: 5 }, { x: 40, y: -3 },
    { x: 30, y: 9.5 }, { x: 21, y: -3 },
    { x: 11, y: 7 }, { x: 0, y: -2 },
    { x: -11, y: 7 }, { x: -21, y: -3 },
    { x: -30, y: 9.5 }, { x: -40, y: -3 },
    { x: -48, y: 5 }, { x: -w, y: -2 },
  ];
  for (const pt of topTeeth) ctx.lineTo(pt.x, pt.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Lower Jaw (상악과 맞물리는 가로로 길고 얇은 하악)
  ctx.save();
  ctx.translate(tx, ty + gap);
  ctx.scale(scale, scale);
  ctx.lineJoin = "miter";
  ctx.miterLimit = 4;
  ctx.beginPath();
  ctx.moveTo(w, 2);
  ctx.quadraticCurveTo(0, 14, -w, 2);
  const btmTeeth = [
    { x: -50, y: -4 }, { x: -44, y: 3 },
    { x: -37, y: -9.5 }, { x: -28, y: 3 },
    { x: -19, y: -7 }, { x: -9, y: 2 },
    { x: 0, y: -8 }, { x: 9, y: 2 },
    { x: 19, y: -7 }, { x: 28, y: 3 },
    { x: 37, y: -9.5 }, { x: 44, y: 3 },
    { x: 50, y: -4 }, { x: w, y: 2 },
  ];
  for (const pt of btmTeeth) ctx.lineTo(pt.x, pt.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/**
 * 20. Needle Barrage / Quill Projectiles
 */
export function drawNeedleBarrageEffect(
  ctx: any,
  start: { x: number; y: number },
  target: { x: number; y: number },
  progress: number = 0.5,
  color: string = "#A855F7"
) {
  ctx.save();
  const dx = target.x - start.x;
  const dy = target.y - start.y;
  const angle = Math.atan2(dy, dx);

  const needleCount = 3;
  for (let i = 0; i < needleCount; i++) {
    const curP = Math.max(0, Math.min(1, progress * 1.25 - i * 0.15));
    if (curP <= 0) continue;

    const curX = start.x + dx * curP;
    const curY = start.y + dy * curP;

    if (curP < 1.0) {
      ctx.save();
      ctx.translate(curX, curY);
      ctx.rotate(angle);

      const trailGrad = ctx.createLinearGradient(-32, 0, 8, 0);
      trailGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
      trailGrad.addColorStop(0.6, color);
      trailGrad.addColorStop(1, "#FFFFFF");

      ctx.strokeStyle = trailGrad;
      ctx.lineWidth = 4.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-32, 0);
      ctx.lineTo(8, 0);
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-4, -4);
      ctx.lineTo(-4, 4);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    } else {
      drawStarburstImpact(ctx, target.x - 12 + i * 12, target.y - 8 + (i % 2) * 12, color, "#FFFFFF", 20);

      ctx.fillStyle = "rgba(192, 132, 252, 0.75)";
      ctx.beginPath();
      ctx.arc(target.x - 10 + i * 10, target.y - 18 - (i % 2) * 8, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/**
 * 21. Surf: Towering Blue Tidal Wave Rolling Across Battlefield
 */
export function drawSurfWaveEffect(
  ctx: any,
  target: { x: number; y: number },
  progress: number = 0.5
) {
  ctx.save();
  const p = Math.max(0, Math.min(1, progress));
  const waveX = lerp(target.x - 160, target.x + 20, p);
  const waveH = 48 + Math.sin(p * Math.PI) * 28;

  const waveGrad = ctx.createLinearGradient(waveX - 40, target.y, waveX + 30, target.y - waveH);
  waveGrad.addColorStop(0, "rgba(2, 132, 199, 0.2)");
  waveGrad.addColorStop(0.5, "#0284C7");
  waveGrad.addColorStop(0.85, "#38BDF8");
  waveGrad.addColorStop(1, "#FFFFFF");

  ctx.fillStyle = waveGrad;
  ctx.beginPath();
  ctx.moveTo(waveX - 80, target.y + 24);
  ctx.quadraticCurveTo(waveX - 20, target.y - waveH, waveX + 30, target.y - waveH * 0.7);
  ctx.quadraticCurveTo(waveX + 50, target.y - waveH * 0.3, waveX + 30, target.y + 24);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 4.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(waveX + 24, target.y - waveH * 0.7, 14, -Math.PI / 2, Math.PI / 3);
  ctx.stroke();

  if (p > 0.6) {
    drawStarburstImpact(ctx, target.x, target.y, "#38BDF8", "#FFFFFF", 42 * (p - 0.5));
  }
  ctx.restore();
}

/**
 * 22. Earthquake: Splitting Ground Fissure & Erupting Rock Spires
 */
export function drawEarthquakeFissureEffect(
  ctx: any,
  target: { x: number; y: number },
  progress: number = 0.8
) {
  ctx.save();
  const p = Math.max(0, Math.min(1, progress));
  const fissureW = lerp(30, 140, p);

  ctx.strokeStyle = "#451A03";
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(target.x - fissureW / 2, target.y + 16);
  ctx.lineTo(target.x - fissureW / 4, target.y + 22);
  ctx.lineTo(target.x, target.y + 15);
  ctx.lineTo(target.x + fissureW / 4, target.y + 24);
  ctx.lineTo(target.x + fissureW / 2, target.y + 17);
  ctx.stroke();

  const rockH = 28 * p;
  ctx.fillStyle = "#78350F";
  ctx.strokeStyle = "#FDE68A";
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(target.x - 18, target.y + 16);
  ctx.lineTo(target.x - 8, target.y + 16 - rockH);
  ctx.lineTo(target.x + 2, target.y + 16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(target.x + 4, target.y + 18);
  ctx.lineTo(target.x + 16, target.y + 18 - rockH * 1.2);
  ctx.lineTo(target.x + 28, target.y + 18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (p > 0.4) {
    drawStarburstImpact(ctx, target.x, target.y, "#D97706", "#FEF3C7", 40);
  }
  ctx.restore();
}

/**
 * 23. Punch Impact (Fist Blast)
 */
export function drawPunchImpactEffect(
  ctx: any,
  target: { x: number; y: number },
  type: string = "normal",
  progress: number = 0.8
) {
  ctx.save();
  const color = type === "fighting" ? "#DC2626" : (type === "fire" ? "#EA580C" : (type === "ice" ? "#0284C7" : (type === "electric" ? "#EAB308" : "#F59E0B")));
  
  const fistOx = (1 - Math.min(1.0, progress * 1.3)) * -32;
  const punchScale = 0.8 + progress * 0.4;

  ctx.save();
  ctx.translate(target.x + fistOx, target.y);
  ctx.scale(punchScale, punchScale);

  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.0;
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  if (progress > 0.5) {
    drawStarburstImpact(ctx, target.x, target.y, color, "#FFFFFF", 40);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.arc(target.x, target.y, 28 * progress, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * 24. Kick Impact (Foot Strike)
 */
export function drawKickImpactEffect(
  ctx: any,
  target: { x: number; y: number },
  type: string = "fighting",
  progress: number = 0.8
) {
  ctx.save();
  const color = type === "fighting" ? "#DC2626" : (type === "fire" ? "#EA580C" : "#F59E0B");

  const arcLen = Math.PI * Math.min(1.0, progress * 1.3);
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 4.0;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(target.x, target.y, 26, -Math.PI / 2, -Math.PI / 2 + arcLen);
  ctx.stroke();

  if (progress > 0.5) {
    drawStarburstImpact(ctx, target.x, target.y, color, "#FEF08A", 38);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(target.x, target.y + 18, 32 * progress, 12 * progress, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * 25. Leer / Glare (Intimidating Eye Laser Beams)
 */
export function drawLeerGlareEffect(
  ctx: any,
  start: { x: number; y: number },
  target: { x: number; y: number },
  progress: number = 1.0
) {
  ctx.save();
  const midY = (start.y + target.y) / 2;
  ctx.fillStyle = "rgba(15, 23, 42, 0.45)";
  ctx.fillRect(0, midY - 30, 560, 60);

  const curTargetX = lerp(start.x, target.x, Math.min(1.0, progress * 1.5));
  const curTargetY = lerp(start.y, target.y, Math.min(1.0, progress * 1.5));

  const eyeOffsets = [-8, 8];
  for (const ey of eyeOffsets) {
    const y1 = start.y + ey - 10;
    const y2 = curTargetY + ey - 10;

    const grad = ctx.createLinearGradient(start.x, y1, curTargetX, y2);
    grad.addColorStop(0, "rgba(239, 68, 68, 0.2)");
    grad.addColorStop(0.3, "#DC2626");
    grad.addColorStop(0.7, "#FDE047");
    grad.addColorStop(1, "#FFFFFF");

    ctx.strokeStyle = grad;
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(start.x, y1);
    ctx.lineTo(curTargetX, y2);
    ctx.stroke();
  }

  if (progress > 0.6) {
    drawStarburstImpact(ctx, target.x, target.y - 10, "#DC2626", "#FEF08A", 28);
  }
  ctx.restore();
}

/**
 * 26. Sound Wave (Growl, Screech, Hyper Voice, Roar)
 */
export function drawSoundWaveEffect(
  ctx: any,
  start: { x: number; y: number },
  target: { x: number; y: number },
  progress: number = 0.5
) {
  ctx.save();
  const dx = target.x - start.x;
  const dy = target.y - start.y;
  const angle = Math.atan2(dy, dx);

  const waveCount = 3;
  for (let i = 0; i < waveCount; i++) {
    const curP = Math.max(0, Math.min(1, progress - i * 0.2));
    if (curP <= 0 || curP >= 1) continue;

    const wx = start.x + dx * curP;
    const wy = start.y + dy * curP;
    const radius = 16 + curP * 26;

    ctx.save();
    ctx.translate(wx, wy);
    ctx.rotate(angle);

    ctx.strokeStyle = "rgba(245, 158, 11, 0.45)";
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(0, 0, radius, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();

    ctx.strokeStyle = "#FEF08A";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(0, 0, radius - 2, -Math.PI / 3.2, Math.PI / 3.2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

/**
 * Default Physical Impact (Tackle, Pound, Quick Attack, Slam)
 * Authentic Gen 5 Normal-Type Physical Strike:
 * - Pure white flash core with warm cream halo
 * - Dual stylized manga/anime collision brackets ) (
 * - Classic 4-pointed diamond hit sparks flying outward
 * - Expanding compression shockwave ring
 * - Soft ground dust puffs popping at base level
 */
export function drawPhysicalImpactEffect(
  ctx: any,
  target: { x: number; y: number },
  progress: number = 0.8
) {
  const tx = target.x;
  const ty = target.y;
  const p = Math.max(0, Math.min(1, progress));

  ctx.save();

  // 1. 순백 중심 섬광 코어 (Central Impact Flash Core)
  const flashAlpha = Math.max(0, 1.0 - p * 0.75);
  if (flashAlpha > 0.05) {
    const coreR = 22 + (1.0 - p) * 14;
    const grad = ctx.createRadialGradient(tx, ty, 2, tx, ty, coreR);
    grad.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha})`);
    grad.addColorStop(0.35, `rgba(254, 240, 138, ${flashAlpha * 0.9})`);
    grad.addColorStop(0.75, `rgba(253, 224, 71, ${flashAlpha * 0.4})`);
    grad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(tx, ty, coreR, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. 날카로운 정통 충돌 스타버스트 💥 (Sharp Comic Impact Starburst)
  const burstAlpha = Math.max(0, 1.0 - p * 0.85);
  if (burstAlpha > 0.05) {
    const outerR = 18 + p * 16;
    const innerR = outerR * 0.44;
    drawSharpImpactBurst(
      ctx,
      tx,
      ty,
      outerR,
      innerR,
      8,
      `rgba(255, 255, 255, ${burstAlpha})`,
      `rgba(253, 224, 71, ${burstAlpha * 0.95})`,
      2.4,
      p * 0.35
    );
  }

  // 3. 순백 고속 팽창 충격파 링 (Expanding Shockwave Ring)
  const ringAlpha = Math.max(0, 1.0 - p * 0.9);
  if (ringAlpha > 0.05) {
    const rx = 14 + p * 26;
    const ry = rx * 0.72;
    ctx.strokeStyle = `rgba(255, 255, 255, ${ringAlpha})`;
    ctx.lineWidth = 2.8 * (1.0 - p * 0.3);
    ctx.beginPath();
    ctx.ellipse(tx, ty, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(254, 240, 138, ${ringAlpha * 0.6})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(tx, ty, rx + 3, ry + 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 4. 사방 비산 4방향 레트로 별빛 스파크 (Flying Mini Retro Hit Stars)
  const starAlpha = Math.max(0, 1.0 - p * 0.75);
  if (starAlpha > 0.05) {
    const starAngles = [-0.65, 0.45, 1.75, 2.85, -2.15, -1.25];
    for (let i = 0; i < starAngles.length; i++) {
      const a = starAngles[i];
      const dist = 10 + p * (22 + (i % 3) * 8);
      const sx = tx + Math.cos(a) * dist;
      const sy = ty + Math.sin(a) * (dist * 0.85);
      const sz = (10 - p * 3) * (i % 2 === 0 ? 1.0 : 0.75);
      ctx.globalAlpha = starAlpha;
      drawMiniRetroStar(
        ctx,
        sx,
        sy,
        sz,
        i % 2 === 0 ? "#FFFFFF" : "#FEF08A",
        a + p * 1.5
      );
      ctx.globalAlpha = 1.0;
    }
  }

  ctx.restore();
}

