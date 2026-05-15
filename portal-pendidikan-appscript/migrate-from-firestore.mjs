/**
 * Script Migrasi Data dari Firebase Firestore ke Google Sheets (via Apps Script)
 * 
 * Cara penggunaan:
 * 1. Pastikan sudah login Firebase: firebase login
 * 2. Set FIREBASE_SERVICE_ACCOUNT_PATH ke path file service account JSON
 * 3. Jalankan: node migrate-from-firestore.mjs
 * 4. Output: firestore-data.json (siap diimport ke Apps Script)
 * 
 * Atau langsung salin data dari Firestore console:
 * 1. Buka Firebase Console → Firestore Database
 * 2. Export koleksi yang diperlukan sebagai JSON
 * 3. Simpan sebagai firestore-export.json
 * 4. Jalankan: node migrate-from-firestore.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ==================== KONFIGURASI ====================

// Koleksi Firestore yang akan diambil
const COLLECTIONS = [
  'menus',
  'announcements', 
  'gallery',
  'organizations',
  'institution_links',
  'settings',
];

// Mapping nama koleksi Firestore → sheet Apps Script
const COLLECTION_MAP = {
  'menus': 'menus',
  'announcements': 'announcements',
  'gallery': 'gallery',
  'organizations': 'organizations',
  'institution_links': 'links',
  'settings': 'settings',
};

// ==================== FUNGSI UTAMA ====================

function migrateFromFirestoreExport() {
  // Coba baca dari file export Firestore
  const exportFile = join(__dirname, 'firestore-export.json');
  const serviceAccountFile = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
    join(__dirname, 'service-account.json');

  if (existsSync(exportFile)) {
    console.log('📂 Membaca data dari firestore-export.json...');
    const raw = readFileSync(exportFile, 'utf-8');
    const data = JSON.parse(raw);
    processAndSave(data);
    return;
  }

  if (existsSync(serviceAccountFile)) {
    console.log('🔑 Service account ditemukan, mengambil data dari Firestore...');
    fetchFromFirestore(serviceAccountFile);
    return;
  }

  console.log(`
❌ Tidak ditemukan file data.

Cara 1: Export dari Firebase Console
  - Buka Firebase Console → Firestore Database
  - Export collection → simpan sebagai firestore-export.json di folder ini

Cara 2: Gunakan Service Account
  - Download service-account.json dari Firebase Console
  - Simpan di folder ini sebagai service-account.json
  - Jalankan: npm install firebase-admin
  - Jalankan: node migrate-from-firestore.mjs

Cara 3: Input manual
  - Buat file firestore-input.json dengan format:
  {
    "menus": [ ... ],
    "announcements": [ ... ],
    ...
  }
  - Jalankan ulang script ini
  `);
}

async function fetchFromFirestore(serviceAccountPath) {
  try {
    const { initializeApp, cert } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');

    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
    
    const app = initializeApp({
      credential: cert(serviceAccount),
    });

    const db = getFirestore(app);
    const result = {};

    for (const collectionName of COLLECTIONS) {
      console.log(`  ⏳ Mengambil koleksi: ${collectionName}...`);
      const snapshot = await db.collection(collectionName).get();
      
      if (snapshot.empty) {
        console.log(`  ⚠️ Koleksi ${collectionName} kosong`);
        result[collectionName] = [];
        continue;
      }

      const docs = snapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data };
      });

      result[collectionName] = docs;
      console.log(`  ✅ ${docs.length} dokumen dari ${collectionName}`);
    }

    processAndSave(result);
    console.log('✅ Selesai! Data siap diimport ke Apps Script.');
  } catch (err) {
    console.error('❌ Gagal mengambil dari Firestore:', err.message);
    console.log('\n💡 Pastikan:\n  1. npm install firebase-admin sudah dijalankan');
    console.log('  2. Service account file valid');
    console.log('  3. Service account memiliki akses ke Firestore');
  }
}

function processAndSave(rawData) {
  const output = {};

  for (const [firestoreCollection, items] of Object.entries(rawData)) {
    const sheetName = COLLECTION_MAP[firestoreCollection] || firestoreCollection;

    if (!Array.isArray(items) || items.length === 0) {
      output[sheetName] = [];
      continue;
    }

    // Map field names dan format data untuk Apps Script
    const mapped = items.map((item, index) => {
      const entry = {
        id: item.id || `migrated_${index}_${Date.now()}`,
      };

      // Mapping berdasarkan tipe koleksi
      switch (firestoreCollection) {
        case 'menus':
          entry.title = item.title || '';
          entry.icon = item.icon || 'Globe';
          entry.url = item.url || '#';
          entry.active = String(item.active === true || item.active === 'true' ? 'true' : 'false');
          entry.order = String(item.order ?? index + 1);
          entry.category = item.category || '';
          break;

        case 'announcements':
          entry.title = item.title || '';
          entry.content = item.content || '';
          entry.createdAt = String(item.createdAt || item.created_at || Date.now());
          entry.pinned = String(item.pinned === true || item.pinned === 'true' ? 'true' : 'false');
          entry.author = item.author || 'Admin';
          break;

        case 'gallery':
          entry.title = item.title || '';
          entry.description = item.description || '';
          entry.imageUrl = (item.images && Array.isArray(item.images) && item.images[0]) 
            ? item.images[0] 
            : (item.imageUrl || 'https://placehold.co/800x600/e2e8f0/64748b?text=Galeri');
          entry.category = item.category || 'Umum';
          entry.authorName = item.authorName || 'Admin';
          entry.authorRole = item.authorRole || 'Admin';
          entry.status = (item.status === 'published' || item.status === 'approved' || !item.status) 
            ? 'approved' 
            : 'pending';
          entry.createdAt = String(item.createdAt || Date.now());
          break;

        case 'organizations':
          entry.name = item.name || '';
          entry.logo = item.logo || '';
          entry.leader = item.leader || '';
          entry.contact = item.contact || '';
          entry.active = String(item.active === true || item.active === 'true' ? 'true' : 'false');
          break;

        case 'institution_links':
          entry.name = item.name || '';
          entry.logo = item.logo || '';
          entry.url = item.url || '#';
          entry.active = String(item.active === true || item.active === 'true' ? 'true' : 'false');
          entry.order = String(item.order ?? index + 1);
          break;

        case 'settings':
          entry.key = item.key || '';
          entry.value = item.value || '';
          break;

        default:
          // Untuk koleksi lain, salin semua field
          for (const [key, val] of Object.entries(item)) {
            if (key !== 'id') {
              entry[key] = typeof val === 'object' ? JSON.stringify(val) : String(val);
            }
          }
      }

      return entry;
    });

    output[sheetName] = mapped;
    console.log(`  📋 ${firestoreCollection} → ${sheetName}: ${mapped.length} item`);
  }

  // Simpan hasil
  const outputPath = join(__dirname, 'firestore-data.json');
  writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

  // Hitung total
  const totalItems = Object.values(output).reduce((sum, arr) => sum + arr.length, 0);
  
  console.log(`\n✅ Migrasi selesai! Total ${totalItems} item dari ${Object.keys(output).length} koleksi.`);
  console.log(`📁 File output: ${outputPath}`);
  console.log('\n📥 Cara import ke Apps Script:');
  console.log('  1. Buka panel admin Apps Script');
  console.log('  2. Buka menu "Import" (jika tersedia)');
  console.log('  3. Upload file firestore-data.json');
  console.log('  4. Atau buka file firestore-data.json dan paste kontennya');
}

// ==================== JALANKAN ====================

console.log('🚀 Portal Pendidikan - Migrasi Data Firestore ke Apps Script');
console.log('========================================================\n');
migrateFromFirestoreExport();