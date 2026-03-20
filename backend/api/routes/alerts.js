const express = require('express');
const router  = express.Router();
const { run, get, all } = require('../../db/models/db');

router.get('/', async (req, res) => {
  const { device, limit = 100, unread } = req.query;
  let query = 'SELECT * FROM alerts WHERE 1=1';
  const params = [];
  if (device) { query += ' AND device_id = ?'; params.push(device); }
  if (unread === 'true') { query += ' AND read = 0'; }
  query += ' ORDER BY timestamp_ms DESC LIMIT ?';
  params.push(Number(limit));
  try {
    const rows = await all(query, params);
    res.json({ ok: true, count: rows.length, alerts: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/read', async (req, res) => {
  try {
    await run('UPDATE alerts SET read = 1 WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/thresholds', async (req, res) => {
  const { device } = req.query;
  try {
    const rows = await all('SELECT * FROM thresholds WHERE device_id = ?', [device || 'ERT-001']);
    res.json({ ok: true, thresholds: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/thresholds', async (req, res) => {
  const { device_id, low_threshold, high_threshold } = req.body;
  try {
    await run(
      'INSERT INTO thresholds (device_id, low_threshold, high_threshold) VALUES (?,?,?) ON CONFLICT(device_id) DO UPDATE SET low_threshold=excluded.low_threshold, high_threshold=excluded.high_threshold',
      [device_id, low_threshold, high_threshold]
    );
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
