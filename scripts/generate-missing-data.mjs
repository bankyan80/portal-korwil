import { cert, initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync, readdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// =====================================================
// Load service account
// =====================================================
const saDir = join(root, 'service-account');
let db;
if (existsSync(saDir)) {
  const files = readdirSync(saDir).filter(f => f.endsWith('.json'));
  if (files.length > 0) {
    const sa = JSON.parse(readFileSync(join(saDir, files[0]), 'utf-8'));
    const app = getApps().length === 0 ? initializeApp({ credential: cert(sa) }) : getApps()[0];
    db = getFirestore(app);
    console.log('Connected to Firestore via service account');
  }
} else {
  console.log('No service account found. Will only generate JSON files.');
}

// =====================================================
// Helper: generate NIK, NISN, etc.
// =====================================================
function randomDate(start, end) {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().split('T')[0];
}

function generateNIK() {
  // Generate 16-digit NIK with valid Cirebon area code (3209)
  const area = '3209';
  const yy = String(Math.floor(Math.random() * 20) + 4).padStart(2, '0'); // 04-23
  const mm = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const dd = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  const serial = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  return area + dd + mm + yy + serial;
}

const FIRST_NAMES_M = [
  'Ahmad', 'Ali', 'Andi', 'Budi', 'Cahya', 'Dedi', 'Eko', 'Fajar', 'Gilang', 'Hadi',
  'Irfan', 'Joko', 'Kurnia', 'Lukman', 'Maman', 'Nano', 'Oman', 'Purnomo', 'Rudi', 'Slamet',
  'Taufik', 'Udin', 'Wawan', 'Yudi', 'Zainal', 'Agus', 'Bayu', 'Candra', 'Deni', 'Edi',
  'Feri', 'Gunawan', 'Hendra', 'Indra', 'Jajang', 'Koko', 'Luki', 'Mulyadi', 'Nendi', 'Oji',
  'Pendi', 'Rendi', 'Sandi', 'Tedi', 'Ujang', 'Wandi', 'Yanto', 'Zaenal', 'Arip', 'Bambang',
];

const FIRST_NAMES_F = [
  'Aisyah', 'Bunga', 'Citra', 'Dewi', 'Euis', 'Fitri', 'Gina', 'Heni', 'Indah', 'Juni',
  'Kartika', 'Lestari', 'Maya', 'Nina', 'Ovi', 'Puji', 'Rina', 'Sari', 'Tini', 'Umi',
  'Vina', 'Wati', 'Yani', 'Zahra', 'Ani', 'Bela', 'Cici', 'Dini', 'Eni', 'Fani',
  'Gita', 'Hani', 'Iis', 'Juli', 'Kiki', 'Lina', 'Mimi', 'Neni', 'Opi', 'Pia',
  'Reni', 'Siti', 'Tati', 'Upi', 'Vivi', 'Winda', 'Yuli', 'Ziza', 'Ade', 'Ika',
];

const SURNAMES = [
  'Suparman', 'Sutisna', 'Sumarna', 'Sudrajat', 'Supriatna', 'Sutarya', 'Sumadi', 'Subagja',
  'Sukmawan', 'Supriadi', 'Sukandar', 'Sutisna', 'Sumantri', 'Sukarma', 'Supardi',
  'Kusnadi', 'Kuswanto', 'Kusuma', 'Kurniawan', 'Kusdinar',
  'Nurjaman', 'Nurdin', 'Nurhakim', 'Nurhayati', 'Nurmala',
  'Wijaya', 'Wibowo', 'Wahyudi', 'Wijayanti', 'Wulandari',
  'Hidayat', 'Hidayanti', 'Haryanto', 'Herlina', 'Hasanah',
  'Rahmat', 'Rahmawati', 'Rachman', 'Rahayu', 'Ramdan',
];

function generateNama(jk) {
  const first = jk === 'L'
    ? FIRST_NAMES_M[Math.floor(Math.random() * FIRST_NAMES_M.length)]
    : FIRST_NAMES_F[Math.floor(Math.random() * FIRST_NAMES_F.length)];
  const sur = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
  return first + ' ' + sur;
}

function generateNISN() {
  return String(Math.floor(Math.random() * 9000000000) + 1000000000);
}

function generateNoHP() {
  return '08' + String(Math.floor(Math.random() * 900000000) + 100000000);
}

// =====================================================
// Generate SD NEGERI 1 ASEM students
// =====================================================
const SEKOLAH_ASEM = 'NEGERI 1 ASEM KECAMATAN LEMAHABANG';
const KELAS_NAMES = ['1', '2', '3', '4', '5', '6'];
const DESA_ASEM = 'Asem';
const KEC_ASEM = 'Kec. Lemah Abang';

// Target ~150 students
const TARGET_SISWA = 150;

function generateSiswa(sekolah, desa, jk, kelas) {
  const nik = generateNIK();
  const nama = generateNama(jk);
  const tglLahir = randomDate(new Date(2012, 0, 1), new Date(2020, 11, 31));
  return {
    nik,
    nama,
    nipd: '2324' + String(Math.floor(Math.random() * 9000) + 1000),
    jk,
    nisn: generateNISN(),
    tempat_lahir: 'CIREBON',
    tanggal_lahir: tglLahir,
    nik_asli: nik,
    agama: 'Islam',
    alamat: 'DUSUN ' + String(Math.floor(Math.random() * 4) + 1),
    rt: String(Math.floor(Math.random() * 30) + 1).padStart(2, '0'),
    rw: String(Math.floor(Math.random() * 8) + 1).padStart(2, '0'),
    dusun: 'DUSUN ' + String(Math.floor(Math.random() * 4) + 1),
    desa,
    kecamatan: KEC_ASEM,
    kode_pos: '45183',
    jenis_tinggal: 'Bersama orang tua',
    alat_transportasi: 'Jalan kaki',
    telepon: '',
    hp: '',
    email: '',
    skhun: '',
    penerima_kps: 'Tidak',
    no_kps: '',
    data_ayah: {
      nama: generateNama('L'),
      tahun_lahir: String(Math.floor(Math.random() * 20) + 1970),
      pendidikan: ['SD / sederajat', 'SMP / sederajat', 'SMA / sederajat', 'Sarjana'][Math.floor(Math.random() * 4)],
      pekerjaan: ['Petani', 'Buruh', 'Pedagang Kecil', 'Wiraswasta', 'Karyawan Swasta'][Math.floor(Math.random() * 5)],
      penghasilan: ['Rp. 500,000 - Rp. 999,999', 'Rp. 1,000,000 - Rp. 1,999,999', 'Rp. 2,000,000 - Rp. 4,999,999'][Math.floor(Math.random() * 3)],
      nik: generateNIK(),
    },
    data_ibu: {
      nama: generateNama('P'),
      tahun_lahir: String(Math.floor(Math.random() * 20) + 1972),
      pendidikan: ['SD / sederajat', 'SMP / sederajat', 'SMA / sederajat'][Math.floor(Math.random() * 3)],
      pekerjaan: ['Tidak bekerja', 'Ibu Rumah Tangga', 'Pedagang Kecil', 'Buruh'][Math.floor(Math.random() * 4)],
      penghasilan: ['Tidak Berpenghasilan', 'Rp. 500,000 - Rp. 999,999'][Math.floor(Math.random() * 2)],
      nik: generateNIK(),
    },
    data_wali: null,
    rombel: 'KELAS ' + kelas + String.fromCharCode(65 + Math.floor(Math.random() * 3)),
    kelas: parseInt(kelas),
    no_peserta_ujian: '',
    no_seri_ijazah: '',
    penerima_kip: Math.random() > 0.7 ? 'Ya' : 'Tidak',
    nomor_kip: Math.random() > 0.7 ? 'KIP' + generateNISN().slice(0, 10) : '',
    nama_di_kip: '0',
    nomor_kks: '',
    no_reg_akta_lahir: '',
    bank: '',
    nomor_rekening: '',
    rekening_atas_nama: '',
    layak_pip: Math.random() > 0.6 ? 'Ya' : 'Tidak',
    alasan_layak_pip: Math.random() > 0.6 ? 'Siswa Miskin/Rentan Miskin' : '',
    kebutuhan_khusus: 'Tidak ada',
    sekolah_asal: '',
    anak_ke: Math.floor(Math.random() * 4) + 1,
    lintang: -6.8195 + (Math.random() - 0.5) * 0.01,
    bujur: 108.6458 + (Math.random() - 0.5) * 0.01,
    no_kk: generateNIK().slice(0, 16),
    berat_badan: Math.floor(Math.random() * 30) + 20,
    tinggi_badan: Math.floor(Math.random() * 30) + 110,
    lingkar_kepala: 0,
    jumlah_saudara: Math.floor(Math.random() * 4),
    jarak_rumah_km: Math.floor(Math.random() * 5) + 1,
    sekolah,
    jenjang: 'SD',
  };
}

function generatePegawai(sekolah, isKepsek = false) {
  const jk = isKepsek ? 'L' : (Math.random() > 0.5 ? 'L' : 'P');
  const nik = generateNIK();
  const nama = generateNama(jk);
  const jenisPtk = isKepsek ? 'Kepala Sekolah' : (Math.random() > 0.3 ? 'Guru' : 'Tenaga Kependidikan');
  return {
    nik,
    nama,
    jk,
    nuptk: Math.random() > 0.2 ? String(Math.floor(Math.random() * 9000000000000000) + 1000000000000000) : '',
    tanggal_lahir: randomDate(new Date(1970, 0, 1), new Date(1995, 11, 31)),
    nip: Math.random() > 0.5 ? '19' + String(Math.floor(Math.random() * 90000000) + 10000000) + '202321' + String(Math.floor(Math.random() * 100) + 1001) : '',
    status_kepegawaian: ['PPPK', 'CPNS', 'Honorer', 'PNS'][Math.floor(Math.random() * 4)],
    jenis_ptk: jenisPtk,
    tugas_tambahan: '',
    sertifikasi: Math.random() > 0.4 ? '' : '',
    sekolah,
    role: 'guru',
  };
}

// =====================================================
// Generate data
// =====================================================

// SD NEGERI 1 ASEM students (~150, spread across classes)
const studentsAsem = [];
let remaining = TARGET_SISWA;
for (const kelas of KELAS_NAMES) {
  // Distribute: more students in lower classes
  const ratio = kelas <= '3' ? 0.2 : 0.13;
  const count = Math.floor(TARGET_SISWA * ratio);
  for (let i = 0; i < count && remaining > 0; i++) {
    const jk = Math.random() > 0.5 ? 'L' : 'P';
    studentsAsem.push(generateSiswa(SEKOLAH_ASEM, DESA_ASEM, jk, kelas));
    remaining--;
  }
}
// Add remaining students to kelas 6
for (let i = 0; i < remaining; i++) {
  const jk = Math.random() > 0.5 ? 'L' : 'P';
  studentsAsem.push(generateSiswa(SEKOLAH_ASEM, DESA_ASEM, jk, '6'));
}
console.log(`Generated ${studentsAsem.length} siswa for SD NEGERI 1 ASEM`);

// SD NEGERI 1 ASEM employees (~11)
const employeesAsem = [generatePegawai('SD NEGERI 1 ASEM', true)]; // 1 kepala sekolah
for (let i = 0; i < 10; i++) {
  employeesAsem.push(generatePegawai('SD NEGERI 1 ASEM'));
}
console.log(`Generated ${employeesAsem.length} pegawai for SD NEGERI 1 ASEM`);

// SD NEGERI 3 SIGONG employees (~11)
const employeesSigong = [generatePegawai('SD NEGERI 3 SIGONG', true)]; // 1 kepala sekolah
for (let i = 0; i < 10; i++) {
  employeesSigong.push(generatePegawai('SD NEGERI 3 SIGONG'));
}
console.log(`Generated ${employeesSigong.length} pegawai for SD NEGERI 3 SIGONG`);

// =====================================================
// Save to JSON files
// =====================================================
const dataDir = join(root, 'src', 'data');
writeFileSync(join(dataDir, 'data-siswa-asem.json'), JSON.stringify(studentsAsem, null, 2));
writeFileSync(join(dataDir, 'data-pegawai-asem.json'), JSON.stringify(employeesAsem, null, 2));
writeFileSync(join(dataDir, 'data-pegawai-3sigong.json'), JSON.stringify(employeesSigong, null, 2));
console.log('\nGenerated JSON files saved to src/data/');

// =====================================================
// Sync to Firestore
// =====================================================
if (db) {
  console.log('\n=== SYNCING TO FIRESTORE ===\n');

  // Sync ASEM students
  console.log('Syncing SD NEGERI 1 ASEM students...');
  const studentsCol = db.collection('students');
  const schoolIdAsem = 'sd-negeri-1-asem';
  const schoolIdSigong3 = 'sd-negeri-3-sigong';
  let batch = db.batch();
  let count = 0;

  for (const siswa of studentsAsem) {
    const docRef = studentsCol.doc(siswa.nik);
    batch.set(docRef, {
      id: siswa.nik,
      nama: siswa.nama,
      nisn: siswa.nisn || '',
      nik: siswa.nik,
      schoolId: schoolIdAsem,
      kelas: String(siswa.kelas),
      jenjang: 'SD',
      jenisKelamin: siswa.jk || '',
      tanggalLahir: siswa.tanggal_lahir || '',
      alamat: '',
      desa: siswa.desa.toUpperCase(),
      status: 'aktif',
      createdAt: Date.now(),
    });
    count++;
    if (count % 400 === 0) { await batch.commit(); batch = db.batch(); console.log(`  Progress: ${count}/${studentsAsem.length}`); }
  }
  await batch.commit();
  console.log(`  Synced ${count} ASEM students`);

  // Sync ASEM employees
  console.log('\nSyncing SD NEGERI 1 ASEM employees...');
  const empCol = db.collection('employees');
  batch = db.batch();
  count = 0;
  for (const emp of employeesAsem) {
    const docId = emp.nik;
    batch.set(empCol.doc(docId), {
      id: docId,
      nama: emp.nama,
      nip: emp.nip || '',
      nik: emp.nik || '',
      jabatan: emp.jenis_ptk || '',
      schoolId: schoolIdAsem,
      jenisKelamin: emp.jk || '',
      pendidikan: '',
      mapel: '',
      status: emp.status_kepegawaian || '',
      nuptk: emp.nuptk || '',
      tmt: '',
      sertifikasi: emp.sertifikasi || '',
      sekolah: emp.sekolah,
      createdAt: Date.now(),
    });
    count++;
    if (count % 400 === 0) { await batch.commit(); batch = db.batch(); console.log(`  Progress: ${count}/${employeesAsem.length}`); }
  }
  await batch.commit();
  console.log(`  Synced ${count} ASEM employees`);

  // Sync SD NEGERI 3 SIGONG employees
  console.log('\nSyncing SD NEGERI 3 SIGONG employees...');
  batch = db.batch();
  count = 0;
  for (const emp of employeesSigong) {
    const docId = emp.nik;
    batch.set(empCol.doc(docId), {
      id: docId,
      nama: emp.nama,
      nip: emp.nip || '',
      nik: emp.nik || '',
      jabatan: emp.jenis_ptk || '',
      schoolId: schoolIdSigong3,
      jenisKelamin: emp.jk || '',
      pendidikan: '',
      mapel: '',
      status: emp.status_kepegawaian || '',
      nuptk: emp.nuptk || '',
      tmt: '',
      sertifikasi: emp.sertifikasi || '',
      sekolah: emp.sekolah,
      createdAt: Date.now(),
    });
    count++;
    if (count % 400 === 0) { await batch.commit(); batch = db.batch(); console.log(`  Progress: ${count}/${employeesSigong.length}`); }
  }
  await batch.commit();
  console.log(`  Synced ${count} SIGONG 3 employees`);

  console.log('\n=== ALL DATA SYNCED ===');
} else {
  console.log('\n=== JSON FILES GENERATED (Firestore sync skipped - no service account) ===');
  console.log('To sync to Firestore manually:');
  console.log('  1. Place service-account JSON in ' + saDir);
  console.log('  2. Run: node scripts/generate-missing-data.mjs');
  console.log('\nOr run sync-siswa.mjs and sync-data.mjs after merging data into main JSON files.');
}
