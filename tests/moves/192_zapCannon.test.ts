import { BattleService } from "../../src/services/battleService.js";
import { getMoveData, getMoveKey } from "../../src/data/movesKo.js";
import { executeSingleAction } from "../../src/battle/engine/TurnActionExecutor.js";
import { calculateDamage } from "../../src/battle/mechanics/damageCalculator.js";
import { MOVE_REGISTRY } from "../../src/battle/moves/moveRegistry.js";
import { zapCannonMove } from "../../src/battle/moves/definitions/192_zap_cannon.js";
import assert from "node:assert";

console.log("==========================================================");
console.log("🔍 [192. 전자포 (Zap Cannon) 기술 구현 및 배틀 로직 전수 점검]");
console.log("==========================================================");

const battleService = new BattleService();
const zapCannonData = getMoveData("zap-cannon")!;

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

test("movesKo.ts 데이터: 192번, 전기 타입, 특수기, 위력 120, 명중률 50, PP 5", () => {
  assert.ok(zapCannonData, "zap-cannon 데이터 존재");
  assert.strictEqual(zapCannonData.id, 192, "기술 번호 192");
  assert.strictEqual(zapCannonData.name, "zap-cannon", "영문 식별자 zap-cannon");
  assert.strictEqual(zapCannonData.nameKo, "전자포", "한글 명칭 전자포");
  assert.strictEqual(zapCannonData.type, "electric", "전기 타입");
  assert.strictEqual(zapCannonData.category, "special", "특수 공격기(special)");
  assert.strictEqual(zapCannonData.power, 120, "위력 120");
  assert.strictEqual(zapCannonData.accuracy, 50, "명중률 50");
  assert.strictEqual(zapCannonData.pp, 5, "PP 5");
});

test("별칭 및 키 해석: '전자포', 'zap-cannon', 'zap_cannon', 'zapcannon', '192' 모두 zap-cannon 반환", () => {
  assert.strictEqual(getMoveKey("zap-cannon"), "zap-cannon");
  assert.strictEqual(getMoveKey("zap_cannon"), "zap-cannon");
  assert.strictEqual(getMoveKey("zapcannon"), "zap-cannon");
  assert.strictEqual(getMoveKey("전자포"), "zap-cannon");
  assert.strictEqual(getMoveData("전자포")?.id, 192);
  assert.strictEqual(getMoveData("192")?.id, 192);
});

test("MOVE_REGISTRY 애니메이션 모듈 등록 및 프레임 구성 검증", () => {
  assert.strictEqual(MOVE_REGISTRY["zap-cannon"], zapCannonMove);
  assert.strictEqual(MOVE_REGISTRY["zap_cannon"], zapCannonMove);
  assert.strictEqual(MOVE_REGISTRY["zapcannon"], zapCannonMove);
  assert.strictEqual(MOVE_REGISTRY["전자포"], zapCannonMove);
  assert.strictEqual(MOVE_REGISTRY["192"], zapCannonMove);
  assert.strictEqual(zapCannonMove.num, 192);
  assert.strictEqual(zapCannonMove.type, "electric");
  assert.strictEqual(zapCannonMove.category, "special");
  const dummyCtx: any = { isPlayer: true, isHit: true, action: { damage: 100 }, enemyHp: 100, playerHp: 100, textLineIdx: 0 };
  const frames = zapCannonMove.buildFrames(dummyCtx);
  assert.strictEqual(frames.length, 17, "17개 액션 프레임으로 구성");
});

// ============================================================================
// 2. 상성 및 데미지 계산 검증
// ============================================================================
console.log("\n--- [2. 전기 타입 상성 및 특수 공격력 계산 검증] ---");

