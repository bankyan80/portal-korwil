#!/usr/bin/env node
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

function normalizeName(s) {
  if (!s) return '';
  let t = String(s).normalize('NFD').replace(/\p{Diacritic}/gu, '');
  t = t.replace(/[^0-9a-zA-Z\s]/g, ' ');
  t = t.replace(/\s+/g, ' ').trim().toLowerCase();
  return t;
}

const args = process.argv.slice(2);
const doApply = args.includes('--apply');
const onlyTopArgIndex = args.findIndex(a => a === '--only-top');
let onlyTop = null;
if (onlyTopArgIndex !== -1 && args.length > onlyTopArgIndex + 1) onlyTop = parseInt(args[onlyTopArgIndex+1],10) || null;

const root = process.cwd();
const saDir = join(root, 'service-account');
if (!existsSync(saDir)) { console.error('Service account directory not found'); process.exit(1); }
const files = readdirSync(saDir).filter(f => f.endsWith('.json'));
if (files.length === 0) { console.error('No service account JSON found'); process.exit(1); }
const sa = JSON.parse(readFileSync(join(saDir, files[0]), 'utf-8'));

initializeApp({ credential: cert(sa) });
const db = getFirestore();

const dataPath = join(root, 'src', 'data', 'data-siswa.json');
const raw = readFileSync(dataPath, 'utf-8');
const allSiswa = JSON.parse(raw);

const mappingPath = join(root, 'scripts', 'school-mapping.json');
const mp = JSON.parse(readFileSync(mappingPath, 'utf-8'));
let mapping = mp.mapping || {};
if (onlyTop && Number.isInteger(onlyTop)) {
  const entries = Object.entries(mapping).map(([k,v]) => ({k, count: v.count || 0}));
  entries.sort((a,b) => b.count - a.count);
  const chosen = new Set(entries.slice(0, onlyTop).map(e=>e.k));
  mapping = Object.fromEntries(Object.entries(mapping).filter(([k])=>chosen.has(k)));
  console.log(`Using only top ${onlyTop} mapping entries`);
}

const toUpdate = [];
for (const s of allSiswa) {
  if (!s.nik) continue;
  const rawSek = (s.sekolah || '').toString().trim();
  const norm = normalizeName(rawSek || '');
  if (!norm) continue;
  if (mapping[norm]) {
    const canon = mapping[norm].canonical;
    toUpdate.push({ nik: s.nik, original: rawSek, canonical: canon });
  }
}

console.log('Local candidates to update:', toUpdate.length);
if (!doApply) { console.log('Dry-run complete. Re-run with --apply to perform updates.'); process.exit(0); }

const batchSize = 200;
const sleep = ms => new Promise(r=>setTimeout(r, ms));
let committed = 0;
for (let i=0;i<toUpdate.length;i+=batchSize) {
  const batch = db.batch();
  for (const u of toUpdate.slice(i,i+batchSize)) {
    const ref = db.collection('students').doc(u.nik);
    batch.set(ref, { sekolah_original: u.original, sekolah_canonical: u.canonical, sekolah_normalized: normalizeName(u.canonical) }, { merge: true });
  }
  await batch.commit();
  committed += Math.min(batchSize, toUpdate.length - i);
  console.log(`Committed ${committed}/${toUpdate.length}`);
  await sleep(500);
}

console.log('Apply from local complete.');
process.exit(0);
