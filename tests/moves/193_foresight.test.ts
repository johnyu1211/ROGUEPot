import { BattleService } from "../../src/services/battleService.js";
import { getMoveData, getMoveKey } from "../../src/data/movesKo.js";
import { executeSingleAction } from "../../src/battle/engine/TurnActionExecutor.js";
import { calculateDamage } from "../../src/battle/mechanics/damageCalculator.js";
import { checkMoveHit } from "../../src/battle/mechanics/accuracyEngine.js";
import { MOVE_REGISTRY } from "../../src/battle/moves/moveRegistry.js";
import { foresightMove } from "../../src/battle/moves/definitions/193_foresight.js";
import assert from "node:assert";

console.log("==========================================================");
console.log("🔍 [193. 꿰뚫어보기 (Foresight) 기술 구현 및 배틀 로직 전수 점검]");
console.log("==========================================================");

const battleService = new BattleService();
const foresightData = getMoveData("foresight")!;

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

test("movesKo.ts 데이터: 193번, 노말 타입, 변화기, PP 40", () => {
  assert.ok(foresightData, "foresight 데이터 존재");
  assert.strictEqual(foresightData.id, 193, "기술 번호 193");
  assert.strictEqual(foresightData.name, "foresight", "영문 식별자 foresight");
  assert.strictEqual(foresightData.nameKo, "꿰뚫어보기", "한글 명칭 꿰뚫어보기");
  assert.strictEqual(foresightData.type, "normal", "노말 타입");
  assert.strictEqual(foresightData.category, "status", "변화기(status)");
  assert.strictEqual(foresightData.pp, 40, "PP 40");
});

test("별칭 및 키 해석: '꿰뚫어보기', 'foresight', '193' 모두 foresight 반환", () => {
  assert.strictEqual(getMoveKey("foresight"), "foresight");
  assert.strictEqual(getMoveKey("꿰뚫어보기"), "foresight");
  assert.strictEqual(getMoveKey("193"), "foresight");
  assert.strictEqual(getMoveData("꿰뚫어보기")?.id, 193);
});

test("MOVE_REGISTRY 애니메이션 정의 등록 확인", () => {
  assert.ok(MOVE_REGISTRY["foresight"], "MOVE_REGISTRY['foresight'] 등록됨");
  assert.ok(MOVE_REGISTRY["193"], "MOVE_REGISTRY['193'] 등록됨");
  assert.ok(MOVE_REGISTRY["꿰뚫어보기"], "MOVE_REGISTRY['꿰뚫어보기'] 등록됨");
  assert.strictEqual(foresightMove.num, 193);
  assert.strictEqual(foresightMove.key, "foresight");
});

// ============================================================================
// 2. 기본 배틀 로직 및 상태 이상 부여 검증
// ============================================================================
console.log("\n--- [2. 기본 배틀 로직 및 상태 이상 부여 검증] ---");

test("꿰뚫어보기 사용 시 상대에게 isForesight / isIdentified 플래그 활성화", () => {
  const pidgey = battleService.spawnWildPokemon(1, "Route", "pidgey", 30);
  const gengar = battleService.spawnWildPokemon(1, "Tower", "gengar", 30);

  assert.strictEqual(gengar.isForesight, undefined);
  assert.strictEqual(gengar.isIdentified, undefined);

  const res = executeSingleAction(pidgey, gengar, foresightData, true, true);

  assert.strictEqual(gengar.isForesight, true, "isForesight true 설정");
  assert.strictEqual(gengar.isIdentified, true, "isIdentified true 설정");
  assert.ok(res.log.includes("꿰뚫어보았다"), `로그 확인: ${res.log}`);
});

test("이미 꿰뚫어본 상태에서 다시 사용 시 실패 처리", () => {
  const pidgey = battleService.spawnWildPokemon(1, "Route", "pidgey", 30);
  const gengar = battleService.spawnWildPokemon(1, "Tower", "gengar", 30);
  gengar.isForesight = true;
  gengar.isIdentified = true;

  const res = executeSingleAction(pidgey, gengar, foresightData, true, true);

  assert.ok(res.log.includes("이미 효과가 적용 중이다"), `실패 로그 확인: ${res.log}`);
});

// ============================================================================
// 3. 고스트 타입 무효화 관통 (Normal & Fighting vs Ghost)
// ============================================================================
console.log("\n--- [3. 고스트 타입 무효화 관통 검증] ---");

test("꿰뚫어보기 전: 노말 타입(몸통박치기)이 고스트(팬텀)에게 0 데미지(무효)", () => {
  const snorlax = battleService.spawnWildPokemon(1, "Route", "snorlax", 50);
  const gengar = battleService.spawnWildPokemon(1, "Tower", "gengar", 50);
  const tackleMove = getMoveData("tackle")!;

  const beforeResult = calculateDamage(snorlax, gengar, tackleMove, true, true);
  assert.strictEqual(beforeResult.damage, 0, "데미지 0");
  assert.strictEqual(beforeResult.typeMod, 0, "타입 상성 0x");
});

