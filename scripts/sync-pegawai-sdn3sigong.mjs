import { readFileSync, readdirSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

const SA_DIR = new URL('../service-account/', import.meta.url);
const SA_FILES = readdirSync(SA_DIR).filter(f => f.endsWith('.json'));
const sa = JSON.parse(readFileSync(new URL(SA_FILES[0], SA_DIR), 'utf-8'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id });

const db = admin.firestore();
const data = JSON.parse(readFileSync(new URL('../src/data/data-pegawai.json', import.meta.url), 'utf-8'));
const newPegawai = data.filter(p => p.sekolah === 'SD NEGERI 3 SIGONG');
console.log(`Syncing ${newPegawai.length} pegawai...`);

let ok = 0, err = 0;
for (const p of newPegawai) {
  try {
    await db.collection('employees').doc(p.nik).set({ ...p, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    console.log(`  OK: ${p.nama}`);
    ok++;
  } catch (e) { console.error(`  ERR: ${p.nama}: ${e.message}`); err++; }
}
console.log(`\nDone. Synced: ${ok}, Errors: ${err}`);
process.exit(err ? 1 : 0);
