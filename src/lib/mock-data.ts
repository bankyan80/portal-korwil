// ============================================================
// Portal Pendidikan Kecamatan Lemahabang - Mock Data
// ============================================================
// Comprehensive mock data used when Firebase is not configured.
// All text is in Indonesian (Bahasa Indonesia) to match the
// government education portal context.
// ============================================================

import type {
  MenuItem,
  Announcement,
  GalleryItem,
  Organization,
  InstitutionLink,
  HeroData,
  FooterData,
  UserProfile,
  BosSchoolData,
  KipSdData,
  YatimPiatuData,
} from '@/types';

// ---------------------------------------------------------------------------
// Menu Items – 16 items matching the kecamatan education services
// ---------------------------------------------------------------------------
export const mockMenus: MenuItem[] = [
  {
    id: 'menu-1',
    title: 'Data SD',
    icon: 'School',
    url: '/data-sd',
    active: true,
    order: 1,
    category: 'Data',
  },
  {
    id: 'menu-2',
    title: 'Data TK',
    icon: 'Baby',
    url: '/data-tk',
    active: true,
    order: 2,
    category: 'Data',
  },
  {
    id: 'menu-3',
    title: 'Data KB',
    icon: 'GraduationCap',
    url: '/data-paud',
    active: true,
    order: 3,
    category: 'Data',
  },
  {
    id: 'menu-4',
    title: 'Data GTK',
    icon: 'Users',
    url: '/data-gtk',
    active: true,
    order: 4,
    category: 'Data',
  },
  {
    id: 'menu-5',
    title: 'Data PD',
    icon: 'BookOpen',
    url: '/data-pd',
    active: true,
    order: 5,
    category: 'Data',
  },
  {
    id: 'menu-6',
    title: 'Data Rombel',
    icon: 'Users',
    url: '/data-rombel',
    active: true,
    order: 6,
    category: 'Data',
  },
  {
    id: 'menu-7',
    title: 'Laporan Bulanan',
    icon: 'BarChart3',
    url: '/rekap-laporan',
    active: true,
    order: 7,
    category: 'Laporan',
  },
  {
    id: 'menu-8',
    title: 'Dapodik',
    icon: 'Database',
    url: '/dapodik',
    active: true,
    order: 8,
    category: 'Data',
  },
  {
    id: 'menu-9',
    title: 'SPMB SD',
    icon: 'FileText',
    url: '/spmb-sd',
    active: true,
    order: 9,
    category: 'Pendaftaran',
  },
  {
    id: 'menu-10',
    title: 'KIP SD',
    icon: 'WalletMinimal',
    url: '/kip-sd',
    active: true,
    order: 10,
    category: 'Pendaftaran',
  },
  {
    id: 'menu-11',
    title: 'Yatim Piatu',
    icon: 'Heart',
    url: '/yatim-piatu',
    active: true,
    order: 11,
    category: 'Pendaftaran',
  },
  {
    id: 'menu-12',
    title: 'BOS / ARKAS',
    icon: 'WalletMinimal',
    url: '/bos-arkas',
    active: true,
    order: 12,
    category: 'Keuangan',
  },
  {
    id: 'menu-13',
    title: 'Ruang Guru',
    icon: 'Monitor',
    url: '/ruang-guru',
    active: true,
    order: 13,
    category: 'Program',
  },
  {
    id: 'menu-14',
    title: 'e-Kinerja',
    icon: 'Target',
    url: '/e-kinerja',
    active: true,
    order: 14,
    category: 'Evaluasi',
  },
  {
    id: 'menu-15',
    title: 'Dokumen Bersama',
    icon: 'FolderOpen',
    url: '/dokumen-bersama',
    active: true,
    order: 15,
    category: 'Dokumen',
  },
  {
    id: 'menu-16',
    title: 'Agenda Kegiatan',
    icon: 'CalendarDays',
    url: '/agenda-kegiatan',
    active: true,
    order: 16,
    category: 'Informasi',
  },
  {
    id: 'menu-17',
    title: 'Batas Usia Pensiun',
    icon: 'Clock',
    url: '/bup',
    active: true,
    order: 17,
    category: 'Kepegawaian',
  },
  {
    id: 'menu-18',
    title: 'Donasi',
    icon: 'HeartHandshake',
    url: '/donasi',
    active: true,
    order: 18,
    category: 'Informasi',
  },
];