test("전기 타입 상성 검증 (물/비행 2배, 풀/드래곤/전기 0.5배, 땅 0배 무효)", () => {
  const magnezone = battleService.spawnWildPokemon(1, "Town", "magnezone", 50);
  const waterMon = battleService.spawnWildPokemon(1, "Town", "squirtle", 50);
  const flyingMon = battleService.spawnWildPokemon(1, "Town", "pidgey", 50);
  const grassMon = battleService.spawnWildPokemon(1, "Town", "bulbasaur", 50);
  const dragonMon = battleService.spawnWildPokemon(1, "Town", "dratini", 50);
  const electricMon = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);
  const groundMon = battleService.spawnWildPokemon(1, "Town", "diglett", 50);

  const waterRes = calculateDamage(magnezone, waterMon, zapCannonData, true, true);
  const flyingRes = calculateDamage(magnezone, flyingMon, zapCannonData, true, true);
  const grassRes = calculateDamage(magnezone, grassMon, zapCannonData, true, true);
  const dragonRes = calculateDamage(magnezone, dragonMon, zapCannonData, true, true);
  const electricRes = calculateDamage(magnezone, electricMon, zapCannonData, true, true);
  const groundRes = calculateDamage(magnezone, groundMon, zapCannonData, true, true);

  assert.strictEqual(waterRes.typeMod, 2.0, "물 타입 2.0배 (효과가 굉장했다)");
  assert.strictEqual(flyingRes.typeMod, 2.0, "비행 타입 2.0배 (효과가 굉장했다)");
  assert.strictEqual(grassRes.typeMod, 0.5, "풀 타입 0.5배 (효과가 별로였다)");
  assert.strictEqual(dragonRes.typeMod, 0.5, "드래곤 타입 0.5배 (효과가 별로였다)");
  assert.strictEqual(electricRes.typeMod, 0.5, "전기 타입 0.5배 (효과가 별로였다)");
  assert.strictEqual(groundRes.typeMod, 0.0, "땅 타입 0.0배 (효과가 없음)");
  assert.strictEqual(groundRes.damage, 0, "땅 타입 데미지 0");
});

test("특수 공격력(Sp. Atk) 기반 데미지 계산 및 랭크업 반영", () => {
  const magnezone = battleService.spawnWildPokemon(1, "Town", "magnezone", 50);
  const target = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);

  magnezone.stages.spa = 0;
  const dmgBase = calculateDamage(magnezone, target, zapCannonData, true, true).damage;

  magnezone.stages.spa = 2; // +2랭크 (+100% 특수공격력)
  const dmgBoosted = calculateDamage(magnezone, target, zapCannonData, true, true).damage;

  assert.ok(dmgBoosted > dmgBase, `특공 랭크 상승 시 데미지 증가 (기본: ${dmgBase}, 상승: ${dmgBoosted})`);
});

// ============================================================================
// 3. 100% 확정 마비 부가 효과 및 면역(Immunities) 검증
// ============================================================================
console.log("\n--- [3. 100% 확정 마비 부가 효과 및 면역 검증] ---");

test("피격 시 100% 확률로 마비(par) 상태이상 부여", () => {
  const magnezone = battleService.spawnWildPokemon(1, "Town", "magnezone", 50);
  magnezone.ability = "no-guard"; // 테스트를 위해 100% 명중 보장
  const target = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);

  assert.ok(!target.status, "초기 상태이상 없음");
  const res = executeSingleAction(magnezone, target, zapCannonData, true, true);

  assert.ok(res.damage > 0, "데미지가 적용됨");
  assert.strictEqual(target.status, "par", "100% 마비 상태이상 부여 성공");
});

test("전기 타입 상대에게는 마비 면역 적용", () => {
  const magnezone = battleService.spawnWildPokemon(1, "Town", "magnezone", 50);
  magnezone.ability = "no-guard";
  const electricTarget = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);

  assert.ok(!electricTarget.status);
  executeSingleAction(magnezone, electricTarget, zapCannonData, true, true);

  assert.ok(!electricTarget.status, "전기 타입은 마비에 걸리지 않음");
});

test("유연(Limber) 특성 상대에게는 마비 면역 적용", () => {
  const magnezone = battleService.spawnWildPokemon(1, "Town", "magnezone", 50);
  magnezone.ability = "no-guard";
  const limberTarget = battleService.spawnWildPokemon(1, "Town", "ditto", 50);
  limberTarget.ability = "limber";

  assert.ok(!limberTarget.status);
  executeSingleAction(magnezone, limberTarget, zapCannonData, true, true);

  assert.ok(!limberTarget.status, "유연(Limber) 특성은 마비에 걸리지 않음");
});

test("땅 타입 상대에게는 데미지 0 및 마비 미적용 (전기 공격 무효)", () => {
  const magnezone = battleService.spawnWildPokemon(1, "Town", "magnezone", 50);
  magnezone.ability = "no-guard";
  const groundTarget = battleService.spawnWildPokemon(1, "Town", "diglett", 50);

  assert.ok(!groundTarget.status);
  const prevHp = groundTarget.hp;
  const res = executeSingleAction(magnezone, groundTarget, zapCannonData, true, true);

  assert.strictEqual(res.damage, 0, "땅 타입에 데미지 0");
  assert.strictEqual(groundTarget.hp, prevHp, "체력 유지");
  assert.ok(!groundTarget.status, "데미지가 0이므로 마비도 미적용");
});

console.log("\n==========================================================");
console.log(`🎉 [전자포 전수 점검 통과] 총 ${passedCount}개 테스트 전체 성공!`);
console.log("==========================================================\n");
