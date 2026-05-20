'use client'

import { CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react'
import type { StatusLaporan } from './types'

const config: Record<StatusLaporan, { label: string; icon: any; className: string }> = {
  belum_lapor: { label: 'Belum Lapor', icon: XCircle, className: 'bg-red-100 text-red-700 border-red-200' },
  draft: { label: 'Draft', icon: Clock, className: 'bg-gray-100 text-gray-600 border-gray-200' },
  sudah_lapor: { label: 'Sudah Lapor', icon: CheckCircle, className: 'bg-green-100 text-green-700 border-green-200' },
  diverifikasi: { label: 'Diverifikasi', icon: RefreshCw, className: 'bg-blue-100 text-blue-700 border-blue-200' },
  revisi: { label: 'Revisi', icon: AlertTriangle, className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
}

export default function StatusBadge({ status, size = 'sm' }: { status: StatusLaporan; size?: 'sm' | 'lg' }) {
  const c = config[status] || config.belum_lapor
  const Icon = c.icon
  const px = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${px} ${c.className}`}>
      <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} />
      {c.label}
    </span>
  )
}
