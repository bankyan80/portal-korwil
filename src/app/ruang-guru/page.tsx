'use client';

import { ArrowLeft, Monitor, ExternalLink, AlertTriangle } from 'lucide-react';
import Footer from '@/components/portal/Footer';

export default function RuangGuruPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-50 bg-gradient-to-b from-[#1a5276] to-[#0d3b66]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <a
              href="/"
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Kembali</span>
            </a>
            <div className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-yellow-400" />
              <h1 className="text-sm font-bold text-white uppercase tracking-wide">Ruang Guru</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0d3b66]">Ruang Guru</h2>
          <p className="text-sm text-gray-500 mt-1">Platform Guru Kemendikdasmen</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
            <ExternalLink className="w-8 h-8 text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-[#0d3b66] text-lg">Buka Ruang Guru</p>
            <p className="text-sm text-gray-600 mt-1">
              Halaman ini akan dibuka di tab baru karena situs tujuan tidak dapat ditampilkan dalam halaman ini.
            </p>
          </div>
          <a
            href="https://guru.kemendikdasmen.go.id/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-colors shadow-lg shadow-amber-200"
          >
            Buka Ruang Guru
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
