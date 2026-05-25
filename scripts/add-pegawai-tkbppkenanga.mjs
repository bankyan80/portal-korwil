import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
function csv(t) {
  const r=[];let c=[],f='',q=0;
  for(let i=0;i<t.length;i++){const ch=t[i];
    if(q){if(ch==='"'){if(t[i+1]==='"'){f+='"';i++}else q=0}else f+=ch}
    else if(ch==='"')q=1
    else if(ch===','){c.push(f.trim());f=''}
    else if(ch==='\r'){}
    else if(ch==='\n'){c.push(f.trim());f='';if(c.length>4&&c.filter(x=>x).length>1)r.push(c);c=[]}
    else f+=ch}
  if(f||c.length){c.push(f.trim());if(c.filter(x=>x).length>1)r.push(c)}
  return r;
}
const sekolah='TK BPP KENANGA';
const files=[
  {p:'../src/data/pegawai-guru-tkbppkenanga.csv',role:'guru'},
  {p:'../src/data/pegawai-tendik-tkbppkenanga.csv',role:'tendik'},
];
const all=[];
for(const f of files){
  const rows=csv(readFileSync(new URL(f.p,import.meta.url),'utf-8'));
  for(const r of rows){
    const nik=(r[44]||'').trim();if(!nik)continue;
    const p={nik,nama:(r[1]||'').trim().toUpperCase(),jk:(r[3]||'').trim().toUpperCase(),nuptk:(r[2]||'').trim(),tanggal_lahir:(r[5]||'').trim(),nip:(r[6]||'').trim(),status_kepegawaian:(r[7]||'').trim(),jenis_ptk:(r[8]||'').trim(),tugas_tambahan:(r[20]||'').trim(),sertifikasi:'',tmt:(r[24]||'').trim(),sekolah,role:f.role};
    if(all.some(x=>x.nik===p.nik))continue;all.push(p);
  }
}
const dp=new URL('../src/data/data-pegawai.json',import.meta.url);
const ex=JSON.parse(readFileSync(dp,'utf-8'));let a=0;
for(const p of all){if(ex.some(e=>e.nik===p.nik))continue;ex.push(p);a++}
writeFileSync(dp,JSON.stringify(ex,null,2),'utf-8');
console.log('Added:',a,'Total:',ex.length);

const cl=ex.filter(p=>p.nik&&p.nama&&p.nama!=='NAMA');
if(cl.length!==ex.length){writeFileSync(dp,JSON.stringify(cl,null,2),'utf-8');console.log('Cleaned NAMA');}

const admin = require('firebase-admin');
const SA_DIR = new URL('../service-account/', import.meta.url);
const sa = JSON.parse(readFileSync(new URL(readdirSync(SA_DIR).filter(f=>f.endsWith('.json'))[0], SA_DIR), 'utf-8'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id });
const data = JSON.parse(readFileSync(dp, 'utf-8'));
const list = data.filter(p => p.sekolah === sekolah);
(async ()=>{
  for (const p of list) {
    await admin.firestore().collection('employees').doc(p.nik).set({ ...p, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    console.log('OK:', p.nama);
  }
  console.log('Synced:', list.length);
})();
