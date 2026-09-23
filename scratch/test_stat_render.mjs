import http from "http";

async function testStatRender(moveKey, extra = "") {
  return new Promise((resolve, reject) => {
    const url = `http://localhost:3456/api/render-move?moveKey=${encodeURIComponent(moveKey)}&playerSpecies=cloyster&enemySpecies=weezing&actMode=single&nocache=1${extra}`;
    http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          const statFrames = (json.frames || []).filter(f => f.phaseId && f.phaseId.includes("stat") || f.phaseName && f.phaseName.includes("스탯") || f.phaseName && f.phaseName.includes("능력"));
          const hasStatProgress = (json.phases || []).some(p => p.phaseName && (p.phaseName.includes("스탯") || p.phaseName.includes("능력")));
          console.log(`[TEST: ${moveKey}${extra}] Total phases: ${json.phases?.length}, Stat frames count: ${statFrames.length}, Phases:`, json.phases?.map(p => p.phaseName));
          resolve({ ok: true, phases: json.phases });
        } catch (e) {
          console.error(`Failed to parse JSON for ${moveKey}:`, e.message, data.slice(0, 100));
          resolve({ ok: false, error: e.message });
        }
      });
    }).on("error", reject);
  });
}

async function run() {
  console.log("=== Testing Stat Boost & Stat Drop Rendering ===");
  await testStatRender("withdraw"); // 껍질에숨기 (Defense UP)
  await testStatRender("focus-energy"); // 기충전 (Critical UP)
  await testStatRender("tail-whip"); // 꼬리흔들기 (Defense DOWN)
  await testStatRender("withdraw-enemy"); // 적 껍질에숨기
}

run();
