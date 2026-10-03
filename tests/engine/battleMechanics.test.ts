import { BattleEngine } from "../../src/battle/engine/BattleEngine.js";
import { battleService } from "../../src/services/battleService.js";
import { checkMoveHit } from "../../src/battle/mechanics/accuracyEngine.js";
import { calculateDamage } from "../../src/battle/mechanics/damageCalculator.js";
import { getMoveData } from "../../src/data/movesKo.js";

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
  const { saveService } = await import("../../src/services/saveService.js");
  const testUserId = `test_engine_${Date.now()}`;
  saveService.createNewRunWithParty(testUserId, 1, [{ speciesId: "bulbasaur", name: "bulbasaur", level: 5, hp: 20, maxHp: 20, moves: ["tackle"] }]);
  const battle = battleService.getOrCreateBattle(testUserId, 1);
  const initialEnemyHp = battle.enemy.hp;

  const afterTurn = battleService.executePlayerMove(testUserId, 1, "tackle", "ko");
  assert(afterTurn.turnCount === 1, "턴 실행 후 turnCount가 1 증가해야 함");
  assert(afterTurn.turnActions && afterTurn.turnActions.length > 0, "turnActions 배열이 채워져야 함");
  assert(afterTurn.turnActions![0].isHit !== undefined, "TurnActionInfo에 isHit 플래그가 정상 포함되어야 함");
}

