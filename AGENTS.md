# Session Summary

## Goal
Fix Firebase Admin SDK initialization and migrate all Firestore data to Supabase `app_data` table.

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

### Remaining
- KB AMALIA SALSABILA & KB PERMATA BUNDA — no Dapodik export files in Drive

## Key Decisions
- Firebase Admin SDK gak perlu migration route lagi — semua data udah di Supabase
- `api/firestore/[collection]` route udah fully on Supabase sejak fix collection Promise (Next.js 16)
- API key auth (`x-api-key`) di migration route bisa dihapus kalo udah gak dipake
- JWT token verification (`verifyCookieAuth`) masih fallback — `auth.status !== 500` bypass kalo Firebase Admin gak available

## Relevant Files
- `src/lib/firebase-admin.ts`: `normalizeServiceAccount()` + snake_case→camelCase fix
- `src/app/api/migrate/firestore-to-supabase/route.ts`: migration endpoint + API key auth
- `src/app/api/firestore/[collection]/route.ts`: Supabase-backed CRUD (GET/POST/DELETE)
- `src/providers/AuthProvider.tsx`: login flow — baca profil dari Supabase, fallback create
- `scripts/migrate-firestore-to-supabase.ts`: standalone script (bisa jalan via `npx tsx`)
- `src/data/data-pegawai.json`: 343 SD pegawai records (22 schools)
- `src/data/data-pegawai-tk.json`: 118 TK/KB pegawai records (20 schools)
