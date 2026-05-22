import { readFileSync, writeFileSync, createWriteStream } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Download a file from URL to local path
function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirect
        file.close();
        download(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (e) => { file.close(); reject(e); });
  });
}

// Fetch text
function fetch(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  const folderId = '1Ta4fccnpz_JZ8y1JdI8w-rMgt6czQURx';
  
  console.log('Fetching Drive folder page...');
  const html = await fetch(`https://drive.google.com/drive/folders/${folderId}`);
  
  // Try to find file data in script tags
  // Look for pattern: "data-id":"FILE_ID"... "name":"FILE_NAME"
  const matches = html.matchAll(/"data-id":"([^"]+)"[^}]+"name":"([^"]+)"/g);
  
  const files = [];
  for (const m of matches) {
    files.push({ id: m[1], name: m[2] });
  }
  
  console.log(`Found ${files.length} files in folder:`);
  for (const f of files) {
    console.log(`  ${f.id}: ${f.name}`);
  }
  
  // Filter for files we want to process
  const targetKeywords = ['TK AL-IRSYAD', 'KB PERMATA BUNDA', 'PAUD AL HAMBRA', 'PAUD AL-HIDAYAH'];
  const targets = files.filter(f => targetKeywords.some(k => f.name.toUpperCase().includes(k.toUpperCase())));
  
  console.log(`\nTarget files (${targets.length}):`);
  for (const f of targets) {
    console.log(`  ${f.id}: ${f.name}`);
  }
  
  if (targets.length === 0) {
    console.log('No target files found in folder');
    // List all files
    console.log('\nAll files in folder:');
    for (const f of files) {
      console.log(`  ${f.id}: ${f.name}`);
    }
    return;
  }
  
  // Download each target
  for (const f of targets) {
    const dest = join(root, 'tmp', f.name);
    const url = `https://drive.google.com/uc?export=download&id=${f.id}`;
    console.log(`\nDownloading ${f.name}...`);
    try {
      await download(url, dest);
      console.log(`  Saved to ${dest}`);
    } catch (e) {
      console.error(`  Failed: ${e.message}`);
    }
  }
}

main().catch(console.error);
