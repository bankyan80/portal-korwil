import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { google } = require('googleapis');

const ROOT = process.cwd();
const SPREADSHEET_ID = '1v4jy1VNM9xNCLMa_B3xr-jOlayBNBDILptN_nxKT2sc';

const SA_DIR = join(ROOT, 'service-account');
const SA_FILE = readdirSync(SA_DIR).find(f => f.endsWith('.json'));
const creds = JSON.parse(readFileSync(join(SA_DIR, SA_FILE), 'utf-8'));

const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
const sheets = google.sheets({ version: 'v4', auth });

const DATA = join(ROOT, 'src/data');

async function writeSheet(sheetName, headers, rows) {
  const values = [headers, ...rows];
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });
  console.log(`  ${sheetName}: ${rows.length} baris`);
}

async function main() {
  const pegawai = JSON.parse(readFileSync(join(DATA, 'data-pegawai.json'), 'utf-8'));
  const pegHeaders = ['nik','nama','nuptk','jk','tempat_lahir','tanggal_lahir','nip','status_kepegawaian','jenis_ptk','agama','tugas_tambahan','sertifikasi','tmt','sekolah','role'];
  const pegRows = pegawai.map(p => pegHeaders.map(h => p[h] || ''));
  await writeSheet('data_pegawai', pegHeaders.map(h => h.toUpperCase()), pegRows);

  const siswa = JSON.parse(readFileSync(join(DATA, 'data-siswa.json'), 'utf-8'));
  const sisHeaders = ['nik','nama','nisn','jk','tempat_lahir','tanggal_lahir','agama','alamat','kelas','rombel','sekolah','jenjang'];
  const sisRows = siswa.map(s => sisHeaders.map(h => s[h] || ''));
  await writeSheet('data_siswa', sisHeaders.map(h => h.toUpperCase()), sisRows);

  console.log('\n✅ Import selesai!');
}

main().catch(e => console.error(e));
