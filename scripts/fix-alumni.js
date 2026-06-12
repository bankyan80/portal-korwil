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
        catch (e) { reject(new Error(d.slice(0,100))); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
}

const httpsGet = require('https');
function getStudents() {
  return new Promise((resolve, reject) => {
    https.get('https://www.portalkorwil.online/api/firestore/students?limit=10000&field=statusSiswa&value=Aktif', { timeout: 120000 }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d).items); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function main() {
  const items = await getStudents();
  const toFix = items.filter(s => 
    (s.kelas === '6' && s.jenjang === 'SD') || 
    (s.kelompok === '2' && (s.jenjang === 'TK' || s.jenjang === 'KB'))
  );
  console.log(`To fix: ${toFix.length} students`);
  let done = 0, err = 0;
  const batchSize = 20;
  for (let i = 0; i < toFix.length; i += batchSize) {
    const batch = toFix.slice(i, i + batchSize);
    const results = await Promise.allSettled(batch.map(s => 
      postRecord(s.id, { statusSiswa: 'Alumni', tahunLulus: 2026, updatedAt: Date.now() })
    ));
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.success) done++;
      else err++;
    }
    if ((i + batchSize) % 200 === 0 || i + batchSize >= toFix.length) {
      console.log(`Progress: ${done} done, ${err} err`);
    }
  }
  console.log(`Final: ${done} updated, ${err} errors`);
}
main().catch(console.error);
