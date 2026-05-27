# Session Summary

## Goal
Sync pegawai data from Dapodik Drive and static JSON into Supabase employees table.

## Constraints & Preferences
- Sync via static JSON first (import-pegawai-xlsx.mjs from Drive xlsx), then upsert to Supabase
- Supabase employees table has restricted schema: nik, nama, nuptk, jk, tempat_lahir, tanggal_lahir, nip, status_kepegawaian, jenis_ptk, agama, tugas_tambahan, sertifikasi, tmt, sekolah, role, file_pdf_url, verified, created_at, updated_at
- Dedup by NIK before upsert

## Progress

### Done
- Checked portalkorwil.online audit (25 Mei 2026, build✅ lint✅ 109/109 pages, 14 minor issues)
- Identified 8 TK/KB schools without pegawai in static JSON
- Scanned Drive folder `156LDwGxBLRZxwMfQ5m1yQSi_pEl2_MUz` — found xlsx Dapodik exports for 43/45 schools
- Found and imported xlsx from 3 sub-folders via embeddedfolderview:
  - PAUD AN NAIM: `19nnEatEq6pH7VNz5GaujXAeUQyIIEXsC` (guru), `17lHkPT5dL769uRIJaEcF35dR9Pv_Lyzx` (tendik)
  - PAUD ASY-SYAFIIYAH: `1-Ljh0fioqTyp6g0P6z6y_EvAy7uLbjCF` (guru), `1rR_835vBIyujAnhrEBEzGnLhZxG-Kx0F` (tendik)
  - PAUD BUDGENVIL: `19d3jEvRRx7KeZiZ71JuIP-QuUIQunQhl` (guru), `16wvIeC9TRdeJyTEI2VwcY0AOh_olLZD1` (tendik)
- Updated `scripts/import-pegawai-xlsx.mjs` with 6 new file entries
- Ran import → 12 new pegawai records (AN NAIM: 5, ASY-SYAFIIYAH: 3, BUDGENVIL: 4)
- Created `scripts/sync-to-supabase.mjs` to upsert static JSON into Supabase employees
- Fixed schema mismatch (strip disallowed columns) + duplicate NIK dedup → 427 records upserted to Supabase
- TK pegawai total: 118 records across 20 schools

### Remaining (no data source)
- KB AMALIA SALSABILA — no files in Drive at all
- KB PERMATA BUNDA — no files in Drive at all
- User needs to upload Dapodik export xlsx for these 2 schools

## Key Decisions
- Use direct Node.js script to Supabase (bypass dev server) for reliability
- Deduplicate records by NIK before upsert to avoid Postgres ON CONFLICT DO UPDATE error
- Strip non-Supabase columns (dapodik, npsn, npsn_sekolah, dapodik_nama, kategori_guru, mapel, aktif) at sync boundary
- Use embeddedfolderview (`drive.google.com/embeddedfolderview?id=FOLDER_ID#list`) to list files in subfolders (since API key is blocked for files.list)

## Relevant Files
- `src/data/data-pegawai.json`: 343 SD pegawai records (22 schools)
- `src/data/data-pegawai-tk.json`: 118 TK/KB pegawai records (20 schools)
- `scripts/import-pegawai-xlsx.mjs`: Downloads Drive xlsx → parses → merges into static JSON (30 file entries)
- `scripts/sync-to-supabase.mjs`: Batch upserts static JSON into Supabase employees table
- `src/data/sekolah.ts`: Canonical list of 45 schools (22 SD, 8 TK, 15 KB)
- `src/data/canonical-schools.json`: Name variant → canonical mapping
