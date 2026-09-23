import { PartyPokemon } from "../../services/saveService.js";
import { BattlePokemon, createDefaultStages } from "../engine/types.js";
import { STARTER_DATABASE } from "../../data/starterCosts.js";
import { POKEMON_SPECIES_DATA, SpeciesBaseData } from "../../data/pokemonStats.js";
import { POKEMON_NAMES_KO } from "../../data/pokemonNamesKo.js";
import { MOVES_DATA } from "../../data/movesKo.js";

export const BIOME_ENCOUNTERS: Record<string, string[]> = {
  "Town": ["pidgey", "rattata", "zigzagoon", "sentret", "eevee", "meowth", "fletchling", "rookidee", "skwovet", "wooloo"],
  "Plains": ["scyther", "shinx", "mareep", "taillow", "starly", "lechonk", "growlithe", "ponyta", "blitzle", "electrike"],
  "Grass": ["oddish", "bellsprout", "budew", "cherubi", "caterpie", "weedle", "wurmple", "hoothoot", "bounsweet", "smoliv"],
  "Forest": ["spinarak", "ledyba", "pineco", "nincada", "sewaddle", "venipede", "phantump", "pumpkaboo", "foongus", "morelull"],
  "Cave": ["zubat", "geodude", "diglett", "machop", "roggenrola", "drilbur", "noibat", "gligar", "onix", "carbink"],
  "Sea": ["magikarp", "tentacool", "poliwag", "psyduck", "marill", "buizel", "wingull", "horsea", "finizen", "chewtle"],
  "Metropolis": ["magnemite", "voltorb", "porygon", "klink", "elekid", "grimer", "trubbish", "rotom", "charjabug", "varoom"],
  "Dojo": ["mankey", "tyrogue", "makuhita", "meditite", "riolu", "timburr", "pancham", "crabrawler", "clobbopus", "heracross"],
  "Volcano": ["slugma", "numel", "torkoal", "magby", "darumaka", "litwick", "salandit", "charcadet", "houndour", "sizzlipede"],
};

export const BOSS_ENCOUNTERS: Record<number, string[]> = {
  10: ["corviknight", "pidgeot", "raticate", "linoone", "ursaring"],
  20: ["gyarados", "arcanine", "gengar", "machamp", "alakazam"],
  30: ["dragonite", "salamence", "garchomp", "tyranitar", "hydreigon"],
  50: ["zapdos", "articuno", "moltres", "raikou", "entei", "suicune"],
  100: ["rayquaza", "mewtwo", "kyogre", "groudon"],
  200: ["eternatus"],
};

export function getSpeciesData(speciesId: string): SpeciesBaseData {
  const cleanId = speciesId.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const found = POKEMON_SPECIES_DATA[cleanId] || POKEMON_SPECIES_DATA[cleanId.replace(/-/g, "")];
  if (found) return found;

  const starter = STARTER_DATABASE.find((s) => s.speciesId === speciesId);
  if (starter) {
    return {
      num: starter.dexNumber,
      name: starter.name,
      types: starter.types.map((t) => t.charAt(0).toUpperCase() + t.slice(1)),
      baseStats: { hp: 50, atk: 60, def: 55, spa: 60, spd: 55, spe: 55 },
      abilities: { "0": starter.ability, "H": starter.hiddenAbility || "" },
    };
  }

  return {
    num: 1,
    name: speciesId.charAt(0).toUpperCase() + speciesId.slice(1),
    types: ["Normal"],
    baseStats: { hp: 50, atk: 50, def: 50, spa: 50, spd: 50, spe: 50 },
    abilities: { "0": "Run Away" },
  };
}

export function calculateStats(speciesId: string, level: number, isBoss: boolean = false) {
  const data = getSpeciesData(speciesId);
  const { hp: bHp, atk: bAtk, def: bDef, spa: bSpa, spd: bSpd, spe: bSpe } = data.baseStats;

  const iv = 31;
  const hpMult = isBoss ? 2.0 : 1.0;

  const maxHp = Math.floor((Math.floor(((2 * bHp + iv) * level) / 100) + level + 10) * hpMult);
  const atk = Math.floor(((2 * bAtk + iv) * level) / 100) + 5;
  const def = Math.floor(((2 * bDef + iv) * level) / 100) + 5;
  const spAtk = Math.floor(((2 * bSpa + iv) * level) / 100) + 5;
  const spDef = Math.floor(((2 * bSpd + iv) * level) / 100) + 5;
  const speed = Math.floor(((2 * bSpe + iv) * level) / 100) + 5;

  const types = data.types.map((t) => t.toLowerCase());

  return { maxHp, atk, def, spAtk, spDef, speed, types };
}

