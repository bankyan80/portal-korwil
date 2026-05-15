/**
 * Menghasilkan sample data JSON yang siap diimport ke Apps Script
 * Data diambil dari mock-data.ts aplikasi Next.js yang sudah ada
 * 
 * Jalankan: node generate-sample-data.mjs
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ==================== DATA SAMPLE ====================

const now = Date.now();

const menus = [
  { title: 'Data SD', icon: 'School', url: '/data-sd', category: 'Data', active: 'true', order: '1' },
  { title: 'Data TK', icon: 'Baby', url: '/data-tk', category: 'Data', active: 'true', order: '2' },
  { title: 'Data PAUD', icon: 'GraduationCap', url: '/data-paud', category: 'Data', active: 'true', order: '3' },
  { title: 'Data GTK', icon: 'Users', url: '/data-gtk', category: 'Data', active: 'true', order: '4' },
  { title: 'Data PD', icon: 'BookOpen', url: '/data-pd', category: 'Data', active: 'true', order: '5' },
  { title: 'Data Rombel', icon: 'Target', url: '/data-rombel', category: 'Data', active: 'true', order: '6' },
  { title: 'Laporan Bulanan', icon: 'BarChart3', url: '/rekap-laporan', category: 'Laporan', active: 'true', order: '7' },
  { title: 'Dapodik', icon: 'Database', url: '/dapodik', category: 'Data', active: 'true', order: '8' },
  { title: 'SPMB SD', icon: 'Send', url: '/spmb-sd', category: 'Pendaftaran', active: 'true', order: '9' },
  { title: 'KIP SD', icon: 'WalletMinimal', url: '/kip-sd', category: 'Pendaftaran', active: 'true', order: '10' },
  { title: 'Yatim Piatu', icon: 'HeartHandshake', url: '/yatim-piatu', category: 'Pendaftaran', active: 'true', order: '11' },
  { title: 'BOS / ARKAS', icon: 'WalletMinimal', url: '/bos-arkas', category: 'Keuangan', active: 'true', order: '12' },
  { title: 'Ruang Guru', icon: 'Users', url: '/ruang-guru', category: 'Program', active: 'true', order: '13' },
  { title: 'e-Kinerja', icon: 'Target', url: '/e-kinerja', category: 'Evaluasi', active: 'true', order: '14' },
  { title: 'Dokumen Bersama', icon: 'FolderOpen', url: '/dokumen-bersama', category: 'Dokumen', active: 'true', order: '15' },
  { title: 'Agenda Kegiatan', icon: 'CalendarDays', url: '/agenda-kegiatan', category: 'Informasi', active: 'true', order: '16' },
  { title: 'Batas Usia Pensiun', icon: 'Clock', url: '/bup', category: 'Kepegawaian', active: 'true', order: '17' },
  { title: 'Donasi', icon: 'HeartHandshake', url: '/donasi', category: 'Informasi', active: 'true', order: '18' },
  { title: 'Website Sekolah', icon: 'Globe', url: '/website-sekolah', category: 'Website', active: 'true', order: '19' },
  { title: 'Berita', icon: 'Megaphone', url: '/berita', category: 'Informasi', active: 'true', order: '20' },
];

const announcements = [
  {
    title: 'Pendaftaran Peserta Didik Baru (PPDB) Tahun Ajaran 2025/2026',
    content: 'Diberitahukan kepada seluruh masyarakat Kecamatan Lemahabang bahwa pendaftaran peserta didik baru untuk jenjang SD dan TK akan dibuka pada tanggal 1 Juni 2025. Persyaratan dan alur pendaftaran dapat dilihat di masing-masing sekolah atau melalui portal ini. Diharapkan para orang tua/wali mempersiapkan dokumen yang diperlukan.',
    createdAt: String(now - 2 * 86400000),
    pinned: 'true',
    author: 'Admin Kecamatan',
  },
  {
    title: 'Rapat Koordinasi K3S Kecamatan Lemahabang',
    content: 'Rapat koordinasi K3S Kecamatan Lemahabang akan dilaksanakan pada hari Jumat, 20 Juni 2025 pukul 09.00 WIB di Aula Kecamatan Lemahabang. Agenda rapat meliputi evaluasi semester genap tahun ajaran 2024/2025 dan persiapan kegiatan semester ganjil tahun ajaran 2025/2026. Seluruh kepala sekolah wajib hadir.',
    createdAt: String(now - 5 * 86400000),
    pinned: 'true',
    author: 'Ketua K3S',
  },
  {
    title: 'Pelatihan Kurikulum Merdeka untuk Guru SD',
    content: 'Dinas Pendidikan Kabupaten Cirebon akan menyelenggarakan pelatihan implementasi Kurikulum Merdeka bagi guru SD se-Kecamatan Lemahabang. Pelatihan akan berlangsung selama 3 hari pada tanggal 25-27 Juni 2025. Pendaftaran dibuka hingga 20 Juni 2025 melalui operator sekolah masing-masing.',
    createdAt: String(now - 7 * 86400000),
    pinned: 'false',
    author: 'Admin Kecamatan',
  },
  {
    title: 'Pencairan Dana BOS Triwulan II Tahun 2025',
    content: 'Berdasarkan surat edaran Dinas Pendidikan, pencairan dana BOS Triwulan II tahun 2025 telah diproses. Kepala sekolah dimohon segera menyelesaikan administrasi pencairan melalui sistem ARKAS. Batas waktu penyelesaian administrasi adalah 30 Juni 2025.',
    createdAt: String(now - 10 * 86400000),
    pinned: 'false',
    author: 'Tim Keuangan Kecamatan',
  },
  {
    title: 'Lomba Pendidikan Tingkat Kecamatan dalam Rangka HUT RI ke-80',
    content: 'Dalam rangka memperingati Hari Kemerdekaan Republik Indonesia ke-80, Kecamatan Lemahabang akan mengadakan lomba pendidikan tingkat kecamatan yang meliputi: lomba cerdas cermat, lomba membaca puisi, dan lomba menggambar. Pelaksanaan pada bulan Agustus 2025. Info selengkapnya menghubungi panitia di masing-masing sekolah.',
    createdAt: String(now - 14 * 86400000),
    pinned: 'false',
    author: 'Panitia HUT RI',
  },
];

const gallery = [
  {
    title: 'Upacara Hari Pendidikan Nasional 2025',
    description: 'Upacara peringatan Hardiknas 2025 yang diikuti oleh seluruh siswa, guru, dan tenaga kependidikan se-Kecamatan Lemahabang di Lapangan Kecamatan.',
    imageUrl: 'https://placehold.co/800x600/1e40af/white?text=Hardiknas+2025',
    category: 'K3S',
    authorName: 'Ahmad Fauzi',
    authorRole: 'Kepala SDN 1 Lemahabang',
    status: 'approved',
    createdAt: String(now - 3 * 86400000),
  },
  {
    title: 'Kegiatan Belajar di TK Pertiwi Lemahabang',
    description: 'Kegiatan pembelajaran berbasis bermain dan aktivitas kreatif untuk anak-anak TK yang bertujuan mengembangkan motorik halus dan kreativitas.',
    imageUrl: 'https://placehold.co/800x600/059669/white?text=Kegiatan+TK',
    category: 'TK',
    authorName: 'Siti Nurhaliza',
    authorRole: 'Kepala TK Pertiwi',
    status: 'approved',
    createdAt: String(now - 7 * 86400000),
  },
  {
    title: 'Rapat Kerja HIMPAUDI Kecamatan Lemahabang',
    description: 'Rapat kerja tahunan HIMPAUDI yang membahas program kerja dan rencana kegiatan peningkatan mutu pendidikan anak usia dini.',
    imageUrl: 'https://placehold.co/800x600/b91c1c/white?text=Rapat+HIMPAUDI',
    category: 'HIMPAUDI',
    authorName: 'Dewi Kartika',
    authorRole: 'Ketua HIMPAUDI',
    status: 'approved',
    createdAt: String(now - 10 * 86400000),
  },
  {
    title: 'Workshop Dapodik untuk Operator Sekolah',
    description: 'Pelatihan pengisian dan verifikasi data Dapodik untuk seluruh operator sekolah SD dan TK se-Kecamatan Lemahabang.',
    imageUrl: 'https://placehold.co/800x600/7c3aed/white?text=Workshop+Dapodik',
    category: 'Forum Operator',
    authorName: 'Budi Santoso',
    authorRole: 'Koordinator Operator',
    status: 'approved',
    createdAt: String(now - 15 * 86400000),
  },
  {
    title: 'Gerak Jalan Santai PGRI Kecamatan',
    description: 'Kegiatan jalan santai dalam rangka peringatan Hari Guru Nasional dan HUT PGRI yang diikuti oleh seluruh anggota PGRI.',
    imageUrl: 'https://placehold.co/800x600/ea580c/white?text=Jalan+Santai+PGRI',
    category: 'PGRI',
    authorName: 'Hendra Wijaya',
    authorRole: 'Ketua PGRI Kecamatan',
    status: 'approved',
    createdAt: String(now - 20 * 86400000),
  },
  {
    title: 'Kegiatan Pembelajaran PAUD Melati',
    description: 'Sesi pembelajaran outdoor di PAUD Melati Lemahabang dengan tema mengenal alam dan lingkungan sekitar.',
    imageUrl: 'https://placehold.co/800x600/0d9488/white?text=PAUD+Melati',
    category: 'PAUD',
    authorName: 'Rina Marlina',
    authorRole: 'Guru PAUD Melati',
    status: 'approved',
    createdAt: String(now - 25 * 86400000),
  },
];

const organizations = [
  { name: 'K3S (Kelompok Kerja Kepala Sekolah)', logo: 'https://placehold.co/80x80/2563eb/white?text=K3S', leader: 'H. Ahmad Fauzi, S.Pd.', contact: '0812-3456-7890', active: 'true' },
  { name: 'IGTKI (Ikatan Guru TK Indonesia)', logo: 'https://placehold.co/80x80/059669/white?text=IGTKI', leader: 'Siti Nurhaliza, S.Pd.', contact: '0813-4567-8901', active: 'true' },
  { name: 'HIMPAUDI (Himpunan Pendidik PAUD)', logo: 'https://placehold.co/80x80/dc2626/white?text=PAUD', leader: 'Dewi Kartika, A.Ma.', contact: '0814-5678-9012', active: 'true' },
  { name: 'PGRI (Persatuan Guru RI)', logo: 'https://placehold.co/80x80/ea580c/white?text=PGRI', leader: 'Hendra Wijaya, M.Pd.', contact: '0815-6789-0123', active: 'true' },
  { name: 'FKKG (Forum Kelompok Kerja Guru)', logo: 'https://placehold.co/80x80/7c3aed/white?text=FKKG', leader: 'Rudi Hermawan, S.Pd.', contact: '0816-7890-1234', active: 'true' },
  { name: 'FKKG PAI (Forum Kelompok Kerja Guru PAI)', logo: 'https://placehold.co/80x80/0d9488/white?text=PAI', leader: 'Hasan Basri, S.Ag.', contact: '0817-8901-2345', active: 'true' },
  { name: 'FKKGO (Forum Kelompok Kerja Guru Olahraga)', logo: 'https://placehold.co/80x80/1d4ed8/white?text=FKKGO', leader: 'Agus Prasetyo, S.Pd.', contact: '0818-9012-3456', active: 'true' },
  { name: 'Forum Operator Sekolah', logo: 'https://placehold.co/80x80/475569/white?text=OP', leader: 'Budi Santoso, S.Kom.', contact: '0819-0123-4567', active: 'true' },
];

const links = [
  { name: 'Kementerian Pendidikan dan Kebudayaan', logo: 'https://placehold.co/40x40/2563eb/white?text=K', url: 'https://www.kemdikbud.go.id', active: 'true', order: '1' },
  { name: 'Dinas Pendidikan Kabupaten Cirebon', logo: 'https://placehold.co/40x40/059669/white?text=D', url: 'https://disdik.cirebonkab.go.id', active: 'true', order: '2' },
  { name: 'Dapodik (Data Pokok Pendidikan)', logo: 'https://placehold.co/40x40/ea580c/white?text=DP', url: 'https://dapodik.kemdikbud.go.id', active: 'true', order: '3' },
  { name: 'Verval PD', logo: 'https://placehold.co/40x40/0d9488/white?text=VP', url: 'https://vervalpd.data.kemdikbud.go.id', active: 'true', order: '4' },
  { name: 'PMM (Platform Merdeka Mengajar)', logo: 'https://placehold.co/40x40/7c3aed/white?text=PMM', url: 'https://www.merdekabelajar.kemdikbud.go.id', active: 'true', order: '5' },
  { name: 'ARKAS (Aplikasi Kas Online)', logo: 'https://placehold.co/40x40/dc2626/white?text=AR', url: 'https://arkas.kemenkeu.go.id', active: 'true', order: '6' },
  { name: 'e-Kinerja Guru', logo: 'https://placehold.co/40x40/1d4ed8/white?text=eK', url: 'https://ekinerja.kemdikbud.go.id', active: 'true', order: '7' },
];

const settings = [
  { key: 'kepalaDinas', value: 'H. Ronianto, S.Pd., M.M.' },
  { key: 'jabatan', value: 'Kepala Dinas Pendidikan Kabupaten Cirebon' },
  { key: 'sambutan', value: 'Selamat datang di Portal Pendidikan Kecamatan Lemahabang. Portal ini sebagai wadah informasi dan layanan pendidikan untuk seluruh stakeholder pendidikan di Kecamatan Lemahabang, Kabupaten Cirebon.' },
  { key: 'fotoKepalaDinas', value: 'https://placehold.co/400x500/0d3b66/ffffff?text=Kadis' },
];

const users = [
  { email: 'admin@lemahabang.sch.id', username: 'admin', displayName: 'Admin Portal', role: 'admin' },
  { email: 'operator@lemahabang.sch.id', username: 'operator', displayName: 'Operator Sekolah', role: 'viewer' },
];

// ==================== GENERATE ID ====================

function generateId(prefix, index) {
  return `${prefix}_${index}_${Date.now().toString(36)}`;
}

// ==================== BUILD OUTPUT ====================

const output = {
  menus: menus.map((item, i) => ({
    id: generateId('menu', i + 1),
    ...item,
  })),
  announcements: announcements.map((item, i) => ({
    id: generateId('ann', i + 1),
    ...item,
  })),
  gallery: gallery.map((item, i) => ({
    id: generateId('gallery', i + 1),
    ...item,
  })),
  organizations: organizations.map((item, i) => ({
    id: generateId('org', i + 1),
    ...item,
  })),
  links: links.map((item, i) => ({
    id: generateId('link', i + 1),
    ...item,
  })),
  settings: settings.map((item, i) => ({
    id: generateId('setting', i + 1),
    ...item,
  })),
  users: users.map((item, i) => ({
    id: generateId('user', i + 1),
    ...item,
    createdAt: String(now),
  })),
};

// ==================== HITUNG TOTAL ====================

const total = Object.values(output).reduce((sum, arr) => sum + arr.length, 0);

// ==================== SIMPAN ====================

const outputPath = join(__dirname, 'firestore-data.json');
writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

console.log('╔══════════════════════════════════════════╗');
console.log('║   ✅ DATA SAMPLE BERHASIL DIGENERATE    ║');
console.log('╚══════════════════════════════════════════╝\n');

console.log(`📁 File: ${outputPath}`);
console.log(`\n📊 Total ${total} item siap diimport:\n`);
for (const [key, items] of Object.entries(output)) {
  console.log(`   ${key}: ${items.length} data`);
}

console.log('\n📥 CARA IMPORT KE APPS SCRIPT:');
console.log('   1. Buka panel admin (?page=admin)');
console.log('   2. Login dengan Google Account');
console.log('   3. Buka file firestore-data.json');
console.log('   4. Copy semua isi file ini');
console.log('   5. Paste di menu "Import Data" di Dashboard');
console.log('\n   Atau langsung paste ke Google Sheets:\n');
console.log('   1. Buka Google Sheet yang terhubung ke Apps Script');
console.log('   2. Untuk setiap sheet (menus, announcements, dll):');
console.log('      - Hapus data lama (kecuali header)');
console.log('      - Copy data JSON yang sesuai');
console.log('      - Paste ke sheet\n');