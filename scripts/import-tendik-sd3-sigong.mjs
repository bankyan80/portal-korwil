import { cert, initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const saFile = readFileSync(join(__dirname, '..', 'service-account', 'kedinasan-e5317-firebase-adminsdk-fbsvc-79852a38b0.json'), 'utf-8');
const sa = JSON.parse(saFile);

const app = getApps().length === 0 ? initializeApp({ credential: cert(sa) }) : getApp();
const db = getFirestore(app);

const raw = `Daftar Tenaga Kependidikan,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
SD NEGERI 3 SIGONG KECAMATAN LEMAHABANG,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
"Kecamatan Kec. Lemah Abang, Kabupaten Kab. Cirebon, Provinsi Prov. Jawa Barat",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
Tanggal Unduh: 2026-05-18 08:41:49,,Pengunduh: FAJAR SIDIK (sdntiga_sigong@yahoo.co.id),,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
No,Nama,NUPTK,JK,Tempat Lahir,Tanggal Lahir,NIP,Status Kepegawaian,Jenis PTK,Agama,Alamat Jalan,RT,RW,Nama Dusun,Desa/Kelurahan,Kecamatan,Kode Pos,Telepon,HP,Email,Tugas Tambahan,SK CPNS,Tanggal CPNS,SK Pengangkatan,TMT Pengangkatan,Lembaga Pengangkatan,Pangkat Golongan,Sumber Gaji,Nama Ibu Kandung,Status Perkawinan,Nama Suami/Istri,NIP Suami/Istri,Pekerjaan Suami/Istri,TMT PNS,Sudah Lisensi Kepala Sekolah,Pernah Diklat Kepengawasan,Keahlian Braille,Keahlian Bahasa Isyarat,NPWP,Nama Wajib Pajak,Kewarganegaraan,Bank,Nomor Rekening Bank,Rekening Atas Nama,NIK,No KK,Karpeg,Karis/Karsu,Lintang,Bujur,NUKS,
1,FAJAR SIDIK,4738779680130002,L,CIREBON,2001-04-06,200104062025211027,Tenaga Honor Sekolah,Tenaga Kependidikan,Islam,BLOK KLIWON RT 003 RW 005,,,,CIPEUJEUH KULON,Kec. Lemah Abang,,,0895355241612,fajarsidik10.id@gmail.com,,,,422.7/002/SK/SD-20/I/2022,2022-01-02,Pemerintah Kab/Kota,,APBD Kabupaten/Kota,MARIYAH,Belum Kawin,,,Lainnya,2025-10-01,Tidak,Tidak,Tidak,Tidak,,,ID,,,,3209070604010004,,,,,,,Ya
2,Rita Andaya Kurniawati,3746750652300072,P,Cirebon,1972-04-14,197204142008012008,PNS,Kepala Sekolah,Islam,Dusun 03,9,3,,CIPEUJEUH WETAN,Kec. Lemah Abang,45183,,081324697050,ritaandayak@gmail.com,Kepala Sekolah,813.3/Kpts.148/BKD/2008,2008-01-01,821.3/Kpts.1696/BKPPD/2009,2010-01-01,Pemerintah Kab/Kota,III/d,APBD Kabupaten/Kota,Iah Asiah,Janda/Duda,,,Lainnya,2010-01-01,Ya,Tidak,Tidak,Tidak,48.379.768.4426          ,,ID,,,,3209075404720005,,,,,,,Ya`;

const lines = raw.split('\n');

function parseCSVLine(line) {
  const result = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQ = !inQ; }
    else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
    else { cur += ch; }
  }
  result.push(cur.trim());
  return result;
}

let headerIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith('No,Nama')) { headerIdx = i; break; }
}
const headers = parseCSVLine(lines[headerIdx]);
console.log('Headers count:', headers.length);

const employees = [];
const schoolId = 'sd-negeri-3-sigong';
const schoolName = 'SD NEGERI 3 SIGONG';

for (let i = headerIdx + 1; i < lines.length; i++) {
  const row = parseCSVLine(lines[i]);
  if (row.length < 5 || !row[1]) continue;

  const nama = (row[1] || '').trim();
  const nuptk = (row[2] || '').replace(/\s/g, '');
  const jk = (row[3] || '').toUpperCase() === 'P' ? 'P' : 'L';
  const nip = (row[6] || '').replace(/\s/g, '');
  const statusKepegawaian = (row[7] || '').trim();
  const jenisPtk = (row[8] || '').trim();
  const alamat = (row[10] || '').trim();
  const desa = (row[14] || '').trim();
  const kecamatan = (row[15] || '').trim();
  const hp = (row[18] || '').trim();
  const email = (row[19] || '').trim();
  const tugasTambahan = (row[20] || '').trim();
  const pangkat = (row[26] || '').trim();
  const namaIbu = (row[28] || '').trim();
  const statusPerkawinan = (row[29] || '').trim();
  const nik = (row[42] || '').replace(/\s/g, '');

  if (!nama) continue;

  employees.push({
    id: nik || nuptk,
    nama,
    nip,
    nik,
    nuptk,
    jenis_ptk: jenisPtk || 'Tenaga Kependidikan',
    tugas_tambahan: tugasTambahan,
    schoolId,
    sekolah: schoolName,
    jenisKelamin: jk,
    status: statusKepegawaian,
    pangkat,
    alamat: [alamat, desa, kecamatan].filter(Boolean).join(', '),
    hp,
    email,
    jabatanTambahan: tugasTambahan,
    namaIbu,
    statusPerkawinan,
    createdAt: Date.now(),
  });
}

console.log(`Found ${employees.length} tendik employees`);

const batch = db.batch();
for (const emp of employees) {
  const docRef = db.collection('employees').doc(emp.id);
  batch.set(docRef, emp, { merge: true });
}
await batch.commit();
console.log(`Upserted ${employees.length} records to Firestore employees collection`);
console.log('Done!');
