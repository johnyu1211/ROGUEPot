import { TitleScreenPartyPokemon } from "../types.js";
import { getPokemonSprite } from "./spriteLoader.js";

/**
 * Draws a clean vector Globe Icon for Multiplayer Header
 */
export function drawVectorGlobe(ctx: any, cx: number, cy: number, r: number, color: string = "#5865F2") {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - r, cy);
  ctx.lineTo(cx + r, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 0.5, r, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws a clean vector Warning Triangle Icon
 */
export function drawVectorWarning(ctx: any, cx: number, cy: number, size: number, color: string = "#F4A261") {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + size * 0.9, cy + size * 0.7);
  ctx.lineTo(cx - size * 0.9, cy + size * 0.7);
  ctx.closePath();
  ctx.stroke();
  ctx.fillRect(cx - 1, cy - size * 0.35, 2, size * 0.45);
  ctx.fillRect(cx - 1, cy + size * 0.35, 2, 2);
  ctx.restore();
}

/**
 * Draws a clean vector Check Circle Icon
 */
export function drawVectorCheck(ctx: any, cx: number, cy: number, r: number, color: string = "#57F287") {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.45, cy);
  ctx.lineTo(cx - r * 0.1, cy + r * 0.35);
  ctx.lineTo(cx + r * 0.45, cy - r * 0.35);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws a clean vector Checkmark Icon (SVG path style)
 */
export function drawCheckmark(ctx: any, cx: number, cy: number, size: number = 5.5, color: string = "#22C55E") {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.7, cy);
  ctx.lineTo(cx - size * 0.15, cy + size * 0.55);
  ctx.lineTo(cx + size * 0.75, cy - size * 0.55);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws a clean vector Star Icon
 */
