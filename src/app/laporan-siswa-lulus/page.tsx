'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  GraduationCap, Users, BookOpen,
  Loader2, School, Search, ArrowRight, XCircle,
} from 'lucide-react';

interface SiswaAlumni {
  sekolah: string;
  jk: string;
}

interface AlumniSekolah {
  nama: string;
  l: number;
  p: number;
  total: number;
}

async function fetchAlumni(): Promise<SiswaAlumni[]> {
  const all: SiswaAlumni[] = [];
  const limit = 5000;
  let page = 1;
  while (true) {
    const res = await fetch(`/api/proxy/simdawa?page=${page}&limit=${limit}`);
    const json = await res.json();
    const data: any[] = json.siswa || [];
    if (data.length === 0) break;
    for (const s of data) {
      if (s.statusSiswa !== 'Aktif') continue;
      const kelas = (s.kelasKelompok || '').trim();
      if (kelas !== '6' && kelas !== 'VI') continue;
      all.push({
        sekolah: s.sekolah?.namaSekolah || '',
        jk: s.jenisKelamin === 'Laki-laki' ? 'L' : 'P',
      });
    }
    if (data.length < limit) break;
    page++;
  }
  return all;
}

export default function RekapAlumniPage() {
  const [alumni, setAlumni] = useState<SiswaAlumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'lulus' | 'lanjut' | 'tidak-lanjut'>('lulus');

  useEffect(() => {
    fetchAlumni()
      .then(setAlumni)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const perSekolah = useMemo(() => {
    const map = new Map<string, AlumniSekolah>();
    for (const s of alumni) {
      let entry = map.get(s.sekolah);
      if (!entry) {
        entry = { nama: s.sekolah, l: 0, p: 0, total: 0 };
        map.set(s.sekolah, entry);
      }
      entry.total++;
      if (s.jk === 'L') entry.l++;
      else entry.p++;
    }
    const list = Array.from(map.values());
    list.sort((a, b) => a.nama.localeCompare(b.nama));
    return list;
  }, [alumni]);

  const filtered = perSekolah.filter(
    (s) => s.nama.toLowerCase().includes(search.toLowerCase())
  );

  const totalL = perSekolah.reduce((s, x) => s + x.l, 0);
  const totalP = perSekolah.reduce((s, x) => s + x.p, 0);
  const totalAll = perSekolah.reduce((s, x) => s + x.total, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-700 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Memuat data alumni...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-blue-700" />
            Rekap Alumni SD
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Data kelulusan dan penelusuran alumni SD se-Kecamatan Lemahabang, Kabupaten Cirebon
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
                <p className="text-2xl font-bold text-slate-900">{perSekolah.length}</p>
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
                <p className="text-2xl font-bold text-slate-900">{totalAll}</p>
                <p className="text-xs text-muted-foreground">Total Alumni</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-cyan-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalL}</p>
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
                <p className="text-2xl font-bold text-slate-900">{totalP}</p>
                <p className="text-xs text-muted-foreground">Perempuan</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-white rounded-xl border shadow-sm overflow-hidden">
          <button
            onClick={() => setTab('lulus')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium text-center transition-colors ${
              tab === 'lulus'
                ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50'
                : 'text-muted-foreground hover:bg-slate-50'
            }`}
          >
            <GraduationCap className="w-4 h-4 inline mr-1.5" />
            Kelulusan
          </button>
          <button
            onClick={() => setTab('lanjut')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium text-center transition-colors ${
              tab === 'lanjut'
                ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50'
                : 'text-muted-foreground hover:bg-slate-50'
            }`}
          >
            <ArrowRight className="w-4 h-4 inline mr-1.5" />
            Melanjutkan
          </button>
          <button
            onClick={() => setTab('tidak-lanjut')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium text-center transition-colors ${
              tab === 'tidak-lanjut'
                ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50'
                : 'text-muted-foreground hover:bg-slate-50'
            }`}
          >
            <XCircle className="w-4 h-4 inline mr-1.5" />
            Tidak Melanjutkan
          </button>
        </div>

        {/* Tab Content */}
        {tab === 'lulus' && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-700" />
                <h2 className="font-semibold text-slate-800">
                  Rekap Kelulusan per Sekolah
                </h2>
                <span className="text-xs text-muted-foreground ml-2">
                  {filtered.length} sekolah
                </span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari sekolah..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full sm:w-64 pl-10 pr-4 py-1.5 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 text-left">
                    <th className="px-4 py-3 font-semibold text-slate-600 w-10">No</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Nama Sekolah</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-center">L</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-center">P</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-center">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((s, i) => (
                    <tr key={s.nama} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{s.nama}</td>
                      <td className="px-4 py-3 text-center font-semibold text-cyan-700">{s.l}</td>
                      <td className="px-4 py-3 text-center font-semibold text-pink-700">{s.p}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-900">{s.total}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-slate-800">
                    <td colSpan={2} className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-center text-cyan-700">{filtered.reduce((s, x) => s + x.l, 0)}</td>
                    <td className="px-4 py-3 text-center text-pink-700">{filtered.reduce((s, x) => s + x.p, 0)}</td>
                    <td className="px-4 py-3 text-center">{filtered.reduce((s, x) => s + x.total, 0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {tab === 'lanjut' && (
          <div className="bg-white rounded-xl border shadow-sm p-8 text-center">
            <ArrowRight className="w-12 h-12 text-blue-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-700">Rekap Siswa Melanjutkan</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Data siswa yang melanjutkan pendidikan ke jenjang SMP/MTs/sederajat akan ditampilkan di sini.
            </p>
          </div>
        )}

        {tab === 'tidak-lanjut' && (
          <div className="bg-white rounded-xl border shadow-sm p-8 text-center">
            <XCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-700">Rekap Siswa Tidak Melanjutkan</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Data siswa yang tidak melanjutkan pendidikan akan ditampilkan di sini.
            </p>
          </div>
        )}

        {/* Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <p className="font-semibold mb-1">Keterangan</p>
          <p>Data alumni menampilkan siswa SD Kelas 6 yang tercatat aktif di data SIMDAWA. Jumlah total <strong>{totalAll}</strong> alumni dari <strong>{perSekolah.length}</strong> sekolah SD di Kecamatan Lemahabang.</p>
        </div>
      </div>
    </div>
  );
}
