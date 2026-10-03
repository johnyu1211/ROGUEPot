import { BattleService } from "../../src/services/battleService.js";
import { getMoveData, getMoveKey } from "../../src/data/movesKo.js";
import { executeSingleAction } from "../../src/battle/engine/TurnActionExecutor.js";
import { MOVE_REGISTRY } from "../../src/battle/moves/moveRegistry.js";
import { mudSlapMove } from "../../src/battle/moves/definitions/189_mud_slap.js";
import { getAccuracyMultiplier } from "../../src/battle/mechanics/statModifier.js";
import assert from "node:assert";

console.log("==========================================================");
console.log("🔍 [189. 진흙뿌리기 (Mud-Slap) 기술 구현 및 배틀 로직 전수 점검]");
console.log("==========================================================");

const battleService = new BattleService();
const mudSlapData = getMoveData("mud-slap")!;

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
// 1. 기술 데이터 (Data Definition) 정합성 검증
// ============================================================================
console.log("\n--- [1. 기술 데이터 정합성 검증] ---");

test("movesKo.ts 데이터: 189번, 땅 타입, 특수기, 위력 20, 명중률 100, PP 10", () => {
  assert.ok(mudSlapData, "mud-slap 데이터 존재");
  assert.strictEqual(mudSlapData.id, 189, "기술 번호 189");
  assert.strictEqual(mudSlapData.name, "mud-slap", "영문 식별자 mud-slap");
  assert.strictEqual(mudSlapData.nameKo, "진흙뿌리기", "한글 명칭 진흙뿌리기");
  assert.strictEqual(mudSlapData.type, "ground", "땅 타입");
  assert.strictEqual(mudSlapData.category, "special", "특수 공격기(special)");
  assert.strictEqual(mudSlapData.power, 20, "위력 20");
  assert.strictEqual(mudSlapData.accuracy, 100, "명중률 100");
  assert.strictEqual(mudSlapData.pp, 10, "PP 10");
});

test("별칭 및 키 해석: '진흙뿌리기', 'mud-slap', '189' 모두 mud-slap 반환", () => {
  assert.strictEqual(getMoveKey("mud-slap"), "mud-slap");
  assert.strictEqual(getMoveKey("진흙뿌리기"), "mud-slap");
  assert.strictEqual(getMoveData("진흙뿌리기")?.id, 189);
});

test("MOVE_REGISTRY 애니메이션 모듈 등록 검증", () => {
  assert.strictEqual(MOVE_REGISTRY["mud-slap"], mudSlapMove);
  assert.strictEqual(MOVE_REGISTRY["진흙뿌리기"], mudSlapMove);
  assert.strictEqual(MOVE_REGISTRY["189"], mudSlapMove);
  assert.strictEqual(mudSlapMove.num, 189);
  assert.strictEqual(mudSlapMove.type, "ground");
});

// ============================================================================
// 2. 기본 배틀 로직 및 명중률 랭크 하락 검증
// ============================================================================
console.log("\n--- [2. 기본 배틀 로직 및 100% 명중률 1랭크 하락 검증] ---");

test("피격 시 데미지 적용 및 대상 명중률 -1랭크 하강", () => {
  const attacker = battleService.spawnWildPokemon(1, "Town", "swinub", 50);
  const target = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);

  const prevHp = target.hp;
  target.stages.acc = 0;
  const res = executeSingleAction(attacker, target, mudSlapData, true, true);

  assert.ok(res.damage > 0, `데미지가 0보다 커야 함 (실제: ${res.damage})`);
  assert.ok(target.hp < prevHp, "체력이 감소해야 함");
  assert.strictEqual(target.stages.acc, -1, "상대 명중률이 -1랭크가 되어야 함");
  assert.ok(res.log.includes("명중률이 떨어졌다! (-1)"), "로그에 명중률 하락이 출력되어야 함");
});

test("연속 피격 시 -1 -> -2 -> -3 ... -> -6랭크 누적 검증", () => {
  const attacker = battleService.spawnWildPokemon(1, "Town", "swinub", 20);
  const target = battleService.spawnWildPokemon(1, "Town", "blissey", 100);

  target.stages.acc = 0;
  for (let i = 1; i <= 6; i++) {
    executeSingleAction(attacker, target, mudSlapData, true, true);
    assert.strictEqual(target.stages.acc, -i, `단계 ${i}에서 명중률 -${i}랭크여야 함`);
  }

  // -6랭크에서 추가 공격 시 -6 이하로 떨어지지 않음
  executeSingleAction(attacker, target, mudSlapData, true, true);
  assert.strictEqual(target.stages.acc, -6, "최저치 -6랭크 유지");
});

test("명중률 승수(Multiplier) 공식 검증: -1랭크 시 0.75배 (3/4)", () => {
  const mult0 = getAccuracyMultiplier(0);
  const multMinus1 = getAccuracyMultiplier(-1);
  const multMinus2 = getAccuracyMultiplier(-2);
  const multMinus6 = getAccuracyMultiplier(-6);

  assert.strictEqual(mult0, 1.0, "0랭크 승수는 1.0");
  assert.strictEqual(multMinus1, 3 / 4, "-1랭크 승수는 3/4 (0.75)");
  assert.strictEqual(multMinus2, 3 / 5, "-2랭크 승수는 3/5 (0.60)");
  assert.strictEqual(multMinus6, 3 / 9, "-6랭크 승수는 3/9 (~0.33)");
});

test("비행 타입(무효) 피격 시: 데미지 0 및 명중률 하락 미발동 검증", () => {
  const attacker = battleService.spawnWildPokemon(1, "Town", "swinub", 50);
  const pidgeot = battleService.spawnWildPokemon(1, "Town", "pidgeot", 50);

  pidgeot.stages.acc = 0;
  const res = executeSingleAction(attacker, pidgeot, mudSlapData, true, true);

  assert.strictEqual(res.damage, 0, "땅 타입 기술은 비행 타입에 0 데미지");
  assert.strictEqual(pidgeot.stages.acc, 0, "데미지가 들어가지 않았으므로 부가효과 미발동");
  assert.ok(res.log.includes("효과가 없는 것 같다"), "무효 메시지 출력");
});

console.log("\n==========================================================");
console.log(`🎉 [진흙뿌리기 전수 점검 통과] 총 ${passedCount}개 테스트 전체 성공!`);
console.log("==========================================================\n");
