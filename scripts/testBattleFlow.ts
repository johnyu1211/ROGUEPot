import { battleService } from "../src/services/battleService.js";
import { saveService } from "../src/services/saveService.js";
import { renderBattleMessageData, buildBattleComponents } from "../src/events/interactionCreate.js";

async function testFullBattleFlow() {
  const userId = "test_user_flow";
  const slotId = 1;

  // Setup user profile and slot
  saveService.getProfile(userId);
  saveService.startNewRun(userId, slotId, "charmander");
  saveService.updateSlot(userId, slotId, {
    wave: 1,
    biome: "Town",
    party: [
      {
        speciesId: "charmander",
        name: "파이리",
        level: 5,
        hp: 1, // Will faint on next hit
        maxHp: 20,
        moves: ["scratch"],
        movePps: [35],
      },
      {
        speciesId: "squirtle",
        name: "꼬부기",
        level: 5,
        hp: 22,
        maxHp: 22,
        moves: ["tackle"],
        movePps: [35],
      },
    ],
  });

  const battle = battleService.getOrCreateBattle(userId, slotId);
  battle.enemy.hp = 50;
  battle.enemy.moves = ["rock-throw"];
  battle.enemy.movePps = [15];

  console.log("--- 1. Initial State ---");
  console.log("Active Mon:", battle.playerBattleMon.name, "HP:", battle.playerBattleMon.hp);
  console.log("Party:", battle.playerParty.map((p) => `${p.name} (HP: ${p.hp})`));

  console.log("\n--- 2. Executing Player Move (will cause Charmander to faint) ---");
  battleService.executePlayerMove(userId, slotId, "scratch", "ko");

  const postTurnBattle = battleService.getOrCreateBattle(userId, slotId);
  console.log("Post Turn Battle Phase:", postTurnBattle.phase);
  console.log("Active Index:", postTurnBattle.playerActiveIndex);
  console.log("Active Mon:", postTurnBattle.playerBattleMon.name, "HP:", postTurnBattle.playerBattleMon.hp);
  console.log("Dialogue:\n" + postTurnBattle.dialogueText);

  console.log("\n--- 3. Rendering Battle Message Data (Turn GIF) ---");
  try {
    const battleData = await renderBattleMessageData(userId, slotId);
    console.log("Rendered successfully! files:", battleData.files?.length, "motionDurationMs:", battleData.motionDurationMs);
    const comps = battleData.components.map(r => r.components.map((c: any) => c.data.label || c.data.custom_id));
    console.log("Components:", comps);
  } catch (err) {
    console.error("renderBattleMessageData failed:", err);
  }

  console.log("\n--- 4. Next Action: Player clicks Fight ---");
  try {
    const fightData = await renderBattleMessageData(userId, slotId, "FIGHT");
    console.log("Fight menu rendered successfully! files:", fightData.files?.length);
    const fightComps = fightData.components.map(r => r.components.map((c: any) => c.data.label || c.data.custom_id));
    console.log("Fight Components:", fightComps);
  } catch (err) {
    console.error("Fight menu render failed:", err);
  }

  console.log("\n--- 5. Next Action: Player executes Tackle with Squirtle ---");
  try {
    battleService.executePlayerMove(userId, slotId, "tackle", "ko");
    const nextBattle = battleService.getOrCreateBattle(userId, slotId);
    console.log("Next Battle Active Mon:", nextBattle.playerBattleMon.name, "HP:", nextBattle.playerBattleMon.hp);
    const nextData = await renderBattleMessageData(userId, slotId);
    console.log("Next Move rendered successfully! motionDurationMs:", nextData.motionDurationMs);
  } catch (err) {
    console.error("Next Move failed:", err);
  }
}

testFullBattleFlow().catch(console.error);