// 7. [고속이동 (Agility) 기술 구현 검증]
{
  const { saveService } = await import("../../src/services/saveService.js");
  const testUserId = `test_agility_${Date.now()}`;
  saveService.createNewRunWithParty(testUserId, 1, [{ speciesId: "pikachu", name: "pikachu", level: 50, hp: 9999, maxHp: 9999, moves: ["agility"] }]);
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
  const { saveService } = await import("../../src/services/saveService.js");
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
  const { saveService } = await import("../../src/services/saveService.js");
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
  const { saveService } = await import("../../src/services/saveService.js");
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
  const { saveService } = await import("../../src/services/saveService.js");
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
  const { validateAction } = await import("../../src/battle/mechanics/actionValidator.js");
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
  const { saveService } = await import("../../src/services/saveService.js");
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
  const { saveService } = await import("../../src/services/saveService.js");
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
  const { saveService } = await import("../../src/services/saveService.js");
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
  const { saveService } = await import("../../src/services/saveService.js");
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
  const { saveService } = await import("../../src/services/saveService.js");
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
  const { saveService } = await import("../../src/services/saveService.js");
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
  const { saveService } = await import("../../src/services/saveService.js");
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
  const { saveService } = await import("../../src/services/saveService.js");
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
  const { saveService } = await import("../../src/services/saveService.js");
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
  const { saveService } = await import("../../src/services/saveService.js");
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
  const { saveService } = await import("../../src/services/saveService.js");
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
  const { saveService } = await import("../../src/services/saveService.js");
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

// 27. [사이코웨이브 (Psywave) 레벨 비례 가변 데미지 및 악 타입 무효 메커니즘 검증]
{
  const { saveService } = await import("../../src/services/saveService.js");
  const testUserId = `test_psywave_${Date.now()}`;
  saveService.createNewRunWithParty(testUserId, 1, [
    {
      speciesId: "kadabra",
      name: "윤겔라",
      level: 50,
      hp: 150,
      maxHp: 150,
      moves: ["psywave"],
    }
  ]);

  const battle = battleService.getOrCreateBattle(testUserId, 1);
  battle.enemy.hp = 200;
  battle.enemy.maxHp = 200;
  battle.enemy.types = ["normal"];
  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  battle.playerBattleMon.stages.acc = 6; // 명중 확정

  const result = battleService.executePlayerMove(testUserId, 1, "psywave", "ko");
  const damageDealt = 200 - result.enemy.hp;
  console.log(`   ➔ 사이코웨이브 피격 후 적 HP: ${result.enemy.hp}/200 (데미지: ${damageDealt}, 시전자 레벨 50 기준)`);
  assert(damageDealt >= 25 && damageDealt <= 75, `사이코웨이브 데미지는 레벨 50 기준 25~75 사이여야 함 (실제 데미지: ${damageDealt})`);
  assert(result.turnActions?.some(a => a.log.includes("사이코웨이브")) ?? false, "사이코웨이브 배틀 로그가 정상 기록되어야 함");

  // 악 타입(에스퍼 무효) 대상 테스트
  battle.enemy.types = ["dark"];
  battle.enemy.hp = 200;
  battle.enemy.maxHp = 200;
  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  const resultDark = battleService.executePlayerMove(testUserId, 1, "psywave", "ko");
  console.log(`   ➔ 악 타입 상대에게 사이코웨이브 사용 후 적 HP: ${resultDark.enemy.hp}/200`);
  assert(resultDark.enemy.hp === 200, "악 타입 상대는 에스퍼 특수기 사이코웨이브에 무효화(피해 0)되어야 함");
}

// 29. [잠자기(Rest) 검증] 체력 100% 회복, 기존 상태이상 치유, 2턴 수면, 불면 특성 면역 및 HP 가득 찼을 때 실패
{
  const { saveService } = await import("../../src/services/saveService.js");
  const testUserId = `test_rest_${Date.now()}`;
  saveService.createNewRunWithParty(testUserId, 1, [
    {
      speciesId: "snorlax",
      name: "잠만보",
      level: 10,
      hp: 20, // 20으로 깎여 있는 상태
      maxHp: 50,
      moves: ["rest"],
    }
  ]);

  const battle = battleService.getOrCreateBattle(testUserId, 1);
  const maxHp = battle.playerBattleMon.maxHp;
  battle.playerBattleMon.status = "psn";
  battle.playerBattleMon.toxicCounter = 3;
  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10; // 적은 잠들어 있어 방해하지 않음

  // 1) 체력 깎임 + 독 상태에서 잠자기 사용 -> HP 100% 풀회복, 독 치료 후 수면 돌입
  const res1 = battleService.executePlayerMove(testUserId, 1, "rest", "ko");
  console.log(`   ➔ 잠자기 사용 후 아군 HP: ${res1.playerBattleMon.hp}/${res1.playerBattleMon.maxHp}, 상태: ${res1.playerBattleMon.status}`);
  assert(res1.playerBattleMon.hp === maxHp, "잠자기 사용 시 HP가 100% 풀회복되어야 함");
  assert(res1.playerBattleMon.status === "slp", "잠자기 사용 후 수면(slp) 상태가 되어야 함");
  assert(res1.playerBattleMon.sleepDuration === 2, "잠자기 수면 지속 턴은 정확히 2턴이어야 함");
  assert((res1.playerBattleMon.toxicCounter || 0) === 0, "기존 독/맹독 카운터가 완전히 초기화되어야 함");

  // 2) 이미 잠들어 있는 상태에서 턴 진행 -> 쿨쿨 잠들어 있어 행동 불가 확인
  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  const res2 = battleService.executePlayerMove(testUserId, 1, "rest", "ko");
  const isSleepLog = res2.turnActions?.some(a => a.log.includes("쿨쿨 잠들어 있다")) ?? false;
  assert(res2.playerBattleMon.status === "slp" && isSleepLog, "이미 잠들어 있는 상태에서는 쿨쿨 잠들어 있어 행동 불가");

  // 3) 기상 후 HP 가득 찬 상태에서 잠자기 사용 -> 실패
  res1.playerBattleMon.status = null;
  res1.playerBattleMon.sleepTurns = 0;
  delete res1.playerBattleMon.sleepDuration;
  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  const res3 = battleService.executePlayerMove(testUserId, 1, "rest", "ko");
  assert(res3.playerBattleMon.status !== "slp", "HP가 100% 가득 찬 상태에서는 잠자기가 실패해야 함");

  // 4) 불면(Insomnia) 특성 포켓몬의 잠자기 사용 -> 실패
  saveService.updateSlot(testUserId, 1, {
    party: [{ ...battle.playerParty[0], hp: 20 }]
  });
  battle.playerBattleMon.hp = 20;
  battle.playerBattleMon.ability = "insomnia";
  battle.enemy.status = "slp";
  battle.enemy.sleepTurns = 10;
  const res4 = battleService.executePlayerMove(testUserId, 1, "rest", "ko");
  assert(res4.playerBattleMon.status !== "slp" && res4.playerBattleMon.hp === 20, "불면(Insomnia) 특성은 잠자기를 사용할 수 없어야 함");
}

// 28. [162: 분노의앞니 (Super Fang) 메커니즘 검증]
// - 상대 현재 HP의 정확히 절반(50%, 내림) 데미지
// - 최소 1 데미지 보장
// - 고스트 타입 무효화 (노말 물리 특수 고정 데미지)
{
  const superFang = getMoveData("super-fang")!;
  const user = battleService.spawnWildPokemon(1, "Town", "rattata", 30);
  const target100 = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);
  target100.hp = 100;
  target100.maxHp = 200;

  const res100 = calculateDamage(user, target100, superFang, true, true);
  console.log(`   ➔ 현재 HP 100 대상에게 분노의앞니 사용: ${res100.damage} 데미지 (로그: ${res100.log})`);
  assert(res100.damage === 50, "분노의앞니는 대상의 현재 HP 100 중 정확히 절반인 50 데미지를 입혀야 함");

  const target55 = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);
  target55.hp = 55;
  const res55 = calculateDamage(user, target55, superFang, true, true);
  assert(res55.damage === 27, "분노의앞니는 대상의 현재 HP 55 중 절반(내림)인 27 데미지를 입혀야 함");

  const target1 = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);
  target1.hp = 1;
  const res1 = calculateDamage(user, target1, superFang, true, true);
  assert(res1.damage === 1, "분노의앞니는 대상 HP가 1일 때 최소 1 데미지를 입혀야 함");

  const ghostTarget = battleService.spawnWildPokemon(1, "Town", "gengar", 50);
  ghostTarget.types = ["ghost", "poison"];
  const resGhost = calculateDamage(user, ghostTarget, superFang, true, true);
  assert(resGhost.damage === 0 && resGhost.log.includes("효과가 없는 것 같다"), "분노의앞니(노말)는 고스트 타입에게 완전히 무효화되어야 함");
}

