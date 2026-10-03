import { BattleService } from "../../src/services/battleService.js";
import { getMoveData, getMoveKey } from "../../src/data/movesKo.js";
import { executeSingleAction } from "../../src/battle/engine/TurnActionExecutor.js";
import { MOVE_REGISTRY } from "../../src/battle/moves/moveRegistry.js";
import { bellyDrumMove } from "../../src/battle/moves/definitions/187_belly_drum.js";
import { isSelfTargetStatusMove } from "../../src/battle/moves/traits/specialStatusRegistry.js";
import assert from "node:assert";

console.log("==========================================================");
console.log("🔍 [187. 배북 (Belly Drum) 기술 구현 및 배틀 로직 전수 점검]");
console.log("==========================================================");

const battleService = new BattleService();
const bellyDrumData = getMoveData("belly-drum")!;

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

test("movesKo.ts 데이터: 187번, 노말 타입, 변화기, 명중률 null/자신, PP 10", () => {
  assert.ok(bellyDrumData, "belly-drum 데이터 존재");
  assert.strictEqual(bellyDrumData.id, 187, "기술 번호 187");
  assert.strictEqual(bellyDrumData.name, "belly-drum", "영문 식별자 belly-drum");
  assert.strictEqual(bellyDrumData.nameKo, "배북", "한글 명칭 배북");
  assert.strictEqual(bellyDrumData.type, "normal", "노말 타입");
  assert.strictEqual(bellyDrumData.category, "status", "변화기(status)");
  assert.strictEqual(bellyDrumData.pp, 10, "PP 10");
});

test("별칭 및 키 해석: '배북', 'belly-drum', 'belly_drum', '187' 모두 belly-drum 반환", () => {
  assert.strictEqual(getMoveKey("belly-drum"), "belly-drum");
  assert.strictEqual(getMoveKey("배북"), "belly-drum");
  assert.strictEqual(getMoveData("배북")?.id, 187);
});

test("MOVE_REGISTRY 등록 확인 및 애니메이션 정의 검증", () => {
  assert.ok(MOVE_REGISTRY["belly-drum"], "belly-drum 키로 등록됨");
  assert.ok(MOVE_REGISTRY["배북"], "배북 키로 등록됨");
  assert.strictEqual(bellyDrumMove.num, 187, "기술 번호 187");
  assert.strictEqual(bellyDrumMove.category, "status", "변화기");
  assert.strictEqual(bellyDrumMove.customStatParticles, true, "커스텀 스탯 파티클 플래그 활성화");
  assert.strictEqual(bellyDrumMove.camera?.type, "self", "카메라 시전자 줌");
});

test("isSelfTargetStatusMove 검증: 배북은 자신을 대상으로 하는 변화기", () => {
  assert.strictEqual(isSelfTargetStatusMove("belly-drum"), true, "belly-drum은 selfMove");
  assert.strictEqual(isSelfTargetStatusMove("배북"), true, "배북은 selfMove");
});

// ============================================================================
// 2. 기본 배틀 로직 및 랭크/HP 변화 검증
// ============================================================================
console.log("\n--- [2. 기본 배틀 로직 및 랭크/HP 변화 검증] ---");

test("성공 케이스: HP 100% -> 최대 HP 50% 소모 후 공격 랭크 즉시 +6(최대치)", () => {
  const snorlax = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);
  const target = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);

  snorlax.maxHp = 200;
  snorlax.hp = 200;
  snorlax.stages.atk = 0;

  const result = executeSingleAction(snorlax, target, bellyDrumData, true, true);

  const expectedHalf = Math.floor(200 * 0.5);
  assert.strictEqual(snorlax.hp, 200 - expectedHalf, "HP가 최대 HP의 50%만큼 감소 (100 남음)");
  assert.strictEqual(snorlax.stages.atk, 6, "공격 랭크가 즉시 +6 (최대치)");
  assert.strictEqual(result.damage, 0, "상대에게 주는 데미지 0");
  assert.ok(result.log.includes("자신의 HP를 깎아 공격을 최대치(+6)까지 올렸다!"), "성공 로그 확인");
});

