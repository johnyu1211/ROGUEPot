import { BattleEngine } from "../src/battle/engine/BattleEngine.js";
import { battleService } from "../src/services/battleService.js";
import { checkMoveHit } from "../src/battle/mechanics/accuracyEngine.js";
import { calculateDamage } from "../src/battle/mechanics/damageCalculator.js";
import { getMoveData } from "../src/data/movesKo.js";

console.log("==================================================");
console.log("🧪 ROGUEPot 배틀 엔진 모듈화 종합 단위 테스트");
console.log("==================================================");

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    failed++;
  }
}

// 1. [핵심 버그 수정 검증] 명중률 100% 기술의 회피율 랭크 반영 검증
{
  const tackle = getMoveData("tackle")!;
  const user = battleService.spawnWildPokemon(1, "Town", "pidgey", 20);
  const targetWithEva = battleService.spawnWildPokemon(1, "Town", "rattata", 20);
  targetWithEva.stages.eva = 6; // 회피율 +6랭크 (본가 배율 3/9 = 33.3%)

  let hits = 0;
  const trials = 1000;
  for (let i = 0; i < trials; i++) {
    const res = checkMoveHit({ actor: user, target: targetWithEva, move: tackle });
    if (res.isHit) hits++;
  }
  const hitRate = (hits / trials) * 100;
  console.log(`   ➔ 회피율 +6랭크 상대에게 몸통박치기(100% 명중) 명중률: ${hitRate.toFixed(1)}% (기대치: 약 33%)`);
  assert(hitRate < 50 && hitRate > 20, "기본 100% 명중 기술도 상대의 회피율 +6랭크에 의해 빗나갈 수 있어야 함");
}

// 2. [필중기 검증] 제비반환은 회피율 +6랭크 상대에게도 100% 명중해야 함
{
  const aerialAce = getMoveData("aerial-ace")!;
  const user = battleService.spawnWildPokemon(1, "Town", "pidgey", 20);
  const targetWithEva = battleService.spawnWildPokemon(1, "Town", "rattata", 20);
  targetWithEva.stages.eva = 6;

  let allHit = true;
  for (let i = 0; i < 50; i++) {
    const res = checkMoveHit({ actor: user, target: targetWithEva, move: aerialAce });
    if (!res.isHit) {
      allHit = false;
      break;
    }
  }
  assert(allHit, "필중기(제비반환)는 상대 회피율 +6랭크에도 100% 명중해야 함");
}

// 3. [일격필살기 검증] 길로틴: 레벨이 낮으면 실패, 옹골참 특성 면역
{
  const guillotine = getMoveData("guillotine")!;
  const lowLvUser = battleService.spawnWildPokemon(1, "Town", "krabby", 10);
  const highLvTarget = battleService.spawnWildPokemon(1, "Town", "onix", 20);
  highLvTarget.ability = "Rock Head";

  const dmgResLow = calculateDamage(lowLvUser, highLvTarget, guillotine, true, true);
  assert(dmgResLow.damage === 0 && dmgResLow.log.includes("레벨이 낮아"), "시전자 레벨이 낮을 때 일격필살기 실패");

  const highLvUser = battleService.spawnWildPokemon(1, "Town", "krabby", 100);
  const sturdyTarget = battleService.spawnWildPokemon(1, "Town", "geodude", 20);
  sturdyTarget.ability = "sturdy";

  const dmgResSturdy = calculateDamage(highLvUser, sturdyTarget, guillotine, true, true);
  assert(dmgResSturdy.damage === 0 && dmgResSturdy.log.includes("옹골참"), "옹골참 특성은 일격필살기를 무효화해야 함");
}

// 4. [고정 데미지기 검증] 용의분노(40 고정), 지구던지기(레벨 고정)
{
  const dragonRage = getMoveData("dragon-rage")!;
  const seismicToss = getMoveData("seismic-toss")!;
  const user = battleService.spawnWildPokemon(1, "Town", "charizard", 35);
  const target = battleService.spawnWildPokemon(1, "Town", "blastoise", 40);

  const resDR = calculateDamage(user, target, dragonRage, true, true);
  assert(resDR.damage === 40, "용의분노는 항상 고정 40 데미지여야 함");

  const resST = calculateDamage(user, target, seismicToss, true, true);
  assert(resST.damage === 35, "지구던지기는 시전자 레벨(35)만큼 고정 데미지여야 함");
}

// 5. [2턴 충전기 & 관통 검증] 지진이 땅속 구멍파기 상대에게 2배 위력으로 적중
{
  const earthquake = getMoveData("earthquake")!;
  const user = battleService.spawnWildPokemon(1, "Town", "golem", 30);
  const normalTarget = battleService.spawnWildPokemon(1, "Town", "pikachu", 30);
  const undergroundTarget = battleService.spawnWildPokemon(1, "Town", "pikachu", 30);
  undergroundTarget.isSemiInvulnerable = true;
  undergroundTarget.semiInvulnerableState = "underground";

  let normalTotal = 0;
  let underTotal = 0;
  for (let i = 0; i < 20; i++) {
    normalTotal += calculateDamage(user, normalTarget, earthquake, true, true).damage;
    underTotal += calculateDamage(user, undergroundTarget, earthquake, true, true).damage;
  }
  const avgNormal = normalTotal / 20;
  const avgUnder = underTotal / 20;

  console.log(`   ➔ 일반 대상 지진 평균 피해: ${avgNormal.toFixed(1)}, 땅속 대상 지진 평균 피해: ${avgUnder.toFixed(1)}`);
  assert(avgUnder > avgNormal * 1.6, "땅속에 숨은 상대에게 지진은 평균 약 2배 피해를 주어야 함");
}

