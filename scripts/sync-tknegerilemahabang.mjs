import { readFileSync, readdirSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');
const SA_DIR = new URL('../service-account/', import.meta.url);
const sa = JSON.parse(readFileSync(new URL(readdirSync(SA_DIR).filter(f => f.endsWith('.json'))[0], SA_DIR), 'utf-8'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id });

const data = JSON.parse(readFileSync(new URL('../src/data/data-pegawai.json', import.meta.url), 'utf-8'));
const list = data.filter(p => p.sekolah === 'TK NEGERI LEMAHABANG');
console.log(`Syncing ${list.length}...`);

for (const p of list) {
  await admin.firestore().collection('employees').doc(p.nik).set({ ...p, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  console.log(`  OK: ${p.nama}`);
}
console.log('Done.');
