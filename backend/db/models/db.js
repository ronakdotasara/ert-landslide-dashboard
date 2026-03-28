/**
 * db/models/db.js  —  SQLite helpers for ERT Landslide Monitor
 *
 * Tables:
 *   readings  — every electrode measurement from the ESP32
 *   alerts    — anomaly and voltage alerts
 */

const Database = require('better-sqlite3');
const path     = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../ert.db');
let db;

// ── Init — create tables if not present ──────────────────────
function initDB() {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS readings (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id     TEXT    NOT NULL DEFAULT 'ERT-001',
      elec_a        INTEGER NOT NULL,
      elec_b        INTEGER NOT NULL,
      elec_m        INTEGER NOT NULL,
      elec_n        INTEGER NOT NULL,
      voltage_mV    REAL,
      current_mA    REAL,
      resistance    REAL,
      resistivity   REAL,
      protocol      TEXT,
      timestamp_ms  INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_readings_device_ts
      ON readings (device_id, timestamp_ms DESC);

    CREATE INDEX IF NOT EXISTS idx_readings_resistivity
      ON readings (device_id, resistivity);

    CREATE TABLE IF NOT EXISTS alerts (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      type      TEXT,
      severity  TEXT,
      kind      TEXT,
      rho       REAL,
      vrms      REAL,
      elec_a    INTEGER,
      elec_b    INTEGER,
      message   TEXT,
      ts        INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_alerts_ts
      ON alerts (ts DESC);
  `);

  console.log(`[DB] SQLite ready at ${DB_PATH}`);
  return Promise.resolve();
}

// ── Prepared statements (lazy init after initDB) ─────────────
let _insertReading, _insertAlert;

function getInsertReading() {
  if (!_insertReading) {
    _insertReading = db.prepare(`
      INSERT INTO readings
        (device_id, elec_a, elec_b, elec_m, elec_n,
         voltage_mV, current_mA, resistance, resistivity,
         protocol, timestamp_ms)
      VALUES
        (@device_id, @elec_a, @elec_b, @elec_m, @elec_n,
         @voltage_mV, @current_mA, @resistance, @resistivity,
         @protocol, @timestamp_ms)
    `);
  }
  return _insertReading;
}

function getInsertAlert() {
  if (!_insertAlert) {
    _insertAlert = db.prepare(`
      INSERT INTO alerts
        (type, severity, kind, rho, vrms, elec_a, elec_b, message, ts)
      VALUES
        (@type, @severity, @kind, @rho, @vrms, @elec_a, @elec_b, @message, @ts)
    `);
  }
  return _insertAlert;
}

// ── Public helpers ────────────────────────────────────────────

function saveReading(r) {
  getInsertReading().run({
    device_id:    r.device_id   || 'ERT-001',
    elec_a:       r.elec_a      ?? 0,
    elec_b:       r.elec_b      ?? 0,
    elec_m:       r.elec_m      ?? 0,
    elec_n:       r.elec_n      ?? 0,
    voltage_mV:   r.voltage_mV  ?? null,
    current_mA:   r.current_mA  ?? null,
    resistance:   r.resistance  ?? null,
    resistivity:  r.resistivity ?? null,
    protocol:     r.protocol    || 'Wenner',
    timestamp_ms: r.timestamp_ms || Date.now(),
  });
  return Promise.resolve();
}

function saveAlert(a) {
  getInsertAlert().run({
    type:     a.type     || 'ANOMALY',
    severity: a.severity || 'LOW',
    kind:     a.kind     || null,
    rho:      a.rho      ?? null,
    vrms:     a.vrms     ?? null,
    elec_a:   a.elec_a   ?? null,
    elec_b:   a.elec_b   ?? null,
    message:  a.message  || '',
    ts:       a.ts       || Date.now(),
  });
  return Promise.resolve();
}

// ── Generic query helpers (used by route files) ───────────────
function get(sql, params = []) {
  return Promise.resolve(db.prepare(sql).get(...params));
}

function all(sql, params = []) {
  return Promise.resolve(db.prepare(sql).all(...params));
}

function run(sql, params = []) {
  return Promise.resolve(db.prepare(sql).run(...params));
}

module.exports = { initDB, saveReading, saveAlert, get, all, run };