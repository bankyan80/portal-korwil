const fs = require('fs');

const rombelRaw = fs.readFileSync('src/data/rombel.ts','utf8');
const rombelSchools = [];
[...rombelRaw.matchAll(/\{\s*name:\s*'([^']+)',\s*jenjang:\s*'([^']+)'/g)]
  .forEach(m => rombelSchools.push({ name:m[1], jenjang:m[2] }));

const data = JSON.parse(fs.readFileSync('src/data/data-siswa.json','utf8'));
const sekolahMap = {};
for (const s of data) { if (s.sekolah) sekolahMap[s.sekolah] = (sekolahMap[s.sekolah]||0)+1; }

function matchCount(rsName) {
  // 1. Exact match
  if (sekolahMap[rsName] !== undefined) return { count: sekolahMap[rsName], matchKey: rsName };

  // 2. "SD NEGERI X NAME" → sekolah key is "NEGERI X NAME"
  if (rsName.startsWith('SD ')) {
    const afterSD = rsName.replace(/^SD\s+/i,'');
    if (sekolahMap[afterSD]) return { count: sekolahMap[afterSD], matchKey: afterSD };
    // "SD NEGERI 1 PONOM" sub-check, then remove NEGERI -> "1 SIGONG"
    const afterNegeri = afterSD.replace(/^NEGERI\s+\d+\s+/i,'');
    if (afterNegeri && sekolahMap[afterNegeri]) return { count: sekolahMap[afterNegeri], matchKey: afterNegeri };
    // 3 precisa code for "SD NEGERI 3 SIGONG" → "SDN 3 SIGONG"
    const numM = rsName.match(/SD\s+NEGERI\s+(\d+)\s+(.+)/i);
    if (numM) {
      const sdCode = `SDN ${numM[1]} ${numM[2]}`;
      if (sekolahMap[sdCode]) return { count: sekolahMap[sdCode], matchKey: sdCode };
    }
    // Foreach includes
    for (const [k,v] of Object.entries(sekolahMap)) {
      if (k.includes(afterSD)) return { count:v, matchKey:k };
    }
  }

  // 3. TK/PERSONAL: strip prefix
  const prefixless = rsName.replace(/^(TK|PAUD|KB)\s+/i,'');
  if (sekolahMap[prefixless]) return { count: sekolahMap[prefixless], matchKey: prefixless };

  // 4. Any includes match
  for (const [k,v] of Object.entries(sekolahMap)) {
    if (k.includes(rsName) || rsName.includes(k)) return { count:v, matchKey:k };
  }

  return { count:0, matchKey:'' };
}

console.log('=== STUDENT COUNT per rombol.ts school ===\n');
let noSiswa = [], adaSiswa = [];
for (const rs of rombelSchools) {
  const { count, matchKey } = matchCount(rs.name);
  if (count === 0) noSiswa.push(rs);
  else adaSiswa.push({...rs, count, matchKey});
}
adaSiswa.sort((a,b) => a.jenjang.localeCompare(b.jenjang) || b.count - a.count);
noSiswa.sort((a,b) => a.name.localeCompare(b.name));

// Compute totals per jenjang
const byJ = {};
for (const s of adaSiswa) {
  if (!byJ[s.jenjang]) byJ[s.jenjang] = {schools:0, siswa:0, detail:[]};
  byJ[s.jenjang].schools++;
  byJ[s.jenjang].siswa += s.count;
  byJ[s.jenjang].detail.push(`${s.name}: ${s.count}`);
}
for (const j of ['SD','TK','KB']) if (byJ[j]) {
  console.log(`[${j}] ${byJ[j].schools} schools, ${byJ[j].siswa} siswa`);
}
console.log(`\n=== ${adaSiswa.length} HAVE students ===`);
for (const s of adaSiswa) console.log(`  ${String(s.count).padStart(4)} | ${s.jenjang.padEnd(4)} | ${s.matchKey}`);
console.log(`\n=== ${noSiswa.length} HAVE NO students ===`);
for (const s of noSiswa) console.log(`       | ${s.jenjang.padEnd(4)} | ${s.name}`);
for (const s of noSiswa) {
  // print closest sekolah key if any
  for (const [k,v] of Object.entries(sekolahMap)) {
    if (k.includes(s.name.replace(/^SD\s+/i,''))) console.log(`         ... closest sekolah in data-siswa: "${k}" = ${v} siswa`);
  }
}
