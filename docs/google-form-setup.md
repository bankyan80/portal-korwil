# Panduan Setup Google Form + Apps Script

## 1. Buat Google Form

1. Buka https://forms.google.com
2. Klik **+** (Form baru)
3. Buat field sesuai tabel di bawah:

| No | Judul Field | Tipe | Wajib |
|---|---|---|---|
| 1 | NIK (Nomor Induk Kependudukan) | Jawaban singkat | Ya |
| 2 | Nama Lengkap | Jawaban singkat | Ya |
| 3 | NUPTK | Jawaban singkat | Tidak |
| 4 | Jenis Kelamin | Pilihan (L/P) | Ya |
| 5 | Tempat Lahir | Jawaban singkat | Tidak |
| 6 | Tanggal Lahir | Tanggal | Tidak |
| 7 | NIP | Jawaban singkat | Tidak |
| 8 | Status Kepegawaian | Pilihan (PNS/PPPK/GTY/PTY) | Tidak |
| 9 | Jenis PTK | Pilihan (Guru/Tenaga Kependidikan/Kepala Sekolah) | Tidak |
| 10 | Tugas Tambahan | Jawaban singkat | Tidak |
| 11 | TMT Pengangkatan | Tanggal | Tidak |
| 12 | Sekolah | Pilihan (daftar sekolah) | Ya |
| 13 | Upload Berkas SK | Upload file | Tidak |

4. **Pengaturan penting:**
   - ⚙️ → **Kumpulkan alamat email** → NYALAKAN
   - ⚙️ → **Batasi ke 1 tanggapan** → MATIKAN
   - ⚙️ → **Izinkan pengeditan tanggapan** → NYALAKAN

## 2. Link Form ke Google Sheet Respon

1. Di form, buka tab **Responses**
2. Klik ikon **Google Sheets** 🟢 (Link to Sheets)
3. Pilih **Buat spreadsheet baru** → beri nama: `Data Pegawai - Form Responses`
4. Klik **Buat**

## 3. Siapkan Google Drive Folder

1. Folder root sudah ada: `Portal Korwil` (ID: `1ROF4T8UETEfCyY_pzkwRh7c5rK7hdYSJ`)
2. Service account sudah di-share sebagai editor ke folder tsb
3. Jika perlu folder khusus untuk dokumen pegawai, buat subfolder: `Dokumen Pegawai`

## 4. Setup Apps Script

1. Di **Google Sheet respon** (bukan sheet utama), klik **Extensions → Apps Script**
2. Hapus konten default, paste isi file `scripts/apps-script-template.gs`
3. **Ganti `MAIN_SHEET_ID`** di baris 11 dengan ID sheet utama:
   ```
   const MAIN_SHEET_ID = '1v4jy1VNM9xNCLMa_B3xr-jOlayBNBDILptN_nxKT2sc';
   ```
4. Klik 💾 **Save** → beri nama project: `Portal Korwil - Sync`
5. Klik **Run** ▶️ (pilih `testConnection`) → **Review permissions** → pilih akun Google kamu → **Allow**
6. Cek **Executions** → harus sukses (muncul jumlah baris data)

## 5. Setup Trigger Otomatis

1. Di Apps Script editor, klik **Triggers** (jam ⏰ di sidebar kiri)
2. **+ Add Trigger**
   - Function: `onFormSubmit`
   - Event source: `From spreadsheet`
   - Event type: `On form submit`
   - Failure notification: `Notify me daily`
3. Klik **Save**

## 6. Test

1. Buka Google Form kamu
2. Isi data dummy (NIK: `3209070000000001`, Nama: `TEST`)
3. Submit — upload file SK jika mau
4. Cek di Apps Script **Executions** → harus sukses
5. Cek di **Google Sheet utama** → tab `data_pegawai` → baris baru muncul
6. Hapus data test dari sheet setelah verifikasi

## Troubleshooting

| Masalah | Solusi |
|---|---|
| `Sheet data_pegawai tidak ditemukan` | Pastikan MAIN_SHEET_ID benar. Cek nama tab di sheet utama. |
| `401 Unauthorized` | Service account tidak punya akses. Share sheet utama ke email service account sbg Editor. |
| Trigger tidak jalan | Buka Apps Script → Triggers → pastikan trigger aktif. |
| File upload gagal | Pastikan service account punya akses Write ke Drive folder root. |
| Data tidak muncul di sheet | Cek Apps Script **Executions** → lihat error log. |
