const https = require('https');

function postRecord(id, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ id, data, merge: true });
    const u = new URL('https://www.portalkorwil.online/api/firestore/students');
    const opts = {
      hostname: u.hostname, path: u.pathname, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout: 15000,
    };
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch (e) { reject(new Error(d.slice(0,80))); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 120000 }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function main() {
  const r = await fetchJson('https://www.portalkorwil.online/api/firestore/students?limit=10000');
  const c6 = r.items.filter(s => s.jenjang === 'SD' && s.statusSiswa === 'Aktif' && s.kelas === '6');
  console.log(`Fixing ${c6.length} class 6 students...`);
  let ok = 0, fail = 0;
  for (let i = 0; i < c6.length; i += 20) {
    const batch = c6.slice(i, i + 20);
    const results = await Promise.allSettled(batch.map(s => postRecord(s.id, { kelas: '5' })));
    for (const rr of results) {
      if (rr.status === 'fulfilled' && rr.value.success) ok++;
      else { fail++; console.log('Fail:', rr.reason?.message || JSON.stringify(rr.value).slice(0,60)); }
    }
    if ((i + 20) % 200 === 0 || i + 20 >= c6.length) {
      console.log(`  ${ok} OK, ${fail} fail / ${c6.length}`);
    }
  }
  console.log(`Done: ${ok} OK, ${fail} fail`);

  // Verify
  const r2 = await fetchJson('https://www.portalkorwil.online/api/firestore/students?limit=10000');
  const sdAct = r2.items.filter(s => s.jenjang === 'SD' && s.statusSiswa === 'Aktif');
  const byKelas = {};
  for (const s of sdAct) { const k = s.kelas || '?'; byKelas[k] = (byKelas[k] || 0) + 1; }
  console.log('Final distribution:', JSON.stringify(byKelas));
  console.log('Total SD aktif:', sdAct.length);
}
main().catch(console.error);