// 6. [전체 턴 실행 검증] BattleEngine.executeTurn
{
  const { saveService } = await import("../src/services/saveService.js");
  const testUserId = `test_engine_${Date.now()}`;
  saveService.startNewRun(testUserId, 1, "bulbasaur");
  const battle = battleService.getOrCreateBattle(testUserId, 1);
  const initialEnemyHp = battle.enemy.hp;

  const afterTurn = battleService.executePlayerMove(testUserId, 1, "tackle", "ko");
  assert(afterTurn.turnCount === 1, "턴 실행 후 turnCount가 1 증가해야 함");
  assert(afterTurn.turnActions && afterTurn.turnActions.length > 0, "turnActions 배열이 채워져야 함");
  assert(afterTurn.turnActions![0].isHit !== undefined, "TurnActionInfo에 isHit 플래그가 정상 포함되어야 함");
}

// 7. [고속이동 (Agility) 기술 구현 검증]
{
  const { saveService } = await import("../src/services/saveService.js");
  const testUserId = `test_agility_${Date.now()}`;
  saveService.startNewRun(testUserId, 1, "pikachu");
  const battle = battleService.getOrCreateBattle(testUserId, 1);
  battle.playerParty[0].moves = ["agility"];
  battle.playerBattleMon.moves = ["agility"];
  battle.playerParty[0].maxHp = 9999;
  battle.playerParty[0].currentHp = 9999;
  battle.playerBattleMon.maxHp = 9999;
  battle.playerBattleMon.currentHp = 9999;

  // 초기 상태: 스피드 0랭크
  assert(battle.playerBattleMon.stages.spe === 0, "초기 스피드 랭크는 0이어야 함");

  // 1회 사용: 0 ➔ +2랭크
  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  const t1 = battleService.executePlayerMove(testUserId, 1, "agility", "ko");
  console.log(`   ➔ 고속이동 1회 사용 후 스피드 랭크: ${t1.playerBattleMon.stages.spe}`);
  assert(t1.playerBattleMon.stages.spe === 2, "고속이동 1회 사용 시 스피드가 2랭크 상승해야 함 (+2)");

  // 2회 사용: +2 ➔ +4랭크
  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  const t2 = battleService.executePlayerMove(testUserId, 1, "agility", "ko");
  assert(t2.playerBattleMon.stages.spe === 4, "고속이동 2회 사용 시 스피드가 4랭크여야 함 (+4)");

  // 3회 사용: +4 ➔ +6랭크 (상한 도달)
  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  const t3 = battleService.executePlayerMove(testUserId, 1, "agility", "ko");
  assert(t3.playerBattleMon.stages.spe === 6, "고속이동 3회 사용 시 스피드가 최대치인 6랭크에 도달해야 함 (+6)");

  // 4회 사용: 6랭크 유지 및 상한 로그 출력
  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  const t4 = battleService.executePlayerMove(testUserId, 1, "agility", "ko");
  assert(t4.playerBattleMon.stages.spe === 6, "스피드 6랭크 초과 시 6랭크로 유지되어야 함 (상한 보호)");
  const allLogs = [...(t4.lastTurnLogs || []), ...(t4.turnActions?.map(a => a.log) || [])];
  const hasMaxLog = allLogs.some(l => l.includes("더 이상") || l.includes("won't go any higher") || l.includes("스피드"));
  assert(Boolean(hasMaxLog), "스피드 6랭크 상한 시 능력치가 더 오르지 않는다는 로그가 포함되어야 함");
}

// 8. [HP회복 (Recover) 기술 구현 검증]
{
  const { saveService } = await import("../src/services/saveService.js");
  const testUserId = `test_recover_${Date.now()}`;
  saveService.createNewRunWithParty(testUserId, 1, [
    {
      speciesId: "pikachu",
      name: "Pikachu",
      level: 5,
      hp: 5,
      maxHp: 20,
      moves: ["recover"],
    }
  ]);

  const battle = battleService.getOrCreateBattle(testUserId, 1);
  // 상대 포켓몬을 수면 상태로 설정하여 반격 피해 배제
  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;

  // 1회 사용: 50% 회복 (5 + 10 = 15 HP)
  const t1 = battleService.executePlayerMove(testUserId, 1, "recover", "ko");
  console.log(`   ➔ HP회복 1회 사용 후 HP: ${t1.playerBattleMon.hp}/${t1.playerBattleMon.maxHp}`);
  assert(t1.playerBattleMon.hp === 15, "HP회복 1회 사용 시 최대 HP의 50%(10)가 회복되어야 함 (5 -> 15)");

  // 2회 사용: 15 -> 20 HP (남은 5만 회복되어 최대치 20 도달)
  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  const t2 = battleService.executePlayerMove(testUserId, 1, "recover", "ko");
  console.log(`   ➔ HP회복 2회 사용 후 HP: ${t2.playerBattleMon.hp}/${t2.playerBattleMon.maxHp}`);
  assert(t2.playerBattleMon.hp === 20, "HP회복 2회 사용 시 최대 HP(20)까지만 회복되어야 함");

  // 3회 사용: 이미 만피인 경우 실패 로그 확인
  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  const t3 = battleService.executePlayerMove(testUserId, 1, "recover", "ko");
  assert(t3.playerBattleMon.hp === 20, "HP가 가득 찬 상태에서는 HP가 20으로 유지되어야 함");
  const allLogs3 = [...(t3.lastTurnLogs || []), ...(t3.turnActions?.map(a => a.log) || [])];
  const hasFullLog = allLogs3.some(l => l.includes("가득") || l.includes("already full") || l.includes("실패"));
  assert(Boolean(hasFullLog), "HP가 가득 찼을 때 회복 실패 메시지가 정상 출력되어야 함");
}

