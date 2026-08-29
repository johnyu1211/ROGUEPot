/**
 * Save & Profile Service for PokeRogue
 * Manages user slots, active runs, unlocked starters, and statistics
 */

export interface GameSlot {
  slotId: number; // 1, 2, 3
  wave: number;
  biome: string;
  party: string[];
  money: number;
  score: number;
  updatedAt: string;
}

export interface UserProfile {
  userId: string;
  unlockedStartersCount: number;
  totalRuns: number;
  highestWave: number;
  activeSlotId: number | null;
  slots: Record<number, GameSlot | null>;
}

class SaveService {
  private static instance: SaveService;
  // In-memory / cache storage (can be backed by SQLite/JSON)
  private userProfiles: Map<string, UserProfile> = new Map();

  private constructor() {}

  public static getInstance(): SaveService {
    if (!SaveService.instance) {
      SaveService.instance = new SaveService();
    }
    return SaveService.instance;
  }

  public getProfile(userId: string): UserProfile {
    if (!this.userProfiles.has(userId)) {
      this.userProfiles.set(userId, {
        userId,
        unlockedStartersCount: 9, // Gen 1-3 default starters unlocked
        totalRuns: 0,
        highestWave: 0,
        activeSlotId: null,
        slots: { 1: null, 2: null, 3: null },
      });
    }
    return this.userProfiles.get(userId)!;
  }

  public hasActiveRun(userId: string): boolean {
    const profile = this.getProfile(userId);
    return profile.activeSlotId !== null && profile.slots[profile.activeSlotId] !== null;
  }
}

export const saveService = SaveService.getInstance();
