const fs = require('fs');
const [rawJson, rawRomb, rawSekolah] = [
  fs.readFileSync('src/data/data-siswa.json', 'utf8'),
  fs.readFileSync('src/data/rombel.ts', 'utf8'),
  fs.readFileSync('src/data/sekolah.ts', 'utf8'),
];
const data = JSON.parse(rawJson);

// All rombolt schools with their declared totals
const rSchools = [...rawRomb.matchAll(/\{\s*name:\s*'([^']+)',\s*jenjang:\s*'([^']+)',\s*total:\s*(\d+)/g)]
  .map(m => ({ n: m[1], j: m[2], declared: +m[3] }));

// Sekolah.ts schools
const sekSchools = {};
[...rawSekolah.matchAll(/\{\s*nama:\s*'([^']+)'/g)].forEach(m => sekSchools[m[1]] = true);

// data-siswa.json siswa Map[key=normalized sekolah name]
const siswaMap = {};
data.forEach(s => {
  if (!s.sekolah) return;
  siswaMap[s.sekolah] = (siswaMap[s.sekolah] || 0) + 1;
});

// Drive folder school names (canonical, pre-built from our earlier fetch)
const driveCanonical = [
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
];

function stripSD(name) {
  if (name.startsWith('SD NEGERI ')) return name.replace(/^SD\s+/, '');
  if (name.startsWith('SD IT ')) return name.replace(/^SD\s+/, '');
  return name;
}

function getSiswaCount(rombName) {
  // 1. Exact match sekolah key
  if (siswaMap[rombName] !== undefined) return siswaMap[rombName];
  // 2. Strip prefix → match sekolah key
  const plain = stripSD(rombName);
  if (siswaMap[plain] !== undefined) return siswaMap[plain];
  // 3. Substring include
  for (const [k, v] of Object.entries(siswaMap)) {
    if (k === rombName || plain === k) continue;
    if (k.includes(plain) || plain.includes(k)) return v;
  }
  return 0;
}

console.log('=== DUMMY DATA ANALYSIS ===\n');

for (const rs of rSchools) {
  const sc = getSiswaCount(rs.n);
  const inDrive = driveCanonical.some(dn => {
    if (dn === rs.n) return true;
    return dn.includes(rs.n.replace(/^SD\s+/, '')) || rs.n.includes(dn);
  });
  const inSekolah = !!sekSchools[rs.n];
  if (sc === 0 || !inDrive) {
    console.log(`⚠️  DUMMY? ${rs.n}  (${rs.j})`);
    console.log(`   rombt.declared=${rs.declared}  siswa.json count=${sc}  in Drive? ${inDrive}  in sekolah.ts? ${inSekolah}`);
  }
}

console.log('\n=== DETAILED per-school table ===');
for (const rs of rSchools) {
  const sc = getSiswaCount(rs.n);
  const inDrive = driveCanonical.some(dn => dn.replace(/^SD\s+/, '') === rs.n.replace(/^SD\s+/, '') || dn === rs.n);
  const tag = sc === 0 ? '❌ DUMMY (0 siswa)         ' : sc < rs.declared ? '⚠️  DATA (fewer than declared)' : inDrive ? '✅ OK                      ' : '⚠️  rombt OK, no Drive file';
  console.log(`${tag}  ${rs.declared.toString().padStart(4)} decl | ${sc.toString().padStart(4)} actual | ${rs.n.padEnd(50)} (${rs.j})`);
}
