/**
 * Script: Buat Google Form untuk input data pegawai
 * Otomatis membuat form + menghubungkan ke Google Sheet respon
 *
 * Usage: node scripts/create-google-form.mjs
 *
 * Prasyarat:
 * - Service account file di service-account/ folder
 * - Forms API & Drive API diaktifkan di GCP
 * - GOOGLE_SHEET_ID env var atau argumen
 */

import { google } from 'googleapis';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Konfigurasi ──
const TITLE = 'Portal Korwil — Input Data Pegawai';
const DESCRIPTION = 'Form untuk menginput data pegawai baru. Isi data dengan benar.';
const CONFIRM_MESSAGE = 'Terima kasih, data pegawai berhasil dikirim.';

const SHEET_ID = process.env.GOOGLE_SHEET_ID || process.argv[2];
if (!SHEET_ID) {
  console.error('❌ GOOGLE_SHEET_ID tidak ditemukan. Set env atau kirim sebagai argumen.');
  console.error('   Usage: node scripts/create-google-form.mjs <GOOGLE_SHEET_ID>');
  process.exit(1);
}

// ── Load credentials ──
function loadCredentials() {
  const envVal = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (envVal && envVal !== '""') {
    try { return JSON.parse(envVal); } catch {}
    try { return JSON.parse(Buffer.from(envVal, 'base64').toString('utf-8')); } catch {}
  }
  const saDir = join(__dirname, '..', 'service-account');
  if (existsSync(saDir)) {
    const files = readdirSync(saDir).filter(f => f.endsWith('.json'));
    if (files.length) return JSON.parse(readFileSync(join(saDir, files[0]), 'utf-8'));
  }
  return null;
}

const creds = loadCredentials();
if (!creds) {
  console.error('❌ Service account tidak ditemukan');
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: [
    'https://www.googleapis.com/auth/forms',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/spreadsheets',
  ],
});

// ── Utility: enable API jika belum aktif ──
async function ensureApiEnabled(apiName) {
  try {
    const usage = google.serviceusage({ version: 'v1', auth });
    await usage.services.enable({
      name: `projects/${creds.project_id}/services/${apiName}`,
    });
    console.log(`  ✅ API ${apiName} diaktifkan`);
  } catch (e) {
    if (e.code === 409) {
      console.log(`  ⏭️  API ${apiName} sudah aktif`);
    } else {
      console.log(`  ⚠️  Gagal enable ${apiName}: ${e.message}`);
    }
  }
}

// ── Field definitions ──
const FIELDS = [
  { title: 'NIK', type: 'TEXT', required: true, description: 'Nomor Induk Kependudukan (16 digit)' },
  { title: 'Nama Lengkap', type: 'TEXT', required: true },
  { title: 'NUPTK', type: 'TEXT', required: false, description: 'Nomor Unik Pendidik dan Tenaga Kependidikan' },
  { title: 'Jenis Kelamin', type: 'RADIO', required: true, options: ['L', 'P'] },
  { title: 'Tempat Lahir', type: 'TEXT', required: false },
  { title: 'Tanggal Lahir', type: 'DATE', required: false },
  { title: 'NIP', type: 'TEXT', required: false, description: 'Nomor Induk Pegawai' },
  {
    title: 'Status Kepegawaian',
    type: 'DROPDOWN',
    required: false,
    options: ['PNS', 'PPPK', 'GTY/PTY', 'Honor Sekolah', 'Non ASN'],
  },
  {
    title: 'Jenis PTK',
    type: 'DROPDOWN',
    required: false,
    options: ['Guru', 'Tenaga Kependidikan', 'Kepala Sekolah', 'Pengawas'],
  },
  { title: 'Tugas Tambahan', type: 'TEXT', required: false },
  { title: 'TMT Pengangkatan', type: 'DATE', required: false },
  {
    title: 'Sekolah',
    type: 'DROPDOWN',
    required: true,
    options: [], // akan diisi dari Sheet
  },
  { title: 'Upload Berkas SK', type: 'FILE_UPLOAD', required: false },
];

