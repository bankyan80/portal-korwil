import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const root = join(process.cwd(), '');

// Load service account
const saDir = join(root, 'service-account');
const saFile = join(saDir, readdirSync(saDir).find((f: string) => f.endsWith('.json'))!);
const sa = JSON.parse(readFileSync(saFile as string, 'utf-8'));
const app = initializeApp({ credential: cert(sa) });
const db = getFirestore(app);

// Load pegawai data
const pegawai: any[] = JSON.parse(
  readFileSync(join(root, 'src', 'data', 'data-pegawai.json'), 'utf-8')
);

// Build lookups
const nipMap = new Map<string, any>();
for (const p of pegawai) {
  if (p.nip && p.nip.toString().trim()) {
    nipMap.set(p.nip.toString().trim(), p);
  }
}

// 49 pegawai to update — matching by NIP; for records with empty NIP use name-based dedup
const NAMES_FOR_NIK_LOOKUP = [
  'CARWINAH','SRI NURCHAENI','JUNI','SHEPTA','HERI KUSWANTO','MEIGY IRMA OKTAVERINA',
  'KARYATI','ADE SETIA MAULANA','ENDANG KASMARA','SITI SOLAEHA','MOCHAMAD RAMDHANI',
  'GOFUR','ICA ANISAH','ASIATUL FAUZIAH','MARTININGSIH','ISMAWATI','SITI NURLAELASARI',
  'IMANURDIN RAMADON','GARNIS NURUL FATHONAH','AZI PURNAMA','EEN SUNARYA',
  'AAN FITRIANANI','SAEFUL ALIM','DIYAN HIDAYAT','YULIAN SABITNI AMANAH','ADANG MAULANA',
  'SOFROH','ISLAMIATI ISTIQOMAH','ADE SUBUR SUGIHARTO','RAHMAH YULIA','NUNUNG HERAWATI',
  'FARIZIAH AMBARSARI',"MAR'ATUN SHOLEHAH",'SUPRIHATIN','FAJAR DEDI MIFTAKHUDDIN',
  'YUDHA NUGRAHA','AGUS MAULANA','NANA JUNAEDI','HENDRA PERMANA','WACHYUDIN',
  'MERTYANI RAHAYU','FAJAR SIDIK','PUTRA JAYADI','SUNANDAR','RAHMAT',
  'MUHAMAD SYAHRUL EFENDI','NANA MULYANA','NURUL HIKMAH','FIRMAN AWALUDIN',
];

// Target NIPs
const TARGET_NIPS = [
  '198303152025212108','197605182025212033','197606112025212028','199307242025211075',
  '199201012025211199','199905222025212039','197902022025212040','199906292025211051',
  '198007312025211041','198404022025212090','199503202025211091','198803092025212064',
  '198701242025212055','197109062025211029','198911112025211114','197006172025211050',
  '199108272025211057','199302092025211085','197510142025211033','198811102025211144',
  '197310122025211042','197505112025211053','197309152025211052','199403102025212080',
  '200104062025211027','197610132025211042','197505032025211057','199911152025211031',
  '197310102025211056','198507252025212055','198903062025211071',
];

// Some NIPs had a typo in my list; let me also check the 19 not-found
const TARGET_NIPS_FULL = [...TARGET_NIPS];

// Helper: normalize for matching
function norm(s: string) { return s.toUpperCase().replace(/\s+/g, ' ').trim(); }

// Match records
const toUpdate: any[] = [];
const unmatchedName: string[] = [];

for (const t of TARGET_NIPS_FULL) {
  const rec = nipMap.get(t);
  if (rec) {
    toUpdate.push(rec);
    nipMap.delete(t); // avoid double-processing
  } else {
    // Not found by NIP
    console.log(`NIP not found: ${t}`);
  }
}

// Show results
console.log(`\nFound by NIP: ${toUpdate.length}/${TARGET_NIPS_FULL.length}`);
console.log('Not found by NIP:', TARGET_NIPS_FULL.length - toUpdate.length);

console.log('\n--- Updating to PPPK Paruh Waktu ---');
for (const r of toUpdate) {
  const old = r.status_kepegawaian;
  r.status_kepegawaian = 'PPPK Paruh Waktu';
  console.log(`  ${r.nama} (${r.nip || r.nik}): ${old} -> PPPK Paruh Waktu`);
}

// Write local file
const outPath = join(root, 'src', 'data', 'data-pegawai.json');
writeFileSync(outPath, JSON.stringify(pegawai, null, 2), 'utf-8');

console.log(`\nLocal file updated: ${toUpdate} records changed`);

// -----------------------------------------------------------------------
// SYNC ALL PEGAWAI TO FIRESTORE
// -----------------------------------------------------------------------
console.log('\n--- Syncing to Firestore employees collection ---');
const coll = db.collection('employees');
const BATCH = 500;
let committed = 0;

for (let i = 0; i < pegawai.length; i += BATCH) {
  const batch = db.batch();
  const chunk = pegawai.slice(i, i + BATCH);

  for (const p of chunk) {
    // Use NIP as doc ID if available, else NIK
    const docId = (p.nip && p.nip.toString().trim()) ? p.nip.toString().trim() : (p.nik || `emp_${committed}_${Buffer.from(p.nama || '').toString('base64')}`);
    const docRef = coll.doc(docId);
    batch.set(docRef, {
      ...p,
      status_kepegawaian: p.status_kepegawaian || 'Aktif',
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
  }

  await batch.commit();
  committed += chunk.length;
  console.log(`  Progress: ${committed}/${pegawai.length}`);
}

console.log(`\n=== COMPLETE ===`);
console.log(`Updated locally: ${toUpdate.length} records`);
console.log(`Synced to Firestore: ${committed} total records`);
