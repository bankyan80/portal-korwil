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

const SEKOLAH = 'TK GELATIK';
const GURU_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTtIJapNJgcZ2Z0GR83o916wOHGwt-W0KiQtaC0-mtvL8KpUVBOKWJCaD1TK8DMAA/pub?gid=1187748548&single=true&output=csv';
const TENDIK_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTjHBZ44HfzBKjyVdoUN_GsGGpCMKZqh7xygrVX8xal2AsCBrlQ02VH52PUfoRobA/pub?gid=1625950301&single=true&output=csv';

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

async function downloadCSV(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function mapRow(cols, sekolah) {
  const nik = (cols[44] || '').trim();
  if (!nik) return null;
  return {
    nik,
    nama: (cols[1] || '').trim(),
    nuptk: (cols[2] || '').trim(),
    jk: (cols[3] || '').trim(),
    tempat_lahir: (cols[4] || '').trim(),
    tanggal_lahir: (cols[5] || '').trim(),
    nip: (cols[6] || '').trim(),
    status_kepegawaian: (cols[7] || '').trim(),
    jenis_ptk: (cols[8] || '').trim(),
    agama: (cols[9] || '').trim(),
    alamat: (cols[10] || '').trim(),
    rt: (cols[11] || '').trim(),
    rw: (cols[12] || '').trim(),
    dusun: (cols[13] || '').trim(),
    desa: (cols[14] || '').trim(),
    kecamatan: (cols[15] || '').trim(),
    kode_pos: (cols[16] || '').trim(),
    telepon: (cols[17] || '').trim(),
    hp: (cols[18] || '').trim(),
    email: (cols[19] || '').trim(),
    tugas_tambahan: (cols[20] || '').trim(),
    sk_cpns: (cols[21] || '').trim(),
    tanggal_cpns: (cols[22] || '').trim(),
    sk_pengangkatan: (cols[23] || '').trim(),
    tmt_pengangkatan: (cols[24] || '').trim(),
    lembaga_pengangkatan: (cols[25] || '').trim(),
    pangkat_golongan: (cols[26] || '').trim(),
    sumber_gaji: (cols[27] || '').trim(),
    nama_ibu_kandung: (cols[28] || '').trim(),
    status_perkawinan: (cols[29] || '').trim(),
    nama_suami_istri: (cols[30] || '').trim(),
    nip_suami_istri: (cols[31] || '').trim(),
    pekerjaan_suami_istri: (cols[32] || '').trim(),
    tmt_pns: (cols[33] || '').trim(),
    lisensi_kepala_sekolah: (cols[34] || '').trim(),
    pernah_diklat_kepengawasan: (cols[35] || '').trim(),
    keahlian_braille: (cols[36] || '').trim(),
    keahlian_bahasa_isyarat: (cols[37] || '').trim(),
    npwp: (cols[38] || '').trim(),
    nama_wajib_pajak: (cols[39] || '').trim(),
    kewarganegaraan: (cols[40] || '').trim(),
    bank: (cols[41] || '').trim(),
    nomor_rekening: (cols[42] || '').trim(),
    rekening_atas_nama: (cols[43] || '').trim(),
    no_kk: (cols[45] || '').trim(),
    karpeg: (cols[46] || '').trim(),
    karis_karsu: (cols[47] || '').trim(),
    lintang: (cols[48] || '').trim(),
    bujur: (cols[49] || '').trim(),
    nuks: (cols[50] || '').trim(),
    sekolah,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

async function importCSV(url, label) {
  console.log(`\n=== Mengunduh ${label}...`);
  const csvText = await downloadCSV(url);
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 5) {
    console.log(`  Tidak ada data di ${label}`);
    return { success: 0, errors: [] };
  }
  const dataRows = lines.slice(5);
  let success = 0;
  let errors = [];
  for (const row of dataRows) {
    try {
      const cols = parseCSVLine(row);
      if (cols.length < 5) continue;
      const record = mapRow(cols, SEKOLAH);
      if (!record) { errors.push('NIK kosong'); continue; }
      await db.collection('employees').doc(record.nik).set(record, { merge: true });
      success++;
    } catch (e) {
      errors.push(e.message);
    }
  }
  console.log(`  ${label}: ${success} imported, ${errors.length} errors`);
  if (errors.length > 0) console.log(`  Errors: ${errors.slice(0, 5).join(', ')}`);
  return { success, errors };
}

async function main() {
  console.log('=== Reset & Import Data Pegawai TK GELATIK ===\n');

  // Step 1: Delete all existing TK GELATIK records
  console.log('Step 1: Menghapus data lama TK GELATIK...');
  const snap = await db.collection('employees').where('sekolah', '==', SEKOLAH).get();
  console.log(`  Found ${snap.size} records to delete`);
  
  let deleted = 0;
  const batch = db.batch();
  snap.forEach(docSnap => {
    batch.delete(docSnap.ref);
    deleted++;
  });
  await batch.commit();
  console.log(`  Deleted: ${deleted} records\n`);

  // Step 2: Import new data from Google Sheets
  console.log('Step 2: Mengimpor data baru dari Google Sheets...');
  const guruResult = await importCSV(GURU_URL, 'Guru');
  const tendikResult = await importCSV(TENDIK_URL, 'Tenaga Kependidikan');

  const totalImported = guruResult.success + tendikResult.success;
  console.log(`\n=== Selesai ===`);
  console.log(`Total dihapus: ${deleted}`);
  console.log(`Total diimpor: ${totalImported} (Guru: ${guruResult.success}, Tendik: ${tendikResult.success})`);
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
