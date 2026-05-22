const fs = require('fs');
const [rawJson, rawRomb, rawSekolah] = [
  fs.readFileSync('src/data/data-siswa.json','utf8'),
  fs.readFileSync('src/data/rombel.ts','utf8'),
  fs.readFileSync('src/data/sekolah.ts','utf8'),
];
const data = JSON.parse(rawJson);

// sekolah keys from student records
const sekolahMap = {};
data.forEach(s => { if(s.sekolah) sekolahMap[s.sekolah] = (sekolahMap[s.sekolah]||0)+1; });

// rombolt schools (only once per name)
const rombNames = [...new Set(
  [...rawRomb.matchAll(/\{\s*name:\s*'([^']+)',\s*jenjang:\s*'([^']+)'/g)].map(m => m[1])
)];

// sekolah.ts schools
const sekSet = {};
[...rawSekolah.matchAll(/\{\s*nama:\s*'([^']+)'/g)].forEach(m => sekSet[m[1]] = true);

// Drive folder Dapodik school names (all DAPODIK files in the folder)
const driveFiles = [
  'SD NEGERI 3 SIGONG',       // "DAFTAR PD 12052026 - SDN 3 SIGONG.xlsx"
  'KB AH PLUS','KB AMALIA SALSABILA','KB AZ-ZAHRA','KB PALAPA',
  'PAUD AL-HUSNA','PAUD AMANAH','PAUD AN NAIM','PAUD ASY - SYAFIIYAH',
  'PAUD BUDGENVIL','PAUD SPS MELATI','PAUD TUNAS HARAPAN',
  'SD IT AL IRSYAD AL ISLAMIYYAH',
  'SD NEGERI 1 ASEM','SD NEGERI 1 BELAWA',
  'SD NEGERI 1 CIPEUJEUH KULON','SD NEGERI 1 CIPEUJEUH WETAN',
  'SD NEGERI 1 LEMAHABANG','SD NEGERI 1 LEMAHABANG KULON',
  'SD NEGERI 1 LEUWIDINGDING','SD NEGERI 1 PICUNGPUGUR','SD NEGERI 1 SARAJAYA',
  'SD NEGERI 1 SIGONG','SD NEGERI 1 SINDANGLAUT',
  'SD NEGERI 1 TUK KARANGSUWUNG','SD NEGERI 1 WANGKELANG',
  'SD NEGERI 2 BELAWA','SD NEGERI 2 CIPEUJEUH KULON',
  'SD NEGERI 2 CIPEUJEUH WETAN','SD NEGERI 2 LEMAHABANG',
  'SD NEGERI 2 SARAJAYA','SD NEGERI 3 CIPEUJEUH WETAN',
  'SD NEGERI 4 SIGONG',
  'TK AISYIYAH LEMAHABANG','TK AL-AQSO','TK AL-IRSYAD AL-ISLAMIYYAH',
  'TK BPP KENANGA','TK GELATIK','TK MELATI','TK MUSLIMAT NU','TK NEGERI LEMAHABANG',
];
const driveSet = new Set(driveFiles);

function getSiswa(nm) {
  // Exact match
  if (sekolahMap[nm] !== undefined) return { cnt: sekolahMap[nm], key: nm };
  // Strip "SD "/"SDN " prefix
  const p = nm.replace(/^SD\s+/, '');
  if (sekolahMap[p] !== undefined) return { cnt: sekolahMap[p], key: p };
  // Also try "SDN" form for "SD NEGERI N X" → "SDN N X"
  const m = nm.match(/^SD\s+NEGERI\s+(\d+)\s+(.+)/i);
  if (m) {
    const sdn = 'SDN ' + m[1]+' '+m[2];
    if (sekolahMap[sdn]) return { cnt: sekolahMap[sdn], key: sdn };
  }
  // Includes: romtal classrooms look for exact per ___
  for (const [k,v] of Object.entries(sekolahMap)) {
    if (k===nm || nm===p) continue;
    const strippedK = k.replace(/\s*KECAMATAN\s+LEMAHABANG/i,'');
    if (strippedK===p) return { cnt: v, key: k };
    if (p.includes(k) || k.includes(p)) return { cnt: v, key: k };
    if (p.includes(strippedK) || strippedK.includes(p)) return { cnt: v, key: k };
  }
  return { cnt: 0, key: '' };
}

console.log('=== 🔍 DUMMY DATA DETECTION ===\n');
console.log('Kriteria: Sekolah di romb.ts TANPA file Dapodik di Drive menandakan data dummy\n');

let dummySchools = [], okSchools = [];

for (const nm of rombNames.sort((a,b)=>a.localeCompare(b))) {
  const { cnt, key } = getSiswa(nm);
  const inDrive = driveSet.has(nm) || (nm==='KB AH PLUS' && driveSet.has('KB AH PLUS'));
  const inSekolah = !!sekSet[nm];

  if (!inDrive) {
    dummySchools.push({ nm, cnt, key, inSekolah });
    console.log(`❌ DUMMY    ${cnt.toString().padStart(5)} siswa   ${key||'(tidak ada siswa)'}   ≈ ${nm}`);
  } else if (cnt === 0) {
    dummySchools.push({ nm, cnt, key, inSekolah });
    console.log(`❌ ZERO     ${cnt.toString().padStart(5)} siswa   ≈ ${nm}`);
  } else {
    okSchools.push({ nm, cnt, key, inDrive });
    console.log(`✅          ${cnt.toString().padStart(5)} siswa   ${key.padEnd(50)} ${nm}`);
  }
}

console.log(`\n─── HASIL ───`);
console.log(`${okSchools.length} sekolah: ada file Dapodik, jumlah siswa cocok`);
console.log(`${dummySchools.length} sekolah: DUMMY DATA (tidak ada file Dapodik di Drive)\n`);

if (dummySchools.length) {
  console.log('Sekolah DUMMY:');
  dummySchools.forEach(s => {
    console.log(`   Jenjang ${s.nm.startsWith('SD ') ? 'SD' : s.nm.startsWith('TK ') ? 'TK' : 'KB'}`);
    console.log(`   Nama    : ${s.nm}`);
    console.log(`   Siswa   : ${s.cnt} (${s.key || 'tidak ada siswa di json'})`);
    console.log(`   sekolah.ts? ${s.inSekolah ? 'ADA' : 'TIDAK'}`);
    console.log('');
  });
}

// Also check: are there any scuole.ts schools with zero rombt.ts students?
console.log('\n─── SEKOLAH.ts dengan TIDAK ada siswa di data-siswa.json ──');
for (const nm of Object.keys(sekSet)) {
  if (sekolahMap[nm] === undefined) {
    // try alternative names
    let found = false;
    for (const [k,v] of Object.entries(sekolahMap)) {
      if (k.includes(nm) || nm.includes(k)) { found = true; break; }
    }
    if (!found) console.log('  sekolah.ts but no siswa:', nm);
  }
}
