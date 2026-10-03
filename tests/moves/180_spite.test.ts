import { BattleService } from "../../src/services/battleService.js";
import { getMoveData, getMoveKey } from "../../src/data/movesKo.js";
import { executeSingleAction } from "../../src/battle/engine/TurnActionExecutor.js";
import { MOVE_REGISTRY } from "../../src/battle/moves/moveRegistry.js";
import { spiteMove } from "../../src/battle/moves/definitions/180_spite.js";
import assert from "node:assert";

console.log("==========================================================");
console.log("🔍 [180. 원한 (Spite) 기술 구현 및 배틀 로직 전수 점검]");
console.log("==========================================================");

const battleService = new BattleService();
const spiteData = getMoveData("spite")!;

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

test("movesKo.ts 데이터: 180번, 고스트 타입, 변화기, 명중률 100, PP 10", () => {
  assert.ok(spiteData, "spite 데이터 존재");
  assert.strictEqual(spiteData.id, 180, "기술 번호 180");
  assert.strictEqual(spiteData.name, "spite", "영문 식별자 spite");
  assert.strictEqual(spiteData.nameKo, "원한", "한글 명칭 원한");
  assert.strictEqual(spiteData.type, "ghost", "고스트 타입");
  assert.strictEqual(spiteData.category, "status", "변화기(status)");
  assert.strictEqual(spiteData.accuracy, 100, "명중률 100");
  assert.strictEqual(spiteData.pp, 10, "PP 10");
});

test("별칭 및 키 해석: '원한', 'spite', '180' 모두 spite 반환", () => {
  assert.strictEqual(getMoveKey("spite"), "spite");
  assert.strictEqual(getMoveKey("원한"), "spite");
  assert.strictEqual(getMoveData("원한")?.id, 180);
});

test("MOVE_REGISTRY 애니메이션 정의 등록 확인", () => {
  assert.ok(MOVE_REGISTRY["spite"], "MOVE_REGISTRY['spite'] 등록됨");
  assert.ok(MOVE_REGISTRY["180"], "MOVE_REGISTRY['180'] 등록됨");
  assert.ok(MOVE_REGISTRY["원한"], "MOVE_REGISTRY['원한'] 등록됨");
  assert.strictEqual(spiteMove.num, 180);
  assert.strictEqual(spiteMove.key, "spite");
});

// ============================================================================
// 2. 기본 배틀 로직 및 PP 4 감소 검증
// ============================================================================
console.log("\n--- [2. 기본 배틀 로직 및 PP 4 감소 검증] ---");

test("상대가 마지막으로 사용한 기술의 PP가 정확히 4 감소", () => {
  const gengar = battleService.spawnWildPokemon(1, "Town", "gengar", 50);
  const pikachu = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);

  // 피카츄가 태클을 사용함
  pikachu.moves = ["tackle", "thunderbolt", "quick-attack", "iron-tail"];
  pikachu.movePps = [35, 15, 30, 15];
  pikachu.lastMoveUsed = "tackle";

  const res = executeSingleAction(gengar, pikachu, spiteData, true, true);

  assert.strictEqual(pikachu.movePps[0], 31, "태클 PP가 35에서 31로 4 감소해야 함");
  assert.strictEqual(res.damage, 0, "변화기이므로 데미지는 0");
  assert.ok(res.log.includes("PP가 4 깎였다!"), "한국어 로그에 PP 4 깎임 명시");
  assert.ok(res.log.includes("남은 PP: 31"), "한국어 로그에 남은 PP 명시");
});

test("상대 남은 PP가 4 미만(예: 2)인 경우 남은 수치만큼만 감소하여 0이 됨", () => {
  const gengar = battleService.spawnWildPokemon(1, "Town", "gengar", 50);
  const pikachu = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);

  pikachu.moves = ["thunderbolt", "tackle"];
  pikachu.movePps = [2, 35];
  pikachu.lastMoveUsed = "thunderbolt";

  const res = executeSingleAction(gengar, pikachu, spiteData, true, true);

  assert.strictEqual(pikachu.movePps[0], 0, "남은 2 PP가 모두 소진되어 0이 됨");
  assert.ok(res.log.includes("PP가 2 깎였다!"), "2 깎임 명시");
  assert.ok(res.log.includes("남은 PP: 0"), "남은 PP 0 명시");
});

