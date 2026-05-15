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

// Load all pegawai data
const raw = readFileSync(join(root, 'src', 'data', 'data-pegawai.json'), 'utf-8');
const allPegawai = JSON.parse(raw);
console.log('Total pegawai:', allPegawai.length);

// Group by sekolah
const bySchool = {};
for (const p of allPegawai) {
  if (!bySchool[p.sekolah]) bySchool[p.sekolah] = [];
  bySchool[p.sekolah].push(p.nama);
}
const schoolKeys = Object.keys(bySchool).sort();
console.log('\nTotal schools:', schoolKeys.length);
schoolKeys.forEach(s => console.log(`  ${s}: ${bySchool[s].length} pegawai`));

function makeSchoolId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function syncAll() {
  const collection = db.collection('employees');
  let committed = 0;
  
  for (let i = 0; i < allPegawai.length; i += 500) {
    const batch = db.batch();
    const chunk = allPegawai.slice(i, i + 500);
    
    for (const pegawai of chunk) {
      const docId = (pegawai.nik && pegawai.nik.trim()) 
        ? pegawai.nik 
        : (pegawai.nuptk || `emp-${committed}`);
      const docRef = collection.doc(docId);
      
      // Use EXACT field names expected by ManageDataGtk component
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
    console.log(`Progress: ${committed}/${allPegawai.length}`);
  }
  
  console.log(`\n✅ Successfully synced ${committed} pegawai to Firestore with correct fields!`);
  process.exit(0);
}

syncAll().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});