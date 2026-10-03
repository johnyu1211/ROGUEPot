import { BattleService } from "../../src/services/battleService.js";
import { getMoveData, getMoveKey } from "../../src/data/movesKo.js";
import { executeSingleAction } from "../../src/battle/engine/TurnActionExecutor.js";
import { MOVE_REGISTRY } from "../../src/battle/moves/moveRegistry.js";
import { machPunchMove } from "../../src/battle/moves/definitions/183_mach_punch.js";
import { getMoveTrait } from "../../src/battle/moves/traits/moveTraits.js";
import { BattleEngine } from "../../src/battle/engine/BattleEngine.js";
import assert from "node:assert";

console.log("==========================================================");
console.log("🥊 [183. 마하펀치 (Mach Punch) 기술 구현 및 배틀 로직 전수 점검]");
console.log("==========================================================");

const battleService = new BattleService();
const machPunchData = getMoveData("mach-punch")!;

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

test("movesKo.ts 데이터: 183번, 격투 타입, 물리 공격기, 위력 40, 명중률 100, PP 30", () => {
  assert.ok(machPunchData, "mach-punch 데이터 존재");
  assert.strictEqual(machPunchData.id, 183, "기술 번호 183");
  assert.strictEqual(machPunchData.name, "mach-punch", "영문 식별자 mach-punch");
  assert.strictEqual(machPunchData.nameKo, "마하펀치", "한글 명칭 마하펀치");
  assert.strictEqual(machPunchData.type, "fighting", "격투 타입");
  assert.strictEqual(machPunchData.category, "physical", "물리 공격기(physical)");
  assert.strictEqual(machPunchData.power, 40, "위력 40");
  assert.strictEqual(machPunchData.accuracy, 100, "명중률 100");
  assert.strictEqual(machPunchData.pp, 30, "PP 30");
});

test("별칭 및 키 해석: '마하펀치', 'mach-punch', '183' 모두 mach-punch 반환", () => {
  assert.strictEqual(getMoveKey("mach-punch"), "mach-punch");
  assert.strictEqual(getMoveKey("마하펀치"), "mach-punch");
  assert.strictEqual(getMoveData("마하펀치")?.id, 183);
  assert.strictEqual(getMoveData("183")?.id, 183);
});

test("MOVE_REGISTRY 애니메이션 정의 등록 확인", () => {
  assert.ok(MOVE_REGISTRY["mach-punch"], "MOVE_REGISTRY['mach-punch'] 등록됨");
  assert.ok(MOVE_REGISTRY["183"], "MOVE_REGISTRY['183'] 등록됨");
  assert.ok(MOVE_REGISTRY["마하펀치"], "MOVE_REGISTRY['마하펀치'] 등록됨");
  assert.strictEqual(machPunchMove.num, 183);
  assert.strictEqual(machPunchMove.key, "mach-punch");
  assert.strictEqual(machPunchMove.camera?.type, "caster_to_target");
});

test("우선도(Priority) 검증: mach-punch, 183, 마하펀치 모두 우선도 +1", () => {
  assert.strictEqual(getMoveTrait("mach-punch")?.priority, 1, "mach-punch priority +1");
  assert.strictEqual(getMoveTrait("183")?.priority, 1, "183 priority +1");
  assert.strictEqual(getMoveTrait("마하펀치")?.priority, 1, "마하펀치 priority +1");
});

// ============================================================================
// 2. 물리 데미지 계산 및 상성 검증
// ============================================================================
console.log("\n--- [2. 물리 데미지 및 타입 상성 검증] ---");

test("노말 타입 상대에게 2배 굉장한 효과 데미지 발생", () => {
  const hitmonchan = battleService.spawnWildPokemon(1, "Town", "hitmonchan", 50);
  const snorlax = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);

  const initialHp = snorlax.hp;
  const res = executeSingleAction(hitmonchan, snorlax, machPunchData, true, true);

  assert.ok(res.damage > 0, "데미지가 정상 발생해야 함");
  assert.strictEqual(snorlax.hp, initialHp - res.damage, "상대 HP가 데미지만큼 감소해야 함");
  assert.ok(res.log.includes("효과가 굉장했다!"), "노말 타입에게 2배 상성 로그 출력 확인");
});

test("고스트 타입 상대에게 효과가 없음 (무효화, 데미지 0)", () => {
  const hitmonchan = battleService.spawnWildPokemon(1, "Town", "hitmonchan", 50);
  const gengar = battleService.spawnWildPokemon(1, "Town", "gengar", 50);

  const initialHp = gengar.hp;
  const res = executeSingleAction(hitmonchan, gengar, machPunchData, true, true);

  assert.strictEqual(res.damage, 0, "고스트 타입에게 격투 공격 데미지는 0");
  assert.strictEqual(gengar.hp, initialHp, "체력 감소 없음");
  assert.ok(res.log.includes("효과가 없는 것 같다"), "무효화 로그 확인");
});

// ============================================================================
// 3. BattleEngine 선제 공격(우선도 +1) 통합 검증
// ============================================================================
console.log("\n--- [3. BattleEngine 우선도 +1 선제공격 검증] ---");

