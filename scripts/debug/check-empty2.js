const fs = require('fs');

// Load rombel.ts school names
const rombelRaw = fs.readFileSync('src/data/rombel.ts', 'utf8');
const rombelSchools = [];
[...rombelRaw.matchAll(/\{\s*name:\s*'([^']+)',\s*jenjang:\s*'([^']+)'/g)]
  .forEach(m => rombelSchools.push({ name: m[1], jenjang: m[2] }));

// Load data-siswa.json sekolah values
const data = JSON.parse(fs.readFileSync('src/data/data-siswa.json', 'utf8'));
const sekolahMap = {};   // scuole → count
const sekolahToRombel = {}; // scuola actually mapped sekolah → rombel name
for (const s of data) {
  if (s.sekolah) sekolahMap[s.sekolah] = (sekolahMap[s.sekolah] || 0) + 1;
}

// Match rombel.ts names against sekolah values
console.log('=== School matching ===\n');
const noStudent = [];
const hasStudent = [];

for (const rs of rombelSchools) {
  // Exact match first
  if (sekolahMap[rs.name] !== undefined) {
    console.log(`[EXACT][${sekolahMap[rs.name]}] ${rs.name}`);
    hasStudent.push(rs.name);
    continue;
  }
  // One-way includes match: rombel name anywhere in sekolah key OR sekolah key anywhere in rombel name
  let matchKey = null, matchCount = 0;
  for (const [sekolahKey, cnt] of Object.entries(sekolahMap)) {
    if (sekolahKey.includes(rs.name) || rs.name.includes(sekolahKey)) {
      if (!matchKey || cnt > matchCount) { matchKey = sekolahKey; matchCount = cnt; }
    }
  }
  if (matchKey) {
    console.log(`[INCLS][${matchCount}] ${rs.name}  ≈  ${matchKey}`);
    hasStudent.push(rs.name);
    sekolahToRombel[matchKey] = rs.name;
  } else {
    console.log(`[EMPTY][0]   ${rs.name}  (${rs.jenjang})`);
    noStudent.push(rs.name);
  }
}

const remainingSekolah = Object.keys(sekolahMap).filter(k => !sekolahToRombel[k]);
console.log('\n=== sekolah values with NO rombel.ts match ===');
for (const k of remainingSekolah.sort()) {
  console.log(`[${sekolahMap[k]}]   ${k}`);
}

console.log('\n=== schools with NO students confirmed ===');
for (const n of noStudent) console.log('  ' + rombelSchools.find(x=>x.name===n).jenjang, n);
