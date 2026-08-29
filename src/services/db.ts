import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dataDir = path.resolve(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "roguepot.sqlite");
export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

export function initDatabase(): void {
  // 1. Users Table with language & multiplayer_team column
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      language TEXT NOT NULL DEFAULT 'en',
      dex_data TEXT NOT NULL DEFAULT '{}',
      starter_data TEXT NOT NULL DEFAULT '{}',
      vouchers TEXT NOT NULL DEFAULT '{"regular": 0, "plus": 0, "premium": 0, "gold": 0}',
      total_runs INTEGER NOT NULL DEFAULT 0,
      highest_wave INTEGER NOT NULL DEFAULT 0,
      active_slot_id INTEGER DEFAULT NULL,
      multiplayer_team TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Migrate columns if missing in existing db
  try {
    db.exec(`ALTER TABLE users ADD COLUMN language TEXT NOT NULL DEFAULT 'en';`);
  } catch {}
  try {
    db.exec(`ALTER TABLE users ADD COLUMN multiplayer_team TEXT NOT NULL DEFAULT '[]';`);
  } catch {}

  // 2. Game Slots Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS game_slots (
      user_id TEXT NOT NULL,
      slot_id INTEGER NOT NULL,
      game_mode TEXT NOT NULL DEFAULT 'Classic',
      wave INTEGER NOT NULL DEFAULT 1,
      biome TEXT NOT NULL DEFAULT 'Town',
      starter TEXT NOT NULL,
      party TEXT NOT NULL DEFAULT '[]',
      items TEXT NOT NULL DEFAULT '{}',
      money INTEGER NOT NULL DEFAULT 1000,
      score INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (user_id, slot_id),
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );
  `);

  console.log(`[DB] SQLite Database initialized at ${dbPath}`);
}
