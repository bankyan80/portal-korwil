#!/usr/bin/env node
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

function normalizeName(s) {
  if (!s) return '';
  // remove diacritics
  let t = String(s).normalize('NFD').replace(/\p{Diacritic}/gu, '');
  t = t.replace(/[^0-9a-zA-Z\s]/g, ' ');
  t = t.replace(/\s+/g, ' ').trim().toLowerCase();
  return t;
}

const root = process.cwd();
const saDir = join(root, 'service-account');
const files = readdirSync(saDir).filter(f => f.endsWith('.json'));
if (files.length === 0) { console.error('Service account JSON not found'); process.exit(1); }
const sa = JSON.parse(readFileSync(join(saDir, files[0]), 'utf-8'));

initializeApp({ credential: cert(sa) });
const db = getFirestore();

(async () => {
  // read sekolah.ts to get canonical list
  const sekolahTs = readFileSync(join(root, 'src', 'data', 'sekolah.ts'), 'utf-8');
  const re = /\{[^}]*?nama:\s*'([^']+)'/g;
  const sekolahList = [];
  let m;
  while ((m = re.exec(sekolahTs)) !== null) sekolahList.push(m[1].trim());

  const known = new Map(); // normalized -> canonical
  for (const s of sekolahList) known.set(normalizeName(s), s);

  console.log(`Found ${sekolahList.length} known schools from src/data/sekolah.ts`);

  console.log('Fetching all students from Firestore (this may take a moment)...');
  const snap = await db.collection('students').get();
  console.log(`Total students fetched: ${snap.size}`);

  const counts = new Map(); // normalized -> count
  const unmapped = new Map(); // normalized -> { rawNames: Set, count }

  for (const d of snap.docs) {
    const data = d.data();
    const raw = (data.sekolah || '').toString().trim();
    const norm = normalizeName(raw || '');
    if (!norm) continue;
    if (known.has(norm)) {
      counts.set(norm, (counts.get(norm) || 0) + 1);
    } else {
      const entry = unmapped.get(norm) || { raw: new Set(), count: 0 };
      entry.raw.add(raw);
      entry.count += 1;
      unmapped.set(norm, entry);
    }
  }

  const zeroSchools = [];
  for (const [norm, canon] of known.entries ? known.entries() : known) {
    if ((counts.get(norm) || 0) === 0) zeroSchools.push(canon);
  }

  console.log('\nSchools with zero students in Firestore:', zeroSchools.length);
  for (const s of zeroSchools) console.log('- ' + s);

  console.log('\nTop unmapped school name variants (normalized -> count):');
  const unmappedArr = Array.from(unmapped.entries()).sort((a,b)=>b[1].count - a[1].count);
  for (const [norm, v] of unmappedArr.slice(0, 30)) {
    console.log(`- ${norm} => ${v.count}  (examples: ${Array.from(v.raw).slice(0,3).join(' | ')})`);
  }

  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
