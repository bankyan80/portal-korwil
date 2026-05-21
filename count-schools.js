const fs = require('fs');
const rombelRaw = fs.readFileSync('src/data/rombel.ts','utf8');
const matches = [...rombelRaw.matchAll(/\{\s*name:\s*'([^']+)',\s*jenjang:\s*'([^']+)'/g)];
let sd=0, tk=0, kb=0, paud=0;
for (const m of matches) {
  const jenjang = m[2];
  if (jenjang === 'SD') sd++;
  else if (jenjang === 'TK') tk++;
  else if (jenjang === 'KB') kb++;
  else if (jenjang === 'PAUD') paud++;
}
console.log(`SD: ${sd}, TK: ${tk}, KB: ${kb}, PAUD: ${paud}, Total: ${sd+tk+kb+paud}`);