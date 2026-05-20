export type StatusLaporan = 'belum_lapor' | 'draft' | 'sudah_lapor' | 'diverifikasi' | 'revisi'
export type Jenjang = 'SD' | 'TK' | 'KB'
export type StatusSekolah = 'NEGERI' | 'SWASTA'
export type KategoriRekap = 'status' | 'murid' | 'ruangan' | 'gtk' | 'perkakas' | 'absen' | 'air' | 'bangunan' | 'sewa'

export interface BaseSekolah {
  nama: string
  npsn: string
  nss: string
  jenjang: Jenjang
  status: StatusSekolah
  desa: string
  alamat: string
  kepalaSekolah?: string
}

export interface LaporanRecord {
  id: string
  sekolah: string
  sekolahId: string
  bulan: string
  tahun: number
  status: StatusLaporan
  tglLapor?: number
  dataSiswa?: Record<string, number>
  dataGtk?: { guruL?: number; guruP?: number; tendikL?: number; tendikP?: number }
  dataSarpras?: Record<string, any>
  dataAbsen?: { sakit?: number; izin?: number; tanpa_keterangan?: number }
}

export interface FilterState {
  bulan: string
  tahun: number
  jenjang: Jenjang | 'all'
  sekolah: string
  statusLaporan: StatusLaporan | 'all'
  kategori: KategoriRekap
  search: string
}

export interface StatCard {
  label: string
  value: number
  icon: string
  color: string
}
