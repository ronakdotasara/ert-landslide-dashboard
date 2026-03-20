// Generates realistic synthetic ERT readings for demo mode.
// No backend required — all data is generated in the browser.

const NUM_ELECTRODES = 16;
const SPACING = 0.5; // metres

function gaussianRandom(mean, std) {
  // Box-Muller
  const u = 1 - Math.random();
  const v = Math.random();
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Base resistivity model: low-rho moisture zone centred at electrode 7-9
function trueResistivity(elecA, elecB) {
  const mid = (elecA + elecB) / 2;
  const sep = Math.abs(elecB - elecA);
  const depth = sep * SPACING * 0.17;

  // Moisture zone (low ρ) at x=3.5–4.5 m, depth 0–1 m
  const dx = mid * SPACING - 4.0;
  const dz = depth - 0.4;
  const moisture = Math.exp(-(dx * dx / 0.8 + dz * dz / 0.3));

  // Background resistivity ~300 Ω·m, moisture zone drops to ~25 Ω·m
  const base = 300 - 275 * moisture;
  return Math.max(8, gaussianRandom(base, base * 0.08));
}

export function generateDemoReadings(scanIndex = 0) {
  const ts = Date.now() - (10 - scanIndex) * 30000;
  const readings = [];
  // Simulate worsening moisture over scans 7-10
  const moistureFactor = scanIndex >= 7 ? 1 + (scanIndex - 6) * 0.15 : 1.0;

  for (let a = 0; a < NUM_ELECTRODES - 1; a++) {
    for (let b = a + 1; b < NUM_ELECTRODES; b++) {
      if (b - a > 8) continue; // skip very long spacings for realism
      const rho = trueResistivity(a, b) / moistureFactor;
      const current = gaussianRandom(0.05, 0.002);
      const voltage = rho * current / (2 * Math.PI * Math.abs(b - a) * SPACING);
      readings.push({
        id: readings.length + 1,
        device_id: 'DEMO',
        timestamp_ms: ts,
        elec_a: a,
        elec_b: b,
        voltage: +voltage.toFixed(6),
        current: +current.toFixed(6),
        resistivity: +rho.toFixed(2),
      });
    }
  }
  return readings;
}

export function generateAllDemoData() {
  const allReadings = [];
  for (let i = 0; i < 10; i++) {
    allReadings.push(...generateDemoReadings(i));
  }
  return allReadings;
}

export function generateDemoStats(readings) {
  if (!readings.length) return null;
  const rhos = readings.map(r => r.resistivity);
  return {
    total_readings: readings.length,
    min_rho:  Math.min(...rhos),
    max_rho:  Math.max(...rhos),
    avg_rho:  rhos.reduce((s, v) => s + v, 0) / rhos.length,
    first_ts: Math.min(...readings.map(r => r.timestamp_ms)),
    last_ts:  Math.max(...readings.map(r => r.timestamp_ms)),
  };
}

export function generateDemoAlerts(readings) {
  return readings
    .filter(r => r.resistivity < 30)
    .slice(0, 5)
    .map((r, i) => ({
      id: i + 1,
      device_id: 'DEMO',
      elec_a: r.elec_a,
      elec_b: r.elec_b,
      value: r.resistivity,
      type: 'LOW_RESISTIVITY',
      severity: r.resistivity < 15 ? 'HIGH' : 'MEDIUM',
      timestamp_ms: r.timestamp_ms,
      read: 0,
    }));
}
