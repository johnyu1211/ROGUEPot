import { createCanvas, loadImage, GlobalFonts, Image } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";
import { DexPokemonInfo, getAbilityDetail, getPokemonSpeciesInfo } from "../services/pokeApiService.js";
import { StarterEntry, GENERATION_INFO } from "../data/starterCosts.js";

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
  useHiddenAbility?: boolean;
  usePassive?: boolean;
}

export interface StarterSelectScreenOptions {
  selectedStarter: StarterEntry;
  currentGen: number;
  startersList: StarterEntry[];
  selectedParty: StarterSelectPartyItem[];
  isShinyMode?: boolean;
  isHaMode?: boolean;
  isPassiveMode?: boolean;
  maxCost?: number;
  lang?: "en" | "ko";
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
  const isShiny = !!options.isShinyMode;
  const isHa = !!options.isHaMode;
  const isPassive = !!options.isPassiveMode;
  const currentCost = party.reduce((sum, p) => sum + p.cost, 0);

  // 0. PRELOAD SPRITES IN PARALLEL (With Shiny support)
  const [listSprites, selectedSprite, partySprites] = await Promise.all([
    Promise.all(list.map((s) => (s ? getPokemonSprite(s.speciesId, true, isShiny) : Promise.resolve(null)))),
    sel ? getPokemonSprite(sel.speciesId, true, isShiny) : Promise.resolve(null),
    Promise.all(party.map((p) => (p ? getPokemonSprite(p.speciesId, true, p.isShiny) : Promise.resolve(null)))),
  ]);

  // 1. Dark Retro Background
  ctx.fillStyle = "#13151F";
  ctx.fillRect(0, 0, width, height);

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

  ctx.font = "bold 15px DungGeunMo";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  ctx.fillText(isKo ? "스타팅 선택" : "STARTER SELECT", 10, 27);

  // Active Modes Badges on Banner
  let badgeOffsetX = splitX - 10;
  if (isShiny) {
    ctx.fillStyle = "#F59E0B";
    ctx.beginPath();
    ctx.roundRect(badgeOffsetX - 28, 11, 24, 20, 3);
    ctx.fill();
    ctx.font = "bold 11px DungGeunMo";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText("✨", badgeOffsetX - 16, 25);
    badgeOffsetX -= 32;
  }
  if (isHa) {
    ctx.fillStyle = "#EF4444";
    ctx.beginPath();
    ctx.roundRect(badgeOffsetX - 32, 11, 28, 20, 3);
    ctx.fill();
    ctx.font = "bold 11px DungGeunMo";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText("HA", badgeOffsetX - 18, 25);
    badgeOffsetX -= 36;
  }
  if (isPassive) {
    ctx.fillStyle = "#10B981";
    ctx.beginPath();
    ctx.roundRect(badgeOffsetX - 32, 11, 28, 20, 3);
    ctx.fill();
    ctx.font = "bold 11px DungGeunMo";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText("PS", badgeOffsetX - 18, 25);
    badgeOffsetX -= 36;
  }

  // Gen Badge
  ctx.fillStyle = "#5865F2";
  ctx.beginPath();
  ctx.roundRect(badgeOffsetX - 46, 11, 42, 20, 3);
  ctx.fill();
  ctx.font = "bold 11px DungGeunMo";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.fillText(`G${gen}`, badgeOffsetX - 25, 25);

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
    const effectiveCost = s ? (isPassive ? s.reducedCost : s.cost) : 0;

    ctx.fillStyle = isSelected ? "#222738" : "#181B26";
    ctx.beginPath();
    ctx.roundRect(sx, sy, slotW, slotH, 6);
    ctx.fill();

    ctx.strokeStyle = isSelected ? "#5865F2" : (isAlreadyInParty ? "#22C55E" : "#282D3D");
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.stroke();