// 9. [작아지기(Minimize) 회피율 2랭크 상승 검증]
{
  const { saveService } = await import("../src/services/saveService.js");
  const testUserId = `test_minimize_${Date.now()}`;
  saveService.createNewRunWithParty(testUserId, 1, [
    {
      speciesId: "clefairy",
      name: "Clefairy",
      level: 10,
      hp: 30,
      maxHp: 30,
      moves: ["minimize"],
    }
  ]);

  const battle = battleService.getOrCreateBattle(testUserId, 1);
  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  battle.playerBattleMon.stages.eva = 0;

  const t1 = battleService.executePlayerMove(testUserId, 1, "minimize", "ko");
  console.log(`   ➔ 작아지기 1회 사용 후 회피율 랭크: ${t1.playerBattleMon.stages.eva}`);
  assert(t1.playerBattleMon.stages.eva === 2, "작아지기 1회 사용 시 회피율이 2랭크 상승해야 함 (+2)");

  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  const t2 = battleService.executePlayerMove(testUserId, 1, "minimize", "ko");
  console.log(`   ➔ 작아지기 2회 사용 후 회피율 랭크: ${t2.playerBattleMon.stages.eva}`);
  assert(t2.playerBattleMon.stages.eva === 4, "작아지기 2회 사용 시 회피율이 4랭크여야 함 (+4)");

  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  const t3 = battleService.executePlayerMove(testUserId, 1, "minimize", "ko");
  console.log(`   ➔ 작아지기 3회 사용 후 회피율 랭크: ${t3.playerBattleMon.stages.eva}`);
  assert(t3.playerBattleMon.stages.eva === 6, "작아지기 3회 사용 시 최대 6랭크에 도달해야 함 (+6)");

  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  const t4 = battleService.executePlayerMove(testUserId, 1, "minimize", "ko");
  assert(t4.playerBattleMon.stages.eva === 6, "작아지기 6랭크 초과 시 6랭크로 유지되어야 함 (상한 보호)");

  // 회피율 2랭크 상태에서 상대 몸통박치기(100% 명중기) 회피율 실측 시뮬레이션 (기대치: 3/5 = 60% 명중)
  const tackle = getMoveData("tackle")!;
  const attacker = battleService.spawnWildPokemon(1, "Town", "rattata", 20);
  const targetWithEva2 = battleService.spawnWildPokemon(1, "Town", "clefairy", 20);
  targetWithEva2.stages.eva = 2;

  let hits = 0;
  const trials = 1000;
  for (let i = 0; i < trials; i++) {
    const res = checkMoveHit({ actor: attacker, target: targetWithEva2, move: tackle });
    if (res.isHit) hits++;
  }
  const hitRate = (hits / trials) * 100;
  console.log(`   ➔ 작아지기 1회(+2랭크) 적용 대상에게 몸통박치기(100% 명중) 명중률: ${hitRate.toFixed(1)}% (기대치: 약 60%)`);
  assert(hitRate >= 52 && hitRate <= 68, "작아지기 1회 사용(+2 회피율) 시 100% 명중 기술도 약 60%로 명중률이 감소해야 함");
}

