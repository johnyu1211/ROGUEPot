import { BattleService } from "../../src/services/battleService.js";
import { BattleEngine } from "../../src/battle/engine/BattleEngine.js";
import { getMoveData } from "../../src/data/movesKo.js";
import { executeSingleAction } from "../../src/battle/engine/TurnActionExecutor.js";
import { processTurnEndEffects } from "../../src/battle/engine/TurnEndProcessor.js";
import { MOVE_REGISTRY } from "../../src/battle/moves/moveRegistry.js";
import { curseMove, curseGhostMove, curseNormalMove, curseDamageMove } from "../../src/battle/moves/definitions/174_curse.js";
import assert from "node:assert";

console.log("==================================================");
console.log("🔍 [저주(Curse) 배틀 로직 및 기술 구현 전수 점검]");
console.log("==================================================");

const battleService = new BattleService();
const engine = new BattleEngine();
const curseData = getMoveData("curse")!;

let passedCount = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passedCount++;
  } catch (err: any) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   ${err.message}`);
    process.exit(1);
  }
}

// ============================================================================
// 1. 비고스트(일반) 타입 저주 배틀 로직 검증
// ============================================================================
console.log("\n--- [1. 비고스트 타입 저주 검증] ---");
test("잠만보(노말)가 저주 사용 시 스피드 -1랭크, 공격 +1랭크, 방어 +1랭크 적용", () => {
  const snorlax = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);
  snorlax.types = ["normal"];
  snorlax.hp = 200;
  snorlax.maxHp = 200;

  const target = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);

  const res = executeSingleAction(snorlax, target, curseData, true, true);

  assert.strictEqual(snorlax.stages.spe, -1, "스피드 1랭크 하락");
  assert.strictEqual(snorlax.stages.atk, 1, "공격 1랭크 상승");
  assert.strictEqual(snorlax.stages.def, 1, "방어 1랭크 상승");
  assert.strictEqual(snorlax.hp, 200, "시전자 HP는 깎이지 않아야 함");
  assert.strictEqual(target.isCursed, undefined, "상대에게 저주가 걸리지 않아야 함");
  assert.ok(res.log.includes("스피드가 떨어지고 공격과 방어가 올라갔다"), "로그 메시지 검증");
});

// ============================================================================
// 2. 고스트 타입 저주 배틀 로직 검증
// ============================================================================
console.log("\n--- [2. 고스트 타입 저주 검증] ---");
test("팬텀(고스트)이 저주 사용 시 최대 HP의 절반(50%) 소모 및 상대에게 저주 부여", () => {
  const gengar = battleService.spawnWildPokemon(1, "Town", "gengar", 50);
  gengar.types = ["ghost", "poison"];
  gengar.maxHp = 160;
  gengar.hp = 160;

  const target = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);
  target.maxHp = 200;
  target.hp = 200;

  const res = executeSingleAction(gengar, target, curseData, true, true);

  assert.strictEqual(gengar.hp, 80, "최대 HP 160의 50%인 80 HP 소모되어 80 유지");
  assert.strictEqual(target.isCursed, true, "상대에게 isCursed: true 부여");
  assert.ok(res.log.includes("자신의 체력을 깎아"), "체력 소모 로그 포함");
  assert.ok(res.log.includes("저주를 걸었다"), "저주 각인 로그 포함");
});

test("이미 저주에 걸려 있는 대상에게 고스트 저주 재시전 시 실패", () => {
  const gengar = battleService.spawnWildPokemon(1, "Town", "gengar", 50);
  gengar.types = ["ghost"];
  gengar.maxHp = 160;
  gengar.hp = 160;

  const target = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);
  target.isCursed = true;

  const res = executeSingleAction(gengar, target, curseData, true, true);

  assert.strictEqual(gengar.hp, 160, "실패 시 시전자 체력이 소모되지 않아야 함");
  assert.ok(res.log.includes("효과가 없었다"), "실패 메시지 출력");
});

test("고스트 저주는 상대의 방어(Protect)를 관통하여 적중", () => {
  const gengar = battleService.spawnWildPokemon(1, "Town", "gengar", 50);
  gengar.types = ["ghost"];
  const target = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);
  target.isProtected = true;

  executeSingleAction(gengar, target, curseData, true, true);
  assert.strictEqual(target.isCursed, true, "방어 관통 성공");
});

test("고스트 저주는 상대의 대타출동(Substitute)을 관통하여 본체에 적중", () => {
  const gengar = battleService.spawnWildPokemon(1, "Town", "gengar", 50);
  gengar.types = ["ghost"];
  const target = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);
  target.substituteHp = 50;

  executeSingleAction(gengar, target, curseData, true, true);
  assert.strictEqual(target.isCursed, true, "대타출동 관통 성공");
});

test("고스트 저주는 공중날기/구멍파기 등 반무적(Semi-Invulnerable) 상태를 관통", () => {
  const gengar = battleService.spawnWildPokemon(1, "Town", "gengar", 50);
  gengar.types = ["ghost"];
  const target = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);
  target.isSemiInvulnerable = true;

  executeSingleAction(gengar, target, curseData, true, true);
  assert.strictEqual(target.isCursed, true, "반무적 상태 관통 성공");
});

test("시전자 HP가 50% 이하일 때 고스트 저주 사용 시 시전자 HP가 0이 됨", () => {
  const gengar = battleService.spawnWildPokemon(1, "Town", "gengar", 50);
  gengar.types = ["ghost"];
  gengar.maxHp = 100;
  gengar.hp = 40; // 50% (50) 미만

  const target = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);

  executeSingleAction(gengar, target, curseData, true, true);
  assert.strictEqual(gengar.hp, 0, "HP가 0으로 감소");
  assert.strictEqual(target.isCursed, true, "희생 후에도 상대에게 저주는 각인됨");
});

// ============================================================================
// 3. 턴 종료 시 저주 데미지 배틀 로직 검증
// ============================================================================
console.log("\n--- [3. 턴 종료 잔여 데미지 검증] ---");
test("저주 걸린 포켓몬은 턴 종료 시 최대 HP의 1/4 (25%) 피해를 입음", () => {
  const victim = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);
  victim.maxHp = 200;
  victim.hp = 200;
  victim.isCursed = true;

  const logs: string[] = [];
  processTurnEndEffects(victim, true, logs);

  assert.strictEqual(victim.hp, 150, "200에서 1/4인 50 감소하여 150 유지");
  assert.ok(logs.some(l => l.includes("저주에 걸려 있다! (-50)")), "턴 종료 저주 로그 검증");
});

test("저주 잔여 피해로 인해 HP가 0이 되면 기절 처리", () => {
  const victim = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);
  victim.maxHp = 200;
  victim.hp = 30; // 50 데미지 이하
  victim.isCursed = true;

  const logs: string[] = [];
  processTurnEndEffects(victim, true, logs);

  assert.strictEqual(victim.hp, 0, "HP가 0으로 클램핑됨");
});

test("battle 상태가 있을 때 turnActions에 curse-damage 액션이 정확히 push됨", () => {
  const victim = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);
  victim.maxHp = 200;
  victim.hp = 200;
  victim.isCursed = true;

  const gengar = battleService.spawnWildPokemon(1, "Town", "gengar", 50);

  const mockBattle: any = {
    enemy: victim,
    playerBattleMon: gengar,
    playerParty: [gengar],
    playerActiveIndex: 0,
    turnActions: [
      { actor: "player", moveKey: "shadow-ball", damage: 40, isHit: true, log: "팬텀의 섀도볼!" }
    ],
  };

  const logs: string[] = [];
  processTurnEndEffects(victim, true, logs, null, mockBattle);

  assert.strictEqual(mockBattle.turnActions.length, 2, "turnActions에 2번째 액션으로 등록");
  const curseAct = mockBattle.turnActions[1];
  assert.strictEqual(curseAct.actor, "player", "적 피격자 대상이므로 actor는 player");
  assert.strictEqual(curseAct.moveKey, "curse-damage", "moveKey는 curse-damage");
  assert.strictEqual(curseAct.damage, 50, "데미지는 50");
  assert.strictEqual(curseAct.enemyHpBefore, 200, "피격 전 HP는 200");
  assert.strictEqual(curseAct.enemyHpAfter, 150, "피격 후 HP는 150");
  assert.strictEqual(curseAct.isHit, true, "isHit는 true");
});

// ============================================================================
// 4. 배틀 엔진 턴 전체 시뮬레이션 및 다중 액션 시퀀싱 검증
// ============================================================================
console.log("\n--- [4. 배틀 엔진 턴 시뮬레이션 및 순서 보장 검증] ---");
test("고스트 저주 사용 턴: 기술 1 ➔ 기술 2 ➔ 턴 종료 저주 데미지 순차 발생", () => {
  // 1) 배틀 생성: 아군 팬텀(고스트, 스피드 150) vs 적 잠만보(노말, 스피드 40)
  const gengar: any = battleService.spawnWildPokemon(1, "Town", "gengar", 50);
  gengar.types = ["ghost", "poison"];
  gengar.speed = 150;
  gengar.maxHp = 160;
  gengar.hp = 160;
  gengar.stages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 };
  gengar.moves = ["curse"];

  const snorlax: any = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);
  snorlax.types = ["normal"];
  snorlax.speed = 40;
  snorlax.maxHp = 200;
  snorlax.hp = 200;
  snorlax.stages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 };
  snorlax.moves = ["tackle"];

  const battle: any = {
    userId: "test_curse_user",
    slotId: 1,
    turn: 1,
    phase: "MAIN",
    playerParty: [gengar],
    playerActiveIndex: 0,
    playerBattleMon: gengar,
    enemy: snorlax,
    turnActions: [],
  };

  // 팬텀은 저주 선택 (스킵 세이브 플래그 true)
  const updatedBattle = BattleEngine.executeTurn(battle, "curse", "ko", true);

  console.log(`   ➔ 턴 액션 개수: ${updatedBattle.turnActions.length}`);
  updatedBattle.turnActions.forEach((a, idx) => {
    console.log(`      Act ${idx + 1}: [${a.actor}] ${a.moveKey} (${a.moveName}) - HP Before: E=${a.enemyHpBefore}/P=${a.playerHpBefore}, After: E=${a.enemyHpAfter}/P=${a.playerHpAfter}`);
  });

  // 액션 1: 팬텀의 저주 (선공)
  assert.strictEqual(updatedBattle.turnActions[0].actor, "player", "선공은 팬텀");
  assert.ok(["curse", "curse-ghost"].includes(updatedBattle.turnActions[0].moveKey), "팬텀의 저주 발동");
  assert.strictEqual(updatedBattle.turnActions[0].playerHpAfter, 80, "팬텀 HP 50% 소모");

  // 액션 2: 잠만보의 몸통박치기 (후공)
  assert.strictEqual(updatedBattle.turnActions[1].actor, "enemy", "후공은 잠만보");
  assert.strictEqual(updatedBattle.turnActions[1].moveKey, "tackle", "잠만보의 몸통박치기");

  // 액션 3: 턴 종료 시 잠만보의 저주 피격 (curse-damage)
  assert.strictEqual(updatedBattle.turnActions.length, 3, "저주 데미지가 3번째 액션으로 순차 추가됨");
  assert.strictEqual(updatedBattle.turnActions[2].moveKey, "curse-damage", "3번째 액션은 저주 데미지");
  assert.strictEqual(updatedBattle.turnActions[2].enemyHpAfter, 150, "잠만보 HP 200에서 150으로 1/4 감소");
  assert.strictEqual(snorlax.isCursed, true, "잠만보의 isCursed 상태 유지");
});

// ============================================================================
// 5. 모듈 및 애니메이션 레지스트리 무결성 검증
// ============================================================================
console.log("\n--- [5. 애니메이션 레지스트리 및 라우터 검증] ---");
test("MOVE_REGISTRY에 curse, curse-normal, curse-ghost, curse-damage 및 한글 키 정상 등록", () => {
  assert.ok(MOVE_REGISTRY["curse"], "curse 등록");
  assert.ok(MOVE_REGISTRY["curse-normal"], "curse-normal 등록");
  assert.ok(MOVE_REGISTRY["curse-ghost"], "curse-ghost 등록");
  assert.ok(MOVE_REGISTRY["curse-damage"], "curse-damage 등록");
  assert.ok(MOVE_REGISTRY["저주"], "한글 '저주' 등록");
  assert.ok(MOVE_REGISTRY["저주(일반)"], "한글 '저주(일반)' 등록");
  assert.ok(MOVE_REGISTRY["저주(고스트)"], "한글 '저주(고스트)' 등록");
  assert.ok(MOVE_REGISTRY["저주(데미지)"], "한글 '저주(데미지)' 등록");
});

test("curseMove 통합 라우터가 상황별 프레임을 정확히 분기 생성", () => {
  const dummyCtx: any = {
    isPlayer: true,
    action: { moveKey: "curse-damage", log: "저주에 걸려 있다!" },
    enemyHp: 150,
    playerHp: 100,
    textLineIdx: 99,
  };

  // 1) curse-damage 액션 전달 시
  const dmgFrames = curseMove.buildFrames(dummyCtx);
  assert.ok(dmgFrames.some(f => f.phaseId?.startsWith("curse-damage")), "curse-damage 프레임 생성");

  // 2) 고스트 저주 액션 전달 시
  dummyCtx.action = { moveKey: "curse-ghost", log: "체력을 깎아 저주를 걸었다!" };
  const ghostFrames = curseMove.buildFrames(dummyCtx);
  assert.ok(ghostFrames.some(f => f.phaseId?.startsWith("curse-ghost")), "curse-ghost 프레임 생성");

  // 3) 일반 저주 액션 전달 시
  dummyCtx.action = { moveKey: "curse", log: "스피드가 떨어지고 공격과 방어가 올라갔다!" };
  const normalFrames = curseMove.buildFrames(dummyCtx);
  assert.ok(normalFrames.some(f => f.phaseId?.startsWith("curse-squash") || f.phaseId?.startsWith("curse-sway")), "curse-normal 프레임 생성");
});

console.log("\n==================================================");
console.log(`🎉 모든 저주 배틀 로직 및 구현 검증 ${passedCount}개 100% 통과!`);
console.log("==================================================");
