// Seed portal content data (menus, announcements, gallery, organizations, institution_links) to Firestore
// Run: node scripts/seed-portal-data.mjs

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');
const { readFileSync, readdirSync } = require('fs');
const { join, resolve } = require('path');

// Load service account
const serviceAccountDir = resolve('service-account');
const files = readdirSync(serviceAccountDir).filter(f => f.endsWith('.json'));
if (files.length === 0) {
  console.error('No service account JSON found in service-account/');
  process.exit(1);
}
const saPath = join(serviceAccountDir, files[0]);
const sa = JSON.parse(readFileSync(saPath, 'utf8'));

if (admin.apps.length === 0) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
const db = admin.firestore();

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

async function seedCollection(name, docs) {
  console.log(`\nSeeding ${name}...`);
  const batch = db.batch();
  let count = 0;
  for (const doc of docs) {
    const ref = db.collection(name).doc(doc.id);
    batch.set(ref, doc, { merge: true });
    count++;
    if (count % 500 === 0) {
      await batch.commit();
      console.log(`  ${count} docs written...`);
    }
  }
  if (count % 500 !== 0) {
    await batch.commit();
  }
  console.log(`  ${count} docs written to ${name}`);
}

// ============================================================
// MENUS
// ============================================================
const menus = [
  { id: 'menu-1', title: 'Data SD', icon: 'School', url: '/data-sd', active: true, order: 1, category: 'Data' },
  { id: 'menu-2', title: 'Data TK', icon: 'Baby', url: '/data-tk', active: true, order: 2, category: 'Data' },
  { id: 'menu-3', title: 'Data KB', icon: 'GraduationCap', url: '/data-paud', active: true, order: 3, category: 'Data' },
  { id: 'menu-4', title: 'Data GTK', icon: 'Users', url: '/data-gtk', active: true, order: 4, category: 'Data' },
  { id: 'menu-5', title: 'Data PD', icon: 'BookOpen', url: '/data-pd', active: true, order: 5, category: 'Data' },
  { id: 'menu-6', title: 'Data Rombel', icon: 'Users', url: '/data-rombel', active: true, order: 6, category: 'Data' },
  { id: 'menu-7', title: 'Laporan Bulanan', icon: 'BarChart3', url: '/rekap-laporan', active: true, order: 7, category: 'Laporan' },
  { id: 'menu-8', title: 'Dapodik', icon: 'Database', url: '/dapodik', active: true, order: 8, category: 'Data' },
  { id: 'menu-9', title: 'SPMB SD', icon: 'FileText', url: '/spmb-sd', active: true, order: 9, category: 'Pendaftaran' },
  { id: 'menu-10', title: 'KIP SD', icon: 'WalletMinimal', url: '/kip-sd', active: true, order: 10, category: 'Pendaftaran' },
  { id: 'menu-11', title: 'Yatim Piatu', icon: 'Heart', url: '/yatim-piatu', active: true, order: 11, category: 'Pendaftaran' },
  { id: 'menu-12', title: 'BOS / ARKAS', icon: 'WalletMinimal', url: '/bos-arkas', active: true, order: 12, category: 'Keuangan' },
  { id: 'menu-13', title: 'Ruang Guru', icon: 'Monitor', url: '/ruang-guru', active: true, order: 13, category: 'Program' },
  { id: 'menu-14', title: 'e-Kinerja', icon: 'Target', url: '/e-kinerja', active: true, order: 14, category: 'Evaluasi' },
  { id: 'menu-15', title: 'Dokumen Bersama', icon: 'FolderOpen', url: '/dokumen-bersama', active: true, order: 15, category: 'Dokumen' },
  { id: 'menu-16', title: 'Agenda Kegiatan', icon: 'CalendarDays', url: '/agenda-kegiatan', active: true, order: 16, category: 'Informasi' },
  { id: 'menu-17', title: 'Batas Usia Pensiun', icon: 'Clock', url: '/bup', active: true, order: 17, category: 'Kepegawaian' },
  { id: 'menu-18', title: 'Donasi', icon: 'HeartHandshake', url: '/donasi', active: true, order: 18, category: 'Informasi' },
];

