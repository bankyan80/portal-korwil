-- Schema untuk Portal Korwil
-- Jalankan di Supabase SQL Editor

-- 1. Tabel employees (pegawai)
CREATE TABLE IF NOT EXISTS employees (
  nik TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  nuptk TEXT,
  jk TEXT,
  tempat_lahir TEXT,
  tanggal_lahir TEXT,
  nip TEXT,
  status_kepegawaian TEXT,
  jenis_ptk TEXT,
  agama TEXT,
  tugas_tambahan TEXT,
  sertifikasi TEXT,
  tmt TEXT,
  sekolah TEXT NOT NULL,
  role TEXT,
  file_pdf_url TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel students (siswa)
CREATE TABLE IF NOT EXISTS students (
  nik TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  nisn TEXT,
  jk TEXT,
  tempat_lahir TEXT,
  tanggal_lahir TEXT,
  agama TEXT,
  alamat TEXT,
  sekolah TEXT NOT NULL,
  kelas TEXT,
  rombel TEXT,
  file_pdf_url TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Index untuk pencarian
CREATE INDEX IF NOT EXISTS idx_employees_sekolah ON employees(sekolah);
CREATE INDEX IF NOT EXISTS idx_employees_nama ON employees USING gin(to_tsvector('simple', nama));
CREATE INDEX IF NOT EXISTS idx_students_sekolah ON students(sekolah);
CREATE INDEX IF NOT EXISTS idx_students_nama ON students USING gin(to_tsvector('simple', nama));

-- 4. Enable Row Level Security (public read-only)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- 5. Policy: siapa saja bisa baca (anon key)
CREATE POLICY "Public read employees" ON employees FOR SELECT USING (true);
CREATE POLICY "Public read students" ON students FOR SELECT USING (true);

-- 6. Policy: hanya service_role bisa insert/update
-- (ini sudah default untuk anon key)
