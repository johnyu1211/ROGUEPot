import { BattleService } from "../../src/services/battleService.js";
import { getMoveData, getMoveKey } from "../../src/data/movesKo.js";
import { executeSingleAction } from "../../src/battle/engine/TurnActionExecutor.js";
import { calculateDamage } from "../../src/battle/mechanics/damageCalculator.js";
import { MOVE_REGISTRY } from "../../src/battle/moves/moveRegistry.js";
import { octazookaMove } from "../../src/battle/moves/definitions/190_octazooka.js";
import { getAccuracyMultiplier } from "../../src/battle/mechanics/statModifier.js";
import assert from "node:assert";

console.log("==========================================================");
console.log("🔍 [190. 대포무노포 (Octazooka) 기술 구현 및 배틀 로직 전수 점검]");
console.log("==========================================================");

const battleService = new BattleService();
const octazookaData = getMoveData("octazooka")!;

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

test("movesKo.ts 데이터: 190번, 물 타입, 특수기, 위력 65, 명중률 85, PP 10", () => {
  assert.ok(octazookaData, "octazooka 데이터 존재");
  assert.strictEqual(octazookaData.id, 190, "기술 번호 190");
  assert.strictEqual(octazookaData.name, "octazooka", "영문 식별자 octazooka");
  assert.strictEqual(octazookaData.nameKo, "대포무노포", "한글 명칭 대포무노포");
  assert.strictEqual(octazookaData.type, "water", "물 타입");
  assert.strictEqual(octazookaData.category, "special", "특수 공격기(special)");
  assert.strictEqual(octazookaData.power, 65, "위력 65");
  assert.strictEqual(octazookaData.accuracy, 85, "명중률 85");
  assert.strictEqual(octazookaData.pp, 10, "PP 10");
});

test("별칭 및 키 해석: '대포무노포', 'octazooka', '190' 모두 octazooka 반환", () => {
  assert.strictEqual(getMoveKey("octazooka"), "octazooka");
  assert.strictEqual(getMoveKey("대포무노포"), "octazooka");
  assert.strictEqual(getMoveData("대포무노포")?.id, 190);
});

test("MOVE_REGISTRY 애니메이션 모듈 등록 및 프레임 구성 검증", () => {
  assert.strictEqual(MOVE_REGISTRY["octazooka"], octazookaMove);
  assert.strictEqual(MOVE_REGISTRY["대포무노포"], octazookaMove);
  assert.strictEqual(MOVE_REGISTRY["190"], octazookaMove);
  assert.strictEqual(octazookaMove.num, 190);
  assert.strictEqual(octazookaMove.type, "water");
  const dummyCtx: any = { isPlayer: true, isHit: true, action: { damage: 50 }, enemyHp: 100, playerHp: 100, textLineIdx: 0 };
  const frames = octazookaMove.buildFrames(dummyCtx);
  assert.strictEqual(frames.length, 11, "11개 액션 프레임으로 구성");
});

// ============================================================================
// 2. 기본 배틀 로직 및 50% 명중률 1랭크 하락 검증
// ============================================================================
console.log("\n--- [2. 기본 배틀 로직 및 명중률 랭크 하락 검증] ---");

test("피격 시 데미지 적용 및 50% 확률 명중률 하강 로직 검증", () => {
  const octillery = battleService.spawnWildPokemon(1, "Town", "octillery", 50);
  octillery.ability = "no-guard"; // 항상 적중하도록 설정하여 부가효과 확률 검증
  const target = battleService.spawnWildPokemon(1, "Town", "charmander", 50);

  const prevHp = target.hp;
  target.stages.acc = 0;
  const res = executeSingleAction(octillery, target, octazookaData, true, true);

  assert.ok(res.damage > 0, `데미지가 0보다 커야 함 (실제: ${res.damage})`);
  assert.ok(target.hp < prevHp, "체력이 감소해야 함");

  // 확률적 랭크 하락 시뮬레이션 (100회 시도 시 -1 또는 누적 하강 확인)
  let dropCount = 0;
  for (let i = 0; i < 100; i++) {
    const dummyTarget = battleService.spawnWildPokemon(1, "Town", "blissey", 100);
    dummyTarget.stages.acc = 0;
    executeSingleAction(octillery, dummyTarget, octazookaData, true, true);
    if (dummyTarget.stages.acc === -1) {
      dropCount++;
    }
  }

  // 50% 확률이므로 100회 중 30~70회 범위 내에 들어야 정상
  assert.ok(
    dropCount >= 30 && dropCount <= 70,
    `50% 확률 명중률 하강 검증 실패 (100회 중 ${dropCount}회 발동)`
  );
  console.log(`   (100회 시뮬레이션 중 ${dropCount}회 명중률 -1 하락 발동 - 50% 확률 검증 성공)`);
});

test("명중률 하한선 검증 (-6랭크에서 추가 하강 방지)", () => {
  const octillery = battleService.spawnWildPokemon(1, "Town", "octillery", 50);
  octillery.ability = "no-guard";
  const target = battleService.spawnWildPokemon(1, "Town", "blissey", 100);
  target.stages.acc = -6;

  executeSingleAction(octillery, target, octazookaData, true, true);
  assert.strictEqual(target.stages.acc, -6, "최저치 -6랭크 유지");
});

test("물 타입 상성 검증 (불꽃 2배 / 풀 0.5배 / 물 0.5배)", () => {
  const octillery = battleService.spawnWildPokemon(1, "Town", "octillery", 50);
  const fireMon = battleService.spawnWildPokemon(1, "Town", "charmander", 50);
  const grassMon = battleService.spawnWildPokemon(1, "Town", "bulbasaur", 50);
  const waterMon = battleService.spawnWildPokemon(1, "Town", "squirtle", 50);

  const fireRes = calculateDamage(octillery, fireMon, octazookaData, true, true);
  const grassRes = calculateDamage(octillery, grassMon, octazookaData, true, true);
  const waterRes = calculateDamage(octillery, waterMon, octazookaData, true, true);

  assert.strictEqual(fireRes.typeMod, 2.0, "불꽃 타입에 2.0배 효과가 굉장했다");
  assert.strictEqual(grassRes.typeMod, 0.5, "풀 타입에 0.5배 효과가 별로였다");
  assert.strictEqual(waterRes.typeMod, 0.5, "물 타입에 0.5배 효과가 별로였다");
});

test("특수 공격력(Sp. Atk) 기반 데미지 계산 검증", () => {
  const octillery = battleService.spawnWildPokemon(1, "Town", "octillery", 50);
  const target = battleService.spawnWildPokemon(1, "Town", "blissey", 50);

  // 특수 공격 랭크를 올렸을 때 데미지 증가 확인
  octillery.stages.spa = 0;
  const dmgBase = calculateDamage(octillery, target, octazookaData, true, true).damage;

  octillery.stages.spa = 2; // +2랭크 (+100% 특수공격력)
  const dmgBoosted = calculateDamage(octillery, target, octazookaData, true, true).damage;

  assert.ok(dmgBoosted > dmgBase, `특수공격 랭크 상승 시 데미지 증가 (기본: ${dmgBase}, 상승: ${dmgBoosted})`);
});

console.log("\n==========================================================");
console.log(`🎉 [대포무노포 전수 점검 통과] 총 ${passedCount}개 테스트 전체 성공!`);
console.log("==========================================================\n");

