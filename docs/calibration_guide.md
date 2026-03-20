# Calibration Guide

Follow these steps before each field deployment.

## 1. Current Source Calibration

1. Flash `firmware/calibration/calibrate_current.ino` to the Arduino
2. Connect a precision ammeter (4½-digit minimum) in series with the output terminals
3. Open Serial Monitor at 115200 baud
4. Record readings every 2 seconds for 2 minutes
5. Compare `calculated_mA` column with ammeter reading
6. Adjust `SHUNT_RESISTANCE_OHM` in `config.h` until they match within 0.5%

**Target:** Injected current stable at 50 ± 1 mA

---

## 2. Voltage Measurement Calibration

1. Flash `firmware/calibration/calibrate_voltage.ino`
2. Apply known voltages (0.1 V, 0.5 V, 1.0 V) from a bench supply
3. Cross-check `measured_V` column against a calibrated DMM
4. Adjust `VOLTAGE_DIVIDER_RATIO` in `config.h` if readings differ >1%

**Target:** Voltage accuracy ±0.5% across 0–1 V range

---

## 3. Electrode Contact Resistance Test

1. Insert all 32 electrodes into saturated sand or target soil
2. Flash `firmware/calibration/contact_resistance_test.ino`
3. Serial Monitor shows each electrode's contact resistance and a status: `OK / MARGINAL / HIGH`
4. Investigate any `HIGH` electrode (>2 kΩ): clean the rod, re-wet the soil, drive deeper

**Targets:**
- OK:       < 500 Ω
- Marginal: 500 Ω – 2 kΩ (acceptable for dry sites)
- High:     > 2 kΩ (replace or reposition electrode)

---

## 4. System Integration Test

1. Flash `firmware/main/ert_main.ino` with correct `config.h`
2. Start backend: `npm start`
3. Open dashboard
4. Send `START` via Manual Control
5. Verify data appears in Live Chart and Resistivity Table within 30 seconds

---

## 5. Field Baseline Scan

Before monitoring, record a **dry-season baseline** scan:
- Run a full 32-electrode auto scan
- Export data: `python processing/export.py readings.json csv baseline.csv`
- Label the file with date and site location
- Store in `data/calibration/`

Use this baseline to detect relative changes in resistivity over time, which is more reliable than absolute values.
