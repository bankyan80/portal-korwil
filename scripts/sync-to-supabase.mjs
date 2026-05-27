import { readFileSync, existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Load env
const envPath = join(root, '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.match(/^([^=]+)="?([^"]*?)"?$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const pegawaiSD = JSON.parse(readFileSync(join(root, 'src/data/data-pegawai.json'), 'utf-8'));
  const pegawaiTK = JSON.parse(readFileSync(join(root, 'src/data/data-pegawai-tk.json'), 'utf-8'));
  const allData = [...pegawaiSD, ...pegawaiTK];

  console.log(`Total records: ${allData.length}`);
  console.log(`SD records: ${pegawaiSD.length}`);
  console.log(`TK records: ${pegawaiTK.length}`);

  const allowedColumns = ['nik', 'nama', 'nuptk', 'jk', 'tempat_lahir', 'tanggal_lahir', 'nip', 'status_kepegawaian', 'jenis_ptk', 'agama', 'tugas_tambahan', 'sertifikasi', 'tmt', 'sekolah', 'role', 'file_pdf_url', 'verified'];

  // Deduplicate by NIK
  const seen = new Map();
  for (const p of allData) {
    const rec = { updated_at: new Date().toISOString() };
    for (const col of allowedColumns) {
      if (p[col] !== undefined && p[col] !== null) rec[col] = p[col];
    }
    rec.nik = rec.nik || rec.nuptk || `${p.sekolah}_${p.nama}`;
    seen.set(rec.nik, rec);
  }
  const records = [...seen.values()];

  // Batch upsert (50 at a time)
  const batchSize = 50;
  let totalUpserted = 0;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { error } = await supabase
      .from('employees')
      .upsert(batch, { onConflict: 'nik' });
    if (error) {
      console.error(`Batch ${i / batchSize + 1} error:`, error.message);
    } else {
      totalUpserted += batch.length;
    }
  }

  console.log(`Sync selesai! ${totalUpserted} dari ${records.length} records terkirim`);

  // Check schools with no employees
  const sekolahTs = readFileSync(join(root, 'src/data/sekolah.ts'), 'utf-8');
  const names = [];
  const re = /\{.*?nama:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(sekolahTs)) !== null) names.push(m[1].trim());
  const uniqueSchools = [...new Set(names)];

  const pegawaiCounts = {};
  for (const p of allData) {
    const key = (p.sekolah || '').trim();
    if (!key) continue;
    pegawaiCounts[key] = (pegawaiCounts[key] || 0) + 1;
  }

  const noPegawai = uniqueSchools.filter(name => !pegawaiCounts[name]);
  console.log(`\nSekolah tanpa pegawai (${noPegawai.length}):`);
  for (const s of noPegawai) console.log(`  - ${s}`);
}

main().catch(e => { console.error(e); process.exit(1); });
