'use client'

import { XCircle, MessageCircle } from 'lucide-react'
import StatusBadge from './StatusBadge'

interface SekolahBelumLapor {
  nama: string
  jenjang: string
  status: string
  noHp?: string
}

export default function BelumLaporPanel({ data, bulan, tahun, hideWhatsApp }: { data: SekolahBelumLapor[]; bulan: string; tahun: number; hideWhatsApp?: boolean }) {
  if (data.length === 0) return null

  const waMessage = encodeURIComponent(
    `Halo Operator Sekolah,\nLaporan Bulanan bulan ${bulan} ${tahun} belum dikirim.\nSilakan login ke Portal Korwil untuk mengirim laporan.`
  )

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <XCircle className="w-5 h-5 text-red-600" />
        <h3 className="font-semibold text-red-800">Sekolah Belum Mengirim Laporan ({data.length})</h3>
      </div>
      <div className="grid gap-2 max-h-60 overflow-y-auto">
        {data.map((s) => (
          <div key={s.nama} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium text-gray-800 truncate">{s.nama}</span>
              <span className="text-xs text-gray-400 shrink-0">{s.jenjang}</span>
              <StatusBadge status={s.status as any} />
            </div>
            {!hideWhatsApp && (
              <a
                href={`https://wa.me/6281321592990?text=${waMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors shrink-0"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WA
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
