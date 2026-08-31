import { createCanvas, loadImage, GlobalFonts, Image } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";
import { DexPokemonInfo, getAbilityDetail, getPokemonSpeciesInfo } from "../services/pokeApiService.js";
import { StarterEntry, GENERATION_INFO, getStarterByDexNumber } from "../data/starterCosts.js";
import { MOVES_DATA } from "../data/movesKo.js";

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

// In-Memory Sprite Cache for instant 0ms rendering
const spriteCache = new Map<string, Image>();

/**
 * Helper to fetch a static pixel sprite from Showdown CDN with in-memory caching
 */
export async function getPokemonSprite(pokemonName: string, allowFetch: boolean = true, isShiny: boolean = false): Promise<Image | null> {
  try {
    let clean = pokemonName.toLowerCase().trim();
    if (clean === "nidoran-f" || clean === "nidoran_f" || clean === "nidoran♀") clean = "nidoranf";
    else if (clean === "nidoran-m" || clean === "nidoran_m" || clean === "nidoran♂") clean = "nidoranm";
    else if (clean === "mr-mime" || clean === "mr.-mime" || clean === "mr mime") clean = "mrmime";
    else if (clean === "mime-jr" || clean === "mime-jr." || clean === "mime jr") clean = "mimejr";
    else if (clean === "mr-rime" || clean === "mr.-rime" || clean === "mr rime") clean = "mrrime";
    else if (clean === "ho-oh") clean = "hooh";
    else if (clean === "porygon-z") clean = "porygonz";
    else if (clean === "jangmo-o") clean = "jangmoo";
    else if (clean === "hakamo-o") clean = "hakamoo";
    else if (clean === "kommo-o") clean = "kommoo";
    else if (clean === "type-null" || clean === "type: null") clean = "typenull";
    else if (clean.startsWith("tapu-")) clean = clean.replace("tapu-", "tapu");
    else if (clean.startsWith("tapu ")) clean = clean.replace("tapu ", "tapu");
    else if (clean === "wo-chien") clean = "wochien";
    else if (clean === "chien-pao") clean = "chienpao";
    else if (clean === "ting-lu") clean = "tinglu";
    else if (clean === "chi-yu") clean = "chiyu";
    else if (clean.startsWith("aegislash")) clean = "aegislash";
    else if (clean.startsWith("meowstic")) clean = "meowstic";
    else if (clean.startsWith("pumpkaboo")) clean = "pumpkaboo";
    else if (clean.startsWith("gourgeist")) clean = "gourgeist";
    else if (clean.startsWith("zygarde")) clean = "zygarde";
    else if (clean.startsWith("oricorio")) clean = "oricorio";
    else if (clean.startsWith("lycanroc")) clean = "lycanroc";
    else if (clean.startsWith("wishiwashi")) clean = "wishiwashi";
    else if (clean.startsWith("minior")) clean = "minior";
    else if (clean.startsWith("mimikyu")) clean = "mimikyu";
    else if (clean.startsWith("toxtricity")) clean = "toxtricity";
    else if (clean.startsWith("eiscue")) clean = "eiscue";
    else if (clean.startsWith("indeedee")) clean = "indeedee";
    else if (clean.startsWith("morpeko")) clean = "morpeko";
    else if (clean.startsWith("urshifu")) clean = "urshifu";
    else if (clean.startsWith("basculegion")) clean = "basculegion";
    else if (clean.startsWith("enamorus")) clean = "enamorus";
    else if (clean.startsWith("ogerpon")) clean = "ogerpon";
    else if (clean.startsWith("terapagos")) clean = "terapagos";
    else if (clean.startsWith("deoxys")) clean = "deoxys";
    else if (clean.startsWith("wormadam")) clean = "wormadam";
    else if (clean.startsWith("giratina")) clean = "giratina";
    else if (clean.startsWith("shaymin")) clean = "shaymin";
    else if (clean.startsWith("basculin")) clean = "basculin";
    else if (clean.startsWith("darmanitan")) clean = "darmanitan";
    else if (clean.startsWith("tornadus")) clean = "tornadus";
    else if (clean.startsWith("thundurus")) clean = "thundurus";
    else if (clean.startsWith("landorus")) clean = "landorus";
    else if (clean.startsWith("frillish")) clean = "frillish";
    else if (clean.startsWith("jellicent")) clean = "jellicent";
    else if (clean.startsWith("keldeo")) clean = "keldeo";
    else if (clean.startsWith("meloetta")) clean = "meloetta";
    else if (clean.startsWith("pyroar")) clean = "pyroar";
    else if (clean.startsWith("oinkologne")) clean = "oinkologne";
    else if (clean.startsWith("maushold")) clean = "maushold";
    else if (clean.startsWith("palafin")) clean = "palafin";
    else if (clean.startsWith("dudunsparce")) clean = "dudunsparce";
    else if (clean.startsWith("squawkabilly")) clean = "squawkabilly";
    else if (clean.startsWith("tatsugiri")) clean = "tatsugiri";
    else if (clean.startsWith("sinistcha")) clean = "sinistcha";
    else if (clean.startsWith("poltchageist")) clean = "poltchageist";
    else if (clean.startsWith("ursaluna")) clean = "ursaluna";
    else if (clean.startsWith("koraidon")) clean = "koraidon";
    else if (clean.startsWith("miraidon")) clean = "miraidon";
    else clean = clean.replace(/[^a-z0-9]/g, "");

    const cacheKey = isShiny ? `shiny_${clean}` : clean;

    if (spriteCache.has(cacheKey)) {
      return spriteCache.get(cacheKey)!;
    }

    if (!allowFetch) {
      return null;
    }

    const folder = isShiny ? "gen5-shiny" : "gen5";
    const url = `https://play.pokemonshowdown.com/sprites/${folder}/${clean}.png`;
    let img: Image | null = null;
    try {
      img = await loadImage(url);
    } catch {
      // Fallback to non-shiny if shiny is missing
      if (isShiny) {
        img = await loadImage(`https://play.pokemonshowdown.com/sprites/gen5/${clean}.png`).catch(() => null);
      }
    }

    if (img) {
      // Automatic LRU-style cache size management (max 250 entries)
      if (spriteCache.size >= 250) {
        const firstKey = spriteCache.keys().next().value;
        if (firstKey) spriteCache.delete(firstKey);
      }
      spriteCache.set(cacheKey, img);
      return img;
    }
    return null;
  } catch (err) {
    console.error(`[CANVAS] Failed to load sprite for ${pokemonName}:`, err);
    return null;
  }
}

/**
 * Checks if a Pokémon's sprite is already loaded in RAM memory
 */