// 10. [연막(Smokescreen) 상대 명중률 1랭크 하락 검증]
{
  const { saveService } = await import("../src/services/saveService.js");
  const testUserId = `test_smokescreen_${Date.now()}`;
  saveService.createNewRunWithParty(testUserId, 1, [
    {
      speciesId: "koffing",
      name: "Koffing",
      level: 10,
      hp: 30,
      maxHp: 30,
      moves: ["smokescreen"],
    }
  ]);

  const battle = battleService.getOrCreateBattle(testUserId, 1);
  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  battle.enemy.stages.acc = 0;

  const t1 = battleService.executePlayerMove(testUserId, 1, "smokescreen", "ko");
  console.log(`   ➔ 연막 1회 사용 후 상대 명중률 랭크: ${battle.enemy.stages.acc}`);
  assert(battle.enemy.stages.acc === -1, "연막 1회 사용 시 상대 명중률이 1랭크 하락해야 함 (-1)");

  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  const t2 = battleService.executePlayerMove(testUserId, 1, "smokescreen", "ko");
  console.log(`   ➔ 연막 2회 사용 후 상대 명중률 랭크: ${battle.enemy.stages.acc}`);
  assert(battle.enemy.stages.acc === -2, "연막 2회 사용 시 상대 명중률이 -2랭크여야 함 (-2)");

  for (let i = 0; i < 4; i++) {
    battle.enemy.status = "slp";
    battle.enemy.sleepTurns = 10;
    battleService.executePlayerMove(testUserId, 1, "smokescreen", "ko");
  }
  console.log(`   ➔ 연막 6회 사용 후 상대 명중률 랭크: ${battle.enemy.stages.acc}`);
  assert(battle.enemy.stages.acc === -6, "연막 6회 사용 시 최소 -6랭크에 도달해야 함 (-6)");

  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  battleService.executePlayerMove(testUserId, 1, "smokescreen", "ko");
  assert(battle.enemy.stages.acc === -6, "연막 -6랭크 초과 감소 시 -6랭크로 유지되어야 함 (하한 보호)");

  // 명중률 -1랭크 상태에서 몸통박치기(100% 명중기) 명중률 실측 시뮬레이션 (본가 기대치: 3/4 = 75% 명중)
  const tackle = getMoveData("tackle")!;
  const attackerWithAccMinus1 = battleService.spawnWildPokemon(1, "Town", "koffing", 20);
  attackerWithAccMinus1.stages.acc = -1;
  const targetNeutral = battleService.spawnWildPokemon(1, "Town", "rattata", 20);

  let hits = 0;
  const trials = 1000;
  for (let i = 0; i < trials; i++) {
    const res = checkMoveHit({ actor: attackerWithAccMinus1, target: targetNeutral, move: tackle });
    if (res.isHit) hits++;
  }
  const hitRate = (hits / trials) * 100;
  console.log(`   ➔ 명중률 -1랭크 상태에서 몸통박치기(100% 명중) 명중률: ${hitRate.toFixed(1)}% (기대치: 약 75%)`);
  assert(hitRate >= 68 && hitRate <= 82, "명중률 -1랭크 시 100% 명중 기술도 약 75%로 명중률이 감소해야 함");
}

// 11. [이상한빛(Confuse Ray) 메커니즘 검증]
{
  const { saveService } = await import("../src/services/saveService.js");
  const testUserId = `test_confuse_ray_${Date.now()}`;
  saveService.createNewRunWithParty(testUserId, 1, [
    {
      speciesId: "gastly",
      name: "Gastly",
      level: 10,
      hp: 30,
      maxHp: 30,
      moves: ["confuse-ray"],
    }
  ]);

  const battle = battleService.getOrCreateBattle(testUserId, 1);
  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  battle.enemy.isConfused = false;
  battle.enemy.confusionTurns = 0;

  const t1 = battleService.executePlayerMove(testUserId, 1, "confuse-ray", "ko");
  console.log(`   ➔ 이상한빛 1회 사용 후 상대 혼란 여부: ${battle.enemy.isConfused}, 지속 턴: ${battle.enemy.confusionTurns}`);
  assert(Boolean(battle.enemy.isConfused), "이상한빛 1회 사용 시 상대방이 혼란에 걸려야 함");
  assert((battle.enemy.confusionTurns || 0) >= 2, "이상한빛 적중 시 혼란 지속 턴은 최소 2턴 이상이어야 함");

  // 이미 혼란 상태인 경우 중복 적용 방지
  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  const t2 = battleService.executePlayerMove(testUserId, 1, "confuse-ray", "ko");
  const allLogs2 = [...(t2.lastTurnLogs || []), ...(t2.turnActions?.map(a => a.log) || [])];
  const hasAlreadyConfusedLog = allLogs2.some(l => l.includes("이미") || l.includes("already"));
  assert(Boolean(hasAlreadyConfusedLog), "이미 혼란 상태인 대상에게 사용 시 중복 적용 방지 및 안내 메시지 출력");

  // 혼란 상태에서 행동 시 33% 확률로 자해 데미지 발생 검증 (1,000회 시뮬레이션: 기대치 약 33%)
  const { validateAction } = await import("../src/battle/mechanics/actionValidator.js");
  const tackle = getMoveData("tackle")!;
  const testMon = battleService.spawnWildPokemon(1, "Town", "rattata", 20);

  let selfDmgCount = 0;
  const trials = 1000;
  for (let i = 0; i < trials; i++) {
    testMon.isConfused = true;
    testMon.confusionTurns = 10;
    const res = validateAction(testMon, tackle, "꼬렛", "몸통박치기", true);
    if (!res.canAct && res.selfDamage) {
      selfDmgCount++;
    }
  }
  const selfDmgRate = (selfDmgCount / trials) * 100;
  console.log(`   ➔ 혼란 상태 행동 시 자해 확률: ${selfDmgRate.toFixed(1)}% (기대치: 약 33.3%)`);
  assert(selfDmgRate >= 27 && selfDmgRate <= 40, "혼란 상태 포켓몬은 약 33% 확률로 자해해야 함");
}

