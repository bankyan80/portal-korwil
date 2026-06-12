const https = require('https');
function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { rejectUnauthorized: false }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}
async function main() {
  const html = await fetch('https://www.portalkorwil.online');
  const matches = html.match(/src="([^"]+\.js[^"]*)"/g) || [];
  for (let m of matches) {
    const src = m.replace(/src="/, '').replace(/"/g, '');
    const url = src.startsWith('http') ? src : 'https://www.portalkorwil.online' + src;
    try {
      const content = await fetch(url);
      const match = content.match(/"apiKey":"([^"]+)"/);
      if (match) {
        console.log('API Key:', match[1]);
        return;
      }
    } catch (e) {}
  }
  console.log('Not found');
}
main().catch(console.error);
