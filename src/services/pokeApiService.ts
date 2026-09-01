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
  genusKo?: string;
  flavorTextKo?: string;
  flavorTextEn?: string;
}

export interface SpeciesInfo {
  genusKo?: string;
  genusEn?: string;
  flavorTextKo?: string;
  flavorTextEn?: string;
}

const dexCache = new Map<number, DexPokemonInfo>();
const nameCache = new Map<string, DexPokemonInfo>();
const abilityKoCache = new Map<string, string>();
const speciesCache = new Map<number, SpeciesInfo>();

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

export interface AbilityDetailInfo {
  name: string;
  nameKo: string;
  descriptionKo: string;
  descriptionEn: string;
}

const abilityDetailCache = new Map<string, AbilityDetailInfo>();

// Enhanced Numerical & Competitive Ability Descriptions (Korean & English)
export const ABILITY_DETAILED_DESC_KO: Record<string, string> = {
  "hustle": "공격은 높지만 [1.5배(50%) 상승] 빗나가기 [명중률 20% 하락] 쉽다.",
  "huge-power": "자신의 물리 공격의 위력이 올라간다. [실수치 2.0배(100% 상승)]",
  "pure-power": "자신의 물리 공격의 위력이 올라간다. [실수치 2.0배(100% 상승)]",
  "speed-boost": "매 턴 스피드가 올라간다. [매 턴 종료 시 스피드 +1랭크(1.5배 -> 2.0배...)]",
  "technician": "위력이 낮은 기술의 위력을 높여서 공격한다. [위력 60 이하 기술 1.5배(50%) 상승]",
  "overgrow": "위급할 때 풀타입 기술의 위력이 올라간다. [HP 1/3 이하 시 풀 기술 위력 1.5배]",
  "blaze": "위급할 때 불꽃타입 기술의 위력이 올라간다. [HP 1/3 이하 시 불꽃 기술 위력 1.5배]",
  "torrent": "위급할 때 물타입 기술의 위력이 올라간다. [HP 1/3 이하 시 물 기술 위력 1.5배]",
  "swarm": "위급할 때 벌레타입 기술의 위력이 올라간다. [HP 1/3 이하 시 벌레 기술 위력 1.5배]",
  "adaptability": "타입과 일치하는 기술의 위력이 더욱 올라간다. [자속 보정 1.5배 -> 2.0배]",
  "sheer-force": "추가 효과가 있는 기술을 높은 위력으로 쓴다. [추가 효과 소멸 대신 위력 1.3배(30%) 상승]",
  "tough-claws": "직접 공격하는 기술의 위력이 올라간다. [직접 접촉기 위력 1.3배(30%) 상승]",
  "strong-jaw": "턱을 써서 무는 기술의 위력이 올라간다. [물기 기술 위력 1.5배(50%) 상승]",
  "mega-launcher": "파동 기술의 위력이 올라간다. [파동 및 포 기술 위력 1.5배(50%) 상승]",
  "iron-fist": "펀치 기술의 위력이 올라간다. [펀치 기술 위력 1.2배(20%) 상승]",
  "sharpness": "베기 기술의 위력이 올라간다. [베기 기술 위력 1.5배(50%) 상승]",
  "regenerator": "다른 포켓몬으로 교체하면 HP가 회복된다. [교체 시 최대 HP의 33.3%(1/3) 회복]",
  "multiscale": "HP가 꽉 찼을 때 받는 대미지가 줄어든다. [피해량 50%(반감) 감소]",
  "shadow-shield": "HP가 꽉 찼을 때 받는 대미지가 줄어든다. [피해량 50%(반감) 감소]",
  "fluffy": "직접 공격의 대미지를 반감하지만 불꽃 공격은 2배가 된다. [접촉기 50% 감소 / 불꽃 2.0배]",
  "poison-heal": "독 상태가 되면 대미지 대신 HP가 회복된다. [매 턴 최대 HP의 12.5%(1/8) 회복]",
  "magic-guard": "직접 공격 외의 대미지를 받지 않는다. [날씨/상태이상/스락/반동 피해 무효]",
  "intimidate": "배틀에 나오면 상대의 공격을 떨어뜨린다. [등장 시 상대 공격 -1랭크(2/3배)]",
  "moxie": "상대를 쓰러뜨리면 공격이 올라간다. [상대 격파 시 공격 +1랭크(1.5배)]",
  "beast-boost": "상대를 쓰러뜨릴 때마다 가장 높은 능력이 올라간다. [격파 시 최고 스탯 +1랭크]",
  "chilling-neigh": "상대를 쓰러뜨리면 공격이 올라간다. [상대 격파 시 공격 +1랭크]",
  "grim-neigh": "상대를 쓰러뜨리면 특수공격이 올라간다. [상대 격파 시 특공 +1랭크]",
  "soul-heart": "포켓몬이 쓰러질 때마다 특수공격이 올라간다. [필드 포켓몬 기절 시 특공 +1랭크]",
  "defiant": "상대에 의해 능력치가 떨어지면 공격이 크게 올라간다. [능력치 하락 시 공격 +2랭크(2.0배)]",
  "competitive": "상대에 의해 능력치가 떨어지면 특수공격이 크게 올라간다. [능력치 하락 시 특공 +2랭크(2.0배)]",
  "contrary": "능력 변화의 상승과 하락이 반대로 적용된다. [랭크업 -> 랭크다운 / 랭크다운 -> 랭크업]",
  "prankster": "자신의 변화 기술을 먼저 쓸 수 있다. [변화 기술 우선도 +1 (악타입 대상 무효)]",
  "guts": "상태이상이 되면 공격이 올라가며 화상 페널티를 무시한다. [공격 1.5배(50%) 상승]",
  "marvel-scale": "상태이상이 되면 방어가 올라간다. [방어 1.5배(50%) 상승]",
  "quick-feet": "상태이상이 되면 스피드가 올라가며 마비 페널티를 무시한다. [스피드 1.5배(50%) 상승]",
  "toxic-boost": "독 상태가 되면 물리 공격의 위력이 올라간다. [물리 기술 위력 1.5배(50%) 상승]",
  "flare-boost": "화상 상태가 되면 특수 공격의 위력이 올라간다. [특수 기술 위력 1.5배(50%) 상승]",
  "drizzle": "배틀에 나오면 비를 내리게 한다. [등장 시 5턴간 비 소환 (물 기술 1.5배 / 불꽃 반감)]",
  "drought": "배틀에 나오면 햇살을 강하게 비춘다. [등장 시 5턴간 쾌청 소환 (불꽃 기술 1.5배 / 물 반감)]",
  "sand-stream": "배틀에 나오면 모래바람을 일으킨다. [등장 시 5턴간 모래바람 (바위타입 특방 1.5배)]",
  "snow-warning": "배틀에 나오면 눈을 내리게 한다. [등장 시 5턴간 설경 소환 (얼음타입 방어 1.5배)]",
  "electric-surge": "배틀에 나오면 일렉트릭필드를 깐다. [등장 시 5턴간 전기필드 (전기 기술 1.3배)]",
  "grassy-surge": "배틀에 나오면 그래스필드를 깐다. [등장 시 5턴간 풀필드 (풀 기술 1.3배 / 매턴 HP 1/16 회복)]",
  "psychic-surge": "배틀에 나오면 사이코필드를 깐다. [등장 시 5턴간 사이코필드 (에스퍼 기술 1.3배 / 선공기 무효)]",
  "misty-surge": "배틀에 나오면 미스트필드를 깐다. [등장 시 5턴간 안개필드 (드래곤 피해 반감 / 상태이상 방지)]",
  "supreme-overlord": "쓰러진 아군이 많을수록 기술 위력이 올라간다. [쓰러진 아군 1마리당 위력 +10% (최대 +50%)]",
  "protosynthesis": "쾌청 날씨이거나 부스트에너지를 지니면 가장 높은 능력이 올라간다. [최고 스탯 1.3배 (스피드는 1.5배)]",
  "quark-drive": "일렉트릭필드이거나 부스트에너지를 지니면 가장 높은 능력이 올라간다. [최고 스탯 1.3배 (스피드는 1.5배)]",
  "unaware": "상대의 랭크 변화를 무시하고 공격하거나 방어한다. [상대의 공/방/특공/특방 랭크업 무시]",
  "simple": "자신의 랭크 변화 수치가 2배로 적용된다. [1랭크 상승/하락 ➡️ 2랭크 상승/하락]",
  "analytic": "상대보다 나중에 공격하면 기술의 위력이 올라간다. [후공 시 위력 1.3배(30%) 상승]",
  "infiltrator": "상대의 장막과 대타출동을 통과하여 공격한다. [리플렉터/빛의장막/오로라베일/대타 무시]",
  "levitate": "땅에 떠 있어서 땅타입 공격을 받지 않는다. [땅타입 공격 / 압정로드 / 필드 효과 무효]",
  "water-bubble": "물 기술 위력이 2배가 되고 불꽃 피해를 반감하며 화상에 걸리지 않는다. [물 2.0배 / 불꽃 50%]",
  "fur-coat": "물리 기술로 받는 대미지가 절반이 된다. [물리 방어력 실수치 2.0배(100% 상승)]",
  "ice-scales": "특수 기술로 받는 대미지가 절반이 된다. [특수 대미지 50% 반감]",
  "wonder-guard": "효과가 굉장한 약점 기술 외에는 대미지를 받지 않는다. [2배 이상 약점 외 모든 직접공격 무효]",
  "oblivious": "헤롱헤롱과 도발 상태가 되지 않는다. [유혹 / 도발 / 헤롱헤롱 면역]",
  "own-tempo": "혼란 상태가 되지 않고 위협을 무시한다. [혼란 및 위협 면역]",
  "immunity": "독 상태가 되지 않는다. [독 및 맹독 면역]",
  "limber": "마비 상태가 되지 않는다. [마비 면역]",
  "insomnia": "잠듦 상태가 되지 않는다. [수면 및 하품 면역]",
  "vital-spirit": "잠듦 상태가 되지 않는다. [수면 및 하품 면역]",
  "water-veil": "화상 상태가 되지 않는다. [화상 면역]",
  "magma-armor": "얼음 상태가 되지 않는다. [동빙 면역]",
  "sturdy": "일격필살 기술을 무효화하며 HP가 가득 찼을 때 기절할 공격을 버틴다. [기합의띠 효과]",
  "serene-grace": "기술의 추가 효과가 나타날 확률이 2배가 된다. [풀죽음/상태이상 발동률 2배]",
  "reckless": "반동 대미지를 받는 기술의 위력이 올라간다. [반동 공격기 위력 1.2배(20%) 상승]",
  "rock-head": "공격을 가해도 반동 대미지를 받지 않는다. [반동 피해 완전 무효]",
  "magic-bounce": "자신이 받는 변화 기술을 상대에게 되받아친다. [스락/하품/도발/상태이상 반사]",
  "chlorophyll": "날씨가 맑을 때 스피드가 2배가 된다. [쾌청 시 스피드 2.0배(100% 상승)]",
  "swift-swim": "날씨가 비일 때 스피드가 2배가 된다. [비 시 스피드 2.0배(100% 상승)]",
  "sand-rush": "모래바람일 때 스피드가 2배가 된다. [모래바람 시 스피드 2.0배(100% 상승)]",
  "slush-rush": "눈이나 싸라기눈일 때 스피드가 2배가 된다. [설경 시 스피드 2.0배(100% 상승)]",
  "solar-power": "날씨가 맑을 때 특수공격이 올라가지만 매 턴 HP가 깎인다. [특공 1.5배 / 매턴 HP 1/8 감소]",
  "dry-skin": "비일 때 HP를 회복하고 물을 무효화하지만 불꽃에 약해진다. [물 무효 및 25% 회복 / 불꽃 1.25배]",
  "water-absorb": "물타입 공격을 받으면 대미지 대신 HP가 회복된다. [물 무효 및 최대 HP의 25% 회복]",
  "volt-absorb": "전기타입 공격을 받으면 대미지 대신 HP가 회복된다. [전기 무효 및 최대 HP의 25% 회복]",
  "flash-fire": "불꽃타입 공격을 받으면 무효화하고 불꽃 기술의 위력이 올라간다. [불꽃 무효 및 불꽃 위력 1.5배]",
  "sap-sipper": "풀타입 공격을 받으면 무효화하고 공격이 올라간다. [풀 무효 및 공격 +1랭크]",
  "lightning-rod": "전기타입 공격을 자신에게 끌어당겨 무효화하고 특수공격이 올라간다. [전기 무효 및 특공 +1랭크]",
  "storm-drain": "물타입 공격을 자신에게 끌어당겨 무효화하고 특수공격이 올라간다. [물 무효 및 특공 +1랭크]",
  "motor-drive": "전기타입 공격을 받으면 무효화하고 스피드가 올라간다. [전기 무효 및 스피드 +1랭크]",
};

