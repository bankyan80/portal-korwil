import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const ROOT = resolve(process.cwd());
const DATA = resolve(ROOT, 'src/data');
const OUT = resolve(ROOT, 'export-data-portal.xlsx');

const wb = XLSX.utils.book_new();

const pegawai = JSON.parse(readFileSync(resolve(DATA, 'data-pegawai.json'), 'utf-8'));
const wsPeg = XLSX.utils.json_to_sheet(pegawai.map((p, i) => ({
  No: i + 1, NIK: p.nik, Nama: p.nama, NUPTK: p.nuptk || '',
  JK: p.jk || '', 'Tempat Lahir': p.tempat_lahir || '',
  'Tanggal Lahir': p.tanggal_lahir || '', NIP: p.nip || '',
  'Status Kepegawaian': p.status_kepegawaian || '',
  'Jenis PTK': p.jenis_ptk || '', Agama: p.agama || '',
  'Tugas Tambahan': p.tugas_tambahan || '', Sertifikasi: p.sertifikasi || '',
  TMT: p.tmt || '', Sekolah: p.sekolah || '', Role: p.role || '',
})));
XLSX.utils.book_append_sheet(wb, wsPeg, 'Pegawai');

const siswa = JSON.parse(readFileSync(resolve(DATA, 'data-siswa.json'), 'utf-8'));
const wsSis = XLSX.utils.json_to_sheet(siswa.map((s, i) => ({
  No: i + 1, NIK: s.nik, Nama: s.nama, NISN: s.nisn || '',
  JK: s.jk || '', 'Tempat Lahir': s.tempat_lahir || '',
  'Tanggal Lahir': s.tanggal_lahir || '', Agama: s.agama || '',
  Alamat: s.alamat || '', Kelas: s.kelas || '', Rombel: s.rombel || '',
  Sekolah: s.sekolah || '', Jenjang: s.jenjang || '',
})));
XLSX.utils.book_append_sheet(wb, wsSis, 'Siswa');

XLSX.writeFile(wb, OUT);
console.log('✅ Ekspor selesai:', OUT);
console.log('   Pegawai:', pegawai.length, 'baris');
console.log('   Siswa:', siswa.length, 'baris');
