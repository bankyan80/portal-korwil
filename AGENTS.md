# Session Summary

## Goal
- Build portal-dinas with 6 service menus, Super Admin (10 menu) and Operator (8 menu) dashboards, full CRUD, seed/sync data, export/import Excel.
- Sync latest pegawai/siswa data from `simpeg-tim` and `simdawa` local projects to Supabase.

## Constraints & Preferences
- Jenjang: SD, TK, KB. Status: Negeri, Swasta.
- Semua data via `/api/firestore/[collection]` generic CRUD (Supabase `app_data` table).
- Auth: Firebase Auth client-side, cookie `auth-token` for API auth.
- `PUBLIC_COLLECTIONS` allows public GET/POST/DELETE without auth.

## Progress

### Done
- Built 10 Super Admin pages + 8 Operator pages + 6 public service pages.
- Built CRUD pages: master-data-sekolah, simdawa (students), simpeg (employees), mapping-pegawai, sirubin, rekap-pendidikan, validasi-data, manajemen-operator, pengaturan-sistem.
- Built seed data API (`/api/admin/seed-data`): 45 schools + employee_mappings + system_settings.
- Built sync data API (`/api/admin/sync-data`): match schoolId, identify kepala sekolah, regenerate mapping.
- Built export/import Excel: dynamic `/api/admin/export/[collection]` and `/api/admin/import/[collection]` + ExportButton/ImportButton components.
- Added `offset` + `total` pagination to `/api/firestore/[collection]` GET handler.
- Added `schools`, `students`, `employees` to PUBLIC_COLLECTIONS — all 6 public pages now load.
- Created `/api/admin/cleanup` — server-side dedup endpoint.
- Added `/api/admin/sync-data`, `/api/admin/seed-data`, `/api/admin/cleanup` to proxy.ts selfAuthPaths.
- **Data sync from simpeg-tim**: 22 schools, 292 pegawai, 2 PLT → Supabase (via POST to Vercel API).
- **Data sync from simdawa**: 7.010 siswa → Supabase.
- **Cleanup**: 6.260 duplicate student records removed (old UUID-based vs new NISN-based).
- **Final counts**: 45 schools, 398 employees, 7.880 students, 22 kepala sekolah identified.
- Build: sukses 115 routes, 0 error.

### In Progress
- (none)

### Blocked
- Supabase env vars empty in `.env.local` — only available on Vercel.
- Sync-data API only processes ≤1000 students due to Supabase JS client default limit (mitigated with `.limit(100000)`).

## Key Decisions
- **Sync approach**: POST directly to Vercel `/api/firestore/[collection]` with NIK/NISN as record IDs, batch 50 concurrent.
- **Auth for admin API**: Firebase ID token via cookie + .NET `WebRequest` (PowerShell `Invoke-WebRequest` ignores Cookie header).
- **Password reset**: Firebase Admin SDK via `scripts/reset-pass.ts` (service-account on disk).
- **Duplicate cleanup**: Client-side batch deletions (concurrent 50) faster than Vercel serverless (10s limit).
- **Data volume**: ~7.880 students after dedup (from 14.250 including UUID duplicates).

## Relevant Files (new/changed this session)
- `src/app/api/firestore/[collection]/route.ts`: offset pagination, total count, PUBLIC_COLLECTIONS updated.
- `src/app/api/admin/cleanup/route.ts`: server-side dedup endpoint.
- `src/app/api/admin/sync-data/route.ts`: `.limit(100000)` for all Supabase queries.
- `src/proxy.ts`: selfAuthPaths includes sync-data, seed-data, cleanup.
- `scripts/sync-from-local.ts`: imported data from simpeg-tim + simdawa (deleted).
- `scripts/cleanup2.mjs`: client-side dedup with batch concurrent deletes (deleted).
