'use client';

import Link from 'next/link';
import { ArrowLeft, School, Users, ClipboardList, FileText, CheckCircle, Home, ShieldCheck, Truck } from 'lucide-react';
import Footer from '@/components/portal/Footer';

export default function SPMBSD() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-900">
      <header className="sticky top-0 z-50 bg-gradient-to-b from-[#1a5276] to-[#0d3b66]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <a href="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Kembali</span>
            </a>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-yellow-400" />
              <h1 className="text-sm font-bold text-white uppercase tracking-wide">SPMB SD</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="rounded-2xl p-8 shadow-lg bg-gradient-to-b from-[#1a5276] to-[#0d3b66]">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">SPMB SD Kecamatan Lemahabang</h1>
          <p className="mt-2 text-blue-100 text-sm sm:text-base">Sistem Penerimaan Murid Baru SD Tahun 2026</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Link href="/spmb-sd/cek" className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow hover:shadow-xl transition border dark:border-slate-700">
            <ClipboardList className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold mt-4 text-[#0d3b66] dark:text-white">Cek NIK & Usia</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Cek syarat usia dan data domisili siswa.</p>
          </Link>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow border dark:border-slate-700">
            <Users className="w-10 h-10 text-green-600 dark:text-green-400" />
            <h2 className="text-xl font-semibold mt-4 text-[#0d3b66] dark:text-white">Jalur Pendaftaran</h2>
            <ul className="mt-2 text-slate-600 dark:text-slate-400 space-y-1 text-sm">
              <li className="flex items-center gap-2"><Home className="w-4 h-4 text-blue-500" /> Domisili</li>
              <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-500" /> Afirmasi</li>
              <li className="flex items-center gap-2"><Truck className="w-4 h-4 text-purple-500" /> Mutasi</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow border dark:border-slate-700">
            <School className="w-10 h-10 text-purple-600 dark:text-purple-400" />
            <h2 className="text-xl font-semibold mt-4 text-[#0d3b66] dark:text-white">Sekolah SD</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Seluruh SD Kecamatan Lemahabang.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow border dark:border-slate-700">
          <h3 className="font-semibold text-[#0d3b66] dark:text-white text-lg mb-4">Ketentuan Umum</h3>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> Calon siswa SD minimal berusia <strong>6 tahun</strong> per 1 Juli 2026.</li>
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> NIK wajib 16 digit angka sesuai akta kelahiran.</li>
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> Pendaftaran dilakukan secara online melalui sistem SPMB.</li>
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> Setiap calon siswa hanya dapat mendaftar melalui satu jalur.</li>
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> Dokumen yang diupload wajib asli/fotokopi legalisir.</li>
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
}
