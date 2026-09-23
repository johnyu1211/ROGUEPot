import { ActionRowBuilder, ButtonBuilder, AttachmentBuilder } from "discord.js";
import { BattleState, BattlePokemon } from "../battle/engine/types.js";
import { BattleEngine } from "../battle/engine/BattleEngine.js";
import { battleService } from "./battleService.js";
import { saveService } from "./saveService.js";
import { renderBattleMoveGif, renderBattleEntryGif } from "../utils/battleGifRenderer.js";
import { buildBattleComponents } from "../events/interactionCreate.js";
import { getMoveData, getMoveKey } from "../data/movesKo.js";
import { getTypeEffectiveness } from "../battle/mechanics/typeChart.js";

export interface PreloadedMoveData {
  userId: string;
  slotId: number;
  turnCount: number;
  moveKey: string;
  committedBattleState: BattleState;
  imageBuffer: Buffer;
  fileName: string;
  motionDurationMs: number;
  components: ActionRowBuilder<ButtonBuilder>[];
}

export interface PreloadedWaveData {
  userId: string;
  slotId: number;
  wave: number;
  nextBattleState: BattleState;
  imageBuffer: Buffer;
  fileName: string;
  motionDurationMs: number;
  components: ActionRowBuilder<ButtonBuilder>[];
}

interface MoveSlotEntry {
  userId: string;
  slotId: number;
  turnCount: number;
  moveKey: string;
  data?: PreloadedMoveData;
  promise?: Promise<PreloadedMoveData | null>;
  createdAt: number;
}

interface WaveSlotEntry {
  userId: string;
  slotId: number;
  wave: number;
  nextWave: number;
  nextBiome: string;
  data?: PreloadedWaveData;
  promise?: Promise<PreloadedWaveData | null>;
  createdAt: number;
}

/**
 * Speculative Background Pre-rendering Service.
 * Anticipates the player's most likely battle moves or wave transitions
 * and prepares rendered GIF buffers + simulated states in advance.
 */
export class BattlePreloadService {
  private static instance: BattlePreloadService;

  private moveSlots: Map<string, MoveSlotEntry> = new Map();
  private waveSlots: Map<string, WaveSlotEntry> = new Map();
  private activeJobs: Set<string> = new Set();

  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes cache expiry

  private constructor() {}

  public static getInstance(): BattlePreloadService {
    if (!BattlePreloadService.instance) {
      BattlePreloadService.instance = new BattlePreloadService();
    }
    return BattlePreloadService.instance;
  }

  private getKey(userId: string, slotId: number): string {
    return `${userId}_${slotId}`;
  }

  /**
   * Evaluates player's moves and returns the single most probable attack move.
   * Priority: Super-effective (4x > 2x) > Base Power > STAB > Accuracy > Slot 1 preference
   */
  public predictBestMove(battle: BattleState): { moveKey: string; reason: string } {
    const combatMon = battle.playerBattleMon || battle.playerParty[battle.playerActiveIndex];
    if (!combatMon) return { moveKey: "tackle", reason: "fallback" };

    if (combatMon.chargingMove) {
      return { moveKey: getMoveKey(combatMon.chargingMove), reason: "charging_move" };
    }

    const moves = combatMon.moves || [];
    if (moves.length === 0) {
      return { moveKey: "tackle", reason: "no_moves" };
    }

    const enemyTypes = battle.enemy?.types || ["normal"];
    let bestMove = moves[0];
    let highestScore = -99999;
    let bestReason = "default";

    for (let i = 0; i < moves.length; i++) {
      const rawMove = moves[i];
      const mKey = getMoveKey(rawMove);
      const curPp = combatMon.movePps ? combatMon.movePps[i] : 20;

      if (curPp <= 0) continue; // Out of PP

      const mData = getMoveData(mKey) || {
        type: "normal",
        power: 40,
        accuracy: 100,
        category: "physical"
      };

      const moveType = (mData.type || "normal").toLowerCase();
      const eff = getTypeEffectiveness(moveType, enemyTypes);

      if (eff === 0) continue; // Immune!

      let score = (mData.power && mData.power > 0) ? mData.power : 35;

      // Type effectiveness weighting
      if (eff >= 4) {
        score *= 4.0;
      } else if (eff >= 2) {
        score *= 2.5;
      } else if (eff <= 0.25) {
        score *= 0.2;
      } else if (eff <= 0.5) {
        score *= 0.4;
      }

      // STAB (Same Type Attack Bonus)
      if (combatMon.types.map(t => t.toLowerCase()).includes(moveType)) {
        score *= 1.5;
      }

      // Accuracy multiplier
      const acc = mData.accuracy ? mData.accuracy / 100 : 1;
      score *= acc;

      // Habit / Slot bias (+5 for slot 1)
      if (i === 0) score += 5;

      if (score > highestScore) {
        highestScore = score;
        bestMove = mKey;
        bestReason = eff >= 2 ? `super_effective_${eff}x` : `power_${mData.power || 40}`;
      }
    }

    return { moveKey: getMoveKey(bestMove), reason: bestReason };
  }

