const fs = require('fs');

const rombelRaw = fs.readFileSync('src/data/rombel.ts', 'utf8');
const rombelSchools = [];
[...rombelRaw.matchAll(/\{\s*name:\s*'([^']+)',\s*jenjang:\s*'([^']+)'/g)]
  .forEach(m => rombelSchools.push({ name: m[1], jenjang: m[2] }));

const data = JSON.parse(fs.readFileSync('src/data/data-siswa.json', 'utf8'));
const sekolahMap = {};
for (const s of data) { if (s.sekolah) sekolahMap[s.sekolah] = (sekolahMap[s.sekolah]||0)+1; }

function stripSekolahPrefix(str) {
  return str.replace(/^(TK|SD|KB|PAUD)\s+/i, '');
}

console.log('=== Schools WITHOUT student records (after stripping prefix) ===\n');
const SEPS = '-'.repeat(90);
for (const rs of rombelSchools) {
  // Exact match
  if (sekolahMap[rs.name] !== undefined) {
    console.log(`[  ${sekolahMap[rs.name].toString().padStart(5)} ]  ${rs.name}  (${rs.jenjang})`);
    continue;
  }
  // Strip prefix from rombel name and match
  let stripped = stripSekolahPrefix(rs.name);
  let matchKey = null, matchCount = 0;
  for (const [sekolahKey, cnt] of Object.entries(sekolahMap)) {
    const strippedKey = stripSekolahPrefix(sekolahKey);
    if (strippedKey === stripped) {
      matchKey = sekolahKey; matchCount = cnt; break;
    }
  }
  if (matchKey) {
    console.log(`[  ${matchCount.toString().padStart(5)} ]  ${rs.name}  (${rs.jenjang})  ≈  ${matchKey}`);
  } else {
    console.log(`[   0    ]  ${rs.name}  <-- NO STUDENTS`);
  }
}
