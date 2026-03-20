-- ERT Landslide Monitoring Database Schema
-- Compatible with SQLite (default) and PostgreSQL

CREATE TABLE IF NOT EXISTS devices (
  id          TEXT PRIMARY KEY,
  name        TEXT,
  location    TEXT,
  lat         REAL,
  lng         REAL,
  registered  INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
  last_seen   INTEGER
);

CREATE TABLE IF NOT EXISTS readings (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id     TEXT NOT NULL,
  timestamp_ms  INTEGER NOT NULL,
  elec_a        INTEGER NOT NULL,
  elec_b        INTEGER NOT NULL,
  voltage       REAL NOT NULL,
  current       REAL NOT NULL,
  resistivity   REAL NOT NULL,
  FOREIGN KEY (device_id) REFERENCES devices(id)
);

CREATE INDEX IF NOT EXISTS idx_readings_device_ts ON readings(device_id, timestamp_ms DESC);
CREATE INDEX IF NOT EXISTS idx_readings_elecs      ON readings(elec_a, elec_b);

CREATE TABLE IF NOT EXISTS alerts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id    TEXT NOT NULL,
  elec_a       INTEGER,
  elec_b       INTEGER,
  value        REAL,
  type         TEXT NOT NULL,  -- 'LOW_RESISTIVITY' | 'HIGH_RESISTIVITY' | 'DEVICE_OFFLINE'
  timestamp_ms INTEGER NOT NULL,
  read         INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (device_id) REFERENCES devices(id)
);

CREATE TABLE IF NOT EXISTS thresholds (
  device_id       TEXT PRIMARY KEY,
  low_threshold   REAL NOT NULL DEFAULT 10.0,
  high_threshold  REAL NOT NULL DEFAULT 5000.0,
  FOREIGN KEY (device_id) REFERENCES devices(id)
);

CREATE TABLE IF NOT EXISTS command_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id    TEXT NOT NULL,
  command      TEXT NOT NULL,
  timestamp_ms INTEGER NOT NULL
);
