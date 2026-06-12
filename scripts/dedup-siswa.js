const https = require('https');

function delRecord(id) {
  return new Promise((resolve, reject) => {
    const url = `https://www.portalkorwil.online/api/firestore/students?id=${encodeURIComponent(id)}`;
    const u = new URL(url);
    const opts = { hostname: u.hostname, port: u.port, path: u.pathname + u.search, method: 'DELETE', timeout: 15000 };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(data.slice(0,100))); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

const httpsGet = require('https');

function getStudents() {
  return new Promise((resolve, reject) => {
    const url = 'https://www.portalkorwil.online/api/firestore/students?limit=10000';
    https.get(url, { timeout: 120000 }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function main() {
  const r = await getStudents();
  const items = r.items;
  const nisnGroups = {};
  for (const s of items) {
    if (!s.nisn) continue;
    if (!nisnGroups[s.nisn]) nisnGroups[s.nisn] = [];
    nisnGroups[s.nisn].push(s);
  }
  const dups = Object.values(nisnGroups).filter(g => g.length > 1);
  console.log(`Found ${dups.length} duplicate groups`);
  let del = 0, err = 0;
  for (const group of dups) {
    const keep = group.find(s => s.id === s.nisn);
    const toDel = group.find(s => s.id !== s.nisn);
    if (keep && toDel) {
      try {
        const result = await delRecord(toDel.id);
        if (result.success) del++;
        else err++;
      } catch (e) { err++; }
    }
  }
  console.log(`Deleted: ${del}, errors: ${err}`);
}
main().catch(console.error);
