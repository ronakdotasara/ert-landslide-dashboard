const express = require('express');
const router  = express.Router();
const { get, all } = require('../../db/models/db');

router.get('/', async (req, res) => {
  const { device, limit = 500, from, to } = req.query;
  let query = 'SELECT * FROM readings WHERE 1=1';
  const params = [];
  if (device) { query += ' AND device_id = ?'; params.push(device); }
  if (from)   { query += ' AND timestamp_ms >= ?'; params.push(Number(from)); }
  if (to)     { query += ' AND timestamp_ms <= ?'; params.push(Number(to)); }
  query += ' ORDER BY timestamp_ms DESC LIMIT ?';
  params.push(Number(limit));
  try {
    const rows = await all(query, params);
    res.json({ ok: true, count: rows.length, readings: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/latest', async (req, res) => {
  const { device } = req.query;
  try {
    const row = await get(
      'SELECT * FROM readings WHERE device_id = ? ORDER BY timestamp_ms DESC LIMIT 1',
      [device || 'ERT-001']
    );
    res.json({ ok: true, reading: row || null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/grid', async (req, res) => {
  const { device, scan_ts } = req.query;
  const ts = Number(scan_ts) || Date.now();
  try {
    const rows = await all(
      'SELECT elec_a, elec_b, resistivity FROM readings WHERE device_id = ? AND timestamp_ms BETWEEN ? AND ? ORDER BY elec_a, elec_b',
      [device || 'ERT-001', ts - 5000, ts + 5000]
    );
    res.json({ ok: true, count: rows.length, grid: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/stats', async (req, res) => {
  const { device } = req.query;
  try {
    const stats = await get(
      'SELECT COUNT(*) AS total_readings, MIN(resistivity) AS min_rho, MAX(resistivity) AS max_rho, AVG(resistivity) AS avg_rho, MIN(timestamp_ms) AS first_ts, MAX(timestamp_ms) AS last_ts FROM readings WHERE device_id = ?',
      [device || 'ERT-001']
    );
    res.json({ ok: true, stats });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
