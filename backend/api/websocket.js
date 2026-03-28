/**
 * websocket.js  —  ERT Landslide Monitor
 * Handles all ESP32 ↔ dashboard real-time communication.
 *
 * Message types FROM ESP32:
 *   READING        — single live electrode measurement
 *   SCAN_COMPLETE  — full protocol sweep batch
 *   VOLTAGE_AC     — ZMPT101B mains voltage
 *   STATUS         — heartbeat / device state
 *
 * Commands TO ESP32:
 *   START_SCAN     — begin continuous scanning (optional protocol field)
 *   STOP_SCAN      — halt scanning
 *   SET_PROTOCOL   — change protocol without starting
 *   SINGLE_SCAN    — one-shot scan
 *   GET_STATUS     — request status reply
 */

const { WebSocketServer } = require('ws');
const { saveReading, saveAlert } = require('../db/models/db');

// ── Alert thresholds (can also be set via .env) ──────────────
const ALERT_LOW       = Number(process.env.ALERT_LOW_RESISTIVITY)      || 50;
const ALERT_CRITICAL  = Number(process.env.ALERT_CRITICAL_RESISTIVITY) || 20;
const ALERT_HIGH      = Number(process.env.ALERT_HIGH_RESISTIVITY)     || 2000;
const ZMPT_MIN        = Number(process.env.ZMPT_MIN_VOLTAGE)           || 190;
const ZMPT_MAX        = Number(process.env.ZMPT_MAX_VOLTAGE)           || 250;

let wss       = null;
let espSocket = null;   // track the ESP32 connection specifically

// ── Init ─────────────────────────────────────────────────────
function initWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    console.log(`[WS] Client connected from ${ip}`);

    ws.send(JSON.stringify({ type: 'CONNECTED', ts: Date.now() }));

    ws.on('message', async (raw) => {
      let data;
      try { data = JSON.parse(raw); } catch { return; }

      // ── Identify ESP32 by device_id field ─────────────────
      if (data.device_id === 'ERT-001') {
        espSocket = ws;
        await handleEspMessage(data);
      }

      // ── Forward everything to dashboard clients ────────────
      broadcastToDashboards(data, ws);
    });

    ws.on('close', () => {
      if (ws === espSocket) {
        espSocket = null;
        console.log('[WS] ESP32 disconnected');
        broadcastToDashboards({ type: 'DEVICE_OFFLINE', device_id: 'ERT-001', ts: Date.now() });
      } else {
        console.log('[WS] Dashboard client disconnected');
      }
    });

    ws.on('error', (err) => console.error('[WS] Error:', err.message));
  });

  console.log('[WS] WebSocket server ready at /ws');
}

// ── Handle messages originating from the ESP32 ───────────────
async function handleEspMessage(data) {
  try {
    switch (data.type) {

      case 'READING':
        await persistReading(data);
        await checkAnomalies(data);
        break;

      case 'SCAN_COMPLETE':
        console.log(`[WS] SCAN_COMPLETE — ${(data.readings || []).length} readings  protocol=${data.protocol}`);
        for (const r of (data.readings || [])) {
          await persistReading(r);
          await checkAnomalies(r);
        }
        break;

      case 'VOLTAGE_AC':
        console.log(`[WS] ZMPT Vrms=${data.vrms} V`);
        await checkVoltageAlert(data);
        break;

      case 'STATUS':
        console.log(`[WS] STATUS  scanning=${data.scanning}  vrms=${data.vrms_ac}V  rssi=${data.rssi}dBm  uptime=${data.uptime_s}s`);
        break;

      default:
        break;
    }
  } catch (err) {
    console.error('[WS] handleEspMessage error:', err.message);
  }
}

// ── Persist a single reading to SQLite ───────────────────────
async function persistReading(r) {
  if (r.resistivity === undefined) return;
  try {
    await saveReading({
      device_id:    r.device_id    || 'ERT-001',
      elec_a:       r.elec_a,
      elec_b:       r.elec_b,
      elec_m:       r.elec_m       ?? r.elec_a,
      elec_n:       r.elec_n       ?? r.elec_b,
      voltage_mV:   r.voltage_mV,
      current_mA:   r.current_mA,
      resistance:   r.resistance,
      resistivity:  r.resistivity,
      protocol:     r.protocol     || 'Wenner',
      timestamp_ms: r.timestamp_ms || Date.now(),
    });
  } catch (err) {
    console.error('[DB] saveReading failed:', err.message);
  }
}

// ── Anomaly detection & alert broadcasting ───────────────────
async function checkAnomalies(r) {
  const rho = r.resistivity;
  if (!rho || rho === 0) return;

  let alert = null;

  if (rho < ALERT_CRITICAL) {
    alert = {
      type:     'ANOMALY',
      severity: 'CRITICAL',
      kind:     'LOW_RESISTIVITY',
      rho,
      elec_a:   r.elec_a,
      elec_b:   r.elec_b,
      message:  `CRITICAL: ρ=${rho.toFixed(1)} Ω·m — severe moisture / landslide risk`,
      ts:       Date.now(),
    };
  } else if (rho < ALERT_LOW) {
    alert = {
      type:     'ANOMALY',
      severity: 'HIGH',
      kind:     'LOW_RESISTIVITY',
      rho,
      elec_a:   r.elec_a,
      elec_b:   r.elec_b,
      message:  `WARNING: ρ=${rho.toFixed(1)} Ω·m — elevated moisture zone`,
      ts:       Date.now(),
    };
  } else if (rho > ALERT_HIGH) {
    alert = {
      type:     'ANOMALY',
      severity: 'LOW',
      kind:     'HIGH_RESISTIVITY',
      rho,
      elec_a:   r.elec_a,
      elec_b:   r.elec_b,
      message:  `INFO: ρ=${rho.toFixed(1)} Ω·m — possible void or dry layer`,
      ts:       Date.now(),
    };
  }

  if (alert) {
    broadcast(alert);
    try { await saveAlert(alert); } catch (_) {}
  }
}

// ── ZMPT voltage alert ────────────────────────────────────────
async function checkVoltageAlert(data) {
  const v = data.vrms;
  if (v < ZMPT_MIN || v > ZMPT_MAX) {
    const alert = {
      type:     'VOLTAGE_ALERT',
      severity: 'MEDIUM',
      vrms:     v,
      message:  `AC voltage out of range: ${v.toFixed(1)} V (expected ${ZMPT_MIN}–${ZMPT_MAX} V)`,
      ts:       Date.now(),
    };
    broadcast(alert);
    try { await saveAlert(alert); } catch (_) {}
  }
}

// ── Broadcast to all dashboard clients (not back to ESP32) ───
function broadcastToDashboards(payload, exclude = null) {
  if (!wss) return;
  const msg = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client !== exclude && client !== espSocket && client.readyState === 1) {
      client.send(msg);
    }
  });
}

// ── Broadcast to ALL clients including dashboards ─────────────
function broadcast(payload) {
  if (!wss) return;
  const msg = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(msg);
  });
}

// ── Send a command specifically to the ESP32 ─────────────────
function sendToEsp(payload) {
  if (!espSocket || espSocket.readyState !== 1) {
    console.warn('[WS] ESP32 not connected — cannot send command');
    return false;
  }
  espSocket.send(JSON.stringify(payload));
  return true;
}

module.exports = { initWebSocket, broadcast, sendToEsp };