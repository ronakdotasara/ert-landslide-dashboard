const Database = require('better-sqlite3');
const fs       = require('fs');
const path     = require('path');

let db = null;

async function initDB() {
  const dbPath = process.env.DB_PATH || path.join(__dirname, '../../ert.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Run schema
  const schema = fs.readFileSync(path.join(__dirname, '../schema.sql'), 'utf8');
  db.exec(schema);

  // Seed default device if none exists
  const existing = db.prepare('SELECT id FROM devices WHERE id = ?').get('ERT-001');
  if (!existing) {
    db.prepare(`INSERT INTO devices (id, name, location, lat, lng) VALUES (?, ?, ?, ?, ?)`)
      .run('ERT-001', 'ERT Unit 1', 'Himachal Pradesh Test Site', 31.68, 76.52);
    db.prepare(`INSERT INTO thresholds (device_id, low_threshold, high_threshold) VALUES (?, ?, ?)`)
      .run('ERT-001', 10.0, 5000.0);
    console.log('[DB] Default device ERT-001 seeded.');
  }

  console.log(`[DB] SQLite ready at ${dbPath}`);
  return db;
}

function getDB() {
  if (!db) throw new Error('DB not initialized. Call initDB() first.');
  return db;
}

module.exports = { initDB, getDB };
