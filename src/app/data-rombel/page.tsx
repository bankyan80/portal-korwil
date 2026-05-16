'use client';

import { useState, useEffect, Fragment } from 'react';
import { ArrowLeft, Search, School, Baby, Users, BookOpen, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import Footer from '@/components/portal/Footer';
import { rombelData as fallbackRombel, type RombelEntry, type RombelDetail } from '@/data/rombel';

const jenjangList = ['SD', 'TK', 'KB'] as const;

const jenjangMeta: Record<string, { icon: typeof School; label: string }> = {
  SD: { icon: School, label: 'Sekolah Dasar' },
  TK: { icon: Baby, label: 'Taman Kanak-kanak' },
  KB: { icon: Baby, label: 'Kelompok Belajar' },
};

function aggregateRombel(students: any[]): RombelEntry[] {
  const bySchool = new Map<string, any[]>();
  for (const s of students) {
    const key = s.sekolah;
    if (!key) continue;
    if (!bySchool.has(key)) bySchool.set(key, []);
    bySchool.get(key)!.push(s);
  }

  const result: RombelEntry[] = [];
  for (const [schoolName, siswa] of bySchool) {
    const jenjang = siswa[0]?.jenjang || '-';
    const byRombel = new Map<string, { l: number; p: number }>();
    for (const s of siswa) {
      const rombel = s.rombel || 'Tanpa Rombel';
      if (!byRombel.has(rombel)) byRombel.set(rombel, { l: 0, p: 0 });
      const entry = byRombel.get(rombel)!;
      if (s.jk === 'L' || s.jk === 'Laki-laki') entry.l++;
      else entry.p++;
    }

    const details: RombelDetail[] = Array.from(byRombel.entries())
      .map(([name, counts]) => ({ name, l: counts.l, p: counts.p, total: counts.l + counts.p }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const total = details.reduce((sum, d) => sum + d.total, 0);
    result.push({ name: schoolName, jenjang, total, rombels: details.length, details });
  }

  const jenjangOrder: Record<string, number> = { SD: 0, TK: 1, KB: 2 };
  return result.sort((a, b) => {
    const ao = jenjangOrder[a.jenjang] ?? 99;
    const bo = jenjangOrder[b.jenjang] ?? 99;
    return ao !== bo ? ao - bo : a.name.localeCompare(b.name);
  });
}

export default function DataRombelPage() {
  const [data, setData] = useState<RombelEntry[]>(fallbackRombel);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterJenjang, setFilterJenjang] = useState<string>('ALL');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetch() {
      try {
        const res = await fetch('/api/siswa/list');
        if (!res.ok) { console.error('Gagal fetch siswa:', res.status, res.statusText); return; }
        const json = await res.json();
        if (json.siswa && json.siswa.length > 0) {
          const aggregated = aggregateRombel(json.siswa);
          if (aggregated.length > 0) setData(aggregated);
        }
      } catch (e) { console.error('Gagal memuat data rombel:', e); } finally { setLoading(false); }
    }
    fetch();
  }, []);

  const filtered = data.filter((item) => {
    if (filterJenjang !== 'ALL' && item.jenjang !== filterJenjang) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleExpand = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const totalSekolah = data.length;
  const totalRombel = data.reduce((a, s) => a + s.rombels, 0);
  const totalSiswa = data.reduce((a, s) => a + s.total, 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-50 bg-gradient-to-b from-[#1a5276] to-[#0d3b66]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <a
              href="/"
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Kembali</span>
            </a>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-yellow-400" />
              <h1 className="text-sm font-bold text-white uppercase tracking-wide">Data Rombel</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0d3b66]">Data Rombongan Belajar</h2>
          <p className="text-sm text-gray-500 mt-1">Kecamatan Lemahabang, Kabupaten Cirebon</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <School className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0d3b66]">{totalSekolah}</p>
                <p className="text-xs text-gray-500">Total Sekolah</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0d3b66]">{totalRombel}</p>
                <p className="text-xs text-gray-500">Total Rombel</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0d3b66]">{totalSiswa}</p>
                <p className="text-xs text-gray-500">Total Siswa</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {jenjangList.map((j) => {
            const meta = jenjangMeta[j];
            const Icon = meta.icon;
            const items = data.filter((s) => s.jenjang === j);
            const rombelCount = items.reduce((a, s) => a + s.rombels, 0);
            const siswaCount = items.reduce((a, s) => a + s.total, 0);
            return (
              <button
                key={j}
                onClick={() => setFilterJenjang(filterJenjang === j ? 'ALL' : j)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  filterJenjang === j
                    ? 'ring-2 ring-[#0d3b66] bg-white shadow-md'
                    : 'bg-white shadow-sm hover:shadow'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-bold text-[#0d3b66]">{j}</span>
                </div>
                <p className="text-lg font-bold text-[#0d3b66]">{items.length}</p>
                <p className="text-[11px] text-gray-500">{rombelCount} rombel, {siswaCount} siswa</p>
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b flex-wrap gap-2">
            <h3 className="font-semibold text-[#0d3b66]">Daftar Rombel per Sekolah</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari sekolah..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-48"
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-5 py-3 font-semibold text-gray-600 w-8" />
                  <th className="px-5 py-3 font-semibold text-gray-600">No</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 hidden sm:table-cell">Jenjang</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Nama Sekolah</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-center">Jml Rombel</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-center">Total Siswa</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(() => {
                  if (loading) return (
                    <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                      <Loader2 className="w-5 h-5 animate-spin inline mr-2" />Memuat data...
                    </td></tr>
                  );
                  if (filtered.length === 0) return (
                    <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">Tidak ada data</td></tr>
                  );
                  return filtered.map((item, i) => (
                    <Fragment key={item.name}>
                      <tr
                        className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                        onClick={() => toggleExpand(item.name)}
                      >
                        <td className="px-5 py-3 text-gray-400">
                          {expanded.has(item.name)
                            ? <ChevronDown className="w-4 h-4" />
                            : <ChevronRight className="w-4 h-4" />
                          }
                        </td>
                        <td className="px-5 py-3 text-gray-500">{i + 1}</td>
                        <td className="px-5 py-3 hidden sm:table-cell">
                          <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${
                            item.jenjang === 'SD' ? 'bg-blue-100 text-blue-700' :
                            item.jenjang === 'TK' ? 'bg-pink-100 text-pink-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {item.jenjang}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-medium text-[#0d3b66]">{item.name}</td>
                        <td className="px-5 py-3 text-center font-semibold">{item.rombels}</td>
                        <td className="px-5 py-3 text-center font-semibold">{item.total}</td>
                      </tr>
                      {expanded.has(item.name) && (
                        <tr>
                          <td colSpan={6} className="px-0 py-0">
                            <table className="w-full text-xs bg-gray-50/80">
                              <thead>
                                <tr className="text-gray-500 border-t">
                                  <th className="pl-14 pr-4 py-2 font-medium text-left">Nama Rombel</th>
                                  <th className="px-4 py-2 font-medium text-center">L</th>
                                  <th className="px-4 py-2 font-medium text-center">P</th>
                                  <th className="px-4 py-2 font-medium text-center">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {item.details.map((d) => (
                                  <tr key={d.name} className="border-t border-gray-200/50">
                                    <td className="pl-14 pr-4 py-2 font-medium text-[#0d3b66]">{d.name}</td>
                                    <td className="px-4 py-2 text-center text-gray-600">{d.l}</td>
                                    <td className="px-4 py-2 text-center text-gray-600">{d.p}</td>
                                    <td className="px-4 py-2 text-center font-semibold">{d.total}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ));
                })()}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t text-xs text-gray-500">
            {loading ? 'Memuat data...' : `Menampilkan ${filtered.length} dari ${data.length} sekolah`}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h3 className="font-semibold text-[#0d3b66] mb-2">Informasi</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Data Rombongan Belajar (Rombel) per sekolah di lingkungan Kecamatan Lemahabang,
            Kabupaten Cirebon. Data bersumber dari Dapodik Kemendikdasmen per Mei 2026.
            Klik pada baris sekolah untuk melihat detail rombel.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
