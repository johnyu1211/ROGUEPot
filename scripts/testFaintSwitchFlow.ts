import { BattleEngine } from "../src/battle/engine/BattleEngine.js";
import { battleService } from "../src/services/battleService.js";
import { saveService } from "../src/services/saveService.js";
import { buildBattleComponents } from "../src/events/interactionCreate.js";
import { renderBattleEntryGif, renderBattleMoveGif } from "../src/utils/battleGifRenderer.js";
import { createPlayerBattleMon, spawnWildPokemon } from "../src/battle/entities/pokemonFactory.js";
import type { BattleState } from "../src/battle/engine/types.js";

async function runTests() {
  console.log("==================================================");
  console.log("🧪 [TEST] Player Faint & Switch Flow Verification");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${msg}`);
      failed++;
    }
  }

  // 1. Setup test player party:
  // Mon 0: Charmander (HP: 5/100, will faint on hit 1)
  // Mon 1: Squirtle (HP: 100/100, alive backup)
  const charParty: any = {
    speciesId: "charmander",
    name: "Charmander",
    nameKo: "파이리",
    level: 10,
    hp: 5,
    maxHp: 100,
    moves: ["Scratch"],
    types: ["fire"],
  };

  const squirParty: any = {
    speciesId: "squirtle",
    name: "Squirtle",
    nameKo: "꼬부기",
    level: 10,
    hp: 100,
    maxHp: 100,
    moves: ["Tackle", "Water Gun"],
    types: ["water"],
  };

  const pMon = createPlayerBattleMon(charParty, [charParty, squirParty]);
  pMon.hp = 5;
  pMon.speed = 10; // slow speed so enemy acts first

  const wildMon = spawnWildPokemon(30, "Cave");
  wildMon.atk = 500;
  wildMon.speed = 200; // fast speed so enemy acts first
  wildMon.moves = ["Earthquake"];

  const testBattle: BattleState = {
    wave: 1,
    biome: "Town",
    playerParty: [charParty, squirParty],
    playerActiveIndex: 0,
    playerBattleMon: pMon,
    enemy: wildMon,
    phase: "MAIN",
    turnCount: 0,
    turnActions: [],
  };

  // Test 1: Turn execution where player takes lethal damage
  console.log("\n--- Scenario 1: Player mon faints with alive backup in party ---");
  const result = BattleEngine.executeTurn(testBattle, "Scratch", "ko");

  assert(testBattle.phase === "SWITCH", "Battle phase becomes 'SWITCH' when player mon faints with alive backup");
  assert(testBattle.playerBattleMon.hp === 0, "Fainted mon stays in playerBattleMon at HP 0 (not overwritten before render)");
  assert(testBattle.playerBattleMon.nameKo === "파이리", "Fainted mon is indeed Charmander (파이리), preserving correct sprite");
  assert(testBattle.playerParty[0].hp === 0, "Party[0] HP is updated to 0");
  assert(testBattle.playerParty[1].hp > 0, "Party[1] Squirtle is still alive");

  // Check turn actions & faint log
  const enemyAct = result.turnActions.find((a) => a.actor === "enemy");
  assert(Boolean(enemyAct), "Enemy executed an attack action");
  assert(enemyAct?.playerHpAfter === 0, "Enemy action brought player HP to 0");
  assert(Boolean(enemyAct?.log?.includes("쓰러졌다")), `Enemy action log includes knockout message with Korean subject marker: "${enemyAct?.log}"`);

  // Test 2: renderBattleMoveGif with fainted mon
  console.log("\n--- Scenario 2: renderBattleMoveGif with fainted mon ---");
  const moveGif = await renderBattleMoveGif({
    battle: testBattle,
    lang: "ko",
  });
  assert(moveGif.buffer.length > 0, `Faint move GIF generated successfully (${moveGif.buffer.length} bytes)`);
  assert(moveGif.motionDurationMs > 0, `Faint move GIF has motion duration: ${moveGif.motionDurationMs}ms`);

  // Test 3: buildBattleComponents during SWITCH phase
  console.log("\n--- Scenario 3: buildBattleComponents during SWITCH phase ---");
  const components = buildBattleComponents(testBattle, "test_user", 1, true);
  assert(components.length > 0, "Components generated for SWITCH phase");

  const buttons = components.flatMap((r) => r.components);
  const charmanderBtn = buttons.find((b: any) => b.data.custom_id.includes("battle_switch_0_"));
  const squirtleBtn = buttons.find((b: any) => b.data.custom_id.includes("battle_switch_1_"));

  assert(Boolean(charmanderBtn), "Fainted Charmander button exists");
  assert((charmanderBtn as any)?.data.disabled === true, "Fainted Charmander button is disabled");
  assert((charmanderBtn as any)?.data.label.includes("기절"), "Fainted Charmander button shows '기절'");

  assert(Boolean(squirtleBtn), "Alive Squirtle button exists");
  assert((squirtleBtn as any)?.data.disabled !== true, "Alive Squirtle button is enabled");
  assert((squirtleBtn as any)?.data.label.includes("가랏, 꼬부기!"), `Alive Squirtle button shows '가랏, 꼬부기!': "${(squirtleBtn as any)?.data.label}"`);

  // Test 4: Switching to Squirtle via battleService
  console.log("\n--- Scenario 4: Switching to replacement Pokémon ---");
  const testUserId = "test_faint_user_e2e_v2";
  saveService.createNewRunWithParty(testUserId, 1, [
    { ...testBattle.playerParty[0] },
    { ...testBattle.playerParty[1] },
  ]);

  const battleInService = battleService.getOrCreateBattle(testUserId, 1);
  // Force it into the fainted state
  battleInService.playerParty = [{ ...testBattle.playerParty[0] }, { ...testBattle.playerParty[1] }];
  battleInService.playerActiveIndex = 0;
  battleInService.playerBattleMon = { ...testBattle.playerBattleMon };
  battleInService.phase = "SWITCH";

  const prevPlayerCopy = { ...battleInService.playerBattleMon };

  // Execute switch to index 1 (Squirtle)
  battleService.switchPlayerPokemon(testUserId, 1, 1, "ko");
  assert(battleInService.playerActiveIndex === 1, "Active index successfully changed to 1");
  assert(battleInService.playerBattleMon.nameKo === "꼬부기", "Active battler is now Squirtle (꼬부기)");
  assert(battleInService.playerBattleMon.hp === 100, "Squirtle has full HP (100)");
  assert(battleInService.phase === "MAIN", "Battle phase returned to 'MAIN'");
  assert(battleInService.dialogueText.includes("가랏, 꼬부기!"), `Dialogue text says '가랏, 꼬부기!': "${battleInService.dialogueText}"`);

  // Test 5: renderBattleEntryGif for replacement Pokémon
  console.log("\n--- Scenario 5: renderBattleEntryGif for replacement Pokémon ---");
  const entryGif = await renderBattleEntryGif({
    battle: battleInService,
    lang: "ko",
    entryType: "player",
    isSwitch: true,
    prevPlayer: prevPlayerCopy,
  });
  assert(entryGif.buffer.length > 0, `Replacement entry GIF generated successfully (${entryGif.buffer.length} bytes)`);
  assert(entryGif.motionDurationMs > 0, `Replacement entry GIF has motion duration: ${entryGif.motionDurationMs}ms`);

  // Test 6: Next wave advance when Party[0] is dead
  console.log("\n--- Scenario 6: advanceToNextWave with Party[0] dead ---");
  // Set slot wave 5 and party in SQLite
  saveService.updateSlot(testUserId, 1, {
    wave: 5,
    party: [
      { ...testBattle.playerParty[0], hp: 0 },
      { ...testBattle.playerParty[1], hp: 100 },
    ],
  });

  battleInService.wave = 5;
  battleInService.phase = "VICTORY";
  battleInService.playerParty[0].hp = 0;
  battleInService.playerParty[1].hp = 100;
  battleInService.playerActiveIndex = 1;
  battleInService.playerBattleMon.hp = 100;

  battleService.advanceToNextWave(testUserId, 1);

  const nextWaveBattle = battleService.getOrCreateBattle(testUserId, 1);
  assert(nextWaveBattle.wave === 6, `Wave advanced to 6 (current: ${nextWaveBattle.wave})`);
  assert(nextWaveBattle.playerActiveIndex === 1, `Active index remains 1 (current: ${nextWaveBattle.playerActiveIndex})`);
  assert(nextWaveBattle.playerBattleMon.hp > 0, `Active battler has HP > 0 (current: ${nextWaveBattle.playerBattleMon.hp})`);
  assert(nextWaveBattle.playerBattleMon.nameKo === "꼬부기", `Active battler is alive Squirtle (current: ${nextWaveBattle.playerBattleMon.nameKo})`);

  console.log("\n==================================================");
  console.log(`📊 결과: 통과 ${passed}개 / 실패 ${failed}개`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
