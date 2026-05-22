/**
 * Import Dapodik CSV export to data-siswa.json
 *
 * Usage: node scripts/import-siswa-csv.mjs <csv-url-or-path> <sekolah-name> <jenjang>
 *
 * Example: node scripts/import-siswa-csv.mjs "https://docs.google.com/spreadsheets/d/e/.../pub?gid=...&single=true&output=csv" "TK AL-IRSYAD AL-ISLAMIYYAH" TK
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ---- CLI args ----
const csvSource = process.argv[2];
const sekolahName = process.argv[3];
const jenjang = process.argv[4] || 'TK';

if (!csvSource || !sekolahName) {
  console.error('Usage: node scripts/import-siswa-csv.mjs <csv-url-or-path> <sekolah-name> [jenjang]');
  process.exit(1);
}

// ---- Fetch or read CSV ----
async function fetchText(url) {
  const maxRedirects = 5;
  for (let r = 0; r < maxRedirects; r++) {
    const result = await new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          resolve({ redirect: res.headers.location });
          return;
        }
        let data = '';
        res.on('data', (c) => data += c);
        res.on('end', () => resolve({ data }));
      }).on('error', reject);
    });
    if (result.data) return result.data;
    if (result.redirect) { url = result.redirect; continue; }
  }
  throw new Error(`Too many redirects for ${url}`);
}

const csvText = csvSource.startsWith('http')
  ? await fetchText(csvSource)
  : readFileSync(csvSource, 'utf-8');

// ---- Parse CSV (handle quoted fields) ----
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else { current += ch; }
  }
  result.push(current.trim());
  return result;
}

const lines = csvText.split(/\r?\n/).filter(l => l.trim());

// Find data header row (line starting with "No,Nama,...")
let hdrIdx = -1;
for (let i = 0; i < lines.length; i++) {
  const cols = parseCSVLine(lines[i]);
  if (cols[0] === 'No' && cols[1] === 'Nama') { hdrIdx = i; break; }
}
if (hdrIdx < 0) { console.error('Header row not found'); process.exit(1); }

// Column indices (0-based)
const col = (name) => {
  const hdr = parseCSVLine(lines[hdrIdx]);
  const idx = hdr.indexOf(name);
  if (idx < 0) console.warn(`Column "${name}" not found`);
  return idx;
};

const idxNama = col('Nama');
const idxNIPD = col('NIPD');
const idxJK = col('JK');
const idxNISN = col('NISN');
const idxTempatLahir = col('Tempat Lahir');
const idxTglLahir = col('Tanggal Lahir');
const idxNIK = col('NIK');
const idxAgama = col('Agama');
const idxAlamat = col('Alamat');
const idxRT = col('RT');
const idxRW = col('RW');
const idxDusun = col('Dusun');
const idxKelurahan = col('Kelurahan');
const idxKecamatan = col('Kecamatan');
const idxKodePos = col('Kode Pos');
const idxJenisTinggal = col('Jenis Tinggal');
const idxTransport = col('Alat Transportasi');
const idxTelepon = col('Telepon');
const idxHP = col('HP');
const idxEmail = col('E-Mail');
const idxSKHUN = col('SKHUN');
const idxPenerimaKPS = col('Penerima KPS');
const idxNoKPS = col('No. KPS');
const idxRombel = col('Rombel Saat Ini');
const idxNoPeserta = col('No Peserta Ujian Nasional');
const idxNoIjazah = col('No Seri Ijazah');
const idxPenerimaKIP = col('Penerima KIP');
const idxNomorKIP = col('Nomor KIP');
const idxNamaKIP = col('Nama di KIP');
const idxNoKKS = col('Nomor KKS');
const idxAktaLahir = col('No Registrasi Akta Lahir');
const idxBank = col('Bank');
const idxNoRekening = col('Nomor Rekening Bank');
const idxRekAtasNama = col('Rekening Atas Nama');
const idxLayakPIP = col('Layak PIP (usulan dari sekolah)');
const idxAlasanPIP = col('Alasan Layak PIP');
const idxKebutuhanKhusus = col('Kebutuhan Khusus');
const idxSekolahAsal = col('Sekolah Asal');
const idxAnakKe = col('Anak ke-berapa');
const idxLintang = col('Lintang');
const idxBujur = col('Bujur');
const idxNoKK = col('No KK');
const idxBerat = col('Berat Badan');
const idxTinggi = col('Tinggi Badan');
const idxLingkar = col('Lingkar Kepala');
const idxJmlSaudara = col('Jml. Saudara\nKandung') >= 0 ? col('Jml. Saudara\nKandung') : col('Jml. Saudara Kandung');
const idxJarak = col('Jarak Rumah\nke Sekolah (KM)') >= 0 ? col('Jarak Rumah\nke Sekolah (KM)') : col('Jarak Rumah ke Sekolah (KM)');

// Data Ayah/Ibu/Wali columns — they follow after No. KPS
// Sub-header row (hdrIdx+3) has: Nama,Tahun Lahir,Jenjang Pendidikan,Pekerjaan,Penghasilan,NIK
// But these are positioned after No. KPS column (which is at index 23 in the TK data)
// Let's find them by position: Data Ayah starts at idxNoKPS+1
const dataAyahStart = idxNoKPS >= 0 ? idxNoKPS + 1 : 24;
const dataIbuStart = dataAyahStart + 6;
const dataWaliStart = dataIbuStart + 6;
const rombelCol = idxRombel >= 0 ? idxRombel : dataWaliStart + 6;

function parseDate(val) {
  if (!val) return '';
  const v = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v;
  const m = v.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  return v;
}

function normalizeLayakPip(val) {
  if (!val) return 'Tidak';
  const v = String(val).trim().toLowerCase();
  if (v === 'ya' || v === 'y' || v === '1') return 'Ya';
  return 'Tidak';
}

// Parse data rows
const newSiswa = [];
for (let i = hdrIdx + 1; i < lines.length; i++) {
  const cols = parseCSVLine(lines[i]);
  if (!cols || !cols[0]) continue;
  if (isNaN(parseInt(cols[0]))) continue;
  const nik = String(cols[idxNIK] || '').trim();
  if (!nik) continue;

  newSiswa.push({
    nik,
    nama: String(cols[idxNama] || '').trim(),
    nipd: String(cols[idxNIPD] || '').trim(),
    jk: String(cols[idxJK] || '').trim().toUpperCase(),
    nisn: String(cols[idxNISN] || '').trim(),
    tempat_lahir: String(cols[idxTempatLahir] || '').trim(),
    tanggal_lahir: parseDate(cols[idxTglLahir]),
    nik_asli: nik,
    agama: String(cols[idxAgama] || '').trim(),
    alamat: String(cols[idxAlamat] || '').trim(),
    rt: String(cols[idxRT] || '').trim(),
    rw: String(cols[idxRW] || '').trim(),
    dusun: String(cols[idxDusun] || '').trim(),
    desa: String(cols[idxKelurahan] || '').replace(/^Desa\/Kel\.\s*/i, '').trim(),
    kecamatan: String(cols[idxKecamatan] || '').trim(),
    kode_pos: String(cols[idxKodePos] || '').trim(),
    jenis_tinggal: String(cols[idxJenisTinggal] || '').trim(),
    alat_transportasi: String(cols[idxTransport] || '').trim(),
    telepon: String(cols[idxTelepon] || '').trim(),
    hp: String(cols[idxHP] || '').trim(),
    email: String(cols[idxEmail] || '').trim(),
    skhun: String(cols[idxSKHUN] || '').trim(),
    penerima_kps: String(cols[idxPenerimaKPS] || '').trim(),
    no_kps: String(cols[idxNoKPS] || '').trim(),
    data_ayah: {
      nama: String(cols[dataAyahStart] || '').trim(),
      tahun_lahir: String(cols[dataAyahStart + 1] || '').trim(),
      pendidikan: String(cols[dataAyahStart + 2] || '').trim(),
      pekerjaan: String(cols[dataAyahStart + 3] || '').trim(),
      penghasilan: String(cols[dataAyahStart + 4] || '').trim(),
      nik: String(cols[dataAyahStart + 5] || '').trim(),
    },
    data_ibu: {
      nama: String(cols[dataIbuStart] || '').trim(),
      tahun_lahir: String(cols[dataIbuStart + 1] || '').trim(),
      pendidikan: String(cols[dataIbuStart + 2] || '').trim(),
      pekerjaan: String(cols[dataIbuStart + 3] || '').trim(),
      penghasilan: String(cols[dataIbuStart + 4] || '').trim(),
      nik: String(cols[dataIbuStart + 5] || '').trim(),
    },
    data_wali: (cols[dataWaliStart] || '').trim() ? {
      nama: String(cols[dataWaliStart] || '').trim(),
      tahun_lahir: String(cols[dataWaliStart + 1] || '').trim(),
      pendidikan: String(cols[dataWaliStart + 2] || '').trim(),
      pekerjaan: String(cols[dataWaliStart + 3] || '').trim(),
      penghasilan: String(cols[dataWaliStart + 4] || '').trim(),
      nik: String(cols[dataWaliStart + 5] || '').trim(),
    } : null,
    rombel: String(cols[rombelCol] || '').trim(),
    kelas: parseInt(cols[rombelCol]) || 0,
    no_peserta_ujian: String(cols[idxNoPeserta] || '').trim(),
    no_seri_ijazah: String(cols[idxNoIjazah] || '').trim(),
    penerima_kip: String(cols[idxPenerimaKIP] || '').trim(),
    nomor_kip: String(cols[idxNomorKIP] || '').trim(),
    nama_di_kip: String(cols[idxNamaKIP] || '').trim(),
    nomor_kks: String(cols[idxNoKKS] || '').trim(),
    no_reg_akta_lahir: String(cols[idxAktaLahir] || '').trim(),
    bank: String(cols[idxBank] || '').trim(),
    nomor_rekening: String(cols[idxNoRekening] || '').trim(),
    rekening_atas_nama: String(cols[idxRekAtasNama] || '').trim(),
    layak_pip: normalizeLayakPip(cols[idxLayakPIP]),
    alasan_layak_pip: String(cols[idxAlasanPIP] || '').trim(),
    kebutuhan_khusus: String(cols[idxKebutuhanKhusus] || '').trim(),
    sekolah_asal: String(cols[idxSekolahAsal] || '').trim(),
    anak_ke: parseInt(cols[idxAnakKe]) || 0,
    lintang: parseFloat(String(cols[idxLintang] || '0').replace(',', '.')),
    bujur: parseFloat(String(cols[idxBujur] || '0').replace(',', '.')),
    no_kk: String(cols[idxNoKK] || '').trim(),
    berat_badan: parseInt(cols[idxBerat]) || 0,
    tinggi_badan: parseInt(cols[idxTinggi]) || 0,
    lingkar_kepala: parseInt(cols[idxLingkar]) || 0,
    jumlah_saudara: parseInt(cols[idxJmlSaudara]) || 0,
    jarak_rumah_km: parseFloat(String(cols[idxJarak] || '0').replace(',', '.')),
    sekolah: sekolahName,
    jenjang,
  });
}

