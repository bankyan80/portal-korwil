#!/usr/bin/env node
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readdirSync, readFileSync } from 'fs';
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
if (onlyTopArgIndex !== -1 && args.length > onlyTopArgIndex + 1) {
  onlyTop = parseInt(args[onlyTopArgIndex + 1], 10) || null;
}

const root = process.cwd();
const saDir = join(root, 'service-account');
const files = readdirSync(saDir).filter(f => f.endsWith('.json'));
if (files.length === 0) { console.error('Service account JSON not found'); process.exit(1); }
const sa = JSON.parse(readFileSync(join(saDir, files[0]), 'utf-8'));

initializeApp({ credential: cert(sa) });
const db = getFirestore();

const mappingPath = join(root, 'scripts', 'school-mapping.json');
const mp = JSON.parse(readFileSync(mappingPath, 'utf-8'));
  let mapping = mp.mapping || {};
  // support --only-top N to limit mappings applied, choose by mapping[norm].count desc
  if (onlyTop && Number.isInteger(onlyTop)) {
    const entries = Object.entries(mapping).map(([k,v]) => ({k, count: v.count || 0, v}));
    entries.sort((a,b) => b.count - a.count);
    const chosen = new Set(entries.slice(0, onlyTop).map(e => e.k));
    const filtered = {};
    for (const k of Object.keys(mapping)) if (chosen.has(k)) filtered[k] = mapping[k];
    mapping = filtered;
    console.log(`Applying only top ${onlyTop} mapping entries (${Object.keys(mapping).length})`);
  }

(async () => {
  console.log('Loaded mapping entries:', Object.keys(mapping).length);
  console.log('Reading students from Firestore in pages to avoid quota spikes...');
  const pageSize = 400;
  let last = null;
  let read = 0;
  const toUpdate = [];
  while (true) {
    let q = db.collection('students').orderBy('__name__').limit(pageSize);
    if (last) q = q.startAfter(last);
    const snap = await q.get();
    if (snap.empty) break;
    for (const d of snap.docs) {
      const data = d.data();
      const raw = (data.sekolah || '').toString().trim();
      const norm = normalizeName(raw || '');
      if (!norm) continue;
      if (mapping[norm]) {
        const canon = mapping[norm].canonical;
        if (data.sekolah_canonical === canon) continue;
        toUpdate.push({ id: d.id, path: d.ref.path, canonical: canon, original: raw });
      }
    }
    read += snap.size;
    last = snap.docs[snap.docs.length - 1];
    console.log(`Read ${read} documents...`);
    // small delay to be gentle
    await new Promise(r => setTimeout(r, 250));
  }

  console.log('Documents to update:', toUpdate.length);
  if (toUpdate.length === 0) process.exit(0);

  console.log('Examples:');
  for (const e of toUpdate.slice(0,10)) console.log(`- ${e.id}: ${e.original} => ${e.canonical}`);

  if (!doApply) {
    console.log('\nDry-run complete. Re-run with --apply to perform updates.');
    process.exit(0);
  }

  console.log('Applying updates in batches of 200 with short delay between batches...');
  const batchSize = 200;
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  for (let i = 0; i < toUpdate.length; i += batchSize) {
    const batch = db.batch();
    for (const u of toUpdate.slice(i, i + batchSize)) {
      const ref = db.collection('students').doc(u.id);
      const setData = {
        sekolah_original: u.original,
        sekolah_canonical: u.canonical,
        sekolah_normalized: normalizeName(u.canonical),
      };
      batch.set(ref, setData, { merge: true });
    }
    await batch.commit();
    console.log(`Committed batch ${Math.floor(i/batchSize)+1}`);
    await sleep(300);
  }

  console.log('Apply complete.');
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
