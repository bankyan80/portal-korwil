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

// ======================================================================
// NORMALISASI NAMA SEKOLAH & BUILD MAPPING
// ======================================================================
// Data siswa & pegawai punya variasi nama sekolah yg berbeda.
// Kita mapping manual dengan normalize kedua sisi.

const sekolahSD = [
  { nama: 'SD NEGERI 1 ASEM', jenjang: 'SD' },
  { nama: 'SD NEGERI 1 BELAWA', jenjang: 'SD' },
  { nama: 'SD NEGERI 2 BELAWA', jenjang: 'SD' },
  { nama: 'SD NEGERI 1 CIPEUJEUH KULON', jenjang: 'SD' },
  { nama: 'SD NEGERI 2 CIPEUJEUH KULON', jenjang: 'SD' },
  { nama: 'SD NEGERI 1 CIPEUJEUH WETAN', jenjang: 'SD' },
  { nama: 'SD NEGERI 2 CIPEUJEUH WETAN', jenjang: 'SD' },
  { nama: 'SD NEGERI 3 CIPEUJEUH WETAN', jenjang: 'SD' },
  { nama: 'SD NEGERI 1 LEMAHABANG', jenjang: 'SD' },
  { nama: 'SD NEGERI 2 LEMAHABANG', jenjang: 'SD' },
  { nama: 'SD NEGERI 1 LEMAHABANG KULON', jenjang: 'SD' },
  { nama: 'SD NEGERI 1 LEUWIDINGDING', jenjang: 'SD' },
  { nama: 'SD NEGERI 1 PICUNGPUGUR', jenjang: 'SD' },
  { nama: 'SD NEGERI 1 SARAJAYA', jenjang: 'SD' },
  { nama: 'SD NEGERI 2 SARAJAYA', jenjang: 'SD' },
  { nama: 'SD NEGERI 1 SIGONG', jenjang: 'SD' },
  { nama: 'SD NEGERI 3 SIGONG', jenjang: 'SD' },
  { nama: 'SD NEGERI 4 SIGONG', jenjang: 'SD' },
  { nama: 'SD NEGERI 1 SINDANGLAUT', jenjang: 'SD' },
  { nama: 'SD NEGERI 1 TUK KARANGSUWUNG', jenjang: 'SD' },
  { nama: 'SD NEGERI 1 WANGKELANG', jenjang: 'SD' },
  { nama: 'SD IT AL IRSYAD AL ISLAMIYYAH', jenjang: 'SD' },
];
const sekolahTK = [
  { nama: 'TK NEGERI LEMAHABANG', jenjang: 'TK' },
  { nama: 'TK AISYIYAH LEMAHABANG', jenjang: 'TK' },
  { nama: 'TK AL-AQSO', jenjang: 'TK' },
  { nama: 'TK AL-IRSYAD AL-ISLAMIYYAH', jenjang: 'TK' },
  { nama: 'TK BPP KENANGA', jenjang: 'TK' },
  { nama: 'TK GELATIK', jenjang: 'TK' },
  { nama: 'TK MELATI', jenjang: 'TK' },
  { nama: 'TK MUSLIMAT NU', jenjang: 'TK' },
];
const sekolahKB = [
  { nama: 'KB A.H. PLUS', jenjang: 'KB' },
  { nama: 'KB AMALIA SALSABILA', jenjang: 'KB' },
  { nama: 'KB AZ-ZAHRA', jenjang: 'KB' },
  { nama: 'KB MUTIARA', jenjang: 'KB' },
  { nama: 'KB PALAPA', jenjang: 'KB' },
  { nama: 'KB PERMATA BUNDA', jenjang: 'KB' },
  { nama: 'PAUD AL HAMBRA', jenjang: 'KB' },
  { nama: 'PAUD AL-HIDAYAH', jenjang: 'KB' },
  { nama: 'PAUD AL-HUSNA', jenjang: 'KB' },
  { nama: 'PAUD AMANAH', jenjang: 'KB' },
  { nama: 'PAUD AN NAIM', jenjang: 'KB' },
  { nama: 'PAUD ASY-SYAFIIYAH', jenjang: 'KB' },
  { nama: 'PAUD BUDGENVIL', jenjang: 'KB' },
  { nama: 'PAUD TUNAS HARAPAN', jenjang: 'KB' },
  { nama: 'PAUD SPS MELATI', jenjang: 'KB' },
];
const allSekolah = [...sekolahSD, ...sekolahTK, ...sekolahKB];