// ============================================================
// ANNOUNCEMENTS
// ============================================================
const announcements = [
  {
    id: 'announce-1', title: 'Pendaftaran Peserta Didik Baru (PPDB) Tahun Ajaran 2025/2026',
    content: 'Diberitahukan kepada seluruh masyarakat Kecamatan Lemahabang bahwa pendaftaran peserta didik baru untuk jenjang SD dan TK akan dibuka pada tanggal 1 Juni 2025. Persyaratan dan alur pendaftaran dapat dilihat di masing-masing sekolah atau melalui portal ini. Diharapkan para orang tua/wali mempersiapkan dokumen yang diperlukan.',
    createdAt: now - 2 * day, pinned: true, author: 'Admin Kecamatan',
  },
  {
    id: 'announce-2', title: 'Rapat Koordinasi K3S Kecamatan Lemahabang',
    content: 'Rapat koordinasi K3S Kecamatan Lemahabang akan dilaksanakan pada hari Jumat, 20 Juni 2025 pukul 09.00 WIB di Aula Kecamatan Lemahabang. Agenda rapat meliputi evaluasi semester genap tahun ajaran 2024/2025 dan persiapan kegiatan semester ganjil tahun ajaran 2025/2026. Seluruh kepala sekolah wajib hadir.',
    createdAt: now - 5 * day, pinned: true, author: 'Ketua K3S',
  },
  {
    id: 'announce-3', title: 'Pelatihan Kurikulum Merdeka untuk Guru SD',
    content: 'Dinas Pendidikan Kabupaten Cirebon akan menyelenggarakan pelatihan implementasi Kurikulum Merdeka bagi guru SD se-Kecamatan Lemahabang. Pelatihan akan berlangsung selama 3 hari pada tanggal 25-27 Juni 2025. Pendaftaran dibuka hingga 20 Juni 2025 melalui operator sekolah masing-masing.',
    createdAt: now - 7 * day, pinned: false, author: 'Admin Kecamatan',
  },
  {
    id: 'announce-4', title: 'Pencairan Dana BOS Triwulan II Tahun 2025',
    content: 'Berdasarkan surat edaran Dinas Pendidikan, pencairan dana BOS Triwulan II tahun 2025 telah diproses. Kepala sekolah dimohon segera menyelesaikan administrasi pencairan melalui sistem ARKAS. Batas waktu penyelesaian administrasi adalah 30 Juni 2025.',
    createdAt: now - 10 * day, pinned: false, author: 'Tim Keuangan Kecamatan',
  },
  {
    id: 'announce-5', title: 'Lomba Pendidikan Tingkat Kecamatan dalam Rangka HUT RI ke-80',
    content: 'Dalam rangka memperingati Hari Kemerdekaan Republik Indonesia ke-80, Kecamatan Lemahabang akan mengadakan lomba pendidikan tingkat kecamatan yang meliputi: lomba cerdas cermat, lomba membaca puisi, dan lomba menggambar. Pelaksanaan pada bulan Agustus 2025. Info selengkapnya menghubungi panitia di masing-masing sekolah.',
    createdAt: now - 14 * day, pinned: false, author: 'Panitia HUT RI',
  },
];

