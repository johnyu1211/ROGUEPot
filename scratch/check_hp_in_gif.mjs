import http from "http";

async function checkHp() {
  const url1 = "http://localhost:3456/api/render-move?moveKey=waterfall&playerSpecies=cloyster&enemySpecies=weezing&playerHp=160&enemyHp=175&playerMaxHp=160&enemyMaxHp=175&damage=40&isHit=true&actMode=single&nocache=1";
  const res1 = await fetchJson(url1);
  console.log("=== Turn 1: Waterfall (eHP 175 -> 135) ===");
  const p1_start = res1.phases[0];
  const p1_end = res1.phases[res1.phases.length - 1];
  console.log(`Phase 0: pHP=${p1_start.playerHp}, eHP=${p1_start.enemyHp}`);
  console.log(`Phase End: pHP=${p1_end.playerHp}, eHP=${p1_end.enemyHp}`);

  // Turn 2: Enemy counterattacks! (Enemy HP is 135, attacks with sludge, deals 30 damage to player 160 -> 130)
  const url2 = "http://localhost:3456/api/render-move?moveKey=sludge-enemy&playerSpecies=cloyster&enemySpecies=weezing&playerHp=160&enemyHp=135&playerMaxHp=160&enemyMaxHp=175&damage=30&isHit=true&actMode=single&nocache=1";
  const res2 = await fetchJson(url2);
  console.log("=== Turn 2: Sludge (Enemy) (eHP 135, pHP 160 -> 130) ===");
  const p2_start = res2.phases[0];
  const p2_end = res2.phases[res2.phases.length - 1];
  console.log(`Phase 0: pHP=${p2_start.playerHp}, eHP=${p2_start.enemyHp}`);
  console.log(`Phase End: pHP=${p2_end.playerHp}, eHP=${p2_end.enemyHp}`);
}

function fetchJson(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => resolve(JSON.parse(data)));
    });
  });
}

checkHp();
