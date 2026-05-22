/**
 * Add NPSN field to every student record in data-siswa.json
 *
 * Maps school name (from canonical variants) to NPSN from sekolah.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Load sekolah.ts
const sekolahTxt = readFileSync(join(root, 'src', 'data', 'sekolah.ts'), 'utf-8');
const sekolahList = [];
const regex = /nama:\s*'([^']+)',\s*npsn:\s*'([^']+)/g;
let m;
while ((m = regex.exec(sekolahTxt)) !== null) {
  sekolahList.push({ nama: m[1], npsn: m[2] });
}

// Build NPSN map: canonical name -> npsn
const npsnMap = {};
for (const s of sekolahList) {
  npsnMap[s.nama] = s.npsn;
}

// Add canonical variants to map
const canonical = JSON.parse(readFileSync(join(root, 'src', 'data', 'canonical-schools.json'), 'utf-8'));
for (const [jenjang, schools] of Object.entries(canonical)) {
  for (const [canon, variants] of Object.entries(schools)) {
    const npsn = npsnMap[canon];
    if (npsn) {
      for (const v of variants) {
        npsnMap[v] = npsn;
      }
    }
  }
}

// Also add uppercased versions
for (const [key, val] of Object.entries(npsnMap)) {
  npsnMap[key.toUpperCase()] = val;
}

// Load siswa data
const jsonPath = join(root, 'src', 'data', 'data-siswa.json');
const siswa = JSON.parse(readFileSync(jsonPath, 'utf-8'));

console.log(`Total records: ${siswa.length}`);

let added = 0;
let skipped = 0;
let missing = new Set();

for (const s of siswa) {
  const sk = (s.sekolah || '').trim();
  if (!sk) { skipped++; continue; }
  
  const npsn = npsnMap[sk] || npsnMap[sk.toUpperCase()];
  if (npsn) {
    s.npsn = npsn;
    added++;
  } else {
    missing.add(sk);
    skipped++;
  }
}

writeFileSync(jsonPath, JSON.stringify(siswa, null, 2), 'utf-8');
console.log(`Added NPSN: ${added}`);
console.log(`Skipped (no match): ${skipped}`);
console.log(`Missing NPSN for: ${[...missing].join(', ')}`);
