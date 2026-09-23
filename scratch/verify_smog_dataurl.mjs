import http from "http";

async function verifyPixelDiff() {
  return new Promise((resolve) => {
    http.get("http://localhost:3456/api/render-move?moveKey=smog&playerSpecies=weezing&enemySpecies=cloyster&actMode=single&nocache=1", (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        const json = JSON.parse(data);
        const p3 = json.phases[2]; // Phase 3: smog-inhale-2
        const p4 = json.phases[3]; // Phase 4: camera-target-glide-1
        const p5 = json.phases[4]; // Phase 5: camera-target-glide-2
        const p6 = json.phases[5]; // Phase 6: smog-exhale-1

        console.log("Phase 3 dataUrl length:", p3.dataUrl.length);
        console.log("Phase 4 dataUrl length:", p4.dataUrl.length);
        console.log("Phase 5 dataUrl length:", p5.dataUrl.length);
        console.log("Phase 6 dataUrl length:", p6.dataUrl.length);
        resolve();
      });
    });
  });
}

verifyPixelDiff();
