import { google } from 'googleapis';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SHEET_ID = '1m9AhXUZwOvqIl34606fX-Rf4HLjq15ht6n-nCVWHBb4';
const SHEET_NAME = 'simdawa';

function findSA() {
  const paths = [
    join(__dirname, '..', 'service-account', 'kedinasan-e5317-firebase-adminsdk-fbsvc-79852a38b0.json'),
    join(__dirname, '..', 'service-account', 'service-account', 'kedinasan-e5317-firebase-adminsdk-fbsvc-c34b746cde.json'),
  ];
  for (const p of paths) {
    if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf8'));
  }
  throw new Error('Service account file not found');
}

async function main() {
  const creds = findSA();
  console.log('Service account:', creds.client_email);
  console.log('Spreadsheet ID:', SHEET_ID);

  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // 1. Check existing sheets
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
    fields: 'sheets.properties',
  });
  const existing = (meta.data.sheets || []).map((s) => s.properties?.title);
  console.log('Existing sheets:', existing);

  // 2. Check if simdawa sheet exists
  if (!existing.includes(SHEET_NAME)) {
    console.log(`Creating sheet "${SHEET_NAME}"...`);
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: SHEET_NAME } } }],
      },
    });
    console.log('Sheet created.');
  } else {
    console.log(`Sheet "${SHEET_NAME}" already exists.`);
  }

  // 3. Headers
  const headers = [
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

  // 4. Sample data - SD
  const rows = [
    ['2026/2027', 'SD', 'SD Negeri 1 Lemahabang', '20215162', 6, 120, 115, 235, 35, 2, 1, 40, '2026-07-01',
     20, 18, 19, 20, 21, 18, 20, 19, 18, 21, 22, 19,
     '', '', '', '', '', '', '', '', '', '', '', ''],
    ['2026/2027', 'SD', 'SD Negeri 2 Lemahabang', '20214656', 6, 130, 125, 255, 38, 1, 2, 42, '2026-07-01',
     22, 20, 21, 22, 23, 20, 22, 21, 20, 22, 22, 20,
     '', '', '', '', '', '', '', '', '', '', '', ''],
    ['2026/2027', 'SD', 'SD Negeri 1 Lemahabang Kulon', '20215161', 6, 98, 94, 192, 30, 1, 0, 35, '2026-07-01',
     16, 15, 17, 16, 18, 15, 16, 17, 15, 16, 18, 15,
     '', '', '', '', '', '', '', '', '', '', '', ''],
    ['2026/2027', 'SD', 'SD Negeri 1 Asem', '20215216', 6, 95, 91, 186, 28, 0, 1, 32, '2026-07-01',
     15, 14, 16, 15, 17, 14, 15, 16, 14, 15, 17, 14,
     '', '', '', '', '', '', '', '', '', '', '', ''],
    ['2026/2027', 'TK', 'TK Negeri Pembina Lemahabang', '', 4, 45, 48, 93, 30, 0, 0, 0, '2026-07-01',
     '', '', '', '', '', '', '', '', '', '', '', '',
     22, 24, 23, 24, '', '', '', '', '', '', '', ''],
    ['2026/2027', 'TK', 'TK Pertiwi Lemahabang', '', 2, 22, 20, 42, 14, 0, 0, 0, '2026-07-01',
     '', '', '', '', '', '', '', '', '', '', '', '',
     12, 10, 10, 10, '', '', '', '', '', '', '', ''],
    ['2026/2027', 'KB', 'KB Melati Jaya', '', 2, 15, 18, 33, 12, 0, 0, 0, '2026-07-01',
     '', '', '', '', '', '', '', '', '', '', '', '',
     '', '', '', '',
     5, 6, 5, 6, 2, 3, 3, 3],
    ['2026/2027', 'KB', 'KB Bina Bangsa', '', 2, 14, 16, 30, 10, 0, 0, 0, '2026-07-01',
     '', '', '', '', '', '', '', '', '', '', '', '',
     '', '', '', '',
     4, 5, 5, 5, 3, 3, 2, 3],
  ];

  // 5. Clear existing data and write new data
  console.log('Writing headers and data...');
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A1:AK1000`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [headers, ...rows],
    },
  });

  console.log(`Done! Wrote ${rows.length} rows to sheet "${SHEET_NAME}".`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
