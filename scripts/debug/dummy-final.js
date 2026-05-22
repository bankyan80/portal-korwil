const fs = require('fs');
const [rawJson, rawRomb] = [
  fs.readFileSync('src/data/data-siswa.json', 'utf8'),
  fs.readFileSync('src/data/rombel.ts', 'utf8'),
];

const data = JSON.parse(rawJson);
const romboltNames = [...new Set(
  [...rawRomb.matchAll(/\{\s*name:\s*'([^']+)',\s*jenjang:\s*'([^']+)'/g)].map(m => m[1])
)];

// siswa script 1: sekolah key_name → count exact
const c1 = {};
data.forEach(s => { if(s.sekolah) c1[s.sekolah] = (c1[s.sekolah]||0)+1; });

// Build sekolah per ROMB name
function getSc(nm) {
  // Exact
  if (c1[nm] !== undefined) return c1[nm];
  // Strip "SD " → "NEGERI X ..."
  if (nm.startsWith('SD ')) {
    const p = nm.replace(/^SD\s+/,'');
    if (c1[p]) return c1[p];
    const m = nm.match(/^SD\s+NEGERI\s+(\d+)\s+(.+)/i);
    if (m && c1['SDN '+m[1]+' '+m[2]]) return c1['SDN '+m[1]+' '+m[2]];
  }
  // Strip TK/KB/PAUD/XC prefix
  const p2 = nm.replace(/^(TK|KB|PAUD)\s+/i,'');
  if (c1[p2]) return c1[p2];
  // Full includes
  for (const [k,v] of Object.entries(c1)) {
    if (nm.includes(k) || k.includes(nm) || nm.includes(p2) || p2.includes(k)) return v;
  }
  return 0;
}

// Canund Drive_filedisplayed_pd school names
const driveFiles = [
  'TK BPP KENANGA',        // Copy of daftar_pd-... (duplicate but exists)
  'SD NEGERI 3 SIGONG',    // DAFTAR PD 12052026 - SDN 3 SIGONG.xlsx
  'KB AH PLUS','KB AMALIA SALSABILA','KB AZ-ZAHRA','KB PALAPA',
  'PAUD AL-HUSNA','PAUD AMANAH','PAUD AN NAIM','PAUD ASY - SYAFIIYAH',
  'PAUD BUDGENVIL','PAUD SPS MELATI','PAUD TUNAS HARAPAN',
  'SD IT AL IRSYAD AL ISLAMIYYAH',
  'SD NEGERI 1 ASEM','SD NEGERI 1 BELAWA','SD NEGERI 1 CIPEUJEUH KULON',
  'SD NEGERI 1 CIPEUJEUH WETAN','SD NEGERI 1 LEMAHABANG','SD NEGERI 1 LEMAHABANG KULON',
  'SD NEGERI 1 LEUWIDINGDING','SD NEGERI 1 PICUNGPUGUR','SD NEGERI 1 SARAJAYA',
  'SD NEGERI 1 SIGONG','SD NEGERI 1 SINDANGLAUT','SD NEGERI 1 TUK KARANGSUWUNG',
  'SD NEGERI 1 WANGKELANG',
  'SD NEGERI 2 BELAWA','SD NEGERI 2 CIPEUJEUH KULON','SD NEGERI 2 CIPEUJEUH WETAN',
  'SD NEGERI 2 LEMAHABANG','SD NEGERI 2 SARAJAYA',
  'SD NEGERI 3 CIPEUJEUH WETAN','SD NEGERI 4 SIGONG',
  'TK AISYIYAH LEMAHABANG','TK AL-AQSO','TK AL-IRSYAD AL-ISLAMIYYAH',
  'TK GELATIK','TK MELATI','TK MUSLIMAT NU','TK NEGERI LEMAHABANG',
];
const ds = new Set(driveFiles);

console.log('=== FINAL DUMMY REPORT ===\n');
let dummySc=[], okSc=[], warnSc=[];
for (const nm of romboltNames.sort((a,b)=>a.localeCompare(b))) {
  const sc = getSc(nm);
  const inDrive = ds.has(nm);
  const tag = (!inDrive) ? '❌ DUMMY' : (sc===0) ? '❌ NO_SISWA' : (inDrive && sc>0) ? '✅ OK' : '⚠️ DRIVE_OK/NO_MATCH';

  if (!inDrive || sc===0) { dummySc.push({nm, sc, inDrive}); }
  else if (true) { /* check declared vs actual — skip for now, just OK */ okSc.push({nm, sc}); }

  console.log(
    `${tag.padEnd(14)}   ${String(sc).padStart(4)} siswa   ${nm}`
  );
}

console.log('\n─── SUMMARY ───');
console.log('DUMMY DATA sekolah (tidak ada file Dapodik di Drive):');
for (const s of dummySc) {
  if(!s.inDrive) console.log(`  ${s.nm}  (${s.sc} siswa di data-siswa.json, TIDAK ada di Drive)`);
}
console.log('\nNote for rombelt schools with smaller siswa count than declared total:');
for (const nm of romboltNames) {
  const m = rawRomb.match(new RegExp("\\{\\s*name:\\s*'" + nm.replace(/'/g,"\\'") + "',[\\s\\S]*?total:\\s*(\\d+)"));
  const tot = m ? +m[1] : 0;
  const sc = getSc(nm);
  if (tot > sc && sc > 0) console.log(`  ${nm}  declared=${tot}  actual=${sc}  MISSING=${tot-sc}`);
}
