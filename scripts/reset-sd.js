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
        catch (e) { reject(new Error(d.slice(0,50))); }
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
  console.log('Fetching...');
  const r = await fetchJson('https://www.portalkorwil.online/api/firestore/students?limit=10000');
  const sd = r.items.filter(s => s.jenjang === 'SD');

  // 1. Decrement active SD by 1
  const aktif = sd.filter(s => s.statusSiswa === 'Aktif');
  console.log(`SD aktif: ${aktif.length}. Decrementing classes...`);
  let done = 0, err = 0;
  for (let i = 0; i < aktif.length; i += 20) {
    const batch = aktif.slice(i, i + 20);
    const results = await Promise.allSettled(batch.map(s => {
      const k = parseInt(s.kelas || '0', 10);
      if (k >= 2 && k <= 6) {
        return postRecord(s.id, { kelas: String(k - 1), updatedAt: Date.now() });
      }
      return Promise.resolve({ success: true });
    }));
    for (const rr of results) {
      if (rr.status === 'fulfilled' && rr.value.success) done++;
      else err++;
    }
    if ((i + 20) % 1000 === 0 || i + 20 >= aktif.length) {
      console.log(`  decrement: ${done}/${aktif.length}`);
    }
  }
  console.log(`Decrement done: ${done} OK, ${err} err`);

  // 2. Restore remaining SD alumni (7), decrement class 6→5
  const alumni = sd.filter(s => s.statusSiswa === 'Alumni');
  console.log(`SD alumni: ${alumni.length}. Restoring & decrementing...`);
  done = 0; err = 0;
  for (let i = 0; i < alumni.length; i += 20) {
    const batch = alumni.slice(i, i + 20);
    const results = await Promise.allSettled(batch.map(s => {
      const k = parseInt(s.kelas || '0', 10);
      return postRecord(s.id, { statusSiswa: 'Aktif', kelas: String(k - 1), tahunLulus: '', updatedAt: Date.now() });
    }));
    for (const rr of results) {
      if (rr.status === 'fulfilled' && rr.value.success) done++;
      else err++;
    }
    if ((i + 20) % 1000 === 0 || i + 20 >= alumni.length) {
      console.log(`  restore: ${done}/${alumni.length}`);
    }
  }
  console.log(`Restore done: ${done} OK, ${err} err`);

  // 3. Verify
  const r2 = await fetchJson('https://www.portalkorwil.online/api/firestore/students?limit=10000&field=statusSiswa&value=Aktif');
  const sd2 = r2.items.filter(s => s.jenjang === 'SD');
  const byKelas = {};
  for (const s of sd2) { const k = s.kelas || '?'; byKelas[k] = (byKelas[k] || 0) + 1; }
  console.log('Final SD distribution:', JSON.stringify(byKelas));
}
main().catch(console.error);
