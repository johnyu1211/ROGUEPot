import { BattleEngine } from "../dist/battle/engine/BattleEngine.js";
import { renderBattleMoveGif } from "../dist/utils/battleGifRenderer.js";

async function testMove(pMove, eMove = "tackle") {
  const battle = {
    userId: "test_user",
    slotId: 1,
    stage: 1,
    biome: "Town",
    phase: "ACTION",
    playerParty: [{
      id: "p1",
      speciesId: "pikachu",
      dexNumber: 25,
      name: "피카츄",
      nameKo: "피카츄",
      level: 25,
      hp: 150,
      maxHp: 150,
      stats: { hp: 150, attack: 100, defense: 100, spAtk: 100, spDef: 100, speed: 120 },
      atk: 100, def: 100, spAtk: 100, spDef: 100, speed: 120,
      stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      moves: [pMove, "pound"],
      types: ["electric"],
    }],
    playerBattleMon: null,
    enemy: {
      id: "e1",
      speciesId: "eevee",
      dexNumber: 133,
      name: "이브이",
      nameKo: "이브이",
      level: 25,
      hp: 150,
      maxHp: 150,
      stats: { hp: 150, attack: 90, defense: 90, spAtk: 90, spDef: 90, speed: 80 },
      atk: 90, def: 90, spAtk: 90, spDef: 90, speed: 80,
      stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      moves: [eMove],
      types: ["normal"],
    },
    playerActiveIndex: 0,
  };
  battle.playerBattleMon = battle.playerParty[0];

  BattleEngine.executeTurn(battle, pMove, "ko", false);

  console.log(`\n========================================`);
  console.log(`TEST: ${pMove} vs ${eMove}`);
  console.log(`Actions:`, battle.turnActions?.map(a => `${a.actor} used ${a.moveKey} (dmg=${a.damage}, eHpBefore=${a.enemyHpBefore}, pHpBefore=${a.playerHpBefore}, eHpAfter=${a.enemyHpAfter}, pHpAfter=${a.playerHpAfter})`));

  const res = await renderBattleMoveGif({
    battle,
    lang: "ko",
    includeFramePreviews: true,
  });

  let bounces = 0;
  for (let i = 1; i < (res.phases || []).length; i++) {
    const prev = res.phases[i - 1];
    const curr = res.phases[i];
    if (curr.playerHp > prev.playerHp) {
      console.log(`❌ BOUNCE! Player HP jumped from ${prev.playerHp} to ${curr.playerHp} at Frame #${curr.frameIndex} (${curr.phaseId})!`);
      bounces++;
    }
    if (curr.enemyHp > prev.enemyHp) {
      console.log(`❌ BOUNCE! Enemy HP jumped from ${prev.enemyHp} to ${curr.enemyHp} at Frame #${curr.frameIndex} (${curr.phaseId})!`);
      bounces++;
    }
  }
  if (bounces === 0) {
    console.log(`✅ [OK] ${pMove} vs ${eMove}: No HP bounces in ${res.phases?.length} frames.`);
  }
}

async function run() {
  await testMove("egg-bomb", "smog");
  await testMove("pound", "self-destruct");
  await testMove("bone-club", "lick");
  await testMove("fire-blast", "sludge");
  await testMove("clamp", "waterfall");
  await testMove("aurora-beam", "bite");
  await testMove("sing", "toxic");
  await testMove("defense-curl", "haze");
}

run();
