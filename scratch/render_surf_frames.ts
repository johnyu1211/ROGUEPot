import { battleService } from '../src/services/battleService.js';
import { saveService } from '../src/services/saveService.js';
import { renderBattleMoveGif } from '../src/utils/battleGifRenderer.js';
import sharp from 'sharp';
import fs from 'fs';

const testUserId = `test_surf_diag_${Date.now()}`;
const slotId = 1;
saveService.startNewRun(testUserId, slotId, 'bulbasaur');
const battle = battleService.getOrCreateBattle(testUserId, slotId);
battle.playerParty[0].moves = ['surf'];
battle.playerBattleMon.moves = ['surf'];
battle.enemy.hp = 500;
battle.enemy.maxHp = 500;
saveService.updateSlot(testUserId, slotId, { party: battle.playerParty });

const bRes = battleService.executePlayerMove(testUserId, slotId, 'surf');
const gif = await renderBattleMoveGif({ battle: bRes, lang: 'ko' });

const meta = await sharp(gif.buffer, { animated: true }).metadata();
const pageCount = meta.pages || 1;
console.log(`Total Frames: ${pageCount}`);

// Save individual frames for steps 1, 2, 3, 4, 5, 6, 7, 8
// Typically frames 1~12 are spout & plunge
for (let p = 0; p < pageCount; p++) {
  const frameBuf = await sharp(gif.buffer, { page: p }).png().toBuffer();
  fs.writeFileSync(`scratch/surf_frame_${p}.png`, frameBuf);
}
console.log(`Saved all ${pageCount} frames in scratch/`);
