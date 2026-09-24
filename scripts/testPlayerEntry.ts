import { BattleEngine } from "../src/battle/engine/BattleEngine.js";
import { BattleState } from "../src/battle/engine/types.js";
import { createPlayerBattleMon, spawnWildPokemon } from "../src/battle/entities/pokemonFactory.js";
import { renderBattleEntryGif, renderBattleMoveGif } from "../src/utils/battleGifRenderer.js";
import { PartyPokemon } from "../src/services/saveService.js";

async function testPlayerEntryAfterFaint() {
  const playerParty: PartyPokemon[] = [
    {
      speciesId: "charmander",
      name: "파이리",
      level: 10,
      hp: 0, // Fainted!
      maxHp: 30,
      moves: ["scratch"],
      movePps: [35],
    },
    {
      speciesId: "squirtle",
      name: "꼬부기",
      level: 10,
      hp: 35,
      maxHp: 35,
      moves: ["tackle"],
      movePps: [35],
    },
  ];

  const enemyMon = spawnWildPokemon(1, "Town", "geodude", 10);
  enemyMon.hp = 30;

  // Next active mon is Squirtle
  const playerBattleMon = createPlayerBattleMon(playerParty[1], playerParty);

  const prevPlayerMon = createPlayerBattleMon(playerParty[0], playerParty);
  prevPlayerMon.hp = 0; // The fainted mon!

  const battle: BattleState = {
    userId: "test_user",
    slotId: 1,
    wave: 1,
    biome: "Town",
    gameMode: "Classic",
    phase: "MAIN",
    turnCount: 2,
    money: 1000,
    score: 100,
    playerExp: 0,
    playerMaxExp: 150,
    playerActiveIndex: 1, // Squirtle
    dialogueText: "가랏, 꼬부기!",
    playerParty,
    playerBattleMon,
    enemy: enemyMon,
  };

  console.log("Testing renderBattleEntryGif for player entry after faint...");
  try {
    const res = await renderBattleEntryGif({
      battle,
      lang: "ko",
      entryType: "player",
      isSwitch: true,
      prevPlayer: prevPlayerMon,
    });
    console.log("renderBattleEntryGif SUCCESS! Buffer length:", res.buffer.length, "motionDurationMs:", res.motionDurationMs);
  } catch (err) {
    console.error("renderBattleEntryGif FAILED:", err);
  }
}

testPlayerEntryAfterFaint();
