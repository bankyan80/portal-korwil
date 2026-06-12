// ============================================================
// Portal Pendidikan Kecamatan Lemahabang - Mock Data
// ============================================================
// DEVELOPMENT-ONLY: Synthetic data for local testing.
// Comprehensive mock data used when Firebase is not configured.
// All text is in Indonesian (Bahasa Indonesia) to match the
// government education portal context.
// ============================================================

import type {
  MenuItem,
  Announcement,
  GalleryItem,
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
    id: 'menu-pendataan-spmb',
    title: 'Pendataan SPMB',
    icon: 'GraduationCap',
    url: 'https://pendataan-spmb.vercel.app',
    active: true,
    order: 1,
    category: 'Pendaftaran',
  },
  {
    id: 'menu-simpeg',
    title: 'SIMPEG',
    icon: 'IdCard',
    url: 'https://simpeg-tim.vercel.app',
    active: true,
    order: 2,
    category: 'Kepegawaian',
  },
  {
    id: 'menu-simdawa',
    title: 'SIMDAWA',
    icon: 'Database',
    url: '/simdawa',
    active: true,
    order: 3,
    category: 'Data',
  },
  {
    id: 'menu-laporan-daftar-1',
    title: 'DAFTAR 1',
    icon: 'FileText',
    url: '/laporan-daftar-1',
    active: true,
    order: 4,
    category: 'Laporan',
  },
  {
    id: 'menu-laporan-siswa-lulus',
    title: 'Rekap Alumni (SD)',
    icon: 'GraduationCap',
    url: '/laporan-siswa-lulus',
    active: true,
    order: 5,
    category: 'Laporan',
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
];

