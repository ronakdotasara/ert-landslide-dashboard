const express    = require('express');
const cors       = require('cors');
const http       = require('http');
const path       = require('path');
require('dotenv').config();

const { initDB }        = require('./db/models/db');
const { initWebSocket } = require('./websocket');
const sensorRoutes      = require('./routes/sensor');
const readingsRoutes    = require('./routes/readings');
const controlRoutes     = require('./routes/control');
const alertsRoutes      = require('./routes/alerts');

const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT || 3001;

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '../frontend/build')));

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/sensor',   sensorRoutes);
app.use('/api/readings', readingsRoutes);
app.use('/api/control',  controlRoutes);
app.use('/api/alerts',   alertsRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

// Serve React app for all other routes
app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'))
);

// ── Start ──────────────────────────────────────────────────────────────────
async function start() {
  await initDB();
  initWebSocket(server);
  server.listen(PORT, () => console.log(`[SERVER] Listening on port ${PORT}`));
}

start().catch(err => { console.error('[SERVER] Fatal:', err); process.exit(1); });
