import fs from 'fs';
import path from 'path';

const pegawaiPath = path.join(process.cwd(), 'src', 'data', 'data-pegawai.json');
const data = JSON.parse(fs.readFileSync(pegawaiPath, 'utf-8'));

// 19 NIPs reported as NOT FOUND
const notFound = [
  '198303152025212108','197605182025212033','198007312025211041','198404022025212090',
  '198503202025211091','198803092025212064','198701242025212055','197109062025211029',
  '198911112025211114','197006172025211050','199108272025211057','199302092025211085',
  '197510142025211033','198811102025211144','197310122025211042','197309152025211052',
  '199403102025212080','200104062025211027','197610132025211042',
];

// These 11 were EXACT in check-nip-detail but "not found" in the update script
// The update script found 30; if these 11 are actually EXACT, total would be 41 (still 8 short)
const suspectExact = [
  '198303152025212108','197605182025212033','198007312025211041','198404022025212090',
  '198503202025211091','198803092025212064','198701242025212055','197109062025211029',
  '198911112025211114','197006172025211050',
];

for (const nip of notFound) {
  // check with character code
  const rec = data.find((r: any) => {
    const n = r.nip || '';
    if (n === nip) return true;
    // check for invisible chars / encoding differences
    const hex = Buffer.from(n).toString('hex');
    const hexTarget = Buffer.from(nip).toString('hex');
    return hex === hexTarget;
  });

  if (rec) {
    const n = rec.nip || '';
    const hex = Buffer.from(n).toString('hex');
    const hexTarget = Buffer.from(nip).toString('hex');
    console.log(`\nNIP="${nip}" -> found as "${n}" (hex match: ${hex === hexTarget})`);
    console.log(`  nama: ${rec.nama}`);
    console.log(`  NIP hex: ${hex}`);
    console.log(`  target hex: ${hexTarget}`);
    if (hex !== hexTarget) {
      console.log(`  HEX DIFFERENT! California byte diff detected.`);
    }
  } else {
    console.log(`NOT FOUND: ${nip}`);
  }
}
