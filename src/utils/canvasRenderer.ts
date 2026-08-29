import { createCanvas, loadImage, GlobalFonts, Image } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";
import { DexPokemonInfo } from "../services/pokeApiService.js";

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
  nickname?: string;
  level: number;
}

export interface TitleScreenOptions {
  username?: string;
  avatarUrl?: string;
  teamName?: string;
  hasSavedSlots?: boolean;
  party?: TitleScreenPartyPokemon[];
  lang?: "en" | "ko";
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
 * Reusable helper to draw the 6-Pokemon Party Split-Screen Panel (Vertical Split Line + Open Grid)
 */
async function drawPartyRightPanel(
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

  // 1. VERTICAL SPLIT DIVIDER LINE (100% Full Height from Top to Bottom)
  const splitX = boxX - 10;
  ctx.strokeStyle = options?.borderColor || "#383152";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(splitX, 0);
  ctx.lineTo(splitX, 380);
  ctx.stroke();

  // Subtle inner accent line for depth (100% Full Height)
  ctx.strokeStyle = "#1F1B36";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(splitX + 2, 0);
  ctx.lineTo(splitX + 2, 380);
  ctx.stroke();

  // 2. USER HEADER (Avatar Circle + Username)
  const avatarX = boxX + 6;
  const avatarY = boxY + 12;
  const avatarSize = 36;

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
  // Username & Active Status
  ctx.font = "bold 19px DungGeunMo";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  const defaultTrainerName = isKo ? "트레이너" : "Trainer";
  const nameToDisplay = (options?.username || defaultTrainerName).slice(0, 12);
  ctx.fillText(nameToDisplay, avatarX + avatarSize + 10, avatarY + 24);

  // Sub-divider line under user header
  ctx.strokeStyle = "#2E284A";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(boxX + 2, boxY + 56);
  ctx.lineTo(boxX + boxW, boxY + 56);
  ctx.stroke();

  // 3. 2x3 PARTY SLOTS GRID: Open & Seamless Split-screen Style
  const slotW = 112;
  const slotH = 88;
  const startGridY = boxY + 66;
  const gapX = 10;
  const gapY = 8;
  const borderRadius = 10;

  const partyList = options?.party || [];
  const emptyLabel = isKo ? "빈 슬롯" : "Empty";

  for (let i = 0; i < 6; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const sx = boxX + 4 + col * (slotW + gapX);
    const sy = startGridY + row * (slotH + gapY);

    // Borderless Rounded Slot Box Fill
    ctx.fillStyle = "#120F24";
    ctx.beginPath();
    ctx.roundRect(sx, sy, slotW, slotH, borderRadius);
    ctx.fill();

    // Slot Subtle Edge Glow / Border
    ctx.strokeStyle = "#25203D";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Slot Number Tag (1, 2, 3, 4, 5, 6) in WHITE
    if (options?.showSlotNumbers) {
      ctx.font = "bold 12px DungGeunMo";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "left";
      ctx.fillText(`${i + 1}`, sx + 8, sy + 16);
    }

    const pokemon = partyList[i];
    if (pokemon) {
      const sprite = await getPokemonSprite(pokemon.speciesId);
      if (sprite) {
        const scale = 1.2;
        const sprW = sprite.width * scale;
        const sprH = sprite.height * scale;
        ctx.drawImage(sprite, sx + (slotW - sprW) / 2, sy + (slotH - sprH) / 2 - 8, sprW, sprH);
      }
      ctx.font = "12px DungGeunMo";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      const displayLabel = pokemon.nickname ? pokemon.nickname.slice(0, 6) : `Lv.${pokemon.level}`;
      ctx.fillText(displayLabel, sx + slotW / 2, sy + slotH - 8);
    } else {
      ctx.fillStyle = "#201B36";
      ctx.beginPath();
      ctx.arc(sx + slotW / 2, sy + slotH / 2 - 4, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = "12px DungGeunMo";
      ctx.fillStyle = "#51496D";
      ctx.textAlign = "center";
      ctx.fillText(emptyLabel, sx + slotW / 2, sy + slotH - 8);
    }
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

  ctx.imageSmoothingEnabled = false;

  const isKo = options?.lang === "ko";

  // 1. Dark Retro Background
  ctx.fillStyle = "#161424";
  ctx.fillRect(0, 0, width, height);

  // 2. Logo Aligned to LEFT
  const logo = await getLogoImage();
  const leftPadding = 28;

  if (logo) {
    const logoWidth = 248;
    const logoHeight = (logo.height / logo.width) * logoWidth;
    const logoX = leftPadding;
    const logoY = 40;
    ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

    // Subtitle: Discord Bot version
    ctx.font = "19px DungGeunMo";
    ctx.fillStyle = "#F4A261";
    ctx.textAlign = "left";
    ctx.fillText("Discord Bot version", leftPadding + 4, logoY + logoHeight + 28);

    // 3. Menu List on the Left (Multilingual, 24px)
    const menuStartY = logoY + logoHeight + 76;
    ctx.font = "24px DungGeunMo";
    ctx.fillStyle = "#FFFFFF";

    if (options?.hasSavedSlots) {
      ctx.fillText(isKo ? "1. 불러오기" : "1. LOAD GAME", leftPadding + 4, menuStartY);
      ctx.fillText(isKo ? "2. 새 게임" : "2. NEW GAME", leftPadding + 4, menuStartY + 38);
      ctx.fillText(isKo ? "3. 멀티플레이" : "3. MULTIPLAY", leftPadding + 4, menuStartY + 76);
      ctx.fillText(isKo ? "4. 인벤토리" : "4. INVENTORY", leftPadding + 4, menuStartY + 114);
    } else {
      ctx.fillText(isKo ? "1. 새 게임" : "1. NEW GAME", leftPadding + 4, menuStartY);
      ctx.fillText(isKo ? "2. 멀티플레이" : "2. MULTIPLAY", leftPadding + 4, menuStartY + 38);
      ctx.fillText(isKo ? "3. 인벤토리" : "3. INVENTORY", leftPadding + 4, menuStartY + 76);
    }
  }

  // 4. RIGHT SIDE PANEL: showSlotNumbers is FALSE on Title Screen
  await drawPartyRightPanel(ctx, 295, 18, 244, 344, {
    username: options?.username,
    avatarUrl: options?.avatarUrl,
    party: options?.party,
    lang: options?.lang,
    showSlotNumbers: false,
  });

  // 5. Outer Border Frame flush to edge (Top Z-Index)
  ctx.strokeStyle = "#E63946";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, width - 4, height - 4);

  ctx.strokeStyle = "#383152";
  ctx.lineWidth = 1;
  ctx.strokeRect(6, 6, width - 12, height - 12);

  return canvas.toBuffer("image/png");
}

export interface MultiplayerScreenOptions {
  username?: string;
  avatarUrl?: string;
  party?: TitleScreenPartyPokemon[];
  lang?: "en" | "ko";
}

/**
 * Renders Multiplayer Screen with Discord Blurple (#5865F2) Border & Entry Notice
 */
export async function renderMultiplayerScreen(options?: MultiplayerScreenOptions): Promise<Buffer> {
  const width = 560;
  const height = 380;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.imageSmoothingEnabled = false;

  const isKo = options?.lang === "ko";
  const party = options?.party || [];
  const registeredCount = party.filter(Boolean).length;
  const isComplete = registeredCount >= 1; // At least 1 Pokemon registered

  // 1. Dark Retro Background
  ctx.fillStyle = "#141226";
  ctx.fillRect(0, 0, width, height);

  // 2. TOP BANNER: Multiplayer Lobby Header (Centered)
  ctx.fillStyle = "#1E2247";
  ctx.fillRect(8, 8, 275, 42);

  ctx.strokeStyle = "#5865F2";
  ctx.lineWidth = 1;
  ctx.strokeRect(8, 8, 275, 42);

  drawVectorGlobe(ctx, 38, 29, 10, "#5865F2");

  ctx.font = "bold 20px DungGeunMo";
  ctx.fillStyle = "#5865F2";
  ctx.textAlign = "center";
  ctx.fillText(isKo ? "멀티플레이 로비" : "MULTIPLAYER LOBBY", 8 + 275 / 2 + 10, 36);

  // 3. LEFT SIDE: Clean minimal area (Ready for lobby/matchmaking)
  // Left side is kept clear and minimal as requested

  // 4. RIGHT SIDE PANEL: Multiplayer Team (with slot numbers 1~6 and Blurple border)
  await drawPartyRightPanel(ctx, 295, 18, 244, 344, {
    username: options?.username,
    avatarUrl: options?.avatarUrl,
    party: options?.party,
    lang: options?.lang,
    showSlotNumbers: true,
    borderColor: "#5865F2",
  });

  // 5. Outer Border Frame (Top Z-Index: Overlays on top of the vertical split line)
  ctx.strokeStyle = "#5865F2";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, width - 4, height - 4);

  ctx.strokeStyle = "#2D315E";
  ctx.lineWidth = 1;
  ctx.strokeRect(6, 6, width - 12, height - 12);

  return canvas.toBuffer("image/png");
}

export interface BagScreenOptions {
  username?: string;
  avatarUrl?: string;
  tab?: "pokemon" | "pokedex" | "records";
  party?: TitleScreenPartyPokemon[];
  unlockedCount?: number;
  stats?: { totalRuns: number; highestWave: number };
  lang?: "en" | "ko";
}

/**
 * Renders Trainer Bag UI with WHITE slot numbers 1~6 on right panel
 */
export async function renderBagScreen(options?: BagScreenOptions): Promise<Buffer> {
  const width = 560;
  const height = 380;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.imageSmoothingEnabled = false;

  const isKo = options?.lang === "ko";
  const currentTab = options?.tab || "pokemon";

  // 1. Dark Retro Background
  ctx.fillStyle = "#161424";
  ctx.fillRect(0, 0, width, height);

  // 2. TOP BANNER: Trainer Bag Header with Vector Bag Icon
  ctx.fillStyle = "#241F3D";
  ctx.fillRect(8, 8, 275, 42);

  ctx.strokeStyle = "#4D436D";
  ctx.lineWidth = 1;
  ctx.strokeRect(8, 8, 275, 42);

  drawVectorBag(ctx, 26, 29, 14, 14, "#F4A261");

  ctx.font = "bold 20px DungGeunMo";
  ctx.fillStyle = "#F4A261";
  ctx.textAlign = "left";
  ctx.fillText(isKo ? "트레이너 포켓" : "TRAINER POCKET", 44, 36);

  // 4. LEFT SIDE: Menu / Category Box
  const leftX = 18;
  const leftY = 58;
  const leftW = 265;
  const leftH = 304;

  ctx.fillStyle = "#1B1730";
  ctx.fillRect(leftX, leftY, leftW, leftH);
  ctx.strokeStyle = "#383152";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(leftX, leftY, leftW, leftH);

  // Pocket Title
  ctx.fillStyle = "#2D264E";
  ctx.fillRect(leftX + 2, leftY + 2, leftW - 4, 32);
  ctx.font = "bold 17px DungGeunMo";
  ctx.fillStyle = "#F4A261";
  ctx.textAlign = "center";
  ctx.fillText(isKo ? "POKÉMON VAULT" : "POKÉMON VAULT", leftX + leftW / 2, leftY + 23);

  const tabs = isKo
    ? [
        { key: "pokemon", label: "1. 출전 포켓몬" },
        { key: "pokedex", label: "2. 포켓몬 도감" },
        { key: "records", label: "3. 트레이너 기록" },
      ]
    : [
        { key: "pokemon", label: "1. ACTIVE PARTY" },
        { key: "pokedex", label: "2. POKÉDEX" },
        { key: "records", label: "3. CAREER RECORDS" },
      ];

  tabs.forEach((t, idx) => {
    const tabY = leftY + 44 + idx * 60;
    const isSelected = currentTab === t.key;

    ctx.fillStyle = isSelected ? "#4A3E72" : "#141124";
    ctx.beginPath();
    ctx.roundRect(leftX + 10, tabY, leftW - 20, 48, 8);
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

    ctx.font = isSelected ? "bold 16px DungGeunMo" : "16px DungGeunMo";
    ctx.fillStyle = isSelected ? "#FFFFFF" : "#8F89AA";
    ctx.textAlign = "left";
    ctx.fillText((isSelected ? "▶ " : "  ") + t.label, leftX + 18, tabY + 30);
  });

  // 4-1. Bottom Info Box: ONLY HIGHEST WAVE
  const infoBoxY = leftY + 230;
  const infoBoxH = 62;

  ctx.fillStyle = "#141124";
  ctx.beginPath();
  ctx.roundRect(leftX + 10, infoBoxY, leftW - 20, infoBoxH, 8);
  ctx.fill();

  ctx.strokeStyle = "#F4A261";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  drawVectorStar(ctx, leftX + leftW / 2 - 58, infoBoxY + 20, 5, 6, 3, "#F4A261");
  ctx.font = "14px DungGeunMo";
  ctx.fillStyle = "#8F89AA";
  ctx.textAlign = "center";
  ctx.fillText(isKo ? "최고 도달 기록" : "BEST RUN RECORD", leftX + leftW / 2 + 6, infoBoxY + 24);

  ctx.font = "bold 18px DungGeunMo";
  ctx.fillStyle = "#57F287";
  ctx.fillText(`Wave ${options?.stats?.highestWave ?? 0}`, leftX + leftW / 2, infoBoxY + 48);

  // 5. RIGHT SIDE PANEL: showSlotNumbers is TRUE with WHITE color in Bag Screen
  await drawPartyRightPanel(ctx, 295, 18, 244, 344, {
    username: options?.username,
    avatarUrl: options?.avatarUrl,
    party: options?.party,
    lang: options?.lang,
    showSlotNumbers: true,
  });

  // 6. Outer Border Frame (Gold & Wine-Red Border - Top Z-Index)
  ctx.strokeStyle = "#F4A261";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, width - 4, height - 4);

