import { db, initDatabase } from "./db.js";

// Initialize database schema on startup
initDatabase();

export interface PartyPokemon {
  speciesId: string;
  name: string;
  nameKo?: string;
  nameEn?: string;
  nickname?: string;
  level: number;
  hp: number;
  maxHp: number;
  moves?: string[];
  ability?: string;
  passiveAbility?: string;
  useHiddenAbility?: boolean;
  usePassive?: boolean;
  isShiny?: boolean;
  shinyTier?: number;
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
  language: "en" | "ko";
  dexData: Record<string, any>;
  starterData: Record<string, any>;
  vouchers: Record<string, number>;
  totalRuns: number;
  highestWave: number;
  activeSlotId: number | null;
  multiplayerTeam: PartyPokemon[];
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
        INSERT INTO users (user_id, language, dex_data, starter_data, vouchers, total_runs, highest_wave, active_slot_id, multiplayer_team, created_at, updated_at)
        VALUES (?, 'en', '{}', '{}', '{"regular": 0, "plus": 0, "premium": 0, "gold": 0}', 0, 0, NULL, '[]', ?, ?)
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
    const multiplayerTeam: PartyPokemon[] = JSON.parse(updatedUserRow.multiplayer_team || "[]");

    return {
      userId,
      language: (updatedUserRow.language as "en" | "ko") || "en",
      dexData: JSON.parse(updatedUserRow.dex_data || "{}"),
      starterData,
      vouchers: JSON.parse(updatedUserRow.vouchers || "{}"),
      totalRuns: updatedUserRow.total_runs,
      highestWave: updatedUserRow.highest_wave,
      activeSlotId: updatedUserRow.active_slot_id,
      multiplayerTeam,
      unlockedStartersCount: unlockedCount,
      slots,
    };
  }

  public setLanguage(userId: string, language: "en" | "ko"): void {
    const now = new Date().toISOString();
    this.getProfile(userId);
    db.prepare("UPDATE users SET language = ?, updated_at = ? WHERE user_id = ?").run(language, now, userId);
  }

  public addMultiplayerPokemon(userId: string, pokemon: PartyPokemon): { success: boolean; slotIndex: number; team: PartyPokemon[] } {
    const profile = this.getProfile(userId);
    const team = [...profile.multiplayerTeam];

    // Find first empty slot among 0..5
    let targetIndex = -1;
    for (let i = 0; i < 6; i++) {
      if (!team[i]) {
        targetIndex = i;
        break;
      }
    }

    if (targetIndex === -1) {
      // All 6 slots are occupied!
      return { success: false, slotIndex: -1, team };
    }

    team[targetIndex] = pokemon;
    const now = new Date().toISOString();
    db.prepare("UPDATE users SET multiplayer_team = ?, updated_at = ? WHERE user_id = ?").run(
      JSON.stringify(team),
      now,
      userId
    );

    return { success: true, slotIndex: targetIndex, team };
  }

  public setMultiplayerPokemon(userId: string, slotIndex: number, pokemon: PartyPokemon): PartyPokemon[] {
    const profile = this.getProfile(userId);
    const team = [...profile.multiplayerTeam];
    team[slotIndex] = pokemon;
    const now = new Date().toISOString();

    db.prepare("UPDATE users SET multiplayer_team = ?, updated_at = ? WHERE user_id = ?").run(
      JSON.stringify(team),
      now,
      userId
    );
    return team;
  }

  public clearMultiplayerTeam(userId: string): void {
    const now = new Date().toISOString();
    this.getProfile(userId);
    db.prepare("UPDATE users SET multiplayer_team = '[]', updated_at = ? WHERE user_id = ?").run(now, userId);
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
      VALUES (?, ?, 'Classic', 1, 'Town', ?, ?, ?, 1000, 0, ?, ?)
    `).run(userId, slotId, starterSpecies, JSON.stringify(initialParty), JSON.stringify({ "poke-ball": 5 }), now, now);

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
      items: { "poke-ball": 5 },
      money: 1000,
      score: 0,
      updatedAt: now,
    };
  }

  public createNewRunWithParty(
    userId: string,
    slotId: number,
    starterParty: PartyPokemon[]
  ): GameSlot {
    const now = new Date().toISOString();
    const starterNames = starterParty.map((p) => p.name).join(", ") || "Starter";

    this.getProfile(userId);

    // Save into SQLite
    db.prepare(`
      INSERT OR REPLACE INTO game_slots (user_id, slot_id, game_mode, wave, biome, starter, party, items, money, score, created_at, updated_at)
      VALUES (?, ?, 'Classic', 1, 'Town', ?, ?, ?, 1000, 0, ?, ?)
    `).run(userId, slotId, starterNames, JSON.stringify(starterParty), JSON.stringify({ "poke-ball": 5 }), now, now);

    db.prepare(`
      UPDATE users SET active_slot_id = ?, total_runs = total_runs + 1, updated_at = ? WHERE user_id = ?
    `).run(slotId, now, userId);

    return {
      slotId,
      gameMode: "Classic",
      wave: 1,
      biome: "Town",
      starter: starterNames,
      party: starterParty,
      items: { "poke-ball": 5 },
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

  public updateSlot(userId: string, slotId: number, data: Partial<GameSlot>): void {
    const profile = this.getProfile(userId);
    const existing = profile.slots[slotId];
    if (!existing) return;

    const now = new Date().toISOString();
    const updatedWave = data.wave !== undefined ? data.wave : existing.wave;
    const updatedBiome = data.biome !== undefined ? data.biome : existing.biome;
    const updatedParty = data.party !== undefined ? data.party : existing.party;
    const updatedItems = data.items !== undefined ? data.items : existing.items;
    const updatedMoney = data.money !== undefined ? data.money : existing.money;
    const updatedScore = data.score !== undefined ? data.score : existing.score;

    db.prepare(`
      UPDATE game_slots
      SET wave = ?, biome = ?, party = ?, items = ?, money = ?, score = ?, updated_at = ?
      WHERE user_id = ? AND slot_id = ?
    `).run(
      updatedWave,
      updatedBiome,
      JSON.stringify(updatedParty),
      JSON.stringify(updatedItems),
      updatedMoney,
      updatedScore,
      now,
      userId,
      slotId
    );

    if (updatedWave > profile.highestWave) {
      db.prepare("UPDATE users SET highest_wave = ?, updated_at = ? WHERE user_id = ?").run(updatedWave, now, userId);
    }
  }

  public addBagPokemon(userId: string, pokemon: PartyPokemon): { success: boolean; messageKo: string; messageEn: string } {
    const profile = this.getProfile(userId);
    if (!profile.activeSlotId || !profile.slots[profile.activeSlotId]) {
      return { success: false, messageKo: "활성화된 모험(세이브 슬롯)이 없습니다!", messageEn: "No active adventure slot found!" };
    }
    const activeSlot = profile.slots[profile.activeSlotId]!;
    if (activeSlot.party.length >= 6) {
      return { success: false, messageKo: "현재 모험 가방 파티(6마리)가 이미 가득 찼습니다!", messageEn: "Active adventure party is already full (6/6)!" };
    }
    const updatedParty = [...activeSlot.party, pokemon];
    const now = new Date().toISOString();
    db.prepare("UPDATE game_slots SET party = ?, updated_at = ? WHERE user_id = ? AND slot_id = ?").run(JSON.stringify(updatedParty), now, userId, activeSlot.slotId);
    return { success: true, messageKo: `${pokemon.name}을(를) 모험 가방 파티에 등록했습니다! (${updatedParty.length}/6)`, messageEn: `Added ${pokemon.name} to Adventure Bag! (${updatedParty.length}/6)` };
  }
}

export const saveService = SaveService.getInstance();
