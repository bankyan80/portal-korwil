# Supabase Storage Integration

## Overview
File besar (gambar, PDF, Excel, Word) disimpan di **Supabase Storage**, bukan di Firestore.
Firestore hanya menyimpan metadata dan URL file.

## 1. Install Supabase CLI

```bash
npm install supabase --save-dev
```

## 2. Login Supabase CLI

```bash
npm run supabase:login
```

Browser akan terbuka untuk login ke Supabase.

## 3. Inisialisasi Project

```bash
npm run supabase:init
```

## 4. Link ke Project Supabase

1. Buat project di https://supabase.com/dashboard
2. Copy Project Reference ID dari Settings > General
3. Link project:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

## 5. Membuat Bucket `portal-files`

1. Buka https://supabase.com/dashboard/project/YOUR_PROJECT_REF/storage
2. Klik **New Bucket**
3. Nama: `portal-files`
4. Public: **Yes** (untuk tahap awal)
5. Atau via SQL Editor:

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('portal-files', 'portal-files', true);
```

## 6. Mengisi .env.local

Tambahkan ke `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=portal-files

# Supabase Service Role Key (untuk server-side upload API)
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

> **PENTING:** Jangan commit `.env.local` ke git.

## 7. Menjalankan Project

```bash
npm run dev
```

## 8. Menjalankan Script Migrasi

### Dry Run (preview tanpa mengubah data)

```bash
npm run migrate:files:dry
```

### Execute (migrasi sebenarnya)

```bash
npm run migrate:files:execute
```

Log migrasi disimpan di `migration-logs/`:
- `migration-success.json` - dokumen berhasil
- `migration-failed.json` - dokumen gagal
- `migration-skipped.json` - dokumen dilewati

## 9. Memastikan Firestore Tidak Menyimpan Base64

Setelah migrasi:
1. Cek Firestore Console di Firebase
2. Koleksi `dokumen` - field `dataUrl` harus `null`
3. Field `file.provider` harus `"supabase"`
4. Koleksi `gallery` - field `images[]` harus berisi URL Supabase, bukan base64

## 10. Mengecek File di Supabase Storage

1. Buka https://supabase.com/dashboard/project/YOUR_PROJECT_REF/storage
2. Buka bucket `portal-files`
3. File tersimpan dalam struktur folder:
   - `dokumen/{sekolahId}/{timestamp}-{nama-file}.pdf`
   - `galeri/{kategori}/{timestamp}-{nama-file}.jpg`
   - `laporan-bulanan/{tahun}/{bulan}/{sekolahId}/{timestamp}-{nama-file}.xlsx`

## 11. Mengecek Metadata di Firestore

Query di Firestore:
```
collection('dokumen').where('file.provider', '==', 'supabase')
```

Metadata yang disimpan:
```json
{
  "file": {
    "provider": "supabase",
    "bucket": "portal-files",
    "fileName": "1716000000000-laporan.xlsx",
    "originalName": "Laporan Bulanan.xlsx",
    "storagePath": "laporan-bulanan/2026/januari/sdn-1/file.xlsx",
    "fileUrl": "https://xxx.supabase.co/storage/v1/object/public/portal-files/...",
    "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "size": 245000,
    "uploadedAt": "2026-05-19T..."
  }
}
```

## Struktur File

```
src/lib/
  supabaseClient.ts      # Supabase client initialization
  supabaseStorage.ts     # Client-side upload helpers

src/app/api/supabase/
  upload/route.ts        # Server-side upload API

scripts/
  migrate-firestore-files-to-supabase.ts  # Migration script
```

## Alur Upload

```
User pilih file
  ↓
Validasi jenis & ukuran
  ↓
POST /api/supabase/upload
  ↓
Upload ke Supabase Storage
  ↓
Dapat public URL
  ↓
Simpan metadata ke Firestore
  ↓
Selesai
```

## Validasi File

| Tipe | Maks Ukuran |
|------|-------------|
| PDF, Word, Excel | 5 MB |
| JPG, PNG, WEBP | 2 MB |

**Ditolak:** EXE, BAT, CMD, JS, SH, PHP, HTML, SCR, PIF, COM, VBS, PS1, MSI