export function spawnWildPokemon(
  wave: number,
  biome: string,
  forcedSpecies?: string,
  forcedLevel?: number,
  forcedAbility?: string
): BattlePokemon {
  const isBoss = forcedSpecies?.includes("gmax") || forcedSpecies?.includes("mega") || (wave % 10 === 0 && !forcedSpecies);
  const pool = isBoss ? (BOSS_ENCOUNTERS[wave] || BOSS_ENCOUNTERS[10]) : (BIOME_ENCOUNTERS[biome] || BIOME_ENCOUNTERS["Town"]);
  const speciesId = forcedSpecies || pool[Math.floor(Math.random() * pool.length)] || "pidgey";

  const sData = getSpeciesData(speciesId);
  const starter = STARTER_DATABASE.find((s) => s.speciesId === speciesId);
  let nameKo = POKEMON_NAMES_KO[sData.num] || starter?.nameKo || sData.name;
  let name = sData.name;

  if (speciesId === "inteleon-gmax" || speciesId === "inteleongmax" || speciesId === "inteleon-mega") {
    nameKo = "인텔리온 (거다이맥스)";
    name = "Inteleon [G-Max]";
  } else if (speciesId.startsWith("testsubject") || speciesId.toLowerCase() === "test12") {
    nameKo = "TEST12";
    name = "TEST12";
  }

  const level = forcedLevel !== undefined
    ? forcedLevel
    : Math.max(2, Math.floor(wave * 1.2) + Math.floor(Math.random() * 2));
  const isShiny = Math.random() < 0.05;

  const stats = calculateStats(speciesId, level, isBoss);

  let moves = starter?.starterMoves && starter.starterMoves.length > 0
    ? starter.starterMoves.slice(0, 4)
    : ["Tackle", "Growl", "Quick Attack", "Scratch"];

  if (speciesId.includes("inteleon")) {
    moves = ["Snipe Shot", "Hydro Pump", "Ice Beam", "Dark Pulse"];
  }

  return {
    speciesId,
    name,
    nameKo,
    level,
    hp: stats.maxHp,
    maxHp: stats.maxHp,
    atk: stats.atk,
    def: stats.def,
    spAtk: stats.spAtk,
    spDef: stats.spDef,
    speed: stats.speed,
    types: stats.types.length > 0 ? stats.types : ["normal"],
    moves,
    movePps: moves.map((m) => {
      const mInfo = MOVES_DATA[m.toLowerCase().replace(/[\s_]+/g, "-")];
      return mInfo?.pp || 20;
    }),
    ability: forcedAbility || sData.abilities["0"] || "Limber",
    stages: createDefaultStages(),
    isShiny,
    isBoss,
    bossShields: isBoss ? 2 : undefined,
    bossMaxShields: isBoss ? 2 : undefined,
  };
}