// ---------------------------------------------------------------------------
// Announcements – 5 education-related items in Indonesian
// ---------------------------------------------------------------------------
export const mockAnnouncements: Announcement[] = [
  {
    id: 'announce-1',
    title: 'Pendaftaran Peserta Didik Baru (PPDB) Tahun Ajaran 2025/2026',
    content:
      'Diberitahukan kepada seluruh masyarakat Kecamatan Lemahabang bahwa pendaftaran peserta didik baru untuk jenjang SD dan TK akan dibuka pada tanggal 1 Juni 2025. Persyaratan dan alur pendaftaran dapat dilihat di masing-masing sekolah atau melalui portal ini. Diharapkan para orang tua/wali mempersiapkan dokumen yang diperlukan.',
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 hari lalu
    pinned: true,
    author: 'Admin Kecamatan',
  },
  {
    id: 'announce-2',
    title: 'Rapat Koordinasi K3S Kecamatan Lemahabang',
    content:
      'Rapat koordinasi K3S Kecamatan Lemahabang akan dilaksanakan pada hari Jumat, 20 Juni 2025 pukul 09.00 WIB di Aula Kecamatan Lemahabang. Agenda rapat meliputi evaluasi semester genap tahun ajaran 2024/2025 dan persiapan kegiatan semester ganjil tahun ajaran 2025/2026. Seluruh kepala sekolah wajib hadir.',
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 hari lalu
    pinned: true,
    author: 'Ketua K3S',
  },
  {
    id: 'announce-3',
    title: 'Pelatihan Kurikulum Merdeka untuk Guru SD',
    content:
      'Dinas Pendidikan Kabupaten Karawang akan menyelenggarakan pelatihan implementasi Kurikulum Merdeka bagi guru SD se-Kecamatan Lemahabang. Pelatihan akan berlangsung selama 3 hari pada tanggal 25-27 Juni 2025. Pendaftaran dibuka hingga 20 Juni 2025 melalui operator sekolah masing-masing.',
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 hari lalu
    pinned: false,
    author: 'Admin Kecamatan',
  },
  {
    id: 'announce-4',
    title: 'Pencairan Dana BOS Triwulan II Tahun 2025',
    content:
      'Berdasarkan surat edaran Dinas Pendidikan, pencairan dana BOS Triwulan II tahun 2025 telah diproses. Kepala sekolah dimohon segera menyelesaikan administrasi pencairan melalui sistem ARKAS. Batas waktu penyelesaian administrasi adalah 30 Juni 2025.',
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 hari lalu
    pinned: false,
    author: 'Tim Keuangan Kecamatan',
  },
  {
    id: 'announce-5',
    title: 'Lomba Pendidikan Tingkat Kecamatan dalam Rangka HUT RI ke-80',
    content:
      'Dalam rangka memperingati Hari Kemerdekaan Republik Indonesia ke-80, Kecamatan Lemahabang akan mengadakan lomba pendidikan tingkat kecamatan yang meliputi: lomba cerdas cermat, lomba membaca puisi, dan lomba menggambar. Pelaksanaan pada bulan Agustus 2025. Info selengkapnya menghubungi panitia di masing-masing sekolah.',
    createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000, // 14 hari lalu
    pinned: false,
    author: 'Panitia HUT RI',
  },
];

