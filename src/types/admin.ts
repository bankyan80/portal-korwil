export type StatusValidasi = 'valid' | 'tidak_valid' | 'verifikasi';
export type YatimCategory = 'yatim_piatu' | 'yatim' | 'piatu';

export interface DriveFileMetadata {
  driveFileId: string;
  fileName: string;
  mimeType: string;
  size: number;
  webViewLink: string;
  webContentLink?: string;
  uploadedAt: string;
  uploadedBy?: string;
  sekolahId?: string;
  kategori?: string;
}

export interface DokumenBersama {
  id?: string;
  nik: string;
  nip: string;
  nama: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath?: string;
  downloadUrl?: string;
  file?: DriveFileMetadata;
  /** @deprecated Use file.webViewLink instead */
  dataUrl?: string;
  uploadedAt: number;
}

export interface KipSdData {
  id?: string;
  nik: string;
  nama: string;
  sekolah: string;
  desa: string;
  layak_pip: string;
  createdAt: number;
}

export interface YatimPiatuData {
  id?: string;
  nik: string;
  nama: string;
  sekolah: string;
  desa: string;
  kategori: YatimCategory;
  createdAt: number;
}

export interface AgendaKegiatan {
  id?: string;
  judul: string;
  deskripsi: string;
  tanggal: string;
  waktu: string;
  tempat: string;
  organizer: string;
  createdBy: string;
  createdAt: number;
}

export interface BosSchoolData {
  id?: string;
  nama: string;
  npsn: string;
  status: 'NEGERI' | 'SWASTA';
  jenjang: 'SD' | 'TK' | 'PAUD';
  desa: string;
  jumlahSiswa: number;
  alokasiDana: number;
  triwulan: number;
  statusValidasi: StatusValidasi;
  catatan?: string;
  updatedAt?: number;
}

export interface School {
  id: string;
  name: string;
  npsn: string;
  jenjang: 'SD' | 'TK' | 'KB' | 'PAUD';
  alamat: string;
  desa: string;
  status: 'NEGERI' | 'SWASTA';
  kepalaSekolah: string;
  pltKepalaSekolah?: string;
  operatorUid?: string;
  kontak: string;
  logo?: string;
  akreditasi?: string;
  website?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Employee {
  id?: string;
  nama: string;
  nip: string;
  nik: string;
  jabatan: string;
  schoolId: string;
  jenisKelamin: string;
  pendidikan: string;
  mapel: string;
  status: string;
  nuptk?: string;
  tmt?: string;
  sertifikasi?: string;
  createdAt: number;
}

export interface DataOrangTua {
  nama: string;
  tahunLahir: string;
  pendidikan: string;
  pekerjaan: string;
  penghasilan: string;
  nik: string;
}

export interface Student {
  id?: string;
  nama: string;
  nisn: string;
  nik: string;
  schoolId: string;
  kelas: string;
  jenjang: 'SD' | 'TK' | 'KB';
  jenis_kelamin: string;
  tanggal_lahir: string;
  tempat_lahir: string;
  desa: string;
  kecamatan: string;
  kode_pos: string;
  jenis_tinggal: string;
  alat_transportasi: string;
  telepon: string;
  hp: string;
  email: string;
  skhun: string;
  penerima_kps: string;
  no_kps: string;
  data_ayah: DataOrangTua | null;
  data_ibu: DataOrangTua | null;
  data_wali: DataOrangTua | null;
  rombel: string;
  no_peserta_ujian: string;
  no_seri_ijazah: string;
  penerima_kip: string;
  nomor_kip: string;
  nama_di_kip: string;
  nomor_kks: string;
  no_reg_akta_lahir: string;
  bank: string;
  nomor_rekening: string;
  rekening_atas_nama: string;
  layak_pip: string;
  alasan_layak_pip: string;
  kebutuhan_khusus: string;
  sekolah_asal: string;
  anakKe: number;
  lintang: number;
  bujur: number;
  noKk: string;
  beratBadan: number;
  tinggiBadan: number;
  lingkarKepala: number;
  jumlahSaudara: number;
  jarakRumahKm: number;
  status: 'aktif' | 'lulus' | 'pindah';
  createdAt: number;
  updatedAt: number;
}

export interface ClassRecap {
  id?: string;
  schoolId: string;
  jenjang: string;
  kelas: string;
  laki: number;
  perempuan: number;
  total: number;
  updatedAt: number;
}

export interface SPMB {
  id?: string;
  schoolId: string;
  schoolName: string;
  jenjang: 'SD' | 'TK' | 'KB';
  nik: string;
  nama: string;
  nisn: string;
  jenis_kelamin: string;
  tanggal_lahir: string;
  tempat_lahir: string;
  desa: string;
  jalur: string;
  status: 'pending' | 'diverifikasi' | 'diterima' | 'ditolak';
  createdAt: number;
}

export interface Report {
  id?: string;
  schoolId: string;
  bulan: number;
  tahun: number;
  jenis: string;
  data: unknown;
  status: 'belum_lapor' | 'draft' | 'sudah_lapor' | 'diverifikasi' | 'revisi';
  createdAt: number;
  updatedAt: number;
}

export interface CalendarEvent {
  id?: string;
  title: string;
  description: string;
  tanggal: string;
  waktu?: string;
  lokasi?: string;
  type: 'academic' | 'holiday' | 'meeting' | 'exam' | 'other';
  organizerId?: string;
  organizerName?: string;
  createdAt: number;
}

export interface Log {
  id?: string;
  uid: string;
  action: string;
  target: string;
  detail: string;
  timestamp: number;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  updatedAt: number;
}

export interface News {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  image?: string;
  authorName: string;
  authorRole: string;
  schoolId?: string;
  organizationId?: string;
  status: 'draft' | 'pending' | 'published' | 'rejected';
  createdAt: number;
  updatedAt: number;
}

export interface Sarpras {
  id: string;
  schoolId: string;
  tanah_pemerintah: string;
  tanah_yayasan: string;
  tanah_perseorangan: string;
  ruang_kelas: string;
  perpustakaan: string;
  uks: string;
  toilet: string;
  mushola: string;
  gudang: string;
  ruang_guru: string;
  ruang_kepala_sekolah: string;
  rumah_dinas_kepsek: string;
  bangku: string;
  meja_murid: string;
  kursi_murid: string;
  kursi_guru: string;
  meja_guru: string;
  lemari: string;
  papan_tulis: string;
  kursi_tamu: string;
  rak_buku: string;
  sumber_air: string;
  menyewa_per_bulan?: string;
  menumpang_di_sd?: string;
  bangunan_sekolah_p?: string;
  bangunan_sekolah_sp?: string;
  bangunan_sekolah_dr?: string;
  r_dinas_kepsek_p?: string;
  r_dinas_kepsek_sp?: string;
  r_dinas_kepsek_dr?: string;
  r_dinas_guru_p?: string;
  r_dinas_guru_sp?: string;
  r_dinas_guru_dr?: string;
  perpustakaan_p?: string;
  perpustakaan_sp?: string;
  perpustakaan_dr?: string;
  [key: string]: any;
  createdAt: number;
  updatedAt: number;
}
