import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const DATA_DIR = 'C:/Users/Bank Yan/portal-dinas/data-pegawai';
const BASE_URL = 'https://www.portalkorwil.online';

const schoolRes = await fetch(`${BASE_URL}/api/firestore/schools?limit=100`);
const schools = (await schoolRes.json()).items || [];

function norm(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/kecamatanlemahabang/g, '');
}
const schoolByName = {};
schools.forEach(s => {
  schoolByName[norm(s.namaSekolah)] = s;
});

function getAllFiles(dir) {
  const r = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, item.name);
    if (item.isDirectory()) r.push(...getAllFiles(f));
    else if (item.name.endsWith('.xlsx')) r.push(f);
  }
  return r;
}

function schoolNameFromFile(fn) {
  const n = path.basename(fn);
  let m = n.match(/daftar-(?:guru|tendik)-(.+?)-\d{4}/);
  if (m) return m[1].trim();
  m = n.match(/DAFTAR\s+(?:PENDIDIK|TENAGA KEPENDIDIKAN)_(.+)\.xlsx/);
  if (m) return m[1].trim();
  m = n.match(/daftar-Guru dan Tendik-(.+?)-\w+\d{4}/);
  if (m) return m[1].trim();
  return null;
}

const files = getAllFiles(DATA_DIR);
const bySchool = {};
for (const f of files) {
  const sn = schoolNameFromFile(f);
  if (!sn) { console.log('NO MATCH:', f); continue; }
  (bySchool[sn] = bySchool[sn] || []).push(f);
}

function findSchool(name) {
  const key = norm(name);
  let s = schoolByName[key];
  if (s) return s;
  const clean = key.replace(/kecamatanlemahabang/g, '');
  for (const [k, v] of Object.entries(schoolByName)) {
    if (k.includes(clean) || clean.includes(k)) return v;
  }
  return null;
}

const errors = [], results = [];

for (const [sn, files] of Object.entries(bySchool)) {
  const match = findSchool(sn);
  if (!match) { errors.push(sn); continue; }

  const counts = {
    gk: { pns:0, pppk:0, pppkW:0, nas:0, nam:0, nan:0 },
    tn: { pns:0, pppk:0, pppkW:0, nas:0, nam:0, nan:0 },
  };

  for (const f of files) {
    const wb = XLSX.readFile(f);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    for (let i = 5; i < data.length; i++) {
      const row = data[i];
      if (!row[1] || !row[7]) continue;
      const status = (row[7] + '').toLowerCase();
      const jenis = (row[8] + '').toLowerCase();
      const cat = (jenis.includes('kepala') || jenis.includes('kependidikan')) ? 'tn' : 'gk';
      let key = 'nam';
      if (status.includes('pns')) key = 'pns';
      else if (status.includes('pppk paruh')) key = 'pppkW';
      else if (status.includes('pppk')) key = 'pppk';
      else if (status.includes('serdik')) key = 'nas';
      counts[cat][key]++;
    }
  }
  results.push({ id: match.id, name: match.namaSekolah, counts });
}

console.log('\n=== UPDATING ===');
let ok = 0;
for (const r of results) {
  const c = r.counts;
  const payload = {
    schoolId: r.id, namaSekolah: r.name, tahunPelajaran: '2025/2026',
    jumlahSiswa: 0, jumlahRombel: 0,
    pnsGuruPai:0, pppkGuruPai:0, pppkWGuruPai:0,
    nonAsnSerdikGuruPai:0, nonAsnMurniGuruPai:0, nonAsnNonDapodikGuruPai:0,
    pnsGuruPenjaskes:0, pppkGuruPenjaskes:0, pppkWGuruPenjaskes:0,
    nonAsnSerdikGuruPenjaskes:0, nonAsnMurniGuruPenjaskes:0, nonAsnNonDapodikGuruPenjaskes:0,
    pnsGuruKelas: c.gk.pns, pppkGuruKelas: c.gk.pppk,
    pppkWGuruKelas: c.gk.pppkW,
    nonAsnSerdikGuruKelas: c.gk.nas,
    nonAsnMurniGuruKelas: c.gk.nam,
    nonAsnNonDapodikGuruKelas: c.gk.nan,
    pnsTendik: c.tn.pns,
    nonAsnSerdikTendik: c.tn.nas,
    nonAsnMurniTendik: c.tn.nam,
    nonAsnNonDapodikTendik: c.tn.nan,
  };

  const gr = await fetch(`${BASE_URL}/api/firestore/employee_mappings?field=schoolId&value=${r.id}`);
  const gj = await gr.json();
  const ex = gj.items?.[0] || gj.data;
  if (ex) {
    payload.jumlahSiswa = ex.jumlahSiswa || ex.totalSiswaAktif || 0;
    payload.jumlahRombel = ex.jumlahRombel || 0;
    payload.tahunPelajaran = ex.tahunPelajaran || '2025/2026';
  }

  const pr = await fetch(`${BASE_URL}/api/firestore/employee_mappings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: ex?.id, data: payload, merge: true }),
  });
  const pj = await pr.json();
  if (pj.success) { ok++; console.log('OK', r.id, r.name); }
  else console.log('FAIL', r.id, r.name, pj.error);
}

console.log(`\nUpdated: ${ok}/${results.length}`);
console.log('Unmatched schools from files:', errors.join(', '));
