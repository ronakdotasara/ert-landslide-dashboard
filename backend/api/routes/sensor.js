const express = require('express');
const router  = express.Router();
const { getDB } = require('../db/models/db');
const { broadcast } = require('../websocket');

// Middleware: validate device key
function authDevice(req, res, next) {
  const key = req.headers['x-device-key'];
  if (key !== process.env.DEVICE_KEY) {
    return res.status(401).json({ error: 'Unauthorized device' });
  }
  next();
}

// POST /api/sensor
// Body: { device_id, timestamp, scan_count, readings: [{elec_a, elec_b, voltage, current, resistivity}] }
router.post('/', authDevice, async (req, res) => {
  const { device_id, timestamp, readings } = req.body;

  if (!device_id || !Array.isArray(readings) || readings.length === 0) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const db = getDB();
  const stmt = db.prepare(`
    INSERT INTO readings (device_id, timestamp_ms, elec_a, elec_b, voltage, current, resistivity)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((rows) => {
    for (const r of rows) {
      stmt.run(device_id, timestamp, r.elec_a, r.elec_b, r.voltage, r.current, r.resistivity);
    }
  });

  try {
    insertMany(readings);

    // Check alert thresholds
    const thresholds = db.prepare('SELECT * FROM thresholds WHERE device_id = ?').all(device_id);
    const alerts = [];
    for (const r of readings) {
      for (const t of thresholds) {
        if (r.resistivity < t.low_threshold || r.resistivity > t.high_threshold) {
          const alert = {
            device_id,
            elec_a: r.elec_a,
            elec_b: r.elec_b,
            value: r.resistivity,
            type: r.resistivity < t.low_threshold ? 'LOW_RESISTIVITY' : 'HIGH_RESISTIVITY',
            timestamp: Date.now()
          };
          db.prepare(`INSERT INTO alerts (device_id, elec_a, elec_b, value, type, timestamp_ms)
                      VALUES (?, ?, ?, ?, ?, ?)`)
            .run(alert.device_id, alert.elec_a, alert.elec_b, alert.value, alert.type, alert.timestamp);
          alerts.push(alert);
        }
      }
    }

    // Broadcast to all WebSocket clients
    broadcast({ type: 'SCAN_UPDATE', device_id, readings, alerts });

    res.json({ ok: true, inserted: readings.length, alerts: alerts.length });
  } catch (err) {
    console.error('[SENSOR] DB error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
