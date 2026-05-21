const fs = require('fs');
const rombelRaw = fs.readFileSync('src/data/rombel.ts','utf8');
const data = JSON.parse(fs.readFileSync('src/data/data-siswa.json','utf8'));
const sekolahMap = {};
for (const s of data) { if (s.sekolah) sekolahMap[s.sekolah] = (sekolahMap[s.sekolah]||0)+1; }

// rombelt.ts school names
const rbeltSchools = [...rombelRaw.matchAll(/\{\s*name:\s*'([^']+)',\s*jenjang:\s*'([^']+)'/g)]
  .map(m => ({ name: m[1], jenjang: m[2] }));

// Drive folder school names (from Google Drive listing)
const driveSchools = [
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
   'SD NEGERI 3 SIGONG',
   'SD NEGERI 4 SIGONG',
   'TK AL-IRSYAD AL-ISLAMIYYAH',
   'TK BPP KENANGA',
   'TK GELATIK',
   'TK MELATI',
   'TK MUSLIMAT NU',
   'TK NEGERI LEMAHABANG',
   'TK AISIYAH LEMAHABANG',
   'TK AL-AQSO',
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
];

function clean(str) { return str.replace(/^(SD|TK|KB)\s+/i,'').replace(/\s*KECAMATAN\s+LEMAHABANG/i,'').trim(); }
function shortSD(str) {
  return str.replace(/^SD\s+NEGERI\s+(\d+)\s+(.+)/i, (_, n, name) => `SDN ${n} ${name}`);
}
function matchSchool(name, databaseList) {
  // Sort by longest desc
  if (databaseList[name] !== undefined) return [name, databaseList[name]];
  // Try clean
  const c = clean(name);
  if (databaseList[c] !== undefined) return [c, databaseList[c]];
  // Try for SDN X TYPE
  const sdShort = shortSD(name);
  if (databaseList[sdShort] !== undefined) return [sdShort, databaseList[sdShort]];
  // Try includes
  for (const [k,v] of Object.entries(databaseList)) {
    if (k.includes(name) || name.includes(k)) return [k,v];
    if (k.includes(c) || clean(k).includes(c)) return [k,v];
  }
  return [null,0];
}

console.log('=== rombolt.ts schools missing from Drive folder list? ===');
const driveSet = new Set(driveSchools);
const rbeltSet = new Set(rbeltSchools.map(s=>s.name));
for (const rs of rbeltSchools) {
  if (!driveSet.has(rs.name)) {
    const [matched, cnt] = matchSchool(rs.name, sekolahMap);
    console.log(`  rbolt-only: "${rs.name}" (${rs.jenjang}) — ${matched||'NO MATCH'} ${cnt}`);
  }
}
console.log('\n=== DRIVE schools missing from rombolt.ts? ===');
for (const ds of driveSchools) {
  if (!rbeltSet.has(ds)) {
    const c = clean(ds);
    const [matched, cnt] = matchSchool(ds, sekolahMap);
    console.log(`  drive-only: "${ds}" (${cnt})`);
  }
}

console.log('\n=== Zero-student rombolt.ts schools ===');
for (const rs of rbeltSchools) {
  const [matched, cnt] = matchSchool(rs.name, sekolahMap);
  if (cnt===0) console.log(`  [0] ${rs.name}  (${rs.jenjang})`);
}
console.log('\n=== DRIVE schools with zero students ===');
for (const ds of driveSchools) {
  const [matched, cnt] = matchSchool(ds, sekolahMap);
  if (cnt===0) console.log(`  [0] ${ds}`);
}
