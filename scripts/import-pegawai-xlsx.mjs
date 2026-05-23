import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import xlsx from 'xlsx';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// === CONFIG: all xlsx files to import (schools without pegawai) ===
const FILES = [
  // Root folder: direct .xlsx files  
  { id: '1rd34LHyyePV_lGO9w_z9Vc3avv8rMED8', school: 'PAUD AL-HIDAYAH', type: 'guru' },
  { id: '1Asv5LZyTOgx_6mtA9wFjOvHyF1vw_RgG', school: 'PAUD AL-HIDAYAH', type: 'tendik' },
  { id: '1Tb1zAyVwOC-WbDVZV7RzIDrgeNlZHEY_', school: 'TK AL-IRSYAD AL-ISLAMIYYAH', type: 'guru' },
  { id: '18xMlQfTzBgUtxuX67lHUamDVPaC_3Cw6', school: 'TK AL-IRSYAD AL-ISLAMIYYAH', type: 'tendik' },
  { id: '1yT5OexI6Kb9Yzy8_RTkOKsSPBGZ6EUHs', school: 'TK MELATI', type: 'guru' },
  { id: '18-LxiAKaVw-Wb10qmaDrezgsSlJ0ums1', school: 'TK MELATI', type: 'tendik' },

  // Sub-folders
  { id: '1NB7m2vfs6APUduD8p1FCH03hW78DrgH_', school: 'KB AZ-ZAHRA', type: 'guru' },
  { id: '1mFJTGHu1MmeoIJjwXv4DWaw4G6hE6bUo', school: 'KB AZ-ZAHRA', type: 'tendik' },
  { id: '1hMh46GQyyBr9pliP_DfwYFEGUZ45pcNb', school: 'KB A.H. PLUS', type: 'guru' },
  { id: '1xof25jiZhfkuYtPW7juT-KGfARZi23_G', school: 'KB A.H. PLUS', type: 'tendik' },
  { id: '1uggqHKYPjLtogyeW2Wdi5Ht2XxXwa8S1', school: 'PAUD AL HAMBRA', type: 'guru' },
  { id: '1FNM2FPy4HelpS24XgL3D2XEAq3Isqf8v', school: 'PAUD AL HAMBRA', type: 'tendik' },
  { id: '1BO1VRxPj5FNR-IBRoY_NO58Tv0aXpGz4', school: 'TK AISYIYAH LEMAHABANG', type: 'guru' },
  { id: '1iCdqayCCbJhHIWjcVdWtlOSvwA7ySoii', school: 'TK AISYIYAH LEMAHABANG', type: 'tendik' },
  { id: '1K1y0fl37iwE60jLI2RoH-xIFx8Cgvdmu', school: 'TK BPP KENANGA', type: 'guru' },
  { id: '19ptL3CIzDJRaQTJ_iYzhww1tpdlvsK0v', school: 'TK BPP KENANGA', type: 'tendik' },
  { id: '15vlJ1RxzB3ClxKZAMmsIo8IxOQkfnjUI', school: 'KB PALAPA', type: 'guru' },
  { id: '1c1X2k0azUPH4dprUQ-rSwfuxYcP2DaWR', school: 'KB PALAPA', type: 'tendik' },
  { id: '1NAebmHWfxEomVZE5cQ4WvHwVzy3Mf1t1', school: 'PAUD AL-HUSNA', type: 'guru' },
  { id: '1Qec6aMod2FUsfd_rvq8EMWM4g4M4pQU7', school: 'PAUD AL-HUSNA', type: 'tendik' },
  { id: '11F0gkQD5FVL91KY8fNs9GfLL_I8BMuOe', school: 'PAUD AMANAH', type: 'guru' },
  { id: '1h_r8oPaofOARc1Jvsno45B4bA_dSYUer', school: 'PAUD AMANAH', type: 'tendik' },
  { id: '1cycQ278fplWLTfuxRQUEqveYcu-vf8NU', school: 'TK MUSLIMAT NU', type: 'guru' },
  { id: '13OtePp-DsakF7kqjT2_UFD-dN4Wybfy7', school: 'TK MUSLIMAT NU', type: 'tendik' },
];

