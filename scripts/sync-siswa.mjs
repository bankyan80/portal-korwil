/**
 * ⚠️  QUOTA WARNING  ⚠️
 * With --skip-unchanged (default), this script does db.getAll() which reads
 * EVERY document in the collection (~6991 reads). This alone can consume
 * ~14% of the daily Firestore Spark Plan read quota (50K).
 *
 * If you only need to write new data, use --no-skip-unchanged to avoid
 * the read-all step.
 *
 * If sync fails with RESOURCE_EXHAUSTED, wait a few hours for quota to
 * reset, then retry with --resume or --no-skip-unchanged.
 */

import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync, readdirSync, unlinkSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Load service account
const saDir = join(root, 'service-account');
if (!existsSync(saDir)) {
  console.error('Service account directory not found');
  process.exit(1);
}
const files = readdirSync(saDir).filter(f => f.endsWith('.json'));
if (files.length === 0) {
  console.error('No service account JSON found');
  process.exit(1);
}
const sa = JSON.parse(readFileSync(join(saDir, files[0]), 'utf-8'));

const app = initializeApp({ credential: cert(sa) });
const db = getFirestore(app);

// Fields to KEEP in Firestore (excludes rarely-used data like physical, bank, coordinates)
const MINIMAL_FIELDS = new Set([
  'nik', 'nama', 'jk', 'nisn', 'tempat_lahir', 'tanggal_lahir',
  'nipd', 'agama', 'alamat', 'rt', 'rw', 'dusun', 'desa', 'kecamatan', 'kode_pos',
  'hp', 'rombel', 'kelas', 'sekolah', 'npsn', 'jenjang',
  'layak_pip', 'penerima_kip', 'nomor_kip', 'no_kk', 'no_reg_akta_lahir',
  'anak_ke', 'no_peserta_ujian', 'no_seri_ijazah',
  'data_ayah', 'data_ibu',
]);

function pickMinimal(raw) {
  const out = {};
  for (const key of Object.keys(raw)) {
    if (MINIMAL_FIELDS.has(key)) out[key] = raw[key];
  }
  return out;
}

// read args
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const minimal = !args.includes('--full');
const skipUnchanged = !args.includes('--no-skip-unchanged');
const resume = args.includes('--resume');
const resetResume = args.includes('--reset-resume');
const resumeFileArgIndex = args.findIndex(a => a === '--resume-file');
const resumeFile = resumeFileArgIndex !== -1 && args[resumeFileArgIndex + 1]
  ? args[resumeFileArgIndex + 1]
  : join(root, 'scripts', 'sync-siswa.resume.json');
const sekolahArgIndex = args.findIndex(a => a === '--sekolah' || a === '-s');
const sekolahFilter = sekolahArgIndex !== -1 && args[sekolahArgIndex + 1] ? args[sekolahArgIndex + 1] : null;
const batchSizeArgIndex = args.findIndex(a => a === '--batch-size');
const batchSize = batchSizeArgIndex !== -1 && args[batchSizeArgIndex + 1] ? parseInt(args[batchSizeArgIndex + 1], 10) || 50 : 50;
const delayMsArgIndex = args.findIndex(a => a === '--delay-ms');
const delayMs = delayMsArgIndex !== -1 && args[delayMsArgIndex + 1] ? parseInt(args[delayMsArgIndex + 1], 10) || 500 : 500;

// Read siswa data
const raw = readFileSync(join(root, 'src', 'data', 'data-siswa.json'), 'utf-8');
const allSiswa = JSON.parse(raw);

// load mapping if exists
let mapping = null;
const mappingPath = join(root, 'scripts', 'school-mapping.json');
try { mapping = JSON.parse(readFileSync(mappingPath, 'utf-8')).mapping || null; } catch (e) { mapping = null; }

function normalizeName(s) {
  if (!s) return '';
  let t = String(s).normalize('NFD').replace(/\p{Diacritic}/gu, '');
  t = t.replace(/[^0-9a-zA-Z\s]/g, ' ');
  t = t.replace(/\s+/g, ' ').trim().toLowerCase();
  return t;
}

function stableStringify(value) {
  if (value === null || value === undefined) return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  if (typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return '{' + keys.map(k => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',') + '}';
  }
  return JSON.stringify(value);
}

function payloadEquals(existing, payload) {
  if (!existing) return false;
  for (const key of Object.keys(payload)) {
    if (key === 'updatedAt') continue;
    if (stableStringify(existing[key]) !== stableStringify(payload[key])) return false;
  }
  return true;
}

const validSiswa = allSiswa.filter(s => s.nik && s.nik.trim());
const skipped = allSiswa.length - validSiswa.length;
if (skipped) {
  console.log(`Skipped ${skipped} siswa with empty NIK:`);
  allSiswa.filter(s => !s.nik || !s.nik.trim()).forEach(s => console.log(`  - ${s.nama} (${s.sekolah})`));
}

const filteredSiswa = sekolahFilter
  ? validSiswa.filter(s => s.sekolah === sekolahFilter)
  : validSiswa;

