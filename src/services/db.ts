import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dataDir = path.resolve(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "roguepot.sqlite");
export const db = new Database(dbPath);

// Enable WAL mode for high concurrency & performance
db.pragma("journal_mode = WAL");

/**
 * Initialize Database Schema with PokéRogue System & Session structures
 */
export function initDatabase(): void {
  // 1. Users Table (Global Account Data: Dex, Starter Candies, Unlocks, Stats)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      dex_data TEXT NOT NULL DEFAULT '{}',
      starter_data TEXT NOT NULL DEFAULT '{}',
      vouchers TEXT NOT NULL DEFAULT '{"regular": 0, "plus": 0, "premium": 0, "gold": 0}',
      total_runs INTEGER NOT NULL DEFAULT 0,
      highest_wave INTEGER NOT NULL DEFAULT 0,
      active_slot_id INTEGER DEFAULT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 2. Game Slots Table (Session Run Data: Wave, Biome, 6-Pokemon Party, Modifiers/Items, Money)
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
