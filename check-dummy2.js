const fs = require('fs');
const [rawJson, rawRomb, rawSekolah] = [
  fs.readFileSync('src/data/data-siswa.json', 'utf8'),
  fs.readFileSync('src/data/rombel.ts', 'utf8'),
  fs.readFileSync('src/data/sekolah.ts', 'utf8'),
];
const data = JSON.parse(rawJson);

// rombolt schools (41 entries that are top-level schools — skip rombels sub-names)
const rFlatNames = [...new Set(
  [...rawRomb.matchAll(/\{\s*name:\s*'([^']+)',\s*jenjang:\s*'([^']+)'/g)]
    .map(m => m[1])
)];

// sekolah.ts schools
const sekSchools = {};
[...rawSekolah.matchAll(/\{\s*nama:\s*'([^']+)'/g)].forEach(m => sekSchools[m[1]] = true);

// data siswa sekolah value → count
const siswaMap = {};
data.forEach(s => { if(s.sekolah) siswaMap[s.sekolah] = (siswaMap[s.sekolah]||0)+1; });

// Build the full rombolt model with totals
const rFull = [];
for (const name of rFlatNames) {
  // find total for this school block
  const block = rawRomb.match(new RegExp("\\{\\s*name:\\s*'" + name.replace(/'/g,"\\'") + "',[\\s\\S]*?total:\\s*(\\d+)"));
  const total = block ? +block[1] : 0;
  const jenjang = rawRomb.match(new RegExp("\\{\\s*name:\\s*'" + name.replace(/'/g,"\\'") + "',\\s*jenjang:\\s*'([^']+)'/));
  rFull.push({ name, jenjang: jenjang ? jenjang[1] : '?', declared: total });
}

// Schools found in the Drive folder (manually parsed from webfetch results):
// Files that start with "daftar_pd-" (actual dapodik exports)
const driveSekolah = [
  'SD NEGERI 3 SIGONG',
  'KB AH PLUS',
  'KB AMALIA SALSABILA',
  'KB AZ-ZAHRA',
  'KB PALAPA',
  'PAUD AL-HUSNA',
  'PAUD AMANAH',
  'PAUD AN NAIM',
  'PAUD ASY - SYAFIIYAH',
  'PAUD BUDGENVIL',
  'PAUD SPS MELATI',
  'PAUD TUNAS HARAPAN',
  'SD IT AL IRSYAD AL ISLAMIYYAH',
  'SD NEGERI 1 ASEM',
  'SD NEGERI 1 BELAWA',
  'SD NEGERI 1 CIPEUJEUH KULON',
  'SD NEGERI 1 CIPEUJEUH WETAN',
  'SD NEGERI 1 LEMAHABANG',
  'SD NEGERI 1 LEMAHABANG KULON',
  'SD NEGERI 1 LEUWIDINGDING',
  'SD NEGERI 1 PICUNGPUGUR',
  'SD NEGERI 1 SARAJAYA',
  'SD NEGERI 1 SIGONG',
  'SD NEGERI 1 SINDANGLAUT',
  'SD NEGERI 1 TUK KARANGSUWUNG',
  'SD NEGERI 1 WANGKELANG',
  'SD NEGERI 2 BELAWA',
  'SD NEGERI 2 CIPEUJEUH KULON',
  'SD NEGERI 2 CIPEUJEUH WETAN',
  'SD NEGERI 2 LEMAHABANG',
  'SD NEGERI 2 SARAJAYA',
  'SD NEGERI 3 CIPEUJEUH WETAN',
  'SD NEGERI 4 SIGONG',
  'TK AISYIYAH LEMAHABANG',
  'TK AL-AQSO',
  'TK AL-IRSYAD AL-ISLAMIYYAH',
  'TK BPP KENANGA',
  'TK GELATIK',
  'TK MELATI',
  'TK MUSLIMAT NU',
  'TK NEGERI LEMAHABANG',
  'SD NEGERI 3 SIGONG',
};
const driveSet = new Set(driveSekolah);
const hasDup = driveSet.delete('SD NEGERI 3 SIGONG'); // deduplicate

// rombolt schools NOT in Drive folder → dummy
const dummySchools = rFull.filter(rs => {
  if (rs.name === 'KB MUTIARA') return true; // manual entry, no Dapodik file
  if (rs.name === 'KB AH PLUS') {
    // sekolah.ts has "KB A.H. PLUS" and siswaMap has "AH PLUS" → Drive has "KB AH PLUS"
    return !driveSet.has(rs.name) && !driveSet.has('KB AH PLUS');
  }
  return !driveSet.has(rs.name);
});

console.log('=== DUMMY DATA SCHOOLS (no DapoDik file in Drive folder) ===\n');
for (const s of dummySchools) {
  const sc = getSiswaCount(s.name, siswaMap);
  console.log(`   ${s.declared.toString().padStart(4)} decl | ${sc.toString().padStart(5)} siswa | ${s.name}  (${s.jenjang})`);
  console.log(`         in sekolah.ts? ${!!sekSchools[s.name]}`);
}
console.log(`\nTotal: ${dummySchools.length} schools with no DapoDik file.`);

// Now: among real Drive-folder schools, which students use a sekolah value NOT matching the Drive name?
console.log('\n=== STUDENTS with sekolah NOT matching any Drive school ===\n');
const falsePositiveNama = {};
data.forEach(s => {
  if (!s.sekolah) return;
  // Strip prefix
  const plain = s.sekolah.replace(/^(SD\s+|SDN\s+|TK\s+|KB\s+|PAUD\s+)/i, '');
  // Does this match any rombolt name in the drive?
  const inDrive = driveSekolah.some(dn => {
    const dp = dn.replace(/^(SD\s+|SDN\s+|TK\s+|KB\s+|PAUD\s+)/i, '');
    return dp === plain || dn === s.sekolah;
  });
  if (!inDrive) {
    falsePositiveNama[s.sekolah] = (falsePositiveNama[s.sekolah]||0) + 1;
  }
});
if (Object.keys(falsePositiveNama).length > 0) {
  console.log('Segregation-like sekolah values used by students:');
  for (const [k,v] of Object.entries(falsePositiveNama).sort((a,b)=>b[1]-a[1])) {
    console.log(`  ${v.toString().padStart(4)}  ${k}`);
  }
} else {
  console.log('All students match Drive folder school names — no segregation found.');
}

function getSiswaCount(name, map) {
  if (map[name] !== undefined) return map[name];
  const plain = name.replace(/^SD\s+/i, '');
  if (map[plain] !== undefined) return map[plain];
  for (const [k, v] of Object.entries(map)) {
    if (plain.includes(k) || k.includes(plain)) return v;
  }
  return 0;
}
