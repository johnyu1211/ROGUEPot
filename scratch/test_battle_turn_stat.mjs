import http from "http";

async function testBattleTurn() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      turnNumber: 1,
      playerTeam: [
        { species: "cloyster", currentHp: 160, maxHp: 160 }
      ],
      enemyTeam: [
        { species: "weezing", currentHp: 175, maxHp: 175 }
      ],
      playerActiveIdx: 0,
      enemyActiveIdx: 0,
      playerMove: "withdraw",
      enemyMove: "toxic"
    });

    const req = http.request("http://localhost:3456/api/battle-turn", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          console.log("=== 3v3 Battle Turn API Response ===");
          for (const act of (json.actions || [])) {
            console.log(`Actor: ${act.attacker}, Move: ${act.moveKey}, statDir: ${act.statDirection}, statTarget: ${act.statTarget}`);
            console.log(`gifUrl: ${act.gifUrl}`);
          }
          resolve(json);
        } catch (e) {
          console.error("Parse error:", e);
          resolve(null);
        }
      });
    });

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

testBattleTurn();
