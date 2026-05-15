import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Load service account
const saDir = join(root, 'service-account');
if (!existsSync(saDir)) {
  console.error('Service account directory not found');
  process.exit(1);
}
const files = readdirSync(saDir).filter(f => f.endsWith('.json'));
if (files.length === 0) {
  console.error('No service account JSON found');
  process.exit(1);
}
const sa = JSON.parse(readFileSync(join(saDir, files[0]), 'utf-8'));

const app = initializeApp({ credential: cert(sa) });
const db = getFirestore(app);

// Read siswa data
const raw = readFileSync(join(root, 'src', 'data', 'data-siswa.json'), 'utf-8');
const allSiswa = JSON.parse(raw);

const validSiswa = allSiswa.filter(s => s.nik && s.nik.trim());
const skipped = allSiswa.length - validSiswa.length;
if (skipped) {
  console.log(`Skipped ${skipped} siswa with empty NIK:`);
  allSiswa.filter(s => !s.nik || !s.nik.trim()).forEach(s => console.log(`  - ${s.nama} (${s.sekolah})`));
}

console.log(`Syncing ${validSiswa.length} siswa to Firestore...`);

const collection = db.collection('students');
let committed = 0;

for (let i = 0; i < validSiswa.length; i += 500) {
  const batch = db.batch();
  const chunk = validSiswa.slice(i, i + 500);

  for (const siswa of chunk) {
    const docRef = collection.doc(siswa.nik);
    batch.set(docRef, {
      ...siswa,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  await batch.commit();
  committed += chunk.length;
  console.log(`  Progress: ${committed}/${validSiswa.length}`);
}

console.log(`Successfully synced ${committed} siswa to Firestore`);
process.exit(0);
