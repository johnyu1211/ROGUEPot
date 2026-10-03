import { BattleService } from "../../src/services/battleService.js";
import { getMoveData, getMoveKey } from "../../src/data/movesKo.js";
import { executeSingleAction } from "../../src/battle/engine/TurnActionExecutor.js";
import { MOVE_REGISTRY } from "../../src/battle/moves/moveRegistry.js";
import { protectMove } from "../../src/battle/moves/definitions/182_protect.js";
import { getMoveTrait } from "../../src/battle/moves/traits/moveTraits.js";
import { BattleEngine } from "../../src/battle/engine/BattleEngine.js";
import assert from "node:assert";

console.log("==========================================================");
console.log("🛡️ [182. 방어 (Protect) 기술 구현 및 배틀 로직 전수 점검]");
console.log("==========================================================");

const battleService = new BattleService();
const protectData = getMoveData("protect")!;
const tackleData = getMoveData("tackle")!;
const thunderboltData = getMoveData("thunderbolt")!;
const thunderWaveData = getMoveData("thunder-wave")!;
const jumpKickData = getMoveData("jump-kick") || { id: 26, name: "jump-kick", nameKo: "점프킥", type: "fighting", category: "physical", power: 100, accuracy: 95, pp: 10 };
const explosionData = getMoveData("explosion") || { id: 153, name: "explosion", nameKo: "대폭발", type: "normal", category: "physical", power: 250, accuracy: 100, pp: 5 };

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

test("movesKo.ts 데이터: 182번, 노말 타입, 변화기, PP 10", () => {
  assert.ok(protectData, "protect 데이터 존재");
  assert.strictEqual(protectData.id, 182, "기술 번호 182");
  assert.strictEqual(protectData.name, "protect", "영문 식별자 protect");
  assert.strictEqual(protectData.nameKo, "방어", "한글 명칭 방어");
  assert.strictEqual(protectData.type, "normal", "노말 타입");
  assert.strictEqual(protectData.category, "status", "변화기(status)");
  assert.strictEqual(protectData.pp, 10, "PP 10");
});

test("별칭 및 키 해석: '방어', 'protect', '182' 모두 protect 반환", () => {
  assert.strictEqual(getMoveKey("protect"), "protect");
  assert.strictEqual(getMoveKey("방어"), "protect");
  assert.strictEqual(getMoveData("방어")?.id, 182);
  assert.strictEqual(getMoveData("182")?.id, 182);
});

test("MOVE_REGISTRY 애니메이션 정의 등록 확인", () => {
  assert.ok(MOVE_REGISTRY["protect"], "MOVE_REGISTRY['protect'] 등록됨");
  assert.ok(MOVE_REGISTRY["182"], "MOVE_REGISTRY['182'] 등록됨");
  assert.ok(MOVE_REGISTRY["방어"], "MOVE_REGISTRY['방어'] 등록됨");
  assert.strictEqual(protectMove.num, 182);
  assert.strictEqual(protectMove.key, "protect");
});

test("우선도(Priority) 검증: protect, 182, 방어 모두 우선도 +4", () => {
  assert.strictEqual(getMoveTrait("protect")?.priority, 4, "protect priority +4");
  assert.strictEqual(getMoveTrait("182")?.priority, 4, "182 priority +4");
  assert.strictEqual(getMoveTrait("방어")?.priority, 4, "방어 priority +4");
});

// ============================================================================
// 2. 기본 배틀 로직: 방어 자세 취하기 및 공격 무효화 검증
// ============================================================================
console.log("\n--- [2. 기본 배틀 로직 및 방어 성공 검증] ---");

test("방어 사용 시 isProtected = true 설정 및 방어 자세 로그 출력", () => {
  const blastoise = battleService.spawnWildPokemon(1, "Town", "blastoise", 50);
  const charizard = battleService.spawnWildPokemon(1, "Town", "charizard", 50);

  const res = executeSingleAction(blastoise, charizard, protectData, true, true);
  assert.strictEqual(blastoise.isProtected, true, "isProtected 가 true로 설정되어야 함");
  assert.strictEqual(blastoise.protectCounter, 1, "protectCounter가 1로 증가해야 함");
  assert.strictEqual(res.damage, 0, "데미지는 0");
  assert.ok(res.log.includes("방어 자세를 취했다!"), "방어 자세 로그 출력 확인");
});