// === Load canonical schools & NPSN map ===
const sekolahTxt = readFileSync(join(root, 'src', 'data', 'sekolah.ts'), 'utf-8');
const npsnMap = {};
const regex = /nama:\s*'([^']+)',\s*npsn:\s*'([^']+)/g;
let m;
while ((m = regex.exec(sekolahTxt)) !== null) {
  npsnMap[m[1]] = m[2];
}

// Also load variants from canonical-schools.json
const canonical = JSON.parse(readFileSync(join(root, 'src', 'data', 'canonical-schools.json'), 'utf-8'));
for (const schools of Object.values(canonical)) {
  for (const [canon, variants] of Object.entries(schools)) {
    const npsn = npsnMap[canon];
    if (npsn) {
      for (const v of variants) npsnMap[v] = npsn;
    }
  }
}

function getJenjang(school) {
  // Determine jenjang based on school name or NPSN
  if (school.startsWith('SD ')) return 'SD';
  if (school.startsWith('TK ')) return 'TK';
  return 'KB'; // KB/PAUD all treated as KB in system
}

// === Download helpers ===
function downloadFile(fileId) {
  return new Promise((resolve, reject) => {
    const url = 'https://drive.usercontent.google.com/download?id=' + fileId + '&export=download&authuser=0&confirm=t';
    const chunks = [];
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// === Parse xlsx ===
function parsePegawaiXlsx(buf, schoolName, roleType) {
  const wb = xlsx.read(buf);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
  
  if (rows.length < 6) return []; // no data
  
  const dataRows = rows.slice(5); // skip header rows
  const records = [];
  
  const npsn = npsnMap[schoolName] || '';
  const jenjang = getJenjang(schoolName);
  const role = roleType === 'tendik' ? 'tendik' : 'guru';
  
  for (const cols of dataRows) {
    if (!cols || cols.length < 5) continue;
    const nik = (cols[44] || '').toString().trim();
    if (!nik) continue;
    
    records.push({
      nik,
      nama: (cols[1] || '').toString().trim(),
      jk: (cols[3] || '').toString().trim(),
      nuptk: (cols[2] || '').toString().trim(),
      tempat_lahir: (cols[4] || '').toString().trim(),
      tanggal_lahir: (cols[5] || '').toString().trim(),
      nip: (cols[6] || '').toString().trim(),
      status_kepegawaian: (cols[7] || '').toString().trim(),
      jenis_ptk: (cols[8] || '').toString().trim(),
      tugas_tambahan: (cols[20] || '').toString().trim(),
      sertifikasi: '',
      sekolah: schoolName,
      role,
      npsn,
      jenjang,
    });
  }
  
  return records;
}

// === Main ===
async function main() {
  console.log('Import pegawai from xlsx files');
  console.log('===============================\n');
  
  // Load existing pegawai-tk data
  const tkPath = join(root, 'src', 'data', 'data-pegawai-tk.json');
  const pegawaiTK = JSON.parse(readFileSync(tkPath, 'utf-8'));
  
  // Build NIK index for dedup
  const existingByNIK = new Map();
  for (const p of pegawaiTK) {
    if (p.nik) existingByNIK.set(p.nik, p);
  }
  
  let totalNew = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  const schoolCounts = {};
  
  for (const file of FILES) {
    try {
      const buf = await downloadFile(file.id);
      const records = parsePegawaiXlsx(buf, file.school, file.type);
      
      let added = 0;
      let skipped = 0;
      
      for (const rec of records) {
        if (existingByNIK.has(rec.nik)) {
          // Update existing record
          const existing = existingByNIK.get(rec.nik);
          Object.assign(existing, rec);
          skipped++;
        } else {
          pegawaiTK.push(rec);
          existingByNIK.set(rec.nik, rec);
          added++;
        }
      }
      
      if (!schoolCounts[file.school]) schoolCounts[file.school] = { guru: 0, tendik: 0 };
      schoolCounts[file.school][file.type] += added;
      
      totalNew += added;
      totalSkipped += skipped;
      console.log(`  ${file.school} (${file.type}): ${added} baru, ${skipped} update`);
    } catch (e) {
      console.error(`  ERROR ${file.school} (${file.type}): ${e.message}`);
      totalErrors++;
    }
  }
  
  // Write updated JSON
  writeFileSync(tkPath, JSON.stringify(pegawaiTK, null, 2), 'utf-8');
  
  console.log('\n=== SUMMARY ===');
  console.log(`Total baru: ${totalNew}`);
  console.log(`Total update/skip: ${totalSkipped}`);
  console.log(`Errors: ${totalErrors}`);
  console.log(`Total pegawai-tk: ${pegawaiTK.length}`);
  console.log('\nPer sekolah:');
  for (const [school, counts] of Object.entries(schoolCounts)) {
    if (counts.guru > 0 || counts.tendik > 0) {
      console.log(`  ${school}: ${counts.guru} guru + ${counts.tendik} tendik = ${counts.guru + counts.tendik}`);
    }
  }
  
  process.exit(0);
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
