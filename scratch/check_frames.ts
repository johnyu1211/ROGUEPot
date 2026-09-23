import { battleService } from '../src/services/battleService.js';
import { saveService } from '../src/services/saveService.js';
import { renderBattleMoveGif } from '../src/utils/battleGifRenderer.js';

async function main() {
  const uid = 'test_diag_frames_' + Date.now();
  saveService.startNewRun(uid, 1, 'bulbasaur');
  const b = battleService.getOrCreateBattle(uid, 1);
  b.playerParty[0].moves = ['hypnosis'];
  b.playerBattleMon.moves = ['hypnosis'];
  b.enemy.moves = ['tackle'];
  // Force hit by giving perk clear_eye or mocking checkMoveHit
  b.pendingBallPerk = 'clear_eye';
  saveService.updateSlot(uid, 1, { party: b.playerParty });
  const res = battleService.executePlayerMove(uid, 1, 'hypnosis');
  console.log('TurnActions:', res.turnActions?.map(a => `${a.actor}: ${a.moveName} (canAct: ${a.canAct})`));
  const gif = await renderBattleMoveGif({ battle: res, lang: 'ko', includeFramePreviews: true });
  console.log('Total Phases count:', gif.phases?.length);
  const fs = await import('fs');
  gif.phases?.forEach((p, i) => {
    console.log(`Phase ${i}: ${p.phaseId} (${p.phaseName}) - delay ${p.delay}`);
    if (i >= gif.phases!.length - 4) {
      const base64Data = p.dataUrl.replace(/^data:image\/jpeg;base64,/, '');
      fs.writeFileSync(`scratch/hit_frame_${i}_${p.phaseId}.jpg`, Buffer.from(base64Data, 'base64'));
    }
  });
}

main().catch(console.error);
