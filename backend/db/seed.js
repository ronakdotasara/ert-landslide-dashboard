/**
 * Seed demo/test data into the database.
 * Run: node db/seed.js
 */
const { initDB, getDB } = require('./models/db');

async function seed() {
  await initDB();
  const db = getDB();

  console.log('[SEED] Generating demo resistivity readings...');
  const now = Date.now();
  const stmt = db.prepare(`
    INSERT INTO readings (device_id, timestamp_ms, elec_a, elec_b, voltage, current, resistivity)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction(() => {
    for (let scan = 0; scan < 10; scan++) {
      const ts = now - (10 - scan) * 30000;
      for (let a = 0; a < 8; a++) {
        for (let b = a + 1; b < 8; b++) {
          // Simulate lower resistivity in center (moisture zone)
          const center = Math.abs(a - 3.5) + Math.abs(b - 3.5);
          const baseRho = 200 + center * 150 + Math.random() * 50;
          const rho = scan > 6 ? baseRho * 0.6 : baseRho; // simulate moisture increasing
          const current = 0.05 + Math.random() * 0.01;
          const voltage = rho * current / (2 * Math.PI * 0.5);
          stmt.run('ERT-001', ts, a, b, voltage, current, rho);
        }
      }
    }
  });

  insertMany();
  console.log('[SEED] Done. Demo data inserted.');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
