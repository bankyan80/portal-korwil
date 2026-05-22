const fs = require('fs');
const rombelRaw = fs.readFileSync('src/data/rombel.ts','utf8');
const data = JSON.parse(fs.readFileSync('src/data/data-siswa.json','utf8'));
const sekolahMap = {};
for (const s of data) { if (s.sekolah) sekolahMap[s.sekolah] = (sekolahMap[s.sekolah]||0)+1; }
const rbeltSchools = [...rombelRaw.matchAll(/\{\s*name:\s*'([^']+)',\s*jenjang:\s*'([^']+)'/g)]
  .map(m => ({ name:m[1], jenjang:m[2] }));

// Proven working logic: stripSD prefix yields EXACT EXACT substitution
// sekolah key = rombelt name with "SD NEGERI" → "NEGERI" and "SD IT" → nothing
function getKey(name) {
  if (name.startsWith('SD IT')) return name.replace(/^SD\s+/,'');
  if (name.startsWith('SD NEGERI')) return name.replace(/^SD\s+/,'');
  if (name.match(/^SDN\s*\d+/)) return name; // already short
  return name;
}

console.log('=== Sejarah match with exact SEKOLAH key===');
let empty=[], nonEmpty=[];
for (const rs of rbeltSchools) {
  const key = getKey(rs.name);
  const cnt = sekolahMap[key] || 0;
  if (cnt===0) {
    // Do a last-chance includes search
    let hit=0, hitKey='';
    for (const [k,v] of Object.entries(sekolahMap)) {
      if (key.includes(k) || k.includes(key)) { hit=v; hitKey=k; break; }
    }
    if (hit>0) { nonEmpty.push({...rs,count:hit,matchKey:hitKey}); }
    else { empty.push(rs); }
  } else { nonEmpty.push({...rs, count:cnt, matchKey:key}); }
}
nonEmpty.sort((a,b)=>a.jenjang.localeCompare(b.jenjang));
empty.sort((a,b)=>a.name.localeCompare(b.name));
console.log(`\n${nonEmpty.length} have siswa, ${empty.length} have NONE:\n`);
if (nonEmpty.length) {
  console.log('--- Schools with recorded students ---');
  for (const s of nonEmpty) {
    console.log(`  ${String(s.count).padStart(5)} | ${s.jenjang.padEnd(5)} | ${s.name.padEnd(50)} ≈ ${s.matchKey}`);
  }
}
if (empty.length) {
  console.log('\n--- Schools with ZERO students ---');
  for (const s of empty) console.log(`        | ${s.jenjang.padEnd(5)} | ${s.name}`);
  console.log('\nClosest sekolah keys found and ACTION: (romb.ts name not in db as ANY record)');
  for (const s of empty) {
    for (const [k,v] of Object.entries(sekolahMap).sort((a,b)=>b[1]-a[1])) {
      if (k.includes(s.name.replace(/^SD\s+/,''))) {
        console.log(`  [${String(v).padStart(4)}]  "${k}"  ← PLEASE verify vs "${s.name}" if same school`);
      }
    }
  }
}
