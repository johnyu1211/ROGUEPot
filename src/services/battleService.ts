import { saveService, PartyPokemon, GameSlot } from "./saveService.js";
import { MOVES_DATA, MoveData } from "../data/movesKo.js";
import { STARTER_DATABASE, StarterEntry } from "../data/starterCosts.js";
import { POKEMON_SPECIES_DATA, SpeciesBaseData } from "../data/pokemonStats.js";
import { POKEMON_NAMES_KO } from "../data/pokemonNamesKo.js";
import { ITEMS_DATA } from "../data/itemsKo.js";

export const TYPE_CHART: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  electric: { water: 2, grass: 0.5, electric: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, grass: 0.5, electric: 2, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { grass: 2, electric: 0.5, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

export interface StatStages {
  atk: number; // -6 ~ +6
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
  toxicCounter?: number;
  isFlinched?: boolean;
  isConfused?: boolean;
  confusionTurns?: number;
  substituteHp?: number;
  isProtected?: boolean;

  // Special Mechanic: Transform (변신 / 괴짜)
  isTransformed?: boolean;
  originalSpeciesId?: string;
  originalTypes?: string[];
  originalMoves?: string[];
  transformedSpeciesId?: string;

  // Special Mechanic: Illusion (일루전 - 조로아크/조로아)
  hasIllusion?: boolean;
  illusionTarget?: {
    speciesId: string;
    name: string;
    nameKo: string;
    isShiny?: boolean;
  } | null;

  isShiny?: boolean;
  shinyTier?: number;
  isBoss?: boolean;
  bossShields?: number;
  bossMaxShields?: number;
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
  phase: "MAIN" | "FIGHT" | "BAG" | "PARTY" | "VICTORY" | "DEFEAT";
  turnCount: number;
  money: number;
  score: number;
  playerExp: number;
  playerMaxExp: number;
  weather?: "sun" | "rain" | "sand" | "snow" | null;
  weatherTurns?: number;
}

const BIOME_ENCOUNTERS: Record<string, string[]> = {
  "Town": ["pidgey", "rattata", "zigzagoon", "sentret", "eevee", "meowth", "fletchling", "rookidee", "skwovet", "wooloo"],
  "Plains": ["scyther", "shinx", "mareep", "taillow", "starly", "lechonk", "growlithe", "ponyta", "blitzle", "electrike"],
  "Grass": ["oddish", "bellsprout", "budew", "cherubi", "caterpie", "weedle", "wurmple", "hoothoot", "bounsweet", "smoliv"],
  "Forest": ["spinarak", "ledyba", "pineco", "nincada", "sewaddle", "venipede", "phantump", "pumpkaboo", "foongus", "morelull"],
  "Cave": ["zubat", "geodude", "diglett", "machop", "roggenrola", "drilbur", "noibat", "gligar", "onix", "carbink"],
  "Sea": ["magikarp", "tentacool", "poliwag", "psyduck", "marill", "buizel", "wingull", "horsea", "finizen", "chewtle"],
  "Metropolis": ["magnemite", "voltorb", "porygon", "klink", "elekid", "grimer", "trubbish", "rotom", "charjabug", "varoom"],
  "Dojo": ["mankey", "tyrogue", "makuhita", "meditite", "riolu", "timburr", "pancham", "crabrawler", "clobbopus", "heracross"],
  "Volcano": ["slugma", "numel", "torkoal", "magby", "darumaka", "litwick", "salandit", "charcadet", "houndour", "sizzlipede"],
};

const BOSS_ENCOUNTERS: Record<number, string[]> = {
  10: ["corviknight", "pidgeot", "raticate", "linoone", "ursaring"],
  20: ["gyarados", "arcanine", "gengar", "machamp", "alakazam"],
  30: ["dragonite", "salamence", "garchomp", "tyranitar", "hydreigon"],
  50: ["zapdos", "articuno", "moltres", "raikou", "entei", "suicune"],
  100: ["rayquaza", "mewtwo", "kyogre", "groudon"],
  200: ["eternatus"],
};

export function getStageMultiplier(stage: number): number {
  const s = Math.max(-6, Math.min(6, stage));
  if (s >= 0) return (2 + s) / 2;
  return 2 / (2 - s);
}

export function getAccuracyMultiplier(stage: number): number {
  const s = Math.max(-6, Math.min(6, stage));
  if (s >= 0) return (3 + s) / 3;
  return 3 / (3 - s);
}

export class BattleService {
  private static instance: BattleService;
  private activeBattles: Map<string, BattleState> = new Map();

  private constructor() {}

  public static getInstance(): BattleService {
    if (!BattleService.instance) {
      BattleService.instance = new BattleService();
    }
    return BattleService.instance;
  }

  private getBattleKey(userId: string, slotId: number): string {
    return `${userId}_${slotId}`;
  }

  /**
   * Helper to look up official species stats from POKEMON_SPECIES_DATA
   */
  public getSpeciesData(speciesId: string): SpeciesBaseData {
    const cleanId = speciesId.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const found = POKEMON_SPECIES_DATA[cleanId] || POKEMON_SPECIES_DATA[cleanId.replace(/-/g, "")];
    if (found) return found;

    // Fallback based on starter costs DB
    const starter = STARTER_DATABASE.find((s) => s.speciesId === speciesId);
    if (starter) {
      return {
        num: starter.dexNumber,
        name: starter.name,
        types: starter.types.map((t) => t.charAt(0).toUpperCase() + t.slice(1)),
        baseStats: { hp: 50, atk: 60, def: 55, spa: 60, spd: 55, spe: 55 },
        abilities: { "0": starter.ability, "H": starter.hiddenAbility || "" },
      };
    }

    return {
      num: 1,
      name: speciesId.charAt(0).toUpperCase() + speciesId.slice(1),
      types: ["Normal"],
      baseStats: { hp: 50, atk: 50, def: 50, spa: 50, spd: 50, spe: 50 },
      abilities: { "0": "Run Away" },
    };
  }

  /**
   * Computes official level-scaled Pokemon battle stats (HP, Atk, Def, SpA, SpD, Spe)
   */
  public calculateStats(speciesId: string, level: number, isBoss: boolean = false) {
    const data = this.getSpeciesData(speciesId);
    const { hp: bHp, atk: bAtk, def: bDef, spa: bSpa, spd: bSpd, spe: bSpe } = data.baseStats;

    const iv = 31; // Max 31 IVs for clean calculation
    const hpMult = isBoss ? 2.0 : 1.0;

    const maxHp = Math.floor((Math.floor(((2 * bHp + iv) * level) / 100) + level + 10) * hpMult);
    const atk = Math.floor(((2 * bAtk + iv) * level) / 100) + 5;
    const def = Math.floor(((2 * bDef + iv) * level) / 100) + 5;
    const spAtk = Math.floor(((2 * bSpa + iv) * level) / 100) + 5;
    const spDef = Math.floor(((2 * bSpd + iv) * level) / 100) + 5;
    const speed = Math.floor(((2 * bSpe + iv) * level) / 100) + 5;

    const types = data.types.map((t) => t.toLowerCase());

    return { maxHp, atk, def, spAtk, spDef, speed, types };
  }

  /**
   * Spawns a wild encounter with proper stats and abilities
   */
  public spawnWildPokemon(wave: number, biome: string, forcedSpecies?: string): BattlePokemon {
    const isBoss = forcedSpecies?.includes("gmax") || forcedSpecies?.includes("mega") || wave % 10 === 0;
    const pool = isBoss ? (BOSS_ENCOUNTERS[wave] || BOSS_ENCOUNTERS[10]) : (BIOME_ENCOUNTERS[biome] || BIOME_ENCOUNTERS["Town"]);
    const speciesId = forcedSpecies || pool[Math.floor(Math.random() * pool.length)] || "pidgey";

    const sData = this.getSpeciesData(speciesId);
    const starter = STARTER_DATABASE.find((s) => s.speciesId === speciesId);
    let nameKo = POKEMON_NAMES_KO[sData.num] || starter?.nameKo || sData.name;
    let name = sData.name;

    if (speciesId === "inteleon-gmax" || speciesId === "inteleongmax" || speciesId === "inteleon-mega") {
      nameKo = "인텔리온 (거다이맥스)";
      name = "Inteleon [G-Max]";
    }

    const level = Math.max(2, Math.floor(wave * 1.2) + Math.floor(Math.random() * 2));
    const isShiny = Math.random() < 0.05;

    const stats = this.calculateStats(speciesId, level, isBoss);

    let moves = starter?.starterMoves && starter.starterMoves.length > 0
      ? starter.starterMoves.slice(0, 4)
      : ["Tackle", "Growl", "Quick Attack", "Scratch"];

    if (speciesId.includes("inteleon")) {
      moves = ["Snipe Shot", "Hydro Pump", "Ice Beam", "Dark Pulse"];
    }

    return {
      speciesId,
      name,
      nameKo,
      level,
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      atk: stats.atk,
      def: stats.def,
      spAtk: stats.spAtk,
      spDef: stats.spDef,
      speed: stats.speed,
      types: stats.types.length > 0 ? stats.types : ["normal"],
      moves,
      movePps: moves.map((m) => {
        const mInfo = MOVES_DATA[m.toLowerCase().replace(/[\s_]+/g, "-")];
        return mInfo?.pp || 20;
      }),
      ability: sData.abilities["0"] || "Limber",
      stages: createDefaultStages(),
      isShiny,
      isBoss,
      bossShields: isBoss ? 2 : undefined,
      bossMaxShields: isBoss ? 2 : undefined,
    };
  }

  /**
   * Builds active player combatant BattlePokemon from party member
   */
  public createPlayerBattleMon(partyMon: PartyPokemon, fullParty: PartyPokemon[]): BattlePokemon {
    const speciesId = partyMon.speciesId;
    const sData = this.getSpeciesData(speciesId);
    const starter = STARTER_DATABASE.find((s) => s.speciesId === speciesId);
    const nameKo = POKEMON_NAMES_KO[sData.num] || starter?.nameKo || partyMon.name.replace(/^✨\s*/, "") || sData.name;
    const name = sData.name;

    const stats = this.calculateStats(speciesId, partyMon.level);
    const moves = partyMon.moves && partyMon.moves.length > 0
      ? partyMon.moves.filter((m) => m && m !== "---")
      : (starter?.starterMoves || ["Tackle", "Growl"]);

    const ability = partyMon.useHiddenAbility ? (starter?.hiddenAbility || sData.abilities["H"]) : (starter?.ability || sData.abilities["0"]);
    const passiveAbility = partyMon.usePassive ? (starter?.passiveAbility || "Run Away") : undefined;

    const battleMon: BattlePokemon = {
      speciesId,
      name: partyMon.name,
      nameKo,
      level: partyMon.level,
      hp: partyMon.hp > 0 ? partyMon.hp : stats.maxHp,
      maxHp: stats.maxHp,
      atk: stats.atk,
      def: stats.def,
      spAtk: stats.spAtk,
      spDef: stats.spDef,
      speed: stats.speed,
      types: stats.types,
      moves,
      movePps: moves.map((m) => {
        const mInfo = MOVES_DATA[m.toLowerCase().replace(/[\s_]+/g, "-")];
        return mInfo?.pp || 20;
      }),
      ability,
      passiveAbility,
      stages: createDefaultStages(),
      isShiny: partyMon.isShiny || (partyMon.shinyTier !== undefined && partyMon.shinyTier > 0),
      shinyTier: partyMon.shinyTier,
    };

    // Special: Illusion Ability check (Zoroark / Zorua)
    if (ability === "Illusion" || passiveAbility === "Illusion") {
      // Pick the last alive party member other than this one
      const lastPartyMon = [...fullParty].reverse().find((p) => p.speciesId !== speciesId && p.hp > 0);
      if (lastPartyMon) {
        const tData = this.getSpeciesData(lastPartyMon.speciesId);
        const tStarter = STARTER_DATABASE.find((s) => s.speciesId === lastPartyMon.speciesId);
        battleMon.hasIllusion = true;
        battleMon.illusionTarget = {
          speciesId: lastPartyMon.speciesId,
          name: lastPartyMon.name,
          nameKo: POKEMON_NAMES_KO[tData.num] || tStarter?.nameKo || lastPartyMon.name,
          isShiny: lastPartyMon.isShiny,
        };
      }
    }

    return battleMon;
  }

  /**
   * Initializes or gets the active battle state
   */
  public getOrCreateBattle(userId: string, slotId: number): BattleState {
    const key = this.getBattleKey(userId, slotId);
    let existing = this.activeBattles.get(key);

    const profile = saveService.getProfile(userId);
    const slot = profile.slots[slotId];

    if (!slot) {
      throw new Error(`Slot ${slotId} not found for user ${userId}`);
    }

    if (existing && existing.wave === slot.wave) {
      return existing;
    }

    const wildPokemon = this.spawnWildPokemon(slot.wave, slot.biome || "Town");
    const isKo = profile.language === "ko";

    const activeLeader = slot.party[0] || {
      speciesId: "bulbasaur",
      name: "이상해씨",
      level: 5,
      hp: 20,
      maxHp: 20,
      moves: ["Tackle", "Growl", "Vine Whip", "Leech Seed"],
    };

    const playerBattleMon = this.createPlayerBattleMon(activeLeader, slot.party);

    let dialogueText = wildPokemon.isBoss
      ? (isKo ? `🚨 보스 포켓몬 ${wildPokemon.nameKo}(이)가 나타났다!` : `🚨 Boss Pokémon ${wildPokemon.name} appeared!`)
      : (isKo ? `야생의 ${wildPokemon.nameKo}(이)가 나타났다!` : `Wild ${wildPokemon.name} appeared!`);

    // Entry Ability Trigger 1: Imposter (괴짜) Auto-Transform
    if (playerBattleMon.ability === "Imposter" || playerBattleMon.passiveAbility === "Imposter") {
      this.applyTransform(playerBattleMon, wildPokemon);
      dialogueText += isKo
        ? `\n[특성 괴짜 발동!] ${playerBattleMon.name}(이)가 ${wildPokemon.nameKo}(으)로 변신했다!`
        : `\n[Imposter!] ${playerBattleMon.name} transformed into ${wildPokemon.name}!`;
    }

    // Entry Ability Trigger 2: Intimidate (위협)
    if (playerBattleMon.ability === "Intimidate" || playerBattleMon.passiveAbility === "Intimidate") {
      wildPokemon.stages.atk = Math.max(-6, wildPokemon.stages.atk - 1);
      dialogueText += isKo
        ? `\n[특성 위협 발동!] 상대 ${wildPokemon.nameKo}의 공격이 떨어졌다! (-1)`
        : `\n[Intimidate!] Foe ${wildPokemon.name}'s Attack fell! (-1)`;
    }
    if (wildPokemon.ability === "Intimidate") {
      playerBattleMon.stages.atk = Math.max(-6, playerBattleMon.stages.atk - 1);
      dialogueText += isKo
        ? `\n[상대 위협 발동!] ${playerBattleMon.name}의 공격이 떨어졌다! (-1)`
        : `\n[Foe Intimidate!] ${playerBattleMon.name}'s Attack fell! (-1)`;
    }

    const state: BattleState = {
      userId,
      slotId,
      wave: slot.wave,
      biome: slot.biome || "Town",
      gameMode: slot.gameMode || "Classic",
      enemy: wildPokemon,
      playerActiveIndex: 0,
      playerParty: slot.party,
      playerBattleMon,
      dialogueText,
      phase: "MAIN",
      turnCount: 0,
      money: slot.money || 1000,
      score: slot.score || 0,
      playerExp: 0,
      playerMaxExp: activeLeader.level * 15,
    };

    this.activeBattles.set(key, state);
    return state;
  }

  /**
   * Applies Transform mechanics from user onto target
   */
  public applyTransform(user: BattlePokemon, target: BattlePokemon) {
    user.isTransformed = true;
    user.originalSpeciesId = user.speciesId;
    user.originalTypes = [...user.types];
    user.originalMoves = [...user.moves];
    user.transformedSpeciesId = target.speciesId;

    user.types = [...target.types];
    user.atk = target.atk;
    user.def = target.def;
    user.spAtk = target.spAtk;
    user.spDef = target.spDef;
    user.speed = target.speed;
    user.stages = { ...target.stages };
    user.moves = [...target.moves];
    user.movePps = target.moves.map(() => 5); // 5 PP for all transformed moves
  }

  /**
   * Computes type effectiveness multiplier across 18 types
   */
  public getTypeEffectiveness(moveType: string, targetTypes: string[]): number {
    let multiplier = 1.0;
    const chart = TYPE_CHART[moveType.toLowerCase()];
    if (!chart) return multiplier;

    for (const t of targetTypes) {
      const mod = chart[t.toLowerCase()];
      if (mod !== undefined) {
        multiplier *= mod;
      }
    }
    return multiplier;
  }

  /**
   * Executes a move turn with full speed, priority, damage formula, and secondary effects
   */
  public executePlayerMove(userId: string, slotId: number, moveKey: string, lang: "ko" | "en" = "ko"): BattleState {
    const battle = this.getOrCreateBattle(userId, slotId);
    const playerMon = battle.playerBattleMon;
    const enemyMon = battle.enemy;

    if (!playerMon || playerMon.hp <= 0 || enemyMon.hp <= 0) return battle;

    const isKo = lang === "ko";
    const pMoveKey = moveKey.toLowerCase().replace(/[\s_]+/g, "-");
    const pMove = MOVES_DATA[pMoveKey] || {
      id: 0,
      name: moveKey,
      nameKo: moveKey,
      type: "normal",
      power: 40,
      accuracy: 100,
      pp: 35,
      category: "physical",
      description: "기본 공격 기술",
    };

    // Enemy chooses random move
    const eMoveRaw = enemyMon.moves[Math.floor(Math.random() * enemyMon.moves.length)] || "Tackle";
    const eMoveKey = eMoveRaw.toLowerCase().replace(/[\s_]+/g, "-");
    const eMove = MOVES_DATA[eMoveKey] || {
      id: 0,
      name: eMoveRaw,
      nameKo: eMoveRaw,
      type: "normal",
      power: 40,
      accuracy: 100,
      pp: 35,
      category: "physical",
      description: "기본 공격 기술",
    };

    // 1. Determine Turn Priority & Speed Order
    const pPriority = this.getMovePriority(pMoveKey);
    const ePriority = this.getMovePriority(eMoveKey);

    const pSpeed = playerMon.speed * getStageMultiplier(playerMon.stages.spe) * (playerMon.status === "par" ? 0.5 : 1.0);
    const eSpeed = enemyMon.speed * getStageMultiplier(enemyMon.stages.spe) * (enemyMon.status === "par" ? 0.5 : 1.0);

    let playerGoesFirst = true;
    if (pPriority > ePriority) {
      playerGoesFirst = true;
    } else if (pPriority < ePriority) {
      playerGoesFirst = false;
    } else {
      playerGoesFirst = pSpeed >= eSpeed;
    }

    let turnLogs: string[] = [];

    // Reset single-turn flags
    playerMon.isProtected = false;
    enemyMon.isProtected = false;
    playerMon.isFlinched = false;
    enemyMon.isFlinched = false;

    // First Actor & Second Actor
    const firstActor = playerGoesFirst ? playerMon : enemyMon;
    const firstMove = playerGoesFirst ? pMove : eMove;
    const secondActor = playerGoesFirst ? enemyMon : playerMon;
    const secondMove = playerGoesFirst ? eMove : pMove;
    const isFirstPlayer = playerGoesFirst;

    // EXECUTE 1ST ACTION
    const res1 = this.executeSingleAction(firstActor, secondActor, firstMove, isFirstPlayer, isKo, battle);
    turnLogs.push(res1.log);

    // CHECK IF 2ND ACTOR FAINTED
    if (secondActor.hp > 0 && !secondActor.isFlinched) {
      // EXECUTE 2ND ACTION
      const res2 = this.executeSingleAction(secondActor, firstActor, secondMove, !isFirstPlayer, isKo, battle);
      turnLogs.push(res2.log);
    } else if (secondActor.isFlinched && secondActor.hp > 0) {
      const monName = isFirstPlayer ? (isKo ? enemyMon.nameKo : enemyMon.name) : playerMon.name;
      turnLogs.push(isKo ? `${monName}(은)는 풀이 죽어 기술을 쓸 수 없었다!` : `${monName} flinched and couldn't move!`);
    }

    // 2. Turn-End Effects (Status Damage, Sandstorm, Moody, Speed Boost)
    this.processTurnEndEffects(playerMon, isKo, turnLogs, battle.weather);
    this.processTurnEndEffects(enemyMon, isKo, turnLogs, battle.weather);

    // Weather Turn Countdown
    if (battle.weather && battle.weatherTurns) {
      battle.weatherTurns -= 1;
      if (battle.weatherTurns <= 0) {
        battle.weather = null;
        battle.weatherTurns = undefined;
        turnLogs.push(isKo ? `날씨가 원래대로 돌아왔다!` : `The weather returned to normal!`);
      }
    }

    // Sync HP with player party slot
    battle.playerParty[battle.playerActiveIndex].hp = playerMon.hp;

    // Check Victory / Defeat
    if (enemyMon.hp <= 0) {
      battle.phase = "VICTORY";
      const expGain = Math.floor(enemyMon.level * 15);
      const moneyGain = Math.floor(enemyMon.level * 120);
      battle.money += moneyGain;
      battle.score += enemyMon.level * 10;
      battle.playerExp += expGain;

      turnLogs.push(
        isKo
          ? `🏆 상대 ${enemyMon.nameKo}(이)가 쓰러졌다! 획득: +₩${moneyGain.toLocaleString()} | +${expGain} EXP`
          : `🏆 Foe ${enemyMon.name} fainted! Won: +₩${moneyGain.toLocaleString()} | +${expGain} EXP`
      );

      // Level Up Check
      if (battle.playerExp >= battle.playerMaxExp) {
        playerMon.level += 1;
        const newStats = this.calculateStats(playerMon.speciesId, playerMon.level);
        playerMon.maxHp = newStats.maxHp;
        playerMon.hp = Math.min(playerMon.maxHp, playerMon.hp + 5);
        playerMon.atk = newStats.atk;
        playerMon.def = newStats.def;
        playerMon.spAtk = newStats.spAtk;
        playerMon.spDef = newStats.spDef;
        playerMon.speed = newStats.speed;
        battle.playerExp = 0;
        battle.playerMaxExp = playerMon.level * 15;
        battle.playerParty[battle.playerActiveIndex].level = playerMon.level;
        battle.playerParty[battle.playerActiveIndex].hp = playerMon.hp;
        battle.playerParty[battle.playerActiveIndex].maxHp = playerMon.maxHp;
        turnLogs.push(isKo ? `🎉 ${playerMon.name}의 레벨이 ${playerMon.level}(으)로 올랐다!` : `🎉 ${playerMon.name} grew to Lv. ${playerMon.level}!`);
      }
    } else if (playerMon.hp <= 0) {
      const aliveIdx = battle.playerParty.findIndex((p) => p.hp > 0);
      if (aliveIdx >= 0) {
        battle.playerActiveIndex = aliveIdx;
        battle.playerBattleMon = this.createPlayerBattleMon(battle.playerParty[aliveIdx], battle.playerParty);
        turnLogs.push(
          isKo
            ? `💀 ${playerMon.name}(이)가 쓰러졌다! 가랏, ${battle.playerBattleMon.name}!`
            : `💀 ${playerMon.name} fainted! Go, ${battle.playerBattleMon.name}!`
        );
      } else {
        battle.phase = "DEFEAT";
        turnLogs.push(isKo ? `💀 모든 포켓몬이 쓰러졌다... 눈앞이 캄캄해졌다!` : `💀 All Pokémon fainted... You blacked out!`);
      }
    }

    // If not VICTORY and not DEFEAT, reset battle phase back to MAIN command select!
    if (battle.phase !== "VICTORY" && battle.phase !== "DEFEAT") {
      battle.phase = "MAIN";
    }

    battle.dialogueText = turnLogs.join("\n");
    battle.turnCount += 1;

    saveService.updateSlot(userId, slotId, {
      party: battle.playerParty,
      money: battle.money,
      score: battle.score,
    });

    return battle;
  }

  /**
   * Executes a single actor's move against target
   */
  private executeSingleAction(
    actor: BattlePokemon,
    target: BattlePokemon,
    move: MoveData,
    isActorPlayer: boolean,
    isKo: boolean,
    battle?: BattleState
  ): { log: string; damage: number } {
    const actorName = isActorPlayer ? actor.name : (isKo ? actor.nameKo : actor.name);
    const targetName = isActorPlayer ? (isKo ? target.nameKo : target.name) : target.name;
    const moveName = isKo ? move.nameKo : move.name.toUpperCase();

    // 1. Status Impediment Check (Sleep, Freeze, Paralysis)
    if (actor.status === "slp") {
      actor.sleepTurns = (actor.sleepTurns || 0) + 1;
      if (actor.sleepTurns >= 3 || Math.random() < 0.33) {
        actor.status = null;
        actor.sleepTurns = 0;
        return { log: isKo ? `${actorName}(은)는 잠에서 깨어났다!` : `${actorName} woke up!`, damage: 0 };
      } else {
        return { log: isKo ? `${actorName}(은)는 쿨쿨 잠들어 있다...` : `${actorName} is fast asleep!`, damage: 0 };
      }
    }

    if (actor.status === "frz") {
      if (Math.random() < 0.2) {
        actor.status = null;
        return { log: isKo ? `${actorName}의 얼음이 녹았다!` : `${actorName} thawed out!`, damage: 0 };
      } else {
        return { log: isKo ? `${actorName}(은)는 얼어붙어서 움직일 수 없다!` : `${actorName} is frozen solid!`, damage: 0 };
      }
    }

    if (actor.status === "par" && Math.random() < 0.25) {
      return { log: isKo ? `${actorName}(은)는 몸이 저려서 움직일 수 없다!` : `${actorName} is fully paralyzed!`, damage: 0 };
    }

    // 2. Metronome (손가락흔들기)
    let activeMove = move;
    if (move.name === "metronome" || move.nameKo === "손가락흔들기") {
      const allMoveKeys = Object.keys(MOVES_DATA);
      const randomKey = allMoveKeys[Math.floor(Math.random() * allMoveKeys.length)];
      activeMove = MOVES_DATA[randomKey] || move;
    }

    // 3. Status Move Processing
    if (activeMove.category === "status") {
      const statLog = this.applyStatusMove(actor, target, activeMove, actorName, targetName, isKo, battle);
      return { log: `${actorName}의 ${isKo ? activeMove.nameKo : activeMove.name.toUpperCase()}!\n${statLog}`, damage: 0 };
    }

    const moveNameLower = activeMove.name.toLowerCase().replace(/[\s_]+/g, "-");

    // 3.5. OHKO (One-Hit KO / 일격필살기: 뿔드릴, 가위자르기, 땅가르기, 절대영도)
    const isOHKO = ["horn-drill", "guillotine", "fissure", "sheer-cold"].includes(moveNameLower);
    if (isOHKO) {
      // Level check
      if (actor.level < target.level) {
        return {
          log: isKo
            ? `${actorName}의 ${moveName}! 하지만 레벨이 낮아 상대에게 통하지 않았다!`
            : `${actorName}'s ${moveName}! But it didn't affect ${targetName} due to lower level!`,
          damage: 0,
        };
      }

      // Type immunity check (Ghost vs Normal, Flying vs Ground, Ice vs Sheer Cold)
      const typeMod = this.getTypeEffectiveness(activeMove.type, target.types);
      if (typeMod === 0 || (moveNameLower === "sheer-cold" && target.types.map((t) => t.toLowerCase()).includes("ice"))) {
        return {
          log: isKo
            ? `${actorName}의 ${moveName}! 하지만 ${targetName}에게는 효과가 없는 것 같다...`
            : `${actorName}'s ${moveName}! It doesn't affect ${targetName}...`,
          damage: 0,
        };
      }

      // Accuracy formula: 30 + (User Level - Target Level)%
      const ohkoAcc = Math.min(100, Math.max(0, 30 + (actor.level - target.level)));
      if (Math.random() * 100 > ohkoAcc) {
        return {
          log: isKo
            ? `${actorName}의 ${moveName}! 하지만 공격은 빗나갔다!`
            : `${actorName}'s ${moveName}! But it missed!`,
          damage: 0,
        };
      }

      // Target Protection Check
      if (target.isProtected) {
        return {
          log: isKo
            ? `${actorName}의 ${moveName}! 하지만 ${targetName}(은)는 공격을 막아냈다!`
            : `${actorName}'s ${moveName}! But ${targetName} protected itself!`,
          damage: 0,
        };
      }

      // Sturdy check
      if (target.ability === "Sturdy") {
        return {
          log: isKo
            ? `${actorName}의 ${moveName}!\n[특성 옹골참!] 일격필살 공격을 무효화했다!`
            : `${actorName}'s ${moveName}!\n[Sturdy!] It was immune to the One-Hit KO!`,
          damage: 0,
        };
      }

      const damage = target.hp;
      target.hp = 0;
      return {
        log: isKo
          ? `💥 ${actorName}의 ${moveName}!\n일격필살! ${targetName}(은)는 쓰러졌다!`
          : `💥 ${actorName}'s ${moveName}!\nIt's a One-Hit KO! ${targetName} fainted!`,
        damage,
      };
    }

    // 3.6. Fixed Damage Moves (지구던지기, 나이트헤드, 용의분노, 음파, 분노의앞니, 죽기살기)
    if (moveNameLower === "seismic-toss" || moveNameLower === "night-shade") {
      const typeMod = this.getTypeEffectiveness(activeMove.type, target.types);
      if (typeMod === 0) {
        return { log: isKo ? `${actorName}의 ${moveName}! 하지만 ${targetName}에게는 효과가 없는 것 같다...` : `${actorName}'s ${moveName}! It doesn't affect ${targetName}...`, damage: 0 };
      }
      const damage = actor.level;
      target.hp = Math.max(0, target.hp - damage);
      return { log: isKo ? `${actorName}의 ${moveName}! ${targetName}에게 ${damage}의 고정 데미지!` : `${actorName}'s ${moveName}! Dealt ${damage} fixed damage!`, damage };
    }

    if (moveNameLower === "dragon-rage") {
      const typeMod = this.getTypeEffectiveness(activeMove.type, target.types);
      if (typeMod === 0) {
        return { log: isKo ? `${actorName}의 ${moveName}! 하지만 ${targetName}에게는 효과가 없는 것 같다...` : `${actorName}'s ${moveName}! It doesn't affect ${targetName}...`, damage: 0 };
      }
      const damage = 40;
      target.hp = Math.max(0, target.hp - damage);
      return { log: isKo ? `${actorName}의 ${moveName}! ${targetName}에게 40의 고정 데미지!` : `${actorName}'s ${moveName}! Dealt 40 fixed damage!`, damage };
    }

    if (moveNameLower === "sonic-boom") {
      const typeMod = this.getTypeEffectiveness(activeMove.type, target.types);
      if (typeMod === 0) {
        return { log: isKo ? `${actorName}의 ${moveName}! 하지만 ${targetName}에게는 효과가 없는 것 같다...` : `${actorName}'s ${moveName}! It doesn't affect ${targetName}...`, damage: 0 };
      }
      const damage = 20;
      target.hp = Math.max(0, target.hp - damage);
      return { log: isKo ? `${actorName}의 ${moveName}! ${targetName}에게 20의 고정 데미지!` : `${actorName}'s ${moveName}! Dealt 20 fixed damage!`, damage };
    }

    if (moveNameLower === "super-fang") {
      const typeMod = this.getTypeEffectiveness(activeMove.type, target.types);
      if (typeMod === 0) {
        return { log: isKo ? `${actorName}의 ${moveName}! 하지만 ${targetName}에게는 효과가 없는 것 같다...` : `${actorName}'s ${moveName}! It doesn't affect ${targetName}...`, damage: 0 };
      }
      const damage = Math.max(1, Math.floor(target.hp / 2));
      target.hp = Math.max(0, target.hp - damage);
      return { log: isKo ? `${actorName}의 ${moveName}! ${targetName}의 현재 HP를 절반으로 깎았다! (-${damage})` : `${actorName}'s ${moveName}! Cut ${targetName}'s HP in half! (-${damage})`, damage };
    }

    if (moveNameLower === "endeavor") {
      if (actor.hp >= target.hp) {
        return { log: isKo ? `${actorName}의 ${moveName}! 하지만 아무 일도 일어나지 않았다!` : `${actorName}'s ${moveName}! But nothing happened!`, damage: 0 };
      }
      const damage = target.hp - actor.hp;
      target.hp = actor.hp;
      return { log: isKo ? `${actorName}의 ${moveName}! ${targetName}의 HP를 자신의 HP와 같게 맞췄다! (-${damage})` : `${actorName}'s ${moveName}! Matched ${targetName}'s HP! (-${damage})`, damage };
    }

    // 4. Accuracy Check (Weather Modifications)
    let acc = activeMove.accuracy || 100;
    if (battle?.weather === "rain" && (moveNameLower === "thunder" || moveNameLower === "hurricane")) {
      acc = 1000; // Perfect accuracy in rain
    } else if (battle?.weather === "snow" && moveNameLower === "blizzard") {
      acc = 1000; // Perfect accuracy in snow
    } else if (battle?.weather === "sun" && (moveNameLower === "thunder" || moveNameLower === "hurricane")) {
      acc = 50; // Accuracy drops in harsh sun
    }

    const accStage = actor.stages.acc - target.stages.eva;
    const finalAcc = acc * getAccuracyMultiplier(accStage);
    if (acc < 100 && Math.random() * 100 > finalAcc) {
      return { log: `${actorName}의 ${moveName}! 하지만 공격은 빗나갔다!`, damage: 0 };
    }

    // 5. Target Protection Check
    if (target.isProtected) {
      return { log: `${actorName}의 ${moveName}! 하지만 ${targetName}(은)는 공격을 막아냈다!`, damage: 0 };
    }

    // 6. Damage Calculation Formula
    const isSpecial = activeMove.category === "special";
    const atkStat = isSpecial
      ? actor.spAtk * getStageMultiplier(actor.stages.spa)
      : actor.atk * getStageMultiplier(actor.stages.atk) * (actor.status === "brn" ? 0.5 : 1.0);

    let defStat = isSpecial
      ? target.spDef * getStageMultiplier(target.stages.spd)
      : target.def * getStageMultiplier(target.stages.def);

    // Weather Stat Boosts (Rock Sp.Def in Sand, Ice Def in Snow)
    if (battle?.weather === "sand" && target.types.map((t) => t.toLowerCase()).includes("rock") && isSpecial) {
      defStat = Math.floor(defStat * 1.5);
    }
    if (battle?.weather === "snow" && target.types.map((t) => t.toLowerCase()).includes("ice") && !isSpecial) {
      defStat = Math.floor(defStat * 1.5);
    }

    // Variable Power Calculation
    let power = activeMove.power || 40;

    // Eruption / Water Spout / Dragon Energy (분화, 해수스파우팅, 드래곤에너지)
    if (moveNameLower === "eruption" || moveNameLower === "water-spout" || moveNameLower === "dragon-energy") {
      power = Math.max(1, Math.floor(150 * (actor.hp / Math.max(1, actor.maxHp))));
    }

    // Reversal / Flail (기사회생, 버티고버티기)
    if (moveNameLower === "reversal" || moveNameLower === "flail") {
      const hpRatio = actor.hp / Math.max(1, actor.maxHp);
      if (hpRatio < 0.0417) power = 200;
      else if (hpRatio < 0.1042) power = 150;
      else if (hpRatio < 0.2083) power = 100;
      else if (hpRatio < 0.3542) power = 80;
      else if (hpRatio < 0.6875) power = 40;
      else power = 20;
    }

    // Gyro Ball (자이로볼)
    if (moveNameLower === "gyro-ball") {
      power = Math.min(150, Math.floor(25 * (target.speed / Math.max(1, actor.speed))) + 1);
    }

    // Electro Ball (일렉트릭볼)
    if (moveNameLower === "electro-ball") {
      const spdRatio = actor.speed / Math.max(1, target.speed);
      if (spdRatio >= 4) power = 150;
      else if (spdRatio >= 3) power = 120;
      else if (spdRatio >= 2) power = 80;
      else if (spdRatio >= 1) power = 60;
      else power = 40;
    }

    // Grass Knot / Low Kick / Heavy Slam / Heat Crash (풀묶기, 안다리걸기, 헤비봄버, 히트스탬프)
    if (moveNameLower === "grass-knot" || moveNameLower === "low-kick" || moveNameLower === "heavy-slam" || moveNameLower === "heat-crash") {
      power = 80;
    }

    // Self-Destruct / Explosion / Misty Explosion (자폭, 대폭발, 미스트버스트)
    const isSelfDestruct = moveNameLower === "explosion" || moveNameLower === "self-destruct" || moveNameLower === "misty-explosion";
    if (isSelfDestruct) {
      power = moveNameLower === "explosion" ? 250 : (moveNameLower === "self-destruct" ? 200 : 100);
    }

    // Weather Move Power Multipliers
    let weatherMod = 1.0;
    if (battle?.weather === "sun") {
      if (activeMove.type.toLowerCase() === "fire") weatherMod = 1.5;
      else if (activeMove.type.toLowerCase() === "water") weatherMod = 0.5;
    } else if (battle?.weather === "rain") {
      if (activeMove.type.toLowerCase() === "water") weatherMod = 1.5;
      else if (activeMove.type.toLowerCase() === "fire") weatherMod = 0.5;
    } else if (battle?.weather === "sand" || battle?.weather === "snow") {
      if (moveNameLower === "solar-beam" || moveNameLower === "solar-blade") weatherMod = 0.5;
    }

    const isStab = actor.types.map((t) => t.toLowerCase()).includes(activeMove.type.toLowerCase());
    const stabMod = isStab ? 1.5 : 1.0;
    const typeMod = this.getTypeEffectiveness(activeMove.type, target.types);

    const isCrit = Math.random() < 0.08;
    const critMod = isCrit ? 1.5 : 1.0;
    const randomMod = 0.85 + Math.random() * 0.15;

    let damage = Math.floor(
      (((2 * actor.level / 5 + 2) * power * (atkStat / Math.max(1, defStat))) / 50 + 2) *
      stabMod * typeMod * critMod * randomMod * weatherMod
    );
    damage = Math.max(typeMod > 0 ? 1 : 0, damage);

    // Multi-hit moves
    const hitCount = this.getMultiHitCount(activeMove.name);
    if (hitCount > 1) {
      damage *= hitCount;
    }

    // 7. Apply Damage (Substitute vs Main Body)
    let damageLog = "";
    if (target.substituteHp && target.substituteHp > 0) {
      target.substituteHp = Math.max(0, target.substituteHp - damage);
      if (target.substituteHp === 0) {
        damageLog = isKo ? ` 대타출동 분신이 대신 맞고 부서졌다!` : ` The substitute broke!`;
      } else {
        damageLog = isKo ? ` 대타출동 분신이 데미지를 흡수했다! (${damage})` : ` The substitute took ${damage} damage!`;
      }
    } else {
      // Direct damage -> Breaks Illusion!
      if (target.hasIllusion) {
        target.hasIllusion = false;
        target.illusionTarget = null;
        damageLog += isKo ? `\n✨ 일루전이 깨져 본래의 ${isActorPlayer ? target.name : target.nameKo} 모습이 드러났다!` : `\n✨ The illusion broke!`;
      }

      // Sturdy check
      if (target.ability === "Sturdy" && target.hp === target.maxHp && damage >= target.hp) {
        target.hp = 1;
        damageLog += isKo ? ` [특성 옹골참!] ${targetName}(은)는 1의 HP로 버텼다!` : ` [Sturdy!] ${targetName} held on with 1 HP!`;
      } else {
        target.hp = Math.max(0, target.hp - damage);
      }
    }

    // Self-destruct faints actor
    if (isSelfDestruct) {
      actor.hp = 0;
      damageLog += isKo ? `\n💥 ${actorName}(은)는 폭발하여 스스로 쓰러졌다!` : `\n💥 ${actorName} self-destructed and fainted!`;
    }

    // 8. Secondary Effects (Drain, Recoil, Status Infliction, Stat Stages)
    const extraEffects = this.applySecondaryAttackEffects(actor, target, activeMove, damage, isKo);

    // 9. Effectiveness & Crit Log Construction
    let effLog = "";
    if (typeMod >= 2.0) effLog = isKo ? " 효과가 굉장했다!" : " It's super effective!";
    else if (typeMod === 0) effLog = isKo ? " 효과가 없는 것 같다..." : " It had no effect...";
    else if (typeMod <= 0.5) effLog = isKo ? " 효과가 별로인 듯하다..." : " It's not very effective...";

    if (isCrit && typeMod > 0) effLog += isKo ? " 급소에 맞았다!" : " A critical hit!";
    if (hitCount > 1) effLog += isKo ? ` (${hitCount}회 명중!)` : ` (Hit ${hitCount} times!)`;

    const mainLog = `${actorName}의 ${moveName}! ${damage > 0 ? `${damage} 데미지!` : ""}${effLog}${damageLog}${extraEffects}`;
    return { log: mainLog, damage };
  }

  /**
   * Applies secondary move effects like HP drain, recoil, and stat drops
   */
  private applySecondaryAttackEffects(
    actor: BattlePokemon,
    target: BattlePokemon,
    move: MoveData,
    damageDealt: number,
    isKo: boolean
  ): string {
    let log = "";
    const mName = move.name.toLowerCase().replace(/[\s_]+/g, "-");

    // HP Drain Moves
    if (
      mName === "giga-drain" || mName === "mega-drain" || mName === "absorb" ||
      mName === "drain-punch" || mName === "horn-leech" || mName === "draining-kiss" ||
      mName === "bitter-blade" || mName === "oblivion-wing"
    ) {
      const drainRatio = mName === "oblivion-wing" ? 0.75 : 0.5;
      const healAmount = Math.max(1, Math.floor(damageDealt * drainRatio));
      actor.hp = Math.min(actor.maxHp, actor.hp + healAmount);
      log += isKo ? `\n✨ 상대의 체력을 ${healAmount} 흡수했다!` : `\n✨ Restored ${healAmount} HP!`;
    }

    // Recoil Moves
    if (
      mName === "take-down" || mName === "double-edge" || mName === "brave-bird" ||
      mName === "flare-blitz" || mName === "wood-hammer" || mName === "wave-crash" ||
      mName === "head-smash"
    ) {
      const recoilRatio = mName === "head-smash" ? 0.5 : 0.33;
      const recoilDmg = Math.max(1, Math.floor(damageDealt * recoilRatio));
      actor.hp = Math.max(0, actor.hp - recoilDmg);
      log += isKo ? `\n💥 반동으로 ${recoilDmg} 데미지를 입었다!` : `\n💥 Hit with ${recoilDmg} recoil damage!`;
    }

    // Stat Drops on Self (Close Combat, Draco Meteor, etc.)
    if (mName === "close-combat" || mName === "headlong-rush" || mName === "armor-cannon") {
      actor.stages.def = Math.max(-6, actor.stages.def - 1);
      actor.stages.spd = Math.max(-6, actor.stages.spd - 1);
      log += isKo ? `\n자신의 방어와 특수방어가 떨어졌다! (-1)` : `\nDefense and Sp. Def fell! (-1)`;
    } else if (mName === "draco-meteor" || mName === "overheat" || mName === "leaf-storm") {
      actor.stages.spa = Math.max(-6, actor.stages.spa - 2);
      log += isKo ? `\n자신의 특수공격이 크게 떨어졌다! (-2)` : `\nSp. Atk harshly fell! (-2)`;
    }

    // Flinch Attacks
    if (
      mName === "bite" || mName === "rock-slide" || mName === "iron-head" ||
      mName === "air-slash" || mName === "headbutt"
    ) {
      if (Math.random() < 0.3) {
        target.isFlinched = true;
      }
    }

    // Status Inflicting Attacks
    if (target.hp > 0 && !target.status) {
      if ((mName === "flamethrower" || mName === "fire-blast" || mName === "scald") && Math.random() < 0.3) {
        if (!target.types.includes("fire")) {
          target.status = "brn";
          log += isKo ? `\n🔥 ${target.name}(은)는 화상을 입었다!` : `\n🔥 ${target.name} was burned!`;
        }
      } else if ((mName === "thunderbolt" || mName === "discharge" || mName === "spark") && Math.random() < 0.3) {
        if (!target.types.includes("electric")) {
          target.status = "par";
          log += isKo ? `\n⚡ ${target.name}(은)는 마비되어 저려왔다!` : `\n⚡ ${target.name} is paralyzed!`;
        }
      } else if ((mName === "sludge-bomb" || mName === "poison-jab") && Math.random() < 0.3) {
        if (!target.types.includes("poison") && !target.types.includes("steel")) {
          target.status = "psn";
          log += isKo ? `\n🟣 ${target.name}(은)는 독에 걸렸다!` : `\n🟣 ${target.name} was poisoned!`;
        }
      }
    }

    return log;
  }

  /**
   * Applies dedicated status moves (Transform, Substitute, Stat Stages, Status Ailments, Recovery)
   */
  private applyStatusMove(
    actor: BattlePokemon,
    target: BattlePokemon,
    move: MoveData,
    actorName: string,
    targetName: string,
    isKo: boolean,
    battle?: BattleState
  ): string {
    const mName = move.name.toLowerCase().replace(/[\s_]+/g, "-");

    // 1. TRANSFORM (변신)
    if (mName === "transform" || move.nameKo === "변신") {
      this.applyTransform(actor, target);
      return isKo ? `${actorName}(은)는 ${targetName}(으)로 변신했다!` : `${actorName} transformed into ${targetName}!`;
    }

    // 2. SUBSTITUTE (대타출동)
    if (mName === "substitute" || move.nameKo === "대타출동") {
      const cost = Math.floor(actor.maxHp * 0.25);
      if (actor.hp > cost && !actor.substituteHp) {
        actor.hp -= cost;
        actor.substituteHp = cost;
        return isKo
          ? `${actorName}(은)는 자신의 HP를 깎아 대타 분신을 만들었다!`
          : `${actorName} created a substitute with its own HP!`;
      }
      return isKo ? `하지만 기술은 실패했다!` : `But it failed!`;
    }

    // 3. PROTECT (방어)
    if (mName === "protect" || mName === "detect" || mName === "spiky-shield") {
      actor.isProtected = true;
      return isKo ? `${actorName}(은)는 방어 자세를 취했다!` : `${actorName} protected itself!`;
    }

    // 4. RECOVERY (HP회복)
    if (mName === "recover" || mName === "roost" || mName === "soft-boiled" || mName === "slack-off") {
      const heal = Math.floor(actor.maxHp * 0.5);
      actor.hp = Math.min(actor.maxHp, actor.hp + heal);
      return isKo ? `${actorName}의 HP가 ${heal} 회복되었다!` : `${actorName} restored ${heal} HP!`;
    }

    // 5. SPECIAL SETUP & SACRIFICE (Belly Drum, Shell Smash, Haze, Memento)
    if (mName === "belly-drum") {
      const halfHp = Math.floor(actor.maxHp * 0.5);
      if (actor.hp > halfHp && actor.stages.atk < 6) {
        actor.hp -= halfHp;
        actor.stages.atk = 6;
        return isKo
          ? `🥁 ${actorName}의 배북!\n자신의 HP를 깎아 공격을 최대치(+6)까지 올렸다!`
          : `🥁 ${actorName} used Belly Drum!\nCut its own HP to max out Attack (+6)!`;
      }
      return isKo ? `하지만 기술은 실패했다!` : `But it failed!`;
    }

    if (mName === "shell-smash") {
      actor.stages.def = Math.max(-6, actor.stages.def - 1);
      actor.stages.spd = Math.max(-6, actor.stages.spd - 1);
      actor.stages.atk = Math.min(6, actor.stages.atk + 2);
      actor.stages.spa = Math.min(6, actor.stages.spa + 2);
      actor.stages.spe = Math.min(6, actor.stages.spe + 2);
      return isKo
        ? `✨ ${actorName}의 껍질깨기!\n방어/특방이 떨어지고 공격/특공/스피드가 크게 올랐다! (+2)`
        : `✨ ${actorName} used Shell Smash!\nDefense/Sp.Def fell, Attack/Sp.Atk/Speed sharply rose! (+2)`;
    }

    if (mName === "haze") {
      actor.stages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 };
      target.stages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 };
      return isKo
        ? `🌫️ ${actorName}의 흑안개!\n모든 포켓몬의 능력치 변화가 초기화되었다!`
        : `🌫️ ${actorName} used Haze!\nAll stat changes were reset!`;
    }

    if (mName === "memento") {
      actor.hp = 0;
      target.stages.atk = Math.max(-6, target.stages.atk - 2);
      target.stages.spa = Math.max(-6, target.stages.spa - 2);
      return isKo
        ? `👻 ${actorName}의 추억의선물!\n${actorName}(은)는 쓰러지고 ${targetName}의 공격/특수공격이 크게 떨어졌다! (-2)`
        : `👻 ${actorName} used Memento!\n${actorName} fainted, and ${targetName}'s Attack and Sp. Atk harshly fell! (-2)`;
    }

    if (mName === "healing-wish" || mName === "lunar-dance") {
      actor.hp = 0;
      return isKo
        ? `🌙 ${actorName}의 ${move.nameKo}!\n자신을 희생하여 다음 포켓몬을 위한 소원을 빌었다!`
        : `🌙 ${actorName} used ${move.name.toUpperCase()}!\nSacrificed itself for a healing wish!`;
    }

    // 6. STAT STAGES UP
    if (mName === "swords-dance") {
      actor.stages.atk = Math.min(6, actor.stages.atk + 2);
      return isKo ? `${actorName}의 공격이 크게 올랐다! (+2)` : `${actorName}'s Attack sharply rose! (+2)`;
    }
    if (mName === "nasty-plot" || mName === "tail-glow") {
      const boost = mName === "tail-glow" ? 3 : 2;
      actor.stages.spa = Math.min(6, actor.stages.spa + boost);
      return isKo ? `${actorName}의 특수공격이 크게 올랐다! (+${boost})` : `${actorName}'s Sp. Atk sharply rose! (+${boost})`;
    }
    if (mName === "dragon-dance") {
      actor.stages.atk = Math.min(6, actor.stages.atk + 1);
      actor.stages.spe = Math.min(6, actor.stages.spe + 1);
      return isKo ? `${actorName}의 공격과 스피드가 올랐다! (+1)` : `${actorName}'s Attack and Speed rose! (+1)`;
    }
    if (mName === "quiver-dance") {
      actor.stages.spa = Math.min(6, actor.stages.spa + 1);
      actor.stages.spd = Math.min(6, actor.stages.spd + 1);
      actor.stages.spe = Math.min(6, actor.stages.spe + 1);
      return isKo ? `${actorName}의 특공, 특방, 스피드가 올랐다! (+1)` : `${actorName}'s Sp.Atk, Sp.Def, and Speed rose! (+1)`;
    }
    if (mName === "shift-gear") {
      actor.stages.atk = Math.min(6, actor.stages.atk + 1);
      actor.stages.spe = Math.min(6, actor.stages.spe + 2);
      return isKo ? `${actorName}의 공격(+1)과 스피드가 크게(+2) 올랐다!` : `${actorName}'s Attack (+1) and Speed sharply (+2) rose!`;
    }
    if (mName === "geomancy") {
      actor.stages.spa = Math.min(6, actor.stages.spa + 2);
      actor.stages.spd = Math.min(6, actor.stages.spd + 2);
      actor.stages.spe = Math.min(6, actor.stages.spe + 2);
      return isKo ? `${actorName}의 특수공격, 특수방어, 스피드가 크게 올랐다! (+2)` : `${actorName}'s Sp. Atk, Sp. Def, and Speed sharply rose! (+2)`;
    }
    if (mName === "calm-mind" || mName === "bulk-up" || mName === "coil") {
      if (mName === "bulk-up") {
        actor.stages.atk = Math.min(6, actor.stages.atk + 1);
        actor.stages.def = Math.min(6, actor.stages.def + 1);
        return isKo ? `${actorName}의 공격과 방어가 올랐다! (+1)` : `${actorName}'s Attack and Defense rose! (+1)`;
      }
      if (mName === "coil") {
        actor.stages.atk = Math.min(6, actor.stages.atk + 1);
        actor.stages.def = Math.min(6, actor.stages.def + 1);
        actor.stages.acc = Math.min(6, actor.stages.acc + 1);
        return isKo ? `${actorName}의 공격, 방어, 명중률이 올랐다! (+1)` : `${actorName}'s Attack, Defense, and Accuracy rose! (+1)`;
      }
      actor.stages.spa = Math.min(6, actor.stages.spa + 1);
      actor.stages.spd = Math.min(6, actor.stages.spd + 1);
      return isKo ? `${actorName}의 특수공격과 특수방어가 올랐다! (+1)` : `${actorName}'s Sp. Atk and Sp. Def rose! (+1)`;
    }
    if (mName === "iron-defense" || mName === "acid-armor" || mName === "barrier" || mName === "cotton-guard") {
      const boost = mName === "cotton-guard" ? 3 : 2;
      actor.stages.def = Math.min(6, actor.stages.def + boost);
      return isKo ? `${actorName}의 방어가 크게 올랐다! (+${boost})` : `${actorName}'s Defense sharply rose! (+${boost})`;
    }
    if (mName === "amnesia") {
      actor.stages.spd = Math.min(6, actor.stages.spd + 2);
      return isKo ? `${actorName}의 특수방어가 크게 올랐다! (+2)` : `${actorName}'s Sp. Def sharply rose! (+2)`;
    }
    if (mName === "agility" || mName === "rock-polish" || mName === "autotomize") {
      actor.stages.spe = Math.min(6, actor.stages.spe + 2);
      return isKo ? `${actorName}의 스피드가 크게 올랐다! (+2)` : `${actorName}'s Speed sharply rose! (+2)`;
    }
    if (mName === "minimize" || mName === "double-team") {
      const boost = mName === "minimize" ? 2 : 1;
      actor.stages.eva = Math.min(6, actor.stages.eva + boost);
      return isKo ? `${actorName}의 회피율이 올랐다! (+${boost})` : `${actorName}'s Evasiveness rose! (+${boost})`;
    }

    // 7. STAT STAGES DOWN
    if (mName === "growl" || mName === "play-nice") {
      target.stages.atk = Math.max(-6, target.stages.atk - 1);
      return isKo ? `${targetName}의 공격이 떨어졌다! (-1)` : `${targetName}'s Attack fell! (-1)`;
    }
    if (mName === "charm" || mName === "feather-dance" || mName === "baby-doll-eyes") {
      const drop = mName === "baby-doll-eyes" ? 1 : 2;
      target.stages.atk = Math.max(-6, target.stages.atk - drop);
      return isKo ? `${targetName}의 공격이 크게 떨어졌다! (-${drop})` : `${targetName}'s Attack harshly fell! (-${drop})`;
    }
    if (mName === "tail-whip" || mName === "leer") {
      target.stages.def = Math.max(-6, target.stages.def - 1);
      return isKo ? `${targetName}의 방어가 떨어졌다! (-1)` : `${targetName}'s Defense fell! (-1)`;
    }
    if (mName === "screech") {
      target.stages.def = Math.max(-6, target.stages.def - 2);
      return isKo ? `${targetName}의 방어가 크게 떨어졌다! (-2)` : `${targetName}'s Defense harshly fell! (-2)`;
    }
    if (mName === "fake-tears" || mName === "metal-sound") {
      target.stages.spd = Math.max(-6, target.stages.spd - 2);
      return isKo ? `${targetName}의 특수방어가 크게 떨어졌다! (-2)` : `${targetName}'s Sp. Def harshly fell! (-2)`;
    }
    if (mName === "flash" || mName === "sand-attack" || mName === "smokescreen" || mName === "kinesis") {
      target.stages.acc = Math.max(-6, target.stages.acc - 1);
      return isKo ? `${targetName}의 명중률이 떨어졌다! (-1)` : `${targetName}'s Accuracy fell! (-1)`;
    }
    if (mName === "sweet-scent") {
      target.stages.eva = Math.max(-6, target.stages.eva - 2);
      return isKo ? `${targetName}의 회피율이 크게 떨어졌다! (-2)` : `${targetName}'s Evasiveness harshly fell! (-2)`;
    }

    // 8. STATUS AILMENTS
    if (mName === "thunder-wave" || mName === "glare" || mName === "stun-spore" || mName === "nuzzle") {
      if (!target.types.includes("electric") && !target.status) {
        target.status = "par";
        return isKo ? `${targetName}(은)는 마비되어 기술을 쓰기 어려워졌다!` : `${targetName} is paralyzed!`;
      }
      return isKo ? `하지만 효과가 없었다!` : `It had no effect!`;
    }
    if (mName === "spore" || mName === "sleep-powder" || mName === "hypnosis" || mName === "sing" || mName === "dark-void" || mName === "grass-whistle" || mName === "lovely-kiss") {
      if (!target.types.includes("grass") && !target.status) {
        target.status = "slp";
        target.sleepTurns = 0;
        return isKo ? `${targetName}(은)는 깊은 잠에 빠졌다!` : `${targetName} fell fast asleep!`;
      }
      return isKo ? `하지만 효과가 없었다!` : `It had no effect!`;
    }
    if (mName === "will-o-wisp") {
      if (!target.types.includes("fire") && !target.status) {
        target.status = "brn";
        return isKo ? `${targetName}(은)는 불꽃에 휩싸여 화상을 입었다!` : `${targetName} was burned!`;
      }
      return isKo ? `하지만 효과가 없었다!` : `It had no effect!`;
    }
    if (mName === "toxic" || mName === "poison-powder" || mName === "poison-gas") {
      if (!target.types.includes("poison") && !target.types.includes("steel") && !target.status) {
        target.status = mName === "toxic" ? "tox" : "psn";
        target.toxicCounter = 1;
        return isKo ? `${targetName}(은)는 독에 중독되었다!` : `${targetName} was poisoned!`;
      }
      return isKo ? `하지만 효과가 없었다!` : `It had no effect!`;
    }

    // 9. WEATHER CONTROL
    if (mName === "sunny-day") {
      if (battle) { battle.weather = "sun"; battle.weatherTurns = 5; }
      return isKo ? `☀️ ${actorName}의 쾌청!\n햇살이 아주 강해졌다! (5턴 지속)` : `☀️ ${actorName} used Sunny Day!\nThe sunlight turned harsh! (5 turns)`;
    }
    if (mName === "rain-dance") {
      if (battle) { battle.weather = "rain"; battle.weatherTurns = 5; }
      return isKo ? `🌧️ ${actorName}의 비바라기!\n비가 내리기 시작했다! (5턴 지속)` : `🌧️ ${actorName} used Rain Dance!\nIt started to rain! (5 turns)`;
    }
    if (mName === "sandstorm") {
      if (battle) { battle.weather = "sand"; battle.weatherTurns = 5; }
      return isKo ? `🌪️ ${actorName}의 모래바람!\n모래바람이 세차게 불기 시작했다! (5턴 지속)` : `🌪️ ${actorName} used Sandstorm!\nA sandstorm kicked up! (5 turns)`;
    }
    if (mName === "snowscape" || mName === "hail" || mName === "chilly-reception") {
      if (battle) { battle.weather = "snow"; battle.weatherTurns = 5; }
      return isKo ? `❄️ ${actorName}의 ${move.nameKo}!\n눈이 내리기 시작했다! (5턴 지속)` : `❄️ ${actorName} used ${move.name.toUpperCase()}!\nSnow started to fall! (5 turns)`;
    }
    if (mName === "defog") {
      if (battle) { battle.weather = null; battle.weatherTurns = undefined; }
      target.stages.eva = Math.max(-6, target.stages.eva - 1);
      return isKo ? `💨 ${actorName}의 안개제거!\n날씨가 맑아지고 ${targetName}의 회피율이 떨어졌다! (-1)` : `💨 ${actorName} used Defog!\nThe weather cleared and ${targetName}'s evasiveness fell!`;
    }
    if (mName === "synthesis" || mName === "morning-sun" || mName === "moonlight") {
      const healRatio = battle?.weather === "sun" ? 0.667 : (battle?.weather ? 0.25 : 0.5);
      const heal = Math.floor(actor.maxHp * healRatio);
      actor.hp = Math.min(actor.maxHp, actor.hp + heal);
      return isKo ? `${actorName}의 HP가 ${heal} 회복되었다!` : `${actorName} restored ${heal} HP!`;
    }

    return isKo ? `기술의 효과가 발동했다!` : `The move took effect!`;
  }

  /**
   * Processes end of turn effects (Burn, Poison, Sandstorm, Moody, Speed Boost)
   */
  private processTurnEndEffects(mon: BattlePokemon, isKo: boolean, logs: string[], weather?: "sun" | "rain" | "sand" | "snow" | null) {
    if (mon.hp <= 0) return;
    const name = isKo ? mon.nameKo : mon.name;

    // Sandstorm Chip Damage (1/16 Max HP) to non-Rock/Ground/Steel
    if (weather === "sand") {
      const isImmune = mon.types.some((t) => ["rock", "ground", "steel"].includes(t.toLowerCase())) ||
        mon.ability === "Magic Guard" || mon.ability === "Overcoat" || mon.ability === "Sand Force" ||
        mon.ability === "Sand Rush" || mon.ability === "Sand Veil";
      if (!isImmune) {
        const sandDmg = Math.max(1, Math.floor(mon.maxHp / 16));
        mon.hp = Math.max(0, mon.hp - sandDmg);
        logs.push(isKo ? `🌪️ 모래바람이 ${name}을(를) 덮쳤다! (-${sandDmg})` : `🌪️ The sandstorm buffeted ${name}! (-${sandDmg})`);
      }
    }

    // Burn Damage (1/16 Max HP)
    if (mon.status === "brn") {
      const burnDmg = Math.max(1, Math.floor(mon.maxHp / 16));
      mon.hp = Math.max(0, mon.hp - burnDmg);
      logs.push(isKo ? `🔥 ${name}(은)는 화상으로 ${burnDmg} 데미지를 입었다!` : `🔥 ${name} was hurt by its burn! (${burnDmg})`);
    }

    // Poison Damage (1/8 Max HP or Toxic Scaling)
    if (mon.status === "psn") {
      const psnDmg = Math.max(1, Math.floor(mon.maxHp / 8));
      mon.hp = Math.max(0, mon.hp - psnDmg);
      logs.push(isKo ? `🟣 ${name}(은)는 독으로 ${psnDmg} 데미지를 입었다!` : `🟣 ${name} was hurt by poison! (${psnDmg})`);
    } else if (mon.status === "tox") {
      const counter = mon.toxicCounter || 1;
      const toxDmg = Math.max(1, Math.floor((mon.maxHp * counter) / 16));
      mon.hp = Math.max(0, mon.hp - toxDmg);
      mon.toxicCounter = counter + 1;
      logs.push(isKo ? `🟣 ${name}(은)는 맹독으로 ${toxDmg} 데미지를 입었다!` : `🟣 ${name} was badly hurt by toxic! (${toxDmg})`);
    }

    // Ability: Moody (변덕쟁이)
    if (mon.ability === "Moody" || mon.passiveAbility === "Moody") {
      const statsList: (keyof StatStages)[] = ["atk", "def", "spa", "spd", "spe"];
      const boostStat = statsList[Math.floor(Math.random() * statsList.length)];
      const dropList = statsList.filter((s) => s !== boostStat);
      const dropStat = dropList[Math.floor(Math.random() * dropList.length)];

      mon.stages[boostStat] = Math.min(6, mon.stages[boostStat] + 2);
      mon.stages[dropStat] = Math.max(-6, mon.stages[dropStat] - 1);
      logs.push(isKo ? `\n[특성 변덕쟁이!] ${name}의 ${boostStat.toUpperCase()} 크게 상승(+2), ${dropStat.toUpperCase()} 하락(-1)` : `\n[Moody!] ${name}'s ${boostStat.toUpperCase()} sharply rose, ${dropStat.toUpperCase()} fell.`);
    }

    // Ability: Speed Boost (가속)
    if (mon.ability === "Speed Boost" || mon.passiveAbility === "Speed Boost") {
      mon.stages.spe = Math.min(6, mon.stages.spe + 1);
      logs.push(isKo ? `\n[특성 가속!] ${name}의 스피드가 올라갔다! (+1)` : `\n[Speed Boost!] ${name}'s Speed rose! (+1)`);
    }
  }

  /**
   * Helper for move priority
   */
  private getMovePriority(moveKey: string): number {
    const k = moveKey.toLowerCase().replace(/[\s_]+/g, "-");
    if (k === "protect" || k === "detect" || k === "spiky-shield" || k === "burning-bulwark") return 4;
    if (k === "fake-out" || k === "quick-guard") return 3;
    if (k === "extreme-speed" || k === "feint") return 2;
    if (
      k === "quick-attack" || k === "aqua-jet" || k === "bullet-punch" ||
      k === "ice-shard" || k === "mach-punch" || k === "shadow-sneak" ||
      k === "sucker-punch" || k === "vacuum-wave" || k === "water-shuriken" ||
      k === "jet-punch" || k === "thunderclap" || k === "accelerock"
    ) return 1;
    if (k === "roar" || k === "whirlwind" || k === "dragon-tail" || k === "circle-throw") return -6;
    if (k === "trick-room") return -7;
    return 0;
  }

  /**
   * Helper for multi-hit moves
   */
  private getMultiHitCount(moveName: string): number {
    const k = moveName.toLowerCase().replace(/[\s_]+/g, "-");
    if (k === "double-hit" || k === "dual-wingbeat" || k === "twin-beam" || k === "dragon-darts") return 2;
    if (k === "surging-strikes" || k === "triple-dive") return 3;
    if (
      k === "bullet-seed" || k === "icicle-spear" || k === "rock-blast" ||
      k === "pin-missile" || k === "scale-shot"
    ) {
      const rolls = [2, 2, 3, 3, 4, 5];
      return rolls[Math.floor(Math.random() * rolls.length)];
    }
    if (k === "population-bomb") {
      let hits = 0;
      for (let i = 0; i < 10; i++) {
        if (Math.random() < 0.9) hits++;
        else break;
      }
      return Math.max(1, hits);
    }
    return 1;
  }

  /**
   * Catches the wild Pokémon using a Pokéball
   */
  public attemptCatch(userId: string, slotId: number, ballType: string, lang: "ko" | "en" = "ko"): { success: boolean; battle: BattleState } {
    const battle = this.getOrCreateBattle(userId, slotId);
    const isKo = lang === "ko";
    const enemyMonName = isKo ? battle.enemy.nameKo : battle.enemy.name;

    const profile = saveService.getProfile(userId);
    const slot = profile.slots[slotId];
    const items = slot?.items || { "poke-ball": 5 };
    if (items["poke-ball"] === undefined && Object.keys(items).length === 0) {
      items["poke-ball"] = 5;
    }

    const currentCount = items[ballType] || 0;
    if (currentCount <= 0) {
      battle.phase = "MAIN";
      battle.dialogueText = isKo ? "몬스터볼이 부족합니다!" : "You don't have enough Poké Balls!";
      return { success: false, battle };
    }

    // Deduct 1 ball
    items[ballType] = currentCount - 1;
    if (items[ballType] <= 0) {
      delete items[ballType];
    }
    saveService.updateSlot(userId, slotId, { items });

    let ballMult = 1.0;
    if (ballType === "great-ball") ballMult = 1.5;
    else if (ballType === "ultra-ball") ballMult = 2.0;
    else if (ballType === "rogue-ball") ballMult = 3.0;
    else if (ballType === "master-ball") ballMult = 999.0;

    const hpRatio = battle.enemy.hp / battle.enemy.maxHp;
    const catchRate = Math.min(1.0, (1 - hpRatio * 0.6) * 0.45 * ballMult);
    const roll = Math.random();
    const isSuccess = roll < catchRate || ballType === "master-ball";

    if (isSuccess) {
      battle.phase = "VICTORY";
      battle.dialogueText = isKo
        ? `신난다! ${enemyMonName}(을)를 잡았다!`
        : `Gotcha! ${enemyMonName} was caught!`;

      if (battle.playerParty.length < 6) {
        battle.playerParty.push({
          speciesId: battle.enemy.speciesId,
          name: isKo ? (battle.enemy.nameKo || battle.enemy.name) : (battle.enemy.name || battle.enemy.nameKo),
          nameKo: battle.enemy.nameKo,
          nameEn: battle.enemy.name,
          level: battle.enemy.level,
          hp: battle.enemy.hp,
          maxHp: battle.enemy.maxHp,
          moves: battle.enemy.moves,
          isShiny: battle.enemy.isShiny,
          shinyTier: battle.enemy.shinyTier || (battle.enemy.isShiny ? 1 : 0),
        });
      }

      saveService.updateSlot(userId, slotId, {
        party: battle.playerParty,
        money: battle.money + 200,
        score: battle.score + 50,
        items,
      });

      return { success: true, battle };
    } else {
      battle.phase = "MAIN";
      battle.dialogueText = isKo
        ? `아까워라! ${enemyMonName}(이)가 볼에서 튀어나왔다!`
        : `Oh no! The Pokémon broke free!`;
      return { success: false, battle };
    }
  }

  /**
   * Advances to next wave
   */
  public advanceToNextWave(userId: string, slotId: number): BattleState {
    const profile = saveService.getProfile(userId);
    const slot = profile.slots[slotId];
    const newWave = (slot?.wave || 1) + 1;

    const biomes = Object.keys(BIOME_ENCOUNTERS);
    const currentBiomeIdx = biomes.indexOf(slot?.biome || "Town");
    const nextBiome = (newWave % 10 === 1 && newWave > 1)
      ? biomes[(currentBiomeIdx + 1) % biomes.length]
      : (slot?.biome || "Town");

    saveService.updateSlot(userId, slotId, {
      wave: newWave,
      biome: nextBiome,
    });

    const key = this.getBattleKey(userId, slotId);
    this.activeBattles.delete(key);

    return this.getOrCreateBattle(userId, slotId);
  }

  /**
   * Switch active player Pokemon
   */
  public switchPlayerPokemon(userId: string, slotId: number, targetIndex: number, lang: "ko" | "en" = "ko"): BattleState {
    const battle = this.getOrCreateBattle(userId, slotId);
    const targetMon = battle.playerParty[targetIndex];
    if (!targetMon || targetMon.hp <= 0) return battle;

    const isKo = lang === "ko";
    battle.playerActiveIndex = targetIndex;
    battle.playerBattleMon = this.createPlayerBattleMon(targetMon, battle.playerParty);
    battle.phase = "MAIN";

    let switchLog = isKo
      ? `가랏, ${targetMon.name}!`
      : `Go, ${targetMon.name}!`;

    // Entry Ability on switch: Imposter (괴짜)
    if (battle.playerBattleMon.ability === "Imposter" || battle.playerBattleMon.passiveAbility === "Imposter") {
      this.applyTransform(battle.playerBattleMon, battle.enemy);
      switchLog += isKo
        ? `\n[특성 괴짜 발동!] ${battle.playerBattleMon.name}(이)가 ${battle.enemy.nameKo}(으)로 변신했다!`
        : `\n[Imposter!] ${battle.playerBattleMon.name} transformed into ${battle.enemy.name}!`;
    }

    // Entry Ability on switch: Intimidate (위협)
    if (battle.playerBattleMon.ability === "Intimidate" || battle.playerBattleMon.passiveAbility === "Intimidate") {
      battle.enemy.stages.atk = Math.max(-6, battle.enemy.stages.atk - 1);
      switchLog += isKo
        ? `\n[특성 위협 발동!] 상대 ${battle.enemy.nameKo}의 공격이 떨어졌다! (-1)`
        : `\n[Intimidate!] Foe ${battle.enemy.name}'s Attack fell! (-1)`;
    }

    battle.dialogueText = switchLog;
    return battle;
  }
}

export const battleService = BattleService.getInstance();