test("꿰뚫어보기 후: 노말 타입(몸통박치기)이 고스트(팬텀)에게 정상 타격(1.0x)", () => {
  const snorlax = battleService.spawnWildPokemon(1, "Route", "snorlax", 50);
  const gengar = battleService.spawnWildPokemon(1, "Tower", "gengar", 50);
  gengar.isForesight = true;
  const tackleMove = getMoveData("tackle")!;

  const afterResult = calculateDamage(snorlax, gengar, tackleMove, true, true);
  assert.ok(afterResult.damage > 0, `데미지 발생: ${afterResult.damage}`);
  assert.strictEqual(afterResult.typeMod, 1.0, "타입 상성 1.0x");
});

test("꿰뚫어보기 전: 격투 타입(마하펀치)이 고스트/독(팬텀)에게 0 데미지(무효)", () => {
  const machamp = battleService.spawnWildPokemon(1, "Route", "machamp", 50);
  const gengar = battleService.spawnWildPokemon(1, "Tower", "gengar", 50);
  const machPunch = getMoveData("mach-punch")!;

  const beforeResult = calculateDamage(machamp, gengar, machPunch, true, true);
  assert.strictEqual(beforeResult.damage, 0, "데미지 0");
  assert.strictEqual(beforeResult.typeMod, 0, "타입 상성 0x");
});

test("꿰뚫어보기 후: 격투 타입(마하펀치)이 고스트/독(팬텀)에게 0.5x(독 반감) 타격", () => {
  const machamp = battleService.spawnWildPokemon(1, "Route", "machamp", 50);
  const gengar = battleService.spawnWildPokemon(1, "Tower", "gengar", 50);
  gengar.isForesight = true;
  const machPunch = getMoveData("mach-punch")!;

  const afterResult = calculateDamage(machamp, gengar, machPunch, true, true);
  assert.ok(afterResult.damage > 0, `데미지 발생: ${afterResult.damage}`);
  assert.strictEqual(afterResult.typeMod, 0.5, "타입 상성 0.5x (독 타입 반감 적용)");
});

test("꿰뚫어보기 후: 격투 타입(마하펀치)이 순수 고스트(무우마)에게 1.0x 타격", () => {
  const machamp = battleService.spawnWildPokemon(1, "Route", "machamp", 50);
  const misdreavus = battleService.spawnWildPokemon(1, "Tower", "misdreavus", 50);
  misdreavus.isForesight = true;
  const machPunch = getMoveData("mach-punch")!;

  const afterResult = calculateDamage(machamp, misdreavus, machPunch, true, true);
  assert.ok(afterResult.damage > 0, `데미지 발생: ${afterResult.damage}`);
  assert.strictEqual(afterResult.typeMod, 1.0, "타입 상성 1.0x (순수 고스트 타격)");
});

test("꿰뚫어보기 후: 고정 데미지 격투 기술(지구던지기)이 고스트(팬텀)에게 레벨만큼 타격", () => {
  const machamp = battleService.spawnWildPokemon(1, "Route", "machamp", 50);
  const gengar = battleService.spawnWildPokemon(1, "Tower", "gengar", 50);
  gengar.isForesight = true;
  const seismicToss = getMoveData("seismic-toss")!;

  const afterResult = calculateDamage(machamp, gengar, seismicToss, true, true);
  assert.strictEqual(afterResult.damage, 50, "지구던지기 레벨 50 고정 데미지");
  assert.strictEqual(afterResult.typeMod, 1.0, "타입 상성 1.0x");
});

// ============================================================================
// 4. 회피율(Evasiveness) +랭크 무시 검증
// ============================================================================
console.log("\n--- [4. 회피율 랭크 무시 검증] ---");

test("꿰뚫어보기 적용 시 대상의 회피율 +6랭크가 명중 판정에서 완전히 무시됨", () => {
  const actor = battleService.spawnWildPokemon(1, "Route", "pidgey", 50);
  const target = battleService.spawnWildPokemon(1, "Route", "rattata", 50);
  target.stages.eva = 6; // 그림자분신 등으로 회피율 +6랭크
  target.isForesight = true;

  const tackleMove = getMoveData("tackle")!; // 100% 명중 기술

  // 100회 연속 공격 시 회피율 +6랭크가 무시되므로 전부 명중해야 함
  for (let i = 0; i < 100; i++) {
    const hitRes = checkMoveHit({
      actor,
      target,
      move: tackleMove,
    });
    assert.strictEqual(hitRes.isHit, true, `100회 중 ${i+1}번째 공격 명중 확인`);
  }
});

console.log("\n==========================================================");
console.log(`🎉 모든 꿰뚫어보기 배틀 로직 테스트 통과! (${passedCount}/${passedCount})`);
console.log("==========================================================");
