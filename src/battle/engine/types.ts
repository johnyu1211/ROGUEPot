import { PartyPokemon } from "../../services/saveService.js";
import { BallPerkId } from "../../utils/perkSvgIcons.js";

export interface StatStages {
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
  acc: number;
  eva: number;
}

export function createDefaultStages(): StatStages {
  return { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 };
}

export interface BattlePokemon {
  speciesId: string;
  name: string;
  nameKo: string;
  nameEn?: string;
  level: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spAtk: number;
  spDef: number;
  speed: number;
  types: string[];
  moves: string[];
  movePps?: number[];
  ability?: string;
  passiveAbility?: string;
  stages: StatStages;
  status?: "par" | "slp" | "psn" | "tox" | "brn" | "frz" | null;
  sleepTurns?: number;
  sleepDuration?: number;
  toxicCounter?: number;
  turnsOnField?: number;
  isFlinched?: boolean;
  isConfused?: boolean;
  confusionTurns?: number;
  substituteHp?: number;
  isProtected?: boolean;
  isEnduring?: boolean;
  protectCounter?: number;
  isTaunted?: boolean;
  tauntTurns?: number;
  isTormented?: boolean;
  gender?: "M" | "F" | "genderless" | null;
  isAttracted?: boolean;
  attractedBy?: "player" | "enemy" | null;
  cannotEscape?: boolean;
  hasNightmare?: boolean;
  isCursed?: boolean;
  mindReaderTargetId?: string | null;
  mindReaderTurnsLeft?: number;
  isForesight?: boolean;
  isIdentified?: boolean;
  isDestinyBond?: boolean;
  isCenterOfAttention?: boolean;
  perishCount?: number;
  lastPhysicalDamageTakenThisTurn?: number;
  lastSpecialDamageTakenThisTurn?: number;
  ivs?: Record<string, number>;
  disabledMove?: string | null;
  disabledTurns?: number;
  mistTurns?: number;
  lightScreenTurns?: number;
  reflectTurns?: number;
  safeguardTurns?: number;
  isRaging?: boolean;
  hasFocusEnergy?: boolean;
  bideDamageTaken?: number;
  lastMoveUsed?: string | null;
  encoreMove?: string | null;
  encoreTurns?: number;
  lastMagnitude?: number;
  batonPassPending?: boolean;
  futureSight?: {
    turnsLeft: number;
    userLevel: number;
    userSpa: number;
    userSpaStage: number;
    userTypes: string[];
    isUserPlayer: boolean;
    userName: string;
  } | null;

  isTransformed?: boolean;
  originalSpeciesId?: string;
  originalTypes?: string[];
  originalMoves?: string[];
  transformedSpeciesId?: string;

  hasIllusion?: boolean;
  illusionTarget?: {
    speciesId: string;
    name: string;
    nameKo: string;
    isShiny?: boolean;
  } | null;

  chargingMove?: string | null;
  isSemiInvulnerable?: boolean;
  semiInvulnerableState?: "air" | "underground" | "underwater" | "shadow" | null;
  mustRecharge?: boolean;

  trapState?: {
    moveKey: string;
    moveNameKo: string;
    moveNameEn: string;
    turnsLeft: number;
  } | null;
  rampageState?: {
    moveKey: string;
    turnsLeft: number;
  } | null;
  rolloutState?: {
    moveKey: string;
    hitCount: number;
    defenseCurlMultiplier: boolean;
  } | null;
  hasUsedDefenseCurl?: boolean;
  hasMinimized?: boolean;
  isSeeded?: boolean;
  furyCutterStreak?: number;
  stockpileCount?: number;
  isCharged?: boolean;

  isShiny?: boolean;
  shinyTier?: number;
  isBoss?: boolean;
  bossShields?: number;
  bossMaxShields?: number;
  hasEndurePerk?: boolean;
  heldItems?: string[];
  isHelpingHandBoosted?: boolean;
  heldItem?: string | null;
  lastConsumedItem?: string | null;
  isMagicCoat?: boolean;
  isIngrained?: boolean;
  yawnTurns?: number;
  knockedOffItem?: string | null;
  wishState?: {
    turnsLeft: number;
    healAmount: number;
    userName: string;
    userNameKo: string;
  } | null;
}

export interface TurnActionInfo {
  actor: "player" | "enemy";
  moveKey: string;
  moveName: string;
  type: string;
  isSpecial: boolean;
  log: string;
  enemyHpBefore?: number;
  playerHpBefore?: number;
  enemyHpAfter: number;
  playerHpAfter: number;
  enemyStatusBefore?: string | null;
  playerStatusBefore?: string | null;
  enemyStatusAfter?: string | null;
  playerStatusAfter?: string | null;
  statChanges?: {
    target: "player" | "enemy";
    direction: "up" | "down";
  }[];
  typeMod?: number;
  hitCount?: number;
  isSuperEffective?: boolean;
  damage?: number;
  isHit?: boolean;
  wasDescentFromAir?: boolean;
  isTurn1Launch?: boolean;
  chargingMove?: string | null;
  canAct?: boolean;
  copiedMoveKey?: string;
}

export interface BattleState {
  userId: string;
  slotId: number;
  wave: number;
  biome: string;
  gameMode: string;
  enemy: BattlePokemon;
  playerActiveIndex: number;
  playerParty: PartyPokemon[];
  playerBattleMon: BattlePokemon;
  dialogueText: string;
  phase: "MAIN" | "FIGHT" | "BAG" | "PARTY" | "VICTORY" | "DEFEAT" | "SWITCH" | "HEAL_PARTY";
  turnCount: number;
  money: number;
  score: number;
  playerExp: number;
  playerMaxExp: number;
  weather?: "sun" | "rain" | "sand" | "snow" | null;
  weatherTurns?: number;
  turnActions?: TurnActionInfo[];
  lastMoveEffect?: {
    moveKey: string;
    moveName?: string;
    type: string;
    isSpecial: boolean;
    isPlayerAttacking: boolean;
    statChanges?: {
      target: "player" | "enemy";
      direction: "up" | "down";
    }[];
    wasDescentFromAir?: boolean;
    hugTriggered?: boolean;
    copiedMoveKey?: string;
  } | null;
  pendingBallPerk?: BallPerkId | null;
  activeBallPerk?: BallPerkId | null;
  stickyWebTurns?: number;
  rockSolidTurns?: number;
  chillyTurns?: number;
  dinosaurTurns?: number;
  heatTimer?: number;
  overchargeTurnCount?: number;
  downfallTurnCount?: number;
  playerSpikesLayers?: number;
  enemySpikesLayers?: number;
  hugTriggered?: boolean;
  messageId?: string;
  playerWishState?: {
    turnsLeft: number;
    healAmount: number;
    userName: string;
    userNameKo: string;
  } | null;
  enemyWishState?: {
    turnsLeft: number;
    healAmount: number;
    userName: string;
    userNameKo: string;
  } | null;
}
