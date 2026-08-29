export interface DexPokemonInfo {
  dexNumber: number;
  speciesId: string;
  name: string;
  koreanName?: string;
  types: string[];
  abilities?: string[];
  primaryAbility?: string;
  hiddenAbility?: string;
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
}

const dexCache = new Map<number, DexPokemonInfo>();
const nameCache = new Map<string, DexPokemonInfo>();

// Reverse dictionary for fast Korean name lookup by Dex Number
const DEX_TO_KOREAN_DICT: Record<number, string> = {};

// Common / Popular Korean Pokemon name to Dex Number mappings
const KOREAN_POKEMON_DICT: Record<string, number> = {
  // Starters & Requested Pokemon
  "샤미드": 134,
  "루카리오": 448,
  "이어롭": 428,
  "이상해씨": 1,
  "이상해풀": 2,
  "이상해꽃": 3,
  "파이리": 4,
  "리자드": 5,
  "리자몽": 6,
  "꼬부기": 7,
  "어니부기": 8,
  "거북왕": 9,
  "캐터피": 10,
  "단데기": 11,
  "버터플": 12,
  "뿔충이": 13,
  "딱충이": 14,
  "독침붕": 15,
  "구구": 16,
  "피죤": 17,
  "피죤투": 18,
  "꼬렛": 19,
  "레트라": 20,
  "깨비참": 21,
  "깨비드릴조": 22,
  "아보": 23,
  "아보크": 24,
  "피카츄": 25,
  "라이츄": 26,
  "모래두지": 27,
  "고지": 28,
  "니드런♀": 29,
  "니드런(암)": 29,
  "니드런암": 29,
  "니드리나": 30,
  "니드퀸": 31,
  "니드런♂": 32,
  "니드런(수)": 32,
  "니드런수": 32,
  "니드리노": 33,
  "니드킹": 34,
  "삐삐": 35,
  "픽시": 36,
  "식스테일": 37,
  "나인테일": 38,
  "푸린": 39,
  "푸크린": 40,
  "이브이": 133,
  "부스터": 136,
  "쥬피썬더": 135,
  "에브이": 196,
  "블래키": 197,
  "리피아": 470,
  "글레이시아": 471,
  "님피아": 700,
  "팬텀": 94,
  "망나뇽": 149,
  "뮤츠": 150,
  "뮤": 151,
  "마임맨": 122,
  "칠색조": 250,
  "흉내내": 439,
  "폴리곤Z": 474,
  "치코리타": 152,
  "브케인": 155,
  "리어코": 158,
  "가디안": 282,
  "엘레이드": 475,
  "나무지기": 252,
  "아차모": 255,
  "물짱이": 258,
  "그란돈": 383,
  "가이오가": 382,
  "레쿠쟈": 384,
  "모부기": 387,
  "불꽃숭이": 390,
  "팽도리": 393,
  "다크라이": 491,
  "아르세우스": 493,
  "디아루가": 483,
  "펄기아": 484,
  "기라티나": 487,
  "주리비얀": 495,
  "뚜꾸리": 498,
  "수댕이": 501,
  "조로아크": 571,
  "개구마르": 656,
  "개굴닌자": 658,
  "냐오닉스": 678,
  "킬가르도": 681,
  "호바귀": 710,
  "펌킨인": 711,
  "지가르데": 718,
  "나몰빼미": 722,
  "따라큐": 778,
  "흥나숭": 810,
  "염버니": 813,
  "울머기": 816,
  "나오하": 906,
  "뜨아거": 909,
  "꾸왁스": 912,
  "코라이돈": 1007,
  "미라이돈": 1008,
  "오거폰": 1017,
  "테라파고스": 1024,
  "복숭악귀": 1025,
};

// Build reverse dictionary
for (const [kName, dNo] of Object.entries(KOREAN_POKEMON_DICT)) {
  if (!DEX_TO_KOREAN_DICT[dNo]) {
    DEX_TO_KOREAN_DICT[dNo] = kName;
  }
}

/**
 * Fetches Pokémon data by National Pokédex number (1 ~ 1025)
 */
