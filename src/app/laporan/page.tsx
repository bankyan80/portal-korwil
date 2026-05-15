'use client';

import { BarChart3, BookOpen, GraduationCap, School, FileSpreadsheet, FileDown } from 'lucide-react';

export default function LaporanPage() {
  const menu = [
    { label: 'Rekap Peserta Didik', icon: BookOpen, desc: 'Data peserta didik per sekolah', href: '/data-pd' },
    { label: 'Rekap GTK', icon: GraduationCap, desc: 'Data guru dan tenaga kependidikan', href: '/data-gtk' },
    { label: 'Rekap Kelas', icon: BarChart3, desc: 'Rekapitulasi kelas per jenjang', href: '/data-rombel' },
    { label: 'Rekap SPMB', icon: School, desc: 'Data penerimaan peserta didik baru', href: '/spmb-sd' },
    { label: 'Rekap Laporan Bulanan', icon: FileSpreadsheet, desc: 'Laporan bulanan sekolah', href: '/rekap-laporan' },
    { label: 'Rekap BOS ARKAS', icon: FileDown, desc: 'Data BOS dan ARKAS sekolah', href: '/bos-arkas' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Laporan Pendidikan</h1>
          <p className="text-sm text-muted-foreground">Kecamatan Lemahabang, Kabupaten Cirebon</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {menu.map(item => (
            <a key={item.label} href={item.href}
              className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5 hover:shadow-md transition-all group">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <item.icon className="w-5 h-5 text-blue-700 dark:text-blue-300" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{item.label}</h3>
              </div>
              <p className="text-xs text-muted-foreground ml-13">{item.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
