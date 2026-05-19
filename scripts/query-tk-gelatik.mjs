import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  }
  const saDir = join(root, 'service-account');
  if (!existsSync(saDir)) return null;
  const files = readdirSync(saDir).filter(f => f.endsWith('.json'));
  if (files.length === 0) return null;
  return JSON.parse(readFileSync(join(saDir, files[0]), 'utf-8'));
}

const sa = loadServiceAccount();
if (!sa) { console.error('Service account not found'); process.exit(1); }

const app = !getApps().length ? initializeApp({ credential: cert(sa) }) : getApps()[0];
const db = getFirestore(app);

async function main() {
  // Use limit to avoid quota issues
  const snap = await db.collection('employees').where('sekolah', '==', 'TK GELATIK').limit(20).get();
  console.log(`Found ${snap.size} records for TK GELATIK in Firestore:\n`);
  
  const records = [];
  snap.forEach(doc => {
    const d = doc.data();
    records.push({
      docId: doc.id,
      nik: d.nik || '-',
      nama: d.nama || '-',
      jk: d.jk || '-',
      jenis_ptk: d.jenis_ptk || '-',
      tugas_tambahan: d.tugas_tambahan || '-',
    });
  });

  records.sort((a, b) => a.nik.localeCompare(b.nik));

  console.log('No | Doc ID (truncated)     | NIK              | Nama                    | JK | Jenis PTK              | Tugas Tambahan');
  console.log('---|------------------------|------------------|-------------------------|----|------------------------|----------------');
  records.forEach((r, i) => {
    console.log(`${String(i + 1).padStart(2)} | ${r.docId.substring(0, 20).padEnd(20)} | ${r.nik.padEnd(16)} | ${r.nama.padEnd(23)} | ${r.jk} | ${r.jenis_ptk.padEnd(22)} | ${r.tugas_tambahan}`);
  });

  const nikCounts = {};
  records.forEach(r => {
    nikCounts[r.nik] = (nikCounts[r.nik] || 0) + 1;
  });
  const dupes = Object.entries(nikCounts).filter(([_, c]) => c > 1);
  if (dupes.length > 0) {
    console.log('\n⚠ Duplicate NIKs found:');
    dupes.forEach(([nik, count]) => console.log(`  ${nik}: ${count} records`));
  }
}

main().catch(e => { console.error(e); process.exit(1); });
