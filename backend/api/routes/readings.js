const express = require('express');
const router  = express.Router();
const { getDB } = require('../db/models/db');

// GET /api/readings?device=ERT-001&limit=500&from=<ts>&to=<ts>
router.get('/', (req, res) => {
  const { device, limit = 500, from, to } = req.query;
  const db = getDB();

  let query = 'SELECT * FROM readings WHERE 1=1';
  const params = [];

  if (device) { query += ' AND device_id = ?'; params.push(device); }
  if (from)   { query += ' AND timestamp_ms >= ?'; params.push(Number(from)); }
  if (to)     { query += ' AND timestamp_ms <= ?'; params.push(Number(to)); }

  query += ' ORDER BY timestamp_ms DESC LIMIT ?';
  params.push(Number(limit));

  try {
    const rows = db.prepare(query).all(...params);
    res.json({ ok: true, count: rows.length, readings: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/readings/latest?device=ERT-001
router.get('/latest', (req, res) => {
  const { device } = req.query;
  const db = getDB();
  const row = db.prepare(
    'SELECT * FROM readings WHERE device_id = ? ORDER BY timestamp_ms DESC LIMIT 1'
  ).get(device || 'ERT-001');
  res.json({ ok: true, reading: row || null });
});

// GET /api/readings/grid?device=ERT-001&scan_ts=<ts>
// Returns all readings for a single scan as a 2D grid
router.get('/grid', (req, res) => {
  const { device, scan_ts } = req.query;
  const db = getDB();

  // Get all readings within ±5s of scan_ts
  const ts = Number(scan_ts) || Date.now();
  const rows = db.prepare(`
    SELECT elec_a, elec_b, resistivity
    FROM readings
    WHERE device_id = ? AND timestamp_ms BETWEEN ? AND ?
    ORDER BY elec_a, elec_b
  `).all(device || 'ERT-001', ts - 5000, ts + 5000);

  res.json({ ok: true, count: rows.length, grid: rows });
});

// GET /api/readings/stats?device=ERT-001
router.get('/stats', (req, res) => {
  const { device } = req.query;
  const db = getDB();
  const stats = db.prepare(`
    SELECT
      COUNT(*)        AS total_readings,
      MIN(resistivity) AS min_rho,
      MAX(resistivity) AS max_rho,
      AVG(resistivity) AS avg_rho,
      MIN(timestamp_ms) AS first_ts,
      MAX(timestamp_ms) AS last_ts
    FROM readings WHERE device_id = ?
  `).get(device || 'ERT-001');
  res.json({ ok: true, stats });
});

module.exports = router;
