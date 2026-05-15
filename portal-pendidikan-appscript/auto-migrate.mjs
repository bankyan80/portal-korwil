/**
 * 🚀 AUTO MIGRASI: Firestore → Data JSON
 * =======================================
 * 
 * Script ini OTOMATIS:
 * 1. Terhubung ke Firebase (project kedinasan-e5317)
 * 2. Membaca SEMUA data dari Firestore (menus, announcements, gallery, dll)
 * 3. Menyimpan sebagai firestore-data.json
 * 4. SIAP untuk diimport ke Apps Script
 * 
 * PRASYARAT:
 * - File service-account.json di folder yang sama (download dari Firebase Console)
 * - Atau file firestore-export.json (export manual dari Firebase Console)
 * 
 * CARA PAKAI:
 * node auto-migrate.mjs
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Koleksi yang akan dimigrasi
const COLLECTIONS = [
  'menus',
  'announcements',
  'gallery',
  'organizations',
  'institution_links',
  'settings',
  'users',
];

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   AUTO MIGRASI FIRESTORE → JSON         ║');
  console.log('║   Portal Pendidikan                      ║');
  console.log('╚══════════════════════════════════════════╝');

  const serviceAccountPath = join(__dirname, 'service-account.json');
  const exportFilePath = join(__dirname, 'firestore-export.json');

  // ===== Coba baca dari export file dulu =====
  if (existsSync(exportFilePath)) {
    console.log('\n📂 Membaca dari firestore-export.json...');
    const raw = readFileSync(exportFilePath, 'utf-8');
    const data = JSON.parse(raw);
    processAndSave(data);
    return;
  }

  // ===== Coba pakai service account =====
  if (!existsSync(serviceAccountPath)) {
    console.log('\n❌ Tidak ada file service-account.json');
    console.log('   Juga tidak ada firestore-export.json');
    console.log('\n📥 PERINTAH: Download service account:');
    console.log('   1. Buka https://console.firebase.google.com');
    console.log('   2. Pilih project → Settings → Service Accounts');
    console.log('   3. Generate new private key');
    console.log(`   4. Simpan sebagai: ${serviceAccountPath}`);
    console.log('\n   Atau export manual dari Firebase Console:');
    console.log('   1. Buka Firestore Database');
    console.log('   2. Export collection → download JSON');
    console.log('   3. Simpan sebagai: firestore-export.json');
    process.exit(1);
  }

  // ===== Baca dari Firestore langsung =====
  console.log('\n📡 Membaca dari Firebase Firestore...');
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
  
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  }
  const db = getFirestore();
  const result = {};

  for (const name of COLLECTIONS) {
    process.stdout.write(`   ⏳ ${name}... `);
    try {
      const snapshot = await db.collection(name).get();
      if (snapshot.empty) {
        console.log('⚠️  kosong');
        result[name] = [];
        continue;
      }
      const docs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      }));
      console.log(`✅ ${docs.length} dokumen`);
      result[name] = docs;
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
      result[name] = [];
    }
  }

  processAndSave(result);
}

function processAndSave(rawData) {
  const output = {};
  let total = 0;

  const sheetMapping = {
    'menus': { sheet: 'menus', fields: ['id','title','icon','url','active','order','category'] },
    'announcements': { sheet: 'announcements', fields: ['id','title','content','createdAt','pinned','author'] },
    'gallery': { sheet: 'gallery', fields: ['id','title','description','imageUrl','category','authorName','authorRole','status','createdAt'] },
    'organizations': { sheet: 'organizations', fields: ['id','name','logo','leader','contact','active'] },
    'institution_links': { sheet: 'links', fields: ['id','name','logo','url','active','order'] },
    'settings': { sheet: 'settings', fields: ['id','key','value'] },
    'users': { sheet: 'users', fields: ['id','email','username','displayName','role','createdAt'] },
  };

  for (const [colName, items] of Object.entries(rawData)) {
    if (!Array.isArray(items) || items.length === 0) continue;

    const mapping = sheetMapping[colName];
    if (!mapping) continue;

    const sheetName = mapping.sheet;
    const fields = mapping.fields;

    const rows = items.map((item, idx) => {
      const row = {};
      fields.forEach(field => {
        let val = item[field];
        if (val === undefined || val === null) {
          val = '';
        } else if (typeof val === 'boolean') {
          val = val ? 'true' : 'false';
        } else if (Array.isArray(val)) {
          if (field === 'imageUrl') val = val[0] || '';
          else val = JSON.stringify(val);
        } else if (typeof val === 'object') {
          val = JSON.stringify(val);
        } else {
          val = String(val);
        }
        row[field] = val;
      });
      if (!row.id) row.id = `migrated_${idx}_${Date.now()}`;
      return row;
    });

    output[sheetName] = rows;
    total += rows.length;
    console.log(`   📋 ${colName} → ${sheetName}: ${rows.length} item`);
  }

  // Simpan file
  const outputPath = join(__dirname, 'firestore-data.json');
  writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`\n✅ SELESAI! ${total} item dari ${Object.keys(output).length} koleksi`);
  console.log(`📁 File: ${outputPath}`);
  console.log('\n📥 CARA IMPORT KE APPS SCRIPT:');
  console.log('   1. Buka panel admin Apps Script (?page=admin)');
  console.log('   2. Buka file firestore-data.json');
  console.log('   3. Copy semua isinya');
  console.log('   4. Paste di menu "Import Data" di Dashboard Admin');
  console.log('\n   Atau langsung paste ke Google Sheet:');
  console.log('   - Buka Google Sheets → masing-masing sheet');
  console.log('   - Hapus data lama → paste data baru\n');
}

main().catch(err => {
  console.error('\n❌ ERROR:', err);
  process.exit(1);
});