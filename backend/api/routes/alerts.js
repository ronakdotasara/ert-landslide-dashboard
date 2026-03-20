const express = require('express');
const router  = express.Router();
const { getDB } = require('../db/models/db');

// GET /api/alerts?device=ERT-001&limit=100&unread=true
router.get('/', (req, res) => {
  const { device, limit = 100, unread } = req.query;
  const db = getDB();

  let query = 'SELECT * FROM alerts WHERE 1=1';
  const params = [];
  if (device) { query += ' AND device_id = ?'; params.push(device); }
  if (unread === 'true') { query += ' AND read = 0'; }
  query += ' ORDER BY timestamp_ms DESC LIMIT ?';
  params.push(Number(limit));

  const rows = db.prepare(query).all(...params);
  res.json({ ok: true, count: rows.length, alerts: rows });
});

// POST /api/alerts/:id/read  — mark alert as read
router.post('/:id/read', (req, res) => {
  const db = getDB();
  db.prepare('UPDATE alerts SET read = 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// GET /api/alerts/thresholds?device=ERT-001
router.get('/thresholds', (req, res) => {
  const { device } = req.query;
  const db = getDB();
  const rows = db.prepare('SELECT * FROM thresholds WHERE device_id = ?').all(device || 'ERT-001');
  res.json({ ok: true, thresholds: rows });
});

// POST /api/alerts/thresholds  — set alert thresholds
// Body: { device_id, low_threshold, high_threshold }
router.post('/thresholds', (req, res) => {
  const { device_id, low_threshold, high_threshold } = req.body;
  const db = getDB();
  db.prepare(`
    INSERT INTO thresholds (device_id, low_threshold, high_threshold)
    VALUES (?, ?, ?)
    ON CONFLICT(device_id) DO UPDATE SET low_threshold=excluded.low_threshold,
                                          high_threshold=excluded.high_threshold
  `).run(device_id, low_threshold, high_threshold);
  res.json({ ok: true });
});

module.exports = router;
