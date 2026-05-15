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

const app = initializeApp({ credential: cert(sa) }, 'siswa-fix');
const db = getFirestore(app);

const raw = readFileSync(join(root, 'src', 'data', 'data-siswa.json'), 'utf-8');
const allSiswa = JSON.parse(raw);
console.log('Total siswa:', allSiswa.length);

function makeSchoolId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function syncAll() {
  const collection = db.collection('students');
  let committed = 0;

  for (let i = 0; i < allSiswa.length; i += 500) {
    const batch = db.batch();
    const chunk = allSiswa.slice(i, i + 500);

    for (const siswa of chunk) {
      if (!siswa.nik || !siswa.nik.trim()) continue;
      const docRef = collection.doc(siswa.nik.trim());
      batch.set(docRef, {
        id: siswa.nik.trim(),
        nama: siswa.nama || '',
        nik: siswa.nik || '',
        nisn: siswa.nisn || '',
        jk: siswa.jk || '',
        sekolah: siswa.sekolah || '',
        schoolId: makeSchoolId(siswa.sekolah || ''),
        tanggal_lahir: siswa.tanggal_lahir || '',
        jenjang: (siswa.jenjang || 'SD').toUpperCase(),
        kelas: siswa.kelas || '',
        desa: (siswa.desa || '').toUpperCase(),
        status: 'aktif',
        createdAt: Date.now(),
      });
    }

    await batch.commit();
    committed += chunk.length;
    console.log(`Progress: ${committed}/${allSiswa.length}`);
  }

  console.log(`\nSuccessfully synced ${committed} siswa to Firestore with correct fields!`);
  process.exit(0);
}

syncAll().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
