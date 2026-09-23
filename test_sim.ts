import { getOrCreateShowcaseSession, executeShowcaseTurn, NEW_MOVES_KEYS } from "./src/battle/showcaseEngine.js";

async function runSim() {
  const missingStats: Record<string, number> = {};
  for (const k of NEW_MOVES_KEYS) missingStats[k] = 0;

  for (let match = 0; match < 5; match++) {
    const session = getOrCreateShowcaseSession(`test_user_${match}`, true);
    const usedMovesInMatch = new Set<string>();

    let turns = 0;
    while (!session.battleEnded && turns < 25) {
      turns++;
      const res = await executeShowcaseTurn(session);
      for (const act of session.battle.turnActions || []) {
        const key = (act.moveKey || "").toLowerCase();
        if (NEW_MOVES_KEYS.includes(key)) {
          usedMovesInMatch.add(key);
        }
      }
    }

    console.log(`Match ${match}: ended=${session.battleEnded}, winner=${session.winner}, turns=${turns}, used ${usedMovesInMatch.size}/9:`, Array.from(usedMovesInMatch));
    for (const k of NEW_MOVES_KEYS) {
      if (!usedMovesInMatch.has(k)) {
        missingStats[k]++;
      }
    }
  }

  console.log("\nMissing frequency over 5 matches:", missingStats);
}

runSim().catch(console.error);
