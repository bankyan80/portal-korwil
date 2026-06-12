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
  const cutoff = Date.now() - 1200000; // 20 min ago
  const r = await fetchJson('https://www.portalkorwil.online/api/firestore/students?limit=10000');
  const sd = r.items.filter(s => s.jenjang === 'SD' && s.statusSiswa === 'Aktif' && (s.updatedAt < cutoff || !s.updatedAt));
  console.log(`Remaining to decrement: ${sd.length}`);
  const byKelas = {};
  for (const s of sd) { const k = s.kelas || '?'; byKelas[k] = (byKelas[k] || 0) + 1; }
  console.log('Distribution:', JSON.stringify(byKelas));

  if (sd.length === 0) { console.log('Nothing to do'); return; }

  let done = 0;
  for (let i = 0; i < sd.length; i += 20) {
    const batch = sd.slice(i, i + 20);
    const results = await Promise.allSettled(batch.map(s => {
      const k = parseInt(s.kelas || '0', 10);
      if (k >= 2 && k <= 6) {
        return postRecord(s.id, { kelas: String(k - 1) });
      }
      return Promise.resolve({ success: true });
    }));
    for (const rr of results) {
      if (rr.status === 'fulfilled') done++;
    }
    if ((i + 20) % 500 === 0 || i + 20 >= sd.length) {
      console.log(`  decrement: ${done}/${sd.length}`);
    }
  }
  console.log(`Decrement done: ${done}/${sd.length}`);

  // Now fix the 7 SD alumni + remaining class 6
  const r2 = await fetchJson('https://www.portalkorwil.online/api/firestore/students?limit=10000');
  const sdAll = r2.items.filter(s => s.jenjang === 'SD');
  const alumni = sdAll.filter(s => s.statusSiswa === 'Alumni');
  console.log(`SD alumni remaining: ${alumni.length}. Restoring...`);
  if (alumni.length > 0) {
    done = 0;
    for (let i = 0; i < alumni.length; i += 20) {
      const batch = alumni.slice(i, i + 20);
      const results = await Promise.allSettled(batch.map(s => {
        const k = parseInt(s.kelas || '0', 10);
        return postRecord(s.id, { statusSiswa: 'Aktif', kelas: String(k - 1), tahunLulus: '' });
      }));
      for (const rr of results) {
        if (rr.status === 'fulfilled') done++;
      }
    }
    console.log(`Restored: ${done}/${alumni.length}`);
  }

  // Final check
  const r3 = await fetchJson('https://www.portalkorwil.online/api/firestore/students?limit=10000');
  const sd3 = r3.items.filter(s => s.jenjang === 'SD' && s.statusSiswa === 'Aktif');
  const finalByKelas = {};
  for (const s of sd3) { const k = s.kelas || '?'; finalByKelas[k] = (finalByKelas[k] || 0) + 1; }
  console.log('Final:', JSON.stringify(finalByKelas));
  console.log('Total:', sd3.length);
}
main().catch(console.error);
