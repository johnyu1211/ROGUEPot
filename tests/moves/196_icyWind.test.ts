import { BattleService } from "../../src/services/battleService.js";
import { getMoveData, getMoveKey } from "../../src/data/movesKo.js";
import { executeSingleAction } from "../../src/battle/engine/TurnActionExecutor.js";
import { MOVE_REGISTRY } from "../../src/battle/moves/moveRegistry.js";
import { icyWindMove } from "../../src/battle/moves/definitions/196_icy_wind.js";
import { getStageMultiplier } from "../../src/battle/mechanics/statModifier.js";
import assert from "node:assert";

console.log("==========================================================");
console.log("🔍 [196. 얼어붙은바람 (Icy Wind) 기술 구현 및 배틀 로직 전수 점검]");
console.log("==========================================================");

const battleService = new BattleService();
const icyWindData = getMoveData("icy-wind")!;

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

test("movesKo.ts 데이터: 196번, 얼음 타입, 특수기, 위력 55, 명중률 95, PP 15", () => {
  assert.ok(icyWindData, "icy-wind 데이터 존재");
  assert.strictEqual(icyWindData.id, 196, "기술 번호 196");
  assert.strictEqual(icyWindData.name, "icy-wind", "영문 식별자 icy-wind");
  assert.strictEqual(icyWindData.nameKo, "얼어붙은바람", "한글 명칭 얼어붙은바람");
  assert.strictEqual(icyWindData.type, "ice", "얼음 타입");
  assert.strictEqual(icyWindData.category, "special", "특수 공격기(special)");
  assert.strictEqual(icyWindData.power, 55, "위력 55");
  assert.strictEqual(icyWindData.accuracy, 95, "명중률 95");
  assert.strictEqual(icyWindData.pp, 15, "PP 15");
});

test("별칭 및 키 해석: '얼어붙은바람', 'icy-wind', '196' 모두 icy-wind 반환", () => {
  assert.strictEqual(getMoveKey("icy-wind"), "icy-wind");
  assert.strictEqual(getMoveKey("얼어붙은바람"), "icy-wind");
  assert.strictEqual(getMoveData("얼어붙은바람")?.id, 196);
});

test("MOVE_REGISTRY 애니메이션 모듈 등록 검증", () => {
  assert.strictEqual(MOVE_REGISTRY["icy-wind"], icyWindMove);
  assert.strictEqual(MOVE_REGISTRY["얼어붙은바람"], icyWindMove);
  assert.strictEqual(MOVE_REGISTRY["196"], icyWindMove);
  assert.strictEqual(icyWindMove.num, 196);
  assert.strictEqual(icyWindMove.type, "ice");
  assert.strictEqual(icyWindMove.category, "special");
});

// ============================================================================
// 2. 기본 배틀 로직 및 100% 스피드 1랭크 하락 검증
// ============================================================================
console.log("\n--- [2. 기본 배틀 로직 및 100% 확정 스피드 1랭크 하락 검증] ---");

test("피격 시 데미지 적용 및 대상 스피드 -1랭크 하강", () => {
  const attacker = battleService.spawnWildPokemon(1, "Town", "swinub", 50);
  attacker.ability = "no-guard";
  const target = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);

  const prevHp = target.hp;
  target.stages.spe = 0;
  const res = executeSingleAction(attacker, target, icyWindData, true, true);

  assert.ok(res.damage > 0, `데미지가 0보다 커야 함 (실제: ${res.damage})`);
  assert.ok(target.hp < prevHp, "체력이 감소해야 함");
  assert.strictEqual(target.stages.spe, -1, "상대 스피드가 -1랭크가 되어야 함");
  assert.ok(res.log.includes("스피드가 떨어졌다! (-1)"), "로그에 스피드 하락이 출력되어야 함");
});

test("연속 피격 시 -1 -> -2 -> -3 ... -> -6랭크 누적 및 최저치 클램핑 검증", () => {
  const attacker = battleService.spawnWildPokemon(1, "Town", "swinub", 20);
  attacker.ability = "no-guard"; // 테스트를 위해 명중 100% 보장
  const target = battleService.spawnWildPokemon(1, "Town", "blissey", 100);

  target.stages.spe = 0;
  for (let i = 1; i <= 6; i++) {
    executeSingleAction(attacker, target, icyWindData, true, true);
    assert.strictEqual(target.stages.spe, -i, `단계 ${i}에서 스피드 -${i}랭크여야 함`);
  }

  // -6랭크에서 추가 공격 시 -6 이하로 떨어지지 않음
  executeSingleAction(attacker, target, icyWindData, true, true);
  assert.strictEqual(target.stages.spe, -6, "최저치 -6랭크 유지");
});

