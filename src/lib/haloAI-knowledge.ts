export interface LocalAnswer {
  answer: string;
  confidence: 'exact' | 'high' | 'medium';
}

export type Complexity = 'sederhana' | 'sedang' | 'kompleks';

const LOCAL_KB: Record<string, LocalAnswer> = {
  'cara lapor': {
    answer: 'Untuk mengisi laporan bulanan:\n\n1. Login sebagai operator sekolah\n2. Buka menu [📋 Laporan Bulanan](/admin/operator/laporan-bulanan)\n3. Pilih bulan dan tahun\n4. Isi data siswa, GTK, sarpras, dan absen\n5. Klik "Kirim Laporan Bulanan"\n\nStatus laporan: Belum Lapor → Sudah Dikirim → Diverifikasi',
    confidence: 'exact',
  },
  'laporan bulanan': {
    answer: 'Laporan bulanan bisa diakses di:\n\n[📋 Isi Laporan](/admin/operator/laporan-bulanan) — untuk operator\n[📊 Rekap Laporan](/rekap-laporan) — untuk monitoring\n\nLaporan diisi per bulan (Januari–Desember) dan mencakup data siswa, GTK, sarpras, dan absensi.',
    confidence: 'exact',
  },
  'cara spmb': {
    answer: 'SPMB SD (Sistem Penerimaan Murid Baru) bisa diakses di:\n\n[🎓 SPMB SD](/spmb-sd)\n\nHalaman ini berisi informasi pendaftaran murid baru SD di Kecamatan Lemahabang.',
    confidence: 'exact',
  },
  'cara tka': {
    answer: 'TKA SD (Test Kompetensi Akademik) bisa diakses di:\n\n[📝 TKA SD](/tka-sd)\n\nHalaman ini berisi informasi test kompetensi akademik SD.',
    confidence: 'exact',
  },
  'cara upload': {
    answer: 'Untuk upload dokumen:\n\n1. Buka menu [📁 Dokumen Bersama](/dokumen-bersama)\n2. Klik tombol "Tambah Dokumen"\n3. Pilih file (PDF, Word, Excel, JPG, PNG, WEBP, maks 10MB)\n4. Isi keterangan dokumen\n5. Klik "Upload"\n\nFile disimpan di Supabase Storage.',
    confidence: 'exact',
  },
  'cara cetak': {
    answer: 'Untuk mencetak laporan:\n\n1. Buka halaman yang ingin dicetak\n2. Klik tombol "Cetak" atau "Print"\n3. Pilih printer di dialog browser\n4. Klik "Print"\n\nAtau gunakan shortcut Ctrl+P (Windows) / Cmd+P (Mac).',
    confidence: 'exact',
  },
  'cara export': {
    answer: 'Export data tersedia di beberapa halaman:\n\n- [📊 Rekap Laporan](/rekap-laporan) — Export Excel, PDF, Print\n- [👥 Data Siswa](/admin/operator/data-siswa) — Export data siswa\n\nKlik tombol export yang tersedia di masing-masing halaman.',
    confidence: 'exact',
  },
  'rekap sekolah': {
    answer: 'Rekap data sekolah bisa dilihat di:\n\n[📊 Rekap Laporan](/rekap-laporan) — monitoring semua sekolah\n[🏫 Data Sekolah](/data-sekolah) — daftar lengkap sekolah\n\nRekap menampilkan status laporan bulanan per sekolah (Januari–Desember).',
    confidence: 'exact',
  },
  'cara login': {
    answer: 'Untuk login ke portal:\n\n1. Klik tombol [🔐 Login](/login) di header\n2. Masukkan email dan password\n3. Klik "Masuk"\n\nJika belum punya akun, hubungi admin untuk dibuatkan akun operator.',
    confidence: 'exact',
  },
  'cara tambah siswa': {
    answer: 'Untuk menambah data siswa:\n\n1. Login sebagai operator\n2. Buka [👤 Tambah Siswa](/admin/operator/tambah-siswa)\n3. Isi data lengkap siswa (NIK, nama, kelas, jenis kelamin, dll)\n4. Klik "Simpan"\n\nData siswa juga bisa diimpor dari Dapodik melalui API.',
    confidence: 'exact',
  },
  'cara tambah guru': {
    answer: 'Untuk menambah data guru:\n\n1. Login sebagai operator\n2. Buka [👥 Data Guru](/admin/operator/data-guru)\n3. Klik "Tambah Guru"\n4. Isi data lengkap (NIK, NIP, nama, jenis PTK, dll)\n5. Klik "Simpan"',
    confidence: 'exact',
  },
  'sarpras': {
    answer: 'Data sarana prasarana bisa dikelola di:\n\n[🏗️ Sarpras](/admin/operator/sarpras)\n\nMencakup: ruang kelas, perpustakaan, UKS, toilet, mushola, gudang, tanah, dan perkakas.',
    confidence: 'exact',
  },
  'kip sd': {
    answer: 'KIP SD (Kartu Indonesia Pintar) bisa diakses di:\n\n[💳 KIP SD](/kip-sd)\n\nHalaman ini berisi data penerima KIP SD di Kecamatan Lemahabang.',
    confidence: 'exact',
  },
  'yatim piatu': {
    answer: 'Data yatim piatu bisa diakses di:\n\n[🤝 Yatim Piatu](/yatim-piatu)\n\nHalaman ini berisi data anak yatim piatu di Kecamatan Lemahabang.',
    confidence: 'exact',
  },
  'bos arkas': {
    answer: 'BOS ARKAS bisa diakses di:\n\n[💰 BOS ARKAS](/bos-arkas)\n\nHalaman ini berisi informasi BOS dan ARKAS untuk sekolah.',
    confidence: 'exact',
  },
  'administrasi': {
    answer: 'Menu administrasi bisa diakses di:\n\n[📂 Administrasi](/administrasi)\n\nBerisi berbagai dokumen dan formulir administrasi pendidikan.',
    confidence: 'exact',
  },
  'mapping pegawai': {
    answer: 'Mapping pegawai bisa diakses di:\n\n[🗺️ Mapping Pegawai](/mapping-pegawai)\n\nHalaman ini berisi pemetaan data pegawai di Kecamatan Lemahabang.',
    confidence: 'exact',
  },
  'agenda kegiatan': {
    answer: 'Agenda kegiatan bisa diakses di:\n\n[📅 Agenda Kegiatan](/agenda-kegiatan)\n\nHalaman ini berisi kalender dan jadwal kegiatan pendidikan.',
    confidence: 'exact',
  },
  'dokumen bersama': {
    answer: 'Dokumen bersama bisa diakses di:\n\n[📁 Dokumen Bersama](/dokumen-bersama)\n\nHalaman ini berisi dokumen bersama yang bisa diupload dan diunduh oleh semua pengguna.',
    confidence: 'exact',
  },
  'profil sekolah': {
    answer: 'Profil sekolah bisa dikelola di:\n\n[🏫 Profil Sekolah](/admin/operator/profil-sekolah)\n\nBerisi data NPSN, NSS, alamat, kepala sekolah, dan informasi sekolah lainnya.',
    confidence: 'exact',
  },
  'dashboard operator': {
    answer: 'Dashboard operator bisa diakses di:\n\n[📊 Dashboard Operator](/admin/operator)\n\nBerisi ringkasan data sekolah, siswa, guru, dan laporan bulanan.',
    confidence: 'exact',
  },
  'dashboard admin': {
    answer: 'Dashboard admin bisa diakses di:\n\n[📊 Dashboard Admin](/admin)\n\nBerisi manajemen konten, user, dan monitoring portal.',
    confidence: 'exact',
  },
  'super admin': {
    answer: 'Dashboard super admin bisa diakses di:\n\n[📊 Super Dashboard](/admin/super)\n\nBerisi monitoring semua sekolah, manajemen user, dan pengaturan portal.',
    confidence: 'exact',
  },
  'siapa kamu': {
    answer: 'Saya adalah **HaloAI**, asisten digital Portal Pendidikan Kecamatan Lemahabang. 🎓\n\nSaya bisa membantu:\n- Menavigasi menu portal\n- Informasi SPMB, TKA, KIP\n- Panduan laporan bulanan\n- Data siswa dan guru\n- Sarana prasarana\n- Dan pertanyaan umum lainnya\n\nSilakan tanya apa saja!',
    confidence: 'exact',
  },
  'halo': {
    answer: 'Halo! 👋 Saya HaloAI, asisten digital Portal Pendidikan Kecamatan Lemahabang.\n\nAda yang bisa saya bantu? Anda bisa:\n- Tanyakan cara menggunakan portal\n- Minta informasi tentang SPMB, TKA, KIP\n- Tanya tentang laporan bulanan\n- Atau pertanyaan umum lainnya',
    confidence: 'exact',
  },
  'bantuan': {
    answer: 'Saya HaloAI siap membantu! 🎓\n\nBerikut yang bisa saya lakukan:\n- 🔍 **Navigasi menu** — "Dimana halaman SPMB?"\n- 📋 **Panduan** — "Cara laporan bulanan"\n- 🏫 **Data** — "Informasi sekolah"\n- 📝 **TKA/SPMB** — "Cara daftar SPMB"\n- 💡 **FAQ** — "Apa itu KIP?"\n\nSilakan tanya apa saja seputar portal pendidikan!',
    confidence: 'exact',
  },
  'daftar menu': {
    answer: 'Berikut menu utama Portal Pendidikan Kecamatan Lemahabang:\n\n**Publik:**\n[🏠 Beranda](/) | [🏫 Profil](/profil) | [🎓 SPMB SD](/spmb-sd) | [📝 TKA SD](/tka-sd) | [📅 Agenda](/agenda-kegiatan) | [📂 Administrasi](/administrasi) | [🗺️ Mapping Pegawai](/mapping-pegawai) | [📊 Rekap Laporan](/rekap-laporan) | [🏫 Data Sekolah](/data-sekolah) | [💳 KIP SD](/kip-sd) | [🤝 Yatim Piatu](/yatim-piatu) | [💰 BOS ARKAS](/bos-arkas) | [📁 Dokumen Bersama](/dokumen-bersama)\n\n**Operator:** [📊 Dashboard](/admin/operator) | [🏫 Profil Sekolah](/admin/operator/profil-sekolah) | [👤 Data Siswa](/admin/operator/data-siswa) | [👥 Data Guru](/admin/operator/data-guru) | [🏗️ Sarpras](/admin/operator/sarpras) | [📋 Laporan Bulanan](/admin/operator/laporan-bulanan)\n\n**Admin:** [📊 Dashboard](/admin) | [📢 Pengumuman](/admin/manage-announcements) | [🖼️ Galeri](/admin/manage-gallery) | [👥 User](/admin/manage-users) | [📁 Dokumen](/admin/manage-documents)\n\n**Super Admin:** [📊 Dashboard](/admin/super) | [🏫 Sekolah](/admin/super/sekolah) | [📈 Monitoring](/admin/super/monitoring) | [⚙️ Settings](/admin/super/settings)',
    confidence: 'exact',
  },
  'lokasi halaman': {
    answer: 'Tentukan halaman yang ingin Anda cari. Contoh:\n- "Dimana halaman SPMB?" → 🎓 [SPMB SD](/spmb-sd)\n- "Cari menu laporan" → [📊 Rekap Laporan](/rekap-laporan)\n- "Halaman profil sekolah" → [🏫 Profil Sekolah](/admin/operator/profil-sekolah)\n\nAtau ketik **"daftar menu"** untuk melihat semua menu.',
    confidence: 'exact',
  },
  'data siswa': {
    answer: 'Data siswa bisa diakses melalui:\n\n**Operator:**\n- [👤 Tambah Siswa](/admin/operator/tambah-siswa) — input data baru\n- [👥 Data Siswa](/admin/operator/data-siswa) — lihat & kelola\n\n**Publik:**\n- Data siswa bisa dilihat di menu masing-masing sekolah',
    confidence: 'exact',
  },
  'data guru': {
    answer: 'Data guru & tendik bisa diakses melalui:\n\n**Operator:**\n- [👥 Data Guru](/admin/operator/data-guru) — lihat, tambah, edit\n\n**Publik:**\n- [🗺️ Mapping Pegawai](/mapping-pegawai) — lihat pemetaan pegawai',
    confidence: 'exact',
  },
  'cara ganti password': {
    answer: 'Untuk mengganti password:\n\n1. Login ke portal\n2. Buka menu profil atau pengaturan akun\n3. Klik "Ganti Password"\n4. Masukkan password lama dan password baru\n5. Klik "Simpan"\n\nAtau hubungi admin jika lupa password.',
    confidence: 'exact',
  },
  'apa itu portal': {
    answer: '**Portal Pendidikan Kecamatan Lemahabang** 🎓\n\nAdalah sistem informasi pendidikan terpadu untuk:\n- Manajemen data siswa & guru\n- Laporan bulanan sekolah\n- SPMB & TKA SD\n- Monitoring pendidikan\n- Informasi publik\n\nDikelola oleh Dinas Pendidikan Kecamatan Lemahabang, Kabupaten Cirebon.',
    confidence: 'exact',
  },
  'e kinerja': {
    answer: 'E-Kinerja bisa diakses di:\n\n[📊 E-Kinerja](/e-kinerja)\n\nHalaman ini berisi informasi dan pengelolaan kinerja pegawai.',
    confidence: 'exact',
  },
  'galeri': {
    answer: 'Galeri foto bisa diakses di:\n\n[🖼️ Galeri](/galeri) — galeri utama\n[📸 Semua Galeri](/semua-galeri) — semua koleksi foto\n\nBerisi dokumentasi kegiatan pendidikan.',
    confidence: 'exact',
  },
  'berita': {
    answer: 'Berita dan informasi bisa diakses di:\n\n[📰 Berita](/berita) — daftar berita\n[ℹ️ Semua Informasi](/semua-informasi) — semua informasi publik\n\nBerisi pengumuman dan informasi terbaru seputar pendidikan.',
    confirmation: 'exact',
  },
  'donasi': {
    answer: 'Donasi bisa diakses di:\n\n[❤️ Donasi](/donasi)\n\nHalaman ini berisi informasi donasi untuk kegiatan pendidikan.',
    confidence: 'exact',
  },
  'kalender': {
    answer: 'Kalender pendidikan bisa diakses di:\n\n[📅 Kalender](/kalender)\n\nBerisi kalender akademik dan jadwal kegiatan pendidikan.',
    confidence: 'exact',
  },
  'organisasi': {
    answer: 'Struktur organisasi bisa diakses di:\n\n[🏢 Organisasi](/organisasi)\n\nBerisi struktur organisasi Dinas Pendidikan Kecamatan Lemahabang.',
    confidence: 'exact',
  },
  'bup': {
    answer: 'BUP (Buku Umum Perpustakaan) bisa diakses di:\n\n[📚 BUP](/bup)\n\nHalaman ini berisi data perpustakaan sekolah.',
    confidence: 'exact',
  },
  'dapodik': {
    answer: 'Data Dapodik bisa diakses di:\n\n[💾 Dapodik](/dapodik)\n\nHalaman ini berisi data pokok pendidikan yang terintegrasi dengan Dapodik.',
    confidence: 'exact',
  },
  'data paud': {
    answer: 'Data PAUD bisa diakses di:\n\n[👶 Data PAUD](/data-paud)\n\nHalaman ini berisi data Pendidikan Anak Usia Dini di Kecamatan Lemahabang.',
    confidence: 'exact',
  },
  'data rombel': {
    answer: 'Data rombongan belajar (rombel) bisa diakses di:\n\n[👥 Data Rombel](/data-rombel)\n\nHalaman ini berisi data rombongan belajar setiap sekolah.',
    confidence: 'exact',
  },
  'data gtk': {
    answer: 'Data GTK (Guru dan Tenaga Kependidikan) bisa diakses di:\n\n[👨‍🏫 Data GTK](/data-gtk)\n\nBerisi data lengkap guru dan tenaga kependidikan.',
    confidence: 'exact',
  },
  'website sekolah': {
    answer: 'Website sekolah bisa diakses di:\n\n[🌐 Website Sekolah](/website-sekolah)\n\nBerisi daftar website resmi sekolah-sekolah di Kecamatan Lemahabang.',
    confidence: 'exact',
  },
  'lupa password': {
    answer: 'Jika lupa password:\n\n1. Buka halaman [🔐 Login](/login)\n2. Klik "Lupa Password?"\n3. Masukkan email terdaftar\n4. Ikuti instruksi reset password\n\nAtau hubungi admin untuk bantuan lebih lanjut.',
    confidence: 'exact',
  },
};

