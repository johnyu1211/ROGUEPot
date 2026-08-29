import { createCanvas, loadImage, GlobalFonts, Image } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";

// Register custom pixel dot font
const fontPath = path.resolve(process.cwd(), "assets/fonts/DungGeunMo.ttf");
if (fs.existsSync(fontPath)) {
  GlobalFonts.registerFromPath(fontPath, "DungGeunMo");
}

let cachedLogo: Image | null = null;

async function getLogoImage(): Promise<Image | null> {
  if (cachedLogo) return cachedLogo;
  try {
    cachedLogo = await loadImage("https://pokerogue.net/images/logo.png");
    return cachedLogo;
  } catch (err) {
    console.error("[CANVAS] Failed to load remote logo:", err);
    return null;
  }
}

export interface TitleScreenPartyPokemon {
  speciesId: string;
  name: string;
  level: number;
}

export interface TitleScreenOptions {
  username?: string;
  avatarUrl?: string;
  teamName?: string;
  hasSavedSlots?: boolean;
  party?: TitleScreenPartyPokemon[];
}

/**
 * Helper to fetch a static pixel sprite from Showdown CDN
 */
export async function getPokemonSprite(pokemonName: string): Promise<Image | null> {
  try {
    const url = `https://play.pokemonshowdown.com/sprites/gen5/${pokemonName.toLowerCase().replace(/[^a-z0-9-]/g, "")}.png`;
    return await loadImage(url);
  } catch (err) {
    console.error(`[CANVAS] Failed to load sprite for ${pokemonName}:`, err);
    return null;
  }
}

/**
 * Renders title card with Logo on left and User Profile + 6-Pokemon Party Grid on right
 */
