import { BattleEngine } from "../src/battle/engine/BattleEngine.js";
import { BattleState, createDefaultStages } from "../src/battle/engine/types.js";
import { createPlayerBattleMon, spawnWildPokemon } from "../src/battle/entities/pokemonFactory.js";
import { renderBattleMoveGif } from "../src/utils/battleGifRenderer.js";

async function test() {
  console.log("Testing BattleEngine.executeTurn for 3v3 showcase...");

  const playerPartyMon = {
    speciesId: "cloyster",
    level: 50,
    hp: 160,
    maxHp: 160,
    moves: ["clamp", "waterfall", "withdraw", "ice-beam"],
    movePps: [15, 15, 40, 10],
  };

  const playerBattleMon = createPlayerBattleMon(playerPartyMon as any, [playerPartyMon] as any);
  const enemyMon = spawnWildPokemon(1, "Town", "weezing", 50);
  enemyMon.moves = ["sludge", "smog", "self-destruct", "toxic"];
  enemyMon.movePps = [20, 20, 5, 10];

  const battle: BattleState = {
    userId: "test_user",
    slotId: 1,
    wave: 1,
    biome: "Town",
    gameMode: "classic",
    phase: "MAIN",
    turnCount: 1,
    money: 1000,
    score: 100,
    playerExp: 0,
    playerMaxExp: 100,
    playerActiveIndex: 0,
    playerParty: [playerPartyMon as any],
    playerBattleMon,
    enemy: enemyMon,
  };

  console.log(`P: ${playerBattleMon.nameKo} (Speed: ${playerBattleMon.speed}) vs E: ${enemyMon.nameKo} (Speed: ${enemyMon.speed})`);

  const updatedBattle = BattleEngine.executeTurn(battle, "clamp", "ko", true);

  console.log("TurnActions count:", updatedBattle.turnActions?.length);
  for (const act of (updatedBattle.turnActions || [])) {
    console.log(`[${act.actor}] Move: ${act.moveKey}, Dmg: ${act.damage}, Log: ${act.log}`);
  }

  const { buffer } = await renderBattleMoveGif({
    battle: updatedBattle,
    lang: "ko",
  });
  console.log("Rendered GIF Buffer size:", buffer.length);
}

test().catch(console.error);
