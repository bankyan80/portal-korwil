'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, FileText, Home, ShieldCheck, Truck, CheckCircle, AlertTriangle, MapPin, School, Loader2 } from 'lucide-react';
import Footer from '@/components/portal/Footer';
import { sekolahSD } from '@/data/sekolah';

function hitungUsia(tanggalLahir: string): number {
  if (!tanggalLahir) return 0;
  const [tahun, bulan, hari] = tanggalLahir.split('-').map(Number);
  const lahir = new Date(tahun, bulan - 1, hari);
  const today = new Date();
  let usia = today.getFullYear() - lahir.getFullYear();
  const selisihBulan = today.getMonth() - lahir.getMonth();
  if (selisihBulan < 0 || (selisihBulan === 0 && today.getDate() < lahir.getDate())) usia--;
  return Math.max(0, usia);
}

const MIN_USIA = 6;

const jalurList = [
  { value: 'Domisili', icon: Home, color: 'blue' },
  { value: 'Afirmasi', icon: ShieldCheck, color: 'green' },
  { value: 'Mutasi', icon: Truck, color: 'purple' },
];

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
};

function FormPendaftaranContent() {
  const searchParams = useSearchParams();
  const [jalur, setJalur] = useState('Domisili');
  const [nik, setNik] = useState('');
  const [nisn, setNisn] = useState('');
  const [nama, setNama] = useState('');
  const [tempatLahir, setTempatLahir] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState('');
  const [desa, setDesa] = useState('');
  const [namaAyah, setNamaAyah] = useState('');
  const [namaIbu, setNamaIbu] = useState('');
  const [hpOrtu, setHpOrtu] = useState('');
  const [pekerjaan, setPekerjaan] = useState('');
  const [fromDb, setFromDb] = useState(false);
  const [sekolahId, setSekolahId] = useState('');
  const selectedSekolah = sekolahSD.find((s) => s.npsn === sekolahId);

  useEffect(() => {
    const nikParam = searchParams.get('nik') || '';
    const namaParam = searchParams.get('nama') || '';
    const nisnParam = searchParams.get('nisn') || '';
    const tglParam = searchParams.get('tgl') || '';
    const jkParam = searchParams.get('jk') || '';
    const desaParam = searchParams.get('desa') || '';

    setNik(nikParam);
    setNisn(nisnParam);
    setNama(namaParam);
    setTanggalLahir(tglParam);
    setDesa(desaParam);
    if (jkParam) setJenisKelamin(jkParam === 'L' ? 'Laki-laki' : 'Perempuan');
    if (namaParam) setFromDb(true);
  }, [searchParams]);

  const selectedJalur = jalurList.find((j) => j.value === jalur);

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
              <h1 className="text-sm font-bold text-white uppercase tracking-wide">Formulir Pendaftaran</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-8 border dark:border-slate-700">
          <h1 className="text-2xl font-bold text-[#0d3b66] dark:text-white mb-6">Formulir Pendaftaran SPMB SD</h1>

          {fromDb && (
            <div className="mb-6 flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 text-sm text-green-700 dark:text-green-300">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Data ditemukan, form terisi otomatis. Silakan periksa dan lengkapi data lainnya.
            </div>
          )}
          {fromDb && tanggalLahir && (() => {
            const u = hitungUsia(tanggalLahir);
            const underAge = u < MIN_USIA;
            return (
              <div className={`mb-6 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
                underAge
                  ? 'bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
                  : 'bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
              }`}>
                {underAge ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
                Usia calon siswa: <strong>{u} tahun</strong>
                {underAge ? ` — belum memenuhi syarat minimal ${MIN_USIA} tahun, formulir tidak bisa dikirim` : ` — memenuhi syarat`}
              </div>
            );
          })()}
          {!fromDb && nik && (
            <div className="mb-6 flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Data tidak ditemukan di database. Silakan isi formulir secara manual.
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">NIK *</label>
              <input placeholder="Masukkan NIK (16 digit)" value={nik} onChange={(e) => setNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
                className="border dark:border-slate-700 p-3 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">NISN</label>
              <input placeholder="NISN" value={nisn} onChange={(e) => setNisn(e.target.value)}
                className="border dark:border-slate-700 p-3 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nama Lengkap *</label>
              <input placeholder="Nama Lengkap" value={nama} onChange={(e) => setNama(e.target.value)}
                className="border dark:border-slate-700 p-3 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Jenis Kelamin</label>
              <select value={jenisKelamin} onChange={(e) => setJenisKelamin(e.target.value)}
                className="border dark:border-slate-700 p-3 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full">
                <option value="">Pilih</option>
                <option>Laki-laki</option>
                <option>Perempuan</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tempat Lahir *</label>
              <input placeholder="Tempat Lahir" value={tempatLahir} onChange={(e) => setTempatLahir(e.target.value)}
                className="border dark:border-slate-700 p-3 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tanggal Lahir *</label>
              <input type="date" value={tanggalLahir} onChange={(e) => setTanggalLahir(e.target.value)}
                className="border dark:border-slate-700 p-3 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Desa</label>
              <input placeholder="Desa" value={desa} onChange={(e) => setDesa(e.target.value)}
                className="border dark:border-slate-700 p-3 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Jalur Pendaftaran *</label>
              <select value={jalur} onChange={(e) => setJalur(e.target.value)}
                className="border dark:border-slate-700 p-3 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full">
                <option>Domisili</option>
                <option>Afirmasi</option>
                <option>Mutasi</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Pilih Sekolah *</label>
              <select value={sekolahId} onChange={(e) => setSekolahId(e.target.value)}
                className="border dark:border-slate-700 p-3 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full">
                <option value="">Pilih Sekolah</option>
                {sekolahSD.map((s) => <option key={s.npsn} value={s.npsn}>{s.nama}</option>)}
              </select>
              {selectedSekolah && (
                <div className="mt-3 flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3">
                  <School className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-[#0d3b66] dark:text-white">{selectedSekolah.nama}</p>
                    <p className="text-gray-500 dark:text-gray-400">Kuota: {selectedSekolah.dayaTampung} siswa</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-[#0d3b66] dark:text-white mb-4">Data Orang Tua</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nama Ayah *</label>
                <input placeholder="Nama Ayah" value={namaAyah} onChange={(e) => setNamaAyah(e.target.value)}
                  className="border dark:border-slate-700 p-3 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nama Ibu *</label>
                <input placeholder="Nama Ibu" value={namaIbu} onChange={(e) => setNamaIbu(e.target.value)}
                  className="border dark:border-slate-700 p-3 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nomor HP *</label>
                <input placeholder="Nomor HP" value={hpOrtu} onChange={(e) => setHpOrtu(e.target.value)}
                  className="border dark:border-slate-700 p-3 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Pekerjaan</label>
                <input placeholder="Pekerjaan" value={pekerjaan} onChange={(e) => setPekerjaan(e.target.value)}
                  className="border dark:border-slate-700 p-3 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full" />
              </div>
            </div>
          </div>

          <div className={`mt-8 border rounded-2xl p-6 ${colorMap[jalurList.find((j) => j.value === jalur)?.color || 'blue']}`}>
            <div className="flex items-center gap-2 mb-4">
              {selectedJalur && <selectedJalur.icon className="w-5 h-5" />}
              <h3 className="font-semibold text-lg text-[#0d3b66] dark:text-white">Upload Dokumen {jalur}</h3>
            </div>
            {jalur === 'Domisili' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Upload Kartu Keluarga (KK) *</label>
                  <input type="file" className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tanggal Penerbitan KK *</label>
                  <input type="date" className="w-full border dark:border-slate-700 rounded-xl p-3 text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                </div>
              </div>
            )}
            {jalur === 'Afirmasi' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Jenis Bantuan</label>
                  <select className="w-full border dark:border-slate-700 rounded-xl p-3 text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                    <option value="">Pilih jenis bantuan</option>
                    <option>KIP</option>
                    <option>PKH</option>
                    <option>KKS</option>
                    <option>DTKS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Upload Kartu Bantuan *</label>
                  <input type="file" className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-green-50 dark:file:bg-green-900/30 file:text-green-700 dark:file:text-green-400 hover:file:bg-green-100" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Upload Surat Keterangan Tidak Mampu *</label>
                  <input type="file" className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-green-50 dark:file:bg-green-900/30 file:text-green-700 dark:file:text-green-400 hover:file:bg-green-100" />
                </div>
              </div>
            )}
            {jalur === 'Mutasi' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Upload Surat Tugas *</label>
                  <input type="file" className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-purple-50 dark:file:bg-purple-900/30 file:text-purple-700 dark:file:text-purple-400 hover:file:bg-purple-100" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Upload SK Mutasi *</label>
                  <input type="file" className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-purple-50 dark:file:bg-purple-900/30 file:text-purple-700 dark:file:text-purple-400 hover:file:bg-purple-100" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Alamat Tempat Tugas Baru *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input placeholder="Masukkan alamat tempat tugas baru" className="w-full border dark:border-slate-700 rounded-xl p-3 pl-10 text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            disabled={!!(fromDb && tanggalLahir && hitungUsia(tanggalLahir) < MIN_USIA)}
            className="mt-8 w-full bg-blue-700 hover:bg-blue-800 text-white font-medium px-8 py-3 rounded-xl transition-colors text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Submit Pendaftaran
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function FormPendaftaranPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    }>
      <FormPendaftaranContent />
    </Suspense>
  );
}
