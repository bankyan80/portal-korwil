import fs from 'fs';
import path from 'path';

const pegawaiPath = path.join(process.cwd(), 'src', 'data', 'data-pegawai.json');
const data = JSON.parse(fs.readFileSync(pegawaiPath, 'utf-8'));

// Search the pegawai data for CARWINAH, SRI NURCHAENI, etc.
const namesToFind = ['CARWINAH','SRI NURCHAENI','JUNI','SHEPTA','HERI KUSWANTO','MEIGY IRMA','KARYATI','ADE SETIA MAULANA','ENDANG KASMARA','SITI SOLAEHA', 'MOCHAMAD RAMDHANI','GOFUR','ICA ANISAH','ASIATUL FAUZIAH','MARTININGSIH','ISMAWATI','SITI NURLAELASARI','IMANURDIN','GARNIS','AZI PURNAMA','EEN SUNARYA','AAN FITRIANANI','SAEFUL ALIM','DIYAN HIDAYAT','YULIAN SABITNI','ADANG MAULANA','SOFROH','ISLAMIATI ISTIQOMAH','ADE SUBUR SUGIHARTO','RAHMAH YULIA','NUNUNG HERAWATI','FARIZIAH','MAR ATUN SHOLEHAH','SUPRIHATIN','FAJAR DEDI','YUDHA NUGRAHA','AGUS MAULANA','NANA JUNAEDI','HENDRA PERMANA','WACHYUDIN','MERTYANI RAHAYU','FAJAR SIDIK','PUTRA JAYADI','SUNANDAR','RAHMAT','MUHAMAD SYAHRUL EFENDI','NANA MULYANA','NURUL HIKMAH','FIRMAN AWALUDIN'];

// Deduplicate
const uniqueNames = [...new Set(namesToFind)];

let found = 0;
for (const n of uniqueNames) {
  const up = n.toUpperCase().replace(/\s+/g, ' ');
  const match = data.find((r: any) => {
    const rn = (r.nama || '').toUpperCase().replace(/\s+/g, ' ');
    return rn === up || rn.includes(up) || up.includes(rn);
  });
  if (match) {
    console.log(`"${n}" -> NIP="${match.nip}" sekolah="${match.sekolah}"`);
    found++;
  } else {
    console.log(`NOT FOUND: ${n}`);
  }
}
console.log(`\nTotal found: ${found}/${uniqueNames.length}`);
