import { saveService } from "../src/services/saveService.js";
import { db } from "../src/services/db.js";
import { battleService } from "../src/services/battleService.js";
import { MOVES_DATA } from "../src/data/movesKo.js";

const userId = "1aaaaaa1";
const slotId = 1;

const newMoves = ["구멍파기", "번개", "사이코키네시스", "회오리불꽃"];
console.log(`Setting moves for user: ${userId}, slot: ${slotId} ->`, newMoves);

const profile = saveService.getProfile(userId);
const slot = profile.slots[slotId];

if (!slot || !slot.party || slot.party.length === 0) {
  console.error("Slot 1 party not found!");
  process.exit(1);
}

const party = slot.party;
party[0].moves = [...newMoves];
party[0].movePps = [99, 99, 99, 99];
party[0].maxMovePps = [99, 99, 99, 99];

// 1. Update SQLite DB
db.prepare("UPDATE game_slots SET party = ? WHERE user_id = ? AND slot_id = ?").run(
  JSON.stringify(party),
  userId,
  slotId
);

// 2. Clear / Update active battle in battleService if exists
try {
  const battle = battleService.getOrCreateBattle(userId, slotId);
  if (battle) {
    battle.playerParty = party;
    battle.playerBattleMon = battleService.createPlayerBattleMon(party[0], party);
    console.log("Updated active battle state moves:", battle.playerBattleMon.moves);
  }
} catch (e) {
  console.log("No active battle to update or error:", e);
}

console.log("✅ Successfully updated moves for 1aaaaaa1 Slot 1!");
console.log("Updated party[0]:", JSON.stringify(party[0], null, 2));
