// Simulation test for 3v3 Battle System & New Moves execution
async function runTest() {
  const baseUrl = "http://localhost:3456";

  console.log("1. Testing GET /api/battle-loadouts...");
  const loadoutsRes = await fetch(`${baseUrl}/api/battle-loadouts`);
  if (!loadoutsRes.ok) throw new Error(`Failed to get loadouts: ${loadoutsRes.status}`);
  const loadoutsData = await loadoutsRes.json();
  console.log("Loadouts received:", Object.keys(loadoutsData.loadouts));
  console.log("Default teams:", loadoutsData.defaultTeams);
  console.log("New move keys:", loadoutsData.newMoveKeys);

  // Initialize 3v3 match
  let playerTeam = loadoutsData.defaultTeams.player.map(sp => {
    const l = loadoutsData.loadouts[sp];
    return { species: sp, currentHp: l.hp, maxHp: l.hp };
  });
  let enemyTeam = loadoutsData.defaultTeams.enemy.map(sp => {
    const l = loadoutsData.loadouts[sp];
    return { species: sp, currentHp: l.hp, maxHp: l.hp };
  });
  let playerActiveIdx = 0;
  let enemyActiveIdx = 0;
  let usedNewMoves = [];
  let turnNumber = 1;
  let trapTurns = 0;

  console.log("\n2. Starting 3v3 Battle Simulation...");
  const maxTurns = 30;

  while (turnNumber <= maxTurns) {
    const payload = {
      turnNumber,
      playerTeam,
      enemyTeam,
      playerActiveIdx,
      enemyActiveIdx,
      playerMove: null, // Let AI pick smart unused new move
      enemyMove: null,  // Let AI pick smart unused new move
      trapTurns,
      usedNewMoves,
    };

    const turnRes = await fetch(`${baseUrl}/api/battle-turn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!turnRes.ok) {
      console.error("Turn error:", await turnRes.text());
      break;
    }
    const turnData = await turnRes.json();

    console.log(`\n--- [ TURN ${turnNumber} ] ---`);
    console.log(`Matchup: ${turnData.playerSpecies} (${turnData.playerHp}) vs ${turnData.enemySpecies} (${turnData.enemyHp})`);
    for (const act of turnData.actions) {
      console.log(`  > ${act.attacker.toUpperCase()} used [${act.moveName || act.moveKey}]! Dmg: ${act.damage}, Hit: ${act.isHit}`);
    }
    if (turnData.switchEvents && turnData.switchEvents.length > 0) {
      for (const sw of turnData.switchEvents) {
        console.log(`  🔄 SWITCH EVENT: [${sw.side.toUpperCase()}] -> ${sw.newNameKo}`);
      }
    }
    if (turnData.endOfTurnCommentary) {
      console.log(`  📢 End of turn: ${turnData.endOfTurnCommentary}`);
    }

    playerTeam = turnData.playerTeam;
    enemyTeam = turnData.enemyTeam;
    playerActiveIdx = turnData.playerActiveIdx;
    enemyActiveIdx = turnData.enemyActiveIdx;
    trapTurns = turnData.trapTurns;
    usedNewMoves = turnData.usedNewMoves || [];

    console.log(`Used new moves so far (${usedNewMoves.length}/9):`, usedNewMoves);

    if (turnData.battleEnded) {
      console.log(`\n🏆 BATTLE ENDED! Winner: ${turnData.winner}`);
      break;
    }
    turnNumber++;
  }

  console.log("\n==========================================");
  console.log("FINAL SUMMARY:");
  console.log("Target 9 new moves:", loadoutsData.newMoveKeys);
  console.log("Used new moves:", usedNewMoves);
  const missing = loadoutsData.newMoveKeys.filter(m => !usedNewMoves.includes(m));
  console.log("Missing new moves:", missing.length > 0 ? missing : "NONE (ALL 9 USED!)");
  console.log("==========================================");
}

runTest().catch(console.error);
