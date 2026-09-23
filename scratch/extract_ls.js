import sharp from 'sharp';
import fs from 'fs';

async function run() {
  const res = await fetch('http://localhost:3456/api/render-move?moveKey=light-screen&nocache=1');
  const data = await res.json();
  const base64 = data.gif.replace(/^data:image\/gif;base64,/, '');
  const buf = Buffer.from(base64, 'base64');
  const meta = await sharp(buf, { animated: true }).metadata();
  console.log(`Total frames: ${meta.pages}`);

  for (const p of [20, 24, 25, 26, 28, 30, 32]) {
    if (p < (meta.pages || 0)) {
      const frame = await sharp(buf, { page: p }).png().toBuffer();
      const outPath = `C:/Users/johny/.gemini/antigravity/brain/bc68fe75-18e6-4a90-8ae8-8aa26f85c7fe/scratch/ls_frame_${p}.png`;
      fs.writeFileSync(outPath, frame);
      console.log('Saved', outPath);
    }
  }
}

run().catch(console.error);
