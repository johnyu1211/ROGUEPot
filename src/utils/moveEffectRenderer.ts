import { loadImage } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";

let karateBlackImg: any = null;
let karateRedImg: any = null;
let doubleSlapWhiteImg: any = null;
let cometPunchFistImg: any = null;

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
      if (fs.existsSync(pPath)) cometPunchFistImg = await loadImage(pPath);
    }
  } catch (err) {
    // Ignore asset load errors
  }
}
// Initial eager load
preloadMoveAssets();

export interface MoveEffectInfo {
  moveKey: string;
  moveName?: string;
  type: string;
  isSpecial: boolean;
  isPlayerAttacking: boolean;
  step?: number;
}

export function renderMoveEffect(
  ctx: any,
  info: MoveEffectInfo
) {
  const isPlayer = info.isPlayerAttacking;
  const moveKey = info.moveKey.toLowerCase().replace(/[\s_]+/g, "-");
  const type = (info.type || "normal").toLowerCase();

  // Attacker & Target Anchor Points (Logical 560x380 coordinates)
  const playerPos = { x: 175, y: 220 };
  const enemyPos = { x: 418, y: 135 };

  const startPos = isPlayer ? playerPos : enemyPos;
  const targetPos = isPlayer ? enemyPos : playerPos;

  const dx = targetPos.x - startPos.x;
  const dy = targetPos.y - startPos.y;
  const angle = Math.atan2(dy, dx);

  ctx.save();

  // 1. SPECIFIC SIGNATURE MOVES FIRST (Moves 001 ~ 008)
  if (moveKey === "karate-chop" || moveKey === "karatechop") {
    drawKarateChopEffect(ctx, targetPos, info.step ?? 4);
  } else if (moveKey === "double-slap" || moveKey === "doubleslap") {
    drawDoubleSlapEffect(ctx, targetPos, info.step ?? 1);
  } else if (moveKey === "comet-punch" || moveKey === "cometpunch") {
    drawCometPunchEffect(ctx, targetPos, info.step ?? 1);
  } else if (moveKey === "mega-punch" || moveKey === "megapunch") {
    drawMegaPunchEffect(ctx, targetPos, info.step ?? 1);
  } else if (moveKey === "pay-day" || moveKey === "payday") {
    drawPayDayEffect(ctx, targetPos, info.step ?? 1);
  } else if (moveKey === "fire-punch" || moveKey === "firepunch") {
    drawFirePunchEffect(ctx, targetPos, info.step ?? 1);
  } else if (moveKey === "ice-punch" || moveKey === "icepunch") {
    drawIcePunchEffect(ctx, targetPos, info.step ?? 1);
  } else if (moveKey === "solar-beam" || moveKey === "solar-blade") {
    drawSolarBeamEffect(ctx, startPos, targetPos, angle, dx, dy);
  } else if (moveKey === "mega-drain" || moveKey === "giga-drain" || moveKey === "absorb" || moveKey === "leech-life" || moveKey === "draining-kiss") {
    drawDrainEffect(ctx, startPos, targetPos, type);
  } else if (moveKey === "hyper-beam" || moveKey === "giga-impact") {
    drawHyperBeamEffect(ctx, startPos, targetPos, angle, dx, dy);
  } else if (moveKey === "shadow-ball" || moveKey === "dark-pulse") {
    drawShadowBallEffect(ctx, startPos, targetPos, angle);
  } else if (moveKey === "thunderbolt" || moveKey === "thunder" || moveKey === "spark" || type === "electric") {
    drawElectricEffect(ctx, startPos, targetPos, info.isSpecial);
  } else if (moveKey === "flamethrower" || moveKey === "fire-blast" || moveKey === "ember" || type === "fire") {
    drawFireEffect(ctx, startPos, targetPos, info.isSpecial);
  } else if (moveKey === "water-gun" || moveKey === "hydro-pump" || moveKey === "surf" || moveKey === "bubble-beam" || type === "water") {
    drawWaterEffect(ctx, startPos, targetPos, info.isSpecial);
  } else if (moveKey === "ice-beam" || moveKey === "blizzard" || type === "ice") {
    drawIceEffect(ctx, startPos, targetPos, info.isSpecial);
  } else if (moveKey === "slash" || moveKey === "scratch" || moveKey === "fury-swipes" || moveKey === "night-slash" || moveKey === "dragon-claw" || moveKey === "shadow-claw") {
    drawSlashEffect(ctx, targetPos, type);
  } else if (type === "grass") {
    drawGrassEffect(ctx, startPos, targetPos);
  } else if (type === "psychic") {
    drawPsychicEffect(ctx, targetPos);
  } else if (type === "poison") {
    drawPoisonEffect(ctx, startPos, targetPos);
  } else if (type === "ground" || type === "rock") {
    drawRockGroundEffect(ctx, targetPos);
  } else if (type === "flying") {
    drawFlyingEffect(ctx, targetPos);
  } else if (type === "ghost" || type === "dark") {
    drawGhostDarkEffect(ctx, targetPos);
  } else if (type === "dragon") {
    drawDragonEffect(ctx, startPos, targetPos);
  } else if (type === "steel") {
    drawSteelEffect(ctx, targetPos);
  } else if (type === "fairy") {
    drawFairyEffect(ctx, targetPos);
  } else {
    // Default Physical Strike (Tackle, Pound, Quick Attack, Slam)
    drawPhysicalImpactEffect(ctx, targetPos);
  }

  ctx.restore();
}

/**
 * 1. Solar Beam: Massive Glowing Emerald Laser + Orbiting Rings + Starburst Blast
 */
function drawSolarBeamEffect(ctx: any, start: { x: number; y: number }, target: { x: number; y: number }, angle: number, dx: number, dy: number) {
  ctx.fillStyle = "rgba(10, 25, 15, 0.28)";
  ctx.fillRect(0, 0, 560, 275);

  ctx.strokeStyle = "rgba(74, 222, 128, 0.45)";
  ctx.lineWidth = 32;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(target.x, target.y);
  ctx.stroke();

  ctx.strokeStyle = "#22C55E";
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(target.x, target.y);
  ctx.stroke();

  ctx.strokeStyle = "#86EFAC";
  ctx.lineWidth = 10;
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
    const t = i / (ringCount + 1);
    const rx = start.x + dx * t;
    const ry = start.y + dy * t;
    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(angle);
    ctx.strokeStyle = "#FEF08A";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 16, Math.PI / 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  const muzzle = ctx.createRadialGradient(start.x, start.y, 2, start.x, start.y, 32);
  muzzle.addColorStop(0, "#FFFFFF");
  muzzle.addColorStop(0.4, "#86EFAC");
  muzzle.addColorStop(1, "rgba(34, 197, 94, 0)");
  ctx.fillStyle = muzzle;
  ctx.beginPath();
  ctx.arc(start.x, start.y, 32, 0, Math.PI * 2);
  ctx.fill();

  drawStarburstImpact(ctx, target.x, target.y, "#4ADE80", "#FEF08A");
}