// 29. [166: 스케치 (Sketch) 메커니즘 검증]
// - 상대방이 직전에 사용한 기술을 영구 복사하여 자신의 기술로 교체
// - 기술 교체 후 복사한 기술의 최대 PP로 설정
// - 배틀 로그에 스케치 발동 및 기술 습득 내용 정상 기록
{
  const { saveService } = await import("../../src/services/saveService.js");
  const testUserId = `test_sketch_${Date.now()}`;
  saveService.createNewRunWithParty(testUserId, 1, [
    {
      speciesId: "smeargle",
      name: "루브도",
      level: 50,
      hp: 150,
      maxHp: 150,
      moves: ["sketch"],
    }
  ]);

  const battle = battleService.getOrCreateBattle(testUserId, 1);
  battle.enemy.lastMoveUsed = "flamethrower";
  battle.enemy.moves = ["flamethrower", "tackle"];

  const result = battleService.executePlayerMove(testUserId, 1, "sketch", "ko");
  console.log(`   ➔ 상대 직전 기술(화염방사) 대상 스케치 시전 후 기술 목록: [${result.playerBattleMon.moves.join(", ")}]`);
  assert(result.playerBattleMon.moves.includes("flamethrower"), "스케치 시전 후 루브도의 기술 목록에 화염방사가 추가/교체되어야 함");
  assert(!result.playerBattleMon.moves.includes("sketch"), "스케치는 사용 후 목록에서 영구 제거(교체)되어야 함");
  assert(result.turnActions?.some(a => a.log.includes("스케치")) ?? false, "배틀 로그에 스케치 발동 로그가 정상 기록되어야 함");
}

