import { BattleService } from "../../src/services/battleService.js";
import { getMoveData, getMoveKey } from "../../src/data/movesKo.js";
import { executeSingleAction } from "../../src/battle/engine/TurnActionExecutor.js";
import { processTurnEndEffects } from "../../src/battle/engine/TurnEndProcessor.js";
import { MOVE_REGISTRY } from "../../src/battle/moves/moveRegistry.js";
import { perishSongMove } from "../../src/battle/moves/definitions/195_perish_song.js";
import assert from "node:assert";

console.log("==========================================================");
console.log("🎵 [195. 멸망의 노래 (Perish Song) 기술 구현 및 배틀 로직 전수 점검]");
console.log("==========================================================");

const battleService = new BattleService();
const perishSongData = getMoveData("perish-song")!;

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

test("movesKo.ts 데이터: 195번, 노말 타입, 변화기, PP 5", () => {
  assert.ok(perishSongData, "perish-song 데이터 존재");
  assert.strictEqual(perishSongData.id, 195, "기술 번호 195");
  assert.strictEqual(perishSongData.name, "perish-song", "영문 식별자 perish-song");
  assert.strictEqual(perishSongData.nameKo, "멸망의노래", "한글 명칭 멸망의노래");
  assert.strictEqual(perishSongData.type, "normal", "노말 타입");
  assert.strictEqual(perishSongData.category, "status", "변화기(status)");
  assert.strictEqual(perishSongData.pp, 5, "PP 5");
});

test("별칭 및 키 해석: '멸망의노래', '멸망의 노래', 'perish-song', '195' 모두 perish-song 반환", () => {
  assert.strictEqual(getMoveKey("perish-song"), "perish-song");
  assert.strictEqual(getMoveKey("멸망의노래"), "perish-song");
  assert.strictEqual(getMoveKey("멸망의 노래"), "perish-song");
  assert.strictEqual(getMoveKey("195"), "perish-song");
  assert.strictEqual(getMoveData("멸망의 노래")?.id, 195);
});

test("MOVE_REGISTRY 애니메이션 정의 등록 확인", () => {
  assert.ok(MOVE_REGISTRY["perish-song"], "MOVE_REGISTRY['perish-song'] 등록됨");
  assert.ok(MOVE_REGISTRY["195"], "MOVE_REGISTRY['195'] 등록됨");
  assert.ok(MOVE_REGISTRY["멸망의노래"], "MOVE_REGISTRY['멸망의노래'] 등록됨");
  assert.ok(MOVE_REGISTRY["멸망의 노래"], "MOVE_REGISTRY['멸망의 노래'] 등록됨");
  assert.strictEqual(perishSongMove.num, 195);
  assert.strictEqual(perishSongMove.key, "perish-song");
  assert.strictEqual(perishSongMove.buildFrames({} as any).length, 32, "프레임 수 32개");
});

// ============================================================================
// 2. 기본 배틀 로직 및 상태 이상 부여 검증
// ============================================================================
console.log("\n--- [2. 기본 배틀 로직 및 상태 이상 부여 검증] ---");

test("멸망의 노래 시전 시 양쪽 포켓몬 모두에게 perishCount = 4 설정", () => {
  const lapras = battleService.spawnWildPokemon(1, "Sea", "lapras", 30);
  const pikachu = battleService.spawnWildPokemon(1, "Route", "pikachu", 30);

  assert.strictEqual(lapras.perishCount, undefined);
  assert.strictEqual(pikachu.perishCount, undefined);

  const res = executeSingleAction(lapras, pikachu, perishSongData, true, true);

  assert.strictEqual(lapras.perishCount, 4, "시전자 perishCount = 4");
  assert.strictEqual(pikachu.perishCount, 4, "대상 perishCount = 4");
  assert.ok(res.log.includes("3턴 뒤에 기절한다"), `로그 확인: ${res.log}`);
});

test("이미 멸망 카운트가 있는 상태에서 재사용 시 실패 처리", () => {
  const lapras = battleService.spawnWildPokemon(1, "Sea", "lapras", 30);
  const pikachu = battleService.spawnWildPokemon(1, "Route", "pikachu", 30);
  lapras.perishCount = 3;
  pikachu.perishCount = 3;

  const res = executeSingleAction(lapras, pikachu, perishSongData, true, true);

  assert.ok(res.log.includes("이미 모든 포켓몬에게 효과가 적용 중이다"), `실패 로그 확인: ${res.log}`);
});

