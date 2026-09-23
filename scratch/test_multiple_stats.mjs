import http from "http";

async function inspect(moveKey) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3456/api/render-move?moveKey=${moveKey}&playerSpecies=cloyster&enemySpecies=weezing&actMode=single&nocache=1`, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        const json = JSON.parse(data);
        console.log(`=== Move: ${moveKey} ===`);
        const statPhases = (json.phases || []).filter(p => p.phaseId && p.phaseId.startsWith("stat-change"));
        for (const p of statPhases) {
          console.log(`Phase ${p.frameIndex}: id=${p.phaseId}, name=${p.phaseName}, delay=${p.delay}`);
        }
        resolve();
      });
    });
  });
}

async function run() {
  await inspect("tail-whip");
  await inspect("focus-energy");
  await inspect("screech");
  await inspect("harden");
}
run();
