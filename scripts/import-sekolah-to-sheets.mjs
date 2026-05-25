import { google } from 'googleapis';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHEET_ID = process.argv[2] || process.env.GOOGLE_SHEET_ID;
if (!SHEET_ID) { console.error('Usage: node scripts/import-sekolah-to-sheets.mjs <SHEET_ID>'); process.exit(1); }

const saDir = join(__dirname, '..', 'service-account');
const files = readdirSync(saDir).filter(f => f.endsWith('.json'));
if (!files.length) { console.error('No service account found'); process.exit(1); }
const creds = JSON.parse(readFileSync(join(saDir, files[0]), 'utf-8'));
const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
const sheets = google.sheets({ version: 'v4', auth });

// Data sekolah langsung (copy dari src/data/sekolah.ts)
const sekolahSD = [
  { nama: 'SD NEGERI 1 ASEM', npsn: '20215216', nss: '101021706002', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Abdurachman Saleh No. 328, Asem', desa: 'ASEM', jenjang: 'SD', dayaTampung: 40 },
  { nama: 'SD NEGERI 1 BELAWA', npsn: '20215230', nss: '101021706025', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Cikuya 1, Belawa', desa: 'BELAWA', jenjang: 'SD', dayaTampung: 80 },
  { nama: 'SD NEGERI 2 BELAWA', npsn: '20215564', nss: '101021706026', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Inpres Blok A, Belawa', desa: 'BELAWA', jenjang: 'SD', dayaTampung: 80 },
  { nama: 'SD NEGERI 1 CIPEUJEUH KULON', npsn: '20215287', nss: '101021706004', status: 'NEGERI', akreditasi: 'B', address: 'Jl. K.H. Hasyim Asyari No. 07, Cipeujeuh Kulon', desa: 'CIPEUJEUH KULON', jenjang: 'SD', dayaTampung: 80 },
  { nama: 'SD NEGERI 2 CIPEUJEUH KULON', npsn: '20215381', nss: '101021706005', status: 'NEGERI', akreditasi: 'A', address: 'Jl. KH. Hasyim Asyari No. 500, Cipeujeuh Kulon', desa: 'CIPEUJEUH KULON', jenjang: 'SD', dayaTampung: 60 },
  { nama: 'SD NEGERI 1 CIPEUJEUH WETAN', npsn: '20215286', nss: '101021706007', status: 'NEGERI', akreditasi: 'A', address: 'Jl. MT. Haryono No. 62, Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN', jenjang: 'SD', dayaTampung: 80 },
  { nama: 'SD NEGERI 2 CIPEUJEUH WETAN', npsn: '20215380', nss: '101021706008', status: 'NEGERI', akreditasi: 'A', address: 'Jl. MT. Haryono No. 3B, Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN', jenjang: 'SD', dayaTampung: 40 },
  { nama: 'SD NEGERI 1 CIGADUNG', npsn: '20215288', nss: '101021706009', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Cigadung 1, Cigadung', desa: 'CIGADUNG', jenjang: 'SD', dayaTampung: 80 },
  { nama: 'SD NEGERI 2 CIGADUNG', npsn: '20215550', nss: '101021706010', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Cigadung, Desa Cigadung', desa: 'CIGADUNG', jenjang: 'SD', dayaTampung: 80 },
  { nama: 'SD NEGERI 1 CINYUSRAGAN', npsn: '20215304', nss: '101021706011', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Cinyusragan, Cinyusragan', desa: 'CINYUSRAGAN', jenjang: 'SD', dayaTampung: 80 },
  { nama: 'SD NEGERI 2 CINYUSRAGAN', npsn: '20215561', nss: '101021706023', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Cinyusragan No. 52, Cinyusragan', desa: 'CINYUSRAGAN', jenjang: 'SD', dayaTampung: 80 },
  { nama: 'SD NEGERI 1 KARANGANYAR', npsn: '20215306', nss: '101021706013', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Raya Karanganyar, Karanganyar', desa: 'KARANGANYAR', jenjang: 'SD', dayaTampung: 80 },
  { nama: 'SD NEGERI 2 KARANGANYAR', npsn: '20215294', nss: '101021706014', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Karanganyar No. 1, Karanganyar', desa: 'KARANGANYAR', jenjang: 'SD', dayaTampung: 40 },
  { nama: 'SD NEGERI 1 LEMAHABANG', npsn: '20215307', nss: '101021706015', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Raya Lemahabang No. 352, Lemahabang', desa: 'LEMAHABANG', jenjang: 'SD', dayaTampung: 80 },
  { nama: 'SD NEGERI 2 LEMAHABANG', npsn: '20215310', nss: '101021706016', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Raya Lemahabang, Lemahabang', desa: 'LEMAHABANG', jenjang: 'SD', dayaTampung: 80 },
  { nama: 'SD NEGERI 1 SINDANGLAYA', npsn: '20215562', nss: '101021706019', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Sindanglaya, Sindanglaya', desa: 'SINDANGLAYA', jenjang: 'SD', dayaTampung: 80 },
  { nama: 'SD NEGERI 2 SINDANGLAYA', npsn: '20215563', nss: '101021706020', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Sindanglaya No. 23, Sindanglaya', desa: 'SINDANGLAYA', jenjang: 'SD', dayaTampung: 60 },
  { nama: 'SD NEGERI 1 SIGONG', npsn: '20215312', nss: '101021706021', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Sigong-Acib, Sigong', desa: 'SIGONG', jenjang: 'SD', dayaTampung: 80 },
  { nama: 'SD NEGERI 2 SIGONG', npsn: '20215313', nss: '101021706022', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Sigong-Acib, Sigong', desa: 'SIGONG', jenjang: 'SD', dayaTampung: 60 },
  { nama: 'SD NEGERI 3 SIGONG', npsn: '20215311', nss: '101021706042', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Sigong-Acib No. 100, Sigong', desa: 'SIGONG', jenjang: 'SD', dayaTampung: 80 },
  { nama: 'SD NEGERI 1 CIKELENG', npsn: '20215308', nss: '101021706017', status: 'NEGERI', akreditasi: 'A', address: 'Ds. Cikeleng, Cikeleng', desa: 'CIKELENG', jenjang: 'SD', dayaTampung: 80 },
  { nama: 'SD NEGERI 2 CIKELENG', npsn: '20215309', nss: '101021706018', status: 'NEGERI', akreditasi: 'A', address: 'Ds. Cikeleng, Cikeleng', desa: 'CIKELENG', jenjang: 'SD', dayaTampung: 80 },
];

const sekolahTK = [
  { nama: 'TK NEGERI LEMAHABANG', npsn: '69954955', nss: '001021706051', status: 'NEGERI', akreditasi: '-', address: 'Jl. Raya Lemahabang', desa: 'LEMAHABANG', jenjang: 'TK', dayaTampung: 0 },
  { nama: 'TK PERTIWI', npsn: '20215565', nss: '002021706001', status: 'NEGERI', akreditasi: '-', address: 'Jl. Raya Lemahabang', desa: 'LEMAHABANG', jenjang: 'TK', dayaTampung: 0 },
  { nama: 'TK AL-AQSO', npsn: '69965576', nss: '003021706052', status: 'SWASTA', akreditasi: '-', address: 'Jl. Raya Lemahabang', desa: 'LEMAHABANG', jenjang: 'TK', dayaTampung: 0 },
  { nama: 'TK AISYIYAH LEMAHABANG', npsn: '69965577', nss: '004021706053', status: 'SWASTA', akreditasi: '-', address: 'Jl. Raya Lemahabang', desa: 'LEMAHABANG', jenjang: 'TK', dayaTampung: 0 },
  { nama: 'TK AL-IRSYAD AL-ISLAMIYYAH', npsn: '69965578', nss: '005021706054', status: 'SWASTA', akreditasi: '-', address: 'Jl. Raya Lemahabang', desa: 'LEMAHABANG', jenjang: 'TK', dayaTampung: 0 },
  { nama: 'TK BPP KENANGA', npsn: '69965579', nss: '006021706055', status: 'SWASTA', akreditasi: '-', address: 'Perum BPP Kenanga', desa: 'CIPEUEUH KULON', jenjang: 'TK', dayaTampung: 0 },
  { nama: 'TK GELATIK', npsn: '69965580', nss: '007021706056', status: 'SWASTA', akreditasi: '-', address: 'Perum IKIP', desa: 'LEMAHABANG', jenjang: 'TK', dayaTampung: 0 },
  { nama: 'TK MELATI', npsn: '69965581', nss: '008021706057', status: 'SWASTA', akreditasi: '-', address: 'Perum IKIP', desa: 'LEMAHABANG', jenjang: 'TK', dayaTampung: 0 },
  { nama: 'TK MUSLIMAT NU', npsn: '69965582', nss: '009021706058', status: 'SWASTA', akreditasi: '-', address: 'Perum IKIP', desa: 'LEMAHABANG', jenjang: 'TK', dayaTampung: 0 },
];

const sekolahKB = [
  { nama: 'KB AL-HIDAYAH', npsn: '69973191', status: 'SWASTA', akreditasi: '-', address: 'Ds. Cinyusragan', desa: 'CINYUSRAGAN', jenjang: 'KB', dayaTampung: 0 },
  { nama: 'KB AL-IKHLAS', npsn: '69973190', status: 'SWASTA', akreditasi: '-', address: 'Ds. Cigadung', desa: 'CIGADUNG', jenjang: 'KB', dayaTampung: 0 },
  { nama: 'KB AL-JANNAH', npsn: '69965583', status: 'SWASTA', akreditasi: '-', address: 'Perum IKIP', desa: 'LEMAHABANG', jenjang: 'KB', dayaTampung: 0 },
  { nama: 'KB BAITURRAHMAN', npsn: '69944644', status: 'SWASTA', akreditasi: '-', address: 'Ds. Sindanglaya', desa: 'SINDANGLAYA', jenjang: 'KB', dayaTampung: 0 },
  { nama: 'KB BINA INSANI', npsn: '69973187', status: 'SWASTA', akreditasi: '-', address: 'Perum IKIP', desa: 'LEMAHABANG', jenjang: 'KB', dayaTampung: 0 },
  { nama: 'KB HARAPAN BANGSA', npsn: '69973188', status: 'SWASTA', akreditasi: '-', address: 'Ds. Lemahabang', desa: 'LEMAHABANG', jenjang: 'KB', dayaTampung: 0 },
  { nama: 'KB MEKAR SARI', npsn: '69944641', status: 'SWASTA', akreditasi: '-', address: 'Ds. Karanganyar', desa: 'KARANGANYAR', jenjang: 'KB', dayaTampung: 0 },
  { nama: 'KB NURUL HUDA', npsn: '69944642', status: 'SWASTA', akreditasi: '-', address: 'Ds. Sigong', desa: 'SIGONG', jenjang: 'KB', dayaTampung: 0 },
  { nama: 'KB NURUL IMAN', npsn: '69944643', status: 'SWASTA', akreditasi: '-', address: 'Ds. Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN', jenjang: 'KB', dayaTampung: 0 },
  { nama: 'KB PERMATA BUNDA', npsn: '70005263', status: 'SWASTA', akreditasi: '-', address: 'Perum IKIP', desa: 'LEMAHABANG', jenjang: 'KB', dayaTampung: 0 },
  { nama: 'KB RAUDHATUL JANNAH', npsn: '69965584', status: 'SWASTA', akreditasi: '-', address: 'Ds. Asem', desa: 'ASEM', jenjang: 'KB', dayaTampung: 0 },
  { nama: 'KB TUNAS BANGSA', npsn: '69965585', status: 'SWASTA', akreditasi: '-', address: 'Perum Taman Sari', desa: 'BELASARI', jenjang: 'KB', dayaTampung: 0 },
  { nama: 'PAUD AL-HIDAYAH 2', npsn: '69965586', status: 'SWASTA', akreditasi: '-', address: 'Ds. Cinyusragan', desa: 'CINYUSRAGAN', jenjang: 'KB', dayaTampung: 0 },
  { nama: 'PAUD AL-HIDAYAH 3', npsn: '69965587', status: 'SWASTA', akreditasi: '-', address: 'Ds. Cinyusragan', desa: 'CINYUSRAGAN', jenjang: 'KB', dayaTampung: 0 },
  { nama: 'PAUD AL-HIDAYAH 4', npsn: '69965588', status: 'SWASTA', akreditasi: '-', address: 'Ds. Cinyusragan', desa: 'CINYUSRAGAN', jenjang: 'KB', dayaTampung: 0 },
];

async function main() {
  const allSchools = [...sekolahSD, ...sekolahTK, ...sekolahKB];
  const headers = ['nama', 'npsn', 'nss', 'status', 'akreditasi', 'address', 'desa', 'jenjang', 'dayaTampung'];
  const rows = allSchools.map(s => headers.map(h => String(s[h] || '')));

  await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: 'data_sekolah!A:Z' });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID, range: 'data_sekolah!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [headers, ...rows] },
  });

  console.log(`✅ ${allSchools.length} sekolah diimport ke data_sekolah`);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
