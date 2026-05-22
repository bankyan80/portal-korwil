const fs = require('fs');
const d = JSON.parse(fs.readFileSync('src/data/data-siswa.json','utf8'));
// Show NEGERI keys in sekolah field
const u = {};
d.forEach(s => {
  if (s.sekolah && u[s.sekolah] === undefined) {
    u[s.sekolah] = 1;
    // Show NEGERI-keys
    if (/^NEGERI/.test(s.sekolah)) {
      console.log('sekolah key starts with NEGERI:', s.sekolah);
    }
  }
});
// Also show "SDN" keys
console.log('\n=== SDN keys ===');
Object.keys(u).filter(k=>/^SDN/.test(k)).forEach(k=>console.log(k));
