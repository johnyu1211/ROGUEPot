import http from "http";

async function testSmogEffect() {
  return new Promise((resolve) => {
    http.get("http://localhost:3456/api/render-move?moveKey=smog&playerSpecies=weezing&enemySpecies=cloyster&actMode=single&nocache=1", (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        const json = JSON.parse(data);
        console.log("=== Smog Phases 1 to 8 ===");
        json.phases?.slice(0, 9).forEach((p, idx) => {
          console.log(`[Phase ${idx + 1}] index=${p.frameIndex}, id=${p.phaseId}, name="${p.phaseName}", zoom=${p.cameraZoom}`);
        });
        resolve();
      });
    });
  });
}

testSmogEffect();