// 12. [껍질에숨기(Withdraw) 방어 1랭크 상승 검증]
{
  const { saveService } = await import("../src/services/saveService.js");
  const testUserId = `test_withdraw_${Date.now()}`;
  saveService.createNewRunWithParty(testUserId, 1, [
    {
      speciesId: "squirtle",
      name: "Squirtle",
      level: 10,
      hp: 30,
      maxHp: 30,
      moves: ["withdraw"],
    }
  ]);

  const battle = battleService.getOrCreateBattle(testUserId, 1);
  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  battle.playerBattleMon.stages.def = 0;

  const t1 = battleService.executePlayerMove(testUserId, 1, "withdraw", "ko");
  console.log(`   ➔ 껍질에숨기 1회 사용 후 방어 랭크: ${t1.playerBattleMon.stages.def}`);
  assert(t1.playerBattleMon.stages.def === 1, "껍질에숨기 1회 사용 시 방어가 1랭크 상승해야 함 (+1)");

  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  const t2 = battleService.executePlayerMove(testUserId, 1, "withdraw", "ko");
  console.log(`   ➔ 껍질에숨기 2회 사용 후 방어 랭크: ${t2.playerBattleMon.stages.def}`);
  assert(t2.playerBattleMon.stages.def === 2, "껍질에숨기 2회 사용 시 방어가 2랭크여야 함 (+2)");

  for (let i = 0; i < 4; i++) {
    battle.enemy.status = "slp";
    battle.enemy.sleepTurns = 10;
    battleService.executePlayerMove(testUserId, 1, "withdraw", "ko");
  }
  console.log(`   ➔ 껍질에숨기 6회 사용 후 방어 랭크: ${battle.playerBattleMon.stages.def}`);
  assert(battle.playerBattleMon.stages.def === 6, "껍질에숨기 6회 사용 시 최대 6랭크에 도달해야 함 (+6)");

  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  const t7 = battleService.executePlayerMove(testUserId, 1, "withdraw", "ko");
  assert(t7.playerBattleMon.stages.def === 6, "껍질에숨기 6랭크 초과 시 6랭크로 유지되어야 함 (상한 보호)");
}

// 13. [웅크리기(Defense Curl) 방어 1랭크 상승 및 연계 플래그 검증]
{
  const { saveService } = await import("../src/services/saveService.js");
  const testUserId = `test_defense_curl_${Date.now()}`;
  saveService.createNewRunWithParty(testUserId, 1, [
    {
      speciesId: "jigglypuff",
      name: "Jigglypuff",
      level: 10,
      hp: 50,
      maxHp: 50,
      moves: ["defense-curl"],
    }
  ]);

  const battle = battleService.getOrCreateBattle(testUserId, 1);
  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  battle.playerBattleMon.stages.def = 0;

  const t1 = battleService.executePlayerMove(testUserId, 1, "defense-curl", "ko");
  console.log(`   ➔ 웅크리기 1회 사용 후 방어 랭크: ${t1.playerBattleMon.stages.def}`);
  assert(t1.playerBattleMon.stages.def === 1, "웅크리기 1회 사용 시 방어가 1랭크 상승해야 함 (+1)");
  assert((t1.playerBattleMon as any).defenseCurlUsed === true, "웅크리기 사용 시 구르기/아이스볼 2배 연계 플래그(defenseCurlUsed)가 활성화되어야 함");

  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  const t2 = battleService.executePlayerMove(testUserId, 1, "defense-curl", "ko");
  console.log(`   ➔ 웅크리기 2회 사용 후 방어 랭크: ${t2.playerBattleMon.stages.def}`);
  assert(t2.playerBattleMon.stages.def === 2, "웅크리기 2회 사용 시 방어가 2랭크여야 함 (+2)");

  for (let i = 0; i < 4; i++) {
    battle.enemy.status = "slp";
    battle.enemy.sleepTurns = 10;
    battleService.executePlayerMove(testUserId, 1, "defense-curl", "ko");
  }
  console.log(`   ➔ 웅크리기 6회 사용 후 방어 랭크: ${battle.playerBattleMon.stages.def}`);
  assert(battle.playerBattleMon.stages.def === 6, "웅크리기 6회 사용 시 최대 6랭크에 도달해야 함 (+6)");

  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  const t7 = battleService.executePlayerMove(testUserId, 1, "defense-curl", "ko");
  assert(t7.playerBattleMon.stages.def === 6, "웅크리기 6랭크 초과 시 6랭크로 유지되어야 함 (상한 보호)");
}

