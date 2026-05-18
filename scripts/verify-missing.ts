import fs from 'fs';
import path from 'path';

const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src', 'data', 'data-pegawai.json'), 'utf-8'));

// The 19 not-found NIPs
const missing = [
  '198303152025212108', // CARWINAH
  '197605182025212033', // SRI NURCHAENI
  '198007312025211041', // ENDANG KASMARA
  '198404022025212090', // SITI SOLAEHA
  '198503202025211091', // GOFUR
  '198803092025212064', // MARTININGSIH
  '198701242025212055', // SITI NURLAELASARI
  '197109062025211029', // IMANURDIN
  '198911112025211114', // AZI PURNAMA
  '197006172025211050', // EEN SUNARYA
  '199108272025211057', // SAEFUL ALIM
  '199302092025211085', // DIYAN HIDAYAT
  '197510142025211033', // ADANG MAULANA
  '198811102025211144', // AGUS MAULANA
  '197310122025211042', // NANA JUNAEDI
  '197309152025211052', // WACHYUDIN
  '199403102025212080', // MERTYANI RAHAYU
  '200104062025211027', // FAJAR SIDIK
  '197610132025211042', // SUNANDAR
];

// Also check names
const missingNames = [
  'CARWINAH', 'SRI NURCHAENI', 'ENDANG KASMARA', 'SITI SOLAEHA', 'GOFUR',
  'MARTININGSIH', 'SITI NURLAELASARI', 'IMANURDIN', 'AZI PURNAMA', 'EEN SUNARYA',
  'SAEFUL ALIM', 'DIYAN HIDAYAT', 'ADANG MAULANA', 'AGUS MAULANA', 'NANA JUNAEDI',
  'WACHYUDIN', 'MERTYANI RAHAYU', 'FAJAR SIDIK', 'SUNANDAR',
];

let foundByNip = 0;
for (const n of missing) {
  const r = data.find((r: any) => (r.nip || '') === n);
  if (r) {
    foundByNip++;
    console.log(`[NIP] ${r.nama}: ${r.status_kepegawaian}`);
  }
}

let foundByName = 0;
for (const n of missingNames) {
  const up = n.toUpperCase().replace(/\s+/g, ' ');
  const r = data.find((r: any) => (r.nama || '').toUpperCase().replace(/\s+/g, ' ') === up);
  if (r) {
    foundByName++;
    console.log(`[NAME] ${r.nama}: NIP="${r.nip || '(empty)'}", status=${r.status_kepegawaian}`);
  }
}

console.log(`\nBy NIP: ${foundByNip}/${missing.length}`);
console.log(`By NAME: ${foundByName}/${missingNames.length}`);
console.log(`Total in data: ${data.length}`);
console.log(`PPPK Paruh Waktu: ${data.filter((r: any) => r.status_kepegawaian === 'PPPK Paruh Waktu').length}`);