// ============================================================
// GALLERY
// ============================================================
const gallery = [
  {
    id: 'gallery-1', title: 'Upacara Hari Pendidikan Nasional 2025',
    description: 'Upacara peringatan Hardiknas 2025 yang diikuti oleh seluruh siswa, guru, dan tenaga kependidikan se-Kecamatan Lemahabang di Lapangan Kecamatan.',
    images: ['https://placehold.co/600x400/1e40af/white?text=Hardiknas+2025', 'https://placehold.co/600x400/1e3a8a/white?text=Upacara+Hardiknas', 'https://placehold.co/600x400/2563eb/white?text=Peserta+Hardiknas'],
    category: 'K3S', authorName: 'Ahmad Fauzi', authorRole: 'Kepala SDN 1 Lemahabang', status: 'published', createdAt: now - 3 * day,
  },
  {
    id: 'gallery-2', title: 'Kegiatan Belajar di TK Pertiwi Lemahabang',
    description: 'Kegiatan pembelajaran berbasis bermain dan aktivitas kreatif untuk anak-anak TK yang bertujuan mengembangkan motorik halus dan kreativitas.',
    images: ['https://placehold.co/600x400/059669/white?text=Kegiatan+TK', 'https://placehold.co/600x400/047857/white?text=Belajar+Bermain'],
    category: 'TK', authorName: 'Siti Nurhaliza', authorRole: 'Kepala TK Pertiwi', status: 'published', createdAt: now - 7 * day,
  },
  {
    id: 'gallery-3', title: 'Rapat Kerja HIMPAUDI Kecamatan Lemahabang',
    description: 'Rapat kerja tahunan HIMPAUDI yang membahas program kerja dan rencana kegiatan peningkatan mutu pendidikan anak usia dini.',
    images: ['https://placehold.co/600x400/b91c1c/white?text=Rapat+HIMPAUDI', 'https://placehold.co/600x400/dc2626/white?text=Pembahasan+Program', 'https://placehold.co/600x400/ef4444/white?text=Suasana+Rapat'],
    category: 'HIMPAUDI', authorName: 'Dewi Kartika', authorRole: 'Ketua HIMPAUDI', status: 'published', createdAt: now - 10 * day,
  },
  {
    id: 'gallery-4', title: 'Workshop Dapodik untuk Operator Sekolah',
    description: 'Pelatihan pengisian dan verifikasi data Dapodik untuk seluruh operator sekolah SD dan TK se-Kecamatan Lemahabang.',
    images: ['https://placehold.co/600x400/7c3aed/white?text=Workshop+Dapodik', 'https://placehold.co/600x400/6d28d9/white?text=Sesi+Pelatihan'],
    category: 'Forum Operator', authorName: 'Budi Santoso', authorRole: 'Koordinator Operator', status: 'published', createdAt: now - 15 * day,
  },
  {
    id: 'gallery-5', title: 'Gerak Jalan Santai PGRI Kecamatan',
    description: 'Kegiatan jalan santai dalam rangka peringatan Hari Guru Nasional dan HUT PGRI ke-79 yang diikuti oleh seluruh anggota PGRI.',
    images: ['https://placehold.co/600x400/ea580c/white?text=Jalan+Santai+PGRI', 'https://placehold.co/600x400/c2410c/white?text=Hadiah+Undian', 'https://placehold.co/600x400/f97316/white?text=Peserta+PGRI', 'https://placehold.co/600x400/fdba74/333?text=Finish+Line'],
    category: 'PGRI', authorName: 'Hendra Wijaya', authorRole: 'Ketua PGRI Kecamatan', status: 'published', createdAt: now - 20 * day,
  },
  {
    id: 'gallery-6', title: 'Kegiatan Pembelajaran PAUD Melati',
    description: 'Sesi pembelajaran outdoor di PAUD Melati Lemahabang dengan tema mengenal alam dan lingkungan sekitar.',
    images: ['https://placehold.co/600x400/0d9488/white?text=PAUD+Melati', 'https://placehold.co/600x400/0f766e/white?text=Outdoor+Learning'],
    category: 'PAUD', authorName: 'Rina Marlina', authorRole: 'Guru PAUD Melati', status: 'published', createdAt: now - 25 * day,
  },
];

