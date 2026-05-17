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

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function mapRow(cols, sekolah, role) {
  const nik = (cols[44] || '').trim();
  if (!nik) return null;
  return {
    nik,
    nama: (cols[1] || '').trim(),
    jk: (cols[3] || '').trim().toUpperCase(),
    nuptk: (cols[2] || '').trim(),
    nip: (cols[6] || '').trim(),
    tanggal_lahir: (cols[5] || '').trim(),
    status_kepegawaian: (cols[7] || '').trim(),
    jenis_ptk: (cols[8] || '').trim(),
    tugas_tambahan: (cols[20] || '').trim(),
    sertifikasi: '',
    sekolah,
    role,
  };
}

async function fetchAndParse(url, sekolah, role) {
  const res = await fetch(url);
  const text = await res.text();
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 5) return [];
  const dataRows = lines.slice(5);
  const result = [];
  for (const row of dataRows) {
    const cols = parseCSVLine(row);
    if (cols.length < 45) continue;
    const record = mapRow(cols, sekolah, role);
    if (record) result.push(record);
  }
  return result;
}

async function main() {
  // --- TK GELATIK ---
  const tkGuru = await fetchAndParse(
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vTtIJapNJgcZ2Z0GR83o916wOHGwt-W0KiQtaC0-mtvL8KpUVBOKWJCaD1TK8DMAA/pub?gid=1187748548&single=true&output=csv',
    'TK GELATIK', 'guru'
  );
  const tkTendik = await fetchAndParse(
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vTjHBZ44HfzBKjyVdoUN_GsGGpCMKZqh7xygrVX8xal2AsCBrlQ02VH52PUfoRobA/pub?gid=1625950301&single=true&output=csv',
    'TK GELATIK', 'tendik'
  );

  // Fix ANNA JULIANA FITRI role (Kepala Sekolah, not tendik)
  for (const p of tkTendik) {
    if (p.jenis_ptk === 'Kepala Sekolah') p.role = 'kepsek';
  }

  // --- SD NEGERI 1 ASEM ---
  const sdGuru = await fetchAndParse(
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vR4PhpkeqQjr9cbHrEoGwgQW9CvqVBA1D0--o1ZhXv_OaBqNPddwAHs_PZCsgXP-g/pub?gid=296347908&single=true&output=csv',
    'SD NEGERI 1 ASEM', 'guru'
  );
  const sdTendik = await fetchAndParse(
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vThPc1fGt2M1KTJmm6X2eJvSEMQIIgNn8QBCtcwLQN9zGjc0TLZDJTwREBOYzX0qQ/pub?gid=430985553&single=true&output=csv',
    'SD NEGERI 1 ASEM', 'tendik'
  );

  // Fix SUKIRAH role (Kepala Sekolah)
  for (const p of sdTendik) {
    if (p.jenis_ptk === 'Kepala Sekolah') p.role = 'kepsek';
  }

  const allNew = [...tkGuru, ...tkTendik, ...sdGuru, ...sdTendik];
  console.log('=== DATA DARI CSV ===');
  console.log(`TK GELATIK Guru: ${tkGuru.length}, Tendik: ${tkTendik.length}`);
  console.log(`SD NEGERI 1 ASEM Guru: ${sdGuru.length}, Tendik: ${sdTendik.length}`);
  console.log(`Total: ${allNew.length}`);
  allNew.forEach(p => console.log(`  ${p.nama} (${p.nik}) - ${p.sekolah} - ${p.jenis_ptk}`));

  // --- Update data-pegawai.json (SD) ---
  const sdJsonPath = join(root, 'src', 'data', 'data-pegawai.json');
  let sdExisting = JSON.parse(readFileSync(sdJsonPath, 'utf-8'));
  console.log(`\nSebelum: data-pegawai.json = ${sdExisting.length} records`);

  const sdByNik = new Map(sdExisting.map(p => [p.nik, p]));
  let sdAdd = 0, sdUpd = 0;
  for (const p of [...sdGuru, ...sdTendik]) {
    if (sdByNik.has(p.nik)) {
      const idx = sdExisting.findIndex(e => e.nik === p.nik);
      sdExisting[idx] = { ...sdExisting[idx], ...p };
      sdUpd++;
    } else {
      sdExisting.push(p);
      sdAdd++;
    }
  }
  writeFileSync(sdJsonPath, JSON.stringify(sdExisting, null, 2), 'utf-8');
  console.log(`data-pegawai.json: ${sdAdd} added, ${sdUpd} updated, total ${sdExisting.length}`);

  // --- Update data-pegawai-tk.json (TK) ---
  const tkJsonPath = join(root, 'src', 'data', 'data-pegawai-tk.json');
  let tkExisting = JSON.parse(readFileSync(tkJsonPath, 'utf-8'));
  console.log(`\nSebelum: data-pegawai-tk.json = ${tkExisting.length} records`);

  // Remove old TK GELATIK records from tkExisting (since we'll re-add from CSV)
  tkExisting = tkExisting.filter(p => p.sekolah !== 'TK GELATIK');

  const tkByNik = new Map(tkExisting.map(p => [p.nik, p]));
  let tkAdd = 0, tkUpd = 0;
  for (const p of [...tkGuru, ...tkTendik]) {
    if (tkByNik.has(p.nik)) {
      const idx = tkExisting.findIndex(e => e.nik === p.nik);
      tkExisting[idx] = { ...tkExisting[idx], ...p };
      tkUpd++;
    } else {
      tkExisting.push({ ...p, tempat_lahir: '', sertifikasi: '' });
      tkAdd++;
    }
  }
  writeFileSync(tkJsonPath, JSON.stringify(tkExisting, null, 2), 'utf-8');
  console.log(`data-pegawai-tk.json: ${tkAdd} added, ${tkUpd} updated, total ${tkExisting.length}`);

  // --- Update tk-gelatik-pegawai.json ---
  const tkGelJsonPath = join(root, 'src', 'data', 'tk-gelatik-pegawai.json');
  const tkGelData = [...tkGuru, ...tkTendik];
  writeFileSync(tkGelJsonPath, JSON.stringify(tkGelData, null, 2), 'utf-8');
  console.log(`\ntk-gelatik-pegawai.json: overwritten with ${tkGelData.length} records`);

  // --- Sync to Firestore ---
  console.log('\n=== SYNC KE FIRESTORE ===');
  const collection = db.collection('employees');
  let committed = 0;

  for (let i = 0; i < allNew.length; i += 500) {
    const batch = db.batch();
    const chunk = allNew.slice(i, i + 500);
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
    console.log(`Firestore: ${committed}/${allNew.length}`);
  }

  console.log(`\nSelesai! Total ${allNew.length} pegawai diimport dari CSV.`);
  process.exit(0);
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});