export async function renderTitleScreen(options?: TitleScreenOptions): Promise<Buffer> {
  const width = 560;
  const height = 350;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Disable anti-aliasing for crystal clear pixel art
  ctx.imageSmoothingEnabled = false;

  // 1. Dark Retro Background
  ctx.fillStyle = "#161424";
  ctx.fillRect(0, 0, width, height);

  // 2. Outer Border Frame flush to edge (Zero gap)
  ctx.strokeStyle = "#E63946";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, width - 4, height - 4);

  ctx.strokeStyle = "#383152";
  ctx.lineWidth = 1;
  ctx.strokeRect(6, 6, width - 12, height - 12);

  // 3. Logo Aligned to LEFT
  const logo = await getLogoImage();
  const leftPadding = 28;

  if (logo) {
    const logoWidth = 245;
    const logoHeight = (logo.height / logo.width) * logoWidth;
    const logoX = leftPadding;
    const logoY = 36;
    ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

    // Team Name
    ctx.font = "20px DungGeunMo";
    ctx.fillStyle = "#F4A261";
    ctx.textAlign = "left";
    ctx.fillText("By PageFaultGames", leftPadding + 4, logoY + logoHeight + 26);

    // 4. Menu List on the Left
    const menuStartY = logoY + logoHeight + 74;
    ctx.font = "26px DungGeunMo";
    ctx.fillStyle = "#FFFFFF";

    if (options?.hasSavedSlots) {
      ctx.fillText("1. CONTINUE", leftPadding + 4, menuStartY);
      ctx.fillText("2. NEW GAME", leftPadding + 4, menuStartY + 42);
      ctx.fillText("3. LOAD GAME", leftPadding + 4, menuStartY + 84);
    } else {
      ctx.fillText("1. NEW GAME", leftPadding + 4, menuStartY);
    }
  }

  // 5. RIGHT SIDE PANEL: User Header + 2x3 Pokemon Party Slots
  const boxX = 295;
  const boxY = 20;
  const boxW = 244;
  const boxH = 310;

  // Panel Background & Frame
  ctx.fillStyle = "#1E1A33";
  ctx.fillRect(boxX, boxY, boxW, boxH);

  ctx.strokeStyle = "#4D436D";
  ctx.lineWidth = 2;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  ctx.strokeStyle = "#2E2847";
  ctx.lineWidth = 1;
  ctx.strokeRect(boxX + 3, boxY + 3, boxW - 6, boxH - 6);

  // 5-1. USER HEADER (Avatar Circle + Username)
  const avatarX = boxX + 14;
  const avatarY = boxY + 12;
  const avatarSize = 32;

  // Draw Avatar
  if (options?.avatarUrl) {
    try {
      const avatarImg = await loadImage(options.avatarUrl);
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();
    } catch {
      // Fallback Circle
      ctx.fillStyle = "#E63946";
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Default Trainer Icon Circle
    ctx.fillStyle = "#E63946";
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Avatar Border Ring
  ctx.strokeStyle = "#F4A261";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 1, 0, Math.PI * 2);
  ctx.stroke();

  // Username
  ctx.font = "bold 18px DungGeunMo";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  const nameToDisplay = (options?.username || "Trainer").slice(0, 12);
  ctx.fillText(nameToDisplay, avatarX + avatarSize + 10, avatarY + 22);

  // Sub-divider line
  ctx.strokeStyle = "#383152";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(boxX + 8, boxY + 52);
  ctx.lineTo(boxX + boxW - 8, boxY + 52);
  ctx.stroke();

  // 5-2. 2x3 PARTY SLOTS GRID (6 Slots)
  const slotW = 107;
  const slotH = 75;
  const startGridY = boxY + 58;
  const gapX = 8;
  const gapY = 8;

  const partyList = options?.party || [];

  for (let i = 0; i < 6; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const sx = boxX + 11 + col * (slotW + gapX);
    const sy = startGridY + row * (slotH + gapY);

    // Slot Box Fill
    ctx.fillStyle = "#141124";
    ctx.fillRect(sx, sy, slotW, slotH);

    // Slot Frame
    ctx.strokeStyle = "#383152";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(sx, sy, slotW, slotH);

    // Inner subtle box
    ctx.strokeStyle = "#25203D";
    ctx.lineWidth = 1;
    ctx.strokeRect(sx + 2, sy + 2, slotW - 4, slotH - 4);

    const pokemon = partyList[i];
    if (pokemon) {
      // Draw Pokemon Sprite
      const sprite = await getPokemonSprite(pokemon.speciesId);
      if (sprite) {
        const scale = 1.1;
        const sprW = sprite.width * scale;
        const sprH = sprite.height * scale;
        ctx.drawImage(sprite, sx + (slotW - sprW) / 2, sy + (slotH - sprH) / 2 - 6, sprW, sprH);
      }
      // Mini Level tag
      ctx.font = "11px DungGeunMo";
      ctx.fillStyle = "#F4A261";
      ctx.textAlign = "center";
      ctx.fillText(`Lv.${pokemon.level}`, sx + slotW / 2, sy + slotH - 6);
    } else {
      // Empty Slot Pokeball Indicator
      ctx.fillStyle = "#2D264A";
      ctx.beginPath();
      ctx.arc(sx + slotW / 2, sy + slotH / 2, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#4D436D";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = "11px DungGeunMo";
      ctx.fillStyle = "#5E567D";
      ctx.textAlign = "center";
      ctx.fillText("Empty", sx + slotW / 2, sy + slotH - 6);
    }
  }

  return canvas.toBuffer("image/png");
}

/**
 * Renders a Pixel Art Quality Test Card (/test command)
 */
export async function renderDotTestCard(): Promise<Buffer> {
  const width = 560;
  const height = 350;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = "#12101F";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#E63946";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, width - 4, height - 4);

  ctx.font = "22px DungGeunMo";
  ctx.fillStyle = "#F4A261";
  ctx.textAlign = "center";
  ctx.fillText("★ PIXEL ART SPRITE QUALITY TEST ★", width / 2, 38);

  ctx.font = "14px DungGeunMo";
  ctx.fillStyle = "#8E88AB";
  ctx.fillText("Nearest-Neighbor Scaled (Zero Blur / No Smoothing)", width / 2, 60);

  const pokemonList = [
    { name: "darkrai", label: "Darkrai (다크라이)", x: 30, y: 80, scale: 2 },
    { name: "charizard", label: "Charizard (리자몽)", x: 200, y: 80, scale: 2 },
    { name: "gengar-mega", label: "Mega Gengar (메가팬텀)", x: 370, y: 80, scale: 2 },
  ];

  for (const p of pokemonList) {
    const sprite = await getPokemonSprite(p.name);
    if (sprite) {
      ctx.fillStyle = "#1E1A33";
      ctx.fillRect(p.x, p.y, 160, 190);
      ctx.strokeStyle = "#383152";
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x, p.y, 160, 190);

      const sprW = sprite.width * p.scale;
      const sprH = sprite.height * p.scale;
      const sprX = p.x + (160 - sprW) / 2;
      const sprY = p.y + (150 - sprH) / 2;
      ctx.drawImage(sprite, sprX, sprY, sprW, sprH);

      ctx.font = "13px DungGeunMo";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.fillText(p.label, p.x + 80, p.y + 175);
    }
  }

  ctx.font = "13px DungGeunMo";
  ctx.fillStyle = "#57F287";
  ctx.textAlign = "center";
  ctx.fillText("✔ 100% Crisp Pixel Art Rendering Verified", width / 2, 315);

  return canvas.toBuffer("image/png");
}
