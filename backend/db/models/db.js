const sqlite3 = require('sqlite3').verbose();
const fs      = require('fs');
const path    = require('path');

let db = null;

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err); else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err); else resolve(rows);
    });
  });
}

function exec(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => { if (err) reject(err); else resolve(); });
  });
}

async function initDB() {
  const dbPath = process.env.DB_PATH || path.join(__dirname, '../../ert.db');
  db = new sqlite3.Database(dbPath);
  await run('PRAGMA journal_mode = WAL');
  await run('PRAGMA foreign_keys = ON');
  const schema = fs.readFileSync(path.join(__dirname, '../schema.sql'), 'utf8');
  await exec(schema);
  const existing = await get('SELECT id FROM devices WHERE id = ?', ['ERT-001']);
  if (!existing) {
    await run('INSERT INTO devices (id, name, location, lat, lng) VALUES (?, ?, ?, ?, ?)',
      ['ERT-001', 'ERT Unit 1', 'Himachal Pradesh Test Site', 31.68, 76.52]);
    await run('INSERT INTO thresholds (device_id, low_threshold, high_threshold) VALUES (?, ?, ?)',
      ['ERT-001', 10.0, 5000.0]);
    console.log('[DB] Default device ERT-001 seeded.');
  }
  console.log(`[DB] SQLite ready at ${dbPath}`);
  return db;
}

function getDB() {
  if (!db) throw new Error('DB not initialized. Call initDB() first.');
  return db;
}

module.exports = { initDB, getDB, run, get, all, exec };
