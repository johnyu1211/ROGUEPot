import { battleService } from '../src/services/battleService.js';
import { saveService } from '../src/services/saveService.js';
import { renderBattleMoveGif } from '../src/utils/battleGifRenderer.js';
import fs from 'fs';

async function main() {
  const uid = 'test_turn2_' + Date.now();
  saveService.startNewRun(uid, 1, 'bulbasaur');
  const b = battleService.getOrCreateBattle(uid, 1);
  b.playerParty[0].moves = ['hypnosis', 'tackle'];
  b.playerBattleMon.moves = ['hypnosis', 'tackle'];
  b.enemy.moves = ['tackle'];
  b.pendingBallPerk = 'clear_eye';
  saveService.updateSlot(uid, 1, { party: b.playerParty });

  // Turn 1: Player uses Hypnosis
  console.log("=== TURN 1: HYPNOSIS ===");
  const res1 = battleService.executePlayerMove(uid, 1, 'hypnosis');
  console.log("Turn 1 dialogueText:\n", res1.dialogueText);
  res1.turnActions?.forEach((a, i) => console.log(`Act ${i+1}: ${a.actor} ${a.moveName} canAct=${a.canAct}`));

  // Turn 2: Player uses Tackle (Enemy is fast asleep)
  console.log("\n=== TURN 2: TACKLE WHILE ENEMY SLEEPING ===");
  const res2 = battleService.executePlayerMove(uid, 1, 'tackle');
  console.log("Turn 2 dialogueText:\n", res2.dialogueText);
  res2.turnActions?.forEach((a, i) => console.log(`Act ${i+1}: ${a.actor} ${a.moveName} canAct=${a.canAct}`));

  const gif2 = await renderBattleMoveGif({ battle: res2, lang: 'ko', includeFramePreviews: true });
  console.log("\nTurn 2 Total Phases count:", gif2.phases?.length);
  gif2.phases?.forEach((p, i) => {
    console.log(`T2 Phase ${i}: ${p.phaseId} (${p.phaseName}) - delay ${p.delay}`);
    if (p.phaseId.includes('cannot-act') || i >= gif2.phases!.length - 3) {
      const base64Data = p.dataUrl.replace(/^data:image\/jpeg;base64,/, '');
      fs.writeFileSync(`scratch/t2_frame_${i}_${p.phaseId}.jpg`, Buffer.from(base64Data, 'base64'));
      console.log(`  -> Saved scratch/t2_frame_${i}_${p.phaseId}.jpg`);
    }
  });

  // What if Enemy is FASTER? Let's test Enemy going first while sleeping!
  console.log("\n=== TURN 3: ENEMY FASTER WHILE SLEEPING ===");
  b.enemy.speed = 999;
  b.playerBattleMon.speed = 10;
  b.enemy.status = 'slp';
  b.enemy.sleepTurns = 1;
  b.enemy.sleepDuration = 3;
  const res3 = battleService.executePlayerMove(uid, 1, 'tackle');
  console.log("Turn 3 dialogueText:\n", res3.dialogueText);
  res3.turnActions?.forEach((a, i) => console.log(`Act ${i+1}: ${a.actor} ${a.moveName} canAct=${a.canAct}`));

  const gif3 = await renderBattleMoveGif({ battle: res3, lang: 'ko', includeFramePreviews: true });
  console.log("\nTurn 3 Total Phases count:", gif3.phases?.length);
  gif3.phases?.forEach((p, i) => {
    console.log(`T3 Phase ${i}: ${p.phaseId} (${p.phaseName}) - delay ${p.delay}`);
    if (p.phaseId.includes('cannot-act') || i <= 3 || i >= gif3.phases!.length - 3) {
      const base64Data = p.dataUrl.replace(/^data:image\/jpeg;base64,/, '');
      fs.writeFileSync(`scratch/t3_frame_${i}_${p.phaseId}.jpg`, Buffer.from(base64Data, 'base64'));
      console.log(`  -> Saved scratch/t3_frame_${i}_${p.phaseId}.jpg`);
    }
  });
}

main().catch(console.error);