    if (s) {
      const displayName = isKo ? s.nameKo : s.name;

      // Slot Number + Name
      ctx.font = "bold 13px DungGeunMo";
      ctx.fillStyle = isSelected ? "#FFFFFF" : "#E2E8F0";
      ctx.textAlign = "left";
      ctx.fillText(`${i + 1}.${displayName.slice(0, 4)}`, sx + 6, sy + 16);

      // Cost Badge (Gold Orange or Green if reduced)
      ctx.fillStyle = isPassive ? "#059669" : "#D97706";
      ctx.beginPath();
      ctx.roundRect(sx + slotW - 30, sy + 4, 24, 16, 3);
      ctx.fill();
      ctx.font = "bold 11px DungGeunMo";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.fillText(`${effectiveCost}C`, sx + slotW - 18, sy + 16);

      // Sprite
      const sprite = listSprites[i];
      const sprAreaW = 48;
      const sprAreaH = 48;
      const sprX = sx + 6;
      const sprY = sy + 22;

      if (sprite) {
        const scale = 0.62;
        const sprW = sprite.width * scale;
        const sprH = sprite.height * scale;
        ctx.drawImage(sprite, sprX + (sprAreaW - sprW) / 2, sprY + (sprAreaH - sprH) / 2, sprW, sprH);
      }

      // Party Check Badge or Gen tag
      if (isAlreadyInParty) {
        ctx.fillStyle = "#22C55E";
        ctx.beginPath();
        ctx.roundRect(sx + slotW - 46, sy + slotH - 22, 40, 16, 3);
        ctx.fill();
        ctx.font = "bold 10px DungGeunMo";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.fillText(isKo ? "선택됨" : "ADDED", sx + slotW - 26, sy + slotH - 10);
      } else {
        ctx.font = "11px DungGeunMo";
        ctx.fillStyle = "#64748B";
        ctx.textAlign = "right";
        ctx.fillText(`#${String(s.dexNumber).padStart(3, "0")}`, sx + slotW - 6, sy + slotH - 10);
      }
    } else {
      ctx.font = "12px DungGeunMo";
      ctx.fillStyle = "#334155";
      ctx.textAlign = "center";
      ctx.fillText("---", sx + slotW / 2, sy + slotH / 2 + 4);
    }
  }

  // 4. VERTICAL SPLIT LINE
  ctx.strokeStyle = "#2D3246";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(splitX, 0);
  ctx.lineTo(splitX, height);
  ctx.stroke();

  // 5. RIGHT SIDE: Top Preview Card & Bottom Party Builder Card
  const rightX = 274;
  const rightW = width - rightX - 10;

  // 5-1. TOP PREVIEW CARD (y: 10 ~ 165, h: 155)
  const topCardY = 10;
  const topCardH = 155;

  ctx.fillStyle = "#181B26";
  ctx.beginPath();
  ctx.roundRect(rightX, topCardY, rightW, topCardH, 6);
  ctx.fill();
  ctx.strokeStyle = "#282D3D";
  ctx.lineWidth = 1;
  ctx.stroke();

  if (sel) {
    // Sprite Box (64x64)
    const showBoxX = rightX + 8;
    const showBoxY = topCardY + 8;
    const showBoxSize = 64;

    ctx.fillStyle = "#12141C";
    ctx.beginPath();
    ctx.roundRect(showBoxX, showBoxY, showBoxSize, showBoxSize, 6);
    ctx.fill();
    ctx.strokeStyle = isShiny ? "#F59E0B" : "#2D3246";
    ctx.lineWidth = isShiny ? 1.5 : 1;
    ctx.stroke();

    if (selectedSprite) {
      const scale = 1.2;
      const sprW = selectedSprite.width * scale;
      const sprH = selectedSprite.height * scale;
      ctx.drawImage(selectedSprite, showBoxX + (showBoxSize - sprW) / 2, showBoxY + (showBoxSize - sprH) / 2, sprW, sprH);
    }

    // Name + Dex + Cost next to sprite
    const infoX = showBoxX + showBoxSize + 10;
    const titleName = (isShiny ? "✨ " : "") + (isKo ? sel.nameKo : sel.name);
    const dexTag = `#${String(sel.dexNumber).padStart(3, "0")}`;

    ctx.font = "bold 12px DungGeunMo";
    ctx.fillStyle = "#8E96AB";
    ctx.textAlign = "left";
    ctx.fillText(dexTag, infoX, topCardY + 20);

    const tagW = ctx.measureText(dexTag).width;
    ctx.font = "bold 15px DungGeunMo";
    ctx.fillStyle = isShiny ? "#FBBF24" : "#FFFFFF";
    ctx.fillText(titleName, infoX + tagW + 6, topCardY + 20);

    // Cost Pill (Green if reduced)
    const effectiveSelCost = isPassive ? sel.reducedCost : sel.cost;
    ctx.fillStyle = isPassive ? "#059669" : "#D97706";
    ctx.beginPath();
    ctx.roundRect(infoX, topCardY + 28, 56, 17, 3);
    ctx.fill();
    ctx.font = "bold 10px DungGeunMo";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText(`COST: ${effectiveSelCost}`, infoX + 28, topCardY + 40);

    // Ability / HA Tag
    const activeAbName = (isHa && sel.hiddenAbility) ? (isKo ? sel.hiddenAbilityKo : sel.hiddenAbility) : (isKo ? sel.abilityKo : sel.ability);
    const abLabel = isHa && sel.hiddenAbility ? (isKo ? `[숨특] ${activeAbName}` : `[HA] ${activeAbName}`) : (isKo ? `[특성] ${activeAbName}` : `[Ab] ${activeAbName}`);
    ctx.font = "bold 11px DungGeunMo";
    ctx.fillStyle = isHa ? "#F87171" : "#60A5FA";
    ctx.textAlign = "left";
    ctx.fillText(abLabel, infoX, topCardY + 58);

    // Passive Tag
    const passiveName = isPassive ? (isKo ? `[패시브] ${sel.passiveAbilityKo}` : `[Passive] ${sel.passiveAbility}`) : (isKo ? "[패시브] 미해금" : "[Passive] Locked");
    ctx.font = "11px DungGeunMo";
    ctx.fillStyle = isPassive ? "#34D399" : "#64748B";
    ctx.fillText(passiveName, infoX, topCardY + 72);

    // Starter Moves Title
    ctx.font = "bold 11px DungGeunMo";
    ctx.fillStyle = "#94A3B8";
    ctx.textAlign = "left";
    ctx.fillText(isKo ? "시작 기술 (Starter Moves)" : "Starter Moves", rightX + 10, topCardY + 90);

    // Move Chips (2x2 Grid, width: 122 each)
    const moveChipW = (rightW - 26) / 2;
    const moveChipH = 22;
    for (let mIdx = 0; mIdx < 4; mIdx++) {
      const mName = sel.starterMoves[mIdx] || "---";
      const mCol = mIdx % 2;
      const mRow = Math.floor(mIdx / 2);
      const mX = rightX + 10 + mCol * (moveChipW + 6);
      const mY = topCardY + 98 + mRow * (moveChipH + 4);

      ctx.fillStyle = "#12141C";
      ctx.beginPath();
      ctx.roundRect(mX, mY, moveChipW, moveChipH, 3);
      ctx.fill();
      ctx.strokeStyle = "#282D3D";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = "11px DungGeunMo";
      ctx.fillStyle = mName === "---" ? "#475569" : "#E2E8F0";
      ctx.textAlign = "center";
      ctx.fillText(mName, mX + moveChipW / 2, mY + 15);
    }
  }

  // 5-2. BOTTOM PARTY BUILDER CARD (y: 172 ~ 370, h: 198)
  const bottomCardY = 172;
  const bottomCardH = 198;

  ctx.fillStyle = "#181B26";
  ctx.beginPath();
  ctx.roundRect(rightX, bottomCardY, rightW, bottomCardH, 6);
  ctx.fill();
  ctx.strokeStyle = "#282D3D";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Cost Counter text (Enlarged bold 16px)
  const isOverCost = currentCost > maxCost;
  const costColor = isOverCost ? "#EF4444" : (currentCost >= 8 ? "#F59E0B" : "#22C55E");
  ctx.font = "bold 16px DungGeunMo";
  ctx.fillStyle = costColor;
  ctx.textAlign = "left";
  ctx.fillText(`${isKo ? "코스트" : "COST"} : ${currentCost} / ${maxCost}`, rightX + 12, bottomCardY + 22);

  // Cost Gauge Bar (Width: rightW - 24)
  const gaugeW = rightW - 24;
  const gaugeH = 6;
  const gaugeX = rightX + 12;
  const gaugeY = bottomCardY + 30;

  ctx.fillStyle = "#12141C";
  ctx.beginPath();
  ctx.roundRect(gaugeX, gaugeY, gaugeW, gaugeH, 3);
  ctx.fill();

  const fillRatio = Math.min(1.0, currentCost / maxCost);
  const fillW = Math.max(fillRatio > 0 ? 4 : 0, fillRatio * gaugeW);
  ctx.fillStyle = costColor;
  ctx.beginPath();
  ctx.roundRect(gaugeX, gaugeY, fillW, gaugeH, 3);
  ctx.fill();

  // 6 Party Slots Grid (3 Columns x 2 Rows)
  const partySlotW = (rightW - 28) / 3;
  const partySlotH = 64;
  const partyStartX = rightX + 10;
  const partyStartY = bottomCardY + 44;
  const partyGapX = 4;
  const partyGapY = 6;

  for (let pIdx = 0; pIdx < 6; pIdx++) {
    const member = party[pIdx];
    const pCol = pIdx % 3;
    const pRow = Math.floor(pIdx / 3);
    const pX = partyStartX + pCol * (partySlotW + partyGapX);
    const pY = partyStartY + pRow * (partySlotH + partyGapY);

    ctx.fillStyle = member ? "#1E2438" : "#12141C";
    ctx.beginPath();
    ctx.roundRect(pX, pY, partySlotW, partySlotH, 4);
    ctx.fill();

    ctx.strokeStyle = member ? "#384260" : "#242A3D";
    ctx.lineWidth = 1;
    ctx.stroke();

    if (member) {
      // Mini Sprite (Centered)
      const pSprite = partySprites[pIdx];
      if (pSprite) {
        const scale = 0.58;
        const sprW = pSprite.width * scale;
        const sprH = pSprite.height * scale;
        ctx.drawImage(pSprite, pX + (partySlotW - sprW) / 2, pY + 2 + (36 - sprH) / 2, sprW, sprH);
      }

      // Member Name + Cost Badge
      ctx.font = "bold 11px DungGeunMo";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.fillText(member.name.slice(0, 4), pX + partySlotW / 2, pY + 44);

      ctx.fillStyle = "#D97706";
      ctx.beginPath();
      ctx.roundRect(pX + (partySlotW - 24) / 2, pY + 48, 24, 13, 2);
      ctx.fill();
      ctx.font = "bold 10px DungGeunMo";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(`${member.cost}C`, pX + partySlotW / 2, pY + 58);
    } else {
      // Empty Slot Marker
      ctx.font = "16px DungGeunMo";
      ctx.fillStyle = "#334155";
      ctx.textAlign = "center";
      ctx.fillText("+", pX + partySlotW / 2, pY + 30);
      ctx.font = "10px DungGeunMo";
      ctx.fillStyle = "#475569";
      ctx.fillText(isKo ? `슬롯 ${pIdx + 1}` : `Slot ${pIdx + 1}`, pX + partySlotW / 2, pY + 48);
    }
  }

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

  // Top Banner
  ctx.fillStyle = "#1A1D2A";
  ctx.fillRect(0, 0, width, 40);
  ctx.strokeStyle = "#2D3246";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 40);
  ctx.lineTo(width, 40);
  ctx.stroke();

  ctx.font = "bold 16px DungGeunMo";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  ctx.fillText(isKo ? "세대 선택 (GENERATION SELECT)" : "GENERATION SELECT", 14, 26);

  ctx.font = "12px DungGeunMo";
  ctx.fillStyle = "#94A3B8";
  ctx.textAlign = "right";
  ctx.fillText(isKo ? "탐험할 세대를 선택하세요" : "Choose your starter region", width - 14, 26);

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
    ctx.roundRect(cx + 1, cy + 1, cardW - 2, 22, [5, 5, 0, 0]);
    ctx.fill();

    // Gen Name
    ctx.font = "bold 12px DungGeunMo";
    ctx.fillStyle = isSelected ? "#FFFFFF" : "#E2E8F0";
    ctx.textAlign = "left";
    ctx.fillText(isKo ? info.nameKo : info.nameEn, cx + 8, cy + 16);

    // Gen Tag
    ctx.fillStyle = isSelected ? "#5865F2" : "#334155";
    ctx.beginPath();
    ctx.roundRect(cx + cardW - 32, cy + 3, 26, 16, 3);
    ctx.fill();
    ctx.font = "bold 10px DungGeunMo";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText(`G${info.gen}`, cx + cardW - 19, cy + 14);

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
