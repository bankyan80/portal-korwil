/**
 * Add npsn field to all pegawai JSON files + verify all school data has NPSN
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Build NPSN map from sekolah.ts
const sekolahTxt = readFileSync(join(root, 'src', 'data', 'sekolah.ts'), 'utf-8');
const sekolahMap = {}; // canonical name -> { npsn, jenjang }
const regex = /nama:\s*'([^']+)',\s*npsn:\s*'([^']+)',\s*nss:\s*'[^']+',\s*status:\s*'[^']+',\s*akreditasi:\s*'[^']+',\s*address:\s*'[^']+',\s*desa:\s*'[^']+',\s*jenjang:\s*'([^']+)/g;
let m;
while ((m = regex.exec(sekolahTxt)) !== null) {
  sekolahMap[m[1]] = { npsn: m[2], jenjang: m[3] };
}

// Load canonical
const canonical = JSON.parse(readFileSync(join(root, 'src', 'data', 'canonical-schools.json'), 'utf-8'));
const allVariants = {}; // variant -> { npsn, jenjang, canonical }
for (const [jenjang, schools] of Object.entries(canonical)) {
  for (const [canon, variants] of Object.entries(schools)) {
    const info = sekolahMap[canon];
    if (!info) { console.warn(`No NPSN for canonical: ${canon}`); continue; }
    for (const v of [canon, ...variants]) {
      allVariants[v.toUpperCase()] = { npsn: info.npsn, jenjang: info.jenjang, canonical: canon };
    }
  }
}

function getNpsn(sekolahName) {
  if (!sekolahName) return null;
  const info = sekolahMap[sekolahName];
  if (info) return info.npsn;
  const v = allVariants[sekolahName.toUpperCase()];
  if (v) return v.npsn;
  return null;
}

function getCanonical(sekolahName) {
  if (!sekolahName) return null;
  if (sekolahMap[sekolahName]) return sekolahName;
  const v = allVariants[sekolahName.toUpperCase()];
  return v ? v.canonical : null;
}

function getJenjang(sekolahName) {
  if (!sekolahName) return null;
  const info = sekolahMap[sekolahName];
  if (info) return info.jenjang;
  const v = allVariants[sekolahName.toUpperCase()];
  return v ? v.jenjang : null;
}

// ---- 1. Add NPSN to data-pegawai.json ----
console.log('\n=== data-pegawai.json ===');
const pegawai = JSON.parse(readFileSync(join(root, 'src', 'data', 'data-pegawai.json'), 'utf-8'));
let pAdded = 0, pMissing = 0, pMissingSet = new Set();
for (const p of pegawai) {
  const npsn = getNpsn(p.sekolah);
  if (npsn) { p.npsn = npsn; p.jenjang = getJenjang(p.sekolah); pAdded++; }
  else { pMissing++; pMissingSet.add(p.sekolah); }
}
writeFileSync(join(root, 'src', 'data', 'data-pegawai.json'), JSON.stringify(pegawai, null, 2), 'utf-8');
console.log(`Added NPSN: ${pAdded}, Missing: ${pMissing}`);
if (pMissingSet.size) console.log('  Missing sekolah:', [...pMissingSet]);

// ---- 2. Add NPSN to data-pegawai-tk.json ----
console.log('\n=== data-pegawai-tk.json ===');
const pegawaiTk = JSON.parse(readFileSync(join(root, 'src', 'data', 'data-pegawai-tk.json'), 'utf-8'));
let ptAdded = 0, ptMissing = 0, ptMissingSet = new Set();
for (const p of pegawaiTk) {
  const npsn = getNpsn(p.sekolah);
  if (npsn) { p.npsn = npsn; p.jenjang = getJenjang(p.sekolah); ptAdded++; }
  else { ptMissing++; ptMissingSet.add(p.sekolah); }
}
writeFileSync(join(root, 'src', 'data', 'data-pegawai-tk.json'), JSON.stringify(pegawaiTk, null, 2), 'utf-8');
console.log(`Added NPSN: ${ptAdded}, Missing: ${ptMissing}`);
if (ptMissingSet.size) console.log('  Missing sekolah:', [...ptMissingSet]);

// ---- 3. Add NPSN to tk-gelatik-pegawai.json ----
console.log('\n=== tk-gelatik-pegawai.json ===');
try {
  const gelatik = JSON.parse(readFileSync(join(root, 'src', 'data', 'tk-gelatik-pegawai.json'), 'utf-8'));
  let gAdded = 0, gMissing = 0, gMissingSet = new Set();
  for (const p of gelatik) {
    const npsn = getNpsn(p.sekolah);
    if (npsn) { p.npsn = npsn; p.jenjang = getJenjang(p.sekolah); gAdded++; }
    else { gMissing++; gMissingSet.add(p.sekolah); }
  }
  writeFileSync(join(root, 'src', 'data', 'tk-gelatik-pegawai.json'), JSON.stringify(gelatik, null, 2), 'utf-8');
  console.log(`Added NPSN: ${gAdded}, Missing: ${gMissing}`);
  if (gMissingSet.size) console.log('  Missing sekolah:', [...gMissingSet]);
} catch(e) { console.log('  File not found or error:', e.message); }

console.log('\nDone.');
