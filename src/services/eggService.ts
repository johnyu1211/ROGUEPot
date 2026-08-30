import crypto from "crypto";
import { db } from "./db.js";
import { STARTER_DATABASE, StarterEntry } from "../data/starterCosts.js";
import { unlockOrUpgradeStarter, UserStarterProgress } from "./starterService.js";

export type EggTier = "common" | "rare" | "epic" | "legendary";
export type GachaType = "shiny" | "move" | "legendary";

export interface UserEgg {
  id: string;
  userId: string;
  tier: EggTier;
  gachaType: GachaType;
  stepsRequired: number;
  stepsProgress: number;
  speciesId: string;
  shinyTier: number;
  hasHiddenAbility: boolean;
  eggMove?: string;
  hatched: boolean;
  createdAt: string;
}

const TIER_STEPS: Record<EggTier, number> = {
  common: 10,
  rare: 25,
  epic: 50,
  legendary: 100,
};

/**
 * Generates an egg based on the gacha machine type
 */
function rollEgg(gachaType: GachaType): {
  tier: EggTier;
  speciesId: string;
  shinyTier: number;
  hasHiddenAbility: boolean;
  eggMove?: string;
} {
  // 1. Roll Tier (Standard PokéRogue Egg Odds)
  const tierRoll = Math.random() * 100;
  let tier: EggTier = "common";
  if (gachaType === "legendary" && tierRoll < 5) {
    tier = "legendary";
  } else if (tierRoll < 1) {
    tier = "legendary";
  } else if (tierRoll < 7) {
    tier = "epic";
  } else if (tierRoll < 25) {
    tier = "rare";
  } else {
    tier = "common";
  }

  // 2. Pick Pokemon based on tier
  let eligible: StarterEntry[] = STARTER_DATABASE;
  if (tier === "common") {
    eligible = STARTER_DATABASE.filter((s: StarterEntry) => s.cost <= 2);
  } else if (tier === "rare" || tier === "epic") {
    eligible = STARTER_DATABASE.filter((s: StarterEntry) => s.cost >= 3);
  }
  if (eligible.length === 0) eligible = STARTER_DATABASE;

  const picked = eligible[Math.floor(Math.random() * eligible.length)];

  // 3. Roll Shiny (Shiny Gacha: 1/64 vs Normal: 1/128)
  const shinyRate = gachaType === "shiny" ? 1 / 64 : 1 / 128;
  let shinyTier = 0;
  if (Math.random() < shinyRate) {
    const sTierRoll = Math.random();
    if (sTierRoll < 0.6) shinyTier = 1; // Tier 1 Yellow (60%)
    else if (sTierRoll < 0.9) shinyTier = 2; // Tier 2 Blue (30%)
    else shinyTier = 3; // Tier 3 Red (10%)
  }

  // 4. Roll Hidden Ability (1/128 or 1/64)
  const haRate = 1 / 64;
  const hasHiddenAbility = Math.random() < haRate;

  return {
    tier,
    speciesId: picked.speciesId,
    shinyTier,
    hasHiddenAbility,
  };
}

/**
 * Pulls N eggs from a specific gacha machine and adds them to the user's incubator.
 */
export function pullEggs(userId: string, gachaType: GachaType, count: number = 1): UserEgg[] {
  const now = new Date().toISOString();
  const insertStmt = db.prepare(`
    INSERT INTO user_eggs (
      id, user_id, tier, gacha_type, steps_required, steps_progress,
      species_id, shiny_tier, has_hidden_ability, egg_move, hatched,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, 0, ?, ?
    )
  `);

  const createdEggs: UserEgg[] = [];

  const tx = db.transaction(() => {
    for (let i = 0; i < count; i++) {
      const rolled = rollEgg(gachaType);
      const id = crypto.randomUUID();
      const stepsRequired = TIER_STEPS[rolled.tier];

      insertStmt.run(
        id,
        userId,
        rolled.tier,
        gachaType,
        stepsRequired,
        rolled.speciesId,
        rolled.shinyTier,
        rolled.hasHiddenAbility ? 1 : 0,
        rolled.eggMove || null,
        now,
        now
      );

      createdEggs.push({
        id,
        userId,
        tier: rolled.tier,
        gachaType,
        stepsRequired,
        stepsProgress: 0,
        speciesId: rolled.speciesId,
        shinyTier: rolled.shinyTier,
        hasHiddenAbility: rolled.hasHiddenAbility,
        eggMove: rolled.eggMove,
        hatched: false,
        createdAt: now,
      });
    }
  });

  tx();
  return createdEggs;
}

/**
 * Gets all unhatched eggs for a user
 */
export function getUserEggs(userId: string): UserEgg[] {
  const rows = db.prepare(`
    SELECT * FROM user_eggs
    WHERE user_id = ? AND hatched = 0
    ORDER BY created_at ASC
  `).all(userId) as any[];

  return rows.map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    tier: r.tier as EggTier,
    gachaType: r.gacha_type as GachaType,
    stepsRequired: r.steps_required,
    stepsProgress: r.steps_progress,
    speciesId: r.species_id,
    shinyTier: r.shiny_tier,
    hasHiddenAbility: Boolean(r.has_hidden_ability),
    eggMove: r.egg_move || undefined,
    hatched: Boolean(r.hatched),
    createdAt: r.created_at,
  }));
}

/**
 * Advances egg hatching steps by wave count and returns any newly hatched starters.
 */
export function advanceEggHatching(userId: string, wavesCompleted: number = 1): {
  egg: UserEgg;
  starter: UserStarterProgress;
}[] {
  const unhatched = getUserEggs(userId);
  const newlyHatched: { egg: UserEgg; starter: UserStarterProgress }[] = [];

  const updateProgressStmt = db.prepare(`
    UPDATE user_eggs
    SET steps_progress = steps_progress + ?, updated_at = ?
    WHERE id = ?
  `);

  const setHatchedStmt = db.prepare(`
    UPDATE user_eggs
    SET hatched = 1, updated_at = ?
    WHERE id = ?
  `);

  const now = new Date().toISOString();

  const tx = db.transaction(() => {
    for (const egg of unhatched) {
      const newProgress = egg.stepsProgress + wavesCompleted;
      if (newProgress >= egg.stepsRequired) {
        setHatchedStmt.run(now, egg.id);

        // Unlock starter & grant candy/shiny/HA
        const starter = unlockOrUpgradeStarter(userId, egg.speciesId, {
          shinyTier: egg.shinyTier,
          hasHiddenAbility: egg.hasHiddenAbility,
          eggMove: egg.eggMove,
          candiesToAdd: egg.tier === "legendary" ? 10 : egg.tier === "epic" ? 5 : 2,
          isHatch: true,
        });

        newlyHatched.push({
          egg: { ...egg, stepsProgress: egg.stepsRequired, hatched: true },
          starter,
        });
      } else {
        updateProgressStmt.run(wavesCompleted, now, egg.id);
      }
    }
  });

  tx();
  return newlyHatched;
}