const KEYWORD_MAP: Record<string, string[]> = {
  'cara lapor': ['cara lapor', 'bagaimana lapor', 'cara mengisi laporan', 'cara membuat laporan', 'cara kirim laporan', 'cara submit laporan'],
  'laporan bulanan': ['laporan bulanan', 'laporan bulan', 'rekap laporan', 'monitoring laporan'],
  'cara spmb': ['cara spmb', 'spmb', 'pendaftaran murid baru', 'ppdb', 'cara daftar spmb'],
  'cara tka': ['cara tka', 'tka', 'test kompetensi', 'tka sd'],
  'cara upload': ['cara upload', 'cara unggah', 'cara upload dokumen', 'cara upload file'],
  'cara cetak': ['cara cetak', 'cara print', 'cetak laporan', 'print laporan'],
  'cara export': ['cara export', 'export excel', 'export pdf', 'download excel'],
  'rekap sekolah': ['rekap sekolah', 'data sekolah', 'daftar sekolah', 'semua sekolah'],
  'cara login': ['cara login', 'cara masuk', 'login', 'masuk', 'lupa password'],
  'cara tambah siswa': ['tambah siswa', 'tambah data siswa', 'input siswa', 'daftar siswa baru'],
  'cara tambah guru': ['tambah guru', 'tambah data guru', 'input guru', 'daftar guru baru'],
  'sarpras': ['sarpras', 'sarana prasarana', 'ruang kelas', 'perpustakaan', 'uks'],
  'kip sd': ['kip sd', 'kip', 'kartu indonesia pintar'],
  'yatim piatu': ['yatim piatu', 'data yatim', 'anak yatim'],
  'bos arkas': ['bos arkas', 'bos', 'arkas', 'dana bos'],
  'administrasi': ['administrasi', 'dokumen administrasi', 'surat menyurat'],
  'mapping pegawai': ['mapping pegawai', 'data pegawai', 'pegawai'],
  'agenda kegiatan': ['agenda', 'kegiatan', 'kalender', 'jadwal kegiatan'],
  'dokumen bersama': ['dokumen bersama', 'dokumen', 'file bersama'],
  'profil sekolah': ['profil sekolah', 'data sekolah', 'npsn', 'nss'],
  'dashboard operator': ['dashboard operator', 'menu operator', 'halaman operator'],
  'dashboard admin': ['dashboard admin', 'menu admin', 'halaman admin'],
  'super admin': ['super admin', 'dashboard super', 'menu super'],
  'siapa kamu': ['siapa kamu', 'siapa anda', 'kamu siapa', 'anda siapa', 'apa itu haloai', 'haloai apa'],
  'halo': ['halo', 'hai', 'hi', 'hello', 'hey', 'selamat pagi', 'selamat siang', 'selamat sore', 'selamat malam'],
  'bantuan': ['bantuan', 'help', 'tolong', ' bisa bantu'],
  'daftar menu': ['daftar menu', 'menu apa saja', 'menu portal', 'semua menu', 'list menu', 'panduan menu', ' navigasi'],
  'lokasi halaman': ['dimana', 'lokasi halaman', 'cari halaman', 'halaman apa', 'route'],
  'data siswa': ['data siswa', 'cari siswa', 'cari data siswa', 'daftar siswa'],
  'data guru': ['data guru', 'cari guru', 'cari data guru', 'daftar guru', 'guru dan tendik'],
  'cara ganti password': ['ganti password', 'ubah password', 'reset password', 'lupa password'],
  'apa itu portal': ['apa itu portal', 'tentang portal', 'portal pendidikan', 'informasi portal'],
  'e kinerja': ['e kinerja', 'e-kinerja', 'kinerja'],
  'galeri': ['galeri', 'foto', 'dokumentasi'],
  'berita': ['berita', 'informasi', 'pengumuman', 'artikel', 'news'],
  'donasi': ['donasi', 'donasi', 'sumbangan'],
  'kalender': ['kalender pendidikan', 'kalender akademik'],
  'organisasi': ['organisasi', 'struktur organisasi'],
  'bup': ['bup', 'buku umum perpustakaan', 'perpustakaan'],
  'dapodik': ['dapodik', 'data pokok pendidikan'],
  'data paud': ['data paud', 'paud'],
  'data rombel': ['data rombel', 'rombongan belajar', 'rombel'],
  'data gtk': ['data gtk', 'gtk'],
  'website sekolah': ['website sekolah', 'web sekolah', 'situs sekolah'],
};

