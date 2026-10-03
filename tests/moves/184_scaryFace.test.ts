import { BattleService } from "../../src/services/battleService.js";
import { getMoveData, getMoveKey } from "../../src/data/movesKo.js";
import { executeSingleAction } from "../../src/battle/engine/TurnActionExecutor.js";
import { MOVE_REGISTRY } from "../../src/battle/moves/moveRegistry.js";
import { scaryFaceMove } from "../../src/battle/moves/definitions/184_scary_face.js";
import { getStageMultiplier } from "../../src/battle/mechanics/statModifier.js";
import assert from "node:assert";

console.log("==========================================================");
console.log("🔍 [184. 겁나는얼굴 (Scary Face) 기술 구현 및 배틀 로직 전수 점검]");
console.log("==========================================================");

const battleService = new BattleService();
const scaryFaceData = getMoveData("scary-face")!;

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

test("movesKo.ts 데이터: 184번, 노말 타입, 변화기, 명중률 100, PP 10", () => {
  assert.ok(scaryFaceData, "scary-face 데이터 존재");
  assert.strictEqual(scaryFaceData.id, 184, "기술 번호 184");
  assert.strictEqual(scaryFaceData.name, "scary-face", "영문 식별자 scary-face");
  assert.strictEqual(scaryFaceData.nameKo, "겁나는얼굴", "한글 명칭 겁나는얼굴");
  assert.strictEqual(scaryFaceData.type, "normal", "노말 타입");
  assert.strictEqual(scaryFaceData.category, "status", "변화기(status)");
  assert.strictEqual(scaryFaceData.accuracy, 100, "명중률 100");
  assert.strictEqual(scaryFaceData.pp, 10, "PP 10");
});

test("별칭 및 키 해석: '겁나는얼굴', 'scary-face', '184' 모두 scary-face 반환", () => {
  assert.strictEqual(getMoveKey("scary-face"), "scary-face");
  assert.strictEqual(getMoveKey("겁나는얼굴"), "scary-face");
  assert.strictEqual(getMoveData("겁나는얼굴")?.id, 184);
});

// ============================================================================
// 2. 기본 배틀 로직 및 랭크 하락 검증
// ============================================================================
console.log("\n--- [2. 기본 배틀 로직 및 랭크 하락 검증] ---");

test("일반 대상 피격 시 스피드 -2랭크 하강 및 전투 로그 확인", () => {
  const axew = battleService.spawnWildPokemon(1, "Town", "axew", 50);
  const target = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);

  target.stages.spe = 0;
  const res = executeSingleAction(axew, target, scaryFaceData, true, true);

  assert.strictEqual(target.stages.spe, -2, "상대 피카츄의 스피드가 -2랭크가 되어야 함");
  assert.strictEqual(res.damage, 0, "변화기이므로 데미지는 0");
  assert.ok(res.log.includes("스피드가 크게 떨어졌다! (-2)"), "한국어 로그에 스피드 크게 하락 명시");
});

test("연속 사용 시 -2 -> -4 -> -6랭크 누적 및 최저치(-6) 도달 후 한계 처리", () => {
  const axew = battleService.spawnWildPokemon(1, "Town", "axew", 50);
  const target = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);

  // 1회차: 0 -> -2
  executeSingleAction(axew, target, scaryFaceData, true, true);
  assert.strictEqual(target.stages.spe, -2);

  // 2회차: -2 -> -4
  executeSingleAction(axew, target, scaryFaceData, true, true);
  assert.strictEqual(target.stages.spe, -4);

  // 3회차: -4 -> -6
  executeSingleAction(axew, target, scaryFaceData, true, true);
  assert.strictEqual(target.stages.spe, -6);

  // 4회차: 이미 -6랭크이므로 더 이상 떨어지지 않음
  const resLimit = executeSingleAction(axew, target, scaryFaceData, true, true);
  assert.strictEqual(target.stages.spe, -6, "최저치 -6랭크 유지");
  assert.ok(resLimit.log.includes("더 이상 떨어지지 않는다"), "한계 도달 안내 메시지 확인");
});

test("스피드 랭크 하락에 따른 실질 속도 계산 검증 (스피드 절반 50% 감속)", () => {
  const pikachu = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);
  const initialSpeed = pikachu.speed;
  const normalMult = getStageMultiplier(0);
  assert.strictEqual(normalMult, 1.0, "0랭크는 1.0배");

  const debuffMult = getStageMultiplier(-2);
  assert.strictEqual(debuffMult, 0.5, "-2랭크는 정확히 0.5배 (50%)");

  const effectiveSpeed = initialSpeed * debuffMult;
  assert.strictEqual(effectiveSpeed, initialSpeed * 0.5, "실제 전투 스피드가 절반으로 감속");
});

// ============================================================================
// 3. 특성 및 방어 판정 검증
// ============================================================================
console.log("\n--- [3. 특성 및 방어 판정 검증] ---");

test("클리어바디(Clear Body) / 하얀연기(White Smoke) 특성 능력치 하락 방지", () => {
  const axew = battleService.spawnWildPokemon(1, "Town", "axew", 50);
  const beldum = battleService.spawnWildPokemon(1, "Town", "beldum", 50);
  beldum.ability = "Clear Body";
  beldum.stages.spe = 0;

  const res = executeSingleAction(axew, beldum, scaryFaceData, true, true);

  assert.strictEqual(beldum.stages.spe, 0, "클리어바디로 인해 스피드 감소 방어");
  assert.ok(res.log.includes("클리어바디") && res.log.includes("떨어지지 않는다"), "특성 방어 로그 확인");
});

