const fs = require('fs');
const path = require('path');

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.js')) {
      try {
        const content = fs.readFileSync(p, 'utf8');
        const match = content.match(/"apiKey":"([^"]+)"/);
        if (match && match[1].length > 10) {
          console.log('Found in:', p);
          console.log('  API Key:', match[1]);
          process.exit(0);
        }
      } catch (e) {}
    }
  }
}
walk('.next');
console.log('Not found in .next');
