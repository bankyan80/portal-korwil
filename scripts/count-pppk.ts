import fs from 'fs';
import path from 'path';

const pegawai = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'src', 'data', 'data-pegawai.json'), 'utf-8')
);
let tk = [];
try { tk = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src', 'data', 'data-pegawai-tk.json'), 'utf-8')); } catch (_) {}

const pppkPW_sd = pegawai.filter((r: any) => r.status_kepegawaian === 'PPPK Paruh Waktu');
const pppkPW_tk = tk.filter((r: any) => r.status_kepegawaian === 'PPPK Paruh Waktu');
console.log('PPPK Paruh Waktu in SD pegawai:', pppkPW_sd.length);
console.log('PPPK Paruh Waktu in TK pegawai:', pppkPW_tk.length);
console.log('Total:', pppkPW_sd.length + pppkPW_tk.length);

console.log('\n--- All PPPK PW entries (SD) ---');
pppkPW_sd.forEach((r: any) => console.log(`  ${r.nama} | NIP=${r.nip || '(empty)'} | ${r.sekolah}`));
