const fs = require('fs');
const [rawJson, rawRomb, rawSekolah] = [
  fs.readFileSync('src/data/data-siswa.json', 'utf8'),
  fs.readFileSync('src/data/rombel.ts', 'utf8'),
  fs.readFileSync('src/data/sekolah.ts', 'utf8'),
];
const data = JSON.parse(rawJson);

// sekolah key → siswa count from data-siswa.json
const sekolahMap = {};
data.forEach(s => { if(s.sekolah) sekolahMap[s.sekolah] = (sekolahMap[s.sekolah]||0)+1; });

// All unique rombelt school names
const rombNames = [...new Set(
  [...rawRomb.matchAll(/\{\s*name:\s*'([^']+)',\s*jenjang:\s*'([^']+)'/g)].map(m => m[1])
)];

// All sekolah.ts school names
const sekSet = {};
[...rawSekolah.matchAll(/\{\s*nama:\s*'([^']+)'/g)].forEach(m => sekSet[m[1]] = true);

// ─── Drive-folder Dapodik files (canonical names from file listing) ───
const driveSet = new Set([
  'SD NEGERI 3 SIGONG',
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
]);

// ─── Match rombel name → siswa count in data-siswa.json ───
function getSiswa(nm) {
  // 1. Exact match
  if (sekolahMap[nm] !== undefined) return { cnt: sekolahMap[nm], key: nm };

  // 2. Strip prefixes to get bare school name
  //    e.g. "KB AH PLUS" → bare="AH PLUS"
  //         "PAUD AL-HUSNA" → bare="AL-HUSNA"
  //         "SD IT AL IRSYAD..." → bare="IT AL IRSYAD..."
  //         "SD NEGERI 1 ASEM" → bare="1 ASEM"
  const bare = nm
    .replace(/^(TK|KB|PAUD)\s+/i, '')
    .replace(/^SD\s+IT\s+/i, 'IT ')
    .replace(/^SD\s+NEGERI\s+\d+\s+(.+)/i, (_,n) => n)
    .replace(/^SD\s+/i, '');

  // 3. Special SD NEGERI N NAME: sekolah key = "NEGERI N NAME KECAMATAN LEMAHABANG"
  if (nm.match(/^SD\s+NEGERI\s+\d+\s+/i)) {
    const sdm = nm.match(/^SD\s+NEGERI\s+(\d+)\s+(.+)/i);
    if (sdm) {
      const full = 'NEGERI '+sdm[1]+' '+sdm[2]+'KECAMATAN LEMAHABANG';
      if (sekolahMap[full]) return { cnt: sekolahMap[full], key: full };
      const full2 = 'NEGERI '+sdm[1]+' '+sdm[2]+' KECAMATAN LEMAHABANG';
      if (sekolahMap[full2]) return { cnt: sekolahMap[full2], key: full2 };
    }
  }

  // 4. Exact match on bare name
  if (sekolahMap[bare] !== undefined) return { cnt: sekolahMap[bare], key: bare };

  // 5. SDN abbreviation: "SD NEGERI 3 SIGONG" → "SDN 3 SIGONG"
  const sdnM = nm.match(/^SD\s+NEGERI\s+(\d+)\s+(.+)/i);
  if (sdnM && sekolahMap['SDN '+sdnM[1]+' '+sdnM[2]]) {
    return { cnt: sekolahMap['SDN '+sdnM[1]+' '+sdnM[2]], key: 'SDN '+sdnM[1]+' '+sdnM[2] };
  }

  // 6. Final: substring include (try bare vs escola keys stripped of KECAMATAN suffix)
  for (const [k, v] of Object.entries(sekolahMap)) {
    if (nm === k || bare === k) continue;
    const kBare = k.replace(/^(TK|KB|PAUD)\s+/i, '').replace(/\s*KECAMATAN\s+LEMAHABANG/i, '');
    if (bare === kBare) return { cnt: v, key: k };
    if (bare.includes(kBare) || kBare.includes(bare)) return { cnt: v, key: k };
  }
  return { cnt: 0, key: '' };
}

console.log('=== DUMMY DATA DETECTION ===\n');
console.log('Kriteria: sekolah di romb.ts TANPA file Dapodik di Google Drive → dummy data\n');

let dummy = [], ok = [];
for (const nm of rombNames.sort((a,b) => a.localeCompare(b))) {
  const { cnt, key } = getSiswa(nm);
  const inDrive = driveSet.has(nm);

  if (!inDrive || cnt === 0) {
    dummy.push({ nm, cnt, key, inDrive });
    const tag = (!inDrive) ? '❌ NO DAPODIK FILE' : (cnt===0) ? '❌ ZERO SISWA' : '❌ SISWA TIDAK KETEMU';
    console.log(tag + '  |  cnt=' + String(cnt).padStart(4) + '  ≈  "' + (key || '(no match)') + '"');
  } else {
    ok.push({ nm, cnt, key });
    console.log('     ✅    ' + String(cnt).padStart(4) + ' siswa   ≈  ' + nm);
  }
}

console.log('\n══════════════════════════════════════════════════');
console.log('✅ ' + ok.length + ' sekolah: ada Dapodik file di Drive & siswa terdata');
console.log('❌ ' + dummy.length + ' sekolah: DUMMY DATA');
console.log('══════════════════════════════════════════════════\n');

if (dummy.length) {
  console.log('─── DUMMY SCHOOLS ───');
  for (const s of dummy) {
    const src = !s.inDrive ? 'No Dapodik file in Drive' : 'Dapodik file ok, 0 siswa match';
    console.log('  ' + s.nm + ' | siswa=' + s.cnt + ' | key=' + (s.key || 'none') + ' | ' + src);
  }
}
