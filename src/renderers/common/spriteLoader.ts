import { createCanvas, loadImage, Image } from "@napi-rs/canvas";
import { POKEMON_SPECIES_DATA } from "../../data/pokemonStats.js";
import { STARTER_DATABASE } from "../../data/starterCosts.js";
import { POKEMON_NAMES_KO } from "../../data/pokemonNamesKo.js";

const KO_NAME_TO_DEX = new Map<string, number>();
for (const [dex, nameKo] of Object.entries(POKEMON_NAMES_KO)) {
  KO_NAME_TO_DEX.set(nameKo.trim(), parseInt(dex, 10));
}

const spriteCache = new Map<string, Image>();

/**
 * Helper to fetch a static pixel sprite from Showdown CDN / PokeRogue CDN with in-memory caching
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
    else if (clean.startsWith("tatsugiri")) clean = "tatsugiri";
    else if (clean.startsWith("squawkabilly")) clean = "squawkabilly";
    else if (clean.startsWith("dudunsparce")) clean = "dudunsparce";
    else if (clean.startsWith("palafin")) clean = "palafin";
    else if (clean.startsWith("maushold")) clean = "maushold";
    else if (clean.startsWith("necrozma")) clean = "necrozma";
    else if (clean.startsWith("calyrex")) clean = "calyrex";
    else if (clean.startsWith("rotom")) {
      if (clean === "rotom-heat") clean = "rotom-heat";
      else if (clean === "rotom-wash") clean = "rotom-wash";
      else if (clean === "rotom-frost") clean = "rotom-frost";
      else if (clean === "rotom-fan") clean = "rotom-fan";
      else if (clean === "rotom-mow") clean = "rotom-mow";
      else clean = "rotom";
    }

    const tier = typeof isShiny === "number" ? isShiny : (isShiny ? 1 : 0);
    const cacheKey = `${clean}_${tier}_${isBack ? "b" : "f"}`;
    if (spriteCache.has(cacheKey)) {
      return spriteCache.get(cacheKey)!;
    }

    if (!allowFetch) return null;

    // 1. Resolve Dex number
    const isTestSubject = clean.startsWith("testsubject");
    let lookupKey = isTestSubject ? "ditto" : clean;

    let dexNo: number | null = null;
    if (isTestSubject) {
      dexNo = 132;
    } else if (/^\d+$/.test(clean)) {
      dexNo = parseInt(clean, 10);
    } else if (KO_NAME_TO_DEX.has(pokemonName.trim())) {
      dexNo = KO_NAME_TO_DEX.get(pokemonName.trim())!;
    } else {
      const spec = POKEMON_SPECIES_DATA[clean] || POKEMON_SPECIES_DATA[clean.replace(/[-_ ]/g, "")];
      if (spec && spec.num > 0) {
        dexNo = spec.num;
      } else {
        const matchStarter = STARTER_DATABASE.find(
          (s) => s.speciesId.toLowerCase() === clean || s.name.toLowerCase() === clean || s.nameKo === pokemonName.trim()
        );
        if (matchStarter && matchStarter.dexNumber > 0) dexNo = matchStarter.dexNumber;
      }
    }

    let img: any | null = null;

    // 2. Resolve Form Suffix for special variants (Mega, G-Max, Regional Forms)
    let formSuffix = "";
    if (clean.includes("mega-x") || clean.includes("megax")) formSuffix = "-mega-x";
    else if (clean.includes("mega-y") || clean.includes("megay")) formSuffix = "-mega-y";
    else if (clean.includes("mega")) formSuffix = "-mega";
    else if (clean.includes("gmax") || clean.includes("gigantamax")) formSuffix = "-gmax";
    else if (clean.includes("alola")) formSuffix = "-alola";
    else if (clean.includes("galar")) formSuffix = "-galar";
    else if (clean.includes("hisui")) formSuffix = "-hisui";
    else if (clean.includes("paldea")) formSuffix = "-paldea";

    // 3. Primary Source: Official PokéRogue Extracted Assets (Front & Back sprites with Tier 0~3)
    if (dexNo) {
      const suffix = isBack ? "b" : "";
      const candidateRogueUrls = [
        `https://raw.githubusercontent.com/Sandstormer/PokeRogue-Dex/main/images/${dexNo}${formSuffix}_${tier}${suffix}.png`,
        `https://raw.githubusercontent.com/Sandstormer/PokeRogue-Dex/main/images/${dexNo}_${tier}${suffix}.png`
      ];

      for (const rogueUrl of candidateRogueUrls) {
        if (img) break;
        try {
          img = await loadImage(rogueUrl);
        } catch {}
      }

      if (!img && tier > 0) {
        const fallbackUrls = [
          `https://raw.githubusercontent.com/Sandstormer/PokeRogue-Dex/main/images/${dexNo}${formSuffix}_1${suffix}.png`,
          `https://raw.githubusercontent.com/Sandstormer/PokeRogue-Dex/main/images/${dexNo}_1${suffix}.png`,
          `https://raw.githubusercontent.com/Sandstormer/PokeRogue-Dex/main/images/${dexNo}${formSuffix}_0${suffix}.png`,
          `https://raw.githubusercontent.com/Sandstormer/PokeRogue-Dex/main/images/${dexNo}_0${suffix}.png`
        ];
        for (const fUrl of fallbackUrls) {
          if (img) break;
          try {
            img = await loadImage(fUrl);
          } catch {}
        }
      }
    }

    // 4. Secondary Fallback Source: Showdown CDN
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
    }

    if (img) {
      if (isTestSubject) {
        img = applyWhiteDittoVariant(img, tier);
      }

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

      if (lum < 60) {
        data[i] = Math.round(r * 0.35);
        data[i + 1] = Math.round(g * 0.35);
        data[i + 2] = Math.round(b * 0.35);
      } else {
        const norm = Math.max(0, Math.min(1, (lum - 60) / (255 - 60)));
        const whiteLum = Math.round(195 + norm * 60);

        if (tier === 3) {
          data[i] = Math.min(255, Math.round(whiteLum * 1.0));
          data[i + 1] = Math.min(255, Math.round(whiteLum * 0.93));
          data[i + 2] = Math.min(255, Math.round(whiteLum * 0.95));
        } else if (tier === 2) {
          data[i] = Math.min(255, Math.round(whiteLum * 0.94));
          data[i + 1] = Math.min(255, Math.round(whiteLum * 0.97));
          data[i + 2] = Math.min(255, whiteLum);
        } else if (tier === 1) {
          data[i] = Math.min(255, whiteLum);
          data[i + 1] = Math.min(255, Math.round(whiteLum * 0.99));
          data[i + 2] = Math.min(255, Math.round(whiteLum * 0.94));
        } else {
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



export function isSpriteCached(pokemonName: string): boolean {
  let clean = pokemonName.toLowerCase().trim();
  clean = clean.replace(/[^a-z0-9]/g, "");
  return spriteCache.has(clean);
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
    const skewX = isPlayer ? -0.62 : -0.65;
    const scaleY = isPlayer ? 0.36 : 0.38;
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