export function isSpriteCached(pokemonName: string): boolean {
  let clean = pokemonName.toLowerCase().trim();
  clean = clean.replace(/[^a-z0-9]/g, "");
  return spriteCache.has(clean);
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
 * Draws a clean vector PokéRogue 4-point sparkle star (replaces emoji to prevent font breaking)
 */
export function drawShinySparkle(ctx: any, cx: number, cy: number, size: number, color: string = "#F59E0B") {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  const r = size;
  ctx.moveTo(cx, cy - r);
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
  const themeBorder = options?.borderColor || "#2D3246";
  ctx.strokeStyle = themeBorder;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(splitX, 0);
  ctx.lineTo(splitX, 380);
  ctx.stroke();

  // 2. USER HEADER (Avatar Circle + Username aligned to Top Header Bar at y: 0 ~ 42)
  const avatarX = boxX + 6;
  const avatarY = 5;
  const avatarSize = 32;

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
      ctx.fillStyle = themeBorder;
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = themeBorder;
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Username (Vertically centered at y = 27, matching left header text)
  ctx.font = "bold 18px DungGeunMo";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  const defaultTrainerName = isKo ? "트레이너" : "Trainer";
  const nameToDisplay = (options?.username || defaultTrainerName).slice(0, 12);
  ctx.fillText(nameToDisplay, avatarX + avatarSize + 10, 27);

  // Sub-divider line under user header at y = 42 (matching left header divider line)
  ctx.strokeStyle = themeBorder;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(splitX, 42);
  ctx.lineTo(560, 42);
  ctx.stroke();

  // 3. 2x3 PARTY SLOTS GRID: Packed Full-Fit Style (124x102, y: 48 ~ 366)
  const slotW = 124;
  const slotH = 102;
  const startGridY = 48;
  const gapX = 8;
  const gapY = 6;
  const borderRadius = 8;

  const partyList = options?.party || [];
  const emptyLabel = isKo ? "빈 슬롯" : "Empty";

  for (let i = 0; i < 6; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const sx = splitX + 8 + col * (slotW + gapX);
    const sy = startGridY + row * (slotH + gapY);

    // Borderless Rounded Slot Box Fill (Refined Dark Theme)
    ctx.fillStyle = options?.borderColor ? "#161928" : "#181B26";
    ctx.beginPath();
    ctx.roundRect(sx, sy, slotW, slotH, borderRadius);
    ctx.fill();

    // Slot Subtle Edge Border
    ctx.strokeStyle = options?.borderColor ? "#282E48" : "#282D3D";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Slot Number Tag (1, 2, 3, 4, 5, 6)
    if (options?.showSlotNumbers) {
      ctx.font = "bold 13px DungGeunMo";
      ctx.fillStyle = options?.borderColor || "#8E96AB";
      ctx.textAlign = "left";
      ctx.fillText(`${i + 1}`, sx + 9, sy + 17);
    }

    const pokemon = partyList[i];
    if (pokemon) {
      const sprite = await getPokemonSprite(pokemon.speciesId);
      if (sprite) {
        const scale = 1.35;
        const sprW = sprite.width * scale;
        const sprH = sprite.height * scale;
        ctx.drawImage(sprite, sx + (slotW - sprW) / 2, sy + (slotH - sprH) / 2 - 8, sprW, sprH);
      }
      ctx.font = "bold 13px DungGeunMo";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      const displayLabel = (pokemon.nickname || pokemon.name || "Pokemon").slice(0, 7);
      ctx.fillText(displayLabel, sx + slotW / 2, sy + slotH - 8);
    } else {
      ctx.fillStyle = "#222636";
      ctx.beginPath();
      ctx.arc(sx + slotW / 2, sy + slotH / 2 - 4, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = "12px DungGeunMo";
      ctx.fillStyle = "#6B7285";
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
  ctx.textRendering = "optimizeSpeed";

  const isKo = options?.lang === "ko";

  // 1. Dark Retro Background
  ctx.fillStyle = "#13151F";
  ctx.fillRect(0, 0, width, height);

  // 2. Logo Aligned to LEFT (Balanced Margin from Divider Line)
  const logo = await getLogoImage();
  const leftPadding = 16;

  if (logo) {
    const logoWidth = 232;
    const logoHeight = (logo.height / logo.width) * logoWidth;
    const logoX = leftPadding;
    const logoY = 38;
    ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

    // Subtitle: Discord Bot version
    ctx.font = "18px DungGeunMo";
    ctx.fillStyle = "#F4A261";
    ctx.textAlign = "left";
    ctx.fillText("Discord Bot version", leftPadding + 6, logoY + logoHeight + 26);

    // 3. Menu List on the Left (Multilingual, 24px)
    const menuStartY = logoY + logoHeight + 72;
    ctx.font = "24px DungGeunMo";
    ctx.fillStyle = "#FFFFFF";

    if (options?.hasSavedSlots) {
      ctx.fillText(isKo ? "1. 불러오기" : "1. LOAD GAME", leftPadding + 6, menuStartY);
      ctx.fillText(isKo ? "2. 새 게임" : "2. NEW GAME", leftPadding + 6, menuStartY + 38);
      ctx.fillText(isKo ? "3. 멀티플레이" : "3. MULTIPLAY", leftPadding + 6, menuStartY + 76);
      ctx.fillText(isKo ? "4. 인벤토리" : "4. INVENTORY", leftPadding + 6, menuStartY + 114);
    } else {
      ctx.fillText(isKo ? "1. 새 게임" : "1. NEW GAME", leftPadding + 6, menuStartY);
      ctx.fillText(isKo ? "2. 멀티플레이" : "2. MULTIPLAY", leftPadding + 6, menuStartY + 38);
      ctx.fillText(isKo ? "3. 인벤토리" : "3. INVENTORY", leftPadding + 6, menuStartY + 76);
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

  return canvas.toBuffer("image/png");
}

export interface MultiplayerScreenOptions {
  username?: string;
  avatarUrl?: string;
  party?: TitleScreenPartyPokemon[];
  lang?: "en" | "ko";
}

/**
 * Renders Multiplayer Screen with Signature Blurple Theme
 */
export async function renderMultiplayerScreen(options?: MultiplayerScreenOptions): Promise<Buffer> {
  const width = 560;
  const height = 380;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.imageSmoothingEnabled = false;
  ctx.textRendering = "optimizeSpeed";

  const isKo = options?.lang === "ko";
  const party = options?.party || [];
  const registeredCount = party.filter(Boolean).length;
  const isComplete = registeredCount >= 1; // At least 1 Pokemon registered

  // 1. Dark Retro Background (Discord Blurple Deep Night)
  ctx.fillStyle = "#111322";
  ctx.fillRect(0, 0, width, height);

  // 2. TOP BANNER: Full-width Header Bar across the entire Left Half (y: 0 ~ 42)
  const splitX = 285;
  ctx.fillStyle = "#181C34";
  ctx.fillRect(0, 0, splitX, 42);

  // Bottom border line under left header (Blurple)
  ctx.strokeStyle = "#5865F2";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 42);
  ctx.lineTo(splitX, 42);
  ctx.stroke();

  // Header Title Centered in Left Half
  ctx.font = "bold 18px DungGeunMo";
  ctx.fillStyle = "#5865F2";
  ctx.textAlign = "center";
  ctx.fillText(isKo ? "멀티플레이 로비" : "MULTIPLAYER LOBBY", splitX / 2, 28);

  // 3. LEFT SIDE: Clean minimal area (Ready for lobby/matchmaking)
  // Left side is kept clear and minimal as requested

  // 4. RIGHT SIDE PANEL: Multiplayer Team (with slot numbers 1~6 and Blurple theme)
  await drawPartyRightPanel(ctx, 295, 18, 244, 344, {
    username: options?.username,
    avatarUrl: options?.avatarUrl,
    party: options?.party,
    lang: options?.lang,
    showSlotNumbers: true,
    borderColor: "#5865F2",
  });

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
 * Renders Trainer Bag UI with Signature Gold Amber & Pocket Theme
 */
export async function renderBagScreen(options?: BagScreenOptions): Promise<Buffer> {
  const width = 560;
  const height = 380;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.imageSmoothingEnabled = false;
  ctx.textRendering = "optimizeSpeed";

  const isKo = options?.lang === "ko";
  const currentTab = options?.tab || "pokemon";

  // 1. Dark Retro Background (Warm Deep Night)
  ctx.fillStyle = "#14121A";
  ctx.fillRect(0, 0, width, height);

  // 2. TOP BANNER: Trainer Bag Header with Vector Bag Icon (y: 0 ~ 42)
  const splitX = 285;
  ctx.fillStyle = "#201B28";
  ctx.fillRect(0, 0, splitX, 42);

  ctx.strokeStyle = "#F4A261";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 42);
  ctx.lineTo(splitX, 42);
  ctx.stroke();

  drawVectorBag(ctx, 22, 21, 14, 14, "#F4A261");

  ctx.font = "bold 18px DungGeunMo";
  ctx.fillStyle = "#F4A261";
  ctx.textAlign = "left";
  ctx.fillText(isKo ? "트레이너 포켓" : "TRAINER POCKET", 40, 27);

  // 4. LEFT SIDE: Menu / Category Box
  const leftX = 18;
  const leftY = 58;
  const leftW = 265;
  const leftH = 304;

  ctx.fillStyle = "#191522";
  ctx.fillRect(leftX, leftY, leftW, leftH);
  ctx.strokeStyle = "#2B2338";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(leftX, leftY, leftW, leftH);

  // Pocket Title
  ctx.fillStyle = "#282034";
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

    ctx.fillStyle = isSelected ? "#2C223A" : "#14111C";
    ctx.beginPath();
    ctx.roundRect(leftX + 10, tabY, leftW - 20, 48, 8);
    ctx.fill();

    if (isSelected) {
      ctx.strokeStyle = "#F4A261";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#231C2E";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.font = isSelected ? "bold 16px DungGeunMo" : "16px DungGeunMo";
    ctx.fillStyle = isSelected ? "#FFFFFF" : "#968CA8";
    ctx.textAlign = "left";
    ctx.fillText((isSelected ? "▶ " : "  ") + t.label, leftX + 18, tabY + 30);
  });

  // 4-1. Bottom Info Box: ONLY HIGHEST WAVE
  const infoBoxY = leftY + 230;
  const infoBoxH = 62;

  ctx.fillStyle = "#14111C";
  ctx.beginPath();
  ctx.roundRect(leftX + 10, infoBoxY, leftW - 20, infoBoxH, 8);
  ctx.fill();

  ctx.strokeStyle = "#F4A261";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  drawVectorStar(ctx, leftX + leftW / 2 - 58, infoBoxY + 20, 5, 6, 3, "#F4A261");
  ctx.font = "14px DungGeunMo";
  ctx.fillStyle = "#968CA8";
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
    borderColor: "#F4A261",
  });

  return canvas.toBuffer("image/png");
}

export interface PokedexScreenOptions {
  selectedPokemon?: DexPokemonInfo | null;
  pageList?: DexPokemonInfo[];
  currentPage?: number;
  totalPages?: number;
  activeAbility?: string;
  lang?: "en" | "ko";
  allowFetchSprites?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  normal: "#929DA3",
  fire: "#E65A28",
  water: "#3873B8",
  grass: "#4A993F",
  electric: "#D69F0A",
  ice: "#4CB0BE",
  fighting: "#CE4069",
  poison: "#9343B0",
  ground: "#BA6828",
  flying: "#768FD4",
  psychic: "#EB4E56",
  bug: "#85B020",
  rock: "#A8945A",
  ghost: "#5269AC",
  dragon: "#096DC4",
  steel: "#5A8EA1",
  fairy: "#DB68D3",
  dark: "#5A5366",
};

const TYPE_NAMES_KO: Record<string, string> = {
  normal: "노말",
  fire: "불꽃",
  water: "물",
  grass: "풀",
  electric: "전기",
  ice: "얼음",
  fighting: "격투",
  poison: "독",
  ground: "땅",
  flying: "비행",
  psychic: "에스퍼",
  bug: "벌레",
  rock: "바위",
  ghost: "고스트",
  dragon: "드래곤",
  steel: "강철",
  fairy: "페어리",
  dark: "악",
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
  ctx.textRendering = "optimizeSpeed";

  const isKo = options?.lang === "ko";
  const items = options?.pageList || [];
  const selected = options?.selectedPokemon || items[0] || null;
  const curPage = options?.currentPage || 1;
  const totPages = options?.totalPages || 129;
  const allowFetch = options?.allowFetchSprites !== false;

  // 0. PRELOAD ALL ASSETS IN PARALLEL (Instant Multi-Threaded Loading)
  const [sprites, bigSprite, speciesInfo] = await Promise.all([
    Promise.all(items.map((p) => (p ? getPokemonSprite(p.speciesId, allowFetch) : Promise.resolve(null)))),
    selected ? getPokemonSprite(selected.speciesId, allowFetch) : Promise.resolve(null),
    selected ? getPokemonSpeciesInfo(selected.dexNumber) : Promise.resolve({ genusKo: "포켓몬", genusEn: "Pokémon", flavorTextKo: "", flavorTextEn: "" }),
  ]);

  // 1. Dark Retro Background (Refined Dark Midnight)
  ctx.fillStyle = "#13151F";
  ctx.fillRect(0, 0, width, height);

  // 2. TOP BANNER: Full-width Header Bar across the entire Left Half (y: 0 ~ 42)
  const splitX = 262;
  ctx.fillStyle = "#1A1D2A";
  ctx.fillRect(0, 0, splitX, 42);

  // Bottom border line under left header
  ctx.strokeStyle = "#2D3246";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 42);
  ctx.lineTo(splitX, 42);
  ctx.stroke();

  ctx.font = "bold 18px DungGeunMo";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.fillText(isKo ? "포켓몬 도감" : "POKÉDEX", splitX / 2 - 10, 29);

  // Page Indicator Badge on Left Header
  ctx.font = "12px DungGeunMo";
  ctx.fillStyle = "#8E96AB";
  ctx.textAlign = "right";
  ctx.fillText(`P.${curPage}/${totPages}`, splitX - 10, 28);

  // 3. LEFT SIDE: 8 Pokémon Grid (2 Columns x 4 Rows, y: 48 ~ 370)
  const startListY = 48;
  const slotW = 118;
  const slotH = 76;
  const gapX = 6;
  const gapY = 6;

  for (let i = 0; i < 8; i++) {
    const p = items[i];
    // Row-major order: Row 0 (1, 2), Row 1 (3, 4), Row 2 (5, 6), Row 3 (7, 8)
    const row = Math.floor(i / 2);
    const col = i % 2;
    const sx = 10 + col * (slotW + gapX);
    const sy = startListY + row * (slotH + gapY);
    const isSelected = selected && p && selected.dexNumber === p.dexNumber;

    // Slot Box Background (Refined Dark Midnight Slate)
    ctx.fillStyle = isSelected ? "#222738" : "#181B26";
    ctx.beginPath();
    ctx.roundRect(sx, sy, slotW, slotH, 6);
    ctx.fill();

    ctx.strokeStyle = isSelected ? "#FFFFFF" : "#282D3D";
    ctx.lineWidth = isSelected ? 1.5 : 1;
    ctx.stroke();

    if (p) {
      const displayName = (isKo && p.koreanName) ? p.koreanName : p.name;
      const dexTag = `#${String(p.dexNumber).padStart(3, "0")}`;

      // Left Header: Slot Number + Pokemon Name (13px Bold)
      ctx.font = "bold 13px DungGeunMo";
      ctx.fillStyle = isSelected ? "#FFFFFF" : "#E2E8F0";
      ctx.textAlign = "left";
      ctx.fillText(`${i + 1}. ${displayName.slice(0, 5)}`, sx + 6, sy + 16);

      // Right Header: Dex Number (#001) Right-aligned (12px Bold)
      ctx.font = "bold 12px DungGeunMo";
      ctx.fillStyle = isSelected ? "#FFFFFF" : "#7E869B";
      ctx.textAlign = "right";
      ctx.fillText(dexTag, sx + slotW - 6, sy + 16);

      // Mini Sprite (Centered in left half area: 50x48)
      const sprite = sprites[i];
      const sprAreaW = 50;
      const sprAreaH = 48;
      const sprAreaX = sx + 6;
      const sprAreaY = sy + 22;

      if (sprite) {
        const scale = 0.64;
        const sprW = sprite.width * scale;
        const sprH = sprite.height * scale;
        ctx.drawImage(
          sprite,
          sprAreaX + (sprAreaW - sprW) / 2,
          sprAreaY + (sprAreaH - sprH) / 2,
          sprW,
          sprH
        );
      } else {
        // Pixel Loading Placeholder
        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sprAreaX + sprAreaW / 2, sprAreaY + sprAreaH / 2, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(sprAreaX + sprAreaW / 2 - 10, sprAreaY + sprAreaH / 2);
        ctx.lineTo(sprAreaX + sprAreaW / 2 + 10, sprAreaY + sprAreaH / 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(sprAreaX + sprAreaW / 2, sprAreaY + sprAreaH / 2, 3.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Mini Type Badges (44x20 on the right side of slot, vertically balanced)
      const typeCount = Math.min(2, p.types.length);
      const badgeW = 44;
      const badgeH = 20;
      const badgeX = sx + slotW - badgeW - 6;

      for (let tIdx = 0; tIdx < typeCount; tIdx++) {
        const tName = p.types[tIdx];
        const tLower = tName.toLowerCase();
        const tColor = TYPE_COLORS[tLower] || "#777777";
        const tDisplay = isKo ? (TYPE_NAMES_KO[tLower] || tName) : tName.slice(0, 4).toUpperCase();
        
        // Single type: centered at y=34 | Dual types: y=22, y=45
        const bY = typeCount === 1 ? sy + 34 : sy + 22 + tIdx * 23;

        ctx.fillStyle = tColor;
        ctx.beginPath();
        ctx.roundRect(badgeX, bY, badgeW, badgeH, 3);
        ctx.fill();

        ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
        ctx.shadowOffsetY = 1;
        ctx.shadowBlur = 1;
        ctx.font = isKo ? "bold 12px DungGeunMo" : "bold 10px DungGeunMo";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.fillText(tDisplay, badgeX + badgeW / 2, bY + 14);
        ctx.restore();
      }
    } else {
      ctx.font = "12px DungGeunMo";
      ctx.fillStyle = "#4B5268";
      ctx.textAlign = "center";
      ctx.fillText("---", sx + slotW / 2, sy + slotH / 2 + 4);
    }
  }

  // 4. VERTICAL SPLIT DIVIDER LINE (100% Full Height)
  ctx.strokeStyle = "#2D3246";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(splitX, 0);
  ctx.lineTo(splitX, height);
  ctx.stroke();

  // 5. RIGHT SIDE: Selected Pokémon Detailed Stats & Showcase
  const rightX = 274;
  const rightW = width - rightX - 10;

  if (selected) {
    // 5-1. TOP MAIN INFO CARD (Sprite Box + Dex Number & Name & Genus + Types) (y: 10 ~ 98)
    const topCardY = 10;
    const topCardH = 88;

    ctx.fillStyle = "#181B26";
    ctx.beginPath();
    ctx.roundRect(rightX, topCardY, rightW, topCardH, 6);
    ctx.fill();
    ctx.strokeStyle = "#282D3D";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Sprite Showcase Box (Compact 72x72)
    const showBoxX = rightX + 8;
    const showBoxSize = 72;
    const showBoxY = topCardY + 8;

    ctx.fillStyle = "#12141C";
    ctx.beginPath();
    ctx.roundRect(showBoxX, showBoxY, showBoxSize, showBoxSize, 6);
    ctx.fill();
    ctx.strokeStyle = "#2D3246";
    ctx.lineWidth = 1;
    ctx.stroke();

    if (bigSprite) {
      const scale = 1.35;
      const sprW = bigSprite.width * scale;
      const sprH = bigSprite.height * scale;
      ctx.drawImage(bigSprite, showBoxX + (showBoxSize - sprW) / 2, showBoxY + (showBoxSize - sprH) / 2, sprW, sprH);
    } else {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(showBoxX + showBoxSize / 2, showBoxY + showBoxSize / 2, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(showBoxX + showBoxSize / 2 - 18, showBoxY + showBoxSize / 2);
      ctx.lineTo(showBoxX + showBoxSize / 2 + 18, showBoxY + showBoxSize / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(showBoxX + showBoxSize / 2, showBoxY + showBoxSize / 2, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Info Column next to Sprite (Dex Number + Name + Genus + Types)
    const infoX = showBoxX + showBoxSize + 12;
    const titleName = (isKo && selected.koreanName) ? selected.koreanName : selected.name;
    const dexTag = `#${String(selected.dexNumber).padStart(3, "0")}`;

    const genusText = isKo ? speciesInfo.genusKo : speciesInfo.genusEn;

    // 1. Top Row: #001 (Dex Tag in Slate) + Pokémon Name (Bold White 18px) + Genus
    ctx.font = "bold 13px DungGeunMo";
    ctx.fillStyle = "#8E96AB";
    ctx.textAlign = "left";
    ctx.fillText(dexTag, infoX, topCardY + 28);

    const tagWidth = ctx.measureText(dexTag).width;
    ctx.font = "bold 18px DungGeunMo";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(titleName, infoX + tagWidth + 6, topCardY + 28);

    if (genusText) {
      const nameWidth = ctx.measureText(titleName).width;
      ctx.font = "12px DungGeunMo";
      ctx.fillStyle = "#8E96AB";
      ctx.fillText(`(${genusText})`, infoX + tagWidth + 6 + nameWidth + 6, topCardY + 28);
    }

    // 2. Bottom Row: Type Badges (46x24 badges)
    let typeBadgeX = infoX;
    const badgeW = isKo ? 46 : 52;
    const badgeH = 24;
    const typeBadgeY = topCardY + 48;

    for (const tName of selected.types) {
      const tLower = tName.toLowerCase();
      const tColor = TYPE_COLORS[tLower] || "#777777";
      const tDisplay = isKo ? (TYPE_NAMES_KO[tLower] || tName) : tName.toUpperCase();

      ctx.fillStyle = tColor;
      ctx.beginPath();
      ctx.roundRect(typeBadgeX, typeBadgeY, badgeW, badgeH, 4);
      ctx.fill();

      ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
      ctx.shadowOffsetY = 1;
      ctx.shadowBlur = 1;
      ctx.font = isKo ? "bold 13px DungGeunMo" : "bold 11px DungGeunMo";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.fillText(tDisplay, typeBadgeX + badgeW / 2, typeBadgeY + 16);
      ctx.restore();

      typeBadgeX += badgeW + 8;
    }

    // 5-2. BASE STATS 2-COLUMN X 3-ROW GRID (HP/SPE, ATK/SPA, DEF/SPD, y: 104 ~ 222)
    const statsCardY = 104;
    const statsCardH = 118;

    ctx.fillStyle = "#181B26";
    ctx.beginPath();
    ctx.roundRect(rightX, statsCardY, rightW, statsCardH, 6);
    ctx.fill();
    ctx.strokeStyle = "#282D3D";
    ctx.lineWidth = 1;
    ctx.stroke();

    const statsGrid = [
      // Row 0: HP / SPE
      { label: "HP", val: selected.hp, color: "#57F287", col: 0, row: 0 },
      { label: isKo ? "스핏" : "SPE", val: selected.speed, color: "#F8D030", col: 1, row: 0 },
      // Row 1: ATK / SPA
      { label: isKo ? "공격" : "ATK", val: selected.attack, color: "#F08030", col: 0, row: 1 },
      { label: isKo ? "특공" : "SPA", val: selected.spAttack, color: "#C03028", col: 1, row: 1 },
      // Row 2: DEF / SPD
      { label: isKo ? "방어" : "DEF", val: selected.defense, color: "#6890F0", col: 0, row: 2 },
      { label: isKo ? "특방" : "SPD", val: selected.spDefense, color: "#F85888", col: 1, row: 2 },
    ];

    const barW = 60;
    const barH = 12;
    for (const st of statsGrid) {
      const colX = st.col === 0 ? rightX + 12 : rightX + 144;
      const rowY = statsCardY + 12 + st.row * 33;

      // Label (HP, ATK, DEF, SPE, SPA, SPD) - Clean Slate
      ctx.font = "bold 14px DungGeunMo";
      ctx.fillStyle = "#8E96AB";
      ctx.textAlign = "left";
      ctx.fillText(st.label, colX, rowY + 14);

      // Value - Colorful Stat Color
      ctx.font = "bold 15px DungGeunMo";
      ctx.textAlign = "right";
      ctx.fillStyle = st.color;
      ctx.fillText(String(st.val), colX + 54, rowY + 14);

      // Bar Background
      const gaugeX = colX + 60;
      ctx.fillStyle = "#12141C";
      ctx.beginPath();
      ctx.roundRect(gaugeX, rowY + 2, barW, barH, 3);
      ctx.fill();

      // Bar Fill - Colorful Stat Color
      const fillW = Math.min(barW, Math.max(3, (st.val / 180) * barW));
      ctx.fillStyle = st.color;
      ctx.beginPath();
      ctx.roundRect(gaugeX, rowY + 2, fillW, barH, 3);
      ctx.fill();
    }

    // 5-3. BOTTOM FLAVOR TEXT CARD (y: 228 ~ 370, matching bottom of left list)
    const flavorCardY = 228;
    const flavorCardH = 142;

    ctx.fillStyle = "#181B26";
    ctx.beginPath();
    ctx.roundRect(rightX, flavorCardY, rightW, flavorCardH, 6);
    ctx.fill();
    ctx.strokeStyle = "#282D3D";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Flavor Header: 포켓몬 도감 설명
    ctx.font = "bold 13px DungGeunMo";
    ctx.fillStyle = "#CBD5E1";
    ctx.textAlign = "left";
    ctx.fillText(isKo ? "포켓몬 도감 설명" : "POKÉDEX ENTRY", rightX + 10, flavorCardY + 18);

    // Sub-divider line under flavor header
    ctx.strokeStyle = "#282D3D";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rightX + 8, flavorCardY + 26);
    ctx.lineTo(rightX + rightW - 8, flavorCardY + 26);
    ctx.stroke();

    // Flavor Text (Official Pokémon Flavor Text Description)
    const flavorText = (isKo ? speciesInfo.flavorTextKo : speciesInfo.flavorTextEn) ||
      (isKo ? "포켓몬 도감에 등록된 포켓몬입니다." : "A Pokémon registered in the Pokédex.");

    ctx.font = "13px DungGeunMo";
    ctx.fillStyle = "#F1F5F9";
    ctx.textAlign = "left";

    const maxTextW = rightW - 20;
    const words = flavorText.split(" ");
    let line = "";
    let lineY = flavorCardY + 46;
    const lineHeight = 21;
    let linesDrawn = 0;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + (line ? " " : "") + words[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTextW && n > 0) {
        ctx.fillText(line, rightX + 10, lineY);
        line = words[n];
        lineY += lineHeight;
        linesDrawn++;
        if (linesDrawn >= 4) break;
      } else {
        line = testLine;
      }
    }
    if (line && linesDrawn < 4) {
      ctx.fillText(line, rightX + 10, lineY);
    }
  }

  // 6. FLOATING OVERLAY RPG DIALOG WINDOW (Only appears when activeAbility is selected)
  if (selected && options?.activeAbility) {
    const targetAbility = options.activeAbility;
    const isHa = selected.hiddenAbility && targetAbility.toLowerCase() === selected.hiddenAbility.toLowerCase();

    const abDetail = await getAbilityDetail(targetAbility);
    const abName = isKo ? abDetail.nameKo : abDetail.name;
    const abDesc = isKo ? abDetail.descriptionKo : abDetail.descriptionEn;
    const typeTag = isHa ? (isKo ? "[숨특]" : "[HA]") : (isKo ? "[특성]" : "[Ability]");

    const overlayX = 12;
    const overlayY = 224;
    const overlayW = width - 24;
    const overlayH = 144;

    // Outer Shadow to create true floating pop-up window depth
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.92)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 4;

    // Window Solid Background
    ctx.fillStyle = "#12141D";
    ctx.beginPath();
    ctx.roundRect(overlayX, overlayY, overlayW, overlayH, 8);
    ctx.fill();
    ctx.restore();

    // Window Double Border Frame (Soft Off-White Silver Retro Style)
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(overlayX, overlayY, overlayW, overlayH, 8);
    ctx.stroke();

    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(overlayX + 3, overlayY + 3, overlayW - 6, overlayH - 6, 6);
    ctx.stroke();

    // Dialog Window Header Bar (y: overlayY ~ overlayY + 30)
    ctx.fillStyle = "#1E2438";
    ctx.beginPath();
    ctx.roundRect(overlayX + 4, overlayY + 4, overlayW - 8, 28, [5, 5, 0, 0]);
    ctx.fill();

    // Header Title: [특성] 심록 (Soft Off-White)
    ctx.font = "bold 14px DungGeunMo";
    ctx.fillStyle = "#F1F5F9";
    ctx.textAlign = "left";
    ctx.fillText(`${typeTag} ${abName}`, overlayX + 14, overlayY + 23);

    // Horizontal divider line under dialog header
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(overlayX + 4, overlayY + 32);
    ctx.lineTo(overlayX + overlayW - 4, overlayY + 32);
    ctx.stroke();

    // Effect Description Text (Wrapped nicely across 500px wide box)
    ctx.font = "13px DungGeunMo";
    ctx.fillStyle = "#F8FAFC";
    ctx.textAlign = "left";

    const maxTextW = overlayW - 28;
    const words = abDesc.split(" ");
    let line = "";
    let lineY = overlayY + 54;
    const lineHeight = 21;
    let linesDrawn = 0;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + (line ? " " : "") + words[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTextW && n > 0) {
        ctx.fillText(line, overlayX + 16, lineY);
        line = words[n];
        lineY += lineHeight;
        linesDrawn++;
        if (linesDrawn >= 4) break;
      } else {
        line = testLine;
      }
    }
    if (line && linesDrawn < 4) {
      ctx.fillText(line, overlayX + 16, lineY);
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

export interface StarterSelectPartyItem {
  dexNumber: number;
  speciesId: string;
  name: string;
  cost: number;
  isShiny?: boolean;
  shinyTier?: number;
  useHiddenAbility?: boolean;
  usePassive?: boolean;
}

export type PartyViewTab = "moves" | "shiny";

export interface StarterSelectScreenOptions {
  selectedStarter: StarterEntry;
  currentGen: number;
  currentPage?: number;
  totalPages?: number;
  startersList: StarterEntry[];
  selectedParty: StarterSelectPartyItem[];
  userStarters?: Map<string, any>;
  isShinyFilter?: boolean;
  isHaFilter?: boolean;
  isPassiveFilter?: boolean;
  maxCost?: number;
  lang?: "en" | "ko";
  isPartyView?: boolean;
  selectedPartyIdx?: number;
  partyTab?: PartyViewTab;
  selectedMoveIdx?: number;
}

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
    ctx.strokeStyle = "#2D3246";
    ctx.lineWidth = 1;
    ctx.stroke();

    if (selectedSprite) {
      const scale = 1.3;
      const sprW = selectedSprite.width * scale;
      const sprH = selectedSprite.height * scale;
      ctx.drawImage(selectedSprite, showBoxX + (showBoxSize - sprW) / 2, showBoxY + (showBoxSize - sprH) / 2, sprW, sprH);
    }

    // Shiny Tier Vector Sparkle Star on Bottom-Left Corner of Sprite Box
    if (selShinyTier > 0) {
      drawShinyTierSparkles(ctx, showBoxX + 4, showBoxY + showBoxSize - 14, selShinyTier, 7.5);
    }

    // Name + Dex next to sprite (Enlarged, True Middle Baseline)
    const infoX = showBoxX + showBoxSize + 10;
    const headerY = showBoxY + 12;
    const dexTag = `#${String(sel.dexNumber).padStart(3, "0")}`;

    ctx.textBaseline = "middle";
    ctx.font = "bold 14px DungGeunMo";
    ctx.fillStyle = "#8E96AB";
    ctx.textAlign = "left";
    ctx.fillText(dexTag, infoX, headerY);

    const tagW = ctx.measureText(dexTag).width;
    const nameX = infoX + tagW + 6;

    ctx.font = "bold 19px DungGeunMo";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(isKo ? sel.nameKo : sel.name, nameX, headerY);

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
    ctx.fillStyle = selHasHa ? "#F87171" : "#60A5FA";
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
      // (In Party View, this middle area is left completely blank!)
      // =========================================================================
      const moveChipW = (panelW - 10) / 2;
      const moveChipH = 36;
      for (let mIdx = 0; mIdx < 4; mIdx++) {
        const rawMove = sel.starterMoves[mIdx] || "---";
        const moveKey = rawMove.toLowerCase().replace(/[\s_]+/g, "-");
        const moveInfo = MOVES_DATA[moveKey];
        const mDisplay = isKo ? (moveInfo?.nameKo || rawMove) : rawMove;
        const category = moveInfo?.category;

        const mCol = mIdx % 2;
        const mRow = Math.floor(mIdx / 2);
        const mX = panelX + mCol * (moveChipW + 10);
        const mY = 90 + mRow * (moveChipH + 6);

        ctx.fillStyle = "#181B26";
        ctx.beginPath();
        ctx.roundRect(mX, mY, moveChipW, moveChipH, 5);
        ctx.fill();
        ctx.strokeStyle = "#282D3D";
        ctx.lineWidth = 1;
        ctx.stroke();

        if (rawMove === "---" || !category) {
          ctx.textBaseline = "middle";
          ctx.font = "bold 15px DungGeunMo";
          ctx.fillStyle = "#475569";
          ctx.textAlign = "center";
          ctx.fillText(mDisplay, mX + moveChipW / 2, mY + moveChipH / 2);
        } else {
          // Draw Move Category Icon (Left aligned, 23x22)
          const iconX = mX + 6;
          const iconY = mY + (moveChipH - 22) / 2;
          drawMoveCategoryIcon(ctx, iconX, iconY, category);

          // Move Name Text (Aligned next to category icon, 15px)
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

    ctx.strokeStyle = isInspected ? "#5865F2" : (member ? "#384260" : "#282D3D");
    ctx.lineWidth = isInspected ? 2 : 1;
    ctx.stroke();

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
}

function drawWrappedText(ctx: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  let curY = y;

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
}

function renderPartyCustomizationPanel(ctx: any, args: PartyCustomizationPanelArgs) {
  const { panelX, panelW, sel, partyMember, selProgress, isKo } = args;
  const currentTab: PartyViewTab = args.tab || "moves";
  const selectedMoveIdx = args.selectedMoveIdx || 0;

  const unlockedMaxShinyTier = selProgress?.shinyTier || 0;
  const currentShinyTier = partyMember?.shinyTier !== undefined ? partyMember.shinyTier : (partyMember?.isShiny ? Math.max(1, unlockedMaxShinyTier) : 0);
  const hasHaUnlocked = selProgress?.hasHiddenAbility || false;
  const useHa = partyMember?.useHiddenAbility || false;
  const hasPassiveUnlocked = selProgress?.passiveUnlocked || false;
  const usePassive = partyMember?.usePassive || false;
  const candies = selProgress?.candies || 0;

  // Panel Background
  ctx.fillStyle = "#151824";
  ctx.beginPath();
  ctx.roundRect(panelX, 10, panelW, 360, 6);
  ctx.fill();
  ctx.strokeStyle = "#2B3144";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Top Tab Bar (y: 10 ~ 38) - 2 Tabs: [ ⚔️ 기술 ] & [ ✨ 이로치 ]
  const tabW = 82;
  const tabH = 26;
  const tabY = 11;
  const tabs: { id: PartyViewTab; labelKo: string; labelEn: string }[] = [
    { id: "moves", labelKo: "⚔️ 기술", labelEn: "⚔️ Moves" },
    { id: "shiny", labelKo: "✨ 이로치", labelEn: "✨ Shiny" },
  ];

  tabs.forEach((t, idx) => {
    const tX = panelX + 8 + idx * (tabW + 6);
    const isAct = currentTab === t.id;

    ctx.fillStyle = isAct ? "#242E46" : "#131620";
    ctx.beginPath();
    ctx.roundRect(tX, tabY, tabW, tabH, 4);
    ctx.fill();

    ctx.strokeStyle = isAct ? "#60A5FA" : "#242938";
    ctx.lineWidth = isAct ? 1.5 : 1;
    ctx.stroke();

    ctx.textBaseline = "middle";
    ctx.font = "bold 13px DungGeunMo";
    ctx.fillStyle = isAct ? "#60A5FA" : "#64748B";
    ctx.textAlign = "center";
    ctx.fillText(isKo ? t.labelKo : t.labelEn, tX + tabW / 2, tabY + tabH / 2);
  });

  // Candy Counter on Top Right (y: 24, Clean Gap)
  const candyText = `${candies}`;
  ctx.font = "bold 14px DungGeunMo";
  const cTextW = ctx.measureText(candyText).width;
  const rightMargin = panelX + panelW - 10;

  // Candy Count Text (Right Aligned)
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#FCD34D";
  ctx.textAlign = "right";
  ctx.fillText(candyText, rightMargin, 24);

  // Candy Vector Icon (Tilted, striped, frilled wrapper) with clean gap
  drawCandyIcon(ctx, rightMargin - cTextW - 16, 24, 6.0, "#F59E0B", "#FEF08A");

  // If No Party Member is inspected (selectedPartyIdx === -1)
  if (!sel || !partyMember) {
    ctx.textBaseline = "middle";
    ctx.font = "bold 17px DungGeunMo";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText(isKo ? "🔍 파티원을 선택하세요" : "🔍 Select a Party Member", panelX + panelW / 2, 130);

    ctx.font = "bold 13px DungGeunMo";
    ctx.fillStyle = "#94A3B8";
    ctx.fillText(isKo ? "위 파티원 버튼(1~6번)을 선택하면" : "Select a party member (1~6)", panelX + panelW / 2, 175);
    ctx.fillText(isKo ? "기술 상세 스펙과 이로치 외형을" : "to view detailed move descriptions", panelX + panelW / 2, 200);
    ctx.fillText(isKo ? "자세히 확인하고 관리할 수 있습니다." : "and customize shiny forms.", panelX + panelW / 2, 225);

    // Subtle decoration box
    ctx.fillStyle = "#10121A";
    ctx.beginPath();
    ctx.roundRect(panelX + 16, 265, panelW - 32, 68, 5);
    ctx.fill();
    ctx.strokeStyle = "#252B3C";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = "bold 12px DungGeunMo";
    ctx.fillStyle = "#60A5FA";
    ctx.fillText(isKo ? "💡 TIP: [START] 버튼을 누르면" : "💡 TIP: Press [START] button", panelX + panelW / 2, 290);
    ctx.fillText(isKo ? "현재 파티로 바로 모험을 시작합니다!" : "to launch your adventure!", panelX + panelW / 2, 312);

    return;
  }

  // =========================================================================
  // TAB 1 (DEFAULT): MOVES TAB (Detailed Move Inspector + Ability/Passive Footer)
  // =========================================================================
  if (currentTab === "moves") {
    // 1. Move Selection Chips (2x2 Grid, y: 44 ~ 116)
    const moveChipW = (panelW - 24 - 6) / 2;
    const moveChipH = 32;

    for (let m = 0; m < 4; m++) {
      const rawMove = sel.starterMoves[m] || "---";
      const moveKey = rawMove.toLowerCase().replace(/[\s_]+/g, "-");
      const moveInfo = MOVES_DATA[moveKey];
      const mDisplay = isKo ? (moveInfo?.nameKo || rawMove) : rawMove;
      const category = moveInfo?.category;

      const mCol = m % 2;
      const mRow = Math.floor(m / 2);
      const mX = panelX + 12 + mCol * (moveChipW + 6);
      const mY = 44 + mRow * (moveChipH + 6);
      const isSel = selectedMoveIdx === m;

      ctx.fillStyle = isSel ? "#202A42" : "#12141C";
      ctx.beginPath();
      ctx.roundRect(mX, mY, moveChipW, moveChipH, 4);
      ctx.fill();

      ctx.strokeStyle = isSel ? "#60A5FA" : "#282D3D";
      ctx.lineWidth = isSel ? 1.5 : 1;
      ctx.stroke();

      if (rawMove === "---" || !category) {
        ctx.textBaseline = "middle";
        ctx.font = "bold 13px DungGeunMo";
        ctx.fillStyle = "#475569";
        ctx.textAlign = "center";
        ctx.fillText("---", mX + moveChipW / 2, mY + moveChipH / 2);
      } else {
        const iconX = mX + 5;
        const iconY = mY + (moveChipH - 20) / 2;
        drawMoveCategoryIcon(ctx, iconX, iconY, category);

        ctx.textBaseline = "middle";
        ctx.font = "bold 13px DungGeunMo";
        ctx.fillStyle = isSel ? "#FFFFFF" : "#CBD5E1";
        ctx.textAlign = "left";
        ctx.fillText(mDisplay, mX + 32, mY + moveChipH / 2);
      }
    }

    // 2. Selected Move Detailed Spec Card (y: 122 ~ 304, Height: 182)
    const cardY = 122;
    const cardH = 182;
    const cardW = panelW - 24;
    const cardX = panelX + 12;

    ctx.fillStyle = "#10121A";
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 5);
    ctx.fill();
    ctx.strokeStyle = "#282D3D";
    ctx.lineWidth = 1;
    ctx.stroke();

    const curRawMove = sel.starterMoves[selectedMoveIdx] || "---";
    const curMoveKey = curRawMove.toLowerCase().replace(/[\s_]+/g, "-");
    const curMoveInfo = MOVES_DATA[curMoveKey];

    if (curRawMove !== "---" && curMoveInfo) {
      // Header: Move Name + Category Badge + Type Badge
      const cat = curMoveInfo.category;
      drawMoveCategoryIcon(ctx, cardX + 10, cardY + 10, cat);

      ctx.textBaseline = "middle";
      ctx.font = "bold 17px DungGeunMo";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "left";
      const moveTitle = isKo ? curMoveInfo.nameKo : curMoveInfo.name.toUpperCase();
      ctx.fillText(moveTitle, cardX + 38, cardY + 20);
      const titleWidth = ctx.measureText(moveTitle).width;

      // Type Badge
      const tLower = curMoveInfo.type.toLowerCase();
      const tColor = TYPE_COLORS[tLower] || "#777777";
      const tDisplay = isKo ? (TYPE_NAMES_KO[tLower] || curMoveInfo.type) : curMoveInfo.type.toUpperCase();
      const tBadgeW = 38;
      const tBadgeH = 17;
      const tBadgeX = cardX + 42 + titleWidth;
      const tBadgeY = cardY + 12;

      ctx.fillStyle = tColor;
      ctx.beginPath();
      ctx.roundRect(tBadgeX, tBadgeY, tBadgeW, tBadgeH, 3);
      ctx.fill();

      ctx.font = "bold 11px DungGeunMo";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.fillText(tDisplay, tBadgeX + tBadgeW / 2, tBadgeY + tBadgeH / 2);

      // Spec Pills Row (Power, Accuracy, PP)
      const specY = cardY + 42;
      const specPillW = (cardW - 20 - 10) / 3;
      const specPillH = 32;

      const specs = [
        { label: isKo ? "위력" : "Power", val: curMoveInfo.power ? String(curMoveInfo.power) : "-", col: "#F87171" },
        { label: isKo ? "명중" : "Acc", val: curMoveInfo.accuracy ? `${curMoveInfo.accuracy}%` : "-", col: "#60A5FA" },
        { label: "PP", val: `${curMoveInfo.pp || 35}`, col: "#34D399" },
      ];

      specs.forEach((sp, idx) => {
        const sX = cardX + 10 + idx * (specPillW + 5);
        ctx.fillStyle = "#161922";
        ctx.beginPath();
        ctx.roundRect(sX, specY, specPillW, specPillH, 4);
        ctx.fill();
        ctx.strokeStyle = "#242938";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.textBaseline = "middle";
        ctx.font = "bold 10px DungGeunMo";
        ctx.fillStyle = "#64748B";
        ctx.textAlign = "center";
        ctx.fillText(sp.label, sX + specPillW / 2, specY + 9);

        ctx.font = "bold 14px DungGeunMo";
        ctx.fillStyle = sp.col;
        ctx.fillText(sp.val, sX + specPillW / 2, specY + 22);
      });

      // Description Box
      const descBoxY = cardY + 80;
      const descBoxH = 92;
      ctx.fillStyle = "#141720";
      ctx.beginPath();
      ctx.roundRect(cardX + 10, descBoxY, cardW - 20, descBoxH, 4);
      ctx.fill();
      ctx.strokeStyle = "#202534";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.textBaseline = "top";
      ctx.font = "bold 12px DungGeunMo";
      ctx.fillStyle = "#E2E8F0";
      ctx.textAlign = "left";
      const desc = curMoveInfo.description || (isKo ? "효과 설명이 없습니다." : "No description available.");
      drawWrappedText(ctx, desc, cardX + 16, descBoxY + 10, cardW - 32, 18);
    } else {
      ctx.textBaseline = "middle";
      ctx.font = "bold 14px DungGeunMo";
      ctx.fillStyle = "#64748B";
      ctx.textAlign = "center";
      ctx.fillText(isKo ? "등록된 기술이 없습니다." : "No move registered in this slot.", cardX + cardW / 2, cardY + cardH / 2);
    }

    // 3. Ability & Passive Compact Summary Footer (y: 310 ~ 362, Height: 52)
    const footY = 310;
    const footH = 52;
    const footW = panelW - 24;
    const footX = panelX + 12;

    ctx.fillStyle = "#10121A";
    ctx.beginPath();
    ctx.roundRect(footX, footY, footW, footH, 5);
    ctx.fill();
    ctx.strokeStyle = "#242938";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Ability Row (y: footY + 14)
    ctx.textBaseline = "middle";
    ctx.font = "bold 12px DungGeunMo";
    ctx.fillStyle = "#94A3B8";
    ctx.textAlign = "left";
    ctx.fillText(isKo ? "특성:" : "Ability:", footX + 8, footY + 14);

    const abName = useHa
      ? (isKo ? `[숨특] ${sel.hiddenAbilityKo}` : `[HA] ${sel.hiddenAbility}`)
      : (isKo ? sel.abilityKo : sel.ability);
    ctx.fillStyle = useHa ? "#F87171" : "#60A5FA";
    ctx.fillText(abName, footX + 44, footY + 14);

    // Passive Row (y: footY + 36)
    ctx.fillStyle = "#94A3B8";
    ctx.fillText(isKo ? "패시브:" : "Passive:", footX + 8, footY + 36);

    let passText = "";
    if (hasPassiveUnlocked) {
      const pName = isKo ? sel.passiveAbilityKo : sel.passiveAbility;
      passText = `${pName} (${usePassive ? "ON / -1C 할인" : "OFF"})`;
      ctx.fillStyle = usePassive ? "#34D399" : "#64748B";
    } else {
      passText = isKo ? `미해금 (${sel.passiveAbilityKo})` : `Locked (${sel.passiveAbility})`;
      ctx.fillStyle = "#475569";
    }
    ctx.fillText(passText, footX + 54, footY + 36);

    return;
  }

  // =========================================================================
  // TAB 2: SHINY TAB (Shiny Form & Luck Management)
  // =========================================================================
  if (currentTab === "shiny") {
    const tierColors = ["#64748B", "#F59E0B", "#3B82F6", "#EF4444"];
    const tierNames = ["T0 일반 폼", "T1 노랑 이로치", "T2 파랑 이로치", "T3 빨강 이로치"];
    const tierLucks = ["행운 +0 (기본)", "행운 +1 (+1 Luck)", "행운 +2 (+2 Luck)", "행운 +3 (최대 행운)"];

    const cardH = 68;
    const startCardY = 46;

    for (let t = 0; t <= 3; t++) {
      const cY = startCardY + t * (cardH + 8);
      const cW = panelW - 24;
      const cX = panelX + 12;
      const isUnlocked = t === 0 || t <= unlockedMaxShinyTier;
      const isCurrent = currentShinyTier === t;

      ctx.fillStyle = isCurrent ? "#1E273C" : (isUnlocked ? "#12141C" : "#0D0F15");
      ctx.beginPath();
      ctx.roundRect(cX, cY, cW, cardH, 5);
      ctx.fill();

      ctx.strokeStyle = isCurrent ? tierColors[t] : (isUnlocked ? "#282D3D" : "#1A1D27");
      ctx.lineWidth = isCurrent ? 2 : 1;
      ctx.stroke();

      // Tier Badge (Left)
      const bW = 68;
      const bH = 22;
      const bX = cX + 10;
      const bY = cY + 12;

      ctx.fillStyle = isUnlocked ? tierColors[t] : "#334155";
      ctx.beginPath();
      ctx.roundRect(bX, bY, bW, bH, 3);
      ctx.fill();

      ctx.textBaseline = "middle";
      ctx.font = "bold 12px DungGeunMo";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.fillText(`TIER ${t}`, bX + bW / 2, bY + bH / 2);

      // Star Sparkles
      if (t > 0 && isUnlocked) {
        drawShinyTierSparkles(ctx, bX + bW + 8, bY + bH / 2, t, 5);
      }

      // Title & Luck Info
      ctx.font = "bold 14px DungGeunMo";
      ctx.fillStyle = isCurrent ? "#FFFFFF" : (isUnlocked ? "#CBD5E1" : "#475569");
      ctx.textAlign = "left";
      ctx.fillText(tierNames[t], cX + 10, cY + 48);

      ctx.font = "bold 12px DungGeunMo";
      ctx.fillStyle = isUnlocked ? tierColors[t] : "#475569";
      ctx.textAlign = "right";
      ctx.fillText(tierLucks[t], cX + cW - 10, cY + 23);

      // State Tag (Right Bottom)
      if (isCurrent) {
        ctx.fillStyle = "#22C55E";
        ctx.font = "bold 13px DungGeunMo";
        ctx.textAlign = "right";
        ctx.fillText(isKo ? "✓ 적용 중" : "✓ Active", cX + cW - 10, cY + 48);
      } else if (!isUnlocked) {
        drawLockIcon(ctx, cX + cW - 20, cY + 48, 9, 10, "#475569");
      } else {
        ctx.fillStyle = "#64748B";
        ctx.font = "bold 12px DungGeunMo";
        ctx.textAlign = "right";
        ctx.fillText(isKo ? "선택 가능" : "Ready", cX + cW - 10, cY + 48);
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
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.imageSmoothingEnabled = false;
  ctx.textRendering = "optimizeSpeed";

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
  const selHasShiny = (selProgress?.shinyTier || 0) > 0;
  const selHasHa = selProgress?.hasHiddenAbility || false;
  const selHasPassive = selProgress?.passiveUnlocked || false;

  // 0. PRELOAD SPRITES IN PARALLEL (With User-owned Shiny support)
  const [listSprites, selectedSprite, partySprites] = await Promise.all([
    Promise.all(list.map((s) => {
      if (!s) return Promise.resolve(null);
      const prog = userStarters ? userStarters.get(s.speciesId) : null;
      const isS = (prog?.shinyTier || 0) > 0;
      return getPokemonSprite(s.speciesId, true, isS);
    })),
    sel ? getPokemonSprite(sel.speciesId, true, selHasShiny) : Promise.resolve(null),
    Promise.all(party.map((p) => (p ? getPokemonSprite(p.speciesId, true, p.isShiny) : Promise.resolve(null)))),
  ]);

  // 1. Dark Retro Background
  ctx.fillStyle = "#13151F";
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
    const inspectedHasShiny = activePartyMember?.isShiny || (inspectedProg?.shinyTier || 0) > 0;
    const inspectedHasHa = activePartyMember?.useHiddenAbility || inspectedProg?.hasHiddenAbility || false;
    const inspectedHasPassive = activePartyMember?.usePassive || inspectedProg?.passiveUnlocked || false;

    // Fetch inspected sprite
    const inspectedSprite = inspectedStarter ? await getPokemonSprite(inspectedStarter.speciesId, true, inspectedHasShiny) : null;

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
      panelX: splitX + 8,
      panelW: width - splitX - 18,
      sel: inspectedStarter,
      partyMember: activePartyMember,
      selProgress: inspectedProg,
      isKo,
      tab: options.partyTab,
      selectedMoveIdx: options.selectedMoveIdx,
    });

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

    ctx.strokeStyle = isSelected ? "#5865F2" : (isAlreadyInParty ? "#22C55E" : "#282D3D");
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.stroke();

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
        ctx.fillText(`#${String(s.dexNumber).padStart(3, "0")}`, sx + slotW - 6, sy + slotH - 12);
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

  return canvas.toBuffer("image/png");
}

export interface GenSelectScreenOptions {
  currentGen: number;
  lang?: "en" | "ko";
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

export interface EggGachaScreenOptions {
  selectedMachine: "shiny" | "move" | "legendary";
  eggs: Array<{
    id: string;
    tier: string;
    stepsRequired: number;
    stepsProgress: number;
    shinyTier: number;
  }>;
  recentHatched?: Array<{
    speciesId: string;
    nameKo: string;
    nameEn: string;
    shinyTier: number;
    hasHiddenAbility: boolean;
  }>;
  lang?: "en" | "ko";
}

/**
 * Renders the PokéRogue Egg Gacha & Incubator Screen (560x380)
 */
export async function renderEggGachaScreen(options: EggGachaScreenOptions): Promise<Buffer> {
  const width = 560;
  const height = 380;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.imageSmoothingEnabled = false;
  ctx.textRendering = "optimizeSpeed";

  const isKo = options.lang === "ko";
  const machine = options.selectedMachine || "shiny";
  const eggs = options.eggs || [];

  // Background
  ctx.fillStyle = "#13151F";
  ctx.fillRect(0, 0, width, height);

  // Top Banner
  ctx.fillStyle = "#1A1D2A";
  ctx.fillRect(0, 0, width, 42);
  ctx.strokeStyle = "#2D3246";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 42);
  ctx.lineTo(width, 42);
  ctx.stroke();

  ctx.font = "bold 20px DungGeunMo";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  ctx.fillText(isKo ? "알 뽑기 (EGG GACHA)" : "EGG GACHA", 14, 28);

  ctx.font = "bold 15px DungGeunMo";
  ctx.fillStyle = "#F59E0B";
  ctx.textAlign = "right";
  ctx.fillText(isKo ? `인큐베이터: ${eggs.length}개 보관 중` : `Incubator: ${eggs.length} Eggs`, width - 14, 28);

  // Top Gacha Machine Showcase (3 Machines Cards, y: 52 ~ 160)
  const machines = [
    { id: "shiny", nameKo: "이로치 UP 뽑기", nameEn: "Shiny UP Gacha", descKo: "이로치 확률 1/64", descEn: "Shiny Rate 1/64", color: "#F59E0B" },
    { id: "move", nameKo: "알 기술 UP 뽑기", nameEn: "Move UP Gacha", descKo: "희귀 알기술 확률 UP", descEn: "Rare Moves UP", color: "#EC4899" },
    { id: "legendary", nameKo: "전설 픽업 뽑기", nameEn: "Legendary UP", descKo: "전설 포켓몬 확률 UP", descEn: "Legendary Rate UP", color: "#8B5CF6" },
  ];

  const mCardW = 174;
  const mCardH = 100;
  const startX = 10;
  const startY = 52;
  const gapX = 9;

  for (let i = 0; i < 3; i++) {
    const m = machines[i];
    const mx = startX + i * (mCardW + gapX);
    const isSel = m.id === machine;

    ctx.fillStyle = isSel ? "#22273A" : "#181B26";
    ctx.beginPath();
    ctx.roundRect(mx, startY, mCardW, mCardH, 6);
    ctx.fill();

    ctx.strokeStyle = isSel ? m.color : "#282D3D";
    ctx.lineWidth = isSel ? 2 : 1;
    ctx.stroke();

    // Machine Name
    ctx.font = "bold 16px DungGeunMo";
    ctx.fillStyle = isSel ? "#FFFFFF" : "#CBD5E1";
    ctx.textAlign = "center";
    ctx.fillText(isKo ? m.nameKo : m.nameEn, mx + mCardW / 2, startY + 24);

    // Big Egg Vector Icon
    drawEggIcon(ctx, mx + mCardW / 2, startY + 54, 12, 16, m.color);

    // Desc
    ctx.font = "bold 13px DungGeunMo";
    ctx.fillStyle = isSel ? m.color : "#64748B";
    ctx.fillText(isKo ? m.descKo : m.descEn, mx + mCardW / 2, startY + 86);
  }

  // Divider Line
  ctx.strokeStyle = "#2D3246";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(10, 164);
  ctx.lineTo(width - 10, 164);
  ctx.stroke();

  // Incubator Section Header (y: 184)
  drawEggIcon(ctx, 22, 184, 7, 10, "#F59E0B");
  ctx.textBaseline = "middle";
  ctx.font = "bold 17px DungGeunMo";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  ctx.fillText(isKo ? "인큐베이터 알 보관소 (웨이브 클리어 시 부화!)" : "Incubator (Clearing waves hatches eggs!)", 36, 184);

  // Incubator Eggs Grid (y: 196 ~ 370, 4 Columns x 2 Rows = 8 Visible Slots)
  const eggSlotW = 128;
  const eggSlotH = 78;
  const eggStartX = 10;
  const eggStartY = 196;
  const eggGapX = 9;
  const eggGapY = 8;

  for (let i = 0; i < 8; i++) {
    const e = eggs[i];
    const col = i % 4;
    const row = Math.floor(i / 4);
    const ex = eggStartX + col * (eggSlotW + eggGapX);
    const ey = eggStartY + row * (eggSlotH + eggGapY);

    ctx.fillStyle = e ? "#181B26" : "#11131A";
    ctx.beginPath();
    ctx.roundRect(ex, ey, eggSlotW, eggSlotH, 5);
    ctx.fill();

    ctx.strokeStyle = e ? "#282D3D" : "#1E2230";
    ctx.lineWidth = 1;
    ctx.stroke();

    if (e) {
      const tierColor = e.tier === "legendary" ? "#8B5CF6" : e.tier === "epic" ? "#EC4899" : e.tier === "rare" ? "#3B82F6" : "#10B981";
      const tierLabel = isKo ? (e.tier === "legendary" ? "전설알" : e.tier === "epic" ? "에픽알" : e.tier === "rare" ? "레어알" : "일반알") : e.tier.toUpperCase();

      // Tier Badge
      ctx.fillStyle = tierColor;
      ctx.beginPath();
      ctx.roundRect(ex + 6, ey + 6, 44, 18, 3);
      ctx.fill();
      ctx.font = "bold 11px DungGeunMo";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.fillText(tierLabel, ex + 28, ey + 19);

      // Egg Vector Icon
      drawEggIcon(ctx, ex + eggSlotW - 18, ey + 20, 8, 11, tierColor);

      // Progress Waves
      ctx.font = "bold 14px DungGeunMo";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "left";
      ctx.fillText(`${e.stepsProgress} / ${e.stepsRequired} W`, ex + 8, ey + 46);

      // Gauge Bar
      const gW = eggSlotW - 16;
      const gH = 6;
      ctx.fillStyle = "#12141C";
      ctx.beginPath();
      ctx.roundRect(ex + 8, ey + 56, gW, gH, 3);
      ctx.fill();

      const ratio = Math.min(1.0, e.stepsProgress / e.stepsRequired);
      ctx.fillStyle = tierColor;
      ctx.beginPath();
      ctx.roundRect(ex + 8, ey + 56, Math.max(3, ratio * gW), gH, 3);
      ctx.fill();
    } else {
      ctx.font = "bold 18px DungGeunMo";
      ctx.fillStyle = "#2D3246";
      ctx.textAlign = "center";
      ctx.fillText("+", ex + eggSlotW / 2, ey + 36);

      ctx.font = "bold 12px DungGeunMo";
      ctx.fillStyle = "#475569";
      ctx.fillText(isKo ? "빈 슬롯" : "Empty", ex + eggSlotW / 2, ey + 56);
    }
  }

  return canvas.toBuffer("image/png");
}
