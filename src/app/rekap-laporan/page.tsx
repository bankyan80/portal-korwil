'use client';

import { ArrowLeft, BarChart3, Loader2 } from 'lucide-react';
import Footer from '@/components/portal/Footer';

import RekapDashboard from '@/components/laporan/RekapDashboard';

export default function LaporanBulananPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <header className="sticky top-0 z-50 print:hidden bg-gradient-to-b from-[#1a5276] to-[#0d3b66]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <a href="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Kembali</span>
            </a>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-yellow-400" />
              <h1 className="text-sm font-bold text-white uppercase tracking-wide">Rekap Laporan Bulanan</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 print:px-0">
        <RekapDashboard />
      </main>

      <div className="print:hidden"><Footer /></div>


    </div>
  );
}
