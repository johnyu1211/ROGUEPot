import { battleService } from '../src/services/battleService.js';
import { saveService } from '../src/services/saveService.js';
import { renderBattleMoveGif } from '../src/utils/battleGifRenderer.js';
import { MOVES_DATA } from '../src/data/movesKo.js';

async function runTests() {
  console.log("==========================================");
  console.log("🔍 배틀 상태이상 및 전투방해요소 점검 테스트");
  console.log("==========================================\n");

  const uid = 'test_inspect_' + Date.now();
  saveService.startNewRun(uid, 1, 'bulbasaur');
  let battle = battleService.getOrCreateBattle(uid, 1);

  // 1. 수면 (Hypnosis) 테스트
  console.log("--- 1. 수면 (Hypnosis) 테스트 ---");
  battle.playerParty[0].moves = ['hypnosis'];
  battle.playerBattleMon.moves = ['hypnosis'];
  battle.enemy.moves = ['tackle'];
  saveService.updateSlot(uid, 1, { party: battle.playerParty });

  let res = battleService.executePlayerMove(uid, 1, 'hypnosis');
  console.log("Turn 1 - 적 상태이상:", res.enemy.status, "수면턴:", res.enemy.sleepTurns, "수면지속:", res.enemy.sleepDuration);
  console.log("Turn 1 - 턴 액션 수:", res.turnActions?.length);
  res.turnActions?.forEach((a, i) => {
    console.log(`  Action ${i + 1} [${a.actor}]: ${a.moveName} (canAct: ${a.canAct})`);
    console.log(`    Log: ${a.log.replace(/\n/g, ' / ')}`);
  });
  console.log("Turn 1 - dialogueText:\n", res.dialogueText);

  // Check frames of Hypnosis GIF
  const gifHypnosis = await renderBattleMoveGif({ battle: res, lang: 'ko' });
  console.log("\nHypnosis GIF 프레임 분석:");
  console.log(`- 전체 프레임 수: ${gifHypnosis.frames?.length}`);
  const last3 = (gifHypnosis.frames || []).slice(-3);
  last3.forEach((f: any, idx: number) => {
    console.log(`  Frame ${gifHypnosis.frames!.length - 3 + idx}: delay=${f.delay}, hideUI=${f.hideUI}, hideHud=${f.hideHud}, hideDialogue=${f.hideDialogue}, textLineIdx=${f.textLineIdx}, phaseName=${f.phaseName}`);
  });

  // 2. 혼란 (Supersonic) 테스트
  console.log("\n--- 2. 혼란 (Supersonic / 초음파) 테스트 ---");
  battle.playerParty[0].moves = ['supersonic'];
  battle.playerBattleMon.moves = ['supersonic'];
  saveService.updateSlot(uid, 1, { party: battle.playerParty });

  // Reset enemy status
  battle.enemy.status = null;
  battle.enemy.isConfused = false;
  battle.enemy.confusionTurns = 0;
  battle.pendingBallPerk = 'clear_eye'; // Force 100% accuracy

  res = battleService.executePlayerMove(uid, 1, 'supersonic');
  console.log("초음파 시전 후 적 혼란 상태:", {
    isConfused: res.enemy.isConfused,
    confusionTurns: res.enemy.confusionTurns
  });
  res.turnActions?.forEach((a, i) => {
    console.log(`  Action ${i + 1} [${a.actor}]: ${a.moveName} - ${a.log.replace(/\n/g, ' / ')}`);
  });

  // 3. 공격기 부가효과 혼란 (Psybeam / 환상빔) 테스트
  console.log("\n--- 3. 공격기 부가효과 혼란 (Psybeam / 환상빔) 테스트 ---");
  battle.playerParty[0].moves = ['psybeam'];
  battle.playerBattleMon.moves = ['psybeam'];
  saveService.updateSlot(uid, 1, { party: battle.playerParty });
  battle.enemy.status = null;
  battle.enemy.isConfused = false;
  battle.enemy.confusionTurns = 0;
  battle.enemy.hp = 500;
  battle.enemy.maxHp = 500;

  // Force math.random for test
  const origRandom = Math.random;
  Math.random = () => 0.05; // Force secondary effect hit
  try {
    res = battleService.executePlayerMove(uid, 1, 'psybeam');
    console.log("환상빔 부가효과 발동 후 적 혼란 상태:", {
      isConfused: res.enemy.isConfused,
      confusionTurns: res.enemy.confusionTurns
    });
  } finally {
    Math.random = origRandom;
  }

  // 4. 풀죽음 (Flinch) 지속성 버그 점검
  console.log("\n--- 4. 풀죽음 (Flinch) 턴 초기화 점검 ---");
  battle.playerBattleMon.isFlinched = true;
  battle.enemy.isFlinched = true;
  battle.playerParty[0].moves = ['tackle'];
  battle.playerBattleMon.moves = ['tackle'];
  saveService.updateSlot(uid, 1, { party: battle.playerParty });
  res = battleService.executePlayerMove(uid, 1, 'tackle');
  console.log("새 턴 시작 후 풀죽음 상태:", {
    playerFlinched: battle.playerBattleMon.isFlinched,
    enemyFlinched: battle.enemy.isFlinched
  });

  // 5. 변화기 후 UI 숨김처리 복귀 여부 (여러 변화기들 검사)
  console.log("\n--- 5. 변화기 후 UI 숨김 복귀 상세 검사 ---");
  const movesToTest = ['swords-dance', 'growl', 'hypnosis', 'thunder-wave', 'toxic', 'leech-seed'];
  for (const m of movesToTest) {
    battle.playerParty[0].moves = [m];
    battle.playerBattleMon.moves = [m];
    battle.enemy.status = null;
    battle.enemy.isSeeded = false;
    saveService.updateSlot(uid, 1, { party: battle.playerParty });
    const bMoveRes = battleService.executePlayerMove(uid, 1, m);
    const mGif = await renderBattleMoveGif({ battle: bMoveRes, lang: 'ko' });
    const frames = mGif.frames || [];
    const lastFrame = frames[frames.length - 1];
    const prevFrame = frames[frames.length - 2];
    console.log(`[${m}] 총 프레임 ${frames.length}개 | 이전프레임 hideUI: ${prevFrame?.hideUI} | 마지막프레임 hideUI: ${lastFrame?.hideUI}, delay: ${lastFrame?.delay}ms, textLineIdx: ${lastFrame?.textLineIdx}`);
  }

  console.log("\n==========================================");
  console.log("✅ 점검 테스트 완료");
  console.log("==========================================");
  process.exit(0);
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
});
