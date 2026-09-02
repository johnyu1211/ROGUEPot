import { createCanvas, loadImage, GlobalFonts, Image } from "@napi-rs/canvas";
import path from "path";
import fs from "fs";
import { DexPokemonInfo, getAbilityDetail, getPokemonSpeciesInfo, ABILITY_DETAILED_DESC_KO, ABILITY_DETAILED_DESC_EN } from "../services/pokeApiService.js";
import { StarterEntry, GENERATION_INFO, getStarterByDexNumber, getStarterBySpeciesId, STARTER_DATABASE } from "../data/starterCosts.js";
import { POKEMON_SPECIES_DATA } from "../data/pokemonStats.js";
import { POKEMON_NAMES_KO } from "../data/pokemonNamesKo.js";
import { MOVES_DATA } from "../data/movesKo.js";
import { MOVES_EN_DESC } from "../data/movesEn.js";
import { renderMoveEffect } from "./moveEffectRenderer.js";

// Register custom pixel dot font
const fontPath = path.resolve(process.cwd(), "assets/fonts/DungGeunMo.ttf");
if (fs.existsSync(fontPath)) {
  GlobalFonts.registerFromPath(fontPath, "DungGeunMo");
}

// ============================================================================
// ⚙️ [BATTLE FIELD & SPRITE LAYOUT CONFIGURATION]
// 배틀 화면의 발판 크기/위치 및 포켓몬 크기/착지점 좌표를 최상단에서 손쉽게 조절합니다.
// ============================================================================
export const BATTLE_LAYOUT_CONFIG = {
  // 1. 상대 발판 (우상단 원경)
  enemyPlatform: {
    scale: 1.5,
    x: 95,
    y: 25,
  },
  // 2. 아군 발판 (좌하단 전경 1인칭 미러링)
  playerPlatform: {
    scale: 2.0,
    x: -25,
    y: 130,
  },
  // 3. 상대 포켓몬 (원경)
  enemyPokemon: {
    size: 75,      // 실제 픽셀 몸체 크기 (px)
    x: 418,        // 발판 중심 X
    y: 135,        // 발판 착지점 Y
  },
  // 4. 아군 포켓몬 (전경 1인칭)
  playerPokemon: {
    size: 135,     // 실제 픽셀 몸체 크기 (px)
    x: 150,        // 발판 중심 X
    y: 280,        // 발판 착지점 Y
  },
  // 5. HUD 박스 위치 & 크기 (포켓로그 공식 스프라이트 규격)
  enemyHud: {
    x: 16,
    y: 16,
    w: 228,
    h: 54,
  },
  playerHud: {
    x: 316,
    y: 180,
    w: 228,
    h: 74,
  },
};
// ============================================================================

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
  isShiny?: boolean;
  shinyTier?: number;
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
export async function getPokemonSprite(
  pokemonName: string,
  allowFetch: boolean = true,
  isShiny: boolean | number = false,
  isBack: boolean = false
): Promise<any | null> {
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
    else if (clean.includes("gmax") || clean.includes("mega") || clean.includes("alola") || clean.includes("galar") || clean.includes("hisui") || clean.includes("paldea")) {
      clean = clean.replace(/[^a-z0-9-]/g, "");
    } else {
      clean = clean.replace(/[^a-z0-9]/g, "");
    }

    const tier = typeof isShiny === "number" ? isShiny : (isShiny ? 1 : 0);
    const cacheKey = isBack
      ? (tier > 0 ? `shiny_${tier}_back_${clean}` : `back_${clean}`)
      : (tier > 0 ? `shiny_${tier}_${clean}` : clean);

    if (spriteCache.has(cacheKey)) {
      return spriteCache.get(cacheKey)!;
    }

    if (!allowFetch) {
      return null;
    }

    const isTestSubject = clean === "testsubject12" || clean === "testsubject";
    const lookupKey = isTestSubject ? "ditto" : clean;

    // 1. Resolve Dex Number for authentic PokéRogue sprite lookup (All 1~1025 Pokemon)
    let dexNo: number | null = null;
    if (!isTestSubject) {
      if (/^\d+$/.test(clean)) {
        dexNo = parseInt(clean, 10);
      } else {
        const spec = POKEMON_SPECIES_DATA[clean] || POKEMON_SPECIES_DATA[clean.replace(/-/g, "")];
        if (spec && spec.num > 0) {
          dexNo = spec.num;
        } else {
          const matchStarter = STARTER_DATABASE.find((s) => s.speciesId === clean);
          if (matchStarter && matchStarter.dexNumber > 0) dexNo = matchStarter.dexNumber;
        }
      }
    }

    let img: any | null = null;

    // 2. Primary Source: Official PokéRogue Extracted Assets (Front & Back sprites)
    if (dexNo && !clean.includes("gmax") && !clean.includes("mega")) {
      const suffix = isBack ? "b" : "";
      try {
        const rogueUrl = `https://raw.githubusercontent.com/Sandstormer/PokeRogue-Dex/main/images/${dexNo}_${tier}${suffix}.png`;
        img = await loadImage(rogueUrl);
      } catch {
        if (tier > 0) {
          try {
            img = await loadImage(`https://raw.githubusercontent.com/Sandstormer/PokeRogue-Dex/main/images/${dexNo}_1${suffix}.png`);
            if (img && tier >= 2 && !isTestSubject) {
              img = applyShinyTierVariant(img, tier);
            }
          } catch {}
        }
      }
    }

    // 3. Secondary Fallback Source: Showdown CDN + Hue Shift / White Shading engine
    if (!img) {
      const folder = isBack
        ? (tier > 0 && !isTestSubject ? "gen5-back-shiny" : "gen5-back")
        : (tier > 0 && !isTestSubject ? "gen5-shiny" : "gen5");
      
      const candidateKeys = [
        lookupKey,
        lookupKey.replace(/gmax/g, "-gmax").replace(/mega/g, "-mega"),
        lookupKey.replace(/-/g, "")
      ];

      for (const k of candidateKeys) {
        if (img) break;
        try {
          img = await loadImage(`https://play.pokemonshowdown.com/sprites/${folder}/${k}.png`);
        } catch {
          if (isBack) {
            img = await loadImage(`https://play.pokemonshowdown.com/sprites/${tier > 0 && !isTestSubject ? "gen5-shiny" : "gen5"}/${k}.png`).catch(() => null);
          } else if (tier > 0 && !isTestSubject) {
            img = await loadImage(`https://play.pokemonshowdown.com/sprites/gen5/${k}.png`).catch(() => null);
          }
        }
      }

      if (img) {
        if (isTestSubject) {
          img = applyWhiteDittoVariant(img, tier);
        } else if (tier >= 2) {
          img = applyShinyTierVariant(img, tier);
        }
      }
    }

    if (img) {
      // Automatic LRU-style cache size management (max 300 entries)
      if (spriteCache.size >= 300) {
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
 * Generates custom pure white Ditto sprite for Testsubject12
 * Preserves facial features & outlines while transforming body into a sleek white/platinum tone.
 */
function applyWhiteDittoVariant(img: any, tier: number = 0): any {
  try {
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, img.width, img.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 10) continue;

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Dark outlines and facial features (eyes, smile)
      if (lum < 60) {
        data[i] = Math.round(r * 0.35);
        data[i + 1] = Math.round(g * 0.35);
        data[i + 2] = Math.round(b * 0.35);
      } else {
        // Body shading: map 60..255 to 195..255
        const norm = Math.max(0, Math.min(1, (lum - 60) / (255 - 60)));
        const whiteLum = Math.round(195 + norm * 60);

        if (tier === 3) {
          // Epic Red Shiny: Platinum White with subtle crimson/rose highlight
          data[i] = Math.min(255, Math.round(whiteLum * 1.0));
          data[i + 1] = Math.min(255, Math.round(whiteLum * 0.93));
          data[i + 2] = Math.min(255, Math.round(whiteLum * 0.95));
        } else if (tier === 2) {
          // Blue Shiny: Icy Diamond White with subtle sky blue luster
          data[i] = Math.min(255, Math.round(whiteLum * 0.94));
          data[i + 1] = Math.min(255, Math.round(whiteLum * 0.97));
          data[i + 2] = Math.min(255, whiteLum);
        } else if (tier === 1) {
          // Yellow Shiny: Pearlescent Warm White with subtle golden aura
          data[i] = Math.min(255, whiteLum);
          data[i + 1] = Math.min(255, Math.round(whiteLum * 0.99));
          data[i + 2] = Math.min(255, Math.round(whiteLum * 0.94));
        } else {
          // Base White: Pure crisp platinum white
          data[i] = Math.min(255, Math.round(whiteLum * 0.97));
          data[i + 1] = Math.min(255, Math.round(whiteLum * 0.98));
          data[i + 2] = Math.min(255, whiteLum);
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
  } catch (err) {
    console.error("[CANVAS] Failed to apply white ditto variant:", err);
    return img;
  }
}

/**
 * Generates custom PokéRogue shiny variant sprites (Tier 2 Blue, Tier 3 Epic Red)
 * via hue-shifting and saturation adjustment on the base shiny sprite.
 */
function applyShinyTierVariant(img: any, tier: number): any {
  if (tier <= 1) return img;

  try {
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, img.width, img.height);
    const data = imgData.data;

    // Tier 2 (Blue Shiny): +140 deg hue shift (Cools down to blue/cyan/indigo)
    // Tier 3 (Red/Epic Shiny): +260 deg hue shift (Warm magenta/crimson/gold)
    const hueShiftDegrees = tier === 2 ? 140 : 260;
    const satMult = tier === 2 ? 1.25 : 1.35;

    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 10) continue;

      let r = data[i] / 255;
      let g = data[i + 1] / 255;
      let b = data[i + 2] / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }

      // Shift hue and enhance saturation
      h = (h + hueShiftDegrees / 360) % 1.0;
      if (h < 0) h += 1.0;
      s = Math.min(1.0, s * satMult);

      // Convert back to RGB
      let r1, g1, b1;
      if (s === 0) {
        r1 = g1 = b1 = l;
      } else {
        const hue2rgb = (p: number, q: number, t: number) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r1 = hue2rgb(p, q, h + 1/3);
        g1 = hue2rgb(p, q, h);
        b1 = hue2rgb(p, q, h - 1/3);
      }

      data[i] = Math.round(r1 * 255);
      data[i + 1] = Math.round(g1 * 255);
      data[i + 2] = Math.round(b1 * 255);
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
  } catch (err) {
    console.error(`[CANVAS] Failed to apply shiny variant for tier ${tier}:`, err);
    return img;
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
 * Draws a battler sprite tightly fitted by its non-transparent pixel bounding box
 * so that foreground/background physical size and surface contact are 100% accurate regardless of canvas padding.
 */
export function drawFittedBattleSprite(ctx: any, sprite: any, targetX: number, targetY: number, targetSize: number) {
  if (!sprite || !sprite.width || !sprite.height) return;

  try {
    const tempCanvas = createCanvas(sprite.width, sprite.height);
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.drawImage(sprite, 0, 0);
    const data = tempCtx.getImageData(0, 0, sprite.width, sprite.height).data;

    let minX = sprite.width, maxX = 0, minY = sprite.height, maxY = 0;
    for (let y = 0; y < sprite.height; y++) {
      for (let x = 0; x < sprite.width; x++) {
        const a = data[(y * sprite.width + x) * 4 + 3];
        if (a > 10) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX >= minX && maxY >= minY) {
      const actW = maxX - minX + 1;
      const actH = maxY - minY + 1;
      const maxDim = Math.max(actW, actH);
      const scale = targetSize / maxDim;

      const drawW = actW * scale;
      const drawH = actH * scale;
      const drawX = targetX - drawW / 2;
      const drawY = targetY - drawH; // bottom-aligned on surface

      ctx.drawImage(sprite, minX, minY, actW, actH, drawX, drawY, drawW, drawH);
      return;
    }
  } catch {}

  ctx.drawImage(sprite, targetX - targetSize / 2, targetY - targetSize, targetSize, targetSize);
}

/**
 * Official PokéRogue Type Colors Map
 */
export const POKEROGUE_TYPE_COLORS: Record<string, string> = {
  normal: "#A8A77A", fire: "#EE8130", water: "#6390F0", electric: "#F7D02C",
  grass: "#7AC74C", ice: "#96D9D6", fighting: "#C22E28", poison: "#A33EA1",
  ground: "#E2BF65", flying: "#A98FF3", psychic: "#F95587", bug: "#A6B91A",
  rock: "#B6A136", ghost: "#735797", dragon: "#6F35FC", dark: "#705746",
  steel: "#B7B7CE", fairy: "#D685AD"
};

interface PbInfoAssets {
  playerBox: Image | null;
  enemyBox: Image | null;
  bossBox: Image | null;
  hpLabel: Image | null;
  categories: Image | null;
}

let cachedPbInfo: PbInfoAssets | null = null;

export async function getPbInfoAssets(): Promise<PbInfoAssets> {
  if (cachedPbInfo) return cachedPbInfo;
  const base = "https://raw.githubusercontent.com/pagefaultgames/pokerogue-assets/beta/images/ui";
  const imgBase = "https://raw.githubusercontent.com/pagefaultgames/pokerogue-assets/beta/images";
  try {
    const [playerBox, enemyBox, bossBox, hpLabel, categories] = await Promise.all([
      loadImage(`${base}/pbinfo_player.png`).catch(() => null),
      loadImage(`${base}/pbinfo_enemy_mini.png`).catch(() => null),
      loadImage(`${base}/pbinfo_enemy_boss.png`).catch(() => null),
      loadImage(`${base}/text_images/en/battle_ui/overlay_hp_label.png`).catch(() => null),
      loadImage(`${imgBase}/categories.png`).catch(() => null),
    ]);
    cachedPbInfo = { playerBox, enemyBox, bossBox, hpLabel, categories };
    return cachedPbInfo;
  } catch {
    return { playerBox: null, enemyBox: null, bossBox: null, hpLabel: null, categories: null };
  }
}

/**
 * Resolves a Pokémon's display name accurately based on language setting (ko/en)
 */
export function getPokemonDisplayName(mon: any, isKo: boolean): string {
  if (!mon) return isKo ? "포켓몬" : "Pokemon";
  if (mon.nickname) return mon.nickname;

  const speciesId = (mon.speciesId || "").toLowerCase().replace(/[\s_]+/g, "-");
  const starter = speciesId ? getStarterBySpeciesId(speciesId) : null;
  const sData = POKEMON_SPECIES_DATA[speciesId];

  if (isKo) {
    if (mon.nameKo) return mon.nameKo;
    if (starter?.nameKo) return starter.nameKo;
    if (sData?.num && POKEMON_NAMES_KO[sData.num]) return POKEMON_NAMES_KO[sData.num];
    if (mon.name && /[가-힣]/.test(mon.name)) return mon.name;
    return mon.name || speciesId || "포켓몬";
  } else {
    if (mon.nameEn) return mon.nameEn;
    if (starter?.name) return starter.name;
    if (sData?.name) return sData.name;
    if (mon.name && !/[가-힣]/.test(mon.name)) return mon.name;
    if (speciesId) {
      return speciesId.charAt(0).toUpperCase() + speciesId.slice(1).replace(/-/g, " ");
    }
    return "Pokemon";
  }
}

export interface PokeRogueBattleHudOptions {
  x: number;
  y: number;
  w: number;
  h: number;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  isEnemy: boolean;
  types?: string[];
  isBoss?: boolean;
  bossShields?: number;
  statusBadge?: string;
  exp?: number;
  maxExp?: number;
  isKo?: boolean;
  hudImage?: any;
  hpLabel?: any;
}

/**
 * Draws the Authentic Official PokéRogue Battle HP/Info Box HUD
 */
export function drawPokeRogueBattleHud(ctx: any, opt: PokeRogueBattleHudOptions) {
  const { x, y, w, h, name, level, hp, maxHp, isEnemy, isBoss, bossShields, statusBadge, exp, maxExp, hudImage, hpLabel } = opt;
  ctx.save();

  const scale = 1.75;

  if (hudImage) {
    // 1. Render Authentic Official PokéRogue Battle Box Sprite
    ctx.drawImage(hudImage, x, y, w, h);

    // 1.1 Render Official Green/Cyan HP Badge on Left of Bar
    if (hpLabel) {
      const labelX = isEnemy ? (x + 41.5 * scale) : (x + 51.5 * scale);
      ctx.drawImage(hpLabel, labelX, y + 17.5 * scale, hpLabel.width * scale, hpLabel.height * scale);
    }

    // 2. Pokémon Name (Centered in top bar, player shifted slightly right for bevel padding)
    const displayName = name + (statusBadge || "");
    ctx.font = "bold 13px DungGeunMo";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const nameX = isEnemy ? (x + 16 * scale) : (x + 20 * scale);
    ctx.fillText(displayName, nameX, y + 10.5 * scale);

    // 3. Level Indicator (Centered in top bar with comfortable breathing room)
    ctx.textAlign = "right";
    ctx.font = "bold 11px DungGeunMo";
    ctx.fillStyle = "#F59E0B";
    const lvLabelX = isEnemy ? (x + w - 34 * scale) : (x + w - 28 * scale);
    const lvNumX = isEnemy ? (x + w - 20 * scale) : (x + w - 14 * scale);
    ctx.fillText("Lv.", lvLabelX, y + 10.5 * scale);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 13px DungGeunMo";
    ctx.fillText(level.toString(), lvNumX, y + 10.5 * scale);

    // 4. HP Bar Gauge inside exact pixel cavity
    const hpRatio = Math.max(0, Math.min(1.0, hp / maxHp));
    const hpColor = hpRatio > 0.5 ? "#22C55E" : hpRatio > 0.2 ? "#EAB308" : "#EF4444";

    if (isEnemy) {
      const slotX = x + 58.5 * scale;
      const slotY = y + 19.3 * scale;
      const slotW = (isBoss ? 87 : 48.5) * scale;
      const slotH = 3.0 * scale;

      if (hpRatio > 0) {
        ctx.fillStyle = hpColor;
        ctx.fillRect(slotX, slotY, slotW * hpRatio, slotH);
      }

      if (isBoss && bossShields !== undefined) {
        for (let s = 0; s < 3; s++) {
          ctx.fillStyle = s < bossShields ? "#EF4444" : "#475569";
          ctx.beginPath();
          ctx.roundRect(x + w - 60 - s * 14, y + 5, 10, 4, 1);
          ctx.fill();
        }
      }
    } else {
      const slotX = x + 68.5 * scale;
      const slotY = y + 19.3 * scale;
      const slotW = 48.5 * scale;
      const slotH = 3.0 * scale;

      if (hpRatio > 0) {
        ctx.fillStyle = hpColor;
        ctx.fillRect(slotX, slotY, slotW * hpRatio, slotH);
      }

      // Player HP Numbers (Centered in bottom bar)
      ctx.textAlign = "right";
      ctx.font = "bold 11px DungGeunMo";
      ctx.fillStyle = "#FFFFFF";
      ctx.textBaseline = "middle";
      ctx.fillText(`${hp} / ${maxHp}`, x + w - 14 * scale, y + 31.5 * scale);

      // Player EXP Bar (Bottom dotted line track: x=33..115)
      const expSlotX = x + 33 * scale;
      const expSlotY = y + 39 * scale;
      const expSlotW = 82 * scale;
      const expSlotH = 2 * scale;

      const expRatio = Math.max(0, Math.min(1.0, (exp || 0) / (maxExp || 100)));
      if (expRatio > 0) {
        ctx.fillStyle = "#38BDF8";
        ctx.fillRect(expSlotX, expSlotY, expSlotW * expRatio, expSlotH);
      }
    }
  }

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

    // Slot Number Tag (1, 2, 3, 4, 5, 6)
    if (options?.showSlotNumbers) {
      ctx.font = "bold 13px DungGeunMo";
      ctx.fillStyle = options?.borderColor || "#8E96AB";
      ctx.textAlign = "left";
      ctx.fillText(`${i + 1}`, sx + 9, sy + 17);
    }

    const pokemon = partyList[i];
    if (pokemon) {
      const shinyTier = pokemon.shinyTier !== undefined
        ? pokemon.shinyTier
        : (pokemon.isShiny || (pokemon.name && pokemon.name.includes("✨")) ? 1 : 0);
      const isShiny = shinyTier > 0;

      // Localized full name without hard truncation
      let displayName = pokemon.nickname || pokemon.name || "Pokemon";
      if (!pokemon.nickname) {
        if (pokemon.speciesId === "testsubject12" || pokemon.speciesId === "testsubject") {
          displayName = "Testsubject12";
        } else {
          const spec = POKEMON_SPECIES_DATA[pokemon.speciesId];
          if (spec) {
            displayName = isKo ? (POKEMON_NAMES_KO[spec.num] || spec.name) : spec.name;
          }
        }
      }
      displayName = displayName.replace(/^✨\s*/, "");

      const sprite = await getPokemonSprite(pokemon.speciesId, true, shinyTier);
      if (sprite) {
        const scale = 1.35;
        const sprW = sprite.width * scale;
        const sprH = sprite.height * scale;
        ctx.drawImage(sprite, sx + (slotW - sprW) / 2, sy + (slotH - sprH) / 2 - 8, sprW, sprH);
      }

      const fontSize = displayName.length > 10 ? 11 : (displayName.length > 7 ? 12 : 13);
      ctx.font = `bold ${fontSize}px DungGeunMo`;
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.fillText(displayName, sx + slotW / 2, sy + slotH - 8);
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
      ctx.fillText(isKo ? "1. 이어하기" : "1. CONTINUE", leftPadding + 6, menuStartY);
      ctx.fillText(isKo ? "2. 새 게임" : "2. NEW GAME", leftPadding + 6, menuStartY + 38);
      ctx.fillText(isKo ? "3. 불러오기" : "3. LOAD GAME", leftPadding + 6, menuStartY + 76);
      ctx.fillText(isKo ? "4. 멀티플레이" : "4. MULTIPLAY", leftPadding + 6, menuStartY + 114);
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
  fire: "#EE8130",
  water: "#6390F0",
  grass: "#7AC74C",
  electric: "#F7D02C",
  ice: "#96D9D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  flying: "#A98FF3",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  steel: "#B7B7CE",
  fairy: "#D685AD",
  dark: "#705746",
};

export const TYPE_NAMES_KO: Record<string, string> = {
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

    if (isSelected) {
      ctx.strokeStyle = "#5865F2";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (p) {
      const displayName = (isKo && p.koreanName) ? p.koreanName : p.name;
      const dexTag = p.dexNumber <= 0 ? "#---" : `#${String(p.dexNumber).padStart(3, "0")}`;

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
  moves?: string[];
}

export type PartyViewTab = "moves" | "learnable" | "shiny" | "cost";

export interface InGameMessage {
  title: string;
  text: string;
  type?: "info" | "lock" | "success";
  moveType?: string;
  moveCategory?: "physical" | "special" | "status";
  movePower?: string;
  moveAccuracy?: string;
  movePp?: string;
}

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
  targetMoveSlot?: number;
  inGameMessage?: InGameMessage;
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
export function drawPokemonSilhouetteShadow(
  ctx: any,
  sprite: any,
  targetX: number,
  targetY: number,
  targetSize: number,
  isPlayer: boolean = false,
  opacity: number = 0.40
) {
  if (!sprite || !sprite.width || !sprite.height) return;

  try {
    const tempCanvas = createCanvas(sprite.width, sprite.height);
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.drawImage(sprite, 0, 0);
    const data = tempCtx.getImageData(0, 0, sprite.width, sprite.height).data;

    let minX = sprite.width, maxX = 0, minY = sprite.height, maxY = 0;
    for (let y = 0; y < sprite.height; y++) {
      for (let x = 0; x < sprite.width; x++) {
        const a = data[(y * sprite.width + x) * 4 + 3];
        if (a > 10) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < minX || maxY < minY) return;

    const actW = maxX - minX + 1;
    const actH = maxY - minY + 1;
    const maxDim = Math.max(actW, actH);
    const scale = targetSize / maxDim;
    const drawW = actW * scale;
    const drawH = actH * scale;

    const silCanvas = createCanvas(actW, actH);
    const silCtx = silCanvas.getContext("2d");
    silCtx.drawImage(sprite, minX, minY, actW, actH, 0, 0, actW, actH);
    silCtx.globalCompositeOperation = "source-in";
    silCtx.fillStyle = `rgba(10, 22, 16, ${opacity})`;
    silCtx.fillRect(0, 0, actW, actH);

    ctx.save();
    ctx.translate(targetX, targetY);
    const skewX = isPlayer ? -0.38 : -0.42;
    const scaleY = isPlayer ? 0.30 : 0.32;
    ctx.transform(1, 0, skewX, scaleY, 0, 0);
    ctx.drawImage(silCanvas, -drawW / 2, -drawH, drawW, drawH);
    ctx.restore();
  } catch (err) {
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
    ctx.beginPath();
    ctx.ellipse(targetX, targetY - 4, targetSize * 0.35, targetSize * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Backward compatibility alias for drawPokemonShadow
 */
export function drawPokemonShadow(
  ctx: any,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  opacity: number = 0.38
) {
  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
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

export interface SaveSlotsScreenOptions {
  slots: Record<number, any>;
  selectedSlotId?: number;
  deleteMode?: boolean;
  lang?: "en" | "ko";
  inGameMessage?: InGameMessage;
}

function formatSlotDate(dateStr?: string, isKo: boolean = true): string {
  if (!dateStr) return isKo ? "저장 기록 없음" : "No record";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const date = d.getDate();
    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    const ampm = hours >= 12 ? (isKo ? "오후" : "PM") : (isKo ? "오전" : "AM");
    const h12 = hours % 12 || 12;
    if (isKo) {
      return `${year}. ${month}. ${date}. ${ampm} ${h12}:${minutes}:${seconds}`;
    } else {
      return `${year}-${String(month).padStart(2, "0")}-${String(date).padStart(2, "0")} ${h12}:${minutes}:${seconds} ${ampm}`;
    }
  } catch {
    return dateStr;
  }
}

function drawRetroCornerBrackets(ctx: any, x: number, y: number, w: number, h: number, color: string = "#38BDF8", size: number = 7) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  // Top-Left
  ctx.moveTo(x + 5, y + 5 + size);
  ctx.lineTo(x + 5, y + 5);
  ctx.lineTo(x + 5 + size, y + 5);
  // Top-Right
  ctx.moveTo(x + w - 5 - size, y + 5);
  ctx.lineTo(x + w - 5, y + 5);
  ctx.lineTo(x + w - 5, y + 5 + size);
  // Bottom-Left
  ctx.moveTo(x + 5, y + h - 5 - size);
  ctx.lineTo(x + 5, y + h - 5);
  ctx.lineTo(x + 5 + size, y + h - 5);
  // Bottom-Right
  ctx.moveTo(x + w - 5 - size, y + h - 5);
  ctx.lineTo(x + w - 5, y + h - 5);
  ctx.lineTo(x + w - 5, y + h - 5 - size);
  ctx.stroke();
  ctx.restore();
}

function drawSmallHeart(ctx: any, x: number, y: number, size: number = 5.5, color: string = "#F472B6") {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  const topCurveHeight = size * 0.3;
  ctx.moveTo(x, y + topCurveHeight);
  ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
  ctx.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + (size + topCurveHeight) / 2, x, y + size);
  ctx.bezierCurveTo(x, y + (size + topCurveHeight) / 2, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight);
  ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Renders the PokéRogue-Style 3 Save Slots Screen (560x380) with 2x SuperSampling
 */
export async function renderSaveSlotsScreen(options: SaveSlotsScreenOptions): Promise<Buffer> {
  const width = 560;
  const height = 380;
  const scale = 2;
  const canvas = createCanvas(width * scale, height * scale);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  ctx.imageSmoothingEnabled = false;

  const isKo = options.lang === "ko";
  const deleteMode = Boolean(options.deleteMode);
  const selectedSlotId = options.selectedSlotId;

  // Background
  ctx.fillStyle = "#11141D";
  ctx.fillRect(0, 0, width, height);

  // Pre-load party sprites for all 3 slots
  for (let i = 0; i < 3; i++) {
    const s = options.slots ? options.slots[i + 1] : null;
    if (s && s.party && Array.isArray(s.party)) {
      await Promise.all(
        s.party.slice(0, 6).map((p: any) => p && p.speciesId && getPokemonSprite(p.speciesId, true, p.shinyTier !== undefined ? p.shinyTier : (p.isShiny ? 1 : 0)))
      );
    }
  }

  // Top Header Banner (0 ~ 40)
  ctx.fillStyle = "#181B26";
  ctx.fillRect(0, 0, width, 40);
  ctx.strokeStyle = "#2D3246";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 40);
  ctx.lineTo(width, 40);
  ctx.stroke();

  // Header Icon & Title
  if (deleteMode) {
    drawVectorWarning(ctx, 24, 20, 9, "#EF4444");
  } else {
    drawVectorGlobe(ctx, 24, 20, 8, "#38BDF8");
  }

  ctx.textBaseline = "middle";
  ctx.font = "bold 17px DungGeunMo";
  ctx.fillStyle = deleteMode ? "#EF4444" : "#38BDF8";
  ctx.textAlign = "left";
  ctx.fillText(deleteMode ? (isKo ? "세이브 슬롯 삭제 모드" : "DELETE SLOT MODE") : (isKo ? "세이브 슬롯 선택" : "SAVE SLOTS"), 40, 21);

  ctx.font = "bold 13px DungGeunMo";
  ctx.fillStyle = deleteMode ? "#FCA5A5" : "#94A3B8";
  ctx.textAlign = "right";
  ctx.fillText(
    deleteMode
      ? (isKo ? "삭제할 슬롯을 선택하세요" : "Select a slot to delete")
      : (isKo ? "모험을 시작하거나 이어하세요" : "Select a slot to play"),
    width - 16,
    21
  );

  // 3 Slots Grid (Vertical layout: cardW 532, cardH 96, gap 12)
  const cardW = 532;
  const cardH = 96;
  const cardX = 14;
  const cardYs = [48, 156, 264];

  for (let i = 0; i < 3; i++) {
    const slotNum = i + 1;
    const slot = options.slots ? options.slots[slotNum] : null;
    const cardY = cardYs[i];
    const isSelected = selectedSlotId === slotNum;

    if (slot) {
      // Saved Slot Card
      ctx.fillStyle = isSelected ? "#1E293B" : "#1A212E";
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 6);
      ctx.fill();

      // Border
      const borderColor = deleteMode ? "#EF4444" : (isSelected ? "#2DD4BF" : "#0D9488");
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = isSelected ? 2.5 : 1.8;
      ctx.stroke();

      // Selected Pointer (▶)
      if (isSelected) {
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        const pX = cardX + cardW - 8;
        const pY = cardY + cardH / 2;
        ctx.moveTo(pX, pY - 6);
        ctx.lineTo(pX + 6, pY);
        ctx.lineTo(pX, pY + 6);
        ctx.closePath();
        ctx.fill();
      }

      // Left Text Information
      const textX = cardX + 16;
      ctx.textAlign = "left";

      // Line 1: Mode (Slot #)
      ctx.textBaseline = "middle";
      ctx.font = "bold 16px DungGeunMo";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(`${slot.gameMode || (isKo ? "클래식" : "Classic")} (${slotNum})`, textX, cardY + 24);

      // Line 2: Mode - Wave
      ctx.font = "bold 14px DungGeunMo";
      ctx.fillStyle = "#E2E8F0";
      ctx.fillText(`${slot.gameMode || (isKo ? "클래식" : "Classic")} - ${isKo ? "웨이브" : "Wave"} ${slot.wave || 1}`, textX, cardY + 48);

      // Line 3: Saved Timestamp (Last Updated / Saved Time)
      ctx.font = "12px DungGeunMo";
      ctx.fillStyle = "#94A3B8";
      ctx.fillText(formatSlotDate(slot.updatedAt, isKo), textX, cardY + 70);

      // Right Side Party Pokémon (Up to 6)
      const party = slot.party || [];
      const partyStartX = cardX + 240;
      const slotItemW = 46;

      for (let pIdx = 0; pIdx < Math.min(6, party.length); pIdx++) {
        const p = party[pIdx];
        if (!p) continue;
        const px = partyStartX + pIdx * slotItemW;
        const py = cardY + 10;

        // Sprite
        const sprite = await getPokemonSprite(p.speciesId, true, p.shinyTier !== undefined ? p.shinyTier : (p.isShiny ? 1 : 0));
        if (sprite) {
          ctx.drawImage(sprite, px, py, 34, 34);
        }

        // Level
        ctx.textAlign = "center";
        ctx.font = "bold 11px DungGeunMo";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(`Lv${p.level || 5}`, px + 17, py + 46);
      }
    } else {
      // Empty Slot Card
      ctx.fillStyle = "#131620";
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 6);
      ctx.fill();

      ctx.strokeStyle = isSelected ? "#38BDF8" : "#2A3245";
      ctx.lineWidth = isSelected ? 2 : 1.2;
      ctx.stroke();

      const textX = cardX + 20;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      // Line 1: [슬롯 N] 빈 슬롯
      ctx.font = "bold 16px DungGeunMo";
      ctx.fillStyle = isSelected ? "#94A3B8" : "#64748B";
      ctx.fillText(isKo ? `[슬롯 ${slotNum}] 빈 슬롯` : `[Slot ${slotNum}] Empty Slot`, textX, cardY + 36);

      // Line 2: Description
      ctx.font = "13px DungGeunMo";
      ctx.fillStyle = "#475569";
      ctx.fillText(isKo ? "새로운 모험을 시작할 수 있습니다." : "Start a new adventure in this slot", textX, cardY + 62);

      // Right Button indicator
      ctx.textAlign = "right";
      ctx.font = "bold 15px DungGeunMo";
      ctx.fillStyle = "#38BDF8";
      ctx.fillText("+ NEW GAME", cardX + cardW - 24, cardY + cardH / 2);
    }
  }

  // In-Game Dialogue Box overlay (if active)
  if (options.inGameMessage) {
    drawInGameMessageBox(ctx, width, height, options.inGameMessage, isKo);
  }

  return canvas.toBuffer("image/png");
}

export interface BattleScreenOptions {
  battle: any;
  lang?: "en" | "ko";
  inGameMessage?: InGameMessage;
}

function drawBiomeBackground(ctx: any, width: number, biome: string) {
  const b = biome.toLowerCase();

  if (b.includes("town")) {
    // 1. Town Sky Gradient
    const sky = ctx.createLinearGradient(0, 0, 0, 160);
    sky.addColorStop(0, "#3B82F6");
    sky.addColorStop(0.6, "#93C5FD");
    sky.addColorStop(1, "#E0F2FE");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, 160);

    // Soft Clouds
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.beginPath();
    ctx.arc(80, 45, 24, 0, Math.PI * 2);
    ctx.arc(105, 40, 30, 0, Math.PI * 2);
    ctx.arc(130, 45, 22, 0, Math.PI * 2);
    ctx.arc(420, 35, 20, 0, Math.PI * 2);
    ctx.arc(445, 30, 26, 0, Math.PI * 2);
    ctx.arc(470, 35, 18, 0, Math.PI * 2);
    ctx.fill();

    // Distant Town Houses & Roof Silhouettes (y: 95 ~ 160)
    ctx.fillStyle = "#64748B";
    ctx.beginPath();
    ctx.rect(30, 115, 60, 45);
    ctx.moveTo(25, 115); ctx.lineTo(60, 85); ctx.lineTo(95, 115);
    ctx.rect(110, 100, 75, 60);
    ctx.moveTo(105, 100); ctx.lineTo(147, 72); ctx.lineTo(190, 100);
    ctx.rect(210, 85, 45, 75);
    ctx.moveTo(205, 85); ctx.lineTo(232, 60); ctx.lineTo(260, 85);
    ctx.rect(330, 110, 80, 50);
    ctx.moveTo(325, 110); ctx.lineTo(370, 80); ctx.lineTo(415, 110);
    ctx.rect(430, 120, 90, 40);
    ctx.moveTo(425, 120); ctx.lineTo(475, 95); ctx.lineTo(525, 120);
    ctx.fill();

    // Midground Fences & Trees
    ctx.fillStyle = "#10B981";
    ctx.beginPath();
    ctx.arc(20, 150, 25, 0, Math.PI * 2);
    ctx.arc(100, 152, 20, 0, Math.PI * 2);
    ctx.arc(310, 148, 28, 0, Math.PI * 2);
    ctx.arc(425, 150, 22, 0, Math.PI * 2);
    ctx.arc(540, 146, 30, 0, Math.PI * 2);
    ctx.fill();

    // Cobblestone Paved Ground (y: 160 ~ 270)
    const ground = ctx.createLinearGradient(0, 160, 0, 270);
    ground.addColorStop(0, "#94A3B8");
    ground.addColorStop(1, "#475569");
    ctx.fillStyle = ground;
    ctx.fillRect(0, 160, width, 110);

    // Cobblestone Grid Textures
    ctx.strokeStyle = "rgba(51, 65, 85, 0.4)";
    ctx.lineWidth = 1;
    for (let r = 165; r < 270; r += 14) {
      ctx.beginPath();
      ctx.moveTo(0, r); ctx.lineTo(width, r);
      ctx.stroke();
      const offset = (r % 28 === 0) ? 0 : 15;
      for (let c = offset; c < width; c += 30) {
        ctx.beginPath();
        ctx.moveTo(c, r); ctx.lineTo(c, r + 14);
        ctx.stroke();
      }
    }
  } else if (b.includes("forest")) {
    // Forest Twilight Canopy
    const sky = ctx.createLinearGradient(0, 0, 0, 160);
    sky.addColorStop(0, "#064E3B");
    sky.addColorStop(0.5, "#047857");
    sky.addColorStop(1, "#10B981");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, 160);

    // Dappled Sunlight Rays
    ctx.fillStyle = "rgba(254, 240, 138, 0.15)";
    ctx.beginPath();
    ctx.moveTo(60, 0); ctx.lineTo(140, 270); ctx.lineTo(180, 270); ctx.lineTo(100, 0);
    ctx.moveTo(280, 0); ctx.lineTo(360, 270); ctx.lineTo(410, 270); ctx.lineTo(330, 0);
    ctx.fill();

    // Deep Forest Trees & Trunks
    ctx.fillStyle = "#065F46";
    ctx.beginPath();
    ctx.arc(70, 70, 75, 0, Math.PI * 2);
    ctx.arc(200, 60, 85, 0, Math.PI * 2);
    ctx.arc(360, 65, 80, 0, Math.PI * 2);
    ctx.arc(490, 75, 90, 0, Math.PI * 2);
    ctx.fill();

    // Tree Trunks
    ctx.fillStyle = "#78350F";
    ctx.fillRect(55, 100, 28, 65);
    ctx.fillRect(185, 95, 34, 70);
    ctx.fillRect(345, 100, 30, 65);
    ctx.fillRect(475, 105, 32, 60);

    // Forest Floor with Moss & Leaves
    const ground = ctx.createLinearGradient(0, 160, 0, 270);
    ground.addColorStop(0, "#14532D");
    ground.addColorStop(1, "#052E16");
    ctx.fillStyle = ground;
    ctx.fillRect(0, 160, width, 110);
  } else if (b.includes("cave")) {
    // Cavern Ceiling & Rock Vaults
    const sky = ctx.createLinearGradient(0, 0, 0, 160);
    sky.addColorStop(0, "#0F172A");
    sky.addColorStop(1, "#1E293B");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, 160);

    // Stalactites Hanging from Ceiling
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    const stals = [[30, 65, 20], [80, 95, 26], [140, 55, 18], [210, 80, 22], [280, 110, 30], [350, 70, 20], [420, 90, 24], [480, 60, 18], [530, 85, 22]];
    for (const [sx, sh, sw] of stals) {
      ctx.moveTo(sx - sw / 2, 0);
      ctx.lineTo(sx, sh);
      ctx.lineTo(sx + sw / 2, 0);
    }
    ctx.fill();

    // Glowing Cyan & Purple Crystal Shards
    ctx.fillStyle = "#38BDF8";
    ctx.beginPath();
    ctx.moveTo(115, 140); ctx.lineTo(122, 115); ctx.lineTo(129, 140);
    ctx.moveTo(435, 135); ctx.lineTo(442, 108); ctx.lineTo(449, 135);
    ctx.fill();
    ctx.fillStyle = "#C084FC";
    ctx.beginPath();
    ctx.moveTo(250, 145); ctx.lineTo(256, 122); ctx.lineTo(262, 145);
    ctx.fill();

    // Cave Ground
    const ground = ctx.createLinearGradient(0, 160, 0, 270);
    ground.addColorStop(0, "#1E293B");
    ground.addColorStop(1, "#0B0F19");
    ctx.fillStyle = ground;
    ctx.fillRect(0, 160, width, 110);
  } else if (b.includes("sea")) {
    // Ocean Horizon & Coastal Sky
    const sky = ctx.createLinearGradient(0, 0, 0, 145);
    sky.addColorStop(0, "#0284C7");
    sky.addColorStop(0.7, "#38BDF8");
    sky.addColorStop(1, "#BAE6FD");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, 145);

    // Distant Tropical Island Silhouette
    ctx.fillStyle = "#0F766E";
    ctx.beginPath();
    ctx.ellipse(120, 145, 95, 20, 0, Math.PI, 0);
    ctx.ellipse(440, 145, 80, 16, 0, Math.PI, 0);
    ctx.fill();

    // Deep Ocean Water Gradient & Wave Lines (y: 145 ~ 270)
    const ground = ctx.createLinearGradient(0, 145, 0, 270);
    ground.addColorStop(0, "#0369A1");
    ground.addColorStop(0.5, "#0284C7");
    ground.addColorStop(1, "#0C4A6E");
    ctx.fillStyle = ground;
    ctx.fillRect(0, 145, width, 125);

    // White Wave Foam Lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 2;
    for (let wy = 160; wy < 270; wy += 22) {
      ctx.beginPath();
      for (let wx = 0; wx < width; wx += 40) {
        ctx.quadraticCurveTo(wx + 20, wy - 4, wx + 40, wy);
      }
      ctx.stroke();
    }
  } else if (b.includes("volcano")) {
    // Fiery Volcanic Sky with Ash & Smoke
    const sky = ctx.createLinearGradient(0, 0, 0, 160);
    sky.addColorStop(0, "#450A0A");
    sky.addColorStop(0.5, "#7F1D1D");
    sky.addColorStop(1, "#B91C1C");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, 160);

    // Jagged Obsidian Volcano Mountain Peaks
    ctx.fillStyle = "#1C1917";
    ctx.beginPath();
    ctx.moveTo(0, 160);
    ctx.lineTo(80, 80);
    ctx.lineTo(160, 130);
    ctx.lineTo(260, 60);
    ctx.lineTo(360, 125);
    ctx.lineTo(460, 70);
    ctx.lineTo(width, 150);
    ctx.lineTo(width, 160);
    ctx.closePath();
    ctx.fill();

    // Molten Lava Falls
    ctx.fillStyle = "#F97316";
    ctx.beginPath();
    ctx.moveTo(255, 75); ctx.lineTo(265, 75); ctx.lineTo(270, 160); ctx.lineTo(250, 160);
    ctx.fill();

    // Scorched Basalt Ground with Magma Glow Fissures
    const ground = ctx.createLinearGradient(0, 160, 0, 270);
    ground.addColorStop(0, "#292524");
    ground.addColorStop(1, "#0C0A09");
    ctx.fillStyle = ground;
    ctx.fillRect(0, 160, width, 110);

    // Glowing Orange Lava Cracks
    ctx.strokeStyle = "#EA580C";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(30, 210); ctx.lineTo(90, 225); ctx.lineTo(150, 215); ctx.lineTo(220, 240);
    ctx.moveTo(320, 220); ctx.lineTo(390, 205); ctx.lineTo(470, 235); ctx.lineTo(530, 220);
    ctx.stroke();
  } else if (b.includes("metropolis")) {
    // Cyberpunk Metropolis Skyline
    const sky = ctx.createLinearGradient(0, 0, 0, 160);
    sky.addColorStop(0, "#0F172A");
    sky.addColorStop(0.7, "#1E1B4B");
    sky.addColorStop(1, "#312E81");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, 160);

    // Neon Skyscrapers with Window Grids
    ctx.fillStyle = "#111827";
    ctx.fillRect(20, 40, 55, 120);
    ctx.fillRect(90, 20, 70, 140);
    ctx.fillRect(175, 55, 60, 105);
    ctx.fillRect(320, 30, 75, 130);
    ctx.fillRect(410, 50, 65, 110);
    ctx.fillRect(490, 25, 55, 135);

    // Cyber Window Lights
    ctx.fillStyle = "#38BDF8";
    for (let wy = 35; wy < 155; wy += 14) {
      ctx.fillRect(102, wy, 8, 5); ctx.fillRect(122, wy, 8, 5); ctx.fillRect(142, wy, 8, 5);
      ctx.fillRect(335, wy, 8, 5); ctx.fillRect(355, wy, 8, 5); ctx.fillRect(375, wy, 8, 5);
    }

    // High-tech Cyber Grid Floor
    const ground = ctx.createLinearGradient(0, 160, 0, 270);
    ground.addColorStop(0, "#1F2937");
    ground.addColorStop(1, "#030712");
    ctx.fillStyle = ground;
    ctx.fillRect(0, 160, width, 110);

    // Neon Cyan Floor Gridlines
    ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
    ctx.lineWidth = 1.5;
    for (let gy = 170; gy < 270; gy += 20) {
      ctx.beginPath();
      ctx.moveTo(0, gy); ctx.lineTo(width, gy);
      ctx.stroke();
    }
  } else if (b.includes("dojo")) {
    // Traditional Dojo Screen & Warm Lantern Horizon
    const sky = ctx.createLinearGradient(0, 0, 0, 160);
    sky.addColorStop(0, "#78350F");
    sky.addColorStop(0.6, "#9A3412");
    sky.addColorStop(1, "#D97706");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, 160);

    // Shoji Screen Wooden Framework
    ctx.fillStyle = "#451A03";
    ctx.fillRect(0, 50, width, 10);
    ctx.fillRect(0, 100, width, 10);
    for (let sx = 0; sx < width; sx += 55) {
      ctx.fillRect(sx, 0, 8, 160);
    }

    // Polished Wooden Floor
    const ground = ctx.createLinearGradient(0, 160, 0, 270);
    ground.addColorStop(0, "#92400E");
    ground.addColorStop(1, "#451A03");
    ctx.fillStyle = ground;
    ctx.fillRect(0, 160, width, 110);

    // Wood Floorboard Planks
    ctx.strokeStyle = "rgba(69, 26, 3, 0.6)";
    ctx.lineWidth = 2;
    for (let fy = 168; fy < 270; fy += 16) {
      ctx.beginPath();
      ctx.moveTo(0, fy); ctx.lineTo(width, fy);
      ctx.stroke();
    }
  } else {
    // Default / Plains / Grass: Scenic Rolling Hills & Open Sky
    const sky = ctx.createLinearGradient(0, 0, 0, 160);
    sky.addColorStop(0, "#38BDF8");
    sky.addColorStop(0.6, "#7DD3FC");
    sky.addColorStop(1, "#E0F2FE");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, 160);

    // Cumulus Pixel Clouds
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.beginPath();
    ctx.arc(120, 45, 28, 0, Math.PI * 2);
    ctx.arc(155, 38, 36, 0, Math.PI * 2);
    ctx.arc(190, 45, 26, 0, Math.PI * 2);
    ctx.arc(380, 40, 24, 0, Math.PI * 2);
    ctx.arc(410, 32, 32, 0, Math.PI * 2);
    ctx.arc(440, 40, 22, 0, Math.PI * 2);
    ctx.fill();

    // Distant Rolling Green Hills
    ctx.fillStyle = "#15803D";
    ctx.beginPath();
    ctx.ellipse(140, 160, 180, 45, 0, Math.PI, 0);
    ctx.ellipse(450, 160, 160, 40, 0, Math.PI, 0);
    ctx.fill();

    // Foreground Green Meadow
    const ground = ctx.createLinearGradient(0, 160, 0, 270);
    ground.addColorStop(0, "#22C55E");
    ground.addColorStop(1, "#15803D");
    ctx.fillStyle = ground;
    ctx.fillRect(0, 160, width, 110);
  }
}