// ============================================================================
// 3. 특수 관통 및 면역 검증 (방어, 대타출동 관통 & 방음 특성 면역)
// ============================================================================
console.log("\n--- [3. 특수 관통 및 방음 특성 면역 검증] ---");

test("상대가 방어(Protect) 상태여도 멸망의 노래는 방어를 관통하여 적용됨", () => {
  const lapras = battleService.spawnWildPokemon(1, "Sea", "lapras", 30);
  const pikachu = battleService.spawnWildPokemon(1, "Route", "pikachu", 30);
  pikachu.isProtected = true;

  const res = executeSingleAction(lapras, pikachu, perishSongData, true, true);

  assert.strictEqual(pikachu.perishCount, 4, "방어 중인 대상에게도 멸망 카운트 4 부여");
  assert.ok(res.log.includes("3턴 뒤에 기절한다"), "방어 관통 성공");
});

test("상대가 대타출동(Substitute) 상태여도 소리 기술이므로 분신을 관통하여 본체에 적용됨", () => {
  const lapras = battleService.spawnWildPokemon(1, "Sea", "lapras", 30);
  const pikachu = battleService.spawnWildPokemon(1, "Route", "pikachu", 30);
  pikachu.substituteHp = 50;

  const res = executeSingleAction(lapras, pikachu, perishSongData, true, true);

  assert.strictEqual(pikachu.perishCount, 4, "대타출동 분신 관통하여 본체에 멸망 카운트 부여");
  assert.ok(res.log.includes("3턴 뒤에 기절한다"), "대타출동 관통 성공");
});

test("방음(Soundproof) 특성 포켓몬은 멸망의 노래에 면역", () => {
  const lapras = battleService.spawnWildPokemon(1, "Sea", "lapras", 30);
  const voltorb = battleService.spawnWildPokemon(1, "PowerPlant", "voltorb", 30);
  voltorb.ability = "Soundproof";

  const res = executeSingleAction(lapras, voltorb, perishSongData, true, true);

  assert.strictEqual(lapras.perishCount, 4, "시전자는 영향 받음");
  assert.strictEqual(voltorb.perishCount, undefined, "방음 특성인 찌리리공은 면역");
  assert.ok(res.log.includes("방음 특성으로 노래가 들리지 않는다"), `방음 로그 확인: ${res.log}`);
});

// ============================================================================
// 4. 턴 종료 카운트다운 및 0 도달 시 기절(Faint) 검증
// ============================================================================
console.log("\n--- [4. 턴 종료 카운트다운 및 기절 검증] ---");

test("TurnEndProcessor: 4 -> 3 -> 2 -> 1 -> 기절(HP 0) 단계별 카운트다운 검증", () => {
  const mon = battleService.spawnWildPokemon(1, "Route", "snorlax", 50);
  mon.perishCount = 4;
  const initialHp = mon.hp;
  assert.ok(initialHp > 0, "초기 체력 존재");

  const logs1: string[] = [];
  processTurnEndEffects(mon, true, logs1);
  assert.strictEqual(mon.perishCount, 3, "턴 1 종료: 카운트 3");
  assert.ok(logs1.some((l) => l.includes("카운트가 3")), "카운트 3 로그");
  assert.strictEqual(mon.hp, initialHp, "체력 유지");

  const logs2: string[] = [];
  processTurnEndEffects(mon, true, logs2);
  assert.strictEqual(mon.perishCount, 2, "턴 2 종료: 카운트 2");
  assert.ok(logs2.some((l) => l.includes("카운트가 2")), "카운트 2 로그");

  const logs3: string[] = [];
  processTurnEndEffects(mon, true, logs3);
  assert.strictEqual(mon.perishCount, 1, "턴 3 종료: 카운트 1");
  assert.ok(logs3.some((l) => l.includes("카운트가 1")), "카운트 1 로그");

  const logs4: string[] = [];
  processTurnEndEffects(mon, true, logs4);
  assert.strictEqual(mon.perishCount, 0, "턴 4 종료: 카운트 0");
  assert.strictEqual(mon.hp, 0, "체력 0으로 기절");
  assert.ok(logs4.some((l) => l.includes("멸망의 노래로 인해 기절했다")), "기절 로그 확인");
});

console.log("\n==========================================================");
console.log(`🎉 모든 멸망의 노래 검증 테스트 통과! (총 ${passedCount}개 항목)`);
console.log("==========================================================");
