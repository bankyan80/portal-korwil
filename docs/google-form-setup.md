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

## 2. Buat Google Sheet untuk menampung respon

1. Di form, buka tab **Responses**
2. Klik ikon **Google Sheets** 🟢 (Link to Sheets)
3. Pilih **Buat spreadsheet baru** → beri nama: `Data Pegawai - Form`
4. Klik **Buat**

## 3. Siapkan Google Drive Folder

1. Buka https://drive.google.com
2. Buat folder baru: `SK Pegawai - Portal Korwil`
3. **Share folder:**
   - Klik kanan folder → **Share** → **General access** → `Anyone with the link`
   - Set ke **Viewer**
   - Salin link folder

## 4. Setup Apps Script

1. Di Google Sheet, klik **Extensions → Apps Script**
2. Hapus konten default, paste isi file `scripts/apps-script-template.gs`
3. **Sesuaikan variable `SUPABASE_URL` dan `SUPABASE_ANON_KEY`** di bagian atas file
4. Klik 💾 **Save** → beri nama project: `Portal Korwil - Sync`
5. Klik **Run** ▶️ (pilih `testConnection`) → **Review permissions** → pilih akun Google kamu → **Allow**
6. Cek **Executions** → harus sukses

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
2. Isi data dummy (misal NIK: `3209070000000001`)
3. Submit
4. Cek di Apps Script **Executions** → harus sukses
5. Cek di Supabase **Table Editor** → `employees` → harus ada data baru

---

## Troubleshooting

| Masalah | Solusi |
|---|---|
| `Could not find the column` | Field di Apps Script tidak cocok dengan nama kolom di Supabase. Cek mapping. |
| `401 Unauthorized` | SUPABASE_ANON_KEY salah atau RLS policy belum diset. |
| Trigger tidak jalan | Buka Apps Script → Triggers → pastikan trigger aktif. |
| File upload tidak muncul | Form → ⚙️ → upload file harus diizinkan. |
