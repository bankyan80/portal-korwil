import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src', 'data', 'data-pegawai.json');
const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

// The 49 NIPs from the user list — status_kepegawaian -> "PPPK Paruh Waktu"
const TARGET_NIPS = [
  '198303152025212108', '197605182025212033', '197606112025212028', '199307242025211075',
  '199201012025211199', '199905222025212039', '197902022025212040', '199906292025211051',
  '198007312025211041', '198404022025212090', '199901092025211041', '198503202025211091',
  '199709162025212054', '198709092025212107', '198803092025212064', '199612132025212054',
  '198701242025212055', '197109062025211029', '199411072025212060', '198911112025211114',
  '197006172025211050', '198705272025212081', '199108272025211057', '199302092025211085',
  '199707032025212074', '197510142025211033', '198705102025212104', '199605242025212064',
  '197705092025211048', '199007162025212090', '198912092025212085', '199903242025212046',
  '199306112025212093', '199712112025212060', '199510062025211079', '199711252025211087',
  '198811102025211144', '197310122025211042', '197505112025211053', '197309152025211052',
  '199403102025212080', '200104062025211027', '200301242025211008', '197610132025211042',
  '197505032025211057', '199911152025211031', '197310102025211056', '198507252025212055',
  '198903062025211071',
];

// Also check TK pegawai file
const tkPath = path.join(process.cwd(), 'src', 'data', 'data-pegawai-tk.json');
let tkRaw: any[] = [];
if (fs.existsSync(tkPath)) {
  tkRaw = JSON.parse(fs.readFileSync(tkPath, 'utf-8'));
}

const nipsSet = new Set(TARGET_NIPS);

let updatedSD = 0;
let updatedTK = 0;
let notFound: string[] = [];

// Update SD pegawai
for (const rec of raw) {
  if (rec.nip && nipsSet.has(rec.nip)) {
    const old = rec.status_kepegawaian;
    rec.status_kepegawaian = 'PPPK Paruh Waktu';
    console.log(`[SD] ${rec.nama} (${rec.nip}): ${old} -> PPPK Paruh Waktu`);
    updatedSD++;
  }
}

// Update TK pegawai
for (const rec of tkRaw) {
  if (rec.nip && nipsSet.has(rec.nip)) {
    const old = rec.status_kepegawaian;
    rec.status_kepegawaian = 'PPPK Paruh Waktu';
    console.log(`[TK] ${rec.nama} (${rec.nip}): ${old} -> PPPK Paruh Waktu`);
    updatedTK++;
  }
}

// Find not-found NIPs
for (const nip of TARGET_NIPS) {
  const foundSD = raw.some((r: any) => r.nip === nip);
  const foundTK = tkRaw.some((r: any) => r.nip === nip);
  if (!foundSD && !foundTK) notFound.push(nip);
}

fs.writeFileSync(filePath, JSON.stringify(raw, null, 2), 'utf-8');
fs.writeFileSync(tkPath, JSON.stringify(tkRaw, null, 2), 'utf-8');

console.log(`\nDone. Updated SD: ${updatedSD}, TK: ${updatedTK}, Total: ${updatedSD + updatedTK}`);
if (notFound.length) {
  console.log(`Not found (${notFound.length}):`);
  notFound.forEach(n => console.log(`  ${n}`));
}
