'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, CheckCircle, XCircle, Loader2, User, MapPin, School, Calendar, Search, ArrowRight, AlertTriangle } from 'lucide-react';
import Footer from '@/components/portal/Footer';

function hitungUsia(tanggalLahir: string) {
  if (!tanggalLahir) return null;
  const [tahun, bulan, hari] = tanggalLahir.split('-').map(Number);
  const lahir = new Date(tahun, bulan - 1, hari);
  const today = new Date();
  let usia = today.getFullYear() - lahir.getFullYear();
  const selisihBulan = today.getMonth() - lahir.getMonth();
  if (selisihBulan < 0 || (selisihBulan === 0 && today.getDate() < lahir.getDate())) {
    usia--;
  }
  const totalBulan = (today.getFullYear() - lahir.getFullYear()) * 12 + (today.getMonth() - lahir.getMonth()) + (today.getDate() < lahir.getDate() ? -1 : 0);
  const tahunBulan = Math.floor(totalBulan / 12);
  const sisaBulan = totalBulan % 12;
  return { tahun: tahunBulan, bulan: sisaBulan, memenuhi: usia >= 6 };
}

export default function CekNikPage() {
  const router = useRouter();
  const [nik, setNik] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [usia, setUsia] = useState<{ tahun: number; bulan: number; memenuhi: boolean } | null>(null);
  const [manualTgl, setManualTgl] = useState('');
  const [manualUsia, setManualUsia] = useState<{ tahun: number; bulan: number; memenuhi: boolean } | null>(null);

  useEffect(() => {
    if (nik.length === 16) {
      cariData();
    } else {
      setData(null);
      setNotFound(false);
      setUsia(null);
      setManualUsia(null);
      setManualTgl('');
    }
  }, [nik]);

  async function cariData() {
    setLoading(true);
    setData(null);
    setNotFound(false);
    setUsia(null);
    setManualUsia(null);
    setManualTgl('');
    try {
      const res = await fetch(`/api/siswa/lookup?nik=${nik}`);
      const json = await res.json();
      if (json.found) {
        setData(json.siswa);
        const u = hitungUsia(json.siswa.tanggal_lahir);
        setUsia(u);
      } else {
        setNotFound(true);
      }
    } catch (e) {
      console.error('Error looking up NIK:', e);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  function cekManualUsia() {
    setManualUsia(hitungUsia(manualTgl));
  }

  function goToDaftar(dataSiswa?: any) {
    if (dataSiswa) {
      const params = new URLSearchParams({
        nik: dataSiswa.nik,
        nama: dataSiswa.nama || '',
        nisn: dataSiswa.nisn || '',
        tgl: dataSiswa.tanggal_lahir || '',
        jk: dataSiswa.jk || '',
        desa: dataSiswa.desa || '',
      });
      router.push(`/spmb-sd/daftar?${params.toString()}`);
    } else {
      router.push(`/spmb-sd/daftar?nik=${nik}`);
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
              <h1 className="text-sm font-bold text-white uppercase tracking-wide">Cek NIK</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-8 border dark:border-slate-700">
          <h1 className="text-2xl font-bold text-[#0d3b66] dark:text-white mb-2">Cek NIK</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Masukkan NIK untuk menampilkan informasi calon siswa</p>

          <div className="relative">
            <input
              type="text"
              placeholder="Masukkan NIK (16 digit)"
              value={nik}
              onChange={(e) => setNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
              className="w-full border dark:border-slate-700 rounded-xl p-3 pl-10 text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 animate-spin" />}
          </div>

          {notFound && (
            <div className="mt-6 flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              NIK tidak ditemukan dalam database. Silakan cek usia manual di bawah.
            </div>
          )}

          {data && usia && (
            <div className="mt-6 border dark:border-slate-700 rounded-2xl overflow-hidden">
              <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-4 border-b dark:border-slate-700">
                <h2 className="font-semibold text-[#0d3b66] dark:text-white">Informasi Calon Siswa</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400">Nama</p>
                    <p className="text-sm font-medium text-[#0d3b66] dark:text-white">{data.nama}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400">Usia</p>
                    <p className="text-sm font-medium text-[#0d3b66] dark:text-white">{usia.tahun} tahun {usia.bulan} bulan</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400">Domisili</p>
                    <p className="text-sm font-medium text-[#0d3b66] dark:text-white">{data.desa || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <School className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400">Asal Sekolah</p>
                    <p className="text-sm font-medium text-[#0d3b66] dark:text-white">{data.sekolah || '-'}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
                  usia.memenuhi ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                }`}>
                  {usia.memenuhi ? <CheckCircle className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
                  {usia.memenuhi ? 'Usia memenuhi syarat' : 'Usia belum memenuhi syarat'}
                </div>
                {usia.memenuhi && (
                  <button onClick={() => goToDaftar(data)}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-xl transition-colors text-sm">
                    Daftar Sekarang <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {notFound && (
            <div className="mt-6 border dark:border-slate-700 rounded-2xl overflow-hidden">
              <div className="bg-amber-50 dark:bg-amber-900/20 px-6 py-4 border-b dark:border-slate-700">
                <h2 className="font-semibold text-amber-800 dark:text-amber-300">Cek Usia Manual</h2>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Masukkan tanggal lahir untuk mengecek usia</p>
                <input type="date" value={manualTgl} onChange={(e) => { setManualTgl(e.target.value); setManualUsia(null); }}
                  className="w-full border dark:border-slate-700 rounded-xl p-3 text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                <button onClick={cekManualUsia} disabled={!manualTgl}
                  className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-slate-400 text-white font-medium px-6 py-3 rounded-xl transition-colors text-sm">
                  Cek Usia
                </button>
                {manualUsia && (
                  <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
                    manualUsia.memenuhi ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                  }`}>
                    {manualUsia.memenuhi ? <CheckCircle className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
                    <span>{manualUsia.tahun} tahun {manualUsia.bulan} bulan — {manualUsia.memenuhi ? 'Usia memenuhi syarat' : 'Usia belum memenuhi syarat'}</span>
                  </div>
                )}
                {manualUsia?.memenuhi && (
                  <button onClick={() => goToDaftar()}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-xl transition-colors text-sm">
                    Daftar Sekarang <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