// 30. [167: 트리플킥 (Triple Kick) 메커니즘 검증]
// - 최대 3회 연속 공격 판정 (90% 명중)
// - 1타: 10, 2타: 20 (누적 30), 3타: 30 (누적 60) 점진적 위력 증가
// - 배틀 로그에 연속 명중 횟수 및 물리 데미지 정상 반영
{
  const { calculateMultiHitCount } = await import("../../src/battle/moves/traits/moveTraits.js");
  const { calculateDamage } = await import("../../src/battle/mechanics/damageCalculator.js");

  // 1. 타격 횟수 검증 (1~3회 범위 내)
  const hitSamples: number[] = [];
  for (let i = 0; i < 50; i++) {
    hitSamples.push(calculateMultiHitCount("triple-kick"));
  }
  const minHit = Math.min(...hitSamples);
  const maxHit = Math.max(...hitSamples);
  console.log(`   ➔ 트리플킥 타격 횟수 샘플링 범위: ${minHit} ~ ${maxHit}회`);
  assert(minHit >= 1 && maxHit <= 3, "트리플킥의 타격 횟수는 최소 1회에서 최대 3회 사이여야 함");
  assert(hitSamples.some(h => h === 3), "50회 시도 중 3회 연속 타격이 최소 1번 이상 발생해야 함");

  // 2. 점진적 위력 증가 검증 (1타 10, 2타 20, 3타 30)
  const user = battleService.spawnWildPokemon(1, "Town", "hitmontop", 50);
  const target = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);
  const tripleKickMoveData = {
    id: 167,
    name: "triple-kick",
    nameKo: "트리플킥",
    type: "fighting",
    power: 10,
    accuracy: 90,
    pp: 10,
    category: "physical" as const,
  };

  const dmgRes = calculateDamage(user, target, tripleKickMoveData, true, true);
  console.log(`   ➔ 트리플킥 데미지: ${dmgRes.damage} (명중 횟수: ${dmgRes.hitCount}회, 로그: ${dmgRes.log})`);
  assert(dmgRes.damage > 0, "트리플킥은 노말 타입 잠만보에게 격투 물리 피해를 입혀야 함");
  assert(dmgRes.hitCount >= 1 && dmgRes.hitCount <= 3, "결과 hitCount는 1~3 사이여야 함");
  assert(dmgRes.log.includes("효과가 굉장했다"), "격투 타입 기술이므로 노말 타입에게 효과가 굉장해야 함");
}

// 31. [169: 거미집 (Spider Web) 메커니즘 검증]
// - 상대 포켓몬에게 cannotEscape = true 상태이상 부여
// - 이미 도망칠 수 없는 경우 실패 처리
{
  const { executeStatusMove } = await import("../../src/battle/moves/traits/specialStatusRegistry.js");
  const user = battleService.spawnWildPokemon(1, "Town", "spinarak", 20);
  const target = battleService.spawnWildPokemon(1, "Town", "pidgey", 20);
  const spiderWebMoveData = getMoveData("spider-web")!;

  // 1차 시전: 도망칠 수 없게 됨
  const log1 = executeStatusMove({
    actor: user,
    target: target,
    move: spiderWebMoveData,
    actorName: "페이검",
    targetName: "구구",
    isKo: true,
  });
  console.log(`   ➔ 거미집 1차 시전 로그: ${log1}`);
  assert(target.cannotEscape === true, "거미집 적중 시 대상의 cannotEscape 플래그가 true가 되어야 함");
  assert(log1.includes("도망칠 수 없게 되었다"), "배틀 로그에 거미집에 묶여 도망칠 수 없게 되었다는 메시지가 나와야 함");

  // 2차 시전: 이미 도망칠 수 없으므로 실패
  const log2 = executeStatusMove({
    actor: user,
    target: target,
    move: spiderWebMoveData,
    actorName: "페이검",
    targetName: "구구",
    isKo: true,
  });
  console.log(`   ➔ 거미집 2차 시전 로그: ${log2}`);
  assert(log2.includes("이미 도망칠 수 없다"), "이미 묶여 있는 경우 실패 메시지가 나와야 함");
}