// 14. [배리어(Barrier) 방어 2랭크 상승 검증]
{
  const { saveService } = await import("../src/services/saveService.js");
  const testUserId = `test_barrier_${Date.now()}`;
  saveService.createNewRunWithParty(testUserId, 1, [
    {
      speciesId: "mr-mime",
      name: "Mr-Mime",
      level: 15,
      hp: 50,
      maxHp: 50,
      moves: ["barrier"],
    }
  ]);

  const battle = battleService.getOrCreateBattle(testUserId, 1);
  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  battle.playerBattleMon.stages.def = 0;

  const t1 = battleService.executePlayerMove(testUserId, 1, "barrier", "ko");
  console.log(`   ➔ 배리어 1회 사용 후 방어 랭크: ${t1.playerBattleMon.stages.def}`);
  assert(t1.playerBattleMon.stages.def === 2, "배리어 1회 사용 시 방어가 2랭크 상승해야 함 (+2)");

  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  const t2 = battleService.executePlayerMove(testUserId, 1, "barrier", "ko");
  console.log(`   ➔ 배리어 2회 사용 후 방어 랭크: ${t2.playerBattleMon.stages.def}`);
  assert(t2.playerBattleMon.stages.def === 4, "배리어 2회 사용 시 방어가 4랭크여야 함 (+4)");

  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  const t3 = battleService.executePlayerMove(testUserId, 1, "barrier", "ko");
  console.log(`   ➔ 배리어 3회 사용 후 방어 랭크: ${t3.playerBattleMon.stages.def}`);
  assert(t3.playerBattleMon.stages.def === 6, "배리어 3회 사용 시 최대 6랭크에 도달해야 함 (+6)");

  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  const t4 = battleService.executePlayerMove(testUserId, 1, "barrier", "ko");
  assert(t4.playerBattleMon.stages.def === 6, "배리어 6랭크 초과 시 6랭크로 유지되어야 함 (상한 보호)");
}

// 18. [따라하기 (Mirror Move) 검증] 상대방이 직전에 사용한 기술을 즉시 흉내내어 발동
{
  const { saveService } = await import("../src/services/saveService.js");
  const testUserId = `test_mirror_move_${Date.now()}`;
  saveService.createNewRunWithParty(testUserId, 1, [
    {
      speciesId: "pidgey",
      name: "구구",
      level: 50,
      hp: 150,
      maxHp: 150,
      moves: ["mirror-move"],
    }
  ]);

  const battle = battleService.getOrCreateBattle(testUserId, 1);
  battle.enemy.lastMoveUsed = "flamethrower";
  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  const initialEnemyHp = battle.enemy.hp;

  const result = battleService.executePlayerMove(testUserId, 1, "mirror-move", "ko");
  console.log(`   ➔ 상대 직전 기술 화염방사 ➔ 따라하기 발동 후 적 HP: ${result.enemy.hp}/${initialEnemyHp}`);
  assert(result.enemy.hp < initialEnemyHp, "따라하기는 상대의 직전 기술(화염방사)을 복사하여 적에게 데미지를 주어야 함");
  assert(result.turnActions?.some(a => a.log.includes("흉내 냈다") || a.log.includes("화염방사") || a.moveKey === "flamethrower" || a.copiedMoveKey === "flamethrower") ?? false, "배틀 로그에 따라하기/복사 기술 발동이 기록되어야 함");
}

// 19. [기충전 (Focus Energy) 검증] 급소율 상승 상태 부여 및 중복 사용 방지
{
  const { saveService } = await import("../src/services/saveService.js");
  const testUserId = `test_focus_energy_${Date.now()}`;
  saveService.createNewRunWithParty(testUserId, 1, [
    {
      speciesId: "machop",
      name: "알통몬",
      level: 50,
      hp: 150,
      maxHp: 150,
      moves: ["focus-energy"],
    }
  ]);

  const battle = battleService.getOrCreateBattle(testUserId, 1);
  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;

  const r1 = battleService.executePlayerMove(testUserId, 1, "focus-energy", "ko");
  console.log(`   ➔ 기충전 1회 사용 후 hasFocusEnergy: ${r1.playerBattleMon.hasFocusEnergy}`);
  assert(r1.playerBattleMon.hasFocusEnergy === true, "기충전 사용 시 hasFocusEnergy 플래그가 true가 되어야 함");
  assert(r1.turnActions?.some(a => a.log.includes("기운을 집중했다") || a.log.includes("급소율")) ?? false, "기운 집중 로그가 출력되어야 함");

  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  const r2 = battleService.executePlayerMove(testUserId, 1, "focus-energy", "ko");
  assert(r2.turnActions?.some(a => a.log.includes("이미 기운을 모아") || a.log.includes("효과가 없었다")) ?? false, "기충전 중복 사용 시 이미 기운을 모아 효과가 없어야 함");
}

// 20. [참기 (Bide) 검증] 1턴 축적 시작 및 2턴 데미지 2배 방출
{
  const { saveService } = await import("../src/services/saveService.js");
  const testUserId = `test_bide_${Date.now()}`;
  saveService.createNewRunWithParty(testUserId, 1, [
    {
      speciesId: "geodude",
      name: "꼬마돌",
      level: 50,
      hp: 150,
      maxHp: 150,
      moves: ["bide"],
    }
  ]);

  const battle = battleService.getOrCreateBattle(testUserId, 1);
  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;

  // 1턴: 참기 시작
  const t1 = battleService.executePlayerMove(testUserId, 1, "bide", "ko");
  console.log(`   ➔ 참기 1턴 충전 상태: ${t1.playerBattleMon.chargingMove}`);
  assert(t1.playerBattleMon.chargingMove === "bide", "1턴에 chargingMove가 bide로 설정되어야 함");
  assert(t1.turnActions?.some(a => a.log.includes("참기를 시작했다")) ?? false, "1턴 참기 시작 로그가 출력되어야 함");

  // 상대에게 30 데미지를 받았다고 가정
  t1.playerBattleMon.bideDamageTaken = 30;

  // 2턴: 참기 방출 (2배 피해 = 60)
  const initialEnemyHp = t1.enemy.hp;
  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  const t2 = battleService.executePlayerMove(testUserId, 1, "bide", "ko");
  console.log(`   ➔ 참기 2턴 방출 후 적 HP: ${t2.enemy.hp}/${initialEnemyHp}`);
  assert(t2.enemy.hp < initialEnemyHp, "참기 2턴에 축적된 데미지를 방출하여 상대에게 큰 피해를 주어야 함");
  assert(t2.playerBattleMon.chargingMove === null, "방출 후 chargingMove가 null로 해제되어야 함");
  assert(t2.turnActions?.some(a => a.log.includes("참아낸 데미지를 방출했다") || a.log.includes("2배")) ?? false, "참기 방출 로그가 출력되어야 함");
}

