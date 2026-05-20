'use client'

import { School, CheckCircle, XCircle, Users, GraduationCap, BookOpen, Building2, AlertTriangle } from 'lucide-react'

interface StatItem {
  label: string
  value: number
  icon: any
  color: string
  bg: string
}

export default function RekapStats({ data }: { data: StatItem[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {data.map((s, i) => (
        <div key={i} className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function buildStats(
  totalSekolah: number,
  sudahLapor: number,
  belumLapor: number,
  totalMurid: number,
  totalGuru: number,
  totalTendik: number,
  totalGtk: number,
  totalRuanganRusak: number,
): StatItem[] {
  return [
    { label: 'Total Sekolah', value: totalSekolah, icon: School, color: 'text-blue-700', bg: 'bg-blue-100' },
    { label: 'Sudah Lapor', value: sudahLapor, icon: CheckCircle, color: 'text-green-700', bg: 'bg-green-100' },
    { label: 'Belum Lapor', value: belumLapor, icon: XCircle, color: 'text-red-700', bg: 'bg-red-100' },
    { label: 'Total Murid', value: totalMurid, icon: Users, color: 'text-purple-700', bg: 'bg-purple-100' },
    { label: 'Total Guru', value: totalGuru, icon: GraduationCap, color: 'text-emerald-700', bg: 'bg-emerald-100' },
    { label: 'Total Tendik', value: totalTendik, icon: BookOpen, color: 'text-cyan-700', bg: 'bg-cyan-100' },
    { label: 'Total GTK', value: totalGtk, icon: Users, color: 'text-indigo-700', bg: 'bg-indigo-100' },
    { label: 'Ruangan Rusak', value: totalRuanganRusak, icon: Building2, color: 'text-amber-700', bg: 'bg-amber-100' },
  ]
}