console.log(`\nRead ${newSiswa.length} students from CSV`);

// ---- Update data-siswa.json ----
const jsonPath = join(root, 'src', 'data', 'data-siswa.json');
const raw = readFileSync(jsonPath, 'utf-8');
let allSiswa = JSON.parse(raw);

const beforeCount = allSiswa.filter(s => s.sekolah === sekolahName).length;
console.log(`Existing records for "${sekolahName}": ${beforeCount}`);

// Remove existing data for this school
allSiswa = allSiswa.filter(s => s.sekolah !== sekolahName);

// Add new data
allSiswa.push(...newSiswa);

// Sort by sekolah then nama
allSiswa.sort((a, b) => a.sekolah.localeCompare(b.sekolah) || a.nama.localeCompare(b.nama));

writeFileSync(jsonPath, JSON.stringify(allSiswa, null, 2), 'utf-8');
console.log(`Updated data-siswa.json: ${beforeCount} removed, ${newSiswa.length} added (total ${allSiswa.length})`);

// ---- Summary ----
const l = newSiswa.filter(s => s.jk === 'L').length;
const p = newSiswa.filter(s => s.jk === 'P').length;
const pipYa = newSiswa.filter(s => s.layak_pip === 'Ya').length;
console.log(`\nSummary for ${sekolahName}:`);
console.log(`  Total: ${newSiswa.length}`);
console.log(`  L: ${l}  P: ${p}`);
console.log(`  Layak PIP: Ya=${pipYa}  Tidak=${newSiswa.length - pipYa}`);
console.log(`\nDone.`);
