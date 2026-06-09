import { google } from 'googleapis';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHEET_ID = '1m9AhXUZwOvqIl34606fX-Rf4HLjq15ht6n-nCVWHBb4';
const SHEET_NAME = 'simdawa';
const API_BASE = 'https://simdawa.vercel.app/api/siswa';

function loadSA() {
  const paths = [
    join(__dirname, '..', 'service-account', 'kedinasan-e5317-firebase-adminsdk-fbsvc-79852a38b0.json'),
    join(__dirname, '..', 'service-account', 'service-account', 'kedinasan-e5317-firebase-adminsdk-fbsvc-c34b746cde.json'),
  ];
  for (const p of paths) {
    if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf8'));
  }
  const dir = join(__dirname, '..', 'service-account');
  if (existsSync(dir)) {
    const files = readdirSync(dir).filter(f => f.endsWith('.json'));
    if (files.length) return JSON.parse(readFileSync(join(dir, files[0]), 'utf8'));
  }
  throw new Error('Service account not found');
}

function mapKelasToCol(kelas) {
  const map = {
    'Kelas I': { prefix: 'kelas_1', idx: 0 },
    'Kelas II': { prefix: 'kelas_2', idx: 1 },
    'Kelas III': { prefix: 'kelas_3', idx: 2 },
    'Kelas IV': { prefix: 'kelas_4', idx: 3 },
    'Kelas V': { prefix: 'kelas_5', idx: 4 },
    'Kelas VI': { prefix: 'kelas_6', idx: 5 },
  };
  return map[kelas] || null;
}

function mapTKToCol(kelompok) {
  const map = {
    'Kelompok A': { prefix: 'kelompok_a', idx: 0 },
    'Kelompok B': { prefix: 'kelompok_b', idx: 1 },
  };
  return map[kelompok] || null;
}

function mapKBToCol(kelompok) {
  const map = {
    'Kelompok Bermain A': { prefix: 'kb_a', idx: 0 },
    'Kelompok Bermain B': { prefix: 'kb_b', idx: 1 },
    'Kelompok Usia 2-3 Tahun': { prefix: 'usia_2_3', idx: 0 },
    'Kelompok Usia 3-4 Tahun': { prefix: 'usia_3_4', idx: 1 },
    'Kelompok Usia 5-6 Tahun': null,
  };
  return map[kelompok] || null;
}

const HEADERS = [
  'tahun_pelajaran', 'jenjang', 'nama_sekolah', 'npsn',
  'rombel', 'laki_laki', 'perempuan', 'total_siswa',
  'siswa_baru', 'mutasi_masuk', 'mutasi_keluar', 'alumni',
  'terakhir_update',
  'kelas_1_l', 'kelas_1_p', 'kelas_2_l', 'kelas_2_p',
  'kelas_3_l', 'kelas_3_p', 'kelas_4_l', 'kelas_4_p',
  'kelas_5_l', 'kelas_5_p', 'kelas_6_l', 'kelas_6_p',
  'kelompok_a_l', 'kelompok_a_p', 'kelompok_b_l', 'kelompok_b_p',
  'kb_a_l', 'kb_a_p', 'kb_b_l', 'kb_b_p',
  'usia_2_3_l', 'usia_2_3_p', 'usia_3_4_l', 'usia_3_4_p',
];

async function fetchAllStudents() {
  console.log('Fetching students from SIMDAWA API...');
  const all = [];
  let page = 1;
  const limit = 5000;

  while (true) {
    const url = `${API_BASE}?page=${page}&limit=${limit}`;
    const res = await fetch(url);
    const json = await res.json();
    const data = json.siswa || [];
    if (data.length === 0) break;

    for (const s of data) {
      if (s.statusSiswa !== 'Aktif') continue;
      all.push({
        namaSekolah: s.sekolah?.namaSekolah || '',
        npsn: s.sekolah?.npsn || '',
        jenjang: s.jenjang || '',
        kelasKelompok: s.kelasKelompok || '',
        jk: s.jenisKelamin === 'Laki-laki' ? 'L' : 'P',
      });
    }

    console.log(`  Page ${page}: ${data.length} students (${all.length} total active)`);
    if (data.length < limit) break;
    page++;
  }

  console.log(`Total active students fetched: ${all.length}`);
  return all;
}

