const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/data/data-siswa.json', 'utf8'));

// Show ALL unique sekolah values
const seps = {};
for (const s of data) {
  if (s.sekolah) seps[s.sekolah] = (seps[s.sekolah]||0)+1;
}
for (const [k,v] of Object.entries(seps).sort((a,b)=>a[0].localeCompare(b[0]))) {
  console.log(v.toString().padStart(5), k);
}
console.log('\nTotal unique sekolah:', Object.keys(seps).length);
