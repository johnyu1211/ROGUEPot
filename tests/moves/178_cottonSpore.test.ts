import { BattleService } from "../../src/services/battleService.js";
import { BattleEngine } from "../../src/battle/engine/BattleEngine.js";
import { getMoveData, getMoveKey } from "../../src/data/movesKo.js";
import { executeSingleAction } from "../../src/battle/engine/TurnActionExecutor.js";
import { MOVE_REGISTRY } from "../../src/battle/moves/moveRegistry.js";
import { cottonSporeMove } from "../../src/battle/moves/definitions/178_cotton_spore.js";
import { getStageMultiplier } from "../../src/battle/mechanics/statModifier.js";
import assert from "node:assert";

console.log("==========================================================");
console.log("🔍 [178. 목화포자 (Cotton Spore) 기술 구현 및 배틀 로직 전수 점검]");
console.log("==========================================================");

const battleService = new BattleService();
const cottonSporeData = getMoveData("cotton-spore")!;

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

test("movesKo.ts 데이터: 178번, 풀 타입, 변화기, 명중률 100, PP 40", () => {
  assert.ok(cottonSporeData, "cotton-spore 데이터 존재");
  assert.strictEqual(cottonSporeData.id, 178, "기술 번호 178");
  assert.strictEqual(cottonSporeData.name, "cotton-spore", "영문 식별자 cotton-spore");
  assert.strictEqual(cottonSporeData.nameKo, "목화포자", "한글 명칭 목화포자");
  assert.strictEqual(cottonSporeData.type, "grass", "풀 타입");
  assert.strictEqual(cottonSporeData.category, "status", "변화기(status)");
  assert.strictEqual(cottonSporeData.accuracy, 100, "명중률 100");
  assert.strictEqual(cottonSporeData.pp, 40, "PP 40");
});

test("별칭 및 키 해석: '목화포자', 'cotton-spore', '178' 모두 cotton-spore 반환", () => {
  assert.strictEqual(getMoveKey("cotton-spore"), "cotton-spore");
  assert.strictEqual(getMoveKey("목화포자"), "cotton-spore");
  assert.strictEqual(getMoveData("목화포자")?.id, 178);
});

// ============================================================================
// 2. 기본 배틀 로직 및 랭크 하락 검증
// ============================================================================
console.log("\n--- [2. 기본 배틀 로직 및 랭크 하락 검증] ---");

test("일반 대상 피격 시 스피드 -2랭크 하강 및 전투 로그 확인", () => {
  const mareep = battleService.spawnWildPokemon(1, "Town", "mareep", 50);
  const target = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);

  target.stages.spe = 0;
  const res = executeSingleAction(mareep, target, cottonSporeData, true, true);

  assert.strictEqual(target.stages.spe, -2, "상대 피카츄의 스피드가 -2랭크가 되어야 함");
  assert.strictEqual(res.damage, 0, "변화기이므로 데미지는 0");
  assert.ok(res.log.includes("스피드가 크게 떨어졌다! (-2)"), "한국어 로그에 스피드 크게 하락 명시");
});

test("연속 사용 시 -2 -> -4 -> -6랭크 누적 및 최저치(-6) 도달 후 한계 처리", () => {
  const mareep = battleService.spawnWildPokemon(1, "Town", "mareep", 50);
  const target = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);

  // 1회차: 0 -> -2
  executeSingleAction(mareep, target, cottonSporeData, true, true);
  assert.strictEqual(target.stages.spe, -2);

  // 2회차: -2 -> -4
  executeSingleAction(mareep, target, cottonSporeData, true, true);
  assert.strictEqual(target.stages.spe, -4);

  // 3회차: -4 -> -6
  executeSingleAction(mareep, target, cottonSporeData, true, true);
  assert.strictEqual(target.stages.spe, -6);

  // 4회차: 이미 -6랭크이므로 더 이상 떨어지지 않음
  const resLimit = executeSingleAction(mareep, target, cottonSporeData, true, true);
  assert.strictEqual(target.stages.spe, -6, "최저치 -6랭크 유지");
  assert.ok(resLimit.log.includes("더 이상 떨어지지 않는다"), "한계 도달 안내 메시지 확인");
});