export const ABILITY_DETAILED_DESC_EN: Record<string, string> = {
  "hustle": "Boosts Attack [1.5x (+50%)], but lowers physical move accuracy by 20%.",
  "huge-power": "Doubles the Pokémon's physical Attack stat [2.0x (+100%)].",
  "pure-power": "Doubles the Pokémon's physical Attack stat [2.0x (+100%)].",
  "speed-boost": "Its Speed stat is boosted every turn [+1 stage (1.5x ➡️ 2.0x...)].",
  "technician": "Powers up the Pokémon's weaker moves [Moves with power <= 60 get 1.5x].",
  "overgrow": "Powers up Grass-type moves in a pinch [HP <= 1/3: 1.5x power].",
  "blaze": "Powers up Fire-type moves in a pinch [HP <= 1/3: 1.5x power].",
  "torrent": "Powers up Water-type moves in a pinch [HP <= 1/3: 1.5x power].",
  "swarm": "Powers up Bug-type moves in a pinch [HP <= 1/3: 1.5x power].",
  "adaptability": "Powers up moves of the same type [STAB bonus 1.5x ➡️ 2.0x].",
  "sheer-force": "Removes move secondary effects to boost move power by 1.3x (+30%).",
  "tough-claws": "Powers up moves that make direct contact [1.3x (+30%)].",
  "strong-jaw": "The Pokémon's strong jaw boosts the power of biting moves [1.5x (+50%)].",
  "mega-launcher": "Powers up aura and pulse moves [1.5x (+50%)].",
  "iron-fist": "Powers up punching moves [1.2x (+20%)].",
  "sharpness": "Powers up slicing moves [1.5x (+50%)].",
  "regenerator": "Restores HP when withdrawn from battle [33.3% (1/3) max HP].",
  "multiscale": "Reduces damage taken when HP is full [50% damage reduction].",
  "shadow-shield": "Reduces damage taken when HP is full [50% damage reduction].",
  "fluffy": "Halves damage from contact moves [50%], but doubles Fire move damage [2.0x].",
  "poison-heal": "Restores HP when poisoned [12.5% (1/8) max HP per turn].",
  "magic-guard": "The Pokémon only takes damage from direct attacks.",
  "intimidate": "Lowers opposing Pokémon's Attack stat when entering battle [-1 stage (2/3x)].",
  "moxie": "Boosts Attack after knocking out any Pokémon [+1 stage (1.5x)].",
  "defiant": "Sharply boosts Attack when stats are lowered by opponents [+2 stages (2.0x)].",
  "competitive": "Sharply boosts Sp. Atk when stats are lowered by opponents [+2 stages (2.0x)].",
  "contrary": "Reverses all stat changes.",
  "prankster": "Gives priority to status moves [+1 priority, fails against Dark types].",
  "guts": "Boosts Attack if the Pokémon has a status condition [1.5x (+50%)].",
};