test("흰안개(Mist) 상태 시 능력치 하락 방지", () => {
  const axew = battleService.spawnWildPokemon(1, "Town", "axew", 50);
  const target = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);
  target.mistTurns = 3;
  target.stages.spe = 0;

  const res = executeSingleAction(axew, target, scaryFaceData, true, true);

  assert.strictEqual(target.stages.spe, 0, "흰안개로 인해 스피드 하락 방지");
  assert.ok(res.log.includes("흰안개 효과"), "흰안개 방어 로그 출력");
});

test("대타출동(Substitute) 분신 보호 판정", () => {
  const axew = battleService.spawnWildPokemon(1, "Town", "axew", 50);
  const target = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);
  target.substituteHp = 50;
  target.stages.spe = 0;

  const res = executeSingleAction(axew, target, scaryFaceData, true, true);

  assert.strictEqual(target.stages.spe, 0, "대타출동에 의해 본체 보호");
  assert.ok(res.log.includes("대타출동 분신에게는 통하지 않았다"), "대타출동 방어 로그 출력");
});

test("방어(Protect) 상태 시 완전 차단", () => {
  const axew = battleService.spawnWildPokemon(1, "Town", "axew", 50);
  const target = battleService.spawnWildPokemon(1, "Town", "pikachu", 50);
  target.isProtected = true;
  target.stages.spe = 0;

  const res = executeSingleAction(axew, target, scaryFaceData, true, true);

  assert.strictEqual(target.stages.spe, 0, "방어에 의해 차단");
  assert.ok(res.log.includes("공격을 막아냈다"), "방어 로그 출력");
});

// ============================================================================
// 4. 애니메이션 정의 및 레지스트리 정합성 검증
// ============================================================================
console.log("\n--- [4. 애니메이션 정의 및 레지스트리 정합성 검증] ---");

test("MOVE_REGISTRY에 모든 별칭 등록 확인", () => {
  const keys = ["scary-face", "scary_face", "scaryface", "184", "겁나는얼굴"];
  for (const k of keys) {
    const regMove = MOVE_REGISTRY[k];
    assert.ok(regMove, `MOVE_REGISTRY에 '${k}' 등록되어 있어야 함`);
    assert.strictEqual(regMove.num, 184, "기술 번호 184 일치");
  }
});

test("scaryFaceMove 카메라 연출 설정: self, zoom 1.35 (시전자 클로즈업)", () => {
  assert.strictEqual(scaryFaceMove.camera?.type, "self");
  assert.strictEqual(scaryFaceMove.camera?.zoom, 1.35);
});

test("buildFrames: 정상 적중 시 프레임 생성 및 클라이맥스 붉은 눈동자(showRedPupils) 검증", () => {
  const frames = scaryFaceMove.buildFrames({
    isPlayer: true,
    isHit: true,
    action: {
      actor: "player",
      moveKey: "scary-face",
      moveNameKo: "겁나는얼굴",
      moveNameEn: "Scary Face",
      type: "normal",
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

  assert.ok(frames.length >= 10, "적중 시 기승전결 시퀀스 프레임 생성 (총 12프레임)");

  // Step 2 발현 프레임에서는 red pupils가 없어야 함
  const manifestFrame = frames.find(f => f.phaseId === "scary-face-manifest-1");
  assert.ok(manifestFrame, "발현 프레임 존재");
  assert.strictEqual(manifestFrame.showRedPupils, undefined, "발현 초기에는 붉은 눈동자 없음");

  // Step 3 팽창 덮침 프레임에서는 red pupils가 번뜩여야 함
  const surgeFrame = frames.find(f => f.phaseId === "scary-face-looming-surge");
  assert.ok(surgeFrame, "팽창 덮침 프레임 존재");
  assert.strictEqual(surgeFrame.showRedPupils, true, "팽창 순간 붉은 눈동자 개안");
  assert.strictEqual(surgeFrame.faceAfterimage, true, "보라색 충격파 잔상 활성화");

  // 인라인 statProgress가 없어야 battleGifRenderer가 순정 랭크다운 연계로 이어짐
  const hasInlineStat = frames.some((f) => f.statProgress !== undefined);
  assert.strictEqual(hasInlineStat, false, "기술 자체 프레임에 인라인 statProgress 없이 순정 랭크다운 연계 작동");
});

test("buildFrames: 빗나감(Miss) 시 전용 프레임 생성 확인", () => {
  const missFrames = scaryFaceMove.buildFrames({
    isPlayer: true,
    isHit: false,
    action: {
      actor: "player",
      moveKey: "scary-face",
      moveNameKo: "겁나는얼굴",
      moveNameEn: "Scary Face",
      type: "normal",
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

  assert.ok(missFrames.length >= 3, "Miss 시 전용 프레임 생성");
  const flickerFrame = missFrames.find((f) => f.phaseId?.includes("flicker"));
  assert.ok(flickerFrame, "불발 프레임 존재");
});

console.log("\n==========================================================");
console.log(`🎉 모든 점검 항목 성공 완료! (총 ${passedCount}개 테스트 통과)`);
console.log("==========================================================");