  /**
   * Evaluates party members and returns the most suitable switch candidate.
   */
  public predictBestSwitch(battle: BattleState): { targetIndex: number; score: number } | null {
    const party = battle.playerParty || [];
    const activeIdx = battle.playerActiveIndex || 0;
    const enemyTypes = battle.enemy?.types || ["normal"];

    let bestIdx = -1;
    let highestScore = -9999;

    for (let i = 0; i < party.length; i++) {
      if (i === activeIdx) continue;
      const mon = party[i];
      if (!mon || mon.hp <= 0) continue;

      let score = 0;
      const speciesData = battleService.getSpeciesData(mon.speciesId);
      const monTypes = (speciesData?.types || ["normal"]).map((t: string) => t.toLowerCase());

      // Defensive resistance against enemy's types
      for (const eType of enemyTypes) {
        const incomingEff = getTypeEffectiveness(eType.toLowerCase(), monTypes);
        if (incomingEff === 0) score += 40;
        else if (incomingEff <= 0.5) score += 25;
        else if (incomingEff >= 2) score -= 30;
      }

      // HP ratio
      const hpRatio = mon.hp / mon.maxHp;
      score += hpRatio * 20;

      // Level / Power
      score += (mon.level || 5) * 2;

      if (score > highestScore) {
        highestScore = score;
        bestIdx = i;
      }
    }

    return bestIdx !== -1 ? { targetIndex: bestIdx, score: highestScore } : null;
  }

  /**
   * Schedules speculative pre-rendering in the background based on current battle state.
   * Runs non-blocking via setImmediate to never hinder Discord event loop.
   */
  public schedulePreload(
    userId: string,
    slotId: number,
    battle: BattleState,
    lang: "ko" | "en" = "ko"
  ): void {
    const key = this.getKey(userId, slotId);

    // Prevent concurrent background tasks for same user/slot
    if (this.activeJobs.has(key)) {
      return;
    }

    setImmediate(() => {
      if (battle.phase === "VICTORY") {
        this.preloadNextWave(userId, slotId, battle, lang).catch((err) => {
          console.warn(`[PRELOAD ERROR - WAVE] user: ${userId}, slot: ${slotId}:`, err);
        });
      } else if (battle.phase === "MAIN" || battle.phase === "FIGHT") {
        this.preloadBestMove(userId, slotId, battle, lang).catch((err) => {
          console.warn(`[PRELOAD ERROR - MOVE] user: ${userId}, slot: ${slotId}:`, err);
        });
      }
    });
  }

