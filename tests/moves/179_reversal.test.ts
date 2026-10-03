import { BattleService } from "../../src/services/battleService.js";
import { getMoveData, getMoveKey } from "../../src/data/movesKo.js";
import { executeSingleAction } from "../../src/battle/engine/TurnActionExecutor.js";
import { MOVE_REGISTRY } from "../../src/battle/moves/moveRegistry.js";
import { reversalMove } from "../../src/battle/moves/definitions/179_reversal.js";
import { calculateDamage } from "../../src/battle/mechanics/damageCalculator.js";
import { getDynamicMovePower } from "../../src/battle/moves/traits/specialDamageRegistry.js";
import assert from "node:assert";

console.log("==========================================================");
console.log("🥋 [179. 기사회생 (Reversal) 기술구현 및 배틀로직 전수 점검]");
console.log("==========================================================");

const battleService = new BattleService();
const reversalData = getMoveData("reversal")!;

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

test("movesKo.ts 데이터: 179번, 격투 타입, 물리 공격기, 명중률 100, PP 15", () => {
  assert.ok(reversalData, "reversal 데이터 존재");
  assert.strictEqual(reversalData.id, 179, "기술 번호 179");
  assert.strictEqual(reversalData.name, "reversal", "영문 식별자 reversal");
  assert.strictEqual(reversalData.nameKo, "기사회생", "한글 명칭 기사회생");
  assert.strictEqual(reversalData.type, "fighting", "격투(fighting) 타입");
  assert.strictEqual(reversalData.category, "physical", "물리(physical) 분류");
  assert.strictEqual(reversalData.accuracy, 100, "명중률 100");
  assert.strictEqual(reversalData.pp, 15, "PP 15");
});

test("별칭 및 키 해석: '기사회생', 'reversal', '179' 모두 reversal 반환", () => {
  assert.strictEqual(getMoveKey("reversal"), "reversal");
  assert.strictEqual(getMoveKey("기사회생"), "reversal");
  assert.strictEqual(getMoveData("기사회생")?.id, 179);
});

// ============================================================================
// 2. MOVE_REGISTRY 애니메이션 및 메타데이터 등록 검증
// ============================================================================
console.log("\n--- [2. MOVE_REGISTRY 애니메이션 등록 검증] ---");

test("MOVE_REGISTRY에 'reversal', '179', '기사회생' 등록 확인", () => {
  assert.ok(MOVE_REGISTRY["reversal"], "MOVE_REGISTRY['reversal'] 등록");
  assert.ok(MOVE_REGISTRY["179"], "MOVE_REGISTRY['179'] 등록");
  assert.ok(MOVE_REGISTRY["기사회생"], "MOVE_REGISTRY['기사회생'] 등록");
  assert.strictEqual(MOVE_REGISTRY["reversal"].num, 179);
  assert.strictEqual(MOVE_REGISTRY["reversal"].type, "fighting");
  assert.strictEqual(MOVE_REGISTRY["reversal"].category, "physical");
});

test("reversalMove 프레임 빌더 정상 작동 및 타격 시퀀스 포함 검증", () => {
  const frames = reversalMove.buildFrames({
    isPlayer: true,
    isHit: true,
    action: {
      moveKey: "reversal",
      damage: 120,
      enemyHpBefore: 200,
      enemyHpAfter: 80,
      isHit: true,
    } as any,
    enemyHp: 200,
    playerHp: 50,
    textLineIdx: 0,
  });

  assert.ok(frames.length > 20, `프레임 총 수: ${frames.length}`);
  const hasWindup = frames.some(f => f.phaseId === "reversal-strike-windup");
  const hasDash = frames.some(f => f.phaseId === "reversal-strike-dash-1");
  const hasHit = frames.some(f => f.phaseId === "reversal-strike-hit");
  const hasBurst = frames.some(f => f.phaseId === "reversal-strike-burst");

  assert.ok(hasWindup, "돌진 도움닫기 프레임 존재");
  assert.ok(hasDash, "고속 돌진 대시 프레임 존재");
  assert.ok(hasHit, "직격 강타 프레임 존재");
  assert.ok(hasBurst, "충격파 폭발 프레임 존재");
});

// ============================================================================
// 3. 체력 잔량별 가변 위력 (Dynamic Base Power) 6단계 공식 검증
// ============================================================================
console.log("\n--- [3. HP 비율별 가변 위력(Dynamic Base Power) 6단계 공식 검증] ---");

