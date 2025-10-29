import dotenv from 'dotenv';
import path from 'path';
import { initDB } from '../db';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function run() {
  console.log('🔎 Starting media folder scan...');
  const db = initDB();

  try {
    const { scanMediaFolder } = await import('../services/scanner');
    await scanMediaFolder(db);
    console.log('✅ Media scan completed successfully.');
  } catch (err) {
    console.error('❌ Media scan failed:', err);
  } finally {
    db.close();
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('❌ Scan script crashed:', err);
  process.exit(1);
});
