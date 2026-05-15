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

// Inline school data from src/data/sekolah.ts
const sekolahSD = [
  { nama: 'SD NEGERI 1 ASEM', npsn: '20215216', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Abdurachman Saleh No. 328, Asem', desa: 'ASEM', jenjang: 'SD' },
  { nama: 'SD NEGERI 1 BELAWA', npsn: '20215230', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Cikuya 1, Belawa', desa: 'BELAWA', jenjang: 'SD' },
  { nama: 'SD NEGERI 2 BELAWA', npsn: '20215564', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Inpres Blok A, Belawa', desa: 'BELAWA', jenjang: 'SD' },
  { nama: 'SD NEGERI 1 CIPEUJEUH KULON', npsn: '20215287', status: 'NEGERI', akreditasi: 'B', address: 'Jl. K.H. Hasyim Asyari No. 07, Cipeujeuh Kulon', desa: 'CIPEUJEUH KULON', jenjang: 'SD' },
  { nama: 'SD NEGERI 2 CIPEUJEUH KULON', npsn: '20215381', status: 'NEGERI', akreditasi: 'A', address: 'Jl. KH. Hasyim Asyari No. 500, Cipeujeuh Kulon', desa: 'CIPEUJEUH KULON', jenjang: 'SD' },
  { nama: 'SD NEGERI 1 CIPEUJEUH WETAN', npsn: '20215286', status: 'NEGERI', akreditasi: 'A', address: 'Jl. MT. Haryono No. 62, Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN', jenjang: 'SD' },
  { nama: 'SD NEGERI 2 CIPEUJEUH WETAN', npsn: '20215380', status: 'NEGERI', akreditasi: 'A', address: 'Jl. MT. Haryono No. 3B, Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN', jenjang: 'SD' },
  { nama: 'SD NEGERI 3 CIPEUJEUH WETAN', npsn: '20214479', status: 'NEGERI', akreditasi: 'B', address: 'Jl. KH. Wahid Hasyim No. 66, Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN', jenjang: 'SD' },
  { nama: 'SD NEGERI 1 LEMAHABANG', npsn: '20215162', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Ki Hajar Dewantoro No. 35, Lemahabang', desa: 'LEMAHABANG', jenjang: 'SD' },
  { nama: 'SD NEGERI 2 LEMAHABANG', npsn: '20214656', status: 'NEGERI', akreditasi: 'A', address: 'Jl. R.A. Kartini No. 26, Lemahabang', desa: 'LEMAHABANG', jenjang: 'SD' },
  { nama: 'SD NEGERI 1 LEMAHABANG KULON', npsn: '20215161', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Syech Lemahabang No. 5, Lemahabang Kulon', desa: 'LEMAHABANG KULON', jenjang: 'SD' },
  { nama: 'SD NEGERI 1 LEUWIDINGDING', npsn: '20215164', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Abdurahman Saleh, Leuwidingding', desa: 'LEUWIDINGDING', jenjang: 'SD' },
  { nama: 'SD NEGERI 1 PICUNGPUGUR', npsn: '20246442', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Raya Desa Picungpugur, Picungpugur', desa: 'PICUNGPUGUR', jenjang: 'SD' },
  { nama: 'SD NEGERI 1 SARAJAYA', npsn: '20215517', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Raya Sarajaya No. 63, Sarajaya', desa: 'SARAJAYA', jenjang: 'SD' },
  { nama: 'SD NEGERI 2 SARAJAYA', npsn: '20214726', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Raya Sarajaya Subur No. 1, Sarajaya', desa: 'SARAJAYA', jenjang: 'SD' },
  { nama: 'SD NEGERI 1 SIGONG', npsn: '20215506', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Pelita No. 101, Sigong', desa: 'SIGONG', jenjang: 'SD' },
  { nama: 'SD NEGERI 3 SIGONG', npsn: '20214570', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Raya Sigong, Sigong', desa: 'SIGONG', jenjang: 'SD' },
  { nama: 'SD NEGERI 4 SIGONG', npsn: '20244513', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Cantilan, Sigong', desa: 'SIGONG', jenjang: 'SD' },
  { nama: 'SD NEGERI 1 SINDANGLAUT', npsn: '20215464', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Arief Rahman Hakim No. 24, Sindanglaut', desa: 'SINDANGLAUT', jenjang: 'SD' },
  { nama: 'SD NEGERI 1 TUK KARANGSUWUNG', npsn: '20246445', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Pulo Undrus Ujung, Tuk Karangsuwung', desa: 'TUK KARANGSUWUNG', jenjang: 'SD' },
  { nama: 'SD NEGERI 1 WANGKELANG', npsn: '20215584', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Raya Wangkelang No. 40, Wangkelang', desa: 'WANGKELANG', jenjang: 'SD' },
  { nama: 'SD IT AL IRSYAD AL ISLAMIYYAH', npsn: '20215221', status: 'SWASTA', akreditasi: 'A', address: 'Jl. Syech Lemahabang No. 54, Lemahabang Kulon', desa: 'LEMAHABANG KULON', jenjang: 'SD' },
];
const sekolahTK = [
  { nama: 'TK NEGERI LEMAHABANG', npsn: '20270605', status: 'NEGERI', akreditasi: 'B', address: 'Jl. KH. Wakhid Hasyim, Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN', jenjang: 'TK' },
  { nama: 'TK AISYIYAH LEMAHABANG', npsn: '20254372', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Ki Hajar Dewantoro No. 25, Lemahabang', desa: 'LEMAHABANG', jenjang: 'TK' },
  { nama: 'TK AL-AQSO', npsn: '20254376', status: 'SWASTA', akreditasi: 'A', address: 'Jl. Desa Tuk Karangsuwung, Tuk Karangsuwung', desa: 'TUK KARANGSUWUNG', jenjang: 'TK' },
  { nama: 'TK AL-IRSYAD AL-ISLAMIYYAH', npsn: '20254373', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Syekh Lemahabang No. 54, Lemahabang Kulon', desa: 'LEMAHABANG KULON', jenjang: 'TK' },
  { nama: 'TK BPP KENANGA', npsn: '20254374', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Abdurahman Saleh No. 24, Asem', desa: 'ASEM', jenjang: 'TK' },
  { nama: 'TK GELATIK', npsn: '20254370', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Raya Dr. Wahidin No. 57A, Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN', jenjang: 'TK' },
  { nama: 'TK MELATI', npsn: '20254378', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Desa Wangkelang, Wangkelang', desa: 'WANGKELANG', jenjang: 'TK' },
  { nama: 'TK MUSLIMAT NU', npsn: '20254375', status: 'SWASTA', akreditasi: 'B', address: 'Jl. R.A. Kartini No. 5, Lemahabang', desa: 'LEMAHABANG', jenjang: 'TK' },
];
const sekolahKB = [
  { nama: 'KB A.H. PLUS', npsn: '70039880', status: 'SWASTA', akreditasi: '-', address: 'Jl. Pelita Dusun 4, Sigong', desa: 'SIGONG', jenjang: 'KB' },
  { nama: 'KB AMALIA SALSABILA', npsn: '69804039', status: 'SWASTA', akreditasi: 'B', address: 'Jl. K.H. Hasyim Asyari No. 112, Cipeujeuh Kulon', desa: 'CIPEUJEUH KULON', jenjang: 'KB' },
  { nama: 'KB AZ-ZAHRA', npsn: '69804068', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Pelita Dusun 02, Sigong', desa: 'SIGONG', jenjang: 'KB' },
  { nama: 'KB MUTIARA', npsn: '70044538', status: 'SWASTA', akreditasi: '-', address: 'Jl. KH. Hasyim Asyari No. 48, Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN', jenjang: 'KB' },
  { nama: 'KB PALAPA', npsn: '69870486', status: 'SWASTA', akreditasi: '-', address: 'Jl. Syech Lemahabang, Lemahabang Kulon', desa: 'LEMAHABANG KULON', jenjang: 'KB' },
  { nama: 'KB PERMATA BUNDA', npsn: '70024652', status: 'SWASTA', akreditasi: 'C', address: 'Jl. Palasah Nunggal, Picungpugur', desa: 'PICUNGPUGUR', jenjang: 'KB' },
  { nama: 'PAUD AL HAMBRA', npsn: '69947715', status: 'SWASTA', akreditasi: 'C', address: 'Desa Lemahabang, Lemahabang', desa: 'LEMAHABANG', jenjang: 'KB' },
  { nama: 'PAUD AL-HIDAYAH', npsn: '69870488', status: 'SWASTA', akreditasi: 'C', address: 'Jl. Cantilan, Sigong', desa: 'SIGONG', jenjang: 'KB' },
  { nama: 'PAUD AL-HUSNA', npsn: '69870479', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Mbah Ardisela Desa Asem, Asem', desa: 'ASEM', jenjang: 'KB' },
  { nama: 'PAUD AMANAH', npsn: '69870482', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Sidaresmi No. 1, Lemahabang Kulon', desa: 'LEMAHABANG KULON', jenjang: 'KB' },
  { nama: 'PAUD AN NAIM', npsn: '69870484', status: 'SWASTA', akreditasi: 'C', address: 'Blok Kliwon, Sindanglaut', desa: 'SINDANGLAUT', jenjang: 'KB' },
  { nama: 'PAUD ASY-SYAFIIYAH', npsn: '69870485', status: 'SWASTA', akreditasi: 'C', address: 'Jl. Stasiun No. 15, Lemahabang Kulon', desa: 'LEMAHABANG KULON', jenjang: 'KB' },
  { nama: 'PAUD BUDGENVIL', npsn: '69870489', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Inpres, Belawa', desa: 'BELAWA', jenjang: 'KB' },
  { nama: 'PAUD TUNAS HARAPAN', npsn: '69870490', status: 'SWASTA', akreditasi: 'C', address: 'Blok Pahing, Wangkelang', desa: 'WANGKELANG', jenjang: 'KB' },
  { nama: 'PAUD SPS MELATI', npsn: '69804044', status: 'SWASTA', akreditasi: 'C', address: 'Dusun 02, Sarajaya', desa: 'SARAJAYA', jenjang: 'KB' },
];
const allSekolah = [...sekolahSD, ...sekolahTK, ...sekolahKB];

// Build school ID lookup by normalized name
// Normalize: lowercase, remove punctuation, collapse spaces
function normName(n) {
  return n
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const schoolMap = {};
for (const s of allSekolah) {
  const id = normName(s.nama)
    .replace(/\s+/g, '-');
  schoolMap[normName(s.nama)] = id;
}

console.log(`Total schools to sync: ${allSekolah.length}`);

const collection = db.collection('schools');
let committed = 0;

for (let i = 0; i < allSekolah.length; i += 500) {
  const batch = db.batch();
  const chunk = allSekolah.slice(i, i + 500);

  for (const sekolah of chunk) {
    const id = schoolMap[normName(sekolah.nama)];
    const docRef = collection.doc(id);
    batch.set(docRef, {
      id,
      name: sekolah.nama,
      npsn: sekolah.npsn,
      jenjang: sekolah.jenjang,
      alamat: sekolah.address,
      desa: sekolah.desa,
      status: sekolah.status,
      kepalaSekolah: '',
      kontak: '',
      akreditasi: sekolah.akreditasi || '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  await batch.commit();
  committed += chunk.length;
  console.log(`  Progress: ${committed}/${allSekolah.length}`);
}

console.log(`Successfully synced ${committed} schools to Firestore`);
process.exit(0);