test("스피드 승수(Multiplier) 공식 검증: -1랭크 시 0.67배 (2/3)", () => {
  const mult0 = getStageMultiplier(0);
  const multMinus1 = getStageMultiplier(-1);
  const multMinus2 = getStageMultiplier(-2);
  const multMinus6 = getStageMultiplier(-6);

  assert.strictEqual(mult0, 1.0, "0랭크 승수는 1.0");
  assert.ok(Math.abs(multMinus1 - 2 / 3) < 0.01, "-1랭크 승수는 2/3 (~0.67)");
  assert.ok(Math.abs(multMinus2 - 2 / 4) < 0.01, "-2랭크 승수는 2/4 (0.50)");
  assert.ok(Math.abs(multMinus6 - 2 / 8) < 0.01, "-6랭크 승수는 2/8 (0.25)");
});

// ============================================================================
// 3. 상성 (Type Effectiveness) 판정 검증
// ============================================================================
console.log("\n--- [3. 얼음 타입 상성 판정 검증] ---");

test("얼음 2배 약점 대상 (풀/땅/비행/드래곤): 효과가 굉장함 판정", () => {
  const attacker = battleService.spawnWildPokemon(1, "Town", "glaceon", 50);
  const dragonTarget = battleService.spawnWildPokemon(1, "Town", "dragonite", 50); // 드래곤/비행 -> 얼음 4배!
  const grassTarget = battleService.spawnWildPokemon(1, "Town", "tangela", 50); // 풀 -> 2배

  const resDragon = executeSingleAction(attacker, dragonTarget, icyWindData, true, true);
  assert.ok(resDragon.typeMod > 1.0, "드래곤/비행에게 효과가 굉장해야 함");
  assert.strictEqual(resDragon.isSuperEffective, true);

  const resGrass = executeSingleAction(attacker, grassTarget, icyWindData, true, true);
  assert.ok(resGrass.typeMod > 1.0, "풀 타입에게 효과가 굉장해야 함");
  assert.strictEqual(resGrass.isSuperEffective, true);
});

test("얼음 반감 대상 (불꽃/물/얼음/강철): 효과가 별로임 판정", () => {
  const attacker = battleService.spawnWildPokemon(1, "Town", "glaceon", 50);
  const fireTarget = battleService.spawnWildPokemon(1, "Town", "vulpix", 50); // 불꽃: 0.5배
  const waterTarget = battleService.spawnWildPokemon(1, "Town", "squirtle", 50); // 물: 0.5배

  const resFire = executeSingleAction(attacker, fireTarget, icyWindData, true, true);
  assert.strictEqual(resFire.typeMod, 0.5, "불꽃 타입에게 0.5배 반감");

  const resWater = executeSingleAction(attacker, waterTarget, icyWindData, true, true);
  assert.strictEqual(resWater.typeMod, 0.5, "물 타입에게 0.5배 반감");
});

// ============================================================================
// 4. 애니메이션 프레임 디버프 연동 검증
// ============================================================================
console.log("\n--- [4. 애니메이션 프레임 디버프 연동 검증] ---");

test("buildFrames: 피격 시 statProgress 및 statDirection: 'down' 프레임 포함 검증", () => {
  const mockCtxHit = {
    action: { actionType: "move", moveKey: "icy-wind" } as any,
    isPlayer: true,
    isHit: true,
    isMiss: false,
    enemyHp: 100,
    playerHp: 100,
    textLineIdx: 0,
  };

  const framesHit = icyWindMove.buildFrames(mockCtxHit);
  const debuffFrames = framesHit.filter((f) => f.statProgress !== undefined);

  assert.ok(debuffFrames.length >= 4, `디버프 프레임 4개 이상 포함 (실제: ${debuffFrames.length})`);
  assert.ok(debuffFrames.every((f) => f.statDirection === "down"), "모든 디버프 프레임의 방향이 'down'");
  assert.strictEqual(debuffFrames[0].statProgress, 0.22);
  assert.strictEqual(debuffFrames[debuffFrames.length - 1].statProgress, 0.98);
});

test("buildFrames: 빗나감(Miss) 시 디버프 프레임 생략 검증", () => {
  const mockCtxMiss = {
    action: { actionType: "move", moveKey: "icy-wind" } as any,
    isPlayer: true,
    isHit: false,
    isMiss: true,
    enemyHp: 100,
    playerHp: 100,
    textLineIdx: 0,
  };

  const framesMiss = icyWindMove.buildFrames(mockCtxMiss);
  const debuffFrames = framesMiss.filter((f) => f.statProgress !== undefined);

  assert.strictEqual(debuffFrames.length, 0, "빗나갔을 때는 디버프 프레임이 생성되지 않아야 함");
});

console.log("\n==========================================================");
console.log(`🎉 [전수 검증 성공] 총 ${passedCount}개 테스트 항목 모두 100% 통과!`);
console.log("==========================================================");