// ---------------------------------------------------------------------------
// BOS / ARKAS – Mock data monitoring validasi dana BOS
// ---------------------------------------------------------------------------
export const mockBosData: BosSchoolData[] = [
  { id: 'bos-1', nama: 'SD NEGERI 1 ASEM', npsn: '20215216', status: 'NEGERI', jenjang: 'SD', desa: 'ASEM', jumlahSiswa: 186, alokasiDana: 44640000, triwulan: 2, statusValidasi: 'valid' },
  { id: 'bos-2', nama: 'SD NEGERI 1 BELAWA', npsn: '20215230', status: 'NEGERI', jenjang: 'SD', desa: 'BELAWA', jumlahSiswa: 154, alokasiDana: 36960000, triwulan: 2, statusValidasi: 'valid' },
  { id: 'bos-3', nama: 'SD NEGERI 2 BELAWA', npsn: '20215564', status: 'NEGERI', jenjang: 'SD', desa: 'BELAWA', jumlahSiswa: 210, alokasiDana: 50400000, triwulan: 2, statusValidasi: 'valid' },
  { id: 'bos-4', nama: 'SD NEGERI 1 CIPEUJEUH KULON', npsn: '20215287', status: 'NEGERI', jenjang: 'SD', desa: 'CIPEUJEUH KULON', jumlahSiswa: 132, alokasiDana: 31680000, triwulan: 2, statusValidasi: 'tidak_valid', catatan: 'Data siswa tidak sesuai Dapodik' },
  { id: 'bos-5', nama: 'SD NEGERI 2 CIPEUJEUH KULON', npsn: '20215381', status: 'NEGERI', jenjang: 'SD', desa: 'CIPEUJEUH KULON', jumlahSiswa: 98, alokasiDana: 23520000, triwulan: 2, statusValidasi: 'verifikasi', catatan: 'Menunggu validasi dokumen RKAS' },
  { id: 'bos-6', nama: 'SD NEGERI 1 CIPEUJEUH WETAN', npsn: '20215286', status: 'NEGERI', jenjang: 'SD', desa: 'CIPEUJEUH WETAN', jumlahSiswa: 175, alokasiDana: 42000000, triwulan: 2, statusValidasi: 'valid' },
  { id: 'bos-7', nama: 'SD NEGERI 2 CIPEUJEUH WETAN', npsn: '20215380', status: 'NEGERI', jenjang: 'SD', desa: 'CIPEUJEUH WETAN', jumlahSiswa: 201, alokasiDana: 48240000, triwulan: 2, statusValidasi: 'valid' },
  { id: 'bos-8', nama: 'SD NEGERI 3 CIPEUJEUH WETAN', npsn: '20214479', status: 'NEGERI', jenjang: 'SD', desa: 'CIPEUJEUH WETAN', jumlahSiswa: 88, alokasiDana: 21120000, triwulan: 2, statusValidasi: 'tidak_valid', catatan: 'RKAS belum diunggah' },
  { id: 'bos-9', nama: 'SD NEGERI 1 LEMAHABANG', npsn: '20215162', status: 'NEGERI', jenjang: 'SD', desa: 'LEMAHABANG', jumlahSiswa: 245, alokasiDana: 58800000, triwulan: 2, statusValidasi: 'valid' },
  { id: 'bos-10', nama: 'SD NEGERI 2 LEMAHABANG', npsn: '20214656', status: 'NEGERI', jenjang: 'SD', desa: 'LEMAHABANG', jumlahSiswa: 267, alokasiDana: 64080000, triwulan: 2, statusValidasi: 'valid' },
  { id: 'bos-11', nama: 'SD NEGERI 1 LEMAHABANG KULON', npsn: '20215161', status: 'NEGERI', jenjang: 'SD', desa: 'LEMAHABANG KULON', jumlahSiswa: 192, alokasiDana: 46080000, triwulan: 2, statusValidasi: 'verifikasi', catatan: 'Periksa silang data rombel' },
  { id: 'bos-12', nama: 'SD NEGERI 1 LEUWIDINGDING', npsn: '20215164', status: 'NEGERI', jenjang: 'SD', desa: 'LEUWIDINGDING', jumlahSiswa: 143, alokasiDana: 34320000, triwulan: 2, statusValidasi: 'valid' },
  { id: 'bos-13', nama: 'SD NEGERI 1 PICUNGPUGUR', npsn: '20246442', status: 'NEGERI', jenjang: 'SD', desa: 'PICUNGPUGUR', jumlahSiswa: 118, alokasiDana: 28320000, triwulan: 2, statusValidasi: 'valid' },
  { id: 'bos-14', nama: 'SD NEGERI 1 SARAJAYA', npsn: '20215517', status: 'NEGERI', jenjang: 'SD', desa: 'SARAJAYA', jumlahSiswa: 107, alokasiDana: 25680000, triwulan: 2, statusValidasi: 'valid' },
  { id: 'bos-15', nama: 'SD NEGERI 2 SARAJAYA', npsn: '20214726', status: 'NEGERI', jenjang: 'SD', desa: 'SARAJAYA', jumlahSiswa: 76, alokasiDana: 18240000, triwulan: 2, statusValidasi: 'tidak_valid', catatan: 'Ketidaksesuaian data siswa' },
  { id: 'bos-16', nama: 'SD NEGERI 1 SIGONG', npsn: '20215506', status: 'NEGERI', jenjang: 'SD', desa: 'SIGONG', jumlahSiswa: 223, alokasiDana: 53520000, triwulan: 2, statusValidasi: 'valid' },
  { id: 'bos-17', nama: 'SD NEGERI 3 SIGONG', npsn: '20214570', status: 'NEGERI', jenjang: 'SD', desa: 'SIGONG', jumlahSiswa: 95, alokasiDana: 22800000, triwulan: 2, statusValidasi: 'verifikasi', catatan: 'Dokumen belum lengkap' },
  { id: 'bos-18', nama: 'SD NEGERI 4 SIGONG', npsn: '20244513', status: 'NEGERI', jenjang: 'SD', desa: 'SIGONG', jumlahSiswa: 64, alokasiDana: 15360000, triwulan: 2, statusValidasi: 'valid' },
  { id: 'bos-19', nama: 'SD NEGERI 1 SINDANGLAUT', npsn: '20215464', status: 'NEGERI', jenjang: 'SD', desa: 'SINDANGLAUT', jumlahSiswa: 158, alokasiDana: 37920000, triwulan: 2, statusValidasi: 'valid' },
  { id: 'bos-20', nama: 'SD NEGERI 1 TUK KARANGSUWUNG', npsn: '20246445', status: 'NEGERI', jenjang: 'SD', desa: 'TUK KARANGSUWUNG', jumlahSiswa: 89, alokasiDana: 21360000, triwulan: 2, statusValidasi: 'valid' },
  { id: 'bos-21', nama: 'SD NEGERI 1 WANGKELANG', npsn: '20215584', status: 'NEGERI', jenjang: 'SD', desa: 'WANGKELANG', jumlahSiswa: 165, alokasiDana: 39600000, triwulan: 2, statusValidasi: 'valid' },
  { id: 'bos-22', nama: 'SD IT AL IRSYAD AL ISLAMIYYAH', npsn: '20215221', status: 'SWASTA', jenjang: 'SD', desa: 'LEMAHABANG KULON', jumlahSiswa: 134, alokasiDana: 32160000, triwulan: 2, statusValidasi: 'valid' },
];

// ---------------------------------------------------------------------------
// KIP SD – Daftar penerima KIP
// ---------------------------------------------------------------------------
export const mockKipSd: KipSdData[] = [];

// ---------------------------------------------------------------------------
// Yatim Piatu – Daftar anak yatim/piatu/yatim piatu
// ---------------------------------------------------------------------------
export const mockYatimPiatu: YatimPiatuData[] = [];
