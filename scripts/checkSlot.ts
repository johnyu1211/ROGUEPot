import { saveService } from "../src/services/saveService.js";
import { db } from "../src/services/db.js";

const userId = "1aaaaaa1";
const profile = saveService.getProfile(userId);
console.log("Profile slots:", Object.keys(profile.slots));
const slot1 = profile.slots[1];
if (slot1) {
  console.log("Slot 1 party:", JSON.stringify(slot1.party, null, 2));
} else {
  console.log("Slot 1 does not exist!");
  // Check raw DB
  const rawRows = db.prepare("SELECT * FROM game_slots WHERE user_id = ?").all(userId);
  console.log("Raw DB slots for 1aaaaaa1:", rawRows);
}
