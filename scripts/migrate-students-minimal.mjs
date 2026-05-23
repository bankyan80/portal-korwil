/**
 * Migrate all student documents in Firestore to minimal fields only.
 *
 * Strips rarely-used fields to reduce Firestore storage (~50% reduction per doc).
 *
 * Run: node scripts/migrate-students-minimal.mjs [--dry-run] [--batch-size 100]
 */

import { cert, initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadServiceAccount() {
  const localPath = join(__dirname, '..', 'service-account');
  if (!existsSync(localPath)) return null;
  const files = readdirSync(localPath).filter(f => f.endsWith('.json'));
  if (files.length === 0) return null;
  return JSON.parse(readFileSync(join(localPath, files[0]), 'utf-8'));
}

const sa = loadServiceAccount();
if (!sa) { console.error('Service account not found'); process.exit(1); }

if (!getApps().length) initializeApp({ credential: cert(sa) });
const db = getFirestore();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const batchSize = 500;

const ESSENTIAL_FIELDS = new Set([
  'nik', 'nama', 'jk', 'nisn', 'tempat_lahir', 'tanggal_lahir',
  'nipd', 'agama', 'alamat', 'rt', 'rw', 'dusun', 'desa', 'kecamatan', 'kode_pos',
  'hp', 'rombel', 'kelas', 'sekolah', 'npsn', 'jenjang',
  'layak_pip', 'penerima_kip', 'nomor_kip', 'no_kk', 'no_reg_akta_lahir',
  'anak_ke', 'no_peserta_ujian', 'no_seri_ijazah',
  'data_ayah', 'data_ibu',
  'id', 'createdAt', 'updatedAt',
]);

function pickEssential(raw) {
  const out = {};
  for (const key of Object.keys(raw)) {
    if (ESSENTIAL_FIELDS.has(key)) out[key] = raw[key];
  }
  // Ensure nik exists (it's the doc ID)
  if (!out.nik && raw.id) out.nik = raw.id;
  return out;
}

function estimateSize(obj) {
  return new TextEncoder().encode(JSON.stringify(obj)).length;
}

async function main() {
  console.log('=== Migrate Firestore Students to Minimal Fields ===');
  if (dryRun) console.log('*** DRY RUN — no writes ***\n');

  const snap = await db.collection('students').get();
  const total = snap.size;
  console.log(`Total documents: ${total}\n`);

  const batches = [];
  let currentBatch = db.batch();
  let count = 0;
  let totalBytesSaved = 0;

  for (const doc of snap.docs) {
    const oldData = { id: doc.id, ...doc.data() };
    const oldSize = estimateSize(doc.data());
    const newData = pickEssential(doc.data());
    const newSize = estimateSize(newData);
    const saved = oldSize - newSize;
    totalBytesSaved += saved;

    if (saved > 0 && !dryRun) {
      currentBatch.set(doc.ref, newData, { merge: true });
    }

    count++;
    if (count % 100 === 0) {
      console.log(`  ${count}/${total} processed`);
    }

    if (count % batchSize === 0 && !dryRun) {
      await currentBatch.commit();
      currentBatch = db.batch();
    }
  }

  // Commit last batch
  if (count % batchSize !== 0 && !dryRun && count > 0) {
    await currentBatch.commit();
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Processed: ${count} documents`);
  if (!dryRun) console.log(`Written: ${count} documents (batch commit)`);
  else console.log(`(dry-run — no writes)`);
  console.log(`Total bytes saved: ${(totalBytesSaved / 1024).toFixed(1)} KB`);
  console.log(`Average per doc: ${(totalBytesSaved / Math.max(count, 1)).toFixed(0)} bytes`);

  process.exit(0);
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
