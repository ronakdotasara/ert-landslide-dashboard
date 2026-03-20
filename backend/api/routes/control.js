const express = require('express');
const router  = express.Router();
const { run, all } = require('../../db/models/db');
const { broadcast } = require('../websocket');

const pendingCommands = {};

router.post('/', async (req, res) => {
  const { device_id, command } = req.body;
  if (!device_id || !command)
    return res.status(400).json({ error: 'device_id and command required' });
  const validCommands = ['START', 'STOP', 'MANUAL', 'AUTO', 'STATUS'];
  if (!validCommands.includes(command) && !command.startsWith('PAIR '))
    return res.status(400).json({ error: 'Unknown command' });
  pendingCommands[device_id] = command;
  try {
    await run('INSERT INTO command_log (device_id, command, timestamp_ms) VALUES (?,?,?)',
      [device_id, command, Date.now()]);
    broadcast({ type: 'COMMAND_SENT', device_id, command });
    res.json({ ok: true, command });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/pending', (req, res) => {
  const { device } = req.query;
  if (!device) return res.status(400).json({ error: 'device required' });
  const command = pendingCommands[device] || 'none';
  delete pendingCommands[device];
  res.json({ command });
});

router.get('/log', async (req, res) => {
  const { device, limit = 50 } = req.query;
  try {
    const rows = await all(
      'SELECT * FROM command_log WHERE device_id = ? ORDER BY timestamp_ms DESC LIMIT ?',
      [device || 'ERT-001', Number(limit)]
    );
    res.json({ ok: true, log: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
