import { battlePreloadService } from "../src/services/battlePreloadService.js";
import { battleService } from "../src/services/battleService.js";
import { BattleState, createDefaultStages } from "../src/battle/engine/types.js";

async function runTests() {
  console.log("=== 🧪 STARTING PRELOAD SERVICE VERIFICATION ===");

  // Test 1: Predict Best Move (Water vs Fire)
  const mockBattleWaterVsFire: BattleState = {
    userId: "test_user",
    slotId: 1,
    wave: 1,
    biome: "Town",
    gameMode: "Classic",
    dialogueText: "",
    phase: "FIGHT",
    turnCount: 0,
    money: 100,
    score: 0,
    playerExp: 0,
    playerMaxExp: 100,
    playerActiveIndex: 0,
    playerParty: [],
    playerBattleMon: {
      speciesId: "squirtle",
      name: "꼬부기",
      nameKo: "꼬부기",
      level: 10,
      hp: 35,
      maxHp: 35,
      atk: 25,
      def: 30,
      spAtk: 25,
      spDef: 30,
      speed: 20,
      types: ["water"],
      moves: ["Tackle", "Water Gun"],
      movePps: [35, 25],
      stages: createDefaultStages(),
    },
    enemy: {
      speciesId: "charmander",
      name: "파이리",
      nameKo: "파이리",
      level: 10,
      hp: 30,
      maxHp: 30,
      atk: 25,
      def: 20,
      spAtk: 28,
      spDef: 25,
      speed: 25,
      types: ["fire"],
      moves: ["Scratch", "Ember"],
      stages: createDefaultStages(),
    },
  };

  const prediction1 = battlePreloadService.predictBestMove(mockBattleWaterVsFire);
  console.log(`[Test 1] Water vs Fire prediction:`, prediction1);
  if (prediction1.moveKey !== "water-gun") {
    throw new Error(`Expected water-gun, got ${prediction1.moveKey}`);
  }
  console.log("✅ Test 1 Passed: Correctly picked super-effective move (Water Gun)!");

  // Test 2: Predict Best Move with 0 PP on best move
  mockBattleWaterVsFire.playerBattleMon.movePps = [35, 0]; // Water Gun PP = 0
  const prediction2 = battlePreloadService.predictBestMove(mockBattleWaterVsFire);
  console.log(`[Test 2] When Water Gun has 0 PP, prediction:`, prediction2);
  if (prediction2.moveKey !== "tackle") {
    throw new Error(`Expected tackle when water gun has 0 PP, got ${prediction2.moveKey}`);
  }
  console.log("✅ Test 2 Passed: Skipped 0 PP move and chose Tackle!");

  // Test 3: Predict Best Switch
  const mockBattleSwitch: BattleState = {
    ...mockBattleWaterVsFire,
    playerParty: [
      {
        speciesId: "bulbasaur", // Grass (weak to Fire)
        name: "이상해씨",
        level: 10,
        hp: 30,
        maxHp: 30,
      },
      {
        speciesId: "squirtle", // Water (resists Fire)
        name: "꼬부기",
        level: 10,
        hp: 35,
        maxHp: 35,
      },
      {
        speciesId: "caterpie", // Bug (weak to Fire)
        name: "캐터피",
        level: 8,
        hp: 20,
        maxHp: 20,
      },
    ],
    playerActiveIndex: 0, // currently Bulbasaur
  };

  const switchPrediction = battlePreloadService.predictBestSwitch(mockBattleSwitch);
  console.log(`[Test 3] Facing Fire enemy, best switch prediction:`, switchPrediction);
  if (!switchPrediction || switchPrediction.targetIndex !== 1) {
    throw new Error(`Expected switch to index 1 (Squirtle), got ${switchPrediction?.targetIndex}`);
  }
  console.log("✅ Test 3 Passed: Correctly chose Water type (Squirtle) as best switch against Fire enemy!");

  // Test 4: Speculative Next Wave Generation
  const speculativeNext = battleService.createSpeculativeNextWaveBattle(
    "test_user",
    1,
    mockBattleWaterVsFire,
    "ko"
  );
  console.log(`[Test 4] Speculative Next Wave:`, {
    nextWave: speculativeNext.nextWave,
    nextBiome: speculativeNext.nextBiome,
    enemyName: speculativeNext.nextBattle.enemy.nameKo,
    enemyLevel: speculativeNext.nextBattle.enemy.level,
  });
  if (speculativeNext.nextWave !== 2) {
    throw new Error(`Expected next wave 2, got ${speculativeNext.nextWave}`);
  }
  console.log("✅ Test 4 Passed: Speculative Next Wave generated cleanly!");

  // Test 5: Cache hit and miss flow
  battlePreloadService.invalidate("user_test", 1);
  const cacheMiss = battlePreloadService.consumeMovePreload("user_test", 1, "tackle", 0);
  if (cacheMiss !== null) {
    throw new Error("Expected null on empty cache");
  }
  console.log("✅ Test 5 Passed: Empty cache returns null!");

  console.log("\n🎉 ALL UNIT TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("❌ TEST FAILED:", err);
  process.exit(1);
});
