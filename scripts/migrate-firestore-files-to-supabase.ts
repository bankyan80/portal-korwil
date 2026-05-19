/**
 * Migration script: Move files from Google Drive / Firestore base64 to Supabase Storage.
 *
 * Usage:
 *   npm run migrate:files:dry        # Dry run - preview changes
 *   npm run migrate:files:execute    # Execute migration
 *
 * Requirements:
 *   - NEXT_PUBLIC_SUPABASE_URL env var set
 *   - SUPABASE_SERVICE_ROLE_KEY env var set
 *   - FIREBASE_SERVICE_ACCOUNT_KEY env var set
 */

import { createClient } from '@supabase/supabase-js';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const storageBucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'portal-files';

const isDryRun = process.argv.includes('--dry-run');
const isExecute = process.argv.includes('--execute');

if (!isDryRun && !isExecute) {
  console.log('Usage:');
  console.log('  npm run migrate:files:dry        # Dry run');
  console.log('  npm run migrate:files:execute    # Execute migration');
  process.exit(1);
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function loadServiceAccount() {
  const envVal = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!envVal) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY not set');
  try {
    return JSON.parse(envVal);
  } catch {
    try {
      return JSON.parse(Buffer.from(envVal, 'base64').toString('utf-8'));
    } catch {
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY');
    }
  }
}

function initFirebaseAdmin() {
  if (!getApps().length) {
    const sa = loadServiceAccount();
    initializeApp({ credential: cert(sa) });
  }
  return getFirestore();
}

function getSafeFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const base = fileName
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return `${Date.now()}-${base}.${ext}`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

const successLog: any[] = [];
const failedLog: any[] = [];
const skippedLog: any[] = [];

function log(entry: any) {
  console.log(`[${new Date().toISOString()}] ${entry.status.toUpperCase()}: ${entry.message}`);
}

async function uploadBufferToSupabase(buffer: Buffer, fileName: string, mimeType: string, storagePath: string) {
  const { data, error } = await supabase.storage
    .from(storageBucket)
    .upload(storagePath, buffer, { contentType: mimeType, cacheControl: '3600' });

  if (error) throw new Error(error.message);

  const { data: urlData } = supabase.storage.from(storageBucket).getPublicUrl(storagePath);

  return {
    provider: 'supabase',
    bucket: storageBucket,
    fileName,
    originalName: fileName,
    storagePath,
    fileUrl: urlData.publicUrl,
    mimeType,
    size: buffer.length,
    sizeText: formatSize(buffer.length),
    uploadedAt: new Date().toISOString(),
  };
}

async function migrateDokumen(db: any) {
  console.log('\n=== Migrating dokumen collection ===');
  const snapshot = await db.collection('dokumen').get();

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();

    if (data.file?.provider === 'supabase') {
      skipped++;
      log({ status: 'skipped', collection: 'dokumen', docId: docSnap.id, message: 'Already migrated to Supabase' });
      skippedLog.push({ collection: 'dokumen', docId: docSnap.id, reason: 'Already migrated' });
      continue;
    }

    if (!data.file?.webViewLink && !data.dataUrl) {
      skipped++;
      log({ status: 'skipped', collection: 'dokumen', docId: docSnap.id, message: 'No file data' });
      skippedLog.push({ collection: 'dokumen', docId: docSnap.id, reason: 'No file data' });
      continue;
    }

    try {
      const safeFileName = getSafeFileName(data.fileName || data.originalName || 'dokumen');
      const sekolahId = data.sekolahId || data.nip || 'unknown';
      const storagePath = `dokumen/${sekolahId}/${safeFileName}`;

      if (isDryRun) {
        log({ status: 'dry-run', collection: 'dokumen', docId: docSnap.id, message: `Would migrate to ${storagePath}` });
        success++;
        continue;
      }

      let buffer: Buffer;
      let mimeType = data.fileType || data.mimeType || 'application/octet-stream';

      if (data.dataUrl) {
        const [, base64] = data.dataUrl.split(',');
        buffer = Buffer.from(base64, 'base64');
        const match = data.dataUrl.match(/data:([^;]+)/);
        if (match) mimeType = match[1];
      } else if (data.file?.webContentLink) {
        console.log(`  Downloading from Google Drive: ${data.file.webContentLink}`);
        const res = await fetch(data.file.webContentLink);
        if (!res.ok) throw new Error(`Failed to download: ${res.status}`);
        buffer = Buffer.from(await res.arrayBuffer());
      } else {
        throw new Error('No file source available');
      }

      const supabaseMetadata = await uploadBufferToSupabase(buffer, safeFileName, mimeType, storagePath);

      await db.collection('dokumen').doc(docSnap.id).update({
        file: supabaseMetadata,
        migrationBackup: {
          previousProvider: data.file?.provider || 'google-drive',
          migratedAt: new Date().toISOString(),
        },
      });

      if (data.dataUrl) {
        await db.collection('dokumen').doc(docSnap.id).update({ dataUrl: null });
      }

      success++;
      log({ status: 'success', collection: 'dokumen', docId: docSnap.id, message: `Migrated to Supabase: ${supabaseMetadata.fileUrl}` });
      successLog.push({ collection: 'dokumen', docId: docSnap.id, storagePath, url: supabaseMetadata.fileUrl });
    } catch (error: any) {
      failed++;
      log({ status: 'failed', collection: 'dokumen', docId: docSnap.id, message: error.message });
      failedLog.push({ collection: 'dokumen', docId: docSnap.id, error: error.message });
    }
  }

  console.log(`\nDokumen migration complete: ${success} success, ${failed} failed, ${skipped} skipped`);
  return { success, failed, skipped };
}

