import { BattleService } from "../../src/services/battleService.js";
import { getMoveData, getMoveKey } from "../../src/data/movesKo.js";
import { executeSingleAction } from "../../src/battle/engine/TurnActionExecutor.js";
import { MOVE_REGISTRY } from "../../src/battle/moves/moveRegistry.js";
import { sweetKissMove } from "../../src/battle/moves/definitions/186_sweet_kiss.js";
import { validateAction } from "../../src/battle/mechanics/actionValidator.js";
import assert from "node:assert";

console.log("==========================================================");
console.log("🔍 [186. 천사의키스 (Sweet Kiss) 기술 구현 및 배틀 로직 전수 점검]");
console.log("==========================================================");

const battleService = new BattleService();
const sweetKissData = getMoveData("sweet-kiss")!;

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

test("movesKo.ts 데이터: 186번, 페어리 타입, 변화기, 명중률 75, PP 10", () => {
  assert.ok(sweetKissData, "sweet-kiss 데이터 존재");
  assert.strictEqual(sweetKissData.id, 186, "기술 번호 186");
  assert.strictEqual(sweetKissData.name, "sweet-kiss", "영문 식별자 sweet-kiss");
  assert.strictEqual(sweetKissData.nameKo, "천사의키스", "한글 명칭 천사의키스");
  assert.strictEqual(sweetKissData.type, "fairy", "페어리 타입");
  assert.strictEqual(sweetKissData.category, "status", "변화기(status)");
  assert.strictEqual(sweetKissData.accuracy, 75, "명중률 75");
  assert.strictEqual(sweetKissData.pp, 10, "PP 10");
});

test("별칭 및 키 해석: '천사의키스', 'sweet-kiss', '186' 모두 sweet-kiss 반환", () => {
  assert.strictEqual(getMoveKey("sweet-kiss"), "sweet-kiss");
  assert.strictEqual(getMoveKey("sweet_kiss"), "sweet-kiss");
  assert.strictEqual(getMoveKey("천사의키스"), "sweet-kiss");
  assert.strictEqual(getMoveData("천사의키스")?.id, 186);
});

// ============================================================================
// 2. 애니메이션 정의 및 프레임 빌더 검증
// ============================================================================
console.log("\n--- [2. 애니메이션 정의 및 프레임 빌더 검증] ---");

test("MOVE_REGISTRY 등록 여부 및 애니메이션 모듈 메타데이터 검증", () => {
  assert.ok(MOVE_REGISTRY["sweet-kiss"], "MOVE_REGISTRY에 sweet-kiss 등록");
  assert.ok(MOVE_REGISTRY["천사의키스"], "MOVE_REGISTRY에 천사의키스 등록");
  assert.strictEqual(sweetKissMove.num, 186);
  assert.strictEqual(sweetKissMove.nameKo, "천사의키스");
  assert.strictEqual(sweetKissMove.type, "fairy");
  assert.strictEqual(sweetKissMove.category, "status");
  assert.strictEqual(sweetKissMove.camera?.type, "target");
  assert.strictEqual(sweetKissMove.camera?.zoom, 1.34);
});

test("프레임 빌더: 명중 시와 빗맞았을 때 프레임 생성 및 시퀀스 무결성 검증", () => {
  const dummyCtxHit = {
    isPlayer: true,
    isHit: true,
    action: { moveKey: "sweet-kiss" } as any,
    enemyHp: 100,
    playerHp: 100,
    textLineIdx: 0,
  };
  const framesHit = sweetKissMove.buildFrames(dummyCtxHit);
  assert.ok(framesHit.length >= 10, "명중 시 충분한 프레임 시퀀스 생성");

  // Step 3 (키스/파티클)과 Step 4 (혼란)의 시퀀스 분리 검증
  const step3Frames = framesHit.filter((f) => f.moveStep === 3);
  const step4Frames = framesHit.filter((f) => f.moveStep === 4);
  assert.ok(step3Frames.length >= 2, "Step 3 프레임 존재");
  assert.ok(step4Frames.length >= 3, "Step 4 프레임 존재");

  // Step 4에서는 키스 마크가 0이어야 함 (유저 지시: 파티클 끝난 후 혼란)
  for (const f of step4Frames) {
    assert.strictEqual(f.kissMarkAlpha ?? 0, 0, "Step 4 혼란 단계에서는 키스 마크가 0이어야 함");
  }

  // 빗맞았을 때(Miss) 프레임 검증
  const dummyCtxMiss = { ...dummyCtxHit, isHit: false };
  const framesMiss = sweetKissMove.buildFrames(dummyCtxMiss);
  assert.ok(framesMiss.length >= 3, "빗맞았을 때 회피 프레임 생성");
});

// ============================================================================
// 3. 배틀 로직 및 상태이상(혼란) 부여 검증
// ============================================================================
console.log("\n--- [3. 배틀 로직 및 상태이상(혼란) 부여 검증] ---");