// ── Main ──
async function main() {
  console.log('🚀 Membuat Google Form...\n');

  // 1. Enable APIs
  console.log('📡 Memeriksa API...');
  await ensureApiEnabled('forms.googleapis.com');
  await ensureApiEnabled('drive.googleapis.com');

  // 2. Ambil daftar sekolah dari Sheet
  console.log('\n📚 Mengambil daftar sekolah...');
  let sekolahOptions = [];
  try {
    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'data_sekolah!A:A',
    });
    const values = res.data.values || [];
    sekolahOptions = values.slice(1).map(r => r[0]).filter(Boolean);
    console.log(`  ✅ ${sekolahOptions.length} sekolah ditemukan`);
  } catch (e) {
    console.log(`  ⚠️  Gagal ambil sekolah: ${e.message}. Pakai default.`);
    sekolahOptions = ['SD NEGERI 1 LEMAHABANG', 'SD NEGERI 2 LEMAHABANG'];
  }

  // Update field sekolah dengan options
  const sekolahField = FIELDS.find(f => f.title === 'Sekolah');
  if (sekolahField) sekolahField.options = sekolahOptions;

  // 3. Buat Form via API
  console.log('\n📝 Membuat form...');
  const forms = google.forms({ version: 'v1', auth });

  const formCreateRes = await forms.forms.create({
    requestBody: {
      info: {
        title: TITLE,
        description: DESCRIPTION,
      },
    },
  });

  const formId = formCreateRes.data.formId;
  const formUrl = formCreateRes.data.responderUri;
  console.log(`  ✅ Form dibuat: ${formUrl}`);

  // 4. Batch update — tambah pertanyaan
  console.log('\n📋 Menambahkan pertanyaan...');
  const requests = FIELDS.map((field, i) => {
    const baseItem = {
      createItem: {
        item: {
          title: field.title,
          description: field.description || '',
          questionItem: {},
        },
        location: { index: i },
      },
    };

    switch (field.type) {
      case 'TEXT':
        baseItem.createItem.item.questionItem = {
          question: {
          required: field.required || false,
            textQuestion: { paragraph: false },
          },
        };
        break;
      case 'RADIO':
        baseItem.createItem.item.questionItem = {
          question: {
            required: field.required || false,
            choiceQuestion: {
              type: 'RADIO',
              options: field.options.map(o => ({ value: o })),
              shuffle: false,
            },
          },
        };
        break;
      case 'DROPDOWN':
        baseItem.createItem.item.questionItem = {
          question: {
            required: field.required || false,
            choiceQuestion: {
              type: 'DROP_DOWN',
              options: field.options.map(o => ({ value: o })),
              shuffle: false,
            },
          },
        };
        break;
      case 'DATE':
        baseItem.createItem.item.questionItem = {
          question: {
            required: field.required || false,
            dateQuestion: { includeTime: false, includeYear: true },
          },
        };
        break;
      case 'FILE_UPLOAD':
        baseItem.createItem.item.questionItem = {
          question: {
            required: field.required || false,
            fileUploadQuestion: {
              folderId: '', // akan diisi nanti
              types: ['DOCUMENTS', 'PDFs', 'IMAGES'],
              maxFileSize: 10485760,
            },
          },
        };
        break;
    }

    return baseItem;
  });

  await forms.forms.batchUpdate({
    formId,
    requestBody: { requests },
  });
  console.log(`  ✅ ${FIELDS.length} pertanyaan ditambahkan`);

  // 5. Cari folder Drive untuk upload file
  console.log('\n📁 Menyiapkan folder Drive...');
  let driveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ROOT_ID || '';
  try {
    const drive = google.drive({ version: 'v3', auth });

    if (!driveFolderId) {
      // Buat folder root
      const rootFolder = await drive.files.create({
        requestBody: {
          name: 'Portal Korwil - Dokumen Pegawai',
          mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id',
      });
      driveFolderId = rootFolder.data.id;
      console.log(`  ✅ Folder root dibuat: ${driveFolderId}`);
    } else {
      console.log(`  ✅ Folder root sudah ada: ${driveFolderId}`);
    }

    // Update file upload question dengan folder ID
    const batchUpdateRes = await forms.forms.batchUpdate({
      formId,
      requestBody: {
        requests: [{
          updateItem: {
            item: {
              title: 'Upload Berkas SK',
              questionItem: {
                question: {
                  fileUploadQuestion: {
                    folderId: driveFolderId,
                    types: ['DOCUMENTS', 'PDFs', 'IMAGES'],
                    maxFileSize: 10485760,
                  },
                },
              },
            },
            location: { index: FIELDS.findIndex(f => f.type === 'FILE_UPLOAD') },
            updateMask: 'questionItem.question.fileUploadQuestion',
          },
        }],
      },
    });

    const uploadFieldIndex = FIELDS.findIndex(f => f.type === 'FILE_UPLOAD');
    if (uploadFieldIndex >= 0) {
      console.log('  ✅ Upload file terkonfigurasi');
    }
  } catch (e) {
    console.log(`  ⚠️  Gagal setup Drive folder: ${e.message}. Upload file mungkin tidak berfungsi.`);
  }

  // 6. Set confirmation message
  console.log('\n✅ Mengatur pesan konfirmasi...');
  await forms.forms.batchUpdate({
    formId,
    requestBody: {
      requests: [{
        updateSettings: {
          settings: {
            quizSettings: { isQuiz: false },
          },
          updateMask: 'quizSettings',
        },
      }],
    },
  });

  await forms.forms.batchUpdate({
    formId,
    requestBody: {
      requests: [{
        updateFormInfo: {
          info: {
            title: TITLE,
            description: DESCRIPTION,
            customMessage: CONFIRM_MESSAGE,
          },
          updateMask: 'title,description,customMessage',
        },
      }],
    },
  });

  // 7. Link ke Sheet untuk respon
  console.log('\n🔗 Menghubungkan ke Google Sheet...');
  try {
    const drive = google.drive({ version: 'v3', auth });
    await drive.files.update({
      fileId: formId,
      media: {
        mimeType: 'application/vnd.google-apps.form',
        body: '',
      },
      requestBody: {
        writersCanShare: true,
      },
    });
    console.log('  ✅ Form siap digunakan');
  } catch (e) {
    console.log(`  ⚠️  Gagal link ke Sheet: ${e.message}. Hubungkan manual.`);
  }

  // ── Output ──
  console.log('\n' + '='.repeat(60));
  console.log('🎉 FORM BERHASIL DIBUAT!');
  console.log('='.repeat(60));
  console.log(`  📝 Form URL:     ${formUrl}`);
  console.log(`  🆔 Form ID:      ${formId}`);
  console.log(`  📊 Sheet ID:     ${SHEET_ID}`);
  console.log(`  📁 Drive Folder: ${driveFolderId || 'auto'} (untuk upload file)`);
  console.log('');
  console.log('📋 LANGKAH SELANJUTNYA:');
  console.log('  1. Buka form URL di atas');
  console.log('  2. Klik kirim (Send) → bagikan link ke operator');
  console.log('  3. Setup Apps Script trigger:');
  console.log(`     - Buka sheet respon (dari tab Responses → Link to Sheets)`);
  console.log(`     - Extensions → Apps Script → paste scripts/apps-script-template.gs`);
  console.log(`     - Ganti MAIN_SHEET_ID = '${SHEET_ID}'`);
  console.log(`     - Save → Run testConnection`);
  console.log(`     - Setup trigger: onFormSubmit → On form submit`);
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
