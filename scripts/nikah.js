const https = require('https');

function postRecord(id, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ id, data, merge: true });
    const u = new URL('https://www.portalkorwil.online/api/firestore/students');
    const opts = {
      hostname: u.hostname, path: u.pathname, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout: 30000,
    };
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch (e) { reject(new Error(d.slice(0,100))); }
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
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

async function main() {
  const r = await fetchJson('https://www.portalkorwil.online/api/firestore/students?limit=10000');
  const aktif = r.items.filter(s => s.statusSiswa === 'Aktif');
  console.log(`Aktif: ${aktif.length}`);

  const updates = [];
  for (const s of aktif) {
    const j = s.jenjang;
    let data = null;
    if (j === 'SD') {
      const k = parseInt(s.kelas || '0', 10);
      if (k >= 1 && k <= 5) data = { kelas: String(k + 1) };
      else if (k === 6) data = { statusSiswa: 'Alumni', tahunLulus: 2026 };
    } else if (j === 'TK' || j === 'KB') {
      const kl = parseInt(s.kelompok || s.kelas || '0', 10);
      if (kl === 1) data = { kelompok: '2', kelas: '' };
      else if (kl === 2) data = { statusSiswa: 'Alumni', tahunLulus: 2026 };
    }
    if (data) updates.push({ id: s.id, data, isAlumni: !!data.statusSiswa });
  }
  console.log(`To update: ${updates.length}`);

  let nk = 0, ja = 0, err = 0;
  for (let i = 0; i < updates.length; i += 50) {
    const batch = updates.slice(i, i + 50);
    const results = await Promise.allSettled(batch.map((u, idx) => postRecord(u.id, u.data).then(r => ({ r, idx }))));
    for (const rr of results) {
      if (rr.status === 'fulfilled' && rr.value.r.success) {
        if (batch[rr.value.idx].isAlumni) ja++; else nk++;
      } else err++;
    }
    if ((i + 50) % 500 === 0 || i + 50 >= updates.length) {
      console.log(`  ${i + 50}/${updates.length} (nk:${nk} alumni:${ja} err:${err})`);
    }
  }
  console.log(`Done: ${nk} naik kelas, ${ja} alumni, ${err} error`);

  // Verify
  const r2 = await fetchJson('https://www.portalkorwil.online/api/firestore/students?limit=10000');
  const sdAct = r2.items.filter(s => s.jenjang === 'SD' && s.statusSiswa === 'Aktif');
  const byK = {};
  for (const s of sdAct) { const k = s.kelas || '?'; byK[k] = (byK[k] || 0) + 1; }
  console.log('SD distribution:', JSON.stringify(byK));
  const sdAl = r2.items.filter(s => s.jenjang === 'SD' && s.statusSiswa === 'Alumni');
  console.log('SD alumni:', sdAl.length);
}
main().catch(console.error);