test("일반 대상 피격 시(명중 시) 혼란 부여, 턴 수(2~5턴) 설정 및 전투 로그 확인", () => {
  const togepi = battleService.spawnWildPokemon(1, "Town", "togepi", 50);
  const target = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);

  target.isConfused = false;
  target.confusionTurns = 0;

  // 100% 명중 유도
  const origRandom = Math.random;
  try {
    Math.random = () => 0.1; // 10% <= 75% => Hit
    const res = executeSingleAction(togepi, target, sweetKissData, true, true);

    assert.strictEqual(res.damage, 0, "변화기이므로 데미지 0");
    assert.strictEqual(target.isConfused, true, "피격 대상이 혼란 상태(isConfused = true)가 되어야 함");
    assert.ok(
      (target.confusionTurns || 0) >= 2 && (target.confusionTurns || 0) <= 5,
      `혼란 턴 수는 2~5턴이어야 함 (현재: ${target.confusionTurns})`
    );
    assert.ok(res.log.includes("혼란에 빠졌다!"), "한국어 전투 로그에 '혼란에 빠졌다!' 명시");
  } finally {
    Math.random = origRandom;
  }
});

test("이미 혼란 상태인 대상에게 재사용 시 중복 적용 방지 및 메시지 출력", () => {
  const togepi = battleService.spawnWildPokemon(1, "Town", "togepi", 50);
  const target = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);

  // 이미 3턴 혼란 상태로 설정
  target.isConfused = true;
  target.confusionTurns = 3;

  const origRandom = Math.random;
  try {
    Math.random = () => 0.1;
    const res = executeSingleAction(togepi, target, sweetKissData, true, true);

    assert.strictEqual(res.damage, 0);
    assert.strictEqual(target.confusionTurns, 3, "기존 혼란 턴 수가 보존되어야 함");
    assert.ok(res.log.includes("이미 혼란에 빠져 있다"), "이미 혼란 상태임을 알리는 메시지 확인");
  } finally {
    Math.random = origRandom;
  }
});

test("명중률(75%)에 의한 빗나감(Miss) 판정 시 혼란 미부여 및 회피 로그 검증", () => {
  const togepi = battleService.spawnWildPokemon(1, "Town", "togepi", 50);
  const target = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);

  target.isConfused = false;
  target.confusionTurns = 0;

  // 빗나감 유도 (roll 99 > accuracy 75)
  const origRandom = Math.random;
  try {
    Math.random = () => 0.99;
    const res = executeSingleAction(togepi, target, sweetKissData, true, true);

    assert.strictEqual(res.damage, 0);
    assert.strictEqual(target.isConfused, false, "빗나갔으므로 혼란이 걸리지 않아야 함");
    assert.ok(res.log.includes("맞지 않았다!"), "빗나감 로그 메시지 확인");
  } finally {
    Math.random = origRandom;
  }
});

test("75% 기본 명중률 100회 시뮬레이션 통계 검증", () => {
  const togepi = battleService.spawnWildPokemon(1, "Town", "togepi", 50);
  const target = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);

  let hitCount = 0;
  for (let i = 0; i < 100; i++) {
    target.isConfused = false;
    target.confusionTurns = 0;
    const res = executeSingleAction(togepi, target, sweetKissData, true, true);
    if (target.isConfused) {
      hitCount++;
    }
  }

  console.log(`   (100회 명중률 시뮬레이션: ${hitCount}회 명중 / 75% 기준 60~90회 범위)`);
  assert.ok(hitCount >= 55 && hitCount <= 92, "75% 명중률 통계적 신뢰 범위에 부합");
});

// ============================================================================
// 4. 혼란 상태이상 실질 전투 판정 (자해/해제) 동작 검증
// ============================================================================
console.log("\n--- [4. 혼란 상태이상 실질 전투 판정 동작 검증] ---");

test("혼란 턴 수 감소 및 카운트 종료 시 혼란 자동 해제 검증", () => {
  const mon = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);
  mon.isConfused = true;
  mon.confusionTurns = 1; // 1턴 후 즉시 해제

  const dummyTackle = getMoveData("tackle")!;
  const actionRes = validateAction(mon, dummyTackle, "피카츄", "몸통박치기", true);

  assert.strictEqual(mon.isConfused, false, "1턴 소진 후 혼란이 풀려야 함");
  assert.strictEqual(mon.confusionTurns, 0, "혼란 턴 0으로 리셋");
  assert.ok(actionRes.log?.includes("혼란이 풀렸다!"), `혼란 해제 로그 확인: ${actionRes.log}`);
});

test("혼란 상태에서 자해(Self-damage) 로직 정상 작동 검증", () => {
  const mon = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);
  const originalHp = mon.hp;
  const dummyTackle = getMoveData("tackle")!;

  let selfDamageCount = 0;
  let normalActionCount = 0;

  // 100회 시뮬레이션
  for (let i = 0; i < 100; i++) {
    mon.hp = originalHp;
    mon.isConfused = true;
    mon.confusionTurns = 999; // 테스트 중 해제 방지

    const validation = validateAction(mon, dummyTackle, "잠만보", "몸통박치기", true);
    if (!validation.canAct) {
      selfDamageCount++;
      assert.ok(mon.hp < originalHp, "자해 발생 시 HP가 감소해야 함");
      assert.ok(validation.log?.includes("자신을 공격했다!"), "자해 로그 메시지 확인");
    } else {
      normalActionCount++;
    }
  }

  console.log(`   (100회 혼란 시뮬레이션: 자해 ${selfDamageCount}회 / 정상 행동 ${normalActionCount}회)`);
  assert.ok(selfDamageCount > 15 && selfDamageCount < 55, "혼란 자해 확률(33%)에 부합 (15~55회 범위)");
});

console.log("\n==========================================================");
console.log(`🎉 [천사의키스 배틀 로직 전수 점검 통과] 총 ${passedCount}개 테스트 100% 통과!`);
console.log("==========================================================");
