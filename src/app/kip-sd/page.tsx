'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, WalletMinimal, Loader2, School, Search } from 'lucide-react';
import { useSort } from '@/hooks/useSort';
import { SortableHeader } from '@/components/ui/SortableHeader';
import Footer from '@/components/portal/Footer';
import { normalizeSchool } from '@/lib/normalize';

interface SekolahSummary {
  sekolah: string;
  total: number;
  l: number;
  p: number;
}

interface SiswaItem {
  nama: string;
  jk: string;
  sekolah: string;
  jenjang: string;
  kelas: string;
  rombel: string;
  layak_pip: string;
}

export default function KipSdPage() {
  const [data, setData] = useState<SekolahSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [siswaSearch, setSiswaSearch] = useState('');
  const [allSiswa, setAllSiswa] = useState<SiswaItem[] | null>(null);

  const refreshInterval = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/siswa/list?jenjang=SD&layak_pip=Ya');
        if (res.ok) {
          const json = await res.json();
          const list: SiswaItem[] = json.siswa || [];
          setAllSiswa(list);
          processSiswa(list);
        } else {
          setData([]);
          setLoading(false);
        }
      } catch {
        setData([]);
        setLoading(false);
      }
    }
    load();

    refreshInterval.current = setInterval(() => {
      fetch('/api/siswa/list?jenjang=SD&layak_pip=Ya')
        .then(r => r.ok ? r.json() : null)
        .then(json => {
          if (json?.siswa) {
            setAllSiswa(json.siswa);
            processSiswa(json.siswa);
          }
        })
        .catch(() => {});
    }, 30000);

    return () => { if (refreshInterval.current) clearInterval(refreshInterval.current); };
  }, []);

  function processSiswa(siswa: SiswaItem[]) {
    const map = new Map<string, { l: number; p: number }>();
    for (const s of siswa) {
      const sklh = normalizeSchool(s.sekolah || '-');
      if (!sklh) continue;
      if (!map.has(sklh)) map.set(sklh, { l: 0, p: 0 });
      const d = map.get(sklh)!;
      if (s.jk === 'L') d.l++;
      else d.p++;
    }

    const result: SekolahSummary[] = [];
    for (const [sekolah, counts] of map) {
      result.push({ sekolah, total: counts.l + counts.p, ...counts });
    }
    setData(result.sort((a, b) => b.total - a.total || a.sekolah.localeCompare(b.sekolah)));
    setLoading(false);
  }

  const totalPenerima = data.reduce((a, s) => a + s.total, 0);
  const totalL = data.reduce((a, s) => a + s.l, 0);
  const totalP = data.reduce((a, s) => a + s.p, 0);

  const filteredData = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(s => s.sekolah.toLowerCase().includes(q));
  }, [data, search]);

  const { sorted, sortKey, sortDir, toggle } = useSort(filteredData, 'sekolah');

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
              <WalletMinimal className="w-5 h-5 text-yellow-400" />
              <h1 className="text-sm font-bold text-white uppercase tracking-wide">KIP SD</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0d3b66]">Kartu Indonesia Pintar SD</h2>
          <p className="text-sm text-gray-500 mt-1">Kecamatan Lemahabang, Kabupaten Cirebon</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <p className="text-2xl font-bold text-[#0d3b66]">{loading ? '-' : totalPenerima}</p>
            <p className="text-xs text-gray-500">Total Penerima PIP</p>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <p className="text-2xl font-bold text-[#0d3b66]">{loading ? '-' : totalL}</p>
            <p className="text-xs text-gray-500">Laki-laki</p>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <p className="text-2xl font-bold text-[#0d3b66]">{loading ? '-' : totalP}</p>
            <p className="text-xs text-gray-500">Perempuan</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari sekolah..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari nama siswa..." value={siswaSearch} onChange={e => setSiswaSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : (
          <>
            {!siswaSearch && (
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b bg-gray-50 flex items-center gap-2">
                  <School className="w-4 h-4 text-gray-500" />
                  <p className="text-sm font-semibold text-[#0d3b66]">Progres Penerima PIP per Sekolah</p>
                  <span className="ml-auto text-xs text-gray-500">{data.length} sekolah</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                    <tr className="bg-gray-50 text-left group">
                      <th className="px-5 py-3 font-semibold text-gray-600 w-12">No</th>
                      <SortableHeader label="Sekolah" sortKey="sekolah" currentKey={sortKey} direction={sortDir} onToggle={toggle} />
                      <SortableHeader label="L" sortKey="l" currentKey={sortKey} direction={sortDir} onToggle={toggle} className="text-center" />
                      <SortableHeader label="P" sortKey="p" currentKey={sortKey} direction={sortDir} onToggle={toggle} className="text-center" />
                      <SortableHeader label="Total" sortKey="total" currentKey={sortKey} direction={sortDir} onToggle={toggle} className="text-center" />
                    </tr>
                    </thead>
                    <tbody className="divide-y">
                      {sorted.length === 0 ? (
                        <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">Tidak ada data penerima PIP</td></tr>
                      ) : (
                        sorted.map((s, i) => (
                          <tr key={s.sekolah} className="hover:bg-blue-50/50 transition-colors">
                            <td className="px-5 py-3 text-gray-500">{i + 1}</td>
                            <td className="px-5 py-3 font-medium text-[#0d3b66]">{s.sekolah}</td>
                            <td className="px-5 py-3 text-center text-blue-700 font-semibold">{s.l}</td>
                            <td className="px-5 py-3 text-center text-pink-700 font-semibold">{s.p}</td>
                            <td className="px-5 py-3 text-center text-[#0d3b66] font-bold">{s.total}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {siswaSearch && (
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b">
                  <h3 className="font-semibold text-[#0d3b66]">Hasil Pencarian: &quot;{siswaSearch}&quot;</h3>
                </div>
                <div className="overflow-x-auto">
                  {!allSiswa ? (
                    <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
                  ) : siswaSearch.length < 2 ? (
                    <div className="px-5 py-8 text-center text-gray-400">Ketik minimal 2 huruf</div>
                  ) : (
                    (() => {
                      const q = siswaSearch.toLowerCase();
                      const matched = allSiswa.filter(p => p.nama?.toLowerCase().includes(q)).slice(0, 100);
                      return matched.length === 0 ? (
                        <div className="px-5 py-8 text-center text-gray-400">Tidak ditemukan</div>
                      ) : (
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-5 py-3 font-semibold text-gray-600 text-center w-10">No</th>
                              <th className="px-5 py-3 font-semibold text-gray-600">Nama</th>
                              <th className="px-5 py-3 font-semibold text-gray-600">Sekolah</th>
                              <th className="px-5 py-3 font-semibold text-gray-600">Kelas</th>
                              <th className="px-5 py-3 font-semibold text-gray-600">JK</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {matched.map((p, i) => (
                              <tr key={`${p.nama}-${i}`} className="hover:bg-blue-50/50 transition-colors">
                                <td className="px-5 py-2.5 text-gray-500 text-center">{i + 1}</td>
                                <td className="px-5 py-2.5 font-medium text-gray-900">{p.nama}</td>
                                <td className="px-5 py-2.5 text-gray-500">{p.sekolah}</td>
                                <td className="px-5 py-2.5 text-gray-500">{p.kelas || '-'}</td>
                                <td className="px-5 py-2.5 text-gray-500 text-center">{p.jk || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()
                  )}
                </div>
                {allSiswa && siswaSearch.length >= 2 && (
                  <div className="px-5 py-3 border-t text-xs text-gray-400">
                    Menampilkan {Math.min(100, allSiswa.filter(p => p.nama?.toLowerCase().includes(siswaSearch.toLowerCase())).length)} dari {allSiswa.filter(p => p.nama?.toLowerCase().includes(siswaSearch.toLowerCase())).length} hasil
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