const COMPLEX_KEYWORDS = [
  'analisa', 'analisis', 'analytics', 'audit', 'audit sistem',
  'coding', 'kode', 'program', 'script', 'source code',
  'dokumen', 'surat', 'draft', 'buatkan',
  'ringkasan', 'summary', 'rekap', 'statistik',
  'banding', 'perbandingan', 'compare', 'evaluasi',
  'rekomendasi', 'review', 'periksa', 'cek', 'validasi',
  'hitung', 'kalkulasi', 'rumus', 'perhitungan',
  'troubleshoot', 'error', 'debug', 'bug', 'masalah teknis',
  'generate', 'buatkan', 'tuliskan', 'jelaskan detail',
];

const SEDERHANA_KEYWORDS = [
  'halo', 'hai', 'hi', 'help', 'bantuan', 'panduan',
  'menu', 'halaman', 'lokasi', 'dimana', 'cara',
  'informasi', 'apa itu', 'siapa', 'fungsi', 'kegunaan',
];

function normalizeInput(input: string): string {
  return input.trim().toLowerCase().replace(/[?.!,;:]/g, '').replace(/\s+/g, ' ');
}

export function findLocalAnswer(input: string): LocalAnswer | null {
  const normalized = normalizeInput(input);

  for (const [key, keywords] of Object.entries(KEYWORD_MAP)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        return LOCAL_KB[key] || null;
      }
    }
  }

  return null;
}

