import { BattleService } from "../../src/services/battleService.js";
import { getMoveData, getMoveKey } from "../../src/data/movesKo.js";
import { executeSingleAction } from "../../src/battle/engine/TurnActionExecutor.js";
import { MOVE_REGISTRY } from "../../src/battle/moves/moveRegistry.js";
import { spikesMove } from "../../src/battle/moves/definitions/191_spikes.js";
import assert from "node:assert";

console.log("==========================================================");
console.log("🔍 [191. 압정뿌리기 (Spikes) 기술 구현 및 배틀 로직 전수 점검]");
console.log("==========================================================");

const battleService = new BattleService();
const spikesData = getMoveData("spikes")!;

let passedCount = 0;
async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
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

await test("movesKo.ts 데이터: 191번, 땅 타입, 변화기, 위력 null, 명중률 null, PP 20", () => {
  assert.ok(spikesData, "spikes 데이터 존재");
  assert.strictEqual(spikesData.id, 191, "기술 번호 191");
  assert.strictEqual(spikesData.name, "spikes", "영문 식별자 spikes");
  assert.strictEqual(spikesData.nameKo, "압정뿌리기", "한글 명칭 압정뿌리기");
  assert.strictEqual(spikesData.type, "ground", "땅 타입");
  assert.strictEqual(spikesData.category, "status", "변화기(status)");
  assert.strictEqual(spikesData.power, null, "위력 null");
  assert.strictEqual(spikesData.accuracy, null, "명중률 null (필중)");
  assert.strictEqual(spikesData.pp, 20, "PP 20");
});

await test("별칭 및 키 해석: '압정뿌리기', 'spikes', '191' 모두 spikes 반환", () => {
  assert.strictEqual(getMoveKey("spikes"), "spikes");
  assert.strictEqual(getMoveKey("압정뿌리기"), "spikes");
  assert.strictEqual(getMoveData("압정뿌리기")?.id, 191);
});

await test("MOVE_REGISTRY 애니메이션 모듈 등록 및 프레임 구성 검증", () => {
  assert.strictEqual(MOVE_REGISTRY["spikes"], spikesMove);
  assert.strictEqual(MOVE_REGISTRY["압정뿌리기"], spikesMove);
  assert.strictEqual(MOVE_REGISTRY["191"], spikesMove);
  assert.strictEqual(spikesMove.num, 191);
  assert.strictEqual(spikesMove.type, "ground");
  assert.strictEqual(spikesMove.category, "status");
  const dummyCtx: any = { isPlayer: true, isHit: true, action: { damage: 0 }, enemyHp: 100, playerHp: 100, textLineIdx: 0 };
  const frames = spikesMove.buildFrames(dummyCtx);
  assert.strictEqual(frames.length, 11, "11개 액션 프레임으로 구성");
});

// ============================================================================
// 2. 압정뿌리기 설치 배틀 로직 및 3겹 한계치 검증
// ============================================================================
console.log("\n--- [2. 압정 설치 로직 및 3겹 중첩 한계 검증] ---");

await test("압정 1겹, 2겹, 3겹 순차 설치 및 4회차 시도 시 실패 검증", () => {
  const user = battleService.spawnWildPokemon(1, "Town", "forretress", 50);
  const target = battleService.spawnWildPokemon(1, "Town", "blissey", 50);

  const mockBattle: any = {
    playerBattleMon: user,
    enemy: target,
    enemySpikesLayers: 0,
  };

  // 1회차 설치
  const res1 = executeSingleAction(user, target, spikesData, true, true, mockBattle);
  assert.strictEqual(mockBattle.enemySpikesLayers, 1, "1회 사용 시 1겹");
  assert.ok(res1.log.includes("1겹"), "1겹 메시지 포함");

  // 2회차 설치
  const res2 = executeSingleAction(user, target, spikesData, true, true, mockBattle);
  assert.strictEqual(mockBattle.enemySpikesLayers, 2, "2회 사용 시 2겹");
  assert.ok(res2.log.includes("2겹"), "2겹 메시지 포함");

  // 3회차 설치
  const res3 = executeSingleAction(user, target, spikesData, true, true, mockBattle);
  assert.strictEqual(mockBattle.enemySpikesLayers, 3, "3회 사용 시 3겹 (최대치)");
  assert.ok(res3.log.includes("3겹"), "3겹 메시지 포함");

  // 4회차 설치 (최대치 초과 실패)
  const res4 = executeSingleAction(user, target, spikesData, true, true, mockBattle);
  assert.strictEqual(mockBattle.enemySpikesLayers, 3, "최대 3겹 유지");
  assert.ok(res4.log.includes("이미 압정이 가득 뿌려져 있다"), "설치 한계 도달 메시지 출력");
});

