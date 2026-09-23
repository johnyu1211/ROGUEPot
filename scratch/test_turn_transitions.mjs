import { BattleEngine } from "../src/battle/engine/BattleEngine.js";
import { renderBattleMoveGif } from "../src/utils/battleGifRenderer.js";
import { createPlayerBattleMon, spawnWildPokemon } from "../src/battle/entities/pokemonFactory.js";

const testMoves = [
  "egg-bomb", "pound", "sing", "defense-curl",
  "bone-club", "fire-blast", "earthquake", "focus-energy",
  "clamp", "withdraw", "ice-beam", "aurora-beam",
  "smog", "self-destruct", "toxic", "haze",
  "lick", "sludge", "night-shade", "confuse-ray",
  "waterfall", "hydro-pump", "bite", "dragon-rage"
];

async function runTurnTest() {
  console.log("Testing two-action turns across showcase move combinations...");
  let bounceCount = 0;

  for (const pm of ["egg-bomb", "clamp", "defense-curl", "pound"]) {
    for (const em of ["smog", "toxic", "lick", "waterfall", "haze"]) {
      const pMon = {
        speciesId: "chansey", name: "럭키", level: 50, hp: 350, maxHp: 350,
        moves: [pm], movePps: [10]
      };
      const eMon = {
        speciesId: "weezing", name: "또도가스", level: 50, hp: 175, maxHp: 175,
        moves: [em], movePps: [10]
      };
      const battle = {
        userId: "u1", slotId: 1, wave: 1, biome: "Town", gameMode: "classic",
        phase: "MAIN", turnCount: 1, money: 1000, score: 100, playerExp: 0, playerMaxExp: 100,
        playerActiveIndex: 0, dialogueText: "",
        playerParty: [pMon],
        playerBattleMon: createPlayerBattleMon(pMon, [pMon]),
        enemy: spawnWildPokemon(1, "Town", eMon.speciesId, 50)
      };
      battle.enemy.moves = [em];
      battle.enemy.movePps = [10];

      BattleEngine.executeTurn(battle, pm, "ko", true);

      const res = await renderBattleMoveGif({ battle, lang: "ko", includeFramePreviews: true });
      const frames = res.phases || [];

      for (let i = 1; i < frames.length; i++) {
        const prev = frames[i - 1];
        const curr = frames[i];

        // Did Player HP jump UP without a heal?
        if (curr.playerHp > prev.playerHp) {
          console.log(`[BOUNCE DETECTED in ${pm} vs ${em}] Player HP jumped from ${prev.playerHp} to ${curr.playerHp} at frame #${i} (${curr.phaseId})!`);
          bounceCount++;
        }
        // Did Enemy HP jump UP without a heal?
        if (curr.enemyHp > prev.enemyHp) {
          console.log(`[BOUNCE DETECTED in ${pm} vs ${em}] Enemy HP jumped from ${prev.enemyHp} to ${curr.enemyHp} at frame #${i} (${curr.phaseId})!`);
          bounceCount++;
        }
      }
    }
  }

  console.log(`Testing completed. Total bounces found: ${bounceCount}`);
}

runTurnTest();
