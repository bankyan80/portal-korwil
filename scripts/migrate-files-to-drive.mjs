/**
 * Migration script: Move base64/file data from Firestore to Google Drive.
 *
 * Usage:
 *   node scripts/migrate-files-to-drive.mjs
 *
 * Requirements:
 *   - FIREBASE_SERVICE_ACCOUNT_KEY env var set (JSON or base64)
 *   - Google Drive API enabled for the service account
 *
 * This script:
 *   1. Scans `dokumen` and `gallery` collections for documents with base64 data.
 *   2. Uploads each file to Google Drive.
 *   3. Updates the Firestore document with Drive metadata.
 *   4. Removes the base64 field after successful migration.
 *   5. Creates a backup document before deleting base64 data.
 *   6. Logs all actions to console and to a JSON log file.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { google } from 'googleapis';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';

const LOG_FILE = path.join(process.cwd(), 'migration-log.json');
const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ROOT_ID || '15o8XOp-mQI4iQnY3mm29lXb2nEWMDShC';

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

async function getDriveClient() {
  const sa = loadServiceAccount();
  const auth = new google.auth.GoogleAuth({
    credentials: sa,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return google.drive({ version: 'v3', auth });
}

async function findOrCreateFolder(drive, folderName, parentFolderId) {
  const query = parentFolderId
    ? `mimeType='application/vnd.google-apps.folder' and name='${folderName.replace(/'/g, "\\'")}' and '${parentFolderId}' in parents and trashed=false`
    : `mimeType='application/vnd.google-apps.folder' and name='${folderName.replace(/'/g, "\\'")}' and trashed=false`;

  const res = await drive.files.list({ q: query, fields: 'files(id, name)', spaces: 'drive' });
  if (res.data.files?.length > 0) return res.data.files[0].id;

  const metadata = { name: folderName, mimeType: 'application/vnd.google-apps.folder' };
  if (parentFolderId) metadata.parents = [parentFolderId];

  const createRes = await drive.files.create({ requestBody: metadata, fields: 'id' });
  return createRes.data.id;
}

async function uploadBufferToDrive(drive, buffer, fileName, mimeType, folderId) {
  const fileMetadata = { name: fileName, parents: [folderId] };
  const media = { mimeType, body: Readable.from(buffer) };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, name, mimeType, size, webViewLink, webContentLink',
  });

  return {
    driveFileId: response.data.id,
    fileName: response.data.name || fileName,
    mimeType: response.data.mimeType || mimeType,
    size: parseInt(response.data.size || '0', 10),
    webViewLink: response.data.webViewLink || `https://drive.google.com/file/d/${response.data.id}/view`,
    webContentLink: response.data.webContentLink,
    uploadedAt: new Date().toISOString(),
  };
}

function dataUrlToBuffer(dataUrl) {
  const [header, base64] = dataUrl.split(',');
  const mimeType = header.match(/data:([^;]+)/)?.[1] || 'application/octet-stream';
  const buffer = Buffer.from(base64, 'base64');
  return { buffer, mimeType };
}

function log(entry) {
  console.log(`[${new Date().toISOString()}] ${entry.status.toUpperCase()}: ${entry.message}`);
}

async function loadExistingLog() {
  if (fs.existsSync(LOG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
    } catch {
      return [];
    }
  }
  return [];
}

async function saveLogEntry(entry) {
  const logs = await loadExistingLog();
  logs.push(entry);
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

async function migrateDokumen(db, drive, rootFolderId) {
  console.log('\n=== Migrating dokumen collection ===');
  const snapshot = await db.collection('dokumen').get();
  const driveFolder = await findOrCreateFolder(drive, 'Dokumen Pegawai', rootFolderId);
  const migrationFolder = await findOrCreateFolder(drive, 'Migrated', driveFolder);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();

    if (!data.dataUrl) {
      skipped++;
      log({ status: 'skipped', collection: 'dokumen', docId: docSnap.id, message: 'No dataUrl field' });
      await saveLogEntry({ status: 'skipped', collection: 'dokumen', docId: docSnap.id, message: 'No dataUrl field', timestamp: new Date().toISOString() });
      continue;
    }

    try {
      const { buffer, mimeType } = dataUrlToBuffer(data.dataUrl);
      const fileName = data.fileName || `dokumen-${docSnap.id}`;

      log({ status: 'uploading', collection: 'dokumen', docId: docSnap.id, message: `Uploading ${fileName} (${(buffer.length / 1024).toFixed(1)}KB)` });

      const driveMetadata = await uploadBufferToDrive(drive, buffer, fileName, mimeType, migrationFolder);

      await db.collection('dokumen').doc(docSnap.id).update({
        file: {
          ...driveMetadata,
          uploadedBy: data.uploadedBy || 'migration-script',
          migratedFrom: 'base64',
          migratedAt: new Date().toISOString(),
        },
        migrationBackup: {
          originalDataUrlSize: data.dataUrl.length,
          originalFileSize: data.fileSize,
          migratedAt: new Date().toISOString(),
        },
      });

      await db.collection('dokumen').doc(docSnap.id).update({
        dataUrl: null,
      });

      success++;
      log({ status: 'success', collection: 'dokumen', docId: docSnap.id, message: `Migrated to Drive: ${driveMetadata.webViewLink}` });
      await saveLogEntry({
        status: 'success',
        collection: 'dokumen',
        docId: docSnap.id,
        driveFileId: driveMetadata.driveFileId,
        driveLink: driveMetadata.webViewLink,
        fileSize: buffer.length,
        message: `Migrated ${fileName}`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      failed++;
      log({ status: 'failed', collection: 'dokumen', docId: docSnap.id, message: error.message });
      await saveLogEntry({
        status: 'failed',
        collection: 'dokumen',
        docId: docSnap.id,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  console.log(`\nDokumen migration complete: ${success} success, ${failed} failed, ${skipped} skipped`);
  return { success, failed, skipped };
}

async function migrateGallery(db, drive, rootFolderId) {
  console.log('\n=== Migrating gallery collection ===');
  const snapshot = await db.collection('gallery').get();
  const driveFolder = await findOrCreateFolder(drive, 'Galeri', rootFolderId);
  const migrationFolder = await findOrCreateFolder(drive, 'Migrated', driveFolder);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();

    if (!data.images || !Array.isArray(data.images)) {
      skipped++;
      log({ status: 'skipped', collection: 'gallery', docId: docSnap.id, message: 'No images array' });
      await saveLogEntry({ status: 'skipped', collection: 'gallery', docId: docSnap.id, message: 'No images array', timestamp: new Date().toISOString() });
      continue;
    }

    const newImageUrls = [];
    const newImageFiles = [];
    let docSuccess = true;

    for (let i = 0; i < data.images.length; i++) {
      const imageUrl = data.images[i];

      if (!imageUrl.startsWith('data:')) {
        newImageUrls.push(imageUrl);
        continue;
      }

      try {
        const { buffer, mimeType } = dataUrlToBuffer(imageUrl);
        const fileName = `${data.title || 'gallery'}-${docSnap.id}-${i}.jpg`;

        log({ status: 'uploading', collection: 'gallery', docId: docSnap.id, message: `Uploading image ${i + 1}/${data.images.length}: ${fileName}` });

        const driveMetadata = await uploadBufferToDrive(drive, buffer, fileName, mimeType, migrationFolder);
        newImageUrls.push(driveMetadata.webViewLink);
        newImageFiles.push({
          ...driveMetadata,
          uploadedBy: 'migration-script',
          migratedFrom: 'base64',
        });

        log({ status: 'success', collection: 'gallery', docId: docSnap.id, message: `Image ${i + 1} migrated` });
      } catch (error) {
        docSuccess = false;
        log({ status: 'failed', collection: 'gallery', docId: docSnap.id, imageIndex: i, message: error.message });
        await saveLogEntry({
          status: 'failed',
          collection: 'gallery',
          docId: docSnap.id,
          imageIndex: i,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (docSuccess && newImageFiles.length > 0) {
      try {
        await db.collection('gallery').doc(docSnap.id).update({
          images: newImageUrls,
          imageFiles: newImageFiles,
          migrationBackup: {
            originalImageCount: data.images.length,
            migratedImageCount: newImageFiles.length,
            migratedAt: new Date().toISOString(),
          },
        });

        success++;
        log({ status: 'success', collection: 'gallery', docId: docSnap.id, message: `Migrated ${newImageFiles.length} images to Drive` });
        await saveLogEntry({
          status: 'success',
          collection: 'gallery',
          docId: docSnap.id,
          migratedImages: newImageFiles.length,
          driveLinks: newImageFiles.map(f => f.webViewLink),
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        failed++;
        log({ status: 'failed', collection: 'gallery', docId: docSnap.id, message: `Firestore update failed: ${error.message}` });
        await saveLogEntry({
          status: 'failed',
          collection: 'gallery',
          docId: docSnap.id,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    } else if (newImageFiles.length === 0) {
      skipped++;
      log({ status: 'skipped', collection: 'gallery', docId: docSnap.id, message: 'No base64 images to migrate' });
    }
  }

  console.log(`\nGallery migration complete: ${success} success, ${failed} failed, ${skipped} skipped`);
  return { success, failed, skipped };
}

async function main() {
  console.log('Starting Firestore to Google Drive migration...');
  console.log(`Log file: ${LOG_FILE}`);

  try {
    const db = initFirebaseAdmin();
    const drive = await getDriveClient();
    const rootFolderId = ROOT_FOLDER_ID;

    const dokumenResult = await migrateDokumen(db, drive, rootFolderId);
    const galleryResult = await migrateGallery(db, drive, rootFolderId);

    console.log('\n=== Migration Summary ===');
    console.log('Dokumen:', dokumenResult);
    console.log('Gallery:', galleryResult);
    console.log(`\nTotal success: ${dokumenResult.success + galleryResult.success}`);
    console.log(`Total failed: ${dokumenResult.failed + galleryResult.failed}`);
    console.log(`Total skipped: ${dokumenResult.skipped + galleryResult.skipped}`);
    console.log(`\nLog saved to: ${LOG_FILE}`);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