  /**
   * Pre-renders the predicted best move for the current battle.
   */
  private async preloadBestMove(
    userId: string,
    slotId: number,
    battle: BattleState,
    lang: "ko" | "en"
  ): Promise<PreloadedMoveData | null> {
    const key = this.getKey(userId, slotId);
    if (this.activeJobs.has(key)) return null;

    const { moveKey, reason } = this.predictBestMove(battle);
    const turnCount = battle.turnCount;

    // Check if already preloaded
    const existing = this.moveSlots.get(key);
    if (existing && existing.turnCount === turnCount && existing.moveKey === moveKey && existing.data) {
      return existing.data;
    }

    this.activeJobs.add(key);

    const renderPromise = (async () => {
      try {
        // Deep clone state to avoid mutating original battle
        const clonedBattle: BattleState = structuredClone(battle);

        // Execute turn speculatively with skipSave = true
        BattleEngine.executeTurn(clonedBattle, moveKey, lang, true);

        const uniqueId = Date.now();
        let imageBuffer: Buffer;
        let motionDurationMs = 0;
        let fileName = `battle_preload_${uniqueId}.gif`;

        if (clonedBattle.lastMoveEffect) {
          const res = await renderBattleMoveGif({
            battle: clonedBattle,
            lang,
          });
          imageBuffer = res.buffer;
          motionDurationMs = res.motionDurationMs;
          clonedBattle.lastMoveEffect = null;
        } else {
          // Status move or no motion effect
          const res = await renderBattleMoveGif({
            battle: clonedBattle,
            lang,
            moveKey,
          });
          imageBuffer = res.buffer;
          motionDurationMs = res.motionDurationMs;
        }

        const isKo = lang === "ko";
        const components = buildBattleComponents(clonedBattle, userId, slotId, isKo);

        const result: PreloadedMoveData = {
          userId,
          slotId,
          turnCount,
          moveKey,
          committedBattleState: clonedBattle,
          imageBuffer,
          fileName,
          motionDurationMs,
          components,
        };

        const currentEntry = this.moveSlots.get(key);
        if (currentEntry && currentEntry.turnCount === turnCount && currentEntry.moveKey === moveKey) {
          currentEntry.data = result;
          currentEntry.promise = undefined;
        }

        console.log(`[PRELOAD SUCCESS] Pre-rendered move '${moveKey}' (${reason}) for user ${userId}_${slotId}`);
        return result;
      } finally {
        this.activeJobs.delete(key);
      }
    })();

    this.moveSlots.set(key, {
      userId,
      slotId,
      turnCount,
      moveKey,
      promise: renderPromise,
      createdAt: Date.now(),
    });

    return renderPromise;
  }

  /**
   * Pre-renders the next wave entry GIF while user is on victory screen.
   */
  private async preloadNextWave(
    userId: string,
    slotId: number,
    currentBattle: BattleState,
    lang: "ko" | "en"
  ): Promise<PreloadedWaveData | null> {
    const key = this.getKey(userId, slotId);
    if (this.activeJobs.has(key)) return null;

    const currentWave = currentBattle.wave;

    const existing = this.waveSlots.get(key);
    if (existing && existing.wave === currentWave && existing.data) {
      return existing.data;
    }

    this.activeJobs.add(key);

    const renderPromise = (async () => {
      try {
        const { nextBattle, nextWave, nextBiome } = battleService.createSpeculativeNextWaveBattle(
          userId,
          slotId,
          currentBattle,
          lang
        );

        const uniqueId = Date.now();
        const res = await renderBattleEntryGif({
          battle: nextBattle,
          lang,
        });

        const isKo = lang === "ko";
        const components = buildBattleComponents(nextBattle, userId, slotId, isKo);

        const result: PreloadedWaveData = {
          userId,
          slotId,
          wave: currentWave,
          nextBattleState: nextBattle,
          imageBuffer: res.buffer,
          fileName: `battle_wave_${nextWave}_${uniqueId}.gif`,
          motionDurationMs: res.motionDurationMs,
          components,
        };

        const currentEntry = this.waveSlots.get(key);
        if (currentEntry && currentEntry.wave === currentWave) {
          currentEntry.data = result;
          currentEntry.promise = undefined;
        }

        console.log(`[PRELOAD SUCCESS] Pre-rendered Next Wave ${nextWave} (${nextBiome}) for user ${userId}_${slotId}`);
        return result;
      } finally {
        this.activeJobs.delete(key);
      }
    })();

    this.waveSlots.set(key, {
      userId,
      slotId,
      wave: currentWave,
      nextWave: currentWave + 1,
      nextBiome: currentBattle.biome,
      promise: renderPromise,
      createdAt: Date.now(),
    });

    return renderPromise;
  }

