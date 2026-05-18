import fs from 'fs';
import path from 'path';

const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src', 'data', 'data-pegawai.json'), 'utf-8'));

// Check if NIP 198303152025212108 exists
const nip = '198303152025212108';
const found = data.find((r: any) => r.nip === nip);
console.log(`NIP ${nip} found:`, !!found);
if (found) console.log(`  nama=${found.nama}, status=${found.status_kepegawaian}`);

// Check a few that were previously updated
const sampleNips = [
  '197606112025212028', // JUNI
  '199905222025212039', // MEIGY IRMA
  '199712112025212060', // SUPRIHATIN
  '199903242025212046', // FARIZIAH
];
let foundCount = 0;
for (const n of sampleNips) {
  const rec = data.find((r: any) => (r.nip || '') === n);
  if (rec) {
    foundCount++;
    console.log(`  ${rec.nama}: ${rec.status_kepegawaian}`);
  }
}
console.log(`All 4 sample NIPs found: ${foundCount === 4}`);

// Count PPPK Paruh Waktu total
const pppkPW = data.filter((r: any) => r.status_kepegawaian === 'PPPK Paruh Waktu').length;
console.log(`Total PPPK Paruh Waktu in data: ${pppkPW}`);
