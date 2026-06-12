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
  console.log('Fetching all students...');
  const r = await fetchJson('https://www.portalkorwil.online/api/firestore/students?limit=10000');
  const sdAlumni = r.items.filter(s => s.jenjang === 'SD' && s.statusSiswa === 'Alumni');
  console.log(`SD alumni to restore: ${sdAlumni.length}`);

  let done = 0, err = 0;
  const batchSize = 20;
  for (let i = 0; i < sdAlumni.length; i += batchSize) {
    const batch = sdAlumni.slice(i, i + batchSize);
    const results = await Promise.allSettled(batch.map(s =>
      postRecord(s.id, { statusSiswa: 'Aktif', tahunLulus: '', updatedAt: Date.now() })
    ));
    for (const rr of results) {
      if (rr.status === 'fulfilled' && rr.value.success) done++;
      else err++;
    }
    if ((i + 1) % 1000 === 0 || i + batchSize >= sdAlumni.length) {
      console.log(`Progress: ${done}/${sdAlumni.length} restored, ${err} errors`);
    }
  }
  console.log(`Restore complete: ${done} OK, ${err} errors`);
  // Save progress for resume
  require('fs').writeFileSync('restore-progress.json', JSON.stringify({ done, err }));
}
main().catch(console.error);