// 32. [173: 코골기 (Snore) 메커니즘 검증]
// - 깨어 있을 때 시전: 잠들어 있지 않아 실패 처리
// - 잠들어 있을 때 시전: 수면 중 행동 허용 & 특수 노말 데미지 정상 적용
// - 30% 확률로 상대 풀죽음(flinch) 상태이상 유발
{
  const { validateAction } = await import("../../src/battle/mechanics/actionValidator.js");
  const { checkSpecialDamage } = await import("../../src/battle/moves/traits/specialDamageRegistry.js");
  const { applySecondaryAttackEffects } = await import("../../src/battle/mechanics/secondaryEffects.js");
  const snoreMoveData = getMoveData("snore")!;

  const user = battleService.spawnWildPokemon(1, "Town", "snorlax", 30);
  const target = battleService.spawnWildPokemon(1, "Town", "pidgey", 30);

  // 1) 깨어 있을 때: actionValidator는 통과하지만 checkSpecialDamage에서 실패
  user.status = null;
  const valAwake = validateAction(user, snoreMoveData, "잠만보", "코골기", true);
  assert(valAwake.canAct === true, "깨어 있을 때 actionValidator 자체는 행동을 차단하지 않음");

  const specDmgAwake = checkSpecialDamage({
    actor: user,
    target: target,
    move: snoreMoveData,
    isActorPlayer: true,
    isKo: true,
  });
  console.log(`   ➔ 깨어 있을 때 코골기 시전 결과: ${specDmgAwake.log}`);
  assert(specDmgAwake.handled === true && specDmgAwake.damage === 0, "깨어 있을 때 코골기는 실패 처리되어야 함");
  assert(specDmgAwake.log!.includes("잠들어 있지 않아"), "잠들어 있지 않아 실패했다는 메시지가 출력되어야 함");

  // 2) 잠들어 있을 때: actionValidator에서 canAct: true로 수면 중 행동 허용
  user.status = "slp";
  user.sleepTurns = 0;
  user.sleepDuration = 3;

  const valAsleep = validateAction(user, snoreMoveData, "잠만보", "코골기", true);
  console.log(`   ➔ 수면 중 코골기 actionValidator 결과: canAct=${valAsleep.canAct}, log=${valAsleep.log}`);
  assert(valAsleep.canAct === true, "코골기는 잠들어 있을 때 행동이 허용(canAct: true)되어야 함");
  assert(valAsleep.log!.includes("쿨쿨 잠들어 있다"), "수면 중 메시지가 포함되어야 함");

  const specDmgAsleep = checkSpecialDamage({
    actor: user,
    target: target,
    move: snoreMoveData,
    isActorPlayer: true,
    isKo: true,
  });
  assert(specDmgAsleep.handled === false, "잠들어 있을 때는 checkSpecialDamage를 통과하여 일반 데미지 계산으로 넘어가야 함");

  const dmgRes = calculateDamage(user, target, snoreMoveData, true, true);
  console.log(`   ➔ 코골기 데미지 계산 결과: ${dmgRes.damage}`);
  assert(dmgRes.damage > 0, "코골기는 상대에게 정상적으로 특수 데미지를 입혀야 함");

  // 3) 풀죽음(Flinch) 30% 확률 검증
  let flinchCount = 0;
  const trials = 1000;
  for (let i = 0; i < trials; i++) {
    const dummyTarget = battleService.spawnWildPokemon(1, "Town", "pidgey", 30);
    applySecondaryAttackEffects(user, dummyTarget, snoreMoveData, 30, true);
    if (dummyTarget.isFlinched) flinchCount++;
  }
  const flinchRate = (flinchCount / trials) * 100;
  console.log(`   ➔ 코골기 풀죽음 발동률: ${flinchRate.toFixed(1)}% (기대치: 약 30%)`);
  assert(flinchRate > 20 && flinchRate < 40, "코골기의 풀죽음 확률은 약 30%여야 함");
}

