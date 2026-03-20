# API Reference — ERT Dashboard Backend

Base URL: `http://<server>:3001`

---

## Authentication

The `/api/sensor` endpoint requires an `X-Device-Key` header matching the `DEVICE_KEY` env variable.
All other endpoints are open (add your own auth middleware for production deployments).

---

## Sensor Data

### POST /api/sensor
Receive a full scan from the ESP device.

**Headers:** `X-Device-Key: <key>`

**Body:**
```json
{
  "device_id": "ERT-001",
  "timestamp": 1700000000000,
  "scan_count": 28,
  "readings": [
    {
      "elec_a": 0,
      "elec_b": 1,
      "voltage": 0.0248,
      "current": 0.0501,
      "resistivity": 312.4
    }
  ]
}
```

**Response:**
```json
{ "ok": true, "inserted": 28, "alerts": 2 }
```

---

## Readings

### GET /api/readings
Fetch stored readings.

**Query params:**
- `device` — device ID (default: ERT-001)
- `limit` — max rows (default: 500)
- `from` — start timestamp ms
- `to` — end timestamp ms

**Response:**
```json
{ "ok": true, "count": 28, "readings": [...] }
```

### GET /api/readings/latest
Most recent single reading for a device.

### GET /api/readings/grid
All readings for a specific scan window (±5s of `scan_ts`).

**Query params:** `device`, `scan_ts`

### GET /api/readings/stats
Min/max/avg/count statistics for a device.

---

## Control

### POST /api/control
Send a command to the ESP device.

**Body:**
```json
{ "device_id": "ERT-001", "command": "START" }
```

Valid commands: `START`, `STOP`, `MANUAL`, `AUTO`, `STATUS`, `PAIR <a> <b>`

### GET /api/control/pending
Polled by the ESP to consume the next pending command.

**Query:** `?device=ERT-001`

**Response:**
```json
{ "command": "START" }
```

### GET /api/control/log
Command history for a device.

---

## Alerts

### GET /api/alerts
Fetch alerts. Optional `?unread=true` to filter.

### POST /api/alerts/:id/read
Mark an alert as read.

### GET /api/alerts/thresholds
Get alert thresholds for a device.

### POST /api/alerts/thresholds
Set alert thresholds.

**Body:**
```json
{ "device_id": "ERT-001", "low_threshold": 10.0, "high_threshold": 5000.0 }
```

---

## WebSocket

Connect to `ws://<server>:3001/ws`

**Messages from server:**

```json
{ "type": "SCAN_UPDATE",   "device_id": "ERT-001", "readings": [...], "alerts": [...] }
{ "type": "COMMAND_SENT",  "device_id": "ERT-001", "command": "START" }
{ "type": "CONNECTED",     "ts": 1700000000000 }
```
