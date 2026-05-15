import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const saDir = join(root, 'service-account');
const files = readdirSync(saDir).filter(f => f.endsWith('.json'));
const sa = JSON.parse(readFileSync(join(saDir, files[0]), 'utf-8'));
const app = initializeApp({ credential: cert(sa) });
const db = getFirestore(app);

const raw = readFileSync(join(root, 'src/data/data-siswa.json'), 'utf-8');
const allSiswa = JSON.parse(raw);

// Filter Cipeujeuh Kulon
const target = allSiswa.filter(s => 
  s.sekolah && (
    s.sekolah === 'NEGERI 1 CIPEUJEUH KULON KECAMATAN LEMAHABANG' || 
    s.sekolah === 'NEGERI 2 CIPEUJEUH KULON KECAMATAN LEMAHABANG'
  )
);

console.log(`Total siswa to sync: ${target.length}`);

function makeSchoolId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

async function sync() {
  const collection = db.collection('students');
  let committed = 0;
  
  for (let i = 0; i < target.length; i += 500) {
    const batch = db.batch();
    const chunk = target.slice(i, i + 500);
    
    for (const s of chunk) {
      const docRef = collection.doc(s.nik);
      batch.set(docRef, {
        nik: s.nik,
        nama: s.nama,
        jk: s.jk || '',
        nisn: s.nisn || '',
        tempat_lahir: s.tempat_lahir || '',
        tanggal_lahir: s.tanggal_lahir || '',
        sekolah: s.sekolah,
        jenjang: s.jenjang || 'SD',
        kelas: s.kelas ? Number(s.kelas) : 0,
        desa: s.desa || '',
        kecamatan: s.kecamatan || '',
        agama: s.agama || '',
        alamat: s.alamat || '',
        rt: s.rt || '',
        rw: s.rw || '',
        dusun: s.dusun || '',
        no_kk: s.no_kk || '',
        layak_pip: s.layak_pip || '',
        schoolId: makeSchoolId(s.sekolah),
        createdAt: Date.now(),
      });
    }
    
    await batch.commit();
    committed += chunk.length;
    console.log(`Progress: ${committed}/${target.length}`);
  }
  
  console.log(`\n✅ Successfully synced ${committed} siswa to Firestore!`);
  process.exit(0);
}

sync().catch(e => { console.error('Failed:', e); process.exit(1); });