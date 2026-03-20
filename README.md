# ERT Landslide Monitoring Dashboard

Low-cost Electrical Resistivity Tomography system for real-time landslide monitoring.
Arduino Mega 2560 + 32 electrodes + React web dashboard.

**Total hardware cost: ₹11,360**

---

## Project Structure

```
ert-landslide-dashboard/
├── firmware/          Arduino / ESP8266 code
│   ├── main/          Main sketch + headers
│   └── calibration/   Calibration sketches
├── backend/           Node.js API server
│   ├── api/           Express routes + WebSocket
│   ├── db/            SQLite schema + models
│   └── processing/    Python ERT inversion
├── frontend/          React dashboard (Vite)
│   └── src/
│       ├── pages/     Dashboard, Map, Electrodes, Control, Alerts, Export, Settings
│       ├── components/Charts, Heatmap, Table, Controls
│       ├── hooks/     WebSocket, SensorData, DeviceControl
│       └── store/     Sensor + Alert context stores
├── data/              Raw CSV dumps, processed grids, samples
└── docs/              Schematics, API reference, guides
```

---

## Quick Start

### 1. Backend

```bash
cd backend
cp ../.env.example .env        # edit DEVICE_KEY
npm install
npm run seed                   # optional: load demo data
npm start                      # starts on port 3001
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                    # opens on http://localhost:3000
```

### 3. Firmware

1. Open `firmware/main/ert_main.ino` in Arduino IDE
2. Edit `firmware/main/config.h`:
   - Set `WIFI_SSID` and `WIFI_PASSWORD`
   - Set `SERVER_URL` to your backend IP (e.g. `http://192.168.1.100:3001`)
   - Set `DEVICE_KEY` to match your `.env`
3. Install libraries: `ESP8266WiFi`, `ESP8266HTTPClient`, `ArduinoJson`, `LiquidCrystal`
4. Flash to Arduino Mega 2560 + ESP8266

### 4. Docker (production)

```bash
cp .env.example .env
docker-compose up -d
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
```

---

## Hardware

| Component             | Specification              | Qty | Cost (₹) |
|-----------------------|---------------------------|-----|----------|
| Arduino Mega 2560     | Microcontroller            | 1   | 800      |
| ADG2188               | 16-ch analog multiplexer   | 2   | 800      |
| LM317/LM337           | Current source IC          | 2   | 300      |
| Stainless rods        | 6mm × 150mm electrodes     | 32  | 960      |
| SD card module        | Data logging               | 1   | 300      |
| LCD 16×2              | Real-time display          | 1   | 200      |
| Power supply 12V      | Switching supply           | 1   | 500      |
| PCB + misc            | Fabrication + components   | —   | 1600     |
| **Total**             |                            |     | **11,360** |

---

## API Reference

| Method | Endpoint                      | Description                        |
|--------|-------------------------------|------------------------------------|
| POST   | `/api/sensor`                 | ESP posts scan data                |
| GET    | `/api/readings`               | Fetch stored readings              |
| GET    | `/api/readings/latest`        | Most recent reading                |
| GET    | `/api/readings/grid`          | 2D grid for a scan timestamp       |
| GET    | `/api/readings/stats`         | Min/max/avg statistics             |
| POST   | `/api/control`                | Send command to ESP                |
| GET    | `/api/control/pending`        | ESP polls for pending commands     |
| GET    | `/api/alerts`                 | Fetch anomaly alerts               |
| POST   | `/api/alerts/thresholds`      | Set alert thresholds               |

### ESP Payload Format

```json
POST /api/sensor
Headers: X-Device-Key: your-secret-device-key
{
  "device_id": "ERT-001",
  "timestamp": 1234567890,
  "scan_count": 28,
  "readings": [
    { "elec_a": 0, "elec_b": 1, "voltage": 0.025, "current": 0.05, "resistivity": 312.4 }
  ]
}
```

---

## Python Processing

```bash
pip install -r requirements.txt

# Run ERT inversion on raw readings
python backend/processing/inversion.py data/samples/demo_readings.json data/processed/output.json

# Build 2D pseudo-section grid
python backend/processing/grid_builder.py data/samples/demo_readings.json data/processed/grid.json

# Detect anomalies
python backend/processing/anomaly_detect.py data/samples/demo_readings.json data/processed/anomalies.json

# Export to CSV
python backend/processing/export.py data/samples/demo_readings.json csv data/processed/readings.csv
```

---

## Dashboard Pages

| Page             | Description                                          |
|------------------|------------------------------------------------------|
| Dashboard        | Live chart + heatmap + scan control + readings table |
| Resistivity Map  | 2D pseudo-section colour map of the electrode array  |
| Electrode Grid   | 32-electrode visual with per-electrode status        |
| Manual Control   | Send START/STOP/PAIR commands to the ESP device      |
| Alerts           | Anomaly log with configurable thresholds             |
| Data Export      | Download CSV or JSON for offline processing          |
| Settings         | Device ID, server URL, scan interval                 |

---

## References

1. Loke & Barker (1996) — Rapid least-squares inversion of apparent resistivity pseudosections
2. Jongmans & Garambois (2007) — Geophysical investigation of landslides
3. Chambers et al. (2014) — 3D ERT monitoring of subsurface storm runoff
