import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function run() {
  const { initDB } = await import('../src/db');
  const { scanMediaFolder } = await import('../src/services/scanner');

  const db = initDB();
  await scanMediaFolder(db);
  console.log('Scan completed');
  process.exit(0);
}

run().catch((err) => {
  console.error('Scan failed:', err);
  process.exit(1);
});
