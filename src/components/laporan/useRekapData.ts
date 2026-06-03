'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useSekolah } from '@/hooks/useSekolah'
import { getCanonicalSchoolName, normalizeSchool } from '@/lib/normalize'
import type { LaporanRecord, StatusLaporan, FilterState } from './types'

const bulanList = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

const statusMap: Record<string, StatusLaporan> = {
  sudah_dikirim: 'sudah_lapor',
  perlu_revisi: 'revisi',
  diverifikasi: 'diverifikasi',
  draft: 'draft',
  belum_lapor: 'belum_lapor',
}

function mapDoc(d: any): LaporanRecord {
  const rawGtk = d.dataGtk || undefined
  let dataGtk = rawGtk
  if (!rawGtk && d.dataSiswa) {
    const ds = d.dataSiswa
    dataGtk = {
      guruL: Number(ds.guru_l) || 0,
      guruP: Number(ds.guru_p) || 0,
      tendikL: Number(ds.tendik_l) || 0,
      tendikP: Number(ds.tendik_p) || 0,
    }
  }
  return {
    id: d.id,
    sekolah: d.sekolah || '',
    sekolahId: d.sekolahId || d.sekolah_id || '',
    bulan: d.bulan || '',
    tahun: d.tahun || 0,
    status: statusMap[d.status] || d.status || 'belum_lapor',
    tglLapor: d.tglLapor || d.dikirimPada || undefined,
    dataSiswa: d.dataSiswa || undefined,
    dataGtk,
    dataSarpras: d.dataSarpras || undefined,
    dataAbsen: d.dataAbsen || undefined,
  }
}

export function useRekapData() {
  const { schools } = useSekolah()
  const [laporanList, setLaporanList] = useState<LaporanRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    const fetchData = async () => {
      try {
        const res = await fetch('/api/firestore/laporan_bulanan')
        if (!res.ok) throw new Error(`API error: ${res.status}`)
        const json = await res.json()
        if (!mountedRef.current) return
        const items: LaporanRecord[] = (json.items || []).map(mapDoc)
        setLaporanList(items)
        setError(null)
      } catch (err) {
        if (!mountedRef.current) return
        console.error('Laporan fetch error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        if (mountedRef.current) setLoading(false)
      }
    }

    fetchData()

    const interval = setInterval(fetchData, 30_000)

    return () => {
      mountedRef.current = false
      clearInterval(interval)
    }
  }, [])

  const sekolahList = useMemo(() => {
    return schools.map((s) => ({
      nama: s.nama,
      npsn: s.npsn,
      nss: s.nss,
      jenjang: s.jenjang,
      status: s.status,
      desa: s.desa,
      alamat: s.address,
    }))
  }, [schools])

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
        const key = getCanonicalSchoolName(l.sekolah) || normalizeSchool(l.sekolah)
        if (!laporanBySekolah.has(key) || (l.tglLapor && (laporanBySekolah.get(key)?.tglLapor || 0) < l.tglLapor)) {
          laporanBySekolah.set(key, l)
        }
      }

      const result = sekolahFiltered.map((s) => {
        const key = getCanonicalSchoolName(s.nama) || normalizeSchool(s.nama)
        const laporan = laporanBySekolah.get(key) || laporanBySekolah.get(normalizeSchool(s.nama))
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
    const key = getCanonicalSchoolName(sekolahNama) || normalizeSchool(sekolahNama)
    for (const l of laporanList) {
      if (l.tahun !== tahun) continue
      if (l.bulan !== bulan && l.bulan !== monthStr) continue
      const lKey = getCanonicalSchoolName(l.sekolah) || normalizeSchool(l.sekolah)
      if (lKey === key) return l
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