export function createPlayerBattleMon(partyMon: PartyPokemon, fullParty: PartyPokemon[]): BattlePokemon {
  const speciesId = partyMon.speciesId;
  const sData = getSpeciesData(speciesId);
  const starter = STARTER_DATABASE.find((s) => s.speciesId === speciesId);
  const nameKo = POKEMON_NAMES_KO[sData.num] || starter?.nameKo || partyMon.name.replace(/^✨\s*/, "") || sData.name;
  const name = sData.name;

  const stats = calculateStats(speciesId, partyMon.level);
  const moves = partyMon.moves && partyMon.moves.length > 0
    ? partyMon.moves.filter((m) => m && m !== "---")
    : (starter?.starterMoves || ["Tackle", "Growl"]);

  const ability = partyMon.useHiddenAbility ? (starter?.hiddenAbility || sData.abilities["H"]) : (starter?.ability || sData.abilities["0"]);
  const passiveAbility = partyMon.usePassive ? (starter?.passiveAbility || "Run Away") : undefined;

  let movePps = partyMon.movePps;
  if (!movePps || movePps.length !== moves.length) {
    movePps = moves.map((m) => {
      const mInfo = MOVES_DATA[m.toLowerCase().replace(/[\s_]+/g, "-")];
      return mInfo?.pp || 20;
    });
    partyMon.movePps = [...movePps];
  }

  let hasIllusion = false;
  let illusionTarget = null;
  if (ability?.toLowerCase() === "illusion" || passiveAbility?.toLowerCase() === "illusion") {
    const validTargets = fullParty.filter((p) => p !== partyMon && p.hp > 0);
    if (validTargets.length > 0) {
      const lastMon = validTargets[validTargets.length - 1];
      const targetSpecies = getSpeciesData(lastMon.speciesId);
      const targetStarter = STARTER_DATABASE.find((s) => s.speciesId === lastMon.speciesId);
      hasIllusion = true;
      illusionTarget = {
        speciesId: lastMon.speciesId,
        name: targetSpecies.name,
        nameKo: POKEMON_NAMES_KO[targetSpecies.num] || targetStarter?.nameKo || targetSpecies.name,
        isShiny: lastMon.isShiny,
      };
    }
  }

  const maxHp = (partyMon.maxHp && partyMon.maxHp > stats.maxHp) ? partyMon.maxHp : stats.maxHp;
  const isFullHp = partyMon.hp === undefined || (partyMon.maxHp !== undefined && partyMon.hp >= partyMon.maxHp);
  const hp = isFullHp ? maxHp : Math.min(partyMon.hp, maxHp);

  return {
    speciesId,
    name,
    nameKo,
    level: partyMon.level,
    hp,
    maxHp,
    atk: stats.atk,
    def: stats.def,
    spAtk: stats.spAtk,
    spDef: stats.spDef,
    speed: stats.speed,
    types: stats.types.length > 0 ? stats.types : ["normal"],
    moves,
    movePps: [...movePps],
    ability,
    passiveAbility,
    stages: createDefaultStages(),
    isShiny: partyMon.isShiny,
    hasIllusion,
    illusionTarget,
  };
}

