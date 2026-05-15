import { cert, initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  }
  const localPath = join(__dirname, '..', 'service-account');
  if (!existsSync(localPath)) return null;
  const files = readdirSync(localPath).filter(f => f.endsWith('.json'));
  if (files.length === 0) return null;
  return JSON.parse(readFileSync(join(localPath, files[0]), 'utf-8'));
}

const serviceAccount = loadServiceAccount();
if (!serviceAccount) {
  console.error('Service account not found');
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

const SEKOLAH = 'SD NEGERI 1 ASEM';

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
  if (errors.length > 0) {
    console.log(`  Errors: ${errors.slice(0, 5).join(', ')}`);
  }
  return { success, errors };
}

async function main() {
  console.log('Import Data Pegawai - SD NEGERI 1 ASEM');
  console.log('=======================================');

  const guruUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR4PhpkeqQjr9cbHrEoGwgQW9CvqVBA1D0--o1ZhXv_OaBqNPddwAHs_PZCsgXP-g/pub?gid=296347908&single=true&output=csv';
  const tendikUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vThPc1fGt2M1KTJmm6X2eJvSEMQIIgNn8QBCtcwLQN9zGjc0TLZDJTwREBOYzX0qQ/pub?gid=430985553&single=true&output=csv';

  await importCSV(guruUrl, 'Guru');
  await importCSV(tendikUrl, 'Tenaga Kependidikan');

  console.log('\n=== Selesai ===');
  process.exit(0);
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