function makeId(nama) {
  return nama
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function norm(s) {
  return s
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Build schoolMap: nama normalize -> { id, name, jenjang }
const schoolMap = {};
for (const s of allSekolah) {
  schoolMap[norm(s.nama)] = { id: makeId(s.nama), jenjang: s.jenjang, name: s.nama };
}

// Manual mapping: variasi nama dari data siswa -> ID sekolah
const VARIASI_NAMA = {
  // SD NEGERI — siswa pake format "NEGERI X ... KECAMATAN LEMAHABANG"
  'negeri 1 asem kecamatan lemahabang': makeId('SD NEGERI 1 ASEM'),
  'negeri 1 belawa kecamatan lemahabang': makeId('SD NEGERI 1 BELAWA'),
  'negeri 1 cipeujeuh kulon kecamatan lemahabang': makeId('SD NEGERI 1 CIPEUJEUH KULON'),
  'negeri 1 cipeujeuh wetan kecamatan lemahabang': makeId('SD NEGERI 1 CIPEUJEUH WETAN'),
  'negeri 1 lemahabang kecamatan lemahabang': makeId('SD NEGERI 1 LEMAHABANG'),
  'negeri 1 lemahabang kulon kecamatan lemahabang': makeId('SD NEGERI 1 LEMAHABANG KULON'),
  'negeri 1 leuwidingding kecamatan lemahabang': makeId('SD NEGERI 1 LEUWIDINGDING'),
  'negeri 1 picungpugur kecamatan lemahabang': makeId('SD NEGERI 1 PICUNGPUGUR'),
  'negeri 1 sarajaya kecamatan lemahabang': makeId('SD NEGERI 1 SARAJAYA'),
  'negeri 1 sindanglaut kecamatan lemahabang': makeId('SD NEGERI 1 SINDANGLAUT'),
  'negeri 1 tuk karangsuwung kecamatan lemahabang': makeId('SD NEGERI 1 TUK KARANGSUWUNG'),
  'negeri 1 wangkelang kecamatan lemahabang': makeId('SD NEGERI 1 WANGKELANG'),
  'negeri 2 belawa kecamatan lemahabang': makeId('SD NEGERI 2 BELAWA'),
  'negeri 2 cipeujeuh kulon kecamatan lemahabang': makeId('SD NEGERI 2 CIPEUJEUH KULON'),
  'negeri 2 cipeujeuh wetan kecamatan lemahabang': makeId('SD NEGERI 2 CIPEUJEUH WETAN'),
  'negeri 2 lemahabang kecamatan lemahabang': makeId('SD NEGERI 2 LEMAHABANG'),
  'negeri 2 sarajaya kecamatan lemahabang': makeId('SD NEGERI 2 SARAJAYA'),
  'negeri 3 cipeujeuh wetan kecamatan lemahabang': makeId('SD NEGERI 3 CIPEUJEUH WETAN'),
  'negeri 4 sigong kecamatan lemahabang': makeId('SD NEGERI 4 SIGONG'),
  // SDN format
  'sdn 3 sigong': makeId('SD NEGERI 3 SIGONG'),
  'negeri 1 sigong': makeId('SD NEGERI 1 SIGONG'),
  'negeri 1 sigong kecamatan lemahabang': makeId('SD NEGERI 1 SIGONG'),
  // TK
  'negeri lemahabang': makeId('TK NEGERI LEMAHABANG'),
  'aisyiyah lemahabang': makeId('TK AISYIYAH LEMAHABANG'),
  'al irsyad al islamiyyah': makeId('TK AL-IRSYAD AL-ISLAMIYYAH'),
  'bpp kenanga': makeId('TK BPP KENANGA'),
  'gelatik': makeId('TK GELATIK'),
  'melati': makeId('TK MELATI'),
  'muslimat nu': makeId('TK MUSLIMAT NU'),
  // KB/PAUD
  'ah plus': makeId('KB A.H. PLUS'),
  'al husna': makeId('PAUD AL-HUSNA'),
  'amalia salsabila': makeId('KB AMALIA SALSABILA'),
  'amanah': makeId('PAUD AMANAH'),
  'an naim': makeId('PAUD AN NAIM'),
  'asy  syafiiyah': makeId('PAUD ASY-SYAFIIYAH'),
  'asy syafiiyah': makeId('PAUD ASY-SYAFIIYAH'),
  'az zahra': makeId('KB AZ-ZAHRA'),
  'budgenvil': makeId('PAUD BUDGENVIL'),
  'palapa': makeId('KB PALAPA'),
  'sps melati': makeId('PAUD SPS MELATI'),
  'tunas harapan': makeId('PAUD TUNAS HARAPAN'),
  // SD IT
  'it al irsyad al islamiyyah': makeId('SD IT AL IRSYAD AL ISLAMIYYAH'),
};

function lookupSchoolId(namaSekolah) {
  if (!namaSekolah) return null;
  const n = norm(namaSekolah);
  // First try direct map
  if (VARIASI_NAMA[n]) return VARIASI_NAMA[n];
  // Then try normalized match against school list
  if (schoolMap[n]) return schoolMap[n].id;
  return null;
}

// ======================================================================
// SYNC SISWA -> students collection
// ======================================================================
async function syncSiswa() {
  const raw = readFileSync(join(root, 'src', 'data', 'data-siswa.json'), 'utf-8');
  const allSiswa = JSON.parse(raw);

  const validSiswa = allSiswa.filter(s => s.nik && s.nik.trim());
  const skipped = allSiswa.length - validSiswa.length;
  if (skipped) {
    console.log(`Skipped ${skipped} siswa with empty NIK:`);
    allSiswa.filter(s => !s.nik || !s.nik.trim()).forEach(s => console.log(`  - ${s.nama} (${s.sekolah})`));
  }

  console.log(`\nSyncing ${validSiswa.length} siswa to Firestore students collection...`);

  const collection = db.collection('students');
  let committed = 0;
  let unmapped = {};

  for (let i = 0; i < validSiswa.length; i += 500) {
    const batch = db.batch();
    const chunk = validSiswa.slice(i, i + 500);

    for (const siswa of chunk) {
      const schoolId = lookupSchoolId(siswa.sekolah);
      if (!schoolId) {
        unmapped[siswa.sekolah] = (unmapped[siswa.sekolah] || 0) + 1;
        continue;
      }

      const docRef = collection.doc(siswa.nik);
      batch.set(docRef, {
        id: siswa.nik,
        nama: siswa.nama,
        nisn: siswa.nisn || '',
        nik: siswa.nik,
        schoolId,
        kelas: '',
        jenjang: (siswa.jenjang || 'SD').toUpperCase(),
        jenisKelamin: siswa.jk || '',
        tanggalLahir: siswa.tanggal_lahir || '',
        alamat: '',
        desa: (siswa.desa || '').toUpperCase(),
        status: 'aktif',
        createdAt: Date.now(),
      });
    }

    await batch.commit();
    committed += chunk.length;
    console.log(`  Progress: ${committed}/${validSiswa.length}`);
  }

  const unmappedKeys = Object.keys(unmapped);
  if (unmappedKeys.length > 0) {
    console.log(`\nWARNING: ${unmappedKeys.length} unmapped school(s) found (${Object.values(unmapped).reduce((a,b)=>a+b,0)} records skipped):`);
    for (const k of unmappedKeys.sort()) {
      console.log(`  - "${k}": ${unmapped[k]} records`);
    }
  }

  console.log(`Successfully synced ${committed} siswa to Firestore`);
  return unmappedKeys;
}

// ======================================================================
// SYNC PEGAWAI -> employees collection
// ======================================================================
async function syncPegawai() {
  const raw = readFileSync(join(root, 'src', 'data', 'data-pegawai.json'), 'utf-8');
  const allPegawai = JSON.parse(raw);

  console.log(`\nSyncing ${allPegawai.length} pegawai to Firestore employees collection...`);

  const collection = db.collection('employees');
  let committed = 0;
  let unmapped = {};

  for (let i = 0; i < allPegawai.length; i += 500) {
    const batch = db.batch();
    const chunk = allPegawai.slice(i, i + 500);

    for (const pegawai of chunk) {
      const schoolId = lookupSchoolId(pegawai.sekolah);
      if (!schoolId) {
        unmapped[pegawai.sekolah] = (unmapped[pegawai.sekolah] || 0) + 1;
        continue;
      }

      // Use NIK as doc ID, fallback to NUPTK
      const docId = (pegawai.nik && pegawai.nik.trim()) ? pegawai.nik : (pegawai.nuptk || `emp-${committed + Math.random()}`);
      const docRef = collection.doc(docId);
      batch.set(docRef, {
        id: docId,
        nama: pegawai.nama,
        nip: pegawai.nip || '',
        nik: pegawai.nik || '',
        jabatan: pegawai.jenis_ptk || '',
        schoolId,
        jenisKelamin: pegawai.jk || '',
        pendidikan: '',
        mapel: '',
        status: pegawai.status_kepegawaian || '',
        nuptk: pegawai.nuptk || '',
        tmt: '',
        sertifikasi: pegawai.sertifikasi || '',
        createdAt: Date.now(),
      });
    }

    await batch.commit();
    committed += chunk.length;
    console.log(`  Progress: ${committed}/${allPegawai.length}`);
  }

  const unmappedKeys = Object.keys(unmapped);
  if (unmappedKeys.length > 0) {
    console.log(`\nWARNING: ${unmappedKeys.length} unmapped school(s) found (${Object.values(unmapped).reduce((a,b)=>a+b,0)} records skipped):`);
    for (const k of unmappedKeys.sort()) {
      console.log(`  - "${k}": ${unmapped[k]} records`);
    }
  }

  console.log(`Successfully synced ${committed} pegawai to Firestore`);
}

// ======================================================================
// RUN
// ======================================================================
async function main() {
  console.log('=== MIGRATION START ===\n');

  // Step 1: Sync schools first (if not already done)
  console.log('Step 1: Syncing schools...');
  // (schools sync should be run separately via sync-sekolah.mjs)

  // Step 2: Sync students
  const unmapped = await syncSiswa();

  // Step 3: Sync employees
  await syncPegawai();

  if (unmapped.length > 0) {
    console.log('\n=== MIGRATION COMPLETE (with unmapped schools) ===');
  } else {
    console.log('\n=== MIGRATION COMPLETE ===');
  }
  process.exit(0);
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
