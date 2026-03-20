# Electrode Array Protocol

## Array Configuration

This system uses 32 stainless steel electrodes (6mm × 150mm rods) in a linear array.

### Electrode Spacing
- **Default spacing (a):** 0.5 m between adjacent electrodes
- **Total array length:** 32 × 0.5 = 15.5 m
- **Maximum investigation depth:** ~3–4 m (Wenner array ≈ 0.17 × array length)

---

## Measurement Configurations

### Wenner Array (default)
```
C1 ... P1 ... P2 ... C2
|--a--|--a--|--a--|
```
- C1, C2 = current electrodes
- P1, P2 = voltage electrodes
- Geometric factor: k = 2πa
- Good signal-to-noise ratio, ideal for horizontal layering

### Dipole-Dipole (alternative)
```
C1 C2 ... P1 P2
|--a--|--na--|--a--|
```
- Better for vertical structures and lateral variations
- Lower signal strength; requires lower-noise amplification

---

## Field Deployment Steps

1. **Layout:** Mark electrode positions with pegs every 0.5 m along the slope
2. **Insertion:** Drive electrodes vertically to at least 100 mm depth
3. **Wiring:** Connect multiconductor cable from each electrode to the multiplexer board
4. **Numbering:** Label each electrode E0–E31 from left to right (upslope to downslope)
5. **Contact test:** Run `contact_resistance_test.ino` before starting a scan
6. **Baseline:** Record a dry-season scan as reference

---

## Data Collection Schedule

| Condition           | Recommended Interval |
|---------------------|----------------------|
| Dry season          | Once per week        |
| Pre-monsoon         | Every 24 hours       |
| During heavy rain   | Every 30 minutes     |
| After rainfall event| Every 2 hours        |

---

## Interpreting Results

| Resistivity Range (Ω·m) | Interpretation                    |
|--------------------------|-----------------------------------|
| < 30                     | Saturated zone — HIGH RISK        |
| 30 – 100                 | Moist soil — MONITOR closely      |
| 100 – 500                | Normal unsaturated soil           |
| 500 – 2000               | Dry soil / compacted material     |
| > 2000                   | Rock / gravel / resistive layer   |

### Warning Signs
- Resistivity dropping below 50 Ω·m in zones that were previously >200 Ω·m
- Rapid change (>40% drop) between consecutive scans
- Low-resistivity zone expanding laterally over multiple scans

---

## Safety

- Maximum injected current: 100 mA (set by LM317 circuit)
- Keep personnel clear of electrodes during active measurement
- Disconnect power before repositioning any electrode
- Use insulated gloves when handling electrodes in wet conditions
- Ground all equipment chassis to a dedicated ground rod
