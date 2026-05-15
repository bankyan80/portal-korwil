/**
 * Sync student data from Dapodik Excel export to data-siswa.json
 *
 * Usage:
 *   node scripts/sync-from-excel.mjs <xlsx-path> <sekolah-name> [jenjang]
 *
 * Example:
 *   node scripts/sync-from-excel.mjs "C:/path/to/file.xlsx" "SD NEGERI 1 LEMAHABANG" SD
 *
 * The Excel must be a standard Dapodik export (header row with "Nama", "JK", "NIK", etc.)
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ---- CLI args ----
const xlsxPath = process.argv[2];
const sekolahName = process.argv[3];
const jenjang = process.argv[4] || 'SD';

if (!xlsxPath || !sekolahName) {
  console.error('Usage: node scripts/sync-from-excel.mjs <xlsx-path> <sekolah-name> [jenjang]');
  process.exit(1);
}

// ---- Read Excel ----
import XLSX from 'xlsx';
const wb = XLSX.readFile(xlsxPath);
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

// Find header row
let hdrRow = -1;
for (let i = 0; i < rows.length; i++) {
  if (rows[i] && rows[i][0] === 'No' && rows[i][1] === 'Nama') { hdrRow = i; break; }
}
if (hdrRow < 0) { console.error('Header row not found'); process.exit(1); }

const hdr = rows[hdrRow];
const colIdx = (name) => hdr.indexOf(name);

const idxNama = colIdx('Nama');
const idxJK = colIdx('JK');
const idxNISN = colIdx('NISN');
const idxTglLahir = colIdx('Tanggal Lahir');
const idxNIK = colIdx('NIK');
const idxKelurahan = colIdx('Kelurahan');
const idxLayakPIP = colIdx('Layak PIP (usulan dari sekolah)');

if (idxNama < 0 || idxJK < 0 || idxNIK < 0) {
  console.error('Required columns (Nama, JK, NIK) not found in header');
  process.exit(1);
}

// Normalize desa name: remove "Desa/Kel. " prefix
function normalizeDesa(val) {
  if (!val) return '';
  return String(val).replace(/^Desa\/Kel\.\s*/i, '').trim();
}

// Normalize layak_pip
function normalizeLayakPip(val) {
  if (!val) return 'Tidak';
  const v = String(val).trim().toLowerCase();
  if (v === 'ya' || v === 'y' || v === '1') return 'Ya';
  return 'Tidak';
}

// Parse date to YYYY-MM-DD
function parseDate(val) {
  if (!val) return '';
  const v = String(val).trim();
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v;
  // DD-MM-YYYY or DD/MM/YYYY
  const m = v.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  return v;
}

// Extract students from Excel
const newSiswa = [];
for (let i = hdrRow + 1; i < rows.length; i++) {
  const row = rows[i];
  if (!row || !row[0]) continue;
  if (isNaN(parseInt(row[0]))) continue;
  const nik = String(row[idxNIK] || '').trim();
  if (!nik) continue;
  newSiswa.push({
    nik,
    nama: String(row[idxNama] || '').trim(),
    jk: String(row[idxJK] || '').trim().toUpperCase(),
    nisn: String(row[idxNISN] || '').trim(),
    tanggal_lahir: parseDate(row[idxTglLahir]),
    sekolah: sekolahName,
    jenjang,
    desa: normalizeDesa(row[idxKelurahan]),
    layak_pip: normalizeLayakPip(row[idxLayakPIP]),
  });
}

console.log(`\nRead ${newSiswa.length} students from Excel`);

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
const pipYa = newSiswa.filter(s => s.layak_pip === 'Ya').length;
const pipTidak = newSiswa.filter(s => s.layak_pip === 'Tidak').length;
console.log(`\nSummary for ${sekolahName}:`);
console.log(`  Total: ${newSiswa.length}`);
console.log(`  L: ${newSiswa.filter(s => s.jk === 'L').length}  P: ${newSiswa.filter(s => s.jk === 'P').length}`);
console.log(`  Layak PIP: Ya=${pipYa}  Tidak=${pipTidak}`);
console.log(`\nDone.`);
