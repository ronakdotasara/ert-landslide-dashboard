const express = require('express');
const router  = express.Router();
const { run, get, all } = require('../../db/models/db');
const { broadcast }     = require('../websocket');

function authDevice(req, res, next) {
  const key = req.headers['x-device-key'];
  if (process.env.DEVICE_KEY && key !== process.env.DEVICE_KEY)
    return res.status(401).json({ error: 'Unauthorized device' });
  next();
}

router.post('/', authDevice, async (req, res) => {
  const { device_id, timestamp, readings } = req.body;
  if (!device_id || !Array.isArray(readings) || readings.length === 0)
    return res.status(400).json({ error: 'Invalid payload' });

  try {
    for (const r of readings) {
      await run(
        'INSERT INTO readings (device_id, timestamp_ms, elec_a, elec_b, voltage, current, resistivity) VALUES (?,?,?,?,?,?,?)',
        [device_id, timestamp || Date.now(), r.elec_a, r.elec_b, r.voltage, r.current, r.resistivity]
      );
    }

    const thresholds = await all('SELECT * FROM thresholds WHERE device_id = ?', [device_id]);
    const alerts = [];
    for (const r of readings) {
      for (const t of thresholds) {
        if (r.resistivity < t.low_threshold || r.resistivity > t.high_threshold) {
          const type = r.resistivity < t.low_threshold ? 'LOW_RESISTIVITY' : 'HIGH_RESISTIVITY';
          await run(
            'INSERT INTO alerts (device_id, elec_a, elec_b, value, type, timestamp_ms) VALUES (?,?,?,?,?,?)',
            [device_id, r.elec_a, r.elec_b, r.resistivity, type, Date.now()]
          );
          alerts.push({ device_id, elec_a: r.elec_a, elec_b: r.elec_b, value: r.resistivity, type });
        }
      }
    }

    broadcast({ type: 'SCAN_UPDATE', device_id, readings, alerts });
    res.json({ ok: true, inserted: readings.length, alerts: alerts.length });
  } catch (err) {
    console.error('[SENSOR] DB error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
