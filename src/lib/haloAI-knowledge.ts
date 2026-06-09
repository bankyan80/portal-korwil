export interface LocalAnswer {
  answer: string;
  confidence: 'exact' | 'high' | 'medium';
}

export type Complexity = 'sederhana' | 'sedang' | 'kompleks';

export type QueryType = 'simple_menu' | 'internal_data' | 'general_search' | 'unknown';

const SEARCH_INTENT_KEYWORDS: string[] = [
  'berita terbaru', 'kabar terbaru', 'info terbaru', 'perkembangan terbaru', 'terkini', 'update',
  'regulasi terbaru', 'peraturan baru', 'kebijakan baru', 'undang-undang', 'permendikbud',
  'harga', 'biaya', 'tarif', 'ongkos',
  'jadwal', 'tanggal', 'deadline', 'batas waktu',
  'teknologi', 'aplikasi', 'framework', 'versi',
  'rekomendasi', 'review', 'perbandingan', 'terbaik',
  'cuaca', 'ramalan', 'prakiraan',
];

const INTERNAL_DATA_KEYWORDS: string[] = [
  'data siswa', 'data guru', 'data tendik', 'data pegawai',
  'jumlah siswa', 'jumlah guru', 'jumlah kelas', 'jumlah rombel',
  'status laporan', 'status tugas', 'verifikasi',
  'rekap laporan', 'rekap sekolah', 'laporan bulanan',
  'siapa operator', 'siapa kepala sekolah', 'profil sekolah',
  'sarpras', 'sarana prasarana',
];

