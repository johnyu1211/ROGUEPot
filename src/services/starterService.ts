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

// 1~9 Gen Default Starters (Grass, Fire, Water trios + Sunkern - 28 Pokemon)
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
  "sunkern", // 해너츠: 최약체 포켓몬 (종족값 180 / 테스트용 모든 기술 완벽 해금)
  "testsubject12", // 테스트용 흰색 메타몽 (전 기술 습득 가능)
]);

/**
 * Initializes and fetches all starter progress for a user.
 * Automatically unlocks default starters if not already initialized.
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

  // Test Starter Grants (Gen 1 trio + Sunkern with all moves unlocked)
  const testTiers: Record<string, { shinyTier: number; hasHA: boolean; passive: boolean; eggMoves?: string[] }> = {
    bulbasaur: { shinyTier: 3, hasHA: true, passive: true }, // Tier 3 Red Shiny (+3 Luck)
    charmander: { shinyTier: 2, hasHA: true, passive: true }, // Tier 2 Blue Shiny (+2 Luck)
    squirtle: { shinyTier: 1, hasHA: true, passive: true }, // Tier 1 Yellow Shiny (+1 Luck)
    sunkern: {
      shinyTier: 3,
      hasHA: true,
      passive: true,
      eggMoves: [
        "Fiery Dance",
        "Earth Power",
        "Weather Ball",
        "Strength Sap",
        "Giga Drain",
        "Leaf Storm",
        "Synthesis"
      ]
    },
    testsubject12: {
      shinyTier: 3,
      hasHA: true,
      passive: true,
      eggMoves: [
        "Transform",
        "Metronome",
        "Substitute",
        "Recover",
        "Judgment",
        "Spore",
        "V-create",
        "Dragon Dance",
        "Geomancy",
        "Astral Barrage",
        "Close Combat",
        "Oblivion Wing"
      ]
    },
  };

  const tx = db.transaction(() => {
    for (const entry of STARTER_DATABASE) {
      const testGrant = testTiers[entry.speciesId];
      const isDefault = DEFAULT_STARTER_SPECIES.has(entry.speciesId);
      const isUnlocked = (isDefault || testGrant) ? 1 : 0;
      const initialShiny = testGrant ? testGrant.shinyTier : 0;
      const initialHA = testGrant ? 1 : 0;
      const initialPassive = testGrant ? 1 : 0;
      const initialEggMoves = testGrant?.eggMoves ? JSON.stringify(testGrant.eggMoves) : "[]";

      if (!progressMap.has(entry.speciesId)) {
        insertStmt.run(
          userId,
          entry.speciesId,
          entry.dexNumber,
          isUnlocked,
          initialShiny,
          initialHA,
          initialPassive,
          0, // cost_reduction_count
          50, // candies
          initialEggMoves,
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
          shinyTier: initialShiny,
          hasHiddenAbility: Boolean(initialHA),
          passiveUnlocked: Boolean(initialPassive),
          costReductionCount: 0,
          candies: 50,
          eggMoves: testGrant?.eggMoves ? [...testGrant.eggMoves] : [],
          hatchedCount: 0,
          caughtCount: 0,
        });
      } else if (testGrant) {
        // Upgrade existing DB record if lower than test grant
        const current = progressMap.get(entry.speciesId)!;
        const needsEggMovesUpdate = Boolean(testGrant.eggMoves && (!current.eggMoves || current.eggMoves.length < testGrant.eggMoves.length));
        if (current.shinyTier < testGrant.shinyTier || !current.hasHiddenAbility || !current.passiveUnlocked || !current.isUnlocked || needsEggMovesUpdate) {
          const updatedEggMoves = testGrant.eggMoves || current.eggMoves;
          db.prepare(`
            UPDATE user_starters
            SET is_unlocked = 1, shiny_tier = MAX(shiny_tier, ?), has_hidden_ability = 1, passive_unlocked = 1, egg_moves = ?, candies = MAX(candies, 50), updated_at = ?
            WHERE user_id = ? AND species_id = ?
          `).run(testGrant.shinyTier, JSON.stringify(updatedEggMoves), now, userId, entry.speciesId);

          current.isUnlocked = true;
          current.shinyTier = Math.max(current.shinyTier, testGrant.shinyTier);
          current.hasHiddenAbility = true;
          current.passiveUnlocked = true;
          current.eggMoves = updatedEggMoves;
          current.candies = Math.max(current.candies, 50);
        }
      }
    }
  });

  tx();

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

/**
 * Permanently reduces starter cost by 1C using candies (max 2 times)
 */
export function reduceStarterCost(userId: string, speciesId: string, candyCost: number): boolean {
  const current = getUserStarter(userId, speciesId);
  if (!current || current.costReductionCount >= 2 || current.candies < candyCost) {
    return false;
  }

  db.prepare(`
    UPDATE user_starters
    SET cost_reduction_count = cost_reduction_count + 1, candies = candies - ?, updated_at = ?
    WHERE user_id = ? AND species_id = ?
  `).run(candyCost, new Date().toISOString(), userId, speciesId);

  return true;
}
