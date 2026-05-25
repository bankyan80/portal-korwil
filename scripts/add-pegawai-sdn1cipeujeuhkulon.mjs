import { readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

function parseCSV(text) {
  const rows = [];
  let current = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        current.push(field.trim());
        field = '';
      } else if (ch === '\r') {
        // skip
      } else if (ch === '\n') {
        current.push(field.trim());
        field = '';
        if (current.length > 4 && current.filter(c => c).length > 1) {
          rows.push(current);
        }
        current = [];
      } else {
        field += ch;
      }
    }
  }
  if (field || current.length > 0) {
    current.push(field.trim());
    if (current.filter(c => c).length > 1) rows.push(current);
  }
  return rows;
}

function toPegawai(row, sekolah, role) {
  return {
    nik: (row[44] || '').trim(),
    nama: (row[1] || '').trim().toUpperCase(),
    jk: (row[3] || '').trim().toUpperCase(),
    nuptk: (row[2] || '').trim(),
    tanggal_lahir: (row[5] || '').trim(),
    nip: (row[6] || '').trim(),
    status_kepegawaian: (row[7] || '').trim(),
    jenis_ptk: (row[8] || '').trim(),
    tugas_tambahan: (row[20] || '').trim(),
    sertifikasi: '',
    tmt: (row[24] || '').trim(),
    sekolah: sekolah,
    role: role,
  };
}

// Read and parse CSV files
const guruCSV = readFileSync(new URL('../src/data/pegawai-guru-sdn1cipeujeuhkulon.csv', import.meta.url), 'utf-8');
const tendikCSV = readFileSync(new URL('../src/data/pegawai-tendik-sdn1cipeujeuhkulon.csv', import.meta.url), 'utf-8');

const guruRows = parseCSV(guruCSV);
const tendikRows = parseCSV(tendikCSV);

console.log('Guru rows:', guruRows.length);
console.log('Tendik rows:', tendikRows.length);

const sekolah = 'SD NEGERI 1 CIPEUJEUH KULON';

const newPegawai = [
  ...guruRows.map(r => toPegawai(r, sekolah, 'guru')),
  ...tendikRows.map(r => toPegawai(r, sekolah, 'tendik')),
];

console.log('Total new pegawai:', newPegawai.length);

// Check for NIK duplicates
const nikSet = new Set();
const uniqueNew = [];
for (const p of newPegawai) {
  if (!p.nik) {
    console.log('  Skipping (no NIK):', p.nama);
    continue;
  }
  if (nikSet.has(p.nik)) {
    console.log('  Skipping (duplicate in CSV):', p.nama, p.nik);
    continue;
  }
  nikSet.add(p.nik);
  uniqueNew.push(p);
}
console.log('Unique new pegawai:', uniqueNew.length);

// Read existing data
const dataPath = new URL('../src/data/data-pegawai.json', import.meta.url);
const existing = JSON.parse(readFileSync(dataPath, 'utf-8'));
console.log('Existing pegawai:', existing.length);

// Filter out non-duplicates
let added = 0;
let skipped = 0;
for (const p of uniqueNew) {
  if (existing.some(e => e.nik === p.nik)) {
    console.log('  Skipping (exists):', p.nama, p.nik);
    skipped++;
    continue;
  }
  existing.push(p);
  added++;
}

writeFileSync(dataPath, JSON.stringify(existing, null, 2), 'utf-8');
console.log(`\nDone. Added: ${added}, Skipped: ${skipped}`);
console.log(`Total pegawai now: ${existing.length}`);
