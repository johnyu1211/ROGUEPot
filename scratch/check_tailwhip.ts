import { renderBattleMoveGif } from "../src/utils/battleGifRenderer.js";
import { battleService } from "../src/services/battleService.js";
import { saveService } from "../src/services/saveService.js";
import sharp from "sharp";

async function check() {
  const userId = "test_tail_whip";
  const slotId = 1;
  saveService.startNewRun(userId, slotId, "bulbasaur");
  const battle = battleService.getOrCreateBattle(userId, slotId);
  battle.playerParty[0].moves = ["Tail Whip"];
  battle.playerBattleMon.moves = ["Tail Whip"];
  battle.enemy.moves = ["Tackle"];

  console.log("=== EXECUTING PLAYER MOVE ===");
  const resBattle = battleService.executePlayerMove(userId, slotId, "tail-whip", "ko");
  console.log("resBattle.phase:", resBattle.phase);
  console.log("turnActions:", resBattle.turnActions?.map(a => ({ actor: a.actor, moveKey: a.moveKey, damage: a.damage })));

  console.log("=== RENDERING MOVE GIF ===");
  const gifResult = await renderBattleMoveGif({ battle: resBattle, lang: "ko" });
  console.log("motionDurationMs:", gifResult.motionDurationMs);

  const meta = await sharp(gifResult.buffer, { animated: true }).metadata();
  console.log("Total GIF frames:", meta.pages);

  // Extract last 3 frames to see what's drawn
  const pages = meta.pages || 1;
  for (let i = Math.max(0, pages - 3); i < pages; i++) {
    const frameBuf = await sharp(gifResult.buffer, { page: i }).png().toBuffer();
    console.log(`Frame ${i} size:`, frameBuf.length);
    await sharp(frameBuf).toFile(`scratch/tailwhip_frame_${i}.png`);
  }
  console.log("Saved last 3 frames to scratch/tailwhip_frame_*.png");
}

check().catch(console.error);
