import fs from 'fs';
import path from 'path';

const pegawaiPath = path.join(process.cwd(), 'src', 'data', 'data-pegawai.json');

const checkNips = [
  '198303152025212108','197605182025212033','197606112025212028','199307242025211075',
  '199201012025211199','199905222025212039','197902022025212040','199906292025211051',
  '198007312025211041','198404022025212090','198503202025211091','198803092025212064',
  '198701242025212055','197109062025211029','198911112025211114','197006172025211050',
  '199108272025211057','199302092025211085','197510142025211033','198811102025211144',
  '197310122025211042','197505112025211053','197309152025211052','199403102025212080',
  '200104062025211027','197610132025211042','197505032025211057','199911152025211031',
  '197310102025211056','198507252025212055','198903062025211071',
];

const data = JSON.parse(fs.readFileSync(pegawaiPath, 'utf-8'));

for (const nip of checkNips) {
  const exact = data.find((r: any) => (r.nip || '') === nip);
  const trimmed = data.find((r: any) => (r.nip || '').trim() === nip);
  const stripped = data.find((r: any) => (r.nip || '').replace(/[\s\-\.]/g, '') === nip.replace(/[\s\-\.]/g, ''));

  if (exact) {
    console.log(`EXACT: "${exact.nama}" NIP="${exact.nip}"`);
  } else if (trimmed) {
    console.log(`TRIMMED: "${trimmed.nama}" NIP="${trimmed.nip}"`);
  } else if (stripped) {
    console.log(`STRIPPED: "${stripped.nama}" NIP="${stripped.nip}"`);
  } else {
    // Check raw content
    const raw = fs.readFileSync(pegawaiPath, 'utf-8');
    const found = raw.includes(nip);
    console.log(`${found ? 'RAW-FOUND' : 'NOT-FOUND'}: ${nip}`);
  }
}
