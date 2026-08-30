import { db } from "./db.js";
import { STARTER_DATABASE, StarterEntry } from "../data/starterCosts.js";

export interface UserStarterProgress {
  userId: string;
  speciesId: string;
  dexNumber: number;
  isUnlocked: boolean;
  shinyTier: number; // 0: None, 1: Yellow (Luck 1), 2: Blue (Luck 2), 3: Red (Luck 3)
  hasHiddenAbility: boolean;
  passiveUnlocked: boolean;
  costReductionCount: number; // 0: Normal, 1: -1 Cost, 2: -2 Cost
  candies: number;
  eggMoves: string[];
  hatchedCount: number;
  caughtCount: number;
}

// 1~9 Gen Default Starters (Grass, Fire, Water trios - 27 Pokemon)
const DEFAULT_STARTER_SPECIES = new Set([
  "bulbasaur", "charmander", "squirtle",
  "chikorita", "cyndaquil", "totodile",
  "treecko", "torchic", "mudkip",
  "turtwig", "chimchar", "piplup",
  "snivy", "tepig", "oshawott",
  "chespin", "fennekin", "froakie",
  "rowlet", "litten", "popplio",
  "grookey", "scorbunny", "sobble",
  "sprigatito", "fuecoco", "quaxly",
]);

/**
 * Initializes and fetches all starter progress for a user.
 * Automatically unlocks the 27 default starters if not already initialized.
 */
export function getUserStarters(userId: string): Map<string, UserStarterProgress> {
  const rows = db.prepare(`SELECT * FROM user_starters WHERE user_id = ?`).all(userId) as any[];

  const progressMap = new Map<string, UserStarterProgress>();

  for (const r of rows) {
    let eggMoves: string[] = [];
    try {
      eggMoves = JSON.parse(r.egg_moves || "[]");
    } catch {}

    progressMap.set(r.species_id, {
      userId: r.user_id,
      speciesId: r.species_id,
      dexNumber: r.dex_number,
      isUnlocked: Boolean(r.is_unlocked),
      shinyTier: r.shiny_tier,
      hasHiddenAbility: Boolean(r.has_hidden_ability),
      passiveUnlocked: Boolean(r.passive_unlocked),
      costReductionCount: r.cost_reduction_count,
      candies: r.candies,
      eggMoves,
      hatchedCount: r.hatched_count,
      caughtCount: r.caught_count,
    });
  }

  // Auto-init missing starters into DB
  const now = new Date().toISOString();
  const insertStmt = db.prepare(`
    INSERT INTO user_starters (
      user_id, species_id, dex_number, is_unlocked, shiny_tier,
      has_hidden_ability, passive_unlocked, cost_reduction_count, candies,
      egg_moves, hatched_count, caught_count, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  const tx = db.transaction(() => {
    for (const entry of STARTER_DATABASE) {
      if (!progressMap.has(entry.speciesId)) {
        const isDefault = DEFAULT_STARTER_SPECIES.has(entry.speciesId);
        const isUnlocked = isDefault ? 1 : 0;

        insertStmt.run(
          userId,
          entry.speciesId,
          entry.dexNumber,
          isUnlocked,
          0, // shiny_tier
          0, // has_hidden_ability
          0, // passive_unlocked
          0, // cost_reduction_count
          0, // candies
          "[]",
          0, // hatched_count
          0, // caught_count
          now,
          now
        );

        progressMap.set(entry.speciesId, {
          userId,
          speciesId: entry.speciesId,
          dexNumber: entry.dexNumber,
          isUnlocked: Boolean(isUnlocked),
          shinyTier: 0,
          hasHiddenAbility: false,
          passiveUnlocked: false,
          costReductionCount: 0,
          candies: 0,
          eggMoves: [],
          hatchedCount: 0,
          caughtCount: 0,
        });
      }
    }
  });

  if (rows.length < STARTER_DATABASE.length) {
    tx();
  }

  return progressMap;
}

/**
 * Gets a specific starter's progress for a user
 */
export function getUserStarter(userId: string, speciesId: string): UserStarterProgress | null {
  const map = getUserStarters(userId);
  return map.get(speciesId) || null;
}

/**
 * Unlocks or upgrades a starter upon hatching an egg or catching in the wild
 */
export function unlockOrUpgradeStarter(
  userId: string,
  speciesId: string,
  options: {
    shinyTier?: number;
    hasHiddenAbility?: boolean;
    eggMove?: string;
    candiesToAdd?: number;
    isHatch?: boolean;
  }
): UserStarterProgress {
  const current = getUserStarter(userId, speciesId);
  const entry = STARTER_DATABASE.find((s: StarterEntry) => s.speciesId === speciesId);
  if (!entry) {
    throw new Error(`Unknown starter species: ${speciesId}`);
  }

  const now = new Date().toISOString();
  const shinyTier = Math.max(current?.shinyTier || 0, options.shinyTier || 0);
  const hasHiddenAbility = (current?.hasHiddenAbility || false) || (options.hasHiddenAbility || false);
  const candies = (current?.candies || 0) + (options.candiesToAdd || (options.isHatch ? 2 : 1));
  const hatchedCount = (current?.hatchedCount || 0) + (options.isHatch ? 1 : 0);
  const caughtCount = (current?.caughtCount || 0) + (!options.isHatch ? 1 : 0);

  const eggMoves = new Set(current?.eggMoves || []);
  if (options.eggMove) {
    eggMoves.add(options.eggMove);
  }

  db.prepare(`
    INSERT INTO user_starters (
      user_id, species_id, dex_number, is_unlocked, shiny_tier,
      has_hidden_ability, passive_unlocked, cost_reduction_count, candies,
      egg_moves, hatched_count, caught_count, created_at, updated_at
    ) VALUES (
      ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
    ON CONFLICT(user_id, species_id) DO UPDATE SET
      is_unlocked = 1,
      shiny_tier = excluded.shiny_tier,
      has_hidden_ability = excluded.has_hidden_ability,
      candies = excluded.candies,
      egg_moves = excluded.egg_moves,
      hatched_count = excluded.hatched_count,
      caught_count = excluded.caught_count,
      updated_at = excluded.updated_at
  `).run(
    userId,
    speciesId,
    entry.dexNumber,
    shinyTier,
    hasHiddenAbility ? 1 : 0,
    current?.passiveUnlocked ? 1 : 0,
    current?.costReductionCount || 0,
    candies,
    JSON.stringify(Array.from(eggMoves)),
    hatchedCount,
    caughtCount,
    now,
    now
  );

  return {
    userId,
    speciesId,
    dexNumber: entry.dexNumber,
    isUnlocked: true,
    shinyTier,
    hasHiddenAbility,
    passiveUnlocked: current?.passiveUnlocked || false,
    costReductionCount: current?.costReductionCount || 0,
    candies,
    eggMoves: Array.from(eggMoves),
    hatchedCount,
    caughtCount,
  };
}

/**
 * Unlocks the passive ability using candies
 */
export function unlockPassiveAbility(userId: string, speciesId: string, candyCost: number = 10): boolean {
  const current = getUserStarter(userId, speciesId);
  if (!current || current.passiveUnlocked || current.candies < candyCost) {
    return false;
  }

  db.prepare(`
    UPDATE user_starters
    SET passive_unlocked = 1, candies = candies - ?, updated_at = ?
    WHERE user_id = ? AND species_id = ?
  `).run(candyCost, new Date().toISOString(), userId, speciesId);

  return true;
}