// ============================================================
// ORGANIZATIONS
// ============================================================
const organizations = [
  {
    id: 'org-1', name: 'K3S (Kelompok Kerja Kepala Sekolah)', logo: '/K3S.png',
    leader: 'H. Ahmad Fauzi, S.Pd.', contact: '0812-3456-7890', active: true,
    description: 'K3S (Kelompok Kerja Kepala Sekolah) adalah forum komunikasi dan koordinasi para kepala sekolah dasar di Kecamatan Lemahabang yang bertujuan meningkatkan mutu pendidikan melalui kolaborasi dan berbagi praktik baik.',
    vision: 'Menjadi wadah kolaborasi kepala sekolah yang profesional, inovatif, dan berorientasi pada peningkatan mutu pendidikan.',
    mission: ['Meningkatkan kompetensi kepala sekolah melalui kegiatan pelatihan dan pendampingan', 'Memfasilitasi pertukaran informasi dan pengalaman antar kepala sekolah', 'Mengembangkan program-program inovatif dalam pengelolaan sekolah', 'Bersinergi dengan Dinas Pendidikan dalam implementasi kebijakan pendidikan'],
    board: [
      { jabatan: 'Ketua', nama: 'H. Ahmad Fauzi, S.Pd.' }, { jabatan: 'Wakil Ketua', nama: 'Drs. H. Nana Suryana, M.Pd.' },
      { jabatan: 'Sekretaris', nama: 'Asep Ruhimat, S.Pd.' }, { jabatan: 'Wakil Sekretaris', nama: 'Yanti Mulyanti, S.Pd.' },
      { jabatan: 'Bendahara', nama: 'Dedeh Kurniasih, S.Pd.' }, { jabatan: 'Seksi Kurikulum', nama: 'Dra. Hj. Een Nurhasanah' },
      { jabatan: 'Seksi Kesiswaan', nama: 'Maman Suherman, S.Pd.' }, { jabatan: 'Seksi Sarana Prasarana', nama: 'Wawan Gunawan, S.Pd.' },
      { jabatan: 'Seksi Humas', nama: 'Ade Supriyatna, S.Pd.' },
    ],
  },
  {
    id: 'org-2', name: 'IGTKI (Ikatan Guru Taman Kanak-kanak Indonesia)',
    logo: 'https://ui-avatars.com/api/?name=IGTKI&background=059669&color=fff&size=80&bold=true',
    leader: 'Siti Nurhaliza, S.Pd.', contact: '0813-4567-8901', active: true,
    description: 'IGTKI (Ikatan Guru Taman Kanak-kanak Indonesia) Kecamatan Lemahabang adalah organisasi profesi yang mewadahi guru-guru TK dalam mengembangkan kompetensi dan profesionalisme.',
    vision: 'Terwujudnya guru TK yang profesional, kreatif, dan berdedikasi dalam membentuk generasi emas sejak usia dini.',
    mission: ['Meningkatkan kualitas pembelajaran melalui pengembangan kurikulum yang relevan', 'Menyelenggarakan pelatihan dan workshop bagi guru TK', 'Membangun jaringan kerjasama dengan berbagai pemangku kepentingan pendidikan anak usia dini', 'Mengadvokasi kesejahteraan dan perlindungan profesi guru TK'],
    board: [
      { jabatan: 'Ketua', nama: 'Siti Nurhaliza, S.Pd.' }, { jabatan: 'Wakil Ketua', nama: 'Tuti Handayani, S.Pd.AUD.' },
      { jabatan: 'Sekretaris', nama: 'Ai Siti Jubaedah, S.Pd.' }, { jabatan: 'Bendahara', nama: 'Lilis Suryani, S.Pd.' },
      { jabatan: 'Seksi Pembelajaran', nama: 'Popon Puspita, S.Pd.' },
    ],
  },
  {
    id: 'org-3', name: 'HIMPAUDI (Himpunan Pendidik dan Tenaga Kependidikan Anak Usia Dini Indonesia)',
    logo: 'https://ui-avatars.com/api/?name=HIMPAUDI&background=dc2626&color=fff&size=80&bold=true',
    leader: 'Dewi Kartika, A.Ma.', contact: '0814-5678-9012', active: true,
    description: 'HIMPAUDI Kecamatan Lemahabang adalah organisasi profesi yang mewadahi pendidik PAUD dalam mengembangkan kompetensi dan kualitas pembelajaran anak usia dini.',
    vision: 'Terwujudnya pendidik PAUD yang profesional, kreatif, dan inovatif dalam mendidik anak usia dini.',
    mission: ['Meningkatkan kompetensi pendidik PAUD melalui pelatihan dan pendampingan', 'Mengembangkan model-model pembelajaran PAUD yang inovatif', 'Memfasilitasi kerjasama antar lembaga PAUD', 'Mengadvokasi kebijakan yang mendukung pengembangan PAUD'],
    board: [
      { jabatan: 'Ketua', nama: 'Dewi Kartika, A.Ma.' }, { jabatan: 'Wakil Ketua', nama: 'Rina Marlina, S.Pd.' },
      { jabatan: 'Sekretaris', nama: 'Hj. Ani Sumarni, S.Pd.AUD.' }, { jabatan: 'Bendahara', nama: 'Euis Sartika, A.Ma.' },
    ],
  },
  {
    id: 'org-4', name: 'PGRI (Persatuan Guru Republik Indonesia)',
    logo: 'https://ui-avatars.com/api/?name=PGRI&background=ea580c&color=fff&size=80&bold=true',
    leader: 'Hendra Wijaya, M.Pd.', contact: '0815-6789-0123', active: true,
    description: 'PGRI Kecamatan Lemahabang adalah organisasi profesi yang mewadahi seluruh guru di Kecamatan Lemahabang dalam memperjuangkan kesejahteraan dan pengembangan profesi.',
    vision: 'Terwujudnya guru Indonesia yang profesional, sejahtera, dan bermartabat.',
    mission: ['Memperjuangkan kesejahteraan dan hak-hak guru', 'Meningkatkan profesionalisme dan kompetensi guru', 'Memfasilitasi kegiatan pengembangan profesi berkelanjutan', 'Menjalin kerjasama dengan berbagai pihak untuk kemajuan pendidikan'],
    board: [
      { jabatan: 'Ketua', nama: 'Hendra Wijaya, M.Pd.' }, { jabatan: 'Wakil Ketua', nama: 'Drs. H. Cecep Suryana' },
      { jabatan: 'Sekretaris', nama: 'Ade Komarudin, S.Pd.' }, { jabatan: 'Bendahara', nama: 'Neneng Hasanah, S.Pd.' },
    ],
  },
  {
    id: 'org-5', name: 'FKKG (Forum Kelompok Kerja Guru)',
    logo: 'https://ui-avatars.com/api/?name=FKKG&background=7c3aed&color=fff&size=80&bold=true',
    leader: 'Rudi Hermawan, S.Pd.', contact: '0816-7890-1234', active: true,
    description: 'FKKG Kecamatan Lemahabang adalah forum komunikasi dan pengembangan kompetensi bagi guru-guru di Kecamatan Lemahabang.',
    vision: 'Terwujudnya guru yang profesional, kreatif, dan inovatif dalam meningkatkan mutu pendidikan.',
    mission: ['Meningkatkan kompetensi pedagogik dan profesional guru melalui KKG', 'Memfasilitasi pertukaran pengalaman dan praktik baik pembelajaran', 'Mengembangkan perangkat pembelajaran yang kontekstual dan inovatif', 'Mendukung program pemerintah dalam peningkatan mutu pendidikan'],
    board: [
      { jabatan: 'Ketua', nama: 'Rudi Hermawan, S.Pd.' }, { jabatan: 'Wakil Ketua', nama: 'Asep Saepudin, S.Pd.' },
      { jabatan: 'Sekretaris', nama: 'Dede Mulyadi, S.Pd.' }, { jabatan: 'Bendahara', nama: 'Yanti Susilawati, S.Pd.' },
    ],
  },
  {
    id: 'org-6', name: 'FKKG PAI (Forum Kelompok Kerja Guru Pendidikan Agama Islam)',
    logo: 'https://ui-avatars.com/api/?name=FKKG+PAI&background=0d9488&color=fff&size=80&bold=true',
    leader: 'Ustadz Hasan Basri, S.Ag.', contact: '0817-8901-2345', active: true,
    description: 'FKKG PAI Kecamatan Lemahabang adalah forum pengembangan kompetensi bagi guru Pendidikan Agama Islam di tingkat SD dan TK.',
    vision: 'Terwujudnya guru PAI yang berakhlak mulia, profesional, dan mampu membentuk karakter Islami pada peserta didik.',
    mission: ['Meningkatkan kompetensi guru PAI dalam pembelajaran agama Islam', 'Mengembangkan metode pembelajaran PAI yang kreatif dan menyenangkan', 'Memperkuat nilai-nilai keislaman dalam budaya sekolah', 'Memfasilitasi kerjasama antar guru PAI se-Kecamatan Lemahabang'],
    board: [
      { jabatan: 'Ketua', nama: 'Ustadz Hasan Basri, S.Ag.' }, { jabatan: 'Wakil Ketua', nama: 'Drs. H. Ahmad Fauzi' },
      { jabatan: 'Sekretaris', nama: 'Hj. Siti Maemunah, S.Ag.' }, { jabatan: 'Bendahara', nama: 'Ustadzah Euis Nurhayati, S.Pd.I.' },
    ],
  },
  {
    id: 'org-7', name: 'FKKGO (Forum Kelompok Kerja Guru Olahraga)',
    logo: 'https://ui-avatars.com/api/?name=FKKGO&background=1d4ed8&color=fff&size=80&bold=true',
    leader: 'Agus Prasetyo, S.Pd.', contact: '0818-9012-3456', active: true,
    description: 'FKKGO Kecamatan Lemahabang adalah forum pengembangan kompetensi bagi guru Pendidikan Jasmani, Olahraga, dan Kesehatan.',
    vision: 'Terwujudnya guru olahraga yang profesional dalam mengembangkan potensi fisik dan karakter siswa melalui pendidikan jasmani.',
    mission: ['Meningkatkan kompetensi guru PJOK dalam pembelajaran olahraga', 'Mengembangkan model pembelajaran PJOK yang inovatif dan menyenangkan', 'Membina bakat dan minat olahraga siswa', 'Memfasilitasi kegiatan olahraga antar sekolah'],
    board: [
      { jabatan: 'Ketua', nama: 'Agus Prasetyo, S.Pd.' }, { jabatan: 'Wakil Ketua', nama: 'Dede Kusnadi, S.Pd.' },
      { jabatan: 'Sekretaris', nama: 'Gilang Permana, S.Pd.' }, { jabatan: 'Bendahara', nama: 'Rina Kurniawati, S.Pd.' },
    ],
  },
  {
    id: 'org-8', name: 'Forum Operator Sekolah',
    logo: 'https://ui-avatars.com/api/?name=Forum+OP&background=475569&color=fff&size=80&bold=true',
    leader: 'Budi Santoso, S.Kom.', contact: '0819-0123-4567', active: true,
    description: 'Forum Operator Sekolah Kecamatan Lemahabang adalah wadah komunikasi dan pengembangan kompetensi bagi operator sekolah dalam pengelolaan data dan sistem informasi pendidikan.',
    vision: 'Terwujudnya operator sekolah yang profesional, handal, dan mampu mendukung tertib administrasi serta data pendidikan yang akurat.',
    mission: ['Meningkatkan kompetensi operator sekolah dalam pengelolaan data pokok pendidikan', 'Memfasilitasi koordinasi antara operator sekolah dengan dinas pendidikan', 'Mengoptimalkan penggunaan sistem informasi pendidikan', 'Mendukung akurasi dan ketepatan waktu pelaporan data sekolah'],
    board: [
      { jabatan: 'Ketua', nama: 'Budi Santoso, S.Kom.' }, { jabatan: 'Wakil Ketua', nama: 'Agus Hermawan, S.Kom.' },
      { jabatan: 'Sekretaris', nama: 'Iis Ismayanti, S.Pd.' }, { jabatan: 'Bendahara', nama: 'Tatang Suherman' },
    ],
  },
];