test("방어 상태인 대상에게 물리 공격(몸통박치기) 시도 시 데미지 0 및 막아냄", () => {
  const blastoise = battleService.spawnWildPokemon(1, "Town", "blastoise", 50);
  const charizard = battleService.spawnWildPokemon(1, "Town", "charizard", 50);

  blastoise.isProtected = true;
  const initialHp = blastoise.hp;

  const res = executeSingleAction(charizard, blastoise, tackleData, false, true);
  assert.strictEqual(res.damage, 0, "데미지 0");
  assert.strictEqual(blastoise.hp, initialHp, "HP 감소 없음");
  assert.ok(res.log.includes("공격을 막아냈다!"), "공격 막아냄 안내 로그 확인");
});

test("방어 상태인 대상에게 특수 공격(10만볼트) 시도 시 데미지 0 및 막아냄", () => {
  const blastoise = battleService.spawnWildPokemon(1, "Town", "blastoise", 50);
  const pikachu = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);

  blastoise.isProtected = true;
  const initialHp = blastoise.hp;

  const res = executeSingleAction(pikachu, blastoise, thunderboltData, false, true);
  assert.strictEqual(res.damage, 0, "특수 기술 데미지 0");
  assert.strictEqual(blastoise.hp, initialHp, "HP 감소 없음");
  assert.ok(res.log.includes("공격을 막아냈다!"), "공격 막아냄 안내 로그 확인");
});

test("방어 상태인 대상에게 상대 변화기(전기자석파) 시도 시 무효화", () => {
  const blastoise = battleService.spawnWildPokemon(1, "Town", "blastoise", 50);
  const pikachu = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);

  blastoise.isProtected = true;
  const res = executeSingleAction(pikachu, blastoise, thunderWaveData, false, true);

  assert.ok(!blastoise.status, "마비에 걸리지 않아야 함");
  assert.ok(res.log.includes("공격을 막아냈다!"), "상대 변화기도 방어로 완벽 차단");
});

// ============================================================================
// 3. 특수 인터랙션 (점프킥 충돌 데미지, 대폭발 자폭)
// ============================================================================
console.log("\n--- [3. 특수 공격과의 상호작용 검증] ---");

test("방어 중인 대상에게 점프킥을 사용하면 빗나감 판정으로 최대 체력의 50% 반동 충돌 피해 발생", () => {
  const blastoise = battleService.spawnWildPokemon(1, "Town", "blastoise", 50);
  const hitmonlee = battleService.spawnWildPokemon(1, "Town", "hitmonlee", 50);

  blastoise.isProtected = true;
  const initialHleeHp = hitmonlee.hp;
  const expectedCrash = Math.floor(hitmonlee.maxHp * 0.5);

  const res = executeSingleAction(hitmonlee, blastoise, jumpKickData, false, true);
  assert.strictEqual(res.damage, 0, "방어 중인 상대 피해 없음");
  assert.strictEqual(hitmonlee.hp, initialHleeHp - expectedCrash, "시전자 충돌 데미지 50% 입음");
  assert.ok(res.log.includes("땅에 부딪혀 큰 상처를 입었다!"), "점프킥 충돌 로그 확인");
});

test("방어 중인 대상에게 대폭발을 사용하면 시전자는 쓰러지나 상대는 피해를 입지 않음", () => {
  const blastoise = battleService.spawnWildPokemon(1, "Town", "blastoise", 50);
  const electrode = battleService.spawnWildPokemon(1, "Town", "electrode", 50);

  blastoise.isProtected = true;
  const initialBlastoiseHp = blastoise.hp;

  const res = executeSingleAction(electrode, blastoise, explosionData, false, true);
  assert.strictEqual(res.damage, 0, "방어 중인 상대 피해 0");
  assert.strictEqual(blastoise.hp, initialBlastoiseHp, "방어 상대 체력 보존");
  assert.strictEqual(electrode.hp, 0, "대폭발 시전자 사망");
  assert.ok(res.log.includes("스스로 쓰러졌다!"), "자폭 로그 확인");
  assert.ok(res.log.includes("공격을 막아냈다!"), "방어 로그 확인");
});

// ============================================================================
// 4. 연속 사용 시 성공률 감소 및 다른 기술 사용 시 카운터 초기화 검증
// ============================================================================
console.log("\n--- [4. 연속 사용 및 카운터 초기화 검증] ---");

test("다른 기술 사용 시 protectCounter가 0으로 초기화됨", () => {
  const blastoise = battleService.spawnWildPokemon(1, "Town", "blastoise", 50);
  const charizard = battleService.spawnWildPokemon(1, "Town", "charizard", 50);

  // 1턴 방어 사용
  executeSingleAction(blastoise, charizard, protectData, true, true);
  assert.strictEqual(blastoise.protectCounter, 1, "1회 사용 후 카운터 1");

  // 2턴 몸통박치기 사용
  executeSingleAction(blastoise, charizard, tackleData, true, true);
  assert.strictEqual(blastoise.protectCounter, 0, "다른 기술 사용 시 카운터 0 초기화");
});

