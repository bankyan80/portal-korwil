#!/usr/bin/env node
import https from 'https';
import http from 'http';
import { spawnSync } from 'child_process';

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else { current += ch; }
  }
  result.push(current.trim());
  return result;
}

async function fetchText(url) {
  const maxRedirects = 5;
  for (let r = 0; r < maxRedirects; r++) {
    const result = await new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          resolve({ redirect: res.headers.location });
          return;
        }
        let data = '';
        res.on('data', (c) => data += c);
        res.on('end', () => resolve({ data }));
      }).on('error', reject);
    });
    if (result.data) return result.data;
    if (result.redirect) { url = result.redirect; continue; }
  }
  throw new Error('Too many redirects');
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length < 2) {
    console.error('Usage: node scripts/import-and-sync-gsheets.mjs <csv-url> <sekolah-name> [jenjang] [--dry-run] [--batch-size <n>] [--delay-ms <ms>] [--no-skip-unchanged] [--resume] [--resume-file <path>]');
    process.exit(1);
  }

  const getFlagValue = (flag) => {
    const idx = argv.indexOf(flag);
    if (idx !== -1 && idx + 1 < argv.length) return argv[idx + 1];
    return null;
  };

  const positional = argv.filter(a => !a.startsWith('--'));
  const url = positional[0];
  const sekolah = positional[1];
  const jenjang = positional[2] || 'TK';
  const dryRun = argv.includes('--dry-run');
  const skipUnchanged = !argv.includes('--no-skip-unchanged');
  const resume = argv.includes('--resume');
  const resumeFile = getFlagValue('--resume-file') || 'scripts/sync-siswa.resume.json';
  const batchSize = parseInt(getFlagValue('--batch-size') || '100', 10) || 100;
  const delayMs = parseInt(getFlagValue('--delay-ms') || '200', 10) || 200;

  console.log(`Fetching CSV from ${url}...`);
  const csvText = await fetchText(url);
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());

  // find header row like in import-siswa-csv.mjs
  let hdrIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols[0] === 'No' && cols[1] === 'Nama') { hdrIdx = i; break; }
  }
  if (hdrIdx < 0) { console.error('Header row not found'); process.exit(1); }

  let count = 0;
  for (let i = hdrIdx + 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (!cols || !cols[0]) continue;
    if (isNaN(parseInt(cols[0]))) continue;
    const nik = String(cols[7] || '').trim();
    if (!nik) continue;
    count++;
  }

  console.log(`Found ${count} valid student rows in CSV (school: ${sekolah}).`);
  if (dryRun) {
    console.log('Dry-run mode: not importing or syncing.');
    process.exit(0);
  }

  console.log('Running import script...');
  const imp = spawnSync('node', ['scripts/import-siswa-csv.mjs', url, sekolah, jenjang], { stdio: 'inherit' });
  if (imp.status !== 0) {
    console.error('Import script failed'); process.exit(imp.status || 1);
  }

  console.log('Running sync script to push to Firestore (only imported school)...');
  const syncArgs = ['scripts/sync-siswa.mjs', '--sekolah', sekolah];
  if (skipUnchanged) syncArgs.push('--skip-unchanged');
  if (dryRun) syncArgs.push('--dry-run');
  if (resume) syncArgs.push('--resume');
  if (resumeFile) syncArgs.push('--resume-file', resumeFile);
  syncArgs.push('--batch-size', String(batchSize));
  syncArgs.push('--delay-ms', String(delayMs));
  const sync = spawnSync('node', syncArgs, { stdio: 'inherit' });
  if (sync.status !== 0) {
    console.error('Sync script failed'); process.exit(sync.status || 1);
  }

  console.log('Import and sync completed successfully.');
}

main().catch(err => { console.error(err); process.exit(1); });
