'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { useRekapData } from './useRekapData'
import RekapFilter, { bulanList } from './RekapFilter'
import RekapStats, { buildStats } from './RekapStats'
import StatusBadge from './StatusBadge'
import BelumLaporPanel from './BelumLaporPanel'
import ExportButton, { exportToExcel, exportToCsv } from './ExportButton'
import { ProgressChart, StatPie } from './RekapCharts'
import { normalizeSchool } from '@/lib/normalize'
import type { FilterState, KategoriRekap, StatusLaporan } from './types'
import { Search, Loader2 } from 'lucide-react'

const defaultFilter: FilterState = {
  bulan: 'Januari',
  tahun: 2026,
  jenjang: 'all',
  sekolah: '',
  statusLaporan: 'all',
  kategori: 'status',
  search: '',
}

const jenjangOrder = ['SD', 'TK', 'KB']

function getNamaBulanIndex(bulan: string): number {
  const idx = bulanList.indexOf(bulan)
  return idx >= 0 ? idx + 1 : 1
}

interface Props {
  isAdmin?: boolean
}

export default function RekapDashboard({ isAdmin = false }: Props) {
  const { sekolahList, laporanList, loading, error, getFilteredData, getLaporanForSekolah } = useRekapData()
  const [filter, setFilter] = useState<FilterState>(defaultFilter)
  const [page, setPage] = useState(1)
  const perPage = 20
  const printRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => getFilteredData(filter), [getFilteredData, filter])
  const paginated = useMemo(() => filtered.slice(0, page * perPage), [filtered, page])

  const monthIndex = getNamaBulanIndex(filter.bulan)
  const monthStr = String(monthIndex).padStart(2, '0')

  const totalSekolah = sekolahList.length
  const sudahLapor = filtered.filter(r => r.laporan && r.laporan.status !== 'belum_lapor').length
  const belumLapor = filtered.filter(r => !r.laporan || r.laporan.status === 'belum_lapor').length

  const totalMurid = useMemo(() => {
    let t = 0
    for (const r of filtered) {
      const ds = r.laporan?.dataSiswa
      if (ds) for (let i = 1; i <= 6; i++) { t += Number(ds[`kelas${i}_l`] || 0) + Number(ds[`kelas${i}_p`] || 0) }
    }
    return t
  }, [filtered])

  const totalGuru = useMemo(() => {
    let t = 0
    for (const r of filtered) { const g = r.laporan?.dataGtk; t += (g?.guruL || 0) + (g?.guruP || 0) }
    return t
  }, [filtered])

  const totalTendik = useMemo(() => {
    let t = 0
    for (const r of filtered) { const g = r.laporan?.dataGtk; t += (g?.tendikL || 0) + (g?.tendikP || 0) }
    return t
  }, [filtered])

  const totalRuanganRusak = useMemo(() => {
    let t = 0
    for (const r of filtered) {
      const ds = r.laporan?.dataSarpras
      if (ds) for (const key of Object.keys(ds)) { if (key.includes('rusak')) t += Number(ds[key] || 0) }
    }
    return t
  }, [filtered])

  const progressByJenjang = useMemo(() => {
    const map: Record<string, { sudah: number; belum: number }> = {}
    for (const s of sekolahList) {
      if (!map[s.jenjang]) map[s.jenjang] = { sudah: 0, belum: 0 }
    }
    for (const r of filtered) {
      if (map[r.sekolah.jenjang]) {
        if (r.laporan && r.laporan.status !== 'belum_lapor') map[r.sekolah.jenjang].sudah++
        else map[r.sekolah.jenjang].belum++
      }
    }
    return jenjangOrder.map(j => ({ name: j, sudah: map[j]?.sudah || 0, belum: map[j]?.belum || 0 }))
  }, [filtered, sekolahList])

  const pieStatus = useMemo(() => {
    const map: Record<string, number> = {}
    for (const r of filtered) {
      const st = r.laporan?.status || 'belum_lapor'
      map[st] = (map[st] || 0) + 1
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [filtered])

  const muridGtkByJenjang = useMemo(() => {
    const map: Record<string, { murid: number; guru: number; tendik: number }> = {}
    for (const s of sekolahList) {
      if (!map[s.jenjang]) map[s.jenjang] = { murid: 0, guru: 0, tendik: 0 }
    }
    for (const r of filtered) {
      const j = r.sekolah.jenjang
      if (!map[j]) continue
      const ds = r.laporan?.dataSiswa
      if (ds) for (let i = 1; i <= 6; i++) { map[j].murid += Number(ds[`kelas${i}_l`] || 0) + Number(ds[`kelas${i}_p`] || 0) }
      const g = r.laporan?.dataGtk
      if (g) { map[j].guru += (g.guruL || 0) + (g.guruP || 0); map[j].tendik += (g.tendikL || 0) + (g.tendikP || 0) }
    }
    return jenjangOrder.filter(j => map[j]).map(j => ({ name: j, ...map[j] }))
  }, [filtered, sekolahList])

  const laporanTrend = useMemo(() => {
    return bulanList.map(b => {
      const idx = bulanList.indexOf(b) + 1
      const ms = String(idx).padStart(2, '0')
      let count = 0
      for (const s of sekolahList) {
        const l = getLaporanForSekolah(s.nama, b, filter.tahun)
        if (l && l.status !== 'belum_lapor') count++
      }
      return { bulan: b.slice(0, 3), lapor: count }
    })
  }, [sekolahList, getLaporanForSekolah, filter.tahun])

  const belumLaporList = useMemo(() => {
    return filtered
      .filter(r => !r.laporan || r.laporan.status === 'belum_lapor')
      .map(r => ({ nama: r.sekolah.nama, jenjang: r.sekolah.jenjang, status: 'belum_lapor' }))
  }, [filtered])

  const handleExportExcel = useCallback(() => {
    const rows = filtered.map((r, i) => ({
      no: i + 1,
      sekolah: r.sekolah.nama,
      jenjang: r.sekolah.jenjang,
      status: r.laporan?.status || 'belum_lapor',
      tglKirim: r.laporan?.tglLapor ? new Date(r.laporan.tglLapor).toLocaleDateString('id-ID') : '-',
    }))
    exportToExcel(rows, [
      { header: 'No', key: 'no' },
      { header: 'Sekolah', key: 'sekolah' },
      { header: 'Jenjang', key: 'jenjang' },
      { header: 'Status', key: 'status' },
      { header: 'Tgl Kirim', key: 'tglKirim' },
    ], `Rekap_Laporan_${filter.bulan}_${filter.tahun}`)
  }, [filtered, filter])

  const handleExportPdf = useCallback(() => {
    window.print()
  }, [])

  const handleCopyCsv = useCallback(() => {
    const rows = filtered.map((r, i) => ({
      no: i + 1,
      sekolah: r.sekolah.nama,
      jenjang: r.sekolah.jenjang,
      status: r.laporan?.status || 'belum_lapor',
    }))
    exportToCsv(rows, [
      { header: 'No', key: 'no' },
      { header: 'Sekolah', key: 'sekolah' },
      { header: 'Jenjang', key: 'jenjang' },
      { header: 'Status', key: 'status' },
    ], `Rekap_Laporan_${filter.bulan}_${filter.tahun}`)
  }, [filtered, filter])

  const renderTable = () => {
    const k = filter.kategori

    if (k === 'status') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 w-10">No</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Nama Sekolah</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Jenjang</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Tanggal Kirim</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginated.map((r, i) => (
                <tr key={r.sekolah.nama} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-4 py-2.5 text-gray-500 text-center">{i + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-900">{r.sekolah.nama}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{r.sekolah.jenjang}</span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <StatusBadge status={(r.laporan?.status || 'belum_lapor') as StatusLaporan} />
                  </td>
                  <td className="px-4 py-2.5 text-center text-xs text-gray-500">
                    {r.laporan?.tglLapor ? new Date(r.laporan.tglLapor).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    if (k === 'murid') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 w-10">No</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Sekolah</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Jenjang</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">L</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">P</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginated.map((r, i) => {
                const ds = r.laporan?.dataSiswa
                let l = 0, p = 0
                if (ds) for (let j = 1; j <= 6; j++) { l += Number(ds[`kelas${j}_l`] || 0); p += Number(ds[`kelas${j}_p`] || 0) }
                return (
                  <tr key={r.sekolah.nama} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-2.5 text-gray-500 text-center">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-900">{r.sekolah.nama}</td>
                    <td className="px-4 py-2.5 text-center"><span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{r.sekolah.jenjang}</span></td>
                    <td className="px-4 py-2.5 text-center font-semibold text-blue-700">{l || '-'}</td>
                    <td className="px-4 py-2.5 text-center font-semibold text-pink-700">{p || '-'}</td>
                    <td className="px-4 py-2.5 text-center font-semibold text-gray-900">{l + p || '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )
    }

    if (k === 'ruangan') {
      const ruanganTypes = ['Ruang Kelas', 'Perpustakaan', 'UKS', 'WC/Toilet', 'Mushola', 'Gudang', 'Ruang Guru', 'Ruang Kepala Sekolah', 'Rumah Dinas Kepala Sekolah']
      const roomKeyMap: Record<string, string> = {
        'Ruang Kelas': 'ruang_kelas', 'Perpustakaan': 'perpustakaan', 'UKS': 'uks',
        'WC/Toilet': 'toilet', 'Mushola': 'mushola', 'Gudang': 'gudang',
        'Ruang Guru': 'ruang_guru', 'Ruang Kepala Sekolah': 'ruang_kepala_sekolah',
        'Rumah Dinas Kepala Sekolah': 'rumah_dinas_kepsek',
      }
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 w-10">No</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Sekolah</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Jenis Ruangan</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Baik</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Sedang</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Rusak</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginated.map((r) => {
                const ds = r.laporan?.dataSarpras
                return ruanganTypes.map((room) => {
                  const key = roomKeyMap[room] || ''
                  const baik = ds?.[`${key}_baik_bgn`] || 0
                  const sedang = ds?.[`${key}_sedang_bgn`] || 0
                  const rusak = ds?.[`${key}_rusak_bgn`] || 0
                  const jml = Number(baik) + Number(sedang) + Number(rusak)
                  return { room, baik, sedang, rusak, jml }
                }).filter(x => x.jml > 0).map((x, j) => (
                  <tr key={`${r.sekolah.nama}-${x.room}`} className="hover:bg-blue-50/50 transition-colors">
                    {j === 0 && <td className="px-4 py-2.5 text-gray-500 text-center align-top" rowSpan={paginated.length > 0 ? 1 : 1}>{i + 1}</td>}
                    {j === 0 && <td className="px-4 py-2.5 font-medium text-gray-900 align-top" rowSpan={1}>{r.sekolah.nama}</td>}
                    <td className="px-4 py-2.5 text-gray-700">{x.room}</td>
                    <td className="px-4 py-2.5 text-center text-green-700">{x.baik || '-'}</td>
                    <td className="px-4 py-2.5 text-center text-yellow-700">{x.sedang || '-'}</td>
                    <td className="px-4 py-2.5 text-center text-red-700">{x.rusak || '-'}</td>
                    <td className="px-4 py-2.5 text-center font-semibold">{x.jml || '-'}</td>
                  </tr>
                ))
              })}
            </tbody>
          </table>
        </div>
      )
    }

    if (k === 'gtk') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 w-10">No</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Sekolah</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Guru L</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Guru P</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Tendik L</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Tendik P</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Total GTK</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginated.map((r, i) => {
                const g = r.laporan?.dataGtk
                const guruL = g?.guruL || 0; const guruP = g?.guruP || 0
                const tendikL = g?.tendikL || 0; const tendikP = g?.tendikP || 0
                return (
                  <tr key={r.sekolah.nama} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-2.5 text-gray-500 text-center">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-900">{r.sekolah.nama}</td>
                    <td className="px-4 py-2.5 text-center font-semibold text-blue-700">{guruL || '-'}</td>
                    <td className="px-4 py-2.5 text-center font-semibold text-pink-700">{guruP || '-'}</td>
                    <td className="px-4 py-2.5 text-center font-semibold text-blue-700">{tendikL || '-'}</td>
                    <td className="px-4 py-2.5 text-center font-semibold text-pink-700">{tendikP || '-'}</td>
                    <td className="px-4 py-2.5 text-center font-bold text-gray-900">{guruL + guruP + tendikL + tendikP || '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )
    }

    if (k === 'perkakas') {
      const items = ['Bangku','Meja Murid','Kursi Murid','Kursi Guru','Meja Guru','Lemari','Papan Tulis','Kursi Tamu','Rak Buku']
      const keyMap: Record<string, string> = {
        'Bangku': 'bangku','Meja Murid':'meja_murid','Kursi Murid':'kursi_murid','Kursi Guru':'kursi_guru',
        'Meja Guru':'meja_guru','Lemari':'lemari','Papan Tulis':'papan_tulis','Kursi Tamu':'kursi_tamu','Rak Buku':'rak_buku',
      }
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 w-10">No</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Sekolah</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Jenis Perkakas</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Baik</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Rusak</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginated.map((r) => {
                const ds = r.laporan?.dataSarpras
                return items.map((item) => {
                  const k = keyMap[item] || ''
                  const baik = ds?.[`${k}_baik`] || 0
                  const rusak = ds?.[`${k}_rusak`] || 0
                  const jml = ds?.[k] || 0
                  return { item, baik, rusak, jml }
                }).filter(x => x.jml > 0).map((x, j) => (
                  <tr key={`${r.sekolah.nama}-${x.item}`} className="hover:bg-blue-50/50 transition-colors">
                    {j === 0 && <td className="px-4 py-2.5 text-gray-500 text-center align-top">{i + 1}</td>}
                    {j === 0 && <td className="px-4 py-2.5 font-medium text-gray-900 align-top">{r.sekolah.nama}</td>}
                    <td className="px-4 py-2.5 text-gray-700">{x.item}</td>
                    <td className="px-4 py-2.5 text-center text-green-700">{Number(x.baik) || '-'}</td>
                    <td className="px-4 py-2.5 text-center text-red-700">{Number(x.rusak) || '-'}</td>
                    <td className="px-4 py-2.5 text-center font-semibold">{Number(x.jml) || '-'}</td>
                  </tr>
                ))
              })}
            </tbody>
          </table>
        </div>
      )
    }

    if (k === 'absen') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 w-10">No</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Sekolah</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Sakit</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Izin</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Tanpa Keterangan</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginated.map((r, i) => {
                const a = r.laporan?.dataAbsen
                const sakit = a?.sakit || 0; const izin = a?.izin || 0; const tk = a?.tanpa_keterangan || 0
                return (
                  <tr key={r.sekolah.nama} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-2.5 text-gray-500 text-center">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-900">{r.sekolah.nama}</td>
                    <td className="px-4 py-2.5 text-center text-amber-700">{sakit || '-'}</td>
                    <td className="px-4 py-2.5 text-center text-blue-700">{izin || '-'}</td>
                    <td className="px-4 py-2.5 text-center text-red-700">{tk || '-'}</td>
                    <td className="px-4 py-2.5 text-center font-semibold">{sakit + izin + tk || '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )
    }

    if (k === 'air') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 w-10">No</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Sekolah</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">PAM</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Sumur</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Mata Air</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Sungai</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginated.map((r, i) => {
                const ds = r.laporan?.dataSarpras
                const sumber = (ds?.sumber_air || '').toLowerCase()
                const pam = sumber.includes('pam') ? '✓' : ''
                const sumur = sumber.includes('sumur') ? '✓' : ''
                const mataAir = sumber.includes('mata air') ? '✓' : ''
                const sungai = sumber.includes('sungai') ? '✓' : ''
                return (
                  <tr key={r.sekolah.nama} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-2.5 text-gray-500 text-center">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-900">{r.sekolah.nama}</td>
                    <td className="px-4 py-2.5 text-center text-green-600 font-bold">{pam || '-'}</td>
                    <td className="px-4 py-2.5 text-center text-blue-600 font-bold">{sumur || '-'}</td>
                    <td className="px-4 py-2.5 text-center text-cyan-600 font-bold">{mataAir || '-'}</td>
                    <td className="px-4 py-2.5 text-center text-amber-600 font-bold">{sungai || '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )
    }

    if (k === 'bangunan') {
      const items = ['Bangunan Sekolah','Rumah Dinas Kepsek','Rumah Dinas Guru','Perpustakaan']
      const prefMap: Record<string, string> = {
        'Bangunan Sekolah':'bangunan_sekolah','Rumah Dinas Kepsek':'r_dinas_kepsek','Rumah Dinas Guru':'r_dinas_guru','Perpustakaan':'perpustakaan',
      }
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 w-10">No</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Sekolah</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Jenis</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">P</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">SP</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">DR</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginated.map((r) => {
                const ds = r.laporan?.dataSarpras
                return items.map((item) => {
                  const p = prefMap[item] || ''
                  return {
                    item,
                    p: ds?.[`${p}_p`] || '-',
                    sp: ds?.[`${p}_sp`] || '-',
                    dr: ds?.[`${p}_dr`] || '-',
                  }
                }).filter(x => x.p !== '-' || x.sp !== '-' || x.dr !== '-').map((x, j) => (
                  <tr key={`${r.sekolah.nama}-${x.item}`} className="hover:bg-blue-50/50 transition-colors">
                    {j === 0 && <td className="px-4 py-2.5 text-gray-500 text-center align-top">{i + 1}</td>}
                    {j === 0 && <td className="px-4 py-2.5 font-medium text-gray-900 align-top">{r.sekolah.nama}</td>}
                    <td className="px-4 py-2.5 text-gray-700">{x.item}</td>
                    <td className="px-4 py-2.5 text-center font-semibold">{x.p}</td>
                    <td className="px-4 py-2.5 text-center font-semibold">{x.sp}</td>
                    <td className="px-4 py-2.5 text-center font-semibold">{x.dr}</td>
                  </tr>
                ))
              })}
            </tbody>
          </table>
        </div>
      )
    }

    if (k === 'sewa') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 w-10">No</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Sekolah</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Menyewa per Bulan (Rp)</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Menumpang di SD</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginated.map((r, i) => {
                const ds = r.laporan?.dataSarpras
                return (
                  <tr key={r.sekolah.nama} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-2.5 text-gray-500 text-center">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-900">{r.sekolah.nama}</td>
                    <td className="px-4 py-2.5 text-center">{ds?.menyewa_per_bulan || '-'}</td>
                    <td className="px-4 py-2.5 text-center">{ds?.menumpang_di_sd || '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )
    }

    return null
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Memuat data laporan...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <p className="text-sm text-red-600">Gagal memuat data: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-[#0d3b66]">Rekap Laporan Bulanan</h2>
          <p className="text-sm text-gray-500">Kecamatan Lemahabang, Kabupaten Cirebon</p>
        </div>
        <ExportButton
          onExportExcel={handleExportExcel}
          onExportPdf={handleExportPdf}
          onPrint={() => window.print()}
          onCopyCsv={handleCopyCsv}
        />
      </div>

      <div className="print:hidden">
        <RekapFilter filter={filter} onChange={setFilter} />
      </div>

      <div className="print:hidden">
        <RekapStats
          data={buildStats(totalSekolah, sudahLapor, belumLapor, totalMurid, totalGuru, totalTendik, totalGuru + totalTendik, totalRuanganRusak)}
        />
      </div>

      {filter.kategori === 'status' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 print:hidden">
          <ProgressChart data={progressByJenjang} />
          <StatPie data={pieStatus} title="Status Laporan" />
        </div>
      )}

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between print:hidden">
          <h3 className="font-semibold text-gray-800 text-sm">
            {filter.kategori === 'status' ? 'Status Laporan' :
             filter.kategori === 'murid' ? 'Banyaknya Murid' :
             filter.kategori === 'ruangan' ? 'Ruangan' :
             filter.kategori === 'gtk' ? 'Guru & Tendik' :
             filter.kategori === 'perkakas' ? 'Perkakas' :
             filter.kategori === 'absen' ? 'Absen Murid' :
             filter.kategori === 'air' ? 'Penyediaan Air Bersih' :
             filter.kategori === 'bangunan' ? 'Jenis/Sifat Bangunan' :
             filter.kategori === 'sewa' ? 'Menyewa/Menumpang' : ''}
            <span className="text-gray-400 font-normal ml-2">({filtered.length} sekolah)</span>
          </h3>
        </div>
        {renderTable()}

        {filtered.length > perPage && (
          <div className="px-4 py-3 border-t text-center print:hidden">
            {paginated.length < filtered.length ? (
              <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                Tampilkan lebih banyak ({filtered.length - paginated.length} tersisa)
              </button>
            ) : (
              <p className="text-sm text-gray-400">Menampilkan semua {filtered.length} sekolah</p>
            )}
          </div>
        )}
      </div>

      <div className="print:hidden">
        <BelumLaporPanel data={belumLaporList} bulan={filter.bulan} tahun={filter.tahun} hideWhatsApp />
      </div>

      {/* Print Layout */}
      <div ref={printRef} className="hidden print:block">
        <div className="text-center mb-6">
          <h1 className="text-lg font-bold">REKAP LAPORAN BULANAN SEKOLAH</h1>
          <p className="text-sm">Kecamatan Lemahabang, Kabupaten Cirebon</p>
          <p className="text-sm font-semibold mt-1">Bulan: {filter.bulan} {filter.tahun}</p>
        </div>

        <table className="w-full text-xs border-collapse border border-black">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black px-2 py-1 text-left">No</th>
              <th className="border border-black px-2 py-1 text-left">Nama Sekolah</th>
              <th className="border border-black px-2 py-1 text-center">Jenjang</th>
              {filter.kategori === 'murid' && <><th className="border border-black px-2 py-1 text-center">L</th><th className="border border-black px-2 py-1 text-center">P</th><th className="border border-black px-2 py-1 text-center">Jml</th></>}
              {filter.kategori === 'gtk' && <><th className="border border-black px-2 py-1 text-center">Guru L</th><th className="border border-black px-2 py-1 text-center">Guru P</th><th className="border border-black px-2 py-1 text-center">Tendik L</th><th className="border border-black px-2 py-1 text-center">Tendik P</th><th className="border border-black px-2 py-1 text-center">Total</th></>}
              {filter.kategori === 'absen' && <><th className="border border-black px-2 py-1 text-center">Sakit</th><th className="border border-black px-2 py-1 text-center">Izin</th><th className="border border-black px-2 py-1 text-center">Tanpa Ket</th><th className="border border-black px-2 py-1 text-center">Jml</th></>}
              {filter.kategori === 'status' && <><th className="border border-black px-2 py-1 text-center">Status</th><th className="border border-black px-2 py-1 text-center">Tgl Kirim</th></>}
              {!['murid','gtk','absen','status'].includes(filter.kategori) && <th className="border border-black px-2 py-1 text-center">Data</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.sekolah.nama}>
                <td className="border border-black px-2 py-1 text-center">{i + 1}</td>
                <td className="border border-black px-2 py-1">{r.sekolah.nama}</td>
                <td className="border border-black px-2 py-1 text-center">{r.sekolah.jenjang}</td>
                {filter.kategori === 'murid' && (() => {
                  const ds = r.laporan?.dataSiswa; let l = 0, p = 0
                  if (ds) for (let j = 1; j <= 6; j++) { l += Number(ds[`kelas${j}_l`] || 0); p += Number(ds[`kelas${j}_p`] || 0) }
                  return <><td className="border border-black px-2 py-1 text-center">{l}</td><td className="border border-black px-2 py-1 text-center">{p}</td><td className="border border-black px-2 py-1 text-center font-bold">{l + p}</td></>
                })()}
                {filter.kategori === 'gtk' && (() => {
                  const g = r.laporan?.dataGtk; const gl = g?.guruL || 0; const gp = g?.guruP || 0; const tl = g?.tendikL || 0; const tp = g?.tendikP || 0
                  return <><td className="border border-black px-2 py-1 text-center">{gl}</td><td className="border border-black px-2 py-1 text-center">{gp}</td><td className="border border-black px-2 py-1 text-center">{tl}</td><td className="border border-black px-2 py-1 text-center">{tp}</td><td className="border border-black px-2 py-1 text-center font-bold">{gl + gp + tl + tp}</td></>
                })()}
                {filter.kategori === 'absen' && (() => {
                  const a = r.laporan?.dataAbsen; const s = a?.sakit || 0; const iz = a?.izin || 0; const tk = a?.tanpa_keterangan || 0
                  return <><td className="border border-black px-2 py-1 text-center">{s}</td><td className="border border-black px-2 py-1 text-center">{iz}</td><td className="border border-black px-2 py-1 text-center">{tk}</td><td className="border border-black px-2 py-1 text-center font-bold">{s + iz + tk}</td></>
                })()}
                {filter.kategori === 'status' && <><td className="border border-black px-2 py-1 text-center">{r.laporan?.status || 'belum_lapor'}</td><td className="border border-black px-2 py-1 text-center">{r.laporan?.tglLapor ? new Date(r.laporan.tglLapor).toLocaleDateString('id-ID') : '-'}</td></>}
                {!['murid','gtk','absen','status'].includes(filter.kategori) && <td className="border border-black px-2 py-1 text-center">-</td>}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-right mt-8 text-sm">
          <p>Lemahabang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <br />
          <p className="font-semibold">Ketua Tim Kerja Kecamatan Lemahabang</p>
          <br /><br /><br />
          <p className="font-bold underline mt-6">ETI BUDIWATI, S.Pd</p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 0.8cm; size: A4 portrait; }
          .print\\:hidden { display: none !important; }
          .hidden.print\\:block { display: block !important; }
        }
      `}</style>
    </div>
  )
}
