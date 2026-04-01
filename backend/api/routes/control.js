const express    = require('express');
const router     = express.Router();
const { run, all } = require('../../db/models/db');
const { broadcast, sendToEsp } = require('../websocket');

const pendingCommands = {};

// ── POST /api/control ─────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { device_id, command, protocol } = req.body;
  if (!device_id || !command)
    return res.status(400).json({ error: 'device_id and command required' });

  const CMD_MAP = {
    'START':       'START_SCAN',
    'START_SCAN':  'START_SCAN',
    'STOP':        'STOP_SCAN',
    'STOP_SCAN':   'STOP_SCAN',
    'MANUAL':      'SINGLE_SCAN',
    'SINGLE_SCAN': 'SINGLE_SCAN',
    'GET_STATUS':  'GET_STATUS',
  };

  const espCommand = CMD_MAP[command] || command;
  const wsPayload  = { type: espCommand, device_id };
  if (protocol) wsPayload.protocol = protocol;

  const sent = sendToEsp(wsPayload);
  if (!sent) console.warn(`[CONTROL] ESP32 not connected — command ${espCommand} not delivered`);

  pendingCommands[device_id] = espCommand;

  try {
    await run(
      'INSERT INTO command_log (device_id, command, timestamp_ms) VALUES (?,?,?)',
      [device_id, espCommand, Date.now()]
    );
  } catch (err) {
    console.error('[CONTROL] DB log error:', err.message);
  }

  broadcast({ type: 'COMMAND_SENT', device_id, command: espCommand });
  console.log(`[CONTROL] ${espCommand} → ESP32 (forwarded=${sent})`);
  res.json({ ok: true, command: espCommand, forwarded: sent });
});

// ── GET /api/control/pending?device=ERT-001 ───────────────────────────────
router.get('/pending', (req, res) => {
  const { device } = req.query;
  if (!device) return res.status(400).json({ error: 'device required' });
  const command = pendingCommands[device] || 'none';
  delete pendingCommands[device];
  res.json({ command });
});

// ── GET /api/control/log ──────────────────────────────────────────────────
router.get('/log', async (req, res) => {
  const { device, limit = 50 } = req.query;
  try {
    const rows = await all(
      'SELECT * FROM command_log WHERE device_id = ? ORDER BY timestamp_ms DESC LIMIT ?',
      [device || 'ERT-001', Number(limit)]
    );
    res.json({ ok: true, log: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;