/**
 * Official Pokémon & PokéRogue Items Dataset
 * Contains Korean Names, Categories, and Descriptions.
 */
export interface ItemData {
  id: string;
  name: string;
  nameKo: string;
  category: "pokeball" | "battle" | "healing" | "held" | "evolution" | "rogue_special";
  cost?: number;
  descriptionKo: string;
  descriptionEn: string;
}

export const ITEMS_DATA: Record<string, ItemData> = {
  // Pokéballs
  "poke-ball": {
    id: "poke-ball",
    name: "Poké Ball",
    nameKo: "몬스터볼",
    category: "pokeball",
    cost: 200,
    descriptionKo: "야생 포켓몬을 잡기 위한 가장 기본적인 캡슐.",
    descriptionEn: "A device for catching wild Pokémon.",
  },
  "great-ball": {
    id: "great-ball",
    name: "Great Ball",
    nameKo: "수퍼볼",
    category: "pokeball",
    cost: 600,
    descriptionKo: "몬스터볼보다 포획률이 높은 고성능 볼.",
    descriptionEn: "A high-performance Ball providing a higher catch rate than a standard Poké Ball.",
  },
  "ultra-ball": {
    id: "ultra-ball",
    name: "Ultra Ball",
    nameKo: "하이퍼볼",
    category: "pokeball",
    cost: 1200,
    descriptionKo: "수퍼볼보다 더욱 뛰어난 최고급 포획용 볼.",
    descriptionEn: "An ultra-high-performance Ball with a higher catch rate than a Great Ball.",
  },
  "rogue-ball": {
    id: "rogue-ball",
    name: "Rogue Ball",
    nameKo: "로그볼",
    category: "pokeball",
    cost: 5000,
    descriptionKo: "포켓로그 전용 고성능 캡슐. 하이퍼볼보다 높은 포획률을 가집니다.",
    descriptionEn: "PokéRogue exclusive ball with exceptional catch rate.",
  },
  "master-ball": {
    id: "master-ball",
    name: "Master Ball",
    nameKo: "마스터볼",
    category: "pokeball",
    cost: 50000,
    descriptionKo: "야생 포켓몬을 100% 무조건 포획하는 최강의 볼.",
    descriptionEn: "The best Poké Ball with the ultimate level of performance. It will catch any wild Pokémon without fail.",
  },

  // Healing & Recovery
  "potion": {
    id: "potion",
    name: "Potion",
    nameKo: "상처약",
    category: "healing",
    cost: 300,
    descriptionKo: "포켓몬 1마리의 HP를 20 회복합니다.",
    descriptionEn: "Restores the HP of a Pokémon by 20 points.",
  },
  "super-potion": {
    id: "super-potion",
    name: "Super Potion",
    nameKo: "좋은상처약",
    category: "healing",
    cost: 700,
    descriptionKo: "포켓몬 1마리의 HP를 60 회복합니다.",
    descriptionEn: "Restores the HP of a Pokémon by 60 points.",
  },
  "hyper-potion": {
    id: "hyper-potion",
    name: "Hyper Potion",
    nameKo: "고급상처약",
    category: "healing",
    cost: 1500,
    descriptionKo: "포켓몬 1마리의 HP를 120 회복합니다.",
    descriptionEn: "Restores the HP of a Pokémon by 120 points.",
  },
  "max-potion": {
    id: "max-potion",
    name: "Max Potion",
    nameKo: "풀회복약",
    category: "healing",
    cost: 2500,
    descriptionKo: "포켓몬 1마리의 HP를 모두 회복합니다.",
    descriptionEn: "Fully restores the HP of a Pokémon.",
  },
  "full-restore": {
    id: "full-restore",
    name: "Full Restore",
    nameKo: "회복약",
    category: "healing",
    cost: 3000,
    descriptionKo: "포켓몬 1마리의 HP와 모든 상태이상을 완전히 회복합니다.",
    descriptionEn: "Fully restores HP and cures all status ailments of a Pokémon.",
  },
  "revive": {
    id: "revive",
    name: "Revive",
    nameKo: "기력의조각",
    category: "healing",
    cost: 2000,
    descriptionKo: "기절한 포켓몬 1마리를 HP 절반 상태로 부활시킵니다.",
    descriptionEn: "Revives a fainted Pokémon with half of its max HP.",
  },
  "max-revive": {
    id: "max-revive",
    name: "Max Revive",
    nameKo: "기력의덩어리",
    category: "healing",
    cost: 4000,
    descriptionKo: "기절한 포켓몬 1마리를 HP 완충 상태로 완전 부활시킵니다.",
    descriptionEn: "Revives a fainted Pokémon with full HP.",
  },
  "ether": {
    id: "ether",
    name: "Ether",
    nameKo: "PP에이더",
    category: "healing",
    cost: 1200,
    descriptionKo: "포켓몬 1개 기술의 PP를 10 회복합니다.",
    descriptionEn: "Restores 10 PP of a single move.",
  },
  "elixir": {
    id: "elixir",
    name: "Elixir",
    nameKo: "PP회복",
    category: "healing",
    cost: 3000,
    descriptionKo: "포켓몬의 모든 기술의 PP를 10 회복합니다.",
    descriptionEn: "Restores 10 PP to all moves of a Pokémon.",
  },

  // Competitive Held Items
  "leftovers": {
    id: "leftovers",
    name: "Leftovers",
    nameKo: "먹다남은음식",
    category: "held",
    descriptionKo: "지니게 하면 매 턴 종료 시 최대 HP의 1/16을 서서히 회복합니다.",
    descriptionEn: "Gradually restores HP each turn.",
  },
  "focus-sash": {
    id: "focus-sash",
    name: "Focus Sash",
    nameKo: "기합의띠",
    category: "held",
    descriptionKo: "체력이 꽉 찬 상태에서 일격사를 당할 경우 HP 1을 남기고 버팁니다.",
    descriptionEn: "If the holder has full HP, it will endure a potential KO attack with 1 HP.",
  },
  "life-orb": {
    id: "life-orb",
    name: "Life Orb",
    nameKo: "생명의구슬",
    category: "held",
    descriptionKo: "기술의 위력이 1.3배 증가하지만 공격할 때마다 최대 HP의 10%를 잃습니다.",
    descriptionEn: "Boosts the power of moves by 30%, but at the cost of 10% max HP per attack.",
  },
  "choice-band": {
    id: "choice-band",
    name: "Choice Band",
    nameKo: "구애머리띠",
    category: "held",
    descriptionKo: "물리 공격력이 1.5배 상승하지만 한 기술만 계속 써야 합니다.",
    descriptionEn: "Boosts Attack by 50%, but only allows the use of one move.",
  },
  "choice-specs": {
    id: "choice-specs",
    name: "Choice Specs",
    nameKo: "구애안경",
    category: "held",
    descriptionKo: "특수 공격력이 1.5배 상승하지만 한 기술만 계속 써야 합니다.",
    descriptionEn: "Boosts Sp. Atk by 50%, but only allows the use of one move.",
  },
  "choice-scarf": {
    id: "choice-scarf",
    name: "Choice Scarf",
    nameKo: "구애스카프",
    category: "held",
    descriptionKo: "스피드가 1.5배 상승하지만 한 기술만 계속 써야 합니다.",
    descriptionEn: "Boosts Speed by 50%, but only allows the use of one move.",
  },
  "assault-vest": {
    id: "assault-vest",
    name: "Assault Vest",
    nameKo: "돌격조끼",
    category: "held",
    descriptionKo: "특수방어가 1.5배 상승하지만 변화기를 쓸 수 없게 됩니다.",
    descriptionEn: "Boosts Sp. Def by 50%, but prevents the use of status moves.",
  },
  "rocky-helmet": {
    id: "rocky-helmet",
    name: "Rocky Helmet",
    nameKo: "울퉁불퉁멧",
    category: "held",
    descriptionKo: "접촉 공격을 한 상대에게 최대 HP의 1/6 반동 데미지를 입힙니다.",
    descriptionEn: "Damages the attacker by 1/6 max HP upon contact.",
  },
  "eviolite": {
    id: "eviolite",
    name: "Eviolite",
    nameKo: "진화의휘석",
    category: "held",
    descriptionKo: "아직 진화할 수 있는 포켓몬에게 지니게 하면 방어와 특수방어가 1.5배 상승합니다.",
    descriptionEn: "Boosts Defense and Sp. Def by 50% for unevolved Pokémon.",
  },

  // PokéRogue Specials
  "exp-share": {
    id: "exp-share",
    name: "EXP Share",
    nameKo: "학습장치",
    category: "rogue_special",
    descriptionKo: "배틀에 나오지 않은 파티원들도 경험치를 나누어 받습니다.",
    descriptionEn: "Distributes experience points to all party members.",
  },
  "lucky-egg": {
    id: "lucky-egg",
    name: "Lucky Egg",
    nameKo: "행운의알",
    category: "rogue_special",
    descriptionKo: "획득하는 경험치량이 1.5배 증가합니다.",
    descriptionEn: "Boosts gained experience points by 50%.",
  },
  "golden-punch-card": {
    id: "golden-punch-card",
    name: "Golden Punch Card",
    nameKo: "골드펀치카드",
    category: "rogue_special",
    descriptionKo: "상점을 이용할 때마다 할인 혜택을 받습니다.",
    descriptionEn: "Grants special shop discounts on all items.",
  },
  "map": {
    id: "map",
    name: "Map",
    nameKo: "지도",
    category: "rogue_special",
    descriptionKo: "바이옴 이동 시 원하는 바이옴 경로를 직접 선택할 수 있게 됩니다.",
    descriptionEn: "Allows choosing specific biome branching paths.",
  },
  "linking-cord": {
    id: "linking-cord",
    name: "Linking Cord",
    nameKo: "연결의끈",
    category: "evolution",
    descriptionKo: "통신 교환으로 진화하는 포켓몬을 즉시 진화시킵니다.",
    descriptionEn: "Instantly evolves Pokémon that traditionally evolve via trading.",
  },
};

export const ITEM_NAME_TO_ID: Record<string, string> = {};

for (const [key, item] of Object.entries(ITEMS_DATA)) {
  ITEM_NAME_TO_ID[item.name.toLowerCase()] = key;
  ITEM_NAME_TO_ID[item.nameKo.toLowerCase()] = key;
  const cleanKo = item.nameKo.replace(/\s+/g, "").toLowerCase();
  ITEM_NAME_TO_ID[cleanKo] = key;
}

export function getItemInfo(query: string): ItemData | null {
  const clean = query.trim().toLowerCase().replace(/\s+/g, "");
  const key = ITEM_NAME_TO_ID[clean] || ITEM_NAME_TO_ID[query.trim().toLowerCase()] || query.toLowerCase().replace(/\s+/g, "-");
  return ITEMS_DATA[key] || null;
}