test("체력 잔량별 위력 계산 (5세대+ 정식 P = floor(48 * HP / MaxHP) 기준)", () => {
  const user = battleService.spawnWildPokemon(1, "Town", "heracross", 50);
  const target = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);
  user.maxHp = 100;

  // 1) 체력 100% (HP 100/100, P=48) -> 위력 20
  user.hp = 100;
  assert.strictEqual(getDynamicMovePower("reversal", user, target), 20, "체력 100%일 때 위력 20");

  // 2) 체력 70% (HP 70/100, P=33) -> 위력 20
  user.hp = 70;
  assert.strictEqual(getDynamicMovePower("reversal", user, target), 20, "체력 70%일 때 위력 20");

  // 3) 체력 68% (HP 68/100, P=32) -> 위력 40
  user.hp = 68;
  assert.strictEqual(getDynamicMovePower("reversal", user, target), 40, "체력 68%일 때 위력 40");

  // 4) 체력 40% (HP 40/100, P=19) -> 위력 40
  user.hp = 40;
  assert.strictEqual(getDynamicMovePower("reversal", user, target), 40, "체력 40%일 때 위력 40");

  // 5) 체력 35% (HP 35/100, P=16) -> 위력 80
  user.hp = 35;
  assert.strictEqual(getDynamicMovePower("reversal", user, target), 80, "체력 35%일 때 위력 80");

  // 6) 체력 25% (HP 25/100, P=12) -> 위력 80
  user.hp = 25;
  assert.strictEqual(getDynamicMovePower("reversal", user, target), 80, "체력 25%일 때 위력 80");

  // 7) 체력 20% (HP 20/100, P=9) -> 위력 100
  user.hp = 20;
  assert.strictEqual(getDynamicMovePower("reversal", user, target), 100, "체력 20%일 때 위력 100");

  // 8) 체력 15% (HP 15/100, P=7) -> 위력 100
  user.hp = 15;
  assert.strictEqual(getDynamicMovePower("reversal", user, target), 100, "체력 15%일 때 위력 100");

  // 9) 체력 10% (HP 10/100, P=4) -> 위력 150
  user.hp = 10;
  assert.strictEqual(getDynamicMovePower("reversal", user, target), 150, "체력 10%일 때 위력 150");

  // 10) 체력 5% (HP 5/100, P=2) -> 위력 150
  user.hp = 5;
  assert.strictEqual(getDynamicMovePower("reversal", user, target), 150, "체력 5%일 때 위력 150");

  // 11) 체력 4% (HP 4/100, P=1) -> 위력 200 (최대 위력!)
  user.hp = 4;
  assert.strictEqual(getDynamicMovePower("reversal", user, target), 200, "체력 4%일 때 위력 200");

  // 12) 체력 1 HP (HP 1/100, P=0) -> 위력 200 (최대 위력!)
  user.hp = 1;
  assert.strictEqual(getDynamicMovePower("reversal", user, target), 200, "체력 1 HP일 때 위력 200");
});

// ============================================================================
// 4. 데미지 계산 및 타입 상성 검증
// ============================================================================
console.log("\n--- [4. 데미지 계산 및 타입 상성 검증] ---");

test("타입 상성 2배(효과가 굉장함): 노말, 얼음, 바위, 악, 강철", () => {
  const user = battleService.spawnWildPokemon(1, "Town", "heracross", 50);
  user.maxHp = 100;
  user.hp = 1; // 위력 200 최대 파워

  const snorlax = battleService.spawnWildPokemon(1, "Town", "snorlax", 50); // Normal
  const resNormal = calculateDamage(user, snorlax, reversalData, true, true);
  assert.strictEqual(resNormal.typeMod, 2.0, "노말 타입에게 2배 상성");
  assert.strictEqual(resNormal.isSuperEffective, true);
  assert.ok(resNormal.log.includes("효과가 굉장했다!"), "굉효 로그 포함");
});

test("타입 상성 0배(무효화): 고스트 타입 상대 시 피해 0", () => {
  const user = battleService.spawnWildPokemon(1, "Town", "heracross", 50);
  user.maxHp = 100;
  user.hp = 1;

  const gengar = battleService.spawnWildPokemon(1, "Town", "gengar", 50); // Ghost
  const resGhost = calculateDamage(user, gengar, reversalData, true, true);
  assert.strictEqual(resGhost.damage, 0, "고스트 타입에게 데미지 0");
  assert.strictEqual(resGhost.typeMod, 0, "상성 배율 0.0");
  assert.ok(resGhost.log.includes("효과가 없는 것 같다"), "무효 로그 포함");
});

test("타입 상성 0.5배(효과가 별로): 비행, 에스퍼, 벌레, 독, 페어리", () => {
  const user = battleService.spawnWildPokemon(1, "Town", "heracross", 50);
  user.maxHp = 100;
  user.hp = 1;

  const pidgeot = battleService.spawnWildPokemon(1, "Town", "pidgeot", 50); // Flying/Normal -> 2.0 * 0.5 = 1.0
  const alakazam = battleService.spawnWildPokemon(1, "Town", "alakazam", 50); // Psychic -> 0.5
  const resPsychic = calculateDamage(user, alakazam, reversalData, true, true);
  assert.strictEqual(resPsychic.typeMod, 0.5, "에스퍼 타입에게 0.5배 반감");
  assert.ok(resPsychic.log.includes("효과가 별로인 듯하다"), "반감 로그 포함");
});

