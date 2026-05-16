'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Users, School, Baby, BarChart3, Loader2 } from 'lucide-react';
import Footer from '@/components/portal/Footer';
import { rombelData, extractKelas } from '@/data/rombel';
import { allSekolah } from '@/data/sekolah';

interface SekolahKelas {
  name: string;
  jenjang: string;
  perKelas: Record<string, { l: number; p: number }>;
  totalL: number;
  totalP: number;
}

const jenjangList = ['SD', 'TK', 'KB'] as const;

const jenjangMeta: Record<string, { icon: typeof School; label: string; color: string }> = {
  SD: { icon: School, label: 'Sekolah Dasar', color: 'blue' },
  TK: { icon: Baby, label: 'Taman Kanak-kanak', color: 'pink' },
  KB: { icon: Baby, label: 'Kelompok Belajar', color: 'purple' },
};

const sdKelas = ['1', '2', '3', '4', '5', '6'];
const tkKelas = ['A', 'B'];

function normName(n: string) {
  return n.toLowerCase().replace(/[\s.\-]+/g, '');
}

/** Strip prefixes (SD/TK/KB/PAUD) and suffixes (KECAMATAN LEMAHABANG) for cross-source matching */
function matchKey(n: string): string {
  return n.toLowerCase()
    .replace(/^(sd|tk|kb|paud)\s+/i, '')
    .replace(/\s+kecamatan\s+lemahabang$/i, '')
    .replace(/[\s.\-]+/g, '');
}

