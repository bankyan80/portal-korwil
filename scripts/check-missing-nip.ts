import fs from 'fs';
import path from 'path';

const pegawaiPath = path.join(process.cwd(), 'src', 'data', 'data-pegawai.json');
const tkPath = path.join(process.cwd(), 'src', 'data', 'data-pegawai-tk.json');
const pegawai = JSON.parse(fs.readFileSync(pegawaiPath, 'utf-8'));
const tkPegawai = JSON.parse(fs.readFileSync(tkPath, 'utf-8'));

const notFound = [
  '198303152025212108','197605182025212033','197606112025212028','199307242025211075',
  '199201012025211199','199905222025212039','197902022025212040','199906292025211051',
  '198007312025211041','198404022025212090','198503202025211091','198803092025212064',
  '198701242025212055','197109062025211029','198911112025211114','197006172025211050',
  '199108272025211057','199302092025211085','197510142025211033','198811102025211144',
  '197310122025211042','197505112025211053','197309152025211052','199403102025212080',
  '200104062025211027','197610132025211042','197505032025211057','199911152025211031',
  '197310102025211056','198507252025212055','198903062025211071',
];

for (const n of notFound) {
  // Search In SD pegawai by name (normalized)
  const foundSD = pegawai.find((r: any) => {
    const raw = (r.nip || '').trim();
    return raw === n || raw.replace(/\s/g,'') === n;
  });
  // Search bytes in raw file
  const rawContent = fs.readFileSync(pegawaiPath, 'utf-8');
  const foundInRaw = rawContent.includes(n);

  if (foundSD) {
    console.log(`FLAGGED in SD pegawai list: "${foundSD.nama}" (${foundSD.nip})`);
  } else if (foundInRaw) {
    console.log(`FOUND raw in pegawai.json but not parsed: NIP=${n}`);
  } else {
    console.log(`NOT FOUND: ${n}`);
  }
}