function drawBattlePlatforms(ctx: any, biome: string) {
  const b = biome.toLowerCase();

  const getPlatformColors = () => {
    if (b.includes("cave")) return { top: "#475569", rim: "#334155", shadow: "rgba(15, 23, 42, 0.6)", border: "#94A3B8" };
    if (b.includes("forest")) return { top: "#166534", rim: "#14532D", shadow: "rgba(5, 46, 22, 0.6)", border: "#4ADE80" };
    if (b.includes("town")) return { top: "#64748B", rim: "#475569", shadow: "rgba(30, 41, 59, 0.5)", border: "#CBD5E1" };
    if (b.includes("sea")) return { top: "#FDE047", rim: "#CA8A04", shadow: "rgba(12, 74, 110, 0.6)", border: "#FEF08A" };
    if (b.includes("volcano")) return { top: "#44403C", rim: "#292524", shadow: "rgba(120, 53, 15, 0.7)", border: "#F97316" };
    if (b.includes("metropolis")) return { top: "#1E293B", rim: "#0F172A", shadow: "rgba(2, 6, 23, 0.7)", border: "#38BDF8" };
    if (b.includes("dojo")) return { top: "#B45309", rim: "#78350F", shadow: "rgba(69, 26, 3, 0.6)", border: "#FCD34D" };
    return { top: "#4ADE80", rim: "#16A34A", shadow: "rgba(20, 83, 45, 0.55)", border: "#86EFAC" };
  };

  const pCol = getPlatformColors();

  const draw3DPlatform = (cx: number, cy: number, rx: number, ry: number, extrude: number) => {
    // 1. Ground Drop Shadow
    ctx.fillStyle = pCol.shadow;
    ctx.beginPath();
    ctx.ellipse(cx, cy + extrude + 4, rx + 4, ry + 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. 3D Extrusion Rim Body
    ctx.fillStyle = pCol.rim;
    ctx.beginPath();
    ctx.ellipse(cx, cy + extrude, rx, ry, 0, 0, Math.PI);
    ctx.lineTo(cx - rx, cy);
    ctx.ellipse(cx, cy, rx, ry, 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.fill();

    // 3. Top Surface
    ctx.fillStyle = pCol.top;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Highlight Rim Stroke
    ctx.strokeStyle = pCol.border;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };

  // Draw Enemy Platform (extrude: 6)
  draw3DPlatform(415, 138, 78, 16, 6);

  // Draw Player Platform (extrude: 8)
  draw3DPlatform(145, 228, 85, 18, 8);
}

const arenaCache = new Map<string, { bg: Image | null; a: Image | null; b: Image | null }>();

export async function getArenaAssets(biomeName: string): Promise<{ bg: Image | null; a: Image | null; b: Image | null }> {
  let clean = (biomeName || "Town").toLowerCase().trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  if (clean === "grass") clean = "grass";
  if (clean === "plains") clean = "plains";
  if (clean === "sea" || clean === "ocean") clean = "sea";
  if (clean === "fairycave" || clean === "fairy_cave") clean = "fairy_cave";
  if (clean === "icecave" || clean === "ice_cave") clean = "ice_cave";
  if (clean === "powerplant" || clean === "power_plant") clean = "power_plant";
  if (clean === "snowyforest" || clean === "snowy_forest") clean = "snowy_forest";
  if (clean === "rocky_coast" || clean === "rockycoast") clean = "rockycoast";
  if (clean === "tallgrass" || clean === "tall_grass") clean = "tall_grass";
  if (clean === "constructionsite" || clean === "construction_site") clean = "construction_site";

  if (arenaCache.has(clean)) {
    return arenaCache.get(clean)!;
  }

  const baseUrl = "https://raw.githubusercontent.com/pagefaultgames/pokerogue-assets/beta/images/arenas";
  try {
    const [bg, a, b] = await Promise.all([
      loadImage(`${baseUrl}/${clean}_bg.png`).catch(() => loadImage(`${baseUrl}/town_bg.png`).catch(() => null)),
      loadImage(`${baseUrl}/${clean}_a.png`).catch(() => loadImage(`${baseUrl}/town_a.png`).catch(() => null)),
      loadImage(`${baseUrl}/${clean}_b.png`).catch(() => loadImage(`${baseUrl}/town_b.png`).catch(() => null)),
    ]);

    const result = { bg, a, b };
    arenaCache.set(clean, result);
    return result;
  } catch (err) {
    console.error(`[CANVAS] Failed to load arena assets for ${biomeName}:`, err);
    return { bg: null, a: null, b: null };
  }
}

export const BIOME_NAMES_KO: Record<string, string> = {
  town: "마을",
  plains: "평원",
  grass: "풀숲",
  forest: "숲",
  cave: "동굴",
  sea: "바다",
  metropolis: "대도시",
  dojo: "도장",
  volcano: "화산",
  mountain: "산",
  jungle: "정글",
  swamp: "늪지대",
  desert: "사막",
  "snowy forest": "설원",
  "power plant": "발전소",
  graveyard: "묘지",
  space: "우주",
  abyss: "심연",
};

/**
 * Formats money with compact units (k, M, B) for PokéRogue
 */
export function formatMoney(amount: number): string {
  const num = Math.floor(amount || 0);
  if (num < 1000) {
    return `P ${num}`;
  }
  if (num < 1_000_000) {
    const kVal = num / 1000;
    const formatted = kVal >= 100 ? Math.floor(kVal) : (kVal % 1 === 0 ? kVal.toFixed(0) : kVal.toFixed(1).replace(/\.0$/, ""));
    return `P ${formatted}k`;
  }
  if (num < 1_000_000_000) {
    const mVal = num / 1_000_000;
    const formatted = mVal >= 100 ? Math.floor(mVal) : (mVal % 1 === 0 ? mVal.toFixed(0) : mVal.toFixed(1).replace(/\.0$/, ""));
    return `P ${formatted}M`;
  }
  const bVal = num / 1_000_000_000;
  const formatted = bVal >= 100 ? Math.floor(bVal) : (bVal % 1 === 0 ? bVal.toFixed(0) : bVal.toFixed(1).replace(/\.0$/, ""));
  return `P ${formatted}B`;
}

/**
 * Splits and wraps dialogue text into clean lines fitting within maxWidth
 */
export function wrapDialogueText(ctx: any, text: string, maxWidth: number): string[] {
  const rawLines = text.split("\n");
  const wrapped: string[] = [];

  for (const raw of rawLines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    if (ctx.measureText(trimmed).width <= maxWidth) {
      wrapped.push(trimmed);
      continue;
    }

    const words = trimmed.split(" ");
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) wrapped.push(currentLine);
        if (ctx.measureText(word).width > maxWidth) {
          let charLine = "";
          for (const char of word) {
            if (ctx.measureText(charLine + char).width <= maxWidth) {
              charLine += char;
            } else {
              wrapped.push(charLine);
              charLine = char;
            }
          }
          currentLine = charLine;
        } else {
          currentLine = word;
        }
      }
    }
    if (currentLine) wrapped.push(currentLine);
  }

  return wrapped;
}

