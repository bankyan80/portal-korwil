import fs from 'fs';
import path from 'path';

const pegawai: any[] = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'src', 'data', 'data-pegawai.json'), 'utf-8')
);
let tkPegawai: any[] = [];
try { tkPegawai = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src', 'data', 'data-pegawai-tk.json'), 'utf-8')); } catch (_) {}

// Search all records for MERTYANI RAHAYU (by name)
function norm(s) { return (s || '').toUpperCase().replace(/\s+/g, ' ').trim(); }
const all = [...pegawai, ...tkPegawai];

const mert = all.find((r: any) => norm(r.nama) === 'MERTYANI RAHAYU');
console.log('MERTYANI RAHAYU:', mert ? `NIP="${mert.nip || '(empty)'}" status="${mert.status_kepegawaian}" sekolah="${mert.sekolah}"` : 'NOT FOUND');

const fajar = all.find((r: any) => norm(r.nama) === 'FAJAR SIDIK');
console.log('FAJAR SIDIK:', fajar ? `NIP="${fajar.nip || '(empty)'}" status="${fajar.status_kepegawaian}" sekolah="${fajar.sekolah}"` : 'NOT FOUND');

const nk = all.find((r: any) => norm(r.nama) === 'NURUL HIKMAH, S.PD.SD');
console.log('NURUL HIKMAH:', nk ? `NIP="${nk.nip || '(empty)'}" status="${nk.status_kepegawaian}" sekolah="${nk.sekolah}"` : 'NOT FOUND');

const fr = all.find((r: any) => norm(r.nama) === 'FIRMAN AWALUDIN, S.PD.');
console.log('FIRMAN AWALUDIN:', fr ? `NIP="${fr.nip || '(empty)'}" status="${fr.status_kepegawaian}" sekolah="${fr.sekolah}"` : 'NOT FOUND');

// Count by file
console.log(`\npegawai.json (SD): ${pegawai.length} records`);
console.log(`pegawai-tk.json (TK): ${tkPegawai.length} records`);

const pppkPW_sd = pegawai.filter((r: any) => r.status_kepegawaian === 'PPPK Paruh Waktu').length;
const pppkPW_tk = tkPegawai.filter((r: any) => r.status_kepegawaian === 'PPPK Paruh Waktu').length;
console.log(`PPPK Paruh Waktu SD: ${pppkPW_sd}, TK: ${pppkPW_tk}, Total: ${pppkPW_sd + pppkPW_tk}`);
