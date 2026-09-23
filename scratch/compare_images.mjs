import http from "http";

async function compareImages() {
  return new Promise((resolve) => {
    http.get("http://localhost:3456/api/render-move?moveKey=smog&playerSpecies=weezing&enemySpecies=cloyster&actMode=single&nocache=1", (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        const json = JSON.parse(data);
        const p3 = json.phases[2];
        const p4 = json.phases[3];
        const p5 = json.phases[4];
        console.log("p3 === p4 ?", p3.dataUrl === p4.dataUrl);
        console.log("p4 === p5 ?", p4.dataUrl === p5.dataUrl);
        resolve();
      });
    });
  });
}

compareImages();
