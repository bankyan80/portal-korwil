'use client'

import { useState, useEffect, useMemo } from 'react'
import { db } from '@/lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import { allSekolah } from '@/data/sekolah'
import { normalizeSchool } from '@/lib/normalize'
import type { BaseSekolah, LaporanRecord, StatusLaporan, FilterState } from './types'

const bulanList = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

const statusMap: Record<string, StatusLaporan> = {
  sudah_dikirim: 'sudah_lapor',
  perlu_revisi: 'revisi',
  diverifikasi: 'diverifikasi',
  draft: 'draft',
  belum_lapor: 'belum_lapor',
}

export function useRekapData() {
  const [laporanList, setLaporanList] = useState<LaporanRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!db) { setLoading(false); setError('Database tidak tersedia'); return }
    const unsub = onSnapshot(
      collection(db, 'laporan_bulanan'),
      (snap) => {
        const items: LaporanRecord[] = []
        snap.forEach((d) => {
          const data = d.data()
          const rawGtk = data.dataGtk || undefined
          let dataGtk = rawGtk
          if (!rawGtk && data.dataSiswa) {
            const ds = data.dataSiswa
            dataGtk = {
              guruL: Number(ds.guru_l) || 0,
              guruP: Number(ds.guru_p) || 0,
              tendikL: Number(ds.tendik_l) || 0,
              tendikP: Number(ds.tendik_p) || 0,
            }
          }
          items.push({
            id: d.id,
            sekolah: data.sekolah || '',
            sekolahId: data.sekolahId || data.sekolah_id || '',
            bulan: data.bulan || '',
            tahun: data.tahun || 0,
            status: statusMap[data.status] || data.status || 'belum_lapor',
            tglLapor: data.tglLapor || data.dikirimPada || undefined,
            dataSiswa: data.dataSiswa || undefined,
            dataGtk,
            dataSarpras: data.dataSarpras || undefined,
            dataAbsen: data.dataAbsen || undefined,
          })
        })
        setLaporanList(items)
        setLoading(false)
      },
      (err) => { console.error('Laporan listener error:', err); setLoading(false); setError(err.message) }
    )
    return () => unsub()
  }, [])

  const sekolahList = useMemo(() => {
    return allSekolah.map((s) => ({
      nama: s.nama,
      npsn: s.npsn,
      nss: s.nss,
      jenjang: s.jenjang as BaseSekolah['jenjang'],
      status: s.status as BaseSekolah['status'],
      desa: s.desa,
      alamat: s.address,
    }))
  }, [])

  const getFilteredData = useMemo(() => {
    return (filter: FilterState) => {
      const { bulan, tahun, jenjang, sekolah, statusLaporan, search } = filter

      let sekolahFiltered = sekolahList
      if (jenjang !== 'all') sekolahFiltered = sekolahFiltered.filter((s) => s.jenjang === jenjang)
      if (sekolah) sekolahFiltered = sekolahFiltered.filter((s) => s.nama.toLowerCase().includes(sekolah.toLowerCase()))
      if (search) sekolahFiltered = sekolahFiltered.filter((s) => s.nama.toLowerCase().includes(search.toLowerCase()))

      const monthIndex = bulanList.indexOf(bulan)
      const monthStr = String(monthIndex + 1).padStart(2, '0')

      const laporanBySekolah = new Map<string, LaporanRecord>()
      for (const l of laporanList) {
        if (l.tahun !== tahun) continue
        if (l.bulan !== bulan && l.bulan !== monthStr) continue
        const key = normalizeSchool(l.sekolah)
        if (!laporanBySekolah.has(key) || (l.tglLapor && (laporanBySekolah.get(key)?.tglLapor || 0) < l.tglLapor)) {
          laporanBySekolah.set(key, l)
        }
      }

      const result = sekolahFiltered.map((s) => {
        const key = normalizeSchool(s.nama)
        const laporan = laporanBySekolah.get(key) || laporanBySekolah.get(s.npsn)
        return { sekolah: s, laporan: laporan || null }
      })

      if (statusLaporan !== 'all') {
        return result.filter((r) => {
          const st = r.laporan?.status || 'belum_lapor'
          return st === statusLaporan
        })
      }

      return result
    }
  }, [sekolahList, laporanList])

  const getLaporanForSekolah = (sekolahNama: string, bulan: string, tahun: number): LaporanRecord | null => {
    const monthIndex = bulanList.indexOf(bulan)
    const monthStr = String(monthIndex + 1).padStart(2, '0')
    const key = normalizeSchool(sekolahNama)
    for (const l of laporanList) {
      if (l.tahun !== tahun) continue
      if (l.bulan !== bulan && l.bulan !== monthStr) continue
      if (normalizeSchool(l.sekolah) === key) return l
    }
    return null
  }

  return {
    sekolahList,
    laporanList,
    loading,
    error,
    getFilteredData,
    getLaporanForSekolah,
    bulanList,
  }
}
