import { saveService, PartyPokemon } from "./saveService.js";
import { BallPerkId, BallPerkDefinition, BALL_PERK_DEFINITIONS, getAvailablePerksForTypes } from "../utils/perkSvgIcons.js";
import type {
  StatStages,
  BattlePokemon,
  TurnActionInfo,
  BattleState
} from "../battle/engine/types.js";
import { createDefaultStages } from "../battle/engine/types.js";
import { TYPE_CHART, getTypeEffectiveness } from "../battle/mechanics/typeChart.js";
import { getStageMultiplier, getAccuracyMultiplier } from "../battle/mechanics/statModifier.js";
import {
  BIOME_ENCOUNTERS,
  BOSS_ENCOUNTERS,
  BASE_SPECIES_MAP,
  getSpeciesData,
  calculateStats,
  spawnWildPokemon,
  createPlayerBattleMon
} from "../battle/entities/pokemonFactory.js";
import { isSelfTargetStatusMove, applyTransform } from "../battle/moves/traits/specialStatusRegistry.js";
import { attemptCatchPokemon } from "../battle/entities/catchManager.js";
import { BattleEngine } from "../battle/engine/BattleEngine.js";
import { STARTER_DATABASE } from "../data/starterCosts.js";
import { POKEMON_SPECIES_DATA } from "../data/pokemonStats.js";
import type { SpeciesBaseData } from "../data/pokemonStats.js";
import { POKEMON_NAMES_KO } from "../data/pokemonNamesKo.js";
import { getMoveData } from "../data/movesKo.js";
import { withSubjectMarker, withObjectMarker } from "../renderers/common/textHelpers.js";

// Re-export common types and constants for backwards compatibility
export type {
  StatStages,
  BattlePokemon,
  TurnActionInfo,
  BattleState,
  SpeciesBaseData
};

export {
  createDefaultStages,
  TYPE_CHART,
  getTypeEffectiveness,
  getStageMultiplier,
  getAccuracyMultiplier,
  BIOME_ENCOUNTERS,
  BOSS_ENCOUNTERS,
  BASE_SPECIES_MAP,
  getSpeciesData,
  calculateStats,
  spawnWildPokemon,
  createPlayerBattleMon,
  isSelfTargetStatusMove,
  applyTransform
};

