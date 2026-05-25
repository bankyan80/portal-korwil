/**
 * Migrasi data dari JSON ke Supabase.
 * 
 * Usage:
 *   node scripts/migrate-to-supabase.mjs
 * 
 * Prasyarat:
 *   - Supabase project sudah running
 *   - Tabel `employees` dan `students` sudah dibuat (jalankan supabase-schema.sql)
 *   - .env.local berisi SUPABASE_SERVICE_ROLE_KEY dan NEXT_PUBLIC_SUPABASE_URL
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// Baca env dari .env.local (simple parser, bukan dotenv)
function loadEnv() {
  const envFile = readFileSync(new URL('../.env.local', import.meta.url), 'utf-8');
  const env = {};
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL tidak valid. Isi di .env.local');
  process.exit(1);
}
if (!serviceRoleKey) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY tidak ditemukan. Isi di .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DATA_DIR = new URL('../src/data/', import.meta.url);

async function migrate(table, jsonFile) {
  console.log(`\n=== Migrasi ${table} dari ${jsonFile} ===`);
  const data = JSON.parse(readFileSync(new URL(jsonFile, DATA_DIR), 'utf-8'));
  console.log(`Total data: ${data.length}`);

  let inserted = 0, skipped = 0, errors = 0;

  // Batch upsert (50 per batch)
  const BATCH = 50;
  for (let i = 0; i < data.length; i += BATCH) {
    const batch = data.slice(i, i + BATCH).map(row => {
      const record = { ...row, updated_at: new Date().toISOString() };
      delete record.id; // tidak ada field id di JSON
      return record;
    });

    const { error } = await supabase
      .from(table)
      .upsert(batch, { onConflict: 'nik', ignoreDuplicates: false });

    if (error) {
      console.error(`Batch ${i / BATCH + 1} error:`, error.message);
      errors++;
    } else {
      inserted += batch.length;
    }

    process.stdout.write(`\r  Progress: ${Math.min(i + BATCH, data.length)}/${data.length}`);
  }

  console.log(`\nSelesai: ${inserted} inserted, ${skipped} skipped, ${errors} errors`);
}

async function main() {
  console.log('Memulai migrasi data ke Supabase...\n');

  // 1. Pegawai
  await migrate('employees', 'data-pegawai.json');
  
  // 2. Siswa
  await migrate('students', 'data-siswa.json');

  console.log('\n✅ Migrasi selesai!');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