// ============================================================================
// 3. 교체 등장 시 압정 피격 데미지 및 비행 타입 무효 검증
// ============================================================================
console.log("\n--- [3. 교체 시 피격 데미지 및 비행 무효 검증] ---");

await test("교체 등장 시 접지 포켓몬(Charmander) 압정 데미지 적용 (1겹 1/8, 2겹 1/6, 3겹 1/4)", async () => {
  const { saveService } = await import("../../src/services/saveService.js");
  const testUserId = `test_spikes_${Date.now()}`;
  saveService.createNewRunWithParty(testUserId, 1, [
    { speciesId: "forretress", name: "forretress", level: 50, hp: 100, maxHp: 100, moves: ["spikes"] },
    { speciesId: "charmander", name: "charmander", level: 50, hp: 120, maxHp: 120, moves: ["tackle"] },
  ]);
  const battle = battleService.getOrCreateBattle(testUserId, 1);
  battle.playerParty[1].maxHp = 120;
  battle.playerParty[1].hp = 120;

  // 1겹 설정 (1/8 = 15 HP)
  battle.playerSpikesLayers = 1;
  battleService.switchPlayerPokemon(testUserId, 1, 1, "ko");
  const expectedHp1 = 120 - Math.floor(120 * (1 / 8));
  assert.strictEqual(battle.playerBattleMon.hp, expectedHp1, `1겹 피격 시 1/8 데미지 (잔여: ${expectedHp1})`);
  assert.ok(battle.dialogueText.includes("압정에 찔려"), "압정 피격 텍스트 출력");

  // 2겹 설정 (1/6 = 20 HP)
  battle.playerParty[1].hp = 120;
  battle.playerSpikesLayers = 2;
  battleService.switchPlayerPokemon(testUserId, 1, 1, "ko");
  const expectedHp2 = 120 - Math.floor(120 * (1 / 6));
  assert.strictEqual(battle.playerBattleMon.hp, expectedHp2, `2겹 피격 시 1/6 데미지 (잔여: ${expectedHp2})`);

  // 3겹 설정 (1/4 = 30 HP)
  battle.playerParty[1].hp = 120;
  battle.playerSpikesLayers = 3;
  battleService.switchPlayerPokemon(testUserId, 1, 1, "ko");
  const expectedHp3 = 120 - Math.floor(120 * (1 / 4));
  assert.strictEqual(battle.playerBattleMon.hp, expectedHp3, `3겹 피격 시 1/4 데미지 (잔여: ${expectedHp3})`);
});

await test("비행(Flying) 타입 포켓몬(Pidgey) 교체 등장 시 압정 무효 (0 데미지)", async () => {
  const { saveService } = await import("../../src/services/saveService.js");
  const testUserId = `test_spikes_flying_${Date.now()}`;
  saveService.createNewRunWithParty(testUserId, 1, [
    { speciesId: "forretress", name: "forretress", level: 50, hp: 100, maxHp: 100, moves: ["spikes"] },
    { speciesId: "pidgey", name: "pidgey", level: 50, hp: 100, maxHp: 100, moves: ["gust"] },
  ]);
  const battle = battleService.getOrCreateBattle(testUserId, 1);

  // 3겹 상태에서도 비행 타입은 데미지 0
  battle.playerSpikesLayers = 3;
  battleService.switchPlayerPokemon(testUserId, 1, 1, "ko");

  assert.strictEqual(battle.playerBattleMon.hp, battle.playerBattleMon.maxHp, "비행 타입은 압정 데미지 0 (공중 체공으로 최대 HP 유지)");
  assert.ok(!battle.dialogueText.includes("압정에 찔려"), "압정 피격 텍스트가 출력되지 않아야 함");
});

console.log("\n==========================================================");
console.log(`🎉 [압정뿌리기 전수 점검 통과] 총 ${passedCount}개 테스트 전체 성공!`);
console.log("==========================================================\n");
