const fs = require('fs');
const [rawJson, rawRomb, rawSekolah] = [
  fs.readFileSync('src/data/data-siswa.json', 'utf8'),
  fs.readFileSync('src/data/rombel.ts', 'utf8'),
  fs.readFileSync('src/data/sekolah.ts', 'utf8'),
];

const data = JSON.parse(rawJson);

// ─── SEKOLAH SET ───
const sekSchools = {};
[...rawSekolah.matchAll(/\{\s*nama:\s*'([^']+)'/g)].forEach(m => sekSchools[m[1]] = true);

// ─── ROENABELTS (YANG TERDAPET YANG TERDAPET DI KE.CLASS)
// jadikan DULU) YANG)
const rFlatRaw = [...new Set(
  [...rawRomb.matchAll(/\{\s*name:\s*'([^']+)',\s*jenjang:\s*'([^']+)'/g)]
    .map(m => m[1])
)];

// Declared totals per school
const rTotal = {};
for (const nm of rFlatRaw) {
  const m = rawRomb.match(new RegExp("\\{\\s*name:\\s*'" + nm.replace(/'/g,"\\'") + "',[\\s\\S]*?total:\\s*(\\d+)"));
  rTotal[nm] = m ? +m[1] : 0;
}

// ─── DRIVE-FOLDER SCHOOLS ───
// Exact daftar_pd- school names parsed from the Drive page listing:
const driveFiles = [
  'TK BPP KENANGA',        // "Copy of daftar_pd-TK BPP KENANGA..."
  'SD NEGERI 3 SIGONG',    // "DAFTAR PD 12052026 - SDN 3 SIGONG.xlsx" — different format
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
  'TK GELATIK',
  'TK MELATI',
  'TK MUSLIMAT NU',
  'TK NEGERI LEMAHABANG',
];
const driveSet = new Set(driveFiles);

// ─── SISWA COUNT MAP ───
const siswaMap = {};
data.forEach(s => { if(s.sekolah) siswaMap[s.sekolah] = (siswaMap[s.sekolah]||0)+1; });

// ─── HELPER ───
function studentCountFor(name) {
  // 1. Exact
  if (siswaMap[name] !== undefined) return siswaMap[name];
  // 2. Strip "SD " / "SDN " prefix
  const p1 = name.replace(/^SD\s+/i, '');
  if (siswaMap[p1] !== undefined) return siswaMap[p1];
  // 3. Substring include
  for (const [k, v] of Object.entries(siswaMap)) {
    if (p1.includes(k) || k.includes(p1)) return v;
  }
  return 0;
}

function jenjangFrom(nm) {
  if (nm.startsWith('SD ')) return 'SD';
  if (nm.startsWith('TK ')) return 'TK';
  if (nm.startsWith('KB ')) return 'KB';
  if (nm.startsWith('PAUD ')) return 'KB';
  return '?';
}

// ─── MAIN REPORT ───
console.log('=== DAPODIK UPLOAD → DUMMY DATA ANALYSIS ===\n');
console.log('Kelas sekolah di romb.ts\t│');
console.log('Hasil\t\t\t\t│ Declared | Siswa | Nama Sekolah');
console.log('─'.repeat(100));

let dummySchools = [], realSchools = [];
for (const nm of rFlatRaw) {
  const sc = studentCountFor(nm);
  const inDrive = driveSet.has(nm) || (nm==='KB AH PLUS' && driveSet.has('KB AH PLUS'));
  const jj = jenjangFrom(nm);
  let status;
  if (!inDrive) {
    status = '❌ DUMMY';
    dummySchools.push({ name: nm, jenjang: jj, declared: rTotal[nm], siswa: sc });
  } else if (sc === 0) {
    status = '⚠️  ZERO SISWA';
    dummySchools.push({ name: nm, jenjang: jj, declared: rTotal[nm], siswa: sc });
  } else if (sc < rTotal[nm]) {
    status = '⚠️  PARTIAL';
    dummySchools.push({ name: nm, jenjang: jj, declared: rTotal[nm], siswa: sc });
  } else {
    status = '✅ OK';
    realSchools.push({ name: nm, jenjang: jj, declared: rTotal[nm], siswa: sc });
  }
  console.log(`${status}\t│ ${rTotal[nm].toString().padStart(5)}    | ${sc.toString().padStart(5)} | ${nm.padEnd(40)} (${jj})`);
}

console.log('\n─'.repeat(100));
console.log(`Sekolah yang tidak ada di Drive folder mengggunakan rombelYa dummy:`);
dummySchools.forEach(s => {
  console.log(`  ${s.jenjang.padEnd(4)}  ${s.name.padEnd(45)}  declared=${s.declared}  siswa=${s.siswa}`);
});
console.log(`\nTotal ${dummySchools.length} sekolah DUMMY (tidak ada file Dapodik di Drive).`);
console.log(`Total ${realSchools.length} sekolah OK (ada file Dapodik & jumlah siswa sesuai).`);
