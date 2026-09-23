import { db } from "../src/services/db.js";
import { saveService, PartyPokemon } from "../src/services/saveService.js";
import { battleService } from "../src/services/battleService.js";
import { calculateStats, spawnWildPokemon } from "../src/battle/entities/pokemonFactory.js";
import { getMoveData } from "../src/data/movesKo.js";
import { createDefaultStages } from "../src/battle/engine/types.js";

const userId = "1aaaaaa1";
const slotId = 3;

console.log(`==================================================`);
console.log(`🚀 슬롯 3번 세팅 시작 (User: ${userId}, Slot: ${slotId})`);
console.log(`==================================================`);

// 1. 내 포켓몬 루카리오 Lv. 50 설정
const lucarioLevel = 50;
const lucarioStats = calculateStats("lucario", lucarioLevel);
const playerMoves = ["참기", "손가락흔들기", "따라하기", "자폭"];
const playerMovePps = playerMoves.map((m) => getMoveData(m)?.pp || 20);

const lucario: PartyPokemon = {
  speciesId: "lucario",
  name: "루카리오",
  nameKo: "루카리오",
  nameEn: "Lucario",
  level: lucarioLevel,
  hp: lucarioStats.maxHp,
  maxHp: lucarioStats.maxHp,
  moves: playerMoves,
  movePps: [...playerMovePps],
  maxMovePps: [...playerMovePps],
  ability: "Steadfast",
  passiveAbility: "Adaptability",
};

console.log("1. 플레이어 포켓몬 (루카리오 Lv.50):");
console.log(`   - HP: ${lucario.hp}/${lucario.maxHp}`);
console.log(`   - 기술배치: ${lucario.moves.join(", ")}`);
console.log(`   - 기술 PP: ${lucario.movePps?.join(", ")}`);

// 2. 상대 포켓몬 에이스번 Lv. 45 설정
const enemyLevel = 45;
const enemyStats = calculateStats("cinderace", enemyLevel);
const enemyMoves = ["화염방사", "화염볼", "전광석화", "박치기"];

const cinderace = {
  speciesId: "cinderace",
  name: "Cinderace",
  nameKo: "에이스번",
  level: enemyLevel,
  hp: enemyStats.maxHp,
  maxHp: enemyStats.maxHp,
  atk: enemyStats.atk,
  def: enemyStats.def,
  spAtk: enemyStats.spAtk,
  spDef: enemyStats.spDef,
  speed: enemyStats.speed,
  types: enemyStats.types,
  moves: enemyMoves,
  movePps: enemyMoves.map((m) => getMoveData(m)?.pp || 20),
  ability: "Blaze",
  stages: createDefaultStages(),
};

console.log("\n2. 상대 포켓몬 (에이스번 Lv.45):");
console.log(`   - HP: ${cinderace.hp}/${cinderace.maxHp}`);
console.log(`   - 능력치: Atk ${cinderace.atk}, Def ${cinderace.def}, SpAtk ${cinderace.spAtk}, SpDef ${cinderace.spDef}, Speed ${cinderace.speed}`);
console.log(`   - 기술배치: ${cinderace.moves.join(", ")}`);

// 3. SQLite DB 저장 (game_slots & users)
const now = new Date().toISOString();
db.prepare(`
  INSERT OR REPLACE INTO game_slots (user_id, slot_id, game_mode, wave, biome, starter, party, items, money, score, enemy, created_at, updated_at)
  VALUES (?, ?, 'Classic', 1, 'Town', '루카리오', ?, ?, 1000, 0, ?, ?, ?)
`).run(
  userId,
  slotId,
  JSON.stringify([lucario]),
  JSON.stringify({ "poke-ball": 10 }),
  JSON.stringify(cinderace),
  now,
  now
);

// 활성 슬롯을 3번으로 지정
db.prepare(`
  UPDATE users SET active_slot_id = ?, updated_at = ? WHERE user_id = ?
`).run(slotId, now, userId);

console.log("\n3. SQLite DB 저장 완료:");
console.log(`   - game_slots (user_id: ${userId}, slot_id: ${slotId}) 저장 완료`);
console.log(`   - users (active_slot_id: ${slotId}) 설정 완료`);

// 4. BattleService 메모리 배틀 상태 갱신
const key = `${userId}_${slotId}`;
(battleService as any).activeBattles.delete(key);

const battle = battleService.getOrCreateBattle(userId, slotId);
console.log("\n4. BattleService 배틀 상태 초기화 및 검증:");
console.log(`   - 배틀 키: ${key}`);
console.log(`   - 플레이어 몬스터: ${battle.playerBattleMon.nameKo || battle.playerBattleMon.name} (Lv.${battle.playerBattleMon.level}, HP: ${battle.playerBattleMon.hp}/${battle.playerBattleMon.maxHp})`);
console.log(`   - 플레이어 기술: ${battle.playerBattleMon.moves.join(", ")}`);
console.log(`   - 상대 몬스터: ${battle.enemy.nameKo || battle.enemy.name} (Lv.${battle.enemy.level}, HP: ${battle.enemy.hp}/${battle.enemy.maxHp})`);
console.log(`   - 상대 기술: ${battle.enemy.moves.join(", ")}`);

console.log(`==================================================`);
console.log(`✅ 3번 슬롯 세팅이 성공적으로 완료되었습니다!`);
console.log(`==================================================`);
