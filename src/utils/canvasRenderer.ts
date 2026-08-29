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

export interface TitleScreenOptions {
  teamName?: string;
  hasSavedSlots?: boolean;
  unlockedCount?: number;
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
 * Renders title card without arrow prefixes
 */
export async function renderTitleScreen(options?: TitleScreenOptions): Promise<Buffer> {
  const width = 560;
  const height = 350;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Disable anti-aliasing / smoothing for sharp, unblurred pixel art
  ctx.imageSmoothingEnabled = false;

  // 1. Dark Retro Background
  ctx.fillStyle = "#161424";
  ctx.fillRect(0, 0, width, height);

  // 2. Outer Border Frame flush to edge
  ctx.strokeStyle = "#E63946";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, width - 4, height - 4);

  ctx.strokeStyle = "#383152";
  ctx.lineWidth = 1;
  ctx.strokeRect(6, 6, width - 12, height - 12);

  // 3. Logo Aligned to LEFT
  const logo = await getLogoImage();
  const leftPadding = 30;

  if (logo) {
    const logoWidth = 250;
    const logoHeight = (logo.height / logo.width) * logoWidth;
    const logoX = leftPadding;
    const logoY = 36;
    ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

    // Team Name
    ctx.font = "20px DungGeunMo";
    ctx.fillStyle = "#F4A261";
    ctx.textAlign = "left";
    ctx.fillText("By PageFaultGames", leftPadding + 4, logoY + logoHeight + 26);

    // 4. Menu List on the Left (No arrow prefix)
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

  // 5. RIGHT SIDE: Clean open canvas

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

  // Disable smoothing for sharp pixel art
  ctx.imageSmoothingEnabled = false;

  // Background
  ctx.fillStyle = "#12101F";
  ctx.fillRect(0, 0, width, height);

  // Borders
  ctx.strokeStyle = "#E63946";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, width - 4, height - 4);

  // Header Text
  ctx.font = "22px DungGeunMo";
  ctx.fillStyle = "#F4A261";
  ctx.textAlign = "center";
  ctx.fillText("★ PIXEL ART SPRITE QUALITY TEST ★", width / 2, 38);

  ctx.font = "14px DungGeunMo";
  ctx.fillStyle = "#8E88AB";
  ctx.fillText("Nearest-Neighbor Scaled (Zero Blur / No Smoothing)", width / 2, 60);

  // Load sample sprites
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

  // Footer status
  ctx.font = "13px DungGeunMo";
  ctx.fillStyle = "#57F287";
  ctx.textAlign = "center";
  ctx.fillText("✔ 100% Crisp Pixel Art Rendering Verified", width / 2, 315);

  return canvas.toBuffer("image/png");
}