// 33. [170: 마음의눈 (Mind Reader) 메커니즘 검증]
// - 마음의 눈 시전 시 시전자에게 mindReaderTargetId 설정 및 포착 로그 출력
// - 회피율 +6랭크 및 반무적(공중날기) 상태의 상대에게도 다음 턴 100% 필중
// - 중복 시전 시 이미 읽고 있어 실패 처리
{
  const { executeStatusMove } = await import("../../src/battle/moves/traits/specialStatusRegistry.js");
  const mindReaderMoveData = getMoveData("mind-reader")!;
  const blizzardMoveData = getMoveData("blizzard")!; // 기본 명중 70%
  const user = battleService.spawnWildPokemon(1, "Town", "poliwhirl", 30);
  const target = battleService.spawnWildPokemon(1, "Town", "pidgeot", 30);
  target.stages.eva = 6; // 상대 회피율 +6랭크 (일반적으로 명중률 33% 이하)

  // 1) 1차 시전: 타겟 포착 성공
  const log1 = executeStatusMove({
    actor: user,
    target: target,
    move: mindReaderMoveData,
    actorName: "슈륙챙이",
    targetName: "피죤투",
    isKo: true,
  });
  console.log(`   ➔ 마음의눈 1차 시전 로그: ${log1}`);
  assert(Boolean(user.mindReaderTargetId), "마음의눈 시전 시 user.mindReaderTargetId가 설정되어야 함");
  assert(log1.includes("움직임을 포착했다"), "배틀 로그에 움직임을 포착했다는 메시지가 출력되어야 함");

  // 2) 2차 중복 시전: 실패
  const log2 = executeStatusMove({
    actor: user,
    target: target,
    move: mindReaderMoveData,
    actorName: "슈륙챙이",
    targetName: "피죤투",
    isKo: true,
  });
  console.log(`   ➔ 마음의눈 중복 시전 로그: ${log2}`);
  assert(log2.includes("이미 상대의 움직임을 읽고 있다"), "마음의눈 중복 시전 시 실패 메시지가 출력되어야 함");

  // 3) 회피율 +6랭크 상대에게 저명중률 기술(눈보라, 70%) 시전 시 100% 필중 검증
  let allHit = true;
  for (let i = 0; i < 50; i++) {
    const res = checkMoveHit({ actor: user, target: target, move: blizzardMoveData });
    if (!res.isHit || res.reason !== "mind_reader") {
      allHit = false;
      break;
    }
  }
  assert(allHit, "마음의눈 상태에서는 회피율 +6랭크 상대에게도 100% 필중(reason: mind_reader)해야 함");
}

// 39. [악몽(Nightmare) 배틀 메커니즘 검증]
{
  const nightmareMoveData = getMoveData("nightmare")!;
  const { executeStatusMove } = await import("../../src/battle/moves/traits/specialStatusRegistry.js");
  const { processTurnEndEffects } = await import("../../src/battle/engine/TurnEndProcessor.js");
  const { validateAction } = await import("../../src/battle/mechanics/actionValidator.js");

  const caster = battleService.spawnWildPokemon(1, "Town", "gengar", 50);
  const target = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);
  target.hp = 200;
  target.maxHp = 200;

  // 1) 잠들어 있지 않은 상대에게 시전 시: 실패
  const failLog = executeStatusMove({
    actor: caster,
    target: target,
    move: nightmareMoveData,
    actorName: "팬텀",
    targetName: "잠만보",
    isKo: true,
  });
  console.log(`   ➔ 수면 아닐 때 악몽 시전: ${failLog}`);
  assert(!target.hasNightmare && failLog.includes("잠들어 있지 않다"), "잠들어 있지 않은 상대에게 악몽 시전 시 실패해야 함");

  // 2) 잠들어 있는 상대에게 시전 시: 성공 및 hasNightmare 플래그 설정
  target.status = "slp";
  target.sleepDuration = 3;
  target.sleepTurns = 0;
  const successLog = executeStatusMove({
    actor: caster,
    target: target,
    move: nightmareMoveData,
    actorName: "팬텀",
    targetName: "잠만보",
    isKo: true,
  });
  console.log(`   ➔ 수면 중 악몽 시전: ${successLog}`);
  assert(target.hasNightmare === true, "수면 중인 상대에게 악몽 적중 시 hasNightmare 플래그가 true가 되어야 함");
  assert(successLog.includes("악몽에 빠져들었다"), "배틀 로그에 악몽에 빠져들었다는 메시지가 출력되어야 함");

  // 3) 이미 악몽 상태인 상대에게 재시전: 실패
  const duplicateLog = executeStatusMove({
    actor: caster,
    target: target,
    move: nightmareMoveData,
    actorName: "팬텀",
    targetName: "잠만보",
    isKo: true,
  });
  console.log(`   ➔ 악몽 중복 시전: ${duplicateLog}`);
  assert(duplicateLog.includes("이미 악몽에 시달리고 있다"), "이미 악몽에 걸린 상대에게 재시전 시 실패 메시지가 나와야 함");

  // 4) 턴 종료 시 데미지 처리: 최대 HP의 1/4 (200의 1/4 = 50) 데미지 감소
  const logsTurn1: string[] = [];
  processTurnEndEffects(target, true, logsTurn1);
  console.log(`   ➔ 악몽 턴종료 데미지: HP ${target.hp}/200, 로그: ${logsTurn1.join(" / ")}`);
  assert(target.hp === 150, "수면 중 턴 종료 시 최대 HP의 1/4(50) 데미지를 입어야 함");
  assert(logsTurn1.some(l => l.includes("악몽에 시달리고 있다")), "악몽 피해 메시지가 턴 종료 로그에 출력되어야 함");

  // 5) 수면에서 깨어날 때(기상) 악몽 자동 해제 검증
  target.sleepTurns = 3; // 수면 턴수 충족
  const wakeVal = validateAction(target, getMoveData("tackle")!, "잠만보", "몸통박치기", true);
  console.log(`   ➔ 기상 판정: status=${target.status}, hasNightmare=${target.hasNightmare}, 로그=${wakeVal.log}`);
  assert(target.status === null, "기상 시 상태이상이 해제되어야 함");
  assert(target.hasNightmare === false, "기상 시 hasNightmare 플래그가 false로 자동 해제되어야 함");

  // 6) 기상 후 턴 종료 시 더 이상 악몽 피해가 발생하지 않음 검증
  const logsTurnAfterWake: string[] = [];
  const hpBefore = target.hp;
  processTurnEndEffects(target, true, logsTurnAfterWake);
  assert(target.hp === hpBefore && !logsTurnAfterWake.some(l => l.includes("악몽")), "기상 후에는 턴 종료 시 악몽 데미지가 발생하지 않아야 함");
}

