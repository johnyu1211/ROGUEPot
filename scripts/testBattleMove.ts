import { battleService } from '../src/services/battleService.js';
import { saveService } from '../src/services/saveService.js';
import { renderBattleMoveGif } from '../src/utils/battleGifRenderer.js';
import sharp from 'sharp';
import fs from 'fs';

const moveKey = process.argv[2] || 'double-kick';
console.log(`\n========================================`);
console.log(`🎬 Testing Move Animation: ${moveKey}`);
console.log(`========================================`);

const testUserId = `test_cli_${Date.now()}`;
const slotId = 1;
saveService.startNewRun(testUserId, slotId, 'bulbasaur');
const battle = battleService.getOrCreateBattle(testUserId, slotId);
battle.playerParty[0].moves = [moveKey];
battle.playerBattleMon.moves = [moveKey];
battle.enemy.hp = 500;
battle.enemy.maxHp = 500;
saveService.updateSlot(testUserId, slotId, { party: battle.playerParty });

const t0 = Date.now();
const bRes = battleService.executePlayerMove(testUserId, slotId, moveKey);
const gif = await renderBattleMoveGif({ battle: bRes, lang: 'ko' });
const t1 = Date.now();

const outGifPath = `preview_${moveKey}.gif`;
fs.writeFileSync(outGifPath, gif.buffer);

const meta = await sharp(gif.buffer, { animated: true }).metadata();
const pageCount = meta.pages || 1;

console.log(`✅ Rendered in: ${t1 - t0}ms`);
console.log(`🎞️ Motion Duration: ${gif.motionDurationMs}ms`);
console.log(`🖼️ Total Frames: ${pageCount}`);
console.log(`💾 Saved GIF: ${outGifPath} (${(gif.buffer.length / 1024).toFixed(1)} KB)`);

// Generate 4-frame summary strip
const stepIndices = [
  0,
  Math.floor(pageCount * 0.25),
  Math.floor(pageCount * 0.50),
  Math.min(pageCount - 1, Math.floor(pageCount * 0.75))
];

const stripFrames: Buffer[] = [];
for (const p of stepIndices) {
  stripFrames.push(await sharp(gif.buffer, { page: p }).toBuffer());
}

const strip = await sharp({
  create: {
    width: 560 * 4,
    height: 380,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 1 }
  }
})
.composite([
  { input: stripFrames[0], top: 0, left: 0 },
  { input: stripFrames[1], top: 0, left: 560 },
  { input: stripFrames[2], top: 0, left: 1120 },
  { input: stripFrames[3], top: 0, left: 1680 },
])
.png()
.toBuffer();

const outStripPath = `preview_${moveKey}_strip.png`;
fs.writeFileSync(outStripPath, strip);
console.log(`📸 Saved Frame Strip: ${outStripPath}\n`);
