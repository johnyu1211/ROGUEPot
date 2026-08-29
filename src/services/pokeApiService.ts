export interface DexPokemonInfo {
  dexNumber: number;
  speciesId: string;
  name: string;
  koreanName?: string;
  types: string[];
  hp: number;
}

const dexCache = new Map<number, DexPokemonInfo>();

/**
 * Fetches Pokémon data by National Pokédex number (1 ~ 1025) using native fetch
 */
export async function getPokemonByDexNumber(dexNo: number): Promise<DexPokemonInfo | null> {
  if (dexNo < 1 || dexNo > 1025) return null;
  if (dexCache.has(dexNo)) return dexCache.get(dexNo)!;

  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${dexNo}`);
    if (!res.ok) return null;

    const data: any = await res.json();
    const speciesId = data.name.toLowerCase();
    const formattedName = data.name.charAt(0).toUpperCase() + data.name.slice(1);
    const types = data.types.map((t: any) => t.type.name);
    const hp = data.stats.find((s: any) => s.stat.name === "hp")?.base_stat || 50;

    const info: DexPokemonInfo = {
      dexNumber: dexNo,
      speciesId,
      name: formattedName,
      types,
      hp,
    };

    dexCache.set(dexNo, info);
    return info;
  } catch (error) {
    console.error(`[POKEAPI] Failed to fetch Pokemon for Dex #${dexNo}:`, error);
    return null;
  }
}
