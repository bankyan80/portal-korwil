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

interface BulanData {
  nama: string;
  index: number;
  calIndex: number;
  tahun: number;
  status: 'sudah' | 'belum';
  sd: JenjangData;
  tkKb: JenjangData;
}

interface RekapData {
  success: boolean;
  tahunAjaran: string;
  totalSekolah: number;
  totalPegawai: number;
  totalSiswa: number;
  sd: { pegawai: number; siswa: number };
  tkKb: { pegawai: number; siswa: number };
  bulan: BulanData[];
  sekolah: string[];
}

function getCurrentTa(): string {
  const now = new Date();
  const m = now.getMonth() + 1;
  const y = now.getFullYear();
  if (m >= 7) return `${y}/${y + 1}`;
  return `${y - 1}/${y}`;
}

function taOptions(): string[] {
  const now = new Date();
  const m = now.getMonth() + 1;
  const y = now.getFullYear();
  const currentStart = m >= 7 ? y : y - 1;
  return [
    `${currentStart - 1}/${currentStart}`,
    `${currentStart}/${currentStart + 1}`,
    `${currentStart + 1}/${currentStart + 2}`,
  ];
}

export default function LaporanDaftar1Page() {
  const [data, setData] = useState<RekapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tahunAjaran, setTahunAjaran] = useState(getCurrentTa());
  const [detailMonth, setDetailMonth] = useState<number | null>(null);
  const [detailJenjang, setDetailJenjang] = useState<'sd' | 'tkKb'>('sd');

  useEffect(() => {
    setLoading(true);
    setDetailMonth(null);
    fetch(`/api/laporan-bulanan/rekap?tahunAjaran=${encodeURIComponent(tahunAjaran)}`)
      .then((r) => r.json())
      .then((d) => { setData(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tahunAjaran]);

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

  const totalSudah = data.bulan.filter((b) => b.status === 'sudah').length;
  const totalBelum = data.bulan.filter((b) => b.status === 'belum').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-blue-700" />
              DAFTAR 1
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Data pegawai dan peserta didik per jenjang Kecamatan Lemahabang, Kabupaten Cirebon
            </p>
          </div>
          <select
            value={tahunAjaran}
            onChange={(e) => setTahunAjaran(e.target.value)}
            className="text-sm border rounded-lg px-3 py-2 bg-white shadow-sm font-medium"
          >
            {taOptions().map((ta) => (
              <option key={ta} value={ta}>T.A. {ta}</option>
            ))}
          </select>
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
                <p className="text-2xl font-bold text-slate-900">{totalSudah}</p>
                <p className="text-xs text-muted-foreground">Sudah Lapor ({totalBelum} belum)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabel Laporan */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b bg-slate-50 flex items-center gap-2">
            <Table className="w-5 h-5 text-blue-700" />
            <h2 className="font-semibold text-slate-800">
              Rekap Data – Tahun Ajaran {data.tahunAjaran}
            </h2>
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
                  <th className="px-4 py-3 font-semibold text-slate-600 text-center border-l">Status</th>
                </tr>
                <tr className="bg-slate-50 text-xs text-muted-foreground">
                  <th colSpan={2}></th>
                  <th className="px-3 py-2 text-center border-l font-medium">Pegawai</th>
                  <th className="px-3 py-2 text-center font-medium">Siswa</th>
                  <th className="px-3 py-2 text-center border-l font-medium">Pegawai</th>
                  <th className="px-3 py-2 text-center font-medium">Siswa</th>
                  <th className="px-3 py-2 text-center border-l font-medium">Pegawai</th>
                  <th className="px-3 py-2 text-center font-medium">Siswa</th>
                  <th className="px-3 py-2 text-center border-l"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.bulan.map((b, i) => {
                  const isDetail = detailMonth === b.index;
                  const isBelum = b.status === 'belum';
                  return (
                    <tr key={b.index} className={`${isBelum ? 'bg-gray-50 text-gray-400' : ''} ${isDetail ? 'bg-blue-50' : ''}`}>
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3">
                        {isBelum ? (
                          <span className="text-gray-400">{b.nama}</span>
                        ) : (
                          <button
                            onClick={() => setDetailMonth(isDetail ? null : b.index)}
                            className="font-medium text-slate-800 hover:text-blue-700 transition-colors"
                          >
                            {b.nama}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center border-l font-semibold">{b.sd.pegawai.total}</td>
                      <td className="px-4 py-3 text-center font-semibold">{b.sd.siswa.total}</td>
                      <td className="px-4 py-3 text-center border-l font-semibold">{b.tkKb.pegawai.total}</td>
                      <td className="px-4 py-3 text-center font-semibold">{b.tkKb.siswa.total}</td>
                      <td className="px-4 py-3 text-center border-l font-bold">{b.sd.pegawai.total + b.tkKb.pegawai.total}</td>
                      <td className="px-4 py-3 text-center font-bold">{b.sd.siswa.total + b.tkKb.siswa.total}</td>
                      <td className="px-4 py-3 text-center border-l">
                        {isBelum ? (
                          <span className="inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">
                            Belum Lapor
                          </span>
                        ) : (
                          <span className="inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            Sudah
                          </span>
                        )}
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
                  <td className="px-4 py-3 text-center border-l">{data.totalPegawai}</td>
                  <td className="px-4 py-3 text-center">{data.totalSiswa}</td>
                  <td className="px-4 py-3 text-center border-l">
                    <span className="text-xs text-muted-foreground">{totalSudah}/12</span>
                  </td>
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
                Detail Laporan {selected.nama} – T.A. {data.tahunAjaran}
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
