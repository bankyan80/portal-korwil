const fs = require('fs');
const d = JSON.parse(fs.readFileSync('src/data/data-siswa.json','utf8'));
const sekolahMap = {};
d.forEach(s => { if(s.sekolah) sekolahMap[s.sekolah]=(sekolahMap[s.sekolah]||0)+1; });

// rombolt.ts schools map
const raw = fs.readFileSync('src/data/rombel.ts','utf8');
const rombeltSchools = [...raw.matchAll(/\{\s*name:\s*'([^']+)',\s*total:\s*(\d+)/g)]
  .map(m => ({ name:m[1], total:+m[2], jenjang:'' }));

// Fix the regex - use proper capture group for jenjang too
const rombeltSchools2 = [...raw.matchAll(/\{\s*name:\s*'([^']+)',\s*jenjang:\s*'([^']+)'/g)]
  .map(m => {
    const totalMatch = raw.slice(m.index, raw.indexOf(']', m.index)).match(/total:\s*(\d+)/);
    return { name: m[1], jenjang: m[2], total: totalMatch? +totalMatch[1] : 0 };
  });

console.log('=== rombolt schools with declared total ===');
let allTotal = 0;
for (const rs of rombeltSchools2) {
  allTotal += rs.total;
  console.log('  ', rs.total, rs.name, `(${rs.jenjang})`);
}
console.log('Total declared in rombolt:', allTotal);

// Map each rombolt school name to exact sekolah in data-jawa
function mapSekolah(romboltName) {
  // 1. Cover
  if (sekolahMap[romboltName]) return { count: sekolahMap[romboltName], key: romboltName };
  // 2. Strip "SD NEGERI" // "SD IT"/* and "TK "/"KB "/"PAUD "
  const clean=romboltName.replace(/^SD IT /,'IT ').replace(/^SD NEGERI /,'NEGERI ').replace(/^SD /,'').replace(/^TK /,'').replace(/^KB /,'').replace(/^PAUD /,'');
  if (sekolahMap[clean]) return {count: sekolahMap[clean], key: clean};
  // 3. Strip "KECAMATAN LEMAHABANG"
  const clean2 = clean.replace(/\s*KECAMATAN\s+LEMAHABANG\s*$/i,'');
  if (sekolahMap[clean2]) return {count: sekolahMap[clean2], key: clean2};
  // 4. Special: SDN abbreviation
  const m = romboltName.match(/^SD NEGERI\s+(\d+)\s+(.+)/i);
  if (m) {
    const sdn = `SDN ${m[1]} ${m[2]}`;
    if (sekolahMap[sdn]) return {count: sekolahMap[sdn], key: sdn};
  }
  // 5. Any includes between censorized names
  const cname = rombeltName.replace(/^SD NEGERI\s+\d+\s+/i,'').replace(/^\d+\s+/,'').trim();
  const ckey = key.replace(/^SD NEGERI\s+\d+\s+/i,'').replace(/^\d+\s+/,'').trim();
  if (cname && ckey && (cname.includes(ckey) || ckey.includes(cname))) return {count:v,key:k};
  // 6. Last resort: for "X NEGERI Y", match "X Y"
  const num = rombeltName.match(/NEGERI\s+(\d+)\s+(.+)/i);
  if (num) {
    const q = num[1]+' '+num[2];
    if (sekolahMap[q]) return {count: sekolahMap[q], key:q};
    for (const [k2,v] of Object.entries(sekolahMap)) {
      if (k2.includes(q)) return {count:v,key:k2};
    }
  }
  return {count: 0, key: ''};
}

console.log('\n=== rombolt school ↔ siswa count match ===');
let zero=[], realCount=0;
for (const rs of rombeltSchools2) {
  const {count, key} = mapSekolah(rs.name);
  if (count===0) zero.push(rs);
  else realCount++;
  console.log(['!!  ','   '][+(count>0)] + rs.total.toString().padStart(4) + ' rombelt total | ' + count.toString().padStart(5) + ' siswa | ' + rs.name + (key ? ' ≈ '+key:''));
}
console.log(`\n--- ${zero.length} schools with zero siswa match in data-siswa.json ---`);
for (const s of zero) console.log(`  ${s.total.toString().padStart(4)}  ${s.name}  (${s.jenjang})`);
