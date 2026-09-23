import { db } from '../src/services/db.js';

const slots = db.prepare("SELECT user_id, slot_id, party FROM game_slots WHERE user_id NOT LIKE 'test%' AND user_id NOT LIKE 'trial%'").all() as any[];
for (const s of slots) {
  try {
    const party = JSON.parse(s.party);
    console.log(`User: ${s.user_id}, Slot: ${s.slot_id}`);
    for (const p of party) {
      console.log(`  ${p.nameKo || p.name}: moves=${JSON.stringify(p.moves)}, movePps=${JSON.stringify(p.movePps)}`);
    }
  } catch (e) {
    console.error(e);
  }
}