export function drawVectorStar(ctx: any, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number, color: string = "#F4A261") {
  ctx.save();
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

/**
 * Draws a clean vector PokéRogue 4-point sparkle star (replaces emoji to prevent font breaking)
 */
export function drawShinySparkle(ctx: any, cx: number, cy: number, size: number, color: string = "#F59E0B") {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  const r = size;
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx, cy, cx + r, cy);
  ctx.quadraticCurveTo(cx, cy, cx + r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + r);
  ctx.quadraticCurveTo(cx, cy, cx - r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - r);
  ctx.fill();

  // Highlight center dot
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(1.5, size * 0.28), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Draws a single crisp vector Shiny Sparkle Star with Tier Color (Tier 1 Yellow, Tier 2 Blue, Tier 3 Red)
 */
export function drawShinyTierSparkles(ctx: any, startX: number, centerY: number, tier: number, size: number = 7.5): number {
  if (tier <= 0) return startX;
  const color = tier === 3 ? "#EF4444" : tier === 2 ? "#3B82F6" : "#F59E0B";
  drawShinySparkle(ctx, startX + size, centerY, size, color);
  return startX + size * 2 + 5;
}

/**
 * Draws a clean vector Crossed Sword Icon for Moves Tab
 */
export function drawSwordIcon(ctx: any, cx: number, cy: number, size: number = 6, color: string = "#FFFFFF") {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  // Blade 1
  ctx.moveTo(cx - size, cy - size);
  ctx.lineTo(cx + size, cy + size);
  // Cross guard 1
  ctx.moveTo(cx - size * 0.4, cy - size * 0.8);
  ctx.lineTo(cx - size * 0.8, cy - size * 0.4);

  // Blade 2
  ctx.moveTo(cx + size, cy - size);
  ctx.lineTo(cx - size, cy + size);
  // Cross guard 2
  ctx.moveTo(cx + size * 0.4, cy - size * 0.8);
  ctx.lineTo(cx + size * 0.8, cy - size * 0.4);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws a clean vector Book/Dex Icon for Ability/Pokedex cards
 */
export function drawBookIcon(ctx: any, cx: number, cy: number, w: number = 12, h: number = 10, color: string = "#60A5FA") {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(cx - w / 2, cy - h / 2, w / 2, h);
  ctx.strokeRect(cx, cy - h / 2, w / 2, h);
  ctx.beginPath();
  ctx.moveTo(cx, cy - h / 2);
  ctx.lineTo(cx, cy + h / 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws a clean vector Bag Icon
 */
export function drawVectorBag(ctx: any, cx: number, cy: number, w: number, h: number, color: string = "#F4A261") {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - w / 2, cy - h / 4, w, h * 0.75);
  ctx.beginPath();
  ctx.arc(cx, cy - h / 4, w * 0.28, Math.PI, 0);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws Vector Candy Icon (PokéRogue Style Striped Wrapped Candy)
 */
export function drawCandyIcon(ctx: any, cx: number, cy: number, r: number = 6.5, mainColor: string = "#F59E0B", stripeColor: string = "#FEF08A") {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI / 12);

  // 1. Left Wrapper Frill
  ctx.fillStyle = mainColor;
  ctx.beginPath();
  ctx.moveTo(-r * 0.7, -1);
  ctx.lineTo(-r * 1.8, -r * 0.9);
  ctx.lineTo(-r * 1.6, -r * 0.3);
  ctx.lineTo(-r * 2.0, 0);
  ctx.lineTo(-r * 1.6, r * 0.3);
  ctx.lineTo(-r * 1.8, r * 0.9);
  ctx.lineTo(-r * 0.7, 1);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#B45309";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // 2. Right Wrapper Frill
  ctx.fillStyle = mainColor;
  ctx.beginPath();
  ctx.moveTo(r * 0.7, -1);
  ctx.lineTo(r * 1.8, -r * 0.9);
  ctx.lineTo(r * 1.6, -r * 0.3);
  ctx.lineTo(r * 2.0, 0);
  ctx.lineTo(r * 1.6, r * 0.3);
  ctx.lineTo(r * 1.8, r * 0.9);
  ctx.lineTo(r * 0.7, 1);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#B45309";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // 3. Candy Center Ball
  ctx.fillStyle = mainColor;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // 4. Swirl / Stripes on Ball
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();

  ctx.strokeStyle = stripeColor;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(-r * 0.6, 0, r * 0.9, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(r * 0.6, 0, r * 0.9, Math.PI * 0.5, Math.PI * 1.5);
  ctx.stroke();

  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(-r * 0.8, -r * 0.8);
  ctx.lineTo(r * 0.8, r * 0.8);
  ctx.stroke();

  // Highlight
  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
  ctx.beginPath();
  ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.3, r * 0.18, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Center Ball Outline
  ctx.strokeStyle = "#B45309";
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();

  // Knot Bands
  ctx.fillStyle = "#D97706";
  ctx.fillRect(-r * 0.75, -2, 1.2, 4);
  ctx.fillRect(r * 0.75 - 1.2, -2, 1.2, 4);

  ctx.restore();
}

/**
 * Draws Vector Padlock
 */
export function drawLockIcon(ctx: any, cx: number, cy: number, w: number = 9, h: number = 10, color: string = "#64748B") {
  const bodyH = h * 0.6;
  const bodyY = cy - bodyH / 2 + 2;
  const bodyX = cx - w / 2;

  // Shackle
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const shackleR = w * 0.32;
  ctx.arc(cx, bodyY - 1, shackleR, Math.PI, 0);
  ctx.stroke();

  // Lock Body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(bodyX, bodyY, w, bodyH, 2);
  ctx.fill();

  // Keyhole
  ctx.fillStyle = "#10121A";
  ctx.beginPath();
  ctx.arc(cx, bodyY + bodyH * 0.45, 1.2, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draws Vector Gear / Settings Icon
 */
export function drawGearIcon(ctx: any, cx: number, cy: number, r: number = 5.5, color: string = "#60A5FA") {
  ctx.fillStyle = color;
  const teeth = 6;
  for (let i = 0; i < teeth; i++) {
    const angle = (i * Math.PI) / (teeth / 2);
    const tx = cx + Math.cos(angle) * (r * 1.25);
    const ty = cy + Math.sin(angle) * (r * 1.25);
    ctx.beginPath();
    ctx.arc(tx, ty, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Inner hole
  ctx.fillStyle = "#1B2030";
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draws Vector Pokemon Egg Icon
 */
export function drawEggIcon(ctx: any, cx: number, cy: number, rx: number = 10, ry: number = 14, color: string = "#FDE68A") {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Egg Spot details
  ctx.fillStyle = "rgba(239, 68, 68, 0.5)";
  ctx.beginPath();
  ctx.arc(cx - rx * 0.3, cy - ry * 0.2, rx * 0.32, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(59, 130, 246, 0.5)";
  ctx.beginPath();
  ctx.arc(cx + rx * 0.35, cy + ry * 0.25, rx * 0.28, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Reusable helper to draw the 6-Pokemon Party Split-Screen Panel (Vertical Split Line + Open Grid)
 */
export async function drawPartyRightPanel(
  ctx: any,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  options?: {
    username?: string;
    avatarUrl?: string;
    party?: TitleScreenPartyPokemon[];
    lang?: "en" | "ko";
    showSlotNumbers?: boolean;
    borderColor?: string;
  }
) {
  const isKo = options?.lang === "ko";
  const party = options?.party || [];
  const borderColor = options?.borderColor || "#3B82F6";

  // 1. Right Party Panel Background Card
  ctx.fillStyle = "#181C2B";
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 8);
  ctx.fill();

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  // 2. Trainer Profile Header inside the Right Panel
  const profileH = 44;
  ctx.fillStyle = "#10121C";
  ctx.beginPath();
  ctx.roundRect(boxX + 2, boxY + 2, boxW - 4, profileH, [6, 6, 0, 0]);
  ctx.fill();

  // Username
  ctx.font = "bold 13px DungGeunMo";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const userText = options?.username ? `${options.username}` : (isKo ? "트레이너 파티" : "Trainer Party");
  ctx.fillText(userText, boxX + 12, boxY + 22);

  // 3. 2x3 Grid for 6 Pokémon Slots
  const gridStartX = boxX + 8;
  const gridStartY = boxY + profileH + 8;
  const cardW = 110;
  const cardH = 88;
  const gapX = 8;
  const gapY = 8;

  for (let i = 0; i < 6; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cX = gridStartX + col * (cardW + gapX);
    const cY = gridStartY + row * (cardH + gapY);
    const mon = party[i];

    if (mon) {
      // Occupied Party Slot Card
      ctx.fillStyle = "#1E2438";
      ctx.beginPath();
      ctx.roundRect(cX, cY, cardW, cardH, 4);
      ctx.fill();

      ctx.strokeStyle = mon.isShiny ? "#F59E0B" : "#2E3854";
      ctx.lineWidth = mon.isShiny ? 1.5 : 1;
      ctx.stroke();

      // Sprite
      const sprite = await getPokemonSprite(mon.speciesId, true, mon.shinyTier !== undefined ? mon.shinyTier : (mon.isShiny ? 1 : 0));
      if (sprite) {
        ctx.drawImage(sprite, cX + cardW / 2 - 25, cY + 4, 50, 50);
      }

      // Name & Level
      ctx.textAlign = "center";
      ctx.font = "bold 11px DungGeunMo";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(mon.name, cX + cardW / 2, cY + 62);

      ctx.font = "10px DungGeunMo";
      ctx.fillStyle = "#94A3B8";
      ctx.fillText(`Lv.${mon.level}`, cX + cardW / 2, cY + 76);

      // Shiny Sparkle
      if (mon.isShiny) {
        drawShinySparkle(ctx, cX + cardW - 10, cY + 10, 4, "#F59E0B");
      }
    } else {
      // Empty Slot Card
      ctx.fillStyle = "#141724";
      ctx.beginPath();
      ctx.roundRect(cX, cY, cardW, cardH, 4);
      ctx.fill();

      ctx.strokeStyle = "#252B42";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 11px DungGeunMo";
      ctx.fillStyle = "#475569";
      ctx.fillText(options?.showSlotNumbers ? `Slot ${i + 1}` : (isKo ? "- 빈 슬롯 -" : "- Empty -"), cX + cardW / 2, cY + cardH / 2);
    }
  }
}

/**
 * Draws PokéRogue / Official style SVG vector Move Category Icon (Physical, Special, Status)
 */
export function drawMoveCategoryIcon(ctx: any, x: number, y: number, category: "physical" | "special" | "status", w: number = 22, h: number = 22) {
  const cat = (category || "status").toLowerCase();

  if (cat === "physical") {
    // Physical: Vivid Crimson + Spiky Impact Burst
    ctx.fillStyle = "#E11D48";
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 4);
    ctx.fill();

    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    const spikes = 8;
    const outerR = 6.8;
    const innerR = 3.2;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / spikes;
      const sx = cx + Math.cos(angle) * r;
      const sy = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.fill();
  } else if (cat === "special") {
    // Special: Deep Indigo/Cyan + Concentric Energy Waves
    ctx.fillStyle = "#4F46E5";
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 4);
    ctx.fill();

    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(cx, cy, 6.2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 3.4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(cx, cy, 1.4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Status: Slate-Gray + Yin-Yang Swirl
    ctx.fillStyle = "#6B7C96";
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 4);
    ctx.fill();

    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(cx, cy, 6.0, 0, Math.PI);
    ctx.fill();

    ctx.fillStyle = "#6B7C96";
    ctx.beginPath();
    ctx.arc(cx - 3.0, cy, 3.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(cx + 3.0, cy, 3.0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draws PokéRogue / Official style SVG vector Type Icon for all 18 Pokémon Types
 */
export function drawTypeIcon(ctx: any, x: number, y: number, size: number, typeName: string, shape: "circle" | "rounded" = "rounded") {
  const cleanType = (typeName || "normal").toLowerCase().trim();
  const color = {
    normal: "#929DA3", fire: "#EE8130", water: "#6390F0", grass: "#7AC74C",
    electric: "#F7D02C", ice: "#96D9D6", fighting: "#C22E28", poison: "#A33EA1",
    ground: "#E2BF65", flying: "#A98FF3", psychic: "#F95587", bug: "#A6B91A",
    rock: "#B6A136", ghost: "#735797", dragon: "#6F35FC", steel: "#B7B7CE",
    fairy: "#D685AD", dark: "#705746"
  }[cleanType] || "#777777";
  const r = size / 2;
  const cx = x + r;
  const cy = y + r;

  ctx.save();

  // Background badge container
  ctx.fillStyle = color;
  ctx.beginPath();
  if (shape === "circle") {
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  } else {
    ctx.roundRect(x, y, size, size, Math.max(3, Math.floor(size * 0.18)));
  }
  ctx.fill();

  // Vector Glyph setup
  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = Math.max(1.2, size * 0.08);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const s = size / 24;

  ctx.translate(cx, cy);
  ctx.scale(s, s);

  switch (cleanType) {
    case "fire": {
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.bezierCurveTo(3.5, -5, 7, -1, 7, 4);
      ctx.bezierCurveTo(7, 8, 4, 9, 0, 9);
      ctx.bezierCurveTo(-4, 9, -7, 8, -7, 4);
      ctx.bezierCurveTo(-7, -1, -3.5, -5, 0, -9);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, 1.5);
      ctx.bezierCurveTo(2, 3.5, 3, 5.5, 3, 7);
      ctx.bezierCurveTo(3, 8.5, 1.5, 8.8, 0, 8.8);
      ctx.bezierCurveTo(-1.5, 8.8, -3, 8.5, -3, 7);
      ctx.bezierCurveTo(-3, 5.5, -2, 3.5, 0, 1.5);
      ctx.fill();
      break;
    }
    case "water": {
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.bezierCurveTo(4, -3, 7, 2, 7, 5);
      ctx.bezierCurveTo(7, 8.5, 3.5, 9.5, 0, 9.5);
      ctx.bezierCurveTo(-3.5, 9.5, -7, 8.5, -7, 5);
      ctx.bezierCurveTo(-7, 2, -4, -3, 0, -9);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 4.5, 3.8, -Math.PI * 0.7, -Math.PI * 0.1);
      ctx.stroke();
      break;
    }
    case "grass": {
      ctx.beginPath();
      ctx.moveTo(-6, 6);
      ctx.quadraticCurveTo(-6, -6, 7, -7);
      ctx.quadraticCurveTo(6, 6, -6, 6);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-5, 5);
      ctx.lineTo(4, -4);
      ctx.stroke();
      break;
    }
    case "electric": {
      ctx.beginPath();
      ctx.moveTo(1.5, -9);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-0.5, 0);
      ctx.lineTo(-3, 9);
      ctx.lineTo(6, -1);
      ctx.lineTo(1, -1);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "normal": {
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "ice": {
      ctx.lineWidth = 1.8;
      for (let i = 0; i < 3; i++) {
        const ang = (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * -8, Math.sin(ang) * -8);
        ctx.lineTo(Math.cos(ang) * 8, Math.sin(ang) * 8);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "fighting": {
      ctx.beginPath();
      ctx.roundRect(-6, -6, 12, 12, 3);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-2, -6); ctx.lineTo(-2, 2);
      ctx.moveTo(2, -6); ctx.lineTo(2, 2);
      ctx.stroke();
      break;
    }
    case "poison": {
      ctx.beginPath();
      ctx.arc(0, -2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-3.5, 2, 7, 5);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(-2, -2, 1.4, 0, Math.PI * 2);
      ctx.arc(2, -2, 1.4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "ground": {
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(7, 5);
      ctx.lineTo(-7, 5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-4, 0); ctx.lineTo(4, 0);
      ctx.stroke();
      break;
    }
    case "flying": {
      ctx.beginPath();
      ctx.moveTo(0, 5);
      ctx.quadraticCurveTo(-4, 0, -8, -5);
      ctx.quadraticCurveTo(-3, -3, 0, -1);
      ctx.quadraticCurveTo(3, -3, 8, -5);
      ctx.quadraticCurveTo(4, 0, 0, 5);
      ctx.fill();
      break;
    }
    case "psychic": {
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.quadraticCurveTo(0, -6, 8, 0);
      ctx.quadraticCurveTo(0, 6, -8, 0);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "bug": {
      ctx.beginPath();
      ctx.arc(0, -3, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, 3, 5, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -2); ctx.lineTo(0, 8);
      ctx.stroke();
      break;
    }
    case "rock": {
      ctx.beginPath();
      ctx.moveTo(-3, -7);
      ctx.lineTo(4, -6);
      ctx.lineTo(7, 1);
      ctx.lineTo(3, 7);
      ctx.lineTo(-5, 6);
      ctx.lineTo(-7, -1);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-3, -7); ctx.lineTo(0, 0); ctx.lineTo(3, 7);
      ctx.moveTo(0, 0); ctx.lineTo(-7, -1);
      ctx.moveTo(0, 0); ctx.lineTo(7, 1);
      ctx.stroke();
      break;
    }
    case "ghost": {
      ctx.beginPath();
      ctx.arc(0, -2, 6, Math.PI, 0);
      ctx.lineTo(6, 4);
      ctx.lineTo(3, 7);
      ctx.lineTo(0, 4);
      ctx.lineTo(-3, 7);
      ctx.lineTo(-6, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(-2.2, -2, 1.3, 0, Math.PI * 2);
      ctx.arc(2.2, -2, 1.3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "dragon": {
      ctx.beginPath();
      ctx.moveTo(-7, 6);
      ctx.quadraticCurveTo(-4, -6, 6, -6);
      ctx.lineTo(1, -1);
      ctx.lineTo(6, 1);
      ctx.lineTo(0, 4);
      ctx.lineTo(4, 7);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "dark": {
      ctx.beginPath();
      ctx.arc(0, 0, 7, -Math.PI * 0.4, Math.PI * 0.7);
      ctx.arc(-2.5, 0, 5.5, Math.PI * 0.6, -Math.PI * 0.35, true);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "steel": {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const hx = Math.cos(a) * 7.2;
        const hy = Math.sin(a) * 7.2;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "fairy": {
      ctx.beginPath();
      const outer = 8;
      const inner = 2.5;
      for (let p = 0; p < 8; p++) {
        const rad = p % 2 === 0 ? outer : inner;
        const ang = (p * Math.PI) / 4;
        const fx = Math.cos(ang) * rad;
        const fy = Math.sin(ang) * rad;
        if (p === 0) ctx.moveTo(fx, fy);
        else ctx.lineTo(fx, fy);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    default: {
      ctx.beginPath();
      ctx.moveTo(0, -6); ctx.lineTo(6, 0); ctx.lineTo(0, 6); ctx.lineTo(-6, 0);
      ctx.closePath();
      ctx.fill();
      break;
    }
  }

  ctx.restore();
}

/**
 * Draws a sharp, authentic PokéRogue / RPG-style Target / Bullseye (과녁) Icon for Accuracy (🎯)
 */
export function drawTargetIcon(ctx: any, cx: number, cy: number, r: number = 6.0, color: string = "#38BDF8") {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.3;

  // Outer Ring
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // 4 Crosshairs extending slightly outside and inside
  const crossIn = r * 0.45;
  const crossOut = r + 1.6;

  ctx.beginPath();
  // Top
  ctx.moveTo(cx, cy - crossOut);
  ctx.lineTo(cx, cy - crossIn);
  // Bottom
  ctx.moveTo(cx, cy + crossIn);
  ctx.lineTo(cx, cy + crossOut);
  // Left
  ctx.moveTo(cx - crossOut, cy);
  ctx.lineTo(cx - crossIn, cy);
  // Right
  ctx.moveTo(cx + crossIn, cy);
  ctx.lineTo(cx + crossOut, cy);
  ctx.stroke();

  // Center Bullseye Dot
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