// ============================================================
// INSTITUTION LINKS
// ============================================================
const institutionLinks = [
  { id: 'link-1', name: 'Kementerian Pendidikan dan Kebudayaan', logo: 'https://ui-avatars.com/api/?name=Kemdikbud&background=2563eb&color=fff&size=48&bold=true', url: 'https://www.kemdikbud.go.id', active: true, order: 1 },
  { id: 'link-2', name: 'Dinas Pendidikan Kabupaten Cirebon', logo: 'https://ui-avatars.com/api/?name=Disdik&background=059669&color=fff&size=48&bold=true', url: 'https://disdik.cirebonkab.go.id', active: true, order: 2 },
  { id: 'link-3', name: 'Dapodik (Data Pokok Pendidikan)', logo: 'https://ui-avatars.com/api/?name=Dapodik&background=ea580c&color=fff&size=48&bold=true', url: 'https://dapodik.kemdikbud.go.id', active: true, order: 3 },
  { id: 'link-4', name: 'Verval PD (Pendidikan)', logo: 'https://ui-avatars.com/api/?name=VerPD&background=0d9488&color=fff&size=48&bold=true', url: 'https://vervalpd.data.kemdikbud.go.id', active: true, order: 4 },
  { id: 'link-5', name: 'PMM (Platform Merdeka Mengajar)', logo: 'https://ui-avatars.com/api/?name=PMM&background=7c3aed&color=fff&size=48&bold=true', url: 'https://www.merdekabelajar.kemdikbud.go.id', active: true, order: 5 },
  { id: 'link-6', name: 'ARKAS (Aplikasi Kas Online)', logo: 'https://ui-avatars.com/api/?name=ARKAS&background=dc2626&color=fff&size=48&bold=true', url: 'https://arkas.kemenkeu.go.id', active: true, order: 6 },
  { id: 'link-7', name: 'e-Kinerja Guru', logo: 'https://ui-avatars.com/api/?name=eKIN&background=1d4ed8&color=fff&size=48&bold=true', url: 'https://ekinerja.kemdikbud.go.id', active: true, order: 7 },
];

async function main() {
  console.log('=== PORTAL DATA SEEDER ===\n');
  console.log(`Firebase Project: ${sa.project_id}`);

  await seedCollection('menus', menus);
  await seedCollection('announcements', announcements);
  await seedCollection('gallery', gallery);
  await seedCollection('organizations', organizations);
  await seedCollection('institution_links', institutionLinks);

  console.log('\n=== SEEDING COMPLETE ===');
  console.log('Total:');
  console.log(`  menus: ${menus.length}`);
  console.log(`  announcements: ${announcements.length}`);
  console.log(`  gallery: ${gallery.length}`);
  console.log(`  organizations: ${organizations.length}`);
  console.log(`  institution_links: ${institutionLinks.length}`);
  process.exit(0);
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