/**
 * High-level Battle Service Facade.
 * Bridges Discord events, save storage, and the modular BattleEngine.
 */
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

  public triggerBallPerk(
    userId: string,
    slotId: number
  ): { success: boolean; perk?: BallPerkDefinition; reason?: string } {
    const battle = this.getOrCreateBattle(userId, slotId);
    if (!battle) {
      return { success: false, reason: "no_battle" };
    }

    if (battle.pendingBallPerk) {
      return { success: false, reason: "already_active" };
    }

    const roll = Math.random();
    console.log(`[BALL PERK ROLL] user: ${userId}, slot: ${slotId}, roll: ${(roll * 100).toFixed(2)}% (Target: < 5.00%)`);
    if (roll >= 0.05) {
      return { success: false, reason: "roll_failed" };
    }

    const combatMon = battle.playerBattleMon || battle.playerParty[battle.playerActiveIndex];
    const types = combatMon?.types || ["normal"];
    const availablePerks = getAvailablePerksForTypes(types);

    if (availablePerks.length === 0) {
      return { success: false, reason: "no_available_perks" };
    }

    const chosen = availablePerks[Math.floor(Math.random() * availablePerks.length)];
    battle.pendingBallPerk = chosen.id;

    const enemy = battle.enemy;
    if (chosen.id === "confuse") {
      enemy.isConfused = true;
      enemy.confusionTurns = 3;
    } else if (chosen.id === "flinch") {
      enemy.isFlinched = true;
    } else if (chosen.id === "taunt") {
      enemy.isTaunted = true;
      enemy.tauntTurns = 3;
    } else if (chosen.id === "surveillance") {
      enemy.cannotEscape = true;
    } else if (chosen.id === "acid_dissolve") {
      const statsList: (keyof StatStages)[] = ["atk", "def", "spa", "spd", "spe", "acc", "eva"];
      for (const k of statsList) {
        if (enemy.stages[k] > 0) {
          enemy.stages[k] = 0;
        }
      }
    } else if (chosen.id === "attract") {
      enemy.isAttracted = true;
    } else if (chosen.id === "sticky_web") {
      battle.stickyWebTurns = 5;
      enemy.stages.spe = Math.max(-6, enemy.stages.spe - 1);
      if (combatMon?.types.map((t) => t.toLowerCase()).includes("bug")) {
        combatMon.stages.spe = Math.min(6, combatMon.stages.spe + 1);
      }
    } else if (chosen.id === "rock_solid") {
      battle.rockSolidTurns = 3;
    } else if (chosen.id === "chilly") {
      battle.chillyTurns = 5;
      const enemyTypes = (enemy.types || []).map(t => t.toLowerCase());
      if (!enemyTypes.includes("ice")) {
        enemy.stages.spe = Math.max(-6, enemy.stages.spe - 1);
      }
      if (combatMon) {
        combatMon.stages.spe = Math.min(6, combatMon.stages.spe + 1);
      }
    } else if (chosen.id === "dinosaur") {
      battle.dinosaurTurns = 3;
    } else if (chosen.id === "heat") {
      if (combatMon) {
        combatMon.stages.atk = Math.min(6, combatMon.stages.atk + 2);
        combatMon.stages.spa = Math.min(6, combatMon.stages.spa + 2);
      }
      battle.heatTimer = 2;
    } else if (chosen.id === "overcharge") {
      if (combatMon) {
        combatMon.stages.spe = Math.min(6, combatMon.stages.spe + 2);
        combatMon.stages.atk = Math.min(6, combatMon.stages.atk + 1);
        combatMon.stages.spa = Math.min(6, combatMon.stages.spa + 1);
      }
      battle.overchargeTurnCount = 0;
    } else if (chosen.id === "downfall") {
      if (combatMon) {
        combatMon.stages.spa = Math.min(6, combatMon.stages.spa + 4);
        combatMon.stages.spe = Math.min(6, combatMon.stages.spe + 2);
      }
      battle.downfallTurnCount = 0;
    } else if (chosen.id === "willpower") {
      if (combatMon) {
        combatMon.hasEndurePerk = true;
      }
    } else if (chosen.id === "hug") {
      battle.hugTriggered = true;
    }

    return { success: true, perk: chosen };
  }

  public getSpeciesData(speciesId: string): SpeciesBaseData {
    return getSpeciesData(speciesId);
  }

  public calculateStats(speciesId: string, level: number, isBoss: boolean = false) {
    return calculateStats(speciesId, level, isBoss);
  }

  public spawnWildPokemon(wave: number, biome: string, forcedSpecies?: string, forcedLevel?: number, forcedAbility?: string): BattlePokemon {
    return spawnWildPokemon(wave, biome, forcedSpecies, forcedLevel, forcedAbility);
  }

  public createPlayerBattleMon(partyMon: PartyPokemon, fullParty: PartyPokemon[]): BattlePokemon {
    return createPlayerBattleMon(partyMon, fullParty);
  }

  public getOrCreateBattle(
    userId: string,
    slotId: number,
    preservedStages?: StatStages,
    preservedActiveIndex?: number
  ): BattleState {
    const key = this.getBattleKey(userId, slotId);
    let existing = this.activeBattles.get(key);

    const profile = saveService.getProfile(userId);
    const slot = profile.slots[slotId];

    if (!slot) {
      throw new Error(`Slot ${slotId} not found for user ${userId}`);
    }

    if (existing && existing.wave === slot.wave) {
      const currentLeader = slot.party[existing.playerActiveIndex || 0] || slot.party[0];
      if (currentLeader) {
        const movesChanged = JSON.stringify(existing.playerBattleMon.moves) !== JSON.stringify(currentLeader.moves);
        const speciesOrLevelChanged = existing.playerBattleMon.speciesId !== currentLeader.speciesId || existing.playerBattleMon.level !== currentLeader.level;
        const ppRestored = currentLeader.movePps && (
          !existing.playerBattleMon.movePps ||
          currentLeader.movePps.some((pp: number, idx: number) => pp > (existing!.playerBattleMon.movePps?.[idx] ?? 0))
        );
        const hpHealed = currentLeader.hp > existing.playerBattleMon.hp;
        if (movesChanged || speciesOrLevelChanged || ppRestored || hpHealed) {
          const oldStages = existing.playerBattleMon.stages;
          const oldStatus = hpHealed ? null : existing.playerBattleMon.status;
          existing.playerParty = slot.party;
          existing.playerBattleMon = this.createPlayerBattleMon(currentLeader, slot.party);
          if (!hpHealed && !speciesOrLevelChanged && !movesChanged) {
            existing.playerBattleMon.stages = oldStages;
            existing.playerBattleMon.status = oldStatus;
          }
        }
      }
      return existing;
    }

    const wildPokemon = (slot as any).enemy
      ? { ...(slot as any).enemy, stages: { ...((slot as any).enemy.stages || createDefaultStages()) } }
      : this.spawnWildPokemon(slot.wave, slot.biome || "Town");
    const isKo = profile.language === "ko";

    const hasValidPreserved = preservedActiveIndex !== undefined &&
      slot.party[preservedActiveIndex] &&
      (slot.party[preservedActiveIndex].hp === undefined || slot.party[preservedActiveIndex].hp > 0);

    const firstAliveIdx = slot.party.findIndex((p: any) => p && (p.hp === undefined || p.hp > 0));

    const activeIndex = hasValidPreserved
      ? preservedActiveIndex!
      : (firstAliveIdx >= 0 ? firstAliveIdx : 0);

    const activeLeader = slot.party[activeIndex] || slot.party[0] || {
      speciesId: "lucario",
      name: "루카리오",
      level: 5,
      hp: 20,
      maxHp: 20,
      moves: ["Aura Sphere", "Close Combat", "Extreme Speed", "Meteor Mash"],
    };

    const playerBattleMon = this.createPlayerBattleMon(activeLeader, slot.party);
    if (preservedStages) {
      playerBattleMon.stages = { ...preservedStages };
    }

    let dialogueText = wildPokemon.isBoss
      ? (isKo ? `보스 포켓몬 ${wildPokemon.nameKo}(이)가 나타났다!` : `Boss Pokémon ${wildPokemon.name} appeared!`)
      : (isKo ? `야생의 ${wildPokemon.nameKo}(이)가 나타났다!` : `Wild ${wildPokemon.name} appeared!`);

    if (playerBattleMon.ability === "Imposter" || playerBattleMon.passiveAbility === "Imposter") {
      this.applyTransform(playerBattleMon, wildPokemon);
      dialogueText += isKo
        ? `\n[특성 괴짜 발동!] ${playerBattleMon.name}(이)가 ${wildPokemon.nameKo}(으)로 변신했다!`
        : `\n[Imposter!] ${playerBattleMon.name} transformed into ${wildPokemon.name}!`;
    }

    if (playerBattleMon.ability === "Intimidate" || playerBattleMon.passiveAbility === "Intimidate") {
      wildPokemon.stages.atk = Math.max(-6, wildPokemon.stages.atk - 1);
      dialogueText += isKo
        ? `\n[특성 위협 발동!] ${wildPokemon.nameKo}의 공격이 떨어졌다! (-1)`
        : `\n[Intimidate!] ${wildPokemon.name}'s Attack fell! (-1)`;
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
      playerActiveIndex: activeIndex,
      playerParty: slot.party,
      playerBattleMon,
      dialogueText,
      phase: firstAliveIdx < 0 ? "DEFEAT" : "MAIN",
      turnCount: 0,
      money: slot.money ?? 0,
      score: slot.score || 0,
      playerExp: 0,
      playerMaxExp: activeLeader.level * 15,
    };

    this.activeBattles.set(key, state);
    return state;
  }

  public applyTransform(user: BattlePokemon, target: BattlePokemon) {
    applyTransform(user, target);
  }

  public getTypeEffectiveness(moveType: string, targetTypes: string[]): number {
    return getTypeEffectiveness(moveType, targetTypes);
  }

  public isSelfTargetStatusMove(moveName: string): boolean {
    return isSelfTargetStatusMove(moveName);
  }

  public executePlayerMove(userId: string, slotId: number, moveKey: string, lang: "ko" | "en" = "ko"): BattleState {
    const battle = this.getOrCreateBattle(userId, slotId);
    return BattleEngine.executeTurn(battle, moveKey, lang);
  }

  public attemptCatch(userId: string, slotId: number, ballType: string, lang: "ko" | "en" = "ko"): { success: boolean; battle: BattleState } {
    const battle = this.getOrCreateBattle(userId, slotId);
    return attemptCatchPokemon(userId, slotId, ballType, battle, lang);
  }

  public advanceToNextWave(userId: string, slotId: number): BattleState {
    const key = this.getBattleKey(userId, slotId);
    const existingBattle = this.activeBattles.get(key);

    const profile = saveService.getProfile(userId);
    const slot = profile.slots[slotId];
    const prevWave = slot?.wave || 1;
    const newWave = prevWave + 1;

    const shouldResetStages = (prevWave % 5 === 0);
    const preservedStages = (existingBattle && !shouldResetStages && existingBattle.playerBattleMon.hp > 0)
      ? { ...existingBattle.playerBattleMon.stages }
      : undefined;
    const firstAliveIdx = (slot?.party || []).findIndex((p: any) => p && (p.hp === undefined || p.hp > 0));
    const preservedActiveIndex = (existingBattle && !shouldResetStages && existingBattle.playerBattleMon && existingBattle.playerBattleMon.hp > 0)
      ? existingBattle.playerActiveIndex
      : (firstAliveIdx >= 0 ? firstAliveIdx : 0);

    const biomes = Object.keys(BIOME_ENCOUNTERS);
    const currentBiomeIdx = biomes.indexOf(slot?.biome || "Town");
    const nextBiome = (newWave % 10 === 1 && newWave > 1)
      ? biomes[(currentBiomeIdx + 1) % biomes.length]
      : (slot?.biome || "Town");

    saveService.updateSlot(userId, slotId, {
      wave: newWave,
      biome: nextBiome,
    });

    this.activeBattles.delete(key);

    return this.getOrCreateBattle(userId, slotId, preservedStages, preservedActiveIndex);
  }

  public commitBattleState(userId: string, slotId: number, newState: BattleState): void {
    const key = this.getBattleKey(userId, slotId);
    this.activeBattles.set(key, newState);
    saveService.updateSlot(userId, slotId, {
      party: newState.playerParty,
      money: newState.money,
      score: newState.score,
    });
  }

  public createSpeculativeNextWaveBattle(
    userId: string,
    slotId: number,
    currentBattle: BattleState,
    lang: "ko" | "en" = "ko"
  ): { nextBattle: BattleState; nextWave: number; nextBiome: string } {
    const profile = saveService.getProfile(userId);
    const slot = profile.slots[slotId];
    const prevWave = currentBattle.wave || slot?.wave || 1;
    const newWave = prevWave + 1;

    const shouldResetStages = (prevWave % 5 === 0);
    const preservedStages = (!shouldResetStages && currentBattle.playerBattleMon.hp > 0)
      ? { ...currentBattle.playerBattleMon.stages }
      : undefined;

    const biomes = Object.keys(BIOME_ENCOUNTERS);
    const currentBiomeIdx = biomes.indexOf(currentBattle.biome || slot?.biome || "Town");
    const nextBiome = (newWave % 10 === 1 && newWave > 1)
      ? biomes[(currentBiomeIdx + 1) % biomes.length]
      : (currentBattle.biome || slot?.biome || "Town");

    const wildPokemon = this.spawnWildPokemon(newWave, nextBiome);
    const isKo = lang === "ko";

    const party = (currentBattle.playerParty && currentBattle.playerParty.length > 0)
      ? currentBattle.playerParty
      : (slot?.party && slot.party.length > 0)
        ? slot.party
        : (currentBattle.playerBattleMon ? [{
            speciesId: currentBattle.playerBattleMon.speciesId,
            name: currentBattle.playerBattleMon.name,
            level: currentBattle.playerBattleMon.level,
            hp: currentBattle.playerBattleMon.hp,
            maxHp: currentBattle.playerBattleMon.maxHp,
            moves: currentBattle.playerBattleMon.moves,
            movePps: currentBattle.playerBattleMon.movePps,
          }] : [{
            speciesId: "lucario",
            name: "루카리오",
            level: 5,
            hp: 20,
            maxHp: 20,
            moves: ["Aura Sphere", "Close Combat", "Extreme Speed", "Meteor Mash"],
          }]);

    const firstAliveIdx = party.findIndex((p: any) => p && (p.hp === undefined || p.hp > 0));
    const preservedActiveIndex = (!shouldResetStages && currentBattle.playerBattleMon && currentBattle.playerBattleMon.hp > 0)
      ? currentBattle.playerActiveIndex
      : (firstAliveIdx >= 0 ? firstAliveIdx : 0);

    const activeIndex = (preservedActiveIndex !== undefined && party[preservedActiveIndex] && (party[preservedActiveIndex].hp === undefined || party[preservedActiveIndex].hp > 0))
      ? preservedActiveIndex
      : (firstAliveIdx >= 0 ? firstAliveIdx : 0);

    const activeLeader = party[activeIndex] || party[0];
    const playerBattleMon = this.createPlayerBattleMon(activeLeader, party);
    if (preservedStages) {
      playerBattleMon.stages = { ...preservedStages };
    }

    let dialogueText = wildPokemon.isBoss
      ? (isKo ? `보스 포켓몬 ${wildPokemon.nameKo}(이)가 나타났다!` : `Boss Pokémon ${wildPokemon.name} appeared!`)
      : (isKo ? `야생의 ${wildPokemon.nameKo}(이)가 나타났다!` : `Wild ${wildPokemon.name} appeared!`);

    if (playerBattleMon.ability === "Imposter" || playerBattleMon.passiveAbility === "Imposter") {
      this.applyTransform(playerBattleMon, wildPokemon);
      dialogueText += isKo
        ? `\n[특성 괴짜 발동!] ${playerBattleMon.name}(이)가 ${wildPokemon.nameKo}(으)로 변신했다!`
        : `\n[Imposter!] ${playerBattleMon.name} transformed into ${wildPokemon.name}!`;
    }

    if (playerBattleMon.ability === "Intimidate" || playerBattleMon.passiveAbility === "Intimidate") {
      wildPokemon.stages.atk = Math.max(-6, wildPokemon.stages.atk - 1);
      dialogueText += isKo
        ? `\n[특성 위협 발동!] ${wildPokemon.nameKo}의 공격이 떨어졌다! (-1)`
        : `\n[Intimidate!] ${wildPokemon.name}'s Attack fell! (-1)`;
    }
    if (wildPokemon.ability === "Intimidate") {
      playerBattleMon.stages.atk = Math.max(-6, playerBattleMon.stages.atk - 1);
      dialogueText += isKo
        ? `\n[상대 위협 발동!] ${playerBattleMon.name}의 공격이 떨어졌다! (-1)`
        : `\n[Foe Intimidate!] ${playerBattleMon.name}'s Attack fell! (-1)`;
    }

    const nextBattle: BattleState = {
      userId,
      slotId,
      wave: newWave,
      biome: nextBiome,
      gameMode: currentBattle.gameMode || "Classic",
      enemy: wildPokemon,
      playerActiveIndex: activeIndex,
      playerParty: structuredClone(currentBattle.playerParty),
      playerBattleMon,
      dialogueText,
      phase: "MAIN",
      turnCount: 0,
      money: currentBattle.money ?? 0,
      score: currentBattle.score || 0,
      playerExp: currentBattle.playerExp || 0,
      playerMaxExp: activeLeader.level * 15,
    };

    return { nextBattle, nextWave: newWave, nextBiome };
  }

  public commitSpeculativeNextWave(
    userId: string,
    slotId: number,
    nextBattle: BattleState,
    nextWave: number,
    nextBiome: string
  ): BattleState {
    const key = this.getBattleKey(userId, slotId);
    saveService.updateSlot(userId, slotId, {
      wave: nextWave,
      biome: nextBiome,
      party: nextBattle.playerParty,
      money: nextBattle.money,
      score: nextBattle.score,
    });
    this.activeBattles.set(key, nextBattle);
    return nextBattle;
  }

  public switchPlayerPokemon(userId: string, slotId: number, targetIndex: number, lang: "ko" | "en" = "ko"): BattleState {
    const battle = this.getOrCreateBattle(userId, slotId);
    const targetMon = battle.playerParty[targetIndex];
    if (!targetMon || targetMon.hp <= 0) return battle;

    const isKo = lang === "ko";
    battle.playerActiveIndex = targetIndex;
    battle.playerBattleMon = this.createPlayerBattleMon(targetMon, battle.playerParty);
    battle.phase = "MAIN";

    const tName = isKo ? (targetMon.nameKo || targetMon.name) : targetMon.name;
    let switchLog = isKo
      ? `가랏, ${tName}!`
      : `Go, ${targetMon.name}!`;

    if (battle.playerBattleMon.ability === "Imposter" || battle.playerBattleMon.passiveAbility === "Imposter") {
      this.applyTransform(battle.playerBattleMon, battle.enemy);
      const pName = isKo ? (battle.playerBattleMon.nameKo || battle.playerBattleMon.name) : battle.playerBattleMon.name;
      switchLog += isKo
        ? `\n[특성 괴짜 발동!] ${withSubjectMarker(pName)} ${battle.enemy.nameKo}(으)로 변신했다!`
        : `\n[Imposter!] ${battle.playerBattleMon.name} transformed into ${battle.enemy.name}!`;
    }

    if (battle.playerBattleMon.ability === "Intimidate" || battle.playerBattleMon.passiveAbility === "Intimidate") {
      battle.enemy.stages.atk = Math.max(-6, battle.enemy.stages.atk - 1);
      switchLog += isKo
        ? `\n[특성 위협 발동!] 상대 ${battle.enemy.nameKo}의 공격이 떨어졌다! (-1)`
        : `\n[Intimidate!] Foe ${battle.enemy.name}'s Attack fell! (-1)`;
    }

    battle.dialogueText = switchLog;
    return battle;
  }

  public restartRunFromDefeat(userId: string, slotId: number, lang: "ko" | "en" = "ko"): BattleState {
    const profile = saveService.getProfile(userId);
    const slot = profile.slots[slotId];
    const isKo = lang === "ko";

    const currentParty = slot?.party || [];
    const starterCount = slot?.starter ? Math.max(1, slot.starter.split(",").length) : 1;
    const starterParty = currentParty.slice(0, starterCount);

    const resetParty: PartyPokemon[] = [];

    (starterParty.length > 0 ? starterParty : currentParty.slice(0, 3)).forEach((p) => {
      const rawId = p.speciesId.toLowerCase().trim();
      const baseSpeciesId = BASE_SPECIES_MAP[rawId] || rawId;
      const starterEntry = Object.values(STARTER_DATABASE).find(
        (s) => s.speciesId.toLowerCase() === baseSpeciesId
      );
      const dexNum = starterEntry?.dexNumber || (POKEMON_SPECIES_DATA[baseSpeciesId] ? POKEMON_SPECIES_DATA[baseSpeciesId].num : undefined);

      const baseNameKo = starterEntry?.nameKo || (dexNum ? POKEMON_NAMES_KO[dexNum] : undefined) || baseSpeciesId;
      const baseNameEn = starterEntry?.name || (POKEMON_SPECIES_DATA[baseSpeciesId] ? POKEMON_SPECIES_DATA[baseSpeciesId].name : baseSpeciesId);

      const hasCustomNickname = p.name && p.name !== p.nameKo && p.name !== p.nameEn;
      const displayName = hasCustomNickname ? p.name : (isKo ? baseNameKo : baseNameEn);

      const baseMoves = starterEntry?.starterMoves && starterEntry.starterMoves.length > 0
        ? [...starterEntry.starterMoves]
        : ["Tackle", "Growl"];

      const lvl5Stats = this.calculateStats(baseSpeciesId, 5);

      resetParty.push({
        speciesId: baseSpeciesId,
        name: displayName,
        nameKo: baseNameKo,
        nameEn: baseNameEn,
        level: 5,
        hp: lvl5Stats.maxHp,
        maxHp: lvl5Stats.maxHp,
        moves: baseMoves,
        isShiny: p.isShiny,
        shinyTier: p.shinyTier || (p.isShiny ? 1 : 0),
      });
    });

    if (resetParty.length === 0) {
      resetParty.push({
        speciesId: "lucario",
        name: isKo ? "루카리오" : "Lucario",
        nameKo: "루카리오",
        nameEn: "Lucario",
        level: 5,
        hp: 20,
        maxHp: 20,
        moves: ["Aura Sphere", "Close Combat", "Extreme Speed"],
      });
    }

    saveService.updateSlot(userId, slotId, {
      wave: 1,
      biome: "Town",
      party: resetParty,
      money: 0,
      score: 0,
      items: { "poke-ball": 5 },
    });

    const key = this.getBattleKey(userId, slotId);
    this.activeBattles.delete(key);

    const newBattle = this.getOrCreateBattle(userId, slotId);
    newBattle.dialogueText = isKo
      ? "파티원들과 함께 웨이브 1에서 새롭게 도전을 시작합니다!"
      : "Restarting journey from Wave 1 with your party!";

    return newBattle;
  }

  public healActiveBattle(userId: string, slotId: number): void {
    const key = this.getBattleKey(userId, slotId);
    const battle = this.activeBattles.get(key);
    if (battle) {
      if (battle.playerParty) {
        for (const mon of battle.playerParty) {
          mon.hp = mon.maxHp;
          if (mon.moves) {
            mon.movePps = mon.moves.map((m) => getMoveData(m)?.pp || 20);
            mon.maxMovePps = [...mon.movePps];
          }
        }
      }
      if (battle.playerBattleMon) {
        battle.playerBattleMon.hp = battle.playerBattleMon.maxHp;
        battle.playerBattleMon.status = null;
        battle.playerBattleMon.stages = createDefaultStages();
        battle.playerBattleMon.isConfused = false;
        battle.playerBattleMon.confusionTurns = 0;
        if (battle.playerBattleMon.moves) {
          battle.playerBattleMon.movePps = battle.playerBattleMon.moves.map((m) => getMoveData(m)?.pp || 20);
        }
      }
    }
  }
}

export const battleService = BattleService.getInstance();