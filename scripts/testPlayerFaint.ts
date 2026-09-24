import { BattleEngine } from "../src/battle/engine/BattleEngine.js";
import { BattleState } from "../src/battle/engine/types.js";
import { createPlayerBattleMon, spawnWildPokemon } from "../src/battle/entities/pokemonFactory.js";
import { renderBattleMoveGif } from "../src/utils/battleGifRenderer.js";
import { PartyPokemon } from "../src/services/saveService.js";

async function testPlayerFaint() {
  const playerParty: PartyPokemon[] = [
    {
      speciesId: "charmander",
      name: "파이리",
      level: 10,
      hp: 1, // Will faint
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
  enemyMon.moves = ["rock-throw"];
  enemyMon.movePps = [15];

  const playerBattleMon = createPlayerBattleMon(playerParty[0], playerParty);

  const battle: BattleState = {
    userId: "test_user",
    slotId: 1,
    wave: 1,
    biome: "Town",
    gameMode: "Classic",
    phase: "MAIN",
    turnCount: 1,
    money: 1000,
    score: 100,
    playerExp: 0,
    playerMaxExp: 150,
    playerActiveIndex: 0,
    dialogueText: "",
    playerParty,
    playerBattleMon,
    enemy: enemyMon,
  };

  console.log("Initial active mon:", battle.playerBattleMon.name, "HP:", battle.playerBattleMon.hp);
  console.log("Party:", battle.playerParty.map(p => `${p.name} (HP: ${p.hp})`));

  // Execute turn where player uses scratch, enemy uses rock-throw and kills charmander
  BattleEngine.executeTurn(battle, "scratch", "ko", true);

  console.log("\nAfter executeTurn:");
  console.log("Battle phase:", battle.phase);
  console.log("Active index:", battle.playerActiveIndex);
  console.log("Active mon:", battle.playerBattleMon.name, "HP:", battle.playerBattleMon.hp);
  console.log("Party:", battle.playerParty.map(p => `${p.name} (HP: ${p.hp})`));
  console.log("Dialogue:\n", battle.dialogueText);
  console.log("Turn actions:", battle.turnActions?.map(a => ({
    actor: a.actor,
    move: a.moveName,
    dmg: a.damage,
    pHpBefore: a.playerHpBefore,
    pHpAfter: a.playerHpAfter,
    eHpBefore: a.enemyHpBefore,
    eHpAfter: a.enemyHpAfter,
  })));

  console.log("\nAttempting renderBattleMoveGif...");
  try {
    const res = await renderBattleMoveGif({ battle, lang: "ko" });
    console.log("renderBattleMoveGif SUCCESS! Buffer length:", res.buffer.length, "motionDurationMs:", res.motionDurationMs);
  } catch (err) {
    console.error("renderBattleMoveGif FAILED with error:", err);
  }
}

testPlayerFaint();
