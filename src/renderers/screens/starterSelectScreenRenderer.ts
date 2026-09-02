import { createCanvas, Image } from "@napi-rs/canvas";
import { StarterSelectScreenOptions, GenSelectScreenOptions, StarterSelectPartyItem, PartyViewTab, InGameMessage } from "../types.js";
import { getPokemonSprite, drawPokemonShadow, drawPokemonSilhouetteShadow } from "../common/spriteLoader.js";
import { POKEMON_SPECIES_DATA } from "../../data/pokemonStats.js";
import { POKEMON_NAMES_KO } from "../../data/pokemonNamesKo.js";
import { STARTER_DATABASE, getStarterBySpeciesId, getStarterByDexNumber, GENERATION_INFO, StarterEntry } from "../../data/starterCosts.js";
import { MOVES_DATA } from "../../data/movesKo.js";
import { MOVES_EN_DESC } from "../../data/movesEn.js";
import { ABILITY_DETAILED_DESC_KO, ABILITY_DETAILED_DESC_EN } from "../../services/pokeApiService.js";
import { TYPE_COLORS, TYPE_NAMES_KO } from "../common/assetLoader.js";
import { drawShinySparkle, drawShinyTierSparkles, drawSwordIcon, drawBookIcon, drawCheckmark } from "../common/vectorIcons.js";
import { formatMoney } from "../common/textHelpers.js";


/**
 * Draws PokéRogue / Official style Move Category Icon (Physical 💥, Special 🌀, Status ☯️)
 */