// ============================================================================
// 3. 실패 조건 (Failure Conditions) 검증
// ============================================================================
console.log("\n--- [3. 실패 조건 검증] ---");

test("상대가 배틀 중 아직 기술을 한 번도 사용하지 않은 경우 실패", () => {
  const gengar = battleService.spawnWildPokemon(1, "Town", "gengar", 50);
  const pikachu = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);

  pikachu.moves = ["tackle"];
  pikachu.movePps = [35];
  pikachu.lastMoveUsed = null;

  const res = executeSingleAction(gengar, pikachu, spiteData, true, true);
  assert.ok(res.log.includes("하지만 아무 일도 일어나지 않았다!"), "기술 실패 안내");
  assert.strictEqual(pikachu.movePps[0], 35, "PP 감소 없음");
});

test("상대 기술의 PP가 이미 0인 경우 실패", () => {
  const gengar = battleService.spawnWildPokemon(1, "Town", "gengar", 50);
  const pikachu = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);

  pikachu.moves = ["tackle"];
  pikachu.movePps = [0];
  pikachu.lastMoveUsed = "tackle";

  const res = executeSingleAction(gengar, pikachu, spiteData, true, true);
  assert.ok(res.log.includes("하지만 아무 일도 일어나지 않았다!"), "PP 0일 때 실패 안내");
  assert.strictEqual(pikachu.movePps[0], 0, "PP 변화 없음");
});

test("상대가 사용했던 기술이 현재 기술 목록에 없는 경우(예: 손가락흔들기로 발동) 실패", () => {
  const gengar = battleService.spawnWildPokemon(1, "Town", "gengar", 50);
  const togepi = battleService.spawnWildPokemon(1, "Town", "togepi", 50);

  togepi.moves = ["metronome"];
  togepi.movePps = [10];
  togepi.lastMoveUsed = "hyper-beam"; // 손가락흔들기로 나간 파괴광선

  const res = executeSingleAction(gengar, togepi, spiteData, true, true);
  assert.ok(res.log.includes("하지만 아무 일도 일어나지 않았다!"), "기술 목록에 없는 기술 실패 안내");
  assert.strictEqual(togepi.movePps[0], 10, "메트로놈 PP 변화 없음");
});

// ============================================================================
// 4. 방어 및 대타출동 상호작용 검증
// ============================================================================
console.log("\n--- [4. 방어 및 대타출동 상호작용 검증] ---");

test("방어(Protect) 활성화된 대상에게 시전 시 방어됨", () => {
  const gengar = battleService.spawnWildPokemon(1, "Town", "gengar", 50);
  const pikachu = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);

  pikachu.moves = ["tackle"];
  pikachu.movePps = [35];
  pikachu.lastMoveUsed = "tackle";
  pikachu.isProtected = true;

  const res = executeSingleAction(gengar, pikachu, spiteData, true, true);
  assert.ok(res.log.includes("공격을 막아냈다!"), "방어로 막힘");
  assert.strictEqual(pikachu.movePps[0], 35, "PP 보호됨");
});

test("대타출동(Substitute) 분신이 있는 대상에게 시전 시 분신에 막힘", () => {
  const gengar = battleService.spawnWildPokemon(1, "Town", "gengar", 50);
  const pikachu = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);

  pikachu.moves = ["tackle"];
  pikachu.movePps = [35];
  pikachu.lastMoveUsed = "tackle";
  pikachu.substituteHp = 30;

  const res = executeSingleAction(gengar, pikachu, spiteData, true, true);
  assert.ok(res.log.includes("대타출동 분신에게는 통하지 않았다!"), "대타출동으로 막힘");
  assert.strictEqual(pikachu.movePps[0], 35, "PP 보호됨");
});

console.log("\n==========================================================");
console.log(`🎉 모든 원한 (Spite) 배틀 로직 테스트 통과! (${passedCount}/${passedCount})`);
console.log("==========================================================");
