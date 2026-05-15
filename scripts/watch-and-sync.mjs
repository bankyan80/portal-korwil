import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync, readdirSync, watchFile } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const JSON_PATH = join(root, 'src', 'data', 'data-siswa.json');

const saDir = join(root, 'service-account');
if (!existsSync(saDir)) { console.error('Service account not found'); process.exit(1); }
const files = readdirSync(saDir).filter(f => f.endsWith('.json'));
if (files.length === 0) { console.error('No service account JSON'); process.exit(1); }
const sa = JSON.parse(readFileSync(join(saDir, files[0]), 'utf-8'));

const app = initializeApp({ credential: cert(sa) });
const db = getFirestore(app);

async function syncToFirestore() {
  const raw = readFileSync(JSON_PATH, 'utf-8');
  const allSiswa = JSON.parse(raw);
  const valid = allSiswa.filter(s => s.nik && s.nik.trim());
  const skipped = allSiswa.length - valid.length;

  console.log(`[${new Date().toLocaleTimeString()}] Syncing ${valid.length} siswa${skipped ? ` (${skipped} skipped)` : ''}...`);

  let committed = 0;
  const collection = db.collection('siswa');

  for (let i = 0; i < valid.length; i += 500) {
    const batch = db.batch();
    for (const siswa of valid.slice(i, i + 500)) {
      batch.set(collection.doc(siswa.nik), {
        ...siswa,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    await batch.commit();
    committed += Math.min(500, valid.length - i);
  }

  console.log(`  ✓ ${committed} siswa synced to Firestore`);
}

console.log(`Watching ${JSON_PATH} for changes...`);
watchFile(JSON_PATH, { interval: 1000 }, async (curr, prev) => {
  if (curr.mtimeMs !== prev.mtimeMs) {
    try {
      await syncToFirestore();
    } catch (err) {
      console.error('  ✗ Sync failed:', err.message);
    }
  }
});
