const sharp = require('sharp');
const path = 'C:/Users/johny/.gemini/antigravity/brain/c9efba84-f986-4318-9866-31f832ed086e/.user_uploaded/media_1788681743318.png';

async function run() {
  const frameW = 42;
  const frameH = 67;
  for (let i = 0; i < 8; i++) {
    await sharp(path)
      .extract({ left: i * frameW, top: 0, width: frameW, height: frameH })
      .resize(frameW * 5, frameH * 5, { kernel: 'nearest' })
      .toFile(`scratch/sprite_frame_${i}.png`);
  }
  console.log('Successfully extracted 8 frames');
}

run();
