'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Search, Loader2, CheckCircle, XCircle, Clock, User, MapPin, School, Calendar, Home, ShieldCheck, Truck } from 'lucide-react';
import Footer from '@/components/portal/Footer';

import { useFirestoreCollection } from '@/hooks/use-firestore-collection';

interface Pendaftar {
  id: string;
  nama: string;
  nik: string;
  jk?: string;
  jalur: string;
  usia: number;
  status: string;
  tglDaftar: string;
  sekolah: string;
  tanggal_lahir?: string;
  desa?: string;
}

const statusColor: Record<string, string> = {
  Diverifikasi: 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
  Valid: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
  'Menunggu Verifikasi': 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300',
  Ditolak: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300',
  Cadangan: 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300',
};

const jalurIcon: Record<string, React.ElementType> = {
  Domisili: Home,
  Afirmasi: ShieldCheck,
  Mutasi: Truck,
};

export default function PengumumanPage() {
  const { items: data, loading } = useFirestoreCollection<Pendaftar>('spmb_sd');
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
            <a href="/spmb-sd" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Kembali</span>
            </a>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-yellow-400" />
              <h1 className="text-sm font-bold text-white uppercase tracking-wide">Pengumuman SPMB</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-8 border dark:border-slate-700">
          <h1 className="text-2xl font-bold text-[#0d3b66] dark:text-white mb-2">Pengumuman Hasil Seleksi</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Masukkan NIK untuk mengetahui hasil pendaftaran SPMB SD.
          </p>

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
            <div className="mt-6 flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          )}

          {!loading && cari && hasil === null && (
            <div className="mt-6 flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
              <XCircle className="w-4 h-4 shrink-0" />
              Data pendaftaran dengan NIK tersebut tidak ditemukan. Pastikan Anda sudah mendaftar melalui halaman pendaftaran SPMB.
            </div>
          )}

          {hasil && (
            <div className="mt-6 border dark:border-slate-700 rounded-2xl overflow-hidden">
              <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-4 border-b dark:border-slate-700 flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="font-semibold text-[#0d3b66] dark:text-white">Hasil Pendaftaran</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400">Nama Lengkap</p>
                    <p className="text-sm font-medium text-[#0d3b66] dark:text-white">{hasil.nama}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400">Usia</p>
                    <p className="text-sm font-medium text-[#0d3b66] dark:text-white">{hasil.usia} tahun</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400">Domisili</p>
                    <p className="text-sm font-medium text-[#0d3b66] dark:text-white">{hasil.desa || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  {hasil.jalur && (() => {
                    const Icon = jalurIcon[hasil.jalur] || Home;
                    return <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />;
                  })()}
                  <div>
                    <p className="text-xs text-gray-400">Jalur</p>
                    <p className="text-sm font-medium text-[#0d3b66] dark:text-white">{hasil.jalur}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <School className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400">Sekolah Tujuan</p>
                    <p className="text-sm font-medium text-[#0d3b66] dark:text-white">{hasil.sekolah}</p>
                  </div>
                </div>

                <div className={`flex items-center gap-2 rounded-xl px-4 py-4 border ${statusColor[hasil.status] || 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                  {hasil.status === 'Diverifikasi' || hasil.status === 'Valid' ? (
                    <CheckCircle className="w-6 h-6 shrink-0" />
                  ) : hasil.status === 'Cadangan' ? (
                    <Clock className="w-6 h-6 shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 shrink-0" />
                  )}
                  <div>
                    <p className="font-semibold text-base">
                      {hasil.status === 'Diverifikasi' || hasil.status === 'Valid' ? 'DITERIMA' :
                       hasil.status === 'Cadangan' ? 'CADANGAN' :
                       hasil.status === 'Ditolak' ? 'DITOLAK' : hasil.status}
                    </p>
                    <p className="text-sm opacity-80">
                      {hasil.status === 'Diverifikasi' || hasil.status === 'Valid'
                        ? 'Selamat! Anda dinyatakan diterima. Silakan lakukan daftar ulang.'
                        : hasil.status === 'Cadangan'
                        ? 'Anda berada di posisi cadangan. Akan diinformasikan lebih lanjut jika ada kuota.'
                        : hasil.status === 'Ditolak'
                        ? 'Mohon maaf, pendaftaran Anda belum dapat diterima.'
                        : 'Pendaftaran Anda masih dalam proses verifikasi.'}
                    </p>
                  </div>
                </div>

                {(hasil.status === 'Diverifikasi' || hasil.status === 'Valid') && (
                  <Link
                    href={`/spmb-sd/daftar-ulang?nik=${hasil.nik}`}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-xl transition-colors text-sm"
                  >
                    Lanjut ke Daftar Ulang <ArrowLeft className="w-4 h-4 rotate-180" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {!cari && !loading && (
            <div className="mt-6 bg-gray-50 dark:bg-slate-700/30 rounded-xl px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              Masukkan NIK 16 digit lalu klik tombol <strong>Cari</strong> untuk melihat hasil pendaftaran.
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
