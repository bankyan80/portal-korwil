import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

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

async function compare() {
  // Load ALL local data files
  const localFiles = [
    { path: join(root, 'src', 'data', 'data-pegawai.json'), label: 'SD' },
    { path: join(root, 'src', 'data', 'data-pegawai-tk.json'), label: 'TK' },
    { path: join(root, 'src', 'data', 'tk-gelatik-pegawai.json'), label: 'TK GELATIK' },
  ];

  const allLocal = [];
  for (const f of localFiles) {
    if (existsSync(f.path)) {
      const data = JSON.parse(readFileSync(f.path, 'utf-8'));
      console.log(`${f.label}: ${f.path.split('/').pop().split('\\').pop()} = ${data.length} records`);
      allLocal.push(...data.map(p => ({ ...p, _source: f.label })));
    }
  }

  // Deduplicate local by NIK, with fallback to nuptk or nama
  const localByNik = new Map();
  const localNiks = new Set(); // track all local NIKs for accurate "hanya di lokal" count
  for (const p of allLocal) {
    const nik = (p.nik || '').trim();
    const key = nik || (p.nuptk || '').trim() || `nama:${(p.nama || '').trim().toLowerCase()}`;
    if (key && !localByNik.has(key)) {
      localByNik.set(key, p);
      if (nik) localNiks.add(nik);
    }
  }
  console.log(`\nTotal local (all files, dedup by key): ${localByNik.size}`);

  // Also index by nama
  const localByNama = new Map();
  for (const p of allLocal) {
    const n = p.nama?.toLowerCase().trim();
    if (n) localByNama.set(n, p);
  }

  // Fetch all employees from Firestore
  console.log('\nFetching Firestore employees collection...');
  const snapshot = await db.collection('employees').get();
  const firestoreByNik = new Map();
  snapshot.forEach(doc => {
    const data = { id: doc.id, ...doc.data() };
    const nik = (data.nik || data.id || '').trim();
    if (nik) {
      if (!firestoreByNik.has(nik)) firestoreByNik.set(nik, data);
    }
  });
  console.log(`Firestore employees (unique by NIK): ${firestoreByNik.size}`);

  // Compare
  const inFirestoreOnly = [];
  const matched = [];
  const matchedLocalNiks = new Set(); // track which local NIKs were matched

  for (const [nik, fs] of firestoreByNik) {
    if (localByNik.has(nik)) {
      matched.push({ nik, nama: fs.nama, sekolah: fs.sekolah });
      matchedLocalNiks.add(nik);
    } else {
      const namaNorm = (fs.nama || '').toLowerCase().trim();
      if (localByNama.has(namaNorm)) {
        const local = localByNama.get(namaNorm);
        matched.push({ nik, nama: fs.nama, sekolah: fs.sekolah, note: `matched by name (local NIK: ${local.nik})` });
        if (local.nik) matchedLocalNiks.add(local.nik.trim());
      } else {
        inFirestoreOnly.push({
          nik, nama: fs.nama || '(no name)', nip: fs.nip || '',
          nuptk: fs.nuptk || '', jenis_ptk: fs.jenis_ptk || '',
          status_kepegawaian: fs.status_kepegawaian || '', sekolah: fs.sekolah || '',
        });
      }
    }
  }

  // Report
  const hanyaDiLocal = localNiks.size - matchedLocalNiks.size;
  console.log(`\n========================================`);
  console.log(`HASIL SINKRONISASI DATA PEGAWAI`);
  console.log(`========================================`);
  console.log(`Total local (unique NIK)     : ${localNiks.size}`);
  console.log(`Total Firestore (unique NIK) : ${firestoreByNik.size}`);
  console.log(`Matched                       : ${matched.length}`);
  console.log(`Hanya di Firestore            : ${inFirestoreOnly.length}`);
  console.log(`Hanya di Local                : ${hanyaDiLocal}`);

  // Group inFirestoreOnly by school
  const bySchool = {};
  for (const p of inFirestoreOnly) {
    const s = p.sekolah || '(unknown)';
    if (!bySchool[s]) bySchool[s] = [];
    bySchool[s].push(p);
  }

  if (inFirestoreOnly.length > 0) {
    console.log(`\n--- PEGAWAI DI FIRESTORE TAPI TIDAK ADA DI FILE LOKAL ---`);
    console.log(`(data-pegawai.json, data-pegawai-tk.json, tk-gelatik-pegawai.json)`);
    console.log(`\nBerdasarkan sekolah:`);
    for (const [school, pegawai] of Object.entries(bySchool).sort()) {
      console.log(`\n  ${school}: ${pegawai.length} pegawai`);
      pegawai.forEach((p, i) => {
        console.log(`    ${i+1}. ${p.nama} (NIK: ${p.nik}, NIP: ${p.nip}, NUPTK: ${p.nuptk})`);
        console.log(`       ${p.jenis_ptk} | ${p.status_kepegawaian}`);
      });
    }
  }

  if (hanyaDiLocal > 0) {
    console.log(`\n--- PEGAWAI DI FILE LOKAL TAPI TIDAK ADA DI FIRESTORE ---`);
    for (const p of allLocal) {
      const nik = (p.nik || '').trim();
      if (nik && !matchedLocalNiks.has(nik)) {
        console.log(`  ${p.nama} (NIK: ${p.nik}, Sekolah: ${p.sekolah})`);
      }
    }
  }

  process.exit(0);
}

compare().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});