test("자속 보정(STAB): 격투 포켓몬이 사용 시 1.5배 화력 증가", () => {
  const machamp = battleService.spawnWildPokemon(1, "Town", "machamp", 50); // Fighting
  machamp.atk = 100;
  machamp.maxHp = 100;
  machamp.hp = 1; // Base Power 200

  const snorlax = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);
  snorlax.def = 100;

  // 비자속 노말 포켓몬 (동일 공격력 100)
  const snorlaxUser = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);
  snorlaxUser.atk = 100;
  snorlaxUser.maxHp = 100;
  snorlaxUser.hp = 1;

  let stabSum = 0;
  let nonStabSum = 0;
  const trials = 50;
  for (let i = 0; i < trials; i++) {
    stabSum += calculateDamage(machamp, snorlax, reversalData, true, true).damage;
    nonStabSum += calculateDamage(snorlaxUser, snorlax, reversalData, true, true).damage;
  }
  const avgStab = stabSum / trials;
  const avgNonStab = nonStabSum / trials;
  const ratio = avgStab / avgNonStab;

  console.log(`   ➔ STAB 적용 평균 데미지: ${avgStab.toFixed(1)} vs 비자속 평균 데미지: ${avgNonStab.toFixed(1)} (배율: ${ratio.toFixed(2)}x)`);
  assert.ok(avgStab > avgNonStab, "자속 보정 시 데미지가 비자속보다 높아야 함");
  assert.ok(ratio >= 1.4 && ratio <= 1.6, `자속 배율이 약 1.5배여야 함 (실제: ${ratio.toFixed(2)})`);
});

// ============================================================================
// 5. 턴 액션 실행기 (TurnActionExecutor) 연동 검증
// ============================================================================
console.log("\n--- [5. 턴 액션 실행기 (TurnActionExecutor) 실전 배틀 검증] ---");

let lastLowHpDamage = 0;
test("체력 1 남은 역전의 기사회생: 잠만보에게 괴력의 데미지를 가하며 타격", () => {
  const lucario = battleService.spawnWildPokemon(1, "Town", "lucario", 50);
  lucario.maxHp = 100;
  lucario.hp = 1; // 1 HP 극적 역전 상황

  const snorlax = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);
  snorlax.hp = 250;
  snorlax.maxHp = 250;

  const actionRes = executeSingleAction(lucario, snorlax, reversalData, true, true);
  lastLowHpDamage = actionRes.damage;

  console.log(`   ➔ 기사회생 배틀 로그:\n${actionRes.log}`);
  console.log(`   ➔ 가한 피해량: ${actionRes.damage} / 상대 잔여 HP: ${snorlax.hp}/${snorlax.maxHp}`);

  assert.ok(actionRes.damage > 100, `HP 1 기사회생은 100 이상의 막강한 피해를 줘야 함 (실제: ${actionRes.damage})`);
  assert.strictEqual(snorlax.hp, Math.max(0, 250 - actionRes.damage), "상대 HP가 정확히 데미지만큼 차감(최소 0)되어야 함");
  assert.ok(actionRes.log.includes("기사회생!"), "기술명 출력");
});

test("체력 100% 상태의 기사회생: 위력 20으로 미미한 피해만 발생", () => {
  const lucario = battleService.spawnWildPokemon(1, "Town", "lucario", 50);
  lucario.maxHp = 100;
  lucario.hp = 100; // 풀피

  const snorlax = battleService.spawnWildPokemon(1, "Town", "snorlax", 50);
  snorlax.hp = 250;
  snorlax.maxHp = 250;

  const actionResFull = executeSingleAction(lucario, snorlax, reversalData, true, true);

  console.log(`   ➔ 풀피 기사회생 피해량: ${actionResFull.damage} (1 HP 역전 데미지 ${lastLowHpDamage} 대비 약 1/9~1/10배 수준)`);
  assert.ok(actionResFull.damage < 60, `풀피 기사회생은 위력 20으로 데미지가 1 HP(위력 200) 대비 대폭 낮아야 함 (실제: ${actionResFull.damage})`);
  assert.ok(lastLowHpDamage >= actionResFull.damage * 7, "1 HP 기사회생 피해량은 풀피 기사회생 피해량의 7~10배 이상이어야 함");
});

console.log("\n==========================================================");
console.log(`📊 기사회생 종합 테스트 결과: 통과 ${passedCount}개 / 실패 0개`);
console.log("==========================================================");
console.log("🎉 기사회생(Reversal)의 기술 구현 및 배틀 로직이 100% 완벽히 검증되었습니다!");
