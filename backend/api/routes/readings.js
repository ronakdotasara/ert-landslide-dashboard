const express = require('express');
const router  = express.Router();
const { run, get, all } = require('../../db/models/db');
const { broadcast }     = require('../websocket');

// ── POST /api/readings ────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { device_id, timestamp, readings } = req.body;
  if (!device_id || !Array.isArray(readings) || readings.length === 0)
    return res.status(400).json({ error: 'Invalid payload' });

  try {
    for (const r of readings) {
      await run(
        `INSERT INTO readings
          (device_id, timestamp_ms, elec_a, elec_b, elec_m, elec_n,
           voltage_mV, current_mA, resistance, resistivity, protocol)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [device_id, timestamp || Date.now(),
         r.elec_a, r.elec_b, r.elec_m ?? 0, r.elec_n ?? 0,
         r.voltage_mV, r.current_mA, r.resistance, r.resistivity,
         r.protocol || 'Wenner']
      );
    }
    broadcast({ type: 'SCAN_UPDATE', device_id, readings });
    res.json({ ok: true, inserted: readings.length });
  } catch (err) {
    console.error('[READINGS] DB insert error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/readings?device=ERT-001&limit=500 ────────────────────────────
// Base route — returns { readings: [...] } shape that useSensorData expects
router.get('/', async (req, res) => {
  const device = req.query.device || 'ERT-001';
  const limit  = Math.min(parseInt(req.query.limit) || 500, 1000);
  try {
    const rows = await all(
      `SELECT * FROM readings
       WHERE device_id = ?
       ORDER BY timestamp_ms DESC
       LIMIT ?`,
      [device, limit]
    );
    res.json({ readings: rows });
  } catch (err) {
    console.error('[READINGS] Fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/readings/stats?device=ERT-001 ────────────────────────────────
// Returns { stats: {...} } shape that useSensorData expects
router.get('/stats', async (req, res) => {
  const device = req.query.device || 'ERT-001';
  try {
    const row = await get(
      `SELECT
         COUNT(*)                                    AS total_readings,
         ROUND(AVG(resistivity), 2)                  AS avg_resistivity,
         ROUND(MIN(resistivity), 2)                  AS min_resistivity,
         ROUND(MAX(resistivity), 2)                  AS max_resistivity,
         MAX(timestamp_ms)                           AS last_seen_ms,
         COUNT(DISTINCT elec_a || '-' || elec_b)     AS unique_pairs
       FROM readings
       WHERE device_id = ?`,
      [device]
    );
    res.json({
      stats: {
        device_id:       device,
        total_readings:  row?.total_readings  ?? 0,
        avg_resistivity: row?.avg_resistivity ?? 0,
        min_resistivity: row?.min_resistivity ?? 0,
        max_resistivity: row?.max_resistivity ?? 0,
        last_seen_ms:    row?.last_seen_ms    ?? null,
        unique_pairs:    row?.unique_pairs    ?? 0,
      }
    });
  } catch (err) {
    console.error('[READINGS] Stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/readings/latest?device=ERT-001&limit=50 ─────────────────────
router.get('/latest', async (req, res) => {
  const device = req.query.device || 'ERT-001';
  const limit  = Math.min(parseInt(req.query.limit) || 50, 500);
  try {
    const rows = await all(
      `SELECT * FROM readings
       WHERE device_id = ?
       ORDER BY timestamp_ms DESC
       LIMIT ?`,
      [device, limit]
    );
    res.json(rows);
  } catch (err) {
    console.error('[READINGS] Latest error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/readings/history?device=ERT-001&from=<ms>&to=<ms> ───────────
router.get('/history', async (req, res) => {
  const device = req.query.device || 'ERT-001';
  const from   = parseInt(req.query.from) || 0;
  const to     = parseInt(req.query.to)   || Date.now();
  try {
    const rows = await all(
      `SELECT * FROM readings
       WHERE device_id = ?
         AND timestamp_ms BETWEEN ? AND ?
       ORDER BY timestamp_ms ASC`,
      [device, from, to]
    );
    res.json(rows);
  } catch (err) {
    console.error('[READINGS] History error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/readings/grid?device=ERT-001 ────────────────────────────────
router.get('/grid', async (req, res) => {
  const device = req.query.device || 'ERT-001';
  try {
    const rows = await all(
      `SELECT elec_a, elec_b, elec_m, elec_n,
              resistivity, voltage_mV, current_mA,
              resistance, protocol, timestamp_ms
       FROM readings
       WHERE device_id = ?
         AND id IN (
           SELECT MAX(id) FROM readings
           WHERE device_id = ?
           GROUP BY elec_a, elec_b
         )
       ORDER BY elec_a, elec_b`,
      [device, device]
    );
    res.json(rows);
  } catch (err) {
    console.error('[READINGS] Grid error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;