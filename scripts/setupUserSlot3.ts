import { db } from "../src/services/db.js";
import { saveService, PartyPokemon } from "../src/services/saveService.js";
import { battleService } from "../src/services/battleService.js";
import { calculateStats, spawnWildPokemon } from "../src/battle/entities/pokemonFactory.js";
import { getMoveData } from "../src/data/movesKo.js";
import { createDefaultStages } from "../src/battle/engine/types.js";

const targetUserIds = ["1aaaaaa1", "1411661077611020429"];
const slotId = 3;

console.log(`==================================================`);
console.log(`🚀 슬롯 3번 세팅 시작 (Users: ${targetUserIds.join(", ")}, Slot: ${slotId})`);
console.log(`==================================================`);

// 1. 내 포켓몬 블레이범 Lv. 50 설정
const typhlosionLevel = 50;
const typhlosionStats = calculateStats("typhlosion", typhlosionLevel);
const playerMoves = ["화염방사", "분화", "스피드스타", "전광석화"];
const playerMovePps = playerMoves.map((m) => getMoveData(m)?.pp || 20);

const typhlosion: PartyPokemon = {
  speciesId: "typhlosion",
  name: "블레이범",
  nameKo: "블레이범",
  nameEn: "Typhlosion",
  level: typhlosionLevel,
  hp: typhlosionStats.maxHp,
  maxHp: typhlosionStats.maxHp,
  moves: playerMoves,
  movePps: [...playerMovePps],
  maxMovePps: [...playerMovePps],
  ability: "Blaze",
  passiveAbility: "Flash Fire",
};

console.log("1. 플레이어 포켓몬 (블레이범 Lv.50):");
console.log(`   - HP: ${typhlosion.hp}/${typhlosion.maxHp}`);
console.log(`   - 기술배치: ${typhlosion.moves.join(", ")}`);
console.log(`   - 기술 PP: ${typhlosion.movePps?.join(", ")}`);

// 2. 상대 포켓몬 리자몽 Lv. 50 설정
const enemyLevel = 50;
const enemyStats = calculateStats("charizard", enemyLevel);
const enemyMoves = ["화염방사", "불대문자", "날개치기", "베어가르기"];

const charizard = {
  speciesId: "charizard",
  name: "Charizard",
  nameKo: "리자몽",
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

console.log("\n2. 상대 포켓몬 (리자몽 Lv.50):");
console.log(`   - HP: ${charizard.hp}/${charizard.maxHp}`);
console.log(`   - 능력치: Atk ${charizard.atk}, Def ${charizard.def}, SpAtk ${charizard.spAtk}, SpDef ${charizard.spDef}, Speed ${charizard.speed}`);
console.log(`   - 기술배치: ${charizard.moves.join(", ")}`);

// 3. SQLite DB 저장 (game_slots & users)
const now = new Date().toISOString();
for (const userId of targetUserIds) {
  db.prepare(`
    INSERT OR REPLACE INTO game_slots (user_id, slot_id, game_mode, wave, biome, starter, party, items, money, score, enemy, created_at, updated_at)
    VALUES (?, ?, 'Classic', 1, 'Town', '블레이범', ?, ?, 1000, 0, ?, ?, ?)
  `).run(
    userId,
    slotId,
    JSON.stringify([typhlosion]),
    JSON.stringify({ "poke-ball": 10 }),
    JSON.stringify(charizard),
    now,
    now
  );

  // 활성 슬롯을 3번으로 지정
  db.prepare(`
    UPDATE users SET active_slot_id = ?, updated_at = ? WHERE user_id = ?
  `).run(slotId, now, userId);

  console.log(`\n3. SQLite DB 저장 완료 (user_id: ${userId}, slot_id: ${slotId}):`);
  console.log(`   - game_slots (블레이범 vs 리자몽) 저장 완료`);
  console.log(`   - users (active_slot_id: ${slotId}) 설정 완료`);

  // 4. BattleService 메모리 배틀 상태 갱신
  const key = `${userId}_${slotId}`;
  (battleService as any).activeBattles.delete(key);

  const battle = battleService.getOrCreateBattle(userId, slotId);
  console.log(`\n4. BattleService 배틀 상태 초기화 및 검증 (${userId}):`);
  console.log(`   - 배틀 키: ${key}`);
  console.log(`   - 플레이어 몬스터: ${battle.playerBattleMon.nameKo || battle.playerBattleMon.name} (Lv.${battle.playerBattleMon.level}, HP: ${battle.playerBattleMon.hp}/${battle.playerBattleMon.maxHp})`);
  console.log(`   - 플레이어 기술: ${battle.playerBattleMon.moves.join(", ")}`);
  console.log(`   - 상대 몬스터: ${battle.enemy.nameKo || battle.enemy.name} (Lv.${battle.enemy.level}, HP: ${battle.enemy.hp}/${battle.enemy.maxHp})`);
  console.log(`   - 상대 기술: ${battle.enemy.moves.join(", ")}`);
}

console.log(`==================================================`);
console.log(`✅ 블레이범 vs 리자몽 세팅이 성공적으로 완료되었습니다!`);
console.log(`==================================================`);
console.log(`==================================================`);