/**
 * Renders the Authentic PokéRogue Battle Screen (560x380) with 2x SuperSampling
 */
export async function renderBattleScreen(options: BattleScreenOptions): Promise<Buffer> {
  const width = 560;
  const height = 380;
  const scale = 2;
  const canvas = createCanvas(width * scale, height * scale);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  ctx.imageSmoothingEnabled = false;

  const isKo = options.lang === "ko";
  const battle = options.battle;
  const enemy = battle.enemy;
  const playerParty = battle.playerParty || [];
  const playerMon = (battle as any).playerBattleMon || playerParty[battle.playerActiveIndex] || playerParty[0] || {
    speciesId: "bulbasaur",
    name: "이상해씨",
    level: 5,
    hp: 20,
    maxHp: 20,
  };

  // 1. Draw Official PokéRogue Arena Background & Preload Authentic HUD Sprites
  const [arena, pbAssets] = await Promise.all([
    getArenaAssets(battle.biome || "Town"),
    getPbInfoAssets(),
  ]);
  if (arena.bg) {
    ctx.drawImage(arena.bg, 0, 0, width, height);
  } else {
    drawBiomeBackground(ctx, width, battle.biome || "Town");
  }

  // 2. Draw Official PokéRogue 3D Platforms using BATTLE_LAYOUT_CONFIG
  const ep = BATTLE_LAYOUT_CONFIG.enemyPlatform;
  const pp = BATTLE_LAYOUT_CONFIG.playerPlatform;
  const enemyPlatW = 320 * ep.scale;
  const enemyPlatH = 132 * ep.scale;
  const playerPlatW = 320 * pp.scale;
  const playerPlatH = 132 * pp.scale;

  if (arena.b) {
    // Enemy Platform (Top-Right)
    ctx.drawImage(arena.b, ep.x, ep.y, enemyPlatW, enemyPlatH);

    // Player Platform (Foreground Bottom-Left, mirrored)
    ctx.save();
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(arena.b, pp.x, pp.y, playerPlatW, playerPlatH);
    ctx.restore();
  } else if (arena.a) {
    ctx.drawImage(arena.a, 0, 48 * (275 / 180), width, enemyPlatH);
  } else {
    drawBattlePlatforms(ctx, battle.biome || "Town");
  }

  // 3. Preload & Draw Pokémon Sprites (Transform, Illusion, and Accurate Shiny Tier Front & Back support)
  const enemyActiveSpecies = (enemy as any).isTransformed ? ((enemy as any).transformedSpeciesId || enemy.speciesId) : enemy.speciesId;
  const playerActiveSpecies = (playerMon as any).isTransformed
    ? ((playerMon as any).transformedSpeciesId || playerMon.speciesId)
    : ((playerMon as any).hasIllusion && (playerMon as any).illusionTarget ? (playerMon as any).illusionTarget.speciesId : playerMon.speciesId);

  const enemyShinyTier = (enemy as any).shinyTier !== undefined
    ? (enemy as any).shinyTier
    : (enemy.isShiny ? 1 : 0);

  const playerShinyTier = ((playerMon as any).hasIllusion && (playerMon as any).illusionTarget)
    ? ((playerMon as any).illusionTarget.shinyTier !== undefined ? (playerMon as any).illusionTarget.shinyTier : ((playerMon as any).illusionTarget.isShiny ? 1 : 0))
    : ((playerMon as any).shinyTier !== undefined ? (playerMon as any).shinyTier : ((playerMon as any).isShiny ? 1 : 0));

  const playerIsShiny = playerShinyTier > 0;
  const enemyIsShiny = enemyShinyTier > 0;

  const [enemySprite, playerSprite] = await Promise.all([
    getPokemonSprite(enemyActiveSpecies, true, enemyShinyTier, false),
    getPokemonSprite(playerActiveSpecies, true, playerShinyTier, true),
  ]);

  // Draw Battler Sprites & Shadows using BATTLE_LAYOUT_CONFIG
  const em = BATTLE_LAYOUT_CONFIG.enemyPokemon;
  const pm = BATTLE_LAYOUT_CONFIG.playerPokemon;

  // 4. Draw Pokémon Silhouette Shadows (cast onto platform ground)
  if (enemySprite && (battle.phase !== "VICTORY" || enemy.hp > 0)) {
    drawPokemonSilhouetteShadow(ctx, enemySprite, em.x, em.y, em.size, false, 0.42);
  }
  if (playerSprite) {
    drawPokemonSilhouetteShadow(ctx, playerSprite, pm.x, pm.y, pm.size, true, 0.42);
  }

  // On VICTORY screen, fainted enemy is gone (empty platform)
  if (enemySprite && (battle.phase !== "VICTORY" || enemy.hp > 0)) {
    drawFittedBattleSprite(ctx, enemySprite, em.x, em.y, em.size);
  }

  if (playerSprite) {
    drawFittedBattleSprite(ctx, playerSprite, pm.x, pm.y, pm.size);
  }

  // 4.5. Draw PokéRogue Authentic Move Effect (only during active turn, never on VICTORY/DEFEAT/MENU screens)
  if (battle.lastMoveEffect && battle.phase === "MAIN") {
    renderMoveEffect(ctx, battle.lastMoveEffect);
  }

  // 5. Top Right: Biome - Wave, Money & Weather
  const rawBiome = battle.biome || "Town";
  const biomeDisplay = isKo ? (BIOME_NAMES_KO[rawBiome.toLowerCase()] || rawBiome) : rawBiome;
  const waveText = `${biomeDisplay} - ${battle.wave || 1}`;
  const moneyText = formatMoney(battle.money || 0);

  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  const textX = width - 24;

  // 1) Biome - Wave (White text with dark outline)
  const waveY = 14;
  ctx.font = "bold 15px DungGeunMo";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
  ctx.lineWidth = 3.5;
  ctx.lineJoin = "round";
  ctx.strokeText(waveText, textX, waveY);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(waveText, textX, waveY);

  // 2) Money right below Biome (Gold yellow text with dark outline)
  const moneyY = waveY + 20;
  ctx.font = "bold 13px DungGeunMo";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
  ctx.lineWidth = 3.0;
  ctx.strokeText(moneyText, textX, moneyY);
  ctx.fillStyle = "#FDE047";
  ctx.fillText(moneyText, textX, moneyY);

  // 3) Weather text right below Money (Thematic color with dark outline)
  if (battle.weather) {
    const wType = battle.weather;
    const wConfig: Record<string, { labelKo: string; labelEn: string; color: string }> = {
      sun: { labelKo: "쾌청", labelEn: "SUN", color: "#FB923C" },
      rain: { labelKo: "비바라기", labelEn: "RAIN", color: "#60A5FA" },
      sand: { labelKo: "모래바람", labelEn: "SAND", color: "#FBBF24" },
      snow: { labelKo: "설경", labelEn: "SNOW", color: "#BAE6FD" },
    };
    const cfg = wConfig[wType] || wConfig.sun;
    const turnsStr = battle.weatherTurns ? ` ${battle.weatherTurns}${isKo ? "턴" : "T"}` : "";
    const weatherText = `${isKo ? cfg.labelKo : cfg.labelEn}${turnsStr}`;

    const weatherY = moneyY + 18;
    ctx.font = "bold 13px DungGeunMo";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
    ctx.lineWidth = 3.0;
    ctx.strokeText(weatherText, textX, weatherY);
    ctx.fillStyle = cfg.color;
    ctx.fillText(weatherText, textX, weatherY);
  }

  const getStatusBadge = (mon: any) => {
    if (mon.status === "par") return isKo ? " [마비]" : " [PAR]";
    if (mon.status === "brn") return isKo ? " [화상]" : " [BRN]";
    if (mon.status === "slp") return isKo ? " [수면]" : " [SLP]";
    if (mon.status === "psn" || mon.status === "tox") return isKo ? " [독]" : " [PSN]";
    if (mon.status === "frz") return isKo ? " [빙결]" : " [FRZ]";
    if (mon.substituteHp && mon.substituteHp > 0) return isKo ? " [대타]" : " [SUB]";
    return "";
  };

  // 6. Draw Authentic PokéRogue Enemy HUD Box
  const eh = BATTLE_LAYOUT_CONFIG.enemyHud;
  const enemyHudY = eh.y;
  let cleanEnemyName = getPokemonDisplayName(enemy, isKo).replace(/[^\w\s가-힣0-9\(\)\-\.]/g, "").trim();
  const enemySpeciesData = POKEMON_SPECIES_DATA[enemy.speciesId] || POKEMON_SPECIES_DATA[enemyActiveSpecies] || null;
  const enemyTypes = enemy.types || (enemySpeciesData ? enemySpeciesData.types : ["normal"]);

  drawPokeRogueBattleHud(ctx, {
    x: eh.x,
    y: enemyHudY,
    w: eh.w,
    h: eh.h,
    name: cleanEnemyName,
    level: enemy.level,
    hp: enemy.hp,
    maxHp: enemy.maxHp,
    isEnemy: true,
    types: enemyTypes,
    isBoss: enemy.isBoss,
    bossShields: enemy.bossShields,
    statusBadge: getStatusBadge(enemy),
    isKo,
    hudImage: enemy.isBoss ? pbAssets.bossBox : pbAssets.enemyBox,
    hpLabel: pbAssets.hpLabel,
  });

  // 7. Draw Authentic PokéRogue Player HUD Box
  const ph = BATTLE_LAYOUT_CONFIG.playerHud;
  const illusionMon = (playerMon as any).hasIllusion && (playerMon as any).illusionTarget
    ? (playerMon as any).illusionTarget
    : playerMon;
  let cleanPlayerName = getPokemonDisplayName(illusionMon, isKo).replace(/[^\w\s가-힣0-9\(\)\-\.]/g, "").trim();
  const playerSpeciesData = POKEMON_SPECIES_DATA[playerMon.speciesId] || POKEMON_SPECIES_DATA[playerActiveSpecies] || null;
  const playerTypes = playerMon.types || (playerSpeciesData ? playerSpeciesData.types : ["normal"]);

  drawPokeRogueBattleHud(ctx, {
    x: ph.x,
    y: ph.y,
    w: ph.w,
    h: ph.h,
    name: cleanPlayerName,
    level: playerMon.level,
    hp: playerMon.hp,
    maxHp: playerMon.maxHp,
    isEnemy: false,
    types: playerTypes,
    statusBadge: getStatusBadge(playerMon),
    exp: battle.playerExp || 0,
    maxExp: battle.playerMaxExp || 100,
    isKo,
    hudImage: pbAssets.playerBox,
    hpLabel: pbAssets.hpLabel,
  });



/**
 * Draws the 2x2 Battle Move Cards Grid during FIGHT phase
 */
function drawBattleFightMovesGrid(ctx: any, combatMon: any, isKo: boolean, categoriesSprite?: any) {
  const boxY = 270;
  const colW = 264;
  const rowH = 47;
  const startX = 12;
  const startY = boxY + 5;
  const gapX = 8;
  const gapY = 6;

  const moves: string[] = (combatMon?.moves && combatMon.moves.length > 0)
    ? combatMon.moves
    : ["Tackle", "Growl"];
  const movePps: number[] = combatMon?.movePps || [];

  for (let i = 0; i < 4; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cX = startX + col * (colW + gapX);
    const cY = startY + row * (rowH + gapY);

    const mKey = moves[i];
    const cleanKey = mKey ? mKey.toLowerCase().replace(/[\s_]+/g, "-") : null;
    const mData = cleanKey ? MOVES_DATA[cleanKey] || { name: mKey, nameKo: mKey, type: "normal", power: 40, accuracy: 100, pp: 35, category: "physical" as const, id: 0, description: "" } : null;

    if (!mData) {
      // Empty slot card
      ctx.fillStyle = "rgba(19, 25, 36, 0.6)";
      ctx.beginPath();
      ctx.roundRect(cX, cY, colW, rowH, 4);
      ctx.fill();
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#64748B";
      ctx.font = "12px DungGeunMo";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(isKo ? "- 기술 없음 -" : "- Empty -", cX + colW / 2, cY + rowH / 2);
      continue;
    }

    const typeColor = TYPE_COLORS[mData.type?.toLowerCase()] || "#A8A77A";
    const typeLabel = isKo ? (TYPE_NAMES_KO[mData.type?.toLowerCase()] || mData.type) : (mData.type || "NORMAL").toUpperCase();

    // Card background
    ctx.fillStyle = "#18202F";
    ctx.beginPath();
    ctx.roundRect(cX, cY, colW, rowH, 4);
    ctx.fill();

    // Card border
    ctx.strokeStyle = typeColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Left Type color strip
    ctx.fillStyle = typeColor;
    ctx.beginPath();
    ctx.roundRect(cX, cY, 4, rowH, [4, 0, 0, 4]);
    ctx.fill();

    // 1. Move Name (e.g. "1. 몸통박치기")
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = "bold 13px DungGeunMo";
    ctx.fillStyle = "#FFFFFF";
    const moveName = `${i + 1}. ${isKo ? mData.nameKo : (mData.name ? mData.name.charAt(0).toUpperCase() + mData.name.slice(1).replace(/-/g, " ") : mKey)}`;
    ctx.fillText(moveName, cX + 10, cY + 14);

    // 2. Type Badge (Upper Right)
    const badgeW = isKo ? 32 : 38;
    const badgeH = 14;
    const badgeX = cX + colW - badgeW - 6;
    const badgeY = cY + 7;
    ctx.fillStyle = typeColor;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 3);
    ctx.fill();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 10px DungGeunMo";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(typeLabel, badgeX + badgeW / 2, badgeY + badgeH / 2 + 0.5);

    // 3. Official Category Icon (Physical / Special / Status)
    if (categoriesSprite) {
      const catSx = mData.category === "special" ? 28 : (mData.category === "status" ? 56 : 0);
      const iconW = 28 * 1.25; // 35px
      const iconH = 11 * 1.25; // 13.75px
      const iconX = badgeX - iconW - 5;
      const iconY = cY + 7;
      ctx.drawImage(categoriesSprite, catSx, 0, 28, 11, iconX, iconY, iconW, iconH);
    } else {
      const catColor = mData.category === "special" ? "#3B82F6" : mData.category === "status" ? "#64748B" : "#E11D48";
      const catLabel = isKo
        ? (mData.category === "special" ? "특수" : mData.category === "status" ? "변화" : "물리")
        : (mData.category === "special" ? "SPEC" : mData.category === "status" ? "STAT" : "PHYS");
      const catBadgeW = isKo ? 28 : 32;
      const catBadgeX = badgeX - catBadgeW - 4;
      ctx.fillStyle = catColor;
      ctx.beginPath();
      ctx.roundRect(catBadgeX, badgeY, catBadgeW, badgeH, 3);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(catLabel, catBadgeX + catBadgeW / 2, badgeY + badgeH / 2 + 0.5);
    }

    // 4. Bottom Line: Power / Accuracy / PP
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = "11px DungGeunMo";
    ctx.fillStyle = "#94A3B8";

    const powStr = isKo ? `위력 ${mData.power !== null ? mData.power : "--"}` : `Pow ${mData.power !== null ? mData.power : "--"}`;
    const accStr = isKo ? `명중 ${mData.accuracy !== null ? mData.accuracy : "--"}` : `Acc ${mData.accuracy !== null ? mData.accuracy : "--"}`;
    ctx.fillText(`${powStr}  ${accStr}`, cX + 10, cY + 33);

    // PP on bottom right (Default: White, Low: Yellow, Almost empty/0: Red)
    const curPp = (movePps && movePps[i] !== undefined) ? movePps[i] : mData.pp;
    const maxPp = mData.pp;
    const ppRatio = maxPp > 0 ? (curPp / maxPp) : 1;
    const ppColor = (curPp === 0 || ppRatio <= 0.15)
      ? "#EF4444" // 빨간색 (거의 없거나 0)
      : ppRatio <= 0.4
      ? "#F59E0B" // 노란색 (부족할 때)
      : "#FFFFFF"; // 흰색 (기본)

    ctx.textAlign = "right";
    ctx.font = "bold 11px DungGeunMo";
    ctx.fillStyle = ppColor;
    ctx.fillText(`PP ${curPp}/${maxPp}`, cX + colW - 8, cY + 33);
  }
}

  // 8. Bottom Dialogue & Command Box (Full Width 100%: x 0, y 270, w 560, h 110)
  const boxY = 270;
  const boxH = height - boxY;

  // Authentic Gen 5 Translucent Glass Gradient
  const glassGrad = ctx.createLinearGradient(0, boxY, 0, height);
  glassGrad.addColorStop(0, "rgba(10, 16, 26, 0.58)");
  glassGrad.addColorStop(1, "rgba(6, 10, 18, 0.68)");
  ctx.fillStyle = glassGrad;
  ctx.fillRect(0, boxY, width, boxH);

  if (battle.phase === "VICTORY" || battle.phase === "DEFEAT") {
    ctx.strokeStyle = battle.phase === "VICTORY" ? "#22C55E" : "#EF4444";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, boxY);
    ctx.lineTo(width, boxY);
    ctx.stroke();
  }

  if (battle.phase === "FIGHT") {
    // ⚔️ Render 2x2 Battle Move Cards Grid during FIGHT phase
    drawBattleFightMovesGrid(ctx, playerMon, isKo, pbAssets.categories);
  } else {
    // Dialogue Text with outline for maximum legibility over translucent background
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = "bold 15px DungGeunMo";

    const pDisplayName = getPokemonDisplayName(playerMon, isKo);
    const defaultDialogue = isKo
      ? `${pDisplayName}(은)는 무엇을 할까?`
      : `What will ${pDisplayName} do?`;
    const fullText = (battle.dialogueText || defaultDialogue).replace(/\\n/g, "\n");
    const wrapped = wrapDialogueText(ctx, fullText, width - 48);
    const linesToShow = wrapped.length > 3 ? wrapped.slice(-3) : wrapped;

    linesToShow.forEach((line: string, lIdx: number) => {
      const textY = boxY + 16 + lIdx * 26;
      ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
      ctx.lineWidth = 3.5;
      ctx.strokeText(line, 24, textY);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(line, 24, textY);
    });
  }

  // In-Game Message Modal overlay
  if (options.inGameMessage) {
    drawInGameMessageBox(ctx, width, height, options.inGameMessage, isKo);
  }

  return canvas.toBuffer("image/png");
}