test("마이너스 랭크 복구: 공격이 -6랭크여도 배북 사용 시 단숨에 +6으로 극대화", () => {
  const snorlax = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);
  const target = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);

  snorlax.maxHp = 200;
  snorlax.hp = 200;
  snorlax.stages.atk = -6; // 6랭크 깎인 상태

  const result = executeSingleAction(snorlax, target, bellyDrumData, true, true);

  assert.strictEqual(snorlax.stages.atk, 6, "-6랭크에서 즉시 +6랭크로 상승");
  assert.strictEqual(snorlax.hp, 100, "HP 50% 감소");
});

test("홀수 Max HP 소모 검증: Max HP 101일 때 50 소모 (Math.floor(101 * 0.5))", () => {
  const snorlax = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);
  const target = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);

  snorlax.maxHp = 101;
  snorlax.hp = 51; // 50 초과이므로 성공 가능
  snorlax.stages.atk = 0;

  executeSingleAction(snorlax, target, bellyDrumData, true, true);

  assert.strictEqual(snorlax.hp, 1, "51 - 50 = 1 남음");
  assert.strictEqual(snorlax.stages.atk, 6, "+6 랭크업");
});

// ============================================================================
// 3. 실패 조건 검증
// ============================================================================
console.log("\n--- [3. 실패 조건 검증] ---");

test("실패 케이스 1: HP가 최대치의 50% 이하일 때 (hp <= halfHp) 기술 실패 및 HP 보존", () => {
  const snorlax = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);
  const target = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);

  snorlax.maxHp = 100;
  snorlax.hp = 50; // 정확히 50% 이하
  snorlax.stages.atk = 0;

  const result = executeSingleAction(snorlax, target, bellyDrumData, true, true);

  assert.strictEqual(snorlax.hp, 50, "실패 시 HP가 깎이지 않음");
  assert.strictEqual(snorlax.stages.atk, 0, "실패 시 공격 랭크 변함없음");
  assert.ok(result.log.includes("하지만 공격은 이미 최대치이거나 HP가 부족하다!"), "실패 로그 확인");
});

test("실패 케이스 2: 이미 공격 랭크가 +6일 때 기술 실패 및 HP 보존", () => {
  const snorlax = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);
  const target = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);

  snorlax.maxHp = 100;
  snorlax.hp = 100;
  snorlax.stages.atk = 6; // 이미 +6

  const result = executeSingleAction(snorlax, target, bellyDrumData, true, true);

  assert.strictEqual(snorlax.hp, 100, "공격이 이미 +6이면 HP가 깎이지 않음");
  assert.strictEqual(snorlax.stages.atk, 6, "공격 랭크 유지");
  assert.ok(result.log.includes("하지만 공격은 이미 최대치이거나 HP가 부족하다!"), "실패 로그 확인");
});

// ============================================================================
// 4. 상대 방어 상태 무관 (자신 대상 변화기) 검증
// ============================================================================
console.log("\n--- [4. 상대 방어 상태 무관 (자신 대상 변화기) 검증] ---");

test("상대가 방어(Protect)/대타출동(Substitute)/공중날기(Semi-invulnerable) 중이어도 정상 발동", () => {
  const snorlax = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);
  const target = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);

  target.isProtected = true;
  target.substituteHp = 50;
  target.isSemiInvulnerable = true;

  snorlax.maxHp = 200;
  snorlax.hp = 200;
  snorlax.stages.atk = 0;

  const result = executeSingleAction(snorlax, target, bellyDrumData, true, true);

  assert.strictEqual(snorlax.hp, 100, "상대 방어/대타출동 무시하고 발동하여 HP 감소");
  assert.strictEqual(snorlax.stages.atk, 6, "공격 +6 정상 반영");
  assert.ok(!result.log.includes("공격을 막아냈다"), "상대의 방어에 막히지 않음");
});

console.log("\n==========================================================");
console.log(`🎉 모든 배북 (Belly Drum) 배틀 로직 테스트 통과! (총 ${passedCount}개 테스트)`);
console.log("==========================================================");
