export interface DexPokemonInfo {
  dexNumber: number;
  speciesId: string;
  name: string;
  koreanName?: string;
  types: string[];
  abilities?: string[];
  regularAbilities?: string[];
  regularAbilitiesKo?: string[];
  primaryAbility?: string;
  hiddenAbility?: string;
  hiddenAbilityKo?: string;
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
}

const dexCache = new Map<number, DexPokemonInfo>();
const nameCache = new Map<string, DexPokemonInfo>();
const abilityKoCache = new Map<string, string>();

// Comprehensive Pokémon 1~9 Gen Ability English to Korean mapping dictionary
export const ABILITY_KO_DICT: Record<string, string> = {
  // Gen 1 ~ 3
  "stench": "악취",
  "drizzle": "잔비",
  "speed-boost": "가속",
  "battle-armor": "전투무장",
  "sturdy": "옹골참",
  "damp": "습기",
  "limber": "유연",
  "sand-veil": "모래숨기",
  "static": "정전기",
  "volt-absorb": "축전",
  "water-absorb": "저수",
  "oblivious": "둔감",
  "cloud-nine": "날씨부정",
  "compound-eyes": "복안",
  "insomnia": "불면",
  "color-change": "변색",
  "immunity": "면역",
  "flash-fire": "타오르는불꽃",
  "shield-dust": "인분",
  "own-tempo": "마이페이스",
  "suction-cups": "흡반",
  "intimidate": "위협",
  "shadow-tag": "그림자밟기",
  "rough-skin": "까칠한피부",
  "wonder-guard": "불가사의부적",
  "levitate": "부유",
  "effect-spore": "포자",
  "synchronize": "동기화",
  "clear-body": "클리어바디",
  "natural-cure": "자연회복",
  "lightning-rod": "피뢰침",
  "serene-grace": "하늘의은총",
  "swift-swim": "쓱쓱",
  "chlorophyll": "엽록소",
  "illuminate": "발광",
  "trace": "트레이스",
  "huge-power": "천하장사",
  "poison-point": "독가시",
  "inner-focus": "정신력",
  "magma-armor": "마그마의무장",
  "water-veil": "수의베일",
  "magnet-pull": "자력",
  "soundproof": "방음",
  "rain-dish": "젖은접시",
  "sand-stream": "모래날림",
  "pressure": "프레셔",
  "thick-fat": "두꺼운지방",
  "early-bird": "일찍일어나기",
  "flame-body": "불꽃몸",
  "run-away": "도주",
  "keen-eye": "날카로운눈",
  "hyper-cutter": "괴력집게",
  "pickup": "픽업",
  "truant": "게으름",
  "hustle": "의욕",
  "cute-charm": "헤롱헤롱바디",
  "plus": "플러스",
  "minus": "마이너스",
  "forecast": "기분파",
  "sticky-hold": "점착",
  "shed-skin": "탈피",
  "guts": "근성",
  "marvel-scale": "이상한비늘",
  "liquid-ooze": "해파리포자",
  "overgrow": "심록",
  "blaze": "맹화",
  "torrent": "급류",
  "swarm": "벌레의알림",
  "rock-head": "돌머리",
  "drought": "가뭄",
  "arena-trap": "개미지옥",
  "vital-spirit": "의기양양",
  "white-smoke": "하얀연기",
  "pure-power": "순수한힘",
  "shell-armor": "조개껍질",
  "air-lock": "에어록",

  // Gen 4 ~ 6
  "tangled-feet": "갈지자걸음",
  "motor-drive": "모터드라이브",
  "rivalry": "투쟁심",
  "steadfast": "불굴의마음",
  "snow-cloak": "눈숨기",
  "gluttony": "먹보",
  "anger-point": "분노의경혈",
  "unburden": "곡예",
  "heatproof": "내열",
  "simple": "단순",
  "dry-skin": "건조피부",
  "download": "다운로드",
  "iron-fist": "철주먹",
  "poison-heal": "포이즌힐",
  "adaptability": "적응력",
  "skill-link": "스킬링크",
  "hydration": "촉촉바디",
  "solar-power": "선파워",
  "quick-feet": "속보",
  "normalize": "노말스킨",
  "sniper": "스나이퍼",
  "magic-guard": "매직가드",
  "no-guard": "노가드",
  "stall": "시간벌기",
  "technician": "테크니션",
  "leaf-guard": "리프가드",
  "klutz": "서투름",
  "mold-breaker": "틀깨기",
  "super-luck": "대운",
  "aftermath": "유언",
  "anticipation": "위험예지",
  "forewarn": "예지몽",
  "unaware": "천진",
  "tinted-lens": "색안경",
  "filter": "필터",
  "slow-start": "슬로스타트",
  "scrappy": "배짱",
  "storm-drain": "마중물",
  "ice-body": "아이스바디",
  "solid-rock": "하드록",
  "snow-warning": "눈퍼뜨리기",
  "honey-gather": "꿀모으기",
  "frisk": "통찰",
  "reckless": "이판사판",
  "multitype": "멀티타입",
  "flower-gift": "플라워기프트",
  "bad-dreams": "나이트메어",
  "pickpocket": "소매치기",
  "sheer-force": "우격다짐",
  "contrary": "심술꾸러기",
  "unnerve": "긴장감",
  "defiant": "오기",
  "defeatist": "무기력",
  "cursed-body": "저주의바디",
  "healer": "치유의마음",
  "friend-guard": "프렌드가드",
  "weak-armor": "깨어진갑옷",
  "heavy-metal": "헤비메탈",
  "light-metal": "라이트메탈",
  "multiscale": "멀티스케일",
  "toxic-boost": "독폭주",
  "flare-boost": "열폭주",
  "harvest": "수확",
  "telepathy": "텔레파시",
  "moody": "변덕쟁이",
  "overcoat": "방진",
  "poison-touch": "독수",
  "regenerator": "재생력",
  "big-pecks": "부풀린가슴",
  "sand-rush": "모래헤치기",
  "wonder-skin": "미라클스킨",
  "analytic": "애널라이즈",
  "illusion": "일루전",
  "imposter": "괴짜",
  "infiltrator": "틈새포착",
  "mummy": "미라",
  "moxie": "자기과신",
  "justified": "정의의마음",
  "rattled": "주눅",
  "magic-bounce": "매직미러",
  "sap-sipper": "초식",
  "prankster": "짓궂은마음",
  "sand-force": "모래의힘",
  "iron-barbs": "철가시",
  "zen-mode": "달마모드",
  "victory-star": "승리의별",
  "turboblaze": "터보블레이즈",
  "teravolt": "테라볼티지",
  "aroma-veil": "아로마베일",
  "sweet-veil": "스위트베일",
  "flower-veil": "플라워베일",
  "cheek-pouch": "볼주머니",
  "protean": "변환자재",
  "fur-coat": "퍼코트",
  "magician": "매지션",
  "bulletproof": "방탄",
  "competitive": "승기",
  "strong-jaw": "옹골찬턱",
  "refrigerate": "프리즈스킨",
  "stance-change": "배틀스위치",
  "gale-wings": "질풍날개",
  "mega-launcher": "메가런처",
  "grass-pelt": "풀모피",
  "symbiosis": "공생",
  "tough-claws": "단단한발톱",
  "pixilate": "페어리스킨",
  "gooey": "미끈미끈",
  "aerilate": "스카이스킨",
  "parental-bond": "부자유친",
  "dark-aura": "다크오라",
  "fairy-aura": "페어리오라",
  "aura-break": "오라브레이크",
  "primordial-sea": "시작의바다",
  "desolate-land": "끝의대지",
  "delta-stream": "델타스트림",

  // Gen 7 ~ 9
  "stamina": "지구력",
  "wimp-out": "도망태세",
  "emergency-exit": "위기회피",
  "water-compaction": "수분응축",
  "merciless": "무자비",
  "shields-down": "리밋실드",
  "stakeout": "잠복",
  "water-bubble": "수포",
  "steelworker": "강철술사",
  "berserk": "발끈",
  "slush-rush": "눈치우기",
  "long-reach": "원격",
  "liquid-voice": "촉촉보이스",
  "triage": "우선치료",
  "galvanize": "일렉트릭스킨",
  "surge-surfer": "서핑비트",
  "schooling": "어군",
  "disguise": "탈",
  "battle-bond": "유대변화",
  "power-construct": "스웜체인지",
  "corrosion": "부식",
  "comatose": "절대수면",
  "queenly-majesty": "여왕의위엄",
  "innards-out": "내용물분출",
  "dancer": "무희",
  "battery": "배터리",
  "fluffy": "폭신폭신",
  "dazzling": "비비드바디",
  "soul-heart": "소울하트",
  "tangling-hair": "컬리헤어",
  "receiver": "리시버",
  "power-of-alchemy": "연금술",
  "beast-boost": "비스트부스트",
  "rks-system": "AR시스템",
  "electric-surge": "일렉트릭메이커",
  "psychic-surge": "사이코메이커",
  "misty-surge": "미스트메이커",
  "grassy-surge": "그래스메이커",
  "full-metal-body": "메탈프로텍트",
  "shadow-shield": "스펙터가드",
  "prism-armor": "프리즘아머",
  "neuroforce": "브레인포스",
  "intrepid-sword": "불요의검",
  "dauntless-shield": "불굴의방패",
  "libero": "리베로",
  "ball-fetch": "볼줍기",
  "cotton-down": "솜털",
  "propeller-tail": "스크루지느러미",
  "mirror-armor": "미러아머",
  "gasping-breath": "깊은숨결",
  "stalwart": "굳은신념",
  "steely-spirit": "강철정신",
  "perish-body": "멸망의바디",
  "wandering-spirit": "헤매는영혼",
  "gorilla-tactics": "고릴라전술",
  "neutralizing-gas": "화학변화가스",
  "pastel-veil": "파스텔베일",
  "hunger-switch": "배고픔스위치",
  "quick-draw": "퀵드로",
  "unseen-fist": "보이지않는주먹",
  "curious-medicine": "기묘한약",
  "transistor": "트랜지스터",
  "dragons-maw": "용의턱",
  "chilling-neigh": "백의울음",
  "grim-neigh": "흑의울음",
  "as-one-glastrier": "인마일체",
  "as-one-spectrier": "인마일체",
  "lingering-aroma": "가시지않는향기",
  "seed-sower": "씨뿌리기",
  "thermal-exchange": "열교환",
  "anger-shell": "분노의껍질",
  "purifying-salt": "정화의소금",
  "well-baked-body": "노릇노릇바디",
  "wind-rider": "바람타기",
  "guard-dog": "파수견",
  "rocky-payload": "바위나르기",
  "wind-power": "풍력발전",
  "mycelium-might": "균사의힘",
  "sharpness": "예리함",
  "supreme-overlord": "총대장",
  "costar": "협력",
  "toxic-debris": "독치장",
  "armor-tail": "테일아머",
  "earth-eater": "흙먹기",
  "opportunist": "찰나의틈",
  "cud-chew": "되새김질",
  "commander": "사령탑",
  "electromorphosis": "전기엔진",
  "protosynthesis": "고대활성",
  "quark-drive": "쿼크차지",
  "good-as-gold": "황금몸",
  "vessel-of-ruin": "재앙의그릇",
  "sword-of-ruin": "재앙의검",
  "tablets-of-ruin": "재앙의목간",
  "beads-of-ruin": "재앙의구슬",
  "orichalcum-pulse": "진홍빛고동",
  "hadron-engine": "하드론엔진",
  "supersweet-syrup": "감미로운꿀",
  "hospitality": "대접",
  "toxic-chain": "독사슬",
  "mind-s-eye": "심안",
  "embody-aspect": "화덕의가면",
  "tera-shift": "테라스텔라",
  "tera-shell": "테라셸",
  "teraform-zero": "제로포밍",
  "poison-puppeteer": "독조종",
};

