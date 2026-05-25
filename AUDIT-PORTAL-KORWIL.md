# AUDIT PORTAL KORWIL — portalkorwil.online

**Tanggal:** 25 Mei 2026  
**Auditor:** OpenCode AI  
**Versi Kode:** Commit `1bdd43a` (main)

---

## Ringkasan Eksekutif

| Metrik | Hasil |
|--------|-------|
| Total halaman (page.tsx) | 74 |
| Total API routes | 30 |
| Lint errors | 0 ✅ (setelah perbaikan) |
| Build | Berhasil ✅ |
| TypeScript type check | Belum bisa (OOM) |
| Data dummy di produksi | 9 halaman masih pakai fallback |
| API tanpa autentikasi | 10 endpoint |
| Hardcoded secrets | 5 lokasi |
| Forms menyimpan data | ✅ Semua form berfungsi |
| Filter operator by sekolah | ✅ Sudah benar |
| Super admin lihat semua | ✅ Sudah benar |

---

## 1. LINT & BUILD

| Check | Status | Perbaikan |
|-------|--------|-----------|
| ESLint `npm run lint` | ✅ Bersih | 5 errors fixed |
| Build `npm run build` | ✅ Berhasil (93s) | 106 pages, 30 API routes |
| TypeCheck `tsc --noEmit` | ❌ OOM (heap out of memory) | Perlu `--max-old-space-size` |

### Lint Errors Fixed

| File | Error | Solusi |
|------|-------|--------|
| `src/components/auth/AuthGuard.tsx:52` | `useEffect` after early return | Pindahkan hook sebelum conditional return |
| `src/app/data-pd/page.tsx:117` | Ref assignment during render | Pindahkan ke `useEffect` |
| `src/hooks/use-supabase-query.ts:61` | `JSON.stringify` in deps array | Ganti pakai `useRef` pattern |
| `src/hooks/useCachedFirestore.ts:54,137` | Unused eslint-disable | Hapus komentar |
| `src/app/admin/operator/page.tsx:69` | Memoization mismatch | Sederhanakan dependencies ke `[user]` |

---

## 2. AUTENTIKASI & ROLE

### Auth Flow
✅ Firebase Auth + Firestore profile (`users/{uid}`)
✅ Cookie `auth-token` untuk API middleware
✅ Role auto-upgrade via `NEXT_PUBLIC_SUPER_ADMIN_EMAILS`
✅ Bootstrap: first user → super_admin (jika `users` kosong)

### Isu

| Severity | Lokasi | Issue | Status |
|----------|--------|-------|--------|
| **HIGH** | `AuthProvider.tsx:78` | First-user auto super_admin di production | ✅ Dijaga dgn `NEXT_PUBLIC_VERCEL_ENV !== 'production'` |
| MEDIUM | `AuthProvider.tsx:36` | Cookie auth-token tidak auto-refresh | Belum diperbaiki |
| MEDIUM | `AccessValidation.tsx:19` | WA number hardcoded | ✅ Diganti env var |
| MEDIUM | `AccessValidation.tsx:19` | WA message tidak pakai `featureName` | ✅ Diperbaiki |
| LOW | `firebase-admin.ts:98` | Singleton guard `!getApps().length` bermasalah | Belum diperbaiki |

### Role Permissions (dari `permissions.ts`)

| Role | Jumlah Permission | Super Admin Lihat Semua? | Operator Filter by Sekolah? |
|------|:-:|:-:|:-:|
| `super_admin` | 24 | ✅ Ya | N/A |
| `operator_sekolah` | 11 | N/A | ✅ Ya (via `schoolId`/`schoolName`) |
| `ketua_organisasi` | 10 | N/A | N/A |
| `publik` | 0 | N/A | N/A |

---

## 3. API ROUTES — KEAMANAN

### Endpoint TANPA Autentikasi (CRITICAL)

| Route | Method | Risiko | Notes |
|-------|--------|--------|-------|
| `POST /api/pegawai` | POST | Create pegawai sembarang orang | Intentional (form publik) |
| `GET /api/siswa/per-kelas` | GET | Data siswa semua sekolah publik | Public page |
| `GET /api/pegawai/gtk-summary` | GET | Data GTK semua sekolah publik | |
| `GET/POST/PUT/DELETE /api/sheets/[type]` | All | Full CRUD Google Sheets | |
| `GET /api/drive/test` | GET | Info konfigurasi Drive | |
| `POST /api/chat` | POST | Pakai Gemini API tanpa batas | |
| `POST /api/haloai` | POST | Pakai Gemini API tanpa batas | |
| `POST /api/sync/create-sheets` | POST | Buat spreadsheet baru | |
| `POST /api/sync/google-sheets` | POST | Sync data ke sheet hardcoded | |
| `GET /api/dokumen/list` | GET | Dokumen pegawai publik | |

### Endpoint dengan Auth

