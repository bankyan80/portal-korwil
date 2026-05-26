-- Migration: Replace Firestore collections with Supabase tables
-- Jalankan di Supabase SQL Editor

-- 1. Generic app_data table for all dynamic content collections
-- Replaces Firestore collections: menus, announcements, gallery,
-- organizations, institution_links, users, settings, news, agenda,
-- program_kerja, dashboard_summary, kip_sd, yatim_piatu, spmb_sd,
-- bos_arkas, dokumen, calendar_events, tabel_sekolah, reports
CREATE TABLE IF NOT EXISTS app_data (
  id TEXT NOT NULL,
  collection TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (collection, id)
);

CREATE INDEX IF NOT EXISTS idx_app_data_collection ON app_data(collection);
CREATE INDEX IF NOT EXISTS idx_app_data_updated ON app_data(updated_at DESC);

-- 2. Schools table (structured data for sekolah collection)
CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT,
  npsn TEXT,
  jenjang TEXT,
  status TEXT,
  desa TEXT,
  alamat TEXT,
  nss TEXT,
  kepala_sekolah TEXT,
  plt_kepala_sekolah TEXT,
  operator_uid TEXT,
  kontak TEXT,
  logo TEXT,
  akreditasi TEXT,
  website TEXT,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schools_npsn ON schools(npsn);
CREATE INDEX IF NOT EXISTS idx_schools_jenjang ON schools(jenjang);

-- 3. Laporan bulanan table (structured data)
CREATE TABLE IF NOT EXISTS laporan_bulanan (
  id TEXT PRIMARY KEY,
  sekolah_id TEXT,
  sekolah TEXT,
  bulan TEXT,
  tahun INTEGER,
  status TEXT DEFAULT 'belum_lapor',
  tgl_lapor BIGINT,
  data_siswa JSONB DEFAULT '{}',
  data_gtk JSONB DEFAULT '{}',
  data_sarpras JSONB DEFAULT '{}',
  data_absen JSONB DEFAULT '{}',
  dikirim_pada BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_laporan_sekolah ON laporan_bulanan(sekolah_id);
CREATE INDEX IF NOT EXISTS idx_laporan_bulan ON laporan_bulanan(tahun, bulan);

-- 4. Sarpras table (structured data)
CREATE TABLE IF NOT EXISTS sarpras (
  id TEXT PRIMARY KEY,
  school_id TEXT,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sarpras_school ON sarpras(school_id);

-- 5. RLS policies for app_data (service_role only)
ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE laporan_bulanan ENABLE ROW LEVEL SECURITY;
ALTER TABLE sarpras ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (already default)
-- Anon key: read-only for schools, laporan_bulanan, sarpras, app_data
CREATE POLICY "Public read app_data" ON app_data FOR SELECT USING (true);
CREATE POLICY "Public read schools" ON schools FOR SELECT USING (true);
CREATE POLICY "Public read laporan_bulanan" ON laporan_bulanan FOR SELECT USING (true);
CREATE POLICY "Public read sarpras" ON sarpras FOR SELECT USING (true);
