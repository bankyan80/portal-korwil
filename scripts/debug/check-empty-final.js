const fs = require('fs');

const rombelRaw = fs.readFileSync('src/data/rombel.ts', 'utf8');
const rombelSchools = [];
[...rombelRaw.matchAll(/\{\s*name:\s*'([^']+)',\s*jenjang:\s*'([^']+)'/g)]
  .forEach(m => rombelSchools.push({ name: m[1], jenjang: m[2] }));

const data = JSON.parse(fs.readFileSync('src/data/data-siswa.json', 'utf8'));
const sekolahMap = {};
for (const s of data) { if (s.sekolah) sekolahMap[s.sekolah] = (sekolahMap[s.sekolah]||0)+1; }

// The REAL "no students" schools:
// these appear in rombel.ts as "SD NEGERI 1 X" but siswa Istri Sini shows them at 0
// because siswa records use longer names like "SD NEGERI 1 X CARINGKIN"
// BUT the sekolah field values are different shortened: "NEGERI 1 X ..."
// Let's map each and report true zero-student schools by checking if ANY siswa exists per name

function matchesSkey(name, sekey) {
  // Exact
  if (name === sekey) return true;
  // By stripping all "SD /TK/etc/" prefixes (just keep the BEAST identifier part: NEGERI X / BPP KENANGA/etc.)
  const strip = str => str.replace(/^(SD\s*NEGERI|SD\s*IT|NEGERI)\s*/i, '').replace(/\s*KECAMATAN\s+LEMAHABANG/, '').trim();
  // Actually: NEGERI 1 ASEM KECAMATAN LEMAHABANG => NEGERI 1 ASEM (same as stripSD prefix)
  const cleanRbl = name.replace(/^SD\s+/i, '').trim();          // "SD NEGERI 1 ASEM" => "NEGERI 1 ASEM"
  const cleanSis = sekey.replace(/\s*KECAMATAN\s+LEMAHABANG/i, '').trim(); // "... KEC. LEMAHABANG" => without
  // Loose check: rombel name appears in sekolah field or vice versa (non-empty)
  if (cleanRbl && cleanSis) {
    if (cleanSis.includes(cleanRbl)) return true;
    if (cleanRbl.includes(cleanSis)) return true;
  }
  return false;
}

const noStudents = [];
const matched = [];
for (const rs of rombelSchools) {
  let count = 0, matchKey = '';
  for (const [sekolahKey, cnt] of Object.entries(sekolahMap)) {
    if (matchesSkey(rs.name, sekolahKey)) {
      count += cnt;
      matchKey = sekolahKey;
    }
  }
  if (count === 0) noStudents.push(rs);
  else matched.push({...rs, count, matchKey});
}

console.log('=== Schools with STUDENT records ===');
matched.sort((a,b) => a.jenjang.localeCompare(b.jenjang)).forEach(s => {
  console.log(`[${String(s.count).padStart(4)}]  (${s.jenjang})  ${s.name}`);
});

console.log('\n=== Schools with NO student records ===');
noStudents.sort((a,b) => a.name.localeCompare(b.name)).forEach(s => {
  console.log(`  (${s.jenjang})  ${s.name}`);
});
console.log(`\nTotal: ${matched.length} have students, ${noStudents.length} have NONE.`);