let resumeIndex = 0;
if (resetResume && existsSync(resumeFile)) {
  unlinkSync(resumeFile);
  console.log(`Cleared resume state file: ${resumeFile}`);
}
if (resume) {
  if (existsSync(resumeFile)) {
    try {
      const loaded = JSON.parse(readFileSync(resumeFile, 'utf-8'));
      if (loaded && typeof loaded.nextIndex === 'number' && loaded.sekolahFilter === sekolahFilter) {
        resumeIndex = loaded.nextIndex;
        console.log(`Resuming from index ${resumeIndex} using state file ${resumeFile}`);
      } else {
        console.warn(`Resume file found but not compatible with current run, starting from beginning: ${resumeFile}`);
      }
    } catch (err) {
      console.warn(`Failed to read resume file ${resumeFile}: ${err.message}. Starting from beginning.`);
    }
  } else {
    console.warn(`Resume requested but no resume file found at ${resumeFile}. Starting from beginning.`);
  }
}
if (sekolahFilter && filteredSiswa.length === 0) {
  console.error(`No siswa found for --sekolah "${sekolahFilter}"`);
  process.exit(1);
}

console.log(`Syncing ${filteredSiswa.length} siswa to Firestore${sekolahFilter ? ` (school: ${sekolahFilter})` : ''}...`);
console.log(`Options: batchSize=${batchSize}, delayMs=${delayMs}, skipUnchanged=${skipUnchanged}, dryRun=${dryRun}, resume=${resume}, minimal=${minimal}`);

const collection = db.collection('students');
let committed = 0;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function commitWithRetry(batch, attempt = 1) {
  try {
    await batch.commit();
  } catch (err) {
    const code = err && err.code ? String(err.code) : '';
    if (attempt < 4 && (code === '8' || code === '4' || String(err).includes('RESOURCE_EXHAUSTED'))) {
      const backoff = 1000 * attempt;
      console.warn(`Firestore quota hit; retrying batch in ${backoff}ms (attempt ${attempt + 1})`);
      await sleep(backoff);
      return commitWithRetry(batch, attempt + 1);
    }
    throw err;
  }
}

for (let i = resumeIndex; i < filteredSiswa.length; i += batchSize) {
  const batch = db.batch();
  const chunk = filteredSiswa.slice(i, i + batchSize);
  const docRefs = chunk.map(s => collection.doc(s.nik));
  let existingDocs = [];

  if (skipUnchanged && !dryRun) {
    existingDocs = await db.getAll(...docRefs);
  }

  let chunkWrites = 0;
  for (let j = 0; j < chunk.length; j++) {
    const siswa = chunk[j];
    const now = new Date().toISOString();
    const skolRaw = (siswa.sekolah || '').toString().trim();
    const norm = normalizeName(skolRaw || '');
    let canonical = null;
    if (mapping && norm && mapping[norm] && mapping[norm].canonical) canonical = mapping[norm].canonical;

    const payloadBase = minimal ? pickMinimal(siswa) : { ...siswa };
    if (skolRaw && !payloadBase.sekolah_original && !minimal) payloadBase.sekolah_original = skolRaw;
    if (canonical && !minimal) {
      payloadBase.sekolah_canonical = canonical;
      payloadBase.sekolah_normalized = normalizeName(canonical);
    } else if (skolRaw && !minimal) {
      payloadBase.sekolah_normalized = norm;
    }

    const docRef = docRefs[j];
    const existingData = skipUnchanged && !dryRun && existingDocs[j] && existingDocs[j].exists ? existingDocs[j].data() : null;
    if (existingData && existingData.createdAt) {
      payloadBase.createdAt = existingData.createdAt;
    }

    const isUnchanged = existingData && payloadEquals(existingData, payloadBase);

    if (dryRun) {
      if (!global.__drySamples) global.__drySamples = [];
      if (global.__drySamples.length < 10) global.__drySamples.push({ id: siswa.nik, payload: payloadBase, unchanged: isUnchanged });
    } else if (!skipUnchanged || !isUnchanged) {
      const payloadToWrite = {
        ...payloadBase,
        createdAt: payloadBase.createdAt || now,
        updatedAt: now,
      };
      batch.set(docRef, payloadToWrite, { merge: true });
      chunkWrites += 1;
    }
  }

  if (!dryRun) {
    if (chunkWrites > 0) {
      await commitWithRetry(batch);
      committed += chunkWrites;
      console.log(`  Progress: ${committed}/${filteredSiswa.length} (written ${chunkWrites} docs in this batch)`);
    } else {
      console.log(`  Progress: ${committed}/${filteredSiswa.length} (no changes in this batch)`);
    }
    const nextIndex = i + chunk.length;
    writeFileSync(resumeFile, JSON.stringify({ nextIndex, sekolahFilter, batchSize, delayMs, timestamp: new Date().toISOString() }, null, 2), 'utf-8');
    if (i + batchSize < filteredSiswa.length) await sleep(delayMs);
  } else {
    if (global.__drySamples && global.__drySamples.length) {
      console.log('\nDry-run samples (first examples):');
      for (const s of global.__drySamples) console.log(`- ${s.id}:`, s.payload.sekolah, '=>', s.payload.sekolah_canonical || s.payload.sekolah_normalized, s.unchanged ? '(unchanged)' : '');
    }
    console.log('\nDry-run complete. No writes performed.');
    process.exit(0);
  }
}

if (!dryRun && existsSync(resumeFile)) {
  unlinkSync(resumeFile);
  console.log(`Cleared resume state file: ${resumeFile}`);
}
console.log(`Successfully synced ${committed} siswa to Firestore`);
process.exit(0);
