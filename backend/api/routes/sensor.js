const express = require('express');
const router  = express.Router();
const { run } = require('../../db/models/db');
const { broadcast } = require('../websocket');

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
    console.error('[SENSOR] DB error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