export async function getAbilityDetail(rawName: string): Promise<AbilityDetailInfo> {
  const key = rawName.toLowerCase().replace(/[\s_]+/g, "-");
  if (abilityDetailCache.has(key)) return abilityDetailCache.get(key)!;

  let nameKo = ABILITY_KO_DICT[key] || rawName;
  let descriptionKo = ABILITY_DETAILED_DESC_KO[key] || "";
  let descriptionEn = ABILITY_DETAILED_DESC_EN[key] || "";

  // If not in custom detailed dictionary, fetch from PokeAPI
  if (!descriptionKo || !descriptionEn) {
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/ability/${key}`);
      if (res.ok) {
        const data: any = await res.json();
        const koNameEntry = (data.names || []).find((n: any) => n.language?.name === "ko");
        if (koNameEntry?.name) nameKo = koNameEntry.name;

        if (!descriptionKo) {
          const koFlavor = (data.flavor_text_entries || []).find((f: any) => f.language?.name === "ko");
          if (koFlavor?.flavor_text) {
            descriptionKo = koFlavor.flavor_text.replace(/\n/g, " ");
          } else {
            const koEffect = (data.effect_entries || []).find((e: any) => e.language?.name === "ko");
            if (koEffect?.short_effect || koEffect?.effect) {
              descriptionKo = (koEffect.short_effect || koEffect.effect).replace(/\n/g, " ");
            }
          }
        }

        if (!descriptionEn) {
          const enFlavor = (data.flavor_text_entries || []).find((f: any) => f.language?.name === "en");
          if (enFlavor?.flavor_text) {
            descriptionEn = enFlavor.flavor_text.replace(/\n/g, " ");
          } else {
            const enEffect = (data.effect_entries || []).find((e: any) => e.language?.name === "en");
            if (enEffect?.short_effect || enEffect?.effect) {
              descriptionEn = (enEffect.short_effect || enEffect.effect).replace(/\n/g, " ");
            }
          }
        }
      }
    } catch (err) {
      console.error(`[ABILITY] Error fetching ability details for ${key}:`, err);
    }
  }

  const formattedEn = rawName.split(/[\s_-]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const result: AbilityDetailInfo = {
    name: formattedEn,
    nameKo: nameKo || formattedEn,
    descriptionKo: descriptionKo || `${nameKo || formattedEn} 특성입니다.`,
    descriptionEn: descriptionEn || `${formattedEn} ability.`,
  };

  abilityDetailCache.set(key, result);
  return result;
}

export function getAbilityKoreanName(rawName: string): string {
  const key = rawName.toLowerCase().replace(/[\s_]+/g, "-");
  return ABILITY_KO_DICT[key] || abilityKoCache.get(key) || rawName;
}

export async function getPokemonSpeciesInfo(dexNo: number): Promise<SpeciesInfo> {
  if (speciesCache.has(dexNo)) return speciesCache.get(dexNo)!;

  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${dexNo}`);
    if (res.ok) {
      const data: any = await res.json();

      // Genus (분류)
      const koGenusEntry = (data.genera || []).find((g: any) => g.language?.name === "ko");
      const enGenusEntry = (data.genera || []).find((g: any) => g.language?.name === "en");

      // Flavor texts (find latest Korean flavor text)
      const koFlavors = (data.flavor_text_entries || []).filter((f: any) => f.language?.name === "ko");
      const lastKoFlavor = koFlavors.length > 0 ? koFlavors[koFlavors.length - 1].flavor_text : undefined;

      const enFlavors = (data.flavor_text_entries || []).filter((f: any) => f.language?.name === "en");
      const lastEnFlavor = enFlavors.length > 0 ? enFlavors[enFlavors.length - 1].flavor_text : undefined;

      const cleanKo = lastKoFlavor ? lastKoFlavor.replace(/[\n\f\r]+/g, " ").replace(/\s{2,}/g, " ").trim() : undefined;
      const cleanEn = lastEnFlavor ? lastEnFlavor.replace(/[\n\f\r]+/g, " ").replace(/\s{2,}/g, " ").trim() : undefined;

      const result: SpeciesInfo = {
        genusKo: koGenusEntry?.genus,
        genusEn: enGenusEntry?.genus,
        flavorTextKo: cleanKo,
        flavorTextEn: cleanEn,
      };

      speciesCache.set(dexNo, result);
      return result;
    }
  } catch (err) {
    console.error(`[SPECIES] Failed to fetch species for #${dexNo}:`, err);
  }

  const fallback: SpeciesInfo = {
    genusKo: "포켓몬",
    genusEn: "Pokémon",
    flavorTextKo: "포켓몬 도감에 등록된 포켓몬입니다.",
    flavorTextEn: "A Pokémon registered in the Pokédex.",
  };
  speciesCache.set(dexNo, fallback);
  return fallback;
}

import { POKEMON_NAMES_KO, POKEMON_NAME_TO_DEX } from "../data/pokemonNamesKo.js";

// Full 1~1025 National Pokédex Korean Name dataset
const DEX_TO_KOREAN_DICT: Record<number, string> = POKEMON_NAMES_KO;
export const KOREAN_POKEMON_DICT: Record<string, number> = POKEMON_NAME_TO_DEX;

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
