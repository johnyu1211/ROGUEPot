import {
  getOrCreateShowcaseSession,
  executeShowcaseTurn,
  NEW_MOVES_KEYS,
} from "../src/battle/showcaseEngine.js";

async function runShowcaseTest() {
  console.log("==========================================");
  console.log("🎮 Testing 3v3 Showcase Match Flow in Engine");
  console.log("==========================================");

  const testUserId = `test_showcase_${Date.now()}`;
  let session = getOrCreateShowcaseSession(testUserId, true);

  console.log(`Target 9 New Moves: ${NEW_MOVES_KEYS.join(", ")}`);
  console.log("------------------------------------------");

  let turns = 0;
  while (!session.battleEnded && turns < 15) {
    turns++;
    const prevUsedCount = session.usedNewMoves.length;
    const res = await executeShowcaseTurn(session);
    session = res.session;

    console.log(`[Turn ${turns}]`);
    console.log(res.turnCommentary);
    if (res.switches.length > 0) {
      console.log(`Switch: ${res.switches.join(" | ")}`);
    }
    console.log(`Progress: ${session.usedNewMoves.length}/9 used (${session.usedNewMoves.join(", ")})`);
    console.log("------------------------------------------");
  }

  console.log(`\nMatch ended in ${turns} turns! Winner: ${session.winner}`);
  console.log(`Total new moves used: ${session.usedNewMoves.length}/9`);
  const missing = NEW_MOVES_KEYS.filter((k) => !session.usedNewMoves.includes(k));
  if (missing.length === 0) {
    console.log("🎉 ALL 9 NEW MOVES (120~128) WERE SUCCESSFULLY USED IN BATTLE!");
  } else {
    console.log(`⚠️ Missing moves: ${missing.join(", ")}`);
  }
}

runShowcaseTest().catch(console.error);
