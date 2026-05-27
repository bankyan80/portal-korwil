'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Search, Loader2, CheckCircle, XCircle, User, MapPin, School, Calendar, Home, ShieldCheck, Truck, AlertTriangle } from 'lucide-react';
import Footer from '@/components/portal/Footer';
import { useFirestoreCollection } from '@/hooks/use-firestore-collection';
import { apiSet } from '@/lib/api-firestore';
import { toast } from 'sonner';

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
  sekolahId?: string;
  tanggal_lahir?: string;
  desa?: string;
  no_hp?: string;
  nama_ayah?: string;
  nama_ibu?: string;
  daftarUlang?: boolean;
  tglDaftarUlang?: string;
}

const jalurIcon: Record<string, React.ElementType> = {
  Domisili: Home,
  Afirmasi: ShieldCheck,
  Mutasi: Truck,
};

export default function DaftarUlangPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items: data, loading } = useFirestoreCollection<Pendaftar>('spmb_sd');
  const [nik, setNik] = useState(searchParams.get('nik') || '');
  const [cari, setCari] = useState(!!searchParams.get('nik'));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const hasil = useMemo(() => {
    if (!nik || nik.length < 16 || !cari) return null;
    return data.find((d) => d.nik === nik) || null;
  }, [data, nik, cari]);

  const bisaDaftarUlang = hasil && (hasil.status === 'Diverifikasi' || hasil.status === 'Valid');
  const sudahDaftarUlang = hasil?.daftarUlang;

  async function handleDaftarUlang() {
    if (!hasil) return;
    setSubmitting(true);
    try {
      await apiSet('spmb_sd', hasil.id, {
        status: 'Diverifikasi',
        daftarUlang: true,
        tglDaftarUlang: new Date().toISOString().split('T')[0],
      }, true);
      toast.success('Daftar ulang berhasil dikonfirmasi');
      setConfirmOpen(false);
    } catch (e) {
      console.error('Error daftar ulang:', e);
      toast.error('Gagal melakukan daftar ulang. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

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
              <h1 className="text-sm font-bold text-white uppercase tracking-wide">Daftar Ulang</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-8 border dark:border-slate-700">
          <h1 className="text-2xl font-bold text-[#0d3b66] dark:text-white mb-2">Daftar Ulang</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Halaman ini khusus bagi calon siswa yang dinyatakan <strong>DITERIMA</strong> untuk melakukan daftar ulang.
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
              Data tidak ditemukan. Pastikan Anda sudah mendaftar SPMB.
            </div>
          )}

          {hasil && !bisaDaftarUlang && !sudahDaftarUlang && (
            <div className="mt-6 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Status pendaftaran Anda saat ini: <strong>{hasil.status}</strong>. Hanya calon siswa dengan status Diterima yang dapat melakukan daftar ulang.
              <Link href="/spmb-sd/pengumuman" className="ml-1 underline font-medium">Cek pengumuman</Link>
            </div>
          )}

          {hasil && bisaDaftarUlang && (
            <>
              <div className="mt-6 border dark:border-slate-700 rounded-2xl overflow-hidden">
                <div className="bg-green-50 dark:bg-green-900/20 px-6 py-4 border-b dark:border-slate-700 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h2 className="font-semibold text-green-800 dark:text-green-300">Data Calon Siswa Diterima</h2>
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

                  {sudahDaftarUlang ? (
                    <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      Anda sudah melakukan daftar ulang pada tanggal {hasil.tglDaftarUlang || '-'}.
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmOpen(true)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-xl transition-colors text-sm"
                    >
                      Konfirmasi Daftar Ulang
                    </button>
                  )}
                </div>
              </div>

              {confirmOpen && (
                <div className="mt-4 border dark:border-slate-700 rounded-2xl p-6 bg-white dark:bg-slate-800 shadow-lg">
                  <h3 className="font-semibold text-[#0d3b66] dark:text-white mb-2">Konfirmasi Daftar Ulang</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Dengan mengklik tombol di bawah, Anda menyatakan bahwa calon siswa <strong>{hasil.nama}</strong> benar-benar akan mendaftar di <strong>{hasil.sekolah}</strong> melalui jalur <strong>{hasil.jalur}</strong>.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmOpen(false)}
                      className="flex-1 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-medium px-4 py-2 rounded-xl transition-colors text-sm"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleDaftarUlang}
                      disabled={submitting}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium px-4 py-2 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      Ya, Konfirmasi Daftar Ulang
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
