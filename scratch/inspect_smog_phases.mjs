import http from "http";

async function inspectSmog() {
  return new Promise((resolve) => {
    http.get("http://localhost:3456/api/render-move?moveKey=smog&playerSpecies=weezing&enemySpecies=cloyster&actMode=single&nocache=1", (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        const json = JSON.parse(data);
        console.log("=== Smog Phases ===");
        json.phases?.forEach((p, idx) => {
          console.log(`[${idx}] index=${p.frameIndex}, id=${p.phaseId}, name=${p.phaseName}, delay=${p.delay}, zoom=${p.cameraZoom}`);
        });
        resolve();
      });
    });
  });
}

inspectSmog();