  /**
   * Attempts to consume preloaded move.
   * If matched and ready: commits state, returns rendered message payload (0ms wait!).
   */
  public consumeMovePreload(
    userId: string,
    slotId: number,
    moveKey: string,
    currentTurnCount: number
  ): PreloadedMoveData | null {
    const key = this.getKey(userId, slotId);
    const entry = this.moveSlots.get(key);

    if (!entry) return null;

    if (Date.now() - entry.createdAt > this.TTL_MS) {
      this.moveSlots.delete(key);
      return null;
    }

    const cleanReqKey = getMoveKey(moveKey);
    const cleanEntryKey = getMoveKey(entry.moveKey);

    if (entry.turnCount === currentTurnCount && cleanEntryKey === cleanReqKey && entry.data) {
      const data = entry.data;
      this.moveSlots.delete(key);

      // Commit the speculative battle state to BattleService and save DB
      battleService.commitBattleState(userId, slotId, data.committedBattleState);
      console.log(`[PRELOAD CACHE HIT ⚡] Move '${cleanReqKey}' instant return for ${userId}_${slotId}`);
      return data;
    }

    return null;
  }

  /**
   * If a move is requested while its pre-render is currently in-flight,
   * awaits the existing promise instead of starting from scratch!
   */
  public async awaitMovePreload(
    userId: string,
    slotId: number,
    moveKey: string,
    currentTurnCount: number,
    timeoutMs: number = 4000
  ): Promise<PreloadedMoveData | null> {
    const key = this.getKey(userId, slotId);
    const entry = this.moveSlots.get(key);

    if (!entry || !entry.promise) return null;

    const cleanReqKey = getMoveKey(moveKey);
    const cleanEntryKey = getMoveKey(entry.moveKey);

    if (entry.turnCount === currentTurnCount && cleanEntryKey === cleanReqKey) {
      try {
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));
        const res = await Promise.race([entry.promise, timeoutPromise]);
        if (res) {
          return this.consumeMovePreload(userId, slotId, moveKey, currentTurnCount);
        }
      } catch (err) {
        console.warn(`[PRELOAD AWAIT ERROR] for ${userId}_${slotId}:`, err);
      }
    }

    return null;
  }

  /**
   * Attempts to consume preloaded next wave.
   */
  public consumeNextWavePreload(
    userId: string,
    slotId: number,
    currentWave: number
  ): PreloadedWaveData | null {
    const key = this.getKey(userId, slotId);
    const entry = this.waveSlots.get(key);

    if (!entry) return null;

    if (Date.now() - entry.createdAt > this.TTL_MS) {
      this.waveSlots.delete(key);
      return null;
    }

    if (entry.wave === currentWave && entry.data) {
      const data = entry.data;
      this.waveSlots.delete(key);

      // Commit next wave to BattleService and save DB
      battleService.commitSpeculativeNextWave(
        userId,
        slotId,
        data.nextBattleState,
        entry.nextWave,
        entry.nextBiome
      );
      console.log(`[PRELOAD CACHE HIT ⚡] Next Wave ${entry.nextWave} instant return for ${userId}_${slotId}`);
      return data;
    }

    return null;
  }

  /**
   * If next wave is requested while pre-render is in-flight, awaits the existing promise.
   */
  public async awaitNextWavePreload(
    userId: string,
    slotId: number,
    currentWave: number,
    timeoutMs: number = 4000
  ): Promise<PreloadedWaveData | null> {
    const key = this.getKey(userId, slotId);
    const entry = this.waveSlots.get(key);

    if (!entry || !entry.promise) return null;

    if (entry.wave === currentWave) {
      try {
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));
        const res = await Promise.race([entry.promise, timeoutPromise]);
        if (res) {
          return this.consumeNextWavePreload(userId, slotId, currentWave);
        }
      } catch (err) {
        console.warn(`[PRELOAD AWAIT NEXT WAVE ERROR] for ${userId}_${slotId}:`, err);
      }
    }

    return null;
  }

  /**
   * Clears preloaded slots when an unexpected or invalidating action occurs.
   */
  public invalidate(userId: string, slotId: number): void {
    const key = this.getKey(userId, slotId);
    this.moveSlots.delete(key);
    this.waveSlots.delete(key);
  }
}

export const battlePreloadService = BattlePreloadService.getInstance();
