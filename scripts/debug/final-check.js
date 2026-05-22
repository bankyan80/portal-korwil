const fs = require('fs');
const rombelRaw = fs.readFileSync('src/data/rombel.ts','utf8');
const data = JSON.parse(fs.readFileSync('src/data/data-siswa.json','utf8'));

// rombelt schools
const rbeltSchools = [...rombelRaw.matchAll(/\{\s*name:\s*'([^']+)',\s*jenjang:\s*'([^']+)'/g)]
  .map(m => ({ name:m[1], jenjang:m[2] }));

// sekolahMap in data.json
const sekolahMap = {};
for (const s of data) { if (s.sekolah) sekolahMap[s.sekolah] = (sekolahMap[s.sekolah]||0)+1; }

// SD schools: sekolah key = "NEGERI X NAME" (without "SD " prefix and no "KECAMATAN ...")
// TK schools: sekolah key = "NAME" (without "TK " prefix)
// TK NEGERI LEMAHABANG → sekolah key = "NEGERI LEMAHABANG"
function mapSekolahKey(name) {
  // Special: "SD IT AL IRSYAD AL ISLAMIYYAH" → "IT AL IRSYAD AL ISLAMIYYAH"
  const p1 = name.match(/^SD\s+(.+)/i); if (p1) return p1[1].replace(/\s*KECAMATAN\s+LEMAHABANG/i,'');
  const p2 = name.match(/^(TK|KB|PAUD)\s+(.+)/i); if (p2) return p2[2];
  return name;
}

console.log('=== FULL ROMBEL.ts ↔ SEKOLAH MAP ===');
let summary = {};
for (const rs of rbeltSchools) {
  const sk = mapSekolahKey(rs.name);
  const cnt = sekolahMap[sk] || 0;
  console.log(`${cnt===0 ? '!! ' : '✓  '} ${rs.name.padEnd(45)} → "${sk}" = ${cnt} siswa`);
  summary[rs.name] = cnt;
}
