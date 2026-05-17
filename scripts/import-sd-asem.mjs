import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const saDir = join(root, 'service-account');
if (!existsSync(saDir)) process.exit(1);
const files = readdirSync(saDir).filter(f => f.endsWith('.json'));
if (files.length === 0) process.exit(1);
const sa = JSON.parse(readFileSync(join(saDir, files[0]), 'utf-8'));

const app = initializeApp({ credential: cert(sa) });
const db = getFirestore(app);

function makeSchoolId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function parseCSV(text) {
  const lines = [];
  let current = '';
  let inQuotes = false;
  for (const ch of text) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { lines.push(current.trim()); current = ''; continue; }
    if ((ch === '\n' || ch === '\r') && !inQuotes) { continue; }
    current += ch;
  }
  if (current.trim()) lines.push(current.trim());

  const result = [];
  for (let i = 0; i < lines.length; i += 47) {
    const row = lines.slice(i, i + 47);
    if (row.length >= 45) result.push(row);
  }
  return result;
}

async function main() {
  const GURU_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR4PhpkeqQjr9cbHrEoGwgQW9CvqVBA1D0--o1ZhXv_OaBqNPddwAHs_PZCsgXP-g/pub?gid=296347908&single=true&output=csv';
  const TENDIK_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vThPc1fGt2M1KTJmm6X2eJvSEMQIIgNn8QBCtcwLQN9zGjc0TLZDJTwREBOYzX0qQ/pub?gid=430985553&single=true&output=csv';

  console.log('Fetching CSV data...');
  const guruResp = await fetch(GURU_URL);
  const tendikResp = await fetch(TENDIK_URL);
  const guruText = await guruResp.text();
  const tendikText = await tendikResp.text();

  const guruRows = parseCSV(guruText);
  const tendikRows = parseCSV(tendikText);

  console.log(`Guru rows (after header): ${guruRows.length - 5}`);
  console.log(`Tendik rows (after header): ${tendikRows.length - 5}`);

  // Map CSV rows to pegawai format
  const newPegawai = [];

  // Guru = rows 5+ (index 0-4 are header rows)
  for (let i = 5; i < guruRows.length; i++) {
    const r = guruRows[i];
    if (!r[1] || r[1] === 'Nama') continue;
    newPegawai.push({
      nik: (r[44] || '').trim(),
      nama: r[1] || '',
      jk: (r[3] || '').trim().toUpperCase(),
      nuptk: r[2] || '',
      nip: r[6] || '',
      tanggal_lahir: r[5] || '',
      status_kepegawaian: r[7] || '',
      jenis_ptk: r[8] || '',
      tugas_tambahan: r[20] || '',
      sertifikasi: '',
      sekolah: 'SD NEGERI 1 ASEM',
      role: 'guru',
    });
  }

  // Tendik = rows 5+
  for (let i = 5; i < tendikRows.length; i++) {
    const r = tendikRows[i];
    if (!r[1] || r[1] === 'Nama') continue;
    const jenisPTK = r[8] || '';
    const role = jenisPTK === 'Kepala Sekolah' ? 'kepsek' : 'tendik';
    newPegawai.push({
      nik: (r[44] || '').trim(),
      nama: r[1] || '',
      jk: (r[3] || '').trim().toUpperCase(),
      nuptk: r[2] || '',
      nip: r[6] || '',
      tanggal_lahir: r[5] || '',
      status_kepegawaian: r[7] || '',
      jenis_ptk: jenisPTK,
      tugas_tambahan: r[20] || '',
      sertifikasi: '',
      sekolah: 'SD NEGERI 1 ASEM',
      role: role,
    });
  }

  console.log(`\nTotal pegawai baru dari CSV: ${newPegawai.length}`);
  newPegawai.forEach(p => console.log(`  ${p.nama} (${p.nik}) - ${p.jenis_ptk} - ${p.role}`));

  // Merge into data-pegawai.json
  const jsonPath = join(root, 'src', 'data', 'data-pegawai.json');
  const existing = JSON.parse(readFileSync(jsonPath, 'utf-8'));
  console.log(`\nExisting data-pegawai.json: ${existing.length} records`);

  const existingByNik = new Map();
  for (const p of existing) {
    if (p.nik) existingByNik.set(p.nik, p);
  }

  let added = 0, updated = 0;
  for (const p of newPegawai) {
    if (existingByNik.has(p.nik)) {
      // Update existing
      const idx = existing.findIndex(e => e.nik === p.nik);
      if (idx >= 0) existing[idx] = p;
      updated++;
    } else {
      existing.push(p);
      added++;
    }
  }

  writeFileSync(jsonPath, JSON.stringify(existing, null, 2), 'utf-8');
  console.log(`Added: ${added}, Updated: ${updated}`);
  console.log(`Total after merge: ${existing.length}`);

  // Sync to Firestore
  console.log('\nSyncing to Firestore...');
  const collection = db.collection('employees');
  let committed = 0;

  for (let i = 0; i < newPegawai.length; i += 500) {
    const batch = db.batch();
    const chunk = newPegawai.slice(i, i + 500);
    for (const pegawai of chunk) {
      const docId = pegawai.nik || `emp-${committed}`;
      const docRef = collection.doc(docId);
      batch.set(docRef, {
        id: docId,
        nama: pegawai.nama,
        nik: pegawai.nik || '',
        nuptk: pegawai.nuptk || '',
        nip: pegawai.nip || '',
        jk: pegawai.jk || '',
        tanggal_lahir: pegawai.tanggal_lahir || '',
        jenis_ptk: pegawai.jenis_ptk || '',
        status_kepegawaian: pegawai.status_kepegawaian || '',
        tugas_tambahan: pegawai.tugas_tambahan || '',
        sertifikasi: pegawai.sertifikasi || '',
        sekolah: pegawai.sekolah || '',
        schoolId: makeSchoolId(pegawai.sekolah || ''),
        createdAt: Date.now(),
      });
    }
    await batch.commit();
    committed += chunk.length;
    console.log(`Firestore progress: ${committed}/${newPegawai.length}`);
  }

  console.log(`\nSelesai! ${newPegawai.length} pegawai SD NEGERI 1 ASEM diimport.`);
  process.exit(0);
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});