/**
 * Save & Profile Service for PokeRogue
 * Manages user slots, active runs, unlocked starters, and statistics
 */

export interface GameSlot {
  slotId: number; // 1, 2, 3
  wave: number;
  biome: string;
  starter: string;
  party: {
    speciesId: string;
    name: string;
    level: number;
    hp: number;
    maxHp: number;
  }[];
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
        unlockedStartersCount: 9,
        totalRuns: 0,
        highestWave: 0,
        activeSlotId: null,
        slots: { 1: null, 2: null, 3: null },
      });
    }
    return this.userProfiles.get(userId)!;
  }

  public hasAnySavedSlot(userId: string): boolean {
    const profile = this.getProfile(userId);
    return Object.values(profile.slots).some((slot) => slot !== null);
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
    const profile = this.getProfile(userId);

    const starterNameMap: Record<string, string> = {
      bulbasaur: "Bulbasaur (이상해씨)",
      charmander: "Charmander (파이리)",
      squirtle: "Squirtle (꼬부기)",
    };

    const newSlot: GameSlot = {
      slotId,
      wave: 1,
      biome: "Town / Forest",
      starter: starterSpecies,
      party: [
        {
          speciesId: starterSpecies,
          name: starterNameMap[starterSpecies] || starterSpecies,
          level: 5,
          hp: 20,
          maxHp: 20,
        },
      ],
      money: 1000,
      score: 0,
      updatedAt: new Date().toISOString(),
    };

    profile.slots[slotId] = newSlot;
    profile.activeSlotId = slotId;
    profile.totalRuns += 1;

    return newSlot;
  }
}

export const saveService = SaveService.getInstance();