// ---------------------------------------------------------------------------
// Gallery Items – 6 items with placeholder images
// ---------------------------------------------------------------------------
export const mockGalleryItems: GalleryItem[] = [
  {
    id: 'gallery-1',
    title: 'Upacara Hari Pendidikan Nasional 2025',
    description:
      'Upacara peringatan Hardiknas 2025 yang diikuti oleh seluruh siswa, guru, dan tenaga kependidikan se-Kecamatan Lemahabang di Lapangan Kecamatan.',
    images: [
      'https://placehold.co/600x400/1e40af/white?text=Hardiknas+2025',
      'https://placehold.co/600x400/1e3a8a/white?text=Upacara+Hardiknas',
      'https://placehold.co/600x400/2563eb/white?text=Peserta+Hardiknas',
    ],
    category: 'K3S',
    authorName: 'Ahmad Fauzi',
    authorRole: 'Kepala SDN 1 Lemahabang',
    status: 'published',
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'gallery-2',
    title: 'Kegiatan Belajar di TK Pertiwi Lemahabang',
    description:
      'Kegiatan pembelajaran berbasis bermain dan aktivitas kreatif untuk anak-anak TK yang bertujuan mengembangkan motorik halus dan kreativitas.',
    images: [
      'https://placehold.co/600x400/059669/white?text=Kegiatan+TK',
      'https://placehold.co/600x400/047857/white?text=Belajar+Bermain',
    ],
    category: 'TK',
    authorName: 'Siti Nurhaliza',
    authorRole: 'Kepala TK Pertiwi',
    status: 'published',
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'gallery-3',
    title: 'Rapat Kerja HIMPAUDI Kecamatan Lemahabang',
    description:
      'Rapat kerja tahunan HIMPAUDI yang membahas program kerja dan rencana kegiatan peningkatan mutu pendidikan anak usia dini.',
    images: [
      'https://placehold.co/600x400/b91c1c/white?text=Rapat+HIMPAUDI',
      'https://placehold.co/600x400/dc2626/white?text=Pembahasan+Program',
      'https://placehold.co/600x400/ef4444/white?text=Suasana+Rapat',
    ],
    category: 'HIMPAUDI',
    authorName: 'Dewi Kartika',
    authorRole: 'Ketua HIMPAUDI',
    status: 'published',
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'gallery-4',
    title: 'Workshop Dapodik untuk Operator Sekolah',
    description:
      'Pelatihan pengisian dan verifikasi data Dapodik untuk seluruh operator sekolah SD dan TK se-Kecamatan Lemahabang.',
    images: [
      'https://placehold.co/600x400/7c3aed/white?text=Workshop+Dapodik',
      'https://placehold.co/600x400/6d28d9/white?text=Sesi+Pelatihan',
    ],
    category: 'Forum Operator',
    authorName: 'Budi Santoso',
    authorRole: 'Koordinator Operator',
    status: 'published',
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'gallery-5',
    title: 'Gerak Jalan Santai PGRI Kecamatan',
    description:
      'Kegiatan jalan santai dalam rangka peringatan Hari Guru Nasional dan HUT PGRI ke-79 yang diikuti oleh seluruh anggota PGRI.',
    images: [
      'https://placehold.co/600x400/ea580c/white?text=Jalan+Santai+PGRI',
      'https://placehold.co/600x400/c2410c/white?text=Hadiah+Undian',
      'https://placehold.co/600x400/f97316/white?text=Peserta+PGRI',
      'https://placehold.co/600x400/fdba74/333?text=Finish+Line',
    ],
    category: 'PGRI',
    authorName: 'Hendra Wijaya',
    authorRole: 'Ketua PGRI Kecamatan',
    status: 'published',
    createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'gallery-6',
    title: 'Kegiatan Pembelajaran PAUD Melati',
    description:
      'Sesi pembelajaran outdoor di PAUD Melati Lemahabang dengan tema mengenal alam dan lingkungan sekitar.',
    images: [
      'https://placehold.co/600x400/0d9488/white?text=PAUD+Melati',
      'https://placehold.co/600x400/0f766e/white?text=Outdoor+Learning',
    ],
    category: 'PAUD',
    authorName: 'Rina Marlina',
    authorRole: 'Guru PAUD Melati',
    status: 'published',
    createdAt: Date.now() - 25 * 24 * 60 * 60 * 1000,
  },
];