export const BASE_SPECIES_MAP: Record<string, string> = {
  // Gen 1
  "ivysaur": "bulbasaur", "venusaur": "bulbasaur", "venusaur-mega": "bulbasaur", "venusaur-gmax": "bulbasaur",
  "charmeleon": "charmander", "charizard": "charmander", "charizard-megax": "charmander", "charizard-megay": "charmander", "charizard-gmax": "charmander",
  "wartortle": "squirtle", "blastoise": "squirtle", "blastoise-mega": "squirtle", "blastoise-gmax": "squirtle",
  "caterpie": "caterpie", "metapod": "caterpie", "butterfree": "caterpie",
  "weedle": "weedle", "kakuna": "weedle", "beedrill": "weedle",
  "pidgeotto": "pidgey", "pidgeot": "pidgey", "pidgeot-mega": "pidgey",
  "raticate": "rattata", "raticate-alola": "rattata",
  "raichu": "pichu", "raichu-alola": "pichu", "pikachu": "pichu",
  "arbok": "ekans",
  "sandslash": "sandshrew", "sandslash-alola": "sandshrew",
  "nidorina": "nidoranf", "nidoqueen": "nidoranf",
  "nidorino": "nidoranm", "nidoking": "nidoranm",
  "clefable": "cleffa", "clefairy": "cleffa",
  "ninetales": "vulpix", "ninetales-alola": "vulpix",
  "wigglytuff": "igglybuff", "jigglypuff": "igglybuff",
  "golbat": "zubat", "crobat": "zubat",
  "gloom": "oddish", "vileplume": "oddish", "bellossom": "oddish",
  "parasect": "paras", "venomoth": "venonat",
  "dugtrio": "diglett", "dugtrio-alola": "diglett",
  "persian": "meowth", "persian-alola": "meowth", "perrserker": "meowth",
  "golduck": "psyduck", "primeape": "mankey", "annihilape": "mankey",
  "arcanine": "growlithe", "arcanine-hisui": "growlithe",
  "poliwhirl": "poliwag", "poliwrath": "poliwag", "politoed": "poliwag",
  "kadabra": "abra", "alakazam": "abra", "alakazam-mega": "abra",
  "machoke": "machop", "machamp": "machop",
  "weepinbell": "bellsprout", "victreebel": "bellsprout",
  "tentacruel": "tentacool",
  "graveler": "geodude", "golem": "geodude", "graveler-alola": "geodude", "golem-alola": "geodude",
  "rapidash": "ponyta", "rapidash-galar": "ponyta",
  "slowbro": "slowpoke", "slowking": "slowpoke",
  "magneton": "magnemite", "magnezone": "magnemite",
  "dodrio": "doduo", "dewgong": "seel", "muk": "grimer", "muk-alola": "grimer",
  "cloyster": "shellder", "haunter": "gastly", "gengar": "gastly", "gengar-mega": "gastly",
  "steelix": "onix", "hypno": "drowzee", "kingler": "krabby", "electrode": "voltorb",
  "exeggutor": "exeggcute", "marowak": "cubone", "marowak-alola": "cubone",
  "hitmonlee": "tyrogue", "hitmonchan": "tyrogue", "hitmontop": "tyrogue",
  "weezing": "koffing", "weezing-galar": "koffing", "rhydon": "rhyhorn", "rhyperior": "rhyhorn",
  "blissey": "happiny", "chansey": "happiny", "tangrowth": "tangela", "kingdra": "horsea", "seadra": "horsea",
  "seaking": "goldeen", "starmie": "staryu", "mr-mime": "mime-jr", "mr-rime": "mime-jr", "scizor": "scyther", "kleavor": "scyther",
  "jynx": "smoochum", "electabuzz": "elekid", "electivire": "elekid", "magmar": "magby", "magmortar": "magby",
  "gyarados": "magikarp", "vaporeon": "eevee", "jolteon": "eevee", "flareon": "eevee", "espeon": "eevee", "umbreon": "eevee", "leafeon": "eevee", "glaceon": "eevee", "sylveon": "eevee",
  "porygon2": "porygon", "porygon-z": "porygon", "omastar": "omanyte", "kabutops": "kabuto",
  "dragonair": "dratini", "dragonite": "dratini",

  // Gen 2
  "bayleef": "chikorita", "meganium": "chikorita",
  "quilava": "cyndaquil", "typhlosion": "cyndaquil", "typhlosion-hisui": "cyndaquil",
  "croconaw": "totodile", "feraligatr": "totodile",
  "furret": "sentret", "noctowl": "hoothoot", "ledian": "ledyba", "ariados": "spinarak",
  "lanturn": "chinchou", "togetic": "togepi", "togekiss": "togepi", "xatu": "natu",
  "ampharos": "mareep", "flaaffy": "mareep", "azumarill": "azurill", "marill": "azurill",
  "sudowoodo": "bonsly", "jumpluff": "hoppip", "skiploom": "hoppip",
  "sunflora": "sunkern", "quagsire": "wooper", "clodsire": "wooper",
  "wobbuffet": "wynaut", "forretress": "pineco", "ursaring": "teddiursa", "ursaluna": "teddiursa",
  "magcargo": "slugma", "piloswine": "swinub", "mamoswine": "swinub",
  "octillery": "remoraid", "houndoom": "houndour", "donphan": "phanpy",
  "pupitar": "larvitar", "tyranitar": "larvitar",

  // Gen 3
  "grovyle": "treecko", "sceptile": "treecko",
  "combusken": "torchic", "blaziken": "torchic",
  "marshtomp": "mudkip", "swampert": "mudkip",
  "mightyena": "poochyena", "linoone": "zigzagoon", "obstagoon": "zigzagoon",
  "beautifly": "wurmple", "dustox": "wurmple", "ludicolo": "lotad", "lombre": "lotad",
  "shiftry": "seedot", "nuzleaf": "seedot", "swellow": "taillow", "pelipper": "wingull",
  "gardevoir": "ralts", "gallade": "ralts", "kirlia": "ralts",
  "masquerain": "surskit", "breloom": "shroomish", "ninjask": "nincada", "shedinja": "nincada",
  "exploud": "whismur", "loudred": "whismur", "hariyama": "makuhita",
  "delcatty": "skitty", "manectric": "electrike",
  "swalot": "gulpin", "sharpedo": "carvanha", "wailord": "wailmer", "camerupt": "numel",
  "grumpig": "spoink", "flygon": "trapinch", "vibrava": "trapinch", "cacturne": "cacnea",
  "altaria": "swablu", "crawdaunt": "corphish", "claydol": "baltoy", "cradily": "lileep",
  "armaldo": "anorith", "milotic": "feebas", "banette": "shuppet", "dusclops": "duskull", "dusknoir": "duskull",
  "chimecho": "chingling", "walrein": "spheal", "sealeo": "spheal", "huntail": "clamperl", "gorebyss": "clamperl",
  "shelgon": "bagon", "salamence": "bagon", "metang": "beldum", "metagross": "beldum",

  // Gen 4
  "grotle": "turtwig", "torterra": "turtwig",
  "monferno": "chimchar", "infernape": "chimchar",
  "prinplup": "piplup", "empoleon": "piplup",
  "staravia": "starly", "staraptor": "starly",
  "bibarel": "bidoof", "kricketune": "kricketot",
  "luxio": "shinx", "luxray": "shinx", "roserade": "budew", "roselia": "budew",
  "rampardos": "cranidos", "bastiodon": "shieldon", "wormadam": "burmy", "mothim": "burmy",
  "vespiquen": "combee", "floatzel": "buizel", "cherrim": "cherubi", "gastrodon": "shellos",
  "drifblim": "drifloon", "lopunny": "buneary", "mismagius": "misdreavus", "honchkrow": "murkrow",
  "purugly": "glameow", "skuntank": "stunky", "bronzong": "bronzor", "lucario": "riolu",
  "hippowdon": "hippopotas", "drapion": "skorupi", "toxicroak": "croagunk", "abomasnow": "snover",
  "weavile": "sneasel", "sneasler": "sneasel", "gliscor": "gligar",
  "gabite": "gible", "garchomp": "gible",

  // Gen 5
  "servine": "snivy", "serperior": "snivy",
  "pignite": "tepig", "emboar": "tepig",
  "dewott": "oshawott", "samurott": "oshawott", "samurott-hisui": "oshawott",
  "watchog": "patrat", "stoutland": "herdier", "herdier": "lillipup",
  "liepard": "purrloin", "simisage": "pansage", "simisear": "pansear", "simipour": "panpour",
  "musharna": "munna", "unfezant": "pidove", "tranquill": "pidove", "zebstrika": "blitzle",
  "gigalith": "roggenrola", "boldore": "roggenrola", "swoobat": "woobat",
  "sirfetchd": "farfetchd", "alcremie": "milcery",
  "frosmoth": "snom", "copperajah": "cufant", "dragapult": "dreepy", "drakloak": "dreepy", "urshifu": "kubfu",

  // Gen 9
  "floragato": "sprigatito", "meowscarada": "sprigatito",
  "crocalor": "fuecoco", "skeledirge": "fuecoco",
  "quaxwell": "quaxly", "quaquaval": "quaxly",
  "oinkologne": "lechonk", "spidops": "tarountula", "lokix": "nymble", "pawmo": "pawmi", "pawmot": "pawmi",
  "maushold": "tandemaus", "dachsbun": "fidough", "arboliva": "smoliv", "dolliv": "smoliv",
  "garganacl": "nacli", "naclstack": "nacli", "armarouge": "charcadet", "ceruledge": "charcadet",
  "bellibolt": "tadbulb", "kilowattrel": "wattrel", "mabosstiff": "maschiff", "grafaiai": "shroodle",
  "brambleghast": "bramblin", "toedscruel": "toedscool", "scovillain": "capsakid", "rabsca": "rellor",
  "espathra": "flittle", "tinkaton": "tinkatink", "tinkatuff": "tinkatink", "wugtrio": "wiglett",
  "palafin": "finizen", "revavroom": "varoom", "glimmora": "glimmet", "houndstone": "greavard",
  "cetitan": "cetoddle", "farigiraf": "girafarig",
  "dudunsparce": "dunsparce", "baxcalibur": "frigibax", "arctibax": "frigibax",
  "archaludon": "duraludon",
};