async function migrateGallery(db: any) {
  console.log('\n=== Migrating gallery collection ===');
  const snapshot = await db.collection('gallery').get();

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();

    if (!data.images || !Array.isArray(data.images)) {
      skipped++;
      skippedLog.push({ collection: 'gallery', docId: docSnap.id, reason: 'No images' });
      continue;
    }

    const newImages: string[] = [];
    const newImageFiles: any[] = [];
    let docSuccess = true;

    for (let i = 0; i < data.images.length; i++) {
      const imageUrl = data.images[i];

      if (imageUrl.startsWith('http') && !imageUrl.includes('drive.google.com')) {
        newImages.push(imageUrl);
        if (data.imageFiles?.[i]) {
          newImageFiles.push(data.imageFiles[i]);
        }
        continue;
      }

      try {
        const safeFileName = getSafeFileName(`${data.title || 'gallery'}-${i}.jpg`);
        const storagePath = `galeri/${data.category || 'unknown'}/${safeFileName}`;

        if (isDryRun) {
          log({ status: 'dry-run', collection: 'gallery', docId: docSnap.id, message: `Would migrate image ${i + 1} to ${storagePath}` });
          newImages.push(`https://placeholder.supabase.co/${storagePath}`);
          continue;
        }

        let buffer: Buffer;
        let mimeType = 'image/jpeg';

        if (imageUrl.startsWith('data:')) {
          const [, base64] = imageUrl.split(',');
          buffer = Buffer.from(base64, 'base64');
          const match = imageUrl.match(/data:([^;]+)/);
          if (match) mimeType = match[1];
        } else {
          const res = await fetch(imageUrl);
          if (!res.ok) throw new Error(`Failed to download: ${res.status}`);
          buffer = Buffer.from(await res.arrayBuffer());
          mimeType = res.headers.get('content-type') || 'image/jpeg';
        }

        const supabaseMetadata = await uploadBufferToSupabase(buffer, safeFileName, mimeType, storagePath);
        newImages.push(supabaseMetadata.fileUrl);
        newImageFiles.push({
          provider: 'supabase',
          fileName: supabaseMetadata.fileName,
          mimeType: supabaseMetadata.mimeType,
          size: supabaseMetadata.size,
          webViewLink: supabaseMetadata.fileUrl,
          uploadedAt: supabaseMetadata.uploadedAt,
        });

        log({ status: 'success', collection: 'gallery', docId: docSnap.id, message: `Image ${i + 1} migrated` });
      } catch (error: any) {
        docSuccess = false;
        log({ status: 'failed', collection: 'gallery', docId: docSnap.id, imageIndex: i, message: error.message });
        failedLog.push({ collection: 'gallery', docId: docSnap.id, imageIndex: i, error: error.message });
      }
    }

    if (docSuccess && newImageFiles.length > 0) {
      if (!isDryRun) {
        await db.collection('gallery').doc(docSnap.id).update({
          images: newImages,
          imageFiles: newImageFiles,
          migrationBackup: {
            originalImageCount: data.images.length,
            migratedImageCount: newImageFiles.length,
            migratedAt: new Date().toISOString(),
          },
        });
      }
      success++;
      log({ status: 'success', collection: 'gallery', docId: docSnap.id, message: `Migrated ${newImageFiles.length} images` });
      successLog.push({ collection: 'gallery', docId: docSnap.id, migratedImages: newImageFiles.length });
    } else if (newImageFiles.length === 0) {
      skipped++;
      skippedLog.push({ collection: 'gallery', docId: docSnap.id, reason: 'No images to migrate' });
    }
  }

  console.log(`\nGallery migration complete: ${success} success, ${failed} failed, ${skipped} skipped`);
  return { success, failed, skipped };
}

async function main() {
  console.log(`Starting migration to Supabase Storage (${isDryRun ? 'DRY RUN' : 'EXECUTE'})...`);

  try {
    const db = initFirebaseAdmin();

    const dokumenResult = await migrateDokumen(db);
    const galleryResult = await migrateGallery(db);

    console.log('\n=== Migration Summary ===');
    console.log('Dokumen:', dokumenResult);
    console.log('Gallery:', galleryResult);
    console.log(`\nTotal success: ${dokumenResult.success + galleryResult.success}`);
    console.log(`Total failed: ${dokumenResult.failed + galleryResult.failed}`);
    console.log(`Total skipped: ${dokumenResult.skipped + galleryResult.skipped}`);

    const logDir = path.join(process.cwd(), 'migration-logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

    fs.writeFileSync(path.join(logDir, 'migration-success.json'), JSON.stringify(successLog, null, 2));
    fs.writeFileSync(path.join(logDir, 'migration-failed.json'), JSON.stringify(failedLog, null, 2));
    fs.writeFileSync(path.join(logDir, 'migration-skipped.json'), JSON.stringify(skippedLog, null, 2));

    console.log(`\nLogs saved to: ${logDir}/`);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
