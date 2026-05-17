import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const saDir = join(root, 'service-account');
if (!existsSync(saDir)) process.exit(1);
const files = readdirSync(saDir).filter(f => f.endsWith('.json'));
if (files.length === 0) process.exit(1);
const sa = JSON.parse(readFileSync(join(saDir, files[0]), 'utf-8'));

const app = initializeApp({ credential: cert(sa) });
const db = getFirestore(app);

function makeSchoolId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

async function sync() {
  const raw = readFileSync(join(root, 'src', 'data', 'data-pegawai-tk.json'), 'utf-8');
  const allPegawai = JSON.parse(raw);
  const tkAqso = allPegawai.filter(p => p.sekolah === 'TK AL-AQSO');

  console.log(`TK AL-AQSO records to sync: ${tkAqso.length}`);
  tkAqso.forEach(p => console.log(`  ${p.nama} (${p.nik})`));

  const collection = db.collection('employees');
  let committed = 0;

  for (let i = 0; i < tkAqso.length; i += 500) {
    const batch = db.batch();
    const chunk = tkAqso.slice(i, i + 500);
    for (const pegawai of chunk) {
      const docId = (pegawai.nik && pegawai.nik.trim()) ? pegawai.nik : (pegawai.nuptk || `emp-${committed}`);
      const docRef = collection.doc(docId);
      batch.set(docRef, {
        id: docId,
        nama: pegawai.nama,
        nik: pegawai.nik || '',
        nuptk: pegawai.nuptk || '',
        nip: pegawai.nip || '',
        jk: pegawai.jk || '',
        tanggal_lahir: pegawai.tanggal_lahir || '',
        jenis_ptk: pegawai.jenis_ptk || '',
        status_kepegawaian: pegawai.status_kepegawaian || '',
        tugas_tambahan: pegawai.tugas_tambahan || '',
        sertifikasi: pegawai.sertifikasi || '',
        sekolah: pegawai.sekolah || '',
        schoolId: makeSchoolId(pegawai.sekolah || ''),
        createdAt: Date.now(),
      });
    }
    await batch.commit();
    committed += chunk.length;
    console.log(`Progress: ${committed}/${tkAqso.length}`);
  }

  console.log(`\nBerhasil sync ${committed} pegawai TK AL-AQSO ke Firestore!`);
  process.exit(0);
}

sync().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});