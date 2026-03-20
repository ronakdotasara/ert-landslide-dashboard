const express = require('express');
const router  = express.Router();
const { getDB } = require('../db/models/db');
const { broadcast } = require('../websocket');

// Pending commands queue (in-memory, keyed by device_id)
const pendingCommands = {};

// POST /api/control  — dashboard sends a command
// Body: { device_id, command }  e.g. { command: "START" | "STOP" | "PAIR 3 7" | "STATUS" }
router.post('/', (req, res) => {
  const { device_id, command } = req.body;
  if (!device_id || !command) {
    return res.status(400).json({ error: 'device_id and command required' });
  }

  const validCommands = ['START', 'STOP', 'MANUAL', 'AUTO', 'STATUS'];
  const isValid = validCommands.includes(command) || command.startsWith('PAIR ');
  if (!isValid) {
    return res.status(400).json({ error: 'Unknown command' });
  }

  pendingCommands[device_id] = command;

  // Log to DB
  const db = getDB();
  db.prepare('INSERT INTO command_log (device_id, command, timestamp_ms) VALUES (?, ?, ?)')
    .run(device_id, command, Date.now());

  // Notify dashboard via WebSocket
  broadcast({ type: 'COMMAND_SENT', device_id, command });

  console.log(`[CONTROL] Command queued for ${device_id}: ${command}`);
  res.json({ ok: true, command });
});

// GET /api/control/pending?device=ERT-001  — ESP polls this
router.get('/pending', (req, res) => {
  const { device } = req.query;
  if (!device) return res.status(400).json({ error: 'device required' });

  const command = pendingCommands[device] || 'none';
  delete pendingCommands[device];  // consume it
  res.json({ command });
});

// GET /api/control/log?device=ERT-001  — command history
router.get('/log', (req, res) => {
  const { device, limit = 50 } = req.query;
  const db = getDB();
  const rows = db.prepare(
    'SELECT * FROM command_log WHERE device_id = ? ORDER BY timestamp_ms DESC LIMIT ?'
  ).all(device || 'ERT-001', Number(limit));
  res.json({ ok: true, log: rows });
});

module.exports = router;