test("스피드 랭크 하락에 따른 실질 속도 계산 검증 (스피드 절반 반토막)", () => {
  const pikachu = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);
  const initialSpeed = pikachu.speed; // 예: 90
  const normalMult = getStageMultiplier(0);
  assert.strictEqual(normalMult, 1.0, "0랭크는 1.0배");

  const debuffMult = getStageMultiplier(-2);
  assert.strictEqual(debuffMult, 0.5, "-2랭크는 정확히 0.5배 (50%)");

  const effectiveSpeed = initialSpeed * debuffMult;
  assert.strictEqual(effectiveSpeed, initialSpeed * 0.5, "실제 전투 스피드가 절반으로 감속");
});

// ============================================================================
// 3. 포자/가루 기술 특화 면역 및 방어 판정 검증
// ============================================================================
console.log("\n--- [3. 포자/가루 기술 특화 면역 및 방어 판정 검증] ---");

test("풀 타입 포켓몬 면역 (이상해씨 등 풀타입 대상 시 무효화)", () => {
  const mareep = battleService.spawnWildPokemon(1, "Town", "mareep", 50);
  const bulbasaur = battleService.spawnWildPokemon(1, "Town", "bulbasaur", 50);
  bulbasaur.types = ["grass", "poison"];
  bulbasaur.stages.spe = 0;

  const res = executeSingleAction(mareep, bulbasaur, cottonSporeData, true, true);

  assert.strictEqual(bulbasaur.stages.spe, 0, "풀타입 대상 스피드 변화 없음");
  assert.ok(res.log.includes("효과가 없는 것 같다"), "포자/가루 면역 로그 출력 확인");
});

test("방진(Overcoat) 특성 면역", () => {
  const mareep = battleService.spawnWildPokemon(1, "Town", "mareep", 50);
  const target = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);
  target.ability = "Overcoat";
  target.stages.spe = 0;

  const res = executeSingleAction(mareep, target, cottonSporeData, true, true);

  assert.strictEqual(target.stages.spe, 0, "방진 특성 대상 스피드 변화 없음");
  assert.ok(res.log.includes("효과가 없는 것 같다"), "방진 특성 면역 로그 출력 확인");
});

test("클리어바디(Clear Body) / 하얀연기(White Smoke) 특성 능력치 하락 방지", () => {
  const mareep = battleService.spawnWildPokemon(1, "Town", "mareep", 50);
  const beldum = battleService.spawnWildPokemon(1, "Town", "beldum", 50);
  beldum.ability = "Clear Body";
  beldum.stages.spe = 0;

  const res = executeSingleAction(mareep, beldum, cottonSporeData, true, true);

  assert.strictEqual(beldum.stages.spe, 0, "클리어바디로 인해 스피드 감소 방어");
  assert.ok(res.log.includes("클리어바디") && res.log.includes("떨어지지 않는다"), "특성 방어 로그 확인");
});

test("흰안개(Mist) 상태 시 능력치 하락 방지", () => {
  const mareep = battleService.spawnWildPokemon(1, "Town", "mareep", 50);
  const target = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);
  target.mistTurns = 3;
  target.stages.spe = 0;

  const res = executeSingleAction(mareep, target, cottonSporeData, true, true);

  assert.strictEqual(target.stages.spe, 0, "흰안개로 인해 스피드 하락 방지");
  assert.ok(res.log.includes("흰안개 효과"), "흰안개 방어 로그 출력");
});

test("대타출동(Substitute) 분신 보호 판정", () => {
  const mareep = battleService.spawnWildPokemon(1, "Town", "mareep", 50);
  const target = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);
  target.substituteHp = 50;
  target.stages.spe = 0;

  const res = executeSingleAction(mareep, target, cottonSporeData, true, true);

  assert.strictEqual(target.stages.spe, 0, "대타출동에 의해 본체 보호");
  assert.ok(res.log.includes("대타출동 분신에게는 통하지 않았다"), "대타출동 방어 로그 출력");
});

