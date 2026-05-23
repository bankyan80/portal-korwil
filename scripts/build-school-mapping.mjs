#!/usr/bin/env node
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function normalizeName(s) {
  if (!s) return '';
  let t = String(s).normalize('NFD').replace(/\p{Diacritic}/gu, '');
  t = t.replace(/[^0-9a-zA-Z\s]/g, ' ');
  t = t.replace(/\s+/g, ' ').trim().toLowerCase();
  return t;
}

function jaccard(a, b) {
  const A = new Set(a.split(' ').filter(Boolean));
  const B = new Set(b.split(' ').filter(Boolean));
  const inter = [...A].filter(x => B.has(x)).length;
  const uni = new Set([...A, ...B]).size;
  return uni === 0 ? 0 : inter / uni;
}

const root = process.cwd();
const saDir = join(root, 'service-account');
const files = readdirSync(saDir).filter(f => f.endsWith('.json'));
if (files.length === 0) { console.error('Service account JSON not found'); process.exit(1); }
const sa = JSON.parse(readFileSync(join(saDir, files[0]), 'utf-8'));

initializeApp({ credential: cert(sa) });
const db = getFirestore();

(async () => {
  const sekolahTs = readFileSync(join(root, 'src', 'data', 'sekolah.ts'), 'utf-8');
  const re = /\{[^}]*?nama:\s*'([^']+)'/g;
  const sekolahList = [];
  let m;
  while ((m = re.exec(sekolahTs)) !== null) sekolahList.push(m[1].trim());

  const canonical = sekolahList.map(s => ({ raw: s, norm: normalizeName(s) }));
  const canonMap = new Map(canonical.map(c => [c.norm, c.raw]));

  console.log(`Found ${sekolahList.length} canonical schools`);
  console.log('Fetching all students from Firestore...');
  const snap = await db.collection('students').get();
  console.log(`Total students fetched: ${snap.size}`);

  const candidates = new Map(); // norm -> {count, rawSet, docIds[]}
  for (const d of snap.docs) {
    const data = d.data();
    const raw = (data.sekolah || '').toString().trim();
    const norm = normalizeName(raw || '');
    if (!norm) continue;
    const ent = candidates.get(norm) || { count: 0, raw: new Set(), docIds: [] };
    ent.count += 1;
    if (ent.raw.size < 10) ent.raw.add(raw);
    if (ent.docIds.length < 5) ent.docIds.push(d.id);
    candidates.set(norm, ent);
  }

  // Build mapping
  const mapping = {};
  const review = [];

  for (const [norm, info] of candidates.entries()) {
    if (canonMap.has(norm)) {
      mapping[norm] = { canonical: canonMap.get(norm), reason: 'exact' , count: info.count, examples: Array.from(info.raw).slice(0,3), docIds: info.docIds };
      continue;
    }

    // look for best candidate by jaccard or substring
    let best = null;
    let bestScore = 0;
    for (const c of canonical) {
      if (c.norm && norm.includes(c.norm)) {
        best = c; bestScore = 1.0; break;
      }
      const jac = jaccard(norm, c.norm);
      if (jac > bestScore) { bestScore = jac; best = c; }
    }

    if (best && bestScore >= 0.6) {
      mapping[norm] = { canonical: best.raw, reason: `jaccard:${bestScore.toFixed(2)}`, count: info.count, examples: Array.from(info.raw).slice(0,3), docIds: info.docIds };
    } else {
      review.push({ norm, count: info.count, examples: Array.from(info.raw).slice(0,3), docIds: info.docIds });
    }
  }

  const outPath = join(root, 'scripts', 'school-mapping.json');
  writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), mapping, review }, null, 2), 'utf-8');
  console.log('Wrote mapping to', outPath);

  const reviewCsv = join(root, 'scripts', 'school-mapping-review.csv');
  const lines = ['normalized,count,examples,docIds'];
  for (const r of review) lines.push(`"${r.norm}",${r.count},"${r.examples.join(' | ')}","${r.docIds.join(' | ')}"`);
  writeFileSync(reviewCsv, lines.join('\n'), 'utf-8');
  console.log('Wrote review CSV to', reviewCsv);

  console.log('Summary:');
  console.log('- mapped candidates:', Object.keys(mapping).length);
  console.log('- review candidates:', review.length);
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