// ---------------------------------------------------------------------------
// Organizations – 8 kecamatan education organisations
// ---------------------------------------------------------------------------
export const mockOrganizations: Organization[] = [
  {
    id: 'org-1',
    name: 'K3S (Kelompok Kerja Kepala Sekolah)',
    logo: '/K3S.png',
    leader: 'H. Ahmad Fauzi, S.Pd.',
    contact: '0812-3456-7890',
    active: true,
    description: 'K3S (Kelompok Kerja Kepala Sekolah) adalah forum komunikasi dan koordinasi para kepala sekolah dasar di Kecamatan Lemahabang yang bertujuan meningkatkan mutu pendidikan melalui kolaborasi dan berbagi praktik baik.',
    vision: 'Menjadi wadah kolaborasi kepala sekolah yang profesional, inovatif, dan berorientasi pada peningkatan mutu pendidikan.',
    mission: [
      'Meningkatkan kompetensi kepala sekolah melalui kegiatan pelatihan dan pendampingan',
      'Memfasilitasi pertukaran informasi dan pengalaman antar kepala sekolah',
      'Mengembangkan program-program inovatif dalam pengelolaan sekolah',
      'Bersinergi dengan Dinas Pendidikan dalam implementasi kebijakan pendidikan',
    ],
    board: [
      { jabatan: 'Ketua', nama: 'H. Ahmad Fauzi, S.Pd.' },
      { jabatan: 'Wakil Ketua', nama: 'Drs. H. Nana Suryana, M.Pd.' },
      { jabatan: 'Sekretaris', nama: 'Asep Ruhimat, S.Pd.' },
      { jabatan: 'Wakil Sekretaris', nama: 'Yanti Mulyanti, S.Pd.' },
      { jabatan: 'Bendahara', nama: 'Dedeh Kurniasih, S.Pd.' },
      { jabatan: 'Seksi Kurikulum', nama: 'Dra. Hj. Een Nurhasanah' },
      { jabatan: 'Seksi Kesiswaan', nama: 'Maman Suherman, S.Pd.' },
      { jabatan: 'Seksi Sarana Prasarana', nama: 'Wawan Gunawan, S.Pd.' },
      { jabatan: 'Seksi Humas', nama: 'Ade Supriyatna, S.Pd.' },
    ],
  },
  {
    id: 'org-2',
    name: 'IGTKI (Ikatan Guru Taman Kanak-kanak Indonesia)',
    logo: 'https://ui-avatars.com/api/?name=IGTKI&background=059669&color=fff&size=80&bold=true',
    leader: 'Siti Nurhaliza, S.Pd.',
    contact: '0813-4567-8901',
    active: true,
    description: 'IGTKI (Ikatan Guru Taman Kanak-kanak Indonesia) Kecamatan Lemahabang adalah organisasi profesi yang mewadahi guru-guru TK dalam mengembangkan kompetensi dan profesionalisme.',
    vision: 'Terwujudnya guru TK yang profesional, kreatif, dan berdedikasi dalam membentuk generasi emas sejak usia dini.',
    mission: [
      'Meningkatkan kualitas pembelajaran melalui pengembangan kurikulum yang relevan',
      'Menyelenggarakan pelatihan dan workshop bagi guru TK',
      'Membangun jaringan kerjasama dengan berbagai pemangku kepentingan pendidikan anak usia dini',
      'Mengadvokasi kesejahteraan dan perlindungan profesi guru TK',
    ],
    board: [
      { jabatan: 'Ketua', nama: 'Siti Nurhaliza, S.Pd.' },
      { jabatan: 'Wakil Ketua', nama: 'Tuti Handayani, S.Pd.AUD.' },
      { jabatan: 'Sekretaris', nama: 'Ai Siti Jubaedah, S.Pd.' },
      { jabatan: 'Bendahara', nama: 'Lilis Suryani, S.Pd.' },
      { jabatan: 'Seksi Pembelajaran', nama: 'Popon Puspita, S.Pd.' },
    ],
  },
  {
    id: 'org-3',
    name: 'HIMPAUDI (Himpunan Pendidik dan Tenaga Kependidikan Anak Usia Dini Indonesia)',
    logo: 'https://ui-avatars.com/api/?name=HIMPAUDI&background=dc2626&color=fff&size=80&bold=true',
    leader: 'Dewi Kartika, A.Ma.',
    contact: '0814-5678-9012',
    active: true,
    description: 'HIMPAUDI (Himpunan Pendidik dan Tenaga Kependidikan Anak Usia Dini Indonesia) Kecamatan Lemahabang adalah organisasi profesi yang mewadahi pendidik PAUD dalam mengembangkan kompetensi dan kualitas pembelajaran anak usia dini.',
    vision: 'Terwujudnya pendidik PAUD yang profesional, kreatif, dan inovatif dalam mendidik anak usia dini.',
    mission: [
      'Meningkatkan kompetensi pendidik PAUD melalui pelatihan dan pendampingan',
      'Mengembangkan model-model pembelajaran PAUD yang inovatif',
      'Memfasilitasi kerjasama antar lembaga PAUD',
      'Mengadvokasi kebijakan yang mendukung pengembangan PAUD',
    ],
    board: [
      { jabatan: 'Ketua', nama: 'Dewi Kartika, A.Ma.' },
      { jabatan: 'Wakil Ketua', nama: 'Rina Marlina, S.Pd.' },
      { jabatan: 'Sekretaris', nama: 'Hj. Ani Sumarni, S.Pd.AUD.' },
      { jabatan: 'Bendahara', nama: 'Euis Sartika, A.Ma.' },
    ],
  },
  {
    id: 'org-4',
    name: 'PGRI (Persatuan Guru Republik Indonesia)',
    logo: 'https://ui-avatars.com/api/?name=PGRI&background=ea580c&color=fff&size=80&bold=true',
    leader: 'Hendra Wijaya, M.Pd.',
    contact: '0815-6789-0123',
    active: true,
    description: 'PGRI (Persatuan Guru Republik Indonesia) Kecamatan Lemahabang adalah organisasi profesi yang mewadahi seluruh guru di Kecamatan Lemahabang dalam memperjuangkan kesejahteraan dan pengembangan profesi.',
    vision: 'Terwujudnya guru Indonesia yang profesional, sejahtera, dan bermartabat.',
    mission: [
      'Memperjuangkan kesejahteraan dan hak-hak guru',
      'Meningkatkan profesionalisme dan kompetensi guru',
      'Memfasilitasi kegiatan pengembangan profesi berkelanjutan',
      'Menjalin kerjasama dengan berbagai pihak untuk kemajuan pendidikan',
    ],
    board: [
      { jabatan: 'Ketua', nama: 'Hendra Wijaya, M.Pd.' },
      { jabatan: 'Wakil Ketua', nama: 'Drs. H. Cecep Suryana' },
      { jabatan: 'Sekretaris', nama: 'Ade Komarudin, S.Pd.' },
      { jabatan: 'Bendahara', nama: 'Neneng Hasanah, S.Pd.' },
    ],
  },
  {
    id: 'org-5',
    name: 'FKKG (Forum Kelompok Kerja Guru)',
    logo: 'https://ui-avatars.com/api/?name=FKKG&background=7c3aed&color=fff&size=80&bold=true',
    leader: 'Rudi Hermawan, S.Pd.',
    contact: '0816-7890-1234',
    active: true,
    description: 'FKKG (Forum Kelompok Kerja Guru) Kecamatan Lemahabang adalah forum komunikasi dan pengembangan kompetensi bagi guru-guru di Kecamatan Lemahabang.',
    vision: 'Terwujudnya guru yang profesional, kreatif, dan inovatif dalam meningkatkan mutu pendidikan.',
    mission: [
      'Meningkatkan kompetensi pedagogik dan profesional guru melalui KKG',
      'Memfasilitasi pertukaran pengalaman dan praktik baik pembelajaran',
      'Mengembangkan perangkat pembelajaran yang kontekstual dan inovatif',
      'Mendukung program pemerintah dalam peningkatan mutu pendidikan',
    ],
    board: [
      { jabatan: 'Ketua', nama: 'Rudi Hermawan, S.Pd.' },
      { jabatan: 'Wakil Ketua', nama: 'Asep Saepudin, S.Pd.' },
      { jabatan: 'Sekretaris', nama: 'Dede Mulyadi, S.Pd.' },
      { jabatan: 'Bendahara', nama: 'Yanti Susilawati, S.Pd.' },
    ],
  },
  {
    id: 'org-6',
    name: 'FKKG PAI (Forum Kelompok Kerja Guru Pendidikan Agama Islam)',
    logo: 'https://ui-avatars.com/api/?name=FKKG+PAI&background=0d9488&color=fff&size=80&bold=true',
    leader: 'Ustadz Hasan Basri, S.Ag.',
    contact: '0817-8901-2345',
    active: true,
    description: 'FKKG PAI (Forum Kelompok Kerja Guru Pendidikan Agama Islam) Kecamatan Lemahabang adalah forum pengembangan kompetensi bagi guru Pendidikan Agama Islam di tingkat SD dan TK.',
    vision: 'Terwujudnya guru PAI yang berakhlak mulia, profesional, dan mampu membentuk karakter Islami pada peserta didik.',
    mission: [
      'Meningkatkan kompetensi guru PAI dalam pembelajaran agama Islam',
      'Mengembangkan metode pembelajaran PAI yang kreatif dan menyenangkan',
      'Memperkuat nilai-nilai keislaman dalam budaya sekolah',
      'Memfasilitasi kerjasama antar guru PAI se-Kecamatan Lemahabang',
    ],
    board: [
      { jabatan: 'Ketua', nama: 'Ustadz Hasan Basri, S.Ag.' },
      { jabatan: 'Wakil Ketua', nama: 'Drs. H. Ahmad Fauzi' },
      { jabatan: 'Sekretaris', nama: 'Hj. Siti Maemunah, S.Ag.' },
      { jabatan: 'Bendahara', nama: 'Ustadzah Euis Nurhayati, S.Pd.I.' },
    ],
  },
  {
    id: 'org-7',
    name: 'FKKGO (Forum Kelompok Kerja Guru Olahraga)',
    logo: 'https://ui-avatars.com/api/?name=FKKGO&background=1d4ed8&color=fff&size=80&bold=true',
    leader: 'Agus Prasetyo, S.Pd.',
    contact: '0818-9012-3456',
    active: true,
    description: 'FKKGO (Forum Kelompok Kerja Guru Olahraga) Kecamatan Lemahabang adalah forum pengembangan kompetensi bagi guru Pendidikan Jasmani, Olahraga, dan Kesehatan.',
    vision: 'Terwujudnya guru olahraga yang profesional dalam mengembangkan potensi fisik dan karakter siswa melalui pendidikan jasmani.',
    mission: [
      'Meningkatkan kompetensi guru PJOK dalam pembelajaran olahraga',
      'Mengembangkan model pembelajaran PJOK yang inovatif dan menyenangkan',
      'Membina bakat dan minat olahraga siswa',
      'Memfasilitasi kegiatan olahraga antar sekolah',
    ],
    board: [
      { jabatan: 'Ketua', nama: 'Agus Prasetyo, S.Pd.' },
      { jabatan: 'Wakil Ketua', nama: 'Dede Kusnadi, S.Pd.' },
      { jabatan: 'Sekretaris', nama: 'Gilang Permana, S.Pd.' },
      { jabatan: 'Bendahara', nama: 'Rina Kurniawati, S.Pd.' },
    ],
  },
  {
    id: 'org-8',
    name: 'Forum Operator Sekolah',
    logo: 'https://ui-avatars.com/api/?name=Forum+OP&background=475569&color=fff&size=80&bold=true',
    leader: 'Budi Santoso, S.Kom.',
    contact: '0819-0123-4567',
    active: true,
    description: 'Forum Operator Sekolah Kecamatan Lemahabang adalah wadah komunikasi dan pengembangan kompetensi bagi operator sekolah dalam pengelolaan data dan sistem informasi pendidikan.',
    vision: 'Terwujudnya operator sekolah yang profesional, handal, dan mampu mendukung tertib administrasi serta data pendidikan yang akurat.',
    mission: [
      'Meningkatkan kompetensi operator sekolah dalam pengelolaan data pokok pendidikan',
      'Memfasilitasi koordinasi antara operator sekolah dengan dinas pendidikan',
      'Mengoptimalkan penggunaan sistem informasi pendidikan',
      'Mendukung akurasi dan ketepatan waktu pelaporan data sekolah',
    ],
    board: [
      { jabatan: 'Ketua', nama: 'Budi Santoso, S.Kom.' },
      { jabatan: 'Wakil Ketua', nama: 'Agus Hermawan, S.Kom.' },
      { jabatan: 'Sekretaris', nama: 'Iis Ismayanti, S.Pd.' },
      { jabatan: 'Bendahara', nama: 'Tatang Suherman' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Institution Links – 7 external education-related links
// ---------------------------------------------------------------------------
export const mockInstitutionLinks: InstitutionLink[] = [
  {
    id: 'link-1',
    name: 'Kementerian Pendidikan dan Kebudayaan',
    logo: 'https://ui-avatars.com/api/?name=Kemdikbud&background=2563eb&color=fff&size=48&bold=true',
    url: 'https://www.kemdikbud.go.id',
    active: true,
    order: 1,
  },
  {
    id: 'link-2',
    name: 'Dinas Pendidikan Kabupaten Cirebon',
    logo: 'https://ui-avatars.com/api/?name=Disdik&background=059669&color=fff&size=48&bold=true',
    url: 'https://disdik.cirebonkab.go.id',
    active: true,
    order: 2,
  },
  {
    id: 'link-3',
    name: 'Dapodik (Data Pokok Pendidikan)',
    logo: 'https://ui-avatars.com/api/?name=Dapodik&background=ea580c&color=fff&size=48&bold=true',
    url: 'https://dapodik.kemdikbud.go.id',
    active: true,
    order: 3,
  },
  {
    id: 'link-4',
    name: 'Verval PD (Pendidikan)',
    logo: 'https://ui-avatars.com/api/?name=VerPD&background=0d9488&color=fff&size=48&bold=true',
    url: 'https://vervalpd.data.kemdikbud.go.id',
    active: true,
    order: 4,
  },
  {
    id: 'link-5',
    name: 'PMM (Platform Merdeka Mengajar)',
    logo: 'https://ui-avatars.com/api/?name=PMM&background=7c3aed&color=fff&size=48&bold=true',
    url: 'https://www.merdekabelajar.kemdikbud.go.id',
    active: true,
    order: 5,
  },
  {
    id: 'link-6',
    name: 'ARKAS (Aplikasi Kas Online)',
    logo: 'https://ui-avatars.com/api/?name=ARKAS&background=dc2626&color=fff&size=48&bold=true',
    url: 'https://arkas.kemenkeu.go.id',
    active: true,
    order: 6,
  },
  {
    id: 'link-7',
    name: 'e-Kinerja Guru',
    logo: 'https://ui-avatars.com/api/?name=eKIN&background=1d4ed8&color=fff&size=48&bold=true',
    url: 'https://ekinerja.kemdikbud.go.id',
    active: true,
    order: 7,
  },
];

// ---------------------------------------------------------------------------
// Hero Data – Mock kecamatan leadership profile
// ---------------------------------------------------------------------------
export const mockHeroData: HeroData = {
  name: 'H. Ronianto, S.Pd., M.M.',
  title: 'Kepala Dinas Pendidikan Kabupaten Cirebon',
  greeting:
    'Selamat datang di Portal Pendidikan Kecamatan Lemahabang. Portal ini sebagai wadah informasi dan layanan pendidikan untuk seluruh stakeholder pendidikan di Kecamatan Lemahabang, Kabupaten Cirebon.',
  photoURL:
    '/kadis.png',
};

// ---------------------------------------------------------------------------
// Footer Data – Kecamatan contact information
// ---------------------------------------------------------------------------
export const mockFooterData: FooterData = {
  address:
    'Jl. MT. Haryono No. 05, Kecamatan Lemahabang, Kabupaten Cirebon, Jawa Barat 45183',
  email: 'timkerja.lemahabang@gmail.com',
  phone: '(0231) 635521',
};

// ---------------------------------------------------------------------------
// Mock Users – for development / testing
// ---------------------------------------------------------------------------
export const mockUsers: UserProfile[] = [
  {
    uid: 'mock-uid-1',
    email: 'super@lemahabang.sch.id',
    displayName: 'Super Admin Portal',
    role: 'super_admin',
    isActive: true,
    photoURL: 'https://placehold.co/40x40/1e40af/white?text=AD',
    phone: '0812-0000-0001',
    createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
  {
    uid: 'mock-uid-2',
    email: 'operator1@sdn1-lemahabang.sch.id',
    displayName: 'Budi Santoso',
    role: 'operator_sekolah',
    schoolId: 'school-1',
    schoolName: 'SDN 1 Lemahabang',
    isActive: true,
    photoURL: 'https://placehold.co/40x40/059669/white?text=BS',
    phone: '0813-0000-0002',
    createdAt: Date.now() - 180 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
  },
  {
    uid: 'mock-uid-3',
    email: 'ketua@k3s-lemahabang.sch.id',
    displayName: 'H. Ahmad Fauzi, S.Pd.',
    role: 'ketua_organisasi',
    organizationId: 'org-k3s',
    organization: 'K3S',
    isActive: true,
    photoURL: 'https://placehold.co/40x40/ea580c/white?text=AF',
    phone: '0814-0000-0003',
    createdAt: Date.now() - 200 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
  },
];

// ---------------------------------------------------------------------------
// BOS / ARKAS – Mock data monitoring validasi dana BOS
// ---------------------------------------------------------------------------
export const mockBosData: BosSchoolData[] = [
  { nama: 'SD NEGERI 1 ASEM', npsn: '20215216', status: 'NEGERI', jenjang: 'SD', desa: 'ASEM', jumlahSiswa: 186, alokasiDana: 44640000, triwulan: 2, statusValidasi: 'valid' },
  { nama: 'SD NEGERI 1 BELAWA', npsn: '20215230', status: 'NEGERI', jenjang: 'SD', desa: 'BELAWA', jumlahSiswa: 154, alokasiDana: 36960000, triwulan: 2, statusValidasi: 'valid' },
  { nama: 'SD NEGERI 2 BELAWA', npsn: '20215564', status: 'NEGERI', jenjang: 'SD', desa: 'BELAWA', jumlahSiswa: 210, alokasiDana: 50400000, triwulan: 2, statusValidasi: 'valid' },
  { nama: 'SD NEGERI 1 CIPEUJEUH KULON', npsn: '20215287', status: 'NEGERI', jenjang: 'SD', desa: 'CIPEUJEUH KULON', jumlahSiswa: 132, alokasiDana: 31680000, triwulan: 2, statusValidasi: 'tidak_valid', catatan: 'Data siswa tidak sesuai Dapodik' },
  { nama: 'SD NEGERI 2 CIPEUJEUH KULON', npsn: '20215381', status: 'NEGERI', jenjang: 'SD', desa: 'CIPEUJEUH KULON', jumlahSiswa: 98, alokasiDana: 23520000, triwulan: 2, statusValidasi: 'verifikasi', catatan: 'Menunggu validasi dokumen RKAS' },
  { nama: 'SD NEGERI 1 CIPEUJEUH WETAN', npsn: '20215286', status: 'NEGERI', jenjang: 'SD', desa: 'CIPEUJEUH WETAN', jumlahSiswa: 175, alokasiDana: 42000000, triwulan: 2, statusValidasi: 'valid' },
  { nama: 'SD NEGERI 2 CIPEUJEUH WETAN', npsn: '20215380', status: 'NEGERI', jenjang: 'SD', desa: 'CIPEUJEUH WETAN', jumlahSiswa: 201, alokasiDana: 48240000, triwulan: 2, statusValidasi: 'valid' },
  { nama: 'SD NEGERI 3 CIPEUJEUH WETAN', npsn: '20214479', status: 'NEGERI', jenjang: 'SD', desa: 'CIPEUJEUH WETAN', jumlahSiswa: 88, alokasiDana: 21120000, triwulan: 2, statusValidasi: 'tidak_valid', catatan: 'RKAS belum diunggah' },
  { nama: 'SD NEGERI 1 LEMAHABANG', npsn: '20215162', status: 'NEGERI', jenjang: 'SD', desa: 'LEMAHABANG', jumlahSiswa: 245, alokasiDana: 58800000, triwulan: 2, statusValidasi: 'valid' },
  { nama: 'SD NEGERI 2 LEMAHABANG', npsn: '20214656', status: 'NEGERI', jenjang: 'SD', desa: 'LEMAHABANG', jumlahSiswa: 267, alokasiDana: 64080000, triwulan: 2, statusValidasi: 'valid' },
  { nama: 'SD NEGERI 1 LEMAHABANG KULON', npsn: '20215161', status: 'NEGERI', jenjang: 'SD', desa: 'LEMAHABANG KULON', jumlahSiswa: 192, alokasiDana: 46080000, triwulan: 2, statusValidasi: 'verifikasi', catatan: 'Periksa silang data rombel' },
  { nama: 'SD NEGERI 1 LEUWIDINGDING', npsn: '20215164', status: 'NEGERI', jenjang: 'SD', desa: 'LEUWIDINGDING', jumlahSiswa: 143, alokasiDana: 34320000, triwulan: 2, statusValidasi: 'valid' },
  { nama: 'SD NEGERI 1 PICUNGPUGUR', npsn: '20246442', status: 'NEGERI', jenjang: 'SD', desa: 'PICUNGPUGUR', jumlahSiswa: 118, alokasiDana: 28320000, triwulan: 2, statusValidasi: 'valid' },
  { nama: 'SD NEGERI 1 SARAJAYA', npsn: '20215517', status: 'NEGERI', jenjang: 'SD', desa: 'SARAJAYA', jumlahSiswa: 107, alokasiDana: 25680000, triwulan: 2, statusValidasi: 'valid' },
  { nama: 'SD NEGERI 2 SARAJAYA', npsn: '20214726', status: 'NEGERI', jenjang: 'SD', desa: 'SARAJAYA', jumlahSiswa: 76, alokasiDana: 18240000, triwulan: 2, statusValidasi: 'tidak_valid', catatan: 'Ketidaksesuaian data siswa' },
  { nama: 'SD NEGERI 1 SIGONG', npsn: '20215506', status: 'NEGERI', jenjang: 'SD', desa: 'SIGONG', jumlahSiswa: 223, alokasiDana: 53520000, triwulan: 2, statusValidasi: 'valid' },
  { nama: 'SD NEGERI 3 SIGONG', npsn: '20214570', status: 'NEGERI', jenjang: 'SD', desa: 'SIGONG', jumlahSiswa: 95, alokasiDana: 22800000, triwulan: 2, statusValidasi: 'verifikasi', catatan: 'Dokumen belum lengkap' },
  { nama: 'SD NEGERI 4 SIGONG', npsn: '20244513', status: 'NEGERI', jenjang: 'SD', desa: 'SIGONG', jumlahSiswa: 64, alokasiDana: 15360000, triwulan: 2, statusValidasi: 'valid' },
  { nama: 'SD NEGERI 1 SINDANGLAUT', npsn: '20215464', status: 'NEGERI', jenjang: 'SD', desa: 'SINDANGLAUT', jumlahSiswa: 158, alokasiDana: 37920000, triwulan: 2, statusValidasi: 'valid' },
  { nama: 'SD NEGERI 1 TUK KARANGSUWUNG', npsn: '20246445', status: 'NEGERI', jenjang: 'SD', desa: 'TUK KARANGSUWUNG', jumlahSiswa: 89, alokasiDana: 21360000, triwulan: 2, statusValidasi: 'valid' },
  { nama: 'SD NEGERI 1 WANGKELANG', npsn: '20215584', status: 'NEGERI', jenjang: 'SD', desa: 'WANGKELANG', jumlahSiswa: 165, alokasiDana: 39600000, triwulan: 2, statusValidasi: 'valid' },
  { nama: 'SD IT AL IRSYAD AL ISLAMIYYAH', npsn: '20215221', status: 'SWASTA', jenjang: 'SD', desa: 'LEMAHABANG KULON', jumlahSiswa: 134, alokasiDana: 32160000, triwulan: 2, statusValidasi: 'valid' },
];

// ---------------------------------------------------------------------------
// KIP SD – Daftar penerima KIP
// ---------------------------------------------------------------------------
export const mockKipSd: KipSdData[] = [];

// ---------------------------------------------------------------------------
// Yatim Piatu – Daftar anak yatim/piatu/yatim piatu
// ---------------------------------------------------------------------------
export const mockYatimPiatu: YatimPiatuData[] = [];
