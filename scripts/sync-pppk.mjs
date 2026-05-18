import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const root = join(process.cwd(), '');

// Load service account
const saDir = join(root, 'service-account');
const saFiles = readdirSync(saDir).filter(f => f.endsWith('.json'));
if (saFiles.length === 0) { console.error('No service account JSON in service-account/'); process.exit(1); }
const saFile = join(saDir, saFiles[0]);
const sa = JSON.parse(readFileSync(saFile, 'utf-8'));
const app = initializeApp({ credential: cert(sa) });
const db = getFirestore(app);

// Load pegawai
const pegawai = JSON.parse(
  readFileSync(join(root, 'src', 'data', 'data-pegawai.json'), 'utf-8')
);
// Load TK pegawai (if exists)
const tkPath = join(root, 'src', 'data', 'data-pegawai-tk.json');
let tkPegawai = [];
try { tkPegawai = JSON.parse(readFileSync(tkPath, 'utf-8')); } catch (_) {}

// 49 pegawai NIPs to update to "PPPK Paruh Waktu"
const TARGET_NIPS = new Set([
  '198303152025212108', '197605182025212033', '197606112025212028', '199307242025211075',
  '199201012025211199', '199905222025212039', '197902022025212040', '199906292025211051',
  '198007312025211041', '198404022025212090', '198503202025211091', '198803092025212064',
  '198701242025212055', '197109062025211029', '198911112025211114', '197006172025211050',
  '199108272025211057', '199302092025211085', '197510142025211033', '198811102025211144',
  '197310122025211042', '197505112025211053', '197309152025211052', '199403102025212080',
  '200104062025211027', '197610132025211042', '197505032025211057', '199911152025211031',
  '197310102025211056', '198507252025212055', '198903062025211071',
]);

// ==========================================================
// PHASE 1: Update local SD pegawai JSON
// ==========================================================
let sdUpdated = 0;
for (const p of pegawai) {
  if (p.nip && TARGET_NIPS.has(String(p.nip).trim())) {
    const old = p.status_kepegawaian;
    if (old !== 'PPPK Paruh Waktu') {
      p.status_kepegawaian = 'PPPK Paruh Waktu';
      sdUpdated++;
      console.log(`[SD]  ${p.nama} (${p.nip}): ${old} -> PPPK Paruh Waktu`);
    }
  }
}

// PHASE 1b: Update local TK pegawai JSON
let tkUpdated = 0;
for (const p of tkPegawai) {
  if (p.nip && TARGET_NIPS.has(String(p.nip).trim())) {
    const old = p.status_kepegawaian;
    if (old !== 'PPPK Paruh Waktu') {
      p.status_kepegawaian = 'PPPK Paruh Waktu';
      tkUpdated++;
      console.log(`[TK]  ${p.nama} (${p.nip}): ${old} -> PPPK Paruh Waktu`);
    }
  }
}

// Save local files
writeFileSync(join(root, 'src', 'data', 'data-pegawai.json'), JSON.stringify(pegawai, null, 2), 'utf-8');
writeFileSync(join(root, 'src', 'data', 'data-pegawai-tk.json'), JSON.stringify(tkPegawai, null, 2), 'utf-8');
console.log(`\nLocal updated: SD=${sdUpdated}, TK=${tkUpdated}, Total=${sdUpdated + tkUpdated}`);

// ==========================================================
// PHASE 2: Sync ALL pegawai to Firestore
// ==========================================================
const coll = db.collection('employees');
const BATCH_SZ = 500;
let committed = 0;

async function main() {
  // Reload for fresh data
  const peg2 = JSON.parse(readFileSync(join(root, 'src', 'data', 'data-pegawai.json'), 'utf-8'));
  let tk2 = [];
  try { tk2 = JSON.parse(readFileSync(tkPath, 'utf-8')); } catch (_) {}
  const all = [...peg2, ...tk2];

  console.log(`\n--- Syncing to Firestore employees (${all.length} records) ---`);

  for (let i = 0; i < all.length; i += BATCH_SZ) {
    const batch = db.batch();
    const chunk = all.slice(i, i + BATCH_SZ);
    for (const p of chunk) {
      // Use NIP as doc ID if available, otherwise NIK
      const did = (p.nip && String(p.nip).trim()) ? String(p.nip).trim() : (p.nik || `emp_${i}`);
      const ref = coll.doc(did);
      batch.set(ref, {
        ...p,
        status: p.status_kepegawaian || 'Aktif',
        updatedAt: new Date().toISOString(),
      });
    }
    await batch.commit();
    committed += chunk.length;
    console.log(`  Progress: ${committed}/${all.length}`);
  }
  console.log(`\n=== DONE: ${committed} pegawai synced to Firestore ===`);
}

main().catch(err => { console.error(err); process.exit(1); });