  ctx.strokeStyle = "#383152";
  ctx.lineWidth = 1;
  ctx.strokeRect(6, 6, width - 12, height - 12);

  return canvas.toBuffer("image/png");
}

export interface PokedexScreenOptions {
  selectedPokemon?: DexPokemonInfo | null;
  pageList?: DexPokemonInfo[];
  currentPage?: number;
  totalPages?: number;
  lang?: "en" | "ko";
}

const TYPE_COLORS: Record<string, string> = {
  normal: "#A8A878",
  fire: "#F08030",
  water: "#6890F0",
  grass: "#78C850",
  electric: "#F8D030",
  ice: "#98D8D8",
  fighting: "#C03028",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#A890F0",
  psychic: "#F85888",
  bug: "#A8B820",
  rock: "#B8A038",
  ghost: "#705898",
  dragon: "#7038F8",
  steel: "#B8B8D0",
  fairy: "#EE99AC",
  dark: "#705848",
};

/**
 * Renders the Unified Dedicated Pokédex Screen (560x380) with 100% Split Screen
 */
export async function renderPokedexScreen(options?: PokedexScreenOptions): Promise<Buffer> {
  const width = 560;
  const height = 380;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.imageSmoothingEnabled = false;

  const isKo = options?.lang === "ko";
  const items = options?.pageList || [];
  const selected = options?.selectedPokemon || items[0] || null;
  const curPage = options?.currentPage || 1;
  const totPages = options?.totalPages || 205;

  // 1. Dark Retro Background
  ctx.fillStyle = "#12101F";
  ctx.fillRect(0, 0, width, height);

  // 2. TOP BANNER: Pokédex Title & Page (Centered)
  ctx.fillStyle = "#2D1520";
  ctx.fillRect(8, 8, 246, 38);
  ctx.strokeStyle = "#E63946";
  ctx.lineWidth = 1;
  ctx.strokeRect(8, 8, 246, 38);

  ctx.font = "bold 18px DungGeunMo";
  ctx.fillStyle = "#E63946";
  ctx.textAlign = "center";
  ctx.fillText(isKo ? "포켓몬 도감" : "POKÉDEX", 8 + 246 / 2, 33);

  // Page Indicator Badge on Left Header
  ctx.font = "12px DungGeunMo";
  ctx.fillStyle = "#CBD5E1";
  ctx.textAlign = "right";
  ctx.fillText(`P.${curPage}/${totPages}`, 246, 32);

  // 3. LEFT SIDE: 5 Pokémon List Items
  const listX = 12;
  const startListY = 52;
  const slotW = 240;
  const slotH = 58;
  const slotGap = 6;

  for (let i = 0; i < 5; i++) {
    const p = items[i];
    const sy = startListY + i * (slotH + slotGap);
    const isSelected = selected && p && selected.dexNumber === p.dexNumber;

    // Slot Box Background
    ctx.fillStyle = isSelected ? "#2E1A2C" : "#1B172E";
    ctx.beginPath();
    ctx.roundRect(listX, sy, slotW, slotH, 8);
    ctx.fill();

    ctx.strokeStyle = isSelected ? "#E63946" : "#322A4E";
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.stroke();

    if (p) {
      // Mini Sprite
      const sprite = await getPokemonSprite(p.speciesId);
      if (sprite) {
        const scale = 0.85;
        const sprW = sprite.width * scale;
        const sprH = sprite.height * scale;
        ctx.drawImage(sprite, listX + 6 + (40 - sprW) / 2, sy + (slotH - sprH) / 2, sprW, sprH);
      }

      // Dex Number & Name
      ctx.font = "bold 13px DungGeunMo";
      ctx.fillStyle = isSelected ? "#FFFFFF" : "#CBD5E1";
      ctx.textAlign = "left";
      const displayName = (isKo && p.koreanName) ? p.koreanName : p.name;
      const dexTag = `#${String(p.dexNumber).padStart(3, "0")}`;
      ctx.fillText(`${dexTag} ${displayName}`, listX + 50, sy + 24);

      // Mini Type Badges
      let badgeX = listX + 50;
      for (const tName of p.types) {
        const tColor = TYPE_COLORS[tName.toLowerCase()] || "#777777";
        ctx.fillStyle = tColor;
        ctx.beginPath();
        ctx.roundRect(badgeX, sy + 32, 44, 16, 4);
        ctx.fill();

        ctx.font = "bold 10px DungGeunMo";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.fillText(tName.toUpperCase(), badgeX + 22, sy + 44);
        badgeX += 48;
      }

      if (isSelected) {
        // Selection Arrow Marker
        ctx.font = "bold 14px DungGeunMo";
        ctx.fillStyle = "#E63946";
        ctx.textAlign = "right";
        ctx.fillText("▶", listX + slotW - 8, sy + 34);
      }
    } else {
      ctx.font = "13px DungGeunMo";
      ctx.fillStyle = "#4D4566";
      ctx.textAlign = "center";
      ctx.fillText("---", listX + slotW / 2, sy + 34);
    }
  }

  // 4. VERTICAL SPLIT DIVIDER LINE (100% Full Height)
  const splitX = 262;
  ctx.strokeStyle = "#E63946";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(splitX, 0);
  ctx.lineTo(splitX, height);
  ctx.stroke();

  ctx.strokeStyle = "#1F1B36";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(splitX + 2, 0);
  ctx.lineTo(splitX + 2, height);
  ctx.stroke();

  // 5. RIGHT SIDE: Selected Pokémon Detailed Stats & Showcase
  const rightX = 274;
  const rightW = width - rightX - 10;

  if (selected) {
    // Header: Dex No & Big Name
    ctx.font = "bold 20px DungGeunMo";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";
    const titleName = (isKo && selected.koreanName) ? `${selected.koreanName} (${selected.name})` : selected.name;
    ctx.fillText(`#${String(selected.dexNumber).padStart(3, "0")} ${titleName}`, rightX + 6, 32);

    // Sub-divider line under header
    ctx.strokeStyle = "#382D4F";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rightX + 4, 42);
    ctx.lineTo(rightX + rightW, 42);
    ctx.stroke();

    // Large Sprite Showcase Box (104x104)
    const showBoxX = rightX + 6;
    const showBoxY = 52;
    const showBoxSize = 104;

    ctx.fillStyle = "#181429";
    ctx.beginPath();
    ctx.roundRect(showBoxX, showBoxY, showBoxSize, showBoxSize, 8);
    ctx.fill();
    ctx.strokeStyle = "#4D3860";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const bigSprite = await getPokemonSprite(selected.speciesId);
    if (bigSprite) {
      const scale = 1.8;
      const sprW = bigSprite.width * scale;
      const sprH = bigSprite.height * scale;
      ctx.drawImage(bigSprite, showBoxX + (showBoxSize - sprW) / 2, showBoxY + (showBoxSize - sprH) / 2, sprW, sprH);
    }

    // Info Column (Types, Height, Weight) next to Sprite
    const infoX = showBoxX + showBoxSize + 12;
    let typeBadgeX = infoX;
    for (const tName of selected.types) {
      const tColor = TYPE_COLORS[tName.toLowerCase()] || "#777777";
      ctx.fillStyle = tColor;
      ctx.beginPath();
      ctx.roundRect(typeBadgeX, showBoxY + 4, 62, 22, 5);
      ctx.fill();

      ctx.font = "bold 12px DungGeunMo";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.fillText(tName.toUpperCase(), typeBadgeX + 31, showBoxY + 19);
      typeBadgeX += 68;
    }

    // Height & Weight info
    ctx.font = "14px DungGeunMo";
    ctx.fillStyle = "#CBD5E1";
    ctx.textAlign = "left";
    const heightM = ((selected.height || 10) / 10).toFixed(1);
    const weightKg = ((selected.weight || 100) / 10).toFixed(1);
    ctx.fillText(isKo ? `• 키: ${heightM} m` : `• Height: ${heightM} m`, infoX, showBoxY + 54);
    ctx.fillText(isKo ? `• 몸무게: ${weightKg} kg` : `• Weight: ${weightKg} kg`, infoX, showBoxY + 78);

    // Total Base Stats sum
    const bst = selected.hp + selected.attack + selected.defense + selected.spAttack + selected.spDefense + selected.speed;
    ctx.font = "bold 14px DungGeunMo";
    ctx.fillStyle = "#57F287";
    ctx.fillText(isKo ? `• 종족값 총합: ${bst}` : `• Base Stat Total: ${bst}`, infoX, showBoxY + 100);

    // 6 Base Stats Gauges (HP, ATK, DEF, SPA, SPD, SPE)
    const statsStartY = 168;
    const statsList = [
      { label: "HP", val: selected.hp, color: "#57F287" },
      { label: isKo ? "공격" : "ATK", val: selected.attack, color: "#F08030" },
      { label: isKo ? "방어" : "DEF", val: selected.defense, color: "#6890F0" },
      { label: isKo ? "특공" : "SPA", val: selected.spAttack, color: "#C03028" },
      { label: isKo ? "특방" : "SPD", val: selected.spDefense, color: "#F85888" },
      { label: isKo ? "스핏" : "SPE", val: selected.speed, color: "#F8D030" },
    ];

    const barMaxW = 180;
    for (let sIdx = 0; sIdx < statsList.length; sIdx++) {
      const st = statsList[sIdx];
      const rowY = statsStartY + sIdx * 32;

      // Label & Value
      ctx.font = "bold 13px DungGeunMo";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "left";
      ctx.fillText(st.label, rightX + 6, rowY + 16);

      ctx.textAlign = "right";
      ctx.fillStyle = st.color;
      ctx.fillText(String(st.val), rightX + 68, rowY + 16);

      // Gauge Background
      const gaugeX = rightX + 76;
      ctx.fillStyle = "#161326";
      ctx.beginPath();
      ctx.roundRect(gaugeX, rowY + 6, barMaxW, 12, 4);
      ctx.fill();

      // Gauge Fill
      const fillW = Math.min(barMaxW, Math.max(4, (st.val / 200) * barMaxW));
      ctx.fillStyle = st.color;
      ctx.beginPath();
      ctx.roundRect(gaugeX, rowY + 6, fillW, 12, 4);
      ctx.fill();
    }
  }

  // 6. Outer Border Frame (Top Z-Index: Signature Pokédex Red)
  ctx.strokeStyle = "#E63946";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, width - 4, height - 4);

  ctx.strokeStyle = "#383152";
  ctx.lineWidth = 1;
  ctx.strokeRect(6, 6, width - 12, height - 12);

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
    { name: "darkrai", label: "Darkrai", x: 30, y: 80, scale: 2 },
    { name: "charizard", label: "Charizard", x: 200, y: 80, scale: 2 },
    { name: "gengar-mega", label: "Mega Gengar", x: 370, y: 80, scale: 2 },
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
