import { readFileSync, writeFileSync } from 'fs';

function parseCSV(text) {
  const rows = [];
  let cur = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i+1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { cur.push(f.trim()); f = ''; }
    else if (c === '\r') {}
    else if (c === '\n') {
      cur.push(f.trim()); f = '';
      if (cur.length > 4 && cur.filter(x => x).length > 1) rows.push(cur);
      cur = [];
    } else f += c;
  }
  if (f || cur.length) {
    cur.push(f.trim());
    if (cur.filter(x => x).length > 1) rows.push(cur);
  }
  return rows;
}

function toPegawai(row, sekolah, role) {
  return {
    nik: (row[44]||'').trim(), nama: (row[1]||'').trim().toUpperCase(),
    jk: (row[3]||'').trim().toUpperCase(), nuptk: (row[2]||'').trim(),
    tanggal_lahir: (row[5]||'').trim(), nip: (row[6]||'').trim(),
    status_kepegawaian: (row[7]||'').trim(), jenis_ptk: (row[8]||'').trim(),
    tugas_tambahan: (row[20]||'').trim(), sertifikasi: '', tmt: (row[24]||'').trim(),
    sekolah, role,
  };
}

const sekolah = 'TK NEGERI LEMAHABANG';
const files = [
  { path: '../src/data/pegawai-guru-tknegerilemahabang.csv', role: 'guru' },
  { path: '../src/data/pegawai-tendik-tknegerilemahabang.csv', role: 'tendik' },
];

const all = [];
for (const f of files) {
  const csv = readFileSync(new URL(f.path, import.meta.url), 'utf-8');
  const rows = parseCSV(csv);
  for (const r of rows) {
    const p = toPegawai(r, sekolah, f.role);
    if (!p.nik) continue;
    if (all.some(x => x.nik === p.nik)) continue;
    all.push(p);
  }
  console.log(`${f.role}: ${rows.length} rows -> ${all.filter(x => x.role === f.role).length} valid`);
}

const dataPath = new URL('../src/data/data-pegawai.json', import.meta.url);
const existing = JSON.parse(readFileSync(dataPath, 'utf-8'));
let added = 0;
for (const p of all) {
  if (existing.some(e => e.nik === p.nik)) { console.log(`  Exists: ${p.nama}`); continue; }
  existing.push(p); added++;
}
writeFileSync(dataPath, JSON.stringify(existing, null, 2), 'utf-8');
console.log(`\nAdded: ${added}, Total: ${existing.length}`);
