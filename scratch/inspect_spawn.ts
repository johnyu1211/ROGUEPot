import fs from "fs";

async function main() {
  const res = await fetch("http://localhost:3456/api/render-move?moveKey=light-screen");
  const data = await res.json();
  const f18 = data.phases[17]; // #18 (Step 2)
  const f24 = data.phases[23]; // #24 (Step 4 complete)
  if (f18?.dataUrl) {
    const b = f18.dataUrl.replace(/^data:image\/\w+;base64,/, "");
    fs.writeFileSync("scratch/frame18.png", Buffer.from(b, "base64"));
  }
  if (f24?.dataUrl) {
    const b = f24.dataUrl.replace(/^data:image\/\w+;base64,/, "");
    fs.writeFileSync("scratch/frame24.png", Buffer.from(b, "base64"));
  }
  console.log("Saved frame18.png and frame24.png");
}

main().catch(console.error);
