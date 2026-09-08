import { renderBattleMoveGif } from '../src/utils/battleGifRenderer.js';
import sharp from 'sharp';
import fs from 'fs';

const dummyBattle: any = {
  biome: 'Town',
  playerParty: [
    { speciesId: 'bulbasaur', moves: ['surf'], hp: 100, maxHp: 100, level: 5 }
  ],
  playerBattleMon: { speciesId: 'bulbasaur', moves: ['surf'], hp: 100, maxHp: 100, level: 5 },
  enemy: { speciesId: 'skwovet', hp: 500, maxHp: 500, level: 5 },
  turnActions: [
    { actor: 'player', moveKey: 'surf', isHit: true, damage: 50, enemyHpAfter: 450 }
  ]
};
import { surfMove } from '../src/battle/moves/definitions/057_surf.js';

const frames = surfMove.buildFrames({
  action: dummyBattle.turnActions[0],
  isPlayer: true,
  isHit: true,
  isMiss: false,
  enemyHp: 500,
  playerHp: 100,
  textLineIdx: 1
} as any);
frames.forEach((f, idx) => {
  console.log(`Frame ${idx}: step=${f.moveStep}, phase=${f.phaseId}, plunge=${f.spoutPlunge}, pan=${JSON.stringify(f.cameraPan)}, vapor=${f.fullscreenVaporAlpha}`);
});

const gif = await renderBattleMoveGif({ battle: dummyBattle, lang: 'ko' });
const meta = await sharp(gif.buffer, { animated: true }).metadata();
const pageCount = meta.pages || 1;
console.log(`Total Pages in GIF: ${pageCount}`);

for (let p = 0; p < Math.min(16, pageCount); p++) {
  const frameBuf = await sharp(gif.buffer, { page: p }).png().toBuffer();
  fs.writeFileSync(`scratch/inspect_frame_${p}.png`, frameBuf);
}
console.log('Saved inspect_frame_0 to 15');
