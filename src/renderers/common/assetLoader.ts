import { loadImage, Image } from "@napi-rs/canvas";
import { PbInfoAssets } from "../types.js";

let cachedLogo: Image | null = null;

export async function getLogoImage(): Promise<Image | null> {
  if (cachedLogo) return cachedLogo;
  try {
    cachedLogo = await loadImage("https://pokerogue.net/images/logo.png");
    return cachedLogo;
  } catch (err) {
    console.error("[CANVAS] Failed to load remote logo:", err);
    return null;
  }
}

export const POKEROGUE_TYPE_COLORS: Record<string, string> = {
  normal: "#A8A77A", fire: "#EE8130", water: "#6390F0", electric: "#F7D02C",
  grass: "#7AC74C", ice: "#51C4D3", fighting: "#C22E28", poison: "#A33EA1",
  ground: "#E2BF65", flying: "#89CFF0", psychic: "#F95587", bug: "#A6B91A",
  rock: "#B6A136", ghost: "#735797", dragon: "#6F35FC", dark: "#705746",
  steel: "#B7B7CE", fairy: "#D685AD"
};

export const TYPE_COLORS: Record<string, string> = {
  normal: "#929DA3", fire: "#EE8130", water: "#6390F0", grass: "#7AC74C",
  electric: "#F7D02C", ice: "#51C4D3", fighting: "#C22E28", poison: "#A33EA1",
  ground: "#E2BF65", flying: "#89CFF0", psychic: "#F95587", bug: "#A6B91A",
  rock: "#B6A136", ghost: "#735797", dragon: "#6F35FC", steel: "#B7B7CE",
  fairy: "#D685AD", dark: "#705746",
};

export const TYPE_NAMES_KO: Record<string, string> = {
  normal: "노말", fire: "불꽃", water: "물", grass: "풀",
  electric: "전기", ice: "얼음", fighting: "격투", poison: "독",
  ground: "땅", flying: "비행", psychic: "에스퍼", bug: "벌레",
  rock: "바위", ghost: "고스트", dragon: "드래곤", steel: "강철",
  fairy: "페어리", dark: "악",
};

export const BIOME_NAMES_KO: Record<string, string> = {
  town: "마을", plains: "평원", grass: "풀숲", forest: "숲",
  cave: "동굴", sea: "바다", metropolis: "대도시", dojo: "도장",
  volcano: "화산", mountain: "산", jungle: "정글", swamp: "늪지대",
  desert: "사막", "snowy forest": "설원", "power plant": "발전소",
  graveyard: "묘지", space: "우주", abyss: "심연",
};

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
