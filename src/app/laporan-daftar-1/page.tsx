'use client';

import { useEffect, useState } from 'react';
import {
  Users, BookOpen, ExternalLink,
  Loader2, BarChart3, School, ChevronDown, Table,
} from 'lucide-react';

interface JenjangData {
  pegawai: { total: number; l: number; p: number; guru: number; tendik: number };
  siswa: { total: number; l: number; p: number };
}

interface RekapData {
  success: boolean;
  tahun: number;
  totalSekolah: number;
  totalPegawai: number;
  totalSiswa: number;
  sd: { pegawai: number; siswa: number };
  tkKb: { pegawai: number; siswa: number };
  bulan: {
    nama: string;
    index: number;
    sd: JenjangData;
    tkKb: JenjangData;
  }[];
  sekolah: string[];
}

export default function LaporanDaftar1Page() {
  const [data, setData] = useState<RekapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailMonth, setDetailMonth] = useState<number | null>(null);
  const [detailJenjang, setDetailJenjang] = useState<'sd' | 'tkKb'>('sd');

  useEffect(() => {
    setLoading(true);
    fetch('/api/laporan-bulanan/rekap')
      .then((r) => r.json())
      .then((d) => { setData(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-700 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Memuat data laporan...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-red-600">Gagal memuat data.</p>
      </div>
    );
  }

  const selected = detailMonth ? data.bulan.find((b) => b.index === detailMonth) : null;
  const selJenjang = selected ? (detailJenjang === 'sd' ? selected.sd : selected.tkKb) : null;

  const totalRow = {
    sdPegawai: data.bulan.reduce((s, b) => s + b.sd.pegawai.total, 0) / data.bulan.length,
    tkPegawai: data.bulan.reduce((s, b) => s + b.tkKb.pegawai.total, 0) / data.bulan.length,
    sdSiswa: data.bulan.reduce((s, b) => s + b.sd.siswa.total, 0) / data.bulan.length,
    tkSiswa: data.bulan.reduce((s, b) => s + b.tkKb.siswa.total, 0) / data.bulan.length,
  };

  const totalPegawai = totalRow.sdPegawai + totalRow.tkPegawai;
  const totalSiswa = totalRow.sdSiswa + totalRow.tkSiswa;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-blue-700" />
              Laporan Daftar 1
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Data pegawai dan peserta didik per jenjang Kecamatan Lemahabang, Kabupaten Cirebon
            </p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <School className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{data.totalSekolah}</p>
                <p className="text-xs text-muted-foreground">Sekolah</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{data.totalPegawai}</p>
                <p className="text-xs text-muted-foreground">Total Pegawai</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{data.totalSiswa}</p>
                <p className="text-xs text-muted-foreground">Total Siswa</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Table className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">2</p>
                <p className="text-xs text-muted-foreground">Jenjang (SD & TK/KB)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabel Laporan */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b bg-slate-50 flex items-center gap-2">
            <Table className="w-5 h-5 text-blue-700" />
            <h2 className="font-semibold text-slate-800">Rekap Data Per Jenjang</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-600 w-10">No</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Bulan</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-center border-l" colSpan={2}>
                    SD
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-center border-l" colSpan={2}>
                    TK/KB
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-center border-l" colSpan={2}>
                    Total
                  </th>
                </tr>
                <tr className="bg-slate-50 text-xs text-muted-foreground">
                  <th colSpan={2}></th>
                  <th className="px-3 py-2 text-center border-l font-medium">Pegawai</th>
                  <th className="px-3 py-2 text-center font-medium">Siswa</th>
                  <th className="px-3 py-2 text-center border-l font-medium">Pegawai</th>
                  <th className="px-3 py-2 text-center font-medium">Siswa</th>
                  <th className="px-3 py-2 text-center border-l font-medium">Pegawai</th>
                  <th className="px-3 py-2 text-center font-medium">Siswa</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.bulan.map((b, i) => {
                  const isDetail = detailMonth === b.index;
                  return (
                    <tr key={b.index}>
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setDetailMonth(isDetail ? null : b.index)}
                          className="font-medium text-slate-800 hover:text-blue-700 transition-colors"
                        >
                          {b.nama}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center border-l font-semibold">{b.sd.pegawai.total}</td>
                      <td className="px-4 py-3 text-center font-semibold">{b.sd.siswa.total}</td>
                      <td className="px-4 py-3 text-center border-l font-semibold">{b.tkKb.pegawai.total}</td>
                      <td className="px-4 py-3 text-center font-semibold">{b.tkKb.siswa.total}</td>
                      <td className="px-4 py-3 text-center border-l font-bold text-blue-800">
                        {b.sd.pegawai.total + b.tkKb.pegawai.total}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-purple-800">
                        {b.sd.siswa.total + b.tkKb.siswa.total}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-800">
                  <td colSpan={2} className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-center border-l">{data.sd.pegawai}</td>
                  <td className="px-4 py-3 text-center">{data.sd.siswa}</td>
                  <td className="px-4 py-3 text-center border-l">{data.tkKb.pegawai}</td>
                  <td className="px-4 py-3 text-center">{data.tkKb.siswa}</td>
                  <td className="px-4 py-3 text-center border-l text-blue-800">{data.totalPegawai}</td>
                  <td className="px-4 py-3 text-center text-purple-800">{data.totalSiswa}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="px-5 py-4 border-b bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-700" />
                Detail {selected.nama}
              </h3>
              <button
                onClick={() => setDetailMonth(null)}
                className="text-xs text-muted-foreground hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-200"
              >
                Tutup
              </button>
            </div>

            <div className="flex border-b">
              <button
                onClick={() => setDetailJenjang('sd')}
                className={`flex-1 px-4 py-2.5 text-sm font-medium text-center transition-colors ${
                  detailJenjang === 'sd'
                    ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50'
                    : 'text-muted-foreground hover:bg-slate-50'
                }`}
              >
                SD
              </button>
              <button
                onClick={() => setDetailJenjang('tkKb')}
                className={`flex-1 px-4 py-2.5 text-sm font-medium text-center transition-colors ${
                  detailJenjang === 'tkKb'
                    ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50'
                    : 'text-muted-foreground hover:bg-slate-50'
                }`}
              >
                TK/KB
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Data Pegawai
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-semibold">{selJenjang!.pegawai.total}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Guru</span>
                    <span className="font-semibold">{selJenjang!.pegawai.guru}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Tenaga Kependidikan</span>
                    <span className="font-semibold">{selJenjang!.pegawai.tendik}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Laki-laki</span>
                    <span className="font-semibold">{selJenjang!.pegawai.l}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Perempuan</span>
                    <span className="font-semibold">{selJenjang!.pegawai.p}</span>
                  </div>
                </div>
                <a
                  href="https://simpeg-tim.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Lihat Detail di SIMPEG
                </a>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  Data Siswa
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-semibold">{selJenjang!.siswa.total}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Laki-laki</span>
                    <span className="font-semibold">{selJenjang!.siswa.l}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Perempuan</span>
                    <span className="font-semibold">{selJenjang!.siswa.p}</span>
                  </div>
                </div>
                <a
                  href="https://simdawa.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Lihat Detail di SIMDAWA
                </a>
              </div>
            </div>
          </div>
        )}

        {/* School List */}
        <details className="bg-white rounded-xl border p-4 shadow-sm">
          <summary className="text-sm font-semibold text-slate-700 cursor-pointer flex items-center gap-2">
            <ChevronDown className="w-4 h-4" />
            Daftar Sekolah ({data.sekolah.length})
          </summary>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1">
            {data.sekolah.map((s) => (
              <span key={s} className="text-xs text-muted-foreground px-2 py-1 bg-slate-50 rounded">
                {s}
              </span>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