// 21. [손가락흔들기 (Metronome) 검증] 무작위 기술 발동 및 복제 키 전달
{
  const { saveService } = await import("../src/services/saveService.js");
  const testUserId = `test_metronome_${Date.now()}`;
  saveService.createNewRunWithParty(testUserId, 1, [
    {
      speciesId: "clefairy",
      name: "삐삐",
      level: 100,
      hp: 150,
      maxHp: 150,
      moves: ["metronome"],
    }
  ]);

  const battle = battleService.getOrCreateBattle(testUserId, 1);
  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;

  const result = battleService.executePlayerMove(testUserId, 1, "metronome", "ko");
  const metronomeAct = result.turnActions?.find(a => a.moveKey === "metronome");
  console.log(`   ➔ 손가락흔들기 발동 결과 로그:`, metronomeAct?.log?.replace(/\n/g, " / "));
  assert(metronomeAct !== undefined && metronomeAct.log.includes("손가락흔들기") && metronomeAct.log.includes("손가락을 흔들어"), "손가락흔들기 발동 로그가 정상 기록되어야 함");
  assert(metronomeAct?.copiedMoveKey !== undefined, "손가락흔들기가 추첨한 기술 키가 copiedMoveKey로 전달되어야 함");
}

// 22. [자폭 (Self-Destruct) 검증] 상대에게 200 위력 데미지 전달 및 시전자 자폭 사망 (HP 0)
{
  const { saveService } = await import("../src/services/saveService.js");
  const testUserId = `test_selfdestruct_${Date.now()}`;
  saveService.createNewRunWithParty(testUserId, 1, [
    {
      speciesId: "geodude",
      name: "꼬마돌",
      level: 50,
      hp: 150,
      maxHp: 150,
      moves: ["self-destruct"],
    }
  ]);

  const battle = battleService.getOrCreateBattle(testUserId, 1);
  battle.enemy.hp = 150;
  battle.enemy.maxHp = 150;
  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;

  const result = battleService.executePlayerMove(testUserId, 1, "self-destruct", "ko");
  console.log(`   ➔ 자폭 사용 후 시전자 HP: ${result.playerBattleMon.hp}, 적 HP: ${result.enemy.hp}`);
  assert(result.playerBattleMon.hp === 0, "자폭 사용 후 시전자의 HP는 0이 되어 쓰러져야 함");
  assert(result.enemy.hp < 150, "상대방은 자폭으로 인해 데미지를 입어야 함");
  assert(result.turnActions?.some(a => a.log.includes("자폭") || a.log.includes("폭발하여 스스로 쓰러졌다")) ?? false, "자폭 및 자폭 사망 로그가 정상 출력되어야 함");
}

// 23. [자폭 (Self-Destruct) 습기(Damp) 특성 방어 검증]
{
  const { saveService } = await import("../src/services/saveService.js");
  const testUserId = `test_selfdestruct_damp_${Date.now()}`;
  saveService.createNewRunWithParty(testUserId, 1, [
    {
      speciesId: "geodude",
      name: "꼬마돌",
      level: 50,
      hp: 150,
      maxHp: 150,
      moves: ["self-destruct"],
    }
  ]);

  const battle = battleService.getOrCreateBattle(testUserId, 1);
  battle.enemy.hp = 150;
  battle.enemy.maxHp = 150;
  battle.enemy.ability = "damp"; // 습기 특성
  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;

  const result = battleService.executePlayerMove(testUserId, 1, "self-destruct", "ko");
  console.log(`   ➔ 습기 특성 상대에게 자폭 사용 후 시전자 HP: ${result.playerBattleMon.hp}, 적 HP: ${result.enemy.hp}`);
  assert(result.playerBattleMon.hp === 150, "습기 특성에 의해 자폭이 불발되면 시전자 HP는 보존되어야 함 (HP 150)");
  assert(result.enemy.hp === 150, "습기 특성에 의해 상대방도 피해를 입지 않아야 함 (HP 150)");
  assert(result.turnActions?.some(a => a.log.includes("습기") || a.log.includes("Damp")) ?? false, "습기 특성으로 인해 기술을 쓸 수 없다는 로그가 출력되어야 함");
}

