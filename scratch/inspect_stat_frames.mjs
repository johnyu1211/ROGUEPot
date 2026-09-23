import http from "http";

async function inspectFrames(moveKey) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3456/api/render-move?moveKey=${moveKey}&playerSpecies=cloyster&enemySpecies=weezing&actMode=single&nocache=1`, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        const json = JSON.parse(data);
        console.log(`=== Move: ${moveKey} ===`);
        console.log("Total phases:", json.phases?.length);
        const last6 = (json.phases || []).slice(-6);
        for (const f of last6) {
          console.log(`Phase ${f.frameIndex}: phaseId=${f.phaseId}, phaseName=${f.phaseName}, delay=${f.delay}`);
        }
        resolve();
      });
    });
  });
}

inspectFrames("withdraw");