function drawMoveCategoryIcon(ctx: any, x: number, y: number, category?: "physical" | "special" | "status") {
  if (!category) return;
  const w = 23;
  const h = 22;

  if (category === "physical") {
    // Physical: Vibrant Red-Orange + 8-Point Starburst Spark
    ctx.fillStyle = "#E0502E";
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 4);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    const cx = x + w / 2;
    const cy = y + h / 2;
    const outerR = 6.8;
    const innerR = 3.0;
    const points = 8;
    for (let p = 0; p < points * 2; p++) {
      const r = p % 2 === 0 ? outerR : innerR;
      const angle = (p * Math.PI) / points;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      if (p === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  } else if (category === "special") {
    // Special: Indigo-Blue + Dual Concentric Rings
    ctx.fillStyle = "#3B69B0";
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 4);
    ctx.fill();

    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.5;

    // Outer Ring
    ctx.beginPath();
    ctx.arc(cx, cy, 6.0, 0, Math.PI * 2);
    ctx.stroke();

    // Inner Core
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(cx, cy, 2.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (category === "status") {
    // Status: Slate-Gray + Yin-Yang Swirl
    ctx.fillStyle = "#6B7C96";
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 4);
    ctx.fill();

    const cx = x + w / 2;
    const cy = y + h / 2;
    // Dual Swirl / Yin-Yang Circle
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
function drawTypeIcon(ctx: any, x: number, y: number, size: number, typeName: string, shape: "circle" | "rounded" = "rounded") {
  const cleanType = (typeName || "normal").toLowerCase().trim();
  const color = TYPE_COLORS[cleanType] || "#777777";
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

  const s = size / 24; // Scale factor based on 24x24 grid

  ctx.translate(cx, cy);
  ctx.scale(s, s);

  switch (cleanType) {
    case "fire": {
      // Flame glyph
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.bezierCurveTo(3.5, -5, 7, -1, 7, 4);
      ctx.bezierCurveTo(7, 8, 4, 9, 0, 9);
      ctx.bezierCurveTo(-4, 9, -7, 8, -7, 4);
      ctx.bezierCurveTo(-7, -1, -3.5, -5, 0, -9);
      ctx.fill();
      // Inner flame cutout
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
      // Water droplet
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.bezierCurveTo(4, -3, 7, 2, 7, 5);
      ctx.bezierCurveTo(7, 8.5, 3.5, 9.5, 0, 9.5);
      ctx.bezierCurveTo(-3.5, 9.5, -7, 8.5, -7, 5);
      ctx.bezierCurveTo(-7, 2, -4, -3, 0, -9);
      ctx.fill();
      // Inner reflection arc
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 4.5, 3.8, -Math.PI * 0.7, -Math.PI * 0.1);
      ctx.stroke();
      break;
    }
    case "grass": {
      // Leaf with vein
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
      // Lightning bolt
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
      // Concentric circles
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
      // Snowflake crystal
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
      // Fist silhouette
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
      // Poison skull
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
      // Mountain earth strata
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
      // Dual wings
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
      // Eye with pupil
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
      // Insect silhouette
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
      // Faceted Boulder
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
      // Spooky wisp
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
      // Dragon crest
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
      // Crescent Moon
      ctx.beginPath();
      ctx.arc(0, 0, 7, -Math.PI * 0.4, Math.PI * 0.7);
      ctx.arc(-2.5, 0, 5.5, Math.PI * 0.6, -Math.PI * 0.35, true);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "steel": {
      // Hex nut
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
      // 8-point sparkle star
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
function drawTargetIcon(ctx: any, cx: number, cy: number, r: number = 6.0, color: string = "#38BDF8") {
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

/**
 * Draws Vector Candy Icon (PokéRogue Style Striped Wrapped Candy)
 */
function drawCandyIcon(ctx: any, cx: number, cy: number, r: number = 6.5, mainColor: string = "#F59E0B", stripeColor: string = "#FEF08A") {
  ctx.save();
  ctx.translate(cx, cy);
  // Slight tilt for classic candy look
  ctx.rotate(-Math.PI / 12);

  // 1. Left Wrapper Frill (Twisted Fan)
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

  // 2. Right Wrapper Frill (Twisted Fan)
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

  // 3. Candy Center Ball (Solid Circle)
  ctx.fillStyle = mainColor;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // 4. Swirl / Stripes on Ball (Clip to circle)
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

  // Middle Diagonal Stripe
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(-r * 0.8, -r * 0.8);
  ctx.lineTo(r * 0.8, r * 0.8);
  ctx.stroke();

  // Top-Left Gloss Highlight
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
 * Draws Vector Padlock (Body + U-shackle)
 */
function drawLockIcon(ctx: any, cx: number, cy: number, w: number = 9, h: number = 10, color: string = "#64748B") {
  const bodyH = h * 0.6;
  const bodyY = cy - bodyH / 2 + 2;
  const bodyX = cx - w / 2;

  // Shackle (Arch)
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
function drawGearIcon(ctx: any, cx: number, cy: number, r: number = 5.5, color: string = "#60A5FA") {
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
function drawEggIcon(ctx: any, cx: number, cy: number, rx: number = 10, ry: number = 14, color: string = "#FDE68A") {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Egg Spot details
  ctx.fillStyle = "rgba(239, 68, 68, 0.5)"; // red spot
  ctx.beginPath();
  ctx.arc(cx - rx * 0.3, cy - ry * 0.2, rx * 0.32, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(59, 130, 246, 0.5)"; // blue spot
  ctx.beginPath();
  ctx.arc(cx + rx * 0.35, cy + ry * 0.25, rx * 0.28, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draws an authentic Pokémon Sprite Silhouette Shadow.
 * Extracts the exact pixel outline of the battler's sprite,
 * creates a silhouette mask, and projects/skews it flat onto the platform ground.
 */


interface PreviewAndPartyPanelArgs {
  panelX: number;
  panelW: number;
  sel: StarterEntry | null;
  selectedSprite: Image | null;
  selProgress: any;
  selHasHa: boolean;
  selHasPassive: boolean;
  party: StarterSelectPartyItem[];
  partySprites: (Image | null)[];
  currentCost: number;
  maxCost: number;
  isKo: boolean;
  selectedPartyIdx?: number;
  isPartyView?: boolean;
}

function renderPreviewAndPartyPanel(ctx: any, args: PreviewAndPartyPanelArgs) {
  const {
    panelX, panelW, sel, selectedSprite, selProgress,
    selHasHa, selHasPassive, party, partySprites,
    currentCost, maxCost, isKo, selectedPartyIdx, isPartyView
  } = args;

  // =========================================================================
  // PARTY VIEW MODE: Pokemon Info Header + 2x3 Vertical Grid (y: 10 ~ 370)
  // =========================================================================
  if (isPartyView) {
    // 1. TOP HEADER: Selected Pokemon Info (Dex Style: Sprite, Name, Types, Ability, Passive)
    if (sel) {
      const selShinyTier = selProgress?.shinyTier || 0;

      // Sprite Box (66x66)
      const showBoxX = panelX;
      const showBoxY = 10;
      const showBoxSize = 66;

      ctx.fillStyle = "#141722";
      ctx.beginPath();
      ctx.roundRect(showBoxX, showBoxY, showBoxSize, showBoxSize, 6);
      ctx.fill();

      if (selectedSprite) {
        const scale = 1.25;
        const sprW = selectedSprite.width * scale;
        const sprH = selectedSprite.height * scale;
        ctx.drawImage(selectedSprite, showBoxX + (showBoxSize - sprW) / 2, showBoxY + (showBoxSize - sprH) / 2, sprW, sprH);
      }

      // Dex Tag & Name
      const infoX = showBoxX + showBoxSize + 8;
      const headerY = showBoxY + 11;
      const dexTag = sel.dexNumber <= 0 ? "#---" : `#${String(sel.dexNumber).padStart(3, "0")}`;

      ctx.textBaseline = "middle";
      ctx.font = "bold 13px DungGeunMo";
      ctx.fillStyle = "#8E96AB";
      ctx.textAlign = "left";
      ctx.fillText(dexTag, infoX, headerY);

      const tagW = ctx.measureText(dexTag).width;
      const nameX = infoX + tagW + 6;

      ctx.font = "bold 17px DungGeunMo";
      ctx.fillStyle = "#FFFFFF";
      const displayName = isKo ? sel.nameKo : sel.name;
      ctx.fillText(displayName, nameX, headerY);

      // Type Badges & Ability / Passive Tags
      const types = sel.types && sel.types.length > 0 ? sel.types : ["normal"];
      const badgeW = 44;

      if (types.length === 1) {
        const tLower = types[0].toLowerCase();
        const tColor = TYPE_COLORS[tLower] || "#777777";
        const tDisplay = isKo ? (TYPE_NAMES_KO[tLower] || types[0]) : types[0].toUpperCase();
        const badgeH = 24;
        const bY = 38;

        ctx.fillStyle = tColor;
        ctx.beginPath();
        ctx.roundRect(infoX, bY, badgeW, badgeH, 4);
        ctx.fill();
        ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.textBaseline = "middle";
        ctx.font = "bold 12px DungGeunMo";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.fillText(tDisplay, infoX + badgeW / 2, bY + badgeH / 2);
      } else {
        const badgeH = 18;
        types.slice(0, 2).forEach((tName, tIdx) => {
          const tLower = tName.toLowerCase();
          const tColor = TYPE_COLORS[tLower] || "#777777";
          const tDisplay = isKo ? (TYPE_NAMES_KO[tLower] || tName) : tName.toUpperCase();
          const bY = 30 + tIdx * (badgeH + 3);

          ctx.fillStyle = tColor;
          ctx.beginPath();
          ctx.roundRect(infoX, bY, badgeW, badgeH, 3);
          ctx.fill();
          ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.textBaseline = "middle";
          ctx.font = "bold 11px DungGeunMo";
          ctx.fillStyle = "#FFFFFF";
          ctx.textAlign = "center";
          ctx.fillText(tDisplay, infoX + badgeW / 2, bY + badgeH / 2);
        });
      }

      const rightColX = infoX + badgeW + 8;

      // Ability Tag
      let abLabel = isKo ? `[특성] ${sel.abilityKo}` : `[Ab] ${sel.ability}`;
      if (selHasHa && sel.hiddenAbility) {
        abLabel = isKo ? `[숨특] ${sel.hiddenAbilityKo}` : `[HA] ${sel.hiddenAbility}`;
      }
      ctx.textBaseline = "middle";
      ctx.font = "bold 13px DungGeunMo";
      ctx.fillStyle = selHasHa ? "#FB923C" : "#FFFFFF";
      ctx.textAlign = "left";
      ctx.fillText(abLabel, rightColX, 40);

      // Passive Tag
      const hasPassUnlocked = selProgress?.passiveUnlocked || false;
      let passiveName = isKo ? "[패시브] 미해금" : "[Passive] Locked";
      if (hasPassUnlocked) {
        passiveName = selHasPassive
          ? (isKo ? `[패시브] ${sel.passiveAbilityKo}` : `[Passive] ${sel.passiveAbility}`)
          : (isKo ? `[패시브] OFF` : `[Passive] OFF`);
      }
      ctx.font = "bold 13px DungGeunMo";
      ctx.fillStyle = selHasPassive ? "#34D399" : "#64748B";
      ctx.fillText(passiveName, rightColX, 60);
    } else {
      // Unselected Placeholder
      ctx.fillStyle = "#141722";
      ctx.beginPath();
      ctx.roundRect(panelX, 10, panelW, 66, 6);
      ctx.fill();
      ctx.strokeStyle = "#2D3246";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.textBaseline = "middle";
      ctx.font = "bold 15px DungGeunMo";
      ctx.fillStyle = "#CBD5E1";
      ctx.textAlign = "center";
      ctx.fillText(isKo ? "파티원 관리 대시보드" : "Party Overview", panelX + panelW / 2, 32);

      ctx.font = "bold 12px DungGeunMo";
      ctx.fillStyle = "#94A3B8";
      ctx.fillText(isKo ? `출전 파티원: ${party.length} / 6 마리` : `Party Members: ${party.length} / 6`, panelX + panelW / 2, 54);
    }

    // 2. COST GAUGE BAR (y: 88)
    const costLineY = 90;
    const isOverCost = currentCost > maxCost;
    const costColor = isOverCost ? "#EF4444" : (currentCost >= 8 ? "#F59E0B" : "#22C55E");

    ctx.textBaseline = "middle";
    ctx.font = "bold 15px DungGeunMo";
    ctx.fillStyle = costColor;
    ctx.textAlign = "left";
    const costText = `${isKo ? "코스트" : "COST"} : ${currentCost} / ${maxCost}`;
    ctx.fillText(costText, panelX, costLineY);
    const costTextW = ctx.measureText(costText).width;

    const gaugeX = panelX + costTextW + 8;
    const gaugeW = panelX + panelW - gaugeX;
    const gaugeH = 8;
    const gaugeY = costLineY - gaugeH / 2;

    ctx.fillStyle = "#12141C";
    ctx.beginPath();
    ctx.roundRect(gaugeX, gaugeY, gaugeW, gaugeH, 3);
    ctx.fill();
    ctx.strokeStyle = "#282D3D";
    ctx.lineWidth = 1;
    ctx.stroke();

    const fillRatio = Math.min(1.0, currentCost / maxCost);
    const fillW = Math.max(fillRatio > 0 ? 4 : 0, fillRatio * gaugeW);
    ctx.fillStyle = costColor;
    ctx.beginPath();
    ctx.roundRect(gaugeX, gaugeY, fillW, gaugeH, 3);
    ctx.fill();

    // 3. 2 Columns x 3 Rows Vertical Grid (y: 106 ~ 368, H: 82 each)
    const slotW = (panelW - 6) / 2;
    const slotH = 82;
    const gapX = 6;
    const gapY = 6;
    const startY = 106;

    for (let pIdx = 0; pIdx < 6; pIdx++) {
      const member = party[pIdx];
      const pCol = pIdx % 2;
      const pRow = Math.floor(pIdx / 2);
      const pX = panelX + pCol * (slotW + gapX);
      const pY = startY + pRow * (slotH + gapY);
      const isInspected = selectedPartyIdx !== undefined && selectedPartyIdx === pIdx;

      ctx.fillStyle = isInspected ? "#1A2032" : (member ? "#161B2A" : "#121520");
      ctx.beginPath();
      ctx.roundRect(pX, pY, slotW, slotH, 5);
      ctx.fill();

      if (isInspected) {
        ctx.strokeStyle = "#5865F2";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Slot Number Text (Top-Left: P1 ~ P6, Clean text without badge box)
      ctx.textBaseline = "middle";
      ctx.font = "bold 13px DungGeunMo";
      ctx.fillStyle = isInspected ? "#5865F2" : "#64748B";
      ctx.textAlign = "left";
      ctx.fillText(`P${pIdx + 1}`, pX + 8, pY + 12);

      if (member) {
        // Sprite (Centered Left, 44x44 area)
        const pSprite = partySprites[pIdx];
        if (pSprite) {
          const scale = 0.75;
          const sprW = pSprite.width * scale;
          const sprH = pSprite.height * scale;
          ctx.drawImage(pSprite, pX + 4 + (44 - sprW) / 2, pY + 22 + (44 - sprH) / 2, sprW, sprH);
        }

        // Shiny Sparkle
        const sTier = member.shinyTier || 0;
        if (sTier > 0) {
          drawShinyTierSparkles(ctx, pX + 6, pY + 66, sTier, 4.5);
        }

        // Member Name & Cost (Right Aligned in Slot)
        ctx.textBaseline = "middle";
        ctx.font = "bold 14px DungGeunMo";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "left";
        ctx.fillText(member.name.slice(0, 5), pX + 52, pY + 36);

        // Cost
        ctx.font = "bold 13px DungGeunMo";
        ctx.fillStyle = member.usePassive ? "#34D399" : "#F59E0B";
        ctx.fillText(`${member.cost}C`, pX + 52, pY + 58);
      } else {
        // Empty Slot Marker
        ctx.textBaseline = "middle";
        ctx.font = "bold 20px DungGeunMo";
        ctx.fillStyle = "#334155";
        ctx.textAlign = "center";
        ctx.fillText("+", pX + slotW / 2, pY + 34);

        ctx.font = "bold 12px DungGeunMo";
        ctx.fillStyle = "#475569";
        ctx.fillText(isKo ? "빈 슬롯" : "Empty", pX + slotW / 2, pY + 56);
      }
    }

    return;
  }

  if (sel) {
    const selShinyTier = selProgress?.shinyTier || 0;

    // Sprite Box (70x70) - Clean Uniform Border
    const showBoxX = panelX;
    const showBoxY = 10;
    const showBoxSize = 70;

    ctx.fillStyle = "#141722";
    ctx.beginPath();
    ctx.roundRect(showBoxX, showBoxY, showBoxSize, showBoxSize, 6);
    ctx.fill();

    if (selectedSprite) {
      const scale = 1.3;
      const sprW = selectedSprite.width * scale;
      const sprH = selectedSprite.height * scale;
      ctx.drawImage(selectedSprite, showBoxX + (showBoxSize - sprW) / 2, showBoxY + (showBoxSize - sprH) / 2, sprW, sprH);
    }

    // Name + Dex next to sprite (Enlarged, True Middle Baseline)
    const infoX = showBoxX + showBoxSize + 10;
    const headerY = showBoxY + 12;
    const dexTag = sel.dexNumber <= 0 ? "#---" : `#${String(sel.dexNumber).padStart(3, "0")}`;

    ctx.textBaseline = "middle";
    ctx.font = "bold 14px DungGeunMo";
    ctx.fillStyle = "#8E96AB";
    ctx.textAlign = "left";
    ctx.fillText(dexTag, infoX, headerY);

    const tagW = ctx.measureText(dexTag).width;
    const nameX = infoX + tagW + 6;

    ctx.font = "bold 19px DungGeunMo";
    ctx.fillStyle = "#FFFFFF";
    const displayName = isKo ? sel.nameKo : sel.name;
    ctx.fillText(displayName, nameX, headerY);

    // 2-COLUMN SECTION: Left = Type Badges, Right = Ability & Passive
    const types = sel.types && sel.types.length > 0 ? sel.types : ["normal"];
    const badgeW = 46;

    // 1) LEFT COLUMN: Type Badges (Vertical Stack if Dual Type, Centered if Single Type)
    if (types.length === 1) {
      const tLower = types[0].toLowerCase();
      const tColor = TYPE_COLORS[tLower] || "#777777";
      const tDisplay = isKo ? (TYPE_NAMES_KO[tLower] || types[0]) : types[0].toUpperCase();
      const badgeH = 26;
      const bY = 40;

      ctx.fillStyle = tColor;
      ctx.beginPath();
      ctx.roundRect(infoX, bY, badgeW, badgeH, 4);
      ctx.fill();
      ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.textBaseline = "middle";
      ctx.font = "bold 13px DungGeunMo";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.fillText(tDisplay, infoX + badgeW / 2, bY + badgeH / 2);
    } else {
      // Dual Type: 2 Compact Badges Stacked
      const badgeH = 19;
      types.slice(0, 2).forEach((tName, tIdx) => {
        const tLower = tName.toLowerCase();
        const tColor = TYPE_COLORS[tLower] || "#777777";
        const tDisplay = isKo ? (TYPE_NAMES_KO[tLower] || tName) : tName.toUpperCase();
        const bY = 32 + tIdx * (badgeH + 4);

        ctx.fillStyle = tColor;
        ctx.beginPath();
        ctx.roundRect(infoX, bY, badgeW, badgeH, 3);
        ctx.fill();
        ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.textBaseline = "middle";
        ctx.font = "bold 12px DungGeunMo";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.fillText(tDisplay, infoX + badgeW / 2, bY + badgeH / 2);
      });
    }

    // 2) RIGHT COLUMN: Ability & Passive Tags (X = infoX + 54)
    const rightColX = infoX + badgeW + 8;

    // Ability / HA Tag (14px, True Middle Alignment)
    let abLabel = isKo ? `[특성] ${sel.abilityKo}` : `[Ab] ${sel.ability}`;
    if (selHasHa && sel.hiddenAbility) {
      abLabel = isKo ? `[숨특] ${sel.hiddenAbilityKo}` : `[HA] ${sel.hiddenAbility}`;
    }
    ctx.textBaseline = "middle";
    ctx.font = "bold 14px DungGeunMo";
    ctx.fillStyle = selHasHa ? "#FB923C" : "#FFFFFF";
    ctx.textAlign = "left";
    ctx.fillText(abLabel, rightColX, 43);

    // Passive Tag (14px, True Middle Alignment)
    const passiveName = selHasPassive ? (isKo ? `[패시브] ${sel.passiveAbilityKo}` : `[Passive] ${sel.passiveAbility}`) : (isKo ? "[패시브] 미해금" : "[Passive] Locked");
    ctx.font = "bold 14px DungGeunMo";
    ctx.fillStyle = selHasPassive ? "#34D399" : "#64748B";
    ctx.fillText(passiveName, rightColX, 64);

    if (!isPartyView) {
      // =========================================================================
      // STARTER SELECT MODE: Starting Moves Chips (2x2 Grid, width: 133 each, height: 36)
      // Reflects customized party moves if this Pokémon is in the current party!
      // =========================================================================
      const partyMember = party.find((p: StarterSelectPartyItem) => p.dexNumber === sel.dexNumber);
      const equippedMoves = (partyMember?.moves && partyMember.moves.length > 0)
        ? partyMember.moves
        : (sel.starterMoves || []);

      const moveChipW = (panelW - 10) / 2;
      const moveChipH = 36;
      for (let mIdx = 0; mIdx < 4; mIdx++) {
        const rawMove = equippedMoves[mIdx] || "---";
        const moveKey = rawMove.toLowerCase().replace(/[\s_]+/g, "-");
        const moveInfo = MOVES_DATA[moveKey];
        const mDisplay = isKo ? (moveInfo?.nameKo || rawMove) : (moveInfo?.name ? moveInfo.name.charAt(0).toUpperCase() + moveInfo.name.slice(1).replace(/-/g, " ") : rawMove);
        const category = moveInfo?.category;

        const mCol = mIdx % 2;
        const mRow = Math.floor(mIdx / 2);
        const mX = panelX + mCol * (moveChipW + 10);
        const mY = 90 + mRow * (moveChipH + 6);

        ctx.fillStyle = "#181B26";
        ctx.beginPath();
        ctx.roundRect(mX, mY, moveChipW, moveChipH, 5);
        ctx.fill();

        if (rawMove === "---" || !moveInfo) {
          ctx.textBaseline = "middle";
          ctx.font = "bold 15px DungGeunMo";
          ctx.fillStyle = "#475569";
          ctx.textAlign = "center";
          ctx.fillText(mDisplay, mX + moveChipW / 2, mY + moveChipH / 2);
        } else {
          // Draw Move Type SVG Icon (Left aligned, 22x22)
          const iconSize = 22;
          const iconX = mX + 6;
          const iconY = mY + (moveChipH - iconSize) / 2;
          drawTypeIcon(ctx, iconX, iconY, iconSize, moveInfo.type, "rounded");

          // Move Name Text (Aligned next to type icon, 15px)
          ctx.textBaseline = "middle";
          ctx.font = "bold 15px DungGeunMo";
          ctx.fillStyle = "#F8FAFC";
          ctx.textAlign = "left";
          ctx.fillText(mDisplay, mX + 35, mY + moveChipH / 2);
        }
      }
    }
  } else {
    // No Pokemon Selected State (Top Area y: 10 ~ 170)
    ctx.fillStyle = "#141722";
    ctx.beginPath();
    ctx.roundRect(panelX, 10, panelW, 160, 6);
    ctx.fill();
    ctx.strokeStyle = "#2D3246";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textBaseline = "middle";
    ctx.font = "bold 16px DungGeunMo";
    ctx.fillStyle = "#CBD5E1";
    ctx.textAlign = "center";
    ctx.fillText(isKo ? "파티원 관리 대시보드" : "Party Overview", panelX + panelW / 2, 45);

    ctx.font = "bold 13px DungGeunMo";
    ctx.fillStyle = "#94A3B8";
    ctx.fillText(isKo ? `출전 파티원: ${party.length} / 6 마리` : `Party Members: ${party.length} / 6`, panelX + panelW / 2, 80);

    ctx.font = "bold 12px DungGeunMo";
    ctx.fillStyle = "#64748B";
    ctx.fillText(isKo ? "파티원을 선택하면 상세 정보가 표시됩니다." : "Select a member below to inspect moves & forms.", panelX + panelW / 2, 115);
    ctx.fillText(isKo ? "하단 슬롯 또는 디스코드 버튼을 눌러주세요." : "Press P1~P6 buttons below.", panelX + panelW / 2, 138);
  }

  // 5-2. BOTTOM PARTY BUILDER (y: 178 ~ 370, Seamless Borderless Layout)
  const costLineY = 184;

  // Cost Counter Text + Inline Gauge Bar (Single Row, Perfect Vertical Center Alignment)
  const isOverCost = currentCost > maxCost;
  const costColor = isOverCost ? "#EF4444" : (currentCost >= 8 ? "#F59E0B" : "#22C55E");

  ctx.textBaseline = "middle";
  ctx.font = "bold 17px DungGeunMo";
  ctx.fillStyle = costColor;
  ctx.textAlign = "left";
  const costText = `${isKo ? "코스트" : "COST"} : ${currentCost} / ${maxCost}`;
  ctx.fillText(costText, panelX, costLineY);
  const costTextW = ctx.measureText(costText).width;

  // Inline Cost Gauge Bar right next to the text (100% Center Line Matched)
  const gaugeX = panelX + costTextW + 12;
  const gaugeW = panelX + panelW - gaugeX;
  const gaugeH = 10;
  const gaugeY = costLineY - gaugeH / 2;

  ctx.fillStyle = "#12141C";
  ctx.beginPath();
  ctx.roundRect(gaugeX, gaugeY, gaugeW, gaugeH, 3);
  ctx.fill();
  ctx.strokeStyle = "#282D3D";
  ctx.lineWidth = 1;
  ctx.stroke();

  const fillRatio = Math.min(1.0, currentCost / maxCost);
  const fillW = Math.max(fillRatio > 0 ? 4 : 0, fillRatio * gaugeW);
  ctx.fillStyle = costColor;
  ctx.beginPath();
  ctx.roundRect(gaugeX, gaugeY, fillW, gaugeH, 3);
  ctx.fill();

  // 6 Party Slots Grid (3 Columns x 2 Rows) - Height 80px, Bottom ends precisely at y = 370!
  const partySlotW = (panelW - 12) / 3;
  const partySlotH = 80;
  const partyGapX = 6;
  const partyGapY = 8;
  const partyStartX = panelX;
  const partyStartY = 202;

  for (let pIdx = 0; pIdx < 6; pIdx++) {
    const member = party[pIdx];
    const pCol = pIdx % 3;
    const pRow = Math.floor(pIdx / 3);
    const pX = partyStartX + pCol * (partySlotW + partyGapX);
    const pY = partyStartY + pRow * (partySlotH + partyGapY);
    const isInspected = selectedPartyIdx !== undefined && selectedPartyIdx === pIdx;

    ctx.fillStyle = isInspected ? "#222738" : (member ? "#1E2438" : "#181B26");
    ctx.beginPath();
    ctx.roundRect(pX, pY, partySlotW, partySlotH, 5);
    ctx.fill();

    if (isInspected) {
      ctx.strokeStyle = "#5865F2";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (member) {
      // Mini Sprite (Centered, Scale 0.7)
      const pSprite = partySprites[pIdx];
      if (pSprite) {
        const scale = 0.7;
        const sprW = pSprite.width * scale;
        const sprH = pSprite.height * scale;
        ctx.drawImage(pSprite, pX + (partySlotW - sprW) / 2, pY + 2 + (38 - sprH) / 2, sprW, sprH);
      }

      // Member Name + Cost (Middle textBaseline)
      ctx.textBaseline = "middle";
      ctx.font = "bold 15px DungGeunMo";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.fillText(member.name.slice(0, 4), pX + partySlotW / 2, pY + 52);

      ctx.font = "bold 14px DungGeunMo";
      ctx.fillStyle = member.usePassive ? "#34D399" : "#22C55E";
      ctx.fillText(`${member.cost}C`, pX + partySlotW / 2, pY + 68);
    } else {
      // Empty Slot Marker (True Middle Alignment)
      ctx.textBaseline = "middle";
      ctx.font = "bold 22px DungGeunMo";
      ctx.fillStyle = "#334155";
      ctx.textAlign = "center";
      ctx.fillText("+", pX + partySlotW / 2, pY + 34);

      ctx.font = "bold 13px DungGeunMo";
      ctx.fillStyle = "#475569";
      ctx.fillText(isKo ? `슬롯 ${pIdx + 1}` : `Slot ${pIdx + 1}`, pX + partySlotW / 2, pY + 56);
    }
  }
}

interface PartyCustomizationPanelArgs {
  panelX: number;
  panelW: number;
  sel?: StarterEntry | null;
  partyMember?: StarterSelectPartyItem | null;
  selProgress: any;
  isKo: boolean;
  tab?: PartyViewTab;
  selectedMoveIdx?: number;
  targetMoveSlot?: number;
  normalSprite?: Image | null;
  shinySprite?: Image | null;
  tierSprites?: any[];
}

function drawWrappedText(ctx: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  const paragraphs = text.split("\n");
  let curY = y;

  for (const p of paragraphs) {
    if (!p || p.trim().length === 0) {
      curY += lineHeight;
      continue;
    }
    const words = p.split(" ");
    let line = "";

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, curY);
        line = words[n] + " ";
        curY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, curY);
    curY += lineHeight;
  }

  return curY;
}

/**
 * Draws an authentic PokéRogue / Pokémon in-game dialogue message box overlaid on the top z-index layer
 * (Matched 100% to the Pokédex flavor text message box design)
 */
function drawInGameMessageBox(ctx: any, width: number, height: number, msg: InGameMessage, isKo: boolean) {
  // 1. Subtle Dim Overlay across the entire screen
  ctx.fillStyle = "rgba(7, 9, 15, 0.45)";
  ctx.fillRect(0, 0, width, height);

  // 2. In-Game Dialogue Box (Bottom Position: y: 264 ~ 368, H: 104, styled like Pokédex Card)
  const boxX = 14;
  const boxY = height - 112;
  const boxW = width - 28;
  const boxH = 102;

  // Outer border & dark background (Same as Pokédex Flavor Card)
  ctx.fillStyle = "#181B26";
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 6);
  ctx.fill();

  ctx.strokeStyle = "#282D3D";
  ctx.lineWidth = 1;
  ctx.stroke();

  // 3. Header: Pokédex-style Title + Move Type Badge + Stats on Right
  let curHeaderX = boxX + 12;

  if (msg.moveType) {
    drawTypeIcon(ctx, curHeaderX, boxY + 6, 20, msg.moveType, "rounded");
    curHeaderX += 26;
  }

  ctx.textBaseline = "middle";
  ctx.font = "bold 15px DungGeunMo";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  const displayTitle = isKo ? msg.title : msg.title.toUpperCase().replace(/[-_]+/g, " ");
  ctx.fillText(displayTitle, curHeaderX, boxY + 16);

  // Header Right: [Category Icon] + Power + [Target Icon] + Accuracy + PP
  let curRightX = boxX + boxW - 14;
  if (msg.movePp) {
    ctx.font = "bold 14px DungGeunMo";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const ppValText = ` ${msg.movePp}`;
    ctx.fillStyle = "#FCD34D";
    ctx.fillText(ppValText, curRightX, boxY + 16);
    const valW = ctx.measureText(ppValText).width;
    curRightX -= valW;

    ctx.fillStyle = "#F59E0B";
    ctx.fillText("PP:", curRightX, boxY + 16);
    curRightX -= ctx.measureText("PP:").width + 10;
  }

  if (msg.moveAccuracy) {
    ctx.font = "bold 14px DungGeunMo";
    ctx.fillStyle = "#F1F5F9";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(msg.moveAccuracy, curRightX, boxY + 16);
    curRightX -= ctx.measureText(msg.moveAccuracy).width + 6;

    // Draw Target (과녁) SVG Icon
    drawTargetIcon(ctx, curRightX - 6, boxY + 16, 6.2, "#38BDF8");
    curRightX -= 20;
  }

  if (msg.movePower) {
    ctx.font = "bold 14px DungGeunMo";
    ctx.fillStyle = "#F1F5F9";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(msg.movePower, curRightX, boxY + 16);
    curRightX -= ctx.measureText(msg.movePower).width + 10;
  }

  if (msg.moveCategory) {
    drawMoveCategoryIcon(ctx, curRightX - 23, boxY + 5, msg.moveCategory);
  }

  // Sub-divider line under header (matching Pokédex Card)
  ctx.strokeStyle = "#282D3D";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(boxX + 8, boxY + 28);
  ctx.lineTo(boxX + boxW - 8, boxY + 28);
  ctx.stroke();

  // 4. Flavor Text (Spacious & Clean Wrapping - pure description only)
  ctx.textBaseline = "top";
  ctx.font = "15px DungGeunMo";
  ctx.fillStyle = "#F1F5F9";
  ctx.textAlign = "left";
  drawWrappedText(ctx, msg.text, boxX + 12, boxY + 38, boxW - 24, 20);
}

function renderPartyCustomizationPanel(ctx: any, args: PartyCustomizationPanelArgs) {
  const { panelX, panelW, sel, partyMember, selProgress, isKo, normalSprite, shinySprite, tierSprites } = args;
  const currentTab: PartyViewTab = args.tab || "moves";
  const selectedMoveIdx = args.selectedMoveIdx || 0;

  const unlockedMaxShinyTier = selProgress?.shinyTier || 0;
  const currentShinyTier = partyMember?.shinyTier !== undefined ? partyMember.shinyTier : (partyMember?.isShiny ? Math.max(1, unlockedMaxShinyTier) : 0);
  const hasHaUnlocked = selProgress?.hasHiddenAbility || false;
  const useHa = partyMember?.useHiddenAbility || false;
  const hasPassiveUnlocked = selProgress?.passiveUnlocked || false;
  const usePassive = partyMember?.usePassive || false;
  const candies = selProgress?.candies || 0;

  // 1. Precise Tab Layout Dimensions & Container Bounds (Seamlessly fills right side)
  const tabGap = 6;
  const tabH = 32;
  const tabY = 6;
  const baselineY = tabY + tabH; // 38px

  const bodyX = panelX;
  const bodyY = baselineY;
  const bodyW = panelW;
  const bodyH = 370 - bodyY; // 332px

  const tabW = Math.floor((bodyW - (tabGap * 2)) / 3);

  const tabs: { id: PartyViewTab; labelKo: string; labelEn: string; icon: "moves" | "shiny" | "cost" }[] = [
    { id: "moves", labelKo: "기술", labelEn: "Moves", icon: "moves" },
    { id: "shiny", labelKo: "이로치", labelEn: "Shiny", icon: "shiny" },
    { id: "cost", labelKo: `${candies}개`, labelEn: `${candies}`, icon: "cost" },
  ];

  const activeIdx = tabs.findIndex(t => currentTab === t.id || (t.id === "moves" && currentTab === "learnable"));
  const safeActiveIdx = activeIdx >= 0 ? activeIdx : 0;
  const activeX = bodyX + safeActiveIdx * (tabW + tabGap);

  // 2. Draw Full Tab Body Panel Container (#1B202D Container covering y: 38 ~ 370)
  ctx.fillStyle = "#1B202D";
  ctx.beginPath();
  ctx.roundRect(bodyX, bodyY, bodyW, bodyH, [0, 0, 8, 8]);
  ctx.fill();

  ctx.strokeStyle = "#2E364A";
  ctx.lineWidth = 1;
  ctx.stroke();

  // 2-B. Draw Active Tab Body (Filled with #1B202D and Open at Bottom to connect directly to Body!)
  ctx.fillStyle = "#1B202D";
  ctx.beginPath();
  ctx.roundRect(activeX, tabY, tabW, tabH + 2, [6, 6, 0, 0]);
  ctx.fill();

  ctx.strokeStyle = "#5865F2";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  // Left border
  ctx.moveTo(activeX, baselineY + 1);
  ctx.lineTo(activeX, tabY + 6);
  // Top-left arc
  ctx.arcTo(activeX, tabY, activeX + 6, tabY, 6);
  // Top border
  ctx.lineTo(activeX + tabW - 6, tabY);
  // Top-right arc
  ctx.arcTo(activeX + tabW, tabY, activeX + tabW, tabY + 6, 6);
  // Right border
  ctx.lineTo(activeX + tabW, baselineY + 1);
  ctx.stroke();

  // 3. Draw Horizontal Blue Baseline OUTSIDE of the active tab (Exact match from bodyX to bodyX + bodyW)
  ctx.strokeStyle = "#5865F2";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (activeX > bodyX) {
    ctx.moveTo(bodyX, baselineY);
    ctx.lineTo(activeX, baselineY);
  }
  ctx.moveTo(activeX + tabW, baselineY);
  ctx.lineTo(bodyX + bodyW, baselineY);
  ctx.stroke();

  // 4. Render Tab Labels & Icons
  tabs.forEach((t, idx) => {
    const tX = bodyX + idx * (tabW + tabGap);
    const isAct = idx === safeActiveIdx;
    const iconColor = isAct ? "#FFFFFF" : "#64748B";

    if (t.icon === "moves") {
      drawSwordIcon(ctx, tX + 16, tabY + tabH / 2, 4.5, iconColor);
      ctx.textBaseline = "middle";
      ctx.font = "bold 13px DungGeunMo";
      ctx.fillStyle = isAct ? "#FFFFFF" : "#8E96AB";
      ctx.textAlign = "center";
      ctx.fillText(isKo ? t.labelKo : t.labelEn, tX + (tabW / 2) + 8, tabY + tabH / 2);
    } else if (t.icon === "shiny") {
      drawShinySparkle(ctx, tX + 16, tabY + tabH / 2, 5.5, iconColor);

      ctx.textBaseline = "middle";
      ctx.font = "bold 13px DungGeunMo";
      ctx.fillStyle = isAct ? "#FFFFFF" : "#8E96AB";
      ctx.textAlign = "center";
      ctx.fillText(isKo ? t.labelKo : t.labelEn, tX + (tabW / 2) + 8, tabY + tabH / 2);
    } else if (t.icon === "cost") {
      drawCandyIcon(ctx, tX + 16, tabY + tabH / 2, 4.8, "#F59E0B", "#FEF08A");
      ctx.textBaseline = "middle";
      ctx.font = "bold 13px DungGeunMo";
      ctx.fillStyle = isAct ? "#FFFFFF" : "#FCD34D";
      ctx.textAlign = "center";
      ctx.fillText(isKo ? t.labelKo : t.labelEn, tX + (tabW / 2) + 8, tabY + tabH / 2);
    }
  });

  // If No Party Member is inspected (selectedPartyIdx === -1)
  if (!sel || !partyMember) {
    return;
  }

  if (currentTab === "moves") {
    const contentX = bodyX + 12;
    const contentW = bodyW - 24;

    // 1. 2x2 Grid of Current Moves (4 Slots)
    const starterMoves = sel.starterMoves || [];
    const currentEquippedMoves = (partyMember?.moves && partyMember.moves.length > 0)
      ? partyMember.moves
      : starterMoves;

    const moveChipW = Math.floor((contentW - 8) / 2);
    const moveChipH = 34;

    for (let mIdx = 0; mIdx < 4; mIdx++) {
      const rawMove = currentEquippedMoves[mIdx];
      const isEmpty = !rawMove || rawMove === "---";
      const mCol = mIdx % 2;
      const mRow = Math.floor(mIdx / 2);
      const mX = contentX + mCol * (moveChipW + 8);
      const mY = bodyY + 12 + mRow * (moveChipH + 6);
      const isSel = selectedMoveIdx === mIdx;

      ctx.fillStyle = isSel ? "#242E48" : (isEmpty ? "#121520" : "#1A1F2C");
      ctx.beginPath();
      ctx.roundRect(mX, mY, moveChipW, moveChipH, 4);
      ctx.fill();

      if (isSel) {
        ctx.strokeStyle = "#5865F2";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.strokeStyle = isEmpty ? "#1E2333" : "#283044";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      if (isEmpty) {
        ctx.fillStyle = "#475569";
        ctx.font = "12px DungGeunMo";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`- ${isKo ? "기술" : "Move"} ${mIdx + 1} -`, mX + moveChipW / 2, mY + moveChipH / 2);
      } else {
        const moveKey = rawMove.toLowerCase().replace(/[\s_]+/g, "-");
        const mInfo = MOVES_DATA[moveKey];
        const mDisplay = isKo ? (mInfo?.nameKo || rawMove) : (mInfo?.name?.toUpperCase()?.replace(/[-_]+/g, " ") || rawMove.toUpperCase());

        if (mInfo) {
          drawTypeIcon(ctx, mX + 6, mY + 6, 22, mInfo.type, "rounded");
        }

        ctx.font = "bold 13px DungGeunMo";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(mDisplay, mX + 34, mY + moveChipH / 2);
      }
    }

    // 2. Symmetric Move Detail Card Container (Matches top 2x2 grid width & aligns layout)
    const curRawMove = currentEquippedMoves[selectedMoveIdx] || "---";
    const curMoveKey = curRawMove.toLowerCase().replace(/[\s_]+/g, "-");
    const curMoveInfo = MOVES_DATA[curMoveKey];

    const cardX = contentX;
    const cardY = bodyY + 96;
    const cardW = contentW;
    const cardH = bodyH - 108;

    // Draw Detail Card Box Background
    ctx.fillStyle = "#141824";
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 6);
    ctx.fill();

    ctx.strokeStyle = "#252E42";
    ctx.lineWidth = 1;
    ctx.stroke();

    if (curRawMove !== "---" && curMoveInfo) {
      // (1) Row 1: [SVG Type Badge] + Move Name
      drawTypeIcon(ctx, cardX + 12, cardY + 10, 22, curMoveInfo.type, "rounded");

      // Move Name
      ctx.font = "bold 15px DungGeunMo";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const moveTitle = isKo ? curMoveInfo.nameKo : curMoveInfo.name.toUpperCase().replace(/[-_]+/g, " ");
      ctx.fillText(moveTitle, cardX + 40, cardY + 21);

      // (2) Row 2: [Category SVG Icon] + Power + [Target Icon] + Accuracy + PP
      const pwrStr = curMoveInfo.power ? String(curMoveInfo.power) : "-";
      const accStr = curMoveInfo.accuracy ? `${curMoveInfo.accuracy}%` : "-";
      const ppStr = `${curMoveInfo.pp || 35}`;

      drawMoveCategoryIcon(ctx, cardX + 12, cardY + 36, curMoveInfo.category);

      let curStatX = cardX + 39;
      ctx.font = "bold 13px DungGeunMo";
      ctx.fillStyle = "#F1F5F9";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(pwrStr, curStatX, cardY + 47);
      curStatX += ctx.measureText(pwrStr).width + 8;

      ctx.fillStyle = "#475569";
      ctx.fillText("|", curStatX, cardY + 47);
      curStatX += 10;

      // Draw Target (과녁) SVG Icon
      drawTargetIcon(ctx, curStatX + 6, cardY + 47, 5.8, "#38BDF8");
      curStatX += 17;

      ctx.fillStyle = "#F1F5F9";
      ctx.fillText(accStr, curStatX, cardY + 47);
      curStatX += ctx.measureText(accStr).width + 8;

      ctx.fillStyle = "#475569";
      ctx.fillText("|", curStatX, cardY + 47);
      curStatX += 10;

      ctx.fillStyle = "#F59E0B";
      ctx.fillText("PP:", curStatX, cardY + 47);
      const ppLabelW = ctx.measureText("PP:").width;
      ctx.fillStyle = "#FCD34D";
      ctx.fillText(` ${ppStr}`, curStatX + ppLabelW, cardY + 47);

      // (3) Row 3: Description Content (Enlarged & Comfortable Line Height)
      ctx.textBaseline = "top";
      ctx.font = "15px DungGeunMo";
      ctx.fillStyle = "#F1F5F9";
      ctx.textAlign = "left";
      const desc = isKo
        ? (curMoveInfo.description || "효과 설명이 없습니다.")
        : (curMoveInfo.descriptionEn || MOVES_EN_DESC[curMoveKey] || "No description available.");
      drawWrappedText(ctx, desc, cardX + 12, cardY + 70, cardW - 24, 22);
    } else {
      ctx.textBaseline = "middle";
      ctx.font = "bold 14px DungGeunMo";
      ctx.fillStyle = "#64748B";
      ctx.textAlign = "center";
      ctx.fillText(isKo ? "등록된 기술이 없습니다." : "No move registered.", cardX + cardW / 2, cardY + cardH / 2);
    }

    return;
  }

  // =========================================================================
  // TAB 2: SHINY TAB (2x2 Grid with Pokemon Sprites & Star Sparkles)
  // =========================================================================
  if (currentTab === "shiny") {
    const tierColors = ["#64748B", "#F59E0B", "#3B82F6", "#EF4444"];
    const tierNames = [
      isKo ? "일반 폼" : "Normal Form",
      isKo ? "노랑 이로치" : "Yellow Shiny",
      isKo ? "파랑 이로치" : "Blue Shiny",
      isKo ? "빨강 이로치" : "Red Shiny"
    ];
    const tierLucks = [
      isKo ? "기본 (+0)" : "+0 Luck",
      isKo ? "행운 +1" : "+1 Luck",
      isKo ? "행운 +2" : "+2 Luck",
      isKo ? "행운 +3 (최대)" : "+3 Luck (Max)"
    ];

    const contentX = bodyX + 10;
    const contentW = bodyW - 20;
    const startCardY = 52;
    const chipGap = 8;
    const tileW = Math.floor((contentW - chipGap) / 2);
    const tileH = 138;

    for (let t = 0; t <= 3; t++) {
      const col = t % 2;
      const row = Math.floor(t / 2);
      const cX = contentX + col * (tileW + chipGap);
      const cY = startCardY + row * (tileH + 10);

      const isUnlocked = t === 0 || t <= unlockedMaxShinyTier;
      const isCurrent = currentShinyTier === t;

      // 1. Tile Base Background
      ctx.fillStyle = isCurrent ? "#2E3A56" : (isUnlocked ? "#242C3E" : "#141722");
      ctx.beginPath();
      ctx.roundRect(cX, cY, tileW, tileH, 6);
      ctx.fill();

      if (isCurrent) {
        ctx.strokeStyle = "#5865F2";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 2. Sprite Image Box (Centered Upper Half)
      const spr = tierSprites && tierSprites[t] ? tierSprites[t] : (t === 0 ? normalSprite : shinySprite);
      const sprBoxSize = 62;
      const sprBoxX = cX + (tileW - sprBoxSize) / 2;
      const sprBoxY = cY + 10;

      if (isUnlocked && spr) {
        const scale = 1.1;
        const sW = spr.width * scale;
        const sH = spr.height * scale;
        ctx.drawImage(spr, sprBoxX + (sprBoxSize - sW) / 2, sprBoxY + (sprBoxSize - sH) / 2, sW, sH);
      } else if (!isUnlocked) {
        // Locked state: subtle lock icon in center of sprite area
        drawLockIcon(ctx, cX + tileW / 2, cY + 40, 14, 16, "#475569");
      }

      // 3. Stars Row (Replaces "TIER X" text with beautiful Stars!)
      const starsY = cY + 84;
      if (t === 0) {
        // Normal Form: Soft subtle text
        ctx.textBaseline = "middle";
        ctx.font = "bold 13px DungGeunMo";
        ctx.fillStyle = isCurrent ? "#FFFFFF" : (isUnlocked ? "#94A3B8" : "#475569");
        ctx.textAlign = "center";
        ctx.fillText(tierNames[0], cX + tileW / 2, starsY);
      } else {
        // Shiny Tiers: Draw Star Sparkles (1, 2, 3 stars)
        if (isUnlocked) {
          const starSpacing = 16;
          const totalStarsW = (t - 1) * starSpacing;
          const startStarX = (cX + tileW / 2) - (totalStarsW / 2);
          for (let sIdx = 0; sIdx < t; sIdx++) {
            drawShinySparkle(ctx, startStarX + sIdx * starSpacing, starsY, 6, tierColors[t]);
          }
        } else {
          drawLockIcon(ctx, (cX + tileW / 2) - (isKo ? 22 : 28), starsY, 10, 12, "#475569");
          ctx.textBaseline = "middle";
          ctx.font = "bold 12px DungGeunMo";
          ctx.fillStyle = "#475569";
          ctx.textAlign = "left";
          ctx.fillText(isKo ? "미해금" : "LOCKED", (cX + tileW / 2) - (isKo ? 10 : 16), starsY);
        }
      }

      // 4. Luck Info & Active State Badge (Bottom Line, y: cY + 114)
      ctx.textBaseline = "middle";
      ctx.font = "bold 12px DungGeunMo";
      ctx.textAlign = "center";

      if (isCurrent) {
        const activeLabel = isKo ? "적용 중" : "Active";
        ctx.font = "bold 12px DungGeunMo";
        const txtW = ctx.measureText(activeLabel).width;
        const totalW = txtW + 14;
        const startX = (cX + tileW / 2) - (totalW / 2);

        drawCheckmark(ctx, startX + 5, cY + 114, 4.5, "#22C55E");

        ctx.fillStyle = "#22C55E";
        ctx.textAlign = "left";
        ctx.fillText(activeLabel, startX + 14, cY + 114);
      } else if (isUnlocked) {
        ctx.fillStyle = tierColors[t] || "#94A3B8";
        ctx.fillText(tierLucks[t], cX + tileW / 2, cY + 114);
      } else {
        ctx.fillStyle = "#475569";
        ctx.font = "11px DungGeunMo";
        ctx.fillText(isKo ? "미해금" : "Locked", cX + tileW / 2, cY + 114);
      }
    }

    return;
  }

  // =========================================================================
  // TAB 3: COST / CANDY MANAGEMENT TAB
  // =========================================================================
  if (currentTab === "cost") {
    const cardW = bodyW - 20;
    const cardX = bodyX + 10;

    // 1. Top Summary Card (y: 44 ~ 130, H: 86)
    const infoCardY = 44;
    const infoCardH = 86;

    ctx.fillStyle = "#1E2638";
    ctx.beginPath();
    ctx.roundRect(cardX, infoCardY, cardW, infoCardH, 6);
    ctx.fill();

    ctx.strokeStyle = "#2D374D";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Candy Icon & Title
    drawCandyIcon(ctx, cardX + 18, infoCardY + 20, 7.5, "#F59E0B", "#FEF08A");
    ctx.textBaseline = "middle";
    ctx.font = "bold 15px DungGeunMo";
    ctx.fillStyle = "#FCD34D";
    ctx.textAlign = "left";
    ctx.fillText(isKo ? "포켓몬 사탕 관리" : "Pokemon Candies", cardX + 38, infoCardY + 20);

    ctx.font = "bold 15px DungGeunMo";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "right";
    ctx.fillText(isKo ? `${candies}개` : `${candies}`, cardX + cardW - 12, infoCardY + 20);

    // Divider
    ctx.strokeStyle = "#2D374D";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardX + 8, infoCardY + 36);
    ctx.lineTo(cardX + cardW - 8, infoCardY + 36);
    ctx.stroke();

    // Stats Grid inside header
    ctx.font = "13px DungGeunMo";
    ctx.fillStyle = "#CBD5E1";
    ctx.textAlign = "left";
    ctx.fillText(isKo ? `기본 코스트: ${sel.cost}C` : `Base Cost: ${sel.cost}C`, cardX + 12, infoCardY + 52);
    ctx.fillText(isKo ? `포획/부화: ${selProgress?.hatchedCount || 0}회` : `Hatched: ${selProgress?.hatchedCount || 0}`, cardX + cardW / 2 + 8, infoCardY + 52);

    const eggMoveCount = (selProgress?.eggMoves || []).length;
    ctx.fillText(isKo ? `해금된 알기술: ${eggMoveCount} / 4개` : `Egg Moves: ${eggMoveCount} / 4`, cardX + 12, infoCardY + 70);

    const shinyLabel = isKo ? "이로치:" : "Max Shiny:";
    ctx.fillText(shinyLabel, cardX + cardW / 2 + 8, infoCardY + 70);
    const sLabelW = ctx.measureText(shinyLabel).width;
    const sIconX = cardX + cardW / 2 + 8 + sLabelW + 8;
    if (unlockedMaxShinyTier > 0) {
      const tierColors = ["#64748B", "#F59E0B", "#3B82F6", "#EF4444"];
      drawShinySparkle(ctx, sIconX, infoCardY + 70, 5, tierColors[unlockedMaxShinyTier] || "#F59E0B");
      ctx.fillStyle = "#FCD34D";
      ctx.fillText(`+${unlockedMaxShinyTier}`, sIconX + 10, infoCardY + 70);
    } else {
      ctx.fillStyle = "#64748B";
      ctx.fillText(isKo ? "없음" : "None", sIconX, infoCardY + 70);
    }

    // 2. Passive Ability Unlock Tile (y: 138 ~ 234, H: 96)
    const passiveTileY = 138;
    const passiveTileH = 96;
    const passiveCost = Math.max(5, sel.cost * 3); // 3x Cost candies needed
    const passKey = (sel.passiveAbility || "").toLowerCase().replace(/[\s_]+/g, "-");
    const passDesc = isKo
      ? (ABILITY_DETAILED_DESC_KO[passKey] || "포켓몬의 고유한 패시브 효과입니다.")
      : (ABILITY_DETAILED_DESC_EN[passKey] || "A unique PokeRogue starter passive ability.");

    ctx.fillStyle = hasPassiveUnlocked ? "#1E2A38" : (candies >= passiveCost ? "#242C3E" : "#141824");
    ctx.beginPath();
    ctx.roundRect(cardX, passiveTileY, cardW, passiveTileH, 6);
    ctx.fill();

    if (usePassive) {
      ctx.strokeStyle = "#22C55E";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (hasPassiveUnlocked) {
      ctx.strokeStyle = "#3B82F6";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#283044";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.textBaseline = "middle";
    ctx.font = "bold 14px DungGeunMo";
    ctx.textAlign = "left";

    // Title line
    const passTitle = isKo ? `패시브: ${sel.passiveAbilityKo || sel.passiveAbility}` : `Passive: ${sel.passiveAbility || "None"}`;
    ctx.fillStyle = hasPassiveUnlocked ? "#60A5FA" : "#FFFFFF";
    ctx.fillText(passTitle, cardX + 12, passiveTileY + 18);

    // Status Tag (Right)
    ctx.textAlign = "right";
    if (usePassive) {
      drawCheckmark(ctx, cardX + cardW - (isKo ? 46 : 56), passiveTileY + 18, 4, "#22C55E");
      ctx.fillStyle = "#22C55E";
      ctx.fillText(isKo ? "적용 중" : "Active", cardX + cardW - 8, passiveTileY + 18);
    } else if (hasPassiveUnlocked) {
      ctx.fillStyle = "#3B82F6";
      ctx.fillText(isKo ? "해금 완료" : "Unlocked", cardX + cardW - 8, passiveTileY + 18);
    } else {
      const needVal = `${passiveCost}`;
      ctx.font = "bold 13px DungGeunMo";
      ctx.fillStyle = candies >= passiveCost ? "#FCD34D" : "#EF4444";
      ctx.fillText(isKo ? `${needVal}개` : needVal, cardX + cardW - 8, passiveTileY + 18);
      const valW = ctx.measureText(isKo ? `${needVal}개` : needVal).width;
      drawCandyIcon(ctx, cardX + cardW - 8 - valW - 10, passiveTileY + 18, 5, "#F59E0B", "#FEF08A");
    }

    // Sub-divider
    ctx.strokeStyle = "#252E42";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardX + 8, passiveTileY + 32);
    ctx.lineTo(cardX + cardW - 8, passiveTileY + 32);
    ctx.stroke();

    // Description
    ctx.textBaseline = "top";
    ctx.font = "13px DungGeunMo";
    ctx.fillStyle = "#CBD5E1";
    ctx.textAlign = "left";
    drawWrappedText(ctx, passDesc, cardX + 12, passiveTileY + 40, cardW - 24, 18);

    // 3. Cost Reduction Tile (y: 242 ~ 330, H: 88)
    const costTileY = 242;
    const costTileH = 88;
    const reductionCount = partyMember?.cost !== undefined && partyMember.cost < sel.cost ? (sel.cost - partyMember.cost) : (selProgress?.costReductionCount || 0);
    const nextReductionCost = Math.max(10, (reductionCount + 1) * 15);
    const maxReductionReached = reductionCount >= 2;

    ctx.fillStyle = maxReductionReached ? "#1E2A38" : (candies >= nextReductionCost ? "#242C3E" : "#141824");
    ctx.beginPath();
    ctx.roundRect(cardX, costTileY, cardW, costTileH, 6);
    ctx.fill();

    if (reductionCount > 0) {
      ctx.strokeStyle = "#F59E0B";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#283044";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.textBaseline = "middle";
    ctx.font = "bold 14px DungGeunMo";
    ctx.fillStyle = "#FCD34D";
    ctx.textAlign = "left";
    ctx.fillText(isKo ? "코스트 영구 감소" : "Cost Reduction", cardX + 12, costTileY + 18);

    // Status Tag (Right)
    ctx.textAlign = "right";
    if (maxReductionReached) {
      ctx.fillStyle = "#22C55E";
      ctx.fillText(isKo ? "최대 감소 (2/2)" : "MAX (2/2)", cardX + cardW - 8, costTileY + 18);
    } else {
      const needVal = `${nextReductionCost}`;
      ctx.font = "bold 13px DungGeunMo";
      ctx.fillStyle = candies >= nextReductionCost ? "#FCD34D" : "#EF4444";
      ctx.fillText(isKo ? `${needVal}개` : needVal, cardX + cardW - 8, costTileY + 18);
      const valW = ctx.measureText(isKo ? `${needVal}개` : needVal).width;
      drawCandyIcon(ctx, cardX + cardW - 8 - valW - 10, costTileY + 18, 5, "#F59E0B", "#FEF08A");
    }

    // Sub-divider
    ctx.strokeStyle = "#252E42";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardX + 8, costTileY + 32);
    ctx.lineTo(cardX + cardW - 8, costTileY + 32);
    ctx.stroke();

    // Details Text
    ctx.textBaseline = "top";
    ctx.font = "14px DungGeunMo";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";
    const currentEffectiveCost = Math.max(1, sel.cost - reductionCount);
    ctx.fillText(isKo ? `현재 코스트: ${currentEffectiveCost}C (-${reductionCount}C 적용)` : `Current: ${currentEffectiveCost}C (-${reductionCount}C)`, cardX + 12, costTileY + 38);

    ctx.font = "12px DungGeunMo";
    ctx.fillStyle = "#94A3B8";
    const reductionDesc = maxReductionReached
      ? (isKo ? "더 이상 코스트를 줄일 수 없습니다. (최대 -2C)" : "Maximum cost reduction limit reached. (Max -2C)")
      : (isKo ? "사탕을 사용하여 영구적으로 1C를 추가 감소시킵니다." : "Use candies to permanently reduce starter cost by 1C.");
    drawWrappedText(ctx, reductionDesc, cardX + 12, costTileY + 56, cardW - 24, 15);

    return;
  }

  // =========================================================================
  // TAB 4: LEARNABLE MOVES LIST VIEW (초기 선택 가능한 전체 기술 목록 리스트 뷰)
  // =========================================================================
  if (currentTab === "learnable") {
    const cardW = bodyW - 20;
    const cardX = bodyX + 10;

    // 1. Top Title Header Card (y: 44 ~ 80, H: 36)
    const headerY = 44;
    const headerH = 36;

    ctx.fillStyle = "#242C3E";
    ctx.beginPath();
    ctx.roundRect(cardX, headerY, cardW, headerH, 6);
    ctx.fill();

    ctx.textBaseline = "middle";
    ctx.font = "bold 15px DungGeunMo";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";
    ctx.fillText(isKo ? "배울 수 있는 기술 목록" : "Learnable Moves", cardX + 16, headerY + 18);

    const starterMoves = sel.starterMoves || [];
    const equippedMoves = (partyMember?.moves && partyMember.moves.length > 0) ? partyMember.moves : starterMoves;
    const eggMoves: string[] = selProgress?.eggMoves || [];
    const allMoves = [...starterMoves, ...eggMoves.filter((m: string) => !starterMoves.includes(m))];

    // Target slot being replaced (0..3):
    const targetMoveSlot = Math.min(3, Math.max(0, args.targetMoveSlot !== undefined ? args.targetMoveSlot : 0));
    const moveBeingReplaced = equippedMoves[targetMoveSlot];

    const itemsPerPage = 6;
    const totalLearnablePages = Math.max(1, Math.ceil(allMoves.length / itemsPerPage));
    const selectedLearnableIdx = Math.min(Math.max(0, args.selectedMoveIdx || 0), allMoves.length - 1);
    const currentLearnablePage = Math.floor(selectedLearnableIdx / itemsPerPage) + 1;
    const startIdx = (currentLearnablePage - 1) * itemsPerPage;

    ctx.font = "bold 12px DungGeunMo";
    ctx.fillStyle = "#60A5FA";
    ctx.textAlign = "right";
    ctx.fillText(isKo ? `총 ${allMoves.length}개 (${currentLearnablePage}/${totalLearnablePages})` : `${allMoves.length} Moves (${currentLearnablePage}/${totalLearnablePages})`, cardX + cardW - 12, headerY + 18);

    // 2. Move Cards List (y: 82 ~ 364, 6 items x 43px)
    const listStartY = 82;
    const itemH = 43;
    const itemGap = 4;

    for (let i = 0; i < Math.min(allMoves.length - startIdx, itemsPerPage); i++) {
      const globalIdx = startIdx + i;
      const rawMove = allMoves[globalIdx];
      const isEggMove = eggMoves.includes(rawMove);
      const isEquipped = equippedMoves.includes(rawMove);
      const isBeingReplaced = rawMove === moveBeingReplaced;
      const isSelected = selectedLearnableIdx === globalIdx;
      const moveKey = rawMove.toLowerCase().replace(/[\s_]+/g, "-");
      const moveInfo = MOVES_DATA[moveKey];
      const itemY = listStartY + i * (itemH + itemGap);

      ctx.fillStyle = isSelected ? "#2E3A56" : (isBeingReplaced ? "#2A201A" : (isEquipped ? "#1E2638" : "#242C3E"));
      ctx.beginPath();
      ctx.roundRect(cardX, itemY, cardW, itemH, 4);
      ctx.fill();

      if (isBeingReplaced) {
        ctx.strokeStyle = "#F59E0B"; // Orange border for move being replaced!
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (isSelected) {
        ctx.strokeStyle = "#5865F2"; // Blue border for selected preview move
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (isEquipped) {
        ctx.strokeStyle = "#22C55E"; // Green border for other equipped moves
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      if (moveInfo) {
        // SVG Vector Type Badge Icon
        const iconSize = 24;
        const iconX = cardX + 10;
        const iconY = itemY + (itemH - iconSize) / 2;
        drawTypeIcon(ctx, iconX, iconY, iconSize, moveInfo.type, "rounded");

        // Move Name (Vertically centered)
        ctx.textBaseline = "middle";
        ctx.font = "bold 15px DungGeunMo";
        ctx.fillStyle = isBeingReplaced ? "#FCD34D" : (isSelected ? "#FFFFFF" : (isEquipped ? "#86EFAC" : "#CBD5E1"));
        ctx.textAlign = "left";
        const moveName = isKo ? moveInfo.nameKo : moveInfo.name.toUpperCase();
        ctx.fillText(`${globalIdx + 1}. ${moveName}`, cardX + 42, itemY + itemH / 2);
      }
    }

    return;
  }
}

/**
 * Renders the PokéRogue-style Dedicated Starter Selection & Party Builder Screen (560x380)
 */
export async function renderStarterSelectScreen(options: StarterSelectScreenOptions): Promise<Buffer> {
  const width = 560;
  const height = 380;
  const scale = 2;
  const canvas = createCanvas(width * scale, height * scale);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  ctx.imageSmoothingEnabled = false;

  const isKo = options.lang === "ko";
  const sel = options.selectedStarter;
  const gen = options.currentGen;
  const list = options.startersList || [];
  const party = options.selectedParty || [];
  const maxCost = options.maxCost || 10;
  const userStarters = options.userStarters;
  const isShinyFilter = !!options.isShinyFilter;
  const isHaFilter = !!options.isHaFilter;
  const isPassiveFilter = !!options.isPassiveFilter;
  const currentCost = party.reduce((sum, p) => sum + p.cost, 0);

  // Check selected starter's user unlock state
  const selProgress = sel && userStarters ? userStarters.get(sel.speciesId) : null;
  const selIsUnlocked = selProgress ? selProgress.isUnlocked : true;
  const selShinyTier = selProgress?.shinyTier || 0;
  const selHasShiny = selShinyTier > 0;
  const selHasHa = selProgress?.hasHiddenAbility || false;
  const selHasPassive = selProgress?.passiveUnlocked || false;

  // 0. PRELOAD SPRITES IN PARALLEL (With User-owned Shiny support)
  const [listSprites, selectedSprite, partySprites] = await Promise.all([
    Promise.all(list.map((s) => {
      if (!s) return Promise.resolve(null);
      const prog = userStarters ? userStarters.get(s.speciesId) : null;
      const sTier = prog?.shinyTier || 0;
      return getPokemonSprite(s.speciesId, true, sTier);
    })),
    sel ? getPokemonSprite(sel.speciesId, true, selShinyTier) : Promise.resolve(null),
    Promise.all(party.map((p) => (p ? getPokemonSprite(p.speciesId, true, p.shinyTier !== undefined ? p.shinyTier : (p.isShiny ? 1 : 0)) : Promise.resolve(null)))),
  ]);

  // 1. Dark Retro Background
  ctx.fillStyle = "#11131C";
  ctx.fillRect(0, 0, width, height);

  if (options.isPartyView) {
    // ----------------------------------------------------
    // PARTY MANAGEMENT VIEW (Left: Inspector + Party Grid, Right: Customization Dashboard)
    // ----------------------------------------------------
    const splitX = 274;
    const panelX = 10;
    const panelW = splitX - panelX - 6;

    // Determine currently inspected party member
    const isNoneSelected = options.selectedPartyIdx === undefined || options.selectedPartyIdx === -1;
    const activePartyIdx = isNoneSelected ? -1 : Math.min(Math.max(0, options.selectedPartyIdx!), Math.max(0, party.length - 1));
    const activePartyMember = activePartyIdx >= 0 ? party[activePartyIdx] : undefined;
    const inspectedStarter = activePartyMember ? getStarterByDexNumber(activePartyMember.dexNumber) || null : null;
    const inspectedProg = inspectedStarter && userStarters ? userStarters.get(inspectedStarter.speciesId) : null;
    const inspectedShinyTier = activePartyMember ? (activePartyMember.shinyTier !== undefined ? activePartyMember.shinyTier : (activePartyMember.isShiny ? 1 : 0)) : (inspectedProg?.shinyTier || 0);
    const inspectedHasHa = activePartyMember ? activePartyMember.useHiddenAbility : (inspectedProg?.hasHiddenAbility || false);
    const inspectedHasPassive = activePartyMember ? activePartyMember.usePassive : (inspectedProg?.passiveUnlocked || false);

    // Fetch inspected sprite + all 4 shiny tier variants (0: Normal, 1: Yellow, 2: Blue, 3: Red)
    const [inspectedSprite, t0Sprite, t1Sprite, t2Sprite, t3Sprite] = inspectedStarter
      ? await Promise.all([
          getPokemonSprite(inspectedStarter.speciesId, true, inspectedShinyTier),
          getPokemonSprite(inspectedStarter.speciesId, true, 0),
          getPokemonSprite(inspectedStarter.speciesId, true, 1),
          getPokemonSprite(inspectedStarter.speciesId, true, 2),
          getPokemonSprite(inspectedStarter.speciesId, true, 3),
        ])
      : [null, null, null, null, null];

    // Render preview and party grid on LEFT SIDE
    renderPreviewAndPartyPanel(ctx, {
      panelX,
      panelW,
      sel: inspectedStarter,
      selectedSprite: inspectedSprite,
      selProgress: inspectedProg,
      selHasHa: inspectedHasHa,
      selHasPassive: inspectedHasPassive,
      party,
      partySprites,
      currentCost,
      maxCost,
      isKo,
      selectedPartyIdx: activePartyIdx,
      isPartyView: true,
    });

    // Vertical Split Line
    ctx.strokeStyle = "#2D3246";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, height);
    ctx.stroke();

    // RIGHT SIDE: Render Party Member Customization Dashboard
    renderPartyCustomizationPanel(ctx, {
      panelX: splitX + 10,
      panelW: width - splitX - 20,
      sel: inspectedStarter,
      partyMember: activePartyMember,
      selProgress: inspectedProg,
      isKo,
      tab: options.partyTab,
      selectedMoveIdx: options.selectedMoveIdx,
      targetMoveSlot: options.targetMoveSlot,
      normalSprite: t0Sprite,
      shinySprite: t1Sprite,
      tierSprites: [t0Sprite, t1Sprite, t2Sprite, t3Sprite],
    });

    if (options.inGameMessage) {
      drawInGameMessageBox(ctx, width, height, options.inGameMessage, isKo);
    }

    return canvas.toBuffer("image/png");
  }

  // ----------------------------------------------------
  // STANDARD STARTER SELECTION VIEW
  // ----------------------------------------------------
  // 2. TOP BANNER (Left Side Header Bar)
  const splitX = 262;
  ctx.fillStyle = "#1A1D2A";
  ctx.fillRect(0, 0, splitX, 42);

  ctx.strokeStyle = "#2D3246";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 42);
  ctx.lineTo(splitX, 42);
  ctx.stroke();

  ctx.font = "bold 17px DungGeunMo";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  ctx.fillText(isKo ? "스타팅" : "STARTERS", 8, 27);
  const titleW = ctx.measureText(isKo ? "스타팅" : "STARTERS").width;

  // Crisp Page Indicator ("전체 1/4" or "1세대 1/2") (15px)
  const curPage = options.currentPage || 1;
  const totPages = options.totalPages || 1;
  const pageText = gen <= 0
    ? (isKo ? `전체 ${curPage}/${totPages}` : `ALL ${curPage}/${totPages}`)
    : (isKo ? `${gen}세대 ${curPage}/${totPages}` : `G${gen} ${curPage}/${totPages}`);
  ctx.font = "bold 15px DungGeunMo";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "right";
  ctx.fillText(pageText, splitX - 8, 27);
  const pageTextW = ctx.measureText(pageText).width;

  // Active Filter Badges on Banner (Compact 22px width pill badges between Title and Page)
  let badgeOffsetX = splitX - 8 - pageTextW - 6;
  const badgeW = 22;
  const badgeH = 19;
  const badgeY = 11;

  if (isPassiveFilter) {
    ctx.fillStyle = "#10B981";
    ctx.beginPath();
    ctx.roundRect(badgeOffsetX - badgeW, badgeY, badgeW, badgeH, 3);
    ctx.fill();
    ctx.font = "bold 11px DungGeunMo";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText("PS", badgeOffsetX - badgeW / 2, badgeY + 14);
    badgeOffsetX -= badgeW + 4;
  }
  if (isHaFilter) {
    ctx.fillStyle = "#EF4444";
    ctx.beginPath();
    ctx.roundRect(badgeOffsetX - badgeW, badgeY, badgeW, badgeH, 3);
    ctx.fill();
    ctx.font = "bold 11px DungGeunMo";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText("HA", badgeOffsetX - badgeW / 2, badgeY + 14);
    badgeOffsetX -= badgeW + 4;
  }
  if (isShinyFilter) {
    ctx.fillStyle = "#F59E0B";
    ctx.beginPath();
    ctx.roundRect(badgeOffsetX - badgeW, badgeY, badgeW, badgeH, 3);
    ctx.fill();
    drawShinySparkle(ctx, badgeOffsetX - badgeW / 2, badgeY + badgeH / 2, 5.5, "#FFFFFF");
    badgeOffsetX -= badgeW + 4;
  }

  // 3. LEFT SIDE: 8 Starters Grid (2 Columns x 4 Rows, y: 48 ~ 370)
  const startListY = 48;
  const slotW = 118;
  const slotH = 76;
  const gapX = 6;
  const gapY = 6;

  for (let i = 0; i < 8; i++) {
    const s = list[i];
    const row = Math.floor(i / 2);
    const col = i % 2;
    const sx = 10 + col * (slotW + gapX);
    const sy = startListY + row * (slotH + gapY);
    const isSelected = sel && s && sel.dexNumber === s.dexNumber;
    const isAlreadyInParty = s && party.some((p) => p.dexNumber === s.dexNumber);

    const sProgress = s && userStarters ? userStarters.get(s.speciesId) : null;
    const sIsUnlocked = sProgress ? sProgress.isUnlocked : true;
    const sHasPassive = sProgress?.passiveUnlocked || false;
    const sEffectiveCost = s ? (sHasPassive ? s.reducedCost : s.cost) : 0;

    ctx.fillStyle = isSelected ? "#222738" : (s ? "#181B26" : "#11131A");
    ctx.beginPath();
    ctx.roundRect(sx, sy, slotW, slotH, 6);
    ctx.fill();

    if (isSelected) {
      ctx.strokeStyle = "#5865F2";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (s) {
      const displayName = isKo ? s.nameKo : s.name;

      // Slot Number + Name (Enlarged to 16px, Middle Baseline)
      ctx.textBaseline = "middle";
      const slotHeaderY = sy + 13;

      ctx.font = "bold 16px DungGeunMo";
      ctx.fillStyle = isSelected ? "#FFFFFF" : "#F8FAFC";
      ctx.textAlign = "left";
      ctx.fillText(`${i + 1}.${displayName.slice(0, 4)}`, sx + 6, slotHeaderY);

      // Cost Text without box (Bold 16px, Right Aligned: Red if unaffordable, Mint if passive, Green otherwise)
      const remainingCost = maxCost - currentCost;
      const cannotAddDueToCost = !isAlreadyInParty && (sEffectiveCost > remainingCost || party.length >= 6);
      let costColor = "#22C55E";
      if (cannotAddDueToCost) {
        costColor = "#EF4444"; // Red when unaffordable!
      } else if (sHasPassive) {
        costColor = "#34D399"; // Emerald mint for reduced cost
      }

      ctx.font = "bold 16px DungGeunMo";
      ctx.fillStyle = costColor;
      ctx.textAlign = "right";
      ctx.fillText(`${sEffectiveCost}C`, sx + slotW - 8, slotHeaderY);

      // Sprite
      const sprite = listSprites[i];
      const sprAreaW = 48;
      const sprAreaH = 48;
      const sprX = sx + 6;
      const sprY = sy + 22;

      if (sprite) {
        const scale = 0.65;
        const sprW = sprite.width * scale;
        const sprH = sprite.height * scale;
        ctx.drawImage(sprite, sprX + (sprAreaW - sprW) / 2, sprY + (sprAreaH - sprH) / 2, sprW, sprH);
      }

      // Shiny Tier Vector Sparkles on Mini Sprite (Tier 1 Yellow, Tier 2 Blue, Tier 3 Red)
      const sShinyTier = sProgress?.shinyTier || 0;
      if (sShinyTier > 0) {
        drawShinyTierSparkles(ctx, sx + 4, sy + slotH - 12, sShinyTier, 5);
      }

      // Party Check Badge or Gen tag (Enlarged to 13px)
      if (isAlreadyInParty) {
        const bW = 48;
        const bH = 19;
        const bX = sx + slotW - 52;
        const bY = sy + slotH - 23;
        ctx.fillStyle = "#22C55E";
        ctx.beginPath();
        ctx.roundRect(bX, bY, bW, bH, 3);
        ctx.fill();

        ctx.textBaseline = "middle";
        ctx.font = "bold 13px DungGeunMo";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.fillText(isKo ? "선택됨" : "ADDED", bX + bW / 2, bY + bH / 2);
      } else {
        ctx.textBaseline = "middle";
        ctx.font = "bold 14px DungGeunMo";
        ctx.fillStyle = "#64748B";
        ctx.textAlign = "right";
        ctx.fillText(s.dexNumber <= 0 ? "#---" : `#${String(s.dexNumber).padStart(3, "0")}`, sx + slotW - 6, sy + slotH - 12);
      }
    } else {
      ctx.textBaseline = "middle";
      ctx.font = "bold 15px DungGeunMo";
      ctx.fillStyle = "#334155";
      ctx.textAlign = "center";
      ctx.fillText("---", sx + slotW / 2, sy + slotH / 2);
    }
  }

  // 4. VERTICAL SPLIT LINE
  ctx.strokeStyle = "#2D3246";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(splitX, 0);
  ctx.lineTo(splitX, height);
  ctx.stroke();

  // 5. RIGHT SIDE: Top Preview Details & Bottom Party Builder
  const rightX = 274;
  const rightW = width - rightX - 10;

  renderPreviewAndPartyPanel(ctx, {
    panelX: rightX,
    panelW: rightW,
    sel,
    selectedSprite,
    selProgress,
    selHasHa,
    selHasPassive,
    party,
    partySprites,
    currentCost,
    maxCost,
    isKo,
  });

  if (options.inGameMessage) {
    drawInGameMessageBox(ctx, width, height, options.inGameMessage, isKo);
  }

  return canvas.toBuffer("image/png");
}

/**
 * Renders the 9-Generation Overview & Fast Jump Screen (560x380)
 */

export async function renderGenSelectScreen(options: GenSelectScreenOptions): Promise<Buffer> {
  const width = 560;
  const height = 380;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.imageSmoothingEnabled = false;
  ctx.textRendering = "optimizeSpeed";

  const isKo = options.lang === "ko";
  const currentGen = options.currentGen || 1;

  // Preload starter trio sprites for all 9 generations (27 sprites)
  const trioSprites = await Promise.all(
    GENERATION_INFO.map(async (info) => {
      const sprites = await Promise.all(info.starters.map((name) => getPokemonSprite(name)));
      return { gen: info.gen, sprites };
    })
  );

  // Background
  ctx.fillStyle = "#13151F";
  ctx.fillRect(0, 0, width, height);

  // Top Banner (Enlarged to 20px)
  ctx.fillStyle = "#1A1D2A";
  ctx.fillRect(0, 0, width, 40);
  ctx.strokeStyle = "#2D3246";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 40);
  ctx.lineTo(width, 40);
  ctx.stroke();

  ctx.font = "bold 20px DungGeunMo";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  ctx.fillText(isKo ? "세대 선택 (GENERATION SELECT)" : "GENERATION SELECT", 14, 27);

  ctx.font = "bold 15px DungGeunMo";
  ctx.fillStyle = "#94A3B8";
  ctx.textAlign = "right";
  ctx.fillText(isKo ? "탐험할 세대를 선택하세요" : "Choose your starter region", width - 14, 27);

  // 9 Generation Cards Grid (3 Columns x 3 Rows, y: 48 ~ 370)
  const cardW = 174;
  const cardH = 100;
  const startX = 10;
  const startY = 48;
  const gapX = 9;
  const gapY = 8;

  for (let i = 0; i < 9; i++) {
    const info = GENERATION_INFO[i];
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cx = startX + col * (cardW + gapX);
    const cy = startY + row * (cardH + gapY);
    const isSelected = info.gen === currentGen;

    ctx.fillStyle = isSelected ? "#22273A" : "#181B26";
    ctx.beginPath();
    ctx.roundRect(cx, cy, cardW, cardH, 6);
    ctx.fill();

    ctx.strokeStyle = isSelected ? "#5865F2" : "#282D3D";
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.stroke();

    // Card Header Bar
    ctx.fillStyle = isSelected ? "#303956" : "#12141C";
    ctx.beginPath();
    ctx.roundRect(cx + 1, cy + 1, cardW - 2, 24, [5, 5, 0, 0]);
    ctx.fill();

    // Gen Name (Enlarged to 16px)
    ctx.font = "bold 16px DungGeunMo";
    ctx.fillStyle = isSelected ? "#FFFFFF" : "#E2E8F0";
    ctx.textAlign = "left";
    ctx.fillText(isKo ? info.nameKo : info.nameEn, cx + 8, cy + 17);

    // Gen Tag (Enlarged to 14px)
    ctx.fillStyle = isSelected ? "#5865F2" : "#334155";
    ctx.beginPath();
    ctx.roundRect(cx + cardW - 36, cy + 3, 30, 19, 3);
    ctx.fill();
    ctx.font = "bold 14px DungGeunMo";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText(`G${info.gen}`, cx + cardW - 21, cy + 17);

    // Starter Trio Sprites (3 Mini Sprites centered)
    const genData = trioSprites.find((t) => t.gen === info.gen);
    if (genData) {
      const trioW = 46;
      for (let sIdx = 0; sIdx < 3; sIdx++) {
        const spr = genData.sprites[sIdx];
        if (spr) {
          const sprX = cx + 8 + sIdx * trioW;
          const sprY = cy + 28;
          const scale = 0.52;
          const sw = spr.width * scale;
          const sh = spr.height * scale;
          ctx.drawImage(spr, sprX + (trioW - sw) / 2, sprY + (60 - sh) / 2, sw, sh);
        }
      }
    }
  }

  return canvas.toBuffer("image/png");
}