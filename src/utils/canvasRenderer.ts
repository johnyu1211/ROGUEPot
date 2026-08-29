import { createCanvas, loadImage, GlobalFonts, Image } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";
import { DexPokemonInfo, getAbilityDetail } from "../services/pokeApiService.js";

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
    else if (clean.startsWith("keldeo")) clean = "keldeo";
    else if (clean.startsWith("meloetta")) clean = "meloetta";
    else clean = clean.replace(/[^a-z0-9]/g, "");

    const url = `https://play.pokemonshowdown.com/sprites/gen5/${clean}.png`;
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
      ctx.font = "bold 12px DungGeunMo";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      const displayLabel = (pokemon.nickname || pokemon.name || "Pokemon").slice(0, 6);
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
  ctx.textRendering = "optimizeSpeed";

  const isKo = options?.lang === "ko";

  // 1. Dark Retro Background
  ctx.fillStyle = "#161424";
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

  // 5. Outer Border Frame flush to edge (Top Z-Index)
  ctx.strokeStyle = "#E63946";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, width - 4, height - 4);

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
  ctx.textRendering = "optimizeSpeed";

  const isKo = options?.lang === "ko";
  const party = options?.party || [];
  const registeredCount = party.filter(Boolean).length;
  const isComplete = registeredCount >= 1; // At least 1 Pokemon registered

  // 1. Dark Retro Background
  ctx.fillStyle = "#141226";
  ctx.fillRect(0, 0, width, height);

  // 2. TOP BANNER: Full-width Header Bar across the entire Left Half (y: 0 ~ 54)
  const splitX = 285;
  ctx.fillStyle = "#1B1E3D";
  ctx.fillRect(0, 0, splitX, 54);

  // Bottom border line under left header
  ctx.strokeStyle = "#5865F2";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 54);
  ctx.lineTo(splitX, 54);
  ctx.stroke();

  // Header Title Centered in Left Half
  ctx.font = "bold 20px DungGeunMo";
  ctx.fillStyle = "#5865F2";
  ctx.textAlign = "center";
  ctx.fillText(isKo ? "멀티플레이 로비" : "MULTIPLAYER LOBBY", splitX / 2, 34);

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
  ctx.textRendering = "optimizeSpeed";

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

  return canvas.toBuffer("image/png");
}

export interface PokedexScreenOptions {
  selectedPokemon?: DexPokemonInfo | null;
  pageList?: DexPokemonInfo[];
  currentPage?: number;
  totalPages?: number;
  activeAbility?: string;
  lang?: "en" | "ko";
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

  // 1. Dark Retro Background
  ctx.fillStyle = "#12101F";
  ctx.fillRect(0, 0, width, height);

  // 2. TOP BANNER: Full-width Header Bar across the entire Left Half (y: 0 ~ 42)
  const splitX = 262;
  ctx.fillStyle = "#2D1520";
  ctx.fillRect(0, 0, splitX, 42);

  // Bottom border line under left header
  ctx.strokeStyle = "#E63946";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 42);
  ctx.lineTo(splitX, 42);
  ctx.stroke();

  ctx.font = "bold 18px DungGeunMo";
  ctx.fillStyle = "#E63946";
  ctx.textAlign = "center";
  ctx.fillText(isKo ? "포켓몬 도감" : "POKÉDEX", splitX / 2 - 10, 29);

  // Page Indicator Badge on Left Header
  ctx.font = "12px DungGeunMo";
  ctx.fillStyle = "#CBD5E1";
  ctx.textAlign = "right";
  ctx.fillText(`P.${curPage}/${totPages}`, splitX - 10, 28);

  // 3. LEFT SIDE: 8 Pokémon Grid (2 Columns x 4 Rows)
  const startListY = 48;
  const slotW = 118;
  const slotH = 76;
  const gapX = 6;
  const gapY = 6;

  for (let i = 0; i < 8; i++) {
    const p = items[i];
    // Column-major order: Left column (0~3), Right column (4~7)
    const col = i < 4 ? 0 : 1;
    const row = i % 4;
    const sx = 10 + col * (slotW + gapX);
    const sy = startListY + row * (slotH + gapY);
    const isSelected = selected && p && selected.dexNumber === p.dexNumber;

    // Slot Box Background
    ctx.fillStyle = isSelected ? "#311C2E" : "#1B172E";
    ctx.beginPath();
    ctx.roundRect(sx, sy, slotW, slotH, 6);
    ctx.fill();

    ctx.strokeStyle = isSelected ? "#E63946" : "#322A4E";
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.stroke();

    if (p) {
      const displayName = (isKo && p.koreanName) ? p.koreanName : p.name;
      const dexTag = `#${String(p.dexNumber).padStart(3, "0")}`;

      // Left Header: Pokemon Name (14px Bold)
      ctx.font = "bold 14px DungGeunMo";
      ctx.fillStyle = isSelected ? "#FFFFFF" : "#F1F5F9";
      ctx.textAlign = "left";
      ctx.fillText(displayName.slice(0, 5), sx + 8, sy + 16);

      // Right Header: Dex Number (#001) Right-aligned (12px Bold)
      ctx.font = "bold 12px DungGeunMo";
      ctx.fillStyle = isSelected ? "#F4A261" : "#8E88AB";
      ctx.textAlign = "right";
      ctx.fillText(dexTag, sx + slotW - 8, sy + 16);

      // Mini Sprite (Centered in left half area: 50x48)
      const sprite = await getPokemonSprite(p.speciesId);
      if (sprite) {
        const scale = 0.64;
        const sprW = sprite.width * scale;
        const sprH = sprite.height * scale;
        const sprAreaW = 50;
        const sprAreaH = 48;
        ctx.drawImage(
          sprite,
          sx + 6 + (sprAreaW - sprW) / 2,
          sy + 22 + (sprAreaH - sprH) / 2,
          sprW,
          sprH
        );
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
      ctx.fillStyle = "#4D4566";
      ctx.textAlign = "center";
      ctx.fillText("---", sx + slotW / 2, sy + slotH / 2 + 4);
    }
  }

  // 4. VERTICAL SPLIT DIVIDER LINE (100% Full Height)
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
    // 5-0. Right Header Background Bar (y: 0 ~ 42, matching left header height exactly)
    ctx.fillStyle = "#1E1733";
    ctx.fillRect(splitX + 2, 0, width - splitX - 2, 42);

    // Sub-divider line under header at y = 42 (matching left divider exactly)
    ctx.strokeStyle = "#3D3058";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(splitX + 2, 42);
    ctx.lineTo(width, 42);
    ctx.stroke();

    // Header: Dex No & Big Name (Vertically centered at y = 29, matching left header baseline)
    ctx.font = "bold 20px DungGeunMo";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";
    const titleName = (isKo && selected.koreanName) ? selected.koreanName : selected.name;
    ctx.fillText(`#${String(selected.dexNumber).padStart(3, "0")} ${titleName}`, rightX + 4, 29);

    // 5-1. TOP MAIN INFO CARD (Sprite + Types) (Starting at y = 48, matching left slot grid startListY)
    const topCardY = 48;
    const topCardH = 108;

    ctx.fillStyle = "#181429";
    ctx.beginPath();
    ctx.roundRect(rightX, topCardY, rightW, topCardH, 6);
    ctx.fill();
    ctx.strokeStyle = "#362B4E";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Sprite Showcase Box (Compact 82x82)
    const showBoxX = rightX + 10;
    const showBoxSize = 84;
    const showBoxY = topCardY + (topCardH - showBoxSize) / 2;

    ctx.fillStyle = "#120F20";
    ctx.beginPath();
    ctx.roundRect(showBoxX, showBoxY, showBoxSize, showBoxSize, 6);
    ctx.fill();
    ctx.strokeStyle = "#4D3860";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const bigSprite = await getPokemonSprite(selected.speciesId);
    if (bigSprite) {
      const scale = 1.5;
      const sprW = bigSprite.width * scale;
      const sprH = bigSprite.height * scale;
      ctx.drawImage(bigSprite, showBoxX + (showBoxSize - sprW) / 2, showBoxY + (showBoxSize - sprH) / 2, sprW, sprH);
    }

    // Info Column (Types) next to Sprite (Enlarged 15px bold badges)
    const infoX = showBoxX + showBoxSize + 16;
    let typeBadgeX = infoX;
    const badgeW = isKo ? 48 : 56;
    const badgeH = 26;
    const typeBadgeY = topCardY + (topCardH - badgeH) / 2;

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
      ctx.font = isKo ? "bold 15px DungGeunMo" : "bold 12px DungGeunMo";
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.fillText(tDisplay, typeBadgeX + badgeW / 2, typeBadgeY + 18);
      ctx.restore();

      typeBadgeX += badgeW + 10;
    }

    // 5-2. BASE STATS 2-COLUMN X 3-ROW GRID (HP/SPE, ATK/SPA, DEF/SPD)
    const statsCardY = 164;
    const statsCardH = 120;

    ctx.fillStyle = "#181429";
    ctx.beginPath();
    ctx.roundRect(rightX, statsCardY, rightW, statsCardH, 6);
    ctx.fill();
    ctx.strokeStyle = "#362B4E";
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
      const rowY = statsCardY + 12 + st.row * 34;

      // Label (HP, ATK, DEF, SPE, SPA, SPD) - Enlarged to 14px Bold
      ctx.font = "bold 14px DungGeunMo";
      ctx.fillStyle = "#CBD5E1";
      ctx.textAlign = "left";
      ctx.fillText(st.label, colX, rowY + 14);

      // Value - Enlarged to 15px Bold
      ctx.font = "bold 15px DungGeunMo";
      ctx.textAlign = "right";
      ctx.fillStyle = st.color;
      ctx.fillText(String(st.val), colX + 54, rowY + 14);

      // Bar Background
      const gaugeX = colX + 60;
      ctx.fillStyle = "#120F20";
      ctx.beginPath();
      ctx.roundRect(gaugeX, rowY + 2, barW, barH, 3);
      ctx.fill();

      // Bar Fill
      const fillW = Math.min(barW, Math.max(3, (st.val / 180) * barW));
      ctx.fillStyle = st.color;
      ctx.beginPath();
      ctx.roundRect(gaugeX, rowY + 2, fillW, barH, 3);
      ctx.fill();
    }

    // 5-3. BOTTOM AREA (y = 290 ~ 372): Ability Dialog / Text Box
    const botCardY = 290;
    const botCardH = 82;

    ctx.fillStyle = "#141024";
    ctx.beginPath();
    ctx.roundRect(rightX, botCardY, rightW, botCardH, 6);
    ctx.fill();
    ctx.strokeStyle = "#3E2F5B";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Determine target ability to showcase
    const defaultAbility = (selected.regularAbilities && selected.regularAbilities[0]) || selected.primaryAbility || selected.hiddenAbility || "None";
    const targetAbility = options?.activeAbility || defaultAbility;
    const isHa = selected.hiddenAbility && targetAbility.toLowerCase() === selected.hiddenAbility.toLowerCase();

    const abDetail = await getAbilityDetail(targetAbility);
    const abName = isKo ? abDetail.nameKo : abDetail.name;
    const abDesc = isKo ? abDetail.descriptionKo : abDetail.descriptionEn;
    const typeTag = isHa ? (isKo ? "🌟 [숨특]" : "🌟 [HA]") : (isKo ? "⚡ [특성]" : "⚡ [Ability]");

    // Title inside text box
    ctx.font = "bold 13px DungGeunMo";
    ctx.fillStyle = isHa ? "#F4A261" : "#70D6FF";
    ctx.textAlign = "left";
    ctx.fillText(`${typeTag} ${abName}`, rightX + 10, botCardY + 18);

    ctx.font = "11px DungGeunMo";
    ctx.fillStyle = "#8E88AB";
    ctx.textAlign = "right";
    ctx.fillText(abDetail.name, rightX + rightW - 10, botCardY + 18);

    // Inner subtle divider line
    ctx.strokeStyle = "#251D3B";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rightX + 8, botCardY + 24);
    ctx.lineTo(rightX + rightW - 8, botCardY + 24);
    ctx.stroke();

    // Effect Description Text (Wrapped nicely into 2~3 lines)
    ctx.font = "12px DungGeunMo";
    ctx.fillStyle = "#E2E8F0";
    ctx.textAlign = "left";

    const maxTextW = rightW - 20;
    const words = abDesc.split(" ");
    let line = "";
    let lineY = botCardY + 42;
    const lineHeight = 16;
    let linesDrawn = 0;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + (line ? " " : "") + words[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTextW && n > 0) {
        ctx.fillText(line, rightX + 10, lineY);
        line = words[n];
        lineY += lineHeight;
        linesDrawn++;
        if (linesDrawn >= 2) break;
      } else {
        line = testLine;
      }
    }
    if (line && linesDrawn < 2) {
      ctx.fillText(line, rightX + 10, lineY);
    }
  }

  // 6. Outer Border Frame (Top Z-Index: Signature Pokédex Red)
  ctx.strokeStyle = "#E63946";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, width - 4, height - 4);

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
