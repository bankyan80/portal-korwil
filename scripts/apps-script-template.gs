/**
 * Apps Script — Portal Korwil
 * Trigger: Google Form Submit → Google Sheet (data_pegawai)
 *
 * Cara setup:
 * 1. Buka https://script.google.com
 * 2. Buat project baru, paste kode ini
 * 3. Ganti MAIN_SHEET_ID dengan ID spreadsheet utama (data portal)
 * 4. Simpan → Triggers → Tambah trigger:
 *    - Function: onFormSubmit
 *    - Event: From spreadsheet → On form submit
 * 5. Hubungkan ke Google Sheet yang terima respon form
 */

const MAIN_SHEET_ID = '1v4jy1VNM9xNCLMa_B3xr-jOlayBNBDILptN_nxKT2sc';
const MAIN_SHEET_TAB = 'data_pegawai';
const DRIVE_FOLDER_ID = '1ROF4T8UETEfCyY_pzkwRh7c5rK7hdYSJ';

/**
 * Main trigger: dipanggil otomatis setiap ada submit form
 */
function onFormSubmit(e) {
  if (!e || !e.namedValues) {
    console.log('Skip: event kosong. Submit form dulu.');
    return;
  }
  const formData = e.namedValues;

  const fileUrl = getUploadedFileUrl(e);

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
    file_pdf_url: fileUrl,
  };

  if (!record.nik && !record.nama) {
    console.log('Skip: NIK dan Nama kosong');
    return;
  }

  writeToMainSheet(record);
}

/**
 * Ambil URL file upload dari form response
 */
function getUploadedFileUrl(e) {
  try {
    const itemResponses = e.response?.getItemResponses();
    if (!itemResponses) return '';

    for (const itemResponse of itemResponses) {
      const item = itemResponse.getItem();
      if (item.getType() === 'FILE_UPLOAD') {
        const uploadedFiles = itemResponse.getResponse();
        if (uploadedFiles && uploadedFiles.length > 0) {
          // Pindahkan file ke folder terstruktur
          const file = uploadedFiles[0];
          const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
          const destFolder = getOrCreateSubfolder(folder, 'Dokumen Pegawai');
          const newFile = file.moveTo(destFolder);
          return newFile.getUrl();
        }
      }
    }
  } catch (err) {
    console.error('Gagal proses file upload:', err.toString());
  }
  return '';
}

function getOrCreateSubfolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return parent.createFolder(name);
}

/**
 * Tulis/update data ke sheet utama (data_pegawai)
 */
function writeToMainSheet(record) {
  const ss = SpreadsheetApp.openById(MAIN_SHEET_ID);
  const sheet = ss.getSheetByName(MAIN_SHEET_TAB);
  if (!sheet) throw new Error(`Sheet "${MAIN_SHEET_TAB}" tidak ditemukan di sheet utama`);

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const data = sheet.getDataRange().getValues();

  const nikCol = headers.findIndex(h => h.toString().toLowerCase().includes('nik'));
  const existingRow = data.findIndex((row, i) => i > 0 && row[nikCol]?.toString().trim() === record.nik);

  const row = headers.map(h => {
    const key = h.toString().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    return record[key] || '';
  });

  if (existingRow >= 0) {
    // Update baris yang sudah ada (tidak timpa file_pdf_url jika kosong)
    const existingData = data[existingRow];
    if (!record.file_pdf_url && existingData) {
      const fileUrlCol = headers.findIndex(h => h.toString().toLowerCase().includes('file_pdf_url'));
      if (fileUrlCol >= 0 && existingData[fileUrlCol]) {
        row[fileUrlCol] = existingData[fileUrlCol]; // pertahankan URL lama
      }
    }
    sheet.getRange(existingRow + 1, 1, 1, row.length).setValues([row]);
    console.log(`UPDATE: ${record.nama} (${record.nik})`);
  } else {
    // Append baris baru
    sheet.appendRow(row);
    console.log(`INSERT: ${record.nama} (${record.nik})`);
  }
}

/**
 * Test fungsi — kirim data dummy ke sheet utama
 */
function testWrite() {
  const testRecord = {
    nik: '3209070000000001',
    nama: 'TEST (HAPUS)',
    sekolah: 'SD NEGERI 1 LEMAHABANG',
  };
  writeToMainSheet(testRecord);
  console.log('Test selesai. Cek di Google Sheet.');
}

/**
 * Utility: test koneksi ke sheet utama
 */
function testConnection() {
  const ss = SpreadsheetApp.openById(MAIN_SHEET_ID);
  const sheet = ss.getSheetByName(MAIN_SHEET_TAB);
  if (!sheet) throw new Error(`Sheet "${MAIN_SHEET_TAB}" tidak ditemukan`);
  const rowCount = sheet.getLastRow() - 1;
  console.log(`Terhubung! data_pegawai memiliki ${rowCount} baris data.`);
}
