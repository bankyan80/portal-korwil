/**
 * 🚀 MIGRASI OTOMATIS: Firestore → Google Sheets
 * ===============================================
 * 
 * Script ini secara otomatis:
 * 1. Membaca semua data dari Firebase Firestore (project kedinasan-e5317)
 * 2. Menulis langsung ke Google Sheets (database Apps Script)
 * 3. Selesai dalam satu perintah
 * 
 * PRASYARAT:
 * npm install firebase-admin googleapis google-auth-library
 * 
 * CARA PAKAI:
 * 1. Download service-account.json dari Firebase Console
 * 2. Copy ID Google Sheet (dari URL Spreadsheet yang terhubung ke Apps Script)
 * 3. Jalankan: node migrate-firestore-to-sheets.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { google } from 'googleapis';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ==================== KONFIGURASI ====================

// !! UBAH INI DENGAN ID GOOGLE SHEET ANDA !!
// Cara dapat ID:
// 1. Buka Google Sheet yang terhubung ke Apps Script
// 2. Lihat URL: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
// 3. Copy bagian SPREADSHEET_ID
const SPREADSHEET_ID = '1SgEZGQKIekcn7Rv1dCkl2C-b1pAtateJ6GuvkWrrGR0';

// Mapping Firestore collection → Sheet name & headers
const SHEET_CONFIG = {
  'menus': {
    sheetName: 'menus',
    headers: ['id', 'title', 'icon', 'url', 'active', 'order', 'category'],
    mapFields: (doc) => ({
      id: doc.id,
      title: doc.title || '',
      icon: doc.icon || 'Globe',
      url: doc.url || '#',
      active: String(doc.active === true || doc.active === 'true' ? true : false),
      order: String(doc.order ?? ''),
      category: doc.category || '',
    }),
  },
  'announcements': {
    sheetName: 'announcements', 
    headers: ['id', 'title', 'content', 'createdAt', 'pinned', 'author'],
    mapFields: (doc) => ({
      id: doc.id,
      title: doc.title || '',
      content: doc.content || '',
      createdAt: String(doc.createdAt || doc.created_at || Date.now()),
      pinned: String(doc.pinned === true || doc.pinned === 'true' ? true : false),
      author: doc.author || 'Admin',
    }),
  },
  'gallery': {
    sheetName: 'gallery',
    headers: ['id', 'title', 'description', 'imageUrl', 'category', 'authorName', 'authorRole', 'status', 'createdAt'],
    mapFields: (doc) => ({
      id: doc.id,
      title: doc.title || '',
      description: doc.description || '',
      imageUrl: (doc.images && Array.isArray(doc.images) && doc.images[0]) ? doc.images[0] : (doc.imageUrl || ''),
      category: doc.category || 'Umum',
      authorName: doc.authorName || 'Admin',
      authorRole: doc.authorRole || 'Admin',
      status: (doc.status === 'published' || doc.status === 'approved' || !doc.status) ? 'approved' : 'pending',
      createdAt: String(doc.createdAt || Date.now()),
    }),
  },
  'organizations': {
    sheetName: 'organizations',
    headers: ['id', 'name', 'logo', 'leader', 'contact', 'active'],
    mapFields: (doc) => ({
      id: doc.id,
      name: doc.name || '',
      logo: doc.logo || '',
      leader: doc.leader || '',
      contact: doc.contact || '',
      active: String(doc.active === true || doc.active === 'true' ? true : false),
    }),
  },
  'institution_links': {
    sheetName: 'links',
    headers: ['id', 'name', 'logo', 'url', 'active', 'order'],
    mapFields: (doc) => ({
      id: doc.id,
      name: doc.name || '',
      logo: doc.logo || '',
      url: doc.url || '#',
      active: String(doc.active === true || doc.active === 'true' ? true : false),
      order: String(doc.order ?? ''),
    }),
  },
  'settings': {
    sheetName: 'settings',
    headers: ['id', 'key', 'value'],
    mapFields: (doc) => ({
      id: doc.id,
      key: doc.key || '',
      value: doc.value || '',
    }),
  },
  'users': {
    sheetName: 'users',
    headers: ['id', 'email', 'username', 'displayName', 'role', 'createdAt'],
    mapFields: (doc) => ({
      id: doc.id,
      email: doc.email || '',
      username: doc.username || '',
      displayName: doc.displayName || '',
      role: doc.role || 'viewer',
      createdAt: String(doc.createdAt || Date.now()),
    }),
  },
};

// ==================== FUNGSI UTAMA ====================

async function migrate() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  🚀 MIGRASI FIRESTORE → GOOGLE SHEETS   ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // Cek file service-account.json
  const serviceAccountPath = join(__dirname, 'service-account.json');
  if (!existsSync(serviceAccountPath)) {
    console.error('❌ File service-account.json tidak ditemukan!');
    console.log('\n📥 Cara download:');
    console.log('1. Buka https://console.firebase.google.com');
    console.log('2. Pilih project → Project Settings → Service Accounts');
    console.log('3. Generate new private key → download sebagai service-account.json');
    console.log(`4. Letakkan file di: ${serviceAccountPath}\n`);
    process.exit(1);
  }

  // Cek SPREADSHEET_ID
  if (!SPREADSHEET_ID) {
    console.error('❌ SPREADSHEET_ID belum diisi!');
    console.log('\n📥 Cara dapat ID:');
    console.log('1. Buka Google Sheet yang terhubung ke Apps Script');
    console.log('2. Copy ID dari URL: https://docs.google.com/spreadsheets/d/ID_INI/edit');
    console.log('3. Set SPREADSHEET_ID di baris 28 file ini\n');
    process.exit(1);
  }

  try {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

    // ========== INIT FIREBASE ==========
    console.log('📡 Menghubungkan ke Firebase...');
    const firebaseApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
    const db = getFirestore(firebaseApp);
    console.log('✅ Firebase terhubung\n');

    // ========== INIT GOOGLE SHEETS ==========
    console.log('📊 Menghubungkan ke Google Sheets...');
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    console.log('✅ Google Sheets terhubung\n');

    // ========== MIGRASI DATA ==========
    const collections = Object.keys(SHEET_CONFIG);
    let totalImported = 0;
    let totalCollections = 0;

    for (const collectionName of collections) {
      const config = SHEET_CONFIG[collectionName];
      console.log(`⏳ [${collectionName}] Membaca data...`);

      try {
        const snapshot = await db.collection(collectionName).get();

        if (snapshot.empty) {
          console.log(`   ⚠️  Koleksi ${collectionName} kosong (dilewati)`);
          continue;
        }

        const docs = snapshot.docs.map(doc => {
          const data = doc.data();
          return { id: doc.id, ...data };
        });

        // Map ke format sheet
        const rows = docs.map(doc => {
          const mapped = config.mapFields(doc);
          return config.headers.map(h => mapped[h] || '');
        });

        // Siapkan data: header + rows
        const values = [config.headers, ...rows];

        // Clear sheet dulu
        console.log(`   📝 Menulis ${rows.length} baris ke sheet "${config.sheetName}"...`);
        
        // Hapus data lama (semua baris setelah header)
        await sheets.spreadsheets.values.clear({
          spreadsheetId: SPREADSHEET_ID,
          range: `${config.sheetName}!A2:Z`,
        });

        // Tulis data baru
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${config.sheetName}!A1`,
          valueInputOption: 'RAW',
          requestBody: { values },
        });

        // Update header jika sheet baru
        // (Sheet sudah auto-create dari Apps Script, jadi cukup tulis data)

        totalImported += rows.length;
        totalCollections++;
        console.log(`   ✅ ${rows.length} dokumen dari ${collectionName} → sheet "${config.sheetName}"`);

      } catch (err) {
        console.error(`   ❌ Gagal migrasi ${collectionName}: ${err.message}`);
      }
    }

    // ========== SELESAI ==========
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║  ✅ MIGRASI SELESAI!                     ║');
    console.log(`║  ${String(totalImported).padStart(5)} data diimport                      ║`);
    console.log(`║  ${String(totalCollections).padStart(5)} koleksi berhasil                  ║`);
    console.log('╚══════════════════════════════════════════╝');

    // Simpan log
    const logData = {
      timestamp: new Date().toISOString(),
      spreadsheetId: SPREADSHEET_ID,
      totalImported,
      totalCollections,
    };
    writeFileSync(
      join(__dirname, 'migration-log.json'),
      JSON.stringify(logData, null, 2),
      'utf-8'
    );
    console.log('\n📁 Log tersimpan: migration-log.json');

    console.log('\n🎉 Sekarang buka URL Web App Apps Script Anda!');
    console.log('   Data dari Firestore sudah otomatis tersimpan di Google Sheets.');
    console.log('   Tinggal buka halaman portal atau panel admin.\n');

  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

// ==================== JALANKAN ====================

migrate();