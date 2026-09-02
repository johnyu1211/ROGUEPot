import { Image } from "@napi-rs/canvas";
import { DexPokemonInfo } from "../services/pokeApiService.js";
import { StarterEntry } from "../data/starterCosts.js";

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
  isSingleplayer?: boolean;
  selectedMenu?: number;
  lang?: "en" | "ko";
}

export interface MultiplayerScreenOptions {
  username?: string;
  avatarUrl?: string;
  party?: TitleScreenPartyPokemon[];
  lang?: "en" | "ko";
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

export interface PokedexScreenOptions {
  selectedPokemon?: DexPokemonInfo | null;
  pageList?: DexPokemonInfo[];
  currentPage?: number;
  totalPages?: number;
  activeAbility?: string;
  lang?: "en" | "ko";
  allowFetchSprites?: boolean;
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

export interface GenSelectScreenOptions {
  currentGen: number;
  lang?: "en" | "ko";
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

export interface SaveSlotsScreenOptions {
  slots: Record<number, any>;
  selectedSlotId?: number;
  deleteMode?: boolean;
  lang?: "en" | "ko";
  inGameMessage?: InGameMessage;
}

export interface BattleScreenOptions {
  battle: any;
  lang?: "en" | "ko";
  inGameMessage?: InGameMessage;
}

export interface PbInfoAssets {
  playerBox: Image | null;
  enemyBox: Image | null;
  bossBox: Image | null;
  hpLabel: Image | null;
  categories: Image | null;
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
