'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { auth } from '@/lib/firebase';
import { Shield, LogOut, Loader2, Search, CheckCircle, XCircle, AlertTriangle, BarChart3 } from 'lucide-react';
import type { SchoolCompleteness } from '@/app/api/validator/kelengkapan/route';

export default function ValidatorPage() {
  const { user, setUser } = useAppStore();
  const router = useRouter();
  const [data, setData] = useState<SchoolCompleteness[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterJenjang, setFilterJenjang] = useState('all');

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'super_admin') { router.push('/login'); return; }
    fetchData();
  }, [user, router]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch('/api/validator/kelengkapan');
      const json = await res.json();
      if (json.success) {
        setData(json.schools);
        setSummary(json.ringkasan);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    if (auth) auth.signOut();
    setUser(null);
    router.push('/');
  }

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterJenjang !== 'all') items = items.filter(s => s.jenjang === filterJenjang);
    if (search) items = items.filter(s => s.nama.toLowerCase().includes(search.toLowerCase()));
    return items;
  }, [data, filterJenjang, search]);

  function getScoreColor(score: number): string {
    if (score === 100) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }

  function getScoreBg(score: number): string {
    if (score === 100) return 'bg-green-100 border-green-300';
    if (score >= 60) return 'bg-yellow-100 border-yellow-300';
    return 'bg-red-100 border-red-300';
  }

  if (!user) return null;
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5" /> Validasi Kelengkapan Data
          </h1>
          <p className="text-sm text-blue-200">{user.displayName}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/super')} className="text-sm text-blue-300 hover:text-blue-200">Dashboard</button>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-300 hover:text-red-200">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white rounded-xl border p-4">
              <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
              <p className="text-xs text-gray-500">Total Sekolah</p>
            </div>
            <div className="bg-white rounded-xl border p-4 border-green-300">
              <p className="text-2xl font-bold text-green-600">{summary.lengkap}</p>
              <p className="text-xs text-gray-500">Lengkap (100%)</p>
            </div>
            <div className="bg-white rounded-xl border p-4 border-yellow-300">
              <p className="text-2xl font-bold text-yellow-600">{summary.kurang}</p>
              <p className="text-xs text-gray-500">Kurang Lengkap</p>
            </div>
            <div className="bg-white rounded-xl border p-4 border-red-300">
              <p className="text-2xl font-bold text-red-600">{summary.kosong}</p>
              <p className="text-xs text-gray-500">Kosong (0%)</p>
            </div>
            <div className="bg-white rounded-xl border p-4 border-blue-300">
              <p className="text-2xl font-bold text-blue-600">{summary.rataSkor}%</p>
              <p className="text-xs text-gray-500">Rata-rata Skor</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari sekolah..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm border rounded-lg bg-white w-full" />
          </div>
          {['all', 'SD', 'TK', 'KB'].map(j => (
            <button key={j} onClick={() => setFilterJenjang(j)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterJenjang === j ? 'bg-blue-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>{j === 'all' ? 'Semua' : j}</button>
          ))}
          <button onClick={fetchData} disabled={loading}
            className="px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-gray-100 flex items-center gap-1">
            <Loader2 className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Muat Ulang
          </button>
        </div>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-600">#</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Sekolah</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-center">Jenjang</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-center">Skor</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-center">Siswa</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-center">Pegawai</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-center">Sarpras</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-center">Laporan</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-center">Profil</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((s, i) => (
                  <tr key={s.npsn} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 text-xs">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{s.nama}</div>
                      <div className="text-xs text-gray-400">{s.desa} • {s.status}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        s.jenjang === 'SD' ? 'bg-blue-100 text-blue-700' :
                        s.jenjang === 'TK' ? 'bg-purple-100 text-purple-700' : 'bg-pink-100 text-pink-700'
                      }`}>{s.jenjang}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${getScoreBg(s.skor)}`}>
                        {s.skor === 100 ? <CheckCircle className="w-3 h-3" /> : s.skor === 0 ? <XCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {s.skor}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs ${s.siswa.ada ? 'text-green-600' : 'text-red-500'}`}>
                        {s.siswa.ada ? `${s.siswa.total}` : '✗'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs ${s.pegawai.ada ? 'text-green-600' : 'text-red-500'}`}>
                        {s.pegawai.ada ? `${s.pegawai.total}` : '✗'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs ${s.sarpras.ada ? 'text-green-600' : 'text-red-500'}`}
                        title={s.sarpras.message}>
                        {s.sarpras.ada ? `${s.sarpras.fieldsFilled}/${s.sarpras.totalFields}` : '✗'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs ${s.laporan.ada ? 'text-green-600' : 'text-red-500'}`}>
                        {s.laporan.ada ? `${s.laporan.total}` : '✗'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs ${s.profil.ada ? 'text-green-600' : 'text-red-500'}`}>
                        {s.profil.ada ? '✓' : '✗'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t text-xs text-gray-500">
            Menampilkan {filtered.length} dari {data.length} sekolah
          </div>
        </div>
      </main>
    </div>
  );
}
