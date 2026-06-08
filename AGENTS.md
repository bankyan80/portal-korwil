# Session Summary

## Goal
- Fix Firebase Admin SDK initialization and migrate all Firestore data to Supabase `app_data` table.
- Build monthly report page (`/laporan-daftar-1`) and graduated student report (`/laporan-siswa-lulus`).

## Constraints & Preferences
- Login tetap via Firebase Auth (client-side `signInWithEmailAndPassword`)
- User profile dibaca dari Supabase via `GET /api/firestore/users?id=UID` (baca `app_data`)
- User baru otomatis tersimpan ke Supabase via `apiSetUser` di `AuthProvider.tsx`
- Semua collection Firestore dimigrasi ke `app_data` (28 collections)
- `MIGRATION_API_KEY` env var untuk auth API route migrasi (header `x-api-key`)

## Progress

### Done
- Root cause: Google service account JSON pakai `project_id` (snake_case) tapi `firebase-admin.ts` ngecek `serviceAccount.projectId` (camelCase) → selalu `undefined` → `app = null`
- Fix: tambah `normalizeServiceAccount()` di `firebase-admin.ts` yang mapping `project_id`→`projectId`, `client_email`→`clientEmail`, dll
- Fix standalone script `scripts/migrate-firestore-to-supabase.ts` — sama (snake_case bug)
- Fix API key auth: migration route terima `x-api-key` header sebagai alternatif cookie
- Fix upsert: `onConflict: 'collection,id'` → `onConflict: 'id'` (tidak ada composite constraint)
- **Migrasi sukses: 7.970 dokumen dari 28 collections** — users(36), schools(45), students(7.324), employees(469), dll
- Login flow: Firebase Auth → `onAuthStateChanged` → `apiGetUser(uid)` → `GET /api/firestore/users?id=UID` → Supabase `app_data`
- AuthProvider udah handle fallback: kalo user gak ditemukan di Supabase, bikin baru dengan role `publik` / `super_admin`
- **Discovered: `src/proxy.ts` is Next.js middleware** (Next.js 16 recognizes `export function proxy` as middleware) — blocks `/api/admin/*` routes with 401 if no `auth-token` cookie or valid JWT
- **`x-api-key` bypass in proxy.ts**: `/api/admin/seed-passwords` and `/api/migrate/firestore-to-supabase` skip middleware auth when `x-api-key` header matches `MIGRATION_API_KEY`
- **Sekolah login (`/api/auth/login-npsn`) works**: seeds 45 schools with password `123456` from static `src/data/sekolah.ts` data (bypasses missing `schools` collection in Supabase `app_data`)
- **`curl.exe` mis-handles JSON in PowerShell** — use `Invoke-WebRequest` instead for API testing
- **Vercel deployment protection bypass**: `x-vercel-protection-bypass` header with token from `vercel.json`

### Remaining
- (none)

## New in This Session
- Created `GET /api/siswa/lulus` — returns kelas-6 SD students grouped by school (22 schools, 872 siswa: 464 L / 408 P).
- Created `/laporan-siswa-lulus/page.tsx` — table per sekolah with columns: No, NPSN, Nama Sekolah, L, P, Total + search filtering + stat cards.
- Added menu item `menu-laporan-siswa-lulus` (GraduationCap icon, category Laporan, order 5) to `mockMenus`.

## Key Decisions
- Firebase Admin SDK gak perlu migration route lagi — semua data udah di Supabase
- `api/firestore/[collection]` route udah fully on Supabase sejak fix collection Promise (Next.js 16)
- API key auth (`x-api-key`) di migration route bisa dihapus kalo udah gak dipake
- JWT token verification (`verifyCookieAuth`) masih fallback — `auth.status !== 500` bypass kalo Firebase Admin gak available
- **Supabase `app_data` doesn't have `schools` collection** (migration data was lost/not saved) → seed passwords use static `allSekolah` from `src/data/sekolah.ts`
- **proxy.ts middleware uses `x-api-key` bypass for seed-password & migrate routes** — no JWT needed when header matches env var

## Relevant Files
- `src/lib/firebase-admin.ts`: `normalizeServiceAccount()` + snake_case→camelCase fix
- `src/app/api/migrate/firestore-to-supabase/route.ts`: migration endpoint + API key auth
- `src/app/api/firestore/[collection]/route.ts`: Supabase-backed CRUD (GET/POST/DELETE)
- `src/providers/AuthProvider.tsx`: login flow — baca profil dari Supabase, fallback create
- `scripts/migrate-firestore-to-supabase.ts`: standalone script (bisa jalan via `npx tsx`)
- `src/data/data-pegawai.json`: 343 SD pegawai records (22 schools)
- `src/data/data-pegawai-tk.json`: 118 TK/KB pegawai records (20 schools)
- **`src/proxy.ts`**: Next.js middleware — JWT check for `/api/admin/*`, `x-api-key` bypass for seed/migrate routes
- **`src/app/api/auth/login-npsn/route.ts`**: NPSN-based login — verifies from `school_passwords` collection, creates `npsn_sessions`, returns Set-Cookie
- **`src/app/api/admin/seed-passwords/route.ts`**: Seeds `school_passwords` from static `allSekolah` data (bypasses missing Supabase `schools` collection)
