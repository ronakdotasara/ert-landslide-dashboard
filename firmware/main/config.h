#pragma once

// ── WiFi ──────────────────────────────────────────────────────────────────
#define WIFI_SSID        "YOUR_WIFI_SSID"
#define WIFI_PASSWORD    "YOUR_WIFI_PASSWORD"

// ── Server ────────────────────────────────────────────────────────────────
#define SERVER_URL       "http://192.168.1.100:3001"   // backend IP:port
#define DEVICE_ID        "ERT-001"
#define DEVICE_KEY       "your-secret-device-key"

// ── Hardware ──────────────────────────────────────────────────────────────
#define NUM_ELECTRODES       32
#define MAX_ELECTRODE_PAIRS  496     // C(32,2)
#define SCAN_INTERVAL_MS     30000   // 30 seconds between auto-scans
#define STABILIZE_DELAY_MS   50      // ms after electrode switch before reading

// ── ADC / Measurement ─────────────────────────────────────────────────────
#define VREF                 1.1f    // Internal reference voltage
#define OVERSAMPLING         16      // Samples averaged per reading
#define VOLTAGE_DIVIDER_RATIO 10.0f  // Op-amp gain factor
#define SHUNT_RESISTANCE_OHM  10.0f  // Current sense shunt (Ohms)
