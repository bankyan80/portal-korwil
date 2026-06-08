'use client';

import { useEffect, useState } from 'react';
import {
  GraduationCap, Users, BookOpen,
  Loader2, School, Search,
} from 'lucide-react';

interface SekolahLulus {
  npsn: string;
  nama: string;
  l: number;
  p: number;
  total: number;
}

interface LulusData {
  success: boolean;
  total: number;
  totalL: number;
  totalP: number;
  jumlahSekolah: number;
  sekolah: SekolahLulus[];
}

export default function LaporanSiswaLulusPage() {
  const [data, setData] = useState<LulusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/siswa/lulus')
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
          <p className="text-sm text-muted-foreground">Memuat data siswa lulus...</p>
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

  const filtered = data.sekolah.filter(
    (s) =>
      s.nama.toLowerCase().includes(search.toLowerCase()) ||
      s.npsn.includes(search)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-blue-700" />
            Laporan Siswa Lulus
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Data calon lulus (Kelas 6) SD se-Kecamatan Lemahabang, Kabupaten Cirebon
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <School className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{data.jumlahSekolah}</p>
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
                <p className="text-2xl font-bold text-slate-900">{data.total}</p>
                <p className="text-xs text-muted-foreground">Total Siswa</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-cyan-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{data.totalL}</p>
                <p className="text-xs text-muted-foreground">Laki-laki</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-pink-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{data.totalP}</p>
                <p className="text-xs text-muted-foreground">Perempuan</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari sekolah atau NPSN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b bg-slate-50 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-700" />
            <h2 className="font-semibold text-slate-800">
              Daftar Calon Lulus per Sekolah
            </h2>
            <span className="text-xs text-muted-foreground ml-auto">
              {filtered.length} sekolah
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-600 w-10">No</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">NPSN</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Nama Sekolah</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-center">L</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-center">P</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-center">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((s, i) => (
                  <tr key={s.npsn} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.npsn}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{s.nama}</td>
                    <td className="px-4 py-3 text-center font-semibold text-cyan-700">{s.l}</td>
                    <td className="px-4 py-3 text-center font-semibold text-pink-700">{s.p}</td>
                    <td className="px-4 py-3 text-center font-bold text-slate-900">{s.total}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-800">
                  <td colSpan={3} className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-center text-cyan-700">{filtered.reduce((s, x) => s + x.l, 0)}</td>
                  <td className="px-4 py-3 text-center text-pink-700">{filtered.reduce((s, x) => s + x.p, 0)}</td>
                  <td className="px-4 py-3 text-center">{filtered.reduce((s, x) => s + x.total, 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <p className="font-semibold mb-1">Keterangan</p>
          <p>Data ini menampilkan siswa SD Kelas 6 yang tercatat di data Dapodik sebagai calon lulus. Jumlah total <strong>{data.total}</strong> siswa dari <strong>{data.jumlahSekolah}</strong> sekolah SD di Kecamatan Lemahabang.</p>
        </div>
      </div>
    </div>
  );
}
