import { readFileSync, readdirSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Determine service account path
const SA_DIR = new URL('../service-account/', import.meta.url);
const SA_FILES = [];
try {
  const files = readdirSync(SA_DIR).filter(f => f.endsWith('.json'));
  SA_FILES.push(...files);
} catch {}

if (SA_FILES.length === 0) {
  console.error('No service account JSON found in service-account/');
  process.exit(1);
}

const saPath = new URL(SA_FILES[0], SA_DIR);
const sa = JSON.parse(readFileSync(saPath, 'utf-8'));

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    projectId: sa.project_id,
  });
}

const db = admin.firestore();
const collection = db.collection('students');

// Read the full siswa data
const dataPath = new URL('../src/data/data-siswa.json', import.meta.url);
const allSiswa = JSON.parse(readFileSync(dataPath, 'utf-8'));

// Filter only PERMATA BUNDA students
const permata = allSiswa.filter(s => s.sekolah === 'PERMATA BUNDA');
console.log(`Found ${permata.length} PERMATA BUNDA students to sync`);

let success = 0;
let errors = 0;

for (const siswa of permata) {
  try {
    await collection.doc(siswa.nik).set({
      ...siswa,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log(`  OK: ${siswa.nama} (${siswa.nik})`);
    success++;
  } catch (err) {
    console.error(`  ERR: ${siswa.nama} (${siswa.nik}): ${err.message}`);
    errors++;
  }
}

console.log(`\nDone. Synced: ${success}, Errors: ${errors}`);

// Also update total count
const total = allSiswa.length;
console.log(`Total students in JSON: ${total}`);

process.exit(errors > 0 ? 1 : 0);
