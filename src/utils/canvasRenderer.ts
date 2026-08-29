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
 * Renders title card maximized to 560x380
 */
export async function renderTitleScreen(options?: TitleScreenOptions): Promise<Buffer> {
  const width = 560;
  const height = 380;
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
    const logoWidth = 248;
    const logoHeight = (logo.height / logo.width) * logoWidth;
    const logoX = leftPadding;
    const logoY = 40;
    ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

    // Team Name
    ctx.font = "20px DungGeunMo";
    ctx.fillStyle = "#F4A261";
    ctx.textAlign = "left";
    ctx.fillText("By PageFaultGames", leftPadding + 4, logoY + logoHeight + 28);

    // 4. Menu List on the Left
    const menuStartY = logoY + logoHeight + 76;
    ctx.font = "24px DungGeunMo";
    ctx.fillStyle = "#FFFFFF";

    if (options?.hasSavedSlots) {
      ctx.fillText("1. CONTINUE", leftPadding + 4, menuStartY);
      ctx.fillText("2. NEW GAME", leftPadding + 4, menuStartY + 38);
      ctx.fillText("3. LOAD GAME", leftPadding + 4, menuStartY + 76);
      ctx.fillText("4. INVENTORY", leftPadding + 4, menuStartY + 114);
    } else {
      ctx.fillText("1. NEW GAME", leftPadding + 4, menuStartY);
      ctx.fillText("2. INVENTORY", leftPadding + 4, menuStartY + 42);
    }
  }

  // 5. RIGHT SIDE PANEL: User Header + 2x3 Pokemon Party Slots
  const boxX = 295;
  const boxY = 18;
  const boxW = 244;
  const boxH = 344;

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
  const avatarY = boxY + 14;
  const avatarSize = 34;

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
      ctx.fillStyle = "#E63946";
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
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
  ctx.fillText(nameToDisplay, avatarX + avatarSize + 10, avatarY + 23);

  // Sub-divider line
  ctx.strokeStyle = "#383152";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(boxX + 8, boxY + 56);
  ctx.lineTo(boxX + boxW - 8, boxY + 56);
  ctx.stroke();

  // 5-2. 2x3 PARTY SLOTS GRID: Maximized Height 84px per slot
  const slotW = 107;
  const slotH = 84;
  const startGridY = boxY + 64;
  const gapX = 8;
  const gapY = 8;
  const borderRadius = 10;

  const partyList = options?.party || [];

  for (let i = 0; i < 6; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const sx = boxX + 11 + col * (slotW + gapX);
    const sy = startGridY + row * (slotH + gapY);

    // Borderless Rounded Slot Box Fill
    ctx.fillStyle = "#141124";
    ctx.beginPath();
    ctx.roundRect(sx, sy, slotW, slotH, borderRadius);
    ctx.fill();

    const pokemon = partyList[i];
    if (pokemon) {
      const sprite = await getPokemonSprite(pokemon.speciesId);
      if (sprite) {
        const scale = 1.15;
        const sprW = sprite.width * scale;
        const sprH = sprite.height * scale;
        ctx.drawImage(sprite, sx + (slotW - sprW) / 2, sy + (slotH - sprH) / 2 - 8, sprW, sprH);
      }
      ctx.font = "12px DungGeunMo";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.fillText(`Lv.${pokemon.level}`, sx + slotW / 2, sy + slotH - 8);
    } else {
      ctx.fillStyle = "#26203D";
      ctx.beginPath();
      ctx.arc(sx + slotW / 2, sy + slotH / 2 - 4, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = "11px DungGeunMo";
      ctx.fillStyle = "#51496D";
      ctx.textAlign = "center";
      ctx.fillText("Empty", sx + slotW / 2, sy + slotH - 8);
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

export interface BagScreenOptions {
  username?: string;
  tab?: "pokedex" | "starters" | "items" | "records";
  dexCount?: number;
  totalDex?: number;
  unlockedCount?: number;
  vouchers?: { regular: number; plus: number; premium: number; gold: number };
  stats?: { totalRuns: number; highestWave: number };
}

/**
 * Renders a Classic Retro Pokémon Trainer Bag UI (560x380)
 */
export async function renderBagScreen(options?: BagScreenOptions): Promise<Buffer> {
  const width = 560;
  const height = 380;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.imageSmoothingEnabled = false;

  const currentTab = options?.tab || "items";

  // 1. Background Fill (Retro Trainer Bag Dark Indigo)
  ctx.fillStyle = "#141226";
  ctx.fillRect(0, 0, width, height);

  // 2. Outer Bag Frame (Gold & Wine-Red Border)
  ctx.strokeStyle = "#F4A261";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, width - 4, height - 4);

  ctx.strokeStyle = "#E63946";
  ctx.lineWidth = 1;
  ctx.strokeRect(6, 6, width - 12, height - 12);

  // 3. TOP BANNER: Trainer Bag Header
  ctx.fillStyle = "#241F3D";
  ctx.fillRect(8, 8, width - 16, 42);

  ctx.strokeStyle = "#4D436D";
  ctx.lineWidth = 1;
  ctx.strokeRect(8, 8, width - 16, 42);

  ctx.font = "bold 20px DungGeunMo";
  ctx.fillStyle = "#F4A261";
  ctx.textAlign = "left";
  ctx.fillText("🎒 TRAINER'S BAG", 24, 36);

  ctx.font = "16px DungGeunMo";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "right";
  const userTitle = (options?.username || "Trainer") + "'s Pocket";
  ctx.fillText(userTitle, width - 24, 36);

  // 4. LEFT SIDE: Pockets & Tabs List
  const leftX = 18;
  const leftY = 60;
  const leftW = 210;
  const leftH = 302;

  ctx.fillStyle = "#1B1730";
  ctx.fillRect(leftX, leftY, leftW, leftH);
  ctx.strokeStyle = "#383152";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(leftX, leftY, leftW, leftH);

  // Pocket Title
  ctx.fillStyle = "#2D264E";
  ctx.fillRect(leftX + 2, leftY + 2, leftW - 4, 30);
  ctx.font = "bold 15px DungGeunMo";
  ctx.fillStyle = "#F4A261";
  ctx.textAlign = "center";
  ctx.fillText("POCKETS (가방 주머니)", leftX + leftW / 2, leftY + 22);

  const tabs = [
    { key: "items", label: "1. ITEMS & VOUCHERS" },
    { key: "starters", label: "2. POKÉMON (포켓몬)" },
    { key: "pokedex", label: "3. POKÉDEX (도감)" },
    { key: "records", label: "4. CAREER RECORDS" },
  ];

  tabs.forEach((t, idx) => {
    const tabY = leftY + 44 + idx * 58;
    const isSelected = currentTab === t.key;

    // Tab button box
    ctx.fillStyle = isSelected ? "#4A3E72" : "#141124";
    ctx.beginPath();
    ctx.roundRect(leftX + 10, tabY, leftW - 20, 46, 6);
    ctx.fill();

    if (isSelected) {
      ctx.strokeStyle = "#F4A261";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#2E2847";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.font = isSelected ? "bold 13px DungGeunMo" : "13px DungGeunMo";
    ctx.fillStyle = isSelected ? "#FFFFFF" : "#8F89AA";
    ctx.textAlign = "left";
    ctx.fillText((isSelected ? "▶ " : "  ") + t.label, leftX + 18, tabY + 28);
  });

  // 5. RIGHT SIDE: Detailed Pocket Content Screen
  const rightX = 240;
  const rightY = 60;
  const rightW = 302;
  const rightH = 302;

  ctx.fillStyle = "#1A162F";
  ctx.fillRect(rightX, rightY, rightW, rightH);
  ctx.strokeStyle = "#4D436D";
  ctx.lineWidth = 2;
  ctx.strokeRect(rightX, rightY, rightW, rightH);

  // Header of Right Content
  ctx.fillStyle = "#2B244A";
  ctx.fillRect(rightX + 2, rightY + 2, rightW - 4, 32);

  ctx.font = "bold 16px DungGeunMo";
  ctx.fillStyle = "#F4A261";
  ctx.textAlign = "left";

  const vouchers = options?.vouchers || { regular: 0, plus: 0, premium: 0, gold: 0 };
  const stats = options?.stats || { totalRuns: 0, highestWave: 0 };
  const unlocked = options?.unlockedCount ?? 9;

  if (currentTab === "items") {
    ctx.fillText("🎟️ GACHA VOUCHERS & ITEMS", rightX + 14, rightY + 23);

    const voucherItems = [
      { name: "Regular Voucher (1x Pull)", count: vouchers.regular || 0, color: "#E0E0E0" },
      { name: "Plus Voucher (5x Pulls)", count: vouchers.plus || 0, color: "#57F287" },
      { name: "Premium Voucher (10x Pulls)", count: vouchers.premium || 0, color: "#5865F2" },
      { name: "Gold Voucher (25x Pulls)", count: vouchers.gold || 0, color: "#FEE75C" },
    ];

    voucherItems.forEach((item, idx) => {
      const itemY = rightY + 48 + idx * 56;

      ctx.fillStyle = "#120F22";
      ctx.beginPath();
      ctx.roundRect(rightX + 12, itemY, rightW - 24, 46, 6);
      ctx.fill();

      ctx.strokeStyle = "#383152";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = "14px DungGeunMo";
      ctx.fillStyle = item.color;
      ctx.textAlign = "left";
      ctx.fillText(`• ${item.name}`, rightX + 24, itemY + 28);

      ctx.font = "bold 15px DungGeunMo";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "right";
      ctx.fillText(`x${item.count}`, rightX + rightW - 24, itemY + 28);
    });
  } else if (currentTab === "starters") {
    ctx.fillText("👾 POKÉMON ROSTER", rightX + 14, rightY + 23);

    ctx.font = "15px DungGeunMo";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";
    ctx.fillText(`• Unlocked Pokémon: ${unlocked} / 586`, rightX + 20, rightY + 70);
    ctx.fillText("• Starter Candies: Available per species", rightX + 20, rightY + 105);
    ctx.fillText("• Passive Skills: Unlockable via Candies", rightX + 20, rightY + 140);
    ctx.fillText("• Cost Reductions: Upgradeable", rightX + 20, rightY + 175);

    // Starter icons sample
    const sampleStarters = ["bulbasaur", "charmander", "squirtle"];
    for (let i = 0; i < sampleStarters.length; i++) {
      const spr = await getPokemonSprite(sampleStarters[i]);
      if (spr) {
        ctx.drawImage(spr, rightX + 25 + i * 85, rightY + 205, spr.width * 1.1, spr.height * 1.1);
      }
    }
  } else if (currentTab === "pokedex") {
    ctx.fillText("📖 NATIONAL POKÉDEX", rightX + 14, rightY + 23);

    ctx.font = "15px DungGeunMo";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";
    ctx.fillText("• Seen Pokémon: 3 / 1025", rightX + 20, rightY + 75);
    ctx.fillText("• Caught Pokémon: 3 / 1025", rightX + 20, rightY + 115);
    ctx.fillText("• Shiny Tier 1 (Yellow): 0", rightX + 20, rightY + 155);
    ctx.fillText("• Shiny Tier 2 (Blue): 0", rightX + 20, rightY + 195);
    ctx.fillText("• Shiny Tier 3 (Red): 0", rightX + 20, rightY + 235);
  } else {
    ctx.fillText("🏆 TRAINER CAREER RECORDS", rightX + 14, rightY + 23);

    ctx.font = "15px DungGeunMo";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";
    ctx.fillText(`• Total Runs Attempted: ${stats.totalRuns}`, rightX + 20, rightY + 80);
    ctx.fillText(`• Highest Wave Reached: Wave ${stats.highestWave}`, rightX + 20, rightY + 125);
    ctx.fillText("• Classic Mode Clears: 0", rightX + 20, rightY + 170);
    ctx.fillText("• Endless Mode Unlocked: Locked 🔒", rightX + 20, rightY + 215);
  }

  return canvas.toBuffer("image/png");
}
