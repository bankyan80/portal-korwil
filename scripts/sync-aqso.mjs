import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const saDir = join(root, 'service-account');
if (!existsSync(saDir)) { console.error('Service account not found'); process.exit(1); }
const files = readdirSync(saDir).filter(f => f.endsWith('.json'));
const sa = JSON.parse(readFileSync(join(saDir, files[0]), 'utf-8'));
const app = initializeApp({ credential: cert(sa) });
const db = getFirestore(app);

const siswa = JSON.parse(readFileSync(join(root, 'src', 'data', 'data-siswa.json'), 'utf-8'));

// Only sync TK AL-AQSO students
const aqso = siswa.filter(s => s.sekolah === 'TK AL-AQSO');
console.log(`Found ${aqso.length} TK AL-AQSO students`);

let ok = 0, fail = 0, skip = 0;
for (const s of aqso) {
  if (!s.nik || !s.nik.trim()) { skip++; continue; }
  try {
    await db.collection('students').doc(s.nik.trim()).set({
      ...s,
      updatedAt: new Date().toISOString(),
    });
    ok++;
    if (ok % 10 === 0) console.log(`  ${ok}/${aqso.length} synced...`);
  } catch (e) {
    fail++;
    console.error(`  FAIL: ${s.nama} (${s.nik}): ${e.message}`);
  }
}

console.log(`\nDone: ${ok} synced, ${skip} skipped (no NIK), ${fail} failed`);
process.exit(0);
