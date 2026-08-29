import { db, initDatabase } from "./db.js";

// Initialize database schema on startup
initDatabase();

export interface PartyPokemon {
  speciesId: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  moves?: string[];
  ability?: string;
  nature?: string;
  ivs?: Record<string, number>;
  heldItems?: string[];
}

export interface GameSlot {
  slotId: number;
  gameMode: string;
  wave: number;
  biome: string;
  starter: string;
  party: PartyPokemon[];
  items: Record<string, number>;
  money: number;
  score: number;
  updatedAt: string;
}

export interface UserProfile {
  userId: string;
  dexData: Record<string, any>;
  starterData: Record<string, any>;
  vouchers: Record<string, number>;
  totalRuns: number;
  highestWave: number;
  activeSlotId: number | null;
  unlockedStartersCount: number;
  slots: Record<number, GameSlot | null>;
}

class SaveService {
  private static instance: SaveService;

  private constructor() {}

  public static getInstance(): SaveService {
    if (!SaveService.instance) {
      SaveService.instance = new SaveService();
    }
    return SaveService.instance;
  }

  /**
   * Get or create a user profile from SQLite DB
   */
  public getProfile(userId: string): UserProfile {
    const userRow: any = db.prepare("SELECT * FROM users WHERE user_id = ?").get(userId);

    if (!userRow) {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO users (user_id, dex_data, starter_data, vouchers, total_runs, highest_wave, active_slot_id, created_at, updated_at)
        VALUES (?, '{}', '{}', '{"regular": 0, "plus": 0, "premium": 0, "gold": 0}', 0, 0, NULL, ?, ?)
      `).run(userId, now, now);
    }

    const updatedUserRow: any = db.prepare("SELECT * FROM users WHERE user_id = ?").get(userId);

    // Fetch all slots (1, 2, 3)
    const slotRows: any[] = db.prepare("SELECT * FROM game_slots WHERE user_id = ? ORDER BY slot_id ASC").all(userId);
    const slots: Record<number, GameSlot | null> = { 1: null, 2: null, 3: null };

    for (const r of slotRows) {
      slots[r.slot_id] = {
        slotId: r.slot_id,
        gameMode: r.game_mode,
        wave: r.wave,
        biome: r.biome,
        starter: r.starter,
        party: JSON.parse(r.party || "[]"),
        items: JSON.parse(r.items || "{}"),
        money: r.money,
        score: r.score,
        updatedAt: r.updated_at,
      };
    }

    const starterData = JSON.parse(updatedUserRow.starter_data || "{}");
    const unlockedCount = Math.max(9, Object.keys(starterData).length);

    return {
      userId,
      dexData: JSON.parse(updatedUserRow.dex_data || "{}"),
      starterData,
      vouchers: JSON.parse(updatedUserRow.vouchers || "{}"),
      totalRuns: updatedUserRow.total_runs,
      highestWave: updatedUserRow.highest_wave,
      activeSlotId: updatedUserRow.active_slot_id,
      unlockedStartersCount: unlockedCount,
      slots,
    };
  }

  public hasAnySavedSlot(userId: string): boolean {
    const row: any = db.prepare("SELECT COUNT(*) as count FROM game_slots WHERE user_id = ?").get(userId);
    return (row?.count || 0) > 0;
  }

  public hasActiveRun(userId: string): boolean {
    const profile = this.getProfile(userId);
    return profile.activeSlotId !== null && profile.slots[profile.activeSlotId] !== null;
  }

  public getFirstAvailableSlot(userId: string): number {
    const profile = this.getProfile(userId);
    for (let i = 1; i <= 3; i++) {
      if (!profile.slots[i]) return i;
    }
    return 1;
  }

  public startNewRun(userId: string, slotId: number, starterSpecies: string): GameSlot {
    const now = new Date().toISOString();

    const starterNameMap: Record<string, string> = {
      bulbasaur: "Bulbasaur (이상해씨)",
      charmander: "Charmander (파이리)",
      squirtle: "Squirtle (꼬부기)",
    };

    const initialParty: PartyPokemon[] = [
      {
        speciesId: starterSpecies,
        name: starterNameMap[starterSpecies] || starterSpecies,
        level: 5,
        hp: 20,
        maxHp: 20,
        moves: ["Tackle", "Growl"],
      },
    ];

    this.getProfile(userId);

    // Save into SQLite
    db.prepare(`
      INSERT OR REPLACE INTO game_slots (user_id, slot_id, game_mode, wave, biome, starter, party, items, money, score, created_at, updated_at)
      VALUES (?, ?, 'Classic', 1, 'Town', ?, ?, '{}', 1000, 0, ?, ?)
    `).run(userId, slotId, starterSpecies, JSON.stringify(initialParty), now, now);

    db.prepare(`
      UPDATE users SET active_slot_id = ?, total_runs = total_runs + 1, updated_at = ? WHERE user_id = ?
    `).run(slotId, now, userId);

    return {
      slotId,
      gameMode: "Classic",
      wave: 1,
      biome: "Town",
      starter: starterSpecies,
      party: initialParty,
      items: {},
      money: 1000,
      score: 0,
      updatedAt: now,
    };
  }

  public deleteSlot(userId: string, slotId: number): boolean {
    const info = db.prepare("DELETE FROM game_slots WHERE user_id = ? AND slot_id = ?").run(userId, slotId);

    const profile = this.getProfile(userId);
    if (profile.activeSlotId === slotId) {
      const remainingSlots = Object.values(profile.slots).filter((s) => s !== null && s.slotId !== slotId);
      const newActiveId = remainingSlots.length > 0 ? remainingSlots[0]!.slotId : null;
      db.prepare("UPDATE users SET active_slot_id = ? WHERE user_id = ?").run(newActiveId, userId);
    }

    return info.changes > 0;
  }

  public setActiveSlot(userId: string, slotId: number): void {
    const now = new Date().toISOString();
    db.prepare("UPDATE users SET active_slot_id = ?, updated_at = ? WHERE user_id = ?").run(slotId, now, userId);
  }
}

export const saveService = SaveService.getInstance();
