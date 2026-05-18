import fs from 'fs';
import path from 'path';

const pegawai: any[] = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'src', 'data', 'data-pegawai.json'), 'utf-8')
);
let tkPegawai = [];
try { tkPegawai = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src', 'data', 'data-pegawai-tk.json'), 'utf-8')); } catch (_) {}

const allPegawai = [...pegawai, ...tkPegawai];

// 49 names from assignment (normalize for matching)
const targets = [
  'CARWINAH', 'SRI NURCHAENI', 'JUNI', 'SHEPTA', 'HERI KUSWANTO',
  'MEIGY IRMA OKTAVERINA', 'KARYATI', 'ADE SETIA MAULANA', 'ENDANG KASMARA',
  'SITI SOLAEHA', 'MOCHAMAD RAMDHANI', 'GOFUR', 'ICA ANISAH', 'ASIATUL FAUZIAH',
  'MARTININGSIH', 'ISMAWATI', 'SITI NURLAELASARI', 'IMANURDIN RAMADON',
  'GARNIS NURUL FATHONAH', 'AZI PURNAMA', 'EEN SUNARYA', 'AAN FITRIANANI',
  'SAEFUL ALIM', 'DIYAN HIDAYAT', 'YULIAN SABITNI AMANAH', 'ADANG MAULANA',
  'SOFROH', 'ISLAMIATI ISTIQOMAH', 'ADE SUBUR SUGIHARTO', 'RAHMAH YULIA',
  'NUNUNG HERAWATI', 'FARIZIAH AMBARSARI', 'MAR ATUN SHOLEHAH', 'SUPRIHATIN',
  'FAJAR DEDI MIFTAKHUDDIN', 'YUDHA NUGRAHA', 'AGUS MAULANA', 'NANA JUNAEDI',
  'HENDRA PERMANA', 'WACHYUDIN', 'MERTYANI RAHAYU', 'FAJAR SIDIK', 'PUTRA JAYADI',
  'SUNANDAR', 'RAHMAT', 'MUHAMAD SYAHRUL EFENDI', 'NANA MULYANA',
  'NURUL HIKMAH, S.PD.SD', 'FIRMAN AWALUDIN, S.PD.',
];

function norm(s) { return (s || '').toUpperCase().replace(/\s+/g, ' ').trim(); }

let updated = 0;
let notFound = [];

for (const tg of targets) {
  const rec = allPegawai.find((r: any) => norm(r.nama) === norm(tg));
  if (rec) {
    const old = rec.status_kepegawaian;
    if (old !== 'PPPK Paruh Waktu') {
      rec.status_kepegawaian = 'PPPK Paruh Waktu';
      updated++;
      console.log(`${rec.nama} (NIP="${rec.nip || '(empty)'}"): ${old} -> PPPK Paruh Waktu`);
    }
  } else {
    notFound.push(tg);
    console.log(`NOT FOUND: ${tg}`);
  }
}

// Write both files
fs.writeFileSync(
  path.join(process.cwd(), 'src', 'data', 'data-pegawai.json'),
  JSON.stringify(pegawai, null, 2), 'utf-8'
);
fs.writeFileSync(
  path.join(process.cwd(), 'src', 'data', 'data-pegawai-tk.json'),
  JSON.stringify(tkPegawai, null, 2), 'utf-8'
);

console.log(`\nUpdated: ${updated} records`);
console.log(`Still not found: ${notFound.length}`);
if (notFound.length) console.log(`Missing: ${notFound.join(', ')}`);
