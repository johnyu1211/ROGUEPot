import { loadImage } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";

let karateBlackImg: any = null;
let karateRedImg: any = null;

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

  // 1. SPECIFIC SIGNATURE MOVES FIRST
  if (moveKey === "karate-chop" || moveKey === "karatechop") {
    drawKarateChopEffect(ctx, targetPos, info.step ?? 3);
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
  } else if (moveKey === "ice-beam" || moveKey === "blizzard" || moveKey === "ice-punch" || type === "ice") {
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
export function drawKarateChopEffect(ctx: any, target: { x: number; y: number }, step: number = 3) {
  ctx.save();

  const cx = target.x;
  const cy = target.y - 45;

  let handOy = -55;
  let rotDeg = 0;
  let isRedFlash = false;
  let showImpact = false;

  if (step === 1) {
    // Step 1: Hover & Pre-chop dip (Black Hand)
    handOy = -48;
    rotDeg = -6;
    isRedFlash = false;
  } else if (step === 2) {
    // Step 2: High windup tension + Red/Orange Flash charging!
    handOy = -70;
    rotDeg = 12;
    isRedFlash = true;
  } else {
    // Step 3: SLAM CHOP DIRECTLY ONTO HEAD! (Solid Black Hand + Orange Embers)
    handOy = -15;
    rotDeg = -4;
    isRedFlash = false;
    showImpact = true;
  }

  // 1. Draw Authentic 5th Gen Hand Sprite Asset
  const sprite = isRedFlash ? karateRedImg : karateBlackImg;
  if (sprite) {
    ctx.save();
    ctx.translate(cx, cy + handOy);
    ctx.rotate((rotDeg * Math.PI) / 180);
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
