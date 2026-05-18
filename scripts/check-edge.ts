import fs from 'fs';
import path from 'path';

const pegawai: any[] = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'src', 'data', 'data-pegawai.json'), 'utf-8')
);
const all = pegawai;

// Check for any child of SDN 1 PICUNGPUGUR
const picung = pegawai.filter((r: any) => r.sekolah && r.sekolah.includes('PICUNGPUGUR'));
console.log('SDN 1 PICUNGPUGUR records:');
picung.forEach(r => console.log(`  ${r.nama}: nip="${r.nip}" status="${r.status_kepegawaiian}"`));

// Check by NIP for remaining unknown
const checkNips = ['200104062025211027', // FAJAR SIDIK target from user list
                    '199403102025212080', // MERTYANI RAHAYU target from user list
                    ];
for (const nip of checkNips) {
  const r = pegawai.find((rec: any) => (rec.nip || '') === nip);
  console.log(`NIP ${nip}:`, r ? `"${r.nama}" status="${r.status_kepegawaian}" sekolah="${r.sekolah}"` : 'NOT FOUND');
}

// Check for NIP=200104062025211027 in entire raw file
const content = fs.readFileSync(path.join(process.cwd(), 'src', 'data', 'data-pegawai.json'), 'utf-8');
for (const nip of checkNips) {
  console.log(`RAW contains ${nip}:`, content.includes(nip));
}