// 24. [자폭 (Self-Destruct) 방어(Protect) 상대로 자폭 시전자 쓰러짐 검증]
{
  const { saveService } = await import("../src/services/saveService.js");
  const testUserId = `test_selfdestruct_protect_${Date.now()}`;
  saveService.createNewRunWithParty(testUserId, 1, [
    {
      speciesId: "geodude",
      name: "꼬마돌",
      level: 50,
      hp: 150,
      maxHp: 150,
      moves: ["self-destruct"],
    }
  ]);

  const battle = battleService.getOrCreateBattle(testUserId, 1);
  battle.enemy.hp = 150;
  battle.enemy.maxHp = 150;
  battle.enemy.moves = ["protect"]; // 방어 기술 (우선도 +4로 선공하여 방어 상태 돌입)
  battle.enemy.status = null;

  const result = battleService.executePlayerMove(testUserId, 1, "self-destruct", "ko");
  console.log(`   ➔ 방어 상태 상대에게 자폭 사용 후 시전자 HP: ${result.playerBattleMon.hp}, 적 HP: ${result.enemy.hp}`);
  assert(result.playerBattleMon.hp === 0, "상대가 방어 상태여도 자폭 시전자는 폭발하여 사망해야 함 (HP 0)");
  assert(result.enemy.hp === 150, "상대는 방어하여 피해를 입지 않아야 함 (HP 150)");
  assert(result.turnActions?.some(a => a.log.includes("폭발하여 스스로 쓰러졌다")) ?? false, "자폭 사망 로그가 정상 출력되어야 함");
}

// 25. [자폭 (Self-Destruct) 고스트 무효 상대로 자폭 시전자 쓰러짐 검증]
{
  const { saveService } = await import("../src/services/saveService.js");
  const testUserId = `test_selfdestruct_ghost_${Date.now()}`;
  saveService.createNewRunWithParty(testUserId, 1, [
    {
      speciesId: "geodude",
      name: "꼬마돌",
      level: 50,
      hp: 150,
      maxHp: 150,
      moves: ["self-destruct"],
    }
  ]);

  const battle = battleService.getOrCreateBattle(testUserId, 1);
  battle.enemy.types = ["ghost"]; // 고스트 타입 (노말 무효)
  battle.enemy.hp = 150;
  battle.enemy.maxHp = 150;
  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;

  const result = battleService.executePlayerMove(testUserId, 1, "self-destruct", "ko");
  console.log(`   ➔ 고스트 상대에게 자폭 사용 후 시전자 HP: ${result.playerBattleMon.hp}, 적 HP: ${result.enemy.hp}`);
  assert(result.playerBattleMon.hp === 0, "상대가 고스트 타입(무효)이어도 자폭 시전자는 폭발하여 사망해야 함 (HP 0)");
  assert(result.enemy.hp === 150, "고스트 타입 상대는 노말 무효로 피해를 입지 않아야 함 (HP 150)");
  assert(result.turnActions?.some(a => a.log.includes("폭발하여 스스로 쓰러졌다")) ?? false, "자폭 사망 로그가 정상 출력되어야 함");
}

// 26. [알폭탄 (Egg Bomb) 위력 100 노말 물리 공격 메커니즘 검증]
{
  const { saveService } = await import("../src/services/saveService.js");
  const testUserId = `test_eggbomb_${Date.now()}`;
  saveService.createNewRunWithParty(testUserId, 1, [
    {
      speciesId: "exeggutor",
      name: "나시",
      level: 50,
      hp: 180,
      maxHp: 180,
      moves: ["egg-bomb"],
    }
  ]);

  const battle = battleService.getOrCreateBattle(testUserId, 1);
  battle.enemy.hp = 200;
  battle.enemy.maxHp = 200;
  battle.enemy.types = ["normal"];
  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  battle.playerBattleMon.stages.acc = 6; // 명중률 보정으로 적중 확정

  const result = battleService.executePlayerMove(testUserId, 1, "egg-bomb", "ko");
  console.log(`   ➔ 알폭탄 피격 후 적 HP: ${result.enemy.hp}/${result.enemy.maxHp}, 시전자 HP: ${result.playerBattleMon.hp}`);
  assert(result.playerBattleMon.hp === 180, "알폭탄은 자폭과 달리 시전자가 사망하지 않고 생존해야 함");
  assert(result.enemy.hp < 200, "알폭탄(위력 100)으로 인해 상대방이 큰 물리 피해를 입어야 함");
  assert(result.turnActions?.some(a => a.log.includes("알폭탄")) ?? false, "알폭탄 배틀 로그가 정상 기록되어야 함");

  // 고스트 무효 검증
  battle.enemy.types = ["ghost"];
  battle.enemy.hp = 200;
  battle.enemy.maxHp = 200;
  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  const resultGhost = battleService.executePlayerMove(testUserId, 1, "egg-bomb", "ko");
  console.log(`   ➔ 고스트 상대에게 알폭탄 사용 후 적 HP: ${resultGhost.enemy.hp}/${resultGhost.enemy.maxHp}`);
  assert(resultGhost.enemy.hp === 200, "고스트 타입 상대는 노말 물리 기술인 알폭탄에 무효화(피해 0)되어야 함");
}

console.log("==================================================");
console.log(`📊 테스트 결과: 통과 ${passed}개 / 실패 ${failed}개`);
console.log("==================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("🎉 모든 배틀 메커니즘 검증을 100% 통과했습니다!");
}