test("방어(Protect) 상태 시 완전 차단", () => {
  const mareep = battleService.spawnWildPokemon(1, "Town", "mareep", 50);
  const target = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);
  target.isProtected = true;
  target.stages.spe = 0;

  const res = executeSingleAction(mareep, target, cottonSporeData, true, true);

  assert.strictEqual(target.stages.spe, 0, "방어에 의해 차단");
  assert.ok(res.log.includes("공격을 막아냈다"), "방어 로그 출력");
});

// ============================================================================
// 4. 애니메이션 정의 및 레지스트리 정합성 검증
// ============================================================================
console.log("\n--- [4. 애니메이션 정의 및 레지스트리 정합성 검증] ---");

test("MOVE_REGISTRY에 모든 별칭 등록 확인", () => {
  const keys = ["cotton-spore", "cottonspore", "178", "목화포자", "코튼포자"];
  for (const k of keys) {
    const regMove = MOVE_REGISTRY[k];
    assert.ok(regMove, `MOVE_REGISTRY에 '${k}' 등록되어 있어야 함`);
    assert.strictEqual(regMove.num, 178, "기술 번호 178 일치");
  }
});

test("cottonSporeMove 카메라 연출 설정: caster_to_target, zoom 1.32, delayUntilStep 2", () => {
  assert.strictEqual(cottonSporeMove.camera?.type, "caster_to_target");
  assert.strictEqual(cottonSporeMove.camera?.zoom, 1.32);
  assert.strictEqual(cottonSporeMove.camera?.delayUntilStep, 2);
});

test("buildFrames: 정상 적중 시 프레임 생성 및 인라인 statProgress 부재 확인 (후속 랭크다운 자동 연계)", () => {
  const frames = cottonSporeMove.buildFrames({
    isPlayer: true,
    isHit: true,
    action: {
      actor: "player",
      moveKey: "cotton-spore",
      moveNameKo: "목화포자",
      moveNameEn: "Cotton Spore",
      type: "grass",
      isSpecial: false,
      isPlayerAttacking: true,
      enemyHpAfter: 100,
      playerHpAfter: 100,
      isHit: true,
    },
    enemyHp: 100,
    playerHp: 100,
    textLineIdx: 0,
  });

  assert.ok(frames.length >= 10, "적중 시 기승전결 시퀀스 프레임 생성");
  // 인라인 statProgress가 없어야 battleGifRenderer가 순정 createStatChangeFrames 페이즈로 전환함
  const hasInlineStat = frames.some((f) => f.statProgress !== undefined);
  assert.strictEqual(hasInlineStat, false, "기술 자체 프레임에 인라인 statProgress가 없어야 순정 랭크다운 연계 작동");
});

test("buildFrames: 빗나감(Miss) 시 회피 프레임 생성 확인", () => {
  const missFrames = cottonSporeMove.buildFrames({
    isPlayer: true,
    isHit: false,
    action: {
      actor: "player",
      moveKey: "cotton-spore",
      moveNameKo: "목화포자",
      moveNameEn: "Cotton Spore",
      type: "grass",
      isSpecial: false,
      isPlayerAttacking: true,
      enemyHpAfter: 100,
      playerHpAfter: 100,
      isHit: false,
    },
    enemyHp: 100,
    playerHp: 100,
    textLineIdx: 0,
  });

  assert.ok(missFrames.length >= 4, "Miss 시 전용 회피 프레임 생성");
  const dodgeFrame = missFrames.find((f) => f.phaseId?.includes("dodge"));
  assert.ok(dodgeFrame, "회피 프레임 존재");
});

console.log("\n==========================================================");
console.log(`🎉 모든 점검 항목 성공 완료! (총 ${passedCount}개 테스트 통과)`);
console.log("==========================================================");
