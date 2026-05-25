/**
 * Apps Script — Portal Korwil
 * Trigger: Google Form Submit → Supabase upsert
 *
 * Cara setup:
 * 1. Buka https://script.google.com
 * 2. Buat project baru, paste kode ini
 * 3. Ganti SUPABASE_URL dan SUPABASE_ANON_KEY sesuai project
 * 4. Simpan → Triggers → Tambah trigger:
 *    - Function: onFormSubmit
 *    - Event: From spreadsheet → On form submit
 * 5. Hubungkan ke Google Sheet yang terima respon form
 */

const SUPABASE_URL = 'https://xyouvellfcqhsbkclfbk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5b3V2ZWxsZmNxaHNia2NsZmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxOTY1MzEsImV4cCI6MjA5NDc3MjUzMX0.HMt6pVTk8z3ioGEvcmneBuP2d-XEj_5WXEeldz6fp04';

/**
 * Main trigger: dipanggil otomatis setiap ada submit form
 */
function onFormSubmit(e) {
  const formData = e.namedValues;

  const record = {
    nik: formData['NIK']?.[0]?.trim() || '',
    nama: formData['Nama']?.[0]?.trim()?.toUpperCase() || '',
    nuptk: formData['NUPTK']?.[0]?.trim() || '',
    jk: formData['Jenis Kelamin']?.[0]?.trim()?.toUpperCase() || '',
    tempat_lahir: formData['Tempat Lahir']?.[0]?.trim() || '',
    tanggal_lahir: formData['Tanggal Lahir']?.[0]?.trim() || '',
    nip: formData['NIP']?.[0]?.trim() || '',
    status_kepegawaian: formData['Status Kepegawaian']?.[0]?.trim() || '',
    jenis_ptk: formData['Jenis PTK']?.[0]?.trim() || '',
    tugas_tambahan: formData['Tugas Tambahan']?.[0]?.trim() || '',
    tmt: formData['TMT Pengangkatan']?.[0]?.trim() || '',
    sekolah: formData['Sekolah']?.[0]?.trim() || '',
    // file_pdf_url akan diisi dari Drive
    file_pdf_url: formData['URL Berkas']?.[0]?.trim() || '',
    verified: false,
  };

  if (!record.nik || !record.nama) {
    console.log('Skip: NIK atau Nama kosong');
    return;
  }

  upsertToSupabase('employees', record);
}

/**
 * Juga handle upload file ke Drive dan simpan URL-nya
 * Panggil ini dari form jika ada field upload file
 */
function onFormSubmitWithFile(e) {
  const formData = e.namedValues;
  const itemResponses = e.response?.getItemResponses();

  // Cari jawaban upload file
  let fileUrl = '';
  if (itemResponses) {
    for (const itemResponse of itemResponses) {
      const item = itemResponse.getItem();
      if (item.getType() === 'FILE_UPLOAD') {
        const uploadedFiles = itemResponse.getResponse();
        if (uploadedFiles && uploadedFiles.length > 0) {
          // File sudah otomatis tersimpan di Drive form
          // Ambil URL dari kolom yang berisi link Drive
          fileUrl = uploadedFiles[0].getUrl();
        }
      }
    }
  }

  const record = {
    nik: formData['NIK']?.[0]?.trim() || '',
    nama: formData['Nama']?.[0]?.trim()?.toUpperCase() || '',
    // ... field lainnya sama seperti di atas
    file_pdf_url: fileUrl || formData['URL Berkas']?.[0]?.trim() || '',
    verified: false,
  };

  if (!record.nik || !record.nama) return;
  upsertToSupabase('employees', record);
}

/**
 * Kirim data ke Supabase via REST API
 */
function upsertToSupabase(table, record) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?on_conflict=nik`;

  const payload = {
    ...record,
    updated_at: new Date().toISOString(),
  };

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'return=minimal, resolution=merge-duplicates',
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();
    console.log(`[${table}] ${record.nama} (${record.nik}) → ${code}`);
    if (code >= 400) {
      console.error('Error body:', response.getContentText());
    }
  } catch (err) {
    console.error(`[${table}] Gagal upsert ${record.nama}:`, err.toString());
  }
}

/**
 * Test fungsi — jalankan manual untuk verifikasi
 */
function testUpsert() {
  const testRecord = {
    nik: '3209070000000001',
    nama: 'TEST (HAPUS)',
    sekolah: 'SD NEGERI 1 LEMAHABANG',
    verified: false,
  };
  upsertToSupabase('employees', testRecord);
  console.log('Test selesai. Cek di Supabase.');
}

/**
 * Utility: test koneksi
 */
function testConnection() {
  const url = `${SUPABASE_URL}/rest/v1/employees?limit=1`;
  const options = {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    muteHttpExceptions: true,
  };
  try {
    const response = UrlFetchApp.fetch(url, options);
    console.log('Status:', response.getResponseCode());
    console.log('Body:', response.getContentText());
  } catch (err) {
    console.error('Gagal:', err.toString());
  }
}
