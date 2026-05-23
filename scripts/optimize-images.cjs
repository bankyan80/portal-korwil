const sharp = require('sharp');
const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

const publicDir = join(__dirname, '..', 'public');

const files = [
  { name: 'portalnew.png', maxWidth: 512 },
  { name: 'K3S.png', maxWidth: 400 },
  { name: 'logokab.png', maxWidth: 300 },
  { name: 'kadis.png', maxWidth: 300 },
];

(async () => {
  for (const f of files) {
    const inputPath = join(publicDir, f.name);
    const buf = readFileSync(inputPath);
    const oldSize = buf.length;

    const optimized = await sharp(buf)
      .resize({ width: f.maxWidth, withoutEnlargement: true })
      .png({ quality: 80, palette: true })
      .toBuffer();

    writeFileSync(inputPath, optimized);
    const newSize = optimized.length;
    const saved = ((oldSize - newSize) / 1024).toFixed(1);
    const pct = ((1 - newSize / oldSize) * 100).toFixed(0);
    console.log(`${f.name}: ${(oldSize/1024).toFixed(1)}KB → ${(newSize/1024).toFixed(1)}KB (-${saved}KB, ${pct}%)`);
  }
  console.log('\nDone.');
})();