test("연속 방어 사용 시 확률에 의해 실패할 수 있으며, 실패 시 카운터가 리셋됨", () => {
  const blastoise = battleService.spawnWildPokemon(1, "Town", "blastoise", 50);
  const charizard = battleService.spawnWildPokemon(1, "Town", "charizard", 50);

  // 4연속 방어 강제 시뮬레이션
  blastoise.protectCounter = 3; // 이미 3연속 성공한 상태 가정 (다음 확률: (1/3)^3 = 약 3.7%)
  let failObserved = false;
  for (let i = 0; i < 30; i++) {
    blastoise.protectCounter = 3;
    const res = executeSingleAction(blastoise, charizard, protectData, true, true);
    if (res.log.includes("하지만 기술은 실패했다!")) {
      failObserved = true;
      assert.strictEqual(blastoise.protectCounter, 0, "실패 시 카운터는 0으로 리셋");
      assert.strictEqual(blastoise.isProtected, false, "실패 시 보호 상태 해제");
      break;
    }
  }
  assert.ok(failObserved, "연속 방어 사용 시 실패가 정상 발생해야 함");
});

// ============================================================================
// 5. BattleEngine 턴 진행 통합 검증 (우선도 +4에 의해 느린 포켓몬도 선제 방어)
// ============================================================================
console.log("\n--- [5. BattleEngine 통합 턴 우선도 및 리셋 검증] ---");

test("스피드가 느린 포켓몬이라도 방어의 +4 우선도로 인해 선제 발동하여 상대 공격을 차단", () => {
  const slowSnorlax = battleService.spawnWildPokemon(1, "Cave", "snorlax", 50);
  const fastJolteon = battleService.spawnWildPokemon(1, "Field", "jolteon", 50);

  slowSnorlax.speed = 10;
  fastJolteon.speed = 200;
  slowSnorlax.moves = ["protect"];
  fastJolteon.moves = ["thunderbolt"];

  const battleState: any = {
    id: "test-battle-protect",
    biome: "Town",
    wave: 1,
    turn: 1,
    turnCount: 0,
    playerParty: [slowSnorlax],
    playerActiveIndex: 0,
    playerBattleMon: slowSnorlax,
    enemy: fastJolteon,
  };

  const initialHp = slowSnorlax.hp;
  const result = BattleEngine.executeTurn(battleState, "protect", "ko", true);

  // 로그 확인
  const logStr = (result.turnActions || []).map(a => a.log).join("\n");
  assert.ok(logStr.includes("방어 자세를 취했다!"), "잠만보가 우선도 +4로 먼저 방어");
  assert.ok(logStr.includes("공격을 막아냈다!"), "쥬피썬더의 10만볼트가 막힘");
  assert.strictEqual(slowSnorlax.hp, initialHp, "잠만보 체력 손실 0");
});

test("다음 턴 시작 시 isProtected가 false로 초기화되어 무한 무적 상태가 방지됨", () => {
  const blastoise = battleService.spawnWildPokemon(1, "Town", "blastoise", 50);
  const charizard = battleService.spawnWildPokemon(1, "Town", "charizard", 50);

  blastoise.moves = ["protect", "tackle"];
  charizard.moves = ["flamethrower"];

  const battleState: any = {
    id: "test-battle-protect-2",
    biome: "Town",
    wave: 1,
    turn: 1,
    turnCount: 0,
    playerParty: [blastoise],
    playerActiveIndex: 0,
    playerBattleMon: blastoise,
    enemy: charizard,
  };

  // 1턴: 방어 성공
  BattleEngine.executeTurn(battleState, "protect", "ko", true);
  assert.strictEqual(blastoise.isProtected, true, "1턴째 방어 성공 상태");

  // 2턴 시작 시점에 isProtected는 다시 false로 리셋되고, 이번엔 몸통박치기 사용
  BattleEngine.executeTurn(battleState, "tackle", "ko", true);
  assert.strictEqual(blastoise.isProtected, false, "새 턴에 방어를 쓰지 않으면 isProtected는 false");
  assert.ok(blastoise.hp < blastoise.maxHp, "2턴째에는 화염방사 데미지를 정상적으로 입음");
});

console.log("\n==========================================================");
console.log(`🎉 [모든 방어(Protect) 배틀 로직 검증 통과: 총 ${passedCount}개 테스트 통과]`);
console.log("==========================================================");
