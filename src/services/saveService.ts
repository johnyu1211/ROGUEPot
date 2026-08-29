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

export interface GameSession {
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
  unlockedStartersCount: number;
  activeRun: GameSession | null;
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
   * Get or create a user profile with single active run from SQLite
   */
  public getProfile(userId: string): UserProfile {
    let userRow: any = db.prepare("SELECT * FROM users WHERE user_id = ?").get(userId);

    if (!userRow) {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO users (user_id, dex_data, starter_data, vouchers, total_runs, highest_wave, created_at, updated_at)
        VALUES (?, '{}', '{}', '{"regular": 0, "plus": 0, "premium": 0, "gold": 0}', 0, 0, ?, ?)
      `).run(userId, now, now);
      userRow = db.prepare("SELECT * FROM users WHERE user_id = ?").get(userId);
    }

    // Fetch single active session
    const sessionRow: any = db.prepare("SELECT * FROM game_sessions WHERE user_id = ?").get(userId);
    let activeRun: GameSession | null = null;

    if (sessionRow) {
      activeRun = {
        gameMode: sessionRow.game_mode,
        wave: sessionRow.wave,
        biome: sessionRow.biome,
        starter: sessionRow.starter,
        party: JSON.parse(sessionRow.party || "[]"),
        items: JSON.parse(sessionRow.items || "{}"),
        money: sessionRow.money,
        score: sessionRow.score,
        updatedAt: sessionRow.updated_at,
      };
    }

    const starterData = JSON.parse(userRow.starter_data || "{}");
    const unlockedCount = Math.max(9, Object.keys(starterData).length);

    return {
      userId,
      dexData: JSON.parse(userRow.dex_data || "{}"),
      starterData,
      vouchers: JSON.parse(userRow.vouchers || "{}"),
      totalRuns: userRow.total_runs,
      highestWave: userRow.highest_wave,
      unlockedStartersCount: unlockedCount,
      activeRun,
    };
  }

  public hasActiveRun(userId: string): boolean {
    const row: any = db.prepare("SELECT COUNT(*) as count FROM game_sessions WHERE user_id = ?").get(userId);
    return (row?.count || 0) > 0;
  }

  public hasAnySavedSlot(userId: string): boolean {
    return this.hasActiveRun(userId);
  }

  public startNewRun(userId: string, starterSpecies: string): GameSession {
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

    // Save/Replace into SQLite single session
    db.prepare(`
      INSERT OR REPLACE INTO game_sessions (user_id, game_mode, wave, biome, starter, party, items, money, score, created_at, updated_at)
      VALUES (?, 'Classic', 1, 'Town', ?, ?, '{}', 1000, 0, ?, ?)
    `).run(userId, starterSpecies, JSON.stringify(initialParty), now, now);

    db.prepare(`
      UPDATE users SET total_runs = total_runs + 1, updated_at = ? WHERE user_id = ?
    `).run(now, userId);

    return {
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

  public deleteActiveRun(userId: string): boolean {
    const info = db.prepare("DELETE FROM game_sessions WHERE user_id = ?").run(userId);
    return info.changes > 0;
  }
}

export const saveService = SaveService.getInstance();
