import { readFileSync, writeFileSync } from 'fs';

function parseCSV(text) {
  const rows = [];
  let current = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else { field += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { current.push(field.trim()); field = ''; }
      else if (ch === '\r') { }
      else if (ch === '\n') {
        current.push(field.trim()); field = '';
        if (current.length > 4 && current.filter(c => c).length > 1) rows.push(current);
        current = [];
      } else { field += ch; }
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

const sekolah = 'SD NEGERI 3 SIGONG';

// Process both CSVs
const files = [
  { path: '../src/data/pegawai-guru-sdn3sigong.csv', role: 'guru' },
  { path: '../src/data/pegawai-tendik-sdn3sigong.csv', role: 'tendik' },
];

const allNew = [];
for (const f of files) {
  const csv = readFileSync(new URL(f.path, import.meta.url), 'utf-8');
  const rows = parseCSV(csv);
  const items = rows.map(r => toPegawai(r, sekolah, f.role));
  console.log(`${f.role}: ${rows.length} rows, ${items.length} items`);

  // Filter by valid NIK
  for (const p of items) {
    if (!p.nik) { console.log('  Skip (no NIK):', p.nama); continue; }
    if (allNew.some(x => x.nik === p.nik)) { console.log('  Skip (dup):', p.nama); continue; }
    allNew.push(p);
  }
}

console.log(`\nTotal new: ${allNew.length}`);

// Merge into existing data
const dataPath = new URL('../src/data/data-pegawai.json', import.meta.url);
const existing = JSON.parse(readFileSync(dataPath, 'utf-8'));
console.log(`Existing: ${existing.length}`);

let added = 0;
for (const p of allNew) {
  if (existing.some(e => e.nik === p.nik)) {
    console.log('  Exists:', p.nama, p.nik);
    continue;
  }
  existing.push(p);
  added++;
}

writeFileSync(dataPath, JSON.stringify(existing, null, 2), 'utf-8');
console.log(`\nDone. Added: ${added}, Total: ${existing.length}`);