function buildSekolahData(firestoreSd?: SekolahKelas[]) {
  const fbMap = new Map<string, SekolahKelas>();
  if (firestoreSd) {
    for (const s of firestoreSd) fbMap.set(normName(s.name), s);
  }

  const rombelMap = new Map<string, typeof rombelData[0]>();
  for (const r of rombelData) rombelMap.set(normName(r.name), r);

  function findFb(schoolName: string): SekolahKelas | undefined {
    const direct = fbMap.get(normName(schoolName));
    if (direct) return direct;
    const mk = matchKey(schoolName);
    for (const [, v] of fbMap) {
      if (matchKey(v.name) === mk) return v;
    }
    return undefined;
  }

  function findRombel(schoolName: string): typeof rombelData[0] | undefined {
    const direct = rombelMap.get(normName(schoolName));
    if (direct) return direct;
    const mk = matchKey(schoolName);
    for (const r of rombelData) {
      if (matchKey(r.name) === mk) return r;
    }
    return undefined;
  }

  const result: SekolahKelas[] = [];
  for (const school of allSekolah) {
    const fb = findFb(school.nama);
    const rombel = findRombel(school.nama);

    if (fb && school.jenjang === 'SD') {
      result.push({ ...fb, name: school.nama });
    } else if (fb && school.jenjang !== 'SD' && rombel) {
      const perKelas: Record<string, { l: number; p: number }> = {};
      let totalL = 0, totalP = 0;
      for (const d of rombel.details) {
        const k = extractKelas(d.name, rombel.jenjang);
        if (!perKelas[k]) perKelas[k] = { l: 0, p: 0 };
        perKelas[k].l += d.l;
        perKelas[k].p += d.p;
        totalL += d.l;
        totalP += d.p;
      }
      result.push({ name: school.nama, jenjang: school.jenjang, perKelas, totalL, totalP });
    } else if (fb) {
      result.push({ ...fb, name: school.nama });
    } else if (rombel) {
      const perKelas: Record<string, { l: number; p: number }> = {};
      let totalL = 0, totalP = 0;
      for (const d of rombel.details) {
        const k = extractKelas(d.name, rombel.jenjang);
        if (!perKelas[k]) perKelas[k] = { l: 0, p: 0 };
        perKelas[k].l += d.l;
        perKelas[k].p += d.p;
        totalL += d.l;
        totalP += d.p;
      }
      result.push({ name: school.nama, jenjang: school.jenjang, perKelas, totalL, totalP });
    } else {
      result.push({ name: school.nama, jenjang: school.jenjang, perKelas: {}, totalL: 0, totalP: 0 });
    }
  }
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

export default function DataPDPage() {
  const [search, setSearch] = useState('');
  const [filterJenjang, setFilterJenjang] = useState<string>('ALL');
  const [sekolahData, setSekolahData] = useState<SekolahKelas[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/siswa/per-kelas');
        const json = await res.json();
        if (json.data && json.source === 'firestore') {
          setSekolahData(buildSekolahData(json.data as SekolahKelas[]));
        } else {
          setSekolahData(buildSekolahData());
        }
      } catch (e) {
        console.error('Gagal memuat data PD:', e);
        setSekolahData(buildSekolahData());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalSekolah = sekolahData.length;
  const totalSiswa = sekolahData.reduce((a, s) => a + s.totalL + s.totalP, 0);
  const totalL = sekolahData.reduce((a, s) => a + s.totalL, 0);
  const totalP = sekolahData.reduce((a, s) => a + s.totalP, 0);

  const filtered = sekolahData.filter((item) => {
    if (filterJenjang !== 'ALL' && item.jenjang !== filterJenjang) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-50 bg-gradient-to-b from-[#1a5276] to-[#0d3b66]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <a href="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Kembali</span>
            </a>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-yellow-400" />
              <h1 className="text-sm font-bold text-white uppercase tracking-wide">Data PD</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0d3b66]">Data Peserta Didik</h2>
          <p className="text-sm text-gray-500 mt-1">Kecamatan Lemahabang, Kabupaten Cirebon</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><School className="w-5 h-5 text-blue-700" /></div>
                  <div><p className="text-2xl font-bold text-[#0d3b66]">{totalSekolah}</p><p className="text-xs text-gray-500">Sekolah</p></div>
                </div>
              </div>
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><Users className="w-5 h-5 text-emerald-700" /></div>
                  <div><p className="text-2xl font-bold text-[#0d3b66]">{totalSiswa}</p><p className="text-xs text-gray-500">Total Siswa</p></div>
                </div>
              </div>
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center"><BarChart3 className="w-5 h-5 text-sky-700" /></div>
                  <div><p className="text-2xl font-bold text-[#0d3b66]">{totalL}</p><p className="text-xs text-gray-500">Laki-laki</p></div>
                </div>
              </div>
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center"><BarChart3 className="w-5 h-5 text-rose-700" /></div>
                  <div><p className="text-2xl font-bold text-[#0d3b66]">{totalP}</p><p className="text-xs text-gray-500">Perempuan</p></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {jenjangList.map((j) => {
                const meta = jenjangMeta[j];
                const Icon = meta.icon;
                const count = sekolahData.filter((s) => s.jenjang === j).length;
                const siswa = sekolahData.filter((s) => s.jenjang === j).reduce((a, s) => a + s.totalL + s.totalP, 0);
                return (
                  <button key={j} onClick={() => setFilterJenjang(filterJenjang === j ? 'ALL' : j)}
                    className={`rounded-xl border p-4 text-left transition-all ${filterJenjang === j ? 'ring-2 ring-[#0d3b66] bg-white shadow-md' : 'bg-white shadow-sm hover:shadow'}`}>
                    <div className="flex items-center gap-2 mb-1"><Icon className="w-4 h-4 text-gray-500" /><span className="text-sm font-bold text-[#0d3b66]">{j}</span></div>
                    <p className="text-lg font-bold text-[#0d3b66]">{count}</p>
                    <p className="text-[11px] text-gray-500">{siswa} siswa</p>
                  </button>
                );
              })}
            </div>

            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Cari sekolah..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>

            {(filterJenjang === 'ALL' ? jenjangList : [filterJenjang]).map((j) => {
          const meta = jenjangMeta[j];
          const Icon = meta.icon;

          const semua = filtered.filter((s) => s.jenjang === j);
          if (semua.length === 0) return null;

          const groups = [{ label: meta.label, items: semua }];

          return groups.map((group, gi) => {
            const items = group.items;
            const kelasColumns = j === 'SD'
              ? sdKelas
              : j === 'TK'
                ? tkKelas
                : Array.from(new Set(items.flatMap((s) => Object.keys(s.perKelas)))).sort();
            return (
              <div key={`${j}-${gi}`} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b bg-gray-50/50">
                  <Icon className="w-5 h-5 text-gray-500" />
                  <h3 className="font-semibold text-[#0d3b66]">{group.label}</h3>
                  <span className="ml-auto text-xs text-gray-500">{items.length} sekolah</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left whitespace-nowrap">
                        <th rowSpan={2} className="px-3 py-2 font-semibold text-gray-600 sticky left-0 bg-gray-50 z-10">No</th>
                        <th rowSpan={2} className="px-3 py-2 font-semibold text-gray-600 sticky left-0 bg-gray-50 z-10">Nama Sekolah</th>
                        {kelasColumns.map((k) => (
                          <th key={k} colSpan={2} className="px-3 py-2 font-semibold text-gray-600 text-center min-w-[96px] border-b border-gray-200">Kelas {k}</th>
                        ))}
                        <th colSpan={3} className="px-3 py-2 font-semibold text-gray-600 text-center min-w-[160px] border-b border-gray-200">Total</th>
                      </tr>
                      <tr className="bg-gray-50 text-left whitespace-nowrap">
                        {kelasColumns.flatMap((k) => [
                          <th key={`${k}-l`} className="px-3 py-2 font-semibold text-gray-600 text-center min-w-[48px]">L</th>,
                          <th key={`${k}-p`} className="px-3 py-2 font-semibold text-gray-600 text-center min-w-[48px]">P</th>,
                        ])}
                        <th className="px-3 py-2 font-semibold text-gray-600 text-center min-w-[60px]">L</th>
                        <th className="px-3 py-2 font-semibold text-gray-600 text-center min-w-[60px]">P</th>
                        <th className="px-3 py-2 font-semibold text-gray-600 text-center min-w-[60px]">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {items.map((item, i) => (
                        <tr key={item.name} className="hover:bg-blue-50/50 transition-colors">
                          <td className="px-3 py-3 text-gray-500 sticky left-0 bg-white">{i + 1}</td>
                          <td className="px-3 py-3 font-medium text-[#0d3b66] sticky left-0 bg-white">{item.name}</td>
                          {kelasColumns.flatMap((k) => {
                            const d = item.perKelas[k];
                            return [
                              <td key={`${k}-l`} className="px-3 py-3 text-center text-gray-600">{d?.l ?? 0}</td>,
                              <td key={`${k}-p`} className="px-3 py-3 text-center text-gray-600">{d?.p ?? 0}</td>,
                            ];
                          })}
                          <td className="px-3 py-3 text-center font-semibold text-sky-700">{item.totalL}</td>
                          <td className="px-3 py-3 text-center font-semibold text-rose-700">{item.totalP}</td>
                          <td className="px-3 py-3 text-center font-semibold text-[#0d3b66]">{item.totalL + item.totalP}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-100/80 text-sm font-semibold">
                      <tr>
                        <td className="px-3 py-3 sticky left-0 bg-gray-100/80" />
                        <td className="px-3 py-3 text-[#0d3b66] sticky left-0 bg-gray-100/80">Jumlah</td>
                        {kelasColumns.flatMap((k) => {
                          const sumL = items.reduce((a, s) => a + (s.perKelas[k]?.l ?? 0), 0);
                          const sumP = items.reduce((a, s) => a + (s.perKelas[k]?.p ?? 0), 0);
                          return [
                            <td key={`${k}-l`} className="px-3 py-3 text-center text-sky-700">{sumL}</td>,
                            <td key={`${k}-p`} className="px-3 py-3 text-center text-rose-700">{sumP}</td>,
                          ];
                        })}
                        <td className="px-3 py-3 text-center text-sky-700">{items.reduce((a, s) => a + s.totalL, 0)}</td>
                        <td className="px-3 py-3 text-center text-rose-700">{items.reduce((a, s) => a + s.totalP, 0)}</td>
                        <td className="px-3 py-3 text-center text-[#0d3b66]">{items.reduce((a, s) => a + s.totalL + s.totalP, 0)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          });
          })}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