const LOCAL_KB: Record<string, LocalAnswer> = {
  'cara lapor': {
    answer: 'Untuk mengisi laporan bulanan:\n\n1. Login sebagai operator sekolah\n2. Buka menu Laporan Bulanan di dashboard operator\n3. Pilih bulan dan tahun\n4. Isi data siswa, GTK, sarpras, dan absen\n5. Klik "Kirim Laporan Bulanan"\n\nStatus laporan: Belum Lapor → Sudah Dikirim → Diverifikasi\n\nLihat rekap laporan publik di [📊 Rekap Laporan](/rekap-laporan).',
    confidence: 'exact',
  },
  'laporan bulanan': {
    answer: 'Laporan bulanan bisa diakses di:\n\n[📊 Rekap Laporan](/rekap-laporan) — untuk melihat rekap semua sekolah\n\nUntuk mengisi laporan, login sebagai operator sekolah.',
    confidence: 'exact',
  },
  'cara spmb': {
    answer: 'SPMB SD (Sistem Penerimaan Murid Baru) bisa diakses di:\n\n[🎓 SPMB SD](/spmb-sd)\n\nAlur pendaftaran:\n1. [📋 Cek NIK & Usia](/spmb-sd/cek) — cek syarat usia\n2. [📝 Daftar](/spmb-sd/daftar) — isi formulir pendaftaran\n3. [📢 Pengumuman](/spmb-sd/pengumuman) — lihat hasil seleksi\n4. [✅ Daftar Ulang](/spmb-sd/daftar-ulang) — konfirmasi bagi yang diterima',
    confidence: 'exact',
  },
  'cara tka': {
    answer: 'TKA SD (Test Kompetensi Akademik) bisa diakses di:\n\n[📝 TKA SD](/tka-sd)\n\nHalaman ini berisi informasi test kompetensi akademik SD.',
    confidence: 'exact',
  },
  'cara upload': {
    answer: 'Upload dokumen bisa dilakukan di:\n\n[📁 Dokumen Bersama](/dokumen-bersama) — upload & unduh dokumen publik\n\nKlik "Tambah Dokumen", pilih file (PDF, Word, Excel, JPG, PNG, WEBP, maks 10MB), isi keterangan, lalu klik "Upload".',
    confidence: 'exact',
  },
  'cara cetak': {
    answer: 'Untuk mencetak:\n\n1. Buka halaman yang ingin dicetak\n2. Klik tombol "Cetak" atau gunakan Ctrl+P (Windows) / Cmd+P (Mac)\n3. Pilih printer\n4. Klik "Print"',
    confidence: 'exact',
  },
  'cara export': {
    answer: 'Export data tersedia di:\n\n- [📊 Rekap Laporan](/rekap-laporan) — Export Excel, PDF, Print\n\nKlik tombol export yang tersedia di halaman tersebut.',
    confidence: 'exact',
  },
  'rekap sekolah': {
    answer: 'Data sekolah bisa dilihat di:\n\n[🏫 Data Sekolah](/data-sekolah) — daftar lengkap sekolah\n[📊 Rekap Laporan](/rekap-laporan) — rekap data sekolah',
    confidence: 'exact',
  },
  'cara login': {
    answer: 'Untuk login ke portal:\n\n1. Klik tombol [🔐 Login](/login) di header\n2. Masukkan email dan password\n3. Klik "Masuk"\n\nJika belum punya akun, hubungi admin untuk dibuatkan akun operator.',
    confidence: 'exact',
  },
  'cara tambah siswa': {
    answer: 'Untuk menambah data siswa, login sebagai operator sekolah.\n\nData siswa publik bisa dilihat di [🏫 Data Sekolah](/data-sekolah).',
    confidence: 'exact',
  },
  'cara tambah guru': {
    answer: 'Untuk menambah data guru, login sebagai operator sekolah.\n\nData guru publik bisa dilihat di [🗺️ Mapping Pegawai](/mapping-pegawai).',
    confidence: 'exact',
  },
  'sarpras': {
    answer: 'Data sarana prasarana sekolah bisa dikelola oleh operator sekolah.\n\nMencakup: ruang kelas, perpustakaan, UKS, toilet, mushola, gudang, tanah, dan perkakas.',
    confidence: 'exact',
  },
  'kip sd': {
    answer: 'KIP SD (Kartu Indonesia Pintar) bisa diakses di:\n\n[💳 KIP SD](/kip-sd)\n\nHalaman ini berisi data penerima KIP SD di Kecamatan Lemahabang.',
    confidence: 'exact',
  },
  'yatim piatu': {
    answer: 'Data yatim piatu bisa diakses di:\n\n[🤝 Yatim Piatu](/yatim-piatu) — halaman publik\n\nUntuk operator: [📝 Kelola Yatim Piatu](/admin/operator/yatim-piatu) (login sebagai operator sekolah).',
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
    answer: 'Data sekolah bisa dilihat di:\n\n[🏫 Data Sekolah](/data-sekolah) — daftar lengkap sekolah & profil\n[🏫 Profil](/profil) — profil korwil',
    confidence: 'exact',
  },
  'dashboard operator': {
    answer: 'Dashboard operator digunakan oleh operator sekolah yang sudah login.\n\nUntuk publik, lihat [📊 Rekap Laporan](/rekap-laporan) atau [🏫 Data Sekolah](/data-sekolah).',
    confidence: 'exact',
  },
  'dashboard admin': {
    answer: 'Dashboard admin digunakan oleh admin yang sudah login.\n\nUntuk publik, lihat [📊 Rekap Laporan](/rekap-laporan) atau [🏫 Data Sekolah](/data-sekolah).',
    confidence: 'exact',
  },
  'super admin': {
    answer: 'Super admin adalah pengelola utama portal.\n\nUntuk publik, lihat [📊 Rekap Laporan](/rekap-laporan) atau [🏫 Data Sekolah](/data-sekolah).',
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
    answer: 'Berikut menu publik Portal Pendidikan Kecamatan Lemahabang:\n\n[🏠 Beranda](/) | [🏫 Profil](/profil) | [🎓 SPMB SD](/spmb-sd) | [📝 TKA SD](/tka-sd) | [📅 Agenda](/agenda-kegiatan) | [📂 Administrasi](/administrasi) | [🗺️ Mapping Pegawai](/mapping-pegawai) | [📊 Rekap Laporan](/rekap-laporan) | [🏫 Data Sekolah](/data-sekolah) | [💳 KIP SD](/kip-sd) | [🤝 Yatim Piatu](/yatim-piatu) | [💰 BOS ARKAS](/bos-arkas) | [📁 Dokumen Bersama](/dokumen-bersama) | [📰 Berita](/berita) | [🖼️ Galeri](/galeri)\n\nUntuk menu operator/admin, login terlebih dahulu.',
    confidence: 'exact',
  },
  'lokasi halaman': {
    answer: 'Tentukan halaman yang ingin Anda cari. Contoh:\n- "Dimana halaman SPMB?" → 🎓 [SPMB SD](/spmb-sd)\n- "Cari menu laporan" → [📊 Rekap Laporan](/rekap-laporan)\n- "Halaman data sekolah" → [🏫 Data Sekolah](/data-sekolah)\n\nAtau ketik **"daftar menu"** untuk melihat semua menu.',
    confidence: 'exact',
  },
  'data siswa': {
    answer: 'Data siswa bisa dilihat di:\n\n- [🏫 Data Sekolah](/data-sekolah) — lihat data per sekolah\n- [📊 Rekap Laporan](/rekap-laporan) — rekap jumlah siswa\n\nUntuk mengelola data siswa, login sebagai operator sekolah.',
    confidence: 'exact',
  },
  'data guru': {
    answer: 'Data guru & tendik bisa dilihat di:\n\n- [🗺️ Mapping Pegawai](/mapping-pegawai) — pemetaan pegawai\n- [📊 Rekap Laporan](/rekap-laporan) — rekap jumlah guru\n\nUntuk mengelola data guru, login sebagai operator sekolah.',
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
    confidence: 'exact',
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
    answer: 'Data Dapodik bisa diakses di:\n\n[💾 Dapodik](/master-data?tab=dapodik)\n\nHalaman ini berisi data pokok pendidikan yang terintegrasi dengan Dapodik.',
    confidence: 'exact',
  },
  'data paud': {
    answer: 'Data PAUD bisa diakses di:\n\n[👶 Data PAUD](/master-data?tab=kb)\n\nHalaman ini berisi data Pendidikan Anak Usia Dini di Kecamatan Lemahabang.',
    confidence: 'exact',
  },
  'data rombel': {
    answer: 'Data rombongan belajar (rombel) bisa diakses di:\n\n[👥 Data Rombel](/master-data?tab=rombel)\n\nHalaman ini berisi data rombongan belajar setiap sekolah.',
    confidence: 'exact',
  },
  'data gtk': {
    answer: 'SIMPEG (Sistem Informasi Manajemen Pegawai) bisa diakses di:\n\n[👨‍🏫 SIMPEG](/simpeg)\n\nBerisi data pegawai SD, TK, dan KB Kecamatan Lemahabang.',
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

export function classifyQueryType(input: string): QueryType {
  const normalized = normalizeInput(input);
  const localAnswer = findLocalAnswer(input);

  if (localAnswer) return 'simple_menu';

  const searchScore = SEARCH_INTENT_KEYWORDS.filter(k => normalized.includes(k)).length;
  const internalScore = INTERNAL_DATA_KEYWORDS.filter(k => normalized.includes(k)).length;

  if (internalScore > 0 && searchScore === 0) return 'internal_data';
  if (searchScore > 0 && internalScore === 0) return 'general_search';
  if (searchScore > 0 && internalScore > 0) {
    if (searchScore >= internalScore) return 'general_search';
    return 'internal_data';
  }

  const sederhanaScore = SEDERHANA_KEYWORDS.filter(k => normalized.includes(k)).length;
  if (sederhanaScore > 0) return 'simple_menu';

  return 'unknown';
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

export function hasSearchIntent(input: string): boolean {
  const normalized = input.toLowerCase().trim();

  const patterns = [
    /\b(berita terbaru|kabar terbaru|info terbaru|perkembangan terbaru|terkini|update|breaking news)\b/i,
    /\b(regulasi terbaru|peraturan baru|kebijakan baru|undang-undang|permendikbud|permen (dikbud|panrb)|pp \d+|uu \d+)\b/i,
    /\b(harga|biaya|tarif|ongkos|berapa (biaya|harga))\b/i,
    /\b(jadwal|tanggal (pelaksanaan|pendaftaran|dimulai)|waktu (pelaksanaan|dimulai)|deadline|batas waktu)\b/i,
    /\b(kapan|dimana (lokasi|tempat))\b.*\b(dilaksanakan|diadakan|berlangsung|terbaru)\b/i,
    /\b(teknologi|aplikasi|software|framework|library|versi terbaru)\b.*\b(terbaru|rilis|update)\b/i,
    /\b(error|bug|troubleshoot|cara memperbaiki|gagal|tidak bisa|masalah)\b.*\b(npm|react|nextjs|node|javascript|typescript|library|dependensi)\b/i,
    /\b(rekomendasi|review|perbandingan|terbaik|rekomended)\b.*\b(aplikasi|website|sekolah|pendidikan|laptop|hp|guru|belajar)\b/i,
    /\b(cara (daftar|membuat|install|download|menggunakan|belajar))\b.*\b(aplikasi|website|software|platform|tools)\b/i,
    /\b(cuaca|ramalan|prakiraan)\b/i,
  ];

  return patterns.some(p => p.test(normalized));
}