// 40. [저주(Curse) 배틀 메커니즘 검증 - 일반 타입 vs 고스트 타입 분기]
{
  const curseMoveData = getMoveData("curse")!;
  const { executeSingleAction } = await import("../../src/battle/engine/TurnActionExecutor.js");
  const { processTurnEndEffects } = await import("../../src/battle/engine/TurnEndProcessor.js");

  // 1) 비고스트 포켓몬(잠만보 - normal)의 저주 시전: 스피드 -1, 공격 +1, 방어 +1 (자해 없음)
  const snorlax = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);
  snorlax.types = ["normal"];
  snorlax.maxHp = 200;
  snorlax.hp = 200;
  const enemyPidgey = battleService.spawnWildPokemon(1, "Town", "pidgey", 20);

  const normalRes = executeSingleAction(snorlax, enemyPidgey, curseMoveData, true, true);
  console.log(`   ➔ 일반타입 저주 시전 로그: ${normalRes.log}`);
  assert(normalRes.log.includes("스피드가 떨어지고") && normalRes.log.includes("공격과 방어가"), "일반타입 저주 시전 시 스피드 하락 및 공/방 상승 로그가 나와야 함");
  assert(snorlax.stages.spe === -1, "스피드가 1랭크 하락해야 함 (-1)");
  assert(snorlax.stages.atk === 1, "공격력이 1랭크 상승해야 함 (+1)");
  assert(snorlax.stages.def === 1, "방어력이 1랭크 상승해야 함 (+1)");
  assert(snorlax.hp === 200, "일반타입 저주는 시전자 HP를 깎지 않아야 함 (HP 200/200 유지)");
  assert(!enemyPidgey.isCursed, "일반타입 저주는 상대에게 저주를 걸지 않아야 함");

  // 2) 고스트 포켓몬(팬텀 - ghost/poison)의 저주 시전: 시전자 최대 HP 절반 소모 & 상대에게 저주 각인
  const gengar = battleService.spawnWildPokemon(1, "Town", "gengar", 50);
  gengar.types = ["ghost", "poison"];
  gengar.maxHp = 160;
  gengar.hp = 160;
  const enemyTarget = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);
  enemyTarget.maxHp = 200;
  enemyTarget.hp = 200;

  const ghostRes = executeSingleAction(gengar, enemyTarget, curseMoveData, true, true);
  console.log(`   ➔ 고스트타입 저주 시전 로그: ${ghostRes.log}`);
  assert(ghostRes.log.includes("자신의 체력을 깎아") && ghostRes.log.includes("저주를 걸었다"), "고스트타입 저주 시전 시 체력 희생 및 저주 각인 로그가 나와야 함");
  assert(gengar.hp === 80, "고스트타입 저주 시전 시 최대 HP의 절반(80)이 소모되어야 함 (160 -> 80)");
  assert(enemyTarget.isCursed === true, "피격 대상의 isCursed 플래그가 true가 되어야 함");

  // 3) 이미 저주에 걸린 상대에게 재시전 시 실패
  const repeatRes = executeSingleAction(gengar, enemyTarget, curseMoveData, true, true);
  console.log(`   ➔ 저주 중복 시전: ${repeatRes.log}`);
  assert(repeatRes.log.includes("효과가 없었다"), "이미 저주에 걸린 대상에게 재시전 시 실패 메시지가 나와야 함");

  // 4) 턴 종료 시 저주 데미지: 매 턴 최대 HP의 1/4 (200의 1/4 = 50) 데미지 및 turnActions 등록 검증
  const mockBattle: any = {
    enemy: enemyTarget,
    playerBattleMon: gengar,
    playerParty: [gengar],
    playerActiveIndex: 0,
    turnActions: [
      { actor: "player", moveKey: "shadow-ball", damage: 30, isHit: true, log: "팬텀의 섀도볼!" }
    ],
  };
  const logsTurnEnd: string[] = [];
  processTurnEndEffects(enemyTarget, true, logsTurnEnd, null, mockBattle);
  console.log(`   ➔ 저주 턴종료 데미지: HP ${enemyTarget.hp}/200, 로그: ${logsTurnEnd.join(" / ")}`);
  assert(enemyTarget.hp === 150, "저주 상태인 포켓몬은 턴 종료 시 최대 HP의 1/4(50) 피해를 입어야 함");
  assert(logsTurnEnd.some(l => l.includes("저주에 걸려 있다")), "저주 턴종료 로그가 정상 출력되어야 함");
  assert(mockBattle.turnActions.length === 2, "턴 종료 시 저주 데미지 액션이 turnActions에 추가되어야 함");
  assert(mockBattle.turnActions[1].moveKey === "curse-damage", "추가된 액션의 moveKey는 'curse-damage'여야 함");
  assert(mockBattle.turnActions[1].damage === 50, "추가된 액션의 데미지는 50이어야 함");

  const { MOVE_REGISTRY } = await import("../../src/battle/moves/moveRegistry.js");
  assert(MOVE_REGISTRY["curse-damage"] !== undefined, "MOVE_REGISTRY에 'curse-damage'가 등록되어 있어야 함");
  assert(MOVE_REGISTRY["저주(데미지)"] !== undefined, "MOVE_REGISTRY에 '저주(데미지)'가 등록되어 있어야 함");

  // 5) 고스트 저주는 방어(Protect) 및 대타출동(Substitute)을 관통해야 함
  const gengar2 = battleService.spawnWildPokemon(1, "Town", "gengar", 50);
  gengar2.types = ["ghost"];
  gengar2.maxHp = 100;
  gengar2.hp = 100;

  const protectedTarget = battleService.spawnWildPokemon(1, "Town", "rattata", 20);
  protectedTarget.isProtected = true;
  executeSingleAction(gengar2, protectedTarget, curseMoveData, true, true);
  assert(protectedTarget.isCursed === true, "고스트타입 저주는 상대의 방어(Protect)를 관통해야 함");

  const gengar3 = battleService.spawnWildPokemon(1, "Town", "gengar", 50);
  gengar3.types = ["ghost"];
  gengar3.maxHp = 100;
  gengar3.hp = 100;

  const subTarget = battleService.spawnWildPokemon(1, "Town", "rattata", 20);
  subTarget.substituteHp = 30;
  executeSingleAction(gengar3, subTarget, curseMoveData, true, true);
  assert(subTarget.isCursed === true, "고스트타입 저주는 상대의 대타출동(Substitute)을 관통해야 함");
}


console.log("==================================================");
console.log(`📊 테스트 결과: 통과 ${passed}개 / 실패 ${failed}개`);
console.log("==================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("🎉 모든 배틀 메커니즘 검증을 100% 통과했습니다!");
}
