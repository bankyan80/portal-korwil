const fs = require('fs');
const d = JSON.parse(fs.readFileSync('src/data/data-siswa.json','utf8'));
const sekolahMap = {};
d.forEach(s => { if(s.sekolah) sekolahMap[s.sekolah]=(sekolahMap[s.sekolah]||0)+1; });

const rombelRaw = fs.readFileSync('src/data/rombel.ts','utf8');
const rSchools = [...rombelRaw.matchAll(/\{\s*name:\s*'([^']+)',\s*jenjang:\s*'([^']+)'/g)]
  .map(m => ({ name:m[1], jenjang:m[2] }));

console.log('=== ALL rombolt.ts school names ===');
rSchools.forEach(rs => {
  console.log(rs.name, rs.jenjang);
});

// Check for "SD NEGERI 3 SIGONG" matches comprehensively
console.log('\n=== Find match for "SD NEGERI 3 SIGONG" ===');
const name = "SD NEGERI 3 SIGONG";
console.log('Exact match:', sekolahMap[name]);
console.log('After SD strip:', sekolahMap[name.replace(/^SD\s+/,'')]);
const sdMatch = name.match(/^SD\s+NEGERI\s+(\d+)\s+(.+)/i);
console.log('SDN format:', sdMatch? `SDN ${sdMatch[1]} ${sdMatch[2]}` : null);
console.log('SDN ключ count:', sekolahMap[`SDN ${sdMatch[1]} ${sdMatch[2]}`]);
// Includes search
let found=false;
for (const [k,v] of Object.entries(sekolahMap)) {
  if (k.includes(name) || name.includes(k) || k.includes(name.replace(/^SD\s+/,'')) || name.replace(/^SD\s+/,'').includes(k)) {
    console.log('Includes hit:', k, '=', v);
    found=true;
    break;
  }
}
if (!found) console.log('No includes hit');
