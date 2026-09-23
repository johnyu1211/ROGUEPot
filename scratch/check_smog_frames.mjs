import http from "http";
import fs from "fs";

async function checkFrameSmog() {
  return new Promise((resolve) => {
    http.get("http://localhost:3456/api/render-move?moveKey=smog&playerSpecies=weezing&enemySpecies=cloyster&actMode=single&nocache=1", (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        const json = JSON.parse(data);
        console.log(`Total phases: ${json.phases?.length}`);
        json.phases?.forEach((p, i) => {
          console.log(`[Phase ${i + 1}] index=${p.frameIndex}, id=${p.phaseId}, name="${p.phaseName}"`);
        });
        resolve();
      });
    });
  });
}

checkFrameSmog();
