#!/usr/bin/env node
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const saDir = join(root, 'service-account');
const files = readdirSync(saDir).filter(f => f.endsWith('.json'));
if (files.length === 0) {
  console.error('Service account JSON not found in service-account/');
  process.exit(1);
}
const sa = JSON.parse(readFileSync(join(saDir, files[0]), 'utf-8'));

initializeApp({ credential: cert(sa) });
const db = getFirestore();

(async () => {
  const school = process.argv[2] || 'PAUD AL HAMBRA';
  console.log(`Querying Firestore for students where sekolah == "${school}"...`);
  const snap = await db.collection('students').where('sekolah', '==', school).get();
  console.log(`Found ${snap.size} documents for school "${school}"`);

  const sample = snap.docs.slice(0, 10);
  if (sample.length > 0) {
    console.log('\nSample documents:');
    for (const d of sample) {
      const data = d.data();
      console.log(`- ${d.id}: ${data.nama || '-'} (NIK: ${data.nik || data.nik_asli || '-'})`);
    }
  } else {
    console.log('No sample documents to show.');
  }

  process.exit(0);
})().catch((err) => {
  console.error('Error while querying Firestore:', err);
  process.exit(1);
});