test("스피드가 느린 시전자라도 우선도 +1로 인해 더 빠른 상대의 일반 기술보다 먼저 공격", () => {
  const slowFighter = battleService.spawnWildPokemon(1, "Cave", "machamp", 50);
  const fastOpponent = battleService.spawnWildPokemon(1, "Field", "jolteon", 50);

  slowFighter.speed = 10;   // 극단적으로 느린 스피드
  fastOpponent.speed = 250; // 극단적으로 빠른 스피드
  slowFighter.moves = ["mach-punch"];
  fastOpponent.moves = ["thunderbolt"];

  const battleState: any = {
    id: "test-battle-mach-punch",
    biome: "Town",
    wave: 1,
    turn: 1,
    turnCount: 0,
    playerParty: [slowFighter],
    playerActiveIndex: 0,
    playerBattleMon: slowFighter,
    enemy: fastOpponent,
  };

  const result = BattleEngine.executeTurn(battleState, "mach-punch", "ko", true);

  // 첫 번째로 실행된 액션이 플레이어의 마하펀치여야 함
  assert.ok(result.turnActions && result.turnActions.length > 0, "턴 액션 존재");
  assert.strictEqual(result.turnActions[0].actor, "player", "플레이어가 선제 공격해야 함");
  assert.strictEqual(result.turnActions[0].moveKey, "mach-punch", "선제 기술은 마하펀치");
});

// ============================================================================
// 4. 자속 보정(STAB) 및 물리 공격 스탯 반영 검증
// ============================================================================
console.log("\n--- [4. STAB 및 물리 공격 스탯 반영 검증] ---");

test("격투 타입 시전자(홍수몬)의 자속 보정(STAB 1.5배) 데미지 반영", () => {
  const hitmonchan = battleService.spawnWildPokemon(1, "Town", "hitmonchan", 50); // 격투
  const nonFighting = battleService.spawnWildPokemon(1, "Town", "rattata", 50);   // 노말
  nonFighting.atk = hitmonchan.atk; // 공격력 동일 세팅
  const target1 = battleService.spawnWildPokemon(1, "Town", "clefable", 50);
  const target2 = battleService.spawnWildPokemon(1, "Town", "clefable", 50);

  const resStab = executeSingleAction(hitmonchan, target1, machPunchData, false, true);
  const resNonStab = executeSingleAction(nonFighting, target2, machPunchData, false, true);

  assert.ok(resStab.damage > resNonStab.damage, "STAB 적용 시 데미지가 비자속보다 높아야 함");
});

test("공격력 증가에 따른 물리 데미지 증가 검증", () => {
  const lowAtkMon = battleService.spawnWildPokemon(1, "Town", "hitmonchan", 50);
  const highAtkMon = battleService.spawnWildPokemon(1, "Town", "hitmonchan", 50);
  lowAtkMon.atk = 50;
  highAtkMon.atk = 150;
  const def1 = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);
  const def2 = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);

  const resLow = executeSingleAction(lowAtkMon, def1, machPunchData, false, true);
  const resHigh = executeSingleAction(highAtkMon, def2, machPunchData, false, true);

  assert.ok(resHigh.damage > resLow.damage, "공격력이 높을수록 물리 데미지가 높아야 함");
});

// ============================================================================
// 5. 애니메이션 프레임 및 카메라 설정 정합성 검증
// ============================================================================
console.log("\n--- [5. 애니메이션 프레임 및 카메라 설정 정합성 검증] ---");

test("카메라 설정: caster_to_target, zoom 1.35, focalRatio 1.0, delayUntilStep 2", () => {
  assert.strictEqual(machPunchMove.camera?.type, "caster_to_target", "카메라 타입 caster_to_target");
  assert.strictEqual(machPunchMove.camera?.zoom, 1.35, "줌 배율 1.35x");
  assert.strictEqual(machPunchMove.camera?.focalRatio, 1.0, "focalRatio 1.0 (타겟 정중앙 100% 록온)");
  assert.strictEqual(machPunchMove.camera?.delayUntilStep, 2, "2단계부터 적 포커싱");
});

test("애니메이션 프레임 시퀀스 구조 검증 (Step 1 -> 2 -> 3 -> 4)", () => {
  const mockCtx = {
    isPlayer: true,
    isHit: true,
    action: { damage: 30 } as any,
    enemyHp: 100,
    playerHp: 100,
    textLineIdx: 0,
  };
  const frames = machPunchMove.buildFrames(mockCtx as any);
  assert.ok(frames.length >= 8, "프레임이 충분히 생성되어야 함");

  const step1Frames = frames.filter(f => f.moveStep === 1);
  const step2Frames = frames.filter(f => f.moveStep === 2);
  const step3Frames = frames.filter(f => f.moveStep === 3);
  const step4Frames = frames.filter(f => f.moveStep === 4);

  assert.ok(step1Frames.length >= 3, "Step 1 시전자 고속 대시 프레임 3개 이상");
  assert.ok(step1Frames.some(f => f.casterAfterimages && f.casterAfterimages.length > 0), "Step 1 잔상 포함");

  assert.ok(step2Frames.length >= 3, "Step 2 주먹 축소 및 속도선 프레임 3개 이상");
  assert.ok(step2Frames.every(f => f.fistProg !== undefined), "Step 2 주먹 진행도 fistProg 포함");

  assert.ok(step3Frames.length >= 4, "Step 3 타격 및 알갱이 감속/소산 프레임 4개");
  assert.ok(step3Frames.every(f => f.hitProgress !== undefined), "Step 3 hitProgress 포함");

  assert.ok(step4Frames.length >= 2, "Step 4 복귀 프레임 2개 이상");
});

console.log("\n==========================================================");
console.log(`🎉 [모든 마하펀치(Mach Punch) 배틀 로직 및 구현 검증 통과: 총 ${passedCount}개 테스트 통과]`);
console.log("==========================================================");