export async function getPokemonByDexNumber(dexNo: number): Promise<DexPokemonInfo | null> {
  if (dexNo < 1 || dexNo > 1025) return null;
  if (dexCache.has(dexNo)) return dexCache.get(dexNo)!;

  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${dexNo}`);
    if (!res.ok) return null;

    const data: any = await res.json();
    const speciesId = data.name.toLowerCase();

    // Pretty English Formatted Name
    let formattedName = data.name.charAt(0).toUpperCase() + data.name.slice(1);
    if (speciesId === "nidoran-f") formattedName = "Nidoran ♀";
    else if (speciesId === "nidoran-m") formattedName = "Nidoran ♂";
    else if (speciesId === "mr-mime") formattedName = "Mr. Mime";
    else if (speciesId === "mime-jr") formattedName = "Mime Jr.";
    else if (speciesId === "mr-rime") formattedName = "Mr. Rime";
    else if (speciesId === "ho-oh") formattedName = "Ho-Oh";
    else if (speciesId === "porygon-z") formattedName = "Porygon-Z";
    else if (speciesId === "type-null") formattedName = "Type: Null";
    else if (speciesId === "aegislash-shield" || speciesId === "aegislash-blade") formattedName = "Aegislash";
    else if (speciesId === "meowstic-male" || speciesId === "meowstic-female") formattedName = "Meowstic";
    else if (speciesId === "pumpkaboo-average") formattedName = "Pumpkaboo";
    else if (speciesId === "gourgeist-average") formattedName = "Gourgeist";
    else if (speciesId === "zygarde-50") formattedName = "Zygarde";
    else if (speciesId.startsWith("tapu-")) formattedName = "Tapu " + speciesId.split("-")[1].charAt(0).toUpperCase() + speciesId.split("-")[1].slice(1);
    else if (speciesId.includes("-")) {
      const basePart = speciesId.split("-")[0];
      formattedName = basePart.charAt(0).toUpperCase() + basePart.slice(1);
    }
    const types = data.types.map((t: any) => t.type.name);

    const regularAbilities: string[] = [];
    let hiddenAbility: string | undefined;

    for (const a of data.abilities || []) {
      const formatted = a.ability.name.charAt(0).toUpperCase() + a.ability.name.slice(1).replace(/-/g, " ");
      if (a.is_hidden) {
        hiddenAbility = formatted;
      } else {
        regularAbilities.push(formatted);
      }
    }
    const primaryAbility = regularAbilities.join(" / ") || "None";

    const getStat = (name: string) => data.stats.find((s: any) => s.stat.name === name)?.base_stat || 50;

    const hp = getStat("hp");
    const attack = getStat("attack");
    const defense = getStat("defense");
    const spAttack = getStat("special-attack");
    const spDefense = getStat("special-defense");
    const speed = getStat("speed");

    const info: DexPokemonInfo = {
      dexNumber: dexNo,
      speciesId,
      name: formattedName,
      koreanName: DEX_TO_KOREAN_DICT[dexNo],
      types,
      abilities: (data.abilities || []).map((a: any) => a.ability.name),
      primaryAbility,
      hiddenAbility,
      hp,
      attack,
      defense,
      spAttack,
      spDefense,
      speed,
    };

    dexCache.set(dexNo, info);
    return info;
  } catch (error) {
    console.error(`[POKEAPI] Failed to fetch Pokemon for Dex #${dexNo}:`, error);
    return null;
  }
}

/**
 * Fetches a list of Pokémon for a Pokédex page (e.g. 8 per page)
 */
export async function getPokemonPage(page: number = 1, pageSize: number = 8): Promise<{ total: number; totalPages: number; items: DexPokemonInfo[] }> {
  const total = 1025;
  const totalPages = Math.ceil(total / pageSize);
  const validPage = Math.max(1, Math.min(totalPages, page));

  const startDex = (validPage - 1) * pageSize + 1;
  const endDex = Math.min(total, startDex + pageSize - 1);

  const promises: Promise<DexPokemonInfo | null>[] = [];
  for (let i = startDex; i <= endDex; i++) {
    promises.push(getPokemonByDexNumber(i));
  }

  const results = await Promise.all(promises);
  const items = results.filter((p): p is DexPokemonInfo => p !== null);

  return { total, totalPages, items };
}

/**
 * Resolves Pokémon by query: Dex Number (e.g. 134), Korean Name (e.g. 샤미드), or English Name (e.g. Vaporeon)
 */
export async function getPokemonByQuery(query: string): Promise<DexPokemonInfo | null> {
  const clean = query.trim().toLowerCase();
  if (!clean) return null;

  // 1. If query is a pure number (Dex #)
  const num = parseInt(clean, 10);
  if (!isNaN(num) && String(num) === clean) {
    return await getPokemonByDexNumber(num);
  }

  // 2. If query matches Korean dictionary
  const original = query.trim();
  if (KOREAN_POKEMON_DICT[original]) {
    return await getPokemonByDexNumber(KOREAN_POKEMON_DICT[original]);
  }

  // 3. Check memory cache for English Name
  if (nameCache.has(clean)) {
    return nameCache.get(clean)!;
  }

  // 4. Try querying PokeAPI directly with English species name
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${clean}`);
    if (res.ok) {
      const data: any = await res.json();
      const info = await getPokemonByDexNumber(data.id);
      if (info) {
        nameCache.set(clean, info);
        return info;
      }
    }
  } catch {}

  // 5. Try searching species endpoint for multi-language names
  try {
    const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${encodeURIComponent(clean)}`);
    if (speciesRes.ok) {
      const spData: any = await speciesRes.json();
      return await getPokemonByDexNumber(spData.id);
    }
  } catch {}

  return null;
}
