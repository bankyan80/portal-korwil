'use client'

import { Search, Filter } from 'lucide-react'
import type { FilterState, Jenjang, KategoriRekap, StatusLaporan } from './types'

const bulanList = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

const kategoriOptions: { value: KategoriRekap; label: string }[] = [
  { value: 'status', label: 'Status Laporan' },
  { value: 'murid', label: 'Banyaknya Murid' },
  { value: 'ruangan', label: 'Ruangan' },
  { value: 'gtk', label: 'Guru & Tendik' },
  { value: 'perkakas', label: 'Perkakas' },
  { value: 'absen', label: 'Absen Murid' },
  { value: 'air', label: 'Penyediaan Air Bersih' },
  { value: 'bangunan', label: 'Jenis/Sifat Bangunan' },
  { value: 'sewa', label: 'Menyewa/Menumpang' },
]

interface Props {
  filter: FilterState
  onChange: (f: FilterState) => void
  showKategori?: boolean
}

export default function RekapFilter({ filter, onChange, showKategori = true }: Props) {
  const update = (partial: Partial<FilterState>) => onChange({ ...filter, ...partial })

  return (
    <div className="space-y-3">
      {showKategori && (
        <div className="flex flex-wrap gap-2">
          {kategoriOptions.map((k) => (
            <button
              key={k.value}
              onClick={() => update({ kategori: k.value })}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                filter.kategori === k.value
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari sekolah..."
            value={filter.search}
            onChange={(e) => update({ search: e.target.value })}
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>

        <select value={filter.bulan} onChange={(e) => update({ bulan: e.target.value })} className="text-sm border rounded-lg px-3 py-2 bg-white">
          {bulanList.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>

        <select value={filter.tahun} onChange={(e) => update({ tahun: Number(e.target.value) })} className="text-sm border rounded-lg px-3 py-2 bg-white">
          {[2026, 2025, 2024].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>

        <select value={filter.jenjang} onChange={(e) => update({ jenjang: e.target.value as Jenjang | 'all' })} className="text-sm border rounded-lg px-3 py-2 bg-white">
          <option value="all">Semua Jenjang</option>
          <option value="SD">SD</option>
          <option value="TK">TK</option>
          <option value="KB">KB</option>
        </select>

        <select value={filter.statusLaporan} onChange={(e) => update({ statusLaporan: e.target.value as StatusLaporan | 'all' })} className="text-sm border rounded-lg px-3 py-2 bg-white">
          <option value="all">Semua Status</option>
          <option value="sudah_lapor">Sudah Lapor</option>
          <option value="belum_lapor">Belum Lapor</option>
          <option value="diverifikasi">Diverifikasi</option>
          <option value="revisi">Revisi</option>
          <option value="draft">Draft</option>
        </select>
      </div>
    </div>
  )
}

export { kategoriOptions, bulanList }
