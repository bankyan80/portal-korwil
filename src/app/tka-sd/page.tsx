'use client';

import { useState, useMemo } from 'react';
import { ArrowLeft, FileBarChart, Search, Loader2, CheckCircle, XCircle, User, School, Calendar, Award, BookOpen } from 'lucide-react';
import Footer from '@/components/portal/Footer';
import { useFirestoreCollection } from '@/hooks/use-firestore-collection';

interface TkaParticipant {
  id: string;
  nama: string;
  nik: string;
  sekolah: string;
  kelas: string;
  tglTes: string;
  nilaiMatematika?: number;
  nilaiIndo?: number;
  nilaiIpa?: number;
  rataRata?: number;
  keterangan?: string;
  status: string;
}

export default function TkaSdPage() {
  const { items: data, loading } = useFirestoreCollection<TkaParticipant>('tka_sd');
  const [nik, setNik] = useState('');
  const [cari, setCari] = useState(false);

  const hasil = useMemo(() => {
    if (!nik || nik.length < 16 || !cari) return null;
    return data.find((d) => d.nik === nik) || null;
  }, [data, nik, cari]);

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
              <FileBarChart className="w-5 h-5 text-yellow-400" />
              <h1 className="text-sm font-bold text-white uppercase tracking-wide">TKA SD</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="rounded-2xl p-8 shadow-lg bg-gradient-to-b from-[#1a5276] to-[#0d3b66] text-white">
          <h1 className="text-3xl font-bold">Tes Kompetensi Akademik (TKA) SD</h1>
          <p className="mt-2 text-blue-100 text-sm sm:text-base">Pemetaan mutu pendidikan siswa Sekolah Dasar Kecamatan Lemahabang Tahun 2026</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-8 border dark:border-slate-700">
              <h2 className="text-xl font-bold text-[#0d3b66] dark:text-white mb-4">Cek Hasil Tes</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Masukkan NIK siswa untuk melihat hasil Tes Kompetensi Akademik.</p>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Masukkan NIK (16 digit)"
                  value={nik}
                  onChange={(e) => { setNik(e.target.value.replace(/\D/g, '').slice(0, 16)); setCari(false); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && nik.length === 16) setCari(true); }}
                  className="w-full border dark:border-slate-700 rounded-xl p-3 pl-10 text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <button 
                  onClick={() => setCari(true)}
                  disabled={nik.length < 16}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Cari
                </button>
              </div>

              {loading && cari && (
                <div className="mt-8 flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
              )}

              {!loading && cari && hasil === null && (
                <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3 text-amber-700 dark:text-amber-300 text-sm">
                  <XCircle className="w-5 h-5 shrink-0" />
                  Data NIK tidak ditemukan atau hasil tes belum diinput oleh operator.
                </div>
              )}

              {hasil && (
                <div className="mt-8 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div><p className="text-xs text-gray-400">Nama</p><p className="text-sm font-semibold">{hasil.nama}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <School className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div><p className="text-xs text-gray-400">Sekolah</p><p className="text-sm font-semibold">{hasil.sekolah}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div><p className="text-xs text-gray-400">Tanggal Tes</p><p className="text-sm font-semibold">{hasil.tglTes || '-'}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Award className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div><p className="text-xs text-gray-400">Status</p><span className="px-2 py-0.5 rounded-full text-[10px] bg-green-100 text-green-700 font-medium">{hasil.status}</span></div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border dark:border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 border-b dark:border-slate-700 bg-blue-50/50 dark:bg-blue-900/20 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <h3 className="text-sm font-bold text-[#0d3b66] dark:text-white">Rincian Nilai</h3>
                    </div>
                    <div className="p-6 grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">MTK</p>
                        <p className="text-2xl font-bold text-blue-600">{hasil.nilaiMatematika ?? '-'}</p>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">IND</p>
                        <p className="text-2xl font-bold text-green-600">{hasil.nilaiIndo ?? '-'}</p>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">IPA</p>
                        <p className="text-2xl font-bold text-purple-600">{hasil.nilaiIpa ?? '-'}</p>
                      </div>
                    </div>
                    <div className="px-6 py-4 bg-blue-600 text-white flex justify-between items-center">
                      <p className="text-sm font-medium">Rata-rata Nilai</p>
                      <p className="text-2xl font-bold">{hasil.rataRata ?? '-'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6 border dark:border-slate-700">
              <h3 className="font-bold text-[#0d3b66] dark:text-white mb-4">Informasi Penting</h3>
              <ul className="text-xs text-slate-500 space-y-3">
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span>TKA ditujukan untuk mengukur standar kompetensi dasar siswa kelas 6.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span>Mata pelajaran yang diuji meliputi Matematika, Bahasa Indonesia, dan IPA.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span>Sertifikat TKA dapat digunakan sebagai dokumen pendukung PPDB SMP.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
