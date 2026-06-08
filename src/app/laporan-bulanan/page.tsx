'use client';

import { useEffect, useState } from 'react';
import {
  CalendarDays, Users, BookOpen, GraduationCap, ExternalLink,
  Loader2, BarChart3, School, ChevronDown,
} from 'lucide-react';

const bulanList = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

interface RekapData {
  success: boolean;
  tahun: number;
  totalSekolah: number;
  totalPegawai: number;
  totalSiswa: number;
  bulan: {
    nama: string;
    index: number;
    pegawai: { total: number; l: number; p: number; guru: number; tendik: number };
    siswa: { total: number; l: number; p: number; perKelas: Record<string, number> };
  }[];
  sekolah: string[];
}

export default function LaporanBulananPage() {
  const [data, setData] = useState<RekapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [tahun, setTahun] = useState(new Date().getFullYear());

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

  const selected = selectedMonth ? data.bulan.find((b) => b.index === selectedMonth) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-blue-700" />
              Laporan Bulanan
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Data pegawai dan peserta didik Kecamatan Lemahabang, Kabupaten Cirebon
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={tahun}
              onChange={(e) => setTahun(Number(e.target.value))}
              className="text-sm border rounded-lg px-3 py-2 bg-white shadow-sm"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
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
                <GraduationCap className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {data.totalPegawai + data.totalSiswa}
                </p>
                <p className="text-xs text-muted-foreground">Total Keseluruhan</p>
              </div>
            </div>
          </div>
        </div>

        {/* Month Grid */}
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-700" />
            Pilih Bulan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.bulan.map((b) => {
              const isSelected = selectedMonth === b.index;
              return (
                <button
                  key={b.index}
                  onClick={() => setSelectedMonth(isSelected ? null : b.index)}
                  className={`text-left bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-all ${
                    isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-slate-800">{b.nama}</span>
                    <span className="text-xs text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-full">
                      {tahun}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        Pegawai
                      </span>
                      <span className="font-semibold text-slate-800">{b.pegawai.total}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pl-5">
                      <span>Guru {b.pegawai.guru} / Tendik {b.pegawai.tendik}</span>
                      <span>L {b.pegawai.l} / P {b.pegawai.p}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                        Siswa
                      </span>
                      <span className="font-semibold text-slate-800">{b.siswa.total}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pl-5">
                      <span>SD/TK/KB</span>
                      <span>L {b.siswa.l} / P {b.siswa.p}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t flex items-center justify-between">
                    <a
                      href="https://simpeg-tim.vercel.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                    >
                      <ExternalLink className="w-3 h-3" /> SIMPEG
                    </a>
                    <a
                      href="https://simdawa.vercel.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1 font-medium"
                    >
                      <ExternalLink className="w-3 h-3" /> SIMDAWA
                    </a>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-700" />
                Detail Laporan {selected.nama} {tahun}
              </h3>
              <button
                onClick={() => setSelectedMonth(null)}
                className="text-xs text-muted-foreground hover:text-slate-800"
              >
                Tutup
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pegawai Detail */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Data Pegawai
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Total Pegawai</span>
                    <span className="font-semibold">{selected.pegawai.total}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Guru</span>
                    <span className="font-semibold">{selected.pegawai.guru}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Tenaga Kependidikan</span>
                    <span className="font-semibold">{selected.pegawai.tendik}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Laki-laki</span>
                    <span className="font-semibold">{selected.pegawai.l}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Perempuan</span>
                    <span className="font-semibold">{selected.pegawai.p}</span>
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

              {/* Siswa Detail */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  Data Siswa
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Total Siswa</span>
                    <span className="font-semibold">{selected.siswa.total}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Laki-laki</span>
                    <span className="font-semibold">{selected.siswa.l}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Perempuan</span>
                    <span className="font-semibold">{selected.siswa.p}</span>
                  </div>
                  <div className="pt-2">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Per Kelas</p>
                    <div className="grid grid-cols-3 gap-1">
                      {Object.entries(selected.siswa.perKelas)
                        .filter(([k]) => k !== 'unknown')
                        .sort(([a], [b]) => Number(a) - Number(b))
                        .map(([kelas, count]) => (
                          <div key={kelas} className="flex justify-between text-xs bg-slate-50 rounded px-2 py-1">
                            <span>Kelas {kelas}</span>
                            <span className="font-semibold">{count}</span>
                          </div>
                        ))}
                      {selected.siswa.perKelas['unknown'] && (
                        <div className="flex justify-between text-xs bg-slate-50 rounded px-2 py-1">
                          <span>PAUD/KB</span>
                          <span className="font-semibold">{selected.siswa.perKelas['unknown']}</span>
                        </div>
                      )}
                    </div>
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