export async function fetchAbilityKoreanName(rawName: string): Promise<string> {
  const key = rawName.toLowerCase().replace(/[\s_]+/g, "-");
  if (ABILITY_KO_DICT[key]) return ABILITY_KO_DICT[key];
  if (abilityKoCache.has(key)) return abilityKoCache.get(key)!;

  try {
    const res = await fetch(`https://pokeapi.co/api/v2/ability/${key}`);
    if (res.ok) {
      const data: any = await res.json();
      const koEntry = (data.names || []).find((n: any) => n.language?.name === "ko");
      if (koEntry && koEntry.name) {
        abilityKoCache.set(key, koEntry.name);
        return koEntry.name;
      }
    }
  } catch {
    // ignore
  }

  // Fallback to formatted English
  const formatted = rawName.split(/[\s_-]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  abilityKoCache.set(key, formatted);
  return formatted;
}

export function getAbilityKoreanName(rawName: string): string {
  const key = rawName.toLowerCase().replace(/[\s_]+/g, "-");
  return ABILITY_KO_DICT[key] || abilityKoCache.get(key) || rawName;
}

import { POKEMON_NAMES_KO, POKEMON_NAME_TO_DEX } from "../data/pokemonNamesKo.js";

// Full 1~1025 National Pokédex Korean Name dataset
const DEX_TO_KOREAN_DICT: Record<number, string> = POKEMON_NAMES_KO;
const KOREAN_POKEMON_DICT: Record<string, number> = POKEMON_NAME_TO_DEX;

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
    const regularAbilitiesKo: string[] = [];
    let hiddenAbility: string | undefined;
    let hiddenAbilityKo: string | undefined;

    for (const a of data.abilities || []) {
      const rawName = a.ability.name;
      const formatted = rawName.split(/[\s_-]+/).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      const koName = getAbilityKoreanName(rawName);

      if (a.is_hidden) {
        hiddenAbility = formatted;
        hiddenAbilityKo = koName;
      } else {
        regularAbilities.push(formatted);
        regularAbilitiesKo.push(koName);
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
      regularAbilities,
      regularAbilitiesKo,
      primaryAbility,
      hiddenAbility,
      hiddenAbilityKo,
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
