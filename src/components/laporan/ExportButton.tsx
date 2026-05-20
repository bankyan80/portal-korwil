'use client'

import { FileSpreadsheet, FileText, Printer, ClipboardList } from 'lucide-react'
import * as XLSX from 'xlsx'

interface ExportColumn {
  header: string
  key: string
}

export function exportToExcel(data: any[], columns: ExportColumn[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data.map(row => {
    const obj: Record<string, any> = {}
    columns.forEach(c => { obj[c.header] = row[c.key] ?? '' })
    return obj
  }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Rekap')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export function exportToCsv(data: any[], columns: ExportColumn[], filename: string) {
  const header = columns.map(c => c.header).join(',')
  const rows = data.map(row => columns.map(c => {
    const val = row[c.key] ?? ''
    return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
  }).join(','))
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

interface Props {
  onExportExcel: () => void
  onExportPdf: () => void
  onPrint: () => void
  onCopyCsv: () => void
}

export default function ExportButton({ onExportExcel, onExportPdf, onPrint, onCopyCsv }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap print:hidden">
      <button onClick={onExportExcel} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 transition-colors">
        <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
      </button>
      <button onClick={onExportPdf} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-700 rounded-lg hover:bg-red-800 transition-colors">
        <FileText className="w-3.5 h-3.5" /> PDF
      </button>
      <button onClick={onPrint} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors">
        <Printer className="w-3.5 h-3.5" /> Print
      </button>
      <button onClick={onCopyCsv} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
        <ClipboardList className="w-3.5 h-3.5" /> CSV
      </button>
    </div>
  )
}
