const fs = require('fs');
const d = JSON.parse(fs.readFileSync('src/data/data-siswa.json','utf8'));
const c = {};
d.forEach(s => { if(s.sekolah) c[s.sekolah]=(c[s.sekolah]||0)+1; });

// Show all sekolah values (sorted by name)
console.log('=== ALL sekolah values in data-siswa.json ===');
Object.entries(c).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([k,v])=>{
  if(v===0) return;
  let long = k.replace(/\s*KECAMATAN\s+LEMAHABANG/i,'');
  let tag='';
  if(/^NEGERI/.test(k)) tag='[SD-form]';
  else if(/^SDN/.test(k)) tag='[SDN-form]';
  else if(/^TK/.test(k)) tag='[TK-form]';
  else if(/^KB/.test(k)) tag='[KB-form]';
  else if(/^PAUD/.test(k)) tag='[PAUD-form]';
  else if(/^IT AL/.test(k)) tag='[IT-form]';
  else tag='[OTHER]';
  console.log(v.toString().padStart(5)+' | '+tag.padEnd(12)+' | '+k);
});