| Route | Method | Auth Method | Status |
|-------|--------|-------------|--------|
| `PUT/DELETE /api/pegawai/[nik]` | PUT/DELETE | `verifyCookieAuth` + `requireRole` | ✅ |
| `GET /api/pegawai/all` | GET | Cookie auth | ✅ |
| `GET /api/pegawai/lookup` | GET | `verifyCookieAuth` + `requireRole` | ✅ |
| `POST /api/upload-pegawai` | POST | Bearer token | ✅ |
| `POST /api/tugas` | POST | Role-based | ✅ |
| `POST /api/admin/users` | POST | `requireRole(['super_admin'])` | ✅ |
| `POST /api/siswa/sync` | POST | `requireRole(['super_admin'])` | ✅ |

### Hardcoded Secrets

| File | Line | Value | Status |
|------|------|-------|--------|
| `api/drive/test/route.ts` | 51,78 | `1ROF4T8UETEfCyY_pzkwRh7c5rK7hdYSJ` | ✅ Ganti env var |
| `api/pegawai/gtk-summary/route.ts` | 10-20 | Google Sheets published URLs | Belum diperbaiki |
| `api/cron/sync-sheets/route.ts` | 7 | Folder ID fallback | Belum diperbaiki |
| `api/sync/create-sheets/route.ts` | 7 | Folder ID fallback | Belum diperbaiki |
| `api/sync/google-sheets/route.ts` | 7 | Spreadsheet ID `14v0ykMflGpnb...` | Belum diperbaiki |

---

## 4. FRONTEND PAGES — DATA DUMMY / FALLBACK

### Halaman dengan Fallback Data (BUKAN live dari API/DB)

| Halaman | Sumber Fallback | Dampak |
|---------|----------------|--------|
| `data-pd/page.tsx` | `rombelData` dari `@/data/rombel` | Data rombel dari JSON statis |
| `data-rombel/page.tsx` | `fallbackRombel` dari `@/data/rombel` | Data rombel dari JSON statis |
| `data-sd/page.tsx` | `sekolahSD` dari `@/data/sekolah` | 22 SD jatuh ke fallback |
| `data-tk/page.tsx` | `sekolahTK` dari `@/data/sekolah` | 9 TK jatuh ke fallback |
| `data-paud/page.tsx` | `sekolahKB` dari `@/data/sekolah` | 15 KB jatuh ke fallback |
| `agenda-kegiatan/page.tsx` | `defaultData` hardcoded | Agenda statis |
| `spmb-sd/admin/page.tsx` | `defaultData` hardcoded | Pendaftar statis |
| `mapping-pegawai/page.tsx` | `rombelData` | Data mapping dari JSON |

### Halaman Redirect (tidak butuh audit)

- `/berita` → `/semua-informasi`
- `/galeri` → `/semua-galeri`
- `/kalender` → `/agenda-kegiatan`
- `/spmb` → `/spmb-sd`
- `/cetak-laporan-bulanan` → `/laporan-bulanan`

---

## 5. FORMS — DATA FLOW

### Forms dengan Google Sheets API

| Form | Endpoint | Status |
|------|----------|--------|
| Tambah Pegawai (`tambah-pegawai`) | `POST /api/pegawai` (sheets) | ✅ |
| Upload Dokumen Pegawai (`upload-pegawai`) | `POST /api/upload-pegawai` (Drive + Sheets) | ✅ |

### Forms dengan Firestore SAJA

| Form | Koleksi | Perlu Migrasi ke Sheets? |
|------|---------|--------------------------|
| Tambah Siswa | `students` | Optional |
| Profil Sekolah | `schools` | Optional |
| SPMB | `spmb_sd_pendaftar` | Optional |
| Yatim Piatu | `yatim_piatu` | Optional |
| Berita | `berita` | Optional |
| Galeri | `galeri_images` | Optional (upload ke Drive) |
| Agenda Organisasi | `agenda_kegiatan` | Optional |
| Program Kerja | `program_kerja` | Optional |
| Sarpras | `sarpras` | Optional |
| Laporan Bulanan | `laporan_bulanan` | Optional |
| Tugas | `tugas` + `tugas_progress` | Optional |
| Users | `users` | Jangan (sensitive) |
| Dokumen | `dokumen` | Optional |

> **Catatan:** Admin CRUD tetap di Firestore (sesuai keputusan arsitektur). Hanya data publik (pegawai, siswa, sekolah) yang perlu di Sheets.

---

## 6. GOOGLE DRIVE UPLOAD

| Komponen | Status | Detail |
|----------|--------|--------|
| `POST /api/drive/upload` | ✅ | Firebase Auth + validasi file |
| `POST /api/upload-pegawai` | ✅ | Upload + simpan link ke Sheet |
| `InputDokumen.tsx` | ✅ | Sudah pakai Drive upload |
| `ManageGallery.tsx` | ✅ | Sudah pakai Drive upload |
| `dokumen-bersama/page.tsx` | ✅ | Public download dari Drive |
| `admin/operator/dokumen/page.tsx` | ✅ | Upload dokumen via Drive |

