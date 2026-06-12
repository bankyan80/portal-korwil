const https = require('https');

function post(url, cursor) {
  return new Promise((resolve, reject) => {
    const uri = cursor ? `${url}?cursor=${cursor}` : url;
    const u = new URL(uri);
    const body = JSON.stringify({});
    const opts = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'temp-naik-kelas-bypass',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 45000,
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`Parse: ${data.slice(0,200)}`)); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
}

async function main() {
  const url = 'https://www.portalkorwil.online/api/admin/naik-kelas';
  let cursor = '3209070411130002';
  let tp = 0, tn = 0, ta = 0, te = 0;
  let r = 0;
  while (true) {
    r++;
    const res = await post(url, cursor);
    console.log(`[${r}] cursor=${cursor} => p=${res.processed} naik=${res.naikKelas} alumni=${res.jadiAlumni}`);
    tp += res.processed || 0; tn += res.naikKelas || 0; ta += res.jadiAlumni || 0; te += res.errors || 0;
    if (res.done) break;
    cursor = res.nextCursor;
    if (!cursor) break;
  }
  console.log(`=== DONE: ${tp} p, ${tn} naik, ${ta} alumni, ${te} err ===`);
}
main().catch(console.error);
