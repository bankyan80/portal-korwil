/**
 * Migrate all data from Firestore collections to Supabase app_data table.
 * Run: npx tsx scripts/migrate-firestore-to-supabase.ts
 * 
 * Requires env vars:
 *   FIREBASE_SERVICE_ACCOUNT_KEY (or service-account/*.json)
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { cert, getApps, getApp, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createClient } from '@supabase/supabase-js';

// Configure Firebase Admin
const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
let serviceAccount: any = null;
if (serviceAccountRaw) {
  try { serviceAccount = JSON.parse(serviceAccountRaw); } catch {
    try { serviceAccount = JSON.parse(Buffer.from(serviceAccountRaw, 'base64').toString('utf-8')); } catch {}
  }
}
if (!serviceAccount) {
  const path = require('path');
  const fs = require('fs');
  const dir = path.join(process.cwd(), 'service-account');
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir).filter((f: string) => f.endsWith('.json'));
    if (files.length) serviceAccount = JSON.parse(fs.readFileSync(path.join(dir, files[0]), 'utf-8'));
  }
}
if (!serviceAccount || !serviceAccount.projectId) {
  console.error('Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY or place service-account/*.json');
  process.exit(1);
}

const app = getApps().length ? getApp() : initializeApp({ credential: cert(serviceAccount) });
const firestore = getFirestore(app);

// Configure Supabase Admin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const supabase = createClient(supabaseUrl!, supabaseKey!, { auth: { persistSession: false } });

// All collections to migrate (from cacheConfig.ts + others)
const COLLECTIONS = [
  'users',
  'schools',
  'organizations',
  'reports',
  'laporan_bulanan',
  'kip_sd',
  'yatim_piatu',
  'dokumen',
  'bos_arkas',
  'tabel_sekolah',
  'settings',
  'dashboard_summary',
  'menus',
  'announcements',
  'gallery',
  'institution_links',
  'news',
  'program_kerja',
  'spmb_sd',
  'calendar_events',
  'agenda',
  'pegawai_tambahan',
  'task_groups',
  'task_progress',
  'berita',
  'sarpras',
  'employees',
  'students',
];

interface MigrationResult {
  collection: string;
  success: number;
  failed: number;
  errors: string[];
}

async function migrateCollection(collectionName: string): Promise<MigrationResult> {
  const result: MigrationResult = { collection: collectionName, success: 0, failed: 0, errors: [] };

  try {
    console.log(`\n📦 Migrating collection: ${collectionName}`);
    const snap = await firestore.collection(collectionName).get();

    if (snap.empty) {
      console.log(`   ⚠️  Collection "${collectionName}" is empty, skipping`);
      return result;
    }

    const docs = snap.docs.map(d => ({
      id: d.id,
      collection: collectionName,
      data: d.data(),
      updated_at: new Date().toISOString(),
    }));

    console.log(`   📄 ${docs.length} documents to migrate`);

    // Batch upsert in chunks of 100
    const CHUNK_SIZE = 100;
    for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
      const chunk = docs.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase
        .from('app_data')
        .upsert(chunk, { onConflict: 'collection,id' });

      if (error) {
        console.error(`   ❌ Chunk error: ${error.message}`);
        result.failed += chunk.length;
        result.errors.push(error.message);
      } else {
        result.success += chunk.length;
      }
    }

    console.log(`   ✅ ${result.success} migrated, ${result.failed} failed`);
  } catch (e: any) {
    console.error(`   ❌ Fatal error migrating "${collectionName}": ${e.message}`);
    result.failed = -1;
    result.errors.push(e.message);
  }

  return result;
}

async function main() {
  console.log('🚀 Starting Firestore → Supabase migration');
  console.log(`   Firestore project: ${serviceAccount.project_id || serviceAccount.projectId}`);
  console.log(`   Supabase project:  ${supabaseUrl}`);
  console.log(`   Collections:       ${COLLECTIONS.length}`);

  const results: MigrationResult[] = [];
  let totalSuccess = 0;
  let totalFailed = 0;

  for (const collection of COLLECTIONS) {
    const r = await migrateCollection(collection);
    results.push(r);
    totalSuccess += r.success;
    totalFailed += r.failed;
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`   Total collections:  ${COLLECTIONS.length}`);
  console.log(`   Total documents:    ${totalSuccess + (totalFailed > 0 ? totalFailed : 0)}`);
  console.log(`   ✅ Success:         ${totalSuccess}`);
  console.log(`   ❌ Failed:          ${totalFailed}`);
  console.log('='.repeat(60));

  // Per-collection breakdown
  for (const r of results) {
    const icon = r.failed > 0 ? '❌' : r.success > 0 ? '✅' : '⚪';
    console.log(`   ${icon} ${r.collection}: ${r.success} docs${r.failed > 0 ? `, ${r.failed} failed` : ''}`);
    if (r.errors.length > 0) {
      for (const err of r.errors.slice(0, 3)) {
        console.log(`       Error: ${err}`);
      }
    }
  }

  console.log('='.repeat(60));
  console.log('🏁 Migration complete');
}

main().catch(console.error);