export function classifyComplexity(input: string): Complexity {
  const normalized = normalizeInput(input);
  const words = normalized.split(/\s+/);

  let complexScore = 0;
  let simpleScore = 0;

  for (const keyword of COMPLEX_KEYWORDS) {
    if (normalized.includes(keyword)) {
      complexScore += 2;
    }
  }

  for (const keyword of SEDERHANA_KEYWORDS) {
    if (normalized.includes(keyword)) {
      simpleScore += 1;
    }
  }

  if (words.length > 20) {
    complexScore += 1;
  }

  if (complexScore >= 2) return 'kompleks';
  if (simpleScore >= 1 && complexScore === 0) return 'sederhana';
  return 'sedang';
}

export function getTemplateFallback(input: string): string | null {
  const normalized = normalizeInput(input);

  if (/^(maaf|sorry|nggak|tidak|gak|bisa tolong)/.test(normalized)) {
    return null;
  }

  if (/^halo|^hai|^hi|^hey|^selamat/.test(normalized)) {
    return 'Halo! 👋 Ada yang bisa saya bantu?\n\nKetik **"bantuan"** untuk melihat yang bisa saya lakukan.';
  }

  if (/terima kasih|makasih|thanks|thank you/.test(normalized)) {
    return 'Sama-sama! 🙏 Senang bisa membantu. Jika ada pertanyaan lain, silakan tanya lagi ya.';
  }

  if (/selamat tinggal|dadah|bye|sampai jumpa/.test(normalized)) {
    return 'Sampai jumpa! 👋 Terima kasih telah menggunakan HaloAI.';
  }

  return null;
}

