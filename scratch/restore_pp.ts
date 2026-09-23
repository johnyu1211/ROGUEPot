import { db } from '../src/services/db.js';
import { getMoveData, getMoveKey } from '../src/data/movesKo.js';
import { battleService } from '../src/services/battleService.js';

function getMaxPp(moveName: string): number {
  const k = getMoveKey(moveName);
  const data = getMoveData(k);
  return data?.pp || 25;
}

// 1. Restore PP in SQLite game_slots
const rows = db.prepare('SELECT user_id, slot_id, party FROM game_slots').all() as any[];
console.log(`Found ${rows.length} save slots in database.`);

let updatedCount = 0;
for (const r of rows) {
  try {
    const party = JSON.parse(r.party);
    let changed = false;
    for (const mon of party) {
      if (mon.moves && Array.isArray(mon.moves)) {
        const maxPps = mon.moves.map((m: string) => getMaxPp(m));
        console.log(`User ${r.user_id} (Slot ${r.slot_id}): Mon ${mon.nameKo || mon.name} moves:`, mon.moves, '-> Max PP:', maxPps);
        mon.movePps = maxPps;
        changed = true;
      }
    }
    if (changed) {
      db.prepare('UPDATE game_slots SET party = ? WHERE user_id = ? AND slot_id = ?').run(
        JSON.stringify(party),
        r.user_id,
        r.slot_id
      );
      updatedCount++;
    }
  } catch (err) {
    console.error(`Error processing user ${r.user_id} slot ${r.slot_id}:`, err);
  }
}

// 2. Also restore any in-memory active battles in battleService
const activeBattlesMap = (battleService as any).activeBattles;
if (activeBattlesMap && activeBattlesMap instanceof Map) {
  for (const [key, b] of activeBattlesMap.entries()) {
    if (b.playerParty) {
      for (const mon of b.playerParty) {
        if (mon.moves) {
          mon.movePps = mon.moves.map((m: string) => getMaxPp(m));
        }
      }
    }
    if (b.playerBattleMon && b.playerBattleMon.moves) {
      b.playerBattleMon.movePps = b.playerBattleMon.moves.map((m: string) => getMaxPp(m));
    }
    console.log(`Restored in-memory battle PP for ${key}`);
  }
}

console.log(`\n✅ Successfully restored PP for ${updatedCount} save slots!`);
