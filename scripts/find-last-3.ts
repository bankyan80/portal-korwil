import fs from 'fs';
import path from 'path';

const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src', 'data', 'data-pegawai.json'), 'utf-8'));

// 3 missing names: ENDANG KASMARA, SITI SOLAEHA, MERTYANI RAHAYU
const missingNames = ['ENDANG KASMARA', 'SITI SOLAEHA', 'MERTYANI RAHAYU'];

for (const n of missingNames) {
  // Exact upper case match
  const up = n.toUpperCase().replace(/\s+/g, ' ');
  const r = data.find((r: any) => (r.nama || '').toUpperCase().replace(/\s+/g, ' ') === up);
  if (r) {
    console.log(`EXACT: "${r.nama}" NIP="${r.nip || '(empty)'}" status=${r.status_kepegawaian}`);
  } else {
    // Search raw file
    const raw = fs.readFileSync(path.join(process.cwd(), 'src', 'data', 'data-pegawai.json'), 'utf-8');
    const idx = raw.indexOf(n.toUpperCase().substring(0, 8));
    if (idx >= 0) {
      console.log(`PARTIAL: found near pos ${idx} in JSON`);
      console.log(raw.substring(idx - 50, idx + 200));
    } else {
      console.log(`TRULY NOT FOUND: ${n}`);
    }
  }
}

// Also count empty-NIP PPPK records
const emptyNip = data.filter((r: any) => !r.nip || !r.nip.toString().trim()).length;
const emptyNipPPPK = data.filter((r: any) => (!r.nip || !r.nip.toString().trim()) && r.status_kepegawaian === 'PPPK Paruh Waktu').length;
const emptyNipHonor = data.filter((r: any) => (!r.nip || !r.nip.toString().trim()) && r.status_kepegawaian === 'Tenaga Honor Sekolah').length;
console.log(`\nEmpty NIP records total: ${emptyNip}`);
console.log(`Empty NIP + PPPK Paruh Waktu: ${emptyNipPPPK}`);
console.log(`Empty NIP + Tenaga Honor Sekolah: ${emptyNipHonor}`);
