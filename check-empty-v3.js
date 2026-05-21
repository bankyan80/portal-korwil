const fs = require('fs');

const rombelRaw = fs.readFileSync('src/data/rombel.ts','utf8');
const rombelSchools = [];
[...rombelRaw.matchAll(/\{\s*name:\s*'([^']+)',\s*jenjang:\s*'([^']+)'/g)]
  .forEach(m => rombelSchools.push({ name:m[1], jenjang:m[2] }));

const data = JSON.parse(fs.readFileSync('src/data/data-siswa.json','utf8'));
const sekolahMap = {};
for (const s of data) { if (s.sekolah) sekolahMap[s.sekolah] = (sekolahMap[s.sekolah]||0)+1; }

function matchCount(rsName) {
  const special = {
    'SD NEGERI 3 SIGONG': 'SDN 3 SIGONG',
  };
  if (special[rsName]) return { count: sekolahMap[special[rsName]]||0, matchKey: special[rsName] };
  // Exact match
  if (sekolahMap[rsName] !== undefined) return { count: sekolahMap[rsName], matchKey: rsName };
  // StripSD prefix: "SD NEGERI 1 SIGONG" => "NEGERI 1 SIGONG" — matches "NEGERI 1 SIGONG" in db
  // OR strip "SD IT" prefix for the special school "SD IT AL IRSYAD AL ISLAMIYYAH"
  let s = rsName;
  // Case A: strip "SD " to get the rest (works for "NEGERI 1 X..." etc.)
  const withoutSD = s.replace(/^SD\s+/i,'');
  if (sekolahMap[withoutSD]) return { count: sekolahMap[withoutSD], matchKey: withoutSD };
  // Case B: strip "SD NEGERI X" to get "X ..." and match in db
  const afterSegi = s.replace(/^SD\s+NEGERI\s+\w+\s+/i,'');
  if (afterSegi && sekolahMap[afterSegi]) return { count: sekolahMap[afterSegi], matchKey: afterSegi };
  // Case C: stripSD prefix makes no SD
  // Match "BP KENANGA" as substring in sekolah field (handles "BPP KENANGA" etc.)
  for (const [k,v] of Object.entries(sekolahMap)) {
    const kNoPrefix = k.replace(/^(TK|SB|PAUD)\s+/i,'');
    if (kNoPrefix === s || s === kNoPrefix) return { count: v, matchKey: k };
  }
  // Check which prefix-stripped rombel name matches a sekolah field
  const bestMatch = (names) => names.find(n => sekolahMap[n] !== undefined) || null;
  if (rsName.startsWith('SD NEGERI ')) {
    const inner = rsName.slice('SD NEGERI '.length);
    if (sekolahMap[inner]) return { count: sekolahMap[inner], matchKey: inner };
    // Match via includes against ISH sort of prefix: "SD NEGERI 1 POIN"
    const k1 = Object.entries(sekolahMap).find(([k,v]) => k.startsWith(rsName));
    if (k1) return { count: k1[1], matchKey: k1[0] };
    const k2 = Object.entries(sekolahMap).find(([k,v]) => k.startsWith(inner));
    if (k2) return { count: k2[1], matchKey: k2[0] };
  }
  return { count: 0, matchKey: '' };
}

console.log('=== Schools (students count in data-siswa.json) ===\n');
let noCount = 0, withCount = 0;
for (const rs of rombelSchools) {
  const { count, matchKey } = matchCount(rs.name);
  if (count === 0) {
    console.log(`   0  ${rs.name}  <-- NO SISWA`);
    for (const [k,v] of Object.entries(sekolahMap)) {
      if (rs.name.includes(k.replace(/^(SD\s*NEGERI\s+\w+\s*)/i,'').trim())) {
        console.log(`     ... closest: "${k}" has ${v} students`);
      }
    }
    noCount++;
  } else {
    console.log(`  ${String(count).padStart(4)}  ${rs.name}  ≈  ${matchKey}`);
    withCount++;
  }
}
console.log(`\n${withCount} have students, ${noCount} have NONE.`);
console.log('\nAll sekolah keys in data-siswa.json:');
for (const [k,v] of Object.entries(sekolahMap).sort((a,b)=>a[0].localeCompare(b[0]))) {
  console.log(`  ${String(v).padStart(4)}  ${k}`);
}