/**
 * 2. Drain Moves: Swirling Life-Energy Orbs from Defender into Attacker
 */
function drawDrainEffect(ctx: any, user: { x: number; y: number }, target: { x: number; y: number }, type: string) {
  const orbColor = type === "fairy" ? "#F472B6" : (type === "bug" ? "#A3E635" : "#4ADE80");
  const glowColor = type === "fairy" ? "#FBCFE8" : "#DCFCE7";

  const targetGrad = ctx.createRadialGradient(target.x, target.y, 5, target.x, target.y, 35);
  targetGrad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
  targetGrad.addColorStop(0.5, orbColor);
  targetGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = targetGrad;
  ctx.beginPath();
  ctx.arc(target.x, target.y, 35, 0, Math.PI * 2);
  ctx.fill();

  const dx = user.x - target.x;
  const dy = user.y - target.y;

  for (let i = 0; i < 6; i++) {
    const t = (i + 1) / 7;
    const curve = Math.sin(t * Math.PI) * ((i % 2 === 0 ? 1 : -1) * 35);
    const ox = target.x + dx * t - (dy / Math.sqrt(dx * dx + dy * dy)) * curve;
    const oy = target.y + dy * t + (dx / Math.sqrt(dx * dx + dy * dy)) * curve;

    ctx.fillStyle = orbColor;
    ctx.beginPath();
    ctx.arc(ox, oy, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(ox, oy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const userAura = ctx.createRadialGradient(user.x, user.y, 5, user.x, user.y, 40);
  userAura.addColorStop(0, "rgba(255, 255, 255, 0.8)");
  userAura.addColorStop(0.4, glowColor);
  userAura.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = userAura;
  ctx.beginPath();
  ctx.arc(user.x, user.y, 40, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * 3. Hyper Beam / Giga Impact: Destructive White/Gold Laser Cannon
 */
function drawHyperBeamEffect(ctx: any, start: { x: number; y: number }, target: { x: number; y: number }, angle: number, dx: number, dy: number) {
  ctx.fillStyle = "rgba(15, 10, 25, 0.4)";
  ctx.fillRect(0, 0, 560, 275);

  ctx.strokeStyle = "rgba(251, 191, 36, 0.5)";
  ctx.lineWidth = 36;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(target.x, target.y);
  ctx.stroke();

  ctx.strokeStyle = "#F59E0B";
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(target.x, target.y);
  ctx.stroke();

  ctx.strokeStyle = "#FEF08A";
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(target.x, target.y);
  ctx.stroke();

  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(target.x, target.y);
  ctx.stroke();

  drawStarburstImpact(ctx, target.x, target.y, "#F59E0B", "#FFFFFF", 55);
}

/**
 * 4. Electric: Sharp Jagged Branching Lightning Bolts + Sparks
 */
function drawElectricEffect(ctx: any, start: { x: number; y: number }, target: { x: number; y: number }, isSpecial: boolean) {
  const topY = Math.min(start.y, target.y) - 40;
  const segments = [
    { x: target.x - 25, y: topY },
    { x: target.x - 5, y: topY + 30 },
    { x: target.x - 20, y: topY + 50 },
    { x: target.x + 10, y: topY + 80 },
    { x: target.x, y: target.y }
  ];

  ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
  ctx.lineWidth = 14;
  ctx.lineJoin = "miter";
  ctx.beginPath();
  ctx.moveTo(segments[0].x, segments[0].y);
  for (let i = 1; i < segments.length; i++) ctx.lineTo(segments[i].x, segments[i].y);
  ctx.stroke();

  ctx.strokeStyle = "#FFE600";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(segments[0].x, segments[0].y);
  for (let i = 1; i < segments.length; i++) ctx.lineTo(segments[i].x, segments[i].y);
  ctx.stroke();

  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(segments[0].x, segments[0].y);
  for (let i = 1; i < segments.length; i++) ctx.lineTo(segments[i].x, segments[i].y);
  ctx.stroke();

  for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
    const r = 24 + (a % 2) * 12;
    const sx = target.x + Math.cos(a) * r;
    const sy = target.y + Math.sin(a) * r;
    ctx.fillStyle = "#FFE600";
    ctx.fillRect(sx - 2, sy - 2, 5, 5);
  }

  drawStarburstImpact(ctx, target.x, target.y, "#FFE600", "#38BDF8", 38);
}

/**
 * 5. Fire: Fiery Blast Stream & Rising Flame Pillar
 */
function drawFireEffect(ctx: any, start: { x: number; y: number }, target: { x: number; y: number }, isSpecial: boolean) {
  const dx = target.x - start.x;
  const dy = target.y - start.y;
  for (let i = 1; i <= 3; i++) {
    const t = i / 3.5;
    const fx = start.x + dx * t;
    const fy = start.y + dy * t;
    const fGrad = ctx.createRadialGradient(fx, fy, 2, fx, fy, 16 + i * 4);
    fGrad.addColorStop(0, "#FEF08A");
    fGrad.addColorStop(0.4, "#F97316");
    fGrad.addColorStop(1, "rgba(220, 38, 38, 0)");
    ctx.fillStyle = fGrad;
    ctx.beginPath();
    ctx.arc(fx, fy, 16 + i * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  const flameGrad = ctx.createRadialGradient(target.x, target.y, 4, target.x, target.y - 10, 42);
  flameGrad.addColorStop(0, "#FFFFFF");
  flameGrad.addColorStop(0.25, "#FDE047");
  flameGrad.addColorStop(0.65, "#EA580C");
  flameGrad.addColorStop(1, "rgba(185, 28, 28, 0)");
  ctx.fillStyle = flameGrad;
  ctx.beginPath();
  ctx.ellipse(target.x, target.y - 8, 36, 48, 0, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 7; i++) {
    const ex = target.x - 20 + Math.random() * 40;
    const ey = target.y - 10 - Math.random() * 40;
    ctx.fillStyle = "#FEF08A";
    ctx.fillRect(ex, ey, 3, 3);
  }
}

/**
 * 6. Water: High-Velocity Cyan/Blue Torrent + Foam & Splash Droplets
 */
function drawWaterEffect(ctx: any, start: { x: number; y: number }, target: { x: number; y: number }, isSpecial: boolean) {
  ctx.strokeStyle = "rgba(14, 165, 233, 0.4)";
  ctx.lineWidth = 26;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(target.x, target.y);
  ctx.stroke();

  ctx.strokeStyle = "#0284C7";
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(target.x, target.y);
  ctx.stroke();

  ctx.strokeStyle = "#BAE6FD";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(target.x, target.y);
  ctx.stroke();

  const splashGrad = ctx.createRadialGradient(target.x, target.y, 5, target.x, target.y, 42);
  splashGrad.addColorStop(0, "#FFFFFF");
  splashGrad.addColorStop(0.4, "#38BDF8");
  splashGrad.addColorStop(1, "rgba(2, 132, 199, 0)");
  ctx.fillStyle = splashGrad;
  ctx.beginPath();
  ctx.arc(target.x, target.y, 42, 0, Math.PI * 2);
  ctx.fill();

  for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
    const dx = Math.cos(a) * 30;
    const dy = Math.sin(a) * 30;
    ctx.fillStyle = "#E0F2FE";
    ctx.beginPath();
    ctx.arc(target.x + dx, target.y + dy, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * 7. Ice: Crystalline Snowflake Burst & Freezing Jagged Spires
 */
function drawIceEffect(ctx: any, start: { x: number; y: number }, target: { x: number; y: number }, isSpecial: boolean) {
  ctx.strokeStyle = "#38BDF8";
  ctx.lineWidth = 4;

  for (let i = 0; i < 4; i++) {
    const sx = target.x - 24 + i * 16;
    const sy = target.y + 20;
    ctx.fillStyle = "rgba(186, 230, 253, 0.85)";
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + 8, sy - 40 - (i % 2) * 15);
    ctx.lineTo(sx + 16, sy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  drawStarburstImpact(ctx, target.x, target.y, "#38BDF8", "#FFFFFF", 35);
}

/**
 * 8. Physical Slash / Scratch: 3-Blade Crescent Trails
 */
function drawSlashEffect(ctx: any, target: { x: number; y: number }, type: string) {
  const glowColor = type === "dark" || type === "ghost" ? "rgba(168, 85, 247, 0.6)" : (type === "dragon" ? "rgba(20, 184, 166, 0.6)" : "rgba(239, 68, 68, 0.5)");
  const coreColor = type === "dark" ? "#C084FC" : "#FFFFFF";

  const slashOffsets = [-14, 0, 14];
  for (const offset of slashOffsets) {
    const x1 = target.x - 35 + offset;
    const y1 = target.y - 38 - offset * 0.3;
    const x2 = target.x + 35 + offset;
    const y2 = target.y + 28 - offset * 0.3;

    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.strokeStyle = coreColor;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  drawStarburstImpact(ctx, target.x, target.y, "#FDE047", "#FFFFFF", 28);
}

/**
 * 9. Shadow Ball / Dark Pulse: Ethereal Void Energy Orb & Shadow Burst
 */
function drawShadowBallEffect(ctx: any, start: { x: number; y: number }, target: { x: number; y: number }, angle: number) {
  const midX = (start.x + target.x) / 2;
  const midY = (start.y + target.y) / 2;

  const ballGrad = ctx.createRadialGradient(midX, midY, 4, midX, midY, 26);
  ballGrad.addColorStop(0, "#18181B");
  ballGrad.addColorStop(0.5, "#7E22CE");
  ballGrad.addColorStop(0.9, "#C084FC");
  ballGrad.addColorStop(1, "rgba(126, 34, 206, 0)");
  ctx.fillStyle = ballGrad;
  ctx.beginPath();
  ctx.arc(midX, midY, 26, 0, Math.PI * 2);
  ctx.fill();

  const hitGrad = ctx.createRadialGradient(target.x, target.y, 5, target.x, target.y, 45);
  hitGrad.addColorStop(0, "#09090B");
  hitGrad.addColorStop(0.4, "#6B21A8");
  hitGrad.addColorStop(0.8, "#A855F7");
  hitGrad.addColorStop(1, "rgba(168, 85, 247, 0)");
  ctx.fillStyle = hitGrad;
  ctx.beginPath();
  ctx.arc(target.x, target.y, 45, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * 10. Grass: Spinning Dual-Tone Leaf Whirlwind
 */
function drawGrassEffect(ctx: any, start: { x: number; y: number }, target: { x: number; y: number }) {
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const r = 22 + (i % 2) * 12;
    const lx = target.x + Math.cos(a) * r;
    const ly = target.y + Math.sin(a) * r;

    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(a + Math.PI / 4);

    ctx.fillStyle = i % 2 === 0 ? "#22C55E" : "#86EFAC";
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
  drawStarburstImpact(ctx, target.x, target.y, "#4ADE80", "#FEF08A", 30);
}

/**
 * 11. Psychic: Concentric Magenta/Violet Distortion Rings
 */
function drawPsychicEffect(ctx: any, target: { x: number; y: number }) {
  const ringColors = ["rgba(244, 63, 94, 0.8)", "rgba(192, 132, 252, 0.7)", "rgba(244, 114, 182, 0.6)"];
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = ringColors[i];
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(target.x, target.y, 22 + i * 12, 14 + i * 8, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/**
 * 12. Poison: Toxic Purple Bubbling Acidic Blast
 */
function drawPoisonEffect(ctx: any, start: { x: number; y: number }, target: { x: number; y: number }) {
  for (let i = 0; i < 6; i++) {
    const px = target.x - 20 + Math.random() * 40;
    const py = target.y - 15 + Math.random() * 30;
    const r = 6 + Math.random() * 8;

    const pGrad = ctx.createRadialGradient(px, py, 2, px, py, r);
    pGrad.addColorStop(0, "#E9D5FF");
    pGrad.addColorStop(0.6, "#A855F7");
    pGrad.addColorStop(1, "#581C87");
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
  drawStarburstImpact(ctx, target.x, target.y, "#A855F7", "#F3E8FF", 28);
}

/**
 * 13. Rock / Ground: Crashing Boulders & Ground Dust
 */
function drawRockGroundEffect(ctx: any, target: { x: number; y: number }) {
  ctx.strokeStyle = "#A16207";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(target.x, target.y + 15, 38, 16, 0, 0, Math.PI * 2);
  ctx.stroke();

  const rockColors = ["#78716C", "#A8A29E", "#57534E"];
  for (let i = 0; i < 4; i++) {
    const rx = target.x - 25 + i * 16;
    const ry = target.y - 15 + (i % 2) * 10;
    ctx.fillStyle = rockColors[i % 3];
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + 12, ry - 14);
    ctx.lineTo(rx + 16, ry + 2);
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * 14. Flying: Sharp Sky-Blue Crescent Wind Blades
 */
function drawFlyingEffect(ctx: any, target: { x: number; y: number }) {
  for (let i = 0; i < 3; i++) {
    const fx = target.x - 20 + i * 18;
    const fy = target.y - 15 + i * 10;
    ctx.strokeStyle = "#38BDF8";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(fx, fy, 22, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();
  }
  drawStarburstImpact(ctx, target.x, target.y, "#BAE6FD", "#FFFFFF", 26);
}

/**
 * 15. Ghost / Dark: Shadow Wave
 */
function drawGhostDarkEffect(ctx: any, target: { x: number; y: number }) {
  drawStarburstImpact(ctx, target.x, target.y, "#7E22CE", "#C084FC", 36);
}

/**
 * 16. Dragon: Mystic Cyan/Teal Dragon Breath
 */
function drawDragonEffect(ctx: any, start: { x: number; y: number }, target: { x: number; y: number }) {
  drawStarburstImpact(ctx, target.x, target.y, "#0D9488", "#2DD4BF", 38);
}

/**
 * 17. Steel: Metallic Sheen Gleam & Impact Ping
 */
function drawSteelEffect(ctx: any, target: { x: number; y: number }) {
  drawStarburstImpact(ctx, target.x, target.y, "#94A3B8", "#FFFFFF", 32);
}

/**
 * 18. Fairy: Pink Starburst & Sparkling Moon Dust
 */
function drawFairyEffect(ctx: any, target: { x: number; y: number }) {
  drawStarburstImpact(ctx, target.x, target.y, "#EC4899", "#FDE047", 34);
}

/**
 * Default Physical Impact (Tackle, Pound, Quick Attack, Slam)
 */
function drawPhysicalImpactEffect(ctx: any, target: { x: number; y: number }) {
  drawStarburstImpact(ctx, target.x, target.y, "#F59E0B", "#FFFFFF", 32);
}

/**
 * Common Helper: High-Quality Impact Starburst & Shockwave Ring
 */
function drawStarburstImpact(ctx: any, tx: number, ty: number, color1: string, color2: string, radius = 34) {
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
 * 19. Stat Boost Effect (능력치 향상 / 랭크 상승)
 * Luminous red/amber glowing chevron arrows and sparkle orbs rising upward!
 */
export function drawStatBoostEffect(ctx: any, pos: { x: number; y: number }, progress: number = 0.5) {
  ctx.save();
  const clampedProgress = Math.min(1.0, Math.max(0.0, progress));

  // Soft ambient rising aura
  const auraGrad = ctx.createRadialGradient(pos.x, pos.y, 10, pos.x, pos.y - 20, 65);
  auraGrad.addColorStop(0, "rgba(239, 68, 68, 0.35)");
  auraGrad.addColorStop(0.5, "rgba(245, 158, 11, 0.20)");
  auraGrad.addColorStop(1, "rgba(239, 68, 68, 0)");
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y - 15, 65, 0, Math.PI * 2);
  ctx.fill();

  // 5 Ascending Glowing Arrows (Upwards ^ )
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

    // Draw Chevron Arrow pointing UP ( ^ )
    const s = cfg.size;
    ctx.beginPath();
    ctx.moveTo(arrowX - s, arrowY + s * 0.55);
    ctx.lineTo(arrowX, arrowY - s * 0.45);
    ctx.lineTo(arrowX + s, arrowY + s * 0.55);
    ctx.stroke();

    // Inner bright core
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(arrowX - s * 0.7, arrowY + s * 0.45);
    ctx.lineTo(arrowX, arrowY - s * 0.35);
    ctx.lineTo(arrowX + s * 0.7, arrowY + s * 0.45);
    ctx.stroke();

    // Trailing sparkle dot beneath each arrow
    ctx.fillStyle = cfg.color;
    ctx.beginPath();
    ctx.arc(arrowX, arrowY + s * 1.1, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Floating sparkle particles
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
 * 20. Stat Drop Effect (능력치 하락 / 랭크 하락)
 * Deep blue/cyan/purple glowing chevron arrows and mist droplets descending downward!
 */
export function drawStatDropEffect(ctx: any, pos: { x: number; y: number }, progress: number = 0.5) {
  ctx.save();
  const clampedProgress = Math.min(1.0, Math.max(0.0, progress));

  // Dark cold blue ambient aura
  const auraGrad = ctx.createRadialGradient(pos.x, pos.y, 10, pos.x, pos.y + 15, 65);
  auraGrad.addColorStop(0, "rgba(59, 130, 246, 0.35)");
  auraGrad.addColorStop(0.5, "rgba(99, 102, 241, 0.20)");
  auraGrad.addColorStop(1, "rgba(59, 130, 246, 0)");
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y + 10, 65, 0, Math.PI * 2);
  ctx.fill();

  // 5 Descending Glowing Arrows (Downwards v )
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

    // Draw Chevron Arrow pointing DOWN ( v )
    const s = cfg.size;
    ctx.beginPath();
    ctx.moveTo(arrowX - s, arrowY - s * 0.55);
    ctx.lineTo(arrowX, arrowY + s * 0.45);
    ctx.lineTo(arrowX + s, arrowY - s * 0.55);
    ctx.stroke();

    // Inner bright core
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(arrowX - s * 0.7, arrowY - s * 0.45);
    ctx.lineTo(arrowX, arrowY + s * 0.35);
    ctx.lineTo(arrowX + s * 0.7, arrowY - s * 0.45);
    ctx.stroke();

    // Trailing droplet dot above each falling arrow
    ctx.fillStyle = cfg.color;
    ctx.beginPath();
    ctx.arc(arrowX, arrowY - s * 1.1, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Descending droplet particles
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

/**
 * Authentic Gen 5 Karate Chop (태권당수):
 * A distinct, iconic blocky Karate Hand sprite matching official Gen 5 geometry:
 * 4 horizontal blocky fingers with rounded caps extending to the left, thumb folded on top-right,
 * charging red/orange flash and slamming down with orange/amber impact embers!
 */
export function drawKarateChopEffect(ctx: any, target: { x: number; y: number }, step: number = 4) {
  ctx.save();

  const cx = target.x;
  const cy = target.y - 45;

  let handOy = -55;
  let rotDeg = 0;
  let isRedFlash = false;
  let showImpact = false;

  if (step === 1) {
    // Step 1: Hand appears hovering above target head (Black Hand, purely horizontal)
    handOy = -58;
    isRedFlash = false;
  } else if (step === 2) {
    // Step 2: 살짝 아래로 틱 내려감 (Pure vertical dip down)
    handOy = -44;
    isRedFlash = false;
  } else if (step === 3) {
    // Step 3: 위로 살짝 올라갔다가 멈칫 장전 (Pure vertical rise up & Red charging hold)
    handOy = -76;
    isRedFlash = true;
  } else {
    // Step 4: 팍! 하고 정수리에 딱 내리찍음 (Pure vertical slam down on head + Orange embers!)
    handOy = -15;
    isRedFlash = false;
    showImpact = true;
  }

  // 1. Draw Authentic 5th Gen Hand Sprite Asset (Fixed 0 degree angle)
  const sprite = isRedFlash ? karateRedImg : karateBlackImg;
  if (sprite) {
    ctx.save();
    ctx.translate(cx, cy + handOy);
    const sw = 80 * 1.15;
    const sh = 60 * 1.15;
    ctx.drawImage(sprite, -sw / 2, -sh / 2, sw, sh);
    ctx.restore();
  }

  // 2. Orange / Amber Hit Embers on Impact (Step 3)
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
 * Authentic Gen 5 Double Slap (연속뺨치기):
 * Rhythmic alternating Left & Right open palm slaps across the target's face
 * with slap wind arcs and star impact sparks!
 */
export function drawDoubleSlapEffect(ctx: any, target: { x: number; y: number }, step: number = 1) {
  ctx.save();

  // step: 1 (Hit 1 Left Impact), 2 (Hit 1 Left Fade), 3 (Hit 2 Right Impact), 4 (Hit 2 Right Fade), ...
  const isFade = (step % 2 === 0);
  const hitIndex = Math.floor((step - 1) / 2);
  const isLeft = (hitIndex % 2 === 0);

  // During fade phase: hand moves slightly inward into follow-through and alpha decreases to 0.32
  const followOffset = isFade ? (isLeft ? 8 : -8) : 0;
  const handX = target.x + (isLeft ? -34 : 34) + followOffset;
  const handY = target.y - 25;
  const rotAngle = 0; // Purely vertical / upright angle
  const scaleX = isLeft ? 1 : -1;
  const alpha = isFade ? 0.32 : 1.0;

  // 1. Inverted Karate Chop Hand Sprite (with dynamic fade transparency)
  if (doubleSlapWhiteImg) {
    ctx.save();
    ctx.translate(handX, handY);
    ctx.scale(scaleX * 1.15, 1.15);
    ctx.rotate(rotAngle);
    ctx.globalAlpha = alpha;
    const sw = 80 * 1.15;
    const sh = 60 * 1.15;
    ctx.drawImage(doubleSlapWhiteImg, -sw / 2, -sh / 2, sw, sh);
    ctx.restore();
  }

  // 3. Impact Star / Sparks at Point of Cheek Contact
  ctx.save();
  const sparkX = target.x + (isLeft ? -10 : 10) + (isFade ? (isLeft ? 6 : -6) : 0);
  const sparkY = target.y - 25;
  const starRadius = isFade ? 11 : 18;
  const starAlpha = isFade ? 0.38 : 1.0;

  ctx.globalAlpha = starAlpha;

  // Yellow 4-point Impact Star
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

  // White inner star
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

  // Spark dots
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
 * Authentic Front-Facing Straight Punch Fist SVG (정면 정권 - Seiken)
 * Symmetrical front-facing fist punching straight forward into the target!
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
  // Wrist / Forearm base
  ctx.moveTo(-14, 18);
  ctx.lineTo(14, 18);
  ctx.lineTo(18, 10);
  // Pinky outer edge
  ctx.lineTo(20, -2);
  ctx.arc(15, -9, 5.0, 0, Math.PI, true); // Pinky knuckle
  // Ring knuckle
  ctx.arc(5, -12, 5.2, 0, Math.PI, true);
  // Middle knuckle (peak)
  ctx.arc(-5, -12, 5.2, 0, Math.PI, true);
  // Index knuckle
  ctx.arc(-15, -9, 5.0, 0, Math.PI, true);
  // Thumb outer curve
  ctx.lineTo(-20, -2);
  ctx.lineTo(-18, 10);
  ctx.lineTo(-14, 18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 2. Curled Finger Division Creases
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  // Vertical finger lines
  ctx.moveTo(-10, -9); ctx.lineTo(-10, 3);
  ctx.moveTo(0, -12); ctx.lineTo(0, 3);
  ctx.moveTo(10, -9); ctx.lineTo(10, 3);
  // Horizontal joint line
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

  // Thumb knuckle crease
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(-5, 3);
  ctx.lineTo(-5, 9);
  ctx.stroke();

  ctx.restore();
}

/**
 * 004 연속펀치 (Comet Punch): 3-hit Front Straight Punch (정면 정권) Barrage
 * Direct forward Seiken straight punches impacting the center of the target with impact stars & gradual fade!
 */
export function drawCometPunchEffect(ctx: any, target: { x: number; y: number }, step: number = 1) {
  ctx.save();

  // step: 1 (Hit 1 Center-Left Impact), 2 (Hit 1 Center-Left Fade), 3 (Hit 2 Center-Right Impact), 4 (Hit 2 Center-Right Fade), 5 (Hit 3 Dead-Center Impact), 6 (Hit 3 Dead-Center Fade)
  const isFade = (step % 2 === 0);
  const hitIndex = Math.floor((step - 1) / 2) % 3; // 0 (Hit 1), 1 (Hit 2), 2 (Hit 3)

  // Direct Straight Frontal Punches on target center (Exact user reference sprite)
  const configs = [
    { ox: -12, oy: -20, scale: 0.55 }, // Hit 1: Straight Left Jab
    { ox: 12, oy: -26, scale: 0.58 },  // Hit 2: Straight Right Cross
    { ox: 0, oy: -24, scale: 0.62 },   // Hit 3: Heavy Straight Center Smash
  ];
  const cfg = configs[hitIndex];

  const fistX = target.x + cfg.ox;
  const fistY = target.y + cfg.oy + (isFade ? -3 : 0);
  const alpha = isFade ? 0.32 : 1.0;
  const currentScale = isFade ? cfg.scale * 1.08 : cfg.scale;

  // 1. Draw Exact User Reference Punch Sprite
  ctx.save();
  ctx.translate(fistX, fistY);
  ctx.scale(currentScale, currentScale);
  ctx.globalAlpha = alpha;

  if (cometPunchFistImg) {
    const fw = cometPunchFistImg.width;
    const fh = cometPunchFistImg.height;
    ctx.drawImage(cometPunchFistImg, -fw / 2, -fh / 2, fw, fh);
  } else {
    drawFrontStraightPunchFistSvg(ctx, 0, 0, 2.2, 1.0);
  }
  ctx.restore();

  // 2. Impact Star / Sparks at Central Knuckle Contact Point
  ctx.save();
  const sparkX = fistX;
  const sparkY = fistY - 8;
  const starRadius = isFade ? 12 : 20;
  const starAlpha = isFade ? 0.38 : 1.0;

  ctx.globalAlpha = starAlpha;

  // Yellow 4-point Impact Star
  ctx.fillStyle = "#FACC15";
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sparkX, sparkY - starRadius);
  ctx.quadraticCurveTo(sparkX, sparkY, sparkX + starRadius, sparkY);
  ctx.quadraticCurveTo(sparkX, sparkY, sparkX + starRadius, sparkY);
  ctx.quadraticCurveTo(sparkX, sparkY, sparkX - starRadius, sparkY);
  ctx.quadraticCurveTo(sparkX, sparkY, sparkX - starRadius, sparkY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // White inner star
  ctx.fillStyle = "#FFFFFF";
  const innerR = starRadius * 0.5;
  ctx.beginPath();
  ctx.moveTo(sparkX, sparkY - innerR);
  ctx.quadraticCurveTo(sparkX, sparkY, sparkX + innerR, sparkY);
  ctx.quadraticCurveTo(sparkX, sparkY, sparkX + innerR, sparkY);
  ctx.quadraticCurveTo(sparkX, sparkY, sparkX - innerR, sparkY);
  ctx.quadraticCurveTo(sparkX, sparkY, sparkX - innerR, sparkY);
  ctx.closePath();
  ctx.fill();

  // Spark dots
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

function drawMiniRetroStar(ctx: any, x: number, y: number, radius: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y - radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.quadraticCurveTo(x, y, x, y + radius);
  ctx.quadraticCurveTo(x, y, x - radius, y);
  ctx.quadraticCurveTo(x, y, x, y - radius);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/**
 * Japanese Koban (금화 / 엽전 코인) Helper for Pay Day (Clean Compact Size)
 */
function drawKobanCoin(ctx: any, x: number, y: number, scale: number = 1.0, angle: number = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  // Outer Koban Oval (Compact ~70% size: 7x11.5)
  ctx.fillStyle = "#FACC15";
  ctx.strokeStyle = "#B45309";
  ctx.lineWidth = 1.8;

  ctx.beginPath();
  ctx.ellipse(0, 0, 7, 11.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Inner Border Rim
  ctx.strokeStyle = "#F59E0B";
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.ellipse(0, 0, 5.2, 9.5, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Koban horizontal groove ridges
  ctx.strokeStyle = "#92400E";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-3.5, -4.5); ctx.lineTo(3.5, -4.5);
  ctx.moveTo(-4.5, 0); ctx.lineTo(4.5, 0);
  ctx.moveTo(-3.5, 4.5); ctx.lineTo(3.5, 4.5);
  ctx.stroke();

  // Center Kanji / seal mark (Square / Cross)
  ctx.fillStyle = "#78350F";
  ctx.fillRect(-1.5, -1.5, 3, 3);

  // Glimmer highlight
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.beginPath();
  ctx.ellipse(-2, -5.5, 1.8, 3, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 005 메가톤펀치 (Mega Punch):
 * Step 1: Big yellow ring (56px) + Semi-transparent fist spinning (-1.35 rad)
 * Step 2: Yellow ring contracting (28px) + Semi-transparent fist spinning further (-2.90 rad)
 * Step 3: Yellow ring shrinks tiny (14px) + Fist STOPS and LOCKS into 100% opaque front straight Seiken (0 rad) + Mega Starburst
 * Step 4: Yellow shockwave ripple expands outward (48px) + Locked fist fading
 * Step 5: Shockwave ripple expands further and dissipates (70px)
 */
export function drawMegaPunchEffect(ctx: any, target: { x: number; y: number }, step: number = 3) {
  ctx.save();

  const targetX = target.x;
  const targetY = target.y - 12;

  // Step 1: Large Yellow Ring (Radius: 56px) + Transparent Spinning Fist (-1.35 rad)
  if (step === 1) {
    // 1. Big Yellow Ring
    ctx.save();
    ctx.strokeStyle = "#FACC15";
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.arc(targetX, targetY - 14, 56, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(targetX, targetY - 14, 56, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 2. Transparent Spinning Fist (Phase 1 Spin)
    ctx.save();
    ctx.translate(targetX, targetY - 18);
    ctx.rotate(-1.35);
    ctx.scale(0.68, 0.68);
    ctx.globalAlpha = 0.35;
    if (cometPunchFistImg) {
      const fw = cometPunchFistImg.width;
      const fh = cometPunchFistImg.height;
      ctx.drawImage(cometPunchFistImg, -fw / 2, -fh / 2, fw, fh);
    } else {
      drawFrontStraightPunchFistSvg(ctx, 0, 0, 2.2, 1.0);
    }
    ctx.restore();
  }
  // Step 2: Yellow Ring Contracting (Radius: 28px) + Transparent Spinning Fist (-2.90 rad)
  else if (step === 2) {
    // 1. Contracting Yellow Ring
    ctx.save();
    ctx.strokeStyle = "#FACC15";
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(targetX, targetY - 14, 28, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#FEF08A";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(targetX, targetY - 14, 28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 2. Transparent Spinning Fist (Phase 2 Spin)
    ctx.save();
    ctx.translate(targetX, targetY - 18);
    ctx.rotate(-2.90);
    ctx.scale(0.74, 0.74);
    ctx.globalAlpha = 0.60;
    if (cometPunchFistImg) {
      const fw = cometPunchFistImg.width;
      const fh = cometPunchFistImg.height;
      ctx.drawImage(cometPunchFistImg, -fw / 2, -fh / 2, fw, fh);
    } else {
      drawFrontStraightPunchFistSvg(ctx, 0, 0, 2.3, 1.0);
    }
    ctx.restore();
  }
  // Step 3: Shrunk Ring (Radius: 14px) + LOCKED OPAQUE FRONT STRAIGHT FIST (0 rad) + Mega Starburst!
  else if (step === 3) {
    // 1. Shrunk Yellow Core Ring
    ctx.save();
    ctx.strokeStyle = "#FEF08A";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(targetX, targetY - 14, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 2. Heavy Punch Fist LOCKED in Opaque Upright Straight Position (0 deg rotation)
    ctx.save();
    ctx.translate(targetX, targetY - 18);
    ctx.scale(0.82, 0.82);
    ctx.globalAlpha = 1.0;
    if (cometPunchFistImg) {
      const fw = cometPunchFistImg.width;
      const fh = cometPunchFistImg.height;
      ctx.drawImage(cometPunchFistImg, -fw / 2, -fh / 2, fw, fh);
    } else {
      drawFrontStraightPunchFistSvg(ctx, 0, 0, 2.5, 1.0);
    }
    ctx.restore();

    // 3. Mega Impact Starburst
    const sparkX = targetX;
    const sparkY = targetY - 24;
    const starRadius = 28;

    ctx.fillStyle = "#FACC15";
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(sparkX, sparkY - starRadius);
    ctx.quadraticCurveTo(sparkX, sparkY, sparkX + starRadius, sparkY);
    ctx.quadraticCurveTo(sparkX, sparkY, sparkX, sparkY + starRadius);
    ctx.quadraticCurveTo(sparkX, sparkY, sparkX - starRadius, sparkY);
    ctx.quadraticCurveTo(sparkX, sparkY, sparkX - starRadius, sparkY);
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
    ctx.quadraticCurveTo(sparkX, sparkY, sparkX - innerR, sparkY);
    ctx.closePath();
    ctx.fill();

    // Heavy blast sparks
    const sparks = [
      { ox: -22, oy: -20, r: 3.5, c: "#FFFFFF" },
      { ox: 24, oy: -18, r: 3.2, c: "#FACC15" },
      { ox: -20, oy: 20, r: 3.2, c: "#F59E0B" },
      { ox: 22, oy: 22, r: 3.5, c: "#FFFFFF" },
      { ox: 0, oy: -34, r: 3.0, c: "#FEF08A" },
      { ox: 0, oy: 28, r: 3.0, c: "#FACC15" },
    ];
    for (const s of sparks) {
      ctx.fillStyle = s.c;
      ctx.beginPath();
      ctx.arc(sparkX + s.ox, sparkY + s.oy, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Step 4: Ring expands outward like a ripple shockwave (Radius: 48px) + Locked Fist Fading
  else if (step === 4) {
    // 1. Expanding Shockwave Ripple
    ctx.save();
    ctx.globalAlpha = 0.75;
    ctx.strokeStyle = "#FACC15";
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.arc(targetX, targetY - 14, 48, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(targetX, targetY - 14, 48, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 2. Fading Upright Fist
    ctx.save();
    ctx.translate(targetX, targetY - 18);
    ctx.scale(0.85, 0.85);
    ctx.globalAlpha = 0.40;
    if (cometPunchFistImg) {
      const fw = cometPunchFistImg.width;
      const fh = cometPunchFistImg.height;
      ctx.drawImage(cometPunchFistImg, -fw / 2, -fh / 2, fw, fh);
    }
    ctx.restore();

    // 3. Fading Star
    drawMiniRetroStar(ctx, targetX, targetY - 24, 18, "rgba(250, 204, 21, 0.5)");
  }
  // Step 5: Wave expands further and dissipates (Radius: 70px)
  else if (step === 5) {
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = "#FACC15";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(targetX, targetY - 14, 70, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#FEF08A";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(targetX, targetY - 14, 70, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 006 고양이돈받기 (Pay Day):
 * Step 1: Initial Coin Cluster + Impact Burst Stars (Full Opacity)
 * Step 2: Coins burst outward radially with rotation (Alpha 0.65)
 * Step 3: Coins disperse far outward and fade transparently (Alpha 0.25)
 */
export function drawPayDayEffect(ctx: any, target: { x: number; y: number }, step: number = 1) {
  ctx.save();

  const targetX = target.x;
  const targetY = target.y - 10;

  // Step 1: Tight Cluster (spread: 0.75, alpha: 1.0)
  // Step 2: Mid Radial Scatter (spread: 1.40, alpha: 0.65)
  // Step 3+: Far Dispersion & Fade (spread: 2.10, alpha: 0.25)
  let spread = 0.75;
  let alpha = 1.0;
  let spinMultiplier = 0.0;

  if (step === 2) {
    spread = 1.40;
    alpha = 0.65;
    spinMultiplier = 1.0;
  } else if (step >= 3) {
    spread = 2.10;
    alpha = 0.25;
    spinMultiplier = 2.2;
  }

  ctx.globalAlpha = alpha;

  // Base Coins with radial velocity trajectories
  const baseCoins = [
    { vx: -22, vy: -26, baseAngle: -0.30, spin: -0.5, scale: 1.05 },
    { vx: 20, vy: -28, baseAngle: 0.35, spin: 0.6, scale: 1.15 },
    { vx: -30, vy: -2, baseAngle: -0.45, spin: -0.7, scale: 1.0 },
    { vx: 28, vy: 6, baseAngle: 0.40, spin: 0.8, scale: 1.1 },
    { vx: -18, vy: 22, baseAngle: 0.55, spin: -0.6, scale: 1.05 },
    { vx: 14, vy: 24, baseAngle: -0.25, spin: 0.5, scale: 1.2 },
    { vx: 0, vy: -10, baseAngle: 0.10, spin: 0.9, scale: 1.25 },
  ];

  for (const c of baseCoins) {
    const coinX = targetX + c.vx * spread;
    const coinY = targetY + c.vy * spread;
    const coinAngle = c.baseAngle + c.spin * spinMultiplier;
    drawKobanCoin(ctx, coinX, coinY, c.scale, coinAngle);
  }

  // Sparkling Gold Stars scattered along the burst
  const sparkles = [
    { ox: -16, oy: -35, size: 10, c: "#FEF08A" },
    { ox: 32, oy: -16, size: 12, c: "#FACC15" },
    { ox: -30, oy: -6, size: 9, c: "#FEF08A" },
    { ox: 18, oy: 22, size: 11, c: "#FDE047" },
    { ox: -10, oy: 26, size: 8, c: "#FFFFFF" },
    { ox: 0, oy: -20, size: 14, c: "#FACC15" },
  ];

  for (const sp of sparkles) {
    drawMiniRetroStar(
      ctx,
      targetX + sp.ox * (spread * 0.9),
      targetY + sp.oy * (spread * 0.9),
      step >= 3 ? sp.size * 0.75 : sp.size,
      sp.c
    );
  }

  ctx.restore();
}

/**
 * 007 불꽃펀치 (Fire Punch): Blazing Flame Aura, Fire Petals & Burning Embers
 */
export function drawFirePunchEffect(ctx: any, target: { x: number; y: number }, step: number = 1) {
  ctx.save();

  const isFade = (step % 2 === 0);
  const alpha = isFade ? 0.35 : 1.0;
  const targetX = target.x;
  const targetY = target.y - 12;

  // 1. Fiery Flame Aura
  const fireGrad = ctx.createRadialGradient(targetX, targetY - 14, 4, targetX, targetY - 14, isFade ? 52 : 44);
  fireGrad.addColorStop(0, "#FEF08A");
  fireGrad.addColorStop(0.35, "#F97316");
  fireGrad.addColorStop(0.7, "#DC2626");
  fireGrad.addColorStop(1, "rgba(220, 38, 38, 0)");
  ctx.fillStyle = fireGrad;
  ctx.globalAlpha = isFade ? 0.35 : 0.85;
  ctx.beginPath();
  ctx.arc(targetX, targetY - 14, isFade ? 52 : 44, 0, Math.PI * 2);
  ctx.fill();

  // 2. Punch Fist
  ctx.save();
  ctx.translate(targetX, targetY - 14);
  ctx.scale(isFade ? 0.68 : 0.62, isFade ? 0.68 : 0.62);
  ctx.globalAlpha = alpha;

  if (cometPunchFistImg) {
    const fw = cometPunchFistImg.width;
    const fh = cometPunchFistImg.height;
    ctx.drawImage(cometPunchFistImg, -fw / 2, -fh / 2, fw, fh);
  } else {
    drawFrontStraightPunchFistSvg(ctx, 0, 0, 2.2, 1.0);
  }
  ctx.restore();

  // 3. Flame Petals / Tongues leaping from knuckles
  ctx.save();
  ctx.globalAlpha = isFade ? 0.40 : 0.90;
  const flames = [
    { ox: -22, oy: -30, r: 12, c: "#F97316" },
    { ox: 0, oy: -40, r: 14, c: "#EF4444" },
    { ox: 22, oy: -30, r: 12, c: "#F97316" },
    { ox: -26, oy: -10, r: 10, c: "#FDE047" },
    { ox: 26, oy: -10, r: 10, c: "#FDE047" },
  ];
  for (const f of flames) {
    ctx.fillStyle = f.c;
    ctx.beginPath();
    ctx.arc(targetX + f.ox, targetY + f.oy, f.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 4. Fire Impact Star & Flying Embers
  const sparkX = targetX;
  const sparkY = targetY - 22;
  drawMiniRetroStar(ctx, sparkX, sparkY, isFade ? 14 : 22, "#FDE047");

  const embers = [
    { ox: -28, oy: -26, r: 2.8, c: "#FEF08A" },
    { ox: 30, oy: -24, r: 3.0, c: "#F97316" },
    { ox: -22, oy: 14, r: 2.5, c: "#EF4444" },
    { ox: 25, oy: 16, r: 2.8, c: "#FDE047" },
  ];
  for (const eb of embers) {
    ctx.fillStyle = eb.c;
    ctx.beginPath();
    ctx.arc(sparkX + eb.ox, sparkY + eb.oy, eb.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 008 냉동펀치 (Ice Punch): Crystalline Glacial Frost Aura, Diamond Ice Shards & Snowflake Burst
 */
export function drawIcePunchEffect(ctx: any, target: { x: number; y: number }, step: number = 1) {
  ctx.save();

  const isFade = (step % 2 === 0);
  const alpha = isFade ? 0.35 : 1.0;
  const targetX = target.x;
  const targetY = target.y - 12;

  // 1. Frost Aura
  const iceGrad = ctx.createRadialGradient(targetX, targetY - 14, 4, targetX, targetY - 14, isFade ? 50 : 42);
  iceGrad.addColorStop(0, "#FFFFFF");
  iceGrad.addColorStop(0.4, "#7DD3FC");
  iceGrad.addColorStop(0.75, "#0284C7");
  iceGrad.addColorStop(1, "rgba(2, 132, 199, 0)");
  ctx.fillStyle = iceGrad;
  ctx.globalAlpha = isFade ? 0.35 : 0.85;
  ctx.beginPath();
  ctx.arc(targetX, targetY - 14, isFade ? 50 : 42, 0, Math.PI * 2);
  ctx.fill();

  // 2. Punch Fist
  ctx.save();
  ctx.translate(targetX, targetY - 14);
  ctx.scale(isFade ? 0.68 : 0.62, isFade ? 0.68 : 0.62);
  ctx.globalAlpha = alpha;

  if (cometPunchFistImg) {
    const fw = cometPunchFistImg.width;
    const fh = cometPunchFistImg.height;
    ctx.drawImage(cometPunchFistImg, -fw / 2, -fh / 2, fw, fh);
  } else {
    drawFrontStraightPunchFistSvg(ctx, 0, 0, 2.2, 1.0);
  }
  ctx.restore();

  // 3. Ice Crystal Shards (6-point Diamond Shards)
  ctx.save();
  ctx.globalAlpha = isFade ? 0.40 : 0.95;
  const shards = [
    { ox: 0, oy: -36, w: 7, h: 14, rot: 0 },
    { ox: 28, oy: -22, w: 6, h: 12, rot: Math.PI / 3 },
    { ox: 28, oy: 10, w: 6, h: 12, rot: (2 * Math.PI) / 3 },
    { ox: 0, oy: 22, w: 7, h: 14, rot: Math.PI },
    { ox: -28, oy: 10, w: 6, h: 12, rot: (4 * Math.PI) / 3 },
    { ox: -28, oy: -22, w: 6, h: 12, rot: (5 * Math.PI) / 3 },
  ];

  for (const sh of shards) {
    ctx.save();
    ctx.translate(targetX + sh.ox, targetY + sh.oy);
    ctx.rotate(sh.rot);
    ctx.fillStyle = "#E0F2FE";
    ctx.strokeStyle = "#0284C7";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -sh.h / 2);
    ctx.lineTo(sh.w / 2, 0);
    ctx.lineTo(0, sh.h / 2);
    ctx.lineTo(-sh.w / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  // 4. Glacial Starburst
  drawMiniRetroStar(ctx, targetX, targetY - 20, isFade ? 12 : 20, "#BAE6FD");

  // Frost Glints
  const glints = [
    { ox: -16, oy: -28, r: 2.5, c: "#FFFFFF" },
    { ox: 18, oy: -26, r: 2.8, c: "#E0F2FE" },
    { ox: -14, oy: 16, r: 2.2, c: "#38BDF8" },
    { ox: 16, oy: 18, r: 2.5, c: "#FFFFFF" },
  ];
  for (const gl of glints) {
    ctx.fillStyle = gl.c;
    ctx.beginPath();
    ctx.arc(targetX + gl.ox, targetY + gl.oy, gl.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

