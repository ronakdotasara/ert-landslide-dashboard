const { initDB, run } = require('./models/db');

async function seed() {
  await initDB();
  console.log('[SEED] Generating demo resistivity readings...');
  const now = Date.now();
  for (let scan = 0; scan < 10; scan++) {
    const ts = now - (10 - scan) * 30000;
    for (let a = 0; a < 8; a++) {
      for (let b = a + 1; b < 8; b++) {
        const center = Math.abs(a - 3.5) + Math.abs(b - 3.5);
        const baseRho = 200 + center * 150 + Math.random() * 50;
        const rho = scan > 6 ? baseRho * 0.6 : baseRho;
        const current = 0.05 + Math.random() * 0.01;
        const voltage = rho * current / (2 * Math.PI * 0.5);
        await run(
          'INSERT INTO readings (device_id, timestamp_ms, elec_a, elec_b, voltage, current, resistivity) VALUES (?,?,?,?,?,?,?)',
          ['ERT-001', ts, a, b, voltage, current, rho]
        );
      }
    }
  }
  console.log('[SEED] Done.');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