export function getSmartRoutingReply(
  input: string,
  complexity: Complexity,
  cachedReply: string | null,
  quotaExhausted: boolean
): { reply: string | null; source: 'local' | 'cache' | null } {
  const templateReply = getTemplateFallback(input);
  if (templateReply) {
    return { reply: templateReply, source: 'local' };
  }

  if (complexity === 'sederhana') {
    const localAnswer = findLocalAnswer(input);
    if (localAnswer) {
      return { reply: localAnswer.answer, source: 'local' };
    }
    return {
      reply: 'Silakan tanya lebih spesifik. Contoh: "Dimana halaman SPMB?", "Cara laporan bulanan", atau ketik **"bantuan"**.',
      source: 'local',
    };
  }

  if (complexity === 'sedang' && cachedReply) {
    return { reply: cachedReply, source: 'cache' };
  }

  if (quotaExhausted) {
    const localAnswer = findLocalAnswer(input);
    if (localAnswer) {
      return { reply: localAnswer.answer, source: 'local' };
    }
    return {
      reply: 'Maaf, kuota AI sedang habis. Silakan coba lagi besok atau ajukan pertanyaan yang lebih spesifik. Berikut yang bisa saya bantu:\n- Ketik **"daftar menu"** untuk navigasi\n- Ketik **"bantuan"** untuk panduan fitur\n- Atau tanyakan cara menggunakan portal',
      source: 'local',
    };
  }

  return { reply: null, source: null };
}
