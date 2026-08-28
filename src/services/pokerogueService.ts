/**
 * Pokerogue Data & Game Service Layer
 * 
 * Provides utility methods to access Pokerogue species data, egg moves,
 * biome routes, starters, passive abilities, and calculation helpers.
 */

export interface PokerogueServiceConfig {
  sourcePath?: string;
}

export class PokerogueService {
  private static instance: PokerogueService;

  private constructor() {
    // Initialization logic for Pokerogue data parser
  }

  public static getInstance(): PokerogueService {
    if (!PokerogueService.instance) {
      PokerogueService.instance = new PokerogueService();
    }
    return PokerogueService.instance;
  }

  /**
   * Health check for Pokerogue data layer
   */
  public isReady(): boolean {
    return true;
  }
}

export const pokerogueService = PokerogueService.getInstance();
