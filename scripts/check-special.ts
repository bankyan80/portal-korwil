import fs from 'fs';
import path from 'path';

const pegawai: any[] = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'src', 'data', 'data-pegawai.json'), 'utf-8')
);

// Check exact status_kepegawaian for FAJAR SIDIK (NIP target: 200104062025211027, SDN 3 SIGONG)
const fajarNip = '200104062025211027';
const fajar = pegawai.find((r: any) => (r.nip || '') === fajarNip);
console.log(`FAJAR by NIP (${fajarNip}):`, fajar ? `"${fajar.nama}" status="${fajar.status_kepegawaian}"` : 'NOT FOUND');

// Check PUTRA JAYADI: target NIP=200301242025211008, found NIP=197401172025211002
const putra = pegawai.find((r: any) => (r.nip || '') === '200301242025211008');
const putraActual = pegawai.find((r: any) => (r.nip || '') === '197401172025211002');
console.log(`PUTRA by target NIP (200301242025211008):`, putra || 'NOT FOUND');
console.log(`PUTRA by found NIP (197401172025211002):`, putraActual ? `"${putraActual.nama}" status="${putraActual.status_kepegawaian}"` : 'NOT FOUND');

// Check all records in SIGONG 3
const sigong3 = pegawai.filter((r: any) => r.sekolah && r.sekolah.includes('3 SIGONG'));
console.log(`\nSDN 3 SIGONG records: ${sigong3.length}`);
sigong3.forEach(r => console.log(`  ${r.nama}: nip="${r.nip}" status="${r.status_kepegawaian}"`));

console.log(`\nAll PPPK Paruh Waktu count:`);
const pppkPW = pegawai.filter((r: any) => r.status_kepegawaian === 'PPPK Paruh Waktu');
console.log(`  SD pegawai: ${pppkPW.length} / ${pegawai.length}`);
