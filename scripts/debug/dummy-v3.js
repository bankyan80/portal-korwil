const fs = require('fs');
const [rawJson, rawRomb, rawSekolah] = [
  fs.readFileSync('src/data/data-siswa.json', 'utf8'),
  fs.readFileSync('src/data/rombel.ts', 'utf8'),
  fs.readFileSync('src/data/sekolah.ts', 'utf8'),
];
const data = JSON.parse(rawJson);

// siswa count by sekolah key
const sekolahMap = {};
data.forEach(s => { if(s.sekolah) sekolahMap[s.sekolah] = (sekolahMap[s.sekolah]||0)+1; });

// All rombelt schools
const rombNames = [...new Set(
  [...rawRomb.matchAll(/\{\s*name:\s*'([^']+)',\s*jenjang:\s*'([^']+)'/g)].map(m => m[1])
)];

// sekolah.ts schools
const sekSet = {};
[...rawSekolah.matchAll(/\{\s*nama:\s*'([^']+)'/g)].forEach(m => sekSet[m[1]] = true);

// Drive Dapodik files (canonical names)
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

// ─── Fixed matching: strip ALL prefixes before comparing ───
// In data-siswa.json, sekolah keys are: "AH PLUS", "AL-HUSNA", "IT AL IRSYAD...", "NEGERI 1 X..."
// romb.ts names are: "TK/PPL", "KB AH PLUS", Tuberculosis.

function getSiswa(nm) {
  // 1. Exact
  if (sekolahMap[nm] !== undefined) return { cnt: sekolahMap[nm], key: nm };

  // 2. Strip prefix: TK/KB/PAUD/X → bare name; SD NEGERI → NEGERI; SD IT → IT
  const bare = nm.replace(/^(TK|KB|PAUD)\s+/i,'')
                 .replace(/^SD\s+IT\s+/i,'IT ')
                 .replace(/^SD\s+NEGERI\s+\d+\s+(.+)/i,(_,n)=>n)  // "SD NEGERI 1 ASEM" → "ASEM"
                 .replace(/^SD\s+/i,'');

  // Special SD NEGERI N NAME: key = "NEGERI N NAME KECAMATAN LEMAHABANG"
  if (nm.match(/^SD NEGERI \d+ /i)) {
    const m2 = nm.match(/^SD\s+NEGERI\s+(\d+)\s+(.+)/i);
    if (m2 && sekolahMap['NEGERI '+m2[1]+' '+m2[2]+'KECAMATAN LEMAHABANG']) {
      return { cnt: sekolahMap['NEGERI '+m2[1]+' '+m2[2]+'KECAMATAN LEMAHABANG'],
               key:    'NEGERI '+m2[1]+' '+m2[2]+'KECAMATAN LEMAHABANG' };
    }
    // removable by substring
    for (const [k,v] of Object.entries(sekolahMap)) {
      const kStripped = k.replace(/\s*KECAMATAN\s+LEMAHABANG/i,'');
      if (bare === kStripped) return { cnt: v, key: k };
    }
  }

  // 3. Bare key
  if (sekolahMap[bare] !== undefined) return { cnt: sekolahMap[bare], key: bare };

  // 4. SDN form: "SD NEGERI 3 SIGONG" → "SDN 3 SIGONG"
  const m3 = nm.match(/^SD\s+NEGERI\s+(\d+)\s+(.+)/i);
  if (m3 && sekolahMap['SDN '+m3[1]+' '+m3[2]]) {
    return { cnt: sekolahMap['SDN '+m3[1]+' '+m3[2]], key: 'SDN '+m3[1]+' '+m3[2] };
  }

  // 5. Final includes-search
  for (const [k,v] of Object.entries(sekolahMap)) {
    if (k === nm || bare === k) continue;
    const kBare = k.replace(/^(TK|KB|PAUD)\s+/i,'').replace(/\s*KECAMATAN\s+LEMAHABANG/i,'');
    if (bare.includes(kBare) || kBare.includes(bare)) return { cnt: v, key: k };
  }
  return { cnt: 0, key: '' };
}
    }
  }
  // 5. Final: try bare name = "X" vs sekolah keys
  for (const [k,v] of Object.entries(sekolahMap)) {
    if (nm === k || bare === k || bare === k.replace(/^(TK|KB|PAUD)\s+/,'')) return { cnt: v, key: k };
    const kBare = k.replace(/^(TK|KB|PAUD)\s+/i,'');
    if (kBare === bare) return { cnt: v, key: k };
    if (bare.includes(kBare) || kBare.includes(bare)) return { cnt: v, key: k };
  }
  return { cnt: 0, key: '' };
}

console.log('=== 🔍 DUMMY DATA DETECTION (FIXED) ===\n');
console.log('Sekolah di romb.ts yang TIDAK ada file Dapodik di Drive = DUMMY DATA\n');

let dummy=[], ok=[];
for (const nm of rombNames.sort((a,b)=>a.localeCompare(b))) {
  const { cnt, key } = getSiswa(nm);
  const inDrive = driveSet.has(nm) || (nm==='KB AH PLUS' && driveSet.has('KB AH PLUS'));

  if (!inDrive) {
    dummy.push({nm, cnt, key, inDrive});
    console.log(`❌ DUMMY    ${String(cnt).padStart(4)} siswa   key: "${key}"  ≈ ${nm}`);
  } else if (cnt === 0) {
    dummy.push({nm, cnt, key, inDrive});
    console.log(`❌ ZERO     ${String(cnt).padStart(4)} siswa   key: "${key}"  ≈ ${nm}`);
  } else {
    ok.push({nm, cnt, key});
    console.log(`✅          ${String(cnt).padStart(4)} siswa   ≈ ${key.padEnd(45)} ${nm}`);
  }
}

console.log(`\n✅ ${ok.length} sekolah BERDATANGAN (ada Dapodik file di Drive)`);
console.log(`❌ ${dummy.length} sekolah DUMMY DATA (tidak ada Dapodik file di Drive)\n`);
if (dummy.length) {
  console.log('--- Daftar Sekolah DUMMY ---');
  for (const s of dummy) {
    console.log(`  ${s.inDrive ? '[ZERO SISWA]' : '[NO DRIVE FILE]'}  ${s.nm}  (${s.cnt} siswa)`);
  }
}