### Issues Drive Upload
⚠️ Tidak ada validasi ukuran file di server  
⚠️ Metadata response contains internal folder IDs

---

## 7. REALTIME & CACHE

| Komponen | Status |
|----------|--------|
| `useCachedFirestore` | ✅ Cache + realtime via `onSnapshot` |
| `FirestoreDataProvider` | ✅ Mock data gated by `!db` |
| `firebase-cache.ts` | ✅ localStorage cache 24h TTL |
| `useOfflineQueue` | ✅ Queue for offline writes |
| `FirebaseLED` | ✅ Connected/disconnected indicator |

### Issues Realtime
⚠️ Mock data tidak muncul jika Firestore configured tapi collection kosong  
⚠️ Race condition pada cache get (2 request bersamaan)

---

## 8. SPMB (PENERIMAAN SISWA BARU)

| Halaman | Status | Notes |
|---------|--------|-------|
| `/spmb-sd` (landing) | ✅ | Static page with links |
| `/spmb-sd/daftar` | ✅ | Form ke Firestore |
| `/spmb-sd/daftar-ulang` | ✅ | Form ke Firestore |
| `/spmb-sd/pengumuman` | ✅ | Public page |
| `/spmb-sd/cek` | ✅ | Cek status pendaftaran |
| `/spmb-sd/admin` | ⚠️ | `defaultData` hardcoded fallback |

---

## 9. ERROR HANDLING

### API Routes tanpa try/catch

| Route | Risiko |
|-------|--------|
| `GET /api/route.ts` | Rendah (trivial handler) |
| `GET /api/pegawai/detail` | Tinggi — Firestore call + file read |
| `GET /api/pegawai/gtk-summary` | Tinggi — multiple data sources |
| `GET/POST /api/berita` | Tinggi — Firestore calls |

### Frontend Pages tanpa error handling

| Halaman | Risiko |
|---------|--------|
| `semua-informasi/page.tsx` | Firestore fetch tanpa catch |
| `rekap-laporan/page.tsx` | Firestore fetch tanpa catch |
| `organisasi/[slug]/page.tsx` | Firestore fetch tanpa catch |
| `data-sekolah/page.tsx` | Hanya loading state, no error |

---

## 10. MOCK DATA

Mock data di `src/lib/mock-data.ts` hanya muncul jika:
- `db` === null (Firebase env vars tidak terkonfigurasi) ✅
- Semua collection kosong ✅

**Isu:**
- BOS data (`mock-data.ts:669-692`) berisi NPSN dan nominal realistik — pastikan synthetic
- `mockHeroData.photoURL` pakai `/kadis.png` — file harus ada di `public/`
- Tidak ada guard env var tambahan (`NEXT_PUBLIC_USE_MOCK_DATA=false`)

---

## 11. DAFTAR PERBAIKAN YANG SUDAH DILAKUKAN

| # | Perbaikan | File | Status |
|---|-----------|------|--------|
| 1 | Pindahkan `useEffect` sebelum early return | `AuthGuard.tsx` | ✅ |
| 2 | Ref assignment → useEffect | `data-pd/page.tsx` | ✅ |
| 3 | JSON.stringify deps → useRef pattern | `use-supabase-query.ts` | ✅ |
| 4 | Hapus unused eslint-disable | `useCachedFirestore.ts` | ✅ |
| 5 | Sederhanakan useCallback deps | `operator/page.tsx` | ✅ |
| 6 | WA number hardcoded → env var | `AccessValidation.tsx` | ✅ |
| 7 | WA message pakai featureName | `AccessValidation.tsx` | ✅ |
| 8 | First-user bootstrap guard produksi | `AuthProvider.tsx` | ✅ |
| 9 | Hardcoded folder ID → env var | `drive/test/route.ts` | ✅ |
| 10 | Validasi NIK + jenis_ptk | `pegawai/route.ts` | ✅ |
| 11 | data-pd pakai rombel (bukan kelas) untuk KB | `siswa/per-kelas/route.ts` | ✅ |

---

## 12. REKOMENDASI (Priority Order)

### P1 — Keamanan
1. 🔴 Tambah auth/rate limiting ke endpoint publik
2. 🔴 Pindah hardcoded Spreadsheet ID ke env var (`sync/google-sheets/route.ts`)
3. 🔴 Tambah try/catch ke 4 API routes tanpa error handling

### P2 — Data Integrity
4. 🟡 Migrasi `data-pd`, `data-rombel`, `data-sd/tk/paud` ke Google Sheets API
5. 🟡 Hapus `defaultData` hardcoded di `spmb-sd/admin` dan `agenda-kegiatan`

### P3 — Production Readiness
6. 🟢 Tambah `NEXT_PUBLIC_USE_MOCK_DATA=false` guard
7. 🟢 Fix `firebase-admin.ts` singleton guard
8. 🟢 Refresh cookie auth-token via `onIdTokenChanged`

---

*Audit diselesaikan pada 25 Mei 2026 oleh OpenCode AI.*