function aggregate(students) {
  const groups = {};

  for (const s of students) {
    const key = `${s.namaSekolah}|${s.npsn}|${s.jenjang}`;
    if (!groups[key]) {
      groups[key] = {
        namaSekolah: s.namaSekolah,
        npsn: s.npsn,
        jenjang: s.jenjang,
        l: 0,
        p: 0,
        sd: { l: [0, 0, 0, 0, 0, 0], p: [0, 0, 0, 0, 0, 0] },
        tk: { l: [0, 0], p: [0, 0] },
        kb: { l: [0, 0, 0, 0, 0, 0], p: [0, 0, 0, 0, 0, 0] },
      };
    }

    const g = groups[key];
    if (s.jk === 'L') g.l++;
    else g.p++;

    if (s.jenjang === 'SD') {
      const col = mapKelasToCol(s.kelasKelompok);
      if (col) {
        if (s.jk === 'L') g.sd.l[col.idx]++;
        else g.sd.p[col.idx]++;
      }
    } else if (s.jenjang === 'TK') {
      const col = mapTKToCol(s.kelasKelompok);
      if (col) {
        if (s.jk === 'L') g.tk.l[col.idx]++;
        else g.tk.p[col.idx]++;
      }
    } else if (s.jenjang === 'KB') {
      const col = mapKBToCol(s.kelasKelompok);
      if (col) {
        if (s.jk === 'L') g.kb.l[col.idx]++;
        else g.kb.p[col.idx]++;
      }
    }
  }

  return Object.values(groups);
}

function buildRows(aggregated) {
  const today = new Date().toISOString().split('T')[0];
  const rows = [];

  for (const g of aggregated) {
    const row = [
      '2026/2027',
      g.jenjang,
      g.namaSekolah,
      g.npsn,
      0,
      g.l,
      g.p,
      g.l + g.p,
      0, 0, 0, 0,
      today,
    ];

    if (g.jenjang === 'SD') {
      for (let i = 0; i < 6; i++) {
        row.push(g.sd.l[i], g.sd.p[i]);
      }
      row.push('', '', '', '');  
      row.push('', '', '', '', '', ''); 
    } else if (g.jenjang === 'TK') {
      for (let i = 0; i < 6; i++) row.push('');
      row.push(g.tk.l[0], g.tk.p[0], g.tk.l[1], g.tk.p[1]);
      row.push('', '', '', '', '', ''); 
    } else if (g.jenjang === 'KB') {
      for (let i = 0; i < 6; i++) row.push('');
      row.push('', '', '', '');
      row.push(g.kb.l[0], g.kb.p[0], g.kb.l[1], g.kb.p[1], g.kb.l[2], g.kb.p[2]);
    }

    rows.push(row);
  }

  return rows;
}

async function main() {
  console.log('=== SIMDAWA Sync Script ===\n');

  const creds = loadSA();
  console.log('Service account:', creds.client_email);

  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  // Fetch students
  const students = await fetchAllStudents();
  if (students.length === 0) {
    console.log('No students found. Nothing to write.');
    return;
  }

  // Aggregate
  console.log('\nAggregating by school...');
  const aggregated = aggregate(students);
  console.log(`Schools found: ${aggregated.length}`);

  // Print summary
  for (const g of aggregated.sort((a, b) => a.jenjang.localeCompare(b.jenjang) || a.namaSekolah.localeCompare(b.namaSekolah))) {
    console.log(`  ${g.jenjang} | ${g.namaSekolah} (${g.npsn}) | L:${g.l} P:${g.p} Total:${g.l + g.p}`);
  }

  // Build rows
  const rows = buildRows(aggregated);
  console.log(`\nTotal rows to write: ${rows.length}`);

  // Clear & write
  console.log('Clearing sheet...');
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A:AK`,
  });

  console.log('Writing headers and data...');
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [HEADERS, ...rows],
    },
  });

  const totalSiswa = rows.reduce((sum, r) => sum + (r[7] || 0), 0);
  console.log(`\n✅ Done!`);
  console.log(`   ${rows.length} schools synced`);
  console.log(`   ${totalSiswa} total students`);
  console.log(`   Sheet: https://docs.google.com/spreadsheets/d/${SHEET_ID}`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
