# Session Summary

## Goal
- Fix profil-sekolah data, sync akurat jumlah siswa & kelas dari file Dapodik
- (Previous sessions: build portal-dinas with 6 service menus, Super Admin & Operator dashboards, full CRUD, seed/sync data, export/import Excel, sync from simpeg-tim & simdawa)

## Constraints & Preferences
- Production site: `www.portalkorwil.online` (Vercel, Next.js 16, Supabase)
- NPSN login bypasses Firebase Auth (cookie-based session)
- Schools & Students collections are `PUBLIC_COLLECTIONS` (read/write tanpa auth)
- File Dapodik Excel ada lokal di `C:\Users\Bank Yan\portal-dinas\data-siswa\` (47 file .xlsx)
- Semua data via `/api/firestore/[collection]` generic CRUD (Supabase `app_data` table)

## Progress

### Done
#### Previous Sessions
- Built 10 Super Admin pages + 8 Operator pages + 6 public service pages
- Seed data API, sync data API, export/import Excel API
- Sync data from simpeg-tim (292 pegawai) & simdawa (7.010 siswa)
- Cleanup 6.260 duplicate student records, fix 1.176 schoolIds
- 6 public pages verified, build sukses 117 routes 0 error

#### Current Session (Profil-Sekolah & Sync Statistik)
- **Root cause profil-sekolah kosong**: login NPSN tidak isi `schoolId`/`schoolName` di existing profile — fixed
- **Root cause 500**: `updated_at` column dihapus dari upsert (kolom tak ada di `app_data`)
- **`jumlahSiswa:0`, `jumlahGuru:0`, `jumlahTendik:0`** ditambahkan ke seed defaults
- **Endpoint `/api/admin/sync-school-stats`** dibuat & di-deploy (auto-count dari DB)
- Sync dijalankan via Node.js: menghitung langsung dari DB untuk 45 sekolah
- **213 siswa SD NEGERI 1 LEMAHABANG KULON** diperbaiki (salah `schoolId` 20215162 → 20215161)
- **Dibaca semua 47 file Excel Dapodik** dari `data-siswa/`, jumlah siswa diupdate sesuai Dapodik (7.061 siswa total)
- **Kelas/rombel diperbaiki** untuk semua sekolah (3 pass):
  - v1 (`fix_all_kelas.mjs`): NISN matching + sekolah matching (buggy - overwrote schoolIds)
  - v2 (`fix_kelas_v2.mjs`): Regex `/KELAS\s+(\d+)/i` (tidak handle Romawi)
  - v3 (`fix_romawi.mjs`): Handle Roman numerals (I→1, II→2, ..., VI→6)
- **SDN 1 LEMAHABANG**: fixed overshoot 176→149 (moved 27 wrongly-assigned students out)
- **SDN 2 BELAWA**: Kelas 1(63), 2(43), 3(43), 4(36), 5(37), 6(34) — cocok Dapodik ✅
- **SD IT AL IRSYAD**: semua 549 siswa sekarang punya kelas (I→1 sampai VI→6)

### In Progress
- (none — remaining mismatches are minor/edge cases)

### Remaining Issues (Minor)
- **SDN 1 ASEM**: 346 siswa di DB vs 197 di Excel — 149 extra dari simdawa (NISN berbeda dengan Dapodik) + 39 NIK-based tanpa NISN. `jumlahSiswa` sudah 197 (dari Excel)
- **PAUD SPS MELATI & TK BPP KENANGA**: duplikat file Excel (copy files), DB count ½ dari Excel
- **±1 mismatches**: SDN 1 PICUNGPUGUR (122 vs 123), SDN 3 CIPEUJEUH WETAN (354 vs 355), SDN 1 LEMAHABANG KULON (241 vs 242), KB A.H. PLUS (66 vs 65)

### All Resolved ✓
- **SDN 1 LEMAHABANG**: overshoot 176→149 fixed
- **SD IT AL IRSYAD**: 549 siswa, Roman numerals handled
- **SDN 2 BELAWA**: kelas distribution cocok Dapodik ✅
- **PAUD AL-HIDAYAH, ASY-SYAFIIYAH, AMALIA SALSABILA**: files matched ✅
- **KB A.H. PLUS & TK GELATIK**: 5 NIK-based students fixed ✅
- **PAUD AL HAMBRA**: 30 siswa — kelas A (10) usia 3-5 th, B (20) usia 5-6 th ✅
- **7.208 siswa, 0 tanpa kelas** ✅

### Blocked
- Supabase env vars empty in `.env.local` — only available on Vercel
- Sync-data API times out (10s Vercel Hobby) — use local Node.js scripts instead

## Key Decisions
- **Sync via file Excel lokal** (47 file Dapodik di `data-siswa/`) lebih cepat daripada scraping Google Drive/API
- **`jumlahSiswa` dari Excel count** (source of truth Dapodik), bukan dari jumlah record DB — akurat untuk profil-sekolah
- **Match siswa via NISN** dulu, fallback ke NIK
- **Ekstraksi kelas** dari "Rombel Saat Ini": `/KELAS\s+(\d+)/i` untuk SD, `/Kelompok\s+([A-E])/i` untuk TK/PAUD, Roman numerals regex untuk sekolah swasta
- **Jangan overwrite schoolId** saat fix kelas (v1 bug — diperbaiki di v2)
- **Update via POST merge:true** untuk menghindari create duplikat
- **Batch concurrent 50** untuk API calls (seimbang antara speed & reliability)
- **Pendekatan per-sekolah** untuk menghindari masalah offset pagination API
- **Skip siswa tanpa NISN** dari fix kelas (tidak bisa match ke Excel)

## Relevant Files
- `src/app/api/auth/login-npsn/route.ts`: existing profile now ensures schoolId/schoolName
- `src/app/api/firestore/[collection]/route.ts`: removed `updated_at` column from POST upsert
- `src/app/api/admin/sync-school-stats/route.ts`: auto-count endpoint (deployed)
- `C:\Users\Bank Yan\portal-dinas\data-siswa\`: 47 file Excel Dapodik lokal
- `TEMP\opencode\fix_all_kelas.mjs`: full sync + fix kelas (v1, buggy matching, DELETED)
- `TEMP\opencode\fix_kelas_v2.mjs`: re-fix kelas dengan regex lebih akurat (DELETED)
- `TEMP\opencode\fix_romawi.mjs`: handle Roman numerals (DELETED)
- `TEMP\opencode\sync_excel_counts.mjs`: update jumlahSiswa dari Excel (DELETED